import init, { version, rom_types, rom_type_info, mcus, mcu_info, boards, board_info, parse_firmware } from '../../pkg/onerom_wasm.js';

await init();

// Display library version
document.getElementById('version').textContent = version();

// Display supported ROM types
const romList = document.getElementById('romList');
const roms_list = rom_types();
const sorted_roms = roms_list.sort((a, b) => {
    const a_is_23 = a.startsWith('23');
    const b_is_23 = b.startsWith('23');
    
    if (a_is_23 && !b_is_23) return -1;
    if (!a_is_23 && b_is_23) return 1;
    
    // Within same series, sort by size
    return parseInt(a.replace(/^2[37]/, '')) - parseInt(b.replace(/^2[37]/, ''));
});
sorted_roms.forEach(rom => {
    const info = rom_type_info(rom);
    const row = document.createElement('tr');
    
    // Format control lines info
    const controlLines = info.control_lines
        .map(cl => `${cl.configurable ? '*' : ''}${cl.name.toUpperCase()} (pin ${cl.pin})`)
        .join(', ');
    
    // Build address pin mapping tooltip
    const addrMapping = info.address_pins
        .map(ap => `A${ap.line}: ${ap.pin}`)
        .join(', ');
    
    row.innerHTML = `
        <td>${info.name}</td>
        <td>${info.size_bytes}</td>
        <td>${info.rom_pins}</td>
        <td class="hoverable" title="${addrMapping}">${info.num_addr_lines} <span class="info-icon">ⓘ</span></td>
        <td>${controlLines}</td>
    `;
    
    romTable.appendChild(row);
});

// Display supported MCUs
// Display supported MCUs in a table
const mcuTable = document.getElementById('mcuTable');
const mcus_list = mcus();
mcus_list.forEach(mcu => {
    const info = mcu_info(mcu);
    const row = document.createElement('tr');
    
    // Build RAM display with CCM info if present
    let ramDisplay = info.ram_kb.toString();
    if (info.ccm_ram_kb) {
        ramDisplay = `<span class="hoverable" title="Main RAM: ${info.ram_kb}KB, CCM RAM: ${info.ccm_ram_kb}KB">${info.ram_kb} <span class="info-icon">ⓘ</span></span>`;
    }
    
    // Build features list
    const features = [];
    if (info.supports_usb_dfu) features.push('USB DFU');
    if (info.supports_banked_roms) features.push('Banked ROMs');
    if (info.supports_multi_rom_sets) features.push('Multi ROM Sets');
    const featuresDisplay = features.join(', ') || 'None';
    
    row.innerHTML = `
        <td>${info.name}</td>
        <td>${info.family}</td>
        <td>${info.flash_kb}</td>
        <td>${ramDisplay}</td>
        <td>${info.max_sysclk_mhz}</td>
        <td>${featuresDisplay}</td>
    `;
    
    mcuTable.appendChild(row);
});

// Display supported boards in a table
// Display supported boards in a table
const boardTable = document.getElementById('boardTable');
const boards_list = boards();
boards_list.forEach(board => {
    const info = board_info(board);
    const row = document.createElement('tr');
    
    // Extract port letter from "PORT_A" -> "A", "PORT_0" -> "0"
    const getPortPrefix = (portStr) => {
        const match = portStr.match(/PORT_(.+)/);
        return match ? `P${match[1]}:` : 'P?:';
    };
    
    const addrPort = getPortPrefix(info.port_addr);
    const dataPort = getPortPrefix(info.port_data);
    const selPort = getPortPrefix(info.port_sel);
    
    // Build address pin mapping tooltip
    const addrMapping = info.addr_pins
        .map((pin, idx) => `A${idx}=${addrPort}${pin}`)
        .join(', ');
    
    // Build data pin mapping tooltip
    const dataMapping = info.data_pins
        .map((pin, idx) => `D${idx}=${dataPort}${pin}`)
        .join(', ');
    
    // Build SEL pin mapping tooltip
    const selMapping = info.sel_pins
        .map((pin, idx) => `SEL${idx}=${selPort}${pin}`)
        .join(', ');
    
    // Build features list
    const features = [];
    if (info.has_usb) features.push('USB');
    if (info.supports_multi_rom_sets) features.push('Multi ROM Sets');
    const featuresDisplay = features.join(', ') || 'None';
    
    row.innerHTML = `
        <td>${info.name}</td>
        <td>${info.description}</td>
        <td>${info.mcu_family}</td>
        <td>${info.rom_pins}</td>
        <td class="hoverable" title="${addrMapping}">${info.addr_pins.length} <span class="info-icon">ⓘ</span></td>
        <td class="hoverable" title="${dataMapping}">${info.data_pins.length} <span class="info-icon">ⓘ</span></td>
        <td class="hoverable" title="${selMapping}">${info.sel_pins.length} <span class="info-icon">ⓘ</span></td>
        <td>${featuresDisplay}</td>
    `;
    
    boardTable.appendChild(row);
});

const fileInput = document.getElementById('fileInput');
const parseBtn = document.getElementById('parseBtn');
const output = document.getElementById('output');

parseBtn.addEventListener('click', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
        output.textContent = 'Please select a file first';
        return;
    }

    try {
        output.textContent = 'Loading file...';
        
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        output.textContent = 'Parsing firmware...';
        
        const result = await parse_firmware(data);
        
        output.textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        output.textContent = `Error: ${error}`;
        console.error(error);
    }
});