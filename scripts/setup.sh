#!/usr/bin/env bash
set -euo pipefail
npm install
[ -f .env ] || cp .env.example .env
printf '\nListo. Completa .env. Luego ejecuta el SQL de Supabase y: npm run seed -- data/Base_App_Prospeccion.xlsx\n'
