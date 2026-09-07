@echo off
title WorkPulse v0.2.1 - Local Runner
cd /d "%~dp0"

echo ========================================================
echo   Starting WorkPulse v0.2.1 (Direct Local Test)
echo ========================================================
echo.

:: Clean up any existing instances holding port 9876
taskkill /F /IM WorkPulse.exe >nul 2>&1
taskkill /F /IM workpulse-runtime.exe >nul 2>&1

echo [INFO] Launching WorkPulse via Python unified launcher...
python run.py %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] WorkPulse exited with error code %ERRORLEVEL%.
    pause
)

