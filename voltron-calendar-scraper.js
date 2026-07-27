// voltron-calendar-scraper.js
// Requires: npm install playwright
//   then:   npx playwright install chromium
//
// Run once:        node voltron-calendar-scraper.js
// Run on schedule: node voltron-calendar-scraper.js --interval 60   (minutes)

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://nexusportal.voltron.me/calendar';
const OUT_DIR = path.join(__dirname, 'calendar-data');

// --- The extraction logic, run inside the page context ---
// Mirrors the DOM structure of the Blazor-rendered "Full Calendar" section.
function extractInPage() {
  const days = [...document.querySelectorAll('.vl-cal__day')];
  const out = [];
  for (const d of days) {
    const date = (d.querySelector('.vl-cal__day-marker')?.innerText || '')
      .replace(/\s+/g, ' ').trim();
    for (const r of d.querySelectorAll('.vl-cal__row.main')) {
      const time = (r.querySelector('.time')?.childNodes[0]?.textContent || '').trim();
      const status = (r.querySelector('.action-tag')?.innerText || '').trim();
      const name = (
        r.querySelector('.vl-cal__name-text')?.innerText ||
        r.querySelector('.name-block')?.innerText || ''
      ).replace(/\s+/g, ' ').trim();
      out.push({ date, time, status, event: name });
    }
  }
  return out;
}

async function scrapeRealm(page, realmLabel) {
  // Click the realm toggle ("Regular Realm" or "Season Realm")
  const btn = page.getByRole('button', { name: realmLabel });
  if (await btn.count()) {
    await btn.first().click();
    // Wait for the section to re-render after the realm switch
    await page.waitForTimeout(1500);
  }
  await page.waitForSelector('.vl-cal__day', { timeout: 15000 });
  return page.evaluate(extractInPage);
}

function toCsv(regular, season) {
  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const line = (realm, r) => [realm, r.date, r.time, r.status, r.event].map(q).join(',');
  const rows = ['realm,date,time,status,event'];
  for (const r of regular) rows.push(line('regular', r));
  for (const r of season) rows.push(line('season', r));
  return rows.join('\n');
}

async function runOnce() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.vl-cal__day', { timeout: 20000 });

    const regular = await scrapeRealm(page, 'Regular Realm');
    const season = await scrapeRealm(page, 'Season Realm');

    const csv = toCsv(regular, season);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(OUT_DIR, `voltron-tournament-calendar-${stamp}.csv`);
    fs.writeFileSync(file, csv, 'utf8');
    // Also keep a stable "latest" copy
    fs.writeFileSync(path.join(OUT_DIR, 'latest.csv'), csv, 'utf8');

    console.log(`[${new Date().toISOString()}] Saved ${regular.length + season.length} rows -> ${file}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Scrape failed:`, err.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  const idx = process.argv.indexOf('--interval');
  const intervalMin = idx !== -1 ? parseFloat(process.argv[idx + 1]) : 0;

  await runOnce();
  if (intervalMin > 0) {
    console.log(`Scheduling every ${intervalMin} min. Press Ctrl+C to stop.`);
    setInterval(runOnce, intervalMin * 60 * 1000);
  }
}

main();
