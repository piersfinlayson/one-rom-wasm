// Copyright (C) 2025 Piers Finlayson <piers@piers.rocks>
//
// MIT License

use serde::Serialize;
use tsify::Tsify;
use wasm_bindgen::prelude::*;

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

    let info = RomTypeInfo {
        name: rom_type.name().to_string(),
        size_bytes: rom_type.size_bytes(),
        rom_pins: rom_type.rom_pins(),
        num_addr_lines: rom_type.num_addr_lines(),
        address_pins,
        data_pins,
        control_lines,
        programming_pins,
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
