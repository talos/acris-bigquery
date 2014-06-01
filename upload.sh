#!/bin/bash

### Upload data to bigquery

for schema in real personal code; do
    for name in $(ls output/$schema); do
        input=output/$schema/$name
        base=$(basename $name .csv)
        output=acris.${schema}_${base}
        if [ -e $input ]; then
            echo "Uploading $input to $output..."
            bq --nosync load --skip_leading_rows 1 --replace $output \
                $input schemas/$schema/$base.json
        else
            echo "Cannot upload $input, does not exist."
        fi
    done
done

echo "Waiting for bq..."
bq wait

