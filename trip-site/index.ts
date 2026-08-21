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
`;

function layout(activeNav: "home" | "itinerary", title: string, body: string) {
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
  <a href="/" class="${activeNav === "home" ? "active" : ""}">Compare locations</a>
  <a href="/itinerary" class="${activeNav === "itinerary" ? "active" : ""}">Itinerary &amp; ideas</a>
</nav>
<main>
${body}
</main>
<footer>Generated from live research &middot; ${new Date().getFullYear()}</footer>
</body>
</html>`;
}

function homePage() {
  const body = locations
    .map(
      (loc, i) => `
  <section class="card">
    <h2><span class="rank">${i + 1}</span> ${loc.name}</h2>
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
  return layout("home", trip.title, body);
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
    <form class="add-idea" method="POST" action="/itinerary/add">
      <input type="hidden" name="day" value="${escapeHtml(day)}">
      <input type="text" name="text" placeholder="Add an idea (activity, restaurant, etc.)" required maxlength="280">
      <input type="text" name="author" placeholder="Your name (optional)" maxlength="40">
      <button type="submit">Add</button>
    </form>
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
    <form class="add-idea" method="POST" action="/itinerary/add">
      <input type="hidden" name="day" value="General">
      <input type="text" name="text" placeholder="Add an idea" required maxlength="280">
      <input type="text" name="author" placeholder="Your name (optional)" maxlength="40">
      <button type="submit">Add</button>
    </form>
  </section>`;

  return layout("itinerary", `Itinerary — ${trip.title}`, generalBlock + "\n" + dayBlocks);
}

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
