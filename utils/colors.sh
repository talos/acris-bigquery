#!/bin/bash

function info  {
    echo
    echo "    $@"
}

function error  {
    echo
    echo "    $(tput setaf 1)$@$(tput sgr0)"
}

function success {
    echo
    echo "    $(tput setaf 2)$@$(tput sgr0)"
}

function warn {
    echo
    echo "    $(tput setaf 3)$@$(tput sgr0)"
}

# Retry an operation until it succeeds, waiting one second.  Gives up after
# ten failed attempts.
function retry {
    WAIT=3
    MAX=10
    for TRY in $(seq 1 $MAX); do
        $@ && break || error "Could not execute \`$@\`, retrying in $WAIT seconds (attempt $TRY OF $MAX)..."
        sleep $WAIT
    done
}

# Wait for bigquery jobs to finish up
function bq_wait {
    while :
    do
        jobs=$(bq ls -j | grep '\(PENDING\|RUNNING\)' | wc -l | xargs)
        if [ $jobs -eq "0" ]; then
            success $@
            break
        else
            info "Waiting for $jobs jobs to complete..."
            sleep 5
        fi
    done
}
