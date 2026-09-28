import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { PostReactions, ReactionSummary } from './PostReactions'
import type { Post } from './types'
const mocks = vi.hoisted(() => ({
  user: { id: 'student' } as { id: string } | null,
  write: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ write: mocks.write }),
}))
const post = {
  id: 'post',
  likeCount: 3,
  likedByViewer: false,
  reactionCounts: { LOVE: 2, LIKE: 1 },
} as Post
beforeEach(() => {
  mocks.user = { id: 'student' }
  mocks.write
    .mockReset()
    .mockResolvedValue({ ...post, viewerReaction: 'LOVE', likedByViewer: true })
})
it('offers seven accessible choices and persists selected emotion', async () => {
  const changed = vi.fn()
  render(<PostReactions post={post} canInteract onChange={changed} />)
  fireEvent.click(screen.getByRole('button', { name: 'Chọn cảm xúc' }))
  expect(
    screen
      .getByRole('group', { name: 'Cảm xúc bài viết' })
      .querySelectorAll('button[title]'),
  ).toHaveLength(7)
  fireEvent.click(screen.getByRole('button', { name: 'Yêu thích' }))
  await waitFor(() => expect(changed).toHaveBeenCalled())
  expect(mocks.write).toHaveBeenCalledWith(
    '/community/posts/post/reactions',
    'POST',
    { kind: 'LOVE' },
  )
  expect(
    screen.queryByRole('group', { name: 'Cảm xúc bài viết' }),
  ).not.toBeInTheDocument()
})
it('keeps quick-like compatibility and renders real aggregate counts', async () => {
  render(
    <>
      <PostReactions post={post} canInteract onChange={vi.fn()} />
      <ReactionSummary post={post} />
    </>,
  )
  expect(screen.getByText('3 lượt thích')).toBeInTheDocument()
  expect(screen.getByTitle('Yêu thích: 2')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Thích' }))
  await waitFor(() =>
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/posts/post/likes',
      'POST',
    ),
  )
})
it('prevents anonymous mutation', () => {
  mocks.user = null
  render(<PostReactions post={post} canInteract onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Thích' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Chọn cảm xúc' })).toBeDisabled()
})
