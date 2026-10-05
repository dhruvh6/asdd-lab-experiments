import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  addToCart,
  removeFromCart,
  cartLines,
  cartCount,
  cartTotal,
  toOrderPayload,
  rupees,
  MAX_QTY,
} from '../lib'

// CE-2 browse the menu, CE-3 build a cart and place the order.
export default function Menu() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    api('/menu').then(setMenu).catch((err) => setError(err.message))
  }, [])

  const categories = useMemo(() => ['All', ...new Set(menu.map((i) => i.category))], [menu])
  const visible = menu.filter(
    (i) =>
      (category === 'All' || i.category === category) &&
      i.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  async function placeOrder() {
    setPlacing(true)
    setError('')
    try {
      const order = await api('/orders', { method: 'POST', body: toOrderPayload(cart) })
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err.message)
      setPlacing(false)
    }
  }

  return (
    <div className="page menu-layout">
      <section>
        <div className="page-head">
          <h1>Today's menu</h1>
          <input
            className="search"
            placeholder="Search dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chips">
          {categories.map((c) => (
            <button key={c} className={`chip ${c === category ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {visible.map((item) => {
            const qty = cart[item.id]?.qty || 0
            return (
              <article key={item.id} className="card dish">
                <div className="dish-top">
                  <span className={`veg ${item.isVeg ? 'is-veg' : 'non-veg'}`} title={item.isVeg ? 'Veg' : 'Non-veg'} />
                  <span className="muted small">{item.category}</span>
                </div>
                <h3>{item.name}</h3>
                <div className="dish-bottom">
                  <strong>{rupees(item.price)}</strong>
                  {qty === 0 ? (
                    <button className="primary small" onClick={() => setCart(addToCart(cart, item))}>
                      Add
                    </button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => setCart(removeFromCart(cart, item.id))} aria-label="Remove one">
                        −
                      </button>
                      <span>{qty}</span>
                      <button
                        onClick={() => setCart(addToCart(cart, item))}
                        disabled={qty >= MAX_QTY}
                        aria-label="Add one"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
          {menu.length > 0 && visible.length === 0 && <p className="muted">No dishes match your search.</p>}
        </div>
      </section>

      <aside className="card cart">
        <h2>Your order</h2>
        {cartCount(cart) === 0 ? (
          <p className="muted">Add something tasty to get started.</p>
        ) : (
          <>
            <ul className="cart-lines">
              {cartLines(cart).map(({ item, qty }) => (
                <li key={item.id}>
                  <span>
                    {qty} × {item.name}
                  </span>
                  <span>{rupees(item.price * qty)}</span>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Total</span>
              <strong>{rupees(cartTotal(cart))}</strong>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="primary block" disabled={cartCount(cart) === 0 || placing} onClick={placeOrder}>
          {placing ? 'Placing order…' : 'Place order & get token'}
        </button>
      </aside>
    </div>
  )
}
