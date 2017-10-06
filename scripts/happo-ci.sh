#!/bin/bash

# Exit as soon as the script fails
set -ex

if [ -z "$CI_PULL_REQUEST" ]; then
  echo "This is not a pull request build."
  exit 0
fi

happo_run() {
  echo "Checking out $1"

  git checkout --quiet "$1"

  npm install
  npm run build

  # Run Happo for the current commit. We use `xvfb-run` so that we can run
  # Happo (which uses Firefox) in a headless display environment.
  xvfb-run -a happo run
}

echo "Running Happo on latest master"
happo_run origin/master

echo "Running Happo on current PR commit ($CIRCLE_SHA1)"
happo_run "$CIRCLE_SHA1"

ARGOS_COMMIT=$CIRCLE_SHA1 ARGOS_BRANCH=$CIRCLE_BRANCH \
  argos upload happo-snapshots --token $ARGOS_TOKEN || true