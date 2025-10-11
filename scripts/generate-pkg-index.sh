#!/bin/bash
set -e

source "$(dirname "$0")/html-utils.sh"

generate_index "deploy/pkg" "Package Files"