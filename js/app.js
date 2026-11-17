const $ = (sel, root = document) => root.querySelector(sel);
const fmt = n => Number(n).toLocaleString("fa-IR") + " " + SHOP.currency;
const findProduct = id => PRODUCTS.find(p => p.id === id);

let cart = JSON.parse(localStorage.getItem("boutique_cart") || "[]");

/* ---------- ابزارها ---------- */

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 2200);
}

function observeReveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal:not(.show)").forEach(el => io.observe(el));
}

/* ---------- سبد خرید ---------- */

function saveCart() {
  localStorage.setItem("boutique_cart", JSON.stringify(cart));
  renderCart();
}

function addToCart(id, size) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (item) item.qty++;
  else cart.push({ id, size, qty: 1 });
  saveCart();
  toast("به سبد خرید اضافه شد ✓");
}

function cartTotal() {
  return cart.reduce((sum, it) => sum + (findProduct(it.id)?.price || 0) * it.qty, 0);
}

function renderCart() {
  const box = $("#cartItems");
  let count = 0;
  box.innerHTML = cart.length ? "" : "<p class='empty'>سبد خرید خالی است</p>";
  cart.forEach((it, idx) => {
    const p = findProduct(it.id);
    if (!p) return;
    count += it.qty;
    box.insertAdjacentHTML("beforeend", `
      <div class="ci">
        <img src="${p.images[0]}" alt="">
        <div class="ci-info">
          <b>${p.title}</b>
          <small>سایز: ${it.size || "-"} | تعداد: ${it.qty}</small>
          <span>${fmt(p.price * it.qty)}</span>
        </div>
        <button class="rm" data-i="${idx}">حذف</button>
      </div>`);
  });
  box.querySelectorAll(".rm").forEach(b => {
    b.onclick = () => {
      cart.splice(Number(b.dataset.i), 1);
      saveCart();
    };
  });
  $("#cartTotal").textContent = fmt(cartTotal());
  $("#cartCount").textContent = count;
}

/* ---------- پرداخت ---------- */

function openCheckout() {
  const total = cartTotal();
  if (!total) return toast("سبد خرید خالی است");

  $("#modalBody").innerHTML = `
    <p class="total">مبلغ قابل پرداخت: <b>${fmt(total)}</b></p>
    <input id="cName" placeholder="نام و نام خانوادگی">
    <input id="cPhone" placeholder="شماره موبایل">
    <textarea id="cAddr" placeholder="آدرس کامل"></textarea>

    ${SHOP.paymentLink ? `<a class="btn full" target="_blank" href="${SHOP.paymentLink}">پرداخت آنلاین</a>` : ""}

    <div class="card-box">
      <p>پرداخت کارت به کارت</p>
      <div class="cardnum">${SHOP.bankCard}</div>
      <small>${SHOP.bankName} – ${SHOP.accountHolder}</small>
      <button class="btn ghost full" id="copyCard">کپی شماره کارت</button>
    </div>

    <button class="btn full" id="waBtn">ارسال سفارش و رسید در واتساپ</button>
  `;

  $("#copyCard").onclick = () => {
    navigator.clipboard?.writeText(SHOP.bankCard.replace(/\s/g, ""));
    toast("شماره کارت کپی شد");
  };

  $("#waBtn").onclick = () => {
    const name = $("#cName").value.trim();
    const phone = $("#cPhone").value.trim();
    const addr = $("#cAddr").value.trim();
    if (!name || !phone || !addr) return toast("نام، موبایل و آدرس را وارد کنید");

    const lines = cart.map(it => {
      const p = findProduct(it.id);
      return `- ${p.title} | سایز ${it.size || "-"} | تعداد ${it.qty}`;
    });
    const msg =
      `سفارش جدید\n${lines.join("\n")}\n` +
      `جمع کل: ${fmt(total)}\nنام: ${name}\nموبایل: ${phone}\nآدرس: ${addr}\n` +
      `(رسید واریز پیوست است)`;

    window.open(`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  $("#modal").classList.add("open");
}

/* ---------- ساخت رابط مشترک (سبد، مودال) ---------- */

function buildUI() {
  document.body.insertAdjacentHTML("beforeend", `
    <button class="cart-fab" id="cartBtn" aria-label="سبد خرید">
      🛍 <span id="cartCount">0</span>
    </button>
    <div class="overlay" id="overlay"></div>
    <aside class="drawer" id="drawer">
      <div class="drawer-head">
        <h3>سبد خرید</h3>
        <button class="x" id="closeDrawer">×</button>
      </div>
      <div id="cartItems"></div>
      <div class="drawer-foot">
        <div>جمع: <b id="cartTotal"></b></div>
        <button class="btn full" id="checkoutBtn">ثبت سفارش</button>
      </div>
    </aside>
    <div class="modal" id="modal">
      <div class="modal-box">
        <button class="x" id="closeModal">×</button>
        <h3>تکمیل سفارش</h3>
        <div id="modalBody"></div>
      </div>
    </div>
  `);

  const closeAll = () => {
    $("#drawer").classList.remove("open");
    $("#overlay").classList.remove("open");
    $("#modal").classList.remove("open");
  };

  $("#cartBtn").onclick = () => {
    $("#drawer").classList.add("open");
    $("#overlay").classList.add("open");
  };
  $("#closeDrawer").onclick = closeAll;
  $("#overlay").onclick = closeAll;
  $("#closeModal").onclick = closeAll;
  $("#checkoutBtn").onclick = openCheckout;
  document.addEventListener("keydown", e => e.key === "Escape" && closeAll());
}

/* ---------- صفحه‌ی فروشگاه ---------- */

function productCard(p) {
  return `
    <article class="card reveal" onclick="location.href='product.html?id=${p.id}'">
      <div class="img">
        <img src="${p.images[0]}" alt="${p.title}" loading="lazy">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
      </div>
      <h4>${p.title}</h4>
      <p class="price">
        ${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ""}
        ${fmt(p.price)}
      </p>
    </article>`;
}

function renderIndex() {
  $("#shopName").textContent = SHOP.name;
  $("#heroTitle").textContent = SHOP.name;
  $("#heroTagline").textContent = SHOP.tagline;

  $("#collections").innerHTML = COLLECTIONS.map((c, i) => `
    <div class="col reveal" data-c="${c.id}" style="transition-delay:${i * 0.12}s">
      <img src="${c.cover}" alt="${c.title}">
      <span>${c.title}</span>
    </div>`).join("");

  let active = "all";
  const filters = [{ id: "all", title: "همه" }, ...COLLECTIONS];

  function draw() {
    $("#filters").innerHTML = filters.map(f =>
      `<button class="chip ${f.id === active ? "on" : ""}" data-f="${f.id}">${f.title}</button>`
    ).join("");
    const list = PRODUCTS.filter(p => active === "all" || p.collection === active);
    $("#grid").innerHTML = list.map(productCard).join("") || "<p class='empty'>محصولی وجود ندارد</p>";
    observeReveals();
  }

  $("#filters").onclick = e => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    active = b.dataset.f;
    draw();
  };

  $("#collections").onclick = e => {
    const c = e.target.closest("[data-c]");
    if (!c) return;
    active = c.dataset.c;
    draw();
    $("#products").scrollIntoView({ behavior: "smooth" });
  };

  draw();
}

/* ---------- صفحه‌ی محصول ---------- */

function renderProduct(id) {
  const root = $("#product");
  const p = findProduct(id);
  if (!p) {
    root.innerHTML = "<p class='empty'>محصول پیدا نشد</p>";
    return;
  }
  document.title = `${p.title} | ${SHOP.name}`;
  let selectedSize = p.sizes?.[0] || "";

  root.innerHTML = `
    <div class="pgrid">
      <div class="gallery reveal">
        <div class="main-img"><img id="mainImg" src="${p.images[0]}" alt="${p.title}"></div>
        <div class="thumbs">
          ${p.images.map((s, i) => `<img data-s="${s}" class="${i ? "" : "on"}" src="${s}" alt="">`).join("")}
        </div>
      </div>
      <div class="info reveal">
        <h1>${p.title}</h1>
        <p class="price big">${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s> ` : ""}${fmt(p.price)}</p>
        <p class="desc">${p.description}</p>
        ${p.sizes?.length ? `
          <p class="label">سایز</p>
          <div class="sizes">
            ${p.sizes.map((s, i) => `<button class="size ${i ? "" : "on"}" data-size="${s}">${s}</button>`).join("")}
          </div>` : ""}
        <div class="actions">
          <button class="btn" id="addBtn">افزودن به سبد</button>
          <button class="btn ghost" id="buyBtn">خرید سریع</button>
        </div>
        <button class="share" id="shareBtn">کپی لینک محصول</button>
        <a class="back" href="index.html">← بازگشت به فروشگاه</a>
      </div>
    </div>`;

  root.querySelector(".thumbs").onclick = e => {
    const img = e.target.closest("img");
    if (!img) return;
    $("#mainImg").src = img.dataset.s;
    root.querySelectorAll(".thumbs img").forEach(i => i.classList.toggle("on", i === img));
  };

  root.querySelector(".sizes")?.addEventListener("click", e => {
    const b = e.target.closest(".size");
    if (!b) return;
    selectedSize = b.dataset.size;
    root.querySelectorAll(".size").forEach(i => i.classList.toggle("on", i === b));
  });

  $("#addBtn").onclick = () => addToCart(p.id, selectedSize);
  $("#buyBtn").onclick = () => {
    addToCart(p.id, selectedSize);
    $("#drawer").classList.add("open");
    $("#overlay").classList.add("open");
    openCheckout();
  };
  $("#shareBtn").onclick = () => {
    navigator.clipboard?.writeText(`${SHOP.domain}/product.html?id=${p.id}`);
    toast("لینک محصول کپی شد");
  };

  observeReveals();
}

/* ---------- شروع ---------- */

document.addEventListener("DOMContentLoaded", () => {
  buildUI();
  renderCart();
  if ($("#grid")) renderIndex();
  if ($("#product")) {
    $("#shopName").textContent = SHOP.name;
    renderProduct(new URLSearchParams(location.search).get("id"));
  }
  observeReveals();
});
