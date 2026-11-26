import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { orderSummary } from '../collections/Orders'

// Admin page "Zbroj narudžbi": how many pieces of each product and size the team ordered, over all orders
// that are not cancelled. This is the list for ordering the merch from the supplier.

const eur = (n: number) => new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(n)
const cell: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid var(--theme-elevation-150)', textAlign: 'left' }
const num: React.CSSProperties = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

export default async function OrderSummary({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login')
  const { orders, rows } = await orderSummary(req)
  const pieces = rows.reduce((s, r) => s + r.qty, 0)
  const total = rows.reduce((s, r) => s + r.total, 0)
  // One block per product, so the sizes of a product stay together.
  const byProduct = new Map<string, typeof rows>()
  for (const r of rows) byProduct.set(r.product, [...(byProduct.get(r.product) ?? []), r])

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <h1 style={{ margin: '32px 0 8px' }}>Zbroj narudžbi</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--theme-elevation-600)' }}>
          Koliko komada čega i koje veličine treba naručiti. Broje se sve narudžbe osim otkazanih: {orders} narudžbi, {pieces} komada, ukupno {eur(total)}.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <a className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} href="/api/orders/export" download>
            Preuzmi CSV: sve narudžbe
          </a>
          <a className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }} href="/api/orders/export?type=summary" download>
            Preuzmi CSV: zbroj
          </a>
        </div>
        {rows.length === 0 ? (
          <p>Još nema narudžbi.</p>
        ) : (
          <table style={{ width: '100%', maxWidth: 820, borderCollapse: 'collapse', marginBottom: 48 }}>
            <thead>
              <tr>
                <th style={cell}>Proizvod</th>
                <th style={cell}>Veličina</th>
                <th style={num}>Komada</th>
                <th style={num}>Narudžbi</th>
                <th style={num}>Iznos</th>
              </tr>
            </thead>
            <tbody>
              {[...byProduct.entries()].map(([product, list]) => (
                <React.Fragment key={product}>
                  {list.map((r, i) => (
                    <tr key={`${product}|${r.size}`}>
                      <td style={{ ...cell, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? undefined : 'transparent' }}>{product}</td>
                      <td style={cell}>{r.size || '—'}</td>
                      <td style={{ ...num, fontWeight: 600 }}>{r.qty}</td>
                      <td style={num}>{r.orders}</td>
                      <td style={num}>{eur(r.total)}</td>
                    </tr>
                  ))}
                  {list.length > 1 && (
                    <tr>
                      <td style={cell} />
                      <td style={{ ...cell, color: 'var(--theme-elevation-600)' }}>ukupno</td>
                      <td style={{ ...num, fontWeight: 600 }}>{list.reduce((s, r) => s + r.qty, 0)}</td>
                      <td style={num} />
                      <td style={num}>{eur(list.reduce((s, r) => s + r.total, 0))}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
