# PowerShell script to start Docker with host IP detection
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

if ($ip) {
    Write-Host "Detected host IP: $ip" -ForegroundColor Green
    $env:HOST_IP = $ip
    docker-compose up -d
    Write-Host ""
    Write-Host "Host started with IP: $ip" -ForegroundColor Cyan
    Write-Host "QR code will use: http://$ip:8080/controller" -ForegroundColor Cyan
} else {
    Write-Host "Could not detect IP, starting without HOST_IP..." -ForegroundColor Yellow
    docker-compose up -d
}
