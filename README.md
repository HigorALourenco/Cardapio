# Railway Deploy API

API para automatizar deploys na Railway através de chamadas HTTP.

## 🚀 Recursos

- ✅ Autenticação JWT para segurança
- ✅ Deploy automático de repositórios Git
- ✅ Monitoramento de status de deploy
- ✅ Integração com Railway CLI
- ✅ Documentação interativa
- ✅ Logs detalhados
- ✅ Tratamento de erros robusto
- ✅ Rate limiting para proteção contra abusos

## 📋 Requisitos

- Node.js 18 ou superior
- Railway CLI (será instalado automaticamente se não estiver presente)
- Git

## 🛠️ Instalação

### Instalação Local

\`\`\`bash
# Clonar o repositório
git clone https://github.com/seu-usuario/railway-deploy-api.git
cd railway-deploy-api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar servidor
npm start
\`\`\`

### Instalação com Docker

\`\`\`bash
# Clonar o repositório
git clone https://github.com/seu-usuario/railway-deploy-api.git
cd railway-deploy-api

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar com Docker Compose
docker-compose up -d
\`\`\`

## 🔧 Configuração

Edite o arquivo `.env` com suas configurações:

\`\`\`env
# Configurações do servidor
PORT=3000
NODE_ENV=development

# Segurança
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRATION=24h

# Railway
RAILWAY_API_TOKEN=seu_token_da_railway

# Configurações de deploy
REPO_PATH=./repos
MAX_CONCURRENT_DEPLOYS=3
\`\`\`

## 📚 Documentação

A documentação interativa está disponível em:

\`\`\`
http://localhost:3000/docs
\`\`\`

## 🔑 Autenticação

Para usar a API, você precisa obter um token JWT:

\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
\`\`\`

## 🚀 Exemplos de Uso

### Iniciar um Deploy

\`\`\`bash
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "repoUrl": "https://github.com/username/repo.git",
    "branch": "main"
  }'
\`\`\`

### Verificar Status do Deploy

\`\`\`bash
curl -X GET http://localhost:3000/api/deploy/ID_DO_DEPLOY \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
\`\`\`

### Listar Todos os Deploys

\`\`\`bash
curl -X GET http://localhost:3000/api/deploy \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
\`\`\`

## 🐳 Deploy com Docker

Para fazer deploy da própria API na Railway:

\`\`\`bash
# Fazer login na Railway
railway login

# Inicializar projeto
railway init

# Fazer deploy
railway up
\`\`\`

## 📝 Logs

Os logs são armazenados no diretório `logs/`:

- `logs/error.log`: Erros
- `logs/combined.log`: Todos os logs

## 🔒 Segurança

- Autenticação JWT
- Rate limiting
- Helmet para headers de segurança
- Validação de entrada com Joi

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, sinta-se à vontade para enviar um Pull Request.

## 📄 Licença

Este projeto está licenciado sob a licença MIT.
