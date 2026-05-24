const var1 = {};
let var2 = 1;
let var26 = false;
let weekCount = 53;
const dayCount = 7;
const var30 = {};

const gridBox = document.getElementById("gridBox");
const intensityPick = document.getElementById("intensityPick");
const pushBtn = document.getElementById("pushBtn");
const clearBtn = document.getElementById("clearBtn");
const statusLine = document.getElementById("statusLine");
const loginLink = document.getElementById("loginLink");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");
const repoPick = document.getElementById("repoPick");

function getLvlClass() {
  return "lvl" + var2;
}

function refreshTileLook(tileEl) {
  const x = tileEl.dataset.x;
  const y = tileEl.dataset.y;
  const key = x + "-" + y;
  tileEl.className = "tile";
  if (var30[key]) tileEl.classList.add("future");
  if (var1[key]) {
    tileEl.classList.add("on", getLvlClass());
  }
}

function buildGrid() {
  gridBox.innerHTML = "";
  for (let y = 0; y < dayCount; y++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    for (let x = 0; x < weekCount; x++) {
      const tileEl = document.createElement("div");
      const key = x + "-" + y;
      tileEl.className = "tile";
      if (var30[key]) tileEl.classList.add("future");
      tileEl.dataset.x = x;
      tileEl.dataset.y = y;
      tileEl.addEventListener("click", () => {
        if (var30[key]) return;
        if (var1[key]) {
          delete var1[key];
        } else {
          var1[key] = true;
        }
        refreshTileLook(tileEl);
      });
      rowEl.appendChild(tileEl);
    }
    gridBox.appendChild(rowEl);
  }
}

function loadGridMeta() {
  return fetch("/api/grid-meta")
    .then((res) => res.json())
    .then((meta) => {
      weekCount = meta.weekCount;
      for (let i = 0; i < meta.futureKeys.length; i++) {
        var30[meta.futureKeys[i]] = true;
      }
      buildGrid();
    });
}

function updatePushBtn() {
  const hasRepo = repoPick.value && repoPick.value.length > 1;
  pushBtn.disabled = !var26 || !hasRepo;
}

function loadRepos() {
  repoPick.innerHTML = "<option value=''>loading...</option>";
  fetch("/api/repos")
    .then((res) => res.json())
    .then((list) => {
      repoPick.innerHTML = "<option value=''>-- pick repo --</option>";
      for (let i = 0; i < list.length; i++) {
        const opt = document.createElement("option");
        opt.value = list[i].fullName;
        opt.textContent = list[i].fullName;
        repoPick.appendChild(opt);
      }
      repoPick.disabled = false;
      updatePushBtn();
    })
    .catch(() => {
      repoPick.innerHTML = "<option value=''>repo load fail</option>";
    });
}

function setupAuthUi(me) {
  if (me.loggedIn) {
    var26 = true;
    loginLink.classList.add("hide");
    userLabel.textContent = me.login;
    userLabel.classList.remove("hide");
    logoutBtn.classList.remove("hide");
    loadRepos();
  } else {
    var26 = false;
    loginLink.classList.remove("hide");
    userLabel.classList.add("hide");
    logoutBtn.classList.add("hide");
    repoPick.disabled = true;
    repoPick.innerHTML = "<option value=''>-- login first --</option>";
  }
  updatePushBtn();
}

loadGridMeta();

fetch("/api/me")
  .then((res) => res.json())
  .then(setupAuthUi);

logoutBtn.addEventListener("click", () => {
  window.location.href = "/auth/logout";
});

repoPick.addEventListener("change", updatePushBtn);

intensityPick.addEventListener("change", () => {
  var2 = parseInt(intensityPick.value, 10);
  const allTiles = document.querySelectorAll(".tile.on");
  for (let i = 0; i < allTiles.length; i++) {
    const t = allTiles[i];
    t.classList.remove("lvl1", "lvl2", "lvl3", "lvl4");
    t.classList.add(getLvlClass());
  }
});

clearBtn.addEventListener("click", () => {
  for (const k of Object.keys(var1)) {
    delete var1[k];
  }
  const tiles = document.querySelectorAll(".tile");
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    t.className = "tile";
    if (var30[t.dataset.x + "-" + t.dataset.y]) t.classList.add("future");
  }
  statusLine.textContent = "cleared";
});

pushBtn.addEventListener("click", () => {
  statusLine.textContent = "pushing...";
  pushBtn.disabled = true;
  fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cells: var1,
      intensity: var2,
      repo: repoPick.value,
    }),
  })
    .then((res) => {
      if (!res.ok) return res.text().then((t) => Promise.reject(t));
      return res.json();
    })
    .then((data) => {
      statusLine.textContent = "done " + (data.count || 0) + " commits";
    })
    .catch((err) => {
      statusLine.textContent = "fail: " + err;
    })
    .finally(() => {
      updatePushBtn();
    });
});
