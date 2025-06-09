import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

// Importar rotas
import deployRoutes from "./routes/deploy.routes.js"
import projectRoutes from "./routes/project.routes.js"
import authRoutes from "./routes/auth.routes.js"
import healthRoutes from "./routes/health.routes.js"

// Importar middlewares
import { errorHandler } from "./middlewares/error.middleware.js"
import { authMiddleware } from "./middlewares/auth.middleware.js"
import logger from "./utils/logger.js"

// Configuração
dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

// Criar diretórios necessários
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.join(__dirname, "../logs")
const reposDir = path.join(__dirname, "../repos")

// Criar diretórios se não existirem
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir, { recursive: true })
  }
} catch (error) {
  console.warn("Aviso: Não foi possível criar diretórios:", error.message)
}

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitar CSP para Railway
    crossOriginEmbedderPolicy: false,
  }),
)

app.use(
  cors({
    origin: "*", // Permitir todas as origens para Railway
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

// Rate limiting mais permissivo para Railway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite aumentado para Railway
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para health checks
    return req.path === "/api/health" || req.path === "/"
  },
})
app.use(limiter)

// Middleware para logs de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Rotas públicas
app.use("/api/health", healthRoutes)
app.use("/api/auth", authRoutes)

// Rotas protegidas
app.use("/api/deploy", authMiddleware, deployRoutes)
app.use("/api/projects", authMiddleware, projectRoutes)

// Servir documentação estática
app.use("/docs", express.static(path.join(__dirname, "../docs")))

// Rota raiz com informações da API
app.get("/", (req, res) => {
  res.json({
    name: "Railway Deploy API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      deploy: "/api/deploy",
      projects: "/api/projects",
      docs: "/docs",
    },
    railway: {
      service: process.env.RAILWAY_SERVICE_NAME || "railway-deploy-api",
      environment: process.env.RAILWAY_ENVIRONMENT || "production",
    },
  })
})

// Middleware de tratamento de erros
app.use(errorHandler)

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Endpoint não encontrado",
    availableEndpoints: [
      "GET /",
      "GET /api/health",
      "POST /api/auth/login",
      "POST /api/deploy",
      "GET /api/deploy",
      "GET /api/deploy/:id",
      "DELETE /api/deploy/:id",
      "GET /api/projects",
      "GET /docs",
    ],
  })
})

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM recebido, encerrando servidor...")
  process.exit(0)
})

process.on("SIGINT", () => {
  logger.info("SIGINT recebido, encerrando servidor...")
  process.exit(0)
})

// Iniciar servidor
const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`)
  logger.info(`📚 Documentação disponível em http://localhost:${PORT}/docs`)
  logger.info(`🏥 Health check disponível em http://localhost:${PORT}/api/health`)
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`)

  if (process.env.RAILWAY_ENVIRONMENT) {
    logger.info(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`)
  }
})

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  logger.error("Erro não capturado:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promise rejeitada não tratada:", reason)
  process.exit(1)
})

export default app
