#!/bin/bash
set -e

wasm-pack build --target web
echo ""
echo -n "One ROM wasm binary size: "
ls -lh pkg/onerom_wasm_bg.wasm | awk '{print $5}'

npx --yes typedoc pkg/onerom_wasm.d.ts --out docs
echo "Documentation generated in docs/"

# Prepare deployment directory
mkdir -p deploy
cp LICENSE.md index.html style.css deploy/
cp -r pkg docs js deploy/
rm -f deploy/pkg/.gitignore

# Generate directory listings
./scripts/generate-pkg-index.sh

echo "Deployment files prepared in deploy/"
