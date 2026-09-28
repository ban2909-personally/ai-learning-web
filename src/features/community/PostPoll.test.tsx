import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { PostPoll } from './PostPoll'
import type { Post } from './types'
const mocks = vi.hoisted(() => ({
  user: { id: 'student' } as { id: string } | null,
  write: vi.fn(),
  read: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ write: mocks.write, read: mocks.read }),
}))
const post = {
  id: 'post',
  authorId: 'owner',
  poll: {
    kind: 'POLL',
    question: 'Skill?',
    options: [
      { id: 'reading', label: 'Reading', votes: 2 },
      { id: 'listening', label: 'Listening', votes: 1 },
    ],
    totalVotes: 3,
    myOptionId: 'reading',
    closesAt: null,
    closed: false,
  },
} as Post
beforeEach(() => {
  mocks.user = { id: 'student' }
  mocks.write.mockReset().mockResolvedValue(post)
  mocks.read.mockReset().mockResolvedValue(post)
})
it('shows persisted counts and allows changing or retracting one vote', async () => {
  const changed = vi.fn()
  render(
    <PostPoll post={post} canInteract canModerate={false} onChange={changed} />,
  )
  expect(screen.getByText('2 · 67%')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Listening/ }))
  await waitFor(() => expect(changed).toHaveBeenCalledWith(post))
  expect(mocks.write).toHaveBeenCalledWith(
    '/community/posts/post/poll/votes',
    'POST',
    { optionId: 'listening' },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Rút phiếu' }))
  await waitFor(() =>
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/posts/post/poll/votes',
      'DELETE',
      undefined,
    ),
  )
  expect(
    screen.queryByRole('button', { name: 'Đóng bình chọn' }),
  ).not.toBeInTheDocument()
})
it('disables anonymous or closed votes instead of inventing optimistic counts', () => {
  mocks.user = null
  render(
    <PostPoll
      post={{ ...post, poll: { ...post.poll!, closed: true } }}
      canInteract
      canModerate={false}
      onChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: /Reading/ })).toBeDisabled()
  expect(screen.getByText('Đăng nhập để bình chọn.')).toBeInTheDocument()
  expect(mocks.write).not.toHaveBeenCalled()
})
