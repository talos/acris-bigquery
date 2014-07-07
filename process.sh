#!/bin/bash -e

### Process just-uploaded data on bq

# Run queries which will create `latest` tables.  These are duplicates of all
# tables, except that they exclude rows with duplicate `document_ids` if those
# have been superseded with a more recent `good_through_date`

for schema in personal real; do
    for name in master legals parties references remarks; do
        table=${schema}_${name}
        stmt=$(cat sql/latest.sql | sed "s/TABLE/${table}/g")
        schematable=acris.latest_${table}

        bq show $schematable > /dev/null && echo "$schematable already exists" ||
            bq --nosync query --allow_large_results --noappend_table \
                --replace --destination_table acris.latest_${table} "${stmt}"
    done
done

# Wait for uploads to complete
while :
do
    jobs=$(bq ls -j | grep '\(PENDING\|RUNNING\)' | wc -l | xargs)
    if [ $jobs -eq "0" ]; then
        echo "Finished uploading!"
        break
    else
        echo "Waiting for $jobs uploads to complete..."
        sleep 5
    fi
done

# Run the flattening queries and save as their own tables.
for schema in personal real; do
    table=acris.${schema}_flat
    bq show $table > /dev/null && echo "$table already exists" ||
        bq --nosync query --allow_large_results --noappend_table --replace \
           --destination_table ${table} "$(cat sql/${schema}_flatten.sql)"
done
