import express from "express"
import { exec } from "child_process"
import util from "util"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const execPromise = util.promisify(exec)
const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * @route GET /api/health
 * @desc Verificar status da API
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now()

    // Verificações básicas
    const checks = {
      service: "railway-deploy-api",
      version: "1.0.0",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3000,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      railway: {
        environment: process.env.RAILWAY_ENVIRONMENT || null,
        service: process.env.RAILWAY_SERVICE_NAME || null,
        deployment: process.env.RAILWAY_DEPLOYMENT_ID || null,
      },
    }

    // Verificar Railway CLI (não crítico)
    try {
      const { stdout } = await execPromise("railway version", { timeout: 5000 })
      checks.railwayCli = {
        installed: true,
        version: stdout.trim(),
      }
    } catch (error) {
      checks.railwayCli = {
        installed: false,
        error: "Railway CLI não encontrado ou não acessível",
      }
    }

    // Verificar diretórios (não crítico)
    try {
      const reposDir = path.join(__dirname, "../../repos")
      const logsDir = path.join(__dirname, "../../logs")

      const reposStat = await fs.stat(reposDir).catch(() => null)
      const logsStat = await fs.stat(logsDir).catch(() => null)

      checks.directories = {
        repos: reposStat ? "accessible" : "not_found",
        logs: logsStat ? "accessible" : "not_found",
      }
    } catch (error) {
      checks.directories = {
        error: "Erro ao verificar diretórios",
      }
    }

    // Verificar variáveis de ambiente importantes
    checks.config = {
      jwtSecret: !!process.env.JWT_SECRET,
      railwayToken: !!process.env.RAILWAY_API_TOKEN,
      nodeEnv: process.env.NODE_ENV || "not_set",
    }

    // Tempo de resposta
    checks.responseTime = Date.now() - startTime

    res.status(200).json({
      status: "success",
      data: checks,
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check falhou",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

/**
 * @route GET /api/health/detailed
 * @desc Verificação detalhada do sistema
 * @access Public
 */
router.get("/detailed", async (req, res) => {
  try {
    const detailed = {
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        cwd: process.cwd(),
      },
      environment: {
        ...process.env,
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    }

    res.json({
      status: "success",
      data: detailed,
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Detailed health check falhou",
      error: error.message,
    })
  }
})

export default router
