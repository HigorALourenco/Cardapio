import { ApiError } from "../utils/api-error.js"
import logger from "../utils/logger.js"

export const errorHandler = (err, req, res, next) => {
  // Registrar erro
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // Verificar se é um erro da API
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: "error",
      code: err.statusCode,
      message: err.message,
    })
  }

  // Erro interno do servidor
  return res.status(500).json({
    status: "error",
    code: 500,
    message: "Erro interno do servidor",
  })
}
