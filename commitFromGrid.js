import jsonfile from "jsonfile";
import simpleGit from "simple-git";
import { getDateForCell } from "./gridDates.js";

const dataPath = "./data.json";
const gitThing = simpleGit();
//this builds the list of the cells
function buildCellList(cells) {
  const cellList = [];
  for (const key of Object.keys(cells)) {
    if (!cells[key]) continue;
    const parts = key.split("-");
    const var3 = parseInt(parts[0], 10);
    const var4 = parseInt(parts[1], 10);
    cellList.push({ x: var3, y: var4 });
  }
  return cellList;
}

//this makes a commit for the date "dateStr"
function makeOneCommit(dateStr, done) {
  const var5 = { date: dateStr };
  jsonfile.writeFile(dataPath, var5, () => {
    gitThing.add([dataPath]).commit(dateStr, { "--date": dateStr }, done);
  });
}

//queues all of the commits
function runQueue(queue, idx, cb) {
  if (idx >= queue.length) {
    return gitThing.push(cb);
  }
  const item = queue[idx];
  makeOneCommit(item.date, (err) => {
    if (err) return cb(err);
    runQueue(queue, idx + 1, cb);
  });
}

//this commits
export function doTheCommits(cells, intensity) {
  const cellList = buildCellList(cells);
  const var6 = intensity || 1;
  const queue = [];

  for (let i = 0; i < cellList.length; i++) {
    const c = cellList[i];
    const dateStr = getDateForCell(c.x, c.y);
    for (let j = 0; j < var6; j++) {
      queue.push({ date: dateStr });
    }
  }

  return new Promise((resolve, reject) => {
    if (queue.length === 0) {
      return resolve({ ok: true, count: 0 });
    }
    runQueue(queue, 0, (err) => {
      if (err) reject(err);
      else resolve({ ok: true, count: queue.length });
    });
  });
}
