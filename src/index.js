import { scrapeCalendar } from "./scraper.js";
import { saveSnapshot } from "./history.js";

try{
  const snapshot=await scrapeCalendar();
  saveSnapshot(snapshot);
}catch(err){
  console.error(err);
  process.exit(1);
}
