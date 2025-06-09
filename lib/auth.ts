// Sistema de autenticação para o painel administrativo
export interface AuthState {
  isAuthenticated: boolean
  user: string | null
}

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "312890",
}

// Verificar se está autenticado
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false
  const authData = localStorage.getItem("adega_auth")
  if (!authData) return false

  try {
    const { isAuthenticated, timestamp } = JSON.parse(authData)
    // Sessão expira em 24 horas
    const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000

    if (isExpired) {
      localStorage.removeItem("adega_auth")
      return false
    }

    return isAuthenticated
  } catch {
    return false
  }
}

// Fazer login
export const login = (username: string, password: string): boolean => {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const authData = {
      isAuthenticated: true,
      user: username,
      timestamp: Date.now(),
    }
    localStorage.setItem("adega_auth", JSON.stringify(authData))
    return true
  }
  return false
}

// Fazer logout
export const logout = (): void => {
  localStorage.removeItem("adega_auth")
  window.location.href = "/admin"
}

// Obter usuário atual
export const getCurrentUser = (): string | null => {
  if (!isAuthenticated()) return null

  try {
    const authData = localStorage.getItem("adega_auth")
    if (!authData) return null

    const { user } = JSON.parse(authData)
    return user
  } catch {
    return null
  }
}

// Verificar se a sessão está próxima do vencimento (menos de 1 hora)
export const isSessionExpiringSoon = (): boolean => {
  if (typeof window === "undefined") return false
  const authData = localStorage.getItem("adega_auth")
  if (!authData) return false

  try {
    const { timestamp } = JSON.parse(authData)
    const timeLeft = 24 * 60 * 60 * 1000 - (Date.now() - timestamp)
    return timeLeft < 60 * 60 * 1000 // Menos de 1 hora
  } catch {
    return false
  }
}

// Renovar sessão
export const renewSession = (): void => {
  if (!isAuthenticated()) return

  try {
    const authData = localStorage.getItem("adega_auth")
    if (!authData) return

    const data = JSON.parse(authData)
    data.timestamp = Date.now()
    localStorage.setItem("adega_auth", JSON.stringify(data))
  } catch {
    // Ignore errors
  }
}
