import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { roleLabels } from '../auth/roles'

type Account = {
  id: string
  email: string
  displayName: string
  status: string
  roles: string[]
  createdAt: string
}
type AccountPage = {
  items: Account[]
  totalElements: number
  page: number
  size: number
}
export function AccountsPage() {
  const { request } = useAuth()
  const [data, setData] = useState<AccountPage | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    setError('')
    try {
      setData(
        await request<AccountPage>(
          '/admin/accounts?' +
            new URLSearchParams({ search, role, page: String(page) }),
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể tải tài khoản.',
      )
    }
  }, [request, search, role, page])
  useEffect(() => {
    void load()
  }, [load])
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request('/admin/accounts', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(values)),
      })
      setCreating(false)
      setNotice('Đã tạo tài khoản.')
      await load()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể tạo tài khoản.',
      )
    } finally {
      setBusy(false)
    }
  }
  const update = async (account: Account, newRole: string, status: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request('/admin/accounts/' + account.id, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole, status }),
      })
      setNotice('Đã cập nhật quyền và trạng thái tài khoản.')
      await load()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể cập nhật tài khoản.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUẢN TRỊ · DANH TÍNH</p>
          <h1>Quản lý tài khoản</h1>
          <p>Phân vai trò, tạo tài khoản và kiểm soát quyền truy cập.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setCreating(!creating)}
        >
          {creating ? 'Đóng biểu mẫu' : '+ Tạo tài khoản'}
        </button>
      </div>
      {error && (
        <div role="alert" className="error-notice">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="success-notice">
          {notice}
        </div>
      )}
      {creating && (
        <form className="workspace-panel form-grid mb-6 p-6" onSubmit={create}>
          <label>
            Họ và tên
            <input
              className="field"
              name="displayName"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Email
            <input
              className="field"
              name="email"
              type="email"
              required
              maxLength={320}
            />
          </label>
          <label>
            Mật khẩu ban đầu
            <input
              className="field"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
            <small>Có chữ và số, ít nhất 8 ký tự.</small>
          </label>
          <label>
            Vai trò
            <select className="field" name="role" defaultValue="STUDENT">
              {Object.entries(roleLabels)
                .filter(([key]) => key !== 'INSTRUCTOR')
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <button className="primary-button" disabled={busy}>
            Tạo tài khoản
          </button>
        </form>
      )}
      <div className="filter-bar">
        <input
          aria-label="Tìm tài khoản"
          className="field"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
        />
        <select
          aria-label="Lọc vai trò"
          className="field"
          value={role}
          onChange={(event) => {
            setRole(event.target.value)
            setPage(0)
          }}
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <section className="workspace-panel">
        <div className="table-scroll">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Họ tên / Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((account) => (
                <AccountRow
                  key={account.id + account.roles.join() + account.status}
                  account={account}
                  busy={busy}
                  update={update}
                />
              ))}
            </tbody>
          </table>
        </div>
        {data?.items.length === 0 && (
          <div className="empty-state">Không có tài khoản phù hợp.</div>
        )}
      </section>
      <div className="pagination">
        <span>
          {data?.totalElements ?? 0} tài khoản · Trang {page + 1}
        </span>
        <button
          className="secondary-button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Trước
        </button>
        <button
          className="secondary-button"
          disabled={!data || (page + 1) * data.size >= data.totalElements}
          onClick={() => setPage(page + 1)}
        >
          Sau
        </button>
      </div>
    </>
  )
}
function AccountRow({
  account,
  busy,
  update,
}: {
  account: Account
  busy: boolean
  update: (account: Account, role: string, status: string) => Promise<void>
}) {
  const [role, setRole] = useState(account.roles[0] ?? 'GUEST')
  const [status, setStatus] = useState(account.status)
  return (
    <tr>
      <td>
        <strong>{account.displayName}</strong>
        <small>{account.email}</small>
      </td>
      <td>
        <select
          aria-label={'Vai trò của ' + account.email}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          aria-label={'Trạng thái của ' + account.email}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ACTIVE">Hoạt động</option>
          <option value="DISABLED">Vô hiệu hóa</option>
        </select>
      </td>
      <td>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</td>
      <td>
        <button
          className="text-button"
          disabled={
            busy || (role === account.roles[0] && status === account.status)
          }
          onClick={() => void update(account, role, status)}
        >
          Lưu
        </button>
      </td>
    </tr>
  )
}
