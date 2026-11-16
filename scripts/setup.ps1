$ErrorActionPreference = "Stop"
npm install
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
Write-Host "Listo. Completa .env. Luego ejecuta el SQL de Supabase y: npm run seed -- data/Base_App_Prospeccion.xlsx"
