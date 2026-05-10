@echo off
REM Build script for MCIDE

echo Building MCIDE WebAssembly module...

REM Check if wasm-pack is installed
where wasm-pack >nul 2>nul
if %errorlevel% neq 0 (
    echo wasm-pack not found. Installing...
    cargo install wasm-pack
)

REM Build the WebAssembly module
wasm-pack build --target web --release

if %errorlevel% equ 0 (
    echo Build completed successfully!
    echo WebAssembly module is ready at pkg/
) else (
    echo Build failed!
    exit /b 1
)