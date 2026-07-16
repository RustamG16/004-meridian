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
    display: 'Fraunces',
    body: 'Manrope',
    href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&family=Manrope:wght@300;400;500&display=swap',
  },

  tokens: {
    // spruce ink (HBA green-charcoal, warmed to the footage) + champagne window light
    bg: '#091D1E', // spruce-ink green-charcoal
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
      { label: 'Gallery', href: '#gallery' },
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
      { at: 0.5, label: 'THE LOUNGE' },
      { at: 0.67, label: 'THE SUITE' },
      { at: 0.825, label: 'THE SPA' },
      { at: 0.93, label: 'THE LAKE' },
    ],
  },

  journey: {
    // one continuous drone glide: sky → restaurant → dining → lounge → suite → spa → the lake again.
    // 6 clips, joins blended in the frame sequence (assemble.py), never inside a clip.
    frames: {
      path: '/frames/hero/frame_',
      ext: '.webp',
      pad: 4,
      count: 452, // fallback only — index.astro counts the files on disk. 1920px / 8fps / q75, frame-locked joins (no dissolves)
      mobilePath: '/frames/hero-mobile/frame_',
      mobileCount: 452, // full tour on mobile too (720px/q60) — was clips 1+6 with a dissolve join
    },
    scrollHint: 'SCROLL',
    chapters: [
      {
        id: 'approach',
        kicker: 'ALPINE LAKESIDE RESORT · EVENING',
        title: 'THE LAKE HOLDS STILL',
        body: 'Wooded shore, warm windows, water without a ripple. You arrive the way the light does — over the lake.',
      },
      {
        id: 'restaurant',
        kicker: 'THE RESTAURANT',
        title: 'The doors are already open.',
        body: 'Carved doors give way to candlelight. The kitchen is already at work; the glass keeps the lake in view.',
      },
      {
        id: 'lounge',
        kicker: 'THE LOUNGE',
        title: 'Dinner ends where the fire begins.',
        body: 'Past the long tables the room lowers its voice. A fireplace runs the length of the wall and takes over the conversation.',
        rooms: [
          {
            name: 'The Restaurant',
            line: 'Candlelight, lake glass, a table that waits.',
            img: '/media/spaces/restaurant.jpg',
          },
          {
            name: 'The Suite',
            line: 'A bed beneath a circle of sky.',
            img: '/media/spaces/suite.jpg',
          },
          {
            name: 'The Spa',
            line: 'Warm water, kept dark.',
            img: '/media/spaces/spa.jpg',
          },
        ],
      },
      {
        id: 'suite',
        kicker: 'THE SUITE',
        title: 'A bed beneath a circle of sky.',
        body: 'Glass on three sides, mountains on all of them. The skylight keeps the last blue of the evening.',
      },
      {
        id: 'spa',
        kicker: 'THE SPA',
        title: 'Warm water, kept dark.',
        body: 'The pool runs the length of the room; the sauna glows like a lantern. Steam on the glass, cedar in the air.',
      },
      {
        id: 'return',
        kicker: 'THE RETURN',
        title: 'And the lake, again.',
        body: 'You leave the way you came — slowly, over water. Or you stay another night. Most do.',
      },
    ],
  },

  facts: {
    kicker: 'THE MERIDIAN IN NUMBERS',
    items: [
      { value: 42, label: 'Suites & Residences', line: 'each one held above the water' },
      { value: 25, label: 'Metres of Infinity Pool', suffix: '', line: 'it forgets where the lake begins' },
      { value: 1400, label: 'Square Metres of Spa', format: 'en', line: 'warm water, kept dark' },
      { value: 4, label: 'Restaurants & Bars', line: 'the doors are already open' },
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

  // Location/setting beat (lasala d-location / hutstuf featured-locations) — full-bleed aerial + meta.
  location: {
    kicker: 'THE SETTING',
    title: 'An hour from anywhere. A minute from the water.',
    img: '/media/gallery/sky.jpg',
    imgAlt: 'The Meridian resort on the alpine lake at dusk',
    items: [
      { label: 'Altitude', value: '1,020 m' },
      { label: 'Shoreline', value: '480 m, private' },
      { label: 'Nearest town', value: '12 min by boat' },
      { label: 'Transfer', value: '90 min from the airport' },
    ],
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

  sphere: {
    kicker: 'THE SPHERE',
    line: 'Tea, under glass, above the water.',
    img: '/media/sphere/tea-garden.jpg',
    imgAlt: 'Tea garden inside a glass sphere',
  },

  water: {
    kicker: 'THE WATER',
    title: 'Warm water, kept dark.',
    body: 'Fourteen hundred square metres of spa. An infinity pool that forgets where the lake begins. Steam on the glass, cedar in the air.',
    images: [
      {
        src: '/media/water/spa.jpg',
        alt: 'Wellness spa interior',
        caption: 'Spa · 1,400 m²',
      },
      {
        src: '/media/water/terrace-pool.jpg',
        alt: 'Terrace infinity pool',
        caption: 'Terrace pool · Evening',
      },
      {
        src: '/media/water/heated-pool.jpg',
        alt: 'Heated infinity pool lakeside',
        caption: 'Infinity · Lakeside',
      },
    ],
  },

  amenities: {
    kicker: 'AMENITIES',
    title: 'Everything the lake allows.',
    // img is optional — a preview only exists where a TRUE image exists (law 3:
    // never attach a wrong-but-available image; missing ones stay type-only).
    items: [
      { label: 'Heated rooftop infinity pool', img: '/media/water/terrace-pool.jpg' },
      { label: 'Lakeside restaurant', img: '/media/spaces/restaurant.jpg' },
      { label: 'Panorama spa — sauna & steam', img: '/media/water/spa.jpg' },
      { label: 'Private beach & boathouse' },
      { label: 'Natural swimming pond' },
      { label: 'Suites with circle skylights', img: '/media/spaces/suite.jpg' },
      { label: 'Lounge with linear fireplace', img: '/media/gallery/lounge.jpg' },
      { label: 'Water gardens', img: '/media/gallery/water-gardens.jpg' },
      { label: 'Mountain & lake guides' },
      { label: 'Wine cellar dinners' },
      { label: 'Boat transfers' },
      { label: '24-hour concierge' },
    ],
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

  gallery: {
    kicker: 'GALLERY',
    hint: 'HOLD & DRAG',
    images: [
      { src: '/media/gallery/sky.jpg', alt: 'The resort at dusk' },
      { src: '/media/gallery/doors.jpg', alt: 'The restaurant doors' },
      { src: '/media/gallery/dining.jpg', alt: 'The dining room' },
      { src: '/media/gallery/lounge.jpg', alt: 'The lounge fireplace' },
      { src: '/media/gallery/suite.jpg', alt: 'The suite' },
      { src: '/media/gallery/spa.jpg', alt: 'The spa pool' },
      { src: '/media/gallery/pool-night.jpg', alt: 'The infinity pool at night' },
      { src: '/media/gallery/water-gardens.jpg', alt: 'The water gardens' },
      { src: '/media/gallery/foyer.jpg', alt: 'The resort foyer' },
      { src: '/media/gallery/pavilion.jpg', alt: 'The restaurant pavilion from above' },
    ],
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
