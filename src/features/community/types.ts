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

export type FriendshipRelationship =
  | 'SELF'
  | 'NONE'
  | 'OUTGOING'
  | 'INCOMING'
  | 'FRIENDS'
export type FriendshipSummary = {
  relationship: FriendshipRelationship
  friendCount: number
  mutualFriendCount: number
}
export type SocialProfile = {
  profile: PublicProfile & {
    bio: string
    location: string
    website: string
    coverTheme: 'aurora' | 'ocean' | 'sunset' | 'forest'
  }
  friendship: FriendshipSummary
}
export type FriendPage = {
  people: {
    person: PublicProfile
    relationship: FriendshipRelationship
    updatedAt: string
  }[]
  nextPage: number | null
}

export type Post = {
  viewerReaction?: ReactionKind | null
  reactionCounts?: Partial<Record<ReactionKind, number>>
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
  status?: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'REMOVED'
  commentPreview?: Comment[]
  media?: CommunityMedia | null
  sharedMedia?: CommunityMedia | null
  appearance?: {
    attachmentUrl: string | null
    backgroundColor: string | null
    fontColor: string | null
  } | null
  poll?: {
    kind: 'POLL' | 'ELECTION'
    question: string
    options: { id: string; label: string; votes: number }[]
    totalVotes: number
    myOptionId: string | null
    closesAt: string | null
    closed: boolean
  } | null
  mediaExpiresAt?: string | null
}

export type CommunityMedia = {
  id: string
  contentType: string
  sizeBytes: number
}

export type ReactionKind =
  | 'LIKE'
  | 'LOVE'
  | 'CARE'
  | 'HAHA'
  | 'WOW'
  | 'SAD'
  | 'ANGRY'

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

export type PublicProfile = { id: string; displayName: string }

export type DiscoveryPage = {
  spaces: Space[]
  people: PublicProfile[]
  spacesHasMore: boolean
  peopleHasMore: boolean
  page: number
}

export type Member = {
  userId: string
  displayName: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  status: 'ACTIVE' | 'PENDING' | 'INVITED'
  createdAt: string
}
