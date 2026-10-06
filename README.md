# onerom_wasm

One ROM's Supporting Web Assembly Implementation

Allows parsing of One ROM firmware (both binary files, and flash dumps from OneROM devices) and generating of One ROM firmware metadata and ROM images in the browser.

This crate also exposes generating 23 series and 27 series ROM properties, such as size, pin mappings, and other details.

See https://wasm.onerom.org/ for sample implementations, hosted wasm packages, and the TypeScript API documentation.

## Dependencies

To build the TypeScript documentation you will need the Node.js type definitions:

```bash
npm install @types/node
```

## Release Process

1. Ensure all Cargo.toml dependencies point to crates.io versions.

2. Update the version in Cargo.toml to the new version if not already done.

3. Date the version's heading in CHANGELOG.md.

4. Run `./build.sh && ./test.sh` to ensure everything builds correctly.

5. Point browser at https://localhost:8000/ (or wherever you are hosting the wasm package) and ensure everything works correctly.

6. Commit any changes to Cargo.toml or other files.

7. Run `cargo publish --dry-run` to ensure everything is ready for publishing.

8. Run `cargo publish` to publish the crate to crates.io.

9. Tag the release in git with `git tag vX.Y.Z` where X.Y.Z is the version number.

10. Push the changes and tags to the remote repository with `git push && git push --tags`.

11. Update the version in Cargo.toml to the next development version (e.g., X.Y.Z+1).

The GitHub workflow automatically builds and publishes the updated site on a commit to the main branch, and also stores off the new release at releases/vX.Y.Z/ when a new 'v*' tag is pushed.1
