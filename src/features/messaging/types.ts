export type DirectConversation = {
  id: string
  peerId: string
  peerName: string
  initiatorId: string
  status: 'REQUEST' | 'ACTIVE' | 'DECLINED'
  lastMessage: string | null
  updatedAt: string
  unreadCount: number
  readSequence: number
}
export type DirectInbox = {
  conversations: DirectConversation[]
  totalUnread: number
  requestCount: number
  nextPage: number | null
}
export type DirectMessage = {
  id: string
  sequence: number
  authorId: string
  body: string
  createdAt: string
}
export type DirectMessages = {
  messages: DirectMessage[]
  oldestSequence: number
  newestSequence: number
  hasMore: boolean
}
