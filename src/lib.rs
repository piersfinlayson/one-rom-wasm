// Copyright (C) 2025 Piers Finlayson <piers@piers.rocks>
//
// MIT License

use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

use airfrog_rpc::io::Reader;
use onerom_app::{FlashPlan, FlashPlanError, FlashStep, OtpError};
use onerom_config::fw::{FirmwareProperties, FirmwareVersion};
use onerom_config::hw::{Board, BoardSize};
use onerom_config::mcu::{Family, RP235X_BASE_FLASH, Variant};
use onerom_config::pin::parse_pin;
use onerom_fw_parser::{
    ImageFileError, ParsedDevice, Parser, SlotKind, readers::MemoryReader, readers::RegionKind,
};
use onerom_gen::{Builder as GenBuilder, FileData, FlashChips, slot_addresses};
use onerom_lab_parser::LabParser;
use onerom_metadata::{MaybeKnown, OneromBoardSize, OneromOverrideStates};

/// Initialize logging and panic hook
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
    console_log::init_with_level(log::Level::Debug).unwrap();
}

/// WASM Library Version
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Version information for the various components
#[wasm_bindgen]
pub struct VersionInfo {
    onerom_wasm: String,
    onerom_config: String,
    onerom_gen: String,
    sdrr_fw_parser: String,
    metadata_version: String,
}

#[wasm_bindgen]
impl VersionInfo {
    #[wasm_bindgen(getter)]
    pub fn onerom_wasm(&self) -> String {
        self.onerom_wasm.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn onerom_config(&self) -> String {
        self.onerom_config.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn onerom_gen(&self) -> String {
        self.onerom_gen.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn sdrr_fw_parser(&self) -> String {
        self.sdrr_fw_parser.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn metadata_version(&self) -> String {
        self.metadata_version.clone()
    }
}

/// Get version information for the various components
#[wasm_bindgen]
pub fn versions() -> VersionInfo {
    VersionInfo {
        onerom_wasm: env!("CARGO_PKG_VERSION").to_string(),
        onerom_config: onerom_config::crate_version().to_string(),
        onerom_gen: onerom_gen::crate_version().to_string(),
        sdrr_fw_parser: onerom_fw_parser::crate_version().to_string(),
        metadata_version: onerom_gen::metadata_version().to_string(),
    }
}

/// Web-focused summary of a parsed One ROM device.
///
/// Everything the browser tool needs to render the device panel, flattened
/// across both firmware generations. `dump` carries the full parse as JSON for
/// the details view.
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct DeviceSummary {
    /// The firmware found, or `None` where it isn't recognised.
    pub firmware: Option<Firmware>,
    /// Firmware version, "major.minor.patch".
    pub version: Option<String>,
    /// MCU name (e.g. "RP2350", "F411RE").
    pub mcu: Option<String>,
    /// Board model ("fire" / "ice").
    pub model: Option<String>,
    /// Hardware revision / board name (e.g. "fire-28-c").
    pub hw_rev: Option<String>,
    /// True if the firmware parsed with non-fatal errors.
    pub corrupt: bool,
    /// Human-readable non-fatal parse errors.
    pub parse_errors: Vec<String>,
    /// Whether the device can run One ROM firmware over USB (has the USB
    /// system plugin).
    pub can_run: bool,
    /// Whether runtime info was present (device was running when read).
    /// Requires RAM to have been supplied; always false for a flash-only parse.
    pub running: bool,
    /// The board's size, "M" or "L". A board recording another size, or none,
    /// is "M". `None` for One ROM Lab, for an image file and where
    /// `parse_firmware` is called without `otp_cb`.
    pub board_size: Option<String>,
    /// The board size the device records: "M", "L", "other" or "unknown".
    /// "unknown" covers firmware that doesn't record a size, a size this build
    /// doesn't know and a size that couldn't be read. `None` where
    /// `board_size` is.
    pub recorded_board_size: Option<String>,
    /// The board type the board's current commissioning instance records, such
    /// as "fire-40-a". Text that isn't a known board type has its control
    /// characters escaped. `None` where OTP doesn't have a current instance or
    /// couldn't be read, for One ROM Lab, for an image file and where
    /// `parse_firmware` is called without `otp_cb`.
    pub commissioned_board: Option<String>,
    /// The reserved pins' silkscreen labels, for example `["SEL_C", "X1"]`.
    /// `None` where the metadata predates reserved pins or wasn't read, and
    /// for One ROM Lab.
    pub reserved_pins: Option<Vec<String>>,
    /// Plugin entries (system, user), in slot order.
    pub plugins: Vec<RomSummary>,
    /// User ROM entries, in slot order.
    pub roms: Vec<RomSummary>,
    /// For pre-v0.5.0 original firmware read from a partial dump: the full chip
    /// size to re-read, in bytes. `None` otherwise.
    pub full_reread_size: Option<u32>,
    /// Full parse serialised as JSON, for the details view. Externally tagged
    /// by format (`Original` / `Schema`), or `"Lab"` for One ROM Lab.
    pub dump: String,
}

/// The member of the One ROM family a [`DeviceSummary`] describes.
#[derive(Serialize, Tsify)]
#[serde(rename_all = "lowercase")]
pub enum Firmware {
    /// One ROM, from either firmware generation.
    OneRom,
    /// One ROM Lab.
    Lab,
}

/// A single ROM or plugin entry in a [`DeviceSummary`].
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct RomSummary {
    /// Display label: "filename (ROM type)" where the firmware recorded a
    /// filename, else the ROM type on its own.
    ///
    /// Plugins carry just their filename or URL: their type is always one of
    /// the plugin types, which adds nothing beside a resolved plugin name.
    pub label: String,
    /// Whether this entry's slot is the one currently being served.
    pub active: bool,
    /// User-facing ROM number (plugins excluded); `None` for plugins.
    pub index: Option<usize>,
}

/// Number of bytes fetched per RAM cache miss.
///
/// One `flashRead` USB round trip then serves the many small field reads the
/// parser makes while walking the runtime structure. This MUST stay greater
/// than or equal to the size of the largest structure the parser reads from RAM
/// (`onerom_runtime_info_t` is 60 bytes); if that structure ever grows past
/// this, raise the constant.
const RAM_BLOCK_LEN: u32 = 256;

/// A [`Reader`] that serves flash from an in-memory image and fetches every
/// other address (i.e. RAM) on demand through a JavaScript callback.
///
/// The callback has the shape `async (addr: number, len: number) =>
/// Uint8Array`, returning exactly `len` bytes starting at `addr`. Fetched
/// blocks are cached, so the many small reads the parser makes while walking the
/// runtime structure cost a single USB round trip rather than one per field.
struct CallbackReader {
    /// Flash image bytes.
    flash: Vec<u8>,
    /// Absolute base address the flash image is mapped at. Updated by
    /// [`update_base_address`](Reader::update_base_address) when the parser
    /// re-bases for RP2350.
    flash_base: u32,
    /// JS `(addr, len) => Promise<Uint8Array>`, used to fetch non-flash (RAM)
    /// regions on demand.
    read_cb: js_sys::Function,
    /// Fetched RAM blocks, each `(base_addr, bytes)`. Searched before fetching.
    ram_cache: Vec<(u32, Vec<u8>)>,
}

impl CallbackReader {
    /// Create a reader over `flash` (mapped at `flash_base`), fetching any other
    /// address through `read_cb`.
    fn new(flash: Vec<u8>, flash_base: u32, read_cb: js_sys::Function) -> Self {
        Self {
            flash,
            flash_base,
            read_cb,
            ram_cache: Vec::new(),
        }
    }

    /// Invoke the JS callback for `len` bytes at `addr`, awaiting the returned
    /// `Uint8Array`. Addresses and lengths cross the boundary as JS numbers.
    async fn fetch(&self, addr: u32, len: u32) -> Result<Vec<u8>, String> {
        let promise = self
            .read_cb
            .call2(
                &JsValue::NULL,
                &JsValue::from_f64(addr as f64),
                &JsValue::from_f64(len as f64),
            )
            .map_err(|e| format!("read callback threw: {e:?}"))?;

        let resolved = wasm_bindgen_futures::JsFuture::from(js_sys::Promise::from(promise))
            .await
            .map_err(|e| format!("read failed at {addr:#010x}: {e:?}"))?;

        Ok(js_sys::Uint8Array::new(&resolved).to_vec())
    }
}

impl Reader for CallbackReader {
    type Error = String;

    async fn read(&mut self, addr: u32, buf: &mut [u8]) -> Result<(), Self::Error> {
        let len = buf.len();
        let end = addr
            .checked_add(len as u32)
            .ok_or_else(|| format!("address overflow at {addr:#010x}"))?;

        // Flash region: serve directly from the in-memory image.
        let flash_end = self.flash_base.saturating_add(self.flash.len() as u32);
        if addr >= self.flash_base && end <= flash_end {
            let off = (addr - self.flash_base) as usize;
            buf.copy_from_slice(&self.flash[off..off + len]);
            return Ok(());
        }

        // Already-fetched RAM block that covers the request?
        if let Some((base, data)) = self
            .ram_cache
            .iter()
            .find(|(b, d)| addr >= *b && end <= b.saturating_add(d.len() as u32))
        {
            let off = (addr - *base) as usize;
            buf.copy_from_slice(&data[off..off + len]);
            return Ok(());
        }

        // Miss: fetch a block covering the request (at least RAM_BLOCK_LEN),
        // cache it, and serve from it.
        let fetch_len = core::cmp::max(RAM_BLOCK_LEN, len as u32);
        let block = self.fetch(addr, fetch_len).await?;
        if block.len() < len {
            return Err(format!(
                "short read at {addr:#010x}: got {}, need {len}",
                block.len()
            ));
        }
        buf.copy_from_slice(&block[..len]);
        self.ram_cache.push((addr, block));
        Ok(())
    }

    fn update_base_address(&mut self, new_base: u32) {
        self.flash_base = new_base;
    }
}

/// Parse a firmware image into a [`DeviceSummary`].
///
/// Accepts a complete `.bin`, the first 64KB of a flash dump, or an entire
/// flash dump. Handles both pre-v0.7.0 (original) and v0.7.0+ (schema) firmware
/// via `Parser::parse_device`, and One ROM Lab via `LabParser`.
///
/// The plugin/ROM list comes from flash. Whenever the parser follows a runtime
/// pointer (into RAM), `read_cb` is invoked to fetch those bytes on demand —
/// this is what lets the summary report `running` and mark the active ROM. On a
/// stopped device the runtime magic will not match and the runtime is tolerantly
/// dropped, so the list still parses.
///
/// `read_cb` is a JS `async (addr: number, len: number) => Uint8Array` returning
/// exactly `len` bytes at `addr` (see [`CallbackReader`]).
///
/// `otp_cb` reads the board's OTP (see [`JsOtp`]). With it the summary has the
/// board's size, from runtime info where One ROM records it and from OTP
/// otherwise, as the CLI reads it. It also has the board type the board is
/// commissioned as. `undefined` leaves both out.
#[wasm_bindgen]
pub async fn parse_firmware(
    flash: Vec<u8>,
    read_cb: js_sys::Function,
    otp_cb: Option<js_sys::Function>,
) -> Result<DeviceSummary, JsValue> {
    // 0x08000000 is a placeholder flash base; parse_device detects RP2350
    // firmware and re-bases via Reader::update_base_address. Non-flash reads are
    // served on demand by read_cb.
    let mut reader = CallbackReader::new(flash, 0x08000000, read_cb);
    let mut parser = Parser::new(&mut reader);
    let parsed = parser.parse_device().await;

    if matches!(parsed, ParsedDevice::Lab) {
        return lab_summary(&mut reader, &parsed)
            .await
            .map_err(|e| JsValue::from_str(&e));
    }
    let mut summary = device_summary(&parsed).map_err(|e| JsValue::from_str(&e))?;

    // A blank board, or one with firmware this build doesn't recognise, still
    // has a size in OTP.
    if let Some(callback) = otp_cb {
        let mut otp = JsOtp { callback };
        let size_otp = &mut otp;
        let size = onerom_app::device_board_size(parsed.runtime_board_size(), || async move {
            onerom_app::read_board_size(size_otp)
                .await
                .inspect_err(|e| log::debug!("Couldn't read the board size: {e}"))
                .ok()
        })
        .await;
        summary.board_size = Some(
            onerom_app::known_board_size(size)
                .unwrap_or(BoardSize::M)
                .name()
                .to_string(),
        );
        summary.recorded_board_size = Some(recorded_board_size(size).to_string());
        summary.commissioned_board = commissioned_board(&mut otp).await;
    }
    Ok(summary)
}

/// The board type `otp`'s current commissioning instance records, as
/// [`DeviceSummary::commissioned_board`] shows it. `None` where there isn't a
/// current instance or the read fails.
async fn commissioned_board(otp: &mut JsOtp) -> Option<String> {
    let area = onerom_app::read_commissioning(otp)
        .await
        .inspect_err(|e| log::debug!("Couldn't read the commissioning area: {e}"))
        .ok()?;
    let board = area.current()?.board()?;
    Some(match Board::try_from_str(board) {
        Some(known) => known.name().to_string(),
        None => escape_controls(board),
    })
}

/// `text` with each control character escaped, as the CLI shows OTP strings. A
/// board's OTP can contain any bytes.
fn escape_controls(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c.is_control() {
                c.escape_default().to_string()
            } else {
                c.to_string()
            }
        })
        .collect()
}

/// The board size a device records, as [`DeviceSummary::recorded_board_size`]
/// shows it.
fn recorded_board_size(size: Option<MaybeKnown<OneromBoardSize>>) -> &'static str {
    match size {
        Some(MaybeKnown::Known(OneromBoardSize::BoardSizeM)) => "M",
        Some(MaybeKnown::Known(OneromBoardSize::BoardSizeL)) => "L",
        Some(MaybeKnown::Known(OneromBoardSize::BoardSizeOther)) => "other",
        Some(MaybeKnown::Known(OneromBoardSize::BoardSizeUnknown) | MaybeKnown::Unknown(_))
        | None => "unknown",
    }
}

/// A JavaScript-backed [`onerom_app::LocalOtpAccess`]. It reads OTP and
/// refuses writes.
///
/// Wraps a JS async callback `(row: number, count: number, ecc: boolean) =>
/// Promise<Uint8Array>` returning the rows as picoboot.js's OTP_READ returns
/// them. Each row is little-endian, 2 bytes with ECC and 4 bytes raw.
struct JsOtp {
    callback: js_sys::Function,
}

impl JsOtp {
    /// Reads `count` rows from `row`, with ECC where `ecc`, as the callback
    /// returns them.
    async fn read(&self, row: u16, count: u16, ecc: bool) -> Result<Vec<u8>, OtpError> {
        let promise = self
            .callback
            .call3(
                &JsValue::NULL,
                &JsValue::from_f64(f64::from(row)),
                &JsValue::from_f64(f64::from(count)),
                &JsValue::from_bool(ecc),
            )
            .map_err(|e| OtpError::Transport(format!("OTP read callback threw: {e:?}")))?;

        let resolved = wasm_bindgen_futures::JsFuture::from(js_sys::Promise::from(promise))
            .await
            .map_err(|e| {
                OtpError::Transport(format!("OTP read failed at row {row:#05x}: {e:?}"))
            })?;

        Ok(js_sys::Uint8Array::new(&resolved).to_vec())
    }
}

impl onerom_app::LocalOtpAccess for JsOtp {
    async fn read_ecc(&mut self, row: u16, count: u16) -> Result<Vec<u16>, OtpError> {
        let bytes = self.read(row, count, true).await?;
        otp_rows::<2>(&bytes, count).map(|rows| rows.into_iter().map(u16::from_le_bytes).collect())
    }

    async fn read_raw(&mut self, row: u16, count: u16) -> Result<Vec<u32>, OtpError> {
        let bytes = self.read(row, count, false).await?;
        // A row holds 24 bits.
        otp_rows::<4>(&bytes, count).map(|rows| {
            rows.into_iter()
                .map(|row| u32::from_le_bytes(row) & 0xff_ffff)
                .collect()
        })
    }

    async fn write_ecc(&mut self, _row: u16, _value: u16) -> Result<(), OtpError> {
        Err(OtpError::Transport(OTP_WRITE_UNSUPPORTED.to_string()))
    }

    async fn write_raw(&mut self, _row: u16, _value: u32) -> Result<(), OtpError> {
        Err(OtpError::Transport(OTP_WRITE_UNSUPPORTED.to_string()))
    }
}

/// The error for an OTP write.
const OTP_WRITE_UNSUPPORTED: &str = "OTP writes aren't supported";

/// `bytes` split into `count` rows of `N` bytes. Refuses a read of another
/// length.
fn otp_rows<const N: usize>(bytes: &[u8], count: u16) -> Result<Vec<[u8; N]>, OtpError> {
    let (rows, rest) = bytes.as_chunks::<N>();
    if rows.len() == usize::from(count) && rest.is_empty() {
        Ok(rows.to_vec())
    } else {
        Err(OtpError::Transport(format!(
            "a read of {count} rows returned {} bytes",
            bytes.len()
        )))
    }
}

/// Parse an image file into a [`DeviceSummary`].
///
/// A file longer than the first flash chip holds the second chip's contents
/// after the first chip's. A file whose slots don't match its length or the
/// flash chips is `corrupt`, and the last of its `parse_errors` says why.
/// Otherwise the summary is the one [`parse_firmware`] returns for flash alone.
#[wasm_bindgen]
pub async fn parse_image_file(data: Vec<u8>) -> Result<DeviceSummary, JsValue> {
    image_file_summary(&data)
        .await
        .map_err(|e| JsValue::from_str(&e))
}

/// [`parse_image_file`] returning its error as a string.
async fn image_file_summary(data: &[u8]) -> Result<DeviceSummary, String> {
    // Only an RP2350 board has a second chip, so the file splits at the end of
    // the RP2350's first chip.
    let parsed =
        onerom_fw_parser::parse_image_file(data, FlashChips::first_for(Variant::RP2350)).await;
    if matches!(parsed, ParsedDevice::Lab) {
        let mut reader = MemoryReader::new(data.to_vec(), RP235X_BASE_FLASH);
        return lab_summary(&mut reader, &parsed).await;
    }

    let mut summary = device_summary(&parsed)?;
    // Schema-format firmware is RP2350-only.
    let mcu = parsed
        .as_original()
        .and_then(|sdrr| sdrr.flash.as_ref())
        .and_then(|flash| flash.mcu_variant)
        .unwrap_or(Variant::RP2350);
    if let Err(e) = parsed.check_image_file(data.len(), FlashChips::first_for(mcu)) {
        summary.corrupt = true;
        summary.parse_errors.push(image_file_error(&e));
    }
    Ok(summary)
}

/// Why an image file fails [`ParsedDevice::check_image_file`], as
/// [`DeviceSummary::parse_errors`] shows it.
fn image_file_error(error: &ImageFileError) -> String {
    match error {
        ImageFileError::TooShort { short_by } => format!("{short_by} bytes short"),
        ImageFileError::TooLong { too_long_by } => format!("{too_long_by} bytes too long"),
        ImageFileError::BadAddress { .. } => "a slot has an invalid address".to_string(),
    }
}

/// Build a [`DeviceSummary`] for a One ROM Lab, read with `LabParser` as the
/// CLI reads it. `dev` is the `ParsedDevice::Lab` that found it.
async fn lab_summary<R: Reader>(
    reader: &mut R,
    dev: &ParsedDevice,
) -> Result<DeviceSummary, String> {
    let dump = serde_json::to_string(dev).map_err(|e| e.to_string())?;
    let lab = match LabParser::new(reader).parse().await {
        Ok(lab) => lab,
        Err(e) => {
            return Ok(DeviceSummary {
                firmware: Some(Firmware::Lab),
                version: None,
                mcu: None,
                model: None,
                hw_rev: None,
                corrupt: true,
                parse_errors: vec![e],
                can_run: true,
                running: false,
                board_size: None,
                recorded_board_size: None,
                commissioned_board: None,
                reserved_pins: None,
                plugins: Vec::new(),
                roms: Vec::new(),
                full_reread_size: None,
                dump,
            });
        }
    };

    // The board Lab runs as, or the one its image was built for when it isn't
    // running.
    let hw_rev = match &lab.runtime {
        Ok(runtime) => runtime.hw_rev.clone(),
        Err(_) => lab.metadata.as_ref().ok().and_then(|m| m.hw.hw_rev.clone()),
    };
    let board = hw_rev.as_deref().and_then(Board::try_from_str);
    let info = &lab.info;

    Ok(DeviceSummary {
        firmware: Some(Firmware::Lab),
        version: Some(format!(
            "{}.{}.{}",
            info.major_version, info.minor_version, info.patch_version
        )),
        mcu: board.as_ref().map(|b| b.mcu_family().to_string()),
        model: board.as_ref().map(|b| b.model().to_string()),
        hw_rev: board.as_ref().map(|b| b.name().to_string()),
        corrupt: lab.metadata.is_err(),
        parse_errors: lab
            .metadata
            .as_ref()
            .err()
            .map(|e| format!("{e:?}"))
            .into_iter()
            .collect(),
        // Lab always runs its own USB stack.
        can_run: true,
        running: lab.runtime.is_ok(),
        board_size: None,
        recorded_board_size: None,
        commissioned_board: None,
        reserved_pins: None,
        plugins: Vec::new(),
        roms: Vec::new(),
        full_reread_size: None,
        dump,
    })
}

/// Build a [`DeviceSummary`] from a parsed device.
fn device_summary(dev: &ParsedDevice) -> Result<DeviceSummary, String> {
    let parse_errors: Vec<String> = dev.parse_errors().iter().map(|e| e.to_string()).collect();

    let mut plugins = Vec::new();
    let mut roms = Vec::new();
    for slot in dev.slots() {
        let active = slot.active;
        let index = slot.user_index;
        let kind = slot.kind;
        for rom in slot.roms() {
            // The ROM type goes alongside the filename, not instead of it: the
            // type is what says how the ROM will be served, and preferring the
            // filename hid it on every ROM whose firmware recorded a name -
            // which is most of them.
            //
            // Plugins keep a bare label: their type is always a plugin type,
            // which says nothing useful next to the plugin's own name.
            let label = match (rom.filename, kind) {
                (Some(f), SlotKind::Rom) => format!("{} ({})", f, rom.rom_type),
                (Some(f), SlotKind::Plugin) => f.to_string(),
                (None, _) => rom.rom_type.into_owned(),
            };
            let entry = RomSummary {
                label,
                active,
                index,
            };
            match kind {
                SlotKind::Plugin => plugins.push(entry),
                SlotKind::Rom => roms.push(entry),
            }
        }
    }

    let board = dev.get_board();
    let dump = serde_json::to_string(dev).map_err(|e| e.to_string())?;

    Ok(DeviceSummary {
        firmware: dev.is_recognised().then_some(Firmware::OneRom),
        version: version_string(dev),
        mcu: dev.mcu_name(),
        model: board.as_ref().map(|b| b.model().to_string()),
        hw_rev: board.as_ref().map(|b| b.name().to_string()),
        corrupt: !parse_errors.is_empty(),
        parse_errors,
        can_run: dev.is_usb_run_capable(),
        running: dev.is_running(),
        board_size: None,
        recorded_board_size: None,
        commissioned_board: None,
        reserved_pins: dev.reserved_pins().map(|reserved| {
            reserved
                .pins()
                .map(|pin| pin.silkscreen().to_string())
                .collect()
        }),
        plugins,
        roms,
        full_reread_size: full_reread_size(dev),
        dump,
    })
}

/// "major.minor.patch" from whichever format is present. Formatted here rather
/// than via `FirmwareVersion`'s `Display` so the shape matches the existing web
/// UI exactly (no prefix, no build number).
fn version_string(dev: &ParsedDevice) -> Option<String> {
    let (maj, min, pat) = match dev {
        ParsedDevice::Original(s) => {
            let f = s.flash.as_ref()?;
            (f.major_version, f.minor_version, f.patch_version)
        }
        ParsedDevice::Schema(o) => {
            let i = o.info()?;
            (i.major_version, i.minor_version, i.patch_version)
        }
        // parse_firmware reads a Lab with LabParser instead.
        _ => return None,
    };
    Some(format!("{maj}.{min}.{pat}"))
}

/// Pre-v0.5.0 original firmware read from a partial dump parses with errors and
/// the caller must re-read the whole chip. Returns that size in bytes, else
/// `None`. Schema firmware never needs this.
fn full_reread_size(dev: &ParsedDevice) -> Option<u32> {
    let f = dev.as_original()?.flash.as_ref()?;
    if f.major_version == 0 && f.minor_version < 5 && !f.parse_errors.is_empty() {
        Some((f.mcu_variant?.flash_storage_kb() * 1024) as u32)
    } else {
        None
    }
}

/// Parse a flash and RAM dump and return the extracted Sdrr as a JSON
/// object.
/// - flash_data: Flash dump, starting from the base flash address.  Can be
///   the entire flash dump, or just the first 64KB.
/// - rom_data: RAM dump, starting from the base RAM address.  Can be
///   the entire RAM dump, or just the first 256 bytes (enough to read sdrr_ram_info)
pub async fn parse_all(flash_data: Vec<u8>, rom_data: Vec<u8>) -> Result<JsValue, JsValue> {
    let mut reader = MemoryReader::new_of_kind(RegionKind::Flash, flash_data, 0x08000000);
    reader.add_region(RegionKind::Ram, rom_data, 0x20000000);
    let mut parser = Parser::new(&mut reader);

    let info = parser.parse().await;

    serde_wasm_bindgen::to_value(&info).map_err(|e| JsValue::from_str(&e.to_string()))
}

// MCU

/// Basic MCU information structure
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct McuInfo {
    name: String,
    family: String,
    flash_kb: usize,
    ram_kb: usize,
    ccm_ram_kb: Option<usize>,
    max_sysclk_mhz: u32,
    supports_usb_dfu: bool,
    supports_banked_roms: bool,
    supports_multi_rom_sets: bool,
}

/// Return a list of supported MCUs
#[wasm_bindgen]
pub fn mcus() -> Vec<String> {
    onerom_config::mcu::MCU_VARIANTS
        .iter()
        .map(|t| t.to_string())
        .collect()
}

/// Return detailed information about a specific MCU
#[wasm_bindgen]
pub fn mcu_info(name: String) -> Result<McuInfo, JsValue> {
    let variant = onerom_config::mcu::Variant::try_from_str(&name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown MCU variant: {}", name)))?;

    let processor = variant.processor();

    let info = McuInfo {
        name: variant.to_string(),
        family: variant.family().to_string(),
        flash_kb: variant.flash_storage_kb(),
        ram_kb: variant.ram_kb(),
        ccm_ram_kb: variant.ccm_ram_kb(),
        max_sysclk_mhz: processor.max_sysclk_mhz(),
        supports_usb_dfu: variant.supports_usb_dfu(),
        supports_banked_roms: variant.supports_banked_roms(),
        supports_multi_rom_sets: variant.supports_multi_rom_sets(),
    };

    Ok(info)
}

// ROM

/// Detailed ROM type information structure
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ChipTypeInfo {
    name: String,
    aliases: Vec<String>,
    chip_function: String,
    is_plugin: bool,
    is_supported: bool,
    bit_modes: Vec<u8>,
    size_bytes: usize,
    chip_pins: u8,
    num_addr_lines: usize,
    address_pins: Vec<AddressPin>,
    data_pins: Vec<DataPin>,
    control_lines: Vec<ControlLine>,
    programming_pins: Option<Vec<ProgrammingPin>>,
    power_pins: Vec<PowerPin>,
}

/// Address pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct AddressPin {
    line: usize, // A0, A1, A2, etc.
    pin: u8,     // Physical pin number
}

/// Data pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct DataPin {
    line: usize, // D0-D7
    pin: u8,
}

/// Control line mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ControlLine {
    name: String,
    pin: u8,
    // "configurable"      = mask-programmable, user picks the polarity
    // "fixed_active_low"  = polarity fixed low by the silicon (JEDEC /CE, /OE)
    // "fixed_active_high" = polarity fixed high by the silicon (e.g. HM7641 CS3/CS4)
    cs_type: String,
}

/// Programming pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ProgrammingPin {
    name: String,
    pin: u8,
    read_state: String, // "Vcc", "High", "Low", "ChipSelect"
}

/// Power pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct PowerPin {
    name: String,
    pin: u8,
}
/// Return a list of supported ROM types
#[wasm_bindgen]
pub fn chip_types() -> Vec<String> {
    onerom_config::chip::CHIP_TYPES
        .iter()
        .filter(|t| !t.is_plugin())
        .map(|t| t.name().to_string())
        .collect()
}

/// Return a list of supported ROM types that are supported by the latest
/// version of One ROM
#[wasm_bindgen]
pub fn supported_chip_types() -> Vec<String> {
    onerom_config::chip::CHIP_TYPES
        .iter()
        .filter(|t| !t.is_plugin() && t.is_supported())
        .map(|t| t.name().to_string())
        .collect()
}

/// Return a list of all aliases for all chip types
#[wasm_bindgen]
pub fn chip_type_aliases() -> Vec<String> {
    onerom_config::chip::CHIP_TYPES
        .iter()
        .filter(|t| !t.is_plugin())
        .flat_map(|t| t.aliases().iter().map(|s| s.to_string()))
        .collect()
}

/// Return a list of all aliases for supported chip types
#[wasm_bindgen]
pub fn supported_chip_type_aliases() -> Vec<String> {
    onerom_config::chip::CHIP_TYPES
        .iter()
        .filter(|t| !t.is_plugin() && t.is_supported())
        .flat_map(|t| t.aliases().iter().map(|s| s.to_string()))
        .collect()
}

#[wasm_bindgen]
pub fn extra_chip_types_for_board(board_name: String) -> Vec<String> {
    if let Some(board) = onerom_config::hw::BOARDS
        .iter()
        .find(|b| b.name() == board_name)
    {
        board
            .extra_chip_types()
            .iter()
            .map(|t| t.name().to_string())
            .collect()
    } else {
        vec![]
    }
}

/// A selectable ROM image file format, for building the format picker.
///
/// `value` is the string the config's `format` field expects (e.g. `"binary"`,
/// `"ihex"`); `label` is the human-readable name; `is_default` marks the format
/// used when none is specified (raw binary). Enumerated from `onerom-gen`, so a
/// new format added there appears here - and in the UI - with no further work.
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct FileFormatInfo {
    pub value: String,
    pub label: String,
    pub is_default: bool,
}

/// Return the supported ROM image file formats, in display order.
#[wasm_bindgen]
pub fn file_formats() -> Vec<FileFormatInfo> {
    onerom_gen::FileFormat::supported_values()
        .iter()
        .map(|f| FileFormatInfo {
            value: serde_json::to_string(f)
                .unwrap()
                .trim_matches('"')
                .to_string(),
            label: f.display_name().to_string(),
            is_default: f.is_binary(),
        })
        .collect()
}

/// The byte order of a 16-bit ROM image found from its first bytes.
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ByteOrderInfo {
    /// Whether the image requires the `swap_bytes` transform for One ROM to
    /// serve it correctly. True where it is stored high byte first.
    pub needs_swap_bytes: bool,
    /// What identified the order such as "an Amiga ROM header".
    pub evidence: String,
}

/// Find the byte order of a 16-bit ROM image from its first bytes.
///
/// `data` is a raw binary image. An Intel HEX or S-record file matches
/// nothing. `undefined` where nothing is recognised or the checks disagree.
#[wasm_bindgen]
pub fn byte_order(data: Vec<u8>) -> Option<ByteOrderInfo> {
    let conclusion = onerom_app::identity::identify(&data).byte_order;
    let order = conclusion.agreed()?;
    Some(ByteOrderInfo {
        needs_swap_bytes: *order != onerom_app::identity::ByteOrder::ONE_ROM,
        evidence: conclusion.claims().first()?.evidence.to_string(),
    })
}

/// Return detailed information about a specific ROM type
#[wasm_bindgen]
pub fn chip_type_info(name: String) -> Result<ChipTypeInfo, JsValue> {
    let chip_type = onerom_config::chip::ChipType::try_from_str(&name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown ROM type: {}", name)))?;

    let address_pins = chip_type
        .address_pins()
        .iter()
        .enumerate()
        .map(|(line, &pin)| AddressPin { line, pin })
        .collect();

    let data_pins = chip_type
        .data_pins()
        .iter()
        .enumerate()
        .map(|(line, &pin)| DataPin { line, pin })
        .collect();

    let control_lines = chip_type
        .control_lines()
        .iter()
        .map(|cl| ControlLine {
            name: cl.name.to_string(),
            pin: cl.pin,
            cs_type: match cl.line_type {
                onerom_config::chip::ControlLineType::Configurable => "configurable",
                onerom_config::chip::ControlLineType::FixedActiveLow => "fixed_active_low",
                onerom_config::chip::ControlLineType::FixedActiveHigh => "fixed_active_high",
            }
            .to_string(),
        })
        .collect();

    let programming_pins = chip_type.programming_pins().map(|pins| {
        pins.iter()
            .map(|p| ProgrammingPin {
                name: p.name.to_string(),
                pin: p.pin,
                read_state: match p.read_state {
                    onerom_config::chip::ProgrammingPinState::Vcc => "Vcc",
                    onerom_config::chip::ProgrammingPinState::High => "High",
                    onerom_config::chip::ProgrammingPinState::Low => "Low",
                    onerom_config::chip::ProgrammingPinState::ChipSelect => "ChipSelect",
                    onerom_config::chip::ProgrammingPinState::Ignored => "Ignored",
                    onerom_config::chip::ProgrammingPinState::WordSize => "WordSize",
                }
                .to_string(),
            })
            .collect()
    });

    let power_pins = chip_type
        .power_pins()
        .iter()
        .map(|p| PowerPin {
            name: p.name.to_string(),
            pin: p.pin,
        })
        .collect();

    let info = ChipTypeInfo {
        name: chip_type.name().to_string(),
        aliases: chip_type.aliases().iter().map(|s| s.to_string()).collect(),
        chip_function: format!("{:?}", chip_type.chip_function()),
        is_plugin: chip_type.is_plugin(),
        is_supported: chip_type.is_supported(),
        bit_modes: chip_type.bit_modes().to_vec(),
        size_bytes: chip_type.size_bytes(),
        chip_pins: chip_type.chip_pins(),
        num_addr_lines: chip_type.num_addr_lines(),
        address_pins,
        data_pins,
        control_lines,
        programming_pins,
        power_pins,
    };

    Ok(info)
}

/// Flash footprint, in bytes, of one image of `chip_type` on `board`.
///
/// This is the v2 slot size — `2^num_addr_pins * word_bytes` — which is what the
/// ROM Slot Builder's flash-usage tally needs per slot, and the number
/// `docs/COMPATIBILITY.md`'s "Image size" column tabulates. It can far exceed the
/// ROM's own capacity, so it is not the same as `ChipType::size_bytes()`.
///
/// Computed via `onerom_gen::compat::check_chip_set_on_board` for a single-chip
/// slot, which errors for an unsupported chip/board combination — surfaced here
/// as a clean JS error.
///
/// `version` is parsed and validated but unused in the maths: the v2 footprint is
/// determined by board + chip alone. It is kept in the signature for API symmetry
/// with the other builder bindings and to leave room for future version-dependent
/// sizing.
#[wasm_bindgen]
pub fn image_size(board: String, chip_type: String, version: String) -> Result<u32, JsValue> {
    let board_val = onerom_config::hw::Board::try_from_str(&board)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown board: {}", board)))?;
    let chip = onerom_config::chip::ChipType::try_from_str(&chip_type)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown ROM type: {}", chip_type)))?;
    let _version = FirmwareVersion::try_from_str(&version)
        .map_err(|_| JsValue::from_str("Invalid firmware version format"))?;

    onerom_gen::compat::check_chip_set_on_board(
        board_val,
        chip,
        onerom_gen::image::ChipSetType::Single,
        1,
        onerom_gen::compat::default_cs_config(chip),
    )
    .map(|r| r.slot_size_bytes)
    .map_err(|_| {
        JsValue::from_str(&format!(
            "{} is not supported on {}",
            chip_type,
            board_val.name()
        ))
    })
}

/// The v2 (schema) firmware-version floor, as "major.minor.patch".
///
/// Sourced from `onerom_metadata::MIN_SCHEMA_VERSION` — the same constant
/// `onerom-fw-parser` branches on to tell v2 firmware from the pre-v0.7.0 layout.
/// The site uses it to gate the firmware-version picker (and the flash-usage
/// tally, which is v2-only) to v2 firmware without hardcoding the version.
#[wasm_bindgen]
pub fn min_schema_version() -> String {
    let v = onerom_metadata::MIN_SCHEMA_VERSION;
    format!("{}.{}.{}", v.major(), v.minor(), v.patch())
}

/// Whether firmware `version` supports a `board_size` board ("M" or "L").
/// Firmware before 0.8.0 supports only M.
#[wasm_bindgen]
pub fn supports_board_size(version: String, board_size: String) -> Result<bool, JsValue> {
    let version = FirmwareVersion::try_from_str(&version)
        .map_err(|_| JsValue::from_str("Invalid firmware version format"))?;
    let size = parse_board_size(&board_size).map_err(|e| JsValue::from_str(&e))?;
    Ok(onerom_gen::supports_board_size(version, size))
}

/// `board_size` as a [`BoardSize`].
fn parse_board_size(board_size: &str) -> Result<BoardSize, String> {
    board_size
        .parse()
        .map_err(|e| format!("Unknown board size {board_size}: {e}"))
}

/// Whether firmware `version` supports reserved pins.
#[wasm_bindgen]
pub fn supports_reserved_pins(version: String) -> Result<bool, JsValue> {
    let version = FirmwareVersion::try_from_str(&version)
        .map_err(|_| JsValue::from_str("Invalid firmware version format"))?;
    Ok(version >= onerom_gen::MIN_RESERVED_PINS_VERSION)
}

/// Whether firmware `version` supports standby mode.
#[wasm_bindgen]
pub fn supports_standby(version: String) -> Result<bool, JsValue> {
    let version = FirmwareVersion::try_from_str(&version)
        .map_err(|_| JsValue::from_str("Invalid firmware version format"))?;
    // standby is None where `version` predates it.
    Ok(OneromOverrideStates::from_raw(0, Some(version)).standby.is_some())
}

/// The image select pins the firmware reads on `board` with `reserved`
/// reserved, lowest bit first. Each is a config name, for example "sel_a".
///
/// `reserved` holds entries as the config's `reserved_pins` does. An entry the
/// board can't reserve fails with onerom-gen's message.
#[wasm_bindgen]
pub fn image_select_pins(board: String, reserved: Vec<String>) -> Result<Vec<String>, JsValue> {
    let board = Board::try_from_str(&board)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown board: {board}")))?;

    // A config holding only the entries resolves them as a build does.
    let mut config = onerom_gen::Config::new(String::new(), Vec::new());
    config.reserved_pins = reserved
        .iter()
        .map(|entry| {
            parse_pin(entry).map_err(|_| {
                let entry = entry.trim().to_string();
                JsValue::from_str(&onerom_gen::Error::ReservedPinNotAPin { entry }.to_string())
            })
        })
        .collect::<Result<_, _>>()?;
    let reserved = config
        .reserved_pins_on(board)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(reserved
        .select_pins_read(&board)
        .map(|pin| pin.to_string())
        .collect())
}

// PCB/Board

/// One ROM PCB/Board information structure
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct BoardInfo {
    name: String,
    description: String,
    mcu_family: String,
    chip_pins: u8,

    // Pin assignments
    data_pins: Vec<u8>,
    addr_pins: Vec<u8>,
    sel_pins: Vec<u8>,
    pin_status: u8,
    pin_x1: Option<u8>, // None if not available (255 -> None)
    pin_x2: Option<u8>,

    // Port assignments
    port_data: String,
    port_addr: String,
    port_cs: String,
    port_sel: String,
    port_status: String,

    // Jumper configuration
    sel_jumper_pulls: Vec<u8>, // 0=down, 1=up
    x_jumper_pull: u8,

    // Capabilities
    has_usb: bool,
    supports_multi_chip_sets: bool,
    // The board sizes the board supports, smallest first ("M", "L")
    board_sizes: Vec<String>,

    // Physical jumper header, column by column (None if this board's header
    // layout has not yet been characterised, in which case a consumer should
    // fall back to a generic description rather than drawing a wireframe).
    jumper_header: Option<JumperHeaderInfo>,
}

/// Physical jumper-header descriptor (mirrors `onerom_config::hw::JumperHeader`)
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct JumperHeaderInfo {
    /// Columns present on the header, in ascending `col` order. Absent columns
    /// are omitted, so present columns keep their absolute drawn position.
    columns: Vec<HeaderColumnInfo>,
}

/// One column of the jumper header
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct HeaderColumnInfo {
    /// Absolute column position, 1-based from the board's left edge
    col: u8,
    /// Top-row pad: role tokens (e.g. `["sel_c","swclk"]`) or `["np"]`/`["nc"]`
    row1: Vec<String>,
    /// Bottom-row pad
    row2: Vec<String>,
    /// Optional third-row pad (X pins), present only where one exists
    row3: Option<Vec<String>>,
}

fn header_role_token(role: &onerom_config::hw::HeaderRole) -> String {
    use onerom_config::hw::HeaderRole::*;
    match role {
        Power5V => "5v".to_string(),
        Gnd => "gnd".to_string(),
        Run => "run".to_string(),
        Bootsel => "bootsel".to_string(),
        Select(b) => format!("sel_{}", (b'a' + *b) as char),
        Swclk => "swclk".to_string(),
        Swdio => "swdio".to_string(),
        X1 => "x1".to_string(),
        X2 => "x2".to_string(),
        Addr(n) => format!("a{}", n),
    }
}

fn header_slot_tokens(slot: &onerom_config::hw::HeaderSlot) -> Vec<String> {
    use onerom_config::hw::HeaderSlot::*;
    match slot {
        NotPopulated => vec!["np".to_string()],
        NotConnected => vec!["nc".to_string()],
        Roles(roles) => roles.iter().map(header_role_token).collect(),
    }
}

/// Return a list of supported PCBs/Boards
#[wasm_bindgen]
pub fn boards() -> Result<Vec<String>, JsValue> {
    let boards: Vec<String> = onerom_config::hw::BOARDS
        .iter()
        .map(|b| b.name().to_string())
        .collect();
    Ok(boards)
}

/// Return the flash base address for a specific MCU family
#[wasm_bindgen]
pub fn mcu_flash_base(name: &str) -> Result<u32, JsValue> {
    let family = onerom_config::mcu::Family::try_from_str(name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown MCU family: {}", name)))?;
    Ok(family.get_flash_base())
}

/// Return detailed information about a specific PCB/Board
#[wasm_bindgen]
pub fn board_info(name: String) -> Result<BoardInfo, JsValue> {
    let board = onerom_config::hw::Board::try_from_str(&name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown board: {}", name)))?;

    let pin_x1 = board.pin_x1();
    let pin_x2 = board.pin_x2();

    let info = BoardInfo {
        name: board.name().to_string(),
        description: board.description().to_string(),
        mcu_family: board.mcu_family().to_string(),
        chip_pins: board.chip_pins(),

        data_pins: board.data_pins().to_vec(),
        addr_pins: board.addr_pins().to_vec(),
        sel_pins: board.sel_pins().to_vec(),
        pin_status: board.pin_status(),
        pin_x1: if pin_x1 == 255 { None } else { Some(pin_x1) },
        pin_x2: if pin_x2 == 255 { None } else { Some(pin_x2) },

        port_data: board.port_data().to_string(),
        port_addr: board.port_addr().to_string(),
        port_cs: board.port_cs().to_string(),
        port_sel: board.port_sel().to_string(),
        port_status: board.port_status().to_string(),

        sel_jumper_pulls: board.sel_jumper_pulls().to_vec(),
        x_jumper_pull: board.x_jumper_pull(),

        has_usb: board.has_usb(),
        supports_multi_chip_sets: board.supports_multi_chip_sets(),
        board_sizes: BoardSize::supported_values()
            .iter()
            .filter(|&&size| onerom_gen::board_supports_size(board, size))
            .map(|size| size.name().to_string())
            .collect(),

        jumper_header: board.jumper_header().map(|h| JumperHeaderInfo {
            columns: h
                .columns
                .iter()
                .map(|c| HeaderColumnInfo {
                    col: c.col,
                    row1: header_slot_tokens(&c.row1),
                    row2: header_slot_tokens(&c.row2),
                    row3: c.row3.as_ref().map(header_slot_tokens),
                })
                .collect(),
        }),
    };

    Ok(info)
}

#[wasm_bindgen]
pub struct ValuePrettyPair {
    value: String,
    pretty: String,
}

#[wasm_bindgen]
impl ValuePrettyPair {
    #[wasm_bindgen(getter)]
    pub fn value(&self) -> String {
        self.value.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn pretty(&self) -> String {
        self.pretty.clone()
    }
}

/// Get a list of boards for a specific MCU family
#[wasm_bindgen]
pub fn boards_for_mcu_family(family_name: String) -> Result<Vec<ValuePrettyPair>, JsValue> {
    let family = onerom_config::mcu::Family::try_from_str(&family_name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown MCU family: {}", family_name)))?;

    let boards: Vec<ValuePrettyPair> = onerom_config::hw::BOARDS
        .iter()
        .filter(|b| b.mcu_family() == family)
        .map(|b| ValuePrettyPair {
            value: b.name().to_string(),
            pretty: format_board_name(b.name()),
        })
        .collect();

    Ok(boards)
}

fn format_board_name(name: &str) -> String {
    // Convert "ice-24-g" to "Ice 24 G"
    name.split('-')
        .map(|part| {
            // Check for known acronyms
            match part.to_uppercase().as_str() {
                "USB" => "USB".to_string(),
                _ => {
                    let mut chars = part.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    }
                }
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Get a list of MCUs for a specific board
#[wasm_bindgen]
pub fn mcus_for_mcu_family(family_name: String) -> Result<Vec<ValuePrettyPair>, JsValue> {
    let family = onerom_config::mcu::Family::try_from_str(&family_name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown MCU family: {}", family_name)))?;

    let mcus: Vec<ValuePrettyPair> = onerom_config::mcu::MCU_VARIANTS
        .iter()
        .filter(|v| v.family() == family)
        .map(|v| ValuePrettyPair {
            value: v.to_string(),
            pretty: v.to_string(), // For now, just use the same string
        })
        .collect();
    Ok(mcus)
}

/// Get MCU variant (probe-rs) chip ID
#[wasm_bindgen]
pub fn mcu_chip_id(variant_name: String) -> Result<String, JsValue> {
    let variant = onerom_config::mcu::Variant::try_from_str(&variant_name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown MCU variant: {}", variant_name)))?;
    Ok(variant.chip_id().to_string())
}

/// Builder for generating firmware images
#[wasm_bindgen]
pub struct WasmGenBuilder(GenBuilder);

/// Specification for a file that needs to be retrieved and added to the builder
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct WasmFileSpec {
    pub id: usize,
    pub source: String,
    pub extract: Option<String>,
    pub size_handling: String,
    pub chip_type: String,
    pub description: Option<String>,
    pub rom_size: usize,
    pub set_id: usize,
    pub cs1: Option<String>,
    pub cs2: Option<String>,
    pub cs3: Option<String>,
    pub set_type: String,
    pub set_description: Option<String>,
}

/// Result of building a firmware image: (metadata_json, firmware_image)
#[wasm_bindgen]
#[allow(dead_code)]
pub struct WasmImages(Vec<u8>, Vec<u8>);

#[wasm_bindgen]
impl WasmImages {
    #[wasm_bindgen(getter)]
    pub fn metadata(&self) -> Vec<u8> {
        self.0.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn firmware_images(&self) -> Vec<u8> {
        self.1.clone()
    }
}

/// Create a GenBuilder from a JSON configuration string
///
/// Version: "0.3.4" or "0.5.1.1" format
/// Family: "STM32F4" and "RP2350"
///
#[wasm_bindgen]
pub fn gen_builder_from_json(
    version: String,
    family: String,
    config_json: &str,
) -> Result<WasmGenBuilder, String> {
    let version = FirmwareVersion::try_from_str(&version)
        .map_err(|_| "Invalid firmware version format".to_string())?;
    let family = Family::try_from_str(&family).ok_or("Unknown MCU family".to_string())?;

    Ok(WasmGenBuilder(
        GenBuilder::from_json(version, family, config_json).map_err(|e| e.to_string())?,
    ))
}

/// Get the list of file specifications from the builder
#[wasm_bindgen]
pub fn gen_file_specs(builder: &WasmGenBuilder) -> Vec<WasmFileSpec> {
    builder
        .0
        .file_specs()
        .into_iter()
        .map(|spec| WasmFileSpec {
            id: spec.id,
            source: spec.source,
            extract: spec.extract,
            size_handling: serde_json::to_string(&spec.size_handling)
                .unwrap()
                .trim_matches('"')
                .to_string(),
            rom_size: spec.rom_size,
            chip_type: serde_json::to_string(&spec.chip_type.name())
                .unwrap()
                .trim_matches('"')
                .to_string(),
            description: spec.description,
            set_id: spec.set_id,
            cs1: serde_json::to_string(&spec.cs1)
                .ok()
                .map(|s| s.trim_matches('"').to_string()),
            cs2: serde_json::to_string(&spec.cs2)
                .ok()
                .map(|s| s.trim_matches('"').to_string()),
            cs3: serde_json::to_string(&spec.cs3)
                .ok()
                .map(|s| s.trim_matches('"').to_string()),
            set_type: serde_json::to_string(&spec.set_type)
                .unwrap()
                .trim_matches('"')
                .to_string(),
            set_description: spec.set_description,
        })
        .collect()
}

/// License
#[derive(Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct WasmLicense {
    pub id: usize,
    pub file_id: usize,
    pub url: String,
}

/// Get the list of licenses that must be validated from the builder
#[wasm_bindgen]
pub fn gen_licenses(builder: &mut WasmGenBuilder) -> Vec<WasmLicense> {
    builder
        .0
        .licenses()
        .into_iter()
        .map(|license| WasmLicense {
            id: license.id,
            file_id: license.file_id,
            url: license.url,
        })
        .collect()
}

/// Accept a license for a specific file ID
#[wasm_bindgen]
pub fn accept_license(builder: &mut WasmGenBuilder, license: WasmLicense) -> Result<(), String> {
    let license = onerom_gen::License::new(license.id, license.file_id, license.url.clone());
    builder
        .0
        .accept_license(&license)
        .map_err(|e| e.to_string())
}

/// Add a retrieved file to the builder
#[wasm_bindgen]
pub fn gen_add_file(builder: &mut WasmGenBuilder, id: usize, data: Vec<u8>) -> Result<(), String> {
    let file_data = FileData::new(id, data);
    builder.0.add_file(file_data).map_err(|e| e.to_string())
}

/// Build the firmware image from the builder and properties.
/// Properties should be a JS object with shape:
/// {
///   version: {major: u16, minor: u16, patch: u16, build: u16},
///   board: string,
///   serve_alg: string,
///   boot_logging: bool
/// }
#[wasm_bindgen]
pub fn gen_build(builder: &WasmGenBuilder, properties: JsValue) -> Result<WasmImages, String> {
    let props: FirmwareProperties = serde_wasm_bindgen::from_value(properties)
        .map_err(|e| format!("Error deserializing properties: {}", e))?;

    builder
        .0
        .build(props)
        .map(|(firmware_image, metadata_json)| WasmImages(firmware_image, metadata_json))
        .map_err(|e| e.to_string())
}

/// Retrieve the config description from the builder
#[wasm_bindgen]
pub fn gen_description(builder: &WasmGenBuilder) -> String {
    builder.0.description()
}

/// Retrieve any categories
#[wasm_bindgen]
pub fn gen_categories(builder: &WasmGenBuilder) -> Vec<String> {
    builder.0.categories()
}

/// Check whether ready to build
#[wasm_bindgen]
pub fn gen_build_validation(builder: &WasmGenBuilder, properties: JsValue) -> Result<(), String> {
    let props: FirmwareProperties = serde_wasm_bindgen::from_value(properties)
        .map_err(|e| format!("Error deserializing properties: {}", e))?;

    builder
        .0
        .build_validation(&props)
        .map_err(|e| e.to_string())
}

/// A ROM slot whose layout uses a reserved pin, from
/// [`gen_slots_using_reserved_pins`].
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct WasmReservedPinInUse {
    /// The slot's index among ROM slots, plugins not counted.
    pub slot: usize,
    /// The pin's silkscreen label, for example "X1".
    pub pin: String,
}

/// Each ROM slot whose layout uses a reserved pin on the board in
/// `properties`, with the first reserved pin it uses. `properties` is as for
/// [`gen_build`].
///
/// Works before any file is added.
#[wasm_bindgen]
pub fn gen_slots_using_reserved_pins(
    builder: &WasmGenBuilder,
    properties: JsValue,
) -> Result<Vec<WasmReservedPinInUse>, String> {
    let props: FirmwareProperties = serde_wasm_bindgen::from_value(properties)
        .map_err(|e| format!("Error deserializing properties: {}", e))?;

    builder
        .0
        .slots_using_reserved_pins(&props)
        .map(|slots| {
            slots
                .into_iter()
                .map(|(slot, pin)| WasmReservedPinInUse {
                    slot,
                    pin: pin.silkscreen().to_string(),
                })
                .collect()
        })
        .map_err(|e| e.to_string())
}

// ============================================================
// Flash
// ============================================================
//
// Where a build places the firmware and slots on a board's flash chips, and the
// flash operations that program an image file. `onerom-gen` and `onerom-app`
// decide both, so the web programmer lays out and programs an image as the CLI
// does.

/// The flash chips of a board with MCU variant `mcu` and size `board_size`.
fn flash_chips(mcu: &str, board_size: &str) -> Result<FlashChips, String> {
    let variant =
        Variant::try_from_str(mcu).ok_or_else(|| format!("Unknown MCU variant: {mcu}"))?;
    Ok(FlashChips::new(variant, parse_board_size(board_size)?))
}

/// One flash operation from [`flash_plan`].
#[derive(Debug, PartialEq, Eq, Serialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum FlashStepJs {
    /// Erase whole 4KB sectors.
    Erase {
        /// The first address to erase.
        addr: u32,
        /// The bytes to erase.
        len: u32,
    },
    /// Write to erased flash.
    Write {
        /// The first address to write.
        addr: u32,
        /// Where the bytes to write start in the image.
        offset: u32,
        /// The bytes to write.
        len: u32,
    },
}

/// The flash operations that program `image`, an image file, onto a board
/// with MCU variant `mcu` and size `board_size`, in the order to run them.
///
/// Fails with "second_chip_required" where the image uses a second flash chip
/// the board doesn't have, and "too_large" where the image is larger than the
/// board's flash.
#[wasm_bindgen]
pub fn flash_plan(
    image: Vec<u8>,
    mcu: String,
    board_size: String,
) -> Result<Vec<FlashStepJs>, JsValue> {
    flash_steps(&image, &mcu, &board_size).map_err(|e| JsValue::from_str(&e))
}

/// [`flash_plan`] returning its error as a string.
fn flash_steps(image: &[u8], mcu: &str, board_size: &str) -> Result<Vec<FlashStepJs>, String> {
    let chips = flash_chips(mcu, board_size)?;
    let plan = FlashPlan::new(image, &chips).map_err(|e| {
        match e {
            FlashPlanError::SecondChipRequired => "second_chip_required",
            FlashPlanError::TooLarge => "too_large",
        }
        .to_string()
    })?;
    plan.steps()
        .iter()
        .map(|step| match *step {
            FlashStep::Erase { addr, len } => Ok(FlashStepJs::Erase { addr, len }),
            // `data` is a slice of `image`.
            FlashStep::Write { addr, data } => Ok(FlashStepJs::Write {
                addr,
                offset: (data.as_ptr() as usize - image.as_ptr() as usize) as u32,
                len: data.len() as u32,
            }),
            _ => Err("unknown_step".to_string()),
        })
        .collect()
}

/// What a [`FlashSection`] holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "lowercase")]
pub enum FlashSectionKind {
    /// The firmware and its metadata.
    Firmware,
    /// A ROM or plugin slot.
    Slot,
    /// The space left at the end of the first chip where a slot is on the
    /// second chip.
    Unused,
}

/// A section of a [`FlashLayout`].
#[derive(Debug, PartialEq, Eq, Serialize, Tsify)]
pub struct FlashSection {
    /// What the section holds.
    pub kind: FlashSectionKind,
    /// A slot's index in `slot_sizes`. `None` for any other section.
    pub slot: Option<u32>,
    /// The section's start in bytes from the start of the first chip. The
    /// second chip follows the first.
    pub offset: u32,
    /// The section's length in bytes.
    pub len: u32,
}

/// Where a build places the firmware and each slot, for the Builder's
/// capacity bar.
#[derive(Debug, PartialEq, Eq, Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct FlashLayout {
    /// The first chip's length plus the second chip's, where the board has
    /// one.
    pub total: u32,
    /// The sections, in flash order.
    pub sections: Vec<FlashSection>,
    /// The first slot that fits neither chip. `sections` then holds only the
    /// slots before it.
    pub does_not_fit: Option<u32>,
}

/// Where a build places the firmware and each slot on a board with MCU
/// variant `mcu` and size `board_size`.
///
/// `slot_sizes` is every slot's size in config order, plugins first. The slots
/// are placed with the build's own code.
#[wasm_bindgen]
pub fn flash_layout(
    mcu: String,
    board_size: String,
    slot_sizes: Vec<u32>,
) -> Result<FlashLayout, JsValue> {
    layout(&mcu, &board_size, &slot_sizes).map_err(|e| JsValue::from_str(&e))
}

/// [`flash_layout`] returning its error as a string.
fn layout(mcu: &str, board_size: &str, sizes: &[u32]) -> Result<FlashLayout, String> {
    let chips = flash_chips(mcu, board_size)?;
    let (addrs, does_not_fit) = match slot_addresses(&chips, sizes) {
        Ok(addrs) => (addrs, None),
        // Placement is in order, so the slots before this one are where they
        // were without it.
        Err(onerom_gen::Error::SlotDoesNotFit { slot }) => {
            let addrs = slot_addresses(&chips, &sizes[..slot]).map_err(|e| e.to_string())?;
            (addrs, Some(slot as u32))
        }
        Err(e) => return Err(e.to_string()),
    };

    let first = chips.first();
    let first_len = first.end - first.start;
    let second = chips.second();
    let firmware_len = chips.rom_data_start() - first.start;

    // Each chip's slots in address order, which is config order because
    // placement fills each chip from its start.
    let mut on_first = Vec::new();
    let mut on_second = Vec::new();
    for (slot, (&addr, &len)) in addrs.iter().zip(sizes).enumerate() {
        let section = |offset| FlashSection {
            kind: FlashSectionKind::Slot,
            slot: Some(slot as u32),
            offset,
            len,
        };
        match &second {
            Some(chip) if chip.contains(&addr) => {
                on_second.push(section(first_len + (addr - chip.start)))
            }
            _ => on_first.push(section(addr - first.start)),
        }
    }

    let first_used = on_first
        .last()
        .map_or(firmware_len, |section| section.offset + section.len);
    let unused = (!on_second.is_empty() && first_used < first_len).then_some(FlashSection {
        kind: FlashSectionKind::Unused,
        slot: None,
        offset: first_used,
        len: first_len - first_used,
    });

    let firmware = FlashSection {
        kind: FlashSectionKind::Firmware,
        slot: None,
        offset: 0,
        len: firmware_len,
    };
    let sections = core::iter::once(firmware)
        .chain(on_first)
        .chain(unused)
        .chain(on_second)
        .collect();
    Ok(FlashLayout {
        total: first_len + second.map_or(0, |chip| chip.end - chip.start),
        sections,
        does_not_fit,
    })
}
// ============================================================
// Plugins
// ============================================================
//
// Plugin discovery and compatibility selection for the web programmer. The
// heavy lifting lives in `onerom-app`; this layer is a thin WASM binding.
//
// Fetching is delegated back to JavaScript: `PluginCatalog::load` is given a JS
// async callback `(url) => Uint8Array`, wrapped as an `onerom_app::Fetch`
// so `onerom-app` orchestrates the manifest fetches while JS performs them. The
// plugin *binaries* are not fetched here - they are fetched by the existing
// build pipeline (`gen_file_specs` yields a spec per plugin binary URL, which
// JS fetches and passes to `gen_add_file`), with SHA-256 verification done in
// JS against the digest returned by `newest_compatible`.

/// A JavaScript-backed [`onerom_app::Fetch`] implementation.
///
/// Wraps a JS async callback of the form `(url: string) => Promise<Uint8Array>`.
/// Single-threaded (WASM), so the non-`Send` `LocalFetch` variant is used.
struct JsFetch {
    callback: js_sys::Function,
}

impl onerom_app::LocalFetch for JsFetch {
    type Error = String;

    async fn fetch(&self, source: &str) -> Result<Vec<u8>, Self::Error> {
        // Invoke the JS callback with the URL; it returns a Promise.
        let promise = self
            .callback
            .call1(&JsValue::NULL, &JsValue::from_str(source))
            .map_err(|e| format!("plugin fetch callback threw: {e:?}"))?;

        // Await the Promise and interpret the resolved value as a Uint8Array.
        let resolved = wasm_bindgen_futures::JsFuture::from(js_sys::Promise::from(promise))
            .await
            .map_err(|e| format!("plugin fetch failed for {source}: {e:?}"))?;

        Ok(js_sys::Uint8Array::new(&resolved).to_vec())
    }
}

/// Convert an `onerom_app` async error into a JS string error.
fn plugin_err_to_js(e: onerom_app::Error<String>) -> JsValue {
    JsValue::from_str(&e.to_string())
}

/// The compatible release chosen for a plugin, as returned to JavaScript.
///
/// Carries everything the web build path needs: the version to display, the
/// SHA-256 for JS-side verification, and the fully-resolved binary URL to place
/// into the config and fetch.
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct WasmPluginRelease {
    pub version: String,
    pub sha256: String,
    pub url: String,
    pub min_fw_version: String,
}

/// The catalogue of available plugins, with every plugin's releases loaded.
///
/// Constructed by [`plugin_catalog`] (which fetches the manifests through the
/// JS callback). Once built, [`PluginCatalog::plugins`] fills the dropdowns and
/// [`PluginCatalog::newest_compatible`] answers per-selection compatibility
/// queries entirely in memory, with no further fetching.
#[wasm_bindgen]
pub struct PluginCatalog(onerom_app::Catalogue);

#[wasm_bindgen]
impl PluginCatalog {
    /// All plugins, each with its loaded releases, as a JS array.
    ///
    /// Each element has `name`, `plugin_type` (`"system_plugin"`/`"user_plugin"`),
    /// `display_name`, `description`, and `releases` (each with `version`,
    /// `sha256`, `min_fw_version`, `incompatible_from`, ...).
    pub fn plugins(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self.0.plugins())
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// The newest release of `name` compatible with firmware `fw`, or `null`.
    ///
    /// `fw` is a `major.minor.patch` string (the firmware version being built
    /// for). Returns [`WasmPluginRelease`] on success, or JS `null` when the
    /// plugin has no release compatible with `fw`. Errors only if the plugin
    /// name is unknown or `fw` is malformed.
    pub fn newest_compatible(&self, name: String, fw: String) -> Result<JsValue, JsValue> {
        let plugin = self
            .0
            .plugin_by_name(&name)
            .ok_or_else(|| JsValue::from_str(&format!("unknown plugin '{name}'")))?;

        let fw = FirmwareVersion::try_from_str(&fw)
            .map_err(|_| JsValue::from_str("invalid firmware version format"))?;

        match onerom_app::newest_compatible(plugin, &fw) {
            Some(release) => {
                let out = WasmPluginRelease {
                    version: release.version.to_string(),
                    sha256: release.sha256.clone(),
                    url: plugin.binary_url(release),
                    min_fw_version: release.min_fw_version.to_string(),
                };
                serde_wasm_bindgen::to_value(&out).map_err(|e| JsValue::from_str(&e.to_string()))
            }
            None => Ok(JsValue::NULL),
        }
    }
}

/// Fetch the plugin catalogue and every plugin's releases, returning a handle.
///
/// `fetch_callback` is a JS async function `(url: string) => Promise<Uint8Array>`
/// used to fetch the manifests. All fetching happens here, up front; the
/// returned [`PluginCatalog`] then answers queries without further fetching.
#[wasm_bindgen]
pub async fn plugin_catalog(fetch_callback: js_sys::Function) -> Result<PluginCatalog, JsValue> {
    let fetch = JsFetch {
        callback: fetch_callback,
    };

    let mut catalogue = onerom_app::Catalogue::fetch(&fetch)
        .await
        .map_err(plugin_err_to_js)?;

    // Tolerate an individual plugin's releases being unreachable: such plugins
    // keep empty releases (and the JS side omits them from the dropdown, since
    // a plugin with no releases cannot be selected). Only the initial catalogue
    // fetch above is fatal - without it there is nothing to show.
    let _failures = catalogue.load_all_releases_resilient(&fetch).await;

    Ok(PluginCatalog(catalogue))
}
/// A plugin's resolved display information, as returned to JavaScript.
///
/// `label` is always present and displayable: the manifest display name for an
/// official plugin, or the file stem for a local/sideloaded one. `official`
/// distinguishes the two. `version` and `description` are populated only for an
/// official plugin, and only when its release manifest was reachable.
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct WasmPluginLabel {
    /// Human-readable label (manifest display name, or file stem).
    pub label: String,
    /// The image source the device recorded (echoed back for display).
    pub source: String,
    /// Whether this is an official (images.onerom.org manifest) plugin.
    pub official: bool,
    /// Version, for official plugins only.
    pub version: Option<String>,
    /// Description, for official plugins only (when the manifest was reachable).
    pub description: Option<String>,
}

/// Resolve a device plugin slot's image source to display information.
///
/// `slot_index` is the plugin's slot (0 = system, 1 = user); since a device's
/// plugins are reported in slot order, the caller can pass the plugin's index
/// within the plugins list. `source` is the image source the device recorded.
/// `fetch_callback` is a JS async function `(url: string) => Promise<Uint8Array>`,
/// used only for official plugins, to fetch the release manifest for the display
/// name and description.
///
/// The manifest fetch is best-effort: on any failure the label falls back to the
/// slug, so this never rejects on a network error. Returns JS `null` only when
/// `slot_index` is not a plugin slot.
#[wasm_bindgen]
pub async fn resolve_plugin_label(
    slot_index: usize,
    source: String,
    fetch_callback: js_sys::Function,
) -> Result<JsValue, JsValue> {
    let fetch = JsFetch {
        callback: fetch_callback,
    };

    let Some(display) = onerom_app::resolve_plugin_display(slot_index, &source, &fetch).await
    else {
        return Ok(JsValue::NULL);
    };

    let (official, version, description) = match &display.origin {
        onerom_app::PluginOrigin::Manifest { plugin, version } => {
            (true, Some(version.to_string()), plugin.description.clone())
        }
        onerom_app::PluginOrigin::Local { .. } => (false, None, None),
    };

    let out = WasmPluginLabel {
        label: display.display_label().to_string(),
        source,
        official,
        version,
        description,
    };

    serde_wasm_bindgen::to_value(&out).map_err(|e| JsValue::from_str(&e.to_string()))
}
