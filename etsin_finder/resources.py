# This file is part of the Etsin service
#
# Copyright 2017-2018 Ministry of Education and Culture, Finland
#
# :author: CSC - IT Center for Science Ltd., Espoo Finland <servicedesk@csc.fi>
# :license: MIT

"""RESTful API endpoints, meant to be used by the frontend"""

from functools import wraps
import logging
from flask import request, session
from flask_mail import Message
from flask_restful import abort, reqparse, Resource

from etsin_finder.app_config import get_app_config
from etsin_finder import authentication
from etsin_finder import authorization
from etsin_finder import cr_service
from etsin_finder.download_service import download_data
from etsin_finder.email_utils import \
    create_email_message_body, \
    get_email_info, \
    get_email_message_subject, \
    get_email_recipient_addresses, \
    get_harvest_info, \
    validate_send_message_request
from etsin_finder.finder import app
from etsin_finder.utils import \
    sort_array_of_obj_by_key, \
    slice_array_on_limit
from etsin_finder import rems_service
from etsin_finder.rems_service import RemsAPIService
from etsin_finder.app_config import get_fairdata_rems_api_config

TOTAL_ITEM_LIMIT = 1000
log = app.logger

def log_request(f):
    """
    Log request when used as decorator.

    :param f:
    :return:
    """
    @wraps(f)
    def func(*args, **kwargs):
        """
        Log requests.

        :param args:
        :param kwargs:
        :return:
        """
        csc_name = authentication.get_user_csc_name() if not app.testing else ''
        log.info('[{0}.{1}] {2} {3} {4} USER AGENT: {5}'.format(
            args[0].__class__.__name__,
            f.__name__,
            csc_name if csc_name else 'UNAUTHENTICATED',
            request.environ['REQUEST_METHOD'],
            request.path,
            request.user_agent))
        return f(*args, **kwargs)
    return func

class Dataset(Resource):
    """Dataset related REST endpoints for frontend"""

    @log_request
    def get(self, cr_id):
        """
        Get dataset from metax and strip it from having sensitive information

        :param cr_id: id to use to fetch the record from metax
        :return:
        """
        is_authd = authentication.is_authenticated()
        cr = cr_service.get_catalog_record(cr_id, True, True)
        if not cr:
            abort(400, message="Unable to get catalog record from Metax")

        # Sort data items
        sort_array_of_obj_by_key(cr.get('research_dataset', {}).get('remote_resources', []), 'title')
        sort_array_of_obj_by_key(cr.get('research_dataset', {}).get('directories', []), 'details', 'directory_name')
        sort_array_of_obj_by_key(cr.get('research_dataset', {}).get('files', []), 'details', 'file_name')

        ret_obj = {'catalog_record': authorization.strip_information_from_catalog_record(cr, is_authd),
                   'email_info': get_email_info(cr)}
        if cr_service.is_rems_catalog_record(cr) and is_authd and get_fairdata_rems_api_config(app.testing) is not None:
            state = rems_service.get_application_state_for_resource(cr, authentication.get_user_id())
            ret_obj['application_state'] = state
            ret_obj['has_permit'] = state == 'approved'

        return ret_obj, 200


class Files(Resource):
    """File/directory related REST endpoints for frontend"""

    def __init__(self):
        """Setup file endpoints"""
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('dir_id', required=True, type=str)
        self.parser.add_argument('file_fields', required=False, type=str)
        self.parser.add_argument('directory_fields', required=False, type=str)

    @log_request
    def get(self, cr_id):
        """
        Get files and directory objects for frontend.

        :param cr_id:
        :return:
        """
        args = self.parser.parse_args()
        dir_id = args['dir_id']
        file_fields = args.get('file_fields', None)
        directory_fields = args.get('directory_fields', None)

        cr = cr_service.get_catalog_record(cr_id, False, False)
        dir_api_obj = cr_service.get_directory_data_for_catalog_record(cr_id, dir_id, file_fields, directory_fields)

        if cr and dir_api_obj:
            # Sort the items
            sort_array_of_obj_by_key(dir_api_obj.get('directories', []), 'directory_name')
            sort_array_of_obj_by_key(dir_api_obj.get('files', []), 'file_name')

            # Limit the amount of items to be sent to the frontend
            if 'directories' in dir_api_obj:
                dir_api_obj['directories'] = slice_array_on_limit(dir_api_obj['directories'], TOTAL_ITEM_LIMIT)
            if 'files' in dir_api_obj:
                dir_api_obj['files'] = slice_array_on_limit(dir_api_obj['files'], TOTAL_ITEM_LIMIT)

            # Strip the items of sensitive data
            authorization.strip_dir_api_object(dir_api_obj, authentication.is_authenticated(), cr)
            return dir_api_obj, 200
        return '', 404

class Contact(Resource):
    """Contact form related REST endpoints for frontend"""

    def __init__(self):
        """Setup endpoints"""
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('user_email', required=True, help='user_email cannot be empty')
        self.parser.add_argument('user_subject', required=True, help='user_subject cannot be empty')
        self.parser.add_argument('user_body', required=True, help='user_body cannot be empty')
        self.parser.add_argument('agent_type', required=True, help='agent_type cannot be empty')

    @log_request
    def post(self, cr_id):
        """
        Send email.

        This route expects a json with three key-values: user_email, user_subject and user_body.
        Having these three this method will send an email message to recipients
        defined in the catalog record in question

        :param cr_id: id to use to fetch the record from metax
        :return: 200 if success
        """
        # if not request.is_json or not request.json:
        #     abort(400, message="Request is not json")

        # Check request query parameters are present
        args = self.parser.parse_args()
        # Extract user's email address to be used as reply-to address
        user_email = args['user_email']
        # Extract user's message subject to be used as part of the email body to be sent
        user_subject = args['user_subject']
        # Extract user's message body to be used as part of the email body to be sent
        user_body = args['user_body']
        # Extract recipient role
        recipient_agent_role = args['agent_type']

        # Validate incoming request values are all there and are valid
        if not validate_send_message_request(user_email, user_body, recipient_agent_role):
            message = "Request parameters are not valid"
            log.warning(message)
            abort(400, message=message)

        # Get the full catalog record from Metax
        cr = cr_service.get_catalog_record(cr_id, False, False)

        # Ensure dataset is not harvested
        harvested = get_harvest_info(cr)
        if harvested:
            message = "Contact form is not available for harvested datasets"
            log.warning(message)
            abort(400, message=message)

        # Get the email recipients
        recipients = get_email_recipient_addresses(cr, recipient_agent_role)
        if not recipients:
            message = "No recipients could be inferred from the dataset"
            log.error(message)
            abort(500, message=message)

        app_config = get_app_config(app.testing)
        sender = app_config.get('MAIL_DEFAULT_SENDER', 'etsin-no-reply@fairdata.fi')
        subject = get_email_message_subject()
        body = create_email_message_body(cr_service.get_catalog_record_preferred_identifier(cr),
                                         user_email, user_subject, user_body)

        # Create the message
        msg = Message(sender=sender, reply_to=user_email, recipients=recipients, subject=subject, body=body)

        # Send the message
        with app.mail.record_messages() as outbox:
            try:
                app.mail.send(msg)
                if len(outbox) != 1:
                    raise Exception
            except Exception as e:
                message = "Sending email failed"
                app.logger.error("{0}\n{1}\n{2}".format(message, msg, e))
                abort(500, message=message)
        log.debug("Sending email OK\n{0}".format(msg))
        return '', 204


class User(Resource):
    """Saml attributes: https://wiki.eduuni.fi/pages/viewpage.action?spaceKey=cscfairdata&title=Proxy+Attributes"""

    @log_request
    def get(self):
        """
        Get (logged-in) user info.

        :return:
        """
        user_info = {
            'is_authenticated': authentication.is_authenticated(),
            'is_authenticated_CSC_user': authentication.is_authenticated_CSC_user(),
            'home_organization_id': authentication.get_user_home_organization_id(),
            'home_organization_name': authentication.get_user_home_organization_name()}
        csc_user = authentication.get_user_csc_name()
        groups = authentication.get_user_ida_groups()
        user_info['user_ida_groups'] = groups
        if csc_user is not None:
            user_info['user_csc_name'] = csc_user
        return user_info, 200


class REMSApplyForPermission(Resource):
    """REMS Apply for permission"""

    @log_request
    def get(self, cr_id):
        """Apply for permission to REMS resource.

        Arguments:
            Resource [class] -- Flask_restfull parent class
            cr_id [string] -- Catalog record identifier

        Returns:
            [int] -- The id of the application

        """
        # Create user
        user_id = authentication.get_user_id()
        firstname = authentication.get_user_firstname()
        lastname = authentication.get_user_lastname()
        email = authentication.get_user_email()

        if not user_id and not firstname and not lastname and not email:
            return 'Unauthorized request', 401
        _rems_api = RemsAPIService(app, user_id)
        userdata = {
            'userid': user_id,
            'name': "{0} {1}".format(firstname, lastname),
            'email': email
        }
        res_create_user = _rems_api.create_user(userdata)
        log.debug('res_create_user: {0}'.format(res_create_user))

        if not res_create_user or not res_create_user.get('success', None):
            log.error('Could not create user, res: {}'.format(res_create_user))
            return 'Could not create user', 500

        # Get catalog item id
        cr = cr_service.get_catalog_record(cr_id, False, False)
        if cr and cr_service.is_rems_catalog_record(cr):
            pref_id = cr_service.get_catalog_record_preferred_identifier(cr)
            rems_identifier = cr_service.get_catalog_record_REMS_identifier(cr)

        log.info('Get catalog item id for resource: {0}'.format(pref_id))
        log.info('rems_identifier: {0}'.format(rems_identifier))
        if not rems_identifier:
            log.warning('No rems_identifier found for resource: {0}'.format(pref_id))
            return 'No rems_identifier found for resource', 500
        res_get_catalogue_item = _rems_api.get_catalogue_item_for_resource(rems_identifier)
        log.debug('res_get_catalogue_item: {0}'.format(res_get_catalogue_item))

        if not res_get_catalogue_item:
            if res_get_catalogue_item == []:
                log.warning('No catalogue item found for resource: {0}'.format(pref_id))
                return 'No catalogue item found for resource', 500
            else:
                log.warning('Unable to get catalogue item id for resource: {0}'.format(pref_id))
                return 'Could not get catalogue item id', 500
        catalog_item_id = res_get_catalogue_item[0].get('id', None)

        if not catalog_item_id:
            log.error('Error in getting catalogue item id for resource: {0}'.format(pref_id))
            return 'Failed to get catalogue item id', 500

        # Check if User has any applications for the resource
        application_id = session.get('REMS_application_id', None)
        if application_id:
            log.info('Application with id: {0} found from session.'.format(application_id))
            return application_id, 200
        else:
            # Create Application
            log.info('No application id in session, creating new application for resource: {0}'.format(pref_id))
            res_create_application = _rems_api.create_application(catalog_item_id)
            if not res_create_application.get('success', None):
                if res_create_application.get('errers', None) is None:
                    log.error('Error in creating application for resource: {0}'.format(pref_id))
                    return 'Failed to create application', 500
                else:
                    log.warning('Failed to create application for resource {0}, errors: {1}'.format(pref_id, res_create_application.get('errers')))
                    return 'Failed to create application', 500

            application_id = res_create_application.get('application-id', None)
            if application_id is None:
                log.error('Failed to get application_id')
                return 'Failed to get application_id', 500
            log.info('Created application for user with application-id: {0}'.format(application_id))

            return application_id, 200


class Session(Resource):
    """Session related endpoints"""

    @log_request
    def get(self):
        """
        Renew Flask session, used by frontend.

        :return:
        """
        if authentication.is_authenticated():
            session.modified = True
            return '', 200
        return '', 401

    @log_request
    def delete(self):
        """
        Delete Flask session, used by frontend.

        :return:
        """
        authentication.reset_flask_session_on_logout()
        return not authentication.is_authenticated(), 200


class Download(Resource):
    """Class for file download functionalities"""

    def __init__(self):
        """Setup Download endpoint"""
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('cr_id', type=str, required=True)
        self.parser.add_argument('file_id', type=str, action='append', required=False)
        self.parser.add_argument('dir_id', type=str, action='append', required=False)

    @log_request
    def get(self):
        """
        Download data REST endpoint for frontend.

        :return:
        """
        # Check request query parameters are present
        args = self.parser.parse_args()
        cr_id = args['cr_id']

        cr = cr_service.get_catalog_record(cr_id, False, False)
        if not cr:
            abort(400, message="Unable to get catalog record")

        if authorization.user_is_allowed_to_download_from_ida(cr, authentication.is_authenticated()):
            file_ids = args['file_id'] or []
            dir_ids = args['dir_id'] or []
            return download_data(cr_id, file_ids, dir_ids)
        else:
            abort(403, message="Not authorized")
