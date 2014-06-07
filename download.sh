#!/bin/bash


### Set up output dirs

mkdir -p logs
mkdir -p output


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
    mkdir -p logs/$1 && mkdir -p output/$1
    if [ -e output/$1/$2.csv.gz ]; then
        echo "Already downloaded $1/$2, skipping..."
    elif [ -e output/$1/$2.csv ]; then
        echo "Currently downloading $1/$2, skipping..."
    else
        echo "Downloading $1/$2.csv ($3)"
        # Download via wget.
        #
        # Use sed to filter '10/30/1974' style dates to '1974-10-30 00:00:00'
        # via sed.  Filtering allows import as timestamp.
        #
        # Use grep to:
        #
        # * Exclude entries with the date `0200-02-29`, which happens in
        #   real_master
        #
        # * Allow only records that don't have a double quote in them -- these
        #   are also bad
        #
        # * Allow only records that start with a number or uppercase
        #   letter through; a quoted beginning means corrupt data (this
        #   happens in personal_references.)
        wget -o logs/$1/$2.log -O - \
             https://data.cityofnewyork.us/api/views/$3/rows.csv?accessType=DOWNLOAD \
             | sed -r 's_,([0-9]{2})/([0-9]{2})/([0-9]{4})_,\3-\1-\2 00:00:00_g' \
             | grep -v '0200-02-29' \
             | grep -v '""' \
             | grep '^[0-9A-Z]' > output/$1/$2.csv &
    fi
}

# iterate through all table types and download
for i in {0..4}; do
    name=${TABLES[$i]}
    download real $name ${REAL[$i]}
    download personal $name ${PERSONAL[$i]}
done

# download codes
download code document_control 7isb-wh4c
download code ucc_collateral q9kp-jvxv # This is switched with `country` on Socrata
download code property_types 94g4-w6xz
download code states 5c9e-33xj
download code country j2iz-mwzu # This is switched with `ucc_collateral` on Socrata


### Download MapPLUTO data
mkdir -p logs/pluto output/pluto/shpsources
for release in 02b 03c 04c 05d 06c 07c 09v1 09v2 10v1 10v2 11v1 11v2 12v1 12v2 13v1 13v2; do
    if [ -e output/pluto/shpsources/$release ]; then
        echo "Already downloaded MapPLUTO $release"
    else
        echo "Downloading MapPLUTO $release"
        wget -o logs/pluto/shpsources/$release.log -O output/pluto/$release.zip \
            "http://www.nyc.gov/html/dcp/download/bytes/mappluto_$release.zip" &
    fi
done

# Wait for downloads to complete
echo "Waiting for downloads to complete."
wait


### Unzip MAPPluto data
for archive in output/pluto/*.zip; do
    base=$(basename $archive .zip)
    mkdir -p output/pluto/shpsources/$base
    if [ ! -e output/pluto/shpsources/$base ]; then
        unzip -d output/pluto/shpsources/$base $archive
        rm -f $archive
    fi
done

### Convert MAPPluto data to CSV
mkdir -p output/pluto/csvsources
for f in $(ls output/pluto/shpsources/**/MapPLUTO*/*/*{PLUTO,pluto}.shp); do
    version=$(basename $(dirname $(dirname $f)))
    borough=$(basename $f .shp)
    outfile=output/pluto/csvsources/${version}_${borough}.csv
    if [ -e $outfile ]; then
        echo "Skipping $f, $outfile exists already..."
    else
        echo "Converting $f to ${version}_${borough}.csv via ogr2ogr..."
        ogr2ogr -f csv $outfile $f
    fi
done
wait

# It's not possible to just merge all our CSVs together, since the schema
# changes from PLUTO to PLUTO.  Meh.
#    ### Merge all output CSVs to one big'un
#    # First, grab a random header row from output; then, put in all other rows
#    # excluding headers
#    allpluto=output/pluto/pluto.csv
#    
#    ls output/pluto/csvsources/*.csv | head -n 1 | xargs head -n 1 > $allpluto
#    ls output/pluto/csvsources/*.csv | 

# Instead we just merge together the latest (13v2) and upload that.
pluto_version=13v1
echo "Merging together pluto $pluto_version and zipping"
pluto=output/pluto/pluto.csv
ls output/pluto/csvsources/MapPLUTO_${pluto_version}_*.csv | head -n 1 | xargs head -n 1 > $pluto
ls output/pluto/csvsources/MapPLUTO_${pluto_version}_*.csv | xargs tail -q -n +2 >> $pluto
gzip -9 $pluto
