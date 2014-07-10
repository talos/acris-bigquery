#!/bin/bash -e

source utils/colors.sh

### Process just-uploaded data on bq

# Run queries which will create `latest` tables.  These are duplicates of all
# tables, except that they exclude rows with duplicate `document_ids` if those
# have been superseded with a more recent `good_through_date`

info "Creating latest tables..."

for schema in personal real; do
    for name in master legals parties references remarks; do
        table=${schema}_${name}
        stmt=$(cat sql/latest.sql | sed "s/TABLE/${table}/g")
        schematable=acris.latest_${table}

        #bq show $schematable > /dev/null && warn "$schematable already exists" ||
        retry bq --nosync query --allow_large_results --noappend_table \
                 --replace --destination_table acris.latest_${table} "${stmt}"
    done
done

bq_wait "Finished creating 'latest' tables!"
