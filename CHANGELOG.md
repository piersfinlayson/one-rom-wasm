# Changelog

## v0.5.0 - 2026-??-??

TODO - move Cargo.toml dependencies back to crates.io versions, and remove the local path overrides.

Expose fixed chip-select polarity in `chip_type_info`. The `ControlLine.configurable`
boolean is replaced by a `cs_type` string — `"configurable"`, `"fixed_active_low"`,
or `"fixed_active_high"` — so consumers can distinguish fixed active-high CS lines
(e.g. the HM7641's CS3/CS4) from fixed active-low ones. The old boolean collapsed
both fixed polarities into one, so a fixed active-high line was reported as active-low.

This is a non-backwards-compatible change to the `chip_type_info` output: replace
`line.configurable` with `line.cs_type === 'configurable'`.

Move up to onerom-gen with Intel HEX (ihex) ROM image support, so the web
programmer can build firmware from an Intel HEX file. Decoding happens in
onerom-gen during the build, so the site simply carries the new
`format`/`load_address` chip keys in the config it emits.

Also add a `file_formats()` export listing the ROM image file formats onerom-gen
supports (value, label, default), so the site can build its File Format picker
from the crate rather than hard-coding the options.

Expose the physical jumper-header descriptor on `board_info()`. `BoardInfo` gains
an optional `jumper_header` field (`JumperHeaderInfo` / `HeaderColumnInfo`) that
mirrors `onerom-config`'s new `Board::jumper_header()`: an ordered list of header
columns (1-based, left-to-right), each with `row1`/`row2` and optional `row3` pad
carrying role tokens (`5v`, `gnd`, `run`, `bootsel`, `sel_a`..`sel_e`, `swclk`,
`swdio`, `x1`, `x2`, or `nc`/`np`). It is `undefined` for boards whose header has
not yet been characterised, so a consumer falls back to a generic description.
This lets the ROM Slot Builder draw an accurate per-board image-select jumper
diagram. A generic `jumpers.html` viewer draws any board's physical header from
this data — every pad in its position (pin numbers, roles, GPIOs, SWD
multiplexing, X pads). Additive; no change to existing `board_info()` fields.

Add `image_size(board, chip_type, version)`, returning the flash footprint (in
bytes) of one image of `chip_type` on `board` — the v2 slot size that the ROM
Slot Builder's flash-usage tally needs per slot, and the number
`docs/COMPATIBILITY.md`'s "Image size" column tabulates. It can far exceed the
ROM's own capacity, so it is not `chip_type_info().size_bytes`. Computed via
`onerom-gen`'s `check_chip_on_board`; an unsupported chip/board combination, or a
malformed board/chip/version, returns a clean JS error (no panic). `version` is
parsed and validated but does not affect the result (the v2 footprint is board +
chip only); it is kept for API symmetry and future-proofing.

Add `min_schema_version()`, returning the v2 (schema) firmware-version floor as
`"major.minor.patch"` (currently `"0.7.0"`), read from
`onerom-metadata::MIN_SCHEMA_VERSION`. The site uses it to gate the
firmware-version picker (and the v2-only flash-usage tally) to v2 firmware
without hardcoding the version.

## v0.4.1 - 2026-07-17

Report ROM filename _and_ type in RomSummary.

## v0.4.0 - 2026-07-15

Add v0.7.0 firmware parsing support, to enable onerom.org/web to support it.

## v0.3.13 - 2026-07-14

Move to v0.7.0 release train dependencies, bringing in:
- Plugin support

Does not yet bring in v0.7.0 firmware support, which requires new firmware parsing capabilities.

## v0.3.12 - 2026-07-02

Firmware v0.6.14 with new ROM and hardware types

## v0.3.11 - 2026-06-02

Firmware v0.6.13 with new ROM and hardware types

## v0.3.10 - 2026-05-26

Add new ROM types

## v0.3.9 - 2026-05-14

Support firmware v0.6.11 and new 23QL512 ROM type

## v0.3.8 - 2026-05-08

Support firmware v0.6.9

## v0.3.7 - 2026-04-02

Support firmware v0.6.8

## v0.3.6 - 2026-03-26

Support firmwre v0.6.7

## v0.3.5 - 2026-03-04

Support fire-24-eadb01, a special one off hardware revision.

## v0.3.4 - 2026-02-26

Move up to firmware v0.6.6

## v0.3.3 - 2026-02-22

Moves up to firmware 0.6.5

## v0.3.2 - 2026-02-07

Move up to latest crates to properly support 28 pin ROMs with firmware 0.6.3+.

## v0.3.1 - 2026-02-03

Adds 231024A support.

## v0.3.0 - 2026-01-27

Supports firmware 0.6.2+ with breaking API changes - ROM changed to Chip, and includes RAM chip support.

## v0.2.1 - 2026-01-22

Uprev onerom-config and onerom-gen to get fixes (2732 ROM generation specifically).

## v0.2.0 - 2026-01-14

Support firmware 0.6.0, requires breaking API changes.

Includes support for building and parsing 0.6.0 fimrware images, including the new firmware overrides.

## v0.1.8 - 2026-01-11

Add support for 32 and 40 pin ROMs

## v0.1.7 - 2026-01-01

Support new hardware revisions.

## v0.1.6 - 2025-12-31

Added new ROM type (231024)

## v0.1.5 - 2025-11-05

Removed using cors for zimmers.net, as suitable CORS headers are now set.
Moved to latest onerom crates.

## v0.1.4 - 2025-10-24

Pull in latest onerom crates, so can decode firmware 0.5.3

## v0.1.3 - 2025-10-14

### Added

- A changelog!
- Support for new `onerom-gen` features like a ROM description
