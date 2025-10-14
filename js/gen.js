import init, { versions, gen_builder_from_json, gen_description, gen_file_specs, gen_add_file, gen_build, gen_build_validation, gen_licenses, mcu_flash_base, board_info, boards_for_mcu_family, mcus_for_mcu_family, mcu_chip_id } from '../pkg/onerom_wasm.js';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

await init();

function updateVersions() {
    const versionInfo = versions();
    document.getElementById('metadataVersion').textContent = versionInfo.metadata_version;
    document.getElementById('wasmVersion').textContent = versionInfo.onerom_wasm;
    document.getElementById('configVersion').textContent = versionInfo.onerom_config;
    document.getElementById('genVersion').textContent = versionInfo.onerom_gen;
    document.getElementById('parserVersion').textContent = versionInfo.sdrr_fw_parser;
}
updateVersions();

// Initialize UI elements before used
let configText = "";
const parseBtn = document.getElementById('parseBtn');
const modelDropdown = document.getElementById('oneromModel');
const boardDropdown = document.getElementById('oneromBoard');
const mcuDropdown = document.getElementById('oneromMcu');
const descContainer = document.getElementById('descContainer');
const descSection = document.getElementById('descSection');
const metadataContainer = document.getElementById('metadataContainer');
const metadataSection = document.getElementById('metadataSection');
const imageDataContainer = document.getElementById('imageDataContainer');
const imageDataSection = document.getElementById('imageDataSection');
const flashingContainer = document.getElementById('flashingContainer');
const flashingSection = document.getElementById('flashingSection');

modelDropdown.addEventListener('change', (event) => {
    const selectedModel = event.target.value;

    // Clear existing options except the first (placeholder)
    boardDropdown.innerHTML = '<option value="">Select Board</option>';
    mcuDropdown.innerHTML = '<option value="">Select MCU</option>';

    if (selectedModel) {
        const boards = boards_for_mcu_family(selectedModel);
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.value;
            option.textContent = board.pretty;
            boardDropdown.appendChild(option);
        });

        const mcus = mcus_for_mcu_family(selectedModel);
        mcus.forEach(mcu => {
            const option = document.createElement('option');
            option.value = mcu.value;
            option.textContent = mcu.pretty;
            mcuDropdown.appendChild(option);
        });
    } else {
        boardDropdown.innerHTML = '<option value="">...</option>';
        mcuDropdown.innerHTML = '<option value="">...</option>';        
    }
});

function updateStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
}

function updateParseButton() {
    parseBtn.disabled = !(boardDropdown.value && mcuDropdown.value);
    if (parseBtn.disabled) {
        updateStatus("Select One ROM Model, Board and MCU");
    } else if (configText.trim() === "") {
            updateStatus("Enter your One ROM runtime JSON configuration above");
            parseBtn.disabled = true;
    } else {
        clearPreviousResults();
        updateStatus("Ready to generate metadata");
    }
}

boardDropdown.addEventListener('change', updateParseButton);
mcuDropdown.addEventListener('change', updateParseButton);
configInput.addEventListener('input', (event) => {
    configText = event.target.value;
    updateParseButton();
});

function waitForRepaint() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

function formatHexDump(data, offset = 0) {
    const lines = [];
    for (let i = 0; i < data.length; i += 16) {
        const chunk = data.slice(i, Math.min(i + 16, data.length));
        const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = Array.from(chunk).map(b => {
            if (b >= 32 && b < 127) {
                const c = String.fromCharCode(b);
                if (c === '<') return '&lt;';
                if (c === '>') return '&gt;';
                if (c === '&') return '&amp;';
                return c;
            }
            return '.';
        }).join('');
        lines.push(`${(i + offset).toString(16).padStart(8, '0')}: ${hex.padEnd(48, ' ')}  ${ascii}`);
    }
    return lines.join('\n');
}

function downloadBinary(data, filename) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function createRow(label, value) {
    return `<div style="display: flex;"><span style="min-width: 140px; flex-shrink: 0;">${label}:</span><span style="word-break: break-all;">${value}</span></div>`;
}

function clearPreviousResults() {
    descContainer.style.display = 'none';
    descSection.innerHTML = '';
    metadataContainer.style.display = 'none';
    metadataSection.innerHTML = '';
    imageDataContainer.style.display = 'none';
    imageDataSection.innerHTML = '';
    flashingContainer.style.display = 'none';
    flashingSection.innerHTML = '';
}

parseBtn.addEventListener('click', async () => {
    if (!mcuDropdown.value) {
        updateStatus('Select MCU first');
        return;
    }
    if (!boardDropdown.value) {
        updateStatus('Select Board first');
        return;
    }

    parseBtn.disabled = true;

    // Get hardware properties
    const boardType = boardDropdown.value;
    const firmwareProperties = {
        version: { major: 0, minor: 5, patch: 1, build: 0 },
        board: boardType,
        mcu_variant: mcuDropdown.value,
        serve_alg: "default",
        boot_logging: true
    };
    let flashBase = 0;
    try {
        let boardInfo = board_info(boardType);
        let mcuFamily = boardInfo.mcu_family;
        flashBase = mcu_flash_base(mcuFamily);
    } catch (e) {
        console.warn(`Failed to get flash base: ${e}`);
    }

    updateStatus("Starting...");

    clearPreviousResults();


    await waitForRepaint();

    try {
        updateStatus("Parsing config...");

        // Create a new builder from the JSON configuration - this parses the
        // configuration and throw an error if invalid
        let builder = gen_builder_from_json(configText);

        // Get the config description from the builder and display it
        const description = gen_description(builder);
        descContainer.style.display = 'block';
        descSection.innerHTML = description;

        // Check for licenses - currently we do not support accepting licenses
        const license = gen_licenses(builder);
        if (license.length > 0) {
            throw new Error("License acceptance required - currently unsupported");
        }

        // Download and add all required files to the builder
        updateStatus("Downloading source files...");
        const fileSpecs = gen_file_specs(builder);
        for (const spec of fileSpecs) {
            let url = spec.source;

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error(`Source must be HTTP(S) URL: ${url}`);
            }

            url = url.replace(/^https?:\/\/(www\.)?zimmers\.net\//, 'https://github-cors.piers.rocks/zimmers/');

            updateStatus(`Downloading ${spec.source}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${spec.source}: ${response.status} ${response.statusText}`);
                }

                let data = new Uint8Array(await response.arrayBuffer());

                if (spec.extract) {
                    updateStatus(`Extracting ${spec.extract}...`);
                    const zip = await JSZip.loadAsync(data);
                    const file = zip.file(spec.extract);
                    if (!file) throw new Error(`File ${spec.extract} not found in zip`);
                    data = new Uint8Array(await file.async('arraybuffer'));
                }

                gen_add_file(builder, spec.id, data);
            } catch (e) {
                if (e.name === 'AbortError') {
                    throw new Error(`Timeout fetching ${spec.source} after 10 seconds`);
                }
                throw e;
            }
        }

        // Check whether ready to build
        updateStatus("Final validation...");
        gen_build_validation(builder, firmwareProperties);

        // Build the firmware and get the resulting data arrays
        updateStatus("Building metadata...");
        const images = gen_build(builder, firmwareProperties);
        const metadata = images.metadata;
        const firmware = images.firmware_images;

        // Display metadata
        metadataContainer.querySelector('h3').textContent = `Metadata (${metadata.length} bytes)`;
        document.getElementById('downloadMetadata').onclick = () => downloadBinary(metadata, `metadata.bin`);
        metadataSection.innerHTML = formatHexDump(metadata, flashBase + 0xC000);
        metadataContainer.style.display = 'block';

        // Display firmware image
        imageDataContainer.querySelector('h3').textContent = `Image Data (${firmware.length} bytes)`;
        document.getElementById('downloadImageData').onclick = () => downloadBinary(firmware, `image_data.bin`);
        imageDataSection.innerHTML = formatHexDump(firmware, flashBase + 0x10000);
        imageDataContainer.style.display = 'block';

        // Generate flashing instructions
        updateStatus("Generation flashing instructions...");
        const chip_id = mcu_chip_id(mcuDropdown.value);
        let probeRsCommands = `# Download metadata and image data and then flash to device:
probe-rs download --chip ${chip_id} --binary-format bin --base-address 0x${(flashBase + 0xC000).toString(16)} metadata.bin
probe-rs download --chip ${chip_id} --binary-format bin --base-address 0x${(flashBase + 0x10000).toString(16)} image_data.bin

# Reset the device
probe-rs reset --chip ${chip_id}`;
        flashingSection.innerHTML = probeRsCommands;
        flashingContainer.style.display = 'block';

        // We're done
        updateStatus("Generation complete");
    }
    catch (e) {
        updateStatus(`Error: ${e}`);
    }

    parseBtn.disabled = false;

    return;
});