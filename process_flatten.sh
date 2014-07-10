#!/bin/bash -e

source utils/colors.sh

info "Flattening tables..."

# Run the flattening queries and save as their own tables.
for schema in personal real; do
    table=acris.${schema}_flat
    stmt=$(cat sql/${schema}_flatten.sql)

    #bq show $table > /dev/null && warn "$table already exists" ||
    bq --nosync query --allow_large_results --noappend_table --replace \
             --destination_table ${table} "${stmt}"
done

# Wait for flattening queries to complete

bq_wait "Finished flattening tables!"
