# This file is part of the Etsin service
#
# Copyright 2017-2018 Ministry of Education and Culture, Finland
#
# :author: CSC - IT Center for Science Ltd., Espoo Finland <servicedesk@csc.fi>
# :license: MIT

"""Functionalities for download data from Download API"""

from flask import Response, stream_with_context
import requests

from etsin_finder.app_config import get_download_api_config
from etsin_finder.finder import app
from etsin_finder.utils import json_or_empty, FlaskService

log = app.logger


class DownloadAPIService(FlaskService):
    """Download API Service"""

    def __init__(self, app):
        """
        Setup Download API Service.

        :param dl_api_config:
        """
        super().__init__(app)

        dl_api_config = get_download_api_config(app.testing)

        if dl_api_config:
            self.API_BASE_URL = 'https://{0}:{1}/secure/api/v1/dataset'.format(
                dl_api_config['HOST'], dl_api_config['PORT']) + '/{0}'
            self.USER = dl_api_config['USER']
            self.PASSWORD = dl_api_config['PASSWORD']
        elif not self.is_testing:
            log.error('Unable to initialize DownloadAPIService due to missing config')

    def download(self, cr_id, file_ids, dir_ids):
        """
        Download files from Download API.

        :param cr_id:
        :param file_ids:
        :param dir_ids:
        :return:
        """
        if self.is_testing:
            return self._get_error_response(200)

        url = self._create_url(cr_id, file_ids, dir_ids)
        try:
            dl_api_response = requests.get(url, stream=True, timeout=15, auth=(self.USER,
                                                                               self.PASSWORD.encode('utf-8')))
            dl_api_response.raise_for_status()
        except requests.Timeout as t:
            log.error('Request to Download API timed out\n{0}'.format(t))
            return self._get_error_response(dl_api_response.status_code)
        except requests.ConnectionError as c:
            log.error('Unable to connect to Download API\n{0}'.format(c))
            return self._get_error_response(dl_api_response.status_code)
        except requests.HTTPError:
            log.warning('Download API returned an unsuccessful status code: {0}\n\
                Response: {1}'.format(dl_api_response.status_code, dl_api_response))
            return self._get_error_response(dl_api_response.status_code)
        except Exception as e:
            log.error('Error in Download:\n{0}'.format(e))
            return self._get_error_response(dl_api_response.status_code)
        else:
            response = Response(response=stream_with_context(dl_api_response.iter_content(chunk_size=1024)),
                                status=dl_api_response.status_code)

            if 'Content-Type' in dl_api_response.headers:
                response.headers['Content-Type'] = dl_api_response.headers['Content-Type']
            if 'Content-Disposition' in dl_api_response.headers:
                response.headers['Content-Disposition'] = dl_api_response.headers['Content-Disposition']
            if 'Content-Length' in dl_api_response.headers:
                response.headers['Content-Length'] = dl_api_response.headers['Content-Length']

            log.debug('Download URL: {0} Responded with HTTP status {1}'.format(url, dl_api_response.status_code))
            return response

    @staticmethod
    def _get_error_response(status_code):
        response = Response(status=status_code)
        response.headers['Content-Type'] = 'application/octet-stream'
        response.headers['Content-Disposition'] = 'attachment; filename="error"'
        return response

    def _create_url(self, cr_id, file_ids, dir_ids):
        url = self.API_BASE_URL.format(cr_id)
        if file_ids or dir_ids:
            params = ''
            for file_id in file_ids:
                params += '&file={0}'.format(file_id) if params else 'file={0}'.format(file_id)
            for dir_id in dir_ids:
                params += '&dir={0}'.format(dir_id) if params else 'dir={0}'.format(dir_id)
            url += '?' + params

        log.debug('Download service URL to be requested: ' + url)
        return url


_dl_api = DownloadAPIService(app)


def download_data(cr_id, file_ids, dir_ids):
    """
    Public method for downloading data from Download API.

    :param cr_id:
    :param file_ids:
    :param dir_ids:
    :return:
    """
    return _dl_api.download(cr_id, file_ids, dir_ids)
