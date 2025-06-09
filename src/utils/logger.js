import winston from "winston"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuração de formato para Railway
const railwayFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }

    return log
  }),
)

// Transports baseados no ambiente
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), railwayFormat),
  }),
]

// Adicionar file transports apenas se possível
if (process.env.NODE_ENV !== "production") {
  try {
    transports.push(
      new winston.transports.File({
        filename: path.join(__dirname, "../../logs/error.log"),
        level: "error",
        format: railwayFormat,
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../logs/combined.log"),
        format: railwayFormat,
      }),
    )
  } catch (error) {
    console.warn("Aviso: Não foi possível configurar file transports:", error.message)
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: railwayFormat,
  defaultMeta: {
    service: "railway-deploy-api",
    environment: process.env.NODE_ENV || "development",
    railway_service: process.env.RAILWAY_SERVICE_NAME,
  },
  transports,
  exitOnError: false,
})

export default logger
