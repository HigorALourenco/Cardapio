import jwt from "jsonwebtoken"
import { ApiError } from "../utils/api-error.js"
import logger from "../utils/logger.js"

// Usuários em memória (em produção, use um banco de dados)
const users = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // Em produção, use hash de senha
    role: "admin",
  },
]

export class AuthService {
  async login(username, password) {
    // Encontrar usuário
    const user = users.find((u) => u.username === username)

    // Verificar se o usuário existe
    if (!user) {
      logger.warn(`Tentativa de login com usuário inexistente: ${username}`)
      throw new ApiError("Credenciais inválidas", 401)
    }

    // Verificar senha (em produção, compare hashes)
    if (user.password !== password) {
      logger.warn(`Tentativa de login com senha incorreta para usuário: ${username}`)
      throw new ApiError("Credenciais inválidas", 401)
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "24h" },
    )

    logger.info(`Login bem-sucedido para usuário: ${username}`)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      return {
        valid: true,
        decoded,
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      }
    }
  }
}

export default new AuthService()
