import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { homeFor, useAuth } from './auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import MyOrders from './pages/MyOrders'
import TrackOrder from './pages/TrackOrder'
import Kitchen from './pages/Kitchen'
import AdminMenu from './pages/AdminMenu'

const NAV = {
  student: [
    ['/', 'Menu'],
    ['/orders', 'My orders'],
  ],
  staff: [['/kitchen', 'Kitchen queue']],
  admin: [
    ['/admin/menu', 'Menu'],
    ['/kitchen', 'Kitchen queue'],
  ],
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="page muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}

export default function App() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="topbar">
        <NavLink to={homeFor(user)} className="brand">
          <span className="brand-mark">CE</span> CampusEats
        </NavLink>
        {user && (
          <nav>
            {NAV[user.role].map(([to, label]) => (
              <NavLink key={to} to={to} end>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {user && (
          <div className="whoami">
            <span>
              {user.name} <small className="role">{user.role}</small>
            </span>
            <button className="ghost" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={homeFor(user)} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to={homeFor(user)} /> : <Register />} />
          <Route path="/" element={<RequireRole roles={['student']}><Menu /></RequireRole>} />
          <Route path="/orders" element={<RequireRole roles={['student']}><MyOrders /></RequireRole>} />
          <Route path="/orders/:id" element={<RequireRole roles={['student']}><TrackOrder /></RequireRole>} />
          <Route path="/kitchen" element={<RequireRole roles={['staff', 'admin']}><Kitchen /></RequireRole>} />
          <Route path="/admin/menu" element={<RequireRole roles={['admin']}><AdminMenu /></RequireRole>} />
          <Route path="*" element={<Navigate to={homeFor(user)} replace />} />
        </Routes>
      </main>
    </>
  )
}
