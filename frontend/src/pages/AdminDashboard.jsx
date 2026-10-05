import { api } from '../api'
import { usePolling } from '../usePolling'
import { BarList, ColumnChart, StatTile } from '../components/Charts'
import { rupees } from '../lib'

const shortDay = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })

const formatMinutes = (minutes) => {
  if (minutes == null) return '—'
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`
  return `${Math.round(minutes * 10) / 10} min`
}

const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`

// CE-11: sales dashboard for the canteen admin. Refreshes every 10 seconds.
export default function AdminDashboard() {
  const { data: stats, error } = usePolling(() => api('/admin/stats'), 10000)

  if (error && !stats) return <p className="page error">{error.message}</p>
  if (!stats) return <p className="page muted">Loading sales…</p>

  // Show service hours (7am-9pm), widened to include any hour that had orders.
  const busy = stats.ordersByHour.filter((h) => h.orders > 0).map((h) => h.hour)
  const firstHour = Math.min(7, ...busy)
  const lastHour = Math.max(21, ...busy)
  const hours = stats.ordersByHour.filter((h) => h.hour >= firstHour && h.hour <= lastHour)

  return (
    <div className="page wide">
      <div className="page-head">
        <h1>Sales</h1>
        <span className="muted">Today · refreshes every 10 seconds</span>
      </div>

      <div className="hero card">
        <span className="stat-label">Revenue today</span>
        <span className="hero-value">{rupees(stats.today.revenue)}</span>
      </div>

      <div className="stats-row">
        <StatTile label="Orders today" value={stats.today.orders} />
        <StatTile label="In the kitchen now" value={stats.today.active} />
        <StatTile
          label="Average prep time"
          value={formatMinutes(stats.today.avgPrepMinutes)}
          note="Placed to ready"
        />
      </div>

      <div className="viz-grid">
        <ColumnChart
          title="Revenue, last 7 days"
          subtitle="Cancelled orders excluded"
          valueName="Revenue"
          format={rupees}
          data={stats.revenueByDay.map((d) => ({ label: shortDay(d.date), tooltipLabel: d.date, value: d.revenue }))}
        />
        <ColumnChart
          title="Orders by hour, today"
          subtitle="Shows when the lunch rush hits"
          valueName="Orders"
          labelEvery={hours.length > 16 ? 3 : 2}
          data={hours.map((h) => ({ label: hourLabel(h.hour), tooltipLabel: `${h.hour}:00–${h.hour}:59`, value: h.orders }))}
        />
        <BarList
          title="Top items, last 7 days"
          subtitle="By quantity sold"
          valueName="Quantity"
          data={stats.topItems.map((i) => ({ label: i.name, value: i.qty, detail: rupees(i.revenue) }))}
        />
      </div>
    </div>
  )
}
