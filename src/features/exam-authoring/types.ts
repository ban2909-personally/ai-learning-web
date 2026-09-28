import type { Question, Skill } from '../practice/types'

export type RevisionStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED'

export type DraftQuestion = Omit<Question, 'id'> & {
  correctAnswer: string | null
  explanation: string
}

export type DraftSection = {
  skill: Skill
  title: string
  passage: string | null
  audioText: string | null
  questions: DraftQuestion[]
}

export type DraftContent = {
  title: string
  description: string
  durationMinutes: number
  sections: DraftSection[]
}

export type ExamRevisionSummary = {
  id: string
  slug: string
  title: string
  durationMinutes: number
  revision: number
  status: RevisionStatus
  version: number
}

export type ExamRevision = Omit<
  ExamRevisionSummary,
  'slug' | 'title' | 'durationMinutes'
> & {
  seriesId: string
  authorId: string | null
  exam: DraftContent & { id: string; slug: string }
}

export const revisionLabels: Record<RevisionStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã phát hành',
  ARCHIVED: 'Phiên bản cũ',
}
