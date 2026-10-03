// Sav HR/EN sadržaj stranice. Izvor: fesb-content.js iz dizajnerskog paketa,
// dopunjen UI tekstovima koji su u prototipu bili tvrdo kodirani.

export const LANGS = ['hr', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const isLang = (v: unknown): v is Lang => v === 'hr' || v === 'en'

/** Sidrene poveznice sekcija (jezično neutralne), redom kao `nav`. */
export const SECTION_IDS = ['prica', 'timovi', 'vozila', 'natjecanja', 'sponzori', 'novosti', 'kontakt'] as const

type Team = { code: string; name: string; d: string; tags: string[] }
type Vehicle = { id: string; cls: string; name: string; d: string; sys: string[]; img: string; src?: string; pos?: string }
type Comp = {
  cc: string
  name: string
  place: string
  type: 'FS' | 'MS'
  /** Circuit and town, shown under the name in the list. */
  sub: string
  /** Venue line in the map bar. */
  venue: string
  /** Map centre: [latitude, longitude]. */
  c: [number, number]
  /** Half size of the map view: [latitude span, longitude span], in degrees. */
  z: [number, number]
}

export type Content = {
  metaTitle: string
  metaDesc: string
  nav: string[]
  cta: string
  heroA: string
  heroB: string
  heroSub: string
  heroCta2: string
  stats: { v: string; l: string }[]
  storyTitle: string
  chapters: { y: string; t: string; d: string }[]
  mission: string
  /** Part of `mission` that gets the accent colour. */
  missionAccent: string
  teamsTitle: string
  teams: Team[]
  carIntro: string
  carAria: string
  carModelNote: string
  carScroll: string
  carLoading: string
  carFailed: string
  carAll: string
  /** Count line of the active team. {a} = assemblies, {m} = CAD parts. */
  carCount: string
  carNoParts: string
  carDimLength: string
  carDimWheelbase: string
  carDimWidth: string
  carDimNote: string
  carSkip: string
  carProgress: string
  vehTitle: string
  vehicles: Vehicle[]
  compLabel: string
  compTitle: string
  comps: Comp[]
  trackPlan: string
  compMapOpen: string
  sponTitle: string
  sponText: string
  sponCta: string
  sponCount: string
  sponTiers: [string, string, string, string]
  joinTitle: string
  joinText: string
  fName: string
  fMail: string
  fStudy: string
  fTeam: string
  fSend: string
  fSending: string
  fSent: string
  errName: string
  errMail: string
  errStudy: string
  errServer: string
  modeLabel: string
  modeStudent: string
  modeCompany: string
  companyTitle: string
  companyText: string
  fCompany: string
  fContact: string
  fMessage: string
  fSendCompany: string
  fSentCompany: string
  errCompany: string
  errMessage: string
  newsLabel: string
  newsTitle: string
  readMore: string
  readFull: string
  allNews: string
  noNews: string
  close: string
  notFound: string
  backHome: string
  contactTitle: string
  addr: string
  mail: string
  foot: string
  menu: string
  footTeam: string
  footProgram: string
  footFollow: string
  langSwitch: string
  /** Ticker words from the CMS. When empty, the ticker uses the competition names. */
  ticker?: string[]
  /** Social link URLs from the CMS, by platform (instagram, facebook, linkedin). */
  socials?: Record<string, string>
}

const hr: Content = {
  metaTitle: 'FESB Racing — Od ploče do staze',
  metaDesc:
    'Studentski inženjerski tim FESB-a iz Splita. Projektiramo, gradimo i utrkujemo Formula Student bolide i MotoStudent motocikle.',
  nav: ['Priča', 'Timovi', 'Vozila', 'Natjecanja', 'Sponzori', 'Novosti', 'Kontakt'],
  cta: 'Pridruži se',
  heroA: 'Od ploče',
  heroB: 'do staze.',
  heroSub:
    'Studentski inženjerski tim FESB-a. Projektiramo, gradimo i utrkujemo Formula Student bolide i MotoStudent motocikle.',
  heroCta2: 'Postani partner',
  stats: [
    { v: '2010', l: 'Godina osnutka' },
    { v: '65+', l: 'Aktivnih članova' },
    { v: '5', l: 'Specijaliziranih timova' },
    { v: '18+', l: 'Europskih natjecanja' },
  ],
  storyTitle: 'Startna linija',
  chapters: [
    {
      y: '2010',
      t: 'Predavaonice FESB-a',
      d: 'Skupina studenata odlučila je da teorijski proračuni s ploče ne smiju ostati samo na papiru. Htjeli su zvuk motora, miris spaljenih guma i inovaciju u vlastitim rukama.',
    },
    {
      y: 'Radionica',
      t: 'Drugi dom',
      d: 'Tu se ne spava prije natjecanja. Do sitnih sati projektiraju se šasije, razvijaju vlastite PCB pločice, piše VCU algoritam, optimizira aerodinamika i testira svaki milimetar ovjesa.',
    },
    {
      y: 'Danas',
      t: '65+ članova, 5 timova',
      d: 'Udruga specijaliziranih timova koja razvija Formula Student bolide i MotoStudent utrkačke motocikle.',
    },
  ],
  mission: 'Most između akademske teorije i vrhunskog inženjerstva u stvarnom svijetu.',
  missionAccent: 'vrhunskog inženjerstva',
  teamsTitle: 'Pet timova, jedno vozilo.',
  teams: [
    { code: 'MEH', name: 'Mehanika', d: 'Šasija, ovjes, pogonski sklop i kočnice. Od CAD modela do zavarenog okvira.', tags: ['Šasija', 'Ovjes', 'Pogon'] },
    { code: 'E&S', name: 'Elektronika & Software', d: 'Vlastite tiskane pločice, VCU algoritam upravljanja vozilom, senzorika i telemetrija.', tags: ['PCB', 'VCU', 'Telemetrija'] },
    { code: 'AER', name: 'Aerodinamika', d: 'CFD simulacije, krila i difuzor — svaki Newton potisne sile uz što manje otpora.', tags: ['CFD', 'Krila', 'Difuzor'] },
    { code: 'KAR', name: 'Aerodinamika & Karoserija', d: 'Kompozitna karoserija, kalupi i laminacija karbonskih vlakana.', tags: ['Kompoziti', 'Kalupi', 'Karbon'] },
    { code: 'M&B', name: 'Marketing & Biznis', d: 'Partnerstva, brend, mediji i poslovni plan koji branimo pred sucima na natjecanjima.', tags: ['Sponzori', 'Brend', 'Business plan'] },
  ],
  carIntro: 'Skrolaj kroz eFRT01: bolid se okreće, rastavlja na sklopove i pokazuje koji tim stoji iza kojeg dijela.',
  carAria: '3D model bolida eFRT01 koji se pri skrolanju okreće i rastavlja na sklopove označene timovima',
  carModelNote: 'CAD model · rastav po sklopovima',
  carScroll: 'Skrolaj',
  carLoading: 'Učitavanje modela',
  carFailed: '3D model se nije mogao učitati',
  carAll: 'Cijeli bolid',
  carCount: '{a} sklopova · {m} CAD dijelova',
  carNoParts: 'Bez fizičkih dijelova na bolidu',
  carDimLength: 'Duljina',
  carDimWheelbase: 'Međuosovinski razmak',
  carDimWidth: 'Širina',
  carDimNote: 'Mjere su okvirne (očitane iz CAD modela)',
  carSkip: 'Preskoči animaciju',
  carProgress: 'Napredak animacije',
  vehTitle: 'Dvije klase. Jedna radionica.',
  vehicles: [
    {
      id: 'fs',
      cls: 'Formula Student',
      name: 'Formula Student bolid',
      d: 'Jednosjed razvijen za statičke i dinamičke discipline: acceleration, skidpad, autocross i endurance.',
      sys: ['Šasija', 'Ovjes', 'Aero paket', 'VCU', 'Vlastite PCB'],
      img: 'Bolid eFRT01 na natjecanju',
      src: '/img/foto-bolida.jpg',
      pos: '50% 60%',
    },
    {
      id: 'ms',
      cls: 'MotoStudent',
      name: 'MotoStudent motocikl',
      d: 'Utrkački prototip motocikla razvijen od okvira do elektronike za natjecanje MotoStudent u Španjolskoj.',
      sys: ['Okvir', 'Ovjes', 'Karoserija', 'Elektronika', 'Pogon'],
      img: 'MotoStudent motocikl na stazi',
      src: '/img/foto-motora.jpg',
      pos: '45% 55%',
    },
  ],
  compLabel: 'Natjecanja',
  compTitle: '18+ natjecanja diljem Europe.',
  comps: [
    {
      cc: 'IT',
      name: 'Formula Student Italy',
      place: 'Italija',
      type: 'FS',
      sub: "Autodromo Riccardo Paletti, Varano de' Melegari",
      venue: 'Autodromo Riccardo Paletti · 2,35 km',
      c: [44.6811, 10.0225],
      z: [0.0065, 0.0105],
    },
    {
      cc: 'CZ',
      name: 'Formula Student Czech',
      place: 'Češka',
      type: 'FS',
      sub: 'Autodrom Most, Češka',
      venue: 'Autodrom Most · 4,21 km',
      c: [50.5225, 13.6006],
      z: [0.009, 0.016],
    },
    {
      cc: 'ES',
      name: 'MotoStudent',
      place: 'Španjolska',
      type: 'MS',
      sub: 'MotorLand Aragón, Alcañiz',
      venue: 'MotorLand Aragón · 5,35 km',
      c: [41.0783, -0.2075],
      z: [0.011, 0.016],
    },
    {
      cc: 'HR',
      name: 'Rimac FS Alpe Adria',
      place: 'Hrvatska — domaći teren',
      type: 'FS',
      sub: 'Bugatti Rimac Test Track, Velika Gorica',
      venue: 'Bugatti Rimac Test Track · Mičevec',
      c: [45.7515, 16.0545],
      z: [0.012, 0.019],
    },
  ],
  trackPlan: 'Tlocrt staze',
  compMapOpen: 'Otvori kartu',
  sponTitle: 'Partneri',
  sponText:
    'Vaša tehnologija na stazi, vaš brend pred europskim inženjerskim talentima. Nudimo vidljivost, zapošljavanje i suradnju na stvarnom razvoju.',
  sponCta: 'Postani partner',
  sponCount: 'Partnera: {n}',
  sponTiers: ['Sveučilište', 'Glavni partneri', 'Partneri', 'Podržavaju nas'],
  joinTitle: 'Tu se ne spava prije natjecanja.',
  joinText:
    'Tražimo studente strojarstva, elektrotehnike, računarstva i ekonomije koji žele graditi, a ne samo učiti.',
  fName: 'Ime i prezime',
  fMail: 'E-mail',
  fStudy: 'Studij i godina',
  fTeam: 'Željeni tim',
  fSend: 'Pošalji prijavu',
  fSending: 'Šaljem…',
  fSent: 'Prijava zaprimljena. Javljamo se prije sljedećeg okupljanja u radionici.',
  errName: 'Upiši ime i prezime.',
  errMail: 'Upiši ispravnu e-mail adresu.',
  errStudy: 'Upiši studij i godinu.',
  errServer: 'Slanje nije uspjelo. Pokušaj ponovno.',
  modeLabel: 'Javljam se kao',
  modeStudent: 'Student',
  modeCompany: 'Sponzor',
  companyTitle: 'Vozimo zajedno.',
  companyText:
    'Tražite mlade inženjere, vidljivost na europskim stazama ili partnera za razvoj? Pošaljite nam par riječi o sebi i javit ćemo se sa sponzorskim paketom.',
  fCompany: 'Tvrtka',
  fContact: 'Kontakt osoba',
  fMessage: 'Poruka',
  fSendCompany: 'Pošalji upit',
  fSentCompany: 'Hvala! Upit je zaprimljen, javit ćemo vam se u nekoliko radnih dana.',
  errCompany: 'Upišite naziv tvrtke.',
  errMessage: 'Napišite nam kratku poruku.',
  newsLabel: 'Novosti',
  newsTitle: 'Iz radionice',
  readMore: 'Pročitaj',
  readFull: 'Pročitaj cijelu novost',
  allNews: 'Sve novosti',
  noNews: 'Nema objava',
  close: 'Zatvori',
  notFound: 'Ova stranica ne postoji.',
  backHome: 'Natrag na početnu',
  contactTitle: 'Svratite u radionicu.',
  addr: 'FESB, Ruđera Boškovića 32, 21000 Split',
  mail: 'info@fesbracing.hr',
  foot: '© FESB Racing — udruga studenata FESB-a',
  menu: 'Izbornik',
  footTeam: 'Tim',
  footProgram: 'Program',
  footFollow: 'Pratite',
  langSwitch: 'Promijeni jezik',
}

const en: Content = {
  metaTitle: 'FESB Racing — From whiteboard to track',
  metaDesc:
    'The student engineering team of FESB in Split. We design, build and race Formula Student cars and MotoStudent motorcycles.',
  nav: ['Story', 'Teams', 'Vehicles', 'Competitions', 'Sponsors', 'News', 'Contact'],
  cta: 'Join us',
  heroA: 'From whiteboard',
  heroB: 'to track.',
  heroSub:
    'The student engineering team of FESB. We design, build and race Formula Student cars and MotoStudent motorcycles.',
  heroCta2: 'Become a partner',
  stats: [
    { v: '2010', l: 'Founded' },
    { v: '65+', l: 'Active members' },
    { v: '5', l: 'Specialised teams' },
    { v: '18+', l: 'European competitions' },
  ],
  storyTitle: 'The starting line',
  chapters: [
    {
      y: '2010',
      t: 'FESB lecture halls',
      d: 'A group of students decided that calculations on the whiteboard must not stay on paper. They wanted engine sound, the smell of burnt rubber and innovation in their own hands.',
    },
    {
      y: 'Workshop',
      t: 'A second home',
      d: 'Nobody sleeps before a competition. Late into the night we design chassis, develop our own PCBs, write the VCU control algorithm, optimise aero and test every millimetre of suspension.',
    },
    {
      y: 'Today',
      t: '65+ members, 5 teams',
      d: 'An association of specialised teams developing Formula Student cars and MotoStudent race motorcycles.',
    },
  ],
  mission: 'A bridge between academic theory and top-level real-world engineering.',
  missionAccent: 'top-level real-world engineering',
  teamsTitle: 'Five teams, one vehicle.',
  teams: [
    { code: 'MEH', name: 'Mechanics', d: 'Chassis, suspension, powertrain and brakes. From CAD model to welded frame.', tags: ['Chassis', 'Suspension', 'Powertrain'] },
    { code: 'E&S', name: 'Electronics & Software', d: 'In-house PCBs, the VCU vehicle control algorithm, sensors and telemetry.', tags: ['PCB', 'VCU', 'Telemetry'] },
    { code: 'AER', name: 'Aerodynamics', d: 'CFD simulation, wings and diffuser — every newton of downforce at minimum drag.', tags: ['CFD', 'Wings', 'Diffuser'] },
    { code: 'KAR', name: 'Aerodynamics & Bodywork', d: 'Composite bodywork, moulds and carbon fibre lamination.', tags: ['Composites', 'Moulds', 'Carbon'] },
    { code: 'M&B', name: 'Marketing & Business', d: 'Partnerships, brand, media and the business plan we defend in front of judges.', tags: ['Sponsors', 'Brand', 'Business plan'] },
  ],
  carIntro: 'Scroll through eFRT01: the car turns, comes apart into its assemblies and shows which team builds what.',
  carAria: '3D model of the eFRT01 car that rotates and explodes into assemblies labelled by team as you scroll',
  carModelNote: 'CAD model · exploded by assembly',
  carScroll: 'Scroll',
  carLoading: 'Loading model',
  carFailed: 'The 3D model could not be loaded',
  carAll: 'Whole car',
  carCount: '{a} assemblies · {m} CAD parts',
  carNoParts: 'No physical parts on the car',
  carDimLength: 'Length',
  carDimWheelbase: 'Wheelbase',
  carDimWidth: 'Width',
  carDimNote: 'Sizes are approximate (read from the CAD model)',
  carSkip: 'Skip the animation',
  carProgress: 'Animation progress',
  vehTitle: 'Two classes. One workshop.',
  vehicles: [
    {
      id: 'fs',
      cls: 'Formula Student',
      name: 'Formula Student car',
      d: 'A single-seater built for static and dynamic events: acceleration, skidpad, autocross and endurance.',
      sys: ['Chassis', 'Suspension', 'Aero package', 'VCU', 'In-house PCBs'],
      img: 'The eFRT01 car at a competition',
      src: '/img/foto-bolida.jpg',
      pos: '50% 60%',
    },
    {
      id: 'ms',
      cls: 'MotoStudent',
      name: 'MotoStudent motorcycle',
      d: 'A race motorcycle prototype developed from frame to electronics for MotoStudent in Spain.',
      sys: ['Frame', 'Suspension', 'Bodywork', 'Electronics', 'Powertrain'],
      img: 'The MotoStudent motorcycle on track',
      src: '/img/foto-motora.jpg',
      pos: '45% 55%',
    },
  ],
  compLabel: 'Competitions',
  compTitle: '18+ competitions across Europe.',
  comps: [
    {
      cc: 'IT',
      name: 'Formula Student Italy',
      place: 'Italy',
      type: 'FS',
      sub: "Autodromo Riccardo Paletti, Varano de' Melegari",
      venue: 'Autodromo Riccardo Paletti · 2.35 km',
      c: [44.6811, 10.0225],
      z: [0.0065, 0.0105],
    },
    {
      cc: 'CZ',
      name: 'Formula Student Czech',
      place: 'Czech Republic',
      type: 'FS',
      sub: 'Autodrom Most, Czech Republic',
      venue: 'Autodrom Most · 4.21 km',
      c: [50.5225, 13.6006],
      z: [0.009, 0.016],
    },
    {
      cc: 'ES',
      name: 'MotoStudent',
      place: 'Spain',
      type: 'MS',
      sub: 'MotorLand Aragón, Alcañiz',
      venue: 'MotorLand Aragón · 5.35 km',
      c: [41.0783, -0.2075],
      z: [0.011, 0.016],
    },
    {
      cc: 'HR',
      name: 'Rimac FS Alpe Adria',
      place: 'Croatia — home ground',
      type: 'FS',
      sub: 'Bugatti Rimac Test Track, Velika Gorica',
      venue: 'Bugatti Rimac Test Track · Mičevec',
      c: [45.7515, 16.0545],
      z: [0.012, 0.019],
    },
  ],
  trackPlan: 'Track layout',
  compMapOpen: 'Open map',
  sponTitle: 'Partners',
  sponText:
    'Your technology on track, your brand in front of Europe’s engineering talent. We offer visibility, recruiting and collaboration on real development.',
  sponCta: 'Become a partner',
  sponCount: 'Partners: {n}',
  sponTiers: ['University', 'Main partners', 'Partners', 'Supporters'],
  joinTitle: 'Nobody sleeps before a competition.',
  joinText:
    'We are looking for mechanical, electrical, computing and economics students who want to build, not just study.',
  fName: 'Full name',
  fMail: 'E-mail',
  fStudy: 'Study programme & year',
  fTeam: 'Preferred team',
  fSend: 'Send application',
  fSending: 'Sending…',
  fSent: 'Application received. We will reach out before the next workshop meeting.',
  errName: 'Enter your full name.',
  errMail: 'Enter a valid e-mail address.',
  errStudy: 'Enter your study programme and year.',
  errServer: 'Sending failed. Please try again.',
  modeLabel: 'I am a',
  modeStudent: 'Student',
  modeCompany: 'Sponsor',
  companyTitle: 'Let’s race together.',
  companyText:
    'Looking for young engineers, visibility on European tracks or a development partner? Tell us a little about your company and we will get back to you with our sponsorship pack.',
  fCompany: 'Company',
  fContact: 'Contact person',
  fMessage: 'Message',
  fSendCompany: 'Send inquiry',
  fSentCompany: 'Thank you! Your inquiry has been received and we will get back to you within a few business days.',
  errCompany: 'Enter your company name.',
  errMessage: 'Write us a short message.',
  newsLabel: 'News',
  newsTitle: 'From the workshop',
  readMore: 'Read',
  readFull: 'Read the full story',
  allNews: 'All news',
  noNews: 'No posts yet',
  close: 'Close',
  notFound: 'This page does not exist.',
  backHome: 'Back to home',
  contactTitle: 'Drop by the workshop.',
  addr: 'FESB, Ruđera Boškovića 32, 21000 Split, Croatia',
  mail: 'info@fesbracing.hr',
  foot: '© FESB Racing — FESB student association',
  menu: 'Menu',
  footTeam: 'Team',
  footProgram: 'Program',
  footFollow: 'Follow',
  langSwitch: 'Switch language',
}

export const content: Record<Lang, Content> = { hr, en }
