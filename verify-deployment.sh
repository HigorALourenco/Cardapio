#!/bin/bash

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verificando deployment na Railway...${NC}"

# Obter URL do projeto
URL=$(railway domain 2>/dev/null)

if [ -z "$URL" ]; then
    echo -e "${RED}❌ Não foi possível obter a URL do projeto${NC}"
    echo "Execute: railway domain"
    exit 1
fi

FULL_URL="https://$URL"

echo -e "${BLUE}🌐 Testando: $FULL_URL${NC}"

# Testar página principal
echo -e "${BLUE}📄 Testando página principal...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Página principal OK${NC}"
else
    echo -e "${RED}❌ Página principal com problemas${NC}"
fi

# Testar página admin
echo -e "${BLUE}🔐 Testando página admin...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$FULL_URL/admin" | grep -q "200"; then
    echo -e "${GREEN}✅ Página admin OK${NC}"
else
    echo -e "${RED}❌ Página admin com problemas${NC}"
fi

# Testar API de realtime
echo -e "${BLUE}⚡ Testando API realtime...${NC}"
if curl -s -H "Accept: text/event-stream" "$FULL_URL/api/realtime" | head -1 | grep -q "data:"; then
    echo -e "${GREEN}✅ API realtime OK${NC}"
else
    echo -e "${RED}❌ API realtime com problemas${NC}"
fi

echo -e "${BLUE}📊 Verificação concluída!${NC}"
echo -e "${GREEN}🌐 Site: $FULL_URL${NC}"
echo -e "${GREEN}🔐 Admin: $FULL_URL/admin${NC}"
echo -e "${GREEN}👤 Login: admin / 312890${NC}"
