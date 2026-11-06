@echo off
title Xteon Virtual Display Driver Uninstaller
echo ========================================================
echo   Xteon - Virtual Display Engine Uninstaller
echo ========================================================
echo.

cd /d "C:\VirtualDisplayDriver"

echo Removing Root\MttVDD virtual display adapter...
devcon.exe remove Root\MttVDD

echo.
echo ========================================================
echo   Virtual Display Adapter removed.
echo ========================================================
pause
