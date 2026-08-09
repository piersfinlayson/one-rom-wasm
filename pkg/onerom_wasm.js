/* @ts-self-types="./onerom_wasm.d.ts" */

/**
 * The catalogue of available plugins, with every plugin's releases loaded.
 *
 * Constructed by [`plugin_catalog`] (which fetches the manifests through the
 * JS callback). Once built, [`PluginCatalog::plugins`] fills the dropdowns and
 * [`PluginCatalog::newest_compatible`] answers per-selection compatibility
 * queries entirely in memory, with no further fetching.
 */
export class PluginCatalog {
    static __wrap(ptr) {
        const obj = Object.create(PluginCatalog.prototype);
        obj.__wbg_ptr = ptr;
        PluginCatalogFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PluginCatalogFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_plugincatalog_free(ptr, 0);
    }
    /**
     * The newest release of `name` compatible with firmware `fw`, or `null`.
     *
     * `fw` is a `major.minor.patch` string (the firmware version being built
     * for). Returns [`WasmPluginRelease`] on success, or JS `null` when the
     * plugin has no release compatible with `fw`. Errors only if the plugin
     * name is unknown or `fw` is malformed.
     * @param {string} name
     * @param {string} fw
     * @returns {any}
     */
    newest_compatible(name, fw) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(fw, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.plugincatalog_newest_compatible(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * All plugins, each with its loaded releases, as a JS array.
     *
     * Each element has `name`, `plugin_type` (`"system_plugin"`/`"user_plugin"`),
     * `display_name`, `description`, and `releases` (each with `version`,
     * `sha256`, `min_fw_version`, `incompatible_from`, ...).
     * @returns {any}
     */
    plugins() {
        const ret = wasm.plugincatalog_plugins(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PluginCatalog.prototype[Symbol.dispose] = PluginCatalog.prototype.free;

export class ValuePrettyPair {
    static __wrap(ptr) {
        const obj = Object.create(ValuePrettyPair.prototype);
        obj.__wbg_ptr = ptr;
        ValuePrettyPairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ValuePrettyPairFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_valueprettypair_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get pretty() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.valueprettypair_pretty(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get value() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.valueprettypair_value(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) ValuePrettyPair.prototype[Symbol.dispose] = ValuePrettyPair.prototype.free;

/**
 * Version information for the various components
 */
export class VersionInfo {
    static __wrap(ptr) {
        const obj = Object.create(VersionInfo.prototype);
        obj.__wbg_ptr = ptr;
        VersionInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VersionInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_versioninfo_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get metadata_version() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.versioninfo_metadata_version(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get onerom_config() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.versioninfo_onerom_config(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get onerom_gen() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.versioninfo_onerom_gen(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get onerom_wasm() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.versioninfo_onerom_wasm(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get sdrr_fw_parser() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.versioninfo_sdrr_fw_parser(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) VersionInfo.prototype[Symbol.dispose] = VersionInfo.prototype.free;

/**
 * Builder for generating firmware images
 */
export class WasmGenBuilder {
    static __wrap(ptr) {
        const obj = Object.create(WasmGenBuilder.prototype);
        obj.__wbg_ptr = ptr;
        WasmGenBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmGenBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmgenbuilder_free(ptr, 0);
    }
}
if (Symbol.dispose) WasmGenBuilder.prototype[Symbol.dispose] = WasmGenBuilder.prototype.free;

/**
 * Result of building a firmware image: (metadata_json, firmware_image)
 */
export class WasmImages {
    static __wrap(ptr) {
        const obj = Object.create(WasmImages.prototype);
        obj.__wbg_ptr = ptr;
        WasmImagesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmImagesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmimages_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get firmware_images() {
        const ret = wasm.wasmimages_firmware_images(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get metadata() {
        const ret = wasm.wasmimages_metadata(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}
if (Symbol.dispose) WasmImages.prototype[Symbol.dispose] = WasmImages.prototype.free;

/**
 * Accept a license for a specific file ID
 * @param {WasmGenBuilder} builder
 * @param {WasmLicense} license
 */
export function accept_license(builder, license) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.accept_license(builder.__wbg_ptr, license);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Return detailed information about a specific PCB/Board
 * @param {string} name
 * @returns {BoardInfo}
 */
export function board_info(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.board_info(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Return a list of supported PCBs/Boards
 * @returns {string[]}
 */
export function boards() {
    const ret = wasm.boards();
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get a list of boards for a specific MCU family
 * @param {string} family_name
 * @returns {ValuePrettyPair[]}
 */
export function boards_for_mcu_family(family_name) {
    const ptr0 = passStringToWasm0(family_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.boards_for_mcu_family(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Return a list of all aliases for all chip types
 * @returns {string[]}
 */
export function chip_type_aliases() {
    const ret = wasm.chip_type_aliases();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Return detailed information about a specific ROM type
 * @param {string} name
 * @returns {ChipTypeInfo}
 */
export function chip_type_info(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.chip_type_info(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Return a list of supported ROM types
 * @returns {string[]}
 */
export function chip_types() {
    const ret = wasm.chip_types();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * @param {string} board_name
 * @returns {string[]}
 */
export function extra_chip_types_for_board(board_name) {
    const ptr0 = passStringToWasm0(board_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.extra_chip_types_for_board(ptr0, len0);
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Return the supported ROM image file formats, in display order.
 * @returns {FileFormatInfo[]}
 */
export function file_formats() {
    const ret = wasm.file_formats();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Add a retrieved file to the builder
 * @param {WasmGenBuilder} builder
 * @param {number} id
 * @param {Uint8Array} data
 */
export function gen_add_file(builder, id, data) {
    _assertClass(builder, WasmGenBuilder);
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.gen_add_file(builder.__wbg_ptr, id, ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Build the firmware image from the builder and properties.
 * Properties should be a JS object with shape:
 * {
 *   version: {major: u16, minor: u16, patch: u16, build: u16},
 *   board: string,
 *   serve_alg: string,
 *   boot_logging: bool
 * }
 * @param {WasmGenBuilder} builder
 * @param {any} properties
 * @returns {WasmImages}
 */
export function gen_build(builder, properties) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_build(builder.__wbg_ptr, properties);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return WasmImages.__wrap(ret[0]);
}

/**
 * Check whether ready to build
 * @param {WasmGenBuilder} builder
 * @param {any} properties
 */
export function gen_build_validation(builder, properties) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_build_validation(builder.__wbg_ptr, properties);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Create a GenBuilder from a JSON configuration string
 *
 * Version: "0.3.4" or "0.5.1.1" format
 * Family: "STM32F4" and "RP2350"
 * @param {string} version
 * @param {string} family
 * @param {string} config_json
 * @returns {WasmGenBuilder}
 */
export function gen_builder_from_json(version, family, config_json) {
    const ptr0 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(family, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.gen_builder_from_json(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return WasmGenBuilder.__wrap(ret[0]);
}

/**
 * Retrieve any categories
 * @param {WasmGenBuilder} builder
 * @returns {string[]}
 */
export function gen_categories(builder) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_categories(builder.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Retrieve the config description from the builder
 * @param {WasmGenBuilder} builder
 * @returns {string}
 */
export function gen_description(builder) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(builder, WasmGenBuilder);
        const ret = wasm.gen_description(builder.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Get the list of file specifications from the builder
 * @param {WasmGenBuilder} builder
 * @returns {WasmFileSpec[]}
 */
export function gen_file_specs(builder) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_file_specs(builder.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get the list of licenses that must be validated from the builder
 * @param {WasmGenBuilder} builder
 * @returns {WasmLicense[]}
 */
export function gen_licenses(builder) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_licenses(builder.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Flash footprint, in bytes, of one image of `chip_type` on `board`.
 *
 * This is the v2 slot size — `2^num_addr_pins * word_bytes` — which is what the
 * ROM Slot Builder's flash-usage tally needs per slot, and the number
 * `docs/COMPATIBILITY.md`'s "Image size" column tabulates. It can far exceed the
 * ROM's own capacity, so it is not the same as `ChipType::size_bytes()`.
 *
 * Computed via `onerom_gen::compat::check_chip_set_on_board` for a single-chip
 * slot, which errors for an unsupported chip/board combination — surfaced here
 * as a clean JS error.
 *
 * `version` is parsed and validated but unused in the maths: the v2 footprint is
 * determined by board + chip alone. It is kept in the signature for API symmetry
 * with the other builder bindings and to leave room for future version-dependent
 * sizing.
 * @param {string} board
 * @param {string} chip_type
 * @param {string} version
 * @returns {number}
 */
export function image_size(board, chip_type, version) {
    const ptr0 = passStringToWasm0(board, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(chip_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.image_size(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
}

/**
 * Initialize logging and panic hook
 */
export function init() {
    wasm.init();
}

/**
 * Get MCU variant (probe-rs) chip ID
 * @param {string} variant_name
 * @returns {string}
 */
export function mcu_chip_id(variant_name) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(variant_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mcu_chip_id(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Return the flash base address for a specific MCU family
 * @param {string} name
 * @returns {number}
 */
export function mcu_flash_base(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mcu_flash_base(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
}

/**
 * Return detailed information about a specific MCU
 * @param {string} name
 * @returns {McuInfo}
 */
export function mcu_info(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mcu_info(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Return a list of supported MCUs
 * @returns {string[]}
 */
export function mcus() {
    const ret = wasm.mcus();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get a list of MCUs for a specific board
 * @param {string} family_name
 * @returns {ValuePrettyPair[]}
 */
export function mcus_for_mcu_family(family_name) {
    const ptr0 = passStringToWasm0(family_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mcus_for_mcu_family(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * The v2 (schema) firmware-version floor, as "major.minor.patch".
 *
 * Sourced from `onerom_metadata::MIN_SCHEMA_VERSION` — the same constant
 * `onerom-fw-parser` branches on to tell v2 firmware from the pre-v0.7.0 layout.
 * The site uses it to gate the firmware-version picker (and the flash-usage
 * tally, which is v2-only) to v2 firmware without hardcoding the version.
 * @returns {string}
 */
export function min_schema_version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.min_schema_version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Parse a firmware image into a [`DeviceSummary`].
 *
 * Accepts a complete `.bin`, the first 64KB of a flash dump, or an entire
 * flash dump. Handles both pre-v0.7.0 (original) and v0.7.0+ (schema) firmware
 * via `Parser::parse_device`.
 *
 * The plugin/ROM list comes from flash. Whenever the parser follows a runtime
 * pointer (into RAM), `read_cb` is invoked to fetch those bytes on demand —
 * this is what lets the summary report `running` and mark the active ROM. On a
 * stopped device the runtime magic will not match and the runtime is tolerantly
 * dropped, so the list still parses.
 *
 * `read_cb` is a JS `async (addr: number, len: number) => Uint8Array` returning
 * exactly `len` bytes at `addr` (see [`CallbackReader`]).
 * @param {Uint8Array} flash
 * @param {Function} read_cb
 * @returns {Promise<DeviceSummary>}
 */
export function parse_firmware(flash, read_cb) {
    const ptr0 = passArray8ToWasm0(flash, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.parse_firmware(ptr0, len0, read_cb);
    return ret;
}

/**
 * Fetch the plugin catalogue and every plugin's releases, returning a handle.
 *
 * `fetch_callback` is a JS async function `(url: string) => Promise<Uint8Array>`
 * used to fetch the manifests. All fetching happens here, up front; the
 * returned [`PluginCatalog`] then answers queries without further fetching.
 * @param {Function} fetch_callback
 * @returns {Promise<PluginCatalog>}
 */
export function plugin_catalog(fetch_callback) {
    const ret = wasm.plugin_catalog(fetch_callback);
    return ret;
}

/**
 * Resolve a device plugin slot's image source to display information.
 *
 * `slot_index` is the plugin's slot (0 = system, 1 = user); since a device's
 * plugins are reported in slot order, the caller can pass the plugin's index
 * within the plugins list. `source` is the image source the device recorded.
 * `fetch_callback` is a JS async function `(url: string) => Promise<Uint8Array>`,
 * used only for official plugins, to fetch the release manifest for the display
 * name and description.
 *
 * The manifest fetch is best-effort: on any failure the label falls back to the
 * slug, so this never rejects on a network error. Returns JS `null` only when
 * `slot_index` is not a plugin slot.
 * @param {number} slot_index
 * @param {string} source
 * @param {Function} fetch_callback
 * @returns {Promise<any>}
 */
export function resolve_plugin_label(slot_index, source, fetch_callback) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.resolve_plugin_label(slot_index, ptr0, len0, fetch_callback);
    return ret;
}

/**
 * Return a list of all aliases for supported chip types
 * @returns {string[]}
 */
export function supported_chip_type_aliases() {
    const ret = wasm.supported_chip_type_aliases();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Return a list of supported ROM types that are supported by the latest
 * version of One ROM
 * @returns {string[]}
 */
export function supported_chip_types() {
    const ret = wasm.supported_chip_types();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * WASM Library Version
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Get version information for the various components
 * @returns {VersionInfo}
 */
export function versions() {
    const ret = wasm.versions();
    return VersionInfo.__wrap(ret);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_408e67f47ca7b58b: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_3890faa6d3ff057d: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_c4ecf48528083721: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_c9c83ebd41b34df3: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_ac983077f137f2e6: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_8ffbbef442139384: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_5e4570eb24ffa122: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_a2790eb24c211ea0: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_e6f02f0ea5f20a32: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_0a18949a61670320: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_acf2776254a8d832: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_136b9679cab35cfb: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_d154f1e671052120: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_be22cc64ae6946a0: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_call_0f2a9af232c18fd2: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.call(arg1, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_call_35dba3c747ad7521: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_debug_3853dbaf0bca30f9: function(arg0) {
            console.debug(arg0);
        },
        __wbg_entries_7774d489e1da5f4f: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_757e9472f8410341: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_error_dd408a7b3cb542dd: function(arg0) {
            console.error(arg0);
        },
        __wbg_get_c0c8f8d7da0c03dd: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_info_726982aff9befe16: function(arg0) {
            console.info(arg0);
        },
        __wbg_instanceof_ArrayBuffer_993d02d2d254cad1: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_f935dbb0aa7cdeed: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isSafeInteger_f3d6cd19ccfe4512: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_length_36bd29c6848c2144: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_ecfa2c63d3d0d82c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_e6372b4fbfc9f81e: function(arg0) {
            console.log(arg0);
        },
        __wbg_new_116be93542d39019: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_77cc4f4f472aeb81: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_ebe3e0f6837f0879: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_typed_cceaf62d8d95e9f2: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_plugincatalog_new: function(arg0) {
            const ret = PluginCatalog.__wrap(arg0);
            return ret;
        },
        __wbg_prototypesetcall_de8e0d9553586985: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_queueMicrotask_ac694eae12e92dfb: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queueMicrotask_be5fe34a8f4cad4d: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_resolve_020f95d838c6ef25: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_a80955eb93b145c6: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_466428f93b4eaa76: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_c7aea38d4de089bc: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_42d4fae05e59267a: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_e0db14a0eba6a812: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_then_7026b513a94278a8: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_72819b8d4e081fb5: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_valueprettypair_new: function(arg0) {
            const ret = ValuePrettyPair.__wrap(arg0);
            return ret;
        },
        __wbg_warn_917d7f727ab78481: function(arg0) {
            console.warn(arg0);
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 278, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___wasm_bindgen_48c654dadb7de768___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_48c654dadb7de768___JsError___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./onerom_wasm_bg.js": import0,
    };
}

function wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___wasm_bindgen_48c654dadb7de768___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_48c654dadb7de768___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___wasm_bindgen_48c654dadb7de768___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_48c654dadb7de768___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_48c654dadb7de768___convert__closures_____invoke___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined___js_sys_b7e3dea873b35267___Function_fn_wasm_bindgen_48c654dadb7de768___JsValue_____wasm_bindgen_48c654dadb7de768___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}

const PluginCatalogFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_plugincatalog_free(ptr, 1));
const ValuePrettyPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_valueprettypair_free(ptr, 1));
const VersionInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_versioninfo_free(ptr, 1));
const WasmGenBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmgenbuilder_free(ptr, 1));
const WasmImagesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmimages_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('onerom_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
