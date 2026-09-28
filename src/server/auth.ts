import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

const COOKIE = 'fesb_admin'
const MAX_AGE = 60 * 60 * 24 * 7

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url')
const sha = (v: string) => createHash('sha256').update(v).digest()

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD nije postavljen na serveru.')
  return timingSafeEqual(sha(input), sha(expected))
}

export function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000)
  setCookie(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function endSession() {
  deleteCookie(COOKIE, { path: '/' })
}

export function isAdmin() {
  if (!secret()) return false
  const [exp, mac] = (getCookie(COOKIE) ?? '').split('.')
  if (!exp || !mac || Number(exp) < Date.now()) return false
  const a = Buffer.from(mac)
  const b = Buffer.from(sign(exp))
  return a.length === b.length && timingSafeEqual(a, b)
}

export function requireAdmin() {
  if (!isAdmin()) throw new Error('Niste prijavljeni.')
}
