import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpacePostModeration } from './SpacePostModeration'
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('./useCommunityApi', () => ({ useCommunityApi: () => mocks }))
beforeEach(() => {
  mocks.read.mockReset()
  mocks.write.mockReset()
})
describe('SpacePostModeration', () => {
  it('publishes through the scoped approval endpoint then refreshes the queue', async () => {
    mocks.read
      .mockResolvedValueOnce([
        { id: 'post', authorName: 'Thành viên', body: 'English tip' },
      ])
      .mockResolvedValue([])
    mocks.write.mockResolvedValue({ status: 'ACTIVE' })
    const published = vi.fn()
    render(<SpacePostModeration spaceId="space" onPublished={published} />)
    await screen.findByText('English tip')
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt bài' }))
    await waitFor(() => expect(published).toHaveBeenCalledOnce())
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/spaces/space/posts/post/approve',
      'POST',
    )
    await screen.findByText('Không có bài chờ duyệt ở trang này.')
  })
  it('shows authorization failures with a manual retry', async () => {
    mocks.read.mockRejectedValue(new Error('Không có quyền duyệt.'))
    render(<SpacePostModeration spaceId="space" onPublished={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không có quyền duyệt.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(2))
  })
})
