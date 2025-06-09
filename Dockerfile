FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache git openssh-client

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs repos

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
