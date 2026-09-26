import type { ReactNode } from 'react'

type IconName = 'feed' | 'spaces' | 'courses' | 'cards' | 'classes' | 'page'

export function CommunityIcon({ name }: { name: IconName }) {
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
  }

  return (
    <svg
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
