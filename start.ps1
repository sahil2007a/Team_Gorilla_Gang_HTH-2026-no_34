# AgriFlow Auto-Start Script
# Detects current IP, updates app config, and starts all servers

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       AGRIFLOW - Starting Up...        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- Step 1: Get current local IP ---
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.IPAddress -notlike "169.*" -and
    $_.IPAddress -notlike "172.*"
} | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "[1/4] Detected PC IP: $ip" -ForegroundColor Green

# --- Step 2: Update api.js with current IP ---
$apiFile = "$PSScriptRoot\services\api.js"
$content = Get-Content $apiFile -Raw
$updated = $content -replace "http://\d+\.\d+\.\d+\.\d+:8001", "http://${ip}:8001"
Set-Content $apiFile $updated
Write-Host "[2/4] Updated API config with new IP" -ForegroundColor Green

# --- Step 3: Kill any old processes ---
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Write-Host "[3/4] Cleared old processes" -ForegroundColor Green

# --- Step 4: Start FastAPI backend in new window ---
$mlDir = "$PSScriptRoot\ml"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mlDir'; Write-Host 'AgriFlow Backend running at http://${ip}:8001' -ForegroundColor Green; python -m api.main"
Start-Sleep -Seconds 3
Write-Host "[4/4] Backend started at http://${ip}:8001" -ForegroundColor Green

# --- Step 5: Start Expo in new window ---
$appDir = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$appDir'; Write-Host 'AgriFlow Expo starting...' -ForegroundColor Yellow; npx expo start --clear"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Web App  : http://localhost:8081"  -ForegroundColor White
Write-Host "  Backend  : http://${ip}:8001"      -ForegroundColor White
Write-Host "  Admin    : http://${ip}:8001/admin-panel" -ForegroundColor White
Write-Host ""
Write-Host "  Scan the QR code in Expo window"    -ForegroundColor Yellow
Write-Host "  to open on your phone!"             -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
