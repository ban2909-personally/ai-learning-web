import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { FriendsPage } from './FriendsPage'
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  openChat: vi.fn(),
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ read: mocks.read, write: mocks.write }),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer' } }),
}))
vi.mock('../messaging/DirectChatContext', () => ({
  useDirectChatLauncher: () => ({ openChat: mocks.openChat }),
}))
const person = {
  person: { id: 'peer', displayName: 'Minh Anh' },
  relationship: 'FRIENDS',
  updatedAt: '2026-09-29T00:00:00Z',
}
beforeEach(() => {
  mocks.read.mockReset().mockResolvedValue({ people: [person], nextPage: null })
  mocks.write.mockReset()
})
it('links private connections to profiles and loads incoming requests on explicit filter', async () => {
  render(
    <MemoryRouter>
      <FriendsPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('link', { name: 'Minh Anh' })).toHaveAttribute(
    'href',
    '/community/people/peer',
  )
  mocks.read.mockResolvedValue({
    people: [{ ...person, relationship: 'INCOMING' }],
    nextPage: null,
  })
  fireEvent.click(screen.getByRole('button', { name: 'Lời mời đã nhận' }))
  expect(
    await screen.findByRole('button', { name: 'Chấp nhận kết bạn' }),
  ).toBeInTheDocument()
  expect(mocks.read).toHaveBeenCalledWith(
    '/community/friends?filter=incoming&page=0',
    expect.any(Object),
  )
})
it('paginates without duplicate peers and reloads the list after removing a connection', async () => {
  mocks.read
    .mockResolvedValueOnce({ people: [person], nextPage: 1 })
    .mockResolvedValueOnce({
      people: [
        person,
        { ...person, person: { id: 'other', displayName: 'Other' } },
      ],
      nextPage: null,
    })
    .mockResolvedValue({ people: [], nextPage: null })
  mocks.write.mockResolvedValue({
    relationship: 'NONE',
    friendCount: 0,
    mutualFriendCount: 0,
  })
  render(
    <MemoryRouter>
      <FriendsPage />
    </MemoryRouter>,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Tải thêm' }))
  await screen.findByRole('link', { name: 'Other' })
  expect(screen.getAllByRole('link', { name: 'Minh Anh' })).toHaveLength(1)
  fireEvent.click(screen.getAllByRole('button', { name: 'Hủy kết bạn' })[0])
  expect(
    await screen.findByText('Chưa có kết nối trong mục này'),
  ).toBeInTheDocument()
})
it('shows a retry when the private list cannot be loaded', async () => {
  mocks.read
    .mockRejectedValueOnce(new Error('Không kết nối được.'))
    .mockResolvedValue({ people: [], nextPage: null })
  render(
    <MemoryRouter>
      <FriendsPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Không kết nối được.',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
  )
})
