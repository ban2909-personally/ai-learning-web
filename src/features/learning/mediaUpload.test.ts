import { describe, expect, it } from 'vitest'
import { validateMediaFile } from './mediaUpload'

function file(size: number, type = 'video/webm') {
  return new File([new Uint8Array(size)], 'lesson.webm', { type })
}

describe('lesson media upload limits', () => {
  it('accepts files strictly below decimal 10 MB', () => {
    expect(validateMediaFile(file(9_999_999))).toBeNull()
  })
  it.each([10_000_000, 10_000_001])('rejects %i bytes', (size) => {
    expect(validateMediaFile(file(size))).toContain('nhỏ hơn 10 MB')
  })
  it('rejects empty files and unsupported formats', () => {
    expect(validateMediaFile(file(0))).not.toBeNull()
    expect(validateMediaFile(file(10, 'text/html'))).not.toBeNull()
  })
})
