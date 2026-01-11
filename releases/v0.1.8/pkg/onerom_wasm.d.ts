/* tslint:disable */
/* eslint-disable */
/**
 * Programming pin mapping
 */
export interface ProgrammingPin {
    name: string;
    pin: number;
    read_state: string;
}

/**
 * Detailed ROM type information structure
 */
export interface RomTypeInfo {
    name: string;
    size_bytes: number;
    rom_pins: number;
    num_addr_lines: number;
    address_pins: AddressPin[];
    data_pins: DataPin[];
    control_lines: ControlLine[];
    programming_pins: ProgrammingPin[] | undefined;
    power_pins: PowerPin[];
}

/**
 * Data pin mapping
 */
export interface DataPin {
    line: number;
    pin: number;
}

/**
 * Specification for a file that needs to be retrieved and added to the builder
 */
export interface WasmFileSpec {
    id: number;
    source: string;
    extract: string | undefined;
    size_handling: string;
    rom_type: string;
    description: string | undefined;
    rom_size: number;
    set_id: number;
    cs1: string | undefined;
    cs2: string | undefined;
    cs3: string | undefined;
    set_type: string;
    set_description: string | undefined;
}

/**
 * Power pin mapping
 */
export interface PowerPin {
    name: string;
    pin: number;
}

/**
 * Control line mapping
 */
export interface ControlLine {
    name: string;
    pin: number;
    configurable: boolean;
}

/**
 * Basic MCU information structure
 */
export interface McuInfo {
    name: string;
    family: string;
    flash_kb: number;
    ram_kb: number;
    ccm_ram_kb: number | undefined;
    max_sysclk_mhz: number;
    supports_usb_dfu: boolean;
    supports_banked_roms: boolean;
    supports_multi_rom_sets: boolean;
}

/**
 * Address pin mapping
 */
export interface AddressPin {
    line: number;
    pin: number;
}

/**
 * License
 */
export interface WasmLicense {
    id: number;
    file_id: number;
    url: string;
}

/**
 * One ROM PCB/Board information structure
 */
export interface BoardInfo {
    name: string;
    description: string;
    mcu_family: string;
    rom_pins: number;
    data_pins: number[];
    addr_pins: number[];
    sel_pins: number[];
    pin_status: number;
    pin_x1: number | undefined;
    pin_x2: number | undefined;
    port_data: string;
    port_addr: string;
    port_cs: string;
    port_sel: string;
    port_status: string;
    sel_jumper_pull: number;
    x_jumper_pull: number;
    has_usb: boolean;
    supports_multi_rom_sets: boolean;
}


export class ValuePrettyPair {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly value: string;
  readonly pretty: string;
}

export class VersionInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly onerom_gen: string;
  readonly onerom_wasm: string;
  readonly onerom_config: string;
  readonly sdrr_fw_parser: string;
  readonly metadata_version: string;
}

export class WasmGenBuilder {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
}

export class WasmImages {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly firmware_images: Uint8Array;
  readonly metadata: Uint8Array;
}

/**
 * Accept a license for a specific file ID
 */
export function accept_license(builder: WasmGenBuilder, license: WasmLicense): void;

/**
 * Return detailed information about a specific PCB/Board
 */
export function board_info(name: string): BoardInfo;

/**
 * Return a list of supported PCBs/Boards
 */
export function boards(): string[];

/**
 * Get a list of boards for a specific MCU family
 */
export function boards_for_mcu_family(family_name: string): ValuePrettyPair[];

/**
 * Add a retrieved file to the builder
 */
export function gen_add_file(builder: WasmGenBuilder, id: number, data: Uint8Array): void;

/**
 * Build the firmware image from the builder and properties.
 * Properties should be a JS object with shape:
 * {
 *   version: {major: u16, minor: u16, patch: u16, build: u16},
 *   board: string,
 *   serve_alg: string,
 *   boot_logging: bool
 * }
 */
export function gen_build(builder: WasmGenBuilder, properties: any): WasmImages;

/**
 * Check whether ready to build
 */
export function gen_build_validation(builder: WasmGenBuilder, properties: any): void;

/**
 * Create a GenBuilder from a JSON configuration string
 */
export function gen_builder_from_json(config_json: string): WasmGenBuilder;

/**
 * Retrieve any categories
 */
export function gen_categories(builder: WasmGenBuilder): string[];

/**
 * Retrieve the config description from the builder
 */
export function gen_description(builder: WasmGenBuilder): string;

/**
 * Get the list of file specifications from the builder
 */
export function gen_file_specs(builder: WasmGenBuilder): WasmFileSpec[];

/**
 * Get the list of licenses that must be validated from the builder
 */
export function gen_licenses(builder: WasmGenBuilder): WasmLicense[];

/**
 * Initialize logging and panic hook
 */
export function init(): void;

/**
 * Get MCU variant (probe-rs) chip ID
 */
export function mcu_chip_id(variant_name: string): string;

/**
 * Return the flash base address for a specific MCU family
 */
export function mcu_flash_base(name: string): number;

/**
 * Return detailed information about a specific MCU
 */
export function mcu_info(name: string): McuInfo;

/**
 * Return a list of supported MCUs
 */
export function mcus(): string[];

/**
 * Get a list of MCUs for a specific board
 */
export function mcus_for_mcu_family(family_name: string): ValuePrettyPair[];

/**
 * Parse a firmware image and return the extracted information as a JSON
 * object.  Either pass in:
 * - A complete .bin file
 * - The first 64KB of a flash dump
 * - The device's entire flash dump
 */
export function parse_firmware(data: Uint8Array): Promise<any>;

/**
 * Return detailed information about a specific ROM type
 */
export function rom_type_info(name: string): RomTypeInfo;

/**
 * Return a list of supported ROM types
 */
export function rom_types(): string[];

/**
 * WASM Library Version
 */
export function version(): string;

/**
 * Get version information for the various components
 */
export function versions(): VersionInfo;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_valueprettypair_free: (a: number, b: number) => void;
  readonly __wbg_versioninfo_free: (a: number, b: number) => void;
  readonly __wbg_wasmgenbuilder_free: (a: number, b: number) => void;
  readonly __wbg_wasmimages_free: (a: number, b: number) => void;
  readonly accept_license: (a: number, b: any) => [number, number];
  readonly board_info: (a: number, b: number) => [number, number, number];
  readonly boards: () => [number, number, number, number];
  readonly boards_for_mcu_family: (a: number, b: number) => [number, number, number, number];
  readonly gen_add_file: (a: number, b: number, c: number, d: number) => [number, number];
  readonly gen_build: (a: number, b: any) => [number, number, number];
  readonly gen_build_validation: (a: number, b: any) => [number, number];
  readonly gen_builder_from_json: (a: number, b: number) => [number, number, number];
  readonly gen_categories: (a: number) => [number, number];
  readonly gen_description: (a: number) => [number, number];
  readonly gen_file_specs: (a: number) => [number, number];
  readonly gen_licenses: (a: number) => [number, number];
  readonly init: () => void;
  readonly mcu_chip_id: (a: number, b: number) => [number, number, number, number];
  readonly mcu_flash_base: (a: number, b: number) => [number, number, number];
  readonly mcu_info: (a: number, b: number) => [number, number, number];
  readonly mcus: () => [number, number];
  readonly mcus_for_mcu_family: (a: number, b: number) => [number, number, number, number];
  readonly parse_firmware: (a: number, b: number) => any;
  readonly rom_type_info: (a: number, b: number) => [number, number, number];
  readonly rom_types: () => [number, number];
  readonly valueprettypair_pretty: (a: number) => [number, number];
  readonly valueprettypair_value: (a: number) => [number, number];
  readonly version: () => [number, number];
  readonly versioninfo_metadata_version: (a: number) => [number, number];
  readonly versioninfo_onerom_config: (a: number) => [number, number];
  readonly versioninfo_onerom_gen: (a: number) => [number, number];
  readonly versioninfo_onerom_wasm: (a: number) => [number, number];
  readonly versioninfo_sdrr_fw_parser: (a: number) => [number, number];
  readonly versions: () => number;
  readonly wasmimages_firmware_images: (a: number) => [number, number];
  readonly wasmimages_metadata: (a: number) => [number, number];
  readonly wasm_bindgen__convert__closures_____invoke__h07e2717fee435e78: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__h811a89cf6c3bd861: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h3df7dd4fa1b24816: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
