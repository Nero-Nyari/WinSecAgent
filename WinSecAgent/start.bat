@echo off
title WinSecAgent

echo ========================================
echo   WinSecAgent Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting backend...
start "WinSecAgent-Backend" cmd /k "myenv\Scripts\activate.bat && cd backend && python run.py"

echo [Info] Waiting for backend to start (8s)...
timeout /t 8 /nobreak >nul

echo [2/2] Starting frontend...
start "WinSecAgent-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Done!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://127.0.0.1:5173
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
