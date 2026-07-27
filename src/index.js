
import { scrapeCalendar } from './scraper.js';
import { saveSnapshot } from './history.js';

const snapshot=await scrapeCalendar();
saveSnapshot(snapshot);
