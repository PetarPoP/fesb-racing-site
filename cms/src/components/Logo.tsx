import React from 'react'

/** Wordmark for the login page. Same as the site header: FESB/R with an accent slash. */
export default function Logo() {
  return (
    <div className="fesb-logo" aria-label="FESB Racing CMS">
      <span className="fesb-logo__mark">
        FESB<span className="fesb-logo__slash">/</span>R
      </span>
      <span className="fesb-logo__sub">Racing CMS</span>
    </div>
  )
}
