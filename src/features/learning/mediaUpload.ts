export const MAX_MEDIA_BYTES = 10_000_000
export function validateMediaFile(file: File): string | null {
  if (file.size === 0) return 'Tệp video không được để trống.'
  if (file.size >= MAX_MEDIA_BYTES) return 'Tệp video phải nhỏ hơn 10 MB.'
  if (!['video/mp4', 'video/webm'].includes(file.type))
    return 'Chỉ hỗ trợ video MP4 hoặc WebM.'
  return null
}
