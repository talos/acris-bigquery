#!/bin/bash -e

### Upload data to bigquery

for schema in real personal code; do
    for path in $(ls output/$schema/*.csv.gz); do
        base=$(basename $path .csv.gz)
        output=acris.${schema}_${base}

        echo "Uploading $path to $output..."
        bq --nosync load --skip_leading_rows 1 --replace $output \
            $path schemas/$schema/$base.json
    done
done

echo "Waiting for bq..."
bq wait

