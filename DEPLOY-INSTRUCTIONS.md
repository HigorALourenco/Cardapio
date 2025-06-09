# 🚀 Instruções de Deploy na Railway

## Pré-requisitos

1. **Conta na Railway**: [railway.app](https://railway.app)
2. **Git**: Para versionamento
3. **Node.js 18+**: Para desenvolvimento local

## 🚀 Deploy Rápido (Recomendado)

### Opção 1: Script Automatizado

\`\`\`bash
# 1. Dar permissão ao script
chmod +x deploy-railway.sh

# 2. Executar deploy
./deploy-railway.sh
\`\`\`

### Opção 2: Deploy Manual

\`\`\`bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Inicializar projeto
railway init railway-deploy-api

# 4. Configurar variáveis de ambiente
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_EXPIRATION=24h
railway variables set REPO_PATH=/app/repos
railway variables set MAX_CONCURRENT_DEPLOYS=5

# 5. Fazer deploy
railway up
\`\`\`

## 🔧 Configuração Pós-Deploy

### 1. Obter URL do Projeto

\`\`\`bash
railway domain
\`\`\`

### 2. Testar API

\`\`\`bash
# Health check
curl https://sua-api.railway.app/api/health

# Login
curl -X POST https://sua-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
\`\`\`

### 3. Configurar Token da Railway (Opcional)

Para usar a API para fazer deploys de outros projetos:

\`\`\`bash
# Obter token em: https://railway.app/account/tokens
railway variables set RAILWAY_API_TOKEN=seu_token_aqui
\`\`\`

## 📊 Monitoramento

### Ver Logs

\`\`\`bash
railway logs --tail 50
\`\`\`

### Ver Status

\`\`\`bash
railway status
\`\`\`

### Ver Variáveis

\`\`\`bash
railway variables
\`\`\`

### Abrir Dashboard

\`\`\`bash
railway open
\`\`\`

## 🔧 Solução de Problemas

### Deploy Falha

1. **Verificar logs**:
   \`\`\`bash
   railway logs
   \`\`\`

2. **Verificar variáveis**:
   \`\`\`bash
   railway variables
   \`\`\`

3. **Redeploy**:
   \`\`\`bash
   railway up --detach
   \`\`\`

### API não Responde

1. **Verificar se o serviço está rodando**:
   \`\`\`bash
   railway status
   \`\`\`

2. **Verificar health check**:
   \`\`\`bash
   curl https://sua-api.railway.app/api/health
   \`\`\`

3. **Verificar logs de erro**:
   \`\`\`bash
   railway logs --tail 100
   \`\`\`

### Problemas de Autenticação

1. **Verificar JWT_SECRET**:
   \`\`\`bash
   railway variables | grep JWT_SECRET
   \`\`\`

2. **Regenerar JWT_SECRET se necessário**:
   \`\`\`bash
   railway variables set JWT_SECRET=$(openssl rand -hex 32)
   \`\`\`

## 🌟 Recursos Disponíveis

Após o deploy, sua API terá:

- **Endpoint Principal**: `https://sua-api.railway.app`
- **Health Check**: `https://sua-api.railway.app/api/health`
- **Documentação**: `https://sua-api.railway.app/docs`
- **Autenticação**: `https://sua-api.railway.app/api/auth/login`
- **Deploy API**: `https://sua-api.railway.app/api/deploy`

## 🔐 Credenciais Padrão

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **Importante**: Altere as credenciais padrão em produção!

## 📝 Próximos Passos

1. Teste todos os endpoints usando a documentação
2. Configure seu token da Railway para deploys
3. Integre com seus sistemas CI/CD
4. Configure webhooks se necessário
5. Monitore logs e performance

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `railway logs`
2. Consulte a documentação: `/docs`
3. Teste o health check: `/api/health`
4. Verifique as variáveis de ambiente
