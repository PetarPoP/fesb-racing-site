// Projects (Formula Student, MotoStudent) and their vehicles.
// Source: the old site ups-fesb.hr (pages /projekti/, /formula-student/, /projekti/motostudent-2/ and one page per vehicle).
// The CMS (collection "vehicles") replaces or adds vehicles; this file is the fallback. Generated once, then edited by hand.
import type { Lang } from '~/content'

export type ProjectId = 'formula-student' | 'motostudent'
export const PROJECT_IDS: ProjectId[] = ['formula-student', 'motostudent']
export const isProjectId = (v: unknown): v is ProjectId => v === 'formula-student' || v === 'motostudent'

export type Img = { src: string; sm: string; w: number; h: number }
type L<T> = Record<Lang, T>

export type Vehicle = {
  id: string
  project: ProjectId
  name: string
  year: string
  /** The first image is the cover. */
  images: Img[]
  specs: L<[string, string][]>
  awards: L<string[]>
  sections: L<{ t: string; d: string }[]>
  /** Competition line and results, when the old site had them. */
  comp: L<{ d: string; items: string[] } | null>
}

export type Project = {
  id: ProjectId
  name: string
  /** Logo for each theme: the black parts are cream on the dark theme. */
  logo: { dark: string; light: string }
  /** Photo of the card on the home page. */
  photo: string
  photoAlt: L<string>
  /** First paragraph: the card text. All paragraphs: the project page. */
  intro: L<string[]>
}

export const PROJECTS: Project[] = [
  {
    id: 'formula-student',
    name: 'Formula Student',
    logo: {
      dark: '/img/projekti/formula-student-dark.png',
      light: '/img/projekti/formula-student-light.png',
    },
    photo: '/img/foto-bolida.jpg',
    photoAlt: {
      hr: 'Bolid eFRT01 na natjecanju',
      en: 'The eFRT01 car at a competition',
    },
    intro: {
      hr: [
        'Formula Student (FS) je najprestižnije europsko obrazovno motorsport natjecanje, podržano od strane brojnih visokoprofilnih tvrtki iz industrije, čiji je cilj razviti poduzetne i inovativne mlade inženjere, kao i potaknuti nove mlade ljude na ulazak u inženjerske vode.',
        'Format natjecanja pruža idealnu priliku studentima da testiraju, demonstriraju i poboljšaju svoje sposobnosti pri stvaranju kompleksnog proizvoda u izrazito zahtjevnom okruženju motorsport natjecanja. Brojne svjetski poznate tvrtke iz automobilske industrije uvjetuju sudjelovanje na FS natjecanjima pri zapošljavanju mladih inženjera.',
        'FESB Racing, od svog osnutka 2010. godine, kontinuirano napreduje te aktivno razvija nova rješenja i koncepte za FS natjecanja.',
      ],
      en: [
        'Formula Student (FS) is the most prestigious worldwide educational motor racing competition supported by numerous high-profile companies from the industry, whose aim is to develop enterprising and innovative young engineers, as well as to encourage young people to enter engineering world.',
        'The competition format provides an ideal opportunity for students to test, demonstrate and improve their ability to create a complex product in an extremely demanding environment of the motorsport competition. Numerous world-renowned automotive companies are conditioning participation in FS competition for recruiting young engineers.',
        'Since its foundation in 2010, FESB Racing has been continuously developing new solutions and concepts for the FS competition.',
      ],
    },
  },
  {
    id: 'motostudent',
    name: 'MotoStudent',
    logo: {
      dark: '/img/projekti/motostudent-dark.png',
      light: '/img/projekti/motostudent-light.png',
    },
    photo: '/img/foto-motora.jpg',
    photoAlt: {
      hr: 'MotoStudent motocikl na stazi',
      en: 'The MotoStudent bike on track',
    },
    intro: {
      hr: [
        'MotoStudent (MS) natjecanje osnovano je kao uzor na Formula Student s većim naglaskom na motorsport, a podržano je od strane Moto Engineering Foundationa (MEF) i TechnoPark MotorLanda. Natjecanje se održava svake dvije godine na MotoGP stazi „Motorland Aragón FIM“ u Španjolskoj, dok su koncepti motocikala vrlo slični onima u Moto3 kategoriji profesionalnih natjecanja.',
        'Samo natjecanje predstavlja izazov studentima da, koristeći inženjerske principe i vlastita znanja, pokažu svoje sposobnosti u dizajniranju, izradi i testiranju motocikla, koje se očituju finalnim utrkivanjem na stazi. MS se od FS primarno razlikuje po tome što, uz ostale statičke i dinamičke discipline, nudi i klasičnu motorsport utrku – vježbu, kvalifikaciju te glavnu utrku svih sudionika.',
        'FESB Racing od 2015. godine aktivno sudjeluje u MS natjecanjima, a nakon prvog nastupa s motociklom „FRTm01“ 2016. godine, nastavlja s razvojem novih projekata.',
      ],
      en: [
        'The MotoStudent (MS) competition was established as a model of Formula Student with a greater emphasis on motorsport. It is supported by Moto Engineering Foundation (MEF) and TechnoPark MotorLanda. The competition is held every two years at MotoGP "Motorland Aragón FIM" in Spain, while the concepts of motorcycles are very similar to those in the Moto3 category of professional competitions.',
        'This competition is a challenge for students to use engineering principles and gained knowledge to demonstrate their skills in designing, developing and testing the motorcycle, which is reflected in the final racing on the track. The MS distinguishes itself from the FS primarily because it offers, in addition to other static and dynamic disciplines, a classic motorsport race - the exercise, the qualification and the main race of all participants.',
        'Since 2015, FESB Racing has actively participated in MS competitions and after its first appearance with the motorcycle "FRTm01" in 2016, it continues to develop new projects.',
      ],
    },
  },
]

export const VEHICLES: Vehicle[] = [
  {
    id: 'efrt01',
    project: 'formula-student',
    name: 'eFRT01',
    year: '',
    images: [
      {
        src: '/img/foto-bolida.jpg',
        sm: '/img/foto-bolida.jpg',
        w: 1400,
        h: 933,
      },
      {
        src: '/img/bolid-u-zavoju.jpg',
        sm: '/img/bolid-u-zavoju.jpg',
        w: 1600,
        h: 1067,
      },
    ],
    specs: {
      hr: [],
      en: [],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [
        {
          t: 'Prvi električni bolid',
          d: 'eFRT01 je prvi električni Formula Student bolid FESB Racinga. Vlastite tiskane pločice, VCU algoritam upravljanja, akumulator i visokonaponski sustav razvijeni su u radionici. Rastav bolida po timovima možete pogledati u 3D prikazu na naslovnici.',
        },
      ],
      en: [
        {
          t: 'The first electric car',
          d: 'eFRT01 is the first electric Formula Student car of FESB Racing. The circuit boards, the VCU control algorithm, the accumulator and the high-voltage system were developed in the workshop. The 3D view on the home page shows which team builds which part.',
        },
      ],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frt01',
    project: 'formula-student',
    name: 'FRT01',
    year: '2013',
    images: [
      {
        src: '/img/vozila/frt01/01.webp',
        sm: '/img/vozila/frt01/01-sm.webp',
        w: 1594,
        h: 726,
      },
      {
        src: '/img/vozila/frt01/02.webp',
        sm: '/img/vozila/frt01/02-sm.webp',
        w: 1600,
        h: 941,
      },
    ],
    specs: {
      hr: [
        ['Snaga motora', '61kW (82KS)'],
        ['Okretni moment', '59Nm'],
        ['Ukupna težina', '299kg'],
        ['Oplata', '4-slojni karbon kompozit'],
        ['Šasija', 'CrMo TiG zavareno'],
      ],
      en: [
        ['Engine power', '61kW (82HP)'],
        ['Torque', '59Nm'],
        ['Total weight', '299 kg'],
        ['Fairing', '4-layer carbon composite'],
        ['Chassis', 'CrMo TIG welded'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frt02',
    project: 'formula-student',
    name: 'FRT02',
    year: '2018',
    images: [
      {
        src: '/img/vozila/frt02/01.webp',
        sm: '/img/vozila/frt02/01-sm.webp',
        w: 1600,
        h: 824,
      },
      {
        src: '/img/vozila/frt02/02.webp',
        sm: '/img/vozila/frt02/02-sm.webp',
        w: 1600,
        h: 882,
      },
      {
        src: '/img/vozila/frt02/03.webp',
        sm: '/img/vozila/frt02/03-sm.webp',
        w: 1600,
        h: 707,
      },
      {
        src: '/img/vozila/frt02/04.webp',
        sm: '/img/vozila/frt02/04-sm.webp',
        w: 1600,
        h: 1245,
      },
    ],
    specs: {
      hr: [
        ['Snaga motora', '63kW (85 KS)'],
        ['Okretni moment', '62 Nm'],
        ['Ukupna težina', '246 kg'],
        ['Oplata', '2-slojni karbon i karbon kevlar kompozit'],
        ['Šasija', 'CrMo TiG zavareno'],
      ],
      en: [
        ['Engine power', '63kW (85HP)'],
        ['Torque', '62Nm'],
        ['Total weight', '246 kg'],
        ['Fairing', 'two-layered carbon and carbon-kevlar composite'],
        ['Chassis', 'CrMo TIG welded'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frt03',
    project: 'formula-student',
    name: 'FRT03',
    year: '2022',
    images: [
      {
        src: '/img/vozila/frt03/01.webp',
        sm: '/img/vozila/frt03/01-sm.webp',
        w: 1600,
        h: 883,
      },
      {
        src: '/img/vozila/frt03/02.webp',
        sm: '/img/vozila/frt03/02-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frt03/03.webp',
        sm: '/img/vozila/frt03/03-sm.webp',
        w: 1600,
        h: 1044,
      },
      {
        src: '/img/vozila/frt03/04.webp',
        sm: '/img/vozila/frt03/04-sm.webp',
        w: 1600,
        h: 481,
      },
      {
        src: '/img/vozila/frt03/05.webp',
        sm: '/img/vozila/frt03/05-sm.webp',
        w: 1600,
        h: 899,
      },
      {
        src: '/img/vozila/frt03/06.webp',
        sm: '/img/vozila/frt03/06-sm.webp',
        w: 1600,
        h: 1291,
      },
      {
        src: '/img/vozila/frt03/07.webp',
        sm: '/img/vozila/frt03/07-sm.webp',
        w: 1600,
        h: 895,
      },
      {
        src: '/img/vozila/frt03/08.webp',
        sm: '/img/vozila/frt03/08-sm.webp',
        w: 1600,
        h: 1133,
      },
      {
        src: '/img/vozila/frt03/09.webp',
        sm: '/img/vozila/frt03/09-sm.webp',
        w: 1600,
        h: 1060,
      },
      {
        src: '/img/vozila/frt03/10.webp',
        sm: '/img/vozila/frt03/10-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frt03/11.webp',
        sm: '/img/vozila/frt03/11-sm.webp',
        w: 1600,
        h: 960,
      },
    ],
    specs: {
      hr: [
        ['Snaga motora', '68 kW (91 KS)'],
        ['Okretni moment', '64 Nm'],
        ['Ukupna težina', '248 kg'],
        ['Oplata', 'Karbon-kevlar kompozit'],
        ['Šasija', '25CrMo4 + Al 7075-T6 33kg'],
      ],
      en: [
        ['Engine power', '68kW (91HP)'],
        ['Torque', '64Nm'],
        ['Total weight', '248 kg'],
        ['Fairing', 'Carbon-kevlar composite'],
        ['Chassis', '25CrMo4 + Al 7075-T6 33kg'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [
        {
          t: 'Powertrain',
          d: 'Za pogon bolida FRT03 koristi se četverotaktni četverocilindrični Otto motor iz motocikla CB600F, čiji su usisni i ispušni sustavi optimizirani CFD analizama. Lagani sustav goriva izrađen je od kompozitnih materijala s potopnom pumpom i 3D printanim usisnim vodom s restriktorom od 20 mm. Ispušni sustav je 4-1 konfiguracije od nehrđajućeg čelika s elektronskom kontrolom gasa. Prijenos snage ostvaren je aluminijskim lančanicima i Drexler diferencijalom s promjenjivim prijenosnim omjerima ovisno o stazi.',
        },
        {
          t: 'Ovjes',
          d: 'Geometrija ovjesa FRT03 optimizirana je računalnim simulacijama kinematskog odaziva kako bi se maksimizirala dodirna površina guma s tlom i poništio negativan utjecaj savijanja guma u zavojima. Dizajn ovjesa uzima u obzir utjecaj sila, prigušenja amortizera, karakteristike guma, krutost opruga i prijenos mase radi postizanja maksimalne sile trenja. Mehaničke komponente ovjesa dizajnirane su s fokusom na podesivost, malu masu i visoku krutost, koristeći lagane materijale i promjenjive dijelove. Ovjes je tipa dvostrukih vilica s unutarnjim oprugama spojenim preko klackalica, a performanse se validiraju i optimiziraju analizom podataka prikupljenih tijekom vožnje.',
        },
        {
          t: 'Konstrukcija',
          d: 'Nosiva konstrukcija bolida FRT03 kombinira čeličnu prostornu konstrukciju od kromolijskog čelika 25CrMo4 za krutost s aluminijskim nosačem od Al 7075-T6 za jednostavnost montaže i pristup komponentama. Šasija je dizajnirana paralelno s ostalim sustavima s ciljem maksimiziranja krutosti uz minimalnu masu. Sigurnost vozača osigurana je kompozitnim sjedalom od karbon-kevlar vlakana, pojasom sa 6 točaka i aluminijskim panelom koji štiti od topline motora. Ergonomija je poboljšana prilagodljivim jastucima i sustavom podesivih pedala za vozače različitih građa.',
        },
        {
          t: 'Aerodinamika',
          d: 'Aerodinamički uređaji na FRT03 (prednje i stražnje krilo, podnica i rashladni kanali) dizajnirani su pomoću CFD simulacija radi optimizacije potisne sile i smanjenja otpora zraka. Krila koriste razliku tlaka i rubne ploče za efikasnost, dok podnica stvara potisak Venturijevim efektom. Simulacijom cijelog sustava osigurava se aerodinamička ravnoteža i protok zraka za hlađenje motora. Krila su izrađena od karbonskih vlakana, a rezultati simulacija validiraju se testiranjem u vjetrotunelu.',
        },
      ],
      en: [
        {
          t: 'Powertrain',
          d: 'The FRT03 car is powered by a four-stroke, four-cylinder Otto engine from a CB600F motorcycle, whose intake and exhaust systems are optimized by CFD analyses. The lightweight fuel system is made of composite materials with a submersible pump and a 3D-printed intake duct with a 20 mm restrictor. The exhaust system is a 4-1 stainless steel configuration with electronic throttle control. Power transmission is achieved by aluminum sprockets and a Drexler differential with variable gear ratios depending on the track.',
        },
        {
          t: 'Suspension',
          d: 'The suspension geometry of the FRT03 is optimized using kinematic response computer simulations to maximize the contact patch of the tires with the ground and negate the negative effect of tire bending in turns. The suspension design takes into account the influence of forces, damper damping, tire characteristics, spring stiffness, and mass transfer to achieve maximum friction force. Mechanical suspension components are designed with a focus on adjustability, low mass, and high stiffness, using lightweight materials and variable parts. The suspension is a double-wishbone type with internal springs connected via rocker arms, and performance is validated and optimized by analyzing data collected during driving.',
        },
        {
          t: 'Chassis',
          d: 'The load-bearing structure of the FRT03 car combines a 25CrMo4 chromoly steel space frame for rigidity with an Al 7075-T6 aluminum carrier for ease of assembly and access to components. The chassis is designed in parallel with other systems with the aim of maximizing stiffness with minimal mass. Driver safety is ensured by a carbon-kevlar fiber composite seat, a 6-point harness, and an aluminum panel that protects against engine heat. Ergonomics are improved with adjustable cushions and an adjustable pedal system for drivers of various builds.',
        },
        {
          t: 'Aerodynamics',
          d: 'The aerodynamic devices on the FRT03 (front and rear wings, underbody, and cooling channels) were designed using CFD simulations to optimize downforce and reduce air resistance. The wings use pressure differences and endplates for efficiency, while the underbody generates downforce using the Venturi effect. The simulation of the entire system ensures aerodynamic balance and airflow for engine cooling. The wings are made of carbon fiber, and the simulation results are validated by wind tunnel testing.',
        },
      ],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frm5',
    project: 'motostudent',
    name: 'FRM5',
    year: '2024/2025',
    images: [
      {
        src: '/img/vozila/frm5/01.webp',
        sm: '/img/vozila/frm5/01-sm.webp',
        w: 1600,
        h: 1280,
      },
      {
        src: '/img/vozila/frm5/02.webp',
        sm: '/img/vozila/frm5/02-sm.webp',
        w: 1000,
        h: 1500,
      },
      {
        src: '/img/vozila/frm5/03.webp',
        sm: '/img/vozila/frm5/03-sm.webp',
        w: 1000,
        h: 1500,
      },
    ],
    specs: {
      hr: [
        ['Motor', '250 cm³'],
        ['Ukupna težina', '94 kg'],
      ],
      en: [
        ['Engine', '250 cc'],
        ['Total weight', '94 kg'],
      ],
    },
    awards: {
      hr: ['2. mjesto u kategoriji „Prototip, CAD i crteži“', '2. mjesto u kategoriji „Ekonomski plan“'],
      en: ['2nd place in the “Prototype, CAD and drawings” category', '2nd place in the “Business plan” category'],
    },
    sections: {
      hr: [
        {
          t: 'Natjecanje 2025.',
          d: 'U odnosu na prethodni projekt ostvaren je značajan napredak: optimizirana je šasija, redizajnirana oplata i znatno poboljšana aerodinamika, što je donijelo bolje performanse i veću udobnost vožnje. Prijava i tehnička inspekcija prošle su bez poteškoća, a FRM5 je već drugog dana dobio odobrenje testnog vozača i time osigurao nastup u dinamičkim disciplinama.\n\nNa natjecanju je sudjelovalo više od 85 timova iz 19 zemalja. Nakon prva dva uspješna slobodna treninga došlo je do loma vilice pa je tim odustao od nastavka natjecanja. Vozač nije ozlijeđen.',
        },
      ],
      en: [
        {
          t: 'Competition 2025',
          d: 'Compared with the previous project the bike made a big step forward: the chassis was optimised, the fairing redesigned and the aerodynamics clearly improved, which brought better performance and more riding comfort. Registration and technical inspection went without problems, and on the second day FRM5 was cleared by the test rider, which secured its place in the dynamic disciplines.\n\nMore than 85 teams from 19 countries took part. After two good free practice sessions the front fork broke, so the team withdrew from the rest of the event. The rider was not hurt.',
        },
      ],
    },
    comp: {
      hr: {
        d: 'MotorLand Aragón, 15. – 19. 10. 2025.',
        items: [],
      },
      en: {
        d: 'MotorLand Aragón, 15–19 October 2025',
        items: [],
      },
    },
  },
  {
    id: 'frm4',
    project: 'motostudent',
    name: 'FRM4',
    year: '2022/2023',
    images: [
      {
        src: '/img/vozila/frm4/01.webp',
        sm: '/img/vozila/frm4/01-sm.webp',
        w: 1600,
        h: 1719,
      },
      {
        src: '/img/vozila/frm4/02.webp',
        sm: '/img/vozila/frm4/02-sm.webp',
        w: 1600,
        h: 1114,
      },
      {
        src: '/img/vozila/frm4/03.webp',
        sm: '/img/vozila/frm4/03-sm.webp',
        w: 1600,
        h: 1332,
      },
      {
        src: '/img/vozila/frm4/04.webp',
        sm: '/img/vozila/frm4/04-sm.webp',
        w: 1600,
        h: 915,
      },
      {
        src: '/img/vozila/frm4/05.webp',
        sm: '/img/vozila/frm4/05-sm.webp',
        w: 1600,
        h: 854,
      },
      {
        src: '/img/vozila/frm4/06.webp',
        sm: '/img/vozila/frm4/06-sm.webp',
        w: 1600,
        h: 782,
      },
      {
        src: '/img/vozila/frm4/07.webp',
        sm: '/img/vozila/frm4/07-sm.webp',
        w: 1600,
        h: 1200,
      },
      {
        src: '/img/vozila/frm4/08.webp',
        sm: '/img/vozila/frm4/08-sm.webp',
        w: 567,
        h: 313,
      },
      {
        src: '/img/vozila/frm4/09.webp',
        sm: '/img/vozila/frm4/09-sm.webp',
        w: 1600,
        h: 976,
      },
      {
        src: '/img/vozila/frm4/10.webp',
        sm: '/img/vozila/frm4/10-sm.webp',
        w: 1600,
        h: 1002,
      },
      {
        src: '/img/vozila/frm4/11.webp',
        sm: '/img/vozila/frm4/11-sm.webp',
        w: 839,
        h: 367,
      },
      {
        src: '/img/vozila/frm4/12.webp',
        sm: '/img/vozila/frm4/12-sm.webp',
        w: 839,
        h: 382,
      },
      {
        src: '/img/vozila/frm4/13.webp',
        sm: '/img/vozila/frm4/13-sm.webp',
        w: 920,
        h: 512,
      },
      {
        src: '/img/vozila/frm4/14.webp',
        sm: '/img/vozila/frm4/14-sm.webp',
        w: 1600,
        h: 1095,
      },
      {
        src: '/img/vozila/frm4/15.webp',
        sm: '/img/vozila/frm4/15-sm.webp',
        w: 1600,
        h: 1075,
      },
      {
        src: '/img/vozila/frm4/16.webp',
        sm: '/img/vozila/frm4/16-sm.webp',
        w: 750,
        h: 402,
      },
      {
        src: '/img/vozila/frm4/17.webp',
        sm: '/img/vozila/frm4/17-sm.webp',
        w: 519,
        h: 265,
      },
      {
        src: '/img/vozila/frm4/18.webp',
        sm: '/img/vozila/frm4/18-sm.webp',
        w: 1600,
        h: 1164,
      },
      {
        src: '/img/vozila/frm4/19.webp',
        sm: '/img/vozila/frm4/19-sm.webp',
        w: 1600,
        h: 890,
      },
      {
        src: '/img/vozila/frm4/20.webp',
        sm: '/img/vozila/frm4/20-sm.webp',
        w: 1600,
        h: 747,
      },
      {
        src: '/img/vozila/frm4/21.webp',
        sm: '/img/vozila/frm4/21-sm.webp',
        w: 1600,
        h: 1088,
      },
      {
        src: '/img/vozila/frm4/22.webp',
        sm: '/img/vozila/frm4/22-sm.webp',
        w: 1600,
        h: 1392,
      },
      {
        src: '/img/vozila/frm4/23.webp',
        sm: '/img/vozila/frm4/23-sm.webp',
        w: 631,
        h: 355,
      },
      {
        src: '/img/vozila/frm4/24.webp',
        sm: '/img/vozila/frm4/24-sm.webp',
        w: 567,
        h: 564,
      },
      {
        src: '/img/vozila/frm4/25.webp',
        sm: '/img/vozila/frm4/25-sm.webp',
        w: 567,
        h: 566,
      },
      {
        src: '/img/vozila/frm4/26.webp',
        sm: '/img/vozila/frm4/26-sm.webp',
        w: 1600,
        h: 1200,
      },
      {
        src: '/img/vozila/frm4/27.webp',
        sm: '/img/vozila/frm4/27-sm.webp',
        w: 1600,
        h: 1066,
      },
      {
        src: '/img/vozila/frm4/28.webp',
        sm: '/img/vozila/frm4/28-sm.webp',
        w: 1600,
        h: 1067,
      },
    ],
    specs: {
      hr: [
        ['Motor', '50 HP, KTM 250 SX-F'],
        ['Akceleracija', '0-100km/h: 4,4s'],
        ['Ukupna težina', '95 kg'],
        ['Međuosovinski razmak', '1296±23 mm'],
      ],
      en: [
        ['Engine', '50 HP, KTM 250 SX-F'],
        ['Acceleration', '0-100km/h: 4,4 s'],
        ['Total weight', '95 kg'],
        ['Wheelbase', '1296±23 mm'],
      ],
    },
    awards: {
      hr: ['1. mjesto u kategoriji akceleracije', '1. mjesto u MS1 Finals kategoriji'],
      en: ['1st place in Acceleration category', '1st place in MS1 Finals category'],
    },
    sections: {
      hr: [
        {
          t: 'Pogonski sustav',
          d: 'Za dizajn i optimizaciju usisnog, ispušnog, gorivnog i rashladnog sustava motora KTM 250 SX – F i evaluaciju performansi, razvijen je 1D model performansi motora koristeći AVL Boost. Simulacije vremena kruga provedene su korištenjem MATLAB-a i Open lap skripte kako bi se odredio najkorišteniji segment radnog područja, prosječno na 12040 RPM rasponu od 10000 do 14000 RPM. Ovi podaci poslužili su kao osnova za daljnju optimizaciju performansi motora putem AVL Boost-a. Četrnaest ključnih parametara je varirano, uključujući primarnu duljinu/promjer usisa, volumen zračne kutije, duljinu/promjer ulaza zraka i duljinu/promjer ispuha, među ostalima. Komparativna analiza u odnosu na tvornički motor otkrila je povećanje momenta od 13,5% i povećanje snage od 7,71% kroz optimizaciju. Posebno, vrhunac okretnog momenta pomaknut je s 12000 na 10000 RPM, dok je vrhunac snage ostao na 14000 RPM. Ova poboljšanja potvrđena su testiranjem na dinamometru. Kako bi se učinkovito prenijela ova povećana snaga na kotače uz održavanje laganog dizajna, provedene su modifikacije poput korištenja lakšeg lanca 415, prilagođenog prednjeg lančanika i aluminijskog stražnjeg lančanika izrađenog od aluminija 7075-T6.',
        },
        {
          t: 'Ovjes',
          d: 'FRM4 ima optimizirani sustav ovjesa, pažljivo analiziran korištenjem MATLAB -a i Altair Motion View -a. Simulacije vremena kruga, prilagođene trkaćoj stazi Motorland u Aragonu, bile su ključne za unapređenje performansi ovjesa. Precizan odabir točaka pričvršćivanja ovjesa usklađen je sa željenom krivuljom odziva, postigavši ravnotežu između krutosti i odzivnosti za optimalno iskustvo na stazi. Koristeći prednosti aluminija 7075-T6, posebna pažnja posvećena je dizajnu komponenti, pažljivo optimiziranih i izrađenih od nule. Komponente prednjeg i stražnjeg ovjesa projektirane su kako bi osigurale željeno ponašanje, prilagodljivost i laganu konstrukciju. Stražnja vilica kao ključni element, izrađena je od aluminija 6082-T6 zbog svoje visoke granice tečenja od 503 MPa. Korištenjem tehnika obrade za oblikovanje u šuplje elemente, praćeno TIG zavarivanjem i toplinskom obradom, rezultiralo je strukturom visoke krutosti od 0,95 kNm/deg torzijske krutosti, uz održavanje minimalne težine.',
        },
        {
          t: 'Oplata',
          d: 'Oplata FRM4 sastoji se od prednjih i stražnjih blatobrana, gornjih i donjih dijelova oplate, i poklopca spremnika za gorivo. Početni geometrijski dizajn preuzet je s našeg prethodnog motocikla, zatim je pojednostavljen i simuliran u Ansys Fluent -u, omogućujući brzo generiranje mreže i iteraciju geometrije. Koristeći K-epsilon i GEKO modele turbulencije u CFD analizi, izračunat je koeficijent otpora zraka (cd) od 0,274, praćen negativnim koeficijentom uzgona (cl) od 0,0165. Cijeli proces izrade obavlja se unutar naše radionice. Počinje 3D printom modela te nanošenjem gelcoata i staklenih vlakana za izradu kalupa. Završni korak uključuje ručno laminiranje četiri sloja kompozitnih ugljičnih vlakana s epoksidnom smolom, osiguravajući lagan ali strukturalno čvrst dio s optimalnim svojstvima krutosti i mase. Posebno dizajnirana da bude lagana, ali otporna na testiranje i uvjete na stazi, rep motora to jest stražnja potkonstrukcija izrađena je od 450 g/m² preprega ugljičnih vlakana i osnovnog materijala. Korištenje vakuumskog sustava za pritiskanje slojeva na polirani MDF kalup, praćeno stvrdnjavanjem preprega u autoclave, osigurava da strukturni integritet potkonstrukcije odgovara simulacijama.',
        },
        {
          t: 'Konstrukcija',
          d: 'Okvir šasije, pravi temelj ovog motocikla, nastao je kroz spoj SolidWorks CAD-a za početnu geometriju i simulacije u Ansys-u strukturne analize. Sinfonija inovacija i inženjerske briljantnosti orkestrirala je njezinu optimizaciju, fino podešavajući krutost i smanjujući težinu. Finalna 32. verzija, rezultirala je u 36 kromolijiskih čeličnih cijevi, pažljivo CNC obrađenih i besprijekorno spojenih. Hardox® 450 pružio je snagu nosačima motora i ovjesa, kroz preciznosti TIG zavarivanja uz WCrMo1Si kao dodatni materijal, rezultirajući izvrsnosti. Ukrašena zaštitnom plastifikacijom koji je završni sloj, s težinom od svega 8,9 kg, ali s torzijskom krutošću od 4 kNm/deg, šasija je svjedočanstvo o skladnom spoju forme i funkcije. Papučice, izrađene od aluminija Al 7075 T6, su gotovo zanemarive mase dok omogućuju prilagodljivost, krojeno jedinstvenom poziciji I preferenci svakog vozača.',
        },
        {
          t: 'Elektronika',
          d: 'Ožičenje je dizajnirano koristeći EPLAN softver i izrađeno je u skladu sa standardima kako bi se osigurala maksimalna pouzdanost. Ožičenje je sastavljeno koristeći visokokvalitetne automobilske komponente. Korištene komponente su žice vojnih specifikacija ( Spec-44 ), DR-25 termo-skupljajući bužir različitih veličina, automobilski konektori Sumitomo DL, Deutsch, Amphenol. Krajevi žica su označeni oznakama kako bi se olakšala identifikacija.\n\nDigitalni LCD zaslon na motoru povezan je s Taipan ECU -om putem samorazvijene CAN mreže te prikazuje najvažnije podatke kako bi vozaču pomogao u upravljanju motociklom, to uključujućuje brzinu, broj okretaja motora (RPM), temperaturu motora, napon baterije i trenutnu brzinu motocikla. Aplikacija koja pokreće zaslon izrađena je koristeći Qt platformu. Kako bi se optimiziralo vrijeme pokretanja aplikacije, razvijen je minimalistički Linux sustav koristeći Buildroot.',
        },
      ],
      en: [
        {
          t: 'Powertrain',
          d: "To design and optimize the KTM 250 SX - F engine's intake, exhaust, fuel, and cooling systems and evaluate performance, a 1D engine performance model was developed using AVL Boost. Lap time simulations were conducted using MATLAB and Open lap script to determine the most utilized segment of the powerband, averaging at 12040 rpm within the range of 10000 to 14000 rpm. This data served as the basis for further optimizing engine performance via AVL Boost. Fourteen key parameters were varied, including intake primary length/diameter, airbox volume, ram air length/diameter, and exhaust length/diameter, among others. Comparative analysis against the stock engine revealed a 13,5% increase in torque and a 7,71% boost in power through the optimization. Notably, the torque peak shifted from 12000 to 10000 rpm while the power peak remained at 14000 rpm. These enhancements were validated through dyno testing. To efficiently transfer this augmented power to the wheels while maintaining a lightweight design, modifications such as utilizing a lighter 415 chain, custom front sprocket, and aluminum rear sprocket were manufactured from 7075-T6 Aluminium.",
        },
        {
          t: 'Suspension',
          d: "The FRM4 showcases an optimized suspension system, meticulously analyzed using MATLAB and Altair Motion View. Lap time simulations, tailored to the Aragon Motorland racetrack, were instrumental in refining the suspension's performance. Precise selection of suspension hardpoints aligned with the desired response curve, striking a balance between rigidity and responsiveness for an optimal on-track experience. Utilizing strengths of 7075-T6 Aluminium significant emphasis was placed on component design, meticulously optimized and created from scratch. Both front and rear suspension components were engineered to ensure the desired behavior, adjustability, and lightweight construction. The rear swingarm, a key element, was crafted from 6082 - T6 Aluminum because of its high yield strength of 503 MPa. Utilizing milling techniques to shape it into shells, followed by TIG welding and heat treatment, resulted in a high-rigidity structure of 0,95 kNm/deg of torsional stiffness while keeping weight at a minimum.",
        },
        {
          t: 'Fairing',
          d: "The fairing of the FRM4 consists of the front and rear mudguards, upper and lower body parts, and the fuel tank cover. The initial geometric design was taken from our previous motorcycle and it was simplified and then simulated in Ansys Fluent, enabling quick mesh generation and geometry iteration. Leveraging K-epsilon and GEKO turbulence models in the CFD analysis, the resulting drag coefficient (cd) was calculated as 0,274, accompanied by a negative lift coefficient (cl) of 0,0165. The entire manufacturing process is completed in-house. It commences with 3D printing the models and applying gelcoat and glass fiber to create the mold. The final step involves hand-laminating four layers of composite carbon fiber with epoxy resin, ensuring a lightweight yet structurally sound part with optimal stiffness and mass properties. Specifically designed to be lightweight yet resilient to testing and track conditions, the tail subframe is manufactured using 450 g/m2 carbon fiber prepreg and core material. Employing vacuum bagging to press the layup against a polished MDF mold, followed by curing the prepreg in an autoclave, ensures the subframe's structural integrity aligns with simulations.",
        },
        {
          t: 'Chassis',
          d: 'The space frame chassis, the very backbone of this motorcycle, came to life through a fusion of SolidWorks CAD magic for its initial geometry and Ansys structural analysis prowess. A symphony of innovation and engineering brilliance orchestrated its optimization, fine-tuning stiffness and shedding weight. The crescendo, the 32nd version, emerged from the 36 chromoly steel tubes, meticulously CNC milled and united seamlessly. Hardox® 450 lent its strength to the engine and suspension mounts, a ballet of precision through TIG welding with added WCrMo1Si filler rod, resulting in a canvas of excellence. Adorned with a powder-coated finish, boasting a mere 8,9 kg in weight yet wielding a torsional stiffness of 4 kNm/deg, a testament to the harmonious marriage of form and function. The pedals, crafted from Al 7075 T6, embody lightness while embracing adjustability, tailored for the unique imprint of each driver.',
        },
        {
          t: 'Electronics',
          d: "The wiring was designed using EPLAN software and is constructed according to standards to ensure maximum reliability. The wiring is assembled using high-quality automotive components to achieve flawless reliability. The components used are: Military spec wire (Spec-44), DR-25 heat-shrink tubing in various sizes, automotive connectors Sumitomo DL, Deutsch, Amphenol. Wire ends are identified using cable labels to facilitate identification.\n\nA digital LCD display on the motor is connected to the Taipan ECU through the self-developed CAN network, and it shows the most important data to assist the driver in managing the motorcycle, including speed, RPM, engine temperature, battery voltage, and the motorcycle's current speed. The application that runs the display is made using the Qt framework. To optimize the application startup time, a minimalist Linux operating system was developed using Buildroot.",
        },
      ],
    },
    comp: {
      hr: {
        d: 'Održano 11.10.-15.10.2023. godine',
        items: [
          '7. mjesto u kategorijama kočenje i najveća brzina',
          '11. mjesto u kategoriji najbolji dizajn',
          '4. nastup na MotoStudentu',
        ],
      },
      en: {
        d: 'Held on 11.10. – 15.10. 2023.',
        items: [
          '4th time participating',
          '7th place in Braking and Vmax categories',
          '11th place in Best design category',
        ],
      },
    },
  },
  {
    id: 'frm3',
    project: 'motostudent',
    name: 'FRM3',
    year: '2019/2020',
    images: [
      {
        src: '/img/vozila/frm3/01.webp',
        sm: '/img/vozila/frm3/01-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/02.webp',
        sm: '/img/vozila/frm3/02-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/03.webp',
        sm: '/img/vozila/frm3/03-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/04.webp',
        sm: '/img/vozila/frm3/04-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/05.webp',
        sm: '/img/vozila/frm3/05-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/06.webp',
        sm: '/img/vozila/frm3/06-sm.webp',
        w: 1600,
        h: 900,
      },
      {
        src: '/img/vozila/frm3/07.webp',
        sm: '/img/vozila/frm3/07-sm.webp',
        w: 1600,
        h: 900,
      },
    ],
    specs: {
      hr: [
        ['Motor', '35 HP, KTM 250 RC'],
        ['Akceleracija', '0-100km/h: 5,1s'],
        ['Ukupna težina', '98 kg'],
        ['Međuosovinski razmak', '1300 mm.'],
      ],
      en: [
        ['Engine', '35 HP, KTM 250 RC'],
        ['Acceleration', '0-100km/h: 5,1s'],
        ['Total weight', '98 kg'],
        ['Wheelbase', '1300 mm'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'efrm1',
    project: 'motostudent',
    name: 'eFRM1',
    year: '2019/2021',
    images: [
      {
        src: '/img/vozila/efrm1/01.webp',
        sm: '/img/vozila/efrm1/01-sm.webp',
        w: 1600,
        h: 1086,
      },
      {
        src: '/img/vozila/efrm1/02.webp',
        sm: '/img/vozila/efrm1/02-sm.webp',
        w: 1600,
        h: 945,
      },
      {
        src: '/img/vozila/efrm1/03.webp',
        sm: '/img/vozila/efrm1/03-sm.webp',
        w: 1600,
        h: 848,
      },
      {
        src: '/img/vozila/efrm1/04.webp',
        sm: '/img/vozila/efrm1/04-sm.webp',
        w: 1600,
        h: 1012,
      },
      {
        src: '/img/vozila/efrm1/05.webp',
        sm: '/img/vozila/efrm1/05-sm.webp',
        w: 1600,
        h: 1342,
      },
      {
        src: '/img/vozila/efrm1/06.webp',
        sm: '/img/vozila/efrm1/06-sm.webp',
        w: 1600,
        h: 1198,
      },
      {
        src: '/img/vozila/efrm1/07.webp',
        sm: '/img/vozila/efrm1/07-sm.webp',
        w: 1600,
        h: 945,
      },
      {
        src: '/img/vozila/efrm1/08.webp',
        sm: '/img/vozila/efrm1/08-sm.webp',
        w: 1600,
        h: 1079,
      },
    ],
    specs: {
      hr: [
        ['Motor', '41 HP, 4,77 kWh, ENGRIO 205A'],
        ['Akceleracija', '0-100km/h: 4,9s'],
        ['Ukupna težina', '115 kg'],
        ['Međuosovinski razmak', '1300 mm'],
      ],
      en: [
        ['Engine', '41 HP, 4,77 kWh, ENGRIO 205A'],
        ['Acceleration', '0-100km/h: 4,9s'],
        ['Total weight', '115 kg'],
        ['Wheelbase', '1300 mm'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frm2',
    project: 'motostudent',
    name: 'FRM2',
    year: '2017/2018',
    images: [
      {
        src: '/img/vozila/frm2/01.webp',
        sm: '/img/vozila/frm2/01-sm.webp',
        w: 1196,
        h: 1033,
      },
      {
        src: '/img/vozila/frm2/02.webp',
        sm: '/img/vozila/frm2/02-sm.webp',
        w: 1517,
        h: 779,
      },
      {
        src: '/img/vozila/frm2/03.webp',
        sm: '/img/vozila/frm2/03-sm.webp',
        w: 1389,
        h: 1021,
      },
    ],
    specs: {
      hr: [
        ['Motor', '35 HP, KTM 250 RC'],
        ['Akceleracija', '0-100km/h: 5,3s'],
        ['Ukupna težina', '104 kg'],
        ['Međuosovinski razmak', '1340 mm'],
      ],
      en: [
        ['Engine', '35 HP, KTM 250 RC'],
        ['Acceleration', '0-100km/h: 5,3 s'],
        ['Total weight', '104 kg'],
        ['Wheelbase', '1340 mm'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
  {
    id: 'frm1',
    project: 'motostudent',
    name: 'FRM1',
    year: '2015/2016',
    images: [
      {
        src: '/img/vozila/frm1/01.webp',
        sm: '/img/vozila/frm1/01-sm.webp',
        w: 1097,
        h: 845,
      },
      {
        src: '/img/vozila/frm1/02.webp',
        sm: '/img/vozila/frm1/02-sm.webp',
        w: 1600,
        h: 809,
      },
      {
        src: '/img/vozila/frm1/03.webp',
        sm: '/img/vozila/frm1/03-sm.webp',
        w: 1600,
        h: 1118,
      },
    ],
    specs: {
      hr: [
        ['Motor', '27 HP, Honda CBR250R'],
        ['Akceleracija', '0-100km/h: 6,5s'],
        ['Ukupna težina', '145 kg'],
        ['Međuosovinski razmak', '1300 mm'],
      ],
      en: [
        ['Engine', '27 HP, Honda CBR250R'],
        ['Acceleration', '0-100km/h: 6,5s'],
        ['Total weight', '145 kg'],
        ['Wheelbase', '1300 mm'],
      ],
    },
    awards: {
      hr: [],
      en: [],
    },
    sections: {
      hr: [],
      en: [],
    },
    comp: {
      hr: null,
      en: null,
    },
  },
]

/** A vehicle in one language, as the pages use it. */
export type VehicleView = {
  id: string
  project: ProjectId
  name: string
  year: string
  images: Img[]
  specs: [string, string][]
  awards: string[]
  sections: { t: string; d: string }[]
  comp: { d: string; items: string[] } | null
  /** Text of a vehicle added in the CMS. The static vehicles use `sections`. */
  description?: string
}

export const vehicleView = (v: Vehicle, lang: Lang): VehicleView => ({
  id: v.id,
  project: v.project,
  name: v.name,
  year: v.year,
  images: v.images,
  specs: v.specs[lang],
  awards: v.awards[lang],
  sections: v.sections[lang],
  comp: v.comp[lang],
})

/** A render on a transparent or white background shows whole on a light tile. A photo fills its frame. */
export const isPhoto = (src: string) => /\.jpe?g$/i.test(src) || src.includes('/frm5/') || /^https?:/.test(src)
