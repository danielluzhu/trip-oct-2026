import data from "./data.json";

const trip = data.trip;
const stopInfo = (data as any).flightStops;
const IDEAS_PATH = `${import.meta.dir}/ideas.json`;

const PARTY = { nyc: 3, sf: 2, seattle: 1 };

const DAYS = [
  "Day 1 · Fri 10/16 (Arrival)",
  "Day 2 · Sat 10/17",
  "Day 3 · Sun 10/18",
  "Day 4 · Mon 10/19 (Departure)",
];

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function money(range: { low: number; high: number }) {
  return `${fmt(range.low)}-${fmt(range.high)}`;
}

function midpoint(range: { low: number; high: number }) {
  return (range.low + range.high) / 2;
}

// Nonstop status per origin. "seasonal" means a nonstop exists in the schedule
// but the route dies sometime in October, usually with no published last day.
// Each leg carries its own label because the useful fact is usually a date --
// "Nonstop thru Oct 24" says more than "seasonal".
const STOP_LABELS: Record<string, string> = {
  nonstop: "Nonstop",
  partial: "Nonstop, wrong days",
  connect: "Connecting only",
};

function stopPill(
  leg: { stops?: string; stopLabel?: string; note?: string },
  withTitle = true,
) {
  const kind = leg.stops ?? "connect";
  const label = leg.stopLabel ?? STOP_LABELS[kind] ?? kind;
  const title = withTitle && leg.note ? ` title="${escapeHtml(leg.note)}"` : "";
  return `<span class="pill ${kind}"${title}>${label}</span>`;
}

const ORIGINS = [
  { key: "nyc", label: "NYC", seats: PARTY.nyc, airports: "LGA/JFK/EWR" },
  { key: "sf", label: "SF Bay", seats: PARTY.sf, airports: "SFO/SJC/OAK" },
  { key: "seattle", label: "Seattle", seats: PARTY.seattle, airports: "SEA" },
] as const;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const locations = data.locations
  .map((loc) => {
    const mid = {
      nyc: midpoint(loc.flights.nyc),
      sf: midpoint(loc.flights.sf),
      seattle: midpoint(loc.flights.seattle),
    };
    const groupTotal =
      mid.nyc * PARTY.nyc + mid.sf * PARTY.sf + mid.seattle * PARTY.seattle;
    const groupLow =
      loc.flights.nyc.low * PARTY.nyc +
      loc.flights.sf.low * PARTY.sf +
      loc.flights.seattle.low * PARTY.seattle;
    const groupHigh =
      loc.flights.nyc.high * PARTY.nyc +
      loc.flights.sf.high * PARTY.sf +
      loc.flights.seattle.high * PARTY.seattle;
    return { ...loc, airfare: { mid, groupTotal, groupLow, groupHigh } };
  })
  .sort((a, b) => a.airfare.groupTotal - b.airfare.groupTotal);

type Idea = {
  id: string;
  day: string;
  text: string;
  author: string;
  createdAt: number;
};

async function loadIdeas(): Promise<Idea[]> {
  try {
    const raw = await Bun.file(IDEAS_PATH).json();
    return raw.ideas ?? [];
  } catch {
    return [];
  }
}

async function saveIdeas(ideas: Idea[]) {
  await Bun.write(IDEAS_PATH, JSON.stringify({ ideas }, null, 2));
}

const sharedStyle = /* css */ `
  :root {
    color-scheme: light dark;
    --bg: #faf7f2;
    --bg-alt: #f3eee5;
    --card: #ffffff;
    --text: #1a1714;
    --muted: #6f6659;
    --border: #e7e0d4;
    --accent: #a8481c;
    --accent-2: #35543f;
    --on-dark: #f6f1e8;
    --shadow: 0 1px 2px rgba(26,23,20,.04), 0 10px 30px -14px rgba(26,23,20,.18);
    --radius: 16px;
    --display: "Fraunces", ui-serif, Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #100e0c;
      --bg-alt: #171411;
      --card: #1b1815;
      --text: #f2ece1;
      --muted: #9d9384;
      --border: #2c2721;
      --accent: #e08a4e;
      --accent-2: #8fb89c;
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 14px 34px -16px rgba(0,0,0,.75);
    }
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ---------- hero ---------- */
  .hero {
    position: relative;
    min-height: clamp(300px, 54vh, 540px);
    display: flex;
    align-items: flex-end;
    background-image: var(--hero);
    background-size: cover;
    background-position: center;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(10,8,6,.42) 0%, rgba(10,8,6,.06) 30%, rgba(10,8,6,.55) 72%, rgba(10,8,6,.88) 100%);
  }
  .hero-inner {
    position: relative;
    width: 100%;
    max-width: 940px;
    margin: 0 auto;
    padding: 2rem 1.5rem 2.4rem;
    color: var(--on-dark);
    text-shadow: 0 1px 14px rgba(8,6,4,.55), 0 1px 3px rgba(8,6,4,.4);
  }
  .eyebrow {
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    opacity: .82;
    margin-bottom: .7rem;
  }
  .hero h1 {
    font-family: var(--display);
    font-weight: 600;
    font-size: clamp(2.3rem, 7vw, 4.4rem);
    line-height: 1.02;
    letter-spacing: -.02em;
    margin: 0 0 .5rem;
    text-wrap: balance;
  }
  .hero .tagline {
    margin: 0;
    font-size: clamp(.95rem, 2vw, 1.12rem);
    max-width: 46ch;
    opacity: .93;
    text-wrap: pretty;
  }
  .hero-credit {
    position: absolute;
    right: .7rem;
    bottom: .45rem;
    font-size: .62rem;
    color: rgba(255,255,255,.5);
    letter-spacing: .03em;
  }

  /* ---------- nav ---------- */
  nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: .35rem;
    padding: .6rem 1rem;
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: saturate(1.6) blur(12px);
    border-bottom: 1px solid var(--border);
  }
  nav a {
    color: var(--muted);
    text-decoration: none;
    font-size: .82rem;
    font-weight: 600;
    padding: .42rem .95rem;
    border-radius: 999px;
    transition: color .15s, background .15s;
  }
  nav a:hover { color: var(--text); background: var(--bg-alt); }
  nav a.active { color: var(--on-dark); background: var(--accent); }

  /* ---------- layout ---------- */
  main {
    max-width: 940px;
    margin: 0 auto;
    padding: 2.2rem 1.5rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.7rem;
    box-shadow: var(--shadow);
    overflow-x: auto;
  }
  .card h2 {
    font-family: var(--display);
    font-weight: 600;
    font-size: clamp(1.35rem, 3vw, 1.85rem);
    line-height: 1.15;
    letter-spacing: -.015em;
    margin: 0 0 .3rem;
  }
  .card h3 {
    font-family: var(--display);
    font-weight: 600;
    font-size: 1.1rem;
    margin: 0 0 .2rem;
  }
  .subtitle {
    color: var(--muted);
    font-size: .9rem;
    margin-bottom: .9rem;
  }
  .section-label {
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .15em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 1.5rem 0 .5rem;
  }
  footer {
    text-align: center;
    color: var(--muted);
    font-size: .78rem;
    padding: 2rem 1.5rem 3rem;
    border-top: 1px solid var(--border);
  }

  /* ---------- tables ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: .89rem;
    margin: .3rem 0;
  }
  th {
    text-align: left;
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    padding: .4rem .6rem .4rem 0;
    border-bottom: 1px solid var(--border);
  }
  td {
    padding: .58rem .6rem .58rem 0;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  tr:last-child td { border-bottom: none; }
  td:first-child { color: var(--muted); width: 38%; }
  td strong { color: var(--text); }
  .group-total { font-weight: 700; }
  .muted-cell { color: var(--muted); font-size: .82rem; }

  /* ---------- photos ---------- */
  .photos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: .7rem;
    margin: .2rem 0 1.2rem;
  }
  .photos figure { margin: 0; }
  .photos img {
    width: 100%;
    aspect-ratio: 3/2;
    object-fit: cover;
    border-radius: 12px;
    display: block;
    filter: saturate(1.04);
  }
  .photos figcaption {
    font-size: .74rem;
    color: var(--muted);
    margin-top: .35rem;
  }

  /* ---------- lists ---------- */
  ul.sites, ul.ideas-list { margin: .4rem 0; padding-left: 1.1rem; }
  ul.sites li, ul.ideas-list li { margin: .32rem 0; font-size: .9rem; }
  ul.ideas-list { list-style: none; padding-left: 0; }
  li.idea {
    background: var(--bg-alt);
    border-radius: 10px;
    padding: .6rem .8rem;
    margin: .4rem 0;
  }
  .idea-meta { font-size: .74rem; color: var(--muted); margin-top: .2rem; }
  .idea-empty { color: var(--muted); font-size: .86rem; font-style: italic; }
  .verdict {
    margin-top: 1.1rem;
    padding: .8rem 1rem;
    background: var(--bg-alt);
    border-left: 3px solid var(--accent);
    border-radius: 0 10px 10px 0;
    font-size: .9rem;
  }

  /* ---------- buttons ---------- */
  form.add-idea { display: flex; flex-wrap: wrap; gap: .5rem; }
  form.add-idea input[type="text"] {
    flex: 1 1 160px;
    padding: .58rem .75rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: .88rem;
  }
  form.add-idea input[name="text"] { flex: 3 1 240px; }
  form.add-idea button {
    padding: .58rem 1.2rem;
    border-radius: 10px;
    border: none;
    background: var(--accent);
    color: var(--on-dark);
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
  }
  a.add-idea-link {
    display: inline-block;
    padding: .58rem 1.1rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--accent);
    font-size: .86rem;
    font-weight: 700;
    text-decoration: none;
    transition: background .15s, color .15s, border-color .15s;
  }
  a.add-idea-link:hover {
    background: var(--accent);
    color: var(--on-dark);
    border-color: var(--accent);
  }
  a.cta {
    display: block;
    text-align: center;
    padding: .95rem 1.2rem;
    border-radius: 12px;
    background: var(--accent);
    color: var(--on-dark);
    font-weight: 700;
    text-decoration: none;
    margin: 1.1rem 0 .6rem;
    box-shadow: 0 6px 18px -8px var(--accent);
    transition: transform .12s, filter .12s;
  }
  a.cta:hover { filter: brightness(1.08); transform: translateY(-1px); }

  /* ---------- badges & notes ---------- */
  .pick-badge {
    display: inline-block;
    background: var(--accent);
    color: var(--on-dark);
    font-size: .66rem;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
    padding: .3rem .7rem;
    border-radius: 999px;
    margin-bottom: .7rem;
  }
  .filter-note, .calc-note {
    font-size: .8rem;
    color: var(--muted);
    margin: .5rem 0;
  }
  .caveat {
    font-size: .83rem;
    color: var(--muted);
    border-left: 3px solid var(--border);
    padding: .7rem 1rem;
    margin-top: 1rem;
    background: var(--bg-alt);
    border-radius: 0 10px 10px 0;
  }
  .caveat code {
    font-size: .78rem;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    padding: .1rem .3rem;
    border-radius: 4px;
  }
  .quality {
    font-size: .76rem;
    color: var(--muted);
    margin-top: .6rem;
    padding-left: .7rem;
    border-left: 2px solid var(--accent-2);
  }
  .card a:not(.cta):not(.add-idea-link) {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
    font-weight: 600;
  }
  .card a:not(.cta):not(.add-idea-link):hover {
    border-bottom-color: var(--accent);
  }
  .alert {
    background: color-mix(in srgb, var(--accent) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
    border-radius: 10px;
    padding: .8rem 1rem;
    font-size: .92rem;
    margin-bottom: 1rem;
  }
  .pill {
    display: inline-block;
    font-size: .64rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: .16rem .55rem;
    border-radius: 999px;
  }
  .pill.ok { background: color-mix(in srgb, var(--accent-2) 22%, transparent); color: var(--accent-2); }
  .pill.gone { background: rgba(190,60,60,.16); color: #c25555; }
  .pill.nonstop { background: color-mix(in srgb, var(--accent-2) 22%, transparent); color: var(--accent-2); }
  .pill.partial { background: rgba(196,140,40,.18); color: #b8842a; }
  .pill.connect { background: rgba(190,60,60,.16); color: #c25555; }

  /* ---------- city comparison ---------- */
  .table-scroll { overflow-x: auto; margin: .3rem -.2rem .2rem; padding: 0 .2rem; }
  table.compare { min-width: 720px; }
  table.compare td:first-child { color: var(--text); width: 22%; }
  table.compare td { vertical-align: top; }
  .cmp-pick td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
  .fare { font-weight: 600; white-space: nowrap; display: block; margin-bottom: .3rem; }
  .cmp-name { display: flex; align-items: baseline; gap: .4rem; flex-wrap: wrap; }
  .routes { margin-top: 1.4rem; display: flex; flex-direction: column; gap: .5rem; }
  .routes details {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: .6rem .9rem;
    background: var(--bg-alt);
  }
  .routes summary { cursor: pointer; font-weight: 600; font-size: .9rem; }
  .routes summary .muted-cell { font-weight: 400; }
  .routes ul { margin: .7rem 0 .2rem; padding-left: 0; list-style: none; }
  .routes li { font-size: .86rem; margin-bottom: .55rem; line-height: 1.5; }
  .routes li .leg { font-weight: 700; margin-right: .35rem; }
  .routes li .pill { margin-right: .4rem; }

  /* ---------- housing areas ---------- */
  .areas { display: flex; flex-direction: column; gap: 1.8rem; }
  .area {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 1.2rem;
    align-items: stretch;
  }
  .area img {
    width: 100%;
    height: 100%;
    min-height: 210px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: var(--shadow);
  }
  .area-vibe { font-size: .89rem; color: var(--muted); margin: .5rem 0 .8rem; }
  @media (max-width: 620px) {
    .area { grid-template-columns: 1fr; }
    .area img { min-height: 0; aspect-ratio: 16/9; }
    .hero { min-height: 340px; }
    .card { padding: 1.25rem; }
    .total-row { gap: 1.6rem; }
  }

  /* ---------- calculator ---------- */
  .calc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: .8rem;
    margin: .4rem 0 .2rem;
  }
  .calc-grid label {
    display: flex;
    flex-direction: column;
    gap: .28rem;
    font-size: .74rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .calc-grid input, .calc-grid select {
    padding: .58rem .7rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: .95rem;
    font-family: var(--sans);
  }
  .calc-grid input:focus, .calc-grid select:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .total-row {
    display: flex;
    gap: 3rem;
    flex-wrap: wrap;
    margin-top: 1.2rem;
    padding-top: 1.2rem;
    border-top: 1px solid var(--border);
  }
  .total-label {
    display: block;
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .total-big {
    font-family: var(--display);
    font-size: clamp(1.9rem, 5vw, 2.6rem);
    font-weight: 600;
    letter-spacing: -.02em;
  }
  .total-big.accent { color: var(--accent); }

  /* ---------- itinerary timeline ---------- */
  ol.timeline {
    list-style: none;
    margin: 1.2rem 0 .4rem;
    padding: 0 0 0 1.2rem;
    border-left: 2px solid var(--border);
  }
  ol.timeline li {
    position: relative;
    padding: 0 0 1.4rem 1rem;
  }
  ol.timeline li:last-child { padding-bottom: .2rem; }
  ol.timeline li::before {
    content: "";
    position: absolute;
    left: -1.53rem;
    top: .45rem;
    width: .58rem;
    height: .58rem;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 4px var(--card);
  }
  ol.timeline .when {
    font-size: .67rem;
    text-transform: uppercase;
    letter-spacing: .13em;
    color: var(--accent);
    font-weight: 800;
  }
  ol.timeline .what { margin-top: .18rem; font-size: 1rem; }
  ol.timeline .detail {
    font-size: .87rem;
    color: var(--muted);
    margin-top: .28rem;
    text-wrap: pretty;
  }
  ol.timeline .cost {
    font-size: .72rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    border-radius: 6px;
    padding: .12rem .45rem;
    white-space: nowrap;
    margin-left: .3rem;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    * { transition: none !important; }
  }
`;

// Static mode renders the site to flat files for GitHub Pages, where there is no
// server to accept idea submissions. Nav becomes relative links and the add-idea
// form becomes a pre-filled GitHub issue.
const STATIC = process.env.STATIC === "1";
const REPO = "danielluzhu/trip-oct-2026";

type Route = "/" | "/housing" | "/costs" | "/itinerary";
type Nav = "home" | "housing" | "costs" | "itinerary";

function href(path: Route) {
  if (!STATIC) return path;
  return path === "/" ? "./index.html" : `.${path}.html`;
}

function addIdeaBlock(day: string) {
  if (!STATIC) {
    return `<form class="add-idea" method="POST" action="/itinerary/add">
      <input type="hidden" name="day" value="${escapeHtml(day)}">
      <input type="text" name="text" placeholder="Add an idea (activity, restaurant, etc.)" required maxlength="280">
      <input type="text" name="author" placeholder="Your name (optional)" maxlength="40">
      <button type="submit">Add</button>
    </form>`;
  }

  const params = new URLSearchParams({
    labels: "idea",
    title: `Idea: ${day}`,
    body: `**Day:** ${day}\n\n**Idea:**\n<!-- what do you want to do? -->\n`,
  });
  return `<a class="add-idea-link" href="https://github.com/${REPO}/issues/new?${escapeHtml(
    params.toString(),
  )}" target="_blank" rel="noopener">+ Suggest an idea on GitHub &rarr;</a>`;
}

const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const img = (file: string, width: number) =>
  `${COMMONS}${encodeURIComponent(file)}?width=${width}`;

// One hero per page. All Wikimedia Commons, all verified to resolve.
const HEROES: Record<Nav, { file: string; credit: string; heading: string; tagline: string }> = {
  home: {
    file: "Lake McDonald Panorama - Montana - Glacier National Park (29788703722).jpg",
    credit: "Lake McDonald panorama",
    heading: "Homeless in Montana",
    tagline:
      "Three nights in the Flathead Valley, at the gate of Glacier, in the last week before the mountain shuts for winter.",
  },
  housing: {
    file: "Whitefish Lake from State Beach to Whitefish Mountain Resort Autumn Courtesy of Mike Koopal.jpg",
    credit: "Whitefish Lake in autumn",
    heading: "Somewhere with a porch",
    tagline:
      "Five places to base within an hour of the park entrance, what they cost once the fees land, and how good the numbers are.",
  },
  costs: {
    file: "Sunrise at Swiftcurrent Lake as seen from the Many Glacier Hotel (48490111337).jpg",
    credit: "Sunrise at Swiftcurrent Lake, Many Glacier",
    heading: "What it runs",
    tagline:
      "Flights, a cabin, two trucks and four days of eating — add it up before anyone books anything.",
  },
  itinerary: {
    file: "Wild Goose Island Overlook (54004237332).jpg",
    credit: "Wild Goose Island, St. Mary Lake",
    heading: "The plan",
    tagline:
      "What you can actually do at Glacier in the third week of October, once the high country closes.",
  },
};

function layout(activeNav: Nav, title: string, body: string) {
  const hero = HEROES[activeNav];
  return /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">
<style>${sharedStyle}</style>
</head>
<body>
<header class="hero" style="--hero:url('${img(hero.file, 2000)}')">
  <div class="hero-inner">
    <div class="eyebrow">${trip.datesShort} &middot; ${trip.groupSize} people</div>
    <h1>${hero.heading}</h1>
    <p class="tagline">${hero.tagline}</p>
  </div>
  <div class="hero-credit">${hero.credit} &middot; Wikimedia Commons</div>
</header>
<nav>
  <a href="${href("/")}" class="${activeNav === "home" ? "active" : ""}">Montana</a>
  <a href="${href("/housing")}" class="${activeNav === "housing" ? "active" : ""}">Housing</a>
  <a href="${href("/costs")}" class="${activeNav === "costs" ? "active" : ""}">Cost calculator</a>
  <a href="${href("/itinerary")}" class="${activeNav === "itinerary" ? "active" : ""}">Itinerary &amp; ideas</a>
</nav>
<main>
${body}
</main>
<footer>
  ${escapeHtml(trip.title)} &middot; ${trip.dates}<br>
  Photography from Wikimedia Commons. Prices researched, not quoted &mdash; check before you book.
</footer>
</body>
</html>`;
}

const PICK = "Montana";

function homePage() {
  const picked = locations.find((l) => l.name === PICK)!;
  const alsoRan = locations.filter((l) => l.name !== PICK);

  const compare = `
  <section class="card">
    <h2>Airfare, city by city</h2>
    <div class="subtitle">Every option on the short list, split by where people are actually flying from &mdash; ${PARTY.nyc} from NYC, ${PARTY.sf} from SF, ${PARTY.seattle} from Seattle &mdash; with whether that leg is actually a nonstop on Oct 16-19, and the last day any seasonal nonstop flies</div>
    <div class="table-scroll">
    <table class="compare">
      <tr>
        <th>Where</th>
        ${ORIGINS.map((o) => `<th>${o.label} &times;${o.seats}<br><span class="muted-cell">${o.airports}</span></th>`).join("\n        ")}
        <th>Group airfare</th>
        <th>Cabin/night</th>
      </tr>
      ${locations
        .map(
          (loc) => `<tr class="${loc.name === PICK ? "cmp-pick" : ""}">
        <td>
          <div class="cmp-name"><strong>${loc.name}</strong>${loc.name === PICK ? `<span class="pill ok">picked</span>` : ""}</div>
          <span class="muted-cell">${(loc as any).airport ?? loc.subtitle}</span>
        </td>
        ${ORIGINS.map((o) => {
          const leg = (loc.flights as any)[o.key];
          return `<td><span class="fare">${money(leg)} pp</span>${stopPill(leg)}</td>`;
        }).join("\n        ")}
        <td class="group-total">${fmt(loc.airfare.groupLow)}-${fmt(loc.airfare.groupHigh)}</td>
        <td>${loc.airbnb.nightly}</td>
      </tr>`,
        )
        .join("\n      ")}
    </table>
    </div>
    <div class="routes">
      ${locations
        .map(
          (loc) => `<details${loc.name === PICK ? " open" : ""}>
        <summary>${loc.name} <span class="muted-cell">&mdash; ${(loc as any).airport ?? loc.subtitle}</span></summary>
        <ul>
          ${ORIGINS.map((o) => {
            const leg = (loc.flights as any)[o.key];
            return `<li><span class="leg">${o.label}</span>${stopPill(leg, false)} ${money(leg)} pp &mdash; ${escapeHtml(leg.note ?? "")}</li>`;
          }).join("\n          ")}
        </ul>
      </details>`,
        )
        .join("\n      ")}
    </div>
    <div class="caveat">${escapeHtml(stopInfo.note)}</div>
  </section>`;

  const runnerUps = `
  <section class="card">
    <h2>Also considered</h2>
    <div class="subtitle">The other four on the short list, for the record</div>
    <table>
      <tr><th>Where</th><th>Why not</th></tr>
      ${alsoRan
        .map(
          (loc) => `<tr>
        <td><strong>${loc.name}</strong><br><span class="muted-cell">${loc.subtitle}</span></td>
        <td>${loc.verdict}</td>
      </tr>`,
        )
        .join("\n      ")}
    </table>
  </section>`;

  const body = [picked]
    .map(
      (loc) => `
  <section class="card">
    <div class="pick-badge">Where we're going</div>
    <h2>${loc.name}</h2>
    <div class="subtitle">${loc.subtitle}</div>

    <div class="photos">
      ${loc.photos
        .map(
          (p) => `<figure>
        <img src="${p.url}" alt="${p.caption}" loading="lazy">
        <figcaption>${p.caption}</figcaption>
      </figure>`
        )
        .join("\n      ")}
    </div>

    <div class="section-label">Weather (mid-Oct)</div>
    <table>
      <tr><td>High / Low</td><td>${loc.weather.high} / ${loc.weather.low}</td></tr>
      <tr><td>Precip</td><td>${loc.weather.precip}</td></tr>
      <tr><td>Notes</td><td>${loc.weather.notes}</td></tr>
    </table>

    <div class="section-label">Airfare &mdash; 3 from NYC, 2 from SF, 1 from Seattle</div>
    <table>
      ${ORIGINS.map((o) => {
        const leg = (loc.flights as any)[o.key];
        return `<tr><td>${o.label} &times;${o.seats}</td><td>${money(leg)} pp &nbsp;${stopPill(leg, false)}${leg.note ? `<br><span class="muted-cell">${escapeHtml(leg.note)}</span>` : ""}</td></tr>`;
      }).join("\n      ")}
      <tr><td>Group total</td><td class="group-total">${fmt(loc.airfare.groupLow)}-${fmt(loc.airfare.groupHigh)} (~${fmt(loc.airfare.groupTotal)} at midpoint)</td></tr>
    </table>

    <div class="section-label">4BR Airbnb cabin</div>
    <table>
      <tr><td>Nightly</td><td>${loc.airbnb.nightly}</td></tr>
      <tr><td>Total</td><td>${loc.airbnb.totalRange}</td></tr>
      <tr><td>Per person</td><td>${loc.airbnb.perPerson}</td></tr>
    </table>

    <div class="section-label">Top things to do</div>
    <ul class="sites">
      ${loc.topSites.map((s) => `<li>${s}</li>`).join("\n      ")}
    </ul>

    <div class="verdict">${loc.verdict}</div>
  </section>`
    )
    .join("\n");
  return layout("home", trip.title, body + "\n" + compare + "\n" + runnerUps);
}

function ideaItemHtml(idea: Idea) {
  const when = new Date(idea.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `<li class="idea">
        ${escapeHtml(idea.text)}
        <div class="idea-meta">&mdash; ${escapeHtml(idea.author || "Anonymous")} &middot; ${when}</div>
      </li>`;
}

const plan = (data as any).plan;

function planBlocks(d: any) {
  return `
    <ol class="timeline">
      ${d.blocks
        .map(
          (b: any) => `<li>
        <span class="when">${escapeHtml(b.when)}</span>
        <div class="what"><strong>${escapeHtml(b.what)}</strong>${b.cost ? ` <span class="cost">${escapeHtml(b.cost)}</span>` : ""}</div>
        <div class="detail">${escapeHtml(b.detail)}</div>
      </li>`,
        )
        .join("\n      ")}
    </ol>`;
}

async function itineraryPage() {
  const ideas = await loadIdeas();

  const dayBlocks = DAYS.map((day) => {
    const dayIdeas = ideas
      .filter((idea) => idea.day === day)
      .sort((a, b) => a.createdAt - b.createdAt);
    const d = plan.days.find((x: any) => x.day === day);
    return `
  <section class="card">
    <h2>${day}</h2>
    ${d ? `<div class="subtitle">${escapeHtml(d.headline)}</div>` : ""}
    ${d ? planBlocks(d) : ""}
    <div class="section-label">Ideas from the group</div>
    <ul class="ideas-list">
      ${
        dayIdeas.length
          ? dayIdeas.map(ideaItemHtml).join("\n      ")
          : `<li class="idea-empty">No ideas yet &mdash; add the first one below.</li>`
      }
    </ul>
    ${addIdeaBlock(day)}
  </section>`;
  }).join("\n");

  const generalIdeas = ideas
    .filter((idea) => idea.day === "General")
    .sort((a, b) => a.createdAt - b.createdAt);

  const generalBlock = `
  <section class="card">
    <h2>General ideas</h2>
    <div class="subtitle">Gear, logistics, group buys &mdash; anything not tied to a specific day</div>
    <ul class="ideas-list">
      ${
        generalIdeas.length
          ? generalIdeas.map(ideaItemHtml).join("\n      ")
          : `<li class="idea-empty">No ideas yet &mdash; add the first one below.</li>`
      }
    </ul>
    ${addIdeaBlock("General")}
  </section>`;

  const header = `
  <section class="card">
    <div class="pick-badge">The plan</div>
    <h2>${escapeHtml(plan.title)}</h2>
    <div class="subtitle">Based in ${escapeHtml(plan.base)} &middot; ${trip.dates}</div>
    <p class="area-vibe">${escapeHtml(plan.intro)}</p>
    <table>
      ${plan.facts.map((f: any) => `<tr><td>${escapeHtml(f[0])}</td><td>${escapeHtml(f[1])}</td></tr>`).join("\n      ")}
    </table>
    <div class="section-label">Book before you go</div>
    <ul class="sites">
      ${plan.bookAhead.map((b: string) => `<li>${escapeHtml(b)}</li>`).join("\n      ")}
    </ul>
    <div class="caveat">${escapeHtml(plan.caveat)}</div>
  </section>`;

  return layout(
    "itinerary",
    `Itinerary — ${trip.title}`,
    header + "\n" + dayBlocks + "\n" + generalBlock,
  );
}

// ---------------------------------------------------------------- housing

const housing = (data as any).housing;
// Airbnb's search path segment for the base town; areas below override the map box.
const SEARCH_PLACE = "Whitefish--Montana--United-States";

// Airbnb blocks iframing (x-frame-options: SAMEORIGIN) and has no public search
// API, so the best we can do is deep-link a search with every filter pre-applied.
function airbnbSearch(o: {
  adults: number;
  minBedrooms: number;
  bbox?: { neLat: number; neLng: number; swLat: number; swLng: number };
  zoom?: number;
}) {
  const p = new URLSearchParams({
    checkin: housing.checkin,
    checkout: housing.checkout,
    adults: String(o.adults),
    min_bedrooms: String(o.minBedrooms),
    "room_types[]": "Entire home/apt",
  });
  if (o.bbox) {
    p.set("search_by_map", "true");
    p.set("ne_lat", String(o.bbox.neLat));
    p.set("ne_lng", String(o.bbox.neLng));
    p.set("sw_lat", String(o.bbox.swLat));
    p.set("sw_lng", String(o.bbox.swLng));
    p.set("zoom", String(o.zoom ?? 8));
  }
  return `https://www.airbnb.com/s/${SEARCH_PLACE}/homes?${p.toString()}`;
}

// Cleaning is a flat charge per booking, not a percentage — on a 3-night stay it
// dominates the add-on, which is why this can't be modelled as one blanket rate.
function stayTotal(a: any, nights = housing.nights, nightly = a.nightly.typical) {
  const sub = nightly * nights + costs.cleaningFee;
  return sub * (1 + costs.feePct + a.taxPct);
}

function housingPage() {
  const wide = airbnbSearch({
    adults: housing.defaultAdults,
    minBedrooms: housing.minBedrooms,
    bbox: housing.bbox,
    zoom: 8,
  });

  const areaCards = housing.areas
    .map((a: any) => {
      const url = airbnbSearch({
        adults: housing.defaultAdults,
        minBedrooms: housing.minBedrooms,
        bbox: a.bbox,
        zoom: 10,
      });
      return `
    <div class="area">
      <img src="${a.photo.url}" alt="${escapeHtml(a.photo.caption)}" loading="lazy">
      <div class="area-body">
        <h3>${escapeHtml(a.name)}</h3>
        <div class="subtitle">${escapeHtml(a.drive)} &middot; ${escapeHtml(a.photo.caption)}</div>
        <p class="area-vibe">${escapeHtml(a.vibe)}</p>
        <table>
          <tr><td>Nightly (sleeps 8-10)</td><td>${fmt(a.nightly.low)}-${fmt(a.nightly.high)}</td></tr>
          <tr><td>Typical</td><td><strong>${fmt(a.nightly.typical)}</strong>/night</td></tr>
          <tr><td>${housing.nights} nights all-in</td><td><strong>${fmt(stayTotal(a))}</strong> <span class="muted-cell">(+${Math.round((stayTotal(a) / (a.nightly.typical * housing.nights) - 1) * 100)}% in cleaning, fees &amp; tax)</span></td></tr>
          <tr><td>Per person (8)</td><td>${fmt(stayTotal(a) / 8)}</td></tr>
        </table>
        <div class="quality">Data quality: ${escapeHtml(a.quality)}</div>
        <a class="add-idea-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Search ${escapeHtml(a.name)} on Airbnb &rarr;</a>
      </div>
    </div>`;
    })
    .join("\n");

  const body = `
  <section class="card">
    <div class="pick-badge">Housing</div>
    <h2>Cabins near the park gate</h2>
    <div class="subtitle">${housing.checkin} &rarr; ${housing.checkout} &middot; ${housing.nights} nights &middot; sleeps ${trip.groupSize}</div>
    <p class="area-vibe">${escapeHtml(housing.intro)}</p>
    <a class="cta" href="${escapeHtml(wide)}" target="_blank" rel="noopener">Open the full pre-filtered Airbnb search &rarr;</a>
    <div class="filter-note">
      Filters baked into that link: <strong>${housing.checkin} to ${housing.checkout}</strong>,
      <strong>${housing.defaultAdults} guests</strong>, <strong>${housing.minBedrooms}+ bedrooms</strong>,
      entire place only, map bounded to the Flathead Valley.
      Add the <em>Cabin</em> property-type filter in Airbnb's own panel to narrow further.
    </div>
    <div class="caveat">
      <strong>Why this is a link and not an embed:</strong> Airbnb sends
      <code>x-frame-options: SAMEORIGIN</code>, so its pages cannot be displayed inside
      another site &mdash; an iframe renders blank. There is also no public Airbnb search API.
      ${escapeHtml(housing.sourceNote)}
      Photos are of the areas themselves (Wikimedia Commons), not listing photos.
    </div>
  </section>

  <section class="card">
    <h2>Where to base</h2>
    <div class="subtitle">Sorted by drive time to the West Glacier gate &mdash; each links to its own bounded search</div>
    <div class="areas">
${areaCards}
    </div>
  </section>

  <section class="card">
    <h2>Booking notes</h2>
    <ul class="sites">
      ${housing.notes.map((n: string) => `<li>${escapeHtml(n)}</li>`).join("\n      ")}
    </ul>
    <a class="add-idea-link" href="${escapeHtml(housing.vrbo)}" target="_blank" rel="noopener">Same dates on VRBO &rarr;</a>
  </section>`;

  return layout("housing", `Housing — ${trip.title}`, body);
}

// ---------------------------------------------------------------- costs

const costs = (data as any).costs;

const flightInfo = (data as any).flights;

function flightsBlock() {
  return `
  <section class="card">
    <h2>Getting there</h2>
    <div class="alert"><strong>${escapeHtml(flightInfo.headline)}</strong></div>
    <table>
      <tr><th>Route</th><th>Airline</th><th>Mid-Oct</th></tr>
      ${flightInfo.rows
        .map(
          (r: any) => `<tr>
        <td><strong>${escapeHtml(r.route)}</strong></td>
        <td class="muted-cell">${escapeHtml(r.airline)}</td>
        <td><span class="pill ${r.status}">${r.status === "ok" ? "nonstop" : "no nonstop"}</span><br>
            <span class="muted-cell">${escapeHtml(r.detail)}</span></td>
      </tr>`,
        )
        .join("\n      ")}
    </table>
    <div class="caveat">${escapeHtml(flightInfo.caveat)}
      <a href="${escapeHtml(flightInfo.source)}" target="_blank" rel="noopener">BZN schedule &rarr;</a>
    </div>
  </section>`;
}

function costsPage() {
  // Everything the calculator needs, handed to the client as one blob so the
  // page stays a single self-contained file (no fetch — Pages is static).
  const cfg = JSON.stringify({
    nights: housing.nights,
    areas: housing.areas.map((a: any) => ({
      name: a.name,
      nightly: a.nightly.typical,
      taxPct: a.taxPct,
    })),
    feePct: costs.feePct,
    cleaningFee: costs.cleaningFee,
    carFeePct: costs.carFeePct,
    flights: costs.flights,
    car: costs.car,
    food: costs.food,
  });

  const body = `
  <section class="card">
    <div class="pick-badge">Cost calculator</div>
    <h2>What this actually costs</h2>
    <div class="subtitle">Flights + housing + car + food. Change anything; totals update live.</div>

    <div class="section-label">Who's coming</div>
    <div class="calc-grid">
      <label>From NYC <input type="number" id="n-nyc" min="0" max="10" value="3"></label>
      <label>From SF <input type="number" id="n-sf" min="0" max="10" value="2"></label>
      <label>From Seattle <input type="number" id="n-sea" min="0" max="10" value="1"></label>
      <label>Already in MT <input type="number" id="n-local" min="0" max="10" value="0"></label>
    </div>
    <div class="calc-note" id="party-note"></div>

    <div class="section-label">Flights</div>
    <div class="calc-grid">
      <label>Fare level
        <select id="fare-level">
          <option value="low">Cheap (book early)</option>
          <option value="typical" selected>Typical</option>
          <option value="high">Expensive (last minute)</option>
        </select>
      </label>
    </div>

    <div class="section-label">Housing</div>
    <div class="calc-grid">
      <label>Area <select id="area"></select></label>
      <label>Nights <input type="number" id="nights" min="1" max="10" value="${housing.nights}"></label>
      <label>Nightly rate <input type="number" id="nightly" min="0" step="25"></label>
    </div>
    <div class="calc-note">A flat ${fmt(costs.cleaningFee)} cleaning fee, ~${Math.round(costs.feePct * 100)}% platform fee and Montana lodging tax (8%, or 12% in Big Sky &amp; West Yellowstone) are added automatically. On three nights that lands around +45-55%.</div>
    <div class="calc-note">${escapeHtml(costs.flightNote)}</div>

    <div class="section-label">Rental cars</div>
    <div class="calc-grid">
      <label>Vehicles <input type="number" id="cars" min="0" max="4" value="2"></label>
      <label>Type
        <select id="car-type">
          <option value="suv">Full-size SUV (seats 7)</option>
          <option value="midsize">Midsize SUV (seats 5)</option>
          <option value="minivan">Minivan (seats 7)</option>
        </select>
      </label>
      <label>Days <input type="number" id="car-days" min="1" max="10" value="${housing.nights + 1}"></label>
    </div>
    <div class="calc-note">Gas &amp; a Yellowstone day trip: <span id="gas-note"></span></div>
    <div class="caveat">${escapeHtml(costs.carNote)}</div>

    <div class="section-label">Food &amp; drink</div>
    <div class="calc-grid">
      <label>Style
        <select id="food-style">
          <option value="cook">Mostly cooking at the cabin</option>
          <option value="mixed" selected>Mix of cooking and going out</option>
          <option value="restaurants">Mostly restaurants &amp; bars</option>
        </select>
      </label>
    </div>
    <div class="caveat">${escapeHtml(costs.foodNote)}</div>
  </section>

  <section class="card" id="results">
    <h2>Total</h2>
    <table id="breakdown"></table>
    <div class="total-row">
      <div><span class="total-label">Group total</span><span class="total-big" id="grand">&mdash;</span></div>
      <div><span class="total-label">Per person</span><span class="total-big accent" id="perhead">&mdash;</span></div>
    </div>
    <div class="calc-note">Estimates from researched ranges for mid-October in the Flathead Valley &mdash; not live quotes. Treat as a planning ballpark, not a bill.</div>
  </section>

  <script>
  (function () {
    var CFG = ${cfg};
    var $ = function (id) { return document.getElementById(id); };
    var money = function (n) {
      return "$" + Math.round(n).toLocaleString();
    };

    var areaSel = $("area");
    CFG.areas.forEach(function (a, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = a.name + " (" + money(a.nightly) + "/night)";
      areaSel.appendChild(o);
    });
    $("nightly").value = CFG.areas[0].nightly;
    areaSel.addEventListener("change", function () {
      $("nightly").value = CFG.areas[Number(areaSel.value)].nightly;
      calc();
    });

    function calc() {
      var lvl = $("fare-level").value;
      var party = {
        nyc: Number($("n-nyc").value) || 0,
        sf: Number($("n-sf").value) || 0,
        sea: Number($("n-sea").value) || 0,
        local: Number($("n-local").value) || 0
      };
      var people = party.nyc + party.sf + party.sea + party.local;

      var note = $("party-note");
      if (people === 0) {
        note.textContent = "Add at least one person.";
      } else {
        note.textContent = people + " people" +
          (people < 5 || people > 10 ? " — outside the 5-10 the cabins are sized for." : "");
      }
      if (people === 0) {
        $("grand").textContent = "—";
        $("perhead").textContent = "—";
        $("breakdown").innerHTML = "";
        return;
      }

      var flights =
        party.nyc * CFG.flights.nyc[lvl] +
        party.sf * CFG.flights.sf[lvl] +
        party.sea * CFG.flights.sea[lvl];

      var nights = Number($("nights").value) || 1;
      var nightly = Number($("nightly").value) || 0;
      var area = CFG.areas[Number($("area").value)] || CFG.areas[0];
      // Cleaning is a flat per-booking charge, so it hits a 3-night stay far
      // harder than a percentage would. Tax is 8%, or 12% in the resort towns.
      var lodgingSub = nightly * nights + CFG.cleaningFee;
      var lodging = lodgingSub * (1 + CFG.feePct + area.taxPct);
      var lodgingUplift = Math.round((lodging / (nightly * nights) - 1) * 100);

      var cars = Number($("cars").value) || 0;
      var carDays = Number($("car-days").value) || 1;
      var carRate = CFG.car[$("car-type").value];
      var carRental = cars * carDays * carRate * (1 + CFG.carFeePct);
      var gas = cars * CFG.car.gasPerCar;
      $("gas-note").textContent = money(CFG.car.gasPerCar) + " per vehicle";

      var perDay = CFG.food[$("food-style").value];
      var food = people * (nights + 1) * perDay;

      var rows = [
        ["Flights", flights, people + " fares, " + lvl],
        ["Housing", lodging, money(nightly) + " × " + nights + " nights, +" +
          lodgingUplift + "% cleaning/fees/tax"],
        ["Rental cars", carRental + gas, cars + " × " + carDays + " days, incl. tax & fees, + gas"],
        ["Food & drink", food, money(perDay) + " pp/day × " + (nights + 1) + " days"]
      ];
      var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);

      $("breakdown").innerHTML =
        "<tr><th>Category</th><th>Detail</th><th>Cost</th></tr>" +
        rows.map(function (r) {
          return "<tr><td><strong>" + r[0] + "</strong></td>" +
                 "<td class='muted-cell'>" + r[2] + "</td>" +
                 "<td>" + money(r[1]) + "</td></tr>";
        }).join("") +
        "<tr><td colspan='2'><strong>Per person</strong></td><td><strong>" +
        money(total / people) + "</strong></td></tr>";

      $("grand").textContent = money(total);
      $("perhead").textContent = money(total / people);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll("#results, .card input, .card select"),
      function (el) {
        el.addEventListener("input", calc);
        el.addEventListener("change", calc);
      }
    );
    calc();
  })();
  </script>`;

  return layout("costs", `Costs — ${trip.title}`, flightsBlock() + "\n" + body);
}

export { homePage, itineraryPage, housingPage, costsPage };

// Only start the server when run directly, so build.ts can import the renderers.
if (import.meta.main) {
const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/data.json") {
      return Response.json(data);
    }

    if (url.pathname === "/itinerary/add" && req.method === "POST") {
      const form = await req.formData();
      const text = String(form.get("text") || "").trim();
      const author = String(form.get("author") || "").trim();
      const day = String(form.get("day") || "General").trim();

      if (text) {
        const ideas = await loadIdeas();
        ideas.push({
          id: crypto.randomUUID(),
          day: DAYS.includes(day) ? day : "General",
          text: text.slice(0, 280),
          author: author.slice(0, 40),
          createdAt: Date.now(),
        });
        await saveIdeas(ideas);
      }
      return Response.redirect("/itinerary", 303);
    }

    if (url.pathname === "/housing") {
      return new Response(housingPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/costs") {
      return new Response(costsPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/itinerary") {
      return new Response(await itineraryPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response(homePage(), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`Trip site running at http://localhost:${port}`);
}
