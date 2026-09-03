const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const api = new URL(API_URL, window.location.origin)
  return new URL(path, api.origin).toString()
}

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

export function apiUpload<T>(
  path: string,
  body: FormData,
  accessToken: string,
  onProgress: (percentage: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', `${API_URL}${path}`)
    request.withCredentials = true
    request.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      const response = parseJson(request.responseText)
      if (request.status >= 200 && request.status < 300) {
        resolve(response as T)
        return
      }
      const problem = response as ProblemDetail
      reject(new ApiError(
        problem.detail ?? 'Không thể tải nội dung lên hệ thống.',
        request.status,
        problem.code,
        problem.fieldErrors,
      ))
    })
    request.addEventListener('error', () => reject(
      new ApiError('Không thể kết nối đến hệ thống.', 0),
    ))
    request.send(body)
  })
}

function parseJson(value: string): unknown {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
