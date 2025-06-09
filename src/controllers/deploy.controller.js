import railwayService from "../services/railway.service.js"
import { ApiError } from "../utils/api-error.js"
import logger from "../utils/logger.js"
import Joi from "joi"

// Validação de entrada
const deploySchema = Joi.object({
  repoUrl: Joi.string().required(),
  branch: Joi.string().default("main"),
  token: Joi.string(),
})

export class DeployController {
  async startDeploy(req, res, next) {
    try {
      // Validar entrada
      const { error, value } = deploySchema.validate(req.body)
      if (error) {
        throw new ApiError(`Dados de entrada inválidos: ${error.message}`, 400)
      }

      const { repoUrl, branch, token } = value

      // Usar token fornecido ou o do ambiente
      if (token) {
        await railwayService.loginWithToken(token)
      }

      // Clonar repositório
      const deployId = await railwayService.cloneRepository(repoUrl, branch)

      // Iniciar deploy assíncrono
      setTimeout(async () => {
        try {
          await railwayService.deployProject(deployId)
        } catch (error) {
          logger.error(`Erro no deploy assíncrono ${deployId}: ${error.message}`)
        }
      }, 0)

      res.status(202).json({
        status: "success",
        message: "Deploy iniciado com sucesso",
        data: {
          deployId,
          status: "initiated",
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async getDeployStatus(req, res, next) {
    try {
      const { deployId } = req.params

      if (!deployId) {
        throw new ApiError("ID do deploy não fornecido", 400)
      }

      const status = await railwayService.getDeployStatus(deployId)

      res.json({
        status: "success",
        data: status,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllDeployments(req, res, next) {
    try {
      const deployments = await railwayService.getAllDeployments()

      res.json({
        status: "success",
        data: deployments,
      })
    } catch (error) {
      next(error)
    }
  }

  async cleanupDeployment(req, res, next) {
    try {
      const { deployId } = req.params

      if (!deployId) {
        throw new ApiError("ID do deploy não fornecido", 400)
      }

      await railwayService.cleanupDeployment(deployId)

      res.json({
        status: "success",
        message: "Deploy limpo com sucesso",
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new DeployController()
