#!/bin/bash

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verificando deploy da API na Railway...${NC}"

# Obter URL do projeto
URL=$(railway domain 2>/dev/null)

if [ -z "$URL" ]; then
    echo -e "${RED}❌ Não foi possível obter a URL do projeto${NC}"
    echo "Execute: railway domain"
    exit 1
fi

FULL_URL="https://$URL"
echo -e "${BLUE}🌐 Testando: $FULL_URL${NC}"

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "${BLUE}📡 Testando $description...${NC}"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$FULL_URL$endpoint")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $description OK (Status: $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description falhou (Status: $response)${NC}"
        if [ -f /tmp/response.json ]; then
            echo "Resposta:"
            cat /tmp/response.json
            echo ""
        fi
        return 1
    fi
}

# Função para testar endpoint com autenticação
test_auth_endpoint() {
    local endpoint=$1
    local description=$2
    local token=$3
    
    echo -e "${BLUE}📡 Testando $description (com auth)...${NC}"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
        -H "Authorization: Bearer $token" \
        "$FULL_URL$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $description OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $description falhou (Status: $response)${NC}"
        return 1
    fi
}

# Testes básicos
echo -e "${BLUE}🧪 Iniciando testes básicos...${NC}"

test_endpoint "/" "Página inicial"
test_endpoint "/api/health" "Health check"
test_endpoint "/docs" "Documentação" 200

# Teste de autenticação
echo -e "${BLUE}🔐 Testando autenticação...${NC}"

auth_response=$(curl -s -X POST "$FULL_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

if echo "$auth_response" | grep -q "token"; then
    echo -e "${GREEN}✅ Autenticação OK${NC}"
    
    # Extrair token
    token=$(echo "$auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$token" ]; then
        echo -e "${BLUE}🎫 Token obtido, testando endpoints protegidos...${NC}"
        
        test_auth_endpoint "/api/deploy" "Endpoint de deploy" "$token"
        test_auth_endpoint "/api/projects" "Endpoint de projetos" "$token"
    fi
else
    echo -e "${RED}❌ Falha na autenticação${NC}"
    echo "Resposta: $auth_response"
fi

# Teste de performance
echo -e "${BLUE}⚡ Testando performance...${NC}"

start_time=$(date +%s%N)
curl -s "$FULL_URL/api/health" > /dev/null
end_time=$(date +%s%N)

response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 2000 ]; then
    echo -e "${GREEN}✅ Performance OK (${response_time}ms)${NC}"
else
    echo -e "${YELLOW}⚠️ Performance lenta (${response_time}ms)${NC}"
fi

# Verificar logs
echo -e "${BLUE}📝 Verificando logs recentes...${NC}"
railway logs --tail 10

echo ""
echo -e "${BLUE}📊 Resumo do Deploy:${NC}"
echo -e "${GREEN}🌐 URL da API: $FULL_URL${NC}"
echo -e "${GREEN}🏥 Health Check: $FULL_URL/api/health${NC}"
echo -e "${GREEN}📚 Documentação: $FULL_URL/docs${NC}"
echo -e "${GREEN}🔐 Login: $FULL_URL/api/auth/login${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo -e "${YELLOW}railway logs --tail 50    # Ver logs${NC}"
echo -e "${YELLOW}railway status            # Ver status${NC}"
echo -e "${YELLOW}railway variables         # Ver variáveis${NC}"
echo -e "${YELLOW}railway open              # Abrir dashboard${NC}"

# Limpar arquivo temporário
rm -f /tmp/response.json

echo ""
echo -e "${GREEN}✅ Verificação concluída!${NC}"
