import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpaceChat } from './SpaceChat'
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'guest' } }),
}))
vi.mock('./useCommunityApi', () => ({ useCommunityApi: () => mocks }))
const message = {
  id: 'message',
  sequence: 1,
  authorId: 'guest',
  authorName: 'Khách',
  body: 'English chat',
  removed: false,
  createdAt: '2026-09-28T08:00:00Z',
}
beforeEach(() => {
  mocks.read.mockReset().mockResolvedValue({
    messages: [],
    oldestSequence: 0,
    newestSequence: 0,
    hasMore: false,
  })
  mocks.write.mockReset().mockResolvedValue(message)
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  })
  vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
    callback(0)
    return 0
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe('SpaceChat', () => {
  it('loads only while open and aborts requests when closed', async () => {
    render(<SpaceChat spaceId="space" name="English Club" manager={false} />)
    expect(mocks.read).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
    await screen.findByText('Bắt đầu cuộc trò chuyện đầu tiên.')
    const signal = mocks.read.mock.calls[0][1].signal as AbortSignal
    expect(signal.aborted).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
    expect(signal.aborted).toBe(true)
  })
  it('reuses the same client ID after failed sends', async () => {
    mocks.write
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(message)
    render(<SpaceChat spaceId="space" name="English Club" manager={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
    await screen.findByText('Bắt đầu cuộc trò chuyện đầu tiên.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Tin nhắn' }), {
      target: { value: 'English chat' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin' }))
    await screen.findByText('Network failure')
    const first = mocks.write.mock.calls[0][2]
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin' }))
    await screen.findByText('English chat')
    expect(mocks.write.mock.calls[1][2]).toEqual(first)
    expect(first.clientId).toEqual(expect.any(String))
    expect(screen.getAllByText('English chat')).toHaveLength(1)
  })
  it('stops polling while hidden and on unmount', async () => {
    vi.useFakeTimers()
    const result = render(
      <SpaceChat spaceId="space" name="English Club" manager={false} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
      await Promise.resolve()
    })
    expect(mocks.read).toHaveBeenCalledOnce()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(20_000)
    })
    expect(mocks.read).toHaveBeenCalledOnce()
    result.unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(mocks.read).toHaveBeenCalledOnce()
  })
  it('lets the space manager remove messages', async () => {
    mocks.read.mockResolvedValue({
      messages: [{ ...message, authorId: 'other' }],
      oldestSequence: 1,
      newestSequence: 1,
      hasMore: false,
    })
    render(<SpaceChat spaceId="space" name="English Club" manager />)
    fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
    await screen.findByText('English chat')
    fireEvent.click(
      screen.getByRole('button', { name: 'Gỡ tin nhắn của Khách' }),
    )
    await waitFor(() =>
      expect(screen.queryByText('English chat')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Tin nhắn đã được gỡ.')).toBeInTheDocument()
  })
})
