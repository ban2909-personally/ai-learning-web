import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from './NotificationContext'
import { NotificationMenu } from './NotificationMenu'

vi.mock('./NotificationContext', () => ({ useNotifications: vi.fn() }))

describe('NotificationMenu', () => {
  const markRead = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [{
        id: 'notification-1',
        type: 'LESSON_COMPLETED',
        title: 'Hoàn thành bài học',
        body: 'Bạn đã hoàn thành một bài học.',
        targetPath: '/my-learning',
        createdAt: '2026-09-04T10:00:00Z',
        readAt: null,
      }],
      unreadCount: 1,
      isLoading: false,
      isConnected: true,
      error: null,
      hasMore: false,
      refresh: vi.fn(),
      loadMore: vi.fn(),
      markRead,
    })
  })

  it('announces unread count and opens an accessible dialog', () => {
    render(<MemoryRouter><NotificationMenu /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Thông báo, 1 chưa đọc' }))

    expect(screen.getByRole('dialog', { name: 'Danh sách thông báo' })).toBeInTheDocument()
    expect(screen.getByText('Đang cập nhật trực tiếp')).toBeInTheDocument()
  })

  it('marks an unread item and follows its safe application path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<NotificationMenu />} />
          <Route path="/my-learning" element={<h1>Không gian học</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo, 1 chưa đọc' }))
    fireEvent.click(screen.getByRole('button', { name: /Hoàn thành bài học/ }))

    expect(markRead).toHaveBeenCalledWith('notification-1')
    expect(screen.getByRole('heading', { name: 'Không gian học' })).toBeInTheDocument()
  })
})
