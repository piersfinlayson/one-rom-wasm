# Changelog

## v0.3.5 - 2026-??-??


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
