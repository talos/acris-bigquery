import sys
import json


def last_modified(data_json):
    """
    Because for some reason Socrata's list of ACRIS data includes only the
    codes, not any of the actual data, we look at the codes to see when ACRIS
    data was last modified.
    """
    is_dcc_identifier = lambda d: d['identifier'] == '7isb-wh4c'
    print(next((d for d in data_json if is_dcc_identifier(d)))['modified'])


if __name__ == '__main__':
    doc = """
Call as follows:

    python last_modified.py <path/to/data.json>

Will return the text string of form YYYY-MM-DD of when ACRIS data was last
modified.
    """

    if len(sys.argv) == 2:
        last_modified(json.load(open(sys.argv[1], 'r')))
    else:
        print(doc)
        sys.exit(1)
