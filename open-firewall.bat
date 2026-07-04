@echo off
REM Right-click this file -> "Run as administrator"
REM Opens the ports Darb needs so your phone can connect over Wi-Fi.

netsh advfirewall firewall add rule name="Darb Expo 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Darb Metro 19000-19001" dir=in action=allow protocol=TCP localport=19000-19001
netsh advfirewall firewall add rule name="Darb API 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo Done. Firewall rules added for ports 3000, 8081, 19000-19001.
echo You can now scan the Expo QR from your phone (same Wi-Fi).
pause
