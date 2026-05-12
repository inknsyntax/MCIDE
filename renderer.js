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
            img.src = `Assets/Textures/${blockName}.png`;
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

    // Draw isometric block with professional shading and textures
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
        
        ctx.save();
        
        // TOP FACE - brightest
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.closePath();
        
        if (texture) {
            ctx.clip();
            ctx.drawImage(texture, sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y * 2, size * this.ISO_SCALE_X * 2, size * this.ISO_SCALE_Y * 2);
        } else {
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.restore();
        
        // LEFT FACE - darker (shaded)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx - size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.closePath();
        
        if (texture) {
            ctx.clip();
            ctx.globalAlpha = 0.85;
            ctx.drawImage(texture, sx - size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y, size * this.ISO_SCALE_X, size * this.ISO_SCALE_Y * 3);
        } else {
            ctx.fillStyle = this.adjustColor(color, 0.72);
            ctx.fill();
        }
        ctx.restore();
        
        // RIGHT FACE - medium dark (shaded)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx + size * this.ISO_SCALE_X, sy - size * this.ISO_SCALE_Y);
        ctx.lineTo(sx + size * this.ISO_SCALE_X, sy + size * this.ISO_SCALE_Y);
        ctx.lineTo(sx, sy + size * this.ISO_SCALE_Y * 2);
        ctx.lineTo(sx, sy - size * this.ISO_SCALE_Y * 2);
        ctx.closePath();
        
        if (texture) {
            ctx.clip();
            ctx.globalAlpha = 0.92;
            ctx.drawImage(texture, sx, sy - size * this.ISO_SCALE_Y, size * this.ISO_SCALE_X, size * this.ISO_SCALE_Y * 3);
        } else {
            ctx.fillStyle = this.adjustColor(color, 0.82);
            ctx.fill();
        }
        ctx.restore();
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
        ctx.save();
        
        // Clear with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aggressive culling - reduced render distance for performance
        const renderRadius = Math.ceil(this.viewDistance * 16 / 2.0);  // Reduced from 1.5
        const minX = Math.max(0, Math.floor(this.cameraX - renderRadius));
        const maxX = Math.min(255, Math.ceil(this.cameraX + renderRadius));
        const minZ = Math.max(0, Math.floor(this.cameraZ - renderRadius));
        const maxZ = Math.min(255, Math.ceil(this.cameraZ + renderRadius));
        const minY = Math.max(0, Math.floor(this.cameraY - 20));
        const maxY = Math.min(63, Math.ceil(this.cameraY + 8));
        
        // Collect and sort visible blocks with screen-space culling
        const visibleBlocks = [];
        const screenPadding = 64;  // Pixels beyond screen edges to render
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                for (let x = minX; x <= maxX; x++) {
                    const blockId = this.engine.get_block(x, y, z);
                    if (blockId > 0) {  // Skip air (0)
                        // Screen-space culling: skip blocks completely off-screen
                        const screen = this.worldToScreen(x, y, z);
                        const size = this.BLOCK_SIZE * this.zoom;
                        if (screen.x + size * 1.2 > -screenPadding && 
                            screen.x - size * 1.2 < this.canvas.width + screenPadding &&
                            screen.y + size * 1.2 > -screenPadding && 
                            screen.y - size * 1.2 < this.canvas.height + screenPadding) {
                            visibleBlocks.push({ 
                                x, y, z, id: blockId, 
                                depth: (x + z) * 100 - y * 5
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by depth (painter's algorithm)
        visibleBlocks.sort((a, b) => b.depth - a.depth);
        
        // Draw visible blocks (limit to prevent hangs)
        const maxBlocksToDraw = 2000;
        for (let i = 0; i < Math.min(visibleBlocks.length, maxBlocksToDraw); i++) {
            const block = visibleBlocks[i];
            this.drawBlock(block.x, block.y, block.z, block.id);
        }
        
        // Draw crosshair (simplified)
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx + 12, cy);
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx, cy + 12);
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy - 8);
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
