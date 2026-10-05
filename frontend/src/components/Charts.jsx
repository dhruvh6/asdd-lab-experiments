import { useState } from 'react'
import { niceTicks } from '../lib'

// Single-series charts for the admin dashboard. The title names the series,
// so there is no legend box. Every chart has a hover tooltip and a table view.

function ChartFrame({ title, subtitle, table, children }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="card viz">
      <header className="viz-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="muted small">{subtitle}</p>}
        </div>
        <button className="ghost small" onClick={() => setShowTable(!showTable)} aria-pressed={showTable}>
          {showTable ? 'Chart' : 'Table'}
        </button>
      </header>
      {showTable ? table : children}
    </section>
  )
}

function DataTable({ columns, rows }) {
  return (
    <table className="viz-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ColumnChart({ title, subtitle, data, format = String, valueName, labelEvery = 1 }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(0, ...data.map((d) => d.value))
  const ticks = niceTicks(max)
  const top = ticks.at(-1)
  const peak = data.findIndex((d) => d.value === max && max > 0)

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      table={<DataTable columns={['', valueName]} rows={data.map((d) => [d.tooltipLabel || d.label, format(d.value)])} />}
    >
      <div className="col-chart">
        <div className="y-axis">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{format(t)}</span>
          ))}
        </div>
        <div className="plot">
          {ticks.map((t) => (
            <div key={t} className="gridline" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="columns">
            {data.map((d, i) => (
              <div
                key={d.label}
                className={`slot ${hover === i ? 'hover' : ''}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="column-bar" style={{ height: `${(d.value / top) * 100}%` }}>
                  {i === peak && hover === null && <span className="peak-label">{format(d.value)}</span>}
                </div>
                {hover === i && (
                  <div className="tooltip" role="status">
                    <span className="muted">{d.tooltipLabel || d.label}</span>
                    <strong>{format(d.value)}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div />
        <div className="x-axis">
          {data.map((d, i) => (
            <span key={d.label}>{i % labelEvery === 0 ? d.label : ''}</span>
          ))}
        </div>
      </div>
    </ChartFrame>
  )
}

export function BarList({ title, subtitle, data, format = String, valueName }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      table={<DataTable columns={['Item', valueName, 'Revenue']} rows={data.map((d) => [d.label, format(d.value), d.detail])} />}
    >
      {data.length === 0 ? (
        <p className="muted small">No sales yet.</p>
      ) : (
        <ul className="bar-list">
          {data.map((d, i) => (
            <li
              key={d.label}
              className={hover === i ? 'hover' : ''}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="bar-label">{d.label}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
                <span className="bar-value">{format(d.value)}</span>
              </span>
              {hover === i && d.detail && (
                <span className="tooltip inline" role="status">
                  <strong>{d.detail}</strong> revenue
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ChartFrame>
  )
}

export function StatTile({ label, value, note }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="muted small">{note}</span>}
    </div>
  )
}
