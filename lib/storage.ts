// Sistema de armazenamento local para simular banco de dados
export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  active: boolean
  stock: number
}

export interface OpeningHours {
  [key: string]: { start: string; end: string; active: boolean }
}

export interface ShippingRate {
  id: string
  cep: string
  region: string
  neighborhood?: string
  price: number
}

export interface Sale {
  id: string
  date: string
  customerName: string
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>
  total: number
  shipping: number
  status: "pending" | "confirmed" | "delivered"
}

export interface PopupSettings {
  enabled: boolean
  showWhenClosed: boolean
  showWhenOpen: boolean
  title: string
  message: string
  scheduleButtonText: string
  closeButtonText: string
  backgroundColor: string
  textColor: string
  accentColor: string
}

// Função para broadcast seguro
const safeBroadcast = (type: string, payload: any) => {
  if (typeof window !== "undefined") {
    // Tentar importar e usar broadcast apenas no cliente
    import("@/app/api/realtime/route")
      .then(({ broadcastUpdate }) => {
        if (typeof broadcastUpdate === "function") {
          broadcastUpdate(type, payload)
        }
      })
      .catch(() => {
        // Ignorar erros de import no cliente
      })
  }
}

// Produtos padrão
const defaultProducts: Product[] = [
  // Energéticos
  {
    id: "energetico-1",
    name: "Red Bull Original",
    price: 8.5,
    image: "/placeholder.svg?height=200&width=200",
    category: "energetico",
    description: "Energético clássico",
    active: true,
    stock: 50,
  },
  {
    id: "energetico-2",
    name: "Monster Energy",
    price: 9.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "energetico",
    description: "Energético premium",
    active: true,
    stock: 30,
  },
  {
    id: "energetico-3",
    name: "TNT Energy",
    price: 7.5,
    image: "/placeholder.svg?height=200&width=200",
    category: "energetico",
    description: "Energético nacional",
    active: true,
    stock: 25,
  },
  {
    id: "energetico-4",
    name: "Fusion Energy",
    price: 8.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "energetico",
    description: "Energético sabor tropical",
    active: true,
    stock: 40,
  },

  // Whisky
  {
    id: "whisky-1",
    name: "Jack Daniels",
    price: 89.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "whisky",
    description: "Whisky americano premium",
    active: true,
    stock: 15,
  },
  {
    id: "whisky-2",
    name: "Johnnie Walker Red",
    price: 65.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "whisky",
    description: "Whisky escocês",
    active: true,
    stock: 20,
  },

  // Vodka
  {
    id: "vodka-1",
    name: "Smirnoff",
    price: 35.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "vodka",
    description: "Vodka premium",
    active: true,
    stock: 25,
  },
  {
    id: "vodka-2",
    name: "Absolut",
    price: 45.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "vodka",
    description: "Vodka sueca",
    active: true,
    stock: 18,
  },

  // Gin
  {
    id: "gin-1",
    name: "Bombay Sapphire",
    price: 55.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "gin",
    description: "Gin premium inglês",
    active: true,
    stock: 12,
  },

  // Cerveja
  {
    id: "cerveja-1",
    name: "Heineken",
    price: 4.5,
    image: "/placeholder.svg?height=200&width=200",
    category: "cerveja",
    description: "Cerveja holandesa",
    active: true,
    stock: 100,
  },
  {
    id: "cerveja-2",
    name: "Stella Artois",
    price: 5.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "cerveja",
    description: "Cerveja belga",
    active: true,
    stock: 80,
  },

  // Gelo
  {
    id: "gelo-1",
    name: "Gelo em Cubos 2kg",
    price: 3.5,
    image: "/placeholder.svg?height=200&width=200",
    category: "gelo",
    description: "Gelo em cubos tradicional",
    active: true,
    stock: 200,
  },
  {
    id: "gelo-2",
    name: "Gelo Cristal 2kg",
    price: 4.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "gelo",
    description: "Gelo cristal premium",
    active: true,
    stock: 150,
  },
  {
    id: "gelo-3",
    name: "Gelo Seco 1kg",
    price: 8.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "gelo",
    description: "Gelo seco para drinks especiais",
    active: true,
    stock: 50,
  },
  {
    id: "gelo-4",
    name: "Gelo Picado 2kg",
    price: 3.0,
    image: "/placeholder.svg?height=200&width=200",
    category: "gelo",
    description: "Gelo picado para coquetéis",
    active: true,
    stock: 180,
  },

  // Essência
  {
    id: "essencia-1",
    name: "Zomo Strong",
    price: 25.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "essencia",
    description: "Essência premium",
    active: true,
    stock: 40,
  },

  // Carvão
  {
    id: "carvao-1",
    name: "Carvão Coco Premium",
    price: 15.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "carvao",
    description: "Carvão de coco natural",
    active: true,
    stock: 60,
  },

  // Diversos
  {
    id: "diversos-1",
    name: "Limão Tahiti",
    price: 2.5,
    image: "/placeholder.svg?height=200&width=200",
    category: "diversos",
    description: "Limão fresco para drinks",
    active: true,
    stock: 100,
  },
]

const defaultHours: OpeningHours = {
  quinta: { start: "18:00", end: "00:00", active: true },
  sexta: { start: "18:00", end: "03:00", active: true },
  sabado: { start: "18:00", end: "03:00", active: true },
  domingo: { start: "15:00", end: "00:00", active: true },
}

const defaultPopupSettings: PopupSettings = {
  enabled: true,
  showWhenClosed: true,
  showWhenOpen: false,
  title: "🕐 Horário de Funcionamento",
  message: "Estamos fechados no momento. Confira nossos horários de funcionamento abaixo.",
  scheduleButtonText: "Agendar Pedido",
  closeButtonText: "Fechar",
  backgroundColor: "#1f2937", // bg-gray-900
  textColor: "#f3f4f6", // text-gray-100
  accentColor: "#facc15", // text-yellow-400
}

const defaultShippingRates: ShippingRate[] = [
  { id: "1", cep: "01", region: "Centro", price: 5.0 },
  { id: "2", cep: "02", region: "Zona Norte", price: 7.0 },
  { id: "3", cep: "03", region: "Zona Leste", price: 8.0 },
  { id: "4", cep: "04", region: "Zona Sul", price: 9.0 },
  { id: "5", cep: "05", region: "Zona Oeste", price: 10.0 },
  { id: "6", cep: "06", region: "Osasco", price: 12.0 },
  { id: "7", cep: "07", region: "Guarulhos", price: 15.0 },
  { id: "8", cep: "08", region: "São Miguel", price: 15.0 },
  { id: "9", cep: "09", region: "Santo André", price: 18.0 },
  // Bairros específicos
  { id: "10", cep: "", region: "", neighborhood: "Vila Medeiros", price: 5.0 },
  { id: "11", cep: "", region: "", neighborhood: "Jardins", price: 8.0 },
  { id: "12", cep: "", region: "", neighborhood: "Vila Mariana", price: 9.0 },
  { id: "13", cep: "", region: "", neighborhood: "Moema", price: 10.0 },
  { id: "14", cep: "", region: "", neighborhood: "Pinheiros", price: 10.0 },
  { id: "15", cep: "", region: "", neighborhood: "Itaim Bibi", price: 12.0 },
  { id: "16", cep: "", region: "", neighborhood: "Morumbi", price: 15.0 },
  { id: "17", cep: "", region: "", neighborhood: "Tatuapé", price: 12.0 },
  { id: "18", cep: "", region: "", neighborhood: "Santana", price: 12.0 },
  { id: "19", cep: "", region: "", neighborhood: "Vila Madalena", price: 10.0 },
]

// Funções de armazenamento com sincronização
export const getProducts = (): Product[] => {
  if (typeof window === "undefined") return defaultProducts
  const stored = localStorage.getItem("adega_products")
  return stored ? JSON.parse(stored) : defaultProducts
}

export const saveProducts = (products: Product[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("adega_products", JSON.stringify(products))

  // Broadcast da atualização
  safeBroadcast("products_updated", products)

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("productsUpdated"))
}

export const getOpeningHours = (): OpeningHours => {
  if (typeof window === "undefined") return defaultHours
  const stored = localStorage.getItem("adega_hours")
  return stored ? JSON.parse(stored) : defaultHours
}

export const saveOpeningHours = (hours: OpeningHours) => {
  if (typeof window === "undefined") return
  localStorage.setItem("adega_hours", JSON.stringify(hours))

  // Broadcast da atualização
  safeBroadcast("hours_updated", hours)

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("hoursUpdated"))
}

export const getPopupSettings = (): PopupSettings => {
  if (typeof window === "undefined") return defaultPopupSettings
  const stored = localStorage.getItem("adega_popup")
  return stored ? JSON.parse(stored) : defaultPopupSettings
}

export const savePopupSettings = (settings: PopupSettings) => {
  if (typeof window === "undefined") return
  localStorage.setItem("adega_popup", JSON.stringify(settings))

  // Broadcast da atualização
  safeBroadcast("popup_updated", settings)

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("popupUpdated"))
}

export const getShippingRates = (): ShippingRate[] => {
  if (typeof window === "undefined") return defaultShippingRates
  const stored = localStorage.getItem("adega_shipping")
  return stored ? JSON.parse(stored) : defaultShippingRates
}

export const saveShippingRates = (rates: ShippingRate[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("adega_shipping", JSON.stringify(rates))

  // Broadcast da atualização
  safeBroadcast("shipping_updated", rates)

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("shippingUpdated"))
}

export const getSales = (): Sale[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("adega_sales")
  return stored ? JSON.parse(stored) : []
}

export const saveSale = (sale: Sale) => {
  if (typeof window === "undefined") return
  const sales = getSales()
  sales.push(sale)
  localStorage.setItem("adega_sales", JSON.stringify(sales))

  // Broadcast da atualização
  safeBroadcast("sales_updated", sales)

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("salesUpdated"))
}

export const resetSales = () => {
  if (typeof window === "undefined") return
  localStorage.setItem("adega_sales", JSON.stringify([]))

  // Broadcast da atualização
  safeBroadcast("sales_updated", [])

  // Evento local para compatibilidade
  window.dispatchEvent(new CustomEvent("salesUpdated"))
}

export const calculateShippingByCEP = (cep: string, neighborhood = ""): number => {
  const rates = getShippingRates()

  // Primeiro, verificar por bairro específico
  if (neighborhood) {
    const neighborhoodLower = neighborhood.toLowerCase()
    const neighborhoodRate = rates.find((r) => r.neighborhood && r.neighborhood.toLowerCase() === neighborhoodLower)
    if (neighborhoodRate) return neighborhoodRate.price
  }

  // Se não encontrou pelo bairro, tenta pelo CEP
  if (cep && cep.length >= 2) {
    const prefix = cep.substring(0, 2)
    const cepRate = rates.find((r) => r.cep === prefix)
    if (cepRate) return cepRate.price
  }

  // Valor padrão se não encontrar
  return 10.0
}

// Inicializar dados se não existirem
export const initializeData = () => {
  if (typeof window === "undefined") return

  if (!localStorage.getItem("adega_products")) {
    saveProducts(defaultProducts)
  }
  if (!localStorage.getItem("adega_hours")) {
    saveOpeningHours(defaultHours)
  }
  if (!localStorage.getItem("adega_shipping")) {
    saveShippingRates(defaultShippingRates)
  }
  if (!localStorage.getItem("adega_popup")) {
    savePopupSettings(defaultPopupSettings)
  }
}
