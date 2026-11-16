#!/usr/bin/env bash
set -euo pipefail
command -v netlify >/dev/null || { echo 'Instala primero Netlify CLI: npm install -g netlify-cli'; exit 1; }
netlify deploy --build --prod
