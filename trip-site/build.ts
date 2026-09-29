// Renders the site to static HTML in docs/ for GitHub Pages.
// Run with: STATIC=1 bun trip-site/build.ts
import { mkdir, writeFile } from "node:fs/promises";
import {
  homePage,
  itineraryPage,
  flightsPage,
  housingPage,
  costsPage,
  shortlistPage,
} from "./index.ts";

if (process.env.STATIC !== "1") {
  console.error("Refusing to build: set STATIC=1 so pages render in static mode.");
  process.exit(1);
}

const outDir = `${import.meta.dir}/../docs`;
await mkdir(outDir, { recursive: true });

const pages: Array<[string, string]> = [
  ["index.html", await itineraryPage()],
  ["glacier.html", homePage()],
  ["flights.html", flightsPage()],
  ["housing.html", housingPage()],
  ["costs.html", costsPage()],
  ["shortlist.html", shortlistPage()],
  // Old links to itinerary.html land on the front page, where it now lives.
  [
    "itinerary.html",
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./index.html"><link rel="canonical" href="./index.html"><title>Itinerary</title><a href="./index.html">The itinerary is now the front page &rarr;</a>`,
  ],
];

for (const [name, html] of pages) {
  await writeFile(`${outDir}/${name}`, html);
  console.log(`wrote docs/${name} (${html.length} bytes)`);
}

// Tell Pages not to run the output through Jekyll.
await writeFile(`${outDir}/.nojekyll`, "");
console.log("wrote docs/.nojekyll");
