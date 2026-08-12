const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

type ProblemDetail = {
  detail?: string
  code?: string
  fieldErrors?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetail
    throw new ApiError(
      problem.detail ?? 'Không thể kết nối đến hệ thống.',
      response.status,
      problem.code,
      problem.fieldErrors,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
