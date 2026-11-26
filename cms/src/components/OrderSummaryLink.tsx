'use client'
import React from 'react'
import { usePathname } from 'next/navigation'

/** The link to "Zbroj narudžbi" in the admin menu, under the collections. */
export default function OrderSummaryLink() {
  const active = usePathname()?.endsWith('/zbroj-narudzbi')
  return (
    <a href="/admin/zbroj-narudzbi" className="nav__link" aria-current={active ? 'page' : undefined} style={{ fontWeight: active ? 600 : undefined }}>
      <span className="nav__link-label">Zbroj narudžbi</span>
    </a>
  )
}
