import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { DirectChatProvider, useDirectChatLauncher } from './DirectChatContext'
import { DirectChatMenu } from './DirectChatMenu'
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer' } }),
}))
vi.mock('../community/useCommunityApi', () => ({
  useCommunityApi: () => ({ read: mocks.read, write: mocks.write }),
}))
vi.mock('./DirectThread', () => ({
  DirectThread: () => <p>Existing direct thread</p>,
}))
function Entry() {
  const { openChat } = useDirectChatLauncher()
  return (
    <button onClick={() => openChat({ id: 'peer-id', displayName: 'Hà Anh' })}>
      Nhắn tin trên hồ sơ
    </button>
  )
}
function show() {
  render(
    <DirectChatProvider>
      <Entry />
      <DirectChatMenu />
    </DirectChatProvider>,
  )
}
const conversation = {
  id: 'existing',
  peerId: 'peer-id',
  peerName: 'Hà Anh',
  status: 'REQUEST',
  initiatorId: 'viewer',
  unreadCount: 0,
  readSequence: 0,
  updatedAt: '2026-09-29T00:00:00Z',
}
beforeEach(() => {
  mocks.read
    .mockReset()
    .mockImplementation((path: string) =>
      Promise.resolve(
        path.includes('/peers/')
          ? null
          : {
              conversations: [],
              totalUnread: 0,
              requestCount: 0,
              nextPage: null,
            },
      ),
    )
  mocks.write.mockReset()
})
it('opens an ID recipient composer without email disclosure or automatic writes', async () => {
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Nhắn tin trên hồ sơ' }))
  expect(await screen.findByText('Hà Anh')).toBeInTheDocument()
  expect(screen.queryByLabelText('Email người nhận')).not.toBeInTheDocument()
  expect(mocks.write).not.toHaveBeenCalled()
  expect(mocks.read).toHaveBeenCalledWith(
    '/community/direct/peers/peer-id',
    expect.any(Object),
  )
})
it('sends an ID-based first message and keeps the same retry client ID after uncertainty', async () => {
  mocks.write
    .mockRejectedValueOnce(new Error('Mạng gián đoạn.'))
    .mockResolvedValueOnce(conversation)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Nhắn tin trên hồ sơ' }))
  fireEvent.change(await screen.findByLabelText('Tin nhắn mở đầu'), {
    target: { value: 'Hello' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lời mời chat' }))
  await screen.findByText('Mạng gián đoạn.')
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lời mời chat' }))
  expect(await screen.findByText('Existing direct thread')).toBeInTheDocument()
  const first = mocks.write.mock.calls[0],
    second = mocks.write.mock.calls[1]
  expect(first[0]).toBe('/community/direct/peers/peer-id')
  expect(first[2]).toEqual({ clientId: expect.any(String), body: 'Hello' })
  expect(second[2]).toEqual(first[2])
})
it('reopens the existing conversation instead of creating another request', async () => {
  mocks.read.mockImplementation((path: string) =>
    Promise.resolve(
      path.includes('/peers/')
        ? conversation
        : {
            conversations: [],
            totalUnread: 0,
            requestCount: 0,
            nextPage: null,
          },
    ),
  )
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Nhắn tin trên hồ sơ' }))
  await waitFor(() =>
    expect(screen.getByText('Existing direct thread')).toBeInTheDocument(),
  )
  expect(screen.queryByLabelText('Tin nhắn mở đầu')).not.toBeInTheDocument()
  expect(mocks.write).not.toHaveBeenCalled()
})
