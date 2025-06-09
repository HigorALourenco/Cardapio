import jwt from "jsonwebtoken"
import { ApiError } from "../utils/api-error.js"

export const authMiddleware = (req, res, next) => {
  try {
    // Verificar header de autorização
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError("Token de autenticação não fornecido", 401)
    }

    // Extrair token
    const token = authHeader.split(" ")[1]
    if (!token) {
      throw new ApiError("Token de autenticação inválido", 401)
    }

    // Verificar token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
      next()
    } catch (error) {
      throw new ApiError("Token inválido ou expirado", 401)
    }
  } catch (error) {
    next(error)
  }
}
