import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NotificationItem } from '../../types/notification'
import { useNotifications } from './NotificationContext'

export function NotificationMenu() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,
    hasMore,
    refresh,
    loadMore,
    markRead,
  } = useNotifications()
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const openNotification = (notification: NotificationItem) => {
    if (notification.readAt === null) void markRead(notification.id).catch(() => undefined)
    setOpen(false)
    navigate(notification.targetPath)
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-ink"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-label="Danh sách thông báo"
          className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-semibold text-ink">Thông báo</h2>
              <p className="text-xs text-slate-500">
                {isConnected ? 'Đang cập nhật trực tiếp' : 'Sẽ tự kết nối lại'}
              </p>
            </div>
            <span className={`size-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
          </div>

          {error && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()} className="font-semibold underline">Thử lại</button>
            </div>
          )}

          <div className="max-h-[min(65vh,32rem)] overflow-y-auto overscroll-contain">
            {notifications.length === 0 && !isLoading ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <BellIcon />
                </div>
                <p className="font-medium text-slate-700">Chưa có thông báo mới</p>
                <p className="mt-1 text-sm text-slate-500">Tiến độ học tập sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        notification.readAt === null ? 'bg-brand-50/60' : 'bg-white'
                      }`}
                    >
                      <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                        <CheckIcon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="flex-1 text-sm font-semibold text-ink">{notification.title}</span>
                          {notification.readAt === null && <span className="mt-1.5 size-2 rounded-full bg-brand-600" aria-label="Chưa đọc" />}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.body}</span>
                        <time className="mt-2 block text-xs text-slate-400" dateTime={notification.createdAt}>
                          {formatDate(notification.createdAt)}
                        </time>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {isLoading && <p className="px-4 py-4 text-center text-sm text-slate-500">Đang đồng bộ…</p>}
          </div>

          {hasMore && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void loadMore()}
              className="w-full border-t border-slate-100 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Xem thêm
            </button>
          )}
        </section>
      )}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.9 18a3 3 0 0 1-5.8 0m9.4-2H5.5c1.3-1.4 2-3.2 2-5.1V9a4.5 4.5 0 0 1 9 0v1.9c0 1.9.7 3.7 2 5.1Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.5 12.5 3.2 3.2 7.8-8" />
    </svg>
  )
}
