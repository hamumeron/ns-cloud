const API = "https://ns-cloud-api.nekosuke-1012.workers.dev";

// ===== API呼び出し =====
async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    }
  });

  return res.json();
}

// ===== ログイン =====
async function login() {
  if (localStorage.getItem("token")) return;

  const username = prompt("user");
  const password = prompt("pass");

  const res = await fetch(API + "/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  localStorage.setItem("token", data.token);
}

// ===== GitHub取得 =====
async function loadReposFromAPI() {
  const repos = await api("/github/repos");

  return repos.map(r => ({
    name: r.full_name,
    branch: r.default_branch,
    dot: "green",
    timeAgo: new Date(r.updated_at).toLocaleString(),
    commit: r.description || "No description",
    status: "green",
    statusLabel: r.private ? "Private" : "Public"
  }));
}

// ===== データ =====
let REPOS = [];

// ===== 初期化 =====
async function initRepos() {
  try {
    await login(); // ← 先にログイン
    REPOS = await loadReposFromAPI();
    renderRepos();
  } catch (e) {
    console.error("repo load error", e);
  }
}

// ===== ページ切り替え =====
function onPageEnter(page) {
  if (page === "repos") {
    initRepos();
  }
}
