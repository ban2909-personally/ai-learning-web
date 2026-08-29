# Phase 3 — Learning Experience (completed)

## Trạng thái

Phase 3 đã hoàn tất và được tích hợp vào `main` với CI xanh.

## Phạm vi đã triển khai

- CTA chi tiết khóa học gọi API ghi danh hoặc chuyển guest về đăng nhập.
- CTA phân biệt khóa miễn phí và khóa trả phí; lỗi `payment_required` có thông báo rõ.
- Route protected `/my-learning` tải enrollment của học viên hiện tại.
- Màn hình có loading, error, empty và enrolled-list states.
- Header dẫn học viên tới `/my-learning`.
- Course detail hiển thị curriculum và trạng thái preview.
- Lesson player protected hỗ trợ điều hướng bài học, resume, lưu tiến độ và hoàn thành.
- Layout mobile-first đã xác minh ở 320px, 768px và 1440px.

## Kiểm thử

- `EnrollmentButton.test.tsx`: gọi API và điều hướng sau ghi danh.
- `MyLearningPage.test.tsx`: tải và render enrollment hiện tại.
- Full frontend regression: 7 test files, 8 tests PASS.
- TypeScript lint và Vite production build: PASS.
- Selenium responsive smoke và GitHub Actions: PASS.

## File chính

- `src/features/learning/EnrollmentButton.tsx`
- `src/features/learning/MyLearningPage.tsx`
- `src/features/learning/CourseCurriculum.tsx`
- `src/features/learning/LessonPlayerPage.tsx`
- `scripts/selenium-smoke.mjs`
- `src/types/learning.ts`
- `src/app/App.tsx`
- `src/components/AppHeader.tsx`
- `src/features/catalog/CourseDetailPage.tsx`

## Definition of done

- [x] Enrollment và My Learning.
- [x] Curriculum, lesson player và progress/resume UI.
- [x] Component tests cho player/progress.
- [x] Responsive mobile/tablet/desktop không overflow ngang.
- [x] Selenium smoke là bước bắt buộc trong CI.
