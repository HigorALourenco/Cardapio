# Guia de Uso do pnpm com Adega Online

## Instalação

1. **Instale o pnpm globalmente**:
   \`\`\`bash
   npm install -g pnpm
   \`\`\`

2. **Clone o repositório**:
   \`\`\`bash
   git clone <seu-repositorio>
   cd adega-online
   \`\`\`

3. **Instale as dependências**:
   \`\`\`bash
   pnpm install
   \`\`\`

## Comandos Comuns

- **Iniciar em modo desenvolvimento**:
  \`\`\`bash
  pnpm dev
  \`\`\`

- **Construir para produção**:
  \`\`\`bash
  pnpm build
  \`\`\`

- **Iniciar em modo produção**:
  \`\`\`bash
  pnpm start
  \`\`\`

- **Limpar cache (se ocorrerem problemas)**:
  \`\`\`bash
  pnpm store prune
  rm -rf node_modules .next
  pnpm install
  \`\`\`

## Solução de Problemas

### Erro: Cannot find module

Se você encontrar erros do tipo "Cannot find module", tente:

\`\`\`bash
pnpm install --shamefully-hoist
\`\`\`

### Erro: Incompatible peer dependencies

Se você encontrar erros de dependências incompatíveis:

\`\`\`bash
pnpm install --force
\`\`\`

### Erro: Failed to resolve dependencies

Se ocorrerem falhas na resolução de dependências:

\`\`\`bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
\`\`\`

## Deploy

### Vercel

A configuração já está pronta no arquivo `vercel.json`. Apenas conecte seu repositório e a Vercel detectará automaticamente o uso do pnpm.

### Netlify

Use o arquivo `netlify.toml` incluído no projeto. Certifique-se de que o Netlify está configurado para usar pnpm.

### Docker

Execute:

\`\`\`bash
docker build -t adega-online .
docker run -p 3000:3000 adega-online
\`\`\`

## Verificação de Instalação

Para verificar se o pnpm está configurado corretamente:

\`\`\`bash
pnpm list
\`\`\`

Você deve ver todas as dependências listadas sem erros.
