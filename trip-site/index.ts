import data from "./data.json";

const trip = data.trip;
const stopInfo = (data as any).flightStops;
const IDEAS_PATH = `${import.meta.dir}/ideas.json`;

const PARTY = { nyc: 3, sf: 2, seattle: 1 };

// Thursday arrivals through Monday exit; Dan flies out Monday evening, so
// Monday is a full day, not just the airport run.
const DAYS = [
  "Day 1 · Thu 10/15 (Arrival)",
  "Day 2 · Fri 10/16",
  "Day 3 · Sat 10/17 (The big hike)",
  "Day 4 · Sun 10/18",
  "Day 5 · Mon 10/19 (Exit)",
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
  /* Flights is a lookup page: a short banner so every card fits on screen. */
  .hero.compact { min-height: 150px; }
  .hero.compact .hero-inner { padding: 1rem 1.5rem 1.1rem; }
  .hero.compact h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); margin: 0; }
  .hero.compact .tagline, .hero.compact .eyebrow { display: none; }
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
  .calc-note {
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
  /* ---------- flights ---------- */
  .flight-cols { display: grid; gap: 0 1rem; }
  @media (min-width: 760px) { .flight-cols { grid-template-columns: 1fr 1fr; } .flight-cols .card { padding: 1rem 1.1rem; } }
  .flight-cols h2 { margin-bottom: .2rem; }
  .flight-tz { font-family: var(--sans); font-size: .8rem; font-weight: 500; color: var(--muted); letter-spacing: 0; margin-left: .3rem; }
  .flight-day + .flight-day { margin-top: .6rem; }
  h3.flight-date { font-size: 1.35rem; font-weight: 800; margin: .2rem 0 .3rem; color: var(--accent); letter-spacing: -.01em; }
  ul.flights { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .35rem; }
  li.flight { border: 1px solid var(--border); border-radius: 8px; padding: .35rem .6rem; font-size: .86rem; line-height: 1.35; }
  li.flight .flight-when { margin-left: .3rem; font-weight: 700; color: var(--accent); }
  ol.flight-legs { list-style: none; padding: 0; margin: 0; }
  li.flight-leg summary { cursor: pointer; list-style: none; }
  li.flight-leg summary::-webkit-details-marker { display: none; }
  li.flight-leg summary:hover .flight-no { text-decoration: underline; }
  li.flight-leg .flight-no { font-weight: 700; margin-right: .25rem; }
  li.flight-leg details[open] { padding-bottom: .4rem; }
  .flight-rename > summary { cursor: pointer; list-style: none; display: inline-block; }
  .flight-rename > summary::-webkit-details-marker { display: none; }
  .flight-rename .edit-link { margin-left: 0; }
  .flight-add > summary { cursor: pointer; list-style: none; }
  .flight-add > summary::-webkit-details-marker { display: none; }
  .flight-add > summary h2 { display: inline; margin: 0; }
  .flight-add > summary h2::after { content: " +"; color: var(--accent); }
  .flight-add[open] > summary h2::after { content: " \2212"; }
  .flight-form .calc-grid .wide { grid-column: 1 / -1; }
  .flight-form .calc-btn.primary { margin-top: .6rem; background: var(--accent); color: var(--on-dark); border-color: var(--accent); }
  .flight-delete { margin-top: .5rem; }
  .edit-link { font-size: .74rem; font-weight: 700; color: var(--accent); margin-left: .35rem; }
  ul.tasks { list-style: none; padding: 0; margin: .4rem 0 0; display: flex; flex-direction: column; gap: .35rem; }
  li.task { display: flex; gap: .6rem; align-items: flex-start; border: 1px solid var(--border); border-radius: 8px; padding: .45rem .6rem; font-size: .9rem; line-height: 1.4; }
  li.task form { margin: 0; }
  .task-check { flex: none; width: 1.35rem; height: 1.35rem; margin-top: .05rem; border-radius: 6px; border: 2px solid var(--accent); background: transparent; color: var(--on-dark); font-weight: 800; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
  li.task.done .task-check { background: var(--accent); }
  li.task.done .task-text { text-decoration: line-through; color: var(--muted); }
  .task-body { flex: 1; min-width: 0; }
  .task-body > summary { cursor: pointer; list-style: none; }
  .task-body > summary::-webkit-details-marker { display: none; }
  .task-body > summary:hover .task-text { text-decoration: underline; }
  .task-text { margin-right: .3rem; }

  .table-scroll { overflow-x: auto; margin: .3rem -.2rem .2rem; padding: 0 .2rem; }
  table.compare { min-width: 720px; }
  table.compare td:first-child { color: var(--text); width: 22%; }
  table.compare td { vertical-align: top; }
  .cmp-pick td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
  .fare { font-weight: 600; white-space: nowrap; display: block; margin-bottom: .3rem; }
  .cmp-name { display: flex; align-items: baseline; gap: .4rem; flex-wrap: wrap; }

  /* ---------- housing areas ---------- */
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
    .hero.compact { min-height: 120px; }
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

type Route = "/" | "/glacier" | "/flights" | "/housing" | "/tasks" | "/shortlist";
type Nav = "home" | "flights" | "housing" | "tasks" | "itinerary" | "shortlist";

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
      "Four nights in Whitefish, at the gate of Glacier.",
  },
  flights: {
    file: "Going-to-the-Sun Road - Glacier National Park.jpg",
    credit: "Going-to-the-Sun Road",
    heading: "Who lands when",
    tagline:
      "Everyone's flights in and out.",
  },
  housing: {
    file: "Whitefish Lake from State Beach to Whitefish Mountain Resort Autumn Courtesy of Mike Koopal.jpg",
    credit: "Whitefish Lake in autumn",
    heading: "Whitefish it is",
    tagline:
      "The Quarry house, Thu to Mon.",
  },
  tasks: {
    file: "Sunrise at Swiftcurrent Lake as seen from the Many Glacier Hotel (48490111337).jpg",
    credit: "Sunrise at Swiftcurrent Lake, Many Glacier",
    heading: "Who's doing what",
    tagline:
      "Everything the group needs to get done, and who's on it.",
  },
  shortlist: {
    file: "Vermont fall foliage hogback mountain.JPG",
    credit: "Hogback Mountain, Vermont",
    heading: "The four we didn't pick",
    tagline:
      "The four places we didn't pick.",
  },
  itinerary: {
    file: "Wild Goose Island Overlook (54004237332).jpg",
    credit: "Wild Goose Island, St. Mary Lake",
    heading: "Homeless in Montana",
    tagline:
      "",
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
<header class="hero${activeNav === "flights" ? " compact" : ""}" style="--hero:url('${img(hero.file, 2000)}')">
  <div class="hero-inner">
    <div class="eyebrow">${trip.datesShort} &middot; ${trip.groupSize} people</div>
    <h1>${hero.heading}</h1>
    ${hero.tagline ? `<p class="tagline">${hero.tagline}</p>` : ""}
  </div>
  <div class="hero-credit">${hero.credit} &middot; Wikimedia Commons</div>
</header>
<nav>
  <a href="${href("/")}" class="${activeNav === "itinerary" ? "active" : ""}">Itinerary &amp; ideas</a>
  <a href="${href("/glacier")}" class="${activeNav === "home" ? "active" : ""}">Glacier</a>
  <a href="${href("/flights")}" class="${activeNav === "flights" ? "active" : ""}">Flights</a>
  <a href="${href("/housing")}" class="${activeNav === "housing" ? "active" : ""}">Housing</a>
  <a href="${href("/tasks")}" class="${activeNav === "tasks" ? "active" : ""}">Tasks</a>
</nav>
<main>
${body}
</main>
<footer>
  ${escapeHtml(trip.title)} &middot; ${trip.dates}<br>
  Photos: Wikimedia Commons.
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
        return `<tr><td>${o.label} &times;${o.seats}</td><td>${money(leg)} pp &nbsp;${stopPill(leg)}</td></tr>`;
      }).join("\n      ")}
      <tr><td>Group total</td><td class="group-total">${fmt(loc.airfare.groupLow)}-${fmt(loc.airfare.groupHigh)} (~${fmt(loc.airfare.groupTotal)} at midpoint)</td></tr>
    </table>

    <div class="section-label">Top things to do</div>
    <ul class="sites">
      ${loc.topSites.map((s) => `<li>${s}</li>`).join("\n      ")}
    </ul>

    <div class="verdict">${loc.verdict}</div>
  </section>`
    )
    .join("\n");

  return layout("home", `Glacier — ${trip.title}`, body);
}

// The four destinations we passed on. Off the front page since Whitefish was
// declared, but kept whole -- it is the record of why, and the start of the
// next trip.
function shortlistPage() {
  const alsoRan = locations.filter((l) => l.name !== PICK);

  const compare = `
  <section class="card">
    <h2>Airfare, city by city</h2>
    <div class="subtitle">Per-person fare and nonstop status from each origin &mdash; ${PARTY.nyc} from NYC, ${PARTY.sf} from SF, ${PARTY.seattle} from Seattle</div>
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
    <div class="subtitle">The other four options, for the record</div>
    <a class="add-idea-link" href="${href("/glacier")}">&larr; Back to the Glacier plan</a>
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
        <div class="what"><strong>${escapeHtml(b.what)}</strong></div>
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
  </section>`;

  return layout(
    "itinerary",
    trip.title,
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
      return `<tr>
        <td><strong>${escapeHtml(a.name)}</strong></td>
        <td class="muted-cell">${escapeHtml(a.drive)}</td>
        <td>${fmt(stayTotal(a))}</td>
        <td><a href="${escapeHtml(url)}" target="_blank" rel="noopener">Search &rarr;</a></td>
      </tr>`;
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
          <tr><td>${housing.nights} nights, all in</td>
            <td><span class="stay-total">${fmt(b.total)}</span>
              <span class="muted-cell">&nbsp;&middot;&nbsp;${fmt(b.total / 8)} each at 8</span></td></tr>
          <tr><td>Address</td><td><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">${escapeHtml(b.address)}</a></td></tr>
          <tr><td>Check-in / out</td><td>${escapeHtml(b.checkInOut)}</td></tr>
          <tr><td>Host</td><td>${escapeHtml(b.host)}, <a href="tel:${escapeHtml(b.hostPhone)}">${escapeHtml(b.hostPhone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3"))}</a></td></tr>
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
    <h2>Backups</h2>
    <div class="subtitle">Estimated ${housing.nights}-night totals for a 4BR, fees and tax in</div>
    <div class="table-scroll">
    <table>
      <tr><th>Town</th><th>Drive</th><th>${housing.nights} nights</th><th></th></tr>
${areaCards}
    </table>
    </div>
    <a class="add-idea-link" href="${escapeHtml(wide)}" target="_blank" rel="noopener">Search the whole valley on Airbnb &rarr;</a>
  </section>`;

  return layout("housing", `Housing — ${trip.title}`, body);
}

// ---------------------------------------------------------------- flights

// Flights are logged straight into the page and kept in flights.json next to
// ideas.json. That only works with the bun server running; the static Pages
// build has nowhere to write, so it just says so.
const FLIGHTS_PATH = `${import.meta.dir}/flights.json`;

type Flight = {
  id: string;
  direction: "in" | "out";
  who: string;
  airline: string;
  flight: string;
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  departs: string; // HH:MM, 24h
  arrives: string; // HH:MM, 24h
  seat?: string;
  notes: string;
  updatedAt: number;
};

async function loadFlights(): Promise<Flight[]> {
  try {
    const raw = await Bun.file(FLIGHTS_PATH).json();
    return raw.flights ?? [];
  } catch {
    return [];
  }
}

async function saveFlights(flights: Flight[]) {
  await Bun.write(FLIGHTS_PATH, JSON.stringify({ flights }, null, 2));
}

// Everything off the form is untrusted: clamp lengths and drop anything that
// isn't the shape the page renders.
function flightFromForm(form: FormData, prev?: Flight): Flight | null {
  const str = (k: string, max = 60) => String(form.get(k) ?? "").trim().slice(0, max);
  const date = str("date", 10);
  const time = (k: string) => (/^\d{2}:\d{2}$/.test(str(k, 5)) ? str(k, 5) : "");
  const f: Flight = {
    id: prev?.id ?? crypto.randomUUID(),
    direction: str("direction") === "out" ? "out" : "in",
    who: str("who"),
    airline: str("airline"),
    flight: str("flight"),
    from: str("from", 40).toUpperCase(),
    to: str("to", 40).toUpperCase(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    departs: time("departs"),
    arrives: time("arrives"),
    seat: str("seat", 8).toUpperCase(),
    notes: str("notes", 280),
    updatedAt: Date.now(),
  };
  return f.who && f.flight && f.date ? f : null;
}

function fmtTime(t: string) {
  if (!t) return "time TBD";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function fmtDate(d: string) {
  const dt = new Date(`${d}T12:00:00`);
  return isNaN(+dt)
    ? d
    : dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function flightForm(f: Partial<Flight>, submit: string) {
  const v = (x?: string) => escapeHtml(x ?? "");
  return `<form class="flight-form" method="POST" action="/flights/save">
      ${f.id ? `<input type="hidden" name="id" value="${v(f.id)}">` : ""}
      <div class="calc-grid">
        <label>Direction
          <select name="direction">
            <option value="in"${f.direction !== "out" ? " selected" : ""}>Flying in</option>
            <option value="out"${f.direction === "out" ? " selected" : ""}>Flying out</option>
          </select>
        </label>
        <label>Who <input type="text" name="who" required maxlength="60" value="${v(f.who)}"></label>
        <label>Airline <input type="text" name="airline" maxlength="60" value="${v(f.airline)}"></label>
        <label>Flight # <input type="text" name="flight" required maxlength="60" placeholder="UA 1234" value="${v(f.flight)}"></label>
        <label>From <input type="text" name="from" maxlength="40" placeholder="SFO" value="${v(f.from)}"></label>
        <label>To <input type="text" name="to" maxlength="40" placeholder="FCA" value="${v(f.to)}"></label>
        <label>Date <input type="date" name="date" required value="${v(f.date)}"></label>
        <label>Departs <input type="time" name="departs" value="${v(f.departs)}"></label>
        <label>Arrives <input type="time" name="arrives" value="${v(f.arrives)}"></label>
        <label>Seat <input type="text" name="seat" maxlength="8" placeholder="12A" value="${v(f.seat)}"></label>
        <label class="wide">Notes <input type="text" name="notes" maxlength="280" value="${v(f.notes)}"></label>
      </div>
      <button type="submit" class="calc-btn primary">${submit}</button>
    </form>`;
}

// One line per leg; clicking it opens the notes and the edit form, so a
// whole day's arrivals fit on one screen.
function flightLeg(f: Flight) {
  return `<li class="flight-leg"><details>
      <summary title="${escapeHtml(f.notes)}">
        <span class="flight-no">${escapeHtml(f.flight)}</span>
        ${escapeHtml(f.from || "?")}&rarr;${escapeHtml(f.to || "?")}
        <span class="muted-cell">${fmtTime(f.departs)} &rarr; ${fmtTime(f.arrives)}${f.seat ? ` &middot; ${escapeHtml(f.seat)}` : ""}</span>
        <span class="edit-link">edit</span>
      </summary>
      ${f.airline || f.notes ? `<div class="muted-cell">${escapeHtml([f.airline, f.notes].filter(Boolean).join(" · "))}</div>` : ""}
      ${flightForm(f, "Save changes")}
      <form method="POST" action="/flights/delete" class="flight-delete">
        <input type="hidden" name="id" value="${escapeHtml(f.id)}">
        <button type="submit" class="calc-btn">Delete this flight</button>
      </form>
    </details></li>`;
}

// One person's trip in one direction: every leg, layovers included.
type Trip = { who: string; direction: Flight["direction"]; legs: Flight[]; fca: Flight };

// Order legs by following the route (A→B, B→C), since connecting legs often
// have no times yet; fall back to date/departure for anything that won't chain.
function chainLegs(legs: Flight[]): Flight[] {
  const rest = [...legs].sort((a, b) => `${a.date} ${a.departs}`.localeCompare(`${b.date} ${b.departs}`));
  const start = rest.find((l) => !rest.some((o) => o !== l && o.to && o.to === l.from)) ?? rest[0];
  const out = [start];
  rest.splice(rest.indexOf(start), 1);
  while (rest.length) {
    const last = out[out.length - 1];
    const i = rest.findIndex((l) => l.from && l.from === last.to);
    out.push(rest.splice(i >= 0 ? i : 0, 1)[0]);
  }
  return out;
}

function groupTrips(flights: Flight[], direction: Flight["direction"]): Trip[] {
  const byWho = new Map<string, Flight[]>();
  for (const f of flights.filter((f) => f.direction === direction)) {
    const k = f.who.trim().toLowerCase();
    byWho.set(k, [...(byWho.get(k) ?? []), f]);
  }
  return [...byWho.values()].map((fs) => {
    const legs = chainLegs(fs);
    // The FCA leg sets the card's date and sort time: landing in, taking off out.
    const fca = direction === "in" ? legs[legs.length - 1] : legs[0];
    return { who: legs[0].who, direction, legs, fca };
  });
}

function tripKey(t: Trip) {
  return { date: t.fca.date, time: t.direction === "in" ? t.fca.arrives : t.fca.departs };
}

// Who picks up (and returns) the two rental SUVs at FCA.
const renters = new Set<string>(((data as any).costs.car.renters as string[]).map((n) => n.toLowerCase()));

function tripItem(t: Trip) {
  const { time } = tripKey(t);
  const car = renters.has(t.who.trim().toLowerCase()) ? ` <span class="pill ok">rental car</span>` : "";
  const stops = t.legs.length - 1;
  const when = `${t.direction === "in" ? "lands" : "leaves"} ${fmtTime(time)}`;
  return `<li class="flight">
      <div class="flight-who"><strong>${escapeHtml(t.who)}</strong> <span class="flight-when">${when}</span>${car}${stops ? ` <span class="muted-cell">&middot; ${stops} stop${stops > 1 ? "s" : ""}</span>` : ""}</div>
      <ol class="flight-legs">${t.legs.map(flightLeg).join("\n")}</ol>
      <details class="flight-rename">
        <summary><span class="edit-link">rename</span></summary>
        <form method="POST" action="/flights/rename" class="flight-form">
          <input type="hidden" name="from" value="${escapeHtml(t.who)}">
          <div class="calc-grid">
            <label>Name on all ${t.legs.length > 1 ? `${t.legs.length} legs` : "this leg"} <input type="text" name="to" required maxlength="60" value="${escapeHtml(t.who)}"></label>
          </div>
          <button type="submit" class="calc-btn primary">Rename</button>
        </form>
      </details>
    </li>`;
}

async function flightsPage() {
  if (STATIC) {
    const body = `
  <section class="card">
    <h2>Flights</h2>
    <div class="subtitle">The flight log runs on the trip server, not this copy of the site.</div>
  </section>`;
    return layout("flights", `Flights — ${trip.title}`, body);
  }

  const flights = await loadFlights();
  // Sort by date, then by the FCA time that matters for pickups/drop-offs.
  const byFca = (a: Trip, b: Trip) => {
    const ka = tripKey(a), kb = tripKey(b);
    return `${ka.date} ${ka.time || "99"}`.localeCompare(`${kb.date} ${kb.time || "99"}`);
  };
  const inbound = groupTrips(flights, "in").sort(byFca);
  const outbound = groupTrips(flights, "out").sort(byFca);
  // Anyone who's flying in but hasn't logged a way home yet.
  const leaving = new Set(outbound.map((t) => t.who.trim().toLowerCase()));
  const pending = inbound.filter((t) => !leaving.has(t.who.trim().toLowerCase()));
  const pendingBlock = pending.length
    ? `<div class="flight-day">
      <h3 class="flight-date">Pending</h3>
      <ul class="flights">${pending
        .map(
          (t) => `<li class="flight">
      <div class="flight-who"><strong>${escapeHtml(t.who)}</strong> <span class="pill partial">flight unknown</span></div>
      <details class="flight-rename">
        <summary><span class="edit-link">add flight out</span></summary>
        ${flightForm({ direction: "out", who: t.who, from: "FCA", date: housing.checkout }, "Add flight")}
      </details>
    </li>`,
        )
        .join("\n")}</ul>
    </div>`
    : "";
  // One block per date, with the date as the heading: who lands (or leaves)
  // on which day is what pickups and drop-offs get planned around.
  const list = (ts: Trip[]) => {
    if (!ts.length) return `<div class="calc-note">Nobody yet.</div>`;
    const dates = [...new Set(ts.map((t) => t.fca.date))];
    return dates
      .map(
        (d) => `<div class="flight-day">
      <h3 class="flight-date">${escapeHtml(fmtDate(d))}</h3>
      <ul class="flights">${ts.filter((t) => t.fca.date === d).map(tripItem).join("\n")}</ul>
    </div>`,
      )
      .join("\n");
  };

  const body = `
  <div class="flight-cols">
    <section class="card">
      <h2>Flying in <span class="flight-tz">local times</span></h2>
      <div class="calc-note">${escapeHtml((data as any).costs.car.renters.join(" and "))} are getting the rental cars.</div>
      ${list(inbound)}
    </section>
    <section class="card">
      <h2>Flying out <span class="flight-tz">local times</span></h2>
      ${list(outbound)}
      ${pendingBlock}
    </section>
  </div>

  <section class="card">
    <details class="flight-add">
      <summary><h2>Add a flight</h2></summary>
      ${flightForm({ direction: "in", to: "FCA", date: housing.checkin }, "Add flight")}
    </details>
  </section>`;

  return layout("flights", `Flights — ${trip.title}`, body);
}

// ---------------------------------------------------------------- tasks

// The group's to-do list, kept in tasks.json like the flight log. Anyone on
// the trip server can add, assign, tick off or delete; the static Pages build
// shows a read-only snapshot.
const TASKS_PATH = `${import.meta.dir}/tasks.json`;

type Task = {
  id: string;
  text: string;
  who: string; // "" = unassigned
  due: string; // YYYY-MM-DD or ""
  done: boolean;
  createdAt: number;
};

async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await Bun.file(TASKS_PATH).json();
    return raw.tasks ?? [];
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]) {
  await Bun.write(TASKS_PATH, JSON.stringify({ tasks }, null, 2) + "\n");
}

function taskFromForm(form: FormData, prev?: Task): Task | null {
  const str = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const due = str("due", 10);
  const t: Task = {
    id: prev?.id ?? crypto.randomUUID(),
    text: str("text", 280),
    who: str("who", 60),
    due: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : "",
    done: prev?.done ?? false,
    createdAt: prev?.createdAt ?? Date.now(),
  };
  return t.text ? t : null;
}

// Assignee suggestions: everyone in the flight log, plus "Everyone".
async function peopleNames() {
  const seen = new Map<string, string>();
  for (const f of await loadFlights()) {
    const n = f.who.trim();
    if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  }
  return [...[...seen.values()].sort(), "Everyone"];
}

function taskForm(t: Partial<Task>, submit: string) {
  const v = (x?: string) => escapeHtml(x ?? "");
  return `<form class="flight-form" method="POST" action="/tasks/save">
      ${t.id ? `<input type="hidden" name="id" value="${v(t.id)}">` : ""}
      <div class="calc-grid">
        <label class="wide">Task <input type="text" name="text" required maxlength="280" placeholder="What needs doing?" value="${v(t.text)}"></label>
        <label>Assigned to <input type="text" name="who" maxlength="60" list="people" placeholder="Unassigned" value="${v(t.who)}"></label>
        <label>Due <input type="date" name="due" value="${v(t.due)}"></label>
      </div>
      <button type="submit" class="calc-btn primary">${submit}</button>
    </form>`;
}

function taskItem(t: Task) {
  const meta = `${t.who ? `<span class="pill ok">${escapeHtml(t.who)}</span>` : `<span class="pill partial">unassigned</span>`}${
    t.due ? ` <span class="muted-cell">due ${escapeHtml(fmtDate(t.due))}</span>` : ""
  }`;
  if (STATIC) {
    return `<li class="task${t.done ? " done" : ""}"><span class="task-check">${t.done ? "&#10003;" : ""}</span>
      <div class="task-body"><span class="task-text">${escapeHtml(t.text)}</span> ${meta}</div></li>`;
  }
  return `<li class="task${t.done ? " done" : ""}">
      <form method="POST" action="/tasks/toggle"><input type="hidden" name="id" value="${escapeHtml(t.id)}">
        <button type="submit" class="task-check" title="${t.done ? "Mark not done" : "Mark done"}">${t.done ? "&#10003;" : ""}</button></form>
      <details class="task-body">
        <summary><span class="task-text">${escapeHtml(t.text)}</span> ${meta} <span class="edit-link">edit</span></summary>
        ${taskForm(t, "Save changes")}
        <form method="POST" action="/tasks/delete" class="flight-delete">
          <input type="hidden" name="id" value="${escapeHtml(t.id)}">
          <button type="submit" class="calc-btn">Delete this task</button>
        </form>
      </details>
    </li>`;
}

async function tasksPage() {
  const tasks = await loadTasks();
  const order = (a: Task, b: Task) =>
    `${a.due || "9999"} ${String(a.createdAt).padStart(15, "0")}`.localeCompare(
      `${b.due || "9999"} ${String(b.createdAt).padStart(15, "0")}`,
    );
  const open = tasks.filter((t) => !t.done).sort(order);
  const done = tasks.filter((t) => t.done).sort(order);
  const unassigned = open.filter((t) => !t.who).length;

  const body = `
  <section class="card">
    <h2>To do</h2>
    <div class="subtitle">${open.length} open${unassigned ? ` &middot; ${unassigned} unassigned` : ""}${
      STATIC ? " &middot; add and assign tasks on the trip server" : " &middot; tick the box when it's done, tap a task to reassign or edit it"
    }</div>
    <ul class="tasks">${open.length ? open.map(taskItem).join("\n") : `<li class="idea-empty">Nothing left to do.</li>`}</ul>
  </section>
  ${
    STATIC
      ? ""
      : `<section class="card">
    <h2>Add a task</h2>
    ${taskForm({}, "Add task")}
    <datalist id="people">${(await peopleNames()).map((n) => `<option value="${escapeHtml(n)}">`).join("")}</datalist>
  </section>`
  }
  ${
    done.length
      ? `<section class="card">
    <details class="flight-add">
      <summary><h2>Done (${done.length})</h2></summary>
      <ul class="tasks">${done.map(taskItem).join("\n")}</ul>
    </details>
  </section>`
      : ""
  }`;

  return layout("tasks", `Tasks — ${trip.title}`, body);
}

// ---------------------------------------------------------------- costs

const costs = (data as any).costs;

export { homePage, itineraryPage, flightsPage, housingPage, tasksPage, shortlistPage };

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
      return Response.redirect("/", 303);
    }

    if (url.pathname === "/shortlist") {
      return new Response(shortlistPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/flights/save" && req.method === "POST") {
      const form = await req.formData();
      const flights = await loadFlights();
      const id = String(form.get("id") ?? "");
      const i = id ? flights.findIndex((f) => f.id === id) : -1;
      const f = flightFromForm(form, i >= 0 ? flights[i] : undefined);
      if (f) {
        if (i >= 0) flights[i] = f;
        else flights.push(f);
        await saveFlights(flights);
      }
      return Response.redirect("/flights", 303);
    }

    // Renames a person on every leg they're logged on, both directions.
    if (url.pathname === "/flights/rename" && req.method === "POST") {
      const form = await req.formData();
      const from = String(form.get("from") ?? "").trim().toLowerCase();
      const to = String(form.get("to") ?? "").trim().slice(0, 60);
      if (from && to) {
        const flights = await loadFlights();
        for (const f of flights) if (f.who.trim().toLowerCase() === from) f.who = to;
        await saveFlights(flights);
      }
      return Response.redirect("/flights", 303);
    }

    if (url.pathname === "/flights/delete" && req.method === "POST") {
      const form = await req.formData();
      const id = String(form.get("id") ?? "");
      const flights = await loadFlights();
      await saveFlights(flights.filter((f) => f.id !== id));
      return Response.redirect("/flights", 303);
    }

    if (url.pathname === "/flights") {
      return new Response(await flightsPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/housing") {
      return new Response(housingPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/tasks/save" && req.method === "POST") {
      const form = await req.formData();
      const tasks = await loadTasks();
      const id = String(form.get("id") ?? "");
      const i = id ? tasks.findIndex((t) => t.id === id) : -1;
      const t = taskFromForm(form, i >= 0 ? tasks[i] : undefined);
      if (t) {
        if (i >= 0) tasks[i] = t;
        else tasks.push(t);
        await saveTasks(tasks);
      }
      return Response.redirect("/tasks", 303);
    }

    if (url.pathname === "/tasks/toggle" && req.method === "POST") {
      const form = await req.formData();
      const id = String(form.get("id") ?? "");
      const tasks = await loadTasks();
      const t = tasks.find((t) => t.id === id);
      if (t) {
        t.done = !t.done;
        await saveTasks(tasks);
      }
      return Response.redirect("/tasks", 303);
    }

    if (url.pathname === "/tasks/delete" && req.method === "POST") {
      const form = await req.formData();
      const id = String(form.get("id") ?? "");
      const tasks = await loadTasks();
      await saveTasks(tasks.filter((t) => t.id !== id));
      return Response.redirect("/tasks", 303);
    }

    if (url.pathname === "/tasks") {
      return new Response(await tasksPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // The cost calculator was removed; old links land on the front page.
    if (url.pathname === "/costs") {
      return Response.redirect("/", 301);
    }

    // The itinerary used to live here before it became the front page.
    if (url.pathname === "/itinerary") {
      return Response.redirect("/", 301);
    }

    if (url.pathname === "/glacier") {
      return new Response(homePage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response(await itineraryPage(), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`Trip site running at http://localhost:${port}`);
}
