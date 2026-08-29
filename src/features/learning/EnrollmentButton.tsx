import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import type { Enrollment } from '../../types/learning'
import { useAuth } from '../auth/AuthContext'

type EnrollmentButtonProps = { courseSlug: string; price: number }

export function EnrollmentButton({ courseSlug, price }: EnrollmentButtonProps) {
  const { user, request } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSubmitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const enroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await request<Enrollment>(`/courses/${encodeURIComponent(courseSlug)}/enrollments`, { method: 'POST' })
      navigate('/my-learning')
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'payment_required') {
        setMessage('Khóa học này sẽ mở thanh toán ở Phase Commerce.')
      } else {
        setMessage(caught instanceof ApiError ? caught.message : 'Không thể ghi danh lúc này.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={enroll} disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? 'Đang xử lý...' : price > 0 ? 'Tiếp tục để mua khóa học' : 'Ghi danh miễn phí'}
      </button>
      {message && <p role="alert" className="mt-4 text-center text-sm text-amber-700">{message}</p>}
    </div>
  )
}
