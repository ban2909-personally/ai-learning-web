export type Space = {
  id: string
  name: string
  description: string
  kind: 'GROUP' | 'PAGE'
  visibility: 'PUBLIC' | 'PRIVATE'
  ownerId: string
  ownerName: string
  memberCount: number
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null
  myStatus: 'ACTIVE' | 'PENDING' | 'INVITED' | null
  createdAt: string
}

export type Post = {
  id: string
  authorId: string
  authorName: string
  spaceId: string | null
  spaceName: string | null
  body: string
  sharedPostId: string | null
  sharedBody: string | null
  sharedAuthorName: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  likedByViewer: boolean
  shareable: boolean
}

export type FeedPage = { posts: Post[]; nextCursor: string | null }

export type Comment = {
  id: string
  postId: string
  parentId: string | null
  authorId: string
  authorName: string
  body: string
  removed: boolean
  createdAt: string
}

export type Member = {
  userId: string
  displayName: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  status: 'ACTIVE' | 'PENDING' | 'INVITED'
  createdAt: string
}
