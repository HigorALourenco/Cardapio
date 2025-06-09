import express from "express"
import { exec } from "child_process"
import util from "util"
import { ApiError } from "../utils/api-error.js"

const execPromise = util.promisify(exec)
const router = express.Router()

/**
 * @route GET /api/projects
 * @desc Listar projetos na Railway
 * @access Private
 */
router.get("/", async (req, res, next) => {
  try {
    const { stdout } = await execPromise("railway list")
    const projects = stdout.trim().split("\n").filter(Boolean)

    res.json({
      status: "success",
      data: projects,
    })
  } catch (error) {
    next(new ApiError(`Falha ao listar projetos: ${error.message}`, 500))
  }
})

/**
 * @route GET /api/projects/:projectId
 * @desc Obter informações de um projeto específico
 * @access Private
 */
router.get("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = req.params

    // Mudar para o projeto
    await execPromise(`railway project ${projectId}`)

    // Obter informações
    const { stdout: infoOutput } = await execPromise("railway status")

    res.json({
      status: "success",
      data: {
        projectId,
        info: infoOutput.trim(),
      },
    })
  } catch (error) {
    next(new ApiError(`Falha ao obter informações do projeto: ${error.message}`, 500))
  }
})

export default router
