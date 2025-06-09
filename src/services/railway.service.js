import { exec } from "child_process"
import util from "util"
import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import simpleGit from "simple-git"
import logger from "../utils/logger.js"
import { ApiError } from "../utils/api-error.js"

const execPromise = util.promisify(exec)

// Mapa para rastrear deploys em andamento
const activeDeployments = new Map()

export class RailwayService {
  constructor() {
    this.repoPath = process.env.REPO_PATH || "./repos"
    this.maxConcurrentDeploys = Number.parseInt(process.env.MAX_CONCURRENT_DEPLOYS || "3")
    this.initializeRepoDirectory()
  }

  async initializeRepoDirectory() {
    try {
      await fs.mkdir(this.repoPath, { recursive: true })
      logger.info(`Diretório de repositórios inicializado: ${this.repoPath}`)
    } catch (error) {
      logger.error(`Erro ao inicializar diretório de repositórios: ${error.message}`)
      throw new ApiError("Falha ao inicializar sistema de deploy", 500)
    }
  }

  async verifyRailwayCLI() {
    try {
      await execPromise("railway version")
      return true
    } catch (error) {
      logger.error("Railway CLI não encontrado. Tentando instalar...")
      try {
        await execPromise("npm install -g @railway/cli")
        logger.info("Railway CLI instalado com sucesso")
        return true
      } catch (installError) {
        logger.error(`Falha ao instalar Railway CLI: ${installError.message}`)
        throw new ApiError("Falha ao instalar Railway CLI", 500)
      }
    }
  }

  async loginWithToken(token) {
    try {
      await execPromise(`railway login --token ${token}`)
      logger.info("Login na Railway realizado com sucesso")
      return true
    } catch (error) {
      logger.error(`Falha no login na Railway: ${error.message}`)
      throw new ApiError("Falha na autenticação com a Railway", 401)
    }
  }

  async cloneRepository(repoUrl, branch = "main") {
    const deployId = uuidv4()
    const projectDir = path.join(this.repoPath, deployId)

    try {
      // Verificar número de deploys ativos
      if (activeDeployments.size >= this.maxConcurrentDeploys) {
        throw new ApiError("Número máximo de deploys concorrentes atingido. Tente novamente mais tarde.", 429)
      }

      // Registrar deploy ativo
      activeDeployments.set(deployId, {
        repoUrl,
        branch,
        status: "cloning",
        startTime: new Date(),
        logs: [],
      })

      // Criar diretório do projeto
      await fs.mkdir(projectDir, { recursive: true })

      // Clonar repositório
      const git = simpleGit()
      await git.clone(repoUrl, projectDir)

      // Checkout na branch especificada
      const projectGit = simpleGit(projectDir)
      await projectGit.checkout(branch)

      // Atualizar status
      activeDeployments.get(deployId).status = "cloned"
      activeDeployments.get(deployId).logs.push(`Repositório clonado com sucesso: ${repoUrl} (branch: ${branch})`)

      logger.info(`Repositório clonado com sucesso: ${repoUrl} (branch: ${branch})`)
      return deployId
    } catch (error) {
      // Limpar em caso de erro
      try {
        await fs.rm(projectDir, { recursive: true, force: true })
      } catch (cleanupError) {
        logger.error(`Erro ao limpar diretório após falha: ${cleanupError.message}`)
      }

      // Remover do mapa de deploys ativos
      activeDeployments.delete(deployId)

      logger.error(`Erro ao clonar repositório: ${error.message}`)
      throw new ApiError(`Falha ao clonar repositório: ${error.message}`, 500)
    }
  }

  async deployProject(deployId) {
    if (!activeDeployments.has(deployId)) {
      throw new ApiError("Deploy ID não encontrado", 404)
    }

    const deployInfo = activeDeployments.get(deployId)
    const projectDir = path.join(this.repoPath, deployId)

    try {
      // Atualizar status
      deployInfo.status = "deploying"
      deployInfo.logs.push("Iniciando deploy na Railway...")

      // Verificar CLI e fazer login
      await this.verifyRailwayCLI()
      if (process.env.RAILWAY_API_TOKEN) {
        await this.loginWithToken(process.env.RAILWAY_API_TOKEN)
      }

      // Inicializar projeto na Railway
      deployInfo.logs.push("Inicializando projeto na Railway...")
      const { stdout: initOutput } = await execPromise("railway init --yes", { cwd: projectDir })
      deployInfo.logs.push(`Inicialização: ${initOutput.trim()}`)

      // Fazer deploy
      deployInfo.logs.push("Executando deploy...")
      const { stdout: deployOutput } = await execPromise("railway up --detach", { cwd: projectDir })
      deployInfo.logs.push(`Deploy: ${deployOutput.trim()}`)

      // Obter URL do projeto
      const { stdout: urlOutput } = await execPromise("railway domain", { cwd: projectDir })
      const projectUrl = urlOutput.trim()

      // Atualizar status
      deployInfo.status = "completed"
      deployInfo.endTime = new Date()
      deployInfo.projectUrl = projectUrl
      deployInfo.logs.push(`Deploy concluído com sucesso. URL: ${projectUrl}`)

      logger.info(`Deploy concluído com sucesso. URL: ${projectUrl}`)

      return {
        deployId,
        status: "completed",
        projectUrl,
        duration: deployInfo.endTime - deployInfo.startTime,
      }
    } catch (error) {
      // Atualizar status em caso de erro
      deployInfo.status = "failed"
      deployInfo.endTime = new Date()
      deployInfo.error = error.message
      deployInfo.logs.push(`Erro no deploy: ${error.message}`)

      logger.error(`Erro no deploy ${deployId}: ${error.message}`)
      throw new ApiError(`Falha no deploy: ${error.message}`, 500)
    }
  }

  async getDeployStatus(deployId) {
    if (!activeDeployments.has(deployId)) {
      throw new ApiError("Deploy ID não encontrado", 404)
    }

    const deployInfo = activeDeployments.get(deployId)
    return {
      deployId,
      status: deployInfo.status,
      repoUrl: deployInfo.repoUrl,
      branch: deployInfo.branch,
      startTime: deployInfo.startTime,
      endTime: deployInfo.endTime,
      projectUrl: deployInfo.projectUrl,
      error: deployInfo.error,
      logs: deployInfo.logs,
    }
  }

  async getAllDeployments() {
    const deployments = []

    for (const [deployId, deployInfo] of activeDeployments.entries()) {
      deployments.push({
        deployId,
        status: deployInfo.status,
        repoUrl: deployInfo.repoUrl,
        branch: deployInfo.branch,
        startTime: deployInfo.startTime,
        endTime: deployInfo.endTime,
        projectUrl: deployInfo.projectUrl,
      })
    }

    return deployments
  }

  async cleanupDeployment(deployId) {
    if (!activeDeployments.has(deployId)) {
      throw new ApiError("Deploy ID não encontrado", 404)
    }

    const projectDir = path.join(this.repoPath, deployId)

    try {
      // Remover diretório do projeto
      await fs.rm(projectDir, { recursive: true, force: true })

      // Remover do mapa de deploys ativos se o status for completed ou failed
      const status = activeDeployments.get(deployId).status
      if (status === "completed" || status === "failed") {
        activeDeployments.delete(deployId)
      }

      logger.info(`Limpeza do deploy ${deployId} concluída com sucesso`)
      return true
    } catch (error) {
      logger.error(`Erro ao limpar deploy ${deployId}: ${error.message}`)
      throw new ApiError(`Falha ao limpar deploy: ${error.message}`, 500)
    }
  }
}

export default new RailwayService()
