/* tslint:disable */
/* eslint-disable */
/**
 * Initialize logging and panic hook
 */
export function init(): void;
/**
 * WASM Library Version
 */
export function version(): string;
/**
 * Parse a firmware image and return the extracted information as a JSON
 * object.  Either pass in:
 * - A complete .bin file
 * - The first 64KB of a flash dump
 * - The device's entire flash dump
 */
export function parse_firmware(data: Uint8Array): Promise<any>;
/**
 * Return a list of supported MCUs
 */
export function mcus(): string[];
/**
 * Return detailed information about a specific MCU
 */
export function mcu_info(name: string): McuInfo;
/**
 * Return a list of supported ROM types
 */
export function rom_types(): string[];
/**
 * Return detailed information about a specific ROM type
 */
export function rom_type_info(name: string): RomTypeInfo;
/**
 * Return a list of supported PCBs/Boards
 */
export function boards(): string[];
/**
 * Return detailed information about a specific PCB/Board
 */
export function board_info(name: string): BoardInfo;
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
}

/**
 * Address pin mapping
 */
export interface AddressPin {
    line: number;
    pin: number;
}

/**
 * Data pin mapping
 */
export interface DataPin {
    line: number;
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
 * Programming pin mapping
 */
export interface ProgrammingPin {
    name: string;
    pin: number;
    read_state: string;
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


export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly init: () => void;
  readonly version: () => [number, number];
  readonly parse_firmware: (a: number, b: number) => any;
  readonly mcus: () => [number, number];
  readonly mcu_info: (a: number, b: number) => [number, number, number];
  readonly rom_types: () => [number, number];
  readonly rom_type_info: (a: number, b: number) => [number, number, number];
  readonly boards: () => [number, number, number, number];
  readonly board_info: (a: number, b: number) => [number, number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly closure41_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure87_externref_shim: (a: number, b: number, c: any, d: any) => void;
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
