#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configurando projeto Adega Online com pnpm${NC}"

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}pnpm não encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

# Instalar dependências com pnpm
echo -e "${BLUE}📦 Instalando dependências...${NC}"
pnpm install

# Limpar cache se necessário
if [ "$1" == "--clean" ]; then
    echo -e "${BLUE}🧹 Limpando cache...${NC}"
    pnpm store prune
    rm -rf node_modules .next
    pnpm install
fi

# Verificar instalação
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependências instaladas com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências. Tentando solução alternativa...${NC}"
    # Solução alternativa
    rm -rf node_modules .next pnpm-lock.yaml
    pnpm install --shamefully-hoist
fi

# Build do projeto
echo -e "${BLUE}🏗️ Construindo projeto...${NC}"
pnpm run build

# Verificar build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
    echo -e "${GREEN}🌐 Você pode iniciar o servidor com: pnpm start${NC}"
    echo -e "${GREEN}🧪 Ou iniciar em modo desenvolvimento com: pnpm dev${NC}"
else
    echo -e "${RED}❌ Erro no build. Verifique os logs acima.${NC}"
    exit 1
fi
