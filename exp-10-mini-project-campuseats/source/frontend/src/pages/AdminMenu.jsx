import { useEffect, useState } from 'react'
import { api } from '../api'
import { rupees } from '../lib'

const EMPTY = { name: '', category: '', price: '', isVeg: true }

// CE-10: admin menu management.
export default function AdminMenu() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const load = () => api('/menu/all').then(setItems)
  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  const categories = [...new Set(items.map((i) => i.category))]

  async function save(e) {
    e.preventDefault()
    setError('')
    try {
      const body = { ...form, price: Number(form.price) }
      if (editingId) await api(`/menu/${editingId}`, { method: 'PUT', body })
      else await api('/menu', { method: 'POST', body })
      setForm(EMPTY)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function run(action) {
    setError('')
    try {
      await action()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  function edit(item) {
    setEditingId(item.id)
    setForm({ name: item.name, category: item.category, price: item.price, isVeg: item.isVeg })
  }

  return (
    <div className="page wide admin-menu">
      <h1>Menu management</h1>

      <form className="card menu-form" onSubmit={save}>
        <h2>{editingId ? 'Edit item' : 'Add a new item'}</h2>
        <div className="form-row">
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Category
            <input
              list="categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Price (₹)
            <input
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
            Veg
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button className="primary">{editingId ? 'Save changes' : 'Add item'}</button>
          {editingId && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY)
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <table className="card data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th className="num">Price</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.isAvailable ? '' : 'sold-out'}>
              <td>
                <span className={`veg ${item.isVeg ? 'is-veg' : 'non-veg'}`} /> {item.name}
              </td>
              <td>{item.category}</td>
              <td className="num">{rupees(item.price)}</td>
              <td>{item.isAvailable ? 'Available' : 'Sold out'}</td>
              <td className="row-actions">
                <button className="ghost small" onClick={() => edit(item)}>
                  Edit
                </button>
                <button
                  className="ghost small"
                  onClick={() =>
                    run(() =>
                      api(`/menu/${item.id}/availability`, { method: 'PATCH', body: { isAvailable: !item.isAvailable } }),
                    )
                  }
                >
                  {item.isAvailable ? 'Mark sold out' : 'Back in stock'}
                </button>
                <button
                  className="ghost small danger"
                  onClick={() =>
                    window.confirm(`Delete ${item.name}?`) && run(() => api(`/menu/${item.id}`, { method: 'DELETE' }))
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
