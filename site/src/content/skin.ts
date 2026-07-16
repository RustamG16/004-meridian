// THE MERIDIAN skin — flagship SKIN of the JOURNEY/TOUR template (lab/003 = template source).
// TEMPLATE LAW: every property-specific value lives HERE (+ public/media/, public/frames/).
// Fictional alpine lakeside resort — all visuals AI-generated, publishable.
// Per-pitch reskins touch ONLY this file (name/copy/facts) — video is generated once.

export const skin = {
  meta: {
    name: 'THE MERIDIAN',
    fullName: 'The Meridian — Alpine Lakeside Resort',
    title: 'THE MERIDIAN — Alpine Lakeside Resort · The Lake Holds Still',
    description:
      'The Meridian, an alpine lakeside resort: 42 suites, a lakeside restaurant, a 1,400 m² spa and a heated infinity pool above the water. Arrive by evening. The lake holds still.',
    lang: 'en',
    address: 'The Meridian · An Alpine Lake',
    tel: '+43 6542 555 160', // fictional
    telHref: 'tel:+436542555160',
    email: 'stay@the-meridian.demo', // fictional
    noindex: false, // fictional property — publishable flagship demo
  },

  fonts: {
    display: 'Italiana',
    body: 'Manrope',
    href: 'https://fonts.googleapis.com/css2?family=Italiana&family=Manrope:wght@300;400;500&display=swap',
  },

  tokens: {
    // ink + champagne window light
    bg: '#0A0D13',
    text: '#F2EEE3', // warm ivory
    dim: 'rgba(242, 238, 227, .55)',
    accent: '#D5BE86', // champagne gold
    accentWinter: '#D5BE86', // no seasonal pair on this skin — single accent, ONE-accent law intact
  },

  preloader: { line: 'THE MERIDIAN' },

  nav: { menuLabel: 'Menu', cta: 'Enquire' },

  menu: {
    close: 'Close',
    links: [
      { label: 'Home', href: '#top' },
      { label: 'The Tour', href: '#tour' },
      { label: 'Suites', href: '/suites' },
      { label: 'Amenities', href: '#amenities' },
      { label: 'Stay', href: '#enquire' },
    ],
    groupLabel: 'The Grounds',
    groupLinks: [
      { label: 'Restaurant', progress: 0.23 },
      { label: 'Lounge', progress: 0.55 },
      { label: 'Suite', progress: 0.72 },
      { label: 'Spa', progress: 0.86 },
    ],
    handle: '@the.meridian',
    tagline: ['The lake holds still.', 'So do you.'],
  },

  hud: {
    // one element, two readouts: metres travelled along the glide + the space you are passing
    altitude: 480,
    prefix: '',
    unit: ' M',
    locale: 'en-US',
    spaces: [
      { at: 0.0, label: 'THE SKY' },
      { at: 0.185, label: 'THE RESTAURANT' },
      { at: 0.36, label: 'THE DINING ROOM' },
      { at: 0.47, label: 'THE LOUNGE' }, // lounge footage starts ~frame 130 post-cull (stop 132 = fireplace)
      { at: 0.67, label: 'THE SUITE' },
      { at: 0.81, label: 'THE SPA' }, // pool room enters ~frame 225 (stop 227 must not read THE SUITE)
      { at: 0.93, label: 'THE LAKE' },
    ],
  },

  journey: {
    // one continuous drone glide: sky → restaurant → dining → lounge → suite → spa → the lake again.
    // 6 clips, joins blended in the frame sequence (assemble.py), never inside a clip.
    frames: {
      path: '/frames/v1/frame_',
      ext: '.webp',
      pad: 4,
      count: 240, // fallback only — index.astro counts files on disk. Video 1: 1920px / 24fps / q75
    },
    // Hard-step rests — 8 stops / 7 hops (commit-on-intent). Dropped 79/135/201/321.
    stops: [16, 52, 92, 142, 170, 235, 280, 328],
    scrollHint: 'SCROLL — 8 STOPS',
    // hop i = stop i → i+1. push = ease-in-out 800ms; baked = linear 1100ms.
    hops: [
      { pace: 'push' }, // 16→52 descent
      { pace: 'push' }, // 52→92 entrance → restaurant
      { pace: 'baked' }, // 92→142 restaurant → dining
      { pace: 'push' }, // 142→170 dining → lounge
      { pace: 'baked' }, // 170→235 lounge → suite
      { pace: 'push', blurBoost: 1.8 }, // 235→280 suite → spa (double-exposure stretch)
      { pace: 'push' }, // 280→328 spa → sphere
    ],
    chapters: [
      {
        id: 'approach',
        stopFrame: 16,
        kicker: 'ALPINE LAKESIDE RESORT · EVENING',
        title: 'THE LAKE HOLDS STILL',
        body: 'Wooded shore, warm windows, water without a ripple. You arrive the way the light does — over the lake.',
      },
      {
        id: 'restaurant',
        stopFrame: 92,
        kicker: 'THE RESTAURANT',
        title: 'The doors are already open.',
        body: 'Carved doors give way to candlelight. The kitchen is already at work; the glass keeps the lake in view.',
      },
      {
        id: 'lounge',
        stopFrame: 170,
        kicker: 'THE LOUNGE',
        title: 'Dinner ends where the fire begins.',
        body: 'Past the long tables the room lowers its voice. A fireplace runs the length of the wall and takes over the conversation.',
      },
      {
        id: 'suite',
        stopFrame: 235,
        kicker: 'THE SUITE',
        title: 'A bed beneath a circle of sky.',
        body: 'Glass on three sides, mountains on all of them. The skylight keeps the last blue of the evening.',
      },
      {
        id: 'spa',
        stopFrame: 280,
        kicker: 'THE SPA',
        title: 'Warm water, kept dark.',
        body: 'The pool runs the length of the room; the sauna glows like a lantern. Steam on the glass, cedar in the air.',
      },
      {
        id: 'return',
        stopFrame: 328,
        kicker: 'THE RETURN',
        title: 'And the lake, again.',
        body: 'You leave the way you came — slowly, over water. Or you stay another night. Most do.',
      },
    ],
  },

  manifesto: {
    kicker: 'THE MERIDIAN · ZELL AM SEE',
    lines: [
      'A house held above the water.',
      'Light that arrives slowly.',
      'Rooms that keep the evening.',
    ],
  },

  factsBar: {
    items: [
      { value: 42, label: 'Suites & residences' },
      { value: 25, suffix: ' m', label: 'Infinity pool' },
      { value: 1400, format: 'en', suffix: ' m²', label: 'Spa' },
      { value: 4, label: 'Restaurants & bars' },
    ],
  },

  // Home ROOMS section (lasala d-carousel-rooms / hutstuf featured-huts pattern) —
  // cards derive from suitesPage.suites (single source of truth), this block is the frame.
  rooms: {
    kicker: 'THE SUITES',
    title: 'Three ways to sleep on the lake.',
    body: 'Forty-two suites, three characters. Every one holds the water in view; the difference is what the room does with the sky.',
    linkLabel: 'All suites',
    linkHref: '/suites',
  },

  // /suites showcase page — categories along the story (what the property SELLS), not the media pile.
  // Missing images stay placeholders (ui.js is-missing panel) + a generation prompt in generation-sheet.md.
  suitesPage: {
    title: 'The Suites — THE MERIDIAN · Alpine Lakeside Resort',
    description:
      'Three ways to sleep on the lake: the Lake Suite with glass on three sides, the Circle Suite beneath a skylight of sky, and the Presidential Suite with a private terrace above the water. From €1,850.',
    kicker: 'THE SUITES',
    titleLine: 'Three ways to sleep on the lake.',
    intro:
      'Forty-two suites, three characters. Every one of them holds the water in view; the difference is what the room does with the sky.',
    indexHint: 'SELECT A SUITE',
    enquireLabel: 'Enquire about this suite',
    suites: [
      {
        id: 'lake',
        name: 'Lake Suite',
        line: 'Glass on three sides — the lake decides the wallpaper.',
        facts: { area: '64 M²', sleeps: 'Sleeps 2', view: 'Lake, full width' },
        rate: 'From €1,850',
        hero: { src: '/media/suites/lake-hero.jpg', alt: 'Lake Suite — glass on three sides over the water' },
        details: [
          { src: '/media/suites/lake-window.jpg', alt: 'Lake Suite window seat at dusk', label: 'The window seat' },
          { src: '/media/suites/lake-bath.jpg', alt: 'Lake Suite bathroom with lake view', label: 'The bath' },
        ],
      },
      {
        id: 'circle',
        name: 'Circle Suite',
        line: 'A bed beneath a circle of sky.',
        facts: { area: '78 M²', sleeps: 'Sleeps 2', view: 'Sky + mountains' },
        rate: 'From €2,300',
        hero: { src: '/media/suites/circular.jpg', alt: 'Circle Suite — circular master suite on the lakeside' },
        details: [
          { src: '/media/spaces/suite.jpg', alt: 'Circle Suite bed beneath the skylight', label: 'The skylight' },
          { src: '/media/gallery/suite.jpg', alt: 'Circle Suite interior at evening', label: 'The evening' },
        ],
      },
      {
        id: 'presidential',
        name: 'Presidential Suite',
        line: 'A private terrace above the water. The lake keeps the noise.',
        facts: { area: '142 M²', sleeps: 'Sleeps 4', view: 'Lake + private terrace' },
        rate: 'From €4,600',
        hero: { src: '/media/suites/presidential.jpg', alt: 'Presidential Suite with lake view' },
        details: [
          { src: '/media/suites/presidential-terrace.jpg', alt: 'Presidential Suite private terrace above the water', label: 'The terrace' },
          { src: '/media/suites/presidential-living.jpg', alt: 'Presidential Suite living room', label: 'The living room' },
        ],
      },
    ],
  },

  dining: {
    kicker: 'DINING',
    title: 'The doors are already open.',
    body: 'Candlelight, lake glass, a kitchen that works without hurry. Four rooms to eat and drink — each one turned toward the water.',
    signature: 'Arrive hungry. Leave slower.',
    img: '/media/dining/restaurant-entrance.jpg',
    imgAlt: 'Restaurant entrance — golden open doors at evening',
    linkLabel: 'Explore the restaurant',
    linkHref: '/amenities/lakeside-restaurant',
  },

  amenities: {
    kicker: 'AMENITIES',
    title: 'Everything the lake allows.',
    items: [
      {
        slug: 'infinity-pool',
        label: 'Heated rooftop infinity pool',
        line: 'Twenty-five metres of warm water, edge open to the lake.',
        facts: ['25 m', 'heated year-round'],
        img: '/media/water/heated-pool.jpg',
      },
      {
        slug: 'panorama-spa',
        label: 'Panorama spa',
        line: 'Steam, cedar, and cold plunge — kept dark against the view.',
        facts: ['1,400 m²', 'sauna · steam · cold plunge'],
        img: '/media/water/spa.jpg',
      },
      {
        slug: 'lakeside-restaurant',
        label: 'Lakeside restaurant',
        line: 'Four rooms turned toward the water. The doors are already open.',
        facts: ['4 venues', 'the doors are already open'],
        img: '/media/dining/restaurant-entrance.jpg',
      },
      {
        slug: 'the-sphere',
        label: 'The Sphere',
        line: 'Tea under glass, suspended above the shore.',
        facts: ['tea, under glass', 'above the water'],
        img: '/media/sphere/tea-garden.jpg',
      },
      {
        slug: 'beach-boathouse',
        label: 'Private beach & boathouse',
        line: 'Your own shore. Boats when you ask for them.',
        facts: ['own shore', 'boats on request'],
        img: '/media/gallery/pavilion.jpg',
      },
      {
        slug: 'water-gardens',
        label: 'Water gardens',
        line: 'Landscaped ponds that hold the evening lights.',
        facts: ['landscaped ponds', 'evening lights'],
        img: '/media/gallery/water-gardens.jpg',
      },
      {
        slug: 'mountain-lake-guides',
        label: 'Mountain & lake guides',
        line: 'Private guides for summer trails and winter ice.',
        facts: ['private guides', 'summer & winter'],
        img: '/media/gallery/sky.jpg',
      },
    ],
  },

  // /amenities/[slug] detail pages — one entry per amenities.items slug.
  amenityPages: [
    {
      slug: 'infinity-pool',
      name: 'Heated rooftop infinity pool',
      kicker: 'THE POOL',
      hero: {
        img: '/media/water/heated-pool.jpg',
        alt: 'Heated rooftop infinity pool at evening, steam above the water',
      },
      statement: 'Warm water that forgets where the pool ends.',
      body: [
        'Twenty-five metres of heated infinity edge sit above the lake. Steam lifts in winter; in summer the water holds the last light of the day.',
        'Access is private to guests. Towels, robes, and quiet — the rest is the view.',
      ],
      editorial: [
        { img: '/media/water/terrace-pool.jpg', alt: 'Pool terrace looking over the lake', label: 'The terrace' },
        { img: '/media/gallery/sky.jpg', alt: 'Alpine lake and sky above the resort', label: 'The view' },
      ],
      facts: [
        { label: 'Length', value: '25 m' },
        { label: 'Season', value: 'Heated year-round' },
        { label: 'Access', value: 'Guests only' },
      ],
      services: ['Heated infinity edge', 'Loungers & shade', 'Towels and robes', 'Evening lighting'],
      pricing: [
        { label: 'Guests', value: 'Included' },
        { label: 'Private hire', value: 'On request' },
      ],
      hours: '06:00 – 22:00, daily',
      cta: { label: 'Enquire about the pool', href: '/?amenity=Heated%20rooftop%20infinity%20pool#enquire' },
    },
    {
      slug: 'panorama-spa',
      name: 'Panorama spa',
      kicker: 'THE SPA',
      hero: {
        img: '/media/water/spa.jpg',
        alt: 'Panorama spa — indoor pool and glass sauna with lake view',
      },
      statement: 'Warm water, kept dark against the mountains.',
      body: [
        'One thousand four hundred square metres of spa: sauna, steam, cold plunge, and a pool that runs the length of the glass.',
        'Treatments are unhurried. Book ahead for private sessions; the rest of the floor stays open to the view.',
      ],
      editorial: [
        { img: '/media/gallery/spa.jpg', alt: 'Spa lounge with warm lighting', label: 'The lounge' },
        { img: '/media/spaces/spa.jpg', alt: 'Spa pool under soft light', label: 'The water' },
      ],
      facts: [
        { label: 'Size', value: '1,400 m²' },
        { label: 'Facilities', value: 'Sauna · steam · cold plunge' },
        { label: 'Access', value: 'Guests · day spa on request' },
      ],
      services: ['Thermal circuit', 'Treatment rooms', 'Relaxation lounges', 'Private hire hours'],
      pricing: [
        { label: 'Guests', value: 'Included' },
        { label: 'Private session', value: 'From €120' },
      ],
      hours: '07:00 – 21:00, daily',
      cta: { label: 'Enquire about the spa', href: '/?amenity=Panorama%20spa#enquire' },
    },
    {
      slug: 'lakeside-restaurant',
      name: 'Lakeside restaurant',
      kicker: 'DINING',
      hero: {
        img: '/media/dining/restaurant-entrance.jpg',
        alt: 'Restaurant entrance — golden open doors at evening',
      },
      statement: 'The doors are already open.',
      body: [
        'Four venues share one kitchen and one shore: restaurant, dining room, lounge bar, and a quieter table by the glass.',
        'Candlelight, lake glass, a service that never hurries. Arrive hungry. Leave slower.',
      ],
      editorial: [
        { img: '/media/spaces/restaurant.jpg', alt: 'Restaurant interior with lake glass', label: 'The room' },
        { img: '/media/gallery/dining.jpg', alt: 'Dining table set for evening', label: 'The table' },
      ],
      facts: [
        { label: 'Venues', value: '4 rooms' },
        { label: 'Kitchen', value: 'Alpine · lake-led' },
        { label: 'Dress', value: 'Smart casual' },
      ],
      services: ['Dinner service', 'Lounge bar', 'Private dining', 'Wine list by the glass'],
      pricing: [
        { label: 'Dinner', value: 'À la carte' },
        { label: 'Private dining', value: 'On request' },
      ],
      hours: 'Dinner from 18:00 · Lounge until late',
      cta: { label: 'Enquire about dining', href: '/?amenity=Lakeside%20restaurant#enquire' },
    },
    {
      slug: 'the-sphere',
      name: 'The Sphere',
      kicker: 'THE SPHERE',
      hero: {
        img: '/media/sphere/tea-garden.jpg',
        alt: 'The Sphere — glass tea garden above the water',
      },
      statement: 'Tea, under glass, above the water.',
      body: [
        'A geodesic glass room holds tea service and quiet conversation. The shore sits just below; the mountains take the rest of the frame.',
        'Open through the afternoon into early evening. Reservations preferred when the light is best.',
      ],
      editorial: [
        { img: '/media/gallery/sky.jpg', alt: 'Lake and mountains beyond the Sphere', label: 'Outside' },
        { img: '/media/gallery/spa.jpg', alt: 'Warm interior light near the water', label: 'The hour' },
      ],
      facts: [
        { label: 'Setting', value: 'Glass · above the shore' },
        { label: 'Service', value: 'Tea & light fare' },
        { label: 'Capacity', value: 'Intimate' },
      ],
      services: ['Afternoon tea', 'Quiet seating', 'Lake outlook', 'Private booking'],
      pricing: [
        { label: 'Tea service', value: 'From €48' },
        { label: 'Private hire', value: 'On request' },
      ],
      hours: '14:00 – 19:00, daily',
      cta: { label: 'Enquire about The Sphere', href: '/?amenity=The%20Sphere#enquire' },
    },
    {
      slug: 'beach-boathouse',
      name: 'Private beach & boathouse',
      kicker: 'THE SHORE',
      hero: {
        img: '/media/gallery/pavilion.jpg',
        alt: 'Private shore pavilion with wooden boat on the lake',
      },
      statement: 'Your own shore. The lake starts here.',
      body: [
        'A private stretch of shore sits below the house — quiet water, a boathouse, and a pavilion for long afternoons.',
        'Boats and guides arrange on request. Summer mornings for swimming; evenings for nothing at all.',
      ],
      editorial: [
        { img: '/media/gallery/sky.jpg', alt: 'Open lake and alpine sky', label: 'The water' },
        { img: '/media/gallery/pavilion.jpg', alt: 'Shore pavilion at dusk', label: 'The pavilion' },
      ],
      facts: [
        { label: 'Shore', value: 'Private to guests' },
        { label: 'Boats', value: 'On request' },
        { label: 'Season', value: 'May – October' },
      ],
      services: ['Private beach access', 'Boathouse', 'Boat hire', 'Shore loungers'],
      pricing: [
        { label: 'Guests', value: 'Included' },
        { label: 'Boat outing', value: 'On request' },
      ],
      hours: 'Dawn – dusk in season',
      cta: { label: 'Enquire about the shore', href: '/?amenity=Private%20beach%20%26%20boathouse#enquire' },
    },
    {
      slug: 'water-gardens',
      name: 'Water gardens',
      kicker: 'THE GARDENS',
      hero: {
        img: '/media/gallery/water-gardens.jpg',
        alt: 'Water gardens with lit ponds at evening',
      },
      statement: 'Ponds that hold the evening lights.',
      body: [
        'Landscaped water gardens step down toward the lake — still ponds, soft paths, lights that come on as the day leaves.',
        'Open to guests at all hours. A quieter walk when the house is loud.',
      ],
      editorial: [
        { img: '/media/gallery/pavilion.jpg', alt: 'Garden path near the shore pavilion', label: 'The path' },
        { img: '/media/gallery/water-gardens.jpg', alt: 'Lit ponds in the water gardens', label: 'Evening' },
      ],
      facts: [
        { label: 'Character', value: 'Landscaped ponds' },
        { label: 'Light', value: 'Evening illumination' },
        { label: 'Access', value: 'Guests · open paths' },
      ],
      services: ['Garden walks', 'Evening lighting', 'Quiet seating', 'Photo moments'],
      pricing: [{ label: 'Guests', value: 'Included' }],
      hours: 'Open always',
      cta: { label: 'Enquire about the gardens', href: '/?amenity=Water%20gardens#enquire' },
    },
    {
      slug: 'mountain-lake-guides',
      name: 'Mountain & lake guides',
      kicker: 'THE GUIDES',
      hero: {
        img: '/media/gallery/sky.jpg',
        alt: 'Alpine lake and mountain peaks under open sky',
      },
      statement: 'Private guides for the lake and the ridge.',
      body: [
        'Summer trails, winter ice, and still water in between. One call books a private guide — half-day or full, on foot or on the lake.',
        'We arrange transfers, kit, and timing so the day stays simple. You only decide how far you want to go.',
      ],
      editorial: [
        { img: '/media/gallery/pavilion.jpg', alt: 'Shore and boat ready for a lake outing', label: 'On the water' },
        { img: '/media/gallery/sky.jpg', alt: 'Mountain sky above the lake', label: 'The ridge' },
      ],
      facts: [
        { label: 'Season', value: 'Summer & winter' },
        { label: 'Style', value: 'Private only' },
        { label: 'Lead time', value: '24 hours preferred' },
      ],
      services: ['Hiking guides', 'Lake outings', 'Winter routes', 'Kit & transfers'],
      pricing: [
        { label: 'Half-day', value: 'From €280' },
        { label: 'Full-day', value: 'From €480' },
      ],
      hours: 'By arrangement',
      cta: { label: 'Enquire about guides', href: '/?amenity=Mountain%20%26%20lake%20guides#enquire' },
    },
  ],

  about: {
    kicker: 'THE HOUSE',
    title: 'Built for the long evening.',
    paragraphs: [
      'The Meridian sits on a private shore of Zell am See. Forty-two suites and residences, a spa kept dark, water that forgets the edge of the pool.',
      'We open the doors at dusk. The rest of the night is yours — or another night, if the lake asks you to stay.',
    ],
    img: '/media/gallery/foyer.jpg',
    imgAlt: 'The Meridian foyer at evening',
  },

  rate: {
    kicker: 'THE RATE',
    amount: 'From €1,850',
    line: 'One suite, one evening above the water.',
  },

  agent: {
    kicker: 'YOUR HOST',
    name: 'Alexandra Cole',
    role: 'Director, Guest Relations',
    lines: ['Arrivals are private and unhurried.', 'One call arranges everything else.'],
    // No portrait asset yet — typographic card. Set showPortrait: true when /media/agent/alexandra.jpg lands.
    showPortrait: false,
    img: '/media/agent/alexandra.jpg',
    imgAlt: 'Alexandra Cole — Guest Relations, The Meridian',
  },

  cta: {
    kicker: 'REQUEST',
    title: 'Stay on the lake.',
    sub: 'We reply the same day. Arrivals from 3 pm; the evening is yours.',
    priceLine: 'From €1,850 · Suites & Residences',
    fields: { date: 'Arrival date', name: 'Name', email: 'Email' },
    submit: 'Request a Stay',
    toast: 'Thank you — your request has been received. Alexandra will reach out shortly.',
  },

  footer: {
    wordmark: 'THE MERIDIAN',
    note: 'Concept demo · Convenium',
    legal: 'THE MERIDIAN is a fictional resort. All visuals AI-generated.',
  },
};

export type Skin = typeof skin;
