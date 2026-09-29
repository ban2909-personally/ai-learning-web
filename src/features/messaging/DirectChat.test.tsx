import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { DirectChatMenu } from './DirectChatMenu'
import { DirectThread } from './DirectThread'
import type { DirectConversation } from './types'
const mocks = vi.hoisted(() => ({
  user: { id: 'sender' },
  read: vi.fn(),
  write: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock('../community/useCommunityApi', () => ({
  useCommunityApi: () => ({ read: mocks.read, write: mocks.write }),
}))
vi.mock('./DirectChatContext', () => ({
  useDirectChatLauncher: () => ({ launch: null, clearLaunch: vi.fn() }),
}))
const conversation: DirectConversation = {
  id: 'chat',
  peerId: 'recipient',
  peerName: 'Student',
  initiatorId: 'sender',
  status: 'REQUEST',
  lastMessage: 'Hello',
  updatedAt: '2026-09-28T00:00:00Z',
  unreadCount: 1,
  readSequence: 0,
}
beforeEach(() => {
  mocks.user = { id: 'sender' }
  mocks.read.mockReset()
  mocks.write.mockReset().mockResolvedValue(undefined)
})
it('does not fetch closed inbox and shows requests only when opened', async () => {
  mocks.read.mockResolvedValue({
    conversations: [conversation],
    totalUnread: 1,
    requestCount: 1,
    nextPage: null,
  })
  render(<DirectChatMenu />)
  expect(mocks.read).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Mở đoạn chat' }))
  expect(await screen.findByText('Student')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Lời mời 1' }))
  await waitFor(() =>
    expect(mocks.read).toHaveBeenCalledWith(
      '/community/direct/conversations?filter=requests',
      expect.any(Object),
    ),
  )
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(
    screen.queryByRole('dialog', { name: 'Đoạn chat' }),
  ).not.toBeInTheDocument()
})
it('recipient can accept but initiator cannot send a second request', async () => {
  mocks.read.mockResolvedValue({
    messages: [],
    oldestSequence: 0,
    newestSequence: 0,
    hasMore: false,
  })
  const view = render(
    <DirectThread
      conversation={conversation}
      inboxOpen
      onClose={vi.fn()}
      onChange={vi.fn()}
    />,
  )
  expect(
    screen.queryByRole('button', { name: 'Chấp nhận' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Tin nhắn riêng mới')).not.toBeInTheDocument()
  view.unmount()
  mocks.user = { id: 'recipient' }
  const changed = vi.fn()
  mocks.write.mockResolvedValue({ ...conversation, status: 'ACTIVE' })
  render(
    <DirectThread
      conversation={conversation}
      inboxOpen
      onClose={vi.fn()}
      onChange={changed}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chấp nhận' }))
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith({ ...conversation, status: 'ACTIVE' }),
  )
  expect(mocks.write).toHaveBeenCalledWith(
    '/community/direct/conversations/chat/decision',
    'POST',
    { accept: true },
  )
})
it('keeps the client id after uncertain send failure and marks only fetched messages read', async () => {
  const incoming = {
    id: 'incoming',
    sequence: 4,
    authorId: 'recipient',
    body: 'Hi',
    createdAt: '2026-09-28T00:00:00Z',
  }
  mocks.read.mockResolvedValue({
    messages: [incoming],
    oldestSequence: 4,
    newestSequence: 4,
    hasMore: false,
  })
  mocks.write.mockImplementation((path: string) =>
    path.endsWith('/read')
      ? Promise.resolve()
      : Promise.reject(new Error('Connection failed')),
  )
  render(
    <DirectThread
      conversation={{ ...conversation, status: 'ACTIVE' }}
      inboxOpen={false}
      onClose={vi.fn()}
      onChange={vi.fn()}
    />,
  )
  expect(await screen.findByText('Hi')).toBeInTheDocument()
  await waitFor(() =>
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/direct/conversations/chat/read',
      'POST',
      { sequence: 4 },
    ),
  )
  fireEvent.change(screen.getByLabelText('Tin nhắn riêng mới'), {
    target: { value: 'Hello again' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn riêng' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Connection failed',
  )
  const first = mocks.write.mock.calls.find((call) =>
    call[0].endsWith('/messages'),
  )![2]
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn riêng' })),
  )
  const sends = mocks.write.mock.calls.filter((call) =>
    call[0].endsWith('/messages'),
  )
  expect(sends[1][2]).toEqual(first)
  expect(screen.getByLabelText('Tin nhắn riêng mới')).toHaveValue('Hello again')
})
