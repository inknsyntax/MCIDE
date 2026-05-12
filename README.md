# MCIDE - The Minecraft IDE

A next-generation, browser-based Minecraft IDE that bridges creative expression with computational logic. MCIDE is a digital twin of the Minecraft universe, leveraging cutting-edge web technologies to deliver a professional, immersive development experience.

## 🎯 Vision

MCIDE is the "Epitome of Art"—a full-stack tool that combines:

- **High-Performance Rendering**: WebGPU-based custom renderer with real-time ray-traced shadows and ambient occlusion
- **Temporal Version Control**: Toggle between every Minecraft version, including April Fools' snapshots and pre-release combat tests
- **The Oracle**: Real-time command sandbox with visual debugging layers, tick-latency calculations, and survival blueprints
- **Museum of Blocks**: 3D infinite gallery of user-submitted builds with collaborative forking and pull-request workflows
- **Universal Exports**: Generate Litematica/Axiom files, Behavior/Resource packs, WorldEdit scripts, and step-by-step tutorials

## 🚀 Tech Stack

- **WebAssembly**: Rust compiled to Wasm for near-native performance
- **WebGPU**: Next-generation graphics API for browser-based 3D rendering
- **Modern Web APIs**: Web Workers for multi-threaded block updates, Service Workers for offline support
- **Responsive UI**: Modern developer aesthetic with VS Code-like panels and game-like immersion

## 🏗️ Project Structure

```
MCIDE/
├── index.html          # Main application entry point
├── style.css           # Modern, sleek UI styling
├── Cargo.toml          # Rust project manifest
├── src/
│   └── lib.rs          # WebAssembly core logic
├── build.sh            # Build script for Unix-like systems
├── build.bat           # Build script for Windows
└── pkg/                # Compiled WebAssembly module (generated)
```

## 🛠️ Setup & Build

### Prerequisites

- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **wasm-pack**: Used to compile Rust to WebAssembly
  ```bash
  cargo install wasm-pack
  ```

### Building

#### On Windows:
```cmd
build.bat
```

#### On macOS/Linux:
```bash
chmod +x build.sh
./build.sh
```

This will:
1. Compile the Rust code to WebAssembly
2. Generate JavaScript bindings
3. Create the `pkg/` directory with the compiled module

### Running Locally

Use a local web server to serve the application:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js with http-server
npx http-server

# Using VS Code Live Server extension
# Right-click index.html and select "Open with Live Server"
```

Then open your browser and navigate to `http://localhost:8000`

## 📋 Current Features

- ✅ Modern, futuristic UI with game-y aesthetic
- ✅ WebAssembly core engine initialization
- ✅ Project file browser with Minecraft-specific items
- ✅ Version selector for temporal navigation
- ✅ Real-time stats display (blocks, entities, ticks/sec)
- ✅ Tool palette for building and debugging
- ✅ FPS counter and status bar

## 🚧 Roadmap

### Phase 1: Core Engine
- [ ] WebGPU renderer with chunk management
- [ ] Block placement and breaking mechanics
- [ ] Camera system with smooth navigation
- [ ] Basic inventory system

### Phase 2: Temporal Engine
- [ ] Version switching for different Minecraft releases
- [ ] Dynamic block ID and property management
- [ ] Physics engine swapping between Java/Bedrock

### Phase 3: The Oracle
- [ ] Command parser and visual debugger
- [ ] Tick-latency calculation
- [ ] Entity cramming limit warnings
- [ ] Survival blueprint generator

### Phase 4: Collaboration
- [ ] Schematic file import/export (Litematica, WorldEdit)
- [ ] 3D build gallery with infinite scroll
- [ ] Fork and merge workflows
- [ ] Real-time multi-user editing

### Phase 5: Export Engine
- [ ] Universal schematic bundle generation
- [ ] Resource pack generation
- [ ] Step-by-step tutorial creation
- [ ] WorldEdit script export

## 📚 Documentation

Detailed documentation coming soon. For now, check:

- Rust API: See `src/lib.rs` for the core WASM API
- Frontend: Check `index.html` for the UI structure and `style.css` for styling

## 🌐 Deployment

### GitHub Pages

MCIDE is automatically deployed to GitHub Pages on every push to `main`. Access the live version at:

**[https://inknsyntax.github.io/MCIDE/](https://inknsyntax.github.io/MCIDE/)**

The deployment uses GitHub Actions (see `.github/workflows/deploy.yml`) which:
1. Builds the Rust WebAssembly module
2. Uploads all files to GitHub Pages
3. Automatically updates on every commit

The application automatically detects whether it's running on GitHub Pages (at `/MCIDE/`) or locally and adjusts all asset paths accordingly using `window.basePath`.

### Local Development

For local development, the application works with relative paths. Simply run a local web server in the project directory and it will work without modification.

## 🤝 Contributing

This is an ambitious project! Contributions are welcome. Please feel free to:

- Report bugs and suggest features
- Improve the UI/UX design
- Optimize the WebAssembly core
- Add support for new Minecraft versions

## 📜 License

MIT License - Use MCIDE for personal and commercial projects.

---

**Built with ⚒️ passion for the Minecraft community**
