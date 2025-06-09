#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Railway Deploy API${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale o Node.js 18 ou superior.${NC}"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18 ou superior é necessário. Versão atual: $NODE_VERSION${NC}"
    exit 1
fi

# Instalar dependências
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install

# Verificar Railway CLI
echo -e "${BLUE}🔍 Verificando Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️ Railway CLI não encontrado. Instalando...${NC}"
    npm install -g @railway/cli
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Falha ao instalar Railway CLI globalmente. Tentando localmente...${NC}"
        npm install @railway/cli
    fi
else
    echo -e "${GREEN}✅ Railway CLI encontrado: $(railway version)${NC}"
fi

# Criar diretório de logs
mkdir -p logs

# Criar diretório de repositórios
mkdir -p repos

# Verificar arquivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Arquivo .env não encontrado. Criando a partir do modelo...${NC}"
    cp .env.example .env 2>/dev/null || echo -e "${YELLOW}⚠️ Arquivo .env.example não encontrado. Criando .env vazio...${NC}"
    
    # Criar .env vazio se não houver .env.example
    if [ ! -f .env ]; then
        cat > .env << EOF
# Configurações do servidor
PORT=3000
NODE_ENV=development

# Segurança
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRATION=24h

# Railway
RAILWAY_API_TOKEN=

# Configurações de deploy
REPO_PATH=./repos
MAX_CONCURRENT_DEPLOYS=3
EOF
    fi
    
    echo -e "${GREEN}✅ Arquivo .env criado. Por favor, edite-o com suas configurações.${NC}"
fi

# Iniciar servidor
echo -e "${BLUE}🚀 Iniciando servidor...${NC}"
npm start
