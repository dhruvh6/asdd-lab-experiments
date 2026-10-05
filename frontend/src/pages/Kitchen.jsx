import { useState } from 'react'
import { api } from '../api'
import { usePolling } from '../usePolling'
import { formatToken, timeAgo } from '../lib'

const COLUMNS = [
  { status: 'PLACED', title: 'New', action: 'PREPARING', actionLabel: 'Start preparing' },
  { status: 'PREPARING', title: 'Preparing', action: 'READY', actionLabel: 'Mark ready' },
  { status: 'READY', title: 'Ready for pickup', action: 'COLLECTED', actionLabel: 'Collected' },
]

// CE-4: the kitchen's live queue, refreshed every 3 seconds.
export default function Kitchen() {
  const { data: queue, error, refresh } = usePolling(() => api('/orders/queue'), 3000)
  const { data: menu, refresh: refreshMenu } = usePolling(() => api('/menu/all'), 15000)
  const [actionError, setActionError] = useState('')

  async function move(order, status) {
    setActionError('')
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', body: { status } })
      await refresh()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function toggleStock(item) {
    await api(`/menu/${item.id}/availability`, { method: 'PATCH', body: { isAvailable: !item.isAvailable } })
    await refreshMenu()
  }

  return (
    <div className="page wide">
      <div className="page-head">
        <h1>Kitchen queue</h1>
        <span className="muted">Updates every 3 seconds · {queue?.length ?? 0} active orders</span>
      </div>
      {(error || actionError) && <p className="error">{error?.message || actionError}</p>}

      <div className="board">
        {COLUMNS.map((col) => {
          const orders = (queue || []).filter((o) => o.status === col.status)
          return (
            <section key={col.status} className="column">
              <h2>
                {col.title} <span className="count">{orders.length}</span>
              </h2>
              {orders.map((o) => (
                <article key={o.id} className="card ticket">
                  <div className="ticket-head">
                    <span className="token small">{formatToken(o.token)}</span>
                    <span className="muted small">{timeAgo(o.createdAt)}</span>
                  </div>
                  <div className="muted small">{o.studentName}</div>
                  <ul>
                    {o.items.map((i) => (
                      <li key={i.name}>
                        <strong>{i.qty}×</strong> {i.name}
                      </li>
                    ))}
                  </ul>
                  <div className="ticket-actions">
                    <button className="primary small" onClick={() => move(o, col.action)}>
                      {col.actionLabel}
                    </button>
                    {col.status !== 'READY' && (
                      <button className="ghost small" onClick={() => move(o, 'CANCELLED')}>
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {orders.length === 0 && <p className="muted small">Nothing here.</p>}
            </section>
          )
        })}
      </div>

      <section className="card stock">
        <h2>Stock</h2>
        <p className="muted small">Mark a dish sold out and students stop seeing it immediately.</p>
        <div className="stock-grid">
          {menu?.map((item) => (
            <label key={item.id} className={`stock-item ${item.isAvailable ? '' : 'sold-out'}`}>
              <input type="checkbox" checked={item.isAvailable} onChange={() => toggleStock(item)} />
              {item.name}
              {!item.isAvailable && <small> · sold out</small>}
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
