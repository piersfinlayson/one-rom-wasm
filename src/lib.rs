// Copyright (C) 2025 Piers Finlayson <piers@piers.rocks>
//
// MIT License

use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

use airfrog_rpc::io::Reader;
use onerom_config::fw::{FirmwareProperties, FirmwareVersion};
use onerom_config::mcu::Family;
use onerom_fw_parser::{
    ParsedDevice, Parser, SlotKind, readers::MemoryReader, readers::RegionKind,
};
use onerom_gen::{Builder as GenBuilder, FileData};

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
    /// Plugin entries (system, user), in slot order.
    pub plugins: Vec<RomSummary>,
    /// User ROM entries, in slot order.
    pub roms: Vec<RomSummary>,
    /// For pre-v0.5.0 original firmware read from a partial dump: the full chip
    /// size to re-read, in bytes. `None` otherwise.
    pub full_reread_size: Option<u32>,
    /// Full parse serialised as JSON, for the details view. Externally tagged
    /// by format (`Original` / `Schema`).
    pub dump: String,
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
/// via `Parser::parse_device`.
///
/// The plugin/ROM list comes from flash. Whenever the parser follows a runtime
/// pointer (into RAM), `read_cb` is invoked to fetch those bytes on demand —
/// this is what lets the summary report `running` and mark the active ROM. On a
/// stopped device the runtime magic will not match and the runtime is tolerantly
/// dropped, so the list still parses.
///
/// `read_cb` is a JS `async (addr: number, len: number) => Uint8Array` returning
/// exactly `len` bytes at `addr` (see [`CallbackReader`]).
#[wasm_bindgen]
pub async fn parse_firmware(
    flash: Vec<u8>,
    read_cb: js_sys::Function,
) -> Result<DeviceSummary, JsValue> {
    // 0x08000000 is a placeholder flash base; parse_device detects RP2350
    // firmware and re-bases via Reader::update_base_address. Non-flash reads are
    // served on demand by read_cb.
    let mut reader = CallbackReader::new(flash, 0x08000000, read_cb);
    let mut parser = Parser::new(&mut reader);
    let parsed = parser.parse_device().await;

    device_summary(&parsed).map_err(|e| JsValue::from_str(&e))
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
        version: version_string(dev),
        mcu: dev.mcu_name(),
        model: board.as_ref().map(|b| b.model().to_string()),
        hw_rev: board.as_ref().map(|b| b.name().to_string()),
        corrupt: !parse_errors.is_empty(),
        parse_errors,
        can_run: dev.is_usb_run_capable(),
        running: dev.is_running(),
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
    configurable: bool, // true = mask-programmable, false = fixed active-low
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
            configurable: cl.line_type == onerom_config::chip::ControlLineType::Configurable,
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
        GenBuilder::from_json(version, family, config_json)
            .map_err(|e| format!("Error creating GenBuilder: {e:?}"))?,
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
        .map_err(|e| format!("Error accepting license: {e:?}"))
}

/// Add a retrieved file to the builder
#[wasm_bindgen]
pub fn gen_add_file(builder: &mut WasmGenBuilder, id: usize, data: Vec<u8>) -> Result<(), String> {
    let file_data = FileData { id, data };
    builder
        .0
        .add_file(file_data)
        .map_err(|e| format!("Error adding file: {e:?}"))
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
        .map_err(|e| format!("Error building firmware image: {e:?}"))
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
        .map_err(|e| format!("Not ready to build: {e:?}"))
}
// ============================================================
// Plugins
// ============================================================
//
// Plugin discovery and compatibility selection for the web programmer. The
// heavy lifting lives in `onerom-app`; this layer is a thin WASM binding.
//
// Fetching is delegated back to JavaScript: `PluginCatalog::load` is given a JS
// async callback `(url) => Uint8Array`, wrapped as an `onerom_app::PluginFetch`
// so `onerom-app` orchestrates the manifest fetches while JS performs them. The
// plugin *binaries* are not fetched here - they are fetched by the existing
// build pipeline (`gen_file_specs` yields a spec per plugin binary URL, which
// JS fetches and passes to `gen_add_file`), with SHA-256 verification done in
// JS against the digest returned by `newest_compatible`.

/// A JavaScript-backed [`onerom_app::PluginFetch`] implementation.
///
/// Wraps a JS async callback of the form `(url: string) => Promise<Uint8Array>`.
/// Single-threaded (WASM), so the non-`Send` `LocalPluginFetch` variant is used.
struct JsFetch {
    callback: js_sys::Function,
}

impl onerom_app::LocalPluginFetch for JsFetch {
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