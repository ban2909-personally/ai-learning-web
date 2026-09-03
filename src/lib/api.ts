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

export type ServerSentEvent = {
  event: string
  data: string
}

export async function apiStream(
  path: string,
  init: RequestInit,
  accessToken: string,
  onEvent: (event: ServerSentEvent) => void,
): Promise<void> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'text/event-stream')
  headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetail
    throw new ApiError(
      problem.detail ?? 'Không thể kết nối đến AI Mentor.',
      response.status,
      problem.code,
      problem.fieldErrors,
    )
  }
  if (!response.body) throw new ApiError('Trình duyệt không hỗ trợ nhận phản hồi trực tiếp.', 0)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    buffer = consumeSseBlocks(buffer, onEvent)
    if (done) break
  }
  if (buffer.trim()) dispatchSseBlock(buffer, onEvent)
}

function consumeSseBlocks(buffer: string, onEvent: (event: ServerSentEvent) => void): string {
  while (true) {
    const lfBoundary = buffer.indexOf('\n\n')
    const crlfBoundary = buffer.indexOf('\r\n\r\n')
    const candidates = [lfBoundary, crlfBoundary].filter((index) => index >= 0)
    if (candidates.length === 0) return buffer
    const boundary = Math.min(...candidates)
    const separatorLength = boundary === crlfBoundary ? 4 : 2
    dispatchSseBlock(buffer.slice(0, boundary), onEvent)
    buffer = buffer.slice(boundary + separatorLength)
  }
}

function dispatchSseBlock(block: string, onEvent: (event: ServerSentEvent) => void) {
  let event = 'message'
  const data: string[] = []
  block.replaceAll('\r\n', '\n').split('\n').forEach((line) => {
    if (line.startsWith('event:')) event = line.slice('event:'.length).trim()
    if (line.startsWith('data:')) data.push(line.slice('data:'.length).trimStart())
  })
  if (data.length > 0) onEvent({ event, data: data.join('\n') })
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
