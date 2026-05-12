/**
 * NBT (Named Binary Tag) Encoder for Litematica schematics
 * Generates proper binary Litematica (.litematic) files compatible with Minecraft mods
 * Based on Litematica 0.15+ format specification
 */

class NBTEncoder {
    constructor() {
        this.buffer = [];
    }

    writeByte(value) {
        this.buffer.push(value & 0xFF);
    }

    writeBytes(bytes) {
        for (let b of bytes) {
            this.buffer.push(b & 0xFF);
        }
    }

    writeShort(value) {
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    writeInt(value) {
        value = value | 0; // Convert to signed 32-bit int
        this.buffer.push((value >> 24) & 0xFF);
        this.buffer.push((value >> 16) & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    writeLong(value) {
        const high = Math.floor(value / 0x100000000);
        const low = value >>> 0;
        this.writeInt(high);
        this.writeInt(low);
    }

    writeString(str) {
        const encoded = new TextEncoder().encode(str);
        this.writeShort(encoded.length);
        this.writeBytes(Array.from(encoded));
    }

    writeTagType(type) {
        this.writeByte(type);
    }

    getBuffer() {
        return new Uint8Array(this.buffer);
    }

    /**
     * Encode a Litematica schematic with proper format
     */
    encodeLitematic(worldData) {
        const TAG_END = 0;
        const TAG_BYTE = 1;
        const TAG_SHORT = 2;
        const TAG_INT = 3;
        const TAG_LONG = 4;
        const TAG_FLOAT = 5;
        const TAG_DOUBLE = 6;
        const TAG_BYTE_ARRAY = 7;
        const TAG_STRING = 8;
        const TAG_LIST = 9;
        const TAG_COMPOUND = 10;
        const TAG_INT_ARRAY = 11;
        const TAG_LONG_ARRAY = 12;

        // Root compound
        this.writeTagType(TAG_COMPOUND);
        this.writeString('');

        // Metadata
        this.writeTagType(TAG_COMPOUND);
        this.writeString('Metadata');
        
        this.writeTagType(TAG_STRING);
        this.writeString('Author');
        this.writeString('MCIDE');
        
        this.writeTagType(TAG_STRING);
        this.writeString('Name');
        this.writeString(worldData.name || 'MCIDE');
        
        this.writeTagType(TAG_LONG);
        this.writeString('TimeCreated');
        this.writeLong(Date.now());
        
        this.writeTagType(TAG_LONG);
        this.writeString('TimeModified');
        this.writeLong(Date.now());
        
        this.writeTagType(TAG_INT);
        this.writeString('RegionCount');
        this.writeInt(1);
        
        this.writeTagType(TAG_END);

        // Version
        this.writeTagType(TAG_INT);
        this.writeString('Version');
        this.writeInt(5);

        // MinecraftDataVersion
        this.writeTagType(TAG_INT);
        this.writeString('MinecraftDataVersion');
        this.writeInt(3578); // Minecraft 1.20.1

        // Regions
        this.writeTagType(TAG_LIST);
        this.writeString('Regions');
        this.writeTagType(TAG_COMPOUND);
        this.writeInt(1);

        // Region compound
        this.writeTagType(TAG_COMPOUND);
        this.writeString('');

        // Region position
        this.writeTagType(TAG_INT);
        this.writeString('x');
        this.writeInt(0);
        
        this.writeTagType(TAG_INT);
        this.writeString('y');
        this.writeInt(0);
        
        this.writeTagType(TAG_INT);
        this.writeString('z');
        this.writeInt(0);

        // Bounds
        const dims = this.calculateDimensions(worldData.blocks);
        
        this.writeTagType(TAG_INT);
        this.writeString('width');
        this.writeInt(dims.width);
        
        this.writeTagType(TAG_INT);
        this.writeString('height');
        this.writeInt(dims.height);
        
        this.writeTagType(TAG_INT);
        this.writeString('length');
        this.writeInt(dims.length);

        // Block palette
        const palette = this.buildBlockPalette(worldData.blocks);
        this.writeBlockPalette(palette, TAG_LIST, TAG_COMPOUND, TAG_STRING, TAG_END);

        // Block data
        const blockData = this.encodeBlockData(worldData.blocks, palette, dims);
        this.writeTagType(TAG_BYTE_ARRAY);
        this.writeString('BlockData');
        this.writeInt(blockData.length);
        this.writeBytes(blockData);

        // Entities (empty list)
        this.writeTagType(TAG_LIST);
        this.writeString('Entities');
        this.writeTagType(TAG_COMPOUND);
        this.writeInt(0);

        this.writeTagType(TAG_END); // End region
        this.writeTagType(TAG_END); // End regions list
        this.writeTagType(TAG_END); // End root

        return this.getBuffer();
    }

    calculateDimensions(blocks) {
        let minX = 0, maxX = 0;
        let minY = 0, maxY = 0;
        let minZ = 0, maxZ = 0;

        blocks.forEach(block => {
            minX = Math.min(minX, block.x);
            maxX = Math.max(maxX, block.x);
            minY = Math.min(minY, block.y);
            maxY = Math.max(maxY, block.y);
            minZ = Math.min(minZ, block.z);
            maxZ = Math.max(maxZ, block.z);
        });

        return {
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            length: maxZ - minZ + 1,
            minX, minY, minZ
        };
    }

    buildBlockPalette(blocks) {
        const palette = {};
        palette['minecraft:air'] = 0;

        let idx = 1;
        const seen = new Set(['air']);

        blocks.forEach(block => {
            const blockName = this.getMinecraftBlockName(block.name);
            if (!seen.has(blockName)) {
                palette[blockName] = idx++;
                seen.add(blockName);
            }
        });

        return palette;
    }

    getMinecraftBlockName(name) {
        // Convert camelCase to snake_case and add minecraft namespace
        const snakeCase = name
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase();
        return `minecraft:${snakeCase}`;
    }

    writeBlockPalette(palette, TAG_LIST, TAG_COMPOUND, TAG_STRING, TAG_END) {
        this.writeTagType(TAG_LIST);
        this.writeString('BlockStatePalette');
        this.writeTagType(TAG_COMPOUND);
        this.writeInt(Object.keys(palette).length);

        Object.entries(palette).forEach(([name, idx]) => {
            this.writeTagType(TAG_COMPOUND);
            this.writeString('');
            
            this.writeTagType(TAG_STRING);
            this.writeString('Name');
            this.writeString(name);
            
            this.writeTagType(TAG_END);
        });

        this.writeTagType(TAG_END);
    }

    encodeBlockData(blocks, palette, dims) {
        const data = [];
        const { minX, minY, minZ, width, height, length } = dims;

        // Create 3D array to track placed blocks
        const grid = {};
        blocks.forEach(block => {
            const relX = block.x - minX;
            const relY = block.y - minY;
            const relZ = block.z - minZ;
            
            if (relX >= 0 && relX < width && 
                relY >= 0 && relY < height && 
                relZ >= 0 && relZ < length) {
                const key = `${relX},${relY},${relZ}`;
                const blockName = this.getMinecraftBlockName(block.name);
                grid[key] = palette[blockName] || 0;
            }
        });

        // Write blocks in order (y, z, x)
        for (let y = 0; y < height; y++) {
            for (let z = 0; z < length; z++) {
                for (let x = 0; x < width; x++) {
                    const key = `${x},${y},${z}`;
                    data.push(grid[key] || 0); // Air (0) if not set
                }
            }
        }

        return data;
    }
}

/**
 * Export a Litematica schematic file with GZIP compression
 */
function exportLitematic(worldData) {
    if (typeof NBTEncoder === 'undefined') {
        console.error('NBTEncoder not loaded');
        return;
    }

    const encoder = new NBTEncoder();
    const nbtData = encoder.encodeLitematic(worldData);

    // Compress with gzip using pako
    let compressedData;
    try {
        if (typeof pako !== 'undefined') {
            compressedData = pako.gzip(nbtData);
        } else {
            // Fallback: use uncompressed (not ideal but better than nothing)
            console.warn('pako not loaded, exporting uncompressed NBT');
            compressedData = nbtData;
        }
    } catch (e) {
        console.error('Compression failed:', e);
        compressedData = nbtData;
    }

    // Create blob and download
    const blob = new Blob([compressedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world.litematic';
    a.click();
    URL.revokeObjectURL(url);

    return 'Exported world.litematic';
}
