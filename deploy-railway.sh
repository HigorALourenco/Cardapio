#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 Deploy Automatizado na Railway - API Deploy${NC}"
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️ Railway CLI não encontrado. Instalando...${NC}"
    npm install -g @railway/cli
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha ao instalar Railway CLI${NC}"
        exit 1
    fi
fi

# Verificar se está logado
echo -e "${BLUE}🔐 Verificando autenticação...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️ Não está logado na Railway. Fazendo login...${NC}"
    railway login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha no login da Railway${NC}"
        exit 1
    fi
fi

# Limpar arquivos temporários
echo -e "${BLUE}🧹 Limpando arquivos temporários...${NC}"
rm -rf node_modules/.cache
rm -rf logs/*
rm -rf repos/*

# Verificar se o projeto já existe
echo -e "${BLUE}📋 Verificando projeto...${NC}"
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Projeto não encontrado. Criando novo projeto...${NC}"
    railway init railway-deploy-api
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha ao criar projeto${NC}"
        exit 1
    fi
fi

# Configurar variáveis de ambiente essenciais
echo -e "${BLUE}🔧 Configurando variáveis de ambiente...${NC}"

# Gerar JWT_SECRET se não existir
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "railway_deploy_api_secret_$(date +%s)")

railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRATION=24h
railway variables set REPO_PATH=/app/repos
railway variables set MAX_CONCURRENT_DEPLOYS=5
railway variables set LOG_LEVEL=info

# Perguntar se o usuário quer configurar o token da Railway
read -p "Deseja configurar o RAILWAY_API_TOKEN agora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Digite seu Railway API Token: " RAILWAY_TOKEN
    if [ ! -z "$RAILWAY_TOKEN" ]; then
        railway variables set RAILWAY_API_TOKEN="$RAILWAY_TOKEN"
        echo -e "${GREEN}✅ Token da Railway configurado${NC}"
    fi
fi

# Fazer deploy
echo -e "${BLUE}🚀 Iniciando deploy...${NC}"
railway up --detach

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha no deploy${NC}"
    exit 1
fi

# Aguardar um pouco para o deploy processar
echo -e "${BLUE}⏳ Aguardando deploy processar...${NC}"
sleep 15

# Verificar status do deploy
echo -e "${BLUE}📊 Verificando status do deploy...${NC}"
railway status

# Tentar obter URL do projeto
echo -e "${BLUE}🌐 Obtendo URL do projeto...${NC}"
PROJECT_URL=$(railway domain 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$PROJECT_URL" ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo -e "${GREEN}🌐 URL da API: https://$PROJECT_URL${NC}"
    echo -e "${GREEN}🏥 Health Check: https://$PROJECT_URL/api/health${NC}"
    echo -e "${GREEN}📚 Documentação: https://$PROJECT_URL/docs${NC}"
    echo -e "${GREEN}🔐 Login: https://$PROJECT_URL/api/auth/login${NC}"
    echo ""
    echo -e "${BLUE}📋 Credenciais padrão:${NC}"
    echo -e "${YELLOW}👤 Usuário: admin${NC}"
    echo -e "${YELLOW}🔑 Senha: admin123${NC}"
    echo ""
    echo -e "${BLUE}🔧 Para gerenciar o projeto:${NC}"
    echo -e "${YELLOW}📊 Status: railway status${NC}"
    echo -e "${YELLOW}📝 Logs: railway logs${NC}"
    echo -e "${YELLOW}⚙️ Variáveis: railway variables${NC}"
    echo -e "${YELLOW}🌐 Abrir dashboard: railway open${NC}"
    
    # Testar health check
    echo -e "${BLUE}🧪 Testando health check...${NC}"
    sleep 5
    
    if curl -s "https://$PROJECT_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passou!${NC}"
    else
        echo -e "${YELLOW}⚠️ Health check ainda não está respondendo. Aguarde alguns minutos.${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️ Deploy concluído, mas URL não disponível ainda.${NC}"
    echo -e "${YELLOW}Use 'railway domain' para obter a URL quando estiver pronta.${NC}"
    echo -e "${YELLOW}Use 'railway logs' para acompanhar o progresso.${NC}"
fi

echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo -e "${YELLOW}1. Aguarde alguns minutos para o serviço ficar totalmente ativo${NC}"
echo -e "${YELLOW}2. Teste a API usando a documentação em /docs${NC}"
echo -e "${YELLOW}3. Configure seu token da Railway se ainda não fez${NC}"
echo -e "${YELLOW}4. Comece a fazer deploys usando a API!${NC}"
