export type Skill = 'LISTENING' | 'READING' | 'WRITING'

export type ExamSummary = {
  slug: string
  title: string
  description: string
  durationMinutes: number
  skills: Skill[]
}

export type Question = {
  id: string
  kind: 'CHOICE' | 'TEXT' | 'WRITING'
  prompt: string
  options: string[]
}

export type Section = {
  id: string
  skill: Skill
  title: string
  passage: string | null
  audioText: string | null
  questions: Question[]
}

export type Exam = Omit<ExamSummary, 'skills'> & { sections: Section[] }

export type Attempt = {
  id: string
  status: 'IN_PROGRESS' | 'SUBMITTED'
  answers: Record<string, string>
  exam: Exam
}

export type Result = {
  attemptId: string
  examTitle: string
  correct: number
  total: number
  sections: {
    skill: Skill
    title: string
    correct: number
    total: number
    questions: {
      questionId: string
      answer: string
      correct: boolean | null
      correctAnswer: string | null
      explanation: string | null
      status: 'GRADED' | 'PENDING_REVIEW' | 'UNANSWERED'
    }[]
  }[]
}

export const skillLabels: Record<Skill, string> = {
  LISTENING: 'Nghe',
  READING: 'Đọc',
  WRITING: 'Viết',
}
