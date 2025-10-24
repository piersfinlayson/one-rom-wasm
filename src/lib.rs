// Copyright (C) 2025 Piers Finlayson <piers@piers.rocks>
//
// MIT License

use serde::{Serialize, Deserialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

use onerom_config::fw::FirmwareProperties;
use onerom_gen::{Builder as GenBuilder, FileData};
use sdrr_fw_parser::{Parser, readers::MemoryReader};

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
        sdrr_fw_parser: sdrr_fw_parser::crate_version().to_string(),
        metadata_version: onerom_gen::metadata_version().to_string(),
    }
}

/// Parse a firmware image and return the extracted information as a JSON
/// object.  Either pass in:
/// - A complete .bin file
/// - The first 64KB of a flash dump
/// - The device's entire flash dump
#[wasm_bindgen]
pub async fn parse_firmware(data: Vec<u8>) -> Result<JsValue, JsValue> {
    // We hard-code 0x08000000 as the base address, but the parser
    // automaticaly detects if it's looking at an RP2350 firmware, and adjusts
    // the base address dynamically.
    let mut reader = MemoryReader::new(data, 0x08000000);
    let mut parser = Parser::new(&mut reader);

    let info = parser
        .parse_flash()
        .await
        .map_err(|e| JsValue::from_str(&e))?;

    // Serialize to JSON
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
pub struct RomTypeInfo {
    // Basic metadata
    name: String,
    size_bytes: usize,
    rom_pins: u8,
    num_addr_lines: usize,
    
    // Complete pinout data
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
    line: usize,      // A0, A1, A2, etc.
    pin: u8,          // Physical pin number
}

/// Data pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct DataPin {
    line: usize,      // D0-D7
    pin: u8,
}

/// Control line mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ControlLine {
    name: String,
    pin: u8,
    configurable: bool,  // true = mask-programmable, false = fixed active-low
}

/// Programming pin mapping
#[derive(Serialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct ProgrammingPin {
    name: String,
    pin: u8,
    read_state: String,  // "Vcc", "High", "Low", "ChipSelect"
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
pub fn rom_types() -> Vec<String> {
    onerom_config::rom::ROM_TYPES
        .iter()
        .map(|t| t.name().to_string())
        .collect()
}

/// Return detailed information about a specific ROM type
#[wasm_bindgen]
pub fn rom_type_info(name: String) -> Result<RomTypeInfo, JsValue> {
    let rom_type = onerom_config::rom::RomType::try_from_str(&name)
        .ok_or_else(|| JsValue::from_str(&format!("Unknown ROM type: {}", name)))?;

    let address_pins = rom_type.address_pins()
        .iter()
        .enumerate()
        .map(|(line, &pin)| AddressPin { line, pin })
        .collect();

    let data_pins = rom_type.data_pins()
        .iter()
        .enumerate()
        .map(|(line, &pin)| DataPin { line, pin })
        .collect();

    let control_lines = rom_type.control_lines()
        .iter()
        .map(|cl| ControlLine {
            name: cl.name.to_string(),
            pin: cl.pin,
            configurable: cl.line_type == onerom_config::rom::ControlLineType::Configurable,
        })
        .collect();

    let programming_pins = rom_type.programming_pins().map(|pins| {
        pins.iter()
            .map(|p| ProgrammingPin {
                name: p.name.to_string(),
                pin: p.pin,
                read_state: match p.read_state {
                    onerom_config::rom::ProgrammingPinState::Vcc => "Vcc",
                    onerom_config::rom::ProgrammingPinState::High => "High",
                    onerom_config::rom::ProgrammingPinState::Low => "Low",
                    onerom_config::rom::ProgrammingPinState::ChipSelect => "ChipSelect",
                }.to_string(),
            })
            .collect()
    });

    let power_pins = rom_type.power_pins()
        .iter()
        .map(|p| PowerPin {
            name: p.name.to_string(),
            pin: p.pin,
        })
        .collect();

    let info = RomTypeInfo {
        name: rom_type.name().to_string(),
        size_bytes: rom_type.size_bytes(),
        rom_pins: rom_type.rom_pins(),
        num_addr_lines: rom_type.num_addr_lines(),
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
    rom_pins: u8,
    
    // Pin assignments
    data_pins: Vec<u8>,
    addr_pins: Vec<u8>,
    sel_pins: Vec<u8>,
    pin_status: u8,
    pin_x1: Option<u8>,  // None if not available (255 -> None)
    pin_x2: Option<u8>,
    
    // Port assignments
    port_data: String,
    port_addr: String,
    port_cs: String,
    port_sel: String,
    port_status: String,
    
    // Jumper configuration
    sel_jumper_pull: u8,  // 0=down, 1=up
    x_jumper_pull: u8,
    
    // Capabilities
    has_usb: bool,
    supports_multi_rom_sets: bool,
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
        rom_pins: board.rom_pins(),
        
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
        
        sel_jumper_pull: board.sel_jumper_pull(),
        x_jumper_pull: board.x_jumper_pull(),
        
        has_usb: board.has_usb(),
        supports_multi_rom_sets: board.supports_multi_rom_sets(),
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
            pretty: v.to_string(),  // For now, just use the same string
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
pub struct WasmFileSpec{
    pub id: usize,
    pub source: String,
    pub extract: Option<String>,
    pub size_handling: String,
    pub rom_type: String,
    pub description: Option<String>,
    pub rom_size: usize,
    pub set_id: usize,
    pub cs1: Option<String>,
    pub cs2: Option<String>,
    pub cs3: Option<String>,
    pub set_type: String,
    pub set_description: Option<String>,
}

/// Result of building a firmware image: (firmware_image, metadata_json)
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
#[wasm_bindgen]
pub fn gen_builder_from_json(config_json: &str) -> Result<WasmGenBuilder, String> {
    Ok(WasmGenBuilder(GenBuilder::from_json(config_json)
        .map_err(|e| format!("Error creating GenBuilder: {e:?}"))?))
}

/// Get the list of file specifications from the builder
#[wasm_bindgen]
pub fn gen_file_specs(builder: &WasmGenBuilder) -> Vec<WasmFileSpec> {
    builder.0.file_specs()
        .into_iter()
        .map(|spec| WasmFileSpec {
            id: spec.id,
            source: spec.source,
            extract: spec.extract,
            size_handling: serde_json::to_string(&spec.size_handling).unwrap().trim_matches('"').to_string(),
            rom_size: spec.rom_size,
            rom_type: serde_json::to_string(&spec.rom_type.name()).unwrap().trim_matches('"').to_string(),
            description: spec.description,
            set_id: spec.set_id,
            cs1: serde_json::to_string(&spec.cs1).ok().map(|s| s.trim_matches('"').to_string()),
            cs2: serde_json::to_string(&spec.cs2).ok().map(|s| s.trim_matches('"').to_string()),
            cs3: serde_json::to_string(&spec.cs3).ok().map(|s| s.trim_matches('"').to_string()),
            set_type: serde_json::to_string(&spec.set_type).unwrap().trim_matches('"').to_string(),
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
    builder.0.licenses()
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
    builder.0.accept_license(&license)
        .map_err(|e| format!("Error accepting license: {e:?}"))
}

/// Add a retrieved file to the builder
#[wasm_bindgen]
pub fn gen_add_file(builder: &mut WasmGenBuilder, id: usize, data: Vec<u8>) -> Result<(), String> {
    let file_data = FileData { id, data };
    builder.0.add_file(file_data)
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
    
    builder.0.build(props)
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

    builder.0.build_validation(&props)
        .map_err(|e| format!("Not ready to build: {e:?}"))
}