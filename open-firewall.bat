# Run this ONCE as Administrator to open required firewall ports
netsh advfirewall firewall delete rule name="AgriFlow Backend 8001" >nul 2>&1
netsh advfirewall firewall delete rule name="AgriFlow Expo 8081" >nul 2>&1
netsh advfirewall firewall add rule name="AgriFlow Backend 8001" dir=in action=allow protocol=TCP localport=8001
netsh advfirewall firewall add rule name="AgriFlow Expo 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="AgriFlow Backend 8001 Out" dir=out action=allow protocol=TCP localport=8001
echo.
echo ✅ Firewall ports 8001 and 8081 are now open!
echo You can close this window.
pause
