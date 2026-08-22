import data from "./data.json";

const trip = data.trip;
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
    --bg: #f7f6f3;
    --card: #ffffff;
    --text: #1c1b1a;
    --muted: #6b6863;
    --border: #e4e1da;
    --accent: #b5551f;
    --accent-soft: #f2e3d5;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #161513;
      --card: #201f1c;
      --text: #ece9e3;
      --muted: #a39d92;
      --border: #322f2a;
      --accent: #e08a4e;
      --accent-soft: #3a2a1c;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
  }
  header {
    padding: 2.5rem 1.5rem 1rem;
    text-align: center;
  }
  header h1 {
    margin: 0 0 .4rem;
    font-size: clamp(1.6rem, 4vw, 2.4rem);
  }
  header p {
    margin: .2rem 0;
    color: var(--muted);
  }
  nav {
    display: flex;
    justify-content: center;
    gap: .5rem;
    padding: 1rem 1.5rem 0;
  }
  nav a {
    color: var(--muted);
    text-decoration: none;
    font-size: .85rem;
    padding: .4rem .9rem;
    border-radius: 999px;
    border: 1px solid var(--border);
  }
  nav a.active {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.4rem;
    overflow-x: auto;
  }
  .photos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: .6rem;
    margin: 0 0 1.1rem;
  }
  .photos figure { margin: 0; }
  .photos img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 10px;
    display: block;
    background: var(--border);
  }
  .photos figcaption {
    font-size: .75rem;
    color: var(--muted);
    margin-top: .3rem;
    text-align: center;
  }
  .card h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: .55rem;
    font-size: 1.3rem;
  }
  .rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.6rem;
    height: 1.6rem;
    padding: 0 .3rem;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: .8rem;
    font-weight: 600;
  }
  .group-total {
    font-size: .85rem;
    font-weight: 600;
    color: var(--accent);
  }
  .card .subtitle {
    color: var(--muted);
    font-size: .9rem;
    margin: .15rem 0 1rem;
  }
  .section-label {
    text-transform: uppercase;
    font-size: .7rem;
    letter-spacing: .06em;
    color: var(--muted);
    margin: 1rem 0 .35rem;
  }
  .section-label:first-of-type { margin-top: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: .88rem;
  }
  table td {
    padding: .25rem 0;
    vertical-align: top;
  }
  table td:first-child {
    color: var(--muted);
    white-space: nowrap;
    padding-right: .75rem;
    width: 1%;
  }
  ul.sites {
    margin: 0;
    padding-left: 1.1rem;
    font-size: .88rem;
  }
  ul.sites li { margin: .2rem 0; }
  .verdict {
    margin-top: 1rem;
    padding: .7rem .8rem;
    background: var(--accent-soft);
    border-radius: 10px;
    font-size: .85rem;
    color: var(--text);
    border-left: 3px solid var(--accent);
  }
  footer {
    text-align: center;
    color: var(--muted);
    font-size: .8rem;
    padding-bottom: 2rem;
  }
  .ideas-list {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: .5rem;
  }
  .idea {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: .6rem .8rem;
    font-size: .9rem;
  }
  .idea .idea-meta {
    color: var(--muted);
    font-size: .75rem;
    margin-top: .2rem;
  }
  .idea-empty {
    color: var(--muted);
    font-size: .85rem;
    font-style: italic;
  }
  form.add-idea {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
  }
  form.add-idea input[type="text"] {
    flex: 1 1 160px;
    padding: .55rem .7rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: .88rem;
  }
  form.add-idea input[name="text"] { flex: 3 1 240px; }
  form.add-idea button {
    padding: .55rem 1.1rem;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #fff;
    font-size: .88rem;
    font-weight: 600;
    cursor: pointer;
  }
  a.add-idea-link {
    display: inline-block;
    padding: .55rem 1.1rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--accent);
    font-size: .88rem;
    font-weight: 600;
    text-decoration: none;
  }
  a.add-idea-link:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .pick-badge {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    font-size: .7rem;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: .25rem .6rem;
    border-radius: 999px;
    margin-bottom: .6rem;
  }
  .muted-cell { color: var(--muted); font-size: .8rem; }
  a.cta {
    display: block;
    text-align: center;
    padding: .85rem 1.2rem;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    text-decoration: none;
    margin: 1rem 0 .6rem;
  }
  a.cta:hover { filter: brightness(1.1); }
  .filter-note, .calc-note {
    font-size: .8rem;
    color: var(--muted);
    margin: .5rem 0;
  }
  .caveat {
    font-size: .82rem;
    color: var(--muted);
    border-left: 3px solid var(--border);
    padding: .6rem .9rem;
    margin-top: 1rem;
    background: rgba(127,127,127,.06);
    border-radius: 0 8px 8px 0;
  }
  .caveat code { font-size: .78rem; }
  .areas { display: flex; flex-direction: column; gap: 1.2rem; }
  .area {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
    align-items: start;
  }
  .area img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    border-radius: 10px;
  }
  .area h3 { margin: 0 0 .2rem; font-size: 1.05rem; }
  .area-vibe { font-size: .87rem; color: var(--muted); margin: .5rem 0; }
  @media (max-width: 560px) {
    .area { grid-template-columns: 1fr; }
  }
  .calc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: .7rem;
    margin: .3rem 0 .2rem;
  }
  .calc-grid label {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    font-size: .8rem;
    color: var(--muted);
  }
  .calc-grid input, .calc-grid select {
    padding: .5rem .6rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: .9rem;
  }
  .total-row {
    display: flex;
    gap: 2.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  .total-label { display: block; font-size: .78rem; color: var(--muted); }
  .total-big { font-size: 1.9rem; font-weight: 700; }
  .total-big.accent { color: var(--accent); }
  .alert {
    background: rgba(200,120,20,.13);
    border: 1px solid rgba(200,120,20,.35);
    border-radius: 8px;
    padding: .7rem .9rem;
    font-size: .9rem;
    margin-bottom: .9rem;
  }
  .pill {
    display: inline-block;
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    padding: .12rem .5rem;
    border-radius: 999px;
  }
  .pill.ok { background: rgba(40,150,90,.18); color: #2e9c66; }
  .pill.gone { background: rgba(190,60,60,.16); color: #c25555; }
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

function layout(activeNav: Nav, title: string, body: string) {
  return /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${sharedStyle}</style>
</head>
<body>
<header>
  <h1>${trip.title}</h1>
  <p>${trip.dates} &middot; ${trip.groupSize} people</p>
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
<footer>Generated from live research &middot; ${new Date().getFullYear()}</footer>
</body>
</html>`;
}

const PICK = "Montana";

function homePage() {
  const picked = locations.find((l) => l.name === PICK)!;
  const alsoRan = locations.filter((l) => l.name !== PICK);

  const runnerUps = `
  <section class="card">
    <h2>Also considered</h2>
    <div class="subtitle">The other three on the short list, for the record</div>
    <table>
      <tr><th>Where</th><th>Group airfare</th><th>Cabin/night</th><th>Why not</th></tr>
      ${alsoRan
        .map(
          (loc) => `<tr>
        <td><strong>${loc.name}</strong><br><span class="muted-cell">${loc.subtitle}</span></td>
        <td>${fmt(loc.airfare.groupLow)}-${fmt(loc.airfare.groupHigh)}</td>
        <td>${loc.airbnb.nightly}</td>
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
      <tr><td>NYC &times;3</td><td>${money(loc.flights.nyc)} pp${loc.flights.nyc.note ? ` &mdash; ${loc.flights.nyc.note}` : ""}</td></tr>
      <tr><td>SF &times;2</td><td>${money(loc.flights.sf)} pp${loc.flights.sf.note ? ` &mdash; ${loc.flights.sf.note}` : ""}</td></tr>
      <tr><td>Seattle &times;1</td><td>${money(loc.flights.seattle)} pp${loc.flights.seattle.note ? ` &mdash; ${loc.flights.seattle.note}` : ""}</td></tr>
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
  return layout("home", trip.title, body + "\n" + runnerUps);
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

async function itineraryPage() {
  const ideas = await loadIdeas();

  const dayBlocks = DAYS.map((day) => {
    const dayIdeas = ideas
      .filter((idea) => idea.day === day)
      .sort((a, b) => a.createdAt - b.createdAt);
    return `
  <section class="card">
    <h2>${day}</h2>
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

  return layout("itinerary", `Itinerary — ${trip.title}`, generalBlock + "\n" + dayBlocks);
}

// ---------------------------------------------------------------- housing

const housing = (data as any).housing;
const BOZEMAN = { lat: 45.677, lng: -111.0429 };

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
  return `https://www.airbnb.com/s/Bozeman--Montana--United-States/homes?${p.toString()}`;
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
        <div class="subtitle">${escapeHtml(a.drive)} from Bozeman &middot; ${escapeHtml(a.photo.caption)}</div>
        <p class="area-vibe">${escapeHtml(a.vibe)}</p>
        <table>
          <tr><td>Nightly (sleeps 8-10)</td><td>${fmt(a.nightly.low)}-${fmt(a.nightly.high)}</td></tr>
          <tr><td>Typical</td><td><strong>${fmt(a.nightly.typical)}</strong>/night</td></tr>
          <tr><td>${housing.nights} nights + ${Math.round((costs.feePct + a.taxPct) * 100)}% fees/tax</td><td>${fmt(a.nightly.typical * housing.nights * (1 + costs.feePct + a.taxPct))}</td></tr>
          <tr><td>Per person (8)</td><td>${fmt((a.nightly.typical * housing.nights * (1 + costs.feePct + a.taxPct)) / 8)}</td></tr>
        </table>
        <a class="add-idea-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Search ${escapeHtml(a.name)} on Airbnb &rarr;</a>
      </div>
    </div>`;
    })
    .join("\n");

  const body = `
  <section class="card">
    <div class="pick-badge">Housing</div>
    <h2>Cabins within ~2 hours of Bozeman</h2>
    <div class="subtitle">${housing.checkin} &rarr; ${housing.checkout} &middot; ${housing.nights} nights &middot; sleeps ${trip.groupSize}</div>
    <p class="area-vibe">${escapeHtml(housing.intro)}</p>
    <a class="cta" href="${escapeHtml(wide)}" target="_blank" rel="noopener">Open the full pre-filtered Airbnb search &rarr;</a>
    <div class="filter-note">
      Filters baked into that link: <strong>${housing.checkin} to ${housing.checkout}</strong>,
      <strong>${housing.defaultAdults} guests</strong>, <strong>${housing.minBedrooms}+ bedrooms</strong>,
      entire place only, map bounded to roughly a 2-hour drive of Bozeman.
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
    <div class="subtitle">Sorted by drive time from Bozeman &mdash; each links to its own bounded search</div>
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
    <div class="calc-note">Service fee + cleaning (~${Math.round(costs.feePct * 100)}%) and Montana lodging tax (8%, or 12% in Big Sky &amp; West Yellowstone) are added automatically.</div>
    <div class="calc-note">${escapeHtml(costs.flightNote)}</div>

    <div class="section-label">Rental cars</div>
    <div class="calc-grid">
      <label>Vehicles <input type="number" id="cars" min="0" max="4" value="2"></label>
      <label>Type
        <select id="car-type">
          <option value="suv">Large SUV (seats 7)</option>
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
    <div class="calc-note">Estimates from researched ranges for mid-October in the Bozeman area &mdash; not live quotes. Treat as a planning ballpark, not a bill.</div>
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
      // Service + cleaning is roughly flat; lodging tax is 8% but 12% in the
      // two resort-tax towns, so it has to come from the selected area.
      var addOn = CFG.feePct + area.taxPct;
      var lodging = nightly * nights * (1 + addOn);

      var cars = Number($("cars").value) || 0;
      var carDays = Number($("car-days").value) || 1;
      var carRate = CFG.car[$("car-type").value];
      var carRental = cars * carDays * carRate;
      var gas = cars * CFG.car.gasPerCar;
      $("gas-note").textContent = money(CFG.car.gasPerCar) + " per vehicle";

      var perDay = CFG.food[$("food-style").value];
      var food = people * (nights + 1) * perDay;

      var rows = [
        ["Flights", flights, people + " fares, " + lvl],
        ["Housing", lodging, money(nightly) + " × " + nights + " nights + " +
          Math.round(addOn * 100) + "% fees/tax"],
        ["Rental cars", carRental + gas, cars + " × " + carDays + " days + gas"],
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
