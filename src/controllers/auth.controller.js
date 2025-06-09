import authService from "../services/auth.service.js"
import { ApiError } from "../utils/api-error.js"
import Joi from "joi"

// Validação de entrada
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
})

export class AuthController {
  async login(req, res, next) {
    try {
      // Validar entrada
      const { error, value } = loginSchema.validate(req.body)
      if (error) {
        throw new ApiError(`Dados de entrada inválidos: ${error.message}`, 400)
      }

      const { username, password } = value

      // Autenticar usuário
      const authResult = await authService.login(username, password)

      res.json({
        status: "success",
        data: authResult,
      })
    } catch (error) {
      next(error)
    }
  }

  async validateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError("Token não fornecido", 400)
      }

      const token = authHeader.split(" ")[1]
      const validation = await authService.validateToken(token)

      res.json({
        status: "success",
        data: validation,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new AuthController()
