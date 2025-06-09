import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export class HealthController {
  async check(req, res, next) {
    try {
      const railwayInstalled = await this.checkRailwayCLI()

      res.json({
        status: "success",
        data: {
          service: "railway-deploy-api",
          version: "1.0.0",
          uptime: process.uptime(),
          timestamp: new Date(),
          railwayCliInstalled: railwayInstalled,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async checkRailwayCLI() {
    try {
      await execPromise("railway version")
      return true
    } catch (error) {
      return false
    }
  }
}

export default new HealthController()
