
import { chromium } from 'playwright';
const URL='https://nexusportal.voltron.me/calendar';

function extractInPage(){
 const out=[];
 for(const d of [...document.querySelectorAll('.vl-cal__day')]){
  const date=(d.querySelector('.vl-cal__day-marker')?.innerText||'').replace(/\s+/g,' ').trim();
  for(const r of d.querySelectorAll('.vl-cal__row.main')){
   out.push({
    date,
    time:(r.querySelector('.time')?.childNodes[0]?.textContent||'').trim(),
    status:(r.querySelector('.action-tag')?.innerText||'').trim(),
    event:((r.querySelector('.vl-cal__name-text')?.innerText||r.querySelector('.name-block')?.innerText||'')).replace(/\s+/g,' ').trim()
   });
  }
 }
 return out;
}
async function scrapeRealm(page,label){
 const btn=page.getByRole('button',{name:label});
 if(await btn.count()){await btn.first().click();await page.waitForTimeout(1500);}
 await page.waitForSelector('.vl-cal__day');
 return page.evaluate(extractInPage);
}
export async function scrapeCalendar(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 try{
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.waitForSelector('.vl-cal__day');
  return {
   scrapedAt:new Date().toISOString(),
   regular:await scrapeRealm(page,'Regular Realm'),
   season:await scrapeRealm(page,'Season Realm')
  };
 } finally {await browser.close();}
}
