// MCIDE Renderer with Real Texture Support
class MCIDERenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.ctx = null;
        this.textureCache = new Map();
        this.texturePromises = new Map();
        this.isReady = false;
        
        // Camera state - start closer to ground
        this.cameraX = 128;
        this.cameraY = 5;  // Closer to ground (blocks at y=0-2)
        this.cameraZ = 128;
        this.zoom = 1.0;
        
        // Rendering constants
        this.BLOCK_SIZE = 32;
        this.ISO_SCALE_X = 0.866;  // cos(30°)
        this.ISO_SCALE_Y = 0.5;     // sin(30°)
        
        // Chunk caching
        this.chunkCache = new Map();
        this.loadedChunks = new Set();
        this.viewDistance = 4;
        
        // UI state
        this.hoveredBlock = null;
        this.selectedBlock = null;
        this.selectionStart = null;
        this.selectionEnd = null;
    }

    async initialize() {
        this.ctx = this.canvas.getContext('2d');
        this.isReady = true;
        console.log('✓ Canvas 2D with textures ready');
        return true;
    }

    // Load texture for a block (returns Image or null)
    // Pre-loads in background, returns cached version if already loaded
    getTextureFromCache(blockName) {
        if (this.textureCache.has(blockName)) {
            return this.textureCache.get(blockName);
        }
        
        // Start loading in background if not already loading
        if (!this.texturePromises.has(blockName)) {
            const img = new Image();
            img.onload = () => {
                this.textureCache.set(blockName, img);
            };
            img.onerror = () => {
                // Mark as failed to avoid repeated attempts
                this.textureCache.set(blockName, null);
            };
            img.src = `TexturesForMinecraft/${blockName}.png`;
            this.texturePromises.set(blockName, img);
        }
        
        // Return cached if loaded, null otherwise (will use fallback color)
        return this.textureCache.get(blockName) || null;
    }

    // Darken or lighten a color
    adjustColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(255 * (1 - factor));
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).substring(1);
    }

    // Get fallback color for a block by name
    getBlockColor(blockName) {
        const colors = {
            'stone': '#8B8680', 'dirt': '#8B7355', 'grass_block': '#5AA638',
            'cobblestone': '#6B6B6B', 'oak_planks': '#C19A6B', 'oak_log': '#A0522D',
            'oak_leaves': '#228B22', 'sand': '#F4A460', 'water': '#3366CC',
            'lava': '#FF4500', 'gravel': '#D3D3D3', 'bedrock': '#1a1a1a',
            'redstone_block': '#B20000', 'redstone_ore': '#8B4513',
            'redstone_wire': '#CC0000', 'redstone_torch': '#FF6B6B'
        };
        return colors[blockName] || '#999999';
    }

    // Draw isometric block with texture or fallback color
    drawBlock(x, y, z, blockId) {
        if (blockId === 0 || !this.ctx) return; // Air
        
        const blockName = this.engine.get_block_name(blockId);
        const texture = this.getTextureFromCache(blockName);
        const color = this.getBlockColor(blockName);
        
        const screen = this.worldToScreen(x, y, z);
        const sx = screen.x;
        const sy = screen.y;
        const size = this.BLOCK_SIZE * this.zoom;
        const ctx = this.ctx;

        // Draw three isometric faces
        const isGrass = blockName === 'grass_block';
        
        // TOP FACE
        if (texture) {
            ctx.save();
            // Clip to top face diamond shape
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.closePath();
            ctx.clip();
            
            // Scale and draw texture
            const scale = (size * this.ISO_SCALE_X * 2) / 16;  // 16px texture
            ctx.drawImage(texture, sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y * 2, size * this.ISO_SCALE_X * 2, size * this.ISO_SCALE_Y * 2);
            ctx.restore();
        } else {
            // Fallback solid color
            const faceColor = isGrass ? '#5AA638' : color;
            ctx.fillStyle = faceColor;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.closePath();
            ctx.fill();
        }
        
        // Top face outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.closePath();
        ctx.stroke();

        // LEFT FACE
        if (texture) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx - size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(texture, sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y, size * this.ISO_SCALE_X, size * this.ISO_SCALE_Y * 3);
            ctx.restore();
        } else {
            const sideColor = this.adjustColor(isGrass ? '#8B7355' : color, 0.75);
            ctx.fillStyle = sideColor;
            ctx.beginPath();
            ctx.moveTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx - size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.closePath();
            ctx.fill();
        }
        
        // Left face outline
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx - size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.closePath();
        ctx.stroke();

        // RIGHT FACE
        if (texture) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx + size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(texture, sx, sy - size * this.ISO_SCALE_Y, size * this.ISO_SCALE_X, size * this.ISO_SCALE_Y * 3);
            ctx.restore();
        } else {
            const sideColor = this.adjustColor(color, 0.85);
            ctx.fillStyle = sideColor;
            ctx.beginPath();
            ctx.moveTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
            ctx.lineTo(sx + size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
            ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
            ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
            ctx.closePath();
            ctx.fill();
        }
        
        // Right face outline
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx + size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.closePath();
        ctx.stroke();
    }

    // Convert world coords to screen coords
    worldToScreen(x, y, z) {
        const relX = x - this.cameraX;
        const relZ = z - this.cameraZ;
        const relY = y - this.cameraY;
        
        const isoX = (relX - relZ) * this.ISO_SCALE_X * this.BLOCK_SIZE * this.zoom;
        const isoY = (relX + relZ) * this.ISO_SCALE_Y * this.BLOCK_SIZE * this.zoom - relY * this.BLOCK_SIZE * 0.5 * this.zoom;
        
        return {
            x: this.canvas.width / 2 + isoX,
            y: this.canvas.height / 2 + isoY
        };
    }

    // Convert screen coords to world coords
    screenToWorld(screenX, screenY) {
        const relX = (screenX - this.canvas.width / 2) / (this.BLOCK_SIZE * this.zoom);
        const relY = (screenY - this.canvas.height / 2) / (this.BLOCK_SIZE * this.zoom);
        
        const x = (relX / this.ISO_SCALE_X + relY / this.ISO_SCALE_Y) / 2 + this.cameraX;
        const z = (relY / this.ISO_SCALE_Y - relX / this.ISO_SCALE_X) / 2 + this.cameraZ;
        
        return {
            x: Math.round(x),
            z: Math.round(z),
            y: Math.round(this.cameraY)
        };
    }

    // Render the scene
    render() {
        if (!this.ctx || !this.engine) return;
        
        const ctx = this.ctx;
        
        // Clear with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');  // Sky blue
        gradient.addColorStop(1, '#E0F6FF');  // Lighter blue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Collect visible blocks
        const visibleBlocks = [];
        const renderRadius = Math.ceil(this.viewDistance * 16 / Math.cos(Math.PI / 4));
        const minX = Math.max(0, Math.floor(this.cameraX - renderRadius));
        const maxX = Math.min(256, Math.ceil(this.cameraX + renderRadius));
        const minZ = Math.max(0, Math.floor(this.cameraZ - renderRadius));
        const maxZ = Math.min(256, Math.ceil(this.cameraZ + renderRadius));
        // Increased Y range to see ground and sky
        const minY = Math.max(0, Math.floor(this.cameraY - 35));
        const maxY = Math.min(64, Math.ceil(this.cameraY + 20));
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const blockId = this.engine.get_block(x, y, z);
                    if (blockId !== 0) {
                        visibleBlocks.push({ x, y, z, id: blockId, depth: (x + z) * 10 - y });
                    }
                }
            }
        }
        
        // Sort by depth (painter's algorithm)
        visibleBlocks.sort((a, b) => a.depth - b.depth);
        
        // Draw all blocks
        for (const block of visibleBlocks) {
            this.drawBlock(block.x, block.y, block.z, block.id);
        }
        
        // Draw crosshair
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        
        // Crosshair lines
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx - 8, cy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy - 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx, cy + 15);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    invalidateChunkCache() {
        this.chunkCache.clear();
    }
}

export { MCIDERenderer };
