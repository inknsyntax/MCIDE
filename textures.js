// MCIDE Texture Manager
// Loads and manages Minecraft block textures

class TextureManager {
    constructor() {
        this.textures = {};
        this.canvas2DCache = {};
        this.redstoneStates = {
            'redstone_block': { powered: false, power: 0 },
            'redstone_torch': { powered: false, power: 15 },
            'redstone_dust': { powered: false, power: 0 },
            'redstone_repeater': { powered: false, delay: 1 },
            'redstone_comparator': { powered: false, mode: 'compare' },
            'dispenser': { powered: false, facing: 'north' },
            'hopper': { powered: false, enabled: true },
            'piston': { powered: false, facing: 'north', extended: false }
        };
    }

    /**
     * Load texture from file
     */
    async loadTexture(blockName, faceName = 'single') {
        const texturePath = `/TexturesForMinecraft/${blockName}.png`;
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    // Create a canvas version for faster rendering
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    this.textures[blockName] = {
                        img: img,
                        canvas: canvas,
                        data: ctx.getImageData(0, 0, img.width, img.height)
                    };
                    resolve(canvas);
                };
                
                img.onerror = () => {
                    console.warn(`Failed to load texture: ${blockName}`);
                    resolve(this.createFallbackTexture(blockName));
                };
                
                img.src = texturePath;
            });
        } catch (err) {
            console.error(`Error loading texture ${blockName}:`, err);
            return this.createFallbackTexture(blockName);
        }
    }

    /**
     * Create fallback texture for missing files
     */
    createFallbackTexture(blockName) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Create a procedural texture based on block name
        const hash = this.hashString(blockName);
        const r = ((hash >> 0) & 255);
        const g = ((hash >> 8) & 255);
        const b = ((hash >> 16) & 255);
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Add pattern
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 16; i += 2) {
            ctx.strokeRect(i, i, 2, 2);
        }
        
        return canvas;
    }

    /**
     * Hash function for consistent colors
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get texture for block
     */
    getTexture(blockName) {
        if (this.textures[blockName]) {
            return this.textures[blockName].canvas;
        }
        return this.createFallbackTexture(blockName);
    }

    /**
     * Get redstone power level (0-15)
     */
    getRedstonePower(blockName) {
        const state = this.redstoneStates[blockName];
        if (state) {
            return state.power || 0;
        }
        return 0;
    }

    /**
     * Set redstone power
     */
    setRedstonePower(blockName, powerLevel) {
        if (this.redstoneStates[blockName]) {
            this.redstoneStates[blockName].power = Math.max(0, Math.min(15, powerLevel));
            this.redstoneStates[blockName].powered = powerLevel > 0;
        }
    }

    /**
     * Toggle redstone powered state
     */
    toggleRedstonePower(blockName) {
        if (this.redstoneStates[blockName]) {
            this.redstoneStates[blockName].powered = !this.redstoneStates[blockName].powered;
            if (this.redstoneStates[blockName].powered) {
                this.redstoneStates[blockName].power = 15;
            } else {
                this.redstoneStates[blockName].power = 0;
            }
            return this.redstoneStates[blockName].powered;
        }
        return false;
    }

    /**
     * Check if block is a redstone component
     */
    isRedstoneComponent(blockName) {
        return blockName.includes('redstone') || 
               blockName === 'dispenser' || 
               blockName === 'hopper' ||
               blockName === 'piston';
    }

    /**
     * Get all redstone blocks
     */
    getRedstoneBlocks() {
        return Object.keys(this.redstoneStates);
    }

    /**
     * Propagate redstone power
     */
    propagateRedstone(blocks, maxDistance = 15) {
        // Simple propagation: reduce power by 1 for each block away
        const powered = {};
        
        blocks.forEach(block => {
            if (block.power > 0) {
                powered[`${block.x},${block.y},${block.z}`] = {
                    power: block.power,
                    x: block.x,
                    y: block.y,
                    z: block.z
                };
            }
        });
        
        return powered;
    }
}

// Export as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextureManager;
}

export default TextureManager;
