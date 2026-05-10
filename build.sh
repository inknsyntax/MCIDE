#!/bin/bash

echo "Building MCIDE WebAssembly module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Build the WebAssembly module
wasm-pack build --target web --release

if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    echo "WebAssembly module is ready at pkg/"
else
    echo "Build failed!"
    exit 1
fi
