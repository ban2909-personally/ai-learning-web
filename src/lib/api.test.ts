import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, apiStream, resolveWebSocketUrl } from './api'

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows a helpful message when the API is offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    await expect(apiRequest('/community/feed')).rejects.toMatchObject({
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      status: 0,
    })
  })
})

describe('apiStream', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('parses SSE events split across network chunks', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      'event:delta\r\ndata:{"text":"Hel',
      'lo"}\r\n\r\nevent:complete\ndata:{"remainingQuota":19}\n\n',
    ]
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
        controller.close()
      },
    })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const events: Array<{ event: string; data: string }> = []

    await apiStream(
      '/mentor',
      { method: 'POST', body: '{}' },
      'access-token',
      (event) => events.push(event),
    )

    expect(events).toEqual([
      { event: 'delta', data: '{"text":"Hello"}' },
      { event: 'complete', data: '{"remainingQuota":19}' },
    ])
    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer access-token',
    )
    expect(request.credentials).toBe('include')
  })
})

describe('resolveWebSocketUrl', () => {
  it('uses the API host without leaking credentials into the URL', () => {
    expect(resolveWebSocketUrl('/ws/notifications')).toBe(
      'ws://localhost:8080/ws/notifications',
    )
  })
})
