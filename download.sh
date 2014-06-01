#!/bin/bash


### Set up output dirs

OUTPUT=output
LOGS=logs
mkdir -p $LOGS
mkdir -p $OUTPUT


### Download datasets from Socrata

# Docs found at https://data.cityofnewyork.us/api/assets/C74AE896-1AF3-4A87-B67C-9D4D15D562D3?download=true

# Array of table names, this is the order of the IDs below
declare -a TABLES=(master legals parties references remarks)

# Array of IDs for Real Property tables on Socrata, in order of $TABLES
declare -a REAL=(bnx9-e6tj 8h5j-fqxa 636b-3b5g pwkr-dpni 9p4w-7npp)

# Array of IDs for Personal Property tables on Socrata, in order of $TABLES
declare -a PERSONAL=(sv7x-dduq uqqa-hym2 nbbg-wtuz 6y3e-jcrc fuzi-5ks9)

# $1: real/personal/code, $2: tablename, $3: tableid
function download {
    mkdir -p $LOGS/$1 && mkdir -p $OUTPUT/$1
    if [ ! -e $OUTPUT/$1/$2.csv ]; then
        echo "Downloading $1/$2.csv ($3)"
        # Download via wget, filter '10/30/1974' style dates to '1974-10-30'
        # via sed
        wget -o $LOGS/$1/$2.log -O - \
             https://data.cityofnewyork.us/api/views/$3/rows.csv?accessType=DOWNLOAD \
             | sed -r 's:,([0-9]{2})/([0-9]{2})/([0-9]{4}):,\3-\1-\2:g' > $OUTPUT/$1/$2.csv &
    else
        echo "Already downloaded $1/$2, skipping..."
    fi
}

# iterate through all table types and download
#for i in {0..4}; do
#    name=${TABLES[$i]}
#    download real $name ${REAL[$i]}
#    download personal $name ${PERSONAL[$i]}
#done

# download codes
download code document_control 7isb-wh4c
download code ucc_collateral q9kp-jvxv # This is switched with `country` on Socrata
download code property_types 94g4-w6xz
download code states 5c9e-33xj
download code country j2iz-mwzu # This is switched with `ucc_collateral` on Socrata

# Wait for downloads to complete
while :
do
    jobs=$(jobs | wc -l | xargs)
    if [ $jobs -eq "0" ]; then
        echo "Finished downloading!"
        break
    else
        sleep 5
        echo "Waiting for $jobs downloads to complete..."
    fi
done
