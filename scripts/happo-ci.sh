#!/bin/bash

# Exit as soon as the script fails
set -ex

happo_run() {
  echo "Checking out $1"

  git checkout --quiet "$1"

  npm install
  npm run build

  rm -rf happo-snapshots

  # Run Happo for the current commit. We use `xvfb-run` so that we can run
  # Happo (which uses Firefox) in a headless display environment.
  xvfb-run -a happo run
}

echo "Running Happo on current PR commit ($CIRCLE_SHA1)"
happo_run "$CIRCLE_SHA1"

node test/normalize.js

ARGOS_COMMIT=$CIRCLE_SHA1 ARGOS_BRANCH=$CIRCLE_BRANCH \
  argos upload happo-snapshots --token $ARGOS_TOKEN || true