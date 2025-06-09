// Função para validar CEP
export function isValidCEP(cep: string): boolean {
  const cepRegex = /^[0-9]{8}$/
  return cepRegex.test(cep)
}

// Função para formatar CEP (12345678 -> 12345-678)
export function formatCEP(cep: string): string {
  if (!cep) return ""
  cep = cep.replace(/\D/g, "")
  if (cep.length !== 8) return cep
  return `${cep.substring(0, 5)}-${cep.substring(5)}`
}

// Mapeamento de regiões por CEP
export const shippingRatesByCEP: Record<string, number> = {
  // São Paulo - Capital (exemplos)
  "01": 5.0, // Centro
  "02": 7.0, // Zona Norte
  "03": 8.0, // Zona Leste
  "04": 9.0, // Zona Sul
  "05": 10.0, // Zona Oeste
  "06": 12.0, // Osasco
  "07": 15.0, // Guarulhos
  "08": 15.0, // São Miguel Paulista
  "09": 18.0, // Santo André
}

// Mapeamento de bairros
export const shippingRatesByNeighborhood: Record<string, number> = {
  "Vila Medeiros": 5.0,
  jardins: 8.0,
  "vila mariana": 9.0,
  moema: 10.0,
  pinheiros: 10.0,
  "itaim bibi": 12.0,
  morumbi: 15.0,
  tatuapé: 12.0,
  santana: 12.0,
  "vila madalena": 10.0,
}

// Função para calcular frete baseado no CEP
export function calculateShippingByCEP(cep: string, neighborhood = ""): number {
  // Verificar se o bairro está no mapeamento
  if (neighborhood) {
    const neighborhoodLower = neighborhood.toLowerCase()
    if (shippingRatesByNeighborhood[neighborhoodLower]) {
      return shippingRatesByNeighborhood[neighborhoodLower]
    }
  }

  // Se não encontrou pelo bairro, tenta pelo CEP
  if (cep && cep.length >= 2) {
    const prefix = cep.substring(0, 2)
    if (shippingRatesByCEP[prefix]) {
      return shippingRatesByCEP[prefix]
    }
  }

  // Valor padrão se não encontrar
  return 10.0
}
