#!/bin/bash -e

### Process just-uploaded data on bq

# Run queries which will create `latest` tables.  These are duplicates of all
# tables, except that they exclude rows with duplicate `document_ids` if those
# have been superseded with a more recent `good_through_date`

for schema in personal real; do
    for name in master legals parties references remarks; do
        table=${schema}_${name}
        stmt=$(cat sql/latest.sql | sed "s/TABLE/${table}/g")
        bq --nosync query --allow_large_results --noappend_table \
            --replace --destination_table acris.latest_${table} "${stmt}"
    done
done

# Run the flattening queries and save as their own tables.
#bq query 'select * from acris.real_master m \
#    left join each acris.real_legals l on l.document_id=m.document_id \
#    left join each acris.real_parties p on m.document_id=p.document_id \
#    left join each acris.real_references x on m.document_id=x.document_id \
#    left join each acris.real_remarks r on m.document_id=r.document_id
#
#

