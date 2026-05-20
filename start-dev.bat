@echo off
echo Starting PDF Toolbox...

:: Start Python backend
start "PDF Backend" /min cmd /c "d:\code\pdf\.venv\Scripts\python d:\code\pdf\python\main.py --port 18765"

:: Wait a moment then start Electron
timeout /t 2 /nobreak > nul

:: Start React + Electron
cd /d d:\code\pdf
"d:\profile\nodejs\npm.cmd" run dev
