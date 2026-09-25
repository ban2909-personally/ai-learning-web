export function statusLabel(status: string) {
  return (
    (
      {
        DRAFT: 'Bản nháp',
        PENDING_REVIEW: 'Chờ duyệt',
        PUBLISHED: 'Đã xuất bản',
        ARCHIVED: 'Đã lưu trữ',
      } as Record<string, string>
    )[status] ?? status
  )
}
