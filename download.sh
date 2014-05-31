#!/bin/bash


### Set up output dirs

OUTPUT=output
LOGS=logs
mkdir -p $LOGS
mkdir -p $OUTPUT


### Dataset IDs

URL=https://data.cityofnewyork.us/api/views
FILE=rows.csv?accessType=DOWNLOAD

PARTIES=636b-3b5g
MASTER=bnx9-e6tj
REFERENCES=pwkr-dpni
LEGALS=8h5j-fqxa


### Download datasets from Socrata

wget -o $OUTPUT/parties.log    -O $LOGS/parties.csv    $URL/$PARTIES/$FILE &
wget -o $OUTPUT/master.log     -O $LOGS/master.csv     $URL/$MASTER/$FILE &
wget -o $OUTPUT/references.log -O $LOGS/references.csv $URL/$REFERENCES/$FILE &
wget -o $OUTPUT/legals.log     -O $LOGS/legals.csv     $URL/$LEGALS/$FILE &


### Wait for downloads to complete

while [ `jobs | wc -l | xargs` -ne "0" ]
do
    sleep 0.5
done


### Upload data to bigquery

bq load --skip_leading_rows 1 acris.parties2    $OUTPUT/parties.csv    schemas/parties.json &
bq load --skip_leading_rows 1 acris.master2     $OUTPUT/master.csv     schemas/master.json &
bq load --skip_leading_rows 1 acris.references2 $OUTPUT/references.csv schemas/references.json &
bq load --skip_leading_rows 1 acris.legals2     $OUTPUT/legals.csv     schemas/legals.json &

bq wait
