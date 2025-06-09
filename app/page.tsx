"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Clock, MapPin, Phone, Star, CreditCard, X, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import {
  getProducts,
  getOpeningHours,
  calculateShippingByCEP,
  saveSale,
  initializeData,
  type Product,
  type OpeningHours,
} from "@/lib/storage"
import { getRealtimeSync } from "@/lib/realtime"
import ComboSelector from "@/components/combo-selector"

interface CartItem extends Product {
  quantity: number
}

export default function AdegaOnline() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isHoursPopupOpen, setIsHoursPopupOpen] = useState(false)
  const [popupDismissed, setPopupDismissed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(true)
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    quinta: { start: "18:00", end: "00:00", active: true },
    sexta: { start: "18:00", end: "03:00", active: true },
    sabado: { start: "18:00", end: "03:00", active: true },
    domingo: { start: "15:00", end: "00:00", active: true },
  })
  const [activeCategory, setActiveCategory] = useState("energetico")
  const [currentPage, setCurrentPage] = useState(1)
  const [shippingCost, setShippingCost] = useState(0)
  const [cep, setCep] = useState("")
  const [addressNumber, setAddressNumber] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    address: "",
    neighborhood: "",
    complement: "",
    paymentMethod: "",
    city: "",
    state: "",
  })

  const [isComboSelectorOpen, setIsComboSelectorOpen] = useState(false)
  const [comboTriggerProduct, setComboTriggerProduct] = useState<Product | null>(null)

  const itemsPerPage = 5
  const categories = [
    { id: "energetico", name: "Energéticos", icon: "⚡" },
    { id: "whisky", name: "Whisky", icon: "🥃" },
    { id: "vodka", name: "Vodka", icon: "🍸" },
    { id: "gin", name: "Gin", icon: "🍹" },
    { id: "cerveja", name: "Cerveja", icon: "🍺" },
    { id: "gelo", name: "Gelo", icon: "🧊" },
    { id: "essencia", name: "Essência", icon: "🌿" },
    { id: "carvao", name: "Carvão", icon: "🔥" },
    { id: "diversos", name: "Diversos", icon: "🛒" },
  ]

  // Inicializar dados e sincronização em tempo real
  useEffect(() => {
    initializeData()
    setProducts(getProducts())
    setOpeningHours(getOpeningHours())

    // Configurar sincronização em tempo real
    const realtimeSync = getRealtimeSync()
    if (realtimeSync) {
      // Inscrever-se em atualizações de produtos
      const unsubscribeProducts = realtimeSync.subscribe("products_updated", (updatedProducts: Product[]) => {
        console.log("📦 Produtos atualizados em tempo real")
        setProducts(updatedProducts)
        localStorage.setItem("adega_products", JSON.stringify(updatedProducts))
      })

      // Inscrever-se em atualizações de horários
      const unsubscribeHours = realtimeSync.subscribe("hours_updated", (updatedHours: OpeningHours) => {
        console.log("🕐 Horários atualizados em tempo real")
        setOpeningHours(updatedHours)
        localStorage.setItem("adega_hours", JSON.stringify(updatedHours))
      })

      // Monitorar status da conexão
      const unsubscribeConnection = realtimeSync.subscribe("connected", () => {
        setIsOnline(true)
      })

      const unsubscribeHeartbeat = realtimeSync.subscribe("heartbeat", () => {
        setIsOnline(true)
      })

      // Cleanup
      return () => {
        unsubscribeProducts()
        unsubscribeHours()
        unsubscribeConnection()
        unsubscribeHeartbeat()
      }
    }

    // Listeners locais para compatibilidade
    const handleProductsUpdate = () => setProducts(getProducts())
    const handleHoursUpdate = () => setOpeningHours(getOpeningHours())

    window.addEventListener("productsUpdated", handleProductsUpdate)
    window.addEventListener("hoursUpdated", handleHoursUpdate)

    return () => {
      window.removeEventListener("productsUpdated", handleProductsUpdate)
      window.removeEventListener("hoursUpdated", handleHoursUpdate)
    }
  }, [])

  // Monitorar conexão de rede
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Atualizar horário atual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Verificar se está aberto
  const isOpen = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTimeStr = now.toTimeString().slice(0, 5)

    let dayKey: keyof OpeningHours | null = null

    switch (dayOfWeek) {
      case 4:
        dayKey = "quinta"
        break
      case 5:
        dayKey = "sexta"
        break
      case 6:
        dayKey = "sabado"
        break
      case 0:
        dayKey = "domingo"
        break
      default:
        return false
    }

    if (!dayKey || !openingHours[dayKey]) return false

    const { start, end, active } = openingHours[dayKey]
    if (!active) return false

    if (end < start) {
      return currentTimeStr >= start || currentTimeStr <= end
    }

    return currentTimeStr >= start && currentTimeStr <= end
  }

  // Próximo horário de abertura
  const getNextOpeningTime = () => {
    const now = new Date()
    const openDays = [4, 5, 6, 0]

    for (let i = 1; i <= 7; i++) {
      const nextDay = new Date(now)
      nextDay.setDate(now.getDate() + i)
      const dayOfWeek = nextDay.getDay()

      if (openDays.includes(dayOfWeek)) {
        const dayNames = { 4: "Quinta", 5: "Sexta", 6: "Sábado", 0: "Domingo" }
        const dayKey = { 4: "quinta", 5: "sexta", 6: "sabado", 0: "domingo" }[dayOfWeek] as keyof OpeningHours
        if (openingHours[dayKey] && openingHours[dayKey].active) {
          return `${dayNames[dayOfWeek as keyof typeof dayNames]} às ${openingHours[dayKey].start}`
        }
      }
    }
    return "Quinta-feira às 18:00"
  }

  // Mostrar popup se fechado e não foi dispensado
  useEffect(() => {
    if (!isOpen() && !popupDismissed) {
      setIsHoursPopupOpen(true)
    }
  }, [currentTime, popupDismissed, openingHours])

  // Produtos da categoria atual (apenas ativos)
  const currentProducts = products.filter((p) => p.category === activeCategory && p.active)
  const totalPages = Math.ceil(currentProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedProducts = currentProducts.slice(startIndex, startIndex + itemsPerPage)

  // Funções do carrinho
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && quantity > product.stock) return

    setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalWithShipping = cartTotal + shippingCost

  const handleComboAdd = (product: Product) => {
    if (["whisky", "vodka", "gin"].includes(product.category)) {
      setComboTriggerProduct(product)
      setIsComboSelectorOpen(true)
    } else {
      addToCart(product)
    }
  }

  const handleComboSelection = (items: Array<{ product: Product; quantity: number }>) => {
    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart(item.product)
      }
    })
  }

  // Buscar endereço por CEP
  const fetchAddressByCep = async () => {
    if (cep.length !== 8) {
      alert("Por favor, digite um CEP válido com 8 dígitos")
      return
    }

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert("CEP não encontrado")
        return
      }

      setCustomerData((prev) => ({
        ...prev,
        address: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }))

      const shipping = calculateShippingByCEP(cep, data.bairro)
      setShippingCost(shipping)
    } catch (error) {
      alert("Erro ao buscar CEP")
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Enviar pedido via WhatsApp
  const sendOrderToWhatsApp = () => {
    const orderItems = cart
      .map((item) => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join("\n")

    const message =
      `🛒 *NOVO PEDIDO - ADEGA TABACARIA ANDRADE*\n\n` +
      `👤 *Cliente:* ${customerData.name}\n` +
      `📱 *Telefone:* ${customerData.phone}\n` +
      `📍 *Endereço:* ${customerData.address}, ${addressNumber}\n` +
      `🏘️ *Bairro:* ${customerData.neighborhood}\n` +
      `🏙️ *Cidade:* ${customerData.city || ""} - ${customerData.state || ""}\n` +
      `📮 *CEP:* ${cep.replace(/(\d{5})(\d{3})/, "$1-$2")}\n` +
      `🏠 *Complemento:* ${customerData.complement}\n` +
      `💳 *Pagamento:* ${customerData.paymentMethod}\n\n` +
      `📦 *ITENS DO PEDIDO:*\n${orderItems}\n\n` +
      `💰 *Subtotal:* R$ ${cartTotal.toFixed(2)}\n` +
      `🚚 *Frete:* R$ ${shippingCost.toFixed(2)}\n` +
      `💵 *TOTAL:* R$ ${totalWithShipping.toFixed(2)}`

    // Salvar venda
    const sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customerName: customerData.name,
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: totalWithShipping,
      shipping: shippingCost,
      status: "pending" as const,
    }
    saveSale(sale)

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    setCart([])
    setIsCheckoutOpen(false)
  }

  const scheduleOrderWhatsApp = () => {
    const message =
      `📅 *AGENDAMENTO DE PEDIDO*\n\n` +
      `Olá! Gostaria de agendar um pedido para o próximo horário de funcionamento.\n\n` +
      `⏰ *Próxima abertura:* ${getNextOpeningTime()}\n\n` +
      `Por favor, me ajudem com o agendamento. Obrigado!`

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const dismissPopup = () => {
    setPopupDismissed(true)
    setIsHoursPopupOpen(false)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Image
                src="/placeholder.svg?height=60&width=120"
                alt="Logo da Adega"
                width={120}
                height={60}
                className="rounded w-20 h-10 sm:w-[120px] sm:h-[60px]"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-yellow-400">Adega Tabacaria Andrade</h1>
                <p className="text-gray-400 text-xs sm:text-sm">Bebidas selecionadas</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Indicador de conexão */}
              <div className="flex items-center space-x-1">
                {isOnline ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
                <span className="text-xs text-gray-400 hidden sm:block">{isOnline ? "Online" : "Offline"}</span>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">
                    {isOpen() ? (
                      <Badge className="bg-green-600 text-xs">Aberto</Badge>
                    ) : (
                      <Badge className="bg-red-600 text-xs">Fechado</Badge>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {isOpen() ? "Funcionando agora" : `Próxima abertura: ${getNextOpeningTime()}`}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Popup de Horário de Funcionamento */}
      <Dialog open={isHoursPopupOpen && !isOpen()} onOpenChange={setIsHoursPopupOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-yellow-400">🕐 Horário de Funcionamento</DialogTitle>
              <Button variant="ghost" size="sm" onClick={dismissPopup} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-red-400 font-semibold">Estamos fechados no momento</p>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-yellow-400">Nossos Horários:</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(openingHours).map(([day, hours]) => {
                  if (!hours.active) return null
                  const dayNames: Record<string, string> = {
                    quinta: "Quinta-feira",
                    sexta: "Sexta-feira",
                    sabado: "Sábado",
                    domingo: "Domingo",
                  }
                  return (
                    <p key={day}>
                      🗓️ <strong>{dayNames[day] || day}:</strong> {hours.start} às {hours.end}
                    </p>
                  )
                })}
              </div>
            </div>

            <p className="text-yellow-400">
              <strong>Próxima abertura:</strong> {getNextOpeningTime()}
            </p>

            <div className="flex space-x-2">
              <Button onClick={scheduleOrderWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                <Phone className="h-4 w-4 mr-2" />
                Agendar Pedido
              </Button>
              <Button variant="outline" onClick={dismissPopup} className="border-gray-600 text-gray-300">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Categorias */}
        <Tabs
          value={activeCategory}
          onValueChange={(value) => {
            setActiveCategory(value)
            setCurrentPage(1)
          }}
        >
          <div className="overflow-x-auto mb-6 sm:mb-8">
            <TabsList className="flex w-max min-w-full bg-gray-900 p-1">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
                >
                  <span className="mr-1 sm:mr-2">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {displayedProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-gray-900 border-gray-700 hover:border-yellow-400 transition-colors relative"
                  >
                    <CardContent className="p-2 sm:p-3">
                      <div className="relative w-full h-20 sm:h-24 mb-2 sm:mb-3 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="object-contain max-h-full max-w-full"
                        />
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                            <span className="text-red-500 font-bold text-xs">SEM ESTOQUE</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-xs sm:text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-gray-400 text-xs mb-2 line-clamp-1">{product.description}</p>
                      <div className="flex flex-col space-y-2">
                        <span className="text-yellow-400 font-bold text-xs sm:text-sm">
                          R$ {product.price.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => handleComboAdd(product)}
                          size="sm"
                          className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs h-7"
                          disabled={!isOpen() || product.stock === 0}
                        >
                          Adicionar
                        </Button>
                      </div>
                      {product.stock > 0 && product.stock <= 5 && (
                        <p className="text-orange-400 text-xs mt-1">Últimas {product.stock}!</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-1 sm:space-x-2 overflow-x-auto pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-gray-600 text-xs sm:text-sm"
                  >
                    Anterior
                  </Button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page = i + 1
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        page = currentPage - 2 + i
                        if (page > totalPages) page = totalPages - 4 + i
                      }
                    }
                    return page
                  }).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`${currentPage === page ? "bg-yellow-400 text-black" : "border-gray-600"} text-xs sm:text-sm`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-gray-600 text-xs sm:text-sm"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Seção Sobre */}
        <section className="mt-8 sm:mt-16 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6 sm:mb-8 text-center">
            Por que escolher a Adega Tabacaria Andrade?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
                <div className="bg-yellow-400 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                  <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Entrega Rápida</h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Receba suas bebidas em até 45 minutos ou a entrega é gratuita!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
                <div className="bg-yellow-400 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Qualidade Premium</h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Produtos selecionados e armazenados em condições ideais de temperatura.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
                <div className="bg-yellow-400 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Pagamento Seguro</h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Diversas opções de pagamento para sua comodidade e segurança.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Carrinho */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">🛒 Carrinho de Compras</DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Seu carrinho está vazio</p>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[50vh] pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-800 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="object-contain max-h-full max-w-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{item.name}</h4>
                        <p className="text-yellow-400 text-sm">R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-8 h-8 p-0"
                      >
                        -
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-8 h-8 p-0"
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs sm:text-sm ml-2"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-yellow-400">R$ {cartTotal.toFixed(2)}</span>
                </div>

                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setIsCheckoutOpen(true)
                  }}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  disabled={!isOpen()}
                >
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">📋 Finalizar Pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="font-semibold text-yellow-400">Dados do Cliente</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
              </div>

              {/* CEP e Número */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value.replace(/\D/g, ""))}
                      className="bg-gray-800 border-gray-600"
                      maxLength={8}
                      placeholder="Somente números"
                    />
                    <Button
                      onClick={fetchAddressByCep}
                      disabled={isLoadingCep || cep.length !== 8}
                      className="bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      {isLoadingCep ? "..." : "Buscar"}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input
                    id="addressNumber"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    placeholder="Nº"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, address: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={customerData.neighborhood}
                    onChange={(e) => {
                      const neighborhood = e.target.value
                      setCustomerData((prev) => ({ ...prev, neighborhood }))
                      const shipping = calculateShippingByCEP(cep, neighborhood)
                      setShippingCost(shipping)
                    }}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={customerData.complement}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, complement: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                    placeholder="Apto, casa, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={customerData.city}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, city: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={customerData.state}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, state: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payment">Forma de Pagamento</Label>
                <Select
                  value={customerData.paymentMethod}
                  onValueChange={(value) => setCustomerData((prev) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-4">Resumo do Pedido</h3>

              <div className="max-h-[20vh] overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-2">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-yellow-400 text-lg">
                  <span>Total:</span>
                  <span>R$ {totalWithShipping.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={sendOrderToWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={
                !customerData.name ||
                !customerData.phone ||
                !customerData.address ||
                !addressNumber ||
                !customerData.neighborhood ||
                !customerData.paymentMethod
              }
            >
              <Phone className="h-4 w-4 mr-2" />
              Enviar Pedido via WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
          className="bg-green-600 hover:bg-green-700 rounded-full p-3 sm:p-4 shadow-lg"
          size="lg"
        >
          <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-8 sm:mt-16">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3 className="font-semibold text-yellow-400 mb-4">Horário de Funcionamento</h3>
              <div className="space-y-2 text-sm text-gray-400">
                {Object.entries(openingHours).map(([day, hours]) => {
                  if (!hours.active) return null
                  const dayNames: Record<string, string> = {
                    quinta: "Quinta-feira",
                    sexta: "Sexta-feira",
                    sabado: "Sábado",
                    domingo: "Domingo",
                  }
                  return (
                    <p key={day}>
                      {dayNames[day] || day}: {hours.start} às {hours.end}
                    </p>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-yellow-400 mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" /> (11) 99999-9999
                </p>
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" /> Rua da Adega, 123
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-yellow-400 mb-4">Sobre</h3>
              <p className="text-sm text-gray-400">
                Adega Tabacaria Andrade - As melhores bebidas com entrega rápida e segura.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Adega Tabacaria Andrade. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
      {/* Combo Selector */}
      {comboTriggerProduct && (
        <ComboSelector
          isOpen={isComboSelectorOpen}
          onClose={() => setIsComboSelectorOpen(false)}
          onAddCombo={handleComboSelection}
          triggerProduct={comboTriggerProduct}
        />
      )}
    </div>
  )
}
