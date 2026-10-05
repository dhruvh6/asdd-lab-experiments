import { STATUS } from '../lib'

// Status always shows an icon and a label, never colour alone.
export default function StatusBadge({ status }) {
  const meta = STATUS[status] || { label: status, icon: '•', tone: 'muted' }
  return (
    <span className={`badge tone-${meta.tone}`}>
      <span aria-hidden="true">{meta.icon}</span> {meta.label}
    </span>
  )
}
