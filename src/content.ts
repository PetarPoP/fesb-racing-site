// Sav HR/EN sadržaj stranice. Izvor: fesb-content.js iz dizajnerskog paketa,
// dopunjen UI tekstovima koji su u prototipu bili tvrdo kodirani.

export const LANGS = ['hr', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const isLang = (v: unknown): v is Lang => v === 'hr' || v === 'en'

/** Sidrene poveznice sekcija (jezično neutralne), redom kao `nav`. */
export const SECTION_IDS = ['novosti', 'timovi', 'projekti', 'natjecanja', 'sponzori', 'blog', 'kontakt'] as const

type Team = {
  code: string
  name: string
  /** Short line for the 3D view. */
  d: string
  /** Full text of the team card (from the old site). */
  about: string
  tags: string[]
  /** Icon mask in public/img/timovi, or a CMS image. */
  icon: string
  /** Team lead. The CMS replaces the placeholders. */
  lead: { name: string; email?: string; phone?: string; photo?: string }
}
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
  /** Official website of the competition. */
  url?: string
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
  teamsTitle: string
  teamsCardsText: string
  teamLead: string
  teamMore: string
  teamLess: string
  teams: Team[]
  carTitle: string
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
  projMore: string
  projGenerations: string
  projAll: string
  specsTitle: string
  awardsTitle: string
  vehCompTitle: string
  galleryTitle: string
  noSpecs: string
  otherVehicles: string
  vehOpen: string
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
  /** Short club news: the top of the home page and /novosti. */
  newsLabel: string
  newsTitle: string
  readMore: string
  readFull: string
  allNews: string
  /** Longer stories: the bottom of the home page and /blog. */
  blogLabel: string
  blogTitle: string
  blogReadFull: string
  allBlog: string
  noNews: string
  close: string
  notFound: string
  backHome: string
  contactTitle: string
  addr: string
  mail: string
  foot: string
  menu: string
  footFollow: string
  /** Heading above the club contacts in the footer. */
  leadersTitle: string
  /** Club contacts in the footer (CEO, CTO). The CMS replaces the placeholders. */
  leaders: { role: string; name: string; email?: string; phone?: string; photo?: string }[]
  langSwitch: string
  themeSwitch: string
  /** Ticker words from the CMS. When empty, the ticker uses the competition names. */
  ticker?: string[]
  shopNav: string
  shopTitle: string
  shopText: string
  shopSoon: string
  shopSoonText: string
  shopError: string
  shopCart: string
  shopEmpty: string
  shopAdd: string
  shopSoldOut: string
  shopVariant: string
  shopSubtotal: string
  shopCheckout: string
  shopMore: string
  shopLess: string
  /** Shopify store from the CMS (Site settings → Shop). The nav link shows when it is switched on. */
  shop?: { enabled: boolean; domain: string; token: string }
  /** Social link URLs from the CMS, by platform (instagram, facebook, linkedin). */
  socials?: Record<string, string>
}

const hr: Content = {
  metaTitle: 'FESB Racing — Od ploče do staze',
  metaDesc:
    'Studentski inženjerski tim FESB-a iz Splita. Projektiramo, gradimo i utrkujemo Formula Student bolide i MotoStudent motocikle.',
  nav: ['Novosti', 'Timovi', 'Projekti', 'Natjecanja', 'Sponzori', 'Blog', 'Kontakt'],
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
  teamsTitle: 'Šest timova, jedno vozilo.',
  teamsCardsText: 'Svaki tim ima svog voditelja. Javite im se izravno ili se prijavite u tim kroz obrazac na dnu stranice.',
  teamLead: 'Voditelj tima',
  teamMore: 'Više o timu',
  teamLess: 'Manje',
  teams: [
    {
      code: 'PWT',
      name: 'Powertrain',
      d: 'Pogonski sustav i svi njegovi podsustavi: motor, prijenos snage, a sve više i baterijski paket električnog pogona.',
      about:
        'Zadatak tima Powertrain je razvoj pogonskog sustava vozila i svih njegovih podsustava za MotoStudent i Formula Student natjecanja. Simulacijama, optimiranjem i managementom motora i njegovih podsustava izvlačimo maksimum iz motora. U sve to spada i razvoj drivetraina koji uključuje odabir prijenosnika, te oblikovanje i optimiranje njegovih komponenti. U skoroj budućnosti tim Powertrain proširuje svoje vidike razvojem baterijskog sklopa i thermal managementom električnog pogona.',
      tags: ['Motor', 'Prijenos', 'Thermal management'],
      icon: '/img/timovi/pwt.png',
      lead: { name: 'Ime Prezime', email: 'powertrain@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'ELE',
      name: 'Elektronika',
      d: 'Vlastite tiskane pločice, firmware, ožičenje, visokonaponski sustav i prikupljanje podataka s bolida.',
      about:
        'Tim elektronika se dijeli na podtimove softver, hardver, ožičenje, HV sistemi i DAQ. Hardware tim se bavi razvojem PCB pločica koje zadovoljavaju zahtjevne automobilske standarde. Zadaća softver tima je da razvija firmware za mikrokontrolere na PCB pločicama i ostale softverske alate koji pomažu u razvoju i testiranju bolida. HV tim se bavi razvijanjem i simuliranjem baterijskog paketa električnog bolida. Tim ožičenje je zadužen da se na pouzdan način povežu električne komponente na bolidima. DAQ tim se bavi prikupljanjem i obradom podataka koji se zatim analiziraju kako bi se pronašli načini da se povećaju performanse bolida.',
      tags: ['PCB', 'Firmware', 'HV', 'DAQ'],
      icon: '/img/timovi/ele.png',
      lead: { name: 'Ime Prezime', email: 'elektronika@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'DAE',
      name: 'Dizajn i aerodinamika',
      d: 'Izgled vozila, CFD simulacije, krila i podnica te ergonomija sjedala.',
      about:
        'Tim se bavi općim izgledom projekata. Od samog vizualnog izgleda, preko projektiranja, pa sve do simuliranja oblikuje se identitet naših projekata. Sa ciljem dobivanja što boljih voznih sposobnosti, svi naši projekti prolaze CFD simulacije u kojima vidimo aerodinamička svojstva vozila te odlučujemo kako ih poboljšati dodavanjem raznih aerodinamičkih naprava. Jedan od značajnijih utjecaja na rezultate na natjecanjima je i vozačeva udobnost, pa se tako ovaj tim bavi i projektiranjem ergonomski povoljnih sjedišta bilo da je riječ o formuli ili o motociklu.',
      tags: ['CFD', 'Oplata', 'Ergonomija'],
      icon: '/img/timovi/dae.png',
      lead: { name: 'Ime Prezime', email: 'aero@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'DIN',
      name: 'Dinamika vozila',
      d: 'Ovjes, upravljanje i kočnice: od simulacije vožnje do namještanja vozila na stazi.',
      about:
        'Tim dinamika vozila bavi se analiziranjem vožnje, silama koje se prenose na ostale komponente te dizajniranjem parametara ovjesa s ciljem ostvarivanja što većeg prijanjanja gume uz podlogu, a time i željenog ponašanja na stazi. Glavni zadaci dijele se u tri kategorije: kontrola, simulacija i mehanički dizajn ovjesa. Simulacijom gradimo računalni model vozila i optimiramo ga, a preko njega dobivamo sile i dimenzije s kojima, u suradnji s ostalim podtimovima, gradimo kompletno vozilo. U toj izgradnji sudjelujemo mehaničkim dizajnom sustava ovjesa, upravljanja i kočenja, od odabira materijala, ležajeva i vijaka do završnog sastavljanja, testiranja i namještanja.',
      tags: ['Ovjes', 'Upravljanje', 'Kočnice'],
      icon: '/img/timovi/din.png',
      lead: { name: 'Ime Prezime', email: 'dinamika@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'KON',
      name: 'Konstrukcija',
      d: 'Šasija kao glavna nosiva konstrukcija: što manja masa uz što veću torzijsku krutost.',
      about:
        'Šasija, kao glavna strukturna komponenta, mora omogućiti prihvat svih ostalih sustava vozila te osigurati potrebnu krutost vozila. Cilj pri projektiranju je minimizirati masu i maksimizirati ključne veličine poput torzijske krutosti. Konstrukcijski materijali koji trenutno dominiraju su čelik i aluminij, a implementacija kompozitnih materijala u strukturi se intenzivno istražuje. Vizija tima je izrada monokok šasije bolida te integracija što većeg broja strukturnih kompozitnih komponenti.',
      tags: ['Šasija', 'Kompoziti', 'Krutost'],
      icon: '/img/timovi/kon.png',
      lead: { name: 'Ime Prezime', email: 'konstrukcija@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'B&M',
      name: 'Business i marketing',
      d: 'Partnerstva, društvene mreže, foto i video, eventi i odnosi s javnošću.',
      about:
        'Tim marketing bavi se prezentacijom udruge široj javnosti. Ta prezentacija uključuje širok spektar aktivnosti kako bi doseg publike bio što veći i svrsishodniji. U timu marketing vode se društvene mreže, održava web stranica, izrađuju fotografije i video zapisi, priprema se i planira ideje za evente, izrađuju se različiti promotivni materijali, traži se sponzore te bavi odnosima s javnošću.',
      tags: ['Sponzori', 'Mediji', 'Eventi'],
      icon: '/img/timovi/bm.png',
      lead: { name: 'Ime Prezime', email: 'marketing@fesbracing.hr', phone: '+385 00 000 0000' },
    },
  ],
  carTitle: 'Tko gradi koji dio?',
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
  projMore: 'Saznaj više',
  projGenerations: 'Generacije',
  projAll: 'Svi projekti',
  specsTitle: 'Tehničke karakteristike',
  awardsTitle: 'Nagrade',
  vehCompTitle: 'Natjecanje',
  galleryTitle: 'Galerija',
  noSpecs: 'Tehnički podaci uskoro.',
  otherVehicles: 'Ostala vozila',
  vehOpen: 'Otvori vozilo',
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
      url: 'https://www.formula-ata.it',
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
      url: 'https://www.fsczech.cz',
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
      url: 'https://www.motostudent.com',
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
  compMapOpen: 'Službena stranica',
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
  newsTitle: 'Novosti',
  readMore: 'Pročitaj',
  readFull: 'Pročitaj cijelu novost',
  allNews: 'Sve novosti',
  blogLabel: 'Blog',
  blogTitle: 'Iz radionice',
  blogReadFull: 'Pročitaj cijeli članak',
  allBlog: 'Svi članci',
  noNews: 'Nema objava',
  close: 'Zatvori',
  notFound: 'Ova stranica ne postoji.',
  backHome: 'Natrag na početnu',
  contactTitle: 'Svratite u radionicu.',
  addr: 'FESB, Ruđera Boškovića 32, 21000 Split',
  mail: 'info@fesbracing.hr',
  foot: '© FESB Racing — udruga studenata FESB-a',
  menu: 'Izbornik',
  footFollow: 'Pratite nas',
  leadersTitle: 'Kontakt osobe',
  leaders: [
    { role: 'CEO', name: 'Ime Prezime', email: 'ceo@fesbracing.hr', phone: '+385 00 000 0000' },
    { role: 'CTO', name: 'Ime Prezime', email: 'cto@fesbracing.hr', phone: '+385 00 000 0000' },
  ],
  langSwitch: 'Promijeni jezik',
  themeSwitch: 'Promijeni temu (svijetla / tamna)',
  shopNav: 'Shop',
  shopTitle: 'Shop',
  shopText: 'Majice, kape i ostala oprema FESB Racinga. Svaka kupnja ide izravno u razvoj sljedećeg bolida i motocikla.',
  shopSoon: 'Shop uskoro',
  shopSoonText: 'Trgovina se upravo slaže. Pratite nas na Instagramu da saznate kad krene prodaja.',
  shopError: 'Shop trenutačno nije dostupan',
  shopCart: 'Košarica',
  shopEmpty: 'Košarica je prazna.',
  shopAdd: 'Dodaj u košaricu',
  shopSoldOut: 'Rasprodano',
  shopVariant: 'Odaberi',
  shopSubtotal: 'Ukupno',
  shopCheckout: 'Na plaćanje',
  shopMore: 'Povećaj količinu',
  shopLess: 'Smanji količinu',
}

const en: Content = {
  metaTitle: 'FESB Racing — From whiteboard to track',
  metaDesc:
    'The student engineering team of FESB in Split. We design, build and race Formula Student cars and MotoStudent motorcycles.',
  nav: ['News', 'Teams', 'Projects', 'Competitions', 'Sponsors', 'Blog', 'Contact'],
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
  teamsTitle: 'Six teams, one vehicle.',
  teamsCardsText: 'Every team has its own lead. Contact them directly or apply for a team with the form at the bottom of the page.',
  teamLead: 'Team lead',
  teamMore: 'More about the team',
  teamLess: 'Less',
  teams: [
    {
      code: 'PWT',
      name: 'Powertrain',
      d: 'The propulsion system and all its subsystems: engine, drivetrain and more and more the battery pack of the electric drive.',
      about:
        'The task of the Powertrain team is to develop the vehicle propulsion system and all its subsystems for the MotoStudent and Formula Student competitions. By simulating, optimising and managing the engine and its subsystems, we get the most out of the engine. This includes the development of the drivetrain: the selection of the gearbox and the design and optimisation of its components. In the near future the Powertrain team is expanding its horizons with the development of a battery pack and the thermal management of the electric drive.',
      tags: ['Engine', 'Drivetrain', 'Thermal management'],
      icon: '/img/timovi/pwt.png',
      lead: { name: 'Name Surname', email: 'powertrain@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'ELE',
      name: 'Electronics',
      d: 'Our own circuit boards, firmware, wiring, the high-voltage system and data acquisition.',
      about:
        'The electronics team is divided into the sub-teams software, hardware, wiring, HV systems and DAQ. The hardware team develops PCBs that meet demanding automotive standards. The software team develops firmware for the microcontrollers on the PCBs and other software tools that help in the development and testing of the cars. The HV team develops and simulates the battery pack of the electric car. The wiring team connects the electrical components on the cars in a reliable way. The DAQ team collects and processes data, which is then analysed to find ways to increase the performance of the car.',
      tags: ['PCB', 'Firmware', 'HV', 'DAQ'],
      icon: '/img/timovi/ele.png',
      lead: { name: 'Name Surname', email: 'elektronika@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'DAE',
      name: 'Design and aerodynamics',
      d: 'The look of the vehicle, CFD simulations, wings and undertray, and seat ergonomics.',
      about:
        'The team shapes the general layout of the projects. From the visual appearance, through design, all the way to simulation, the identity of our projects is formed. To get the best possible driving performance, all our projects go through CFD simulations in which we see the aerodynamic properties of the vehicle and decide how to improve them with aerodynamic devices. Driver comfort has a large influence on the results at competitions, so this team also designs ergonomic seats, for the car as well as for the motorcycle.',
      tags: ['CFD', 'Bodywork', 'Ergonomics'],
      icon: '/img/timovi/dae.png',
      lead: { name: 'Name Surname', email: 'aero@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'DIN',
      name: 'Vehicle dynamics',
      d: 'Suspension, steering and brakes: from driving simulation to set-up on track.',
      about:
        'The vehicle dynamics team analyses driving and the forces transmitted to the other components, and designs the suspension parameters to get as much tyre grip as possible and the desired behaviour on track. The main tasks fall into three categories: control, simulation and the mechanical design of the suspension. With simulation we build a computer model of the vehicle and optimise it, and from it we get the forces and dimensions with which, together with the other sub-teams, we build the complete vehicle. We take part in that with the mechanical design of the suspension, steering and braking systems, from the choice of materials, bearings and bolts to the final assembly, testing and set-up.',
      tags: ['Suspension', 'Steering', 'Brakes'],
      icon: '/img/timovi/din.png',
      lead: { name: 'Name Surname', email: 'dinamika@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'KON',
      name: 'Chassis',
      d: 'The chassis as the main load-bearing structure: low mass with high torsional stiffness.',
      about:
        'The chassis, as the main structural component, must carry all the other systems of the vehicle and give it the necessary stiffness. The goal of the design is to minimise mass and maximise key values such as torsional stiffness. Steel and aluminium are the main materials today, and composite materials in the structure are being researched intensively. The vision of the team is a monocoque chassis and as many structural composite components as possible.',
      tags: ['Chassis', 'Composites', 'Stiffness'],
      icon: '/img/timovi/kon.png',
      lead: { name: 'Name Surname', email: 'konstrukcija@fesbracing.hr', phone: '+385 00 000 0000' },
    },
    {
      code: 'B&M',
      name: 'Business and marketing',
      d: 'Partnerships, social media, photo and video, events and public relations.',
      about:
        'The marketing team presents the association to the public. This covers a wide range of activities that make the reach as large and meaningful as possible. The marketing team runs the social networks, maintains the website, makes photos and videos, plans events, creates promotional materials, looks for sponsors and handles public relations.',
      tags: ['Sponsors', 'Media', 'Events'],
      icon: '/img/timovi/bm.png',
      lead: { name: 'Name Surname', email: 'marketing@fesbracing.hr', phone: '+385 00 000 0000' },
    },
  ],
  carTitle: 'Who builds which part?',
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
  projMore: 'Learn more',
  projGenerations: 'Generations',
  projAll: 'All projects',
  specsTitle: 'Technical data',
  awardsTitle: 'Awards',
  vehCompTitle: 'Competition',
  galleryTitle: 'Gallery',
  noSpecs: 'Technical data coming soon.',
  otherVehicles: 'Other vehicles',
  vehOpen: 'Open vehicle',
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
      url: 'https://www.formula-ata.it',
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
      url: 'https://www.fsczech.cz',
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
      url: 'https://www.motostudent.com',
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
  compMapOpen: 'Official website',
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
  newsTitle: 'News',
  readMore: 'Read',
  readFull: 'Read the full story',
  allNews: 'All news',
  blogLabel: 'Blog',
  blogTitle: 'From the workshop',
  blogReadFull: 'Read the full article',
  allBlog: 'All articles',
  noNews: 'No posts yet',
  close: 'Close',
  notFound: 'This page does not exist.',
  backHome: 'Back to home',
  contactTitle: 'Drop by the workshop.',
  addr: 'FESB, Ruđera Boškovića 32, 21000 Split, Croatia',
  mail: 'info@fesbracing.hr',
  foot: '© FESB Racing — FESB student association',
  menu: 'Menu',
  footFollow: 'Follow us',
  leadersTitle: 'Contacts',
  leaders: [
    { role: 'CEO', name: 'Name Surname', email: 'ceo@fesbracing.hr', phone: '+385 00 000 0000' },
    { role: 'CTO', name: 'Name Surname', email: 'cto@fesbracing.hr', phone: '+385 00 000 0000' },
  ],
  langSwitch: 'Switch language',
  themeSwitch: 'Switch theme (light / dark)',
  shopNav: 'Shop',
  shopTitle: 'Shop',
  shopText: 'T-shirts, caps and more FESB Racing gear. Every purchase goes straight into the development of the next car and bike.',
  shopSoon: 'Shop coming soon',
  shopSoonText: 'The store is being set up. Follow us on Instagram to find out when it opens.',
  shopError: 'The shop is not available right now',
  shopCart: 'Cart',
  shopEmpty: 'Your cart is empty.',
  shopAdd: 'Add to cart',
  shopSoldOut: 'Sold out',
  shopVariant: 'Choose',
  shopSubtotal: 'Subtotal',
  shopCheckout: 'Checkout',
  shopMore: 'Increase quantity',
  shopLess: 'Decrease quantity',
}

export const content: Record<Lang, Content> = { hr, en }
