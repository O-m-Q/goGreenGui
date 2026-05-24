import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieSession from "cookie-session";
import { getLoginUrl, tradeCodeForToken, fetchMe, fetchRepos } from "./githubAuth.js";
import { doTheCommitsApi } from "./commitFromApi.js";
import { getGridBounds, getFutureCellKeys } from "./gridDates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const portNum = process.env.PORT || 3000;

app.use(
  cookieSession({
    name: "sess",
    keys: [process.env.SESSION_SECRET || "gogreen-dev-secret-change-me"],
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/auth/github", (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).send("set GITHUB_CLIENT_ID in .env");
  }
  res.redirect(getLoginUrl());
});

app.get("/auth/callback", async (req, res) => {
  const var23 = req.query.code;
  const token = await tradeCodeForToken(var23);
  const me = await fetchMe(token);
  req.session.token = token;
  req.session.login = me.login;
  req.session.name = me.name;
  req.session.email = me.email;
  res.redirect("/");
});

app.get("/auth/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/api/me", (req, res) => {
  if (!req.session || !req.session.token) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    login: req.session.login,
    name: req.session.name,
  });
});

app.get("/api/grid-meta", (req, res) => {
  const var29 = getGridBounds();
  res.json({
    weekCount: var29.weekCount,
    dayCount: var29.dayCount,
    futureKeys: getFutureCellKeys(),
  });
});

app.get("/api/repos", async (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send("not logged in");
  }
  const var24 = await fetchRepos(req.session.token);
  const var25 = [];
  for (let i = 0; i < var24.length; i++) {
    const r = var24[i];
    if (r.permissions && r.permissions.push) {
      var25.push({ fullName: r.full_name, name: r.name, owner: r.owner.login });
    }
  }
  res.json(var25);
});

app.post("/api/push", async (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send("not logged in");
  }

  const var7 = req.body.cells || {};
  const var8 = parseInt(req.body.intensity, 10) || 1;
  const repoPick = req.body.repo || "";
  const slash = repoPick.indexOf("/");
  if (slash < 1) {
    return res.status(400).send("pick a repo");
  }
  const owner = repoPick.slice(0, slash);
  const repo = repoPick.slice(slash + 1);

  try {
    const result = await doTheCommitsApi(
      req.session.token,
      owner,
      repo,
      var7,
      var8,
      {
        login: req.session.login,
        name: req.session.name,
        email: req.session.email,
      }
    );
    res.json(result);
  } catch (err) {
    res.status(500).send(String(err.message || err));
  }
});

app.listen(portNum, () => {
  console.log("goGreen gui http://localhost:" + portNum);
});
