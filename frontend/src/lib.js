// Small pure helpers shared by the pages. Covered by src/lib.test.js.

export const STATUS = {
  PLACED: { label: 'Order placed', icon: '🧾', tone: 'info' },
  PREPARING: { label: 'Preparing', icon: '🍳', tone: 'warning' },
  READY: { label: 'Ready to collect', icon: '✅', tone: 'good' },
  COLLECTED: { label: 'Collected', icon: '🎉', tone: 'muted' },
  CANCELLED: { label: 'Cancelled', icon: '✖', tone: 'critical' },
}

export const TRACK_STEPS = ['PLACED', 'PREPARING', 'READY', 'COLLECTED']

export function rupees(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function formatToken(token) {
  return '#' + String(token).padStart(3, '0')
}

export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ---- cart -------------------------------------------------------------
// The cart is a plain object { [menuItemId]: { item, qty } } kept in state.

export const MAX_QTY = 10

export function addToCart(cart, item) {
  const current = cart[item.id]?.qty || 0
  if (current >= MAX_QTY) return cart
  return { ...cart, [item.id]: { item, qty: current + 1 } }
}

export function removeFromCart(cart, itemId) {
  const current = cart[itemId]?.qty || 0
  if (current <= 1) {
    const next = { ...cart }
    delete next[itemId]
    return next
  }
  return { ...cart, [itemId]: { ...cart[itemId], qty: current - 1 } }
}

export function cartLines(cart) {
  return Object.values(cart)
}

export function cartCount(cart) {
  return cartLines(cart).reduce((n, line) => n + line.qty, 0)
}

export function cartTotal(cart) {
  return cartLines(cart).reduce((sum, line) => sum + line.item.price * line.qty, 0)
}

export function toOrderPayload(cart) {
  return { items: cartLines(cart).map((line) => ({ menuItemId: line.item.id, qty: line.qty })) }
}

// ---- charts -----------------------------------------------------------

// Rounded axis ticks (0, 50, 100 ...) that cover the largest value.
export function niceTicks(max, count = 4) {
  if (!max || max <= 0) return [0, 1]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)
  const ticks = []
  for (let v = 0; v < max + step; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}
