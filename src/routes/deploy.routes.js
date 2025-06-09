import express from "express"
import deployController from "../controllers/deploy.controller.js"

const router = express.Router()

/**
 * @route POST /api/deploy
 * @desc Iniciar um novo deploy
 * @access Private
 */
router.post("/", deployController.startDeploy)

/**
 * @route GET /api/deploy
 * @desc Obter todos os deploys
 * @access Private
 */
router.get("/", deployController.getAllDeployments)

/**
 * @route GET /api/deploy/:deployId
 * @desc Obter status de um deploy específico
 * @access Private
 */
router.get("/:deployId", deployController.getDeployStatus)

/**
 * @route DELETE /api/deploy/:deployId
 * @desc Limpar um deploy específico
 * @access Private
 */
router.delete("/:deployId", deployController.cleanupDeployment)

export default router
