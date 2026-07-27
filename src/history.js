import fs from "fs";
import path from "path";

const dir=path.join(process.cwd(),"calendar-data");
const file=path.join(dir,"history.json");

function normalize(s){
  return JSON.stringify({regular:s.regular,season:s.season});
}

export function loadHistory(){
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  if(!fs.existsSync(file)) return {version:1,snapshots:[]};
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}
  catch{return {version:1,snapshots:[]};}
}

export function saveSnapshot(snapshot){
  const history=loadHistory();
  const last=history.snapshots.at(-1);
  if(last && normalize(last)===normalize(snapshot)){
    console.log("No calendar changes.");
    return false;
  }
  history.snapshots.push(snapshot);
  fs.writeFileSync(file,JSON.stringify(history,null,2),"utf8");
  console.log("Snapshot saved.");
  return true;
}
