import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { apiRequest, apiStream, apiUpload, ApiError, type ServerSentEvent } from '../../lib/api'
import type { AuthResponse, LoginInput, RegisterInput, User } from '../../types/auth'

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string>
  request: <T>(path: string, init?: RequestInit) => Promise<T>
  stream: (path: string, init: RequestInit, onEvent: (event: ServerSentEvent) => void) => Promise<void>
  upload: <T>(path: string, body: FormData, onProgress: (percentage: number) => void) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)
  const accessTokenRef = useRef<string | null>(null)
  const refreshPromiseRef = useRef<Promise<AuthResponse> | null>(null)
  const sessionEpochRef = useRef(0)

  const acceptSession = useCallback((session: AuthResponse) => {
    accessTokenRef.current = session.accessToken
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const clearSession = useCallback(() => {
    sessionEpochRef.current += 1
    accessTokenRef.current = null
    setAccessToken(null)
    setUser(null)
  }, [])

  const refreshSession = useCallback(() => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const sessionEpoch = sessionEpochRef.current
    const refresh = apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then((session) => {
        if (sessionEpoch !== sessionEpochRef.current) {
          throw new Error('Session changed while refresh was in progress')
        }
        acceptSession(session)
        return session
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) clearSession()
        throw error
      })
    refreshPromiseRef.current = refresh
    refresh.then(
      () => {
        if (refreshPromiseRef.current === refresh) refreshPromiseRef.current = null
      },
      () => {
        if (refreshPromiseRef.current === refresh) refreshPromiseRef.current = null
      },
    )
    return refresh
  }, [acceptSession, clearSession])

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
    const session = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    sessionEpochRef.current += 1
    acceptSession(session)
  }, [acceptSession])

  const register = useCallback(async (input: RegisterInput) => {
    const session = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    sessionEpochRef.current += 1
    acceptSession(session)
  }, [acceptSession])

  const logout = useCallback(async () => {
    clearSession()
    await apiRequest<void>('/auth/logout', { method: 'POST' })
  }, [clearSession])

  const getAccessToken = useCallback(async () => {
    const current = accessTokenRef.current
    if (current && isTokenFresh(current)) return current
    return (await refreshSession()).accessToken
  }, [refreshSession])

  const request = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    try {
      return await apiRequest<T>(path, init, accessTokenRef.current)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      const session = await refreshSession()
      return apiRequest<T>(path, init, session.accessToken)
    }
  }, [refreshSession])

  const upload = useCallback(async <T,>(
    path: string,
    body: FormData,
    onProgress: (percentage: number) => void,
  ) => {
    let token = accessTokenRef.current
    if (!token) token = (await refreshSession()).accessToken
    try {
      return await apiUpload<T>(path, body, token, onProgress)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      const session = await refreshSession()
      return apiUpload<T>(path, body, session.accessToken, onProgress)
    }
  }, [refreshSession])

  const stream = useCallback(async (
    path: string,
    init: RequestInit,
    onEvent: (event: ServerSentEvent) => void,
  ) => {
    let token = accessTokenRef.current
    if (!token) token = (await refreshSession()).accessToken
    try {
      await apiStream(path, init, token, onEvent)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      const session = await refreshSession()
      await apiStream(path, init, session.accessToken, onEvent)
    }
  }, [refreshSession])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    login,
    register,
    logout,
    getAccessToken,
    request,
    stream,
    upload,
  }), [accessToken, getAccessToken, isLoading, login, logout, register, request, stream, upload, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

function isTokenFresh(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    if (!payload) return false
    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(base64)) as { exp?: number }
    return typeof decoded.exp === 'number' && decoded.exp * 1000 > Date.now() + 30_000
  } catch {
    return false
  }
}
