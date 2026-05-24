import { getDateForCell, isCellInFuture } from "./gridDates.js";

function buildCellList(cells) {
  const cellList = [];
  for (const key of Object.keys(cells)) {
    if (!cells[key]) continue;
    const parts = key.split("-");
    cellList.push({
      x: parseInt(parts[0], 10),
      y: parseInt(parts[1], 10),
    });
  }
  return cellList;
}

function buildQueue(cells, intensity) {
  const cellList = buildCellList(cells);
  const var6 = intensity || 1;
  const queue = [];
  for (let i = 0; i < cellList.length; i++) {
    const c = cellList[i];
    if (isCellInFuture(c.x, c.y)) continue;
    const dateStr = getDateForCell(c.x, c.y);
    for (let j = 0; j < var6; j++) {
      queue.push({ date: dateStr, msg: dateStr });
    }
  }
  return queue;
}

async function ghFetch(token, url, opts) {
  const var16 = await fetch(url, {
    ...opts,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(opts && opts.headers),
    },
  });
  if (!var16.ok) {
    const var17 = await var16.text();
    throw new Error(var17 || var16.statusText);
  }
  if (var16.status === 204) return null;
  return var16.json();
}

async function getRepoBits(token, owner, repo) {
  const var18 = await ghFetch(
    token,
    "https://api.github.com/repos/" + owner + "/" + repo
  );
  const branchName = var18.default_branch;
  let refData = null;
  try {
    refData = await ghFetch(
      token,
      "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/git/ref/heads/" +
        branchName
    );
  } catch (e) {
    refData = null;
  }
  return { branchName, refData };
}

async function makeOneApiCommit(token, owner, repo, branchName, parentSha, item, author) {
  const fileContent = JSON.stringify({ date: item.date }, null, 2);
  const var19 = await ghFetch(
    token,
    "https://api.github.com/repos/" + owner + "/" + repo + "/git/blobs",
    {
      method: "POST",
      body: JSON.stringify({
        content: fileContent,
        encoding: "utf-8",
      }),
    }
  );

  let treeBody = {
    tree: [
      {
        path: "data.json",
        mode: "100644",
        type: "blob",
        sha: var19.sha,
      },
    ],
  };

  if (parentSha) {
    const var20 = await ghFetch(
      token,
      "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/git/commits/" +
        parentSha
    );
    treeBody.base_tree = var20.tree.sha;
  }

  const var21 = await ghFetch(
    token,
    "https://api.github.com/repos/" + owner + "/" + repo + "/git/trees",
    {
      method: "POST",
      body: JSON.stringify(treeBody),
    }
  );

  const commitBody = {
    message: item.msg,
    tree: var21.sha,
    author: {
      name: author.name,
      email: author.email,
      date: item.date,
    },
    committer: {
      name: author.name,
      email: author.email,
      date: item.date,
    },
  };
  if (parentSha) commitBody.parents = [parentSha];

  const var22 = await ghFetch(
    token,
    "https://api.github.com/repos/" + owner + "/" + repo + "/git/commits",
    {
      method: "POST",
      body: JSON.stringify(commitBody),
    }
  );

  return var22.sha;
}

async function runApiQueue(token, owner, repo, queue, author, branchName, startSha) {
  let tipSha = startSha;
  for (let i = 0; i < queue.length; i++) {
    tipSha = await makeOneApiCommit(
      token,
      owner,
      repo,
      branchName,
      tipSha,
      queue[i],
      author
    );
  }

  if (!tipSha) return;

  if (startSha) {
    await ghFetch(
      token,
      "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/git/refs/heads/" +
        branchName,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: tipSha, force: false }),
      }
    );
  } else {
    await ghFetch(
      token,
      "https://api.github.com/repos/" + owner + "/" + repo + "/git/refs",
      {
        method: "POST",
        body: JSON.stringify({
          ref: "refs/heads/" + branchName,
          sha: tipSha,
        }),
      }
    );
  }
}

export async function doTheCommitsApi(token, owner, repo, cells, intensity, userInfo) {
  const queue = buildQueue(cells, intensity);
  if (queue.length === 0) return { ok: true, count: 0 };

  const author = {
    name: userInfo.name || userInfo.login,
    email: userInfo.email || userInfo.login + "@users.noreply.github.com",
  };

  const { branchName, refData } = await getRepoBits(token, owner, repo);
  const startSha = refData ? refData.object.sha : null;

  await runApiQueue(token, owner, repo, queue, author, branchName, startSha);

  return { ok: true, count: queue.length };
}
