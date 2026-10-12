import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

const DEMO = [
  ['Student', 'student@campuseats.local', 'student123'],
  ['Kitchen staff', 'staff@campuseats.local', 'staff123'],
  ['Admin', 'admin@campuseats.local', 'admin123'],
]

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>Skip the canteen queue.</h1>
        <p>Order from class, get a token, and walk in only when your food is ready.</p>
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <h2>Log in</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted">
          New here? <Link to="/register">Create a student account</Link>
        </p>
        <div className="demo-logins">
          <span className="muted">Demo accounts</span>
          {DEMO.map(([label, demoEmail, demoPassword]) => (
            <button
              type="button"
              key={label}
              className="chip"
              onClick={() => {
                setEmail(demoEmail)
                setPassword(demoPassword)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
