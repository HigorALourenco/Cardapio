// Sistema de sincronização em tempo real
export class RealtimeSync {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  constructor() {
    // Só conectar no cliente
    if (typeof window !== "undefined") {
      this.connect()
    }
  }

  private connect() {
    if (typeof window === "undefined" || this.isConnecting) return

    this.isConnecting = true

    try {
      // Fechar conexão existente se houver
      if (this.eventSource) {
        this.eventSource.close()
      }

      this.eventSource = new EventSource("/api/realtime")

      this.eventSource.onopen = () => {
        console.log("🔗 Conexão em tempo real estabelecida")
        this.reconnectAttempts = 0
        this.isConnecting = false
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyListeners(data.type, data.payload)
        } catch (error) {
          console.error("Erro ao processar mensagem:", error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.log("❌ Erro na conexão em tempo real", error)
        this.isConnecting = false

        if (this.eventSource) {
          this.eventSource.close()
          this.eventSource = null
        }

        this.reconnect()
      }
    } catch (error) {
      console.error("Erro ao conectar:", error)
      this.isConnecting = false
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("🚫 Máximo de tentativas de reconexão atingido")
      return
    }

    if (this.isConnecting) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`🔄 Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  public subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Retorna função para cancelar a inscrição
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("Erro ao executar callback:", error)
        }
      })
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.listeners.clear()
    this.isConnecting = false
  }

  public isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

// Instância global do sistema de sincronização
let realtimeSync: RealtimeSync | null = null

export const getRealtimeSync = () => {
  if (typeof window === "undefined") return null

  if (!realtimeSync) {
    realtimeSync = new RealtimeSync()
  }
  return realtimeSync
}

// Hook para usar sincronização em tempo real
export const useRealtimeSync = () => {
  return getRealtimeSync()
}
