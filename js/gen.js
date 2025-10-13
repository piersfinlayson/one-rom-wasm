import init, { versions, gen_builder_from_json, gen_file_specs, gen_add_file, gen_build, mcu_flash_base, board_info, boards_for_mcu_family, mcus_for_mcu_family, mcu_chip_id } from '../pkg/onerom_wasm.js';
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
const fileContainer = document.getElementById('fileContainer');
const fileSection = document.getElementById('fileSection');
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
    fileContainer.style.display = 'none';
    fileSection.innerHTML = '';
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

        let builder = gen_builder_from_json(configText);

        const fileSpecs = gen_file_specs(builder);

        const html = fileSpecs.map(spec => {
            const rows = [
                createRow('Set ID', spec.set_id),
                createRow('Set Type', spec.set_type),
                spec.set_description ? createRow('Set Description', spec.set_description) : '',
                createRow('ROM ID', spec.id),
                spec.description ? createRow('Description', spec.description) : '',
                createRow('ROM Type', spec.rom_type),
                createRow('Source File', spec.source),
                spec.extract ? createRow('Extract', spec.extract) : '',
                spec.cs1 ? createRow('Chip Select 1', spec.cs1) : '',
                spec.cs2 ? createRow('Chip Select 2', spec.cs2) : '',
                spec.cs3 ? createRow('Chip Select 3', spec.cs3) : '',
                spec.size_handling === 'default' ? '' : createRow('Size Handling', spec.size_handling),
                createRow('ROM Size', `${spec.rom_size} bytes`)
            ].filter(r => r).join('');

            return `<div style="margin-bottom: 20px;">${rows}</div>`;
        }).join('<hr><p></p>');

        fileContainer.style.display = 'block';
        fileSection.innerHTML = html;

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