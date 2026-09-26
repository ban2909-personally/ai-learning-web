import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityHomePage } from './CommunityHomePage'

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; displayName: string; roles: string[] },
  read: vi.fn(),
  write: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ read: mocks.read, write: mocks.write }),
}))

describe('CommunityHomePage', () => {
  beforeEach(() => {
    mocks.user = null
    mocks.write.mockReset()
    mocks.read
      .mockReset()
      .mockImplementation((path: string) =>
        Promise.resolve(
          path === '/community/spaces' ? [] : { posts: [], nextCursor: null },
        ),
      )
  })

  it('lets anonymous visitors read the feed and invites them to sign in before posting', async () => {
    render(
      <MemoryRouter>
        <CommunityHomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Học cùng nhau',
    )
    expect(
      screen.getByText(
        'Đăng nhập để đăng bài, bình luận và tham gia cộng đồng.',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByText('Chưa có bài viết nào.')).toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledWith(
      expect.stringContaining('/community/feed?'),
    )
  })

  it('shows a post composer to an authenticated guest account', async () => {
    mocks.user = {
      id: 'guest-id',
      displayName: 'Khách học tập',
      roles: ['GUEST'],
    }
    render(
      <MemoryRouter>
        <CommunityHomePage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('textbox', { name: 'Nội dung bài viết' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Chưa có bài viết nào.')).toBeInTheDocument()
  })

  it('offers a retry when the feed cannot be loaded', async () => {
    let feedAttempts = 0
    mocks.read.mockImplementation((path: string) => {
      if (path === '/community/spaces') return Promise.resolve([])
      feedAttempts += 1
      return feedAttempts === 1
        ? Promise.reject(new Error('Không thể kết nối đến máy chủ.'))
        : Promise.resolve({ posts: [], nextCursor: null })
    })
    render(
      <MemoryRouter>
        <CommunityHomePage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText('Chưa tải được bảng tin'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chưa có bài viết nào.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Chưa có bài viết nào.')).toBeInTheDocument()
  })

  it('lets an authenticated guest publish to the public feed', async () => {
    mocks.user = {
      id: 'guest-id',
      displayName: 'Khách học tập',
      roles: ['GUEST'],
    }
    mocks.write.mockResolvedValue({
      id: 'post-id',
      authorId: 'guest-id',
      authorName: 'Khách học tập',
      spaceId: null,
      spaceName: null,
      body: 'Mình vừa học về React',
      sharedPostId: null,
      sharedBody: null,
      sharedAuthorName: null,
      createdAt: '2026-09-26T00:00:00Z',
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      likedByViewer: false,
      shareable: true,
    })
    render(
      <MemoryRouter>
        <CommunityHomePage />
      </MemoryRouter>,
    )
    await screen.findByText('Chưa có bài viết nào.')
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Nội dung bài viết' }),
      {
        target: { value: 'Mình vừa học về React' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))
    expect(await screen.findByText('Mình vừa học về React')).toBeInTheDocument()
    expect(mocks.write).toHaveBeenCalledWith('/community/posts', 'POST', {
      body: 'Mình vừa học về React',
      spaceId: null,
      sharedPostId: null,
    })
  })

  it('lets an authenticated guest like and comment on a public post', async () => {
    mocks.user = {
      id: 'guest-id',
      displayName: 'Khách học tập',
      roles: ['GUEST'],
    }
    const post = {
      id: 'post-id',
      authorId: 'student-id',
      authorName: 'Học viên',
      spaceId: null,
      spaceName: null,
      body: 'Một mẹo học React',
      sharedPostId: null,
      sharedBody: null,
      sharedAuthorName: null,
      createdAt: '2026-09-26T00:00:00Z',
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      likedByViewer: false,
      shareable: true,
    }
    mocks.read.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/community/spaces'
          ? []
          : path.endsWith('/comments')
            ? []
            : { posts: [post], nextCursor: null },
      ),
    )
    mocks.write.mockImplementation((path: string) =>
      Promise.resolve(
        path.endsWith('/likes')
          ? { ...post, likeCount: 1, likedByViewer: true }
          : {
              id: 'comment-id',
              postId: post.id,
              parentId: null,
              authorId: 'guest-id',
              authorName: 'Khách học tập',
              body: 'Cảm ơn bạn đã chia sẻ',
              removed: false,
              createdAt: '2026-09-26T00:00:00Z',
            },
      ),
    )
    render(
      <MemoryRouter>
        <CommunityHomePage />
      </MemoryRouter>,
    )
    await screen.findByText('Một mẹo học React')
    fireEvent.click(screen.getByRole('button', { name: /Thích/ }))
    expect(
      await screen.findByRole('button', { name: /Đã thích/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Bình luận/ }))
    await screen.findByText('Chưa có bình luận.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Viết bình luận' }), {
      target: { value: 'Cảm ơn bạn đã chia sẻ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    expect(await screen.findByText('Cảm ơn bạn đã chia sẻ')).toBeInTheDocument()
    expect(mocks.write).toHaveBeenCalledWith(
      '/community/posts/post-id/comments',
      'POST',
      {
        body: 'Cảm ơn bạn đã chia sẻ',
        parentId: null,
      },
    )
  })
})
