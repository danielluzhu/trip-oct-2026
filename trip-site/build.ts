// Renders the site to static HTML in docs/ for GitHub Pages.
// Run with: STATIC=1 bun trip-site/build.ts
import { mkdir, writeFile } from "node:fs/promises";
import { homePage, itineraryPage } from "./index.ts";

if (process.env.STATIC !== "1") {
  console.error("Refusing to build: set STATIC=1 so pages render in static mode.");
  process.exit(1);
}

const outDir = `${import.meta.dir}/../docs`;
await mkdir(outDir, { recursive: true });

const pages: Array<[string, string]> = [
  ["index.html", homePage()],
  ["itinerary.html", await itineraryPage()],
];

for (const [name, html] of pages) {
  await writeFile(`${outDir}/${name}`, html);
  console.log(`wrote docs/${name} (${html.length} bytes)`);
}

// Tell Pages not to run the output through Jekyll.
await writeFile(`${outDir}/.nojekyll`, "");
console.log("wrote docs/.nojekyll");
