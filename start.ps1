# Script para iniciar todos os serviços do projeto

Write-Host "Iniciando servicos do projeto..." -ForegroundColor Green

# 1. Iniciar Docker Compose
Write-Host "`nIniciando Docker containers..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker-compose up -d; Write-Host 'Docker containers iniciados!' -ForegroundColor Green"

# Aguardar um momento para o Docker iniciar
Start-Sleep -Seconds 3

# 2. Iniciar Cloudflare Tunnel
Write-Host "`nIniciando Cloudflare Tunnel..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); cloudflared tunnel run --url http://localhost:3000 tempmail"

# 3. Iniciar Backend
Write-Host "`nIniciando Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; bun run dev"

# 4. Iniciar Frontend
Write-Host "`nIniciando Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; bun run dev"

Write-Host "`nTodos os servicos foram iniciados em terminais separados!" -ForegroundColor Green
Write-Host "Pressione qualquer tecla para fechar esta janela..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
