#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .runtime
tar --exclude='./node_modules' --exclude='./frontend/node_modules' --exclude='./backend/node_modules' --exclude='./.runtime' --exclude='./.git' --exclude='./frontend/dist' --exclude='./backend/dist' --exclude='./frontend/.expo' --exclude='./.env' --exclude='./.env.development' --exclude='./.env.production' --exclude='./.env.test' -czf .runtime/fuchojuana-source.tar.gz .
echo 'Paquete sin secretos: .runtime/fuchojuana-source.tar.gz'
