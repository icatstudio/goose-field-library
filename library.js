// Goose Field Library — renders one shelf (shelves/<id>.json) into the page.
// The card builders are pure functions so `node --test test/` can check them without a browser.
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "";

  // photo button: thumbnail in the grid, the original in the lightbox
  function photoHtml(base, id, cap, alt) {
    return `<button class="ph" data-src="${base}/img/${esc(id)}.jpg" data-cap="${esc(cap)}" aria-label="Enlarge photo of ${esc(alt)}"><img src="${base}/thumb/${esc(id)}.jpg" alt="${esc(alt)}" loading="lazy"></button>`;
  }

  // spore print slot: pending = empty dashed circle; done = colour disc + the print's photo
  function sporeHtml(f, base) {
    const s = f.spore;
    if (!s) return "";
    if (s.status !== "done") return `<div class="spore"><i aria-hidden="true"></i>Spore print: pending</div>`;
    const disc = `<i aria-hidden="true" style="background:${esc(s.hex || "#888")}"></i>`;
    const text = `Spore print: ${esc(s.colour || "done")}${s.note ? ` · ${esc(s.note)}` : ""}`;
    const photo = s.photo ? photoHtml(base, s.photo, `${f.no} · spore print`, `spore print of ${f.name}`) : "";
    return `<div class="spore done">${disc}<span>${text}</span>${photo}</div>`;
  }

  function cardHtml(f, base) {
    return `
  <article class="sheet" data-kind="${esc(f.kind)}">
    <div class="photos" data-n="${f.photos.length}" style="--n:${f.photos.length}">
      ${f.photos.map(p => photoHtml(base, p, `${f.no} · ${f.name}`, f.name)).join("")}
    </div>
    <div class="label">
      <div class="labeltop"><span class="no">${esc(f.no)}</span><span>${esc(f.time)}</span></div>
      <h2>${esc(f.name)}</h2>
      ${f.latin || f.tr ? `<div class="latin">${esc(f.latin)}${f.tr ? ` <span class="tr">· ${esc(f.tr)}</span>` : ""}</div>` : ""}
      <div class="chips"><span class="chip ${esc(f.flag)}">${esc(f.flagText)}</span>${f.conf ? `<span class="chip conf">ID ${esc(f.conf)}</span>` : ""}</div>
      <dl>${row("ID", f.id)}${row("Chem", f.chem)}${row("Lab", f.lab)}${row("Check", f.check)}</dl>
      ${sporeHtml(f, base)}
    </div>
  </article>`;
  }

  const photoCount = shelf => shelf.finds.reduce((n, f) => n + f.photos.length, 0);
  const gridHtml = (shelf, base) => shelf.finds.map(f => cardHtml(f, base)).join("");

  function shelflineHtml(shelf) {
    return `<span><b>${esc(shelf.date)}</b>${shelf.time ? ` · ${esc(shelf.time)}` : ""}</span><span><b>${esc(shelf.place)}</b></span><span>leg. ${esc(shelf.leg)} · det. ${esc(shelf.det)}</span><span><b>${shelf.finds.length}</b> finds · <b>${photoCount(shelf)}</b> photos</span>`;
  }

  function shelvesNavHtml(list, current) {
    return list.map(s => `<a href="#${esc(s.id)}"${s.id === current ? ' aria-current="page"' : ""}>Shelf ${esc(s.shelf)} · ${esc(s.title)}</a>`).join("");
  }

  if (typeof module !== "undefined") module.exports = { cardHtml, sporeHtml, gridHtml, shelflineHtml, shelvesNavHtml, photoCount, esc };
  if (typeof document === "undefined") return;

  // ---- browser side ----
  const $ = id => document.getElementById(id);
  const grid = $("grid");

  async function load(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  }

  function showShelf(shelf) {
    const base = `shelves/${shelf.id}`;
    $("eyebrow").textContent = `Goose Field Library · Shelf ${shelf.shelf}`;
    $("title").textContent = shelf.title;
    $("lede").textContent = shelf.lede || "";
    $("shelfline").innerHTML = shelflineHtml(shelf);
    document.title = `${shelf.title} · Goose Field Library`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && shelf.description) meta.setAttribute("content", shelf.description);
    grid.innerHTML = gridHtml(shelf, base);
    applyFilter(document.querySelector('.tab[aria-pressed="true"]').dataset.f);
  }

  function applyFilter(f) {
    grid.querySelectorAll(".sheet").forEach(s => { s.hidden = !(f === "all" || s.dataset.kind === f); });
  }

  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-pressed", x === t ? "true" : "false"));
    applyFilter(t.dataset.f);
  }));

  const lb = $("lb");
  document.addEventListener("click", e => {
    const b = e.target.closest(".ph"); if (!b) return;
    $("lbimg").src = b.dataset.src;
    $("lbcap").textContent = b.dataset.cap;
    if (lb.showModal) lb.showModal();
  });
  lb.addEventListener("click", () => lb.close());

  let index = null;
  async function route() {
    const want = location.hash.replace(/^#/, "");
    const pick = index.shelves.find(s => s.id === want) || index.shelves[index.shelves.length - 1];
    $("shelves").innerHTML = shelvesNavHtml(index.shelves, pick.id);
    $("shelves").hidden = index.shelves.length < 2;
    try {
      showShelf(await load(`shelves/${pick.id}.json`));
    } catch (err) {
      grid.innerHTML = `<p class="empty">This shelf did not load (${esc(err.message)}).</p>`;
    }
  }
  load("shelves/index.json").then(i => { index = i; window.addEventListener("hashchange", route); return route(); })
    .catch(err => { grid.innerHTML = `<p class="empty">The library index did not load (${esc(err.message)}).</p>`; });
})();
