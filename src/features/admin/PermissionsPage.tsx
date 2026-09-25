import { roleLabels } from '../auth/roles'
const rows = [
  ['Xem khóa học công khai', true, true, true, true, true],
  ['Ghi danh và học bài', false, true, true, true, true],
  ['Tạo và ôn tập flashcard cá nhân', false, true, true, true, true],
  ['Biên soạn khóa học của mình', false, false, true, false, true],
  ['Duyệt và xuất bản khóa học', false, false, false, true, true],
  ['Quản trị tài khoản và vai trò', false, false, false, false, true],
] as const
export function PermissionsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUẢN TRỊ · BẢO MẬT</p>
          <h1>Phân quyền</h1>
          <p>
            Ma trận quyền theo vai trò. Gán vai trò cho từng người tại trang Tài
            khoản.
          </p>
        </div>
      </div>
      <section className="workspace-panel">
        <div className="table-scroll">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Chức năng</th>
                {['GUEST', 'STUDENT', 'LECTURE', 'LEADER', 'ADMIN'].map(
                  (role) => (
                    <th key={role}>{roleLabels[role]}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, ...rights]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {rights.map((allowed, index) => (
                    <td key={index}>
                      <span
                        className={allowed ? 'permission-yes' : 'permission-no'}
                      >
                        {allowed ? 'Cho phép' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-5 text-sm text-slate-500">
        Giảng viên chỉ sửa nội dung do mình sở hữu. Bộ thẻ luôn thuộc tài khoản
        tạo bộ thẻ, kể cả đối với quản trị viên.
      </p>
    </>
  )
}
