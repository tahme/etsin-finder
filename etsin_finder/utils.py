# This file is part of the Etsin service
#
# Copyright 2017-2018 Ministry of Education and Culture, Finland
#
# :author: CSC - IT Center for Science Ltd., Espoo Finland <servicedesk@csc.fi>
# :license: MIT

"""Various utils and constants"""

import json
import os
from datetime import datetime
import pytz
from dateutil import parser


ACCESS_TYPES = {
    'open': 'http://uri.suomi.fi/codelist/fairdata/access_type/code/open',
    'login': 'http://uri.suomi.fi/codelist/fairdata/access_type/code/login',
    'permit': 'http://uri.suomi.fi/codelist/fairdata/access_type/code/permit',
    'embargo': 'http://uri.suomi.fi/codelist/fairdata/access_type/code/embargo',
    'restricted': 'http://uri.suomi.fi/codelist/fairdata/access_type/code/restricted'
}

SAML_ATTRIBUTES = {
    'first_name': 'urn:oid:2.5.4.42',
    'last_name': 'urn:oid:2.5.4.4',
    'email': 'urn:oid:0.9.2342.19200300.100.1.3',
    'haka_id': 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6',
    'haka_org_id': 'urn:oid:1.3.6.1.4.1.25178.1.2.9',
    'haka_org_name': 'urn:oid:1.3.6.1.4.1.16161.4.0.88',
    'CSC_username': 'urn:oid:1.3.6.1.4.1.16161.4.0.53',
    'idm_groups': 'urn:oid:1.3.6.1.4.1.8057.2.80.26'
}

DATA_CATALOG_IDENTIFIERS = {
    'ida': 'urn:nbn:fi:att:data-catalog-ida',
    'att': 'urn:nbn:fi:att:data-catalog-att'
}

def get_log_config(log_file_path, log_lvl):
    """
    Function to get the logging configuration from utils.py

    Arguments:
        log_file_path {string} -- The log file path.
        log_lvl {string} -- The logging level

    Returns:
        [dict] -- Dict containgin the logging configuration.

    """
    if (log_file_path and log_lvl):
        CONFIG = {
            'version': 1,
            'formatters': {
                'standard': {
                    'format': '--------------\n[%(asctime)s] [%(process)d] %(levelname)s in %(filename)s:%(lineno)d: %(message)s',
                    'datefmt': '%Y-%m-%d %H:%M:%S %z',
                }
            },
            'handlers': {
                'file': {
                    'class': 'logging.handlers.RotatingFileHandler',
                    'formatter': 'standard',
                    'filename': log_file_path,
                    'maxBytes': 10000000,
                    'mode': 'a',
                    'backupCount': 30
                },
                'console': {
                    'class': 'logging.StreamHandler',
                    'formatter': 'standard',
                    'stream': 'ext://sys.stdout'
                }
            },
            'root': {
                'level': log_lvl,
                'handlers': ['file', 'console']
            }
        }
        return CONFIG
    return False


def executing_travis():
    """Returns True whenever code is being executed by travis"""
    return True if os.getenv('TRAVIS', False) else False


def write_json_to_file(json_data, filename):
    """
    Write JSON data to file.

    :param json_data:
    :param filename:
    """
    with open(filename, "w") as output_file:
        json.dump(json_data, output_file)


def json_or_empty(response):
    """
    Return response JSON as python dict or empty dict.

    :param response:
    :return:
    """
    response_json = {}
    try:
        response_json = response.json()
    except Exception:
        pass
    return response_json


def remove_keys_recursively(obj, fields_to_remove):
    """
    Remove specified keys recursively from a python object (dict or list)

    :param obj:
    :param fields_to_remove:
    :return:
    """
    if isinstance(obj, dict):
        obj = {
            key: remove_keys_recursively(value, fields_to_remove) for key, value in obj.items()
            if key not in fields_to_remove
        }
    elif isinstance(obj, list):
        obj = [remove_keys_recursively(item, fields_to_remove) for item in obj if item not in fields_to_remove]

    return obj


def leave_keys_in_dict(dict_obj, fields_to_leave):
    """
    Removes the key-values from dict_obj, for which key is NOT listed in fields_to_leave.

    NOTE: Is not recursive

    :param dict_obj:
    :param fields_to_leave:
    :return:
    """
    for key in list(dict_obj):
        if key not in fields_to_leave:
            del dict_obj[key]


def _parse_timestamp_string_to_tz_aware_datetime(timestamp_str):
    if not isinstance(timestamp_str, str):
        raise ValueError("Timestamp must be a string")

    try:
        dt = parser.parse(timestamp_str)
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
            dt = pytz.timezone('Europe/Helsinki').localize(dt)
        return dt
    except Exception:
        raise ValueError("Unable to parse timestamp: {0}".format(timestamp_str))


def tz_now_is_later_than_timestamp_str(timestamp_str):
    """
    Is timestamp_str later in time than current time.

    :param timestamp_str:
    :return:
    """
    datetime_obj = _parse_timestamp_string_to_tz_aware_datetime(timestamp_str)
    return datetime.now(tz=pytz.timezone('Europe/Helsinki')) >= datetime_obj

def datetime_to_header(datetime_str):
    """
    Modifie ISO 8601 datetime format to HTTP datetime (RFC2616).

    The function does also work with some other formats and without
    tz, but it is not recommended.

    Arguments:
        datetime_str [string] -- Datetime string represented in the ISO 8601 format (ex. 2020-01-23T14:12:44+00:00)
    Returns:
        [string] -- Datetime string in HTTP datetime format (ex. Wed, 21 Oct 2015 07:28:00 GMT)

    """
    try:
        assert isinstance(datetime_str, str), 'datetime_str must be of type string.'
        datetime_obj_local = parser.parse(datetime_str)
        datetime_obj_GMT = datetime_obj_local.astimezone(pytz.utc)
        HTTP_datetime = datetime_obj_GMT.strftime('%a, %d %b %Y %H:%M:%S GMT')
        return HTTP_datetime
    except Exception:
        return False


def sort_array_of_obj_by_key(obj_array, obj_key, obj_nested_key=False):
    """
    Sort the objects in an array by using the value of an object key, or if needed, the value of a nested object key contained inside an object pointed to by an object key

    :param obj_array: Object array to be sorted
    :obj_key: Object key based on which to sort the object array, or a pointer key to a nested object where the sorting key is located
    :obj_nested_key: Object key based on which to sort the object array, if it is contained below the main level of the sortable object
    """
    try:
        if obj_array and obj_key:
            obj_array.sort(key=lambda x: x.get(obj_key, {}).get(obj_nested_key) if obj_nested_key else x.get(obj_key))
    except Exception:
        pass


def slice_array_on_limit(array, limit):
    """
    If array contains more items than the limit, return an array containing items up until the limit

    :param array:
    :limit: integer
    """
    if array and len(array) > limit:
        return array[0:limit]
    return array


class FlaskService:
    """Use as base class for external dependency services"""

    def __init__(self, app):
        """Init FlaskService"""
        if app.testing or executing_travis():
            self.is_testing = True
        else:
            self.is_testing = False
