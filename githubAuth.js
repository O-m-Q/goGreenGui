const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri =
  process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/auth/callback";

export function getLoginUrl() {
  const var9 = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
  });
  return "https://github.com/login/oauth/authorize?" + var9.toString();
}

export async function tradeCodeForToken(code) {
  const var10 = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    }),
  });
  const var11 = await var10.json();
  return var11.access_token;
}

export async function fetchMe(token) {
  const var12 = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
    },
  });
  return var12.json();
}

export async function fetchRepos(token) {
  const var13 = [];
  let pageNum = 1;
  while (true) {
    const var14 = await fetch(
      "https://api.github.com/user/repos?per_page=100&page=" +
        pageNum +
        "&sort=updated",
      {
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/vnd.github+json",
        },
      }
    );
    const var15 = await var14.json();
    if (!var15.length) break;
    for (let i = 0; i < var15.length; i++) {
      var13.push(var15[i]);
    }
    if (var15.length < 100) break;
    pageNum++;
    if (pageNum > 5) break;
  }
  return var13;
}
