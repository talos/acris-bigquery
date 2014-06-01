#!/bin/bash

### Upload data to bigquery

for reality in real personal; do
    for name in $(ls output/$reality); do
        input=output/$reality/$name
        base=$(basename $name .csv)
        output=acris.${reality}_${base}
        if [ -e $input ]; then
            echo "Uploading $input to $output..."
            bq --sync load --skip_leading_rows 1 --replace $output \
                $input schemas/$reality/$base.json
        else
            echo "Cannot upload $input, does not exist."
        fi
    done
done

echo "Waiting for bq..."
bq wait

