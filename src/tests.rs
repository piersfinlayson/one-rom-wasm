// Copyright (C) 2026 Piers Finlayson <piers@piers.rocks>
//
// MIT License

//! Tests of loading a firmware file or a One ROM.

use onerom_config::fw::{FirmwareProperties, FirmwareVersion, ServeAlg};
use onerom_config::hw::{Board, BoardSize};
use onerom_config::mcu::{Family, Variant};
use onerom_fw_parser::SDRR_INFO_FW_OFFSET;
use onerom_gen::{Builder, FIRMWARE_SIZE, FileData, MAX_METADATA_LEN};
use onerom_metadata::{
    FLASH_CS0_BASE_ADDR, FirmwareType, METADATA_BASE, ONEROM_FAMILY_MAGIC,
    ONEROM_INFO_BUILD_DATE_OFFSET, ONEROM_INFO_FIRMWARE_TYPE_OFFSET, ONEROM_INFO_METADATA_OFFSET,
    ONEROM_INFO_MINOR_VERSION_OFFSET, ONEROM_INFO_VERSION, ONEROM_INFO_VERSION_OFFSET,
};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::wasm_bindgen_test;

use crate::{WasmLoaded, load_device, load_file};

const VERSION: FirmwareVersion = FirmwareVersion::new(0, 8, 0, 0);
const BOARD: Board = Board::Fire24E;

const CONFIG: &str = r#"{
    "version": 1,
    "description": "Load",
    "chip_sets": [
        {
            "type": "single",
            "chips": [{ "file": "a.rom", "type": "2364", "cs1": "active_low" }]
        },
        {
            "type": "multi",
            "chips": [
                { "file": "b.rom", "type": "2364", "cs1": "active_high" },
                { "file": "c.rom", "type": "2364", "cs1": "active_high" }
            ]
        }
    ]
}"#;

/// A `read_cb` body serving each read from the image.
const SERVE: &str = "return Promise.resolve(image.slice(addr - base, addr - base + len))";

/// The bytes of the file `name`. Each depends on every address bit.
fn rom(name: &str) -> Vec<u8> {
    let seed = name
        .bytes()
        .fold(0u32, |seed, byte| seed.wrapping_mul(31) ^ u32::from(byte));
    (0..0x2000u32)
        .map(|addr| (addr.wrapping_add(seed).wrapping_mul(2_654_435_761) >> 24) as u8)
        .collect()
}

/// Base firmware that is a bare `onerom_info_t` pointing at the metadata.
fn base_firmware() -> Vec<u8> {
    let mut image = vec![0u8; 0x1000];
    let base = SDRR_INFO_FW_OFFSET as usize;
    let mut put = |offset: usize, bytes: &[u8]| {
        image[base + offset..base + offset + bytes.len()].copy_from_slice(bytes);
    };
    put(0, ONEROM_FAMILY_MAGIC.as_bytes());
    put(
        ONEROM_INFO_MINOR_VERSION_OFFSET,
        &VERSION.minor().to_le_bytes(),
    );
    // The build date, in the zeroed page after the header.
    put(
        ONEROM_INFO_BUILD_DATE_OFFSET,
        &(FLASH_CS0_BASE_ADDR + 0x800).to_le_bytes(),
    );
    put(ONEROM_INFO_METADATA_OFFSET, &METADATA_BASE.to_le_bytes());
    put(
        ONEROM_INFO_VERSION_OFFSET,
        &ONEROM_INFO_VERSION.to_le_bytes(),
    );
    put(
        ONEROM_INFO_FIRMWARE_TYPE_OFFSET,
        &(FirmwareType::FirmwareTypeOneRom as u16).to_le_bytes(),
    );
    image
}

fn v0_6_0_firmware() -> Vec<u8> {
    let mut image = vec![0u8; 0x1000];
    let base = SDRR_INFO_FW_OFFSET as usize;
    image[base..base + 4].copy_from_slice(b"SDRR");
    image[base + 6..base + 8].copy_from_slice(&6u16.to_le_bytes());
    image
}

fn props() -> FirmwareProperties {
    FirmwareProperties::new(VERSION, BOARD, Variant::RP2350, ServeAlg::Default, false)
        .unwrap()
        .with_board_size(BoardSize::M)
}

/// The metadata and ROM data `config` builds, with each file's bytes from
/// `file`.
fn build(config: &str, file: impl Fn(&str) -> Vec<u8>) -> (Vec<u8>, Vec<u8>) {
    let mut builder = Builder::from_json(VERSION, Family::Rp2350, config).unwrap();
    for spec in builder.file_specs() {
        builder
            .add_file(FileData::new(spec.id, file(&spec.source)))
            .unwrap();
    }
    builder.build(props()).unwrap()
}

/// The image file `CONFIG` builds.
async fn image() -> Vec<u8> {
    let (metadata, roms) = build(CONFIG, rom);
    let checked = onerom_app::assemble_image(&props(), base_firmware(), metadata, roms)
        .await
        .unwrap();
    assert!(checked.problems.is_empty(), "{:?}", checked.problems);
    checked.image
}

/// `image`'s firmware and metadata, without its ROM data.
fn flash_without_roms(image: &[u8]) -> Vec<u8> {
    image[..FIRMWARE_SIZE + MAX_METADATA_LEN].to_vec()
}

/// A `read_cb` running `body` on `addr` and `len`. `image` and `base`, the
/// address `image` starts at, are in scope.
fn read_cb(image: &[u8], body: &str) -> js_sys::Function {
    js_sys::Function::new_with_args("image, base, addr, len", body)
        .bind2(
            &JsValue::NULL,
            &js_sys::Uint8Array::from(image),
            &JsValue::from(FLASH_CS0_BASE_ADDR),
        )
        .unchecked_into()
}

/// An `otp_cb` reading blank OTP.
fn blank_otp_cb() -> js_sys::Function {
    js_sys::Function::new_with_args(
        "row, count, ecc",
        "return Promise.resolve(new Uint8Array(count * (ecc ? 2 : 4)))",
    )
}

/// Everything JS reads from `loaded`.
fn contents(loaded: &WasmLoaded) -> serde_json::Value {
    let files = loaded.files();
    let data: Vec<_> = files
        .iter()
        .map(|file| loaded.file(file.name.clone()))
        .collect();
    serde_json::json!({
        "version": loaded.version(),
        "board": loaded.board(),
        "board_size": loaded.board_size(),
        "config": loaded.config_json().unwrap(),
        "files": files,
        "data": data,
        "problems": loaded.problems(),
    })
}

#[wasm_bindgen_test]
async fn load_file_recovers_the_config_and_roms() {
    let loaded = load_file(image().await).await.unwrap();
    assert_eq!(loaded.version(), "0.8.0");
    assert_eq!(loaded.board(), BOARD.name());
    assert_eq!(loaded.board_size().as_deref(), Some("M"));
    assert!(loaded.problems().is_empty());

    let roms: Vec<_> = loaded
        .files()
        .into_iter()
        .map(|file| (file.slot, file.chip, loaded.file(file.name)))
        .collect();
    assert!(
        roms == [
            (Some(0), 0, Some(rom("a.rom"))),
            (Some(1), 0, Some(rom("b.rom"))),
            (Some(1), 1, Some(rom("c.rom"))),
        ],
        "the ROMs differ"
    );

    let config = loaded.config_json().unwrap();
    let rebuilt = build(&config, |name| loaded.file(name.to_string()).unwrap());
    assert!(rebuilt == build(CONFIG, rom), "the rebuilt image differs");
}

#[wasm_bindgen_test]
async fn load_file_fails_on_other_data() {
    assert!(load_file(vec![0xff; 0x10000]).await.is_err());
}

#[wasm_bindgen_test]
async fn load_file_fails_on_firmware_before_v0_7_0() {
    let error = load_file(v0_6_0_firmware()).await.err().unwrap();
    assert!(error.as_string().unwrap().contains("0.6.0"), "{error:?}");
}

/// Firmware newer than this build supports fails with its version in
/// `firmware_too_new`. Other failures don't have one.
#[wasm_bindgen_test]
async fn load_file_fails_on_newer_firmware_with_its_version() {
    let firmware_too_new = |error: &JsValue| {
        js_sys::Reflect::get(error, &JsValue::from_str("firmware_too_new"))
            .ok()
            .and_then(|version| version.as_string())
    };
    let mut newer = base_firmware();
    let at = SDRR_INFO_FW_OFFSET as usize + ONEROM_INFO_MINOR_VERSION_OFFSET;
    newer[at..at + 2].copy_from_slice(&9u16.to_le_bytes());
    let error = load_file(newer).await.err().unwrap();
    assert_eq!(firmware_too_new(&error).as_deref(), Some("0.9.0"));

    let error = load_file(v0_6_0_firmware()).await.err().unwrap();
    assert_eq!(firmware_too_new(&error), None);
}

#[wasm_bindgen_test]
async fn load_device_matches_load_file() {
    let image = image().await;
    let device = load_device(
        flash_without_roms(&image),
        read_cb(&image, SERVE),
        Some(blank_otp_cb()),
    )
    .await
    .unwrap();
    let file = load_file(image).await.unwrap();
    assert!(
        contents(&device) == contents(&file),
        "the device and file differ"
    );
}

#[wasm_bindgen_test]
async fn load_device_without_otp_cb_has_no_board_size() {
    let image = image().await;
    let device = load_device(flash_without_roms(&image), read_cb(&image, SERVE), None)
        .await
        .unwrap();
    assert_eq!(device.board_size(), None);
}

#[wasm_bindgen_test]
async fn load_device_fails_on_a_failed_read() {
    let image = image().await;
    for body in [
        "throw new Error('unreadable')",
        "return Promise.reject(new Error('unreadable'))",
        "return Promise.resolve(image.slice(addr - base, addr - base + len - 1))",
    ] {
        let result = load_device(flash_without_roms(&image), read_cb(&image, body), None).await;
        assert!(result.is_err(), "{body}");
    }
}
