export type NotificationType = 'LESSON_COMPLETED'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  targetPath: string
  createdAt: string
  readAt: string | null
}

export type NotificationPage = {
  content: NotificationItem[]
  nextCursor: string | null
  unreadCount: number
}
