import { Link } from 'react-router-dom'
import { api } from '../api'
import { usePolling } from '../usePolling'
import StatusBadge from '../components/StatusBadge'
import { formatToken, rupees, timeAgo } from '../lib'

// CE-9: order history, refreshed every few seconds so status stays current.
export default function MyOrders() {
  const { data: orders, error } = usePolling(() => api('/orders/mine'), 5000)

  return (
    <div className="page narrow">
      <h1>My orders</h1>
      {error && <p className="error">{error.message}</p>}
      {orders && orders.length === 0 && (
        <div className="card empty">
          <p>No orders yet.</p>
          <Link to="/" className="button primary">
            Browse the menu
          </Link>
        </div>
      )}
      <ul className="order-list">
        {orders?.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="card order-row">
              <span className="token small">{formatToken(o.token)}</span>
              <span className="order-summary">
                {o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}
                <small className="muted">{timeAgo(o.createdAt)}</small>
              </span>
              <span className="order-meta">
                <StatusBadge status={o.status} />
                <strong>{rupees(o.total)}</strong>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
