#!/usr/bin/env node
// Simulates a canteen lunch rush against a running CampusEats stack so the
// Grafana dashboard and Nagios have real traffic to show.
//
//   node scripts/lunch-rush.mjs                    3 minutes, 12 students
//   node scripts/lunch-rush.mjs --minutes 5 --students 25
//   node scripts/lunch-rush.mjs --base http://localhost:3000
//
// Students place random orders; a simulated kitchen moves each order through
// PREPARING -> READY -> COLLECTED with realistic delays.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]])
    return pairs
  }, []),
)
const BASE = (args.base || 'http://localhost:4000').replace(/\/$/, '')
const MINUTES = Number(args.minutes || 3)
const STUDENTS = Number(args.students || 12)
const END = Date.now() + MINUTES * 60_000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const rand = (min, max) => min + Math.random() * (max - min)
const pick = (list) => list[Math.floor(Math.random() * list.length)]

async function call(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  return { status: res.status, data }
}

async function loginOrRegister(name, email, password) {
  let res = await call('/auth/login', { method: 'POST', body: { email, password } })
  if (res.status !== 200) res = await call('/auth/register', { method: 'POST', body: { name, email, password } })
  if (!res.data?.token) throw new Error(`Could not sign in ${email}: ${res.status}`)
  return res.data.token
}

const FIRST = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Isha', 'Arjun', 'Meera', 'Rohan', 'Sara', 'Neel', 'Tara']
const stats = { placed: 0, rejected: 0, prepared: 0, ready: 0, collected: 0 }

async function student(i, menu) {
  const name = `${FIRST[i % FIRST.length]} ${Math.floor(i / FIRST.length) + 1}`
  const token = await loginOrRegister(name, `rush.student${i}@campuseats.local`, 'rush1234')
  await sleep(rand(0, 8000))
  while (Date.now() < END) {
    const lines = Array.from({ length: Math.ceil(rand(0, 3)) }, () => ({ menuItemId: pick(menu).id, qty: Math.ceil(rand(0, 2)) }))
    // Roughly one request in twelve is deliberately bad, so 4xx shows on the dashboard.
    if (Math.random() < 0.08) lines.push({ menuItemId: 99999, qty: 1 })
    const res = await call('/orders', { token, method: 'POST', body: { items: lines } })
    if (res.status === 201) stats.placed++
    else stats.rejected++
    await call('/menu')
    await sleep(rand(8000, 25000))
  }
}

async function kitchen() {
  const token = await loginOrRegister('Kitchen Staff', 'staff@campuseats.local', 'staff123')
  const due = new Map() // orderId -> time the next step may happen
  while (Date.now() < END + 60_000) {
    const { data: queue } = await call('/orders/queue', { token })
    for (const order of queue || []) {
      const at = due.get(order.id)
      if (at === undefined) {
        due.set(order.id, Date.now() + rand(3000, 12000))
        continue
      }
      if (Date.now() < at) continue
      const next = { PLACED: 'PREPARING', PREPARING: 'READY', READY: 'COLLECTED' }[order.status]
      const res = await call(`/orders/${order.id}/status`, { token, method: 'PATCH', body: { status: next } })
      if (res.status === 200) {
        stats[{ PREPARING: 'prepared', READY: 'ready', COLLECTED: 'collected' }[next]]++
        due.set(order.id, Date.now() + (next === 'READY' ? rand(5000, 15000) : rand(15000, 45000)))
      }
    }
    if (Date.now() > END && (queue || []).length === 0) break
    await sleep(2000)
  }
}

async function main() {
  const { data: menu, status } = await call('/menu')
  if (status !== 200) throw new Error(`API not reachable at ${BASE}`)
  console.log(`Lunch rush: ${STUDENTS} students for ${MINUTES} min against ${BASE}`)
  const progress = setInterval(() => console.log(new Date().toLocaleTimeString(), JSON.stringify(stats)), 10_000)
  await Promise.all([kitchen(), ...Array.from({ length: STUDENTS }, (_, i) => student(i, menu))])
  clearInterval(progress)
  console.log('Done.', JSON.stringify(stats))
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
