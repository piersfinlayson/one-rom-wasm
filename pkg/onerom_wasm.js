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
        let ptr0, len0, ptr1, len1;
        try {
            ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(fw, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
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
 * A One ROM or image file loaded into the config that builds it and the bytes
 * of every ROM it serves.
 */
export class WasmLoaded {
    static __wrap(ptr) {
        const obj = Object.create(WasmLoaded.prototype);
        obj.__wbg_ptr = ptr;
        WasmLoadedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmLoadedFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmloaded_free(ptr, 0);
    }
    /**
     * The board's name, for example `fire-24-f`.
     * @returns {string}
     */
    board() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmloaded_board(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The board's [`BoardSize`] name where known. For a file it's the
     * smallest size the image fits.
     * @returns {string | undefined}
     */
    board_size() {
        const ret = wasm.wasmloaded_board_size(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]);
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * The config as JSON. A chip with bytes has a file's name as its `file`,
     * and a published plugin is listed by name.
     * @returns {string}
     */
    config_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmloaded_config_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The bytes of the file named `name`.
     * @param {string} name
     * @returns {Uint8Array | undefined}
     */
    file(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmloaded_file(this.__wbg_ptr, ptr0, len0);
        let v2;
        if (ret[0] !== 0) {
            v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v2;
    }
    /**
     * Each ROM's file, in config order.
     * @returns {WasmLoadedFile[]}
     */
    files() {
        const ret = wasm.wasmloaded_files(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The settings the config couldn't recover.
     * @returns {WasmLoadedProblem[]}
     */
    problems() {
        const ret = wasm.wasmloaded_problems(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The firmware version, `major.minor.patch`.
     * @returns {string}
     */
    version() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmloaded_version(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) WasmLoaded.prototype[Symbol.dispose] = WasmLoaded.prototype.free;

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
 * Find the byte order of a 16-bit ROM image from its first bytes.
 *
 * `data` is a raw binary image. An Intel HEX or S-record file matches
 * nothing. `undefined` where nothing is recognised or the checks disagree.
 * @param {Uint8Array | number[]} data
 * @returns {ByteOrderInfo | undefined}
 */
export function byte_order(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.byte_order(ptr0, len0);
    return ret;
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
 * Where a build places the firmware and each slot on a board with MCU
 * variant `mcu` and size `board_size`.
 *
 * `slot_sizes` is every slot's size in config order, plugins first. The slots
 * are placed with the build's own code.
 * @param {string} mcu
 * @param {string} board_size
 * @param {Uint32Array | number[]} slot_sizes
 * @returns {FlashLayout}
 */
export function flash_layout(mcu, board_size, slot_sizes) {
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passStringToWasm0(mcu, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(board_size, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passArray32ToWasm0(slot_sizes, wasm.__wbindgen_malloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 4, 4); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.flash_layout(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The flash operations that program `image`, an image file, onto a board
 * with MCU variant `mcu` and size `board_size`, in the order to run them.
 *
 * Fails with "second_chip_required" where the image uses a second flash chip
 * the board doesn't have, and "too_large" where the image is larger than the
 * board's flash.
 * @param {Uint8Array | number[]} image
 * @param {string} mcu
 * @param {string} board_size
 * @returns {FlashStepJs[]}
 */
export function flash_plan(image, mcu, board_size) {
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passArray8ToWasm0(image, wasm.__wbindgen_malloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(mcu, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(board_size, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.flash_plan(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v4 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v4;
}

/**
 * Add a retrieved file to the builder
 * @param {WasmGenBuilder} builder
 * @param {number} id
 * @param {Uint8Array | number[]} data
 */
export function gen_add_file(builder, id, data) {
    _assertClass(builder, WasmGenBuilder);
    const val2 = +id;
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.gen_add_file(builder.__wbg_ptr, val2, ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * The firmware image of `base_firmware` plus [`gen_build`]'s metadata and ROM
 * data, checked for the board in `properties`. `properties` is as for
 * [`gen_build`].
 *
 * Fails with the first problem found.
 * @param {any} properties
 * @param {Uint8Array | number[]} base_firmware
 * @param {Uint8Array | number[]} metadata
 * @param {Uint8Array | number[]} roms
 * @returns {Promise<Uint8Array>}
 */
export function gen_assemble(properties, base_firmware, metadata, roms) {
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passArray8ToWasm0(base_firmware, wasm.__wbindgen_malloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passArray8ToWasm0(metadata, wasm.__wbindgen_malloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passArray8ToWasm0(roms, wasm.__wbindgen_malloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.gen_assemble(properties, ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
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
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(family, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
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
 * Each ROM slot whose layout uses a reserved pin on the board in
 * `properties`, with the first reserved pin it uses. `properties` is as for
 * [`gen_build`].
 *
 * Works before any file is added.
 * @param {WasmGenBuilder} builder
 * @param {any} properties
 * @returns {WasmReservedPinInUse[]}
 */
export function gen_slots_using_reserved_pins(builder, properties) {
    _assertClass(builder, WasmGenBuilder);
    const ret = wasm.gen_slots_using_reserved_pins(builder.__wbg_ptr, properties);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * The image select pins the firmware reads on `board` with `reserved`
 * reserved, lowest bit first. Each is a config name, for example "sel_a".
 *
 * `reserved` holds entries as the config's `reserved_pins` does. An entry the
 * board can't reserve fails with onerom-gen's message.
 * @param {string} board
 * @param {string[]} reserved
 * @returns {string[]}
 */
export function image_select_pins(board, reserved) {
    let ptr0, len0, ptr1, len1;
    try {
        ptr0 = passStringToWasm0(board, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passArrayJsValueToWasm0(reserved, wasm.__wbindgen_malloc);
        len1 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr1) { wasm.__externref_drop_slice(ptr1, len1); wasm.__wbindgen_free(ptr1, len1 * 4, 4); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.image_select_pins(ptr0, len0, ptr1, len1);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v3;
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
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passStringToWasm0(board, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(chip_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
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
 * Loads a One ROM.
 *
 * `flash`, `read_cb` and `otp_cb` are as for [`parse_firmware`]. `read_cb`
 * also reads each slot's data from either flash chip. Without `otp_cb` the
 * board size is read from runtime info alone.
 * @param {Uint8Array | number[]} flash
 * @param {Function} read_cb
 * @param {Function | null} [otp_cb]
 * @returns {Promise<WasmLoaded>}
 */
export function load_device(flash, read_cb, otp_cb) {
    const ptr0 = passArray8ToWasm0(flash, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.load_device(ptr0, len0, read_cb, isLikeNone(otp_cb) ? 0 : addToExternrefTable0(otp_cb));
    return ret;
}

/**
 * Loads an image file. A file longer than the first flash chip contains
 * the second chip's contents after the first chip's.
 * @param {Uint8Array | number[]} data
 * @returns {Promise<WasmLoaded>}
 */
export function load_file(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.load_file(ptr0, len0);
    return ret;
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
 * via `Parser::parse_device`, and One ROM Lab via `LabParser`.
 *
 * The plugin/ROM list comes from flash. Whenever the parser follows a runtime
 * pointer (into RAM), `read_cb` is invoked to fetch those bytes on demand —
 * this is what lets the summary report `running` and mark the active ROM. On a
 * stopped device the runtime magic will not match and the runtime is tolerantly
 * dropped, so the list still parses.
 *
 * `read_cb` is a JS `async (addr: number, len: number) => Uint8Array` returning
 * exactly `len` bytes at `addr` (see [`CallbackReader`]).
 *
 * `otp_cb` reads the board's OTP (see [`JsOtp`]). With it the summary has the
 * board's size, from runtime info where One ROM records it and from OTP
 * otherwise, as the CLI reads it. It also has the board type the board is
 * commissioned as. `undefined` leaves both out.
 * @param {Uint8Array | number[]} flash
 * @param {Function} read_cb
 * @param {Function | null} [otp_cb]
 * @returns {Promise<DeviceSummary>}
 */
export function parse_firmware(flash, read_cb, otp_cb) {
    const ptr0 = passArray8ToWasm0(flash, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.parse_firmware(ptr0, len0, read_cb, isLikeNone(otp_cb) ? 0 : addToExternrefTable0(otp_cb));
    return ret;
}

/**
 * Parse an image file into a [`DeviceSummary`].
 *
 * A file longer than the first flash chip holds the second chip's contents
 * after the first chip's. A file whose slots don't match its length or the
 * flash chips is `corrupt`, and the last of its `parse_errors` says why.
 * Otherwise the summary is the one [`parse_firmware`] returns for flash alone.
 * @param {Uint8Array | number[]} data
 * @returns {Promise<DeviceSummary>}
 */
export function parse_image_file(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.parse_image_file(ptr0, len0);
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
    const val2 = +slot_index;
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.resolve_plugin_label(val2, ptr0, len0, fetch_callback);
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
 * Whether firmware `version` supports a `board_size` board ("M" or "L").
 * Firmware before 0.8.0 supports only M.
 * @param {string} version
 * @param {string} board_size
 * @returns {boolean}
 */
export function supports_board_size(version, board_size) {
    let ptr0, len0, ptr1, len1;
    try {
        ptr0 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(board_size, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.supports_board_size(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Whether firmware `version` supports reserved pins.
 * @param {string} version
 * @returns {boolean}
 */
export function supports_reserved_pins(version) {
    const ptr0 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.supports_reserved_pins(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * Whether firmware `version` supports standby mode.
 * @param {string} version
 * @returns {boolean}
 */
export function supports_standby(version) {
    const ptr0 = passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.supports_standby(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
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
        __wbg_Error_208446807d0d1e30: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_ff192a72a0dcdf6d: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_11da4b52cd0aedef: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64((arg0 >>> 0) + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_4f1baf9a00be3c74: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_f249a2a76caa9a55: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_3f58a9d3b3a7eed2: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_5fa10641e039d3ef: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_741ff2bb612836f5: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_8b968c3ab8e96595: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_fc456fee5d3317de: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_be5b34249ff1fc15: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_38d7bfbe4cc84039: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_b2f214e2e4b30e36: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_934b640d0889af78: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64((arg0 >>> 0) + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_7ce8eee7fd327545: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_09736879a3f67559: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_call_275b78b3b6520b92: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            const ret = arg0.call(arg1, arg2, arg3, arg4);
            return ret;
        }, arguments); },
        __wbg_call_a410eb4b59ed5965: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_fc92fee6137d452d: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.call(arg1, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_debug_29e5044b8c3730bb: function(arg0) {
            console.debug(arg0);
        },
        __wbg_entries_7bb1459bd9b5c2b9: function(arg0) {
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
        __wbg_error_d1fc0193610e0e39: function(arg0) {
            console.error(arg0);
        },
        __wbg_get_d7176cfb76d71114: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_fc601247060b7204: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_info_ef9e889444913d2f: function(arg0) {
            console.info(arg0);
        },
        __wbg_instanceof_ArrayBuffer_12cdaa4161423e6b: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_d7aeb0dcb3108fea: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isSafeInteger_1a35ba4d31e71d38: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_length_186163212ffe79c3: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_b03a0fabb109b1e9: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_ff86bbb34c295e21: function(arg0) {
            console.log(arg0);
        },
        __wbg_new_13de428334042d26: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_37eb45aaf5eeb820: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_787b9fb330d55d78: function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_bb74001155cb8ca8: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_cd4348290afae586: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_typed_e09da9dae6ee5935: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined_______true_(a, state0.b, arg0, arg1);
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
        __wbg_prototypesetcall_13162965d1fe7aa3: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_queueMicrotask_1e8503a8a690f0a3: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_4a1a4d8dd332373b: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_resolve_dbf78ab4942478b0: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_2793479888329cb6: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_d2d33b52458e984a: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_e4b9a833d288759a: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_stack_575c4e0918581b9c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_003ee833af9699fc: function() {
            const ret = typeof globalThis === 'undefined' ? undefined : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_e4293fb22cbe77da: function() {
            const ret = typeof global === 'undefined' ? undefined : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_53bb20457401453d: function() {
            const ret = typeof self === 'undefined' ? undefined : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_b5e0810bfecb7feb: function() {
            const ret = typeof window === 'undefined' ? undefined : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_then_656f253a5dd7d8ea: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_e3f7f2d365708be8: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_valueprettypair_new: function(arg0) {
            const ret = ValuePrettyPair.__wrap(arg0);
            return ret;
        },
        __wbg_warn_228ff2257384d295: function(arg0) {
            console.warn(arg0);
        },
        __wbg_wasmloaded_new: function(arg0) {
            const ret = WasmLoaded.__wrap(arg0);
            return ret;
        },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 374, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___wasm_bindgen_d0cceb78ed04714a___JsValue__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_d0cceb78ed04714a___JsError___true_);
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_generic_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_generic_0000000000000005: function(arg0, arg1) {
            var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 1, 1);
            // Cast intrinsic for `Vector(U8) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            table.set(0, undefined);
            table.set(1024, undefined);
            table.set(1025, null);
            table.set(1026, true);
            table.set(1027, false);
        },
    };
    return {
        __proto__: null,
        "./onerom_wasm_bg.js": import0,
    };
}

function wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___wasm_bindgen_d0cceb78ed04714a___JsValue__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_d0cceb78ed04714a___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___wasm_bindgen_d0cceb78ed04714a___JsValue__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_d0cceb78ed04714a___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_d0cceb78ed04714a___convert__closures_____invoke___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined___js_sys_67362eb6f82f5d9b___Function_fn_wasm_bindgen_d0cceb78ed04714a___JsValue_____wasm_bindgen_d0cceb78ed04714a___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
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
const WasmLoadedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmloaded_free(ptr, 1));

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
    switch (typeof val) {
        // primitive types
        case 'number':
        case 'boolean':
        case 'undefined':
        return `${val}`;
        case 'string':
        return JSON.stringify(val);
        case 'bigint':
        return `${val}n`;
        case 'symbol':
        return val.description !== undefined
            ? `Symbol(${val.description})`
            : 'Symbol';
        case 'function':
        return typeof val.name === 'string' && val.name !== ''
            ? `Function(${val.name})`
            : 'Function';
        case 'object': {
            if (val === null) {
                return 'null';
            }
            // objects
            if (Array.isArray(val)) {
                return '[' + Array.from(val, debugString).join(', ') + ']';
            }
            // errors
            if (val instanceof Error) {
                return `${val.name}: ${val.message}\n${val.stack}`;
            }

            const toStringOutput = toString.call(val);
            // Test for built-in
            const className = /\[object ([^\]]+)\]/.exec(toStringOutput)?.[1];

            // Failed to match the standard '[object ClassName]'
            if (className === undefined) {
                return toStringOutput;
            }
            if (className === 'Object') {
                // we're a user defined class or Object
                // JSON.stringify avoids problems with cycles, and is generally much
                // easier than looping through ownProperties of `val`.
                try {
                    return 'Object(' + JSON.stringify(val) + ')';
                } catch (_) {
                    return 'Object';
                }
            }
            // TODO we could test for more things here, like `Set`s and `Map`s.
            return className;
        }
        // Per MDN: 'This list of values is exhaustive.'
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description
    }
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
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
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

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
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

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
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
    cachedUint32ArrayMemory0 = null;
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

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (__wbg_init_promise === undefined) {
        __wbg_init_promise = __wbg_init_once(module_or_path);
        __wbg_init_promise.catch(() => { __wbg_init_promise = undefined; });
    }
    return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {

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
