$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User"); cloudflared tunnel run --url http://localhost:3000 tempmail

cd backend && bun run dev

cd frontend && bun run dev

docker-compose up -d