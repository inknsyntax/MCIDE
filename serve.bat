@echo off
echo Starting MCIDE Development Server...
echo.
echo Opening browser to http://localhost:8000
echo.
timeout /t 2

REM Try to open in default browser
start http://localhost:8000

REM Start Python HTTP server
python -m http.server 8000

pause
