import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PostMedia } from './PostMedia'
const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  token: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, getAccessToken: mocks.token }),
}))
let intersect: (entries: { isIntersecting: boolean }[]) => void
beforeEach(() => {
  mocks.user = null
  mocks.token.mockReset().mockResolvedValue('token')
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof intersect) {
        intersect = callback
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())
describe('PostMedia', () => {
  it('defers source until visible and refreshes the protected session first', async () => {
    mocks.user = { id: 'guest' }
    render(
      <PostMedia
        postId="post"
        media={{ id: 'asset', contentType: 'image/png', sizeBytes: 100 }}
      />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(mocks.token).not.toHaveBeenCalled()
    act(() => intersect([{ isIntersecting: true }]))
    const img = await screen.findByRole('img')
    expect(mocks.token).toHaveBeenCalledOnce()
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('crossorigin', 'use-credentials')
    expect(img.getAttribute('src')).toBe(
      'http://localhost:8080/api/v1/media/community/posts/post',
    )
    expect(img.getAttribute('src')).not.toContain('token')
  })
  it('never autoplays or eagerly buffers video', async () => {
    render(
      <PostMedia
        postId="post"
        media={{ id: 'asset', contentType: 'video/mp4', sizeBytes: 100 }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Video/ }))
    const video = await screen.findByLabelText('Video bài viết')
    expect(video).toHaveAttribute('preload', 'none')
    expect(video).toHaveAttribute('controls')
    expect(video).not.toHaveAttribute('autoplay')
    expect(mocks.token).not.toHaveBeenCalled()
  })
  it('shows a retry instead of a broken image element', async () => {
    render(
      <PostMedia
        postId="post"
        media={{ id: 'asset', contentType: 'image/png', sizeBytes: 100 }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Ảnh/ }))
    fireEvent.error(await screen.findByRole('img'))
    expect(screen.getByRole('alert')).toHaveTextContent('quyền xem')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại media' }))
    expect(await screen.findByRole('img')).toBeInTheDocument()
  })
})
