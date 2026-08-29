# Phase 3 — Learning Experience (progress)

## Trạng thái

Vertical slice 1 `Enrollment -> My Learning` đã hoàn tất và sẵn sàng tích hợp từ branch
`feature/learning-experience`.

## Phạm vi đã triển khai

- CTA chi tiết khóa học gọi API ghi danh hoặc chuyển guest về đăng nhập.
- CTA phân biệt khóa miễn phí và khóa trả phí; lỗi `payment_required` có thông báo rõ.
- Route protected `/my-learning` tải enrollment của học viên hiện tại.
- Màn hình có loading, error, empty và enrolled-list states.
- Header dẫn học viên tới `/my-learning`.

## Kiểm thử

- `EnrollmentButton.test.tsx`: gọi API và điều hướng sau ghi danh.
- `MyLearningPage.test.tsx`: tải và render enrollment hiện tại.
- Full frontend regression: 5 test files, 6 tests PASS.
- TypeScript + Vite production build: PASS.

## File chính

- `src/features/learning/EnrollmentButton.tsx`
- `src/features/learning/MyLearningPage.tsx`
- `src/types/learning.ts`
- `src/app/App.tsx`
- `src/components/AppHeader.tsx`
- `src/features/catalog/CourseDetailPage.tsx`

## Việc còn lại của Phase 3

- Curriculum/lesson player và progress UI.
- Component tests cho player/progress.
- Selenium smoke sau khi vertical flow ổn định.
