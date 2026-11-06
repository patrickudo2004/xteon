@echo off
title Xteon Virtual Display Driver Installer
echo ========================================================
echo   Xteon - Virtual Display Engine Setup (GlideX Style)
echo ========================================================
echo.

cd /d "C:\VirtualDisplayDriver"

echo [1/3] Adding driver package to Windows Driver Store...
pnputil /add-driver MttVDD.inf /install

echo.
echo [2/3] Installing Root\MttVDD virtual display adapter...
devcon.exe install MttVDD.inf Root\MttVDD

echo.
echo [3/3] Enabling Root\MttVDD display adapter...
devcon.exe enable Root\MttVDD

echo.
echo [Done] Triggering Windows Extend Mode...
DisplaySwitch.exe /extend

echo.
echo ========================================================
echo   Virtual Display 2 is now active in Windows & PowerPoint!
echo ========================================================
pause
