import { describe, expect, test } from 'vitest'
import {
  addToCart,
  removeFromCart,
  cartCount,
  cartTotal,
  toOrderPayload,
  rupees,
  formatToken,
  timeAgo,
  niceTicks,
  MAX_QTY,
} from './lib'

const dosa = { id: 1, name: 'Masala Dosa', price: 60 }
const chai = { id: 12, name: 'Cutting Chai', price: 12 }

describe('cart', () => {
  test('adding items builds quantities and totals', () => {
    let cart = {}
    cart = addToCart(cart, dosa)
    cart = addToCart(cart, dosa)
    cart = addToCart(cart, chai)
    expect(cartCount(cart)).toBe(3)
    expect(cartTotal(cart)).toBe(132)
    expect(toOrderPayload(cart)).toEqual({
      items: [
        { menuItemId: 1, qty: 2 },
        { menuItemId: 12, qty: 1 },
      ],
    })
  })

  test('quantity is capped at the server limit', () => {
    let cart = {}
    for (let i = 0; i < MAX_QTY + 3; i++) cart = addToCart(cart, chai)
    expect(cartCount(cart)).toBe(MAX_QTY)
  })

  test('removing the last unit drops the line', () => {
    let cart = addToCart({}, dosa)
    cart = removeFromCart(cart, dosa.id)
    expect(cart).toEqual({})
  })

  test('cart updates never mutate the previous cart', () => {
    const before = addToCart({}, dosa)
    const after = addToCart(before, dosa)
    expect(before[1].qty).toBe(1)
    expect(after[1].qty).toBe(2)
  })
})

describe('formatting', () => {
  test('rupees use Indian digit grouping', () => {
    expect(rupees(125000)).toBe('₹1,25,000')
  })

  test('tokens are zero padded', () => {
    expect(formatToken(7)).toBe('#007')
  })

  test('timeAgo', () => {
    const now = new Date('2026-10-06T12:00:00Z').getTime()
    expect(timeAgo('2026-10-06T11:59:30Z', now)).toBe('just now')
    expect(timeAgo('2026-10-06T11:45:00Z', now)).toBe('15 min ago')
  })
})

describe('niceTicks', () => {
  test('covers the maximum with round steps', () => {
    expect(niceTicks(930)).toEqual([0, 250, 500, 750, 1000])
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
  })
})
