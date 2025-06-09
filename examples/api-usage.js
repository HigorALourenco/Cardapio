// Exemplo de como usar a API após o deploy

const API_BASE_URL = "https://sua-api.railway.app" // Substitua pela sua URL

class RailwayDeployClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.token = null
  }

  async login(username = "admin", password = "admin123") {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.status === "success") {
        this.token = data.data.token
        console.log("✅ Login realizado com sucesso")
        return this.token
      } else {
        throw new Error(data.message || "Falha no login")
      }
    } catch (error) {
      console.error("❌ Erro no login:", error.message)
      throw error
    }
  }

  async startDeploy(repoUrl, branch = "main", railwayToken = null) {
    if (!this.token) {
      throw new Error("Token não encontrado. Faça login primeiro.")
    }

    try {
      const body = { repoUrl, branch }
      if (railwayToken) {
        body.token = railwayToken
      }

      const response = await fetch(`${this.baseUrl}/api/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.status === "success") {
        console.log("🚀 Deploy iniciado:", data.data.deployId)
        return data.data.deployId
      } else {
        throw new Error(data.message || "Falha ao iniciar deploy")
      }
    } catch (error) {
      console.error("❌ Erro ao iniciar deploy:", error.message)
      throw error
    }
  }

  async getDeployStatus(deployId) {
    if (!this.token) {
      throw new Error("Token não encontrado. Faça login primeiro.")
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/deploy/${deployId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      const data = await response.json()

      if (data.status === "success") {
        return data.data
      } else {
        throw new Error(data.message || "Falha ao obter status")
      }
    } catch (error) {
      console.error("❌ Erro ao obter status:", error.message)
      throw error
    }
  }

  async waitForDeploy(deployId, maxWaitTime = 600000) {
    // 10 minutos
    const startTime = Date.now()
    const checkInterval = 5000 // 5 segundos

    console.log(`⏳ Aguardando deploy ${deployId}...`)

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const status = await this.getDeployStatus(deployId)

          console.log(`📊 Status: ${status.status}`)

          if (status.status === "completed") {
            console.log(`✅ Deploy concluído! URL: ${status.projectUrl}`)
            resolve(status)
            return
          }

          if (status.status === "failed") {
            console.log(`❌ Deploy falhou: ${status.error}`)
            reject(new Error(status.error || "Deploy falhou"))
            return
          }

          // Verificar timeout
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error("Timeout: Deploy demorou muito para completar"))
            return
          }

          // Continuar verificando
          setTimeout(checkStatus, checkInterval)
        } catch (error) {
          reject(error)
        }
      }

      checkStatus()
    })
  }

  async getAllDeploys() {
    if (!this.token) {
      throw new Error("Token não encontrado. Faça login primeiro.")
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/deploy`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      const data = await response.json()

      if (data.status === "success") {
        return data.data
      } else {
        throw new Error(data.message || "Falha ao obter deploys")
      }
    } catch (error) {
      console.error("❌ Erro ao obter deploys:", error.message)
      throw error
    }
  }
}

// Exemplo de uso
async function exemploDeUso() {
  const client = new RailwayDeployClient(API_BASE_URL)

  try {
    // 1. Fazer login
    await client.login()

    // 2. Iniciar deploy
    const deployId = await client.startDeploy("https://github.com/seu-usuario/adega-online.git", "main")

    // 3. Aguardar conclusão
    const result = await client.waitForDeploy(deployId)

    console.log("🎉 Deploy concluído com sucesso!")
    console.log("📊 Resultado:", result)
  } catch (error) {
    console.error("💥 Erro:", error.message)
  }
}

// Executar exemplo (descomente para testar)
// exemploDeUso()

export default RailwayDeployClient
