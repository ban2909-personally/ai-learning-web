import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicProfilePage } from './PublicProfilePage'
import type { SocialProfile } from './types'

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  feed: vi.fn(),
  openChat: vi.fn(),
  user: null as null | { id: string },
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ read: mocks.read, write: mocks.write }),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock('../messaging/DirectChatContext', () => ({
  useDirectChatLauncher: () => ({ openChat: mocks.openChat }),
}))
vi.mock('./CommunityFeed', () => ({
  CommunityFeed: (props: unknown) => {
    mocks.feed(props)
    return <p>Public feed</p>
  },
}))
const profile: SocialProfile = {
  profile: {
    id: 'person',
    displayName: 'Hà Anh',
    bio: '<b>Hello</b>',
    location: 'Hà Nội',
    website: 'https://example.test',
    coverTheme: 'ocean',
  },
  friendship: { relationship: 'NONE', friendCount: 2, mutualFriendCount: 1 },
}
function show() {
  return render(
    <MemoryRouter initialEntries={['/community/people/person']}>
      <Routes>
        <Route path="/community/people/:id" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>,
  )
}
describe('PublicProfilePage', () => {
  beforeEach(() => {
    mocks.user = null
    mocks.read.mockReset().mockResolvedValue(profile)
    mocks.write.mockReset()
    mocks.feed.mockReset()
    mocks.openChat.mockReset()
  })
  it('loads public information and a read-only author feed, rendering user text literally', async () => {
    show()
    expect(
      await screen.findByRole('heading', { name: 'Hà Anh' }),
    ).toBeInTheDocument()
    expect(mocks.feed).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'person', canPost: false }),
    )
    expect(mocks.read).toHaveBeenCalledWith(
      '/community/people/person/profile',
      { signal: expect.any(AbortSignal) },
    )
    expect(
      screen.getByRole('link', { name: 'Đăng nhập để kết nối' }),
    ).toHaveAttribute('href', '/login')
    expect(screen.getAllByText('<b>Hello</b>').length).toBe(2)
    expect(
      screen.getByRole('link', { name: 'Website cá nhân ↗' }),
    ).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(screen.getByRole('button', { name: 'Giới thiệu' }))
    expect(screen.queryByText('Public feed')).not.toBeInTheDocument()
  })
  it('can request and cancel friendship, and open ID-based chat without disclosing email', async () => {
    mocks.user = { id: 'viewer' }
    mocks.write
      .mockResolvedValueOnce({
        ...profile.friendship,
        relationship: 'OUTGOING',
      })
      .mockResolvedValueOnce(profile.friendship)
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Thêm bạn bè' }))
    expect(
      await screen.findByRole('button', { name: 'Hủy lời mời' }),
    ).toBeInTheDocument()
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/people/person/friendship',
      'POST',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hủy lời mời' }))
    await screen.findByRole('button', { name: 'Thêm bạn bè' })
    fireEvent.click(screen.getByRole('button', { name: 'Nhắn tin' }))
    expect(mocks.openChat).toHaveBeenCalledWith(profile.profile)
    expect(screen.getByText('2 người bạn · 1 bạn chung')).toBeInTheDocument()
  })
  it('allows recipient acceptance and shows mutation failures without hiding actions', async () => {
    mocks.user = { id: 'viewer' }
    mocks.read.mockResolvedValue({
      ...profile,
      friendship: { ...profile.friendship, relationship: 'INCOMING' },
    })
    mocks.write
      .mockRejectedValueOnce(new Error('Hãy tải lại hồ sơ.'))
      .mockResolvedValueOnce({ ...profile.friendship, relationship: 'FRIENDS' })
    show()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chấp nhận kết bạn' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hãy tải lại hồ sơ.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chấp nhận kết bạn' }))
    expect(await screen.findByText('Bạn bè ✓')).toBeInTheDocument()
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/people/person/friendship/accept',
      'POST',
    )
  })
  it('updates only the current account through the own-profile endpoint', async () => {
    mocks.user = { id: 'person' }
    mocks.read.mockResolvedValue({
      ...profile,
      friendship: { ...profile.friendship, relationship: 'SELF' },
    })
    mocks.write.mockResolvedValue({
      ...profile,
      profile: { ...profile.profile, bio: 'Learning together' },
    })
    show()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' }),
    )
    expect(
      screen.queryByRole('button', { name: 'Thêm bạn bè' }),
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Giới thiệu'), {
      target: { value: 'Learning together' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(mocks.write).toHaveBeenCalledWith(
        '/community/profile',
        'PUT',
        expect.objectContaining({ bio: 'Learning together' }),
      ),
    )
    expect(await screen.findAllByText('Learning together')).toHaveLength(2)
  })
  it('does not load a feed when the profile is unavailable', async () => {
    mocks.read.mockRejectedValue(new Error('Không tìm thấy hồ sơ công khai.'))
    show()
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Không tìm thấy hồ sơ công khai.',
      ),
    )
    expect(mocks.feed).not.toHaveBeenCalled()
  })
})
