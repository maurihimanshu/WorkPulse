@echo off
title WorkPulse - Build Local EXE
cd /d "%~dp0"
echo ========================================================
echo   WorkPulse Local Windows Executable Builder
echo ========================================================
python scripts\build_local_exe.py
if errorlevel 1 (
    echo.
    echo [ERROR] Build encountered an error.
    pause
    exit /b 1
)
pause
