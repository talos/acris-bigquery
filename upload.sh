#!/bin/bash -e

source utils/colors.sh

### Upload data to bigquery

for schema in real personal code; do
    for path in $(ls output/$schema/*.csv.gz); do
        base=$(basename $path .csv.gz)
        output=acris.${schema}_${base}

        # the `bq show` prevents us from overwriting an existing set -- not
        # permanent, as eventually this will be desired.
        info "Uploading $path to $output..."
        #bq show $output > /dev/null && warn "Already uploaded $output" || \

        # bq --nosync load --skip_leading_rows 1 --replace $output \
        # $path schemas/$schema/$base.json

        info bq --nosync load --skip_leading_rows 1 --replace $output  $path schemas/$schema/$base.json
        bq --nosync load --max_bad_records 1 --skip_leading_rows 1 --replace $output  $path schemas/$schema/$base.json
    done
done

# PLUTO needs to be handled as a separate asset pipeline.
# pluto_output=acris.pluto
# bq show $pluto_output > /dev/null && warn "Already uploaded $pluto_output" || \
#     bq --nosync load --skip_leading_rows 1 --replace $pluto_output \
#     output/pluto/pluto.csv.gz schemas/pluto/mappluto.json


# Wait for uploads to complete
while :
do
    jobs=$(bq ls -j | grep '\(PENDING\|RUNNING\)' | wc -l | xargs)
    if [ $jobs -eq "0" ]; then
        success "Finished uploading!"
        break
    else
        info "Waiting for $jobs uploads to complete..."
        sleep 5
    fi
done
