const $ = sel => document.querySelector(sel);

const state = {
  shop: structuredClone(SHOP),
  collections: structuredClone(COLLECTIONS),
  products: structuredClone(PRODUCTS)
};

/* ---------- ابزارها ---------- */

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function status(msg, isErr = false) {
  const el = $("#status");
  el.textContent = msg;
  el.className = "status " + (isErr ? "err" : "ok");
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
  target[last] = value;
}

function setBusy(on) {
  $("#publish").disabled = on;
  $("#publish").textContent = on ? "در حال ذخیره..." : "ذخیره و انتشار در گیت‌هاب";
}

/* ---------- رندر ---------- */

function renderSettings() {
  const g = state.shop.github || {};
  $("#settings").innerHTML = `
    <div class="grid2">
      <label>توکن گیت‌هاب
        <input type="password" id="tokenIn" value="${esc(localStorage.getItem("gh_token") || "")}">
      </label>
      <label>نام کاربری گیت‌هاب (owner)
        <input data-shop="github.owner" value="${esc(g.owner)}">
      </label>
      <label>نام ریپازیتوری (repo)
        <input data-shop="github.repo" value="${esc(g.repo)}">
      </label>
      <label>شاخه (branch)
        <input data-shop="github.branch" value="${esc(g.branch)}">
      </label>
      <label>نام فروشگاه
        <input data-shop="name" value="${esc(state.shop.name)}">
      </label>
      <label>شعار
        <input data-shop="tagline" value="${esc(state.shop.tagline)}">
      </label>
      <label>دامنه سایت
        <input data-shop="domain" value="${esc(state.shop.domain)}">
      </label>
      <label>شماره واتساپ
        <input data-shop="whatsapp" value="${esc(state.shop.whatsapp)}">
      </label>
      <label>شماره کارت
        <input data-shop="bankCard" value="${esc(state.shop.bankCard)}">
      </label>
      <label>نام بانک
        <input data-shop="bankName" value="${esc(state.shop.bankName)}">
      </label>
      <label>نام صاحب حساب
        <input data-shop="accountHolder" value="${esc(state.shop.accountHolder)}">
      </label>
      <label>لینک درگاه (اختیاری)
        <input data-shop="paymentLink" value="${esc(state.shop.paymentLink)}">
      </label>
    </div>
    <div class="row">
      <button class="btn ghost" id="saveToken">ذخیره توکن در این مرورگر</button>
      <button class="btn ghost" id="testConn">تست اتصال</button>
    </div>`;
}

function renderCollections() {
  $("#collections").innerHTML = state.collections.map((c, i) => `
    <div class="item">
      <div class="grid3">
        <label>شناسه (انگلیسی)
          <input data-kind="c" data-idx="${i}" data-field="id" value="${esc(c.id)}">
        </label>
        <label>عنوان
          <input data-kind="c" data-idx="${i}" data-field="title" value="${esc(c.title)}">
        </label>
        <label>آدرس تصویر کاور
          <input data-kind="c" data-idx="${i}" data-field="cover" value="${esc(c.cover)}">
        </label>
      </div>
      <div class="row"><button class="del" data-act="delc" data-idx="${i}">حذف کالکشن</button></div>
    </div>`).join("") +
    `<button class="btn ghost" data-act="addc">+ کالکشن جدید</button>`;
}

function renderProducts() {
  $("#products").innerHTML = state.products.map((p, i) => `
    <div class="item">
      <div class="grid3">
        <label>شناسه (یکتا)
          <input data-kind="p" data-idx="${i}" data-field="id" value="${esc(p.id)}">
        </label>
        <label>عنوان
          <input data-kind="p" data-idx="${i}" data-field="title" value="${esc(p.title)}">
        </label>
        <label>کالکشن
          <select data-kind="p" data-idx="${i}" data-field="collection">
            ${state.collections.map(c =>
              `<option value="${esc(c.id)}" ${c.id === p.collection ? "selected" : ""}>${esc(c.title)}</option>`
            ).join("")}
          </select>
        </label>
        <label>قیمت (تومان)
          <input data-kind="p" data-idx="${i}" data-field="price" value="${esc(p.price)}">
        </label>
        <label>قیمت قبل از تخفیف (0 = ندارد)
          <input data-kind="p" data-idx="${i}" data-field="oldPrice" value="${esc(p.oldPrice)}">
        </label>
        <label>برچسب
          <input data-kind="p" data-idx="${i}" data-field="badge" value="${esc(p.badge)}">
        </label>
        <label>سایزها (با ویرگول جدا کنید)
          <input data-kind="p" data-idx="${i}" data-field="sizes" value="${esc((p.sizes || []).join(", "))}">
        </label>
      </div>
      <label>توضیحات
        <textarea data-kind="p" data-idx="${i}" data-field="description">${esc(p.description)}</textarea>
      </label>
      <label>آدرس تصاویر (هر خط یک آدرس؛ مسیر فایل‌های آپلودی مثل images/... است)
        <textarea data-kind="p" data-idx="${i}" data-field="images">${esc((p.images || []).join("\n"))}</textarea>
      </label>
      <div class="row">
        <label class="upl">آپلود تصویر از سیستم
          <input type="file" accept="image/*" data-upload="${i}">
        </label>
        <button class="del" data-act="delp" data-idx="${i}">حذف محصول</button>
      </div>
    </div>`).join("") +
    `<button class="btn ghost" data-act="addp">+ محصول جدید</button>`;
}

function renderAll() {
  renderSettings();
  renderCollections();
  renderProducts();
}

/* ---------- ویرایش داده ---------- */

function setField(kind, idx, field, raw) {
  const item = kind === "c" ? state.collections[idx] : state.products[idx];
  let v = raw;
  if (field === "price" || field === "oldPrice") v = Number(String(raw).replace(/[^\d]/g, "")) || 0;
  if (field === "sizes") v = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (field === "images") v = raw.split("\n").map(s => s.trim()).filter(Boolean);
  item[field] = v;
}

async function uploadImage(file, idx) {
  if (!file) return;
  const gh = state.shop.github;
  if (!ghToken()) return status("ابتدا توکن را ذخیره کنید", true);
  try {
    status("در حال آپلود تصویر...");
    const b64 = await fileToBase64(file);
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `images/${Date.now()}-${safeName}`;
    await ghPutFile(gh, path, b64, `upload image ${safeName}`);
    state.products[idx].images.push(path);
    renderProducts();
    status("تصویر آپلود شد. برای نمایش، ذخیره و انتشار را بزنید.");
  } catch (e) {
    status(e.message, true);
  }
}

async function testConnection() {
  const g = state.shop.github;
  try {
    const r = await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}`, { headers: ghHeaders() });
    if (!r.ok) throw new Error(r.status === 404 ? "ریپازیتوری پیدا نشد یا توکن دسترسی ندارد" : `خطای ${r.status}`);
    const j = await r.json();
    status(`اتصال برقرار است: ${j.full_name}`);
  } catch (e) {
    status(e.message, true);
  }
}

async function publish() {
  if (!ghToken()) return status("ابتدا توکن را وارد و ذخیره کنید", true);
  const gh = state.shop.github;
  setBusy(true);
  try {
    const productsSrc =
      `// ویرایش شده از پنل مدیریت\n` +
      `const COLLECTIONS = ${JSON.stringify(state.collections, null, 2)};\n\n` +
      `const PRODUCTS = ${JSON.stringify(state.products, null, 2)};\n`;

    const configSrc =
      `/* تنظیمات فروشگاه - از پنل مدیریت به‌روز شده */\n` +
      `const SHOP = ${JSON.stringify(state.shop, null, 2)};\n`;

    status("در حال ذخیره محصولات...");
    await ghPutFile(gh, "js/products.js", utf8ToBase64(productsSrc), "update products from admin");

    status("در حال ذخیره تنظیمات...");
    await ghPutFile(gh, "js/config.js", utf8ToBase64(configSrc), "update settings from admin");

    status("ذخیره شد ✓ چند دقیقه بعد سایت به‌روز می‌شود (صفحه را با Ctrl+F5 رفرش کنید).");
  } catch (e) {
    status(e.message, true);
  } finally {
    setBusy(false);
  }
}

/* ---------- رویدادها ---------- */

document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.shop) return setPath(state.shop, el.dataset.shop, el.value);
  if (el.dataset.kind) setField(el.dataset.kind, Number(el.dataset.idx), el.dataset.field, el.value);
});

document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.upload !== undefined) uploadImage(el.files[0], Number(el.dataset.upload));
});

document.addEventListener("click", e => {
  const id = e.target.id;
  if (id === "saveToken") {
    localStorage.setItem("gh_token", $("#tokenIn").value.trim());
    return status("توکن در این مرورگر ذخیره شد");
  }
  if (id === "testConn") return testConnection();
  if (id === "publish") return publish();

  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  const idx = Number(b.dataset.idx);

  if (act === "addc") state.collections.push({ id: "c" + Date.now(), title: "", cover: "" });
  if (act === "delc" && confirm("این کالکشن حذف شود؟")) state.collections.splice(idx, 1);
  if (act === "addp") state.products.push({
    id: "p" + Date.now(), collection: state.collections[0]?.id || "",
    title: "", price: 0, oldPrice: 0, badge: "", sizes: [], images: [], description: ""
  });
  if (act === "delp" && confirm("این محصول حذف شود؟")) state.products.splice(idx, 1);

  renderCollections();
  renderProducts();
});

document.addEventListener("DOMContentLoaded", renderAll);
