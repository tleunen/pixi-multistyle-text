#!/bin/bash

# Exit as soon as the script fails
set -ex

# Run Happo for the current commit. We use `xvfb-run` so that we can run
# Happo (which uses Firefox) in a headless display environment.
xvfb-run -a happo run

node test/normalize.js

ARGOS_COMMIT=$CIRCLE_SHA1 ARGOS_BRANCH=$CIRCLE_BRANCH \
  argos upload happo-snapshots --token $ARGOS_TOKEN || true
