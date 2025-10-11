#!/bin/bash
set -e

wasm-pack build --target web
echo ""
echo -n "One ROM wasm binary size: "
ls -lh pkg/onerom_wasm_bg.wasm | awk '{print $5}'

npx --yes typedoc pkg/onerom_wasm.d.ts --out docs
echo "Documentation generated in docs/"
