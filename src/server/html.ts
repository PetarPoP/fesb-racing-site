import sanitizeHtml from 'sanitize-html'

/** Dopušta samo ono što editor proizvodi; sve ostalo (skripte, stilovi, on* atributi) se uklanja. */
export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'img', 'hr', 'code', 'pre'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
    // Editor ostavlja prazan <p> na kraju; prazni odlomci samo dodaju razmak.
    exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
  }).trim()
}

export const cleanText = (s: unknown, max = 500) => String(s ?? '').trim().slice(0, max)

const DIACRITICS: Record<string, string> = { č: 'c', ć: 'c', đ: 'd', š: 's', ž: 'z' }

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[čćđšž]/g, (c) => DIACRITICS[c])
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'stavka'
  )
}
