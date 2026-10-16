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
  "Day 3 · Sat 10/17 (Sunrise hike, fly fishing)",
  "Day 4 · Sun 10/18 (Hike day)",
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
    --viz-temp: #eb6834;
    --viz-feels: #6f6659;
    --viz-rain: #2a78d6;
    --viz-wind: #1baf7a;
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
      --viz-temp: #d95926;
      --viz-feels: #9d9384;
      --viz-rain: #3987e5;
      --viz-wind: #199e70;
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
  .pill.person { color: var(--text); background: color-mix(in srgb, var(--p, #8a8f8c) 24%, transparent); }
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
  li.task.done { opacity: .5; background: var(--bg-alt); }
  li.task.done:hover, li.task.done:focus-within { opacity: .85; }
  ul.tasks.hide-done li.task.done { display: none; }
  .task-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .task-filter { font-size: .85rem; color: var(--muted); display: inline-flex; align-items: center; gap: .35rem; cursor: pointer; }
  .task-filter input { accent-color: var(--accent); width: 1rem; height: 1rem; }
  li.task.done .task-text { text-decoration: line-through; color: var(--muted); }
  .task-body { flex: 1; min-width: 0; }
  li.task { align-items: center; }
  form.task-edit { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .4rem; }
  form.task-edit input, form.task-edit textarea { font: inherit; color: var(--text); background: transparent; border: 1px solid transparent; border-radius: 6px; padding: .2rem .35rem; margin: 0; }
  form.task-edit input:hover, form.task-edit textarea:hover { border-color: var(--border); }
  form.task-edit input:focus, form.task-edit textarea:focus { outline: none; border-color: var(--accent); background: var(--bg); }
  form.task-edit .task-text { flex: 1 1 16rem; min-width: 0; margin: 0; resize: none; overflow: hidden; line-height: 1.4; field-sizing: content; }
  form.task-edit .task-who { flex: 0 1 10rem; width: 10rem; font-size: .92rem; font-weight: 600; color: var(--text); background: color-mix(in srgb, var(--p, #8a8f8c) 30%, transparent); border-radius: 999px; padding: .25rem .7rem; }
  form.task-edit .task-who.empty { background: transparent; border: 1px dashed var(--border); font-weight: 500; }
  form.task-edit .task-who:focus { border-color: var(--p, var(--accent)); }
  form.task-edit .task-who::placeholder { color: var(--muted); font-style: italic; }
  form.task-edit .task-due { flex: 0 0 auto; font-size: .8rem; color: var(--muted); }
  .task-saved { font-size: .72rem; color: var(--muted); min-width: 3.5rem; }
  .task-delete { border: 0; background: transparent; color: var(--muted); font-size: 1.15rem; line-height: 1; cursor: pointer; padding: .1rem .3rem; border-radius: 6px; }
  .task-delete:hover { color: #c25555; background: rgba(190,60,60,.12); }
  .task-body > summary { cursor: pointer; list-style: none; }
  .task-body > summary::-webkit-details-marker { display: none; }
  .task-body > summary:hover .task-text { text-decoration: underline; }
  .task-text { margin-right: .3rem; }

  table.forecast { min-width: 760px; }
  table.forecast td { vertical-align: top; }
  table.forecast.spots td:first-child { width: 17%; }
  table.forecast:not(.spots) td:first-child { width: 12%; white-space: nowrap; }
  table.forecast:not(.spots) td:nth-child(2), table.forecast:not(.spots) td:nth-child(3) { white-space: nowrap; }
  .wx-icon { font-size: 1.1rem; }
  .wx-head { display: flex; align-items: center; justify-content: space-between; gap: .6rem 1rem; flex-wrap: wrap; }
  .wx-head form { margin: 0; }
  .hourly-toggle { margin-top: .3rem; padding: .15rem .55rem; font: 600 .74rem var(--sans); color: var(--accent); background: transparent; border: 1px solid var(--border); border-radius: 999px; cursor: pointer; }
  .hourly-toggle:hover, .hourly-toggle[aria-expanded="true"] { border-color: var(--accent); }
  tr.hourly-row > td { padding: .4rem 0 .8rem; }
  .hourly-chart { position: sticky; left: 0; width: 0; min-width: 100%; }
  .hc-svg { display: block; font-family: var(--sans); touch-action: pan-y; outline: none; }
  .hc-svg:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
  .hc-night { fill: var(--bg-alt); }
  .hc-daysep { stroke: var(--border); stroke-width: 1; }
  .hc-grid { stroke: var(--border); stroke-width: 1; }
  .hc-base { stroke: var(--muted); stroke-opacity: .5; stroke-width: 1; }
  .hc-tick { fill: var(--muted); font-size: 10.5px; }
  .hc-title { fill: var(--muted); font-size: 10.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
  .hc-day { fill: var(--text); font-size: 11px; font-weight: 700; }
  .hc-icon { font-size: 14px; }
  .hc-endlabel { fill: var(--text); font-size: 11px; font-weight: 600; }
  .hc-peak { fill: var(--muted); font-size: 10.5px; font-weight: 600; }
  .hc-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .hc-area { stroke: none; fill-opacity: .16; }
  .hc-temp { stroke: var(--viz-temp); fill: var(--viz-temp); }
  .hc-feels { stroke: var(--viz-feels); fill: var(--viz-feels); }
  .hc-rain { stroke: var(--viz-rain); fill: var(--viz-rain); }
  .hc-wind { stroke: var(--viz-wind); fill: var(--viz-wind); }
  .hc-svg .hc-line { fill: none; }
  .hc-svg .hc-area { stroke: none; }
  .hc-line.hc-feels { stroke-width: 1.5; stroke-dasharray: 4 3; }
  .hc-area.hc-rain { fill-opacity: .12; }
  .hc-legend { fill: var(--text); font-size: 11.5px; }
  .hc-unit { font-size: 10.5px; font-weight: 700; }
  .hc-tick.hc-u-temp, .hc-unit.hc-u-temp { fill: var(--viz-temp); }
  .hc-tick.hc-u-rain, .hc-unit.hc-u-rain { fill: var(--viz-rain); }
  .hc-tick.hc-u-wind, .hc-unit.hc-u-wind { fill: var(--viz-wind); }
  tr.has-hourly { cursor: pointer; }
  tr.has-hourly:hover > td, tr.has-hourly.open > td { background: color-mix(in srgb, var(--accent) 5%, transparent); }
  .hc-area.hc-rain, .hc-area.hc-wind { stroke: none; }
  .hc-cross { stroke: var(--text); stroke-opacity: .45; stroke-width: 1; }
  .hc-dot { stroke: var(--card); stroke-width: 2; }
  .hc-tip { position: absolute; z-index: 2; pointer-events: none; background: var(--card); border: 1px solid var(--border); border-radius: 10px; box-shadow: var(--shadow); padding: .5rem .65rem; font-size: .8rem; line-height: 1.5; white-space: nowrap; }
  .hc-tip-head { font-weight: 700; margin-bottom: .15rem; }
  .hc-tip-row { display: flex; align-items: center; gap: .45rem; }
  .hc-tip-row strong { min-width: 3.4rem; }
  .hc-tip-row span:last-child { color: var(--muted); }
  .hc-key { display: inline-block; width: 14px; height: 0; border-top: 2px solid; }
  .hc-key.hc-temp { border-color: var(--viz-temp); }
  .hc-key.hc-feels { border-top-style: dashed; border-color: var(--viz-feels); }
  .hc-key.hc-rain { border-color: var(--viz-rain); }
  .hc-key.hc-wind { border-color: var(--viz-wind); }
  .wx-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin: .6rem 0 1rem; padding-top: .4rem; border-top: 0; gap: 1rem 2rem; }
  .wx-summary .total-big { font-size: clamp(1.4rem, 3.6vw, 1.9rem); }
  #hikes { scroll-margin-top: 4.5rem; }
  /* Hikes: one row each, three wide columns so cells don't stack up tall. */
  table.hikes { min-width: 760px; font-size: .9rem; line-height: 1.45; }
  table.hikes td { vertical-align: top; padding-top: .75rem; padding-bottom: .75rem; }
  table.hikes td.hk-name { width: 26%; }
  table.hikes td.hk-routes { width: 26%; }
  table.hikes td.hk-e2e { width: 11%; white-space: nowrap; }
  .hk-e2e strong { display: block; font-size: 1.15rem; margin-bottom: .15rem; }
  table.hikes td:first-child { padding-left: .7rem; }
  table.hikes td:last-child { padding-right: .6rem; }
  table.hikes tr.hk-no td { background: rgba(190,60,60,.06); }
  table.hikes tr.hk-no td:first-child { box-shadow: inset 3px 0 0 #c25555; }
  table.hikes tr.hk-check td:first-child { box-shadow: inset 3px 0 0 #b8842a; }
  table.hikes tr.hk-no .hk-routes { opacity: .7; }
  .hk-title { font-size: 1rem; }
  .hk-name .pill { white-space: nowrap; }
  .hk-sort { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin: .7rem 0 .2rem; }
  .hk-sort .section-label { margin: 0 .2rem 0 0; }
  .hk-sort .calc-btn.active { background: var(--accent); color: var(--on-dark); border-color: var(--accent); }
  .hk-sub { color: var(--muted); font-size: .85rem; margin-top: .15rem; }
  .hk-status { color: var(--muted); font-size: .85rem; margin: .35rem 0; }
  tr.hk-no .hk-status { color: #c25555; font-weight: 600; }
  .hk-foot { display: flex; flex-wrap: wrap; gap: .2rem .9rem; font-size: .85rem; }
  .hk-opt + .hk-opt { margin-top: .45rem; padding-top: .45rem; border-top: 1px dashed var(--border); }
  .hk-opt .section-label { display: inline; margin: 0; }
  .hk-cond > div + div { margin-top: .4rem; }
  .hk-now { display: flex; flex-wrap: wrap; gap: 0 .35rem; align-items: baseline; font-size: .85rem; }
  .hk-now .hk-pt { color: var(--muted); }
  .hk-days { display: grid; grid-template-columns: repeat(5, 1fr); gap: .25rem; text-align: center; font-size: .78rem; line-height: 1.3; }
  .hk-days > div { min-width: 0; background: var(--bg-alt); border-radius: 6px; padding: .25rem .1rem; }
  .hk-days .hk-day { display: block; color: var(--muted); }
  .hk-days .wx-icon { display: block; font-size: 1rem; }
  .hk-label { margin: 0 0 .15rem; }
  .hk-warn { margin: .35rem 0 0; padding: .45rem .7rem; border-radius: 10px; background: rgba(190,60,60,.1); color: #c25555; font-size: .9rem; }
  .table-scroll { overflow-x: auto; margin: .3rem -.2rem .2rem; padding: 0 .2rem; }
  table.compare { min-width: 720px; }
  table.compare td:first-child { color: var(--text); width: 22%; }
  table.compare td { vertical-align: top; }
  .cmp-pick td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
  .fare { font-weight: 600; white-space: nowrap; display: block; margin-bottom: .3rem; }
  .cmp-name { display: flex; align-items: baseline; gap: .4rem; flex-wrap: wrap; }

  /* ---------- house guide ---------- */
  .hg-codes { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .6rem; margin: .2rem 0 .6rem; }
  .hg-code { background: color-mix(in srgb, var(--accent) 9%, transparent); border-radius: 10px; padding: .55rem .75rem; }
  .hg-code .section-label { display: block; margin: 0 0 .1rem; }
  .hg-code strong { font-size: 1.6rem; letter-spacing: .08em; font-variant-numeric: tabular-nums; }
  .hg-hidden { display: block; background: var(--bg-alt); border-radius: 10px; padding: .6rem .8rem; color: var(--muted); }
  .hg-list { margin: 0 0 .9rem; padding-left: 1.2rem; }
  .hg-list li { margin: .15rem 0; }
  #house-guide .hk-label { margin-top: .9rem; }
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

type Route = "/" | "/glacier" | "/flights" | "/housing" | "/tasks" | "/forecast" | "/shortlist";
type Nav = "home" | "flights" | "housing" | "tasks" | "forecast" | "itinerary" | "shortlist";

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
  forecast: {
    file: "Lake McDonald Panorama - Montana - Glacier National Park (29788703722).jpg",
    credit: "Lake McDonald panorama",
    heading: "Nature forecast",
    tagline:
      "Weather, daylight and conditions for the trip, kept up to date.",
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
  <a href="${href("/")}" class="${activeNav === "itinerary" ? "active" : ""}">Itinerary</a>
  <a href="${href("/flights")}" class="${activeNav === "flights" ? "active" : ""}">Flights</a>
  <a href="${href("/housing")}" class="${activeNav === "housing" ? "active" : ""}">Housing</a>
  <a href="${href("/tasks")}" class="${activeNav === "tasks" ? "active" : ""}">Tasks</a>
  <a href="${href("/forecast")}" class="${activeNav === "forecast" ? "active" : ""}">Forecast</a>
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
    <a class="add-idea-link" href="${href("/tasks")}">To-dos and who's on them live on Tasks &rarr;</a>
  </section>`;

  // The itinerary waits at most 4s for the weather; a slow fetch keeps going
  // and fills the column on a later load. The static build waits it out.
  const wx = plan.hikes?.length
    ? await (STATIC ? loadHikeWx() : Promise.race([loadHikeWx(), Bun.sleep(4000).then(() => hikeCache)]))
    : null;
  const wxAsOf = wx
    ? new Date(wx.at).toLocaleString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " MT"
    : "";
  let wxIdx = 0;
  // One hike's conditions cell: now at the trailhead and the high point, then
  // each trip day at the high point (the coldest place you'll stand).
  const conditions = (h: any) => {
    const pts: any[] = h.points ?? [];
    const got = pts.map(() => wx?.points[wxIdx++] ?? null);
    if (!got.some(Boolean)) return `<span class="muted-cell">${hikeFetch ? "Still fetching conditions. Reload in a minute." : "No conditions data right now."}</span>`;
    const now = pts
      .map((pt, i) => {
        const w = got[i];
        if (!w) return "";
        const c = w.current;
        let [icon, label] = wmo(c.weather_code);
        if (!c.is_day && c.weather_code <= 1) icon = "🌙";
        const snow = c.snow_depth >= 0.1 ? ` &middot; ${Math.round(c.snow_depth * 12)} in snow down` : "";
        return `<div class="hk-now"><span class="hk-pt">${escapeHtml(pt.name)}, ${pt.ft.toLocaleString("en-US")} ft</span> <span class="wx-icon" title="${label}">${icon}</span> <strong>${deg(c.temperature_2m)}</strong> <span class="muted-cell">feels ${deg(c.apparent_temperature)} &middot; wind ${Math.round(c.wind_speed_10m)} mph${snow}</span></div>`;
      })
      .join("");
    const top = got[got.length - 1] ?? got.find(Boolean)!;
    const topName = pts[got.lastIndexOf(top)]?.name ?? "";
    const days = top.daily.time
      .map((d, i) => {
        const [icon, label] = wmo(top.daily.weather_code[i]);
        const snow = top.daily.snowfall_sum[i] >= 0.1 ? `<br>${top.daily.snowfall_sum[i].toFixed(1)}" snow` : "";
        return `<div title="${label}, ${top.daily.precipitation_probability_max[i]}% chance of rain/snow"><span class="hk-day">${escapeHtml(fmtDate(d).split(",")[0])}</span><span class="wx-icon">${icon}</span>${Math.round(top.daily.temperature_2m_max[i])}°/${Math.round(top.daily.temperature_2m_min[i])}°<br><span class="muted-cell">${top.daily.precipitation_probability_max[i]}%${snow}</span></div>`;
      })
      .join("");
    return `<div><div class="section-label hk-label">Now</div>${now}</div><div><div class="section-label hk-label">Trip days at ${escapeHtml(topName)}</div><div class="hk-days">${days}</div></div>`;
  };

  const hikesBlock = plan.hikes?.length
    ? `
  <section class="card" id="hikes">
    <h2>Hikes and the Sun Road</h2>
    <div class="wx-head">
      <div class="subtitle">Not yet on a day. Check the park's road and trail status before committing to one.${wxAsOf ? ` Conditions updated ${escapeHtml(wxAsOf)}.` : ""}</div>
      ${STATIC ? "" : `<form method="POST" action="/hikes/refresh"><button type="submit" class="calc-btn">&#8635; Refresh conditions</button></form>`}
    </div>
    ${(() => {
      const no = plan.hikes.filter((h: any) => h.doable === "no").map((h: any) => h.name);
      return no.length ? `<div class="hk-warn">&#9888; Not doable right now: <strong>${no.map(escapeHtml).join(", ")}</strong>. Marked in red below.</div>` : "";
    })()}
    <div class="hk-sort" role="group" aria-label="Sort hikes">
      <span class="section-label">Sort by</span>
      <button type="button" class="calc-btn active" data-sort="drive" aria-pressed="true">Driving distance</button>
      <button type="button" class="calc-btn" data-sort="miles" aria-pressed="false">Hiking distance</button>
      <button type="button" class="calc-btn" data-sort="total" aria-pressed="false">End-to-end time</button>
    </div>
    <div class="table-scroll">
    <table class="hikes">
      <tr><th>Hike or drive</th><th>Routes</th><th>End to end</th><th>Conditions</th></tr>
      ${plan.hikes
        .map((h: any) => {
          const opt = (label: string, o: any) => `<div class="hk-opt"><span class="section-label">${label}</span> <strong>${escapeHtml(o.length)} &middot; ${escapeHtml(o.time)}</strong> <span class="muted-cell">&middot; ${escapeHtml(o.gain)}</span><br>${escapeHtml(o.route)}</div>`;
          const flag = h.doable === "no" ? `<span class="pill gone">Not doable</span>` : h.doable === "check" ? `<span class="pill partial">Check first</span>` : "";
          const s = h.sort ?? {};
          const total = s.driveMin != null ? (2 * s.driveMin) / 60 + s.hikeHrs : null;
          const drv = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ""}`);
          return `<tr${h.doable ? ` class="hk-${h.doable === "no" ? "no" : "check"}"` : ""} data-drive="${s.driveMin ?? 999}" data-miles="${s.hikeMi ?? 999}" data-total="${total ?? 999}" data-closed="${h.doable === "no" ? 1 : 0}">
        <td class="hk-name">
          <strong class="hk-title">${escapeHtml(h.name)}</strong>${flag ? ` ${flag}` : ""}
          <div class="hk-sub">${h.difficulty ? `${escapeHtml(h.difficulty)} &middot; ` : ""}&#128663; From Whitefish: ${escapeHtml(h.fromWhitefish ?? h.drive)}</div>
          <p class="hk-status">${escapeHtml(h.status)}</p>
          <div class="hk-foot">${(h.nps ?? []).map((l: any) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)} &rarr;</a>`).join("")}</div>
        </td>
        <td class="hk-routes">${opt(h.short ? "Full" : "Route", h.full)}${h.short ? opt("Short", h.short) : ""}</td>
        <td class="hk-e2e">${total != null ? `<strong>~${fmtHrs(total)}</strong><span class="muted-cell">${drv(s.driveMin)} there<br>${s.hikeMi ? `${fmtHrs(s.hikeHrs)} hiking` : `${fmtHrs(s.hikeHrs)} of stops`}<br>${drv(s.driveMin)} back</span>` : ""}</td>
        <td class="hk-cond">${conditions(h)}</td>
      </tr>`;
        })
        .join("\n      ")}
    </table>
    </div>
    <script>
    // Shortest first; routes that aren't doable stay at the bottom.
    (() => {
      const table = document.querySelector("table.hikes");
      const btns = document.querySelectorAll(".hk-sort button");
      btns.forEach((b) => b.addEventListener("click", () => {
        const key = b.dataset.sort;
        const rows = [...table.querySelectorAll("tr[data-drive]")];
        rows.sort((x, y) => x.dataset.closed - y.dataset.closed || x.dataset[key] - y.dataset[key]);
        rows.forEach((r) => r.parentNode.appendChild(r));
        btns.forEach((o) => { o.classList.toggle("active", o === b); o.setAttribute("aria-pressed", o === b); });
      }));
    })();
    </script>
    <div class="calc-note">End to end is the drive there, the hike and the drive back, without stops. Distances are by road from downtown Whitefish, about a mile from the house (<a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">OpenStreetMap</a> routing), without stops. Weather from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>, adjusted for each spot's elevation. Rain/snow % is the day's highest chance. It doesn't know about road or trail closures; see the park's <a href="https://www.nps.gov/glac/planyourvisit/conditions.htm" target="_blank" rel="noopener">current conditions</a> for those.</div>
  </section>`
    : "";

  return layout(
    "itinerary",
    trip.title,
    header + "\n" + hikesBlock + "\n" + dayBlocks + "\n" + generalBlock,
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

// The property manager's house guide. Door codes live in access.json, which is
// git-ignored, and only the trip server shows them: the repo and the Pages
// build are public.
const ACCESS_PATH = `${import.meta.dir}/access.json`;

function loadAccess(): { garage: string; interior: string; lockbox: string; guideUrl: string } | null {
  if (STATIC) return null;
  try {
    return JSON.parse(require("fs").readFileSync(ACCESS_PATH, "utf8"));
  } catch {
    return null;
  }
}

function guideBlock() {
  const g = housing.guide;
  if (!g) return "";
  const a = loadAccess();
  const code = (label: string, v: string) => `<div class="hg-code"><span class="section-label">${label}</span><strong>${escapeHtml(v)}</strong></div>`;
  const codes = a
    ? `<div class="hg-codes">${code("Garage keypad, then Enter", a.garage)}${code("Inside door", a.interior)}${code("Backup lockbox", a.lockbox)}</div>`
    : `<div class="hg-codes hg-hidden">Door codes aren't on the public site. Get them from Dan or the guide link Vacay texted him.</div>`;
  return `
  <section class="card" id="house-guide">
    <h2>House guide</h2>
    <div class="subtitle">${escapeHtml(g.name)}, managed by ${escapeHtml(g.manager)}. From their guest guide${a ? `: <a href="${escapeHtml(a.guideUrl)}" target="_blank" rel="noopener">open it</a>` : ""}.</div>
    <div class="section-label hk-label">Getting in</div>
    ${codes}
    <ul class="hg-list">${g.access.map((x: string) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <table>
      ${g.rows.map((r: string[]) => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td></tr>`).join("\n      ")}
    </table>
    <div class="section-label hk-label">Checkout, Mon 10/19</div>
    <ul class="hg-list">${g.checkout.map((x: string) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <div class="section-label hk-label">Vacay recommends</div>
    <table>
      ${g.recs.map((r: any) => `<tr><td>${escapeHtml(r[0])}</td><td>${r[1].map((x: string) => escapeHtml(x)).join(" &middot; ")}</td></tr>`).join("\n      ")}
    </table>
  </section>`;
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
          <tr><td>Check-in / out</td><td>${escapeHtml(b.checkInOut)}${b.checkInNote ? `<div class="muted-cell">${escapeHtml(b.checkInNote)}</div>` : ""}</td></tr>
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

${guideBlock()}

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

// One color per person, so whose task is whose reads at a glance. People in
// the flight log get palette slots in name order (no two share a color);
// anyone else is hashed onto the palette. "Everyone" stays neutral.
const PERSON_COLORS = ["#3a86ff", "#e4572e", "#2a9d8f", "#9b5de5", "#f4a300", "#e05297", "#6a994e", "#00a6d6", "#8d6e63", "#577590"];

function personColors(names: string[]) {
  const map: Record<string, string> = {};
  names.filter((n) => n !== "Everyone").forEach((n, i) => (map[n.toLowerCase()] = PERSON_COLORS[i % PERSON_COLORS.length]));
  return map;
}

let taskColors: Record<string, string> = {};

function colorFor(who: string) {
  const k = who.trim().toLowerCase();
  if (!k || k === "everyone") return "";
  if (taskColors[k]) return taskColors[k];
  let h = 0;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PERSON_COLORS[h % PERSON_COLORS.length];
}

function taskItem(t: Task) {
  const meta = `${t.who ? `<span class="pill person"${colorFor(t.who) ? ` style="--p:${colorFor(t.who)}"` : ""}>${escapeHtml(t.who)}</span>` : `<span class="pill partial">unassigned</span>`}${
    t.due ? ` <span class="muted-cell">due ${escapeHtml(fmtDate(t.due))}</span>` : ""
  }`;
  if (STATIC) {
    return `<li class="task${t.done ? " done" : ""}"><span class="task-check">${t.done ? "&#10003;" : ""}</span>
      <div class="task-body"><span class="task-text">${escapeHtml(t.text)}</span> ${meta}</div></li>`;
  }
  // Each field is its own borderless input: click the name, person or date
  // and type. The script at the bottom of the page saves on change.
  const v = (x: string) => escapeHtml(x);
  return `<li class="task${t.done ? " done" : ""}">
      <form method="POST" action="/tasks/toggle"><input type="hidden" name="id" value="${v(t.id)}">
        <button type="submit" class="task-check" title="${t.done ? "Mark not done" : "Mark done"}">${t.done ? "&#10003;" : ""}</button></form>
      <form method="POST" action="/tasks/save" class="task-edit">
        <input type="hidden" name="id" value="${v(t.id)}">
        <textarea name="text" class="task-text" required maxlength="280" rows="1" aria-label="Task">${v(t.text)}</textarea>
        <input type="text" name="who" class="task-who${t.who ? "" : " empty"}" maxlength="60" list="people" placeholder="Unassigned" value="${v(t.who)}" aria-label="Assigned to"${colorFor(t.who) ? ` style="--p:${colorFor(t.who)}"` : ""}>
        <input type="date" name="due" class="task-due" value="${v(t.due)}" aria-label="Due">
        <span class="task-saved" aria-live="polite"></span>
      </form>
      <form method="POST" action="/tasks/delete">
        <input type="hidden" name="id" value="${v(t.id)}">
        <button type="submit" class="task-delete" title="Delete this task" aria-label="Delete this task">&times;</button>
      </form>
    </li>`;
}

async function tasksPage() {
  const tasks = await loadTasks();
  const people = await peopleNames();
  taskColors = personColors(people);
  const order = (a: Task, b: Task) =>
    `${a.due || "9999"} ${String(a.createdAt).padStart(15, "0")}`.localeCompare(
      `${b.due || "9999"} ${String(b.createdAt).padStart(15, "0")}`,
    );
  const all = [...tasks].sort(order);
  const open = all.filter((t) => !t.done);
  const doneCount = all.length - open.length;
  const unassigned = open.filter((t) => !t.who).length;

  // Completed tasks stay in the list, grayed out; the toggle hides them and
  // the choice is remembered per browser.
  const body = `
  <section class="card">
    <div class="task-head">
      <h2>To do</h2>
      ${doneCount ? `<label class="task-filter"><input type="checkbox" id="hide-done"> Hide completed (${doneCount})</label>` : ""}
    </div>
    <div class="subtitle">${open.length} open${doneCount ? ` &middot; ${doneCount} done` : ""}${unassigned ? ` &middot; ${unassigned} unassigned` : ""}${
      STATIC ? " &middot; add and assign tasks on the trip server" : " &middot; tick the box when it's done; click a task, person or date to change it"
    }</div>
    <ul class="tasks" id="task-list">${all.length ? all.map(taskItem).join("\n") : `<li class="idea-empty">Nothing to do yet.</li>`}</ul>
  </section>
  ${
    STATIC
      ? ""
      : `<section class="card">
    <h2>Add a task</h2>
    ${taskForm({}, "Add task")}
    <datalist id="people">${people.map((n) => `<option value="${escapeHtml(n)}">`).join("")}</datalist>
  </section>`
  }
  <script>
  (function () {
    var box = document.getElementById("hide-done"), list = document.getElementById("task-list");
    if (!box) return;
    try { box.checked = localStorage.getItem("tasks-hide-done") === "1"; } catch (e) {}
    var apply = function () { list.classList.toggle("hide-done", box.checked); };
    apply();
    box.addEventListener("change", function () {
      apply();
      try { localStorage.setItem("tasks-hide-done", box.checked ? "1" : "0"); } catch (e) {}
    });
  })();
  </script>
  ${STATIC ? "" : `<script>
  var COLORS = ${JSON.stringify(PERSON_COLORS)}, KNOWN = ${JSON.stringify(taskColors)};
  function colorFor(who) {
    var k = who.trim().toLowerCase();
    if (!k || k === "everyone") return "";
    if (KNOWN[k]) return KNOWN[k];
    var h = 0;
    for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }
  // Inline edits: save a row whenever one of its fields changes, no reload.
  document.querySelectorAll("form.task-edit").forEach(function (form) {
    var saved = form.querySelector(".task-saved");
    form.querySelectorAll("input:not([type=hidden]), textarea").forEach(function (input) {
      input.dataset.orig = input.value;
      // Grow the task name to fit, for browsers without field-sizing.
      if (input.tagName === "TEXTAREA") {
        var fit = function () { input.style.height = "auto"; input.style.height = input.scrollHeight + 2 + "px"; };
        fit();
        input.addEventListener("input", fit);
        window.addEventListener("resize", fit);
      }
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); input.blur(); }
        if (e.key === "Escape") { input.value = input.dataset.orig; input.blur(); }
      });
      input.addEventListener("change", function () {
        if (input.name === "text" && !input.value.trim()) { input.value = input.dataset.orig; return; }
        if (input.name === "who") {
          input.classList.toggle("empty", !input.value.trim());
          input.style.setProperty("--p", colorFor(input.value));
        }
        saved.textContent = "saving…";
        fetch(form.action, { method: "POST", body: new FormData(form), headers: { "x-inline": "1" } })
          .then(function (r) {
            if (!r.ok) throw r;
            input.dataset.orig = input.value;
            saved.textContent = "saved";
            setTimeout(function () { saved.textContent = ""; }, 1500);
          })
          .catch(function () { saved.textContent = "not saved, try again"; });
      });
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  });
  </script>`}`;

  return layout("tasks", `Tasks — ${trip.title}`, body);
}

// ---------------------------------------------------------------- forecast

// Live trip-dates forecast from Open-Meteo (free, no key). The server caches
// it for an hour; the static build bakes in whatever it got at build time and
// says when that was.
const FORECAST_SPOTS = [
  { key: "whitefish", name: "Whitefish", note: "Base, Lion Mountain", lat: 48.411, lon: -114.338 },
  { key: "mcdonald", name: "Lake McDonald", note: "Avalanche Lake, Apgar Lookout", lat: 48.62, lon: -113.88 },
  { key: "middlefork", name: "Middle Fork Flathead", note: "Fly fishing, floats", lat: 48.47, lon: -113.99 },
  { key: "twomed", name: "Two Medicine", note: "Dawson Pass", lat: 48.49, lon: -113.37 },
  { key: "manyglacier", name: "Many Glacier", note: "Grinnell Glacier", lat: 48.8, lon: -113.67 },
];

type Daily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  daylight_duration: number[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
  snowfall_sum: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
};

type Hourly = {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  weather_code: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  is_day: number[];
};

let forecastCache: { at: number; spots: (Daily | null)[]; hourly: (Hourly | null)[] } | null = null;

// `force` skips the hour cache (the Refresh button), but never more than once
// a minute so a mashed button can't hammer the API.
async function loadForecast(force = false) {
  const age = forecastCache ? Date.now() - forecastCache.at : Infinity;
  if (age < (force ? 60 * 1000 : 60 * 60 * 1000)) return forecastCache;
  const p = new URLSearchParams({
    latitude: FORECAST_SPOTS.map((s) => s.lat).join(","),
    longitude: FORECAST_SPOTS.map((s) => s.lon).join(","),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,precipitation_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    hourly: "temperature_2m,apparent_temperature,weather_code,precipitation_probability,wind_speed_10m,is_day",
    timezone: "America/Denver",
    start_date: housing.checkin,
    end_date: housing.checkout,
  });
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const json = await r.json();
    const list = Array.isArray(json) ? json : [json];
    forecastCache = {
      at: Date.now(),
      spots: list.map((x: any) => x.daily ?? null),
      hourly: list.map((x: any) => x.hourly ?? null),
    };
  } catch (e) {
    console.error("forecast fetch failed:", e);
    // Keep serving the last good forecast if there is one.
    if (!forecastCache) return null;
  }
  return forecastCache;
}

// Conditions at each hike's trailhead and high point: right now, plus the
// trip days. Open-Meteo scales temps to the elevation we pass, so the high
// point reads colder than the valley. Same cache rules as the forecast.
type HikeWx = {
  current: { temperature_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number; snow_depth: number; is_day: number } // snow_depth in ft (inch units);
  daily: Pick<Daily, "time" | "weather_code" | "temperature_2m_max" | "temperature_2m_min" | "precipitation_probability_max" | "snowfall_sum">;
};
let hikeCache: { at: number; points: (HikeWx | null)[] } | null = null;
let hikeFetch: Promise<typeof hikeCache> | null = null;

// One fetch at a time; callers that arrive mid-fetch share it.
function loadHikeWx(force = false) {
  const age = hikeCache ? Date.now() - hikeCache.at : Infinity;
  if (age < (force ? 60 * 1000 : 60 * 60 * 1000)) return Promise.resolve(hikeCache);
  return (hikeFetch ??= fetchHikeWx().finally(() => (hikeFetch = null)));
}

async function fetchHikeWx() {
  const pts = (plan.hikes ?? []).flatMap((h: any) => h.points ?? []);
  if (!pts.length) return null;
  const p = new URLSearchParams({
    latitude: pts.map((x: any) => x.lat).join(","),
    longitude: pts.map((x: any) => x.lon).join(","),
    elevation: pts.map((x: any) => Math.round(x.ft * 0.3048)).join(","),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,snow_depth,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "America/Denver",
    start_date: housing.checkin,
    end_date: housing.checkout,
  });
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal: AbortSignal.timeout(45000) });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const json = await r.json();
    const list = Array.isArray(json) ? json : [json];
    hikeCache = { at: Date.now(), points: list.map((x: any) => (x.current && x.daily ? x : null)) };
  } catch (e) {
    console.error("hike conditions fetch failed:", e);
    if (!hikeCache) return null;
  }
  return hikeCache;
}

// WMO weather codes, as Open-Meteo reports them.
function wmo(code: number): [string, string] {
  if (code === 0) return ["☀️", "Clear"];
  if (code === 1) return ["🌤️", "Mostly clear"];
  if (code === 2) return ["⛅", "Partly cloudy"];
  if (code === 3) return ["☁️", "Overcast"];
  if (code === 45 || code === 48) return ["🌫️", "Fog"];
  if (code >= 51 && code <= 57) return ["🌦️", "Drizzle"];
  if (code >= 61 && code <= 67) return ["🌧️", code >= 65 ? "Heavy rain" : "Rain"];
  if (code >= 71 && code <= 77) return ["🌨️", code >= 75 ? "Heavy snow" : "Snow"];
  if (code >= 80 && code <= 82) return ["🌦️", "Showers"];
  if (code === 85 || code === 86) return ["🌨️", "Snow showers"];
  if (code >= 95) return ["⛈️", "Thunderstorms"];
  return ["", "—"];
}

function uvLabel(uv: number) {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  return "very high";
}

const clock = (iso: string) => fmtTime(iso.slice(11, 16));
const hrs = (sec: number) => `${Math.floor(sec / 3600)}h ${String(Math.round((sec % 3600) / 60)).padStart(2, "0")}m`;
const fmtHrs = (h: number) => `${Math.round(h * 2) / 2} hrs`; // nearest half hour
const deg = (n: number) => `${Math.round(n)}°C`;

// Moon phase for stargazing, from the mean synodic month (good to a day).
function moonPhase(date: string) {
  const days = (Date.parse(`${date}T04:00:00Z`) - Date.parse("2000-01-06T18:14:00Z")) / 86400000;
  const age = ((days % 29.530588853) + 29.530588853) % 29.530588853;
  const lit = Math.round(((1 - Math.cos((2 * Math.PI * age) / 29.530588853)) / 2) * 100);
  const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  return { name: names[Math.floor(((age + 1.845) / 29.530588853) * 8) % 8], lit };
}

// The hours for one day (or every trip day, when `day` is omitted) as data
// for the client-side chart: temp and feels-like share one °C chart, rain
// chance and wind get their own, all on one hour axis.
function hourlyChart(h: Hourly | null | undefined, day?: string) {
  if (!h) return `<div class="calc-note">No hourly data.</div>`;
  const idx = h.time.map((t, i) => (!day || t.startsWith(day) ? i : -1)).filter((i) => i >= 0);
  const icons: string[] = [], labels: string[] = [];
  for (const i of idx) {
    let [icon, label] = wmo(h.weather_code[i]);
    if (!h.is_day[i] && h.weather_code[i] <= 1) icon = "🌙";
    if (!h.is_day[i] && h.weather_code[i] === 2) icon = "☁️";
    icons.push(icon);
    labels.push(label);
  }
  const pick = (a: number[]) => idx.map((i) => Math.round(a[i] * 10) / 10);
  const data = {
    t: idx.map((i) => h.time[i]),
    temp: pick(h.temperature_2m),
    feels: pick(h.apparent_temperature),
    rain: pick(h.precipitation_probability),
    wind: pick(h.wind_speed_10m),
    day: idx.map((i) => h.is_day[i]),
    icon: icons,
    label: labels,
  };
  return `<div class="hourly-chart" data-hours="${escapeHtml(JSON.stringify(data))}"></div>`;
}

async function forecastPage() {
  const fc = await loadForecast();
  const base = fc?.spots[0];
  const asOf = fc
    ? new Date(fc.at).toLocaleString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " MT"
    : "";

  const dayName = (d: string) => fmtDate(d);

  const mainTable = base
    ? `<div class="table-scroll">
    <table class="forecast">
      <tr><th>Day</th><th>Weather</th><th>High / low</th><th>Rain / snow</th><th>UV</th><th>Wind</th><th>Sunrise / sunset</th></tr>
      ${base.time
        .map((d, i) => {
          const [icon, label] = wmo(base.weather_code[i]);
          const snow = base.snowfall_sum[i] >= 0.1 ? `, ${base.snowfall_sum[i].toFixed(1)} in snow` : "";
          const moon = moonPhase(d);
          return `<tr>
        <td><strong>${escapeHtml(dayName(d))}</strong><br><button type="button" class="hourly-toggle" aria-expanded="false">Hourly &#9662;</button></td>
        <td><span class="wx-icon">${icon}</span> ${label}</td>
        <td><strong>${deg(base.temperature_2m_max[i])}</strong> / ${deg(base.temperature_2m_min[i])}</td>
        <td>${base.precipitation_probability_max[i]}%<span class="muted-cell">${base.precipitation_sum[i] >= 0.01 ? ` &middot; ${base.precipitation_sum[i].toFixed(2)} in` : ""}${snow}</span></td>
        <td>${base.uv_index_max[i].toFixed(1)} <span class="muted-cell">${uvLabel(base.uv_index_max[i])}</span></td>
        <td>${Math.round(base.wind_speed_10m_max[i])} mph<span class="muted-cell"> &middot; gusts ${Math.round(base.wind_gusts_10m_max[i])}</span></td>
        <td>${clock(base.sunrise[i])} / ${clock(base.sunset[i])}<br><span class="muted-cell">${hrs(base.daylight_duration[i])} of light &middot; ${moon.name.toLowerCase()}, ${moon.lit}% lit</span></td>
      </tr>
      <tr class="hourly-row" hidden><td colspan="7">${hourlyChart(fc?.hourly[0], d)}</td></tr>`;
        })
        .join("\n      ")}
    </table>
    </div>`
    : `<div class="caveat">The forecast service didn't answer. Try again in a few minutes.</div>`;

  const spotsTable =
    fc && base
      ? `<div class="table-scroll">
    <table class="forecast spots">
      <tr><th>Where</th>${base.time.map((d) => `<th>${escapeHtml(dayName(d))}</th>`).join("")}</tr>
      ${FORECAST_SPOTS.map((s, si) => {
        const f = fc.spots[si];
        if (!f) return "";
        return `<tr>
        <td><strong>${escapeHtml(s.name)}</strong><br><span class="muted-cell">${escapeHtml(s.note)}</span><br><button type="button" class="hourly-toggle" aria-expanded="false">Hourly &#9662;</button></td>
        ${f.time
          .map((_, i) => {
            const [icon, label] = wmo(f.weather_code[i]);
            const snow = f.snowfall_sum[i] >= 0.1 ? `<br><span class="muted-cell">${f.snowfall_sum[i].toFixed(1)} in snow</span>` : "";
            return `<td><span class="wx-icon" title="${label}">${icon}</span> <strong>${deg(f.temperature_2m_max[i])}</strong>/${deg(f.temperature_2m_min[i])}<br><span class="muted-cell">${f.precipitation_probability_max[i]}% precip &middot; UV ${f.uv_index_max[i].toFixed(1)}</span>${snow}</td>`;
          })
          .join("")}
      </tr>
      <tr class="hourly-row" hidden><td colspan="${f.time.length + 1}">${hourlyChart(fc.hourly[si])}</td></tr>`;
      }).join("\n      ")}
    </table>
    </div>`
      : "";

  // Headline numbers across the whole trip at the base.
  const summary = base
    ? (() => {
        const hi = Math.max(...base.temperature_2m_max), lo = Math.min(...base.temperature_2m_min);
        const uv = Math.max(...base.uv_index_max);
        const wet = Math.max(...base.precipitation_probability_max);
        return `<div class="total-row wx-summary">
      <div><span class="total-label">Temp range</span><span class="total-big">${deg(lo)}–${deg(hi)}</span></div>
      <div><span class="total-label">Sunrise / sunset</span><span class="total-big">${clock(base.sunrise[0])} / ${clock(base.sunset[0])}</span></div>
      <div><span class="total-label">Max UV</span><span class="total-big">${uv.toFixed(1)}</span></div>
      <div><span class="total-label">Wettest day</span><span class="total-big">${wet}%</span></div>
    </div>`;
      })()
    : "";

  const body = `
  <section class="card">
    <div class="pick-badge">Whitefish</div>
    <h2>Trip forecast</h2>
    <div class="wx-head">
      <div class="subtitle">${escapeHtml(fmtDate(housing.checkin))} to ${escapeHtml(fmtDate(housing.checkout))}${asOf ? ` &middot; updated ${escapeHtml(asOf)}` : ""}</div>
      ${STATIC ? "" : `<form method="POST" action="/forecast/refresh"><button type="submit" class="calc-btn">&#8635; Refresh forecast</button></form>`}
    </div>
    ${summary}
    ${mainTable}
    <div class="calc-note">Forecast from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>. Times are Mountain. Days further out will shift; hit refresh the night before.</div>
  </section>

  <section class="card">
    <h2>In the park</h2>
    <div class="subtitle">High / low, chance of rain or snow, and UV at each place on the plan. Trailheads and passes run colder than these valley numbers.</div>
    ${spotsTable}
  </section>

  <section class="card">
    <h2>Know before you go</h2>
    <table>
      <tr><td>Roads</td><td>The Sun Road is closed from Avalanche Creek to Logan Pass (snow, since Oct 9), so no Logan Pass or Highline. The Two Medicine Road is closed at Running Eagle Falls for construction. Text <strong>GNPROADS</strong> to 333111 for live status.</td></tr>
      <tr><td>Bears</td><td>Bears are feeding hard before winter. Carry bear spray where you can reach it, hike in a group and make noise on blind corners.</td></tr>
      <tr><td>Hunting</td><td>Hunting seasons are open on national forest land outside the park, including along the Middle Fork. Wear something bright off park trails.</td></tr>
      <tr><td>Cold water</td><td>The Middle Fork is snowmelt-cold in October. Layers that stay warm wet (no cotton) and a dry change of clothes in the car.</td></tr>
      <tr><td>Fall color</td><td>Western larch turn gold mid to late October; look for them on the hillsides around Lake McDonald and the North Fork.</td></tr>
      <tr><td>Sun</td><td>UV stays moderate this late in the year, but it bounces off snow and water. Sunglasses and sunscreen for the float and anything above treeline.</td></tr>
      <tr><td>Daylight</td><td>About 10h 45m of light. Start long hikes by 9 AM so you're off the trail before the ~6:45 PM sunset.</td></tr>
    </table>
    <a class="add-idea-link" href="https://www.nps.gov/glac/planyourvisit/conditions.htm" target="_blank" rel="noopener">Park road and trail conditions &rarr;</a>
  </section>`;

  const script = `<script>
(function () {
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(attrs, s, parent) {
    var t = el("text", attrs, parent);
    t.textContent = s;
    return t;
  }
  function hourLabel(iso) {
    var h = +iso.slice(11, 13);
    return (h % 12 || 12) + (h < 12 ? "a" : "p");
  }
  function dayLabel(iso) {
    var d = new Date(iso.slice(0, 10) + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  // The smallest round step that spans [lo, hi] in exactly that many intervals.
  function scale(lo, hi, parts, floorZero) {
    var raw = Math.max(1, (hi - lo) / parts), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(function (m) { return m * mag; });
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i], a = floorZero ? 0 : Math.floor(lo / s) * s;
      if (a + parts * s >= hi) return { lo: a, hi: a + parts * s, step: s };
    }
    var s2 = 10 * mag * 2, a2 = floorZero ? 0 : Math.floor(lo / s2) * s2;
    return { lo: a2, hi: a2 + parts * s2, step: s2 };
  }

  // One plot, four lines: temp and feels-like on the left °C axis, rain chance
  // and wind on the right. Each axis is colored like its line so the units
  // read at a glance; gridlines are shared (four intervals on every scale).
  function render(box) {
    var d = JSON.parse(box.dataset.hours);
    var n = d.t.length;
    box.textContent = "";
    var sc = box.closest(".table-scroll");
    var vis = sc ? sc.getBoundingClientRect().right - box.getBoundingClientRect().left : box.clientWidth;
    var W = Math.max(260, Math.floor(Math.min(box.clientWidth, vis)));
    box.style.maxWidth = W + "px";
    var narrow = W < 520;
    var L = 34, R = narrow ? 64 : 76, legendH = 24, iconH = 22, plotH = narrow ? 190 : 220, axisH = n > 24 ? 34 : 20;
    var top = legendH + iconH + 16, bottom = top + plotH, H = bottom + axisH;
    var x = function (i) { return L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1)); };
    var step = n > 1 ? x(1) - x(0) : 0;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "hc-svg", role: "img", tabindex: "0",
      "aria-label": "Hourly temperature, feels-like, rain chance and wind. Use arrow keys to step through hours." }, box);

    var PARTS = 4;
    var all = d.temp.concat(d.feels);
    var sT = scale(Math.min.apply(null, all), Math.max.apply(null, all), PARTS, false);
    var sR = { lo: 0, hi: 100, step: 25 };
    var sW = scale(0, Math.max.apply(null, d.wind), PARTS, true);
    var yOf = function (s) { return function (v) { return bottom - ((v - s.lo) / (s.hi - s.lo)) * plotH; }; };
    var yT = yOf(sT), yR = yOf(sR), yW = yOf(sW);

    // Legend: line keys in series color, names in ink.
    var lx = L;
    [["temp", "Temp"], ["feels", "Feels like"], ["rain", "Rain chance"], ["wind", "Wind"]].forEach(function (k) {
      el("line", { x1: lx, x2: lx + 16, y1: 12, y2: 12, class: "hc-line hc-" + k[0] }, svg);
      var t = txt({ x: lx + 21, y: 16, class: "hc-legend" }, k[1], svg);
      lx += 21 + t.getComputedTextLength() + 16;
    });

    // Night shading and day boundaries.
    for (var i = 0; i < n; i++) {
      if (!d.day[i]) el("rect", { x: Math.max(L, x(i) - step / 2), y: top, width: step + 0.5, height: plotH, class: "hc-night" }, svg);
    }
    for (i = 1; i < n; i++) {
      if (d.t[i].slice(11, 13) === "00") el("line", { x1: x(i), x2: x(i), y1: top - 4, y2: bottom + 4, class: "hc-daysep" }, svg);
    }

    // Shared gridlines; each scale labels them in its own color.
    for (var g = 0; g <= PARTS; g++) {
      var gy = bottom - (g / PARTS) * plotH;
      el("line", { x1: L, x2: W - R, y1: gy, y2: gy, class: g === 0 ? "hc-base" : "hc-grid" }, svg);
      txt({ x: L - 6, y: gy + 4, "text-anchor": "end", class: "hc-tick hc-u-temp" }, String(Math.round(sT.lo + g * sT.step)), svg);
      txt({ x: W - R + 6, y: gy + 4, class: "hc-tick hc-u-rain" }, Math.round(g * sR.step) + "%", svg);
      txt({ x: W - 4, y: gy + 4, "text-anchor": "end", class: "hc-tick hc-u-wind" }, String(Math.round(g * sW.step)), svg);
    }
    // Unit headers above each axis.
    txt({ x: L - 6, y: top - 8, "text-anchor": "end", class: "hc-unit hc-u-temp" }, "°C", svg);
    txt({ x: W - R + 6, y: top - 8, class: "hc-unit hc-u-rain" }, "rain", svg);
    txt({ x: W - 4, y: top - 8, "text-anchor": "end", class: "hc-unit hc-u-wind" }, "mph", svg);

    // Weather icons, spaced at least ~28px apart on whole hours.
    var every = [1, 2, 3, 4, 6, 8, 12, 24].filter(function (k) { return k * step >= 28; })[0] || 24;
    for (i = 0; i < n; i += every) txt({ x: x(i), y: legendH + iconH - 4, "text-anchor": "middle", class: "hc-icon" }, d.icon[i], svg);

    // Rain as a soft area underneath, then the three lines on top.
    var pts = function (vals, y) { return vals.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1); }); };
    var rp = pts(d.rain, yR);
    el("path", { d: "M" + x(0) + "," + bottom + " L" + rp.join(" L") + " L" + x(n - 1) + "," + bottom + " Z", class: "hc-area hc-rain" }, svg);
    el("polyline", { points: rp.join(" "), class: "hc-line hc-rain" }, svg);
    el("polyline", { points: pts(d.wind, yW).join(" "), class: "hc-line hc-wind" }, svg);
    el("polyline", { points: pts(d.feels, yT).join(" "), class: "hc-line hc-feels" }, svg);
    el("polyline", { points: pts(d.temp, yT).join(" "), class: "hc-line hc-temp" }, svg);

    // Hour axis.
    var ay = bottom + 14;
    var tickEvery = n > 24 ? (step * 12 >= 30 ? 12 : 24) : (step * 3 >= 30 ? 3 : 6);
    for (i = 0; i < n; i++) {
      var hh = +d.t[i].slice(11, 13);
      if (hh % tickEvery) continue;
      if (!(n > 24 && hh === 0)) txt({ x: x(i), y: ay, "text-anchor": "middle", class: "hc-tick" }, hourLabel(d.t[i]), svg);
      else txt({ x: x(i) + 4, y: ay + 14, class: "hc-day" }, dayLabel(d.t[i]), svg);
    }

    // Crosshair + one tooltip for every series at that hour.
    var cross = el("line", { x1: 0, x2: 0, y1: top, y2: bottom, class: "hc-cross", visibility: "hidden" }, svg);
    var dots = [["rain", yR], ["wind", yW], ["feels", yT], ["temp", yT]].map(function (k) {
      return { k: k[0], y: k[1], c: el("circle", { r: 4, class: "hc-dot hc-" + k[0], visibility: "hidden" }, svg) };
    });
    var tip = document.createElement("div");
    tip.className = "hc-tip";
    tip.hidden = true;
    box.appendChild(tip);
    var cur = -1;
    function show(i) {
      cur = Math.max(0, Math.min(n - 1, i));
      var cx = x(cur);
      cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("visibility", "visible");
      dots.forEach(function (o) {
        o.c.setAttribute("cx", cx); o.c.setAttribute("cy", o.y(d[o.k][cur])); o.c.setAttribute("visibility", "visible");
      });
      tip.textContent = "";
      var head = document.createElement("div");
      head.className = "hc-tip-head";
      head.textContent = (n > 24 ? dayLabel(d.t[cur]) + ", " : "") + hourLabel(d.t[cur]).replace("a", " AM").replace("p", " PM") + "  " + d.icon[cur] + " " + d.label[cur];
      tip.appendChild(head);
      [["temp", Math.round(d.temp[cur]) + "°C", "Temp"], ["feels", Math.round(d.feels[cur]) + "°C", "Feels like"],
       ["rain", Math.round(d.rain[cur]) + "%", "Rain chance"], ["wind", Math.round(d.wind[cur]) + " mph", "Wind"]].forEach(function (r) {
        var row = document.createElement("div");
        row.className = "hc-tip-row";
        var key = document.createElement("span"); key.className = "hc-key hc-" + r[0];
        var val = document.createElement("strong"); val.textContent = r[1];
        var lab = document.createElement("span"); lab.textContent = r[2];
        row.appendChild(key); row.appendChild(val); row.appendChild(lab);
        tip.appendChild(row);
      });
      tip.hidden = false;
      var tw = tip.offsetWidth;
      tip.style.left = (cx + 12 + tw > W ? cx - 12 - tw : cx + 12) + "px";
      tip.style.top = (top + 4) + "px";
    }
    function hide() {
      cur = -1; tip.hidden = true; cross.setAttribute("visibility", "hidden");
      dots.forEach(function (o) { o.c.setAttribute("visibility", "hidden"); });
    }
    function onPointer(e) {
      var r = svg.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * W;
      show(Math.round(((px - L) / (W - L - R)) * (n - 1)));
    }
    svg.addEventListener("pointermove", onPointer);
    svg.addEventListener("pointerdown", onPointer);
    svg.addEventListener("pointerleave", hide);
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        show(cur < 0 ? 0 : cur + (e.key === "ArrowRight" ? 1 : -1));
      }
      if (e.key === "Escape") hide();
    });
  }

  // Clicking anywhere on a day or place row (or its Hourly button) opens the
  // chart row right below it; charts draw on open and redraw on resize.
  function toggle(row) {
    var b = row.querySelector(".hourly-toggle");
    var panel = row.nextElementSibling;
    var open = panel.hidden;
    panel.hidden = !open;
    row.classList.toggle("open", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.innerHTML = open ? "Hide hourly &#9652;" : "Hourly &#9662;";
    if (open) panel.querySelectorAll(".hourly-chart").forEach(render);
  }
  document.querySelectorAll(".hourly-toggle").forEach(function (b) {
    var row = b.closest("tr");
    row.classList.add("has-hourly");
    row.addEventListener("click", function (e) {
      if (e.target.closest("a, input, select, textarea") || window.getSelection().toString()) return;
      toggle(row);
    });
  });
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      document.querySelectorAll("tr.hourly-row:not([hidden]) .hourly-chart").forEach(render);
    }, 150);
  });
})();
  </script>`;

  return layout("forecast", `Forecast — ${trip.title}`, body + script);
}

// ---------------------------------------------------------------- costs

const costs = (data as any).costs;

export { homePage, itineraryPage, flightsPage, housingPage, tasksPage, forecastPage, shortlistPage };

// Only start the server when run directly, so build.ts can import the renderers.
if (import.meta.main) {
const port = Number(process.env.PORT) || 3000;
loadHikeWx(); // warm the hike conditions so the first itinerary load has them

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
      if (req.headers.get("x-inline")) return new Response(null, { status: t ? 204 : 400 });
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

    if (url.pathname === "/hikes/refresh" && req.method === "POST") {
      await loadHikeWx(true);
      return Response.redirect("/#hikes", 303);
    }

    if (url.pathname === "/forecast/refresh" && req.method === "POST") {
      await loadForecast(true);
      return Response.redirect("/forecast", 303);
    }

    if (url.pathname === "/forecast") {
      return new Response(await forecastPage(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
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
