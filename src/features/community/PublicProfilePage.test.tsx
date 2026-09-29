import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicProfilePage } from './PublicProfilePage'

const { read, feed } = vi.hoisted(() => ({ read: vi.fn(), feed: vi.fn() }))
vi.mock('./useCommunityApi', () => ({ useCommunityApi: () => ({ read }) }))
vi.mock('./CommunityFeed', () => ({
  CommunityFeed: (props: unknown) => {
    feed(props)
    return <p>Public feed</p>
  },
}))
function show() {
  render(
    <MemoryRouter initialEntries={['/community/people/person']}>
      <Routes>
        <Route path="/community/people/:id" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>,
  )
}
describe('PublicProfilePage', () => {
  beforeEach(() => {
    read.mockReset()
    feed.mockReset()
  })
  it('loads the safe public profile and a read-only author-scoped feed', async () => {
    read.mockResolvedValue({ id: 'person', displayName: 'Hà Anh' })
    show()
    expect(
      await screen.findByRole('heading', { name: 'Hà Anh' }),
    ).toBeInTheDocument()
    expect(feed).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'person', canPost: false }),
    )
    expect(read).toHaveBeenCalledWith('/community/people/person', {
      signal: expect.any(AbortSignal),
    })
  })
  it('does not load a feed when the profile is unavailable', async () => {
    read.mockRejectedValue(new Error('Không tìm thấy hồ sơ công khai.'))
    show()
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Không tìm thấy hồ sơ công khai.',
      ),
    )
    expect(feed).not.toHaveBeenCalled()
  })
})
