"use client"

import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { getProducts, type Product } from "@/lib/storage"

interface ComboSelectorProps {
  isOpen: boolean
  onClose: () => void
  onAddCombo: (items: Array<{ product: Product; quantity: number }>) => void
  triggerProduct: Product
}

export default function ComboSelector({ isOpen, onClose, onAddCombo, triggerProduct }: ComboSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedGelos, setSelectedGelos] = useState<Array<{ product: Product; quantity: number }>>([])
  const [selectedEnergeticos, setSelectedEnergeticos] = useState<Array<{ product: Product; quantity: number }>>([])

  useEffect(() => {
    setProducts(getProducts())
  }, [])

  if (!triggerProduct) {
    return null
  }

  const availableGelos = products.filter((p) => p.category === "gelo" && p.active && p.stock > 0).slice(0, 4)
  const availableEnergeticos = products
    .filter((p) => p.category === "energetico" && p.active && p.stock > 0)
    .slice(0, 4)

  const addGelo = (product: Product) => {
    const existing = selectedGelos.find((item) => item.product.id === product.id)
    if (existing) {
      if (existing.quantity < product.stock) {
        setSelectedGelos(
          selectedGelos.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        )
      }
    } else {
      setSelectedGelos([...selectedGelos, { product, quantity: 1 }])
    }
  }

  const removeGelo = (productId: string) => {
    setSelectedGelos(selectedGelos.filter((item) => item.product.id !== productId))
  }

  const addEnergetico = (product: Product) => {
    const existing = selectedEnergeticos.find((item) => item.product.id === product.id)
    if (existing) {
      if (existing.quantity < product.stock) {
        setSelectedEnergeticos(
          selectedEnergeticos.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        )
      }
    } else {
      setSelectedEnergeticos([...selectedEnergeticos, { product, quantity: 1 }])
    }
  }

  const removeEnergetico = (productId: string) => {
    setSelectedEnergeticos(selectedEnergeticos.filter((item) => item.product.id !== productId))
  }

  const handleAddCombo = () => {
    const allItems = [{ product: triggerProduct, quantity: 1 }, ...selectedGelos, ...selectedEnergeticos]
    onAddCombo(allItems)
    setSelectedGelos([])
    setSelectedEnergeticos([])
    onClose()
  }

  const totalComboPrice = [
    triggerProduct?.price || 0,
    ...selectedGelos.map((item) => item.product.price * item.quantity),
    ...selectedEnergeticos.map((item) => item.product.price * item.quantity),
  ].reduce((sum, price) => sum + price, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">🍹 Monte seu Combo Premium</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Produto Principal */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">Produto Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Image
                    src={triggerProduct.image || "/placeholder.svg"}
                    alt={triggerProduct.name}
                    width={60}
                    height={60}
                    className="object-contain max-h-full max-w-full"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{triggerProduct.name}</h3>
                  <p className="text-yellow-400">R$ {triggerProduct.price.toFixed(2)}</p>
                  <Badge className="bg-green-600">Incluído</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Gelos */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">🧊 Adicione Gelos (até 4 tipos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {availableGelos.map((gelo) => (
                  <div key={gelo.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image
                          src={gelo.image || "/placeholder.svg"}
                          alt={gelo.name}
                          width={40}
                          height={40}
                          className="object-contain max-h-full max-w-full"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{gelo.name}</h4>
                        <p className="text-yellow-400 text-sm">R$ {gelo.price.toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">Estoque: {gelo.stock}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addGelo(gelo)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={selectedGelos.find((item) => item.product.id === gelo.id)?.quantity >= gelo.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Gelos Selecionados */}
              {selectedGelos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Gelos Selecionados:</h4>
                  {selectedGelos.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                      <span className="text-white text-sm">
                        {item.quantity}x {item.product.name} - R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <Button size="sm" variant="destructive" onClick={() => removeGelo(item.product.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Energéticos */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">⚡ Adicione Energéticos (até 4 tipos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {availableEnergeticos.map((energetico) => (
                  <div key={energetico.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image
                          src={energetico.image || "/placeholder.svg"}
                          alt={energetico.name}
                          width={40}
                          height={40}
                          className="object-contain max-h-full max-w-full"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{energetico.name}</h4>
                        <p className="text-yellow-400 text-sm">R$ {energetico.price.toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">Estoque: {energetico.stock}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addEnergetico(energetico)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={
                        selectedEnergeticos.find((item) => item.product.id === energetico.id)?.quantity >=
                        energetico.stock
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Energéticos Selecionados */}
              {selectedEnergeticos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Energéticos Selecionados:</h4>
                  {selectedEnergeticos.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                      <span className="text-white text-sm">
                        {item.quantity}x {item.product.name} - R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <Button size="sm" variant="destructive" onClick={() => removeEnergetico(item.product.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo do Combo */}
          <Card className="bg-green-900/20 border-green-600">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Total do Combo</h3>
                  <p className="text-gray-400 text-sm">
                    {1 + selectedGelos.length + selectedEnergeticos.length} itens selecionados
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-400">R$ {totalComboPrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex space-x-4">
            <Button variant="outline" onClick={onClose} className="flex-1 border-gray-600">
              Cancelar
            </Button>
            <Button onClick={handleAddCombo} className="flex-1 bg-green-600 hover:bg-green-700">
              Adicionar Combo ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
