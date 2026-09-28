import type { ReactNode } from 'react'

type IconName =
  | 'feed'
  | 'spaces'
  | 'courses'
  | 'cards'
  | 'classes'
  | 'page'
  | 'like'
  | 'comment'
  | 'share'
  | 'photo'
  | 'video'
  | 'poll'
  | 'chat'
  | 'link'
  | 'palette'
  | 'search'
  | 'close'
  | 'compose'
  | 'back'
  | 'send'
const paths: Record<IconName, ReactNode> = {
  feed: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5M10 20v-6h4v6" />
    </>
  ),
  spaces: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3.5 19v-1.5a4.5 4.5 0 0 1 9 0V19h-9ZM14 15a3.5 3.5 0 0 1 6.5 1.8V19H15" />
    </>
  ),
  courses: (
    <>
      <path d="m12 5-9 4 9 4 9-4-9-4Z" />
      <path d="M5 11v5c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5v-5M21 9v7" />
    </>
  ),
  cards: (
    <>
      <rect x="4" y="6" width="14" height="14" rx="2" />
      <path d="M8 3h10a2 2 0 0 1 2 2v11M8 11h6M8 15h4" />
    </>
  ),
  classes: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 10h18M8 5V3M16 5V3M7 15h4" />
    </>
  ),
  page: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  like: (
    <>
      <path d="M8 10 12 3c2 0 3 1 2.5 3L14 9h5a2 2 0 0 1 2 2l-1.5 8a2 2 0 0 1-2 2H8Z" />
      <path d="M3 10h5v11H3z" />
    </>
  ),
  comment: <path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1.5-6A8 8 0 1 1 21 11Z" />,
  share: <path d="m13 4 8 7-8 7v-5c-6 0-8 3-10 7 0-8 3-12 10-12Z" />,
  photo: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m3 17 5-5 4 4 4-6 5 7" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="3" />
      <path d="m15 10 6-4v12l-6-4Z" />
    </>
  ),
  poll: (
    <>
      <path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12a7 7 0 0 1-7 7H8l-5 3 1-7a7 7 0 1 1 16-3Z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  link: (
    <>
      <path d="m10 7 2-2a5 5 0 0 1 7 7l-3 3M14 17l-2 2a5 5 0 0 1-7-7l3-3M8 16l8-8" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c2 0 2-2 1-3s0-3 2-3h3c4 0 3-12-6-12Z" />
      <circle cx="7" cy="10" r="1" />
      <circle cx="10" cy="6" r="1" />
      <circle cx="15" cy="7" r="1" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  compose: (
    <>
      <path d="M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7M16 3l5 5-9 9-5 1 1-5Z" />
    </>
  ),
  back: <path d="m14 5-7 7 7 7M7 12h14" />,
  send: <path d="m3 3 19 9-19 9 3-9-3-9ZM6 12h16" />,
}
export function CommunityIcon({ name }: { name: IconName }) {
  return (
    <svg
      className="community-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
