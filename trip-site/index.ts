import data from "./data.json";

const trip = data.trip;
const stopInfo = (data as any).flightStops;
const IDEAS_PATH = `${import.meta.dir}/ideas.json`;

const PARTY = { nyc: 3, sf: 2, seattle: 1 };

// Three days, and the Saturday label says what it is. Monday is a 19-minute
// drive to the airport, so it lives in Sunday's last block rather than a day
// of its own.
const DAYS = [
  "Day 1 · Fri 10/16 (Arrival)",
  "Day 2 · Sat 10/17 (The big hike)",
  "Day 3 · Sun 10/18",
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
  .alt-intro { font-size: .9rem; color: var(--muted); margin: .2rem 0 .8rem; }

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
  .area.picked {
    background: color-mix(in srgb, var(--accent) 7%, transparent);
    border-left: 3px solid var(--accent);
    border-radius: 12px;
    padding: .9rem 1rem .9rem .8rem;
    margin: -.2rem 0;
  }
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
  .calc-actions {
    display: flex;
    align-items: center;
    gap: .8rem;
    flex-wrap: wrap;
    margin: .6rem 0 .2rem;
  }
  .calc-actions .calc-note { margin: 0; }
  .calc-btn {
    font-family: var(--sans);
    font-size: .78rem;
    font-weight: 700;
    letter-spacing: .03em;
    padding: .45rem .8rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--muted);
    cursor: pointer;
  }
  .calc-btn:hover { color: var(--text); border-color: var(--accent); }
  .calc-btn.small { padding: .2rem .5rem; font-size: .9rem; line-height: 1; }
  table.extras td { vertical-align: middle; }
  table.extras input[type="text"], table.extras input[type="number"], table.extras select {
    width: 100%;
    padding: .38rem .5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: .88rem;
  }
  table.extras input[type="number"] { min-width: 5.5rem; }
  table.extras input[type="checkbox"] { width: 1.05rem; height: 1.05rem; accent-color: var(--accent); }
  table.extras td:first-child { width: 1px; }
  table.extras .x-total { white-space: nowrap; font-variant-numeric: tabular-nums; }
  /* .calc-grid label sets display:flex, which would beat [hidden] */
  .calc-grid label[hidden] { display: none; }
  .lodge-out {
    display: flex;
    align-items: baseline;
    gap: .6rem;
    flex-wrap: wrap;
    margin: .9rem 0 .2rem;
    padding: .7rem .9rem;
    border-radius: 12px;
    background: var(--bg-alt);
    border-left: 3px solid var(--accent);
  }
  .lodge-label {
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .lodge-big {
    font-family: var(--display);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -.01em;
  }
  .lodge-out .calc-note { margin: 0; }
  .stay-total {
    font-family: var(--display);
    font-size: 1.15rem;
    font-weight: 600;
  }

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

type Route = "/" | "/housing" | "/costs" | "/itinerary" | "/shortlist";
type Nav = "home" | "housing" | "costs" | "itinerary" | "shortlist";

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

// Favicon: a Glacier horn with a snowfield and the glacier tongue running down
// it, over a turquoise lake -- the west-side view the whole trip is built
// around. Inlined as a data URI so it works identically from the bun server
// and from the static docs/ build, with no route and no extra file to ship.
const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#14211a"/><path d="M0 24 L6 15 L11 20 L17 12 L24 21 L29 16 L32 20 L32 24Z" fill="#2c4536"/><path d="M13 3.5 L25 23 L1 23Z" fill="#46705a"/><path d="M23 10 L31 23 L17 23Z" fill="#3a5c4a"/><path d="M13 3.5 L18.2 12 L16.2 11 L14.6 12.8 L13 10.8 L11.2 12.8 L9.6 11 L7.8 12Z" fill="#f2f6f4"/><path d="M23 10 L26 15 L24.6 14.3 L23 15.6 L21.4 14.3 L20 15Z" fill="#e6edea"/><path d="M12.5 5.5 L14.4 9.5 L13.7 23 L12 23Z" fill="#dfeaf0"/><rect y="23" width="32" height="9" fill="#2e7d8c"/><path d="M4 27 h24 v1.3 H4Z" fill="#14211a" opacity=".2"/></svg>`,
  );

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
      "Four nights in Whitefish, at the gate of Glacier, in the last week before the mountain shuts for winter.",
  },
  housing: {
    file: "Whitefish Lake from State Beach to Whitefish Mountain Resort Autumn Courtesy of Mike Koopal.jpg",
    credit: "Whitefish Lake in autumn",
    heading: "Whitefish it is",
    tagline:
      "The house is picked — what it has, what Whitefish runs once the fees land, and the four towns we passed on, for the record.",
  },
  costs: {
    file: "Sunrise at Swiftcurrent Lake as seen from the Many Glacier Hotel (48490111337).jpg",
    credit: "Sunrise at Swiftcurrent Lake, Many Glacier",
    heading: "What it runs",
    tagline:
      "A cabin, two trucks, four days of eating and the guided stuff — what goes in the pot, what it splits to, and your own flight on top.",
  },
  shortlist: {
    file: "Vermont fall foliage hogback mountain.JPG",
    credit: "Hogback Mountain, Vermont",
    heading: "The four we didn't pick",
    tagline:
      "Vermont, Wyoming, North Carolina and Bozeman — the airfare, the weather and the reason each one lost. Kept for the record, and for the next trip.",
  },
  itinerary: {
    file: "Wild Goose Island Overlook (54004237332).jpg",
    credit: "Wild Goose Island, St. Mary Lake",
    heading: "The plan",
    tagline:
      "Three days out of Whitefish, built around one hard hike on the Saturday, in the week the high country closes.",
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
<link rel="icon" href="${FAVICON}" type="image/svg+xml">
<meta name="theme-color" content="#14211a">
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
  <a href="${href("/")}" class="${activeNav === "home" ? "active" : ""}">Glacier</a>
  <a href="${href("/housing")}" class="${activeNav === "housing" ? "active" : ""}">Housing</a>
  <a href="${href("/costs")}" class="${activeNav === "costs" ? "active" : ""}">Cost calculator</a>
  <a href="${href("/itinerary")}" class="${activeNav === "itinerary" ? "active" : ""}">Itinerary &amp; ideas</a>
  <a href="${href("/shortlist")}" class="${activeNav === "shortlist" ? "active" : ""}">Shortlist</a>
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

  const elsewhere = `
  <section class="card">
    <h2>How we got here</h2>
    <div class="subtitle">Vermont, Wyoming, North Carolina and Bozeman were all on the list</div>
    <p class="area-vibe">
      Four other places were costed out properly &mdash; airfare from all three origins,
      weather, cabins, what there is to do. They lost. That research now lives on its
      own page so this one can be about Glacier.
    </p>
    <a class="add-idea-link" href="${href("/shortlist")}">See the shortlist and why each one lost &rarr;</a>
  </section>`;

  return layout("home", trip.title, body + "\n" + elsewhere);
}

// The four destinations we passed on. Off the front page since Whitefish was
// declared, but kept whole -- it is the record of why, and the start of the
// next trip.
function shortlistPage() {
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

  const intro = `
  <section class="card">
    <div class="pick-badge">Decided</div>
    <h2>Montana won</h2>
    <div class="subtitle">Kept for the record &mdash; and because one of these is the next trip</div>
    <p class="area-vibe">
      Five places went through the same questions: what does it cost to fly ${PARTY.nyc} people
      from New York, ${PARTY.sf} from the Bay Area and ${PARTY.seattle} from Seattle; what is the
      weather actually doing in the third week of October; what does a four-bedroom cabin run;
      and what is there to do once you land. Glacier took it on the strength of the arrival
      &mdash; 19 minutes from plane to town &mdash; and on having a nonstop from two of the three
      origins. Everything below is what the other four looked like.
    </p>
    <a class="add-idea-link" href="${href("/")}">&larr; Back to the Glacier plan</a>
  </section>`;

  return layout(
    "shortlist",
    `Shortlist — ${trip.title}`,
    intro + "\n" + compare + "\n" + runnerUps,
  );
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

// Cleaning is a flat charge per booking, not a percentage — on a short stay it
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
    <div class="area${a.picked ? " picked" : ""}">
      <img src="${a.photo.url}" alt="${escapeHtml(a.photo.caption)}" loading="lazy">
      <div class="area-body">
        <h3>${escapeHtml(a.name)}${a.picked ? ` <span class="pill ok">staying here</span>` : ""}</h3>
        <div class="subtitle">${escapeHtml(a.drive)} &middot; ${escapeHtml(a.photo.caption)}</div>
        <p class="area-vibe">${escapeHtml(a.vibe)}</p>
        <table>
          <tr>
            <td>${housing.nights} nights, all in</td>
            <td><span class="stay-total">${fmt(stayTotal(a))}</span>
              <span class="muted-cell">&nbsp;&middot;&nbsp;${fmt(stayTotal(a) / 8)} each at 8</span></td>
          </tr>
          <tr><td>What builds it</td><td>${fmt(a.nightly.typical)}/night &times; ${housing.nights}, +${Math.round((stayTotal(a) / (a.nightly.typical * housing.nights) - 1) * 100)}% cleaning, fees &amp; tax</td></tr>
          <tr><td>Nightly range (sleeps 8-10)</td><td>${fmt(a.nightly.low)}-${fmt(a.nightly.high)}</td></tr>
          <tr><td>Range, all in</td><td class="muted-cell">${fmt(stayTotal(a, housing.nights, a.nightly.low))}-${fmt(stayTotal(a, housing.nights, a.nightly.high))}</td></tr>
        </table>
        <div class="quality">Data quality: ${escapeHtml(a.quality)}</div>
        <a class="add-idea-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Search ${escapeHtml(a.name)} on Airbnb &rarr;</a>
      </div>
    </div>`;
    })
    .join("\n");

  const b = housing.booked;
  const bookedUrl = `${b.url}?${new URLSearchParams({
    check_in: housing.checkin,
    check_out: housing.checkout,
    adults: String(housing.defaultAdults),
  }).toString()}`;

  const body = `
  <section class="card">
    <div class="pick-badge">Our stay</div>
    <h2>The Quarry house, ${escapeHtml(b.town)}</h2>
    <div class="subtitle">${housing.checkin} &rarr; ${housing.checkout} &middot; ${housing.nights} nights &middot; Thursday to Monday</div>
    <div class="area picked">
      <img src="${escapeHtml(b.photo)}" alt="${escapeHtml(b.title)}" loading="lazy">
      <div class="area-body">
        <h3>${escapeHtml(b.title)}</h3>
        <div class="subtitle">${escapeHtml(b.type)} &middot; &#9733; ${b.rating} (${b.reviews} reviews) &middot; hosted by ${escapeHtml(b.host)}</div>
        <table>
          <tr><td>Sleeps</td><td>${b.sleeps}</td></tr>
          <tr><td>Bedrooms / baths</td><td>${b.bedrooms} / ${b.baths}</td></tr>
          <tr><td>Beds</td><td>${escapeHtml(b.beds)}</td></tr>
          <tr><td>Has</td><td>${b.amenities.map((x: string) => escapeHtml(x)).join(" &middot; ")}</td></tr>
        </table>
        <a class="cta" href="${escapeHtml(bookedUrl)}" target="_blank" rel="noopener">Open the listing on Airbnb &rarr;</a>
      </div>
    </div>
    <div class="caveat">${escapeHtml(b.caveat)}</div>
  </section>

  <section class="card">
    <h2>If it falls through</h2>
    <p class="area-vibe">${escapeHtml(housing.intro)}</p>
    <a class="add-idea-link" href="${escapeHtml(wide)}" target="_blank" rel="noopener">Open the full pre-filtered Airbnb search &rarr;</a>
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
    <h2>${escapeHtml(housing.picked)}, and the four we passed on</h2>
    <div class="subtitle">Every figure is the total for the stay, not a nightly rate &mdash; cleaning, platform fee and lodging tax are already in it. Sorted by drive time to the West Glacier gate.</div>
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
    <div class="section-label">${escapeHtml(flightInfo.alt.title)}</div>
    <p class="alt-intro">${escapeHtml(flightInfo.alt.intro)}</p>
    <table>
      <tr><th>Route</th><th>Airline</th><th>Mid-Oct</th></tr>
      ${flightInfo.alt.rows
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
    <div class="verdict">${escapeHtml(flightInfo.alt.verdict)}</div>
    <div class="caveat">${escapeHtml(flightInfo.caveat)}
      <a href="${escapeHtml(flightInfo.source)}" target="_blank" rel="noopener">FCA schedule &rarr;</a>
    </div>
  </section>`;
}

function costsPage() {
  // Everything the calculator needs, handed to the client as one blob so the
  // page stays a single self-contained file (no fetch -- Pages is static).
  // The presets only *seed* the inputs now; every number on the page is
  // editable, and anything you change sticks until you hit reset.
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
    extras: costs.extras,
  });

  const body = `
  <section class="card">
    <div class="pick-badge">Cost calculator</div>
    <h2>What this actually costs</h2>
    <div class="subtitle">Every number below is editable. The dropdowns just fill them in &mdash; type over anything you have a real quote for, and the totals follow.</div>
    <div class="calc-actions">
      <button type="button" id="reset" class="calc-btn">Reset to researched defaults</button>
      <span class="calc-note" id="saved-note"></span>
    </div>

    <div class="section-label">Who's coming</div>
    <div class="calc-grid">
      <label>From NYC <input type="number" id="n-nyc" min="0" max="20" value="3"></label>
      <label>From SF <input type="number" id="n-sf" min="0" max="20" value="2"></label>
      <label>From Seattle <input type="number" id="n-sea" min="0" max="20" value="1"></label>
      <label>Already in MT <input type="number" id="n-local" min="0" max="20" value="0"></label>
    </div>
    <div class="calc-note" id="party-note"></div>

    <div class="section-label">Flights &mdash; everyone books their own</div>
    <div class="calc-grid">
      <label>Fare level
        <select id="fare-level">
          <option value="low">Cheap (book early)</option>
          <option value="typical" selected>Typical</option>
          <option value="high">Expensive (last minute)</option>
        </select>
      </label>
      <label>NYC fare <input type="number" id="f-nyc" min="0" step="25"></label>
      <label>SF fare <input type="number" id="f-sf" min="0" step="25"></label>
      <label>Seattle fare <input type="number" id="f-sea" min="0" step="25"></label>
    </div>
    <div class="calc-note"><strong>Airfare is not in the group total.</strong> Everyone buys their own ticket from their own city, so it never goes in the pot to be split &mdash; it's shown on its own below. The fare level refills these three; type over any of them with a real quote. Touching the level again refills them.</div>
    <div class="calc-note">${escapeHtml(costs.flightNote)}</div>

    <div class="section-label">Housing</div>
    <div class="calc-grid">
      <label>Area <select id="area"></select></label>
      <label>Nights <input type="number" id="nights" min="1" max="21" value="${housing.nights}"></label>
      <label>Quoted as
        <select id="lodge-mode">
          <option value="nightly" selected>Nightly rate, add fees</option>
          <option value="total">Total for the stay</option>
        </select>
      </label>
      <label id="w-total" hidden>Total for the stay <input type="number" id="lodge-total" min="0" step="50"></label>
      <label id="w-nightly">Nightly rate <input type="number" id="nightly" min="0" step="25"></label>
      <label id="w-cleaning">Cleaning fee <input type="number" id="cleaning" min="0" step="25"></label>
      <label id="w-feepct">Platform fee % <input type="number" id="feepct" min="0" max="50" step="0.5"></label>
      <label id="w-taxpct">Lodging tax % <input type="number" id="taxpct" min="0" max="30" step="0.5"></label>
    </div>
    <div class="lodge-out">
      <span class="lodge-label">Cabin, all in</span>
      <span class="lodge-big" id="lodge-readout">&mdash;</span>
      <span class="calc-note" id="lodge-detail"></span>
    </div>
    <div class="calc-note" id="lodge-hint">Cleaning is flat per booking, so on a four-night stay it lands harder than a percentage would. Tax is 8% statewide; Whitefish adds 3% resort tax, which the area dropdown fills in. Already have a real quote? Switch to <em>Total for the stay</em> and type the number Airbnb showed you &mdash; fees and tax are in it already.</div>

    <div class="section-label">Rental cars</div>
    <div class="calc-grid">
      <label>Vehicles <input type="number" id="cars" min="0" max="6" value="2"></label>
      <label>Type
        <select id="car-type">
          <option value="suv">Full-size SUV (seats 7)</option>
          <option value="midsize">Midsize SUV (seats 5)</option>
          <option value="minivan">Minivan (seats 7)</option>
        </select>
      </label>
      <label>Days <input type="number" id="car-days" min="1" max="21" value="${housing.nights + 1}"></label>
      <label>Rate/day <input type="number" id="car-rate" min="0" step="5"></label>
      <label>Tax &amp; fees % <input type="number" id="car-feepct" min="0" max="60" step="1"></label>
      <label>Gas per car <input type="number" id="gas" min="0" step="10"></label>
    </div>
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
      <label>Per person / day <input type="number" id="food-rate" min="0" step="5"></label>
      <label>Days eating <input type="number" id="food-days" min="1" max="21" value="${housing.nights + 1}"></label>
    </div>
    <div class="caveat">${escapeHtml(costs.foodNote)}</div>
  </section>

  <section class="card">
    <div class="section-label">Extras &amp; activities</div>
    <div class="subtitle">The things that actually differ between this trip and a generic one. Untick what you're not doing, change what you are, add your own.</div>
    <div class="table-scroll">
      <table class="extras" id="extras">
        <tr><th>On</th><th>What</th><th>Amount</th><th>Charged</th><th>Cost</th><th></th></tr>
      </table>
    </div>
    <button type="button" id="add-extra" class="calc-btn">+ Add a line</button>
  </section>

  <section class="card" id="results">
    <h2>The pot</h2>
    <div class="subtitle">Shared costs only &mdash; the cabin, the trucks, the food and the extras. This is the number that gets split.</div>
    <table id="breakdown"></table>
    <div class="total-row">
      <div><span class="total-label">To split</span><span class="total-big" id="grand">&mdash;</span></div>
      <div><span class="total-label">Each</span><span class="total-big accent" id="perhead">&mdash;</span></div>
    </div>
  </section>

  <section class="card">
    <h2>Flights, separately</h2>
    <div class="subtitle">Everyone books their own, so this is never split &mdash; what you pay depends on where you're leaving from</div>
    <div class="table-scroll"><table id="fare-table"></table></div>
    <div class="calc-note" id="fare-note"></div>
    <div class="calc-note">Defaults are researched ranges for mid-October in the Flathead Valley &mdash; not live quotes. Once you've typed over them they're your numbers, and they're kept in this browser only.</div>
  </section>

  <script>
  (function () {
    var CFG = ${cfg};
    var KEY = "trip-costs-v1";
    var booted = false;
    // Car days and food days default to nights + 1 (you eat on the fly-out
    // day, and the car is due back that morning), and keep following nights
    // until someone types a number in -- after that they are theirs.
    var touched = {};
    var $ = function (id) { return document.getElementById(id); };
    var money = function (n) { return "$" + Math.round(n).toLocaleString(); };
    var num = function (id, fallback) {
      var v = Number($(id).value);
      return isFinite(v) && $(id).value !== "" ? v : (fallback || 0);
    };

    // ---- extras: a real editable list, not a fixed set of fields ---------
    var extras = [];
    function extraRow(x, i) {
      return "<tr>" +
        "<td><input type='checkbox' class='x-on' data-i='" + i + "'" + (x.on ? " checked" : "") + "></td>" +
        "<td><input type='text' class='x-label' data-i='" + i + "' value=\\"" + String(x.label).replace(/"/g, "&quot;") + "\\"></td>" +
        "<td><input type='number' class='x-amt' data-i='" + i + "' min='0' step='5' value='" + x.amount + "'></td>" +
        "<td><select class='x-per' data-i='" + i + "'>" +
          "<option value='group'" + (x.per === "group" ? " selected" : "") + ">per group</option>" +
          "<option value='person'" + (x.per === "person" ? " selected" : "") + ">per person</option>" +
        "</select></td>" +
        "<td class='x-total' data-i='" + i + "'></td>" +
        "<td><button type='button' class='x-del calc-btn small' data-i='" + i + "' aria-label='Remove line'>&times;</button></td>" +
      "</tr>";
    }
    function renderExtras() {
      $("extras").innerHTML =
        "<tr><th>On</th><th>What</th><th>Amount</th><th>Charged</th><th>Cost</th><th></th></tr>" +
        extras.map(extraRow).join("");
    }

    // ---- seeding: presets fill the inputs, edits win ---------------------
    var areaSel = $("area");
    CFG.areas.forEach(function (a, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = a.name + " (" + money(a.nightly) + "/night)";
      areaSel.appendChild(o);
    });

    function seedFares() {
      var lvl = $("fare-level").value;
      $("f-nyc").value = CFG.flights.nyc[lvl];
      $("f-sf").value = CFG.flights.sf[lvl];
      $("f-sea").value = CFG.flights.sea[lvl];
    }
    function seedArea() {
      var a = CFG.areas[Number(areaSel.value)] || CFG.areas[0];
      $("nightly").value = a.nightly;
      $("taxpct").value = +(a.taxPct * 100).toFixed(1);
    }
    function seedCar() { $("car-rate").value = CFG.car[$("car-type").value]; }
    function seedDays() {
      var d = (num("nights", 1)) + 1;
      if (!touched["car-days"]) $("car-days").value = d;
      if (!touched["food-days"]) $("food-days").value = d;
    }
    function seedFood() { $("food-rate").value = CFG.food[$("food-style").value]; }

    function defaults() {
      $("n-nyc").value = 3; $("n-sf").value = 2; $("n-sea").value = 1; $("n-local").value = 0;
      $("fare-level").value = "typical"; seedFares();
      areaSel.value = "0"; seedArea();
      $("nights").value = CFG.nights;
      $("cleaning").value = CFG.cleaningFee;
      $("lodge-mode").value = "nightly";
      $("lodge-total").value = "";
      $("feepct").value = +(CFG.feePct * 100).toFixed(1);
      $("cars").value = 2; $("car-type").value = "suv"; seedCar();
      $("car-days").value = CFG.nights + 1;
      $("car-feepct").value = +(CFG.carFeePct * 100).toFixed(1);
      $("gas").value = CFG.car.gasPerCar;
      $("food-style").value = "mixed"; seedFood();
      $("food-days").value = CFG.nights + 1;
      touched = {};
      extras = CFG.extras.map(function (e) {
        return { label: e.label, amount: e.amount, per: e.per, on: e.on !== false };
      });
      renderExtras();
    }

    // ---- persistence: your numbers survive a reload ----------------------
    var IDS = ["n-nyc","n-sf","n-sea","n-local","fare-level","f-nyc","f-sf","f-sea",
      "area","nights","lodge-mode","lodge-total","nightly","cleaning","feepct","taxpct","cars","car-type",
      "car-days","car-rate","car-feepct","gas","food-style","food-rate","food-days"];
    function save() {
      var state = { extras: extras, touched: touched, fields: {} };
      IDS.forEach(function (id) { state.fields[id] = $(id).value; });
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        if (booted) $("saved-note").textContent = "Saved in this browser";
      } catch (e) { /* private mode, incognito, storage off -- not worth a warning */ }
    }
    function load() {
      var raw;
      try { raw = localStorage.getItem(KEY); } catch (e) { return false; }
      if (!raw) return false;
      try {
        var state = JSON.parse(raw);
        IDS.forEach(function (id) {
          if (state.fields && state.fields[id] !== undefined) $(id).value = state.fields[id];
        });
        if (Array.isArray(state.extras)) extras = state.extras;
        if (state.touched) touched = state.touched;
        renderExtras();
        $("saved-note").textContent = "Restored your numbers";
        return true;
      } catch (e) { return false; }
    }

    function calc() {
      var party = {
        nyc: num("n-nyc"), sf: num("n-sf"), sea: num("n-sea"), local: num("n-local")
      };
      var people = party.nyc + party.sf + party.sea + party.local;

      var note = $("party-note");
      note.textContent = people === 0
        ? "Add at least one person."
        : people + " people" + (people < 5 || people > 10
            ? " \\u2014 outside the 5-10 the cabins are sized for." : "");

      if (people === 0) {
        $("grand").textContent = "\\u2014";
        $("perhead").textContent = "\\u2014";
        $("breakdown").innerHTML = "";
        $("fare-table").innerHTML = "";
        $("fare-note").textContent = "";
        return;
      }

      // Airfare is deliberately outside the pot: everyone buys their own
      // ticket from their own city, so putting it in and dividing by heads
      // would have the Seattle flyer subsidising the New Yorker.
      var fares = [
        { label: "NYC (LGA/JFK/EWR)", n: party.nyc, each: num("f-nyc") },
        { label: "SF Bay (SFO/SJC/OAK)", n: party.sf, each: num("f-sf") },
        { label: "Seattle (SEA)", n: party.sea, each: num("f-sea") },
        { label: "Already in Montana", n: party.local, each: 0 }
      ].filter(function (f) { return f.n > 0; });
      var flightSpend = fares.reduce(function (t, f) { return t + f.n * f.each; }, 0);

      var nights = num("nights", 1);
      var lodging, lodgingDetail;
      if ($("lodge-mode").value === "total") {
        // A real Airbnb quote already has cleaning, service fee and tax in
        // it, so take it at face value rather than marking it up again.
        lodging = num("lodge-total");
        lodgingDetail = "quoted total for " + nights +
          (nights === 1 ? " night" : " nights") + ", fees and tax included";
      } else {
        var nightly = num("nightly");
        var cleaning = num("cleaning");
        // Cleaning is a flat per-booking charge, so it hits a short stay far
        // harder than a percentage would; fees and tax then apply on top.
        var lodgingSub = nightly * nights + cleaning;
        lodging = lodgingSub * (1 + num("feepct") / 100 + num("taxpct") / 100);
        var base = nightly * nights;
        var uplift = base > 0 ? Math.round((lodging / base - 1) * 100) : 0;
        lodgingDetail = money(nightly) + " \\u00d7 " + nights + " nights, +" +
          uplift + "% cleaning/fees/tax";
      }

      var cars = num("cars");
      var carDays = num("car-days", 1);
      var carRental = cars * carDays * num("car-rate") * (1 + num("car-feepct") / 100);
      var gas = cars * num("gas");

      var foodDays = num("food-days", 1);
      var food = people * foodDays * num("food-rate");

      var extrasTotal = 0;
      extras.forEach(function (x, i) {
        var line = x.on ? x.amount * (x.per === "person" ? people : 1) : 0;
        extrasTotal += line;
        var cell = document.querySelector(".x-total[data-i='" + i + "']");
        if (cell) cell.textContent = x.on ? money(line) : "\\u2014";
      });

      var rows = [
        ["Housing", lodging, lodgingDetail],
        ["Rental cars", carRental + gas, cars + " \\u00d7 " + carDays + " days, incl. tax & fees, + gas"],
        ["Food & drink", food, money(num("food-rate")) + " pp/day \\u00d7 " + foodDays + " days"]
      ];
      if (extrasTotal > 0) {
        var on = extras.filter(function (x) { return x.on && x.amount > 0; }).length;
        rows.push(["Extras & activities", extrasTotal, on + (on === 1 ? " line" : " lines")]);
      }
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

      $("lodge-readout").textContent = money(lodging);
      $("lodge-detail").textContent = lodgingDetail + " \\u00b7 " +
        money(lodging / nights) + " a night \\u00b7 " +
        money(lodging / people) + " a head";

      var each = total / people;
      $("grand").textContent = money(total);
      $("perhead").textContent = money(each);

      $("fare-table").innerHTML =
        "<tr><th>Flying from</th><th>People</th><th>Fare each</th><th>That group pays</th>" +
        "<th>All in, per person</th></tr>" +
        fares.map(function (f) {
          return "<tr><td><strong>" + f.label + "</strong></td>" +
                 "<td>" + f.n + "</td>" +
                 "<td>" + (f.each ? money(f.each) : "\\u2014") + "</td>" +
                 "<td>" + money(f.n * f.each) + "</td>" +
                 "<td><strong>" + money(each + f.each) + "</strong></td></tr>";
        }).join("");
      $("fare-note").textContent =
        "Airfare across the group comes to " + money(flightSpend) +
        ", and none of it is in the " + money(total) + " above \\u2014 nobody owes " +
        "anybody for a ticket. The last column is the honest answer to \\u201cwhat " +
        "is this trip going to cost me\\u201d: " + money(each) + " of shared costs " +
        "plus your own fare.";
      save();
    }

    // ---- wiring ---------------------------------------------------------
    ["car-days", "food-days"].forEach(function (id) {
      $(id).addEventListener("input", function () { touched[id] = true; });
    });
    $("nights").addEventListener("input", function () { seedDays(); calc(); });

    function applyLodgeMode() {
      var total = $("lodge-mode").value === "total";
      $("w-total").hidden = !total;
      ["w-nightly", "w-cleaning", "w-feepct", "w-taxpct"].forEach(function (id) {
        $(id).hidden = total;
      });
      $("lodge-hint").hidden = total;
    }
    // What the nightly side works out to, all in -- used to seed the total
    // field so it is never blank or stale rather than showing a bare $0.
    function nightlyAllIn() {
      return Math.round(
        (num("nightly") * num("nights", 1) + num("cleaning")) *
        (1 + num("feepct") / 100 + num("taxpct") / 100)
      );
    }
    $("lodge-mode").addEventListener("change", function () {
      if ($("lodge-mode").value === "total" && !num("lodge-total")) {
        $("lodge-total").value = nightlyAllIn();
      }
      applyLodgeMode();
      calc();
    });

    $("fare-level").addEventListener("change", function () { seedFares(); calc(); });
    areaSel.addEventListener("change", function () {
      seedArea();
      // A different town means the old quote is stale -- replace it with the
      // new area's estimate rather than dropping housing to zero.
      if ($("lodge-mode").value === "total") $("lodge-total").value = nightlyAllIn();
      calc();
    });
    $("car-type").addEventListener("change", function () { seedCar(); calc(); });
    $("food-style").addEventListener("change", function () { seedFood(); calc(); });

    $("add-extra").addEventListener("click", function () {
      extras.push({ label: "", amount: 0, per: "group", on: true });
      renderExtras();
      calc();
      var inputs = document.querySelectorAll(".x-label");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    // Extras rows are re-rendered wholesale, so delegate rather than bind.
    $("extras").addEventListener("input", function (e) {
      var t = e.target, i = Number(t.getAttribute("data-i"));
      if (!extras[i]) return;
      if (t.classList.contains("x-label")) extras[i].label = t.value;
      else if (t.classList.contains("x-amt")) extras[i].amount = Number(t.value) || 0;
      else return;
      calc();
    });
    $("extras").addEventListener("change", function (e) {
      var t = e.target, i = Number(t.getAttribute("data-i"));
      if (!extras[i]) return;
      if (t.classList.contains("x-on")) extras[i].on = t.checked;
      else if (t.classList.contains("x-per")) extras[i].per = t.value;
      else return;
      calc();
    });
    $("extras").addEventListener("click", function (e) {
      var t = e.target;
      if (!t.classList.contains("x-del")) return;
      extras.splice(Number(t.getAttribute("data-i")), 1);
      renderExtras();
      calc();
    });

    $("reset").addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (err) {}
      defaults();
      calc();
      $("saved-note").textContent = "Back to the researched defaults";
    });

    Array.prototype.forEach.call(
      document.querySelectorAll(".calc-grid input, .calc-grid select"),
      function (el) {
        el.addEventListener("input", calc);
        el.addEventListener("change", calc);
      }
    );

    defaults();
    load();
    applyLodgeMode();
    calc();
    booted = true;
  })();
  </script>`;

  return layout("costs", `Costs — ${trip.title}`, flightsBlock() + "\n" + body);
}

export { homePage, itineraryPage, housingPage, costsPage, shortlistPage };

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

    if (url.pathname === "/shortlist") {
      return new Response(shortlistPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
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
