import { useEffect, useRef, useState } from 'react'
import { resolveApiUrl } from '../../lib/api'
import type { LessonPlayer } from '../../types/learning'

type LessonContentPlayerProps = {
  lesson: LessonPlayer
  resumeAt: number
  onPositionChange: (seconds: number) => void
}

export function LessonContentPlayer({ lesson, resumeAt, onPositionChange }: LessonContentPlayerProps) {
  const video = useRef<HTMLVideoElement>(null)
  const [playbackError, setPlaybackError] = useState(false)
  const [playbackReady, setPlaybackReady] = useState(false)
  const managedMedia = lesson.contentUrl.startsWith('/api/v1/media/')

  useEffect(() => {
    setPlaybackError(false)
    setPlaybackReady(false)
  }, [lesson.contentUrl])

  if (!managedMedia) {
    return (
      <iframe
        src={lesson.contentUrl}
        title={lesson.title}
        className="h-full w-full"
        allowFullScreen
      />
    )
  }

  if (playbackError) {
    return (
      <div role="alert" className="grid h-full place-items-center px-6 text-center text-slate-200">
        Không thể phát video. Hãy kiểm tra kết nối rồi tải lại bài học.
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black">
      {!playbackReady && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300" aria-live="polite">
          Đang tải video...
        </div>
      )}
      <video
        ref={video}
        src={resolveApiUrl(lesson.contentUrl)}
        title={lesson.title}
        className="relative h-full w-full bg-black object-contain"
        controls
        controlsList="nodownload"
        crossOrigin="use-credentials"
        playsInline
        preload="metadata"
        onCanPlay={() => setPlaybackReady(true)}
        onLoadedMetadata={() => {
          if (video.current && resumeAt > 0) {
            video.current.currentTime = Math.min(resumeAt, video.current.duration || resumeAt)
          }
        }}
        onTimeUpdate={(event) => onPositionChange(Math.floor(event.currentTarget.currentTime))}
        onError={() => setPlaybackError(true)}
      >
        Trình duyệt của bạn không hỗ trợ phát video HTML5.
      </video>
    </div>
  )
}
