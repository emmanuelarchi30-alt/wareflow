#!/bin/bash
# Wareflow - Script de configuración inicial

set -e

echo "🚀 Configurando Wareflow..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instala Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ requerido. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Backend
echo ""
echo "📦 Instalando backend..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Edita backend/.env con tus credenciales"
fi
npm install

# Frontend
echo ""
echo "📦 Instalando frontend..."
cd ../frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Edita frontend/.env con tus credenciales"
fi
npm install

echo ""
echo "✅ Instalación completa!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura Supabase y ejecuta el SQL en backend/src/db/setup.sql"
echo "2. Edita backend/.env y frontend/.env con tus credenciales"
echo "3. Coloca video en frontend/public/videos/login-bg.mp4 (opcional)"
echo ""
echo "🚀 Para desarrollar:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"