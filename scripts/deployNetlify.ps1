$ErrorActionPreference = "Stop"
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "Instala primero Netlify CLI: npm install -g netlify-cli"
  exit 1
}
netlify deploy --build --prod
