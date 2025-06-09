"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { isAuthenticated, logout, getCurrentUser, isSessionExpiringSoon, renewSession } from "@/lib/auth"
import AdminLogin from "@/components/admin-login"
import {
  Clock,
  Save,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  MessageSquare,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import Image from "next/image"
import {
  getProducts,
  saveProducts,
  getOpeningHours,
  saveOpeningHours,
  getShippingRates,
  saveShippingRates,
  getSales,
  initializeData,
  getPopupSettings,
  savePopupSettings,
  type Product,
  type OpeningHours,
  type ShippingRate,
  type Sale,
  type PopupSettings,
  resetSales,
} from "@/lib/storage"

export default function AdminPanel() {
  const [isAuth, setIsAuth] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    quinta: { start: "18:00", end: "00:00", active: true },
    sexta: { start: "18:00", end: "03:00", active: true },
    sabado: { start: "18:00", end: "03:00", active: true },
    domingo: { start: "15:00", end: "00:00", active: true },
  })
  const [popupSettings, setPopupSettings] = useState<PopupSettings>({
    enabled: true,
    showWhenClosed: true,
    showWhenOpen: false,
    title: "🕐 Horário de Funcionamento",
    message: "Estamos fechados no momento. Confira nossos horários de funcionamento abaixo.",
    scheduleButtonText: "Agendar Pedido",
    closeButtonText: "Fechar",
    backgroundColor: "#1f2937",
    textColor: "#f3f4f6",
    accentColor: "#facc15",
  })
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingShipping, setEditingShipping] = useState<ShippingRate | null>(null)
  const [activeTab, setActiveTab] = useState("products")

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    image: "",
    category: "energetico",
    description: "",
    active: true,
    stock: 0,
  })

  const [newShipping, setNewShipping] = useState<Partial<ShippingRate>>({
    cep: "",
    region: "",
    neighborhood: "",
    price: 0,
  })

  const [newDayName, setNewDayName] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState("")

  // Estado para o upload de imagem
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para o timeout de inatividade
  const [isTimeoutWarningOpen, setIsTimeoutWarningOpen] = useState(false)
  const [timeoutCountdown, setTimeoutCountdown] = useState(60)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Estado para visualização do pop-up
  const [isPopupPreviewOpen, setIsPopupPreviewOpen] = useState(false)

  const categories = [
    { id: "energetico", name: "Energéticos" },
    { id: "whisky", name: "Whisky" },
    { id: "vodka", name: "Vodka" },
    { id: "gin", name: "Gin" },
    { id: "cerveja", name: "Cerveja" },
    { id: "gelo", name: "Gelo" },
    { id: "essencia", name: "Essência" },
    { id: "carvao", name: "Carvão" },
    { id: "diversos", name: "Diversos" },
  ]

  useEffect(() => {
    initializeData()
    setProducts(getProducts())
    setOpeningHours(getOpeningHours())
    setPopupSettings(getPopupSettings())
    setShippingRates(getShippingRates())
    setSales(getSales())
  }, [])

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      setCurrentUser(getCurrentUser())
      setIsCheckingAuth(false)
    }

    checkAuth()

    // Verificar sessão a cada minuto
    const interval = setInterval(() => {
      if (isAuthenticated()) {
        if (isSessionExpiringSoon()) {
          renewSession()
        }
      } else {
        setIsAuth(false)
        setCurrentUser(null)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Sistema de timeout por inatividade
  useEffect(() => {
    if (!isAuth) return

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now()

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        setIsTimeoutWarningOpen(false)
      }

      // 5 minutos de inatividade (300000ms) antes de mostrar aviso
      inactivityTimerRef.current = setTimeout(() => {
        setIsTimeoutWarningOpen(true)
        setTimeoutCountdown(60)

        // Iniciar contagem regressiva de 60 segundos
        countdownTimerRef.current = setInterval(() => {
          setTimeoutCountdown((prev) => {
            if (prev <= 1) {
              // Tempo esgotado, fazer logout
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
              logout()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, 300000) // 5 minutos
    }

    // Eventos para detectar atividade do usuário
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]

    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    // Inicializar timer
    resetInactivityTimer()

    // Adicionar event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity)
    })

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [isAuth])

  // Atualizar horários
  const updateHours = (day: keyof OpeningHours, field: "start" | "end", value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const saveHours = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    saveOpeningHours(openingHours)
    setIsSaving(false)
    alert("Horários salvos com sucesso!")
  }

  // Salvar configurações do pop-up
  const savePopup = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    savePopupSettings(popupSettings)
    setIsSaving(false)
    alert("Configurações do pop-up salvas com sucesso!")
  }

  // Gerenciar produtos
  const saveProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      image: imagePreview || newProduct.image || "/placeholder.svg?height=200&width=200",
      category: newProduct.category!,
      description: newProduct.description!,
      active: newProduct.active!,
      stock: Number(newProduct.stock),
    }

    let updatedProducts
    if (editingProduct) {
      updatedProducts = products.map((p) => (p.id === editingProduct.id ? product : p))
    } else {
      updatedProducts = [...products, product]
    }

    setProducts(updatedProducts)
    saveProducts(updatedProducts)
    setIsProductDialogOpen(false)
    setEditingProduct(null)
    setNewProduct({
      name: "",
      price: 0,
      image: "",
      category: "energetico",
      description: "",
      active: true,
      stock: 0,
    })
    setImagePreview(null)
  }

  const editProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct(product)
    setImagePreview(product.image.startsWith("data:") ? product.image : null)
    setIsProductDialogOpen(true)
  }

  const deleteProduct = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const updatedProducts = products.filter((p) => p.id !== productId)
      setProducts(updatedProducts)
      saveProducts(updatedProducts)
    }
  }

  const toggleProductStatus = (productId: string) => {
    const updatedProducts = products.map((p) => (p.id === productId ? { ...p, active: !p.active } : p))
    setProducts(updatedProducts)
    saveProducts(updatedProducts)
  }

  // Função para lidar com o upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Gerenciar frete
  const saveShipping = () => {
    if ((!newShipping.cep && !newShipping.neighborhood) || !newShipping.region || !newShipping.price) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const shipping: ShippingRate = {
      id: editingShipping?.id || Date.now().toString(),
      cep: newShipping.cep || "",
      region: newShipping.region!,
      neighborhood: newShipping.neighborhood || "",
      price: Number(newShipping.price),
    }

    let updatedRates
    if (editingShipping) {
      updatedRates = shippingRates.map((s) => (s.id === editingShipping.id ? shipping : s))
    } else {
      updatedRates = [...shippingRates, shipping]
    }

    setShippingRates(updatedRates)
    saveShippingRates(updatedRates)
    setIsShippingDialogOpen(false)
    setEditingShipping(null)
    setNewShipping({ cep: "", region: "", neighborhood: "", price: 0 })
  }

  const editShipping = (shipping: ShippingRate) => {
    setEditingShipping(shipping)
    setNewShipping(shipping)
    setIsShippingDialogOpen(true)
  }

  const deleteShipping = (shippingId: string) => {
    if (confirm("Tem certeza que deseja excluir esta região?")) {
      const updatedRates = shippingRates.filter((s) => s.id !== shippingId)
      setShippingRates(updatedRates)
      saveShippingRates(updatedRates)
    }
  }

  const addNewDay = () => {
    if (!newDayName.trim()) {
      alert("Digite o nome do dia")
      return
    }

    const dayKey = newDayName.toLowerCase().replace(/\s+/g, "")
    if (openingHours[dayKey]) {
      alert("Este dia já existe")
      return
    }

    const updatedHours = {
      ...openingHours,
      [dayKey]: { start: "18:00", end: "00:00", active: true },
    }

    setOpeningHours(updatedHours)
    setNewDayName("")
  }

  const removeDay = (dayKey: string) => {
    if (confirm(`Tem certeza que deseja remover ${dayKey}?`)) {
      const updatedHours = { ...openingHours }
      delete updatedHours[dayKey]
      setOpeningHours(updatedHours)
    }
  }

  const toggleDayActive = (dayKey: string) => {
    const updatedHours = {
      ...openingHours,
      [dayKey]: {
        ...openingHours[dayKey],
        active: !openingHours[dayKey].active,
      },
    }
    setOpeningHours(updatedHours)
  }

  const handleResetSales = () => {
    if (resetPassword === "312890") {
      resetSales()
      setSales([])
      setIsResetDialogOpen(false)
      setResetPassword("")
      alert("Dados de faturamento resetados com sucesso!")
    } else {
      alert("Senha incorreta!")
      setResetPassword("")
    }
  }

  // Estatísticas de vendas
  const getSalesStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    const dailySales = sales.filter((sale) => new Date(sale.date) >= today)
    const weeklySales = sales.filter((sale) => new Date(sale.date) >= thisWeek)
    const monthlySales = sales.filter((sale) => new Date(sale.date) >= thisMonth)
    const yearlySales = sales.filter((sale) => new Date(sale.date) >= thisYear)

    return {
      daily: {
        count: dailySales.length,
        total: dailySales.reduce((sum, sale) => sum + sale.total, 0),
      },
      weekly: {
        count: weeklySales.length,
        total: weeklySales.reduce((sum, sale) => sum + sale.total, 0),
      },
      monthly: {
        count: monthlySales.length,
        total: monthlySales.reduce((sum, sale) => sum + sale.total, 0),
      },
      yearly: {
        count: yearlySales.length,
        total: yearlySales.reduce((sum, sale) => sum + sale.total, 0),
      },
    }
  }

  const stats = getSalesStats()

  const dayNames = {
    quinta: "Quinta-feira",
    sexta: "Sexta-feira",
    sabado: "Sábado",
    domingo: "Domingo",
  }

  const handleLogout = () => {
    if (confirm("Tem certeza que deseja sair?")) {
      logout()
    }
  }

  const continueSession = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    setIsTimeoutWarningOpen(false)
    lastActivityRef.current = Date.now()

    // Reiniciar o timer de inatividade
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsTimeoutWarningOpen(true)
      setTimeoutCountdown(60)

      countdownTimerRef.current = setInterval(() => {
        setTimeoutCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 300000) // 5 minutos
  }

  // Verificando autenticação
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (!isAuth) {
    return <AdminLogin onLogin={() => setIsAuth(true)} />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-600">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Site
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-yellow-400">Painel Administrativo</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Logado como:</p>
                <p className="text-yellow-400 font-semibold">{currentUser}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-900 mb-8">
            <TabsTrigger value="products" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="hours" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="popup" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pop-up
            </TabsTrigger>
            <TabsTrigger value="shipping" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <DollarSign className="h-4 w-4 mr-2" />
              Frete
            </TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vendas
            </TabsTrigger>
          </TabsList>

          {/* Produtos */}
          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-yellow-400">Gerenciar Produtos</h2>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">
                        {editingProduct ? "Editar Produto" : "Novo Produto"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="productName">Nome do Produto</Label>
                          <Input
                            id="productName"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productPrice">Preço (R$)</Label>
                          <Input
                            id="productPrice"
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))
                            }
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="productCategory">Categoria</Label>
                          <Select
                            value={newProduct.category}
                            onValueChange={(value) => setNewProduct((prev) => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="productStock">Estoque</Label>
                          <Input
                            id="productStock"
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) =>
                              setNewProduct((prev) => ({ ...prev, stock: Number.parseInt(e.target.value) || 0 }))
                            }
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="productDescription">Descrição</Label>
                        <Textarea
                          id="productDescription"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>

                      {/* Upload de Imagem */}
                      <div>
                        <Label className="mb-2 block">Imagem do Produto</Label>
                        <div className="space-y-3">
                          {imagePreview ? (
                            <div className="relative w-full h-32 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                              <Image
                                src={imagePreview || "/placeholder.svg"}
                                alt="Preview"
                                width={200}
                                height={200}
                                className="object-contain max-h-full max-w-full"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                              onClick={triggerFileInput}
                            >
                              <ImageIcon className="h-10 w-10 mx-auto text-gray-500 mb-2" />
                              <p className="text-gray-400">Clique para fazer upload de uma imagem</p>
                              <p className="text-gray-500 text-sm mt-1">JPG, PNG ou GIF (máx. 5MB)</p>
                            </div>
                          )}

                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />

                          {!imagePreview && (
                            <div>
                              <Label htmlFor="productImageUrl">Ou use uma URL de imagem</Label>
                              <Input
                                id="productImageUrl"
                                value={newProduct.image}
                                onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))}
                                className="bg-gray-800 border-gray-600"
                                placeholder="/placeholder.svg?height=200&width=200"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="productActive"
                          checked={newProduct.active}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, active: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="productActive">Produto Ativo</Label>
                      </div>

                      <Button onClick={saveProduct} className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        {editingProduct ? "Atualizar" : "Salvar"} Produto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {categories.map((category) => {
                  const categoryProducts = products.filter((p) => p.category === category.id)
                  return (
                    <Card key={category.id} className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-yellow-400">
                          {category.name} ({categoryProducts.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryProducts.map((product) => (
                            <Card key={product.id} className="bg-gray-800 border-gray-600">
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-4">
                                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.name}
                                      width={48}
                                      height={48}
                                      className="object-contain max-h-full max-w-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white truncate">{product.name}</h4>
                                    <p className="text-yellow-400">R$ {product.price.toFixed(2)}</p>
                                    <p className="text-gray-400 text-sm">Estoque: {product.stock}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge className={product.active ? "bg-green-600" : "bg-red-600"}>
                                        {product.active ? "Ativo" : "Inativo"}
                                      </Badge>
                                      {product.stock === 0 && <Badge className="bg-orange-600">Sem Estoque</Badge>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2 mt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => editProduct(product)}
                                    className="border-gray-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleProductStatus(product.id)}
                                    className="border-gray-600"
                                  >
                                    {product.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Horários */}
          <TabsContent value="hours">
            <Card className="bg-gray-900 border-gray-700 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Configurar Horários de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adicionar Novo Dia */}
                <Card className="bg-gray-800 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 text-lg">Adicionar Novo Dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <Input
                        value={newDayName}
                        onChange={(e) => setNewDayName(e.target.value)}
                        placeholder="Nome do dia (ex: Segunda-feira)"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button onClick={addNewDay} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Dias Existentes */}
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                      <h3 className="font-semibold text-white capitalize">{day.replace(/([A-Z])/g, " $1")}</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDayActive(day)}
                          className={`border-gray-600 ${hours.active ? "text-green-400" : "text-red-400"}`}
                        >
                          {hours.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeDay(day)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {hours.active && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`${day}-start`} className="text-gray-300">
                              Horário de Abertura
                            </Label>
                            <Input
                              id={`${day}-start`}
                              type="time"
                              value={hours.start}
                              onChange={(e) => updateHours(day, "start", e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${day}-end`} className="text-gray-300">
                              Horário de Fechamento
                            </Label>
                            <Input
                              id={`${day}-end`}
                              type="time"
                              value={hours.end}
                              onChange={(e) => updateHours(day, "end", e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Funcionamento: {hours.start} às {hours.end}
                        </p>
                      </>
                    )}

                    {!hours.active && <p className="text-red-400 text-sm">Dia desativado</p>}
                  </div>
                ))}

                <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">ℹ️ Informações Importantes</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Você pode adicionar ou remover dias de funcionamento</li>
                    <li>• Horários que passam da meia-noite (ex: 03:00) são do dia seguinte</li>
                    <li>• Dias desativados não aparecerão no site</li>
                    <li>• Os horários são atualizados em tempo real no site</li>
                  </ul>
                </div>

                <Button onClick={saveHours} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Horários"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pop-up */}
          <TabsContent value="popup">
            <Card className="bg-gray-900 border-gray-700 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Configurar Pop-up de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h3 className="font-semibold text-white">Ativar Pop-up</h3>
                      <p className="text-sm text-gray-400">Habilitar ou desabilitar o pop-up de funcionamento</p>
                    </div>
                  </div>
                  <Switch
                    checked={popupSettings.enabled}
                    onCheckedChange={(checked) => setPopupSettings((prev) => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-white">Mostrar quando fechado</h3>
                      <p className="text-sm text-gray-400">Exibir pop-up quando a loja estiver fechada</p>
                    </div>
                    <Switch
                      checked={popupSettings.showWhenClosed}
                      onCheckedChange={(checked) => setPopupSettings((prev) => ({ ...prev, showWhenClosed: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-white">Mostrar quando aberto</h3>
                      <p className="text-sm text-gray-400">Exibir pop-up quando a loja estiver aberta</p>
                    </div>
                    <Switch
                      checked={popupSettings.showWhenOpen}
                      onCheckedChange={(checked) => setPopupSettings((prev) => ({ ...prev, showWhenOpen: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="popupTitle">Título do Pop-up</Label>
                    <Input
                      id="popupTitle"
                      value={popupSettings.title}
                      onChange={(e) => setPopupSettings((prev) => ({ ...prev, title: e.target.value }))}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="popupMessage">Mensagem do Pop-up</Label>
                    <Textarea
                      id="popupMessage"
                      value={popupSettings.message}
                      onChange={(e) => setPopupSettings((prev) => ({ ...prev, message: e.target.value }))}
                      className="bg-gray-800 border-gray-600"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduleButtonText">Texto do Botão de Agendamento</Label>
                      <Input
                        id="scheduleButtonText"
                        value={popupSettings.scheduleButtonText}
                        onChange={(e) => setPopupSettings((prev) => ({ ...prev, scheduleButtonText: e.target.value }))}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>

                    <div>
                      <Label htmlFor="closeButtonText">Texto do Botão de Fechar</Label>
                      <Input
                        id="closeButtonText"
                        value={popupSettings.closeButtonText}
                        onChange={(e) => setPopupSettings((prev) => ({ ...prev, closeButtonText: e.target.value }))}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={popupSettings.backgroundColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-10 p-1 bg-gray-800 border-gray-600"
                        />
                        <Input
                          value={popupSettings.backgroundColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="textColor">Cor do Texto</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={popupSettings.textColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, textColor: e.target.value }))}
                          className="w-12 h-10 p-1 bg-gray-800 border-gray-600"
                        />
                        <Input
                          value={popupSettings.textColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, textColor: e.target.value }))}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accentColor">Cor de Destaque</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={popupSettings.accentColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="w-12 h-10 p-1 bg-gray-800 border-gray-600"
                        />
                        <Input
                          value={popupSettings.accentColor}
                          onChange={(e) => setPopupSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button onClick={savePopup} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frete */}
          <TabsContent value="shipping">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-yellow-400">Gerenciar Frete</h2>
                <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Região
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">
                        {editingShipping ? "Editar Região" : "Nova Região"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingCep">CEP</Label>
                          <Input
                            id="shippingCep"
                            value={newShipping.cep}
                            onChange={(e) => setNewShipping((prev) => ({ ...prev, cep: e.target.value }))}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shippingNeighborhood">Bairro</Label>
                          <Input
                            id="shippingNeighborhood"
                            value={newShipping.neighborhood}
                            onChange={(e) => setNewShipping((prev) => ({ ...prev, neighborhood: e.target.value }))}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingRegion">Região</Label>
                          <Input
                            id="shippingRegion"
                            value={newShipping.region}
                            onChange={(e) => setNewShipping((prev) => ({ ...prev, region: e.target.value }))}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shippingPrice">Preço (R$)</Label>
                          <Input
                            id="shippingPrice"
                            type="number"
                            step="0.01"
                            value={newShipping.price}
                            onChange={(e) =>
                              setNewShipping((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))
                            }
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                      </div>

                      <Button onClick={saveShipping} className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        {editingShipping ? "Atualizar" : "Salvar"} Região
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {shippingRates.map((shipping) => (
                  <Card key={shipping.id} className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Image
                            src="/placeholder.svg"
                            alt="Placeholder"
                            width={80}
                            height={80}
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{shipping.region}</h4>
                          <p className="text-yellow-400">R$ {shipping.price.toFixed(2)}</p>
                          <p className="text-gray-400 text-sm">CEP: {shipping.cep}</p>
                          <p className="text-gray-400 text-sm">Bairro: {shipping.neighborhood}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editShipping(shipping)}
                          className="border-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteShipping(shipping.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="sales">
            <Card className="bg-gray-900 border-gray-700 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Estatísticas de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Vendas Diárias</h3>
                  <p className="text-sm text-gray-400">Total de vendas: {stats.daily.count}</p>
                  <p className="text-sm text-gray-400">Valor total: R$ {stats.daily.total.toFixed(2)}</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Vendas Semanais</h3>
                  <p className="text-sm text-gray-400">Total de vendas: {stats.weekly.count}</p>
                  <p className="text-sm text-gray-400">Valor total: R$ {stats.weekly.total.toFixed(2)}</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Vendas Mensais</h3>
                  <p className="text-sm text-gray-400">Total de vendas: {stats.monthly.count}</p>
                  <p className="text-sm text-gray-400">Valor total: R$ {stats.monthly.total.toFixed(2)}</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Vendas Anuais</h3>
                  <p className="text-sm text-gray-400">Total de vendas: {stats.yearly.count}</p>
                  <p className="text-sm text-gray-400">Valor total: R$ {stats.yearly.total.toFixed(2)}</p>
                </div>

                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Resetar Dados de Faturamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">Resetar Dados de Faturamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resetPassword">Senha de Reset</Label>
                        <Input
                          id="resetPassword"
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>

                      <Button onClick={handleResetSales} className="w-full bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirmar Reset
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
