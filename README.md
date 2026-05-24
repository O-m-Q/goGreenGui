# goGreen GUI

Barebones web UI to paint a GitHub contribution grid and push backdated commits via the GitHub API (inspired by [fenrir2608/goGreen](https://github.com/fenrir2608/goGreen)).

## GitHub OAuth setup

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**.
2. **Homepage URL:** `http://localhost:3000`
3. **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Copy **Client ID** and generate a **Client secret**.

## Configure

Copy `.env.example` to `.env` and fill in:

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=some-long-random-string
```

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

1. **login github** — OAuth; grants `repo` so the app can commit to repos you can push to.
2. Pick a **repo** from the dropdown (push access only).
3. Click tiles to draw on the heatmap.
4. Set **intensity** (1–4 commits per enabled day).
5. **push commits** — creates dated commits on `data.json` through the Git Database API (one API round-trip chain per commit, intentionally slow).

**clear** resets the grid only.

## Contribution graph notes

- Commits use your GitHub account name and email from OAuth (or `login@users.noreply.github.com` if email is private).
- Use a dedicated repo (e.g. `you/goGreen`) with an initial commit or empty default branch.
- Your GitHub profile email settings still control whether commits count on the graph.

## Grid alignment

Tiles match GitHub’s contribution calendar (UTC): column 0 = Sunday ~52 weeks ago, last column = this week, row 0 = Sunday through row 6 = Saturday. Dim tiles are future days. Patterns drawn before this alignment used different dates.

## Old local-git path

[`commitFromGrid.js`](commitFromGrid.js) is the original `simple-git` flow and is no longer used by the server.
