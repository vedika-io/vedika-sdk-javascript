#!/usr/bin/env bash
# Prepare a local package. Publishing is a separate release action.
set -euo pipefail
cd "$(dirname "$0")"
output_dir="${1:?Usage: PUBLISH.sh ABSOLUTE_OUTPUT_DIRECTORY}"
[[ "$output_dir" = /* ]] || { echo 'Output directory must be absolute.' >&2; exit 2; }
mkdir -p "$output_dir"
npm run build
npm test -- --runInBand --watchman=false
npm run lint
npm pack --pack-destination "$output_dir"
