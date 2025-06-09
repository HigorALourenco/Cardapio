#!/bin/bash

echo "🔧 Configurando variáveis de ambiente na Railway..."

# Configurar variáveis essenciais
railway variables set NODE_ENV=production
railway variables set NEXT_TELEMETRY_DISABLED=1
railway variables set PORT=3000

# Configurar variáveis opcionais (descomente se necessário)
# railway variables set NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
# railway variables set NEXT_PUBLIC_ADMIN_USERNAME=admin
# railway variables set NEXT_PUBLIC_ADMIN_PASSWORD=312890

echo "✅ Variáveis de ambiente configuradas!"
