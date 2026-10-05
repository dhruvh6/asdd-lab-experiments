import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { usePolling } from '../usePolling'
import StatusBadge from '../components/StatusBadge'
import { STATUS, TRACK_STEPS, formatToken, rupees } from '../lib'

const MESSAGE = {
  PLACED: 'The kitchen has your order. You can cancel until they start cooking.',
  PREPARING: 'Your food is being prepared. Stay in class for now.',
  READY: 'Your food is ready! Show this token at the counter.',
  COLLECTED: 'Enjoy your meal!',
  CANCELLED: 'This order was cancelled.',
}

// CE-8: live tracking. The page polls the API every 3 seconds.
export default function TrackOrder() {
  const { id } = useParams()
  const { data: order, error, refresh } = usePolling(() => api(`/orders/${id}`), 3000)
  const [cancelError, setCancelError] = useState('')

  if (error && !order) return <p className="page error">{error.message}</p>
  if (!order) return <p className="page muted">Loading order…</p>

  const stepIndex = TRACK_STEPS.indexOf(order.status)

  async function cancel() {
    try {
      await api(`/orders/${order.id}/cancel`, { method: 'PATCH' })
      await refresh()
    } catch (err) {
      setCancelError(err.message)
    }
  }

  return (
    <div className="page narrow">
      <Link to="/" className="muted">
        ← Back to menu
      </Link>
      <div className={`card token-card ${order.status === 'READY' ? 'is-ready' : ''}`}>
        <span className="muted">Your token</span>
        <div className="token">{formatToken(order.token)}</div>
        <StatusBadge status={order.status} />
        <p>{MESSAGE[order.status]}</p>
      </div>

      {order.status !== 'CANCELLED' && (
        <ol className="tracker">
          {TRACK_STEPS.map((step, i) => (
            <li key={step} className={i < stepIndex ? 'done' : i === stepIndex ? 'current' : ''}>
              <span className="dot" aria-hidden="true">
                {i < stepIndex ? '✓' : i + 1}
              </span>
              {STATUS[step].label}
            </li>
          ))}
        </ol>
      )}

      <div className="card">
        <h3>Order details</h3>
        <ul className="cart-lines">
          {order.items.map((line) => (
            <li key={line.name}>
              <span>
                {line.qty} × {line.name}
              </span>
              <span>{rupees(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="cart-total">
          <span>Total</span>
          <strong>{rupees(order.total)}</strong>
        </div>
        {order.status === 'PLACED' && (
          <button className="danger-outline" onClick={cancel}>
            Cancel order
          </button>
        )}
        {cancelError && <p className="error">{cancelError}</p>}
      </div>
    </div>
  )
}
