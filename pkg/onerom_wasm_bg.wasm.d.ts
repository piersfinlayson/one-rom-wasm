/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const init: () => void;
export const version: () => [number, number];
export const parse_firmware: (a: number, b: number) => any;
export const mcus: () => [number, number];
export const mcu_info: (a: number, b: number) => [number, number, number];
export const rom_types: () => [number, number];
export const rom_type_info: (a: number, b: number) => [number, number, number];
export const boards: () => [number, number, number, number];
export const board_info: (a: number, b: number) => [number, number, number];
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_export_4: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_export_6: WebAssembly.Table;
export const __externref_drop_slice: (a: number, b: number) => void;
export const __externref_table_dealloc: (a: number) => void;
export const closure41_externref_shim: (a: number, b: number, c: any) => void;
export const closure87_externref_shim: (a: number, b: number, c: any, d: any) => void;
export const __wbindgen_start: () => void;
