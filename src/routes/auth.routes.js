import express from "express"
import authController from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @route POST /api/auth/login
 * @desc Autenticar usuário
 * @access Public
 */
router.post("/login", authController.login)

/**
 * @route GET /api/auth/validate
 * @desc Validar token JWT
 * @access Private
 */
router.get("/validate", authMiddleware, authController.validateToken)

export default router
