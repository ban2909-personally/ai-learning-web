import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { apiRequest, apiUpload, ApiError } from '../../lib/api'
import type { AuthResponse, LoginInput, RegisterInput, User } from '../../types/auth'

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  request: <T>(path: string, init?: RequestInit) => Promise<T>
  upload: <T>(path: string, body: FormData, onProgress: (percentage: number) => void) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  const acceptSession = useCallback((session: AuthResponse) => {
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const refreshSession = useCallback(async () => {
    const session = await apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
    acceptSession(session)
    return session
  }, [acceptSession])

  useEffect(() => {
    refreshSession()
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Không thể khôi phục phiên đăng nhập', error)
        }
      })
      .finally(() => setLoading(false))
  }, [refreshSession])

  const login = useCallback(async (input: LoginInput) => {
    acceptSession(await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }))
  }, [acceptSession])

  const register = useCallback(async (input: RegisterInput) => {
    acceptSession(await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }))
  }, [acceptSession])

  const logout = useCallback(async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' })
    setAccessToken(null)
    setUser(null)
  }, [])

  const request = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    try {
      return await apiRequest<T>(path, init, accessToken)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      const session = await refreshSession()
      return apiRequest<T>(path, init, session.accessToken)
    }
  }, [accessToken, refreshSession])

  const upload = useCallback(async <T,>(
    path: string,
    body: FormData,
    onProgress: (percentage: number) => void,
  ) => {
    let token = accessToken
    if (!token) token = (await refreshSession()).accessToken
    try {
      return await apiUpload<T>(path, body, token, onProgress)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      const session = await refreshSession()
      return apiUpload<T>(path, body, session.accessToken, onProgress)
    }
  }, [accessToken, refreshSession])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    login,
    register,
    logout,
    request,
    upload,
  }), [accessToken, isLoading, login, logout, register, request, upload, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
