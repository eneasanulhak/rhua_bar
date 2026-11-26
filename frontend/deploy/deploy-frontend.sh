#!/usr/bin/env bash
# Gera o build do frontend e publica em /var/www/rhua (servido pelo nginx).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
mkdir -p /var/www/rhua
rsync -a --delete dist/ /var/www/rhua/
echo "Frontend publicado em /var/www/rhua"
