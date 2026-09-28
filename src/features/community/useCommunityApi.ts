import { useCallback } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../../lib/api'

export function useCommunityApi() {
  const { user, request } = useAuth()
  const read = useCallback(
    <T>(path: string, init?: RequestInit) =>
      user ? request<T>(path, init) : apiRequest<T>(path, init),
    [request, user],
  )
  const write = useCallback(
    <T>(path: string, method: string, body?: unknown) =>
      request<T>(path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    [request],
  )
  return { read, write }
}
