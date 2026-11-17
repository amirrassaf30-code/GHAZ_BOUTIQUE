/*
  ارتباط مستقیم با GitHub API برای ذخیره فایل‌ها در ریپازیتوری.
  توکن فقط در localStorage مرورگر مدیر ذخیره می‌شود و داخل کد نیست.
*/
const GH_API = "https://api.github.com";

function ghToken() {
  return localStorage.getItem("gh_token") || "";
}

function ghHeaders() {
  return {
    "Authorization": "Bearer " + ghToken(),
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function ghRepoUrl(cfg, path) {
  return `${GH_API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("خواندن فایل ناموفق بود"));
    r.readAsDataURL(file);
  });
}

async function ghGetSha(cfg, path) {
  const r = await fetch(`${ghRepoUrl(cfg, path)}?ref=${cfg.branch}`, { headers: ghHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`خطا در خواندن ${path} (کد ${r.status})`);
  const j = await r.json();
  return j.sha;
}

async function ghPutFile(cfg, path, base64Content, message) {
  const sha = await ghGetSha(cfg, path);
  const body = { message, content: base64Content, branch: cfg.branch };
  if (sha) body.sha = sha;

  const r = await fetch(ghRepoUrl(cfg, path), {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) throw new Error("توکن نامعتبر است");
    if (r.status === 403) throw new Error("توکن دسترسی نوشتن ندارد (Contents: Read and write)");
    throw new Error(j.message || `خطا در ذخیره ${path} (کد ${r.status})`);
  }
  return r.json();
}
