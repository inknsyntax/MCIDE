// MCIDE 3D Renderer using Three.js
// Beautiful, professional grid-based 3D voxel visualization with block selection

class MCIDE3DRenderer {
    constructor(canvas, engine) {
        console.log('[INIT] MCIDE3DRenderer starting...');
        this.canvas = canvas;
        this.engine = engine;
        
        // Three.js Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(25, 20, 25);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        console.log(`[RENDERER] Created: ${canvas.clientWidth}x${canvas.clientHeight}`);
        
        // Lighting - Professional setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // BEAUTIFUL GREY GRID
        const gridSize = 64;
        const gridDivisions = 64;
        const gridColor1 = 0x555555;  // Medium grey
        const gridColor2 = 0x333333;  // Dark grey
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor1, gridColor2);
        this.scene.add(gridHelper);
        console.log('[GRID] Added 64x64 grid');
        
        // Axis helper for reference (small, subtle)
        const axisHelper = new THREE.AxesHelper(5);
        this.scene.add(axisHelper);
        
        // Block meshes storage
        this.blockMeshes = new Map();
        this.materials = new Map();
        this.loadedBlocks = 0;
        
        // Block selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedBlock = null;
        this.hoveredBlock = null;
        
        // Performance tracking
        this.lastTime = Date.now();
        this.frameCount = 0;
        
        // Initialize input
        this.setupControls();
        
        console.log('[READY] MCIDE3DRenderer initialized');
    }
    
    setupControls() {
        // Mouse controls for orbiting camera
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.canvas.addEventListener('mousedown', (e) => {
            // Only orbit on right-click or if not over a block
            if (e.button === 2 || !this.hoveredBlock) {
                isDragging = true;
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            // Update mouse position for raycasting
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                // Orbit camera around center
                const radius = this.camera.position.length();
                let phi = Math.atan2(this.camera.position.z, this.camera.position.x);
                let theta = Math.acos(this.camera.position.y / radius);
                
                phi -= deltaX * 0.01;
                theta -= deltaY * 0.01;
                theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));
                
                this.camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
                this.camera.position.y = radius * Math.cos(theta);
                this.camera.position.z = radius * Math.sin(theta) * Math.sin(phi);
                this.camera.lookAt(0, 0, 0);
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            isDragging = false;
            
            // Handle block interactions
            const tool = window.currentTool || 'select';
            
            if (e.button === 0) {
                // Left-click: varies by tool
                if (tool === 'place') {
                    // Place block (works with or without hovering)
                    this.placeBlock(this.hoveredBlock);
                } else if (tool === 'select' && this.hoveredBlock) {
                    // Select block (requires hovering)
                    this.selectBlock(this.hoveredBlock);
                }
            } else if (e.button === 2 && tool === 'break' && this.hoveredBlock) {
                // Right-click: delete block (requires hovering)
                this.deleteBlock(this.hoveredBlock);
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Zoom with scroll wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const direction = this.camera.position.clone().normalize();
            const currentDistance = this.camera.position.length();
            const newDistance = currentDistance + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed);
            
            if (newDistance > 5 && newDistance < 200) {
                this.camera.position.copy(direction.multiplyScalar(newDistance));
                this.camera.lookAt(0, 0, 0);
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    selectBlock(mesh) {
        // Update selected block
        if (this.selectedBlock) {
            this.selectedBlock.material.emissive.setHex(0x000000);
        }
        
        this.selectedBlock = mesh;
        this.selectedBlock.material.emissive.setHex(0x6b8cff);
        
        // Update block name in UI
        const blockName = mesh.userData.blockName || 'unknown';
        const selectedNameEl = document.getElementById('selected-block-name');
        if (selectedNameEl) {
            selectedNameEl.textContent = blockName;
        }
        
        console.log(`[SELECT] Block selected: ${blockName}`);
    }
    
    updateBlockSelection() {
        // Raycast to find hovered block
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const blockMeshArray = Array.from(this.blockMeshes.values());
        const intersects = this.raycaster.intersectObjects(blockMeshArray);
        
        // Clear previous hover highlight
        if (this.hoveredBlock && this.hoveredBlock !== this.selectedBlock) {
            this.hoveredBlock.material.emissive.setHex(0x000000);
        }
        
        if (intersects.length > 0) {
            const block = intersects[0].object;
            this.hoveredBlock = block;
            
            // Highlight hovered block (unless it's selected)
            if (block !== this.selectedBlock) {
                block.material.emissive.setHex(0x3d5a80);
            }
        } else {
            this.hoveredBlock = null;
        }
    }
    
    placeBlock(referenceBlock) {
        const selectedBlockId = window.selectedBlockId || 2;
        const tool = window.currentTool || 'place';
        if (tool !== 'place') return;
        
        // Use reference block if available, otherwise place at fixed offset
        let newPos;
        if (referenceBlock) {
            const pos = referenceBlock.position;
            newPos = new THREE.Vector3(pos.x, pos.y + 1, pos.z);
        } else {
            // Place at origin + offset if no block is hovered
            newPos = new THREE.Vector3(0, 6, 0);
        }
        
        // Check if block already exists
        const key = `${newPos.x},${newPos.y},${newPos.z}`;
        if (this.blockMeshes.has(key)) {
            console.log(`[PLACE] Block already exists at ${key}`);
            return;
        }
        
        // Place the block
        this.addBlockMesh(newPos.x, newPos.y, newPos.z, selectedBlockId);
        this.engine.set_block(Math.round(newPos.x), Math.round(newPos.y), Math.round(newPos.z), selectedBlockId);
        
        const blockName = window.allBlocks?.find(b => b.id === selectedBlockId)?.name || `Block${selectedBlockId}`;
        console.log(`[PLACE] Block "${blockName}" at ${Math.round(newPos.x)}, ${Math.round(newPos.y)}, ${Math.round(newPos.z)}`);
        document.getElementById('status-center').textContent = `✓ Placed ${blockName} at ${Math.round(newPos.x)}, ${Math.round(newPos.y)}, ${Math.round(newPos.z)}`;
    }
    
    deleteBlock(mesh) {
        const tool = window.currentTool || 'break';
        if (tool !== 'break') return;
        
        if (!mesh) {
            console.log('[DELETE] No block selected to delete');
            return;
        }
        
        const pos = mesh.position;
        const key = `${pos.x},${pos.y},${pos.z}`;
        
        // Remove from scene
        this.scene.remove(mesh);
        this.blockMeshes.delete(key);
        this.engine.set_block(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z), 0);
        
        console.log(`[DELETE] Block at ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`);
        document.getElementById('status-center').textContent = `✓ Deleted block at ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
    }
    
    getOrCreateMaterial(blockName) {
        if (this.materials.has(blockName)) {
            return this.materials.get(blockName);
        }
        
        // Load actual textures from Assets/Textures/
        const textureUrl = `./Assets/Textures/${blockName}.png`;
        
        const texture = new THREE.TextureLoader().load(
            textureUrl,
            undefined,
            undefined,
            () => {
                // Fallback color if texture fails
                const hash = blockName.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
                const hue = Math.abs(hash) % 360;
                const saturation = 0.7 + (Math.abs(hash) % 30) / 100;
                const lightness = 0.45 + (Math.abs(hash) % 15) / 100;
                
                const color = new THREE.Color().setHSL(hue / 360, saturation, lightness);
                return color;
            }
        );
        
        // Apply Minecraft-style filtering
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipmapLinearFilter;
        
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.0,
            flatShading: false
        });
        
        this.materials.set(blockName, material);
        return material;
    }
    
    loadWorld() {
        console.log('[WORLD] Loading blocks...');
        this.loadedBlocks = 0;
        
        // Clear existing blocks
        const blocksToRemove = [];
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.isBlock) {
                blocksToRemove.push(child);
            }
        });
        blocksToRemove.forEach(block => this.scene.remove(block));
        this.blockMeshes.clear();
        
        // Load blocks from engine
        for (let y = -2; y <= 5; y++) {
            for (let z = -8; z <= 8; z++) {
                for (let x = -8; x <= 8; x++) {
                    const blockId = this.engine.get_block(x, y, z);
                    if (blockId > 0) {
                        this.addBlockMesh(x, y, z, blockId);
                    }
                }
            }
        }
        
        // Update stats
        const statEl = document.getElementById('stat-textures');
        if (statEl) statEl.textContent = this.materials.size;
        
        console.log(`[WORLD] Loaded ${this.loadedBlocks} blocks`);
        console.log(`[WORLD] ${this.materials.size} unique textures loaded`);
    }
    
    addBlockMesh(x, y, z, blockId) {
        try {
            const blockName = this.engine.get_block_name(blockId);
            const material = this.getOrCreateMaterial(blockName);
            
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(x, y, z);
            mesh.userData = { 
                isBlock: true, 
                blockName: blockName,
                blockId: blockId,
                x, y, z 
            };
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.scene.add(mesh);
            this.blockMeshes.set(`${x},${y},${z}`, mesh);
            this.loadedBlocks++;
        } catch (e) {
            console.error(`Failed to add block at ${x},${y},${z}:`, e);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update block selection highlighting
        this.updateBlockSelection();
        
        // Update FPS counter
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastTime >= 1000) {
            const fpsEl = document.getElementById('fps');
            if (fpsEl) fpsEl.textContent = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
