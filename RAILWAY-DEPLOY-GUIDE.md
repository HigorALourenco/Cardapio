# Guia Completo de Deploy na Railway

## Pré-requisitos

1. **Conta na Railway**: Crie em [railway.app](https://railway.app)
2. **Railway CLI**: Será instalado automaticamente pelo script
3. **Git**: Para versionamento do código

## Passo a Passo

### 1. Preparar o Projeto

\`\`\`bash
# Clonar ou navegar para o diretório do projeto
cd adega-online

# Dar permissão aos scripts
chmod +x deploy-railway.sh
chmod +x setup-railway-env.sh
\`\`\`

### 2. Fazer Login na Railway

\`\`\`bash
# O script fará isso automaticamente, mas você pode fazer manualmente:
npx @railway/cli login
\`\`\`

### 3. Executar Deploy

\`\`\`bash
# Deploy automático
./deploy-railway.sh
\`\`\`

### 4. Configurar Variáveis (Opcional)

\`\`\`bash
# Configurar variáveis de ambiente
./setup-railway-env.sh
\`\`\`

## Comandos Úteis

### Monitoramento

\`\`\`bash
# Ver logs em tempo real
railway logs

# Ver status do projeto
railway status

# Ver variáveis de ambiente
railway variables
\`\`\`

### Gerenciamento

\`\`\`bash
# Redeploy
railway up

# Conectar a um projeto existente
railway link

# Abrir dashboard no navegador
railway open
\`\`\`

## Solução de Problemas

### Build Falha

Se o build falhar, tente:

\`\`\`bash
# Limpar cache local
rm -rf .next node_modules
pnpm install
pnpm run build

# Se funcionar localmente, faça redeploy
railway up
\`\`\`

### Aplicação não Inicia

Verifique as variáveis de ambiente:

\`\`\`bash
railway variables
\`\`\`

Certifique-se de que PORT está definida como 3000.

### Problemas de Conectividade

Verifique se a aplicação está rodando:

\`\`\`bash
railway logs --tail
\`\`\`

## URLs Importantes

Após o deploy, você terá:

- **Site Principal**: https://seu-projeto.railway.app
- **Painel Admin**: https://seu-projeto.railway.app/admin
- **Credenciais**: admin / 312890

## Configurações Avançadas

### Custom Domain

Para usar um domínio personalizado:

1. Vá para o dashboard da Railway
2. Clique em "Settings" > "Domains"
3. Adicione seu domínio
4. Configure o DNS conforme instruído

### Scaling

A Railway escala automaticamente, mas você pode configurar:

1. Dashboard > Settings > Resources
2. Ajustar CPU e RAM conforme necessário

### Backup

Para fazer backup dos dados:

\`\`\`bash
# Os dados estão no localStorage do navegador
# Para backup, exporte via painel admin
\`\`\`
\`\`\`

## 7️⃣ **Verificação de Deploy**

Vamos criar um script para verificar se tudo está funcionando:
