import type { Field, GlobalConfig } from 'payload'
import { anyone, isLoggedIn } from '../access'

const access = { read: anyone, update: isLoggedIn }

/** A localized text field with a Croatian label. */
const text = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'text',
  localized: true,
  admin: description ? { description } : undefined,
})
const area = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'textarea',
  localized: true,
  admin: description ? { description } : undefined,
})

/** Assemblies of the 3D car (keys of the CAD model, see src/lib/carGroups.ts of the site). */
const CAR_PARTS = [
  { label: 'Šasija', value: 'frame' },
  { label: 'Karoserija', value: 'body' },
  { label: 'Prednje krilo', value: 'aero_front' },
  { label: 'Stražnje krilo', value: 'aero_rear' },
  { label: 'Podnica i difuzor', value: 'aero_under' },
  { label: 'Akumulator i VN sustav', value: 'accu' },
  { label: 'Niskonaponski sustav', value: 'lv' },
  { label: 'Pogonski sklop', value: 'drive' },
  { label: 'Upravljanje', value: 'steer' },
  { label: 'Kokpit i sjedalo', value: 'cockpit' },
  { label: 'Ovjes', value: 'susp' },
  { label: 'Kočioni sustav', value: 'brakes' },
  { label: 'Kotači i gume', value: 'wheels' },
]

/** Titles and texts of the home page sections, in the order they appear on the page. Empty fields keep the built-in text. */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Tekstovi početne stranice',
  admin: {
    group: 'Početna stranica',
    description: 'Naslovi i tekstovi sekcija početne stranice, redom kojim se pojavljuju. Prazno polje zadržava ugrađeni tekst.',
  },
  access,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Naslovni dio',
          fields: [
            text('heroA', 'Naslov, prvi red'),
            text('heroB', 'Naslov, drugi red'),
            area('heroSub', 'Podnaslov'),
            text('heroCta2', 'Gumb za partnere', 'Vodi na obrazac i prebacuje ga na sponzorski.'),
          ],
        },
        { label: 'Novosti', fields: [text('newsTitle', 'Naslov sekcije')] },
        {
          label: 'Timovi',
          description: 'Kartice timova uređuju se u „Timovi → Podtimovi“.',
          fields: [text('teamsTitle', 'Naslov sekcije'), area('teamsCardsText', 'Tekst uz naslov')],
        },
        {
          label: '3D bolid',
          description: 'Tekst kartice tima u 3D prikazu je „Kratki opis“ tog tima u „Timovi → Podtimovi“.',
          fields: [
            text('carTitle', 'Naslov sekcije'),
            area('carIntro', 'Tekst uz naslov'),
            {
              name: 'carParts',
              label: 'Nazivi sklopova',
              type: 'array',
              labels: { singular: 'Sklop', plural: 'Sklopovi' },
              admin: { description: 'Natpisi dijelova na 3D modelu. Sklop koji nije na popisu zadržava ugrađeni naziv.' },
              fields: [
                { type: 'row', fields: [
                  { name: 'part', label: 'Sklop', type: 'select', required: true, options: CAR_PARTS, admin: { width: '50%' } },
                  { name: 'name', label: 'Natpis', type: 'text', localized: true, required: true, admin: { width: '50%' } },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Projekti',
          description: 'Tekst i logotipi projekata uređuju se u „Projekti i vozila → Projekti“.',
          fields: [text('vehTitle', 'Naslov sekcije')],
        },
        { label: 'Natjecanja', fields: [text('compTitle', 'Naslov sekcije')] },
        {
          label: 'Partneri',
          fields: [text('sponTitle', 'Naslov sekcije'), area('sponText', 'Tekst uz naslov'), text('sponCta', 'Gumb')],
        },
        { label: 'Blog', fields: [text('blogTitle', 'Naslov sekcije')] },
        { label: 'Kontakt', fields: [text('contactTitle', 'Naslov u podnožju')] },
      ],
    },
  ],
}

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Kontakt, mreže i shop',
  admin: { group: 'Postavke' },
  access,
  fields: [
    { name: 'name', label: 'Naziv kluba', type: 'text', required: true, defaultValue: 'FESB Racing' },
    {
      name: 'contact',
      label: 'Kontakt',
      type: 'group',
      fields: [
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'phone', label: 'Telefon', type: 'text' },
        { name: 'address', label: 'Adresa', type: 'text', localized: true },
      ],
    },
    {
      name: 'social',
      label: 'Društvene mreže',
      type: 'array',
      labels: { singular: 'Mreža', plural: 'Mreže' },
      fields: [
        {
          name: 'platform',
          label: 'Mreža',
          type: 'select',
          required: true,
          options: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'x'],
        },
        { name: 'url', label: 'Poveznica', type: 'text', required: true },
      ],
    },
    {
      name: 'shop',
      label: 'Shop',
      type: 'group',
      admin: { description: 'Shopify trgovina stranice /shop. Poveznica „Shop“ se prikazuje u izborniku kad je uključen.' },
      fields: [
        { name: 'enabled', label: 'Uključen', type: 'checkbox', defaultValue: false },
        { name: 'storeDomain', label: 'Domena trgovine', type: 'text', admin: { description: 'Na primjer fesb-racing.myshopify.com' } },
        {
          name: 'storefrontToken',
          label: 'Storefront token',
          type: 'text',
          admin: { description: 'Javni Storefront API token (Shopify admin → Apps → Headless). Nije Admin API token.' },
        },
      ],
    },
  ],
}

export const Stats: GlobalConfig = {
  slug: 'stats',
  label: 'Brojke',
  admin: { group: 'Početna stranica', description: 'Brojke ispod naslovnog dijela (godina osnutka, broj članova ...).' },
  access,
  fields: [
    {
      name: 'items',
      label: 'Brojke',
      type: 'array',
      labels: { singular: 'Brojka', plural: 'Brojke' },
      fields: [
        { name: 'value', label: 'Vrijednost', type: 'text', required: true },
        { name: 'label', label: 'Opis', type: 'text', localized: true, required: true },
      ],
    },
  ],
}

export const Ticker: GlobalConfig = {
  slug: 'ticker',
  label: 'Traka s porukama',
  admin: { group: 'Početna stranica', description: 'Poruke koje klize u traci ispod naslovnog dijela.' },
  access,
  fields: [
    {
      name: 'items',
      label: 'Poruke',
      type: 'array',
      labels: { singular: 'Poruka', plural: 'Poruke' },
      fields: [{ name: 'text', label: 'Tekst', type: 'text', localized: true, required: true }],
    },
  ],
}

export const JoinCta: GlobalConfig = {
  slug: 'joinCta',
  label: 'Obrazac za prijavu',
  admin: { group: 'Početna stranica', description: 'Sekcija „Pridruži se“ s obrascem, za studente i za sponzore.' },
  access,
  fields: [
    { name: 'title', label: 'Naslov za studente', type: 'text', localized: true, required: true },
    { name: 'text', label: 'Tekst za studente', type: 'textarea', localized: true },
    text('companyTitle', 'Naslov za sponzore'),
    area('companyText', 'Tekst za sponzore'),
    { name: 'buttonLabel', label: 'Gumb u izborniku', type: 'text', localized: true, admin: { description: 'Gumb „Pridruži se“ u gornjem izborniku.' } },
  ],
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Podnožje i kontakt osobe',
  admin: { group: 'Postavke' },
  access,
  fields: [
    {
      name: 'contacts',
      label: 'Kontakt osobe',
      type: 'array',
      labels: { singular: 'Osoba', plural: 'Osobe' },
      admin: { description: 'Kontakt osobe kluba u podnožju, na primjer CEO i CTO.' },
      fields: [
        { name: 'role', label: 'Funkcija', type: 'text', localized: true, required: true },
        { name: 'name', label: 'Ime i prezime', type: 'text', required: true },
        { name: 'photo', label: 'Fotografija', type: 'upload', relationTo: 'media' },
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'phone', label: 'Telefon', type: 'text' },
      ],
    },
    { name: 'followHeading', label: 'Naslov iznad mreža', type: 'text', localized: true },
    { name: 'copyright', label: 'Copyright redak', type: 'text', localized: true },
    // The footer has no link columns any more. These fields stay hidden, so the database keeps its columns.
    { name: 'teamHeading', type: 'text', localized: true, admin: { hidden: true } },
    { name: 'programHeading', type: 'text', localized: true, admin: { hidden: true } },
    {
      name: 'links',
      type: 'array',
      admin: { hidden: true },
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
