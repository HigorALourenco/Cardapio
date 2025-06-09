import type { NextRequest } from "next/server"

// Armazenar conexões ativas
const connections = new Set<ReadableStreamDefaultController>()

// Função para broadcast de mensagens
export function broadcastUpdate(type: string, payload: any) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() })

  connections.forEach((controller) => {
    try {
      controller.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      // Remove conexões inválidas
      connections.delete(controller)
    }
  })
}

// Configurar para não fazer prerender desta rota
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  // Verificar se é uma requisição válida para SSE
  const headers = request.headers
  const accept = headers.get("accept")

  if (!accept?.includes("text/event-stream")) {
    return new Response("This endpoint only supports Server-Sent Events", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Adicionar conexão ao conjunto
      connections.add(controller)

      // Enviar mensagem inicial
      const initialMessage = JSON.stringify({
        type: "connected",
        payload: { message: "Conectado ao sistema em tempo real" },
        timestamp: Date.now(),
      })

      controller.enqueue(`data: ${initialMessage}\n\n`)

      // Configurar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = JSON.stringify({
            type: "heartbeat",
            payload: {},
            timestamp: Date.now(),
          })
          controller.enqueue(`data: ${heartbeatMessage}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          connections.delete(controller)
        }
      }, 30000) // 30 segundos

      // Cleanup quando conexão for fechada
      const cleanup = () => {
        clearInterval(heartbeat)
        connections.delete(controller)
        try {
          controller.close()
        } catch (error) {
          // Ignorar erros de fechamento
        }
      }

      // Escutar sinal de abort
      if (request.signal) {
        request.signal.addEventListener("abort", cleanup)
      }

      // Cleanup adicional para timeout
      setTimeout(() => {
        if (connections.has(controller)) {
          cleanup()
        }
      }, 300000) // 5 minutos timeout
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "Access-Control-Allow-Methods": "GET",
    },
  })
}

// Adicionar handler para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
    },
  })
}
