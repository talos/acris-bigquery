#!/bin/bash -e

### Upload data to bigquery

for schema in real personal code; do
    for path in $(ls output/$schema/*.csv.gz); do
        base=$(basename $path .csv.gz)
        output=acris.${schema}_${base}

        # the `bq show` prevents us from overwriting an existing set -- not
        # permanent, as eventually this will be desired.
        echo "Uploading $path to $output..."
        bq show $output > /dev/null && echo "Already uploaded $output" || \
            bq --nosync load --skip_leading_rows 1 --replace $output \
            $path schemas/$schema/$base.json
    done
done

pluto_output=acris.pluto
bq show $pluto_output > /dev/null && echo "Already uploaded $pluto_output" || \
    bq --nosync load --skip_leading_rows 1 --replace $pluto_output \
    output/pluto/pluto.csv.gz schemas/pluto/mappluto.json


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
