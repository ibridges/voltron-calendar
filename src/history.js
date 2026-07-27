
import fs from 'fs';
import path from 'path';
const file=path.join(process.cwd(),'calendar-data','history.json');

export function saveSnapshot(snapshot){
  let history={version:1,snapshots:[]};
  if(fs.existsSync(file)){
    history=JSON.parse(fs.readFileSync(file,'utf8'));
  }else{
    fs.mkdirSync(path.dirname(file),{recursive:true});
  }
  const last=history.snapshots.at(-1);
  const same=last&&JSON.stringify({regular:last.regular,season:last.season})===JSON.stringify({regular:snapshot.regular,season:snapshot.season});
  if(same){console.log('No changes');return;}
  history.snapshots.push(snapshot);
  fs.writeFileSync(file,JSON.stringify(history,null,2));
  console.log('Snapshot saved');
}
