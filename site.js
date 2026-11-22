// Общее для всех страниц: навигация и статус по барнаульскому времени.
(function () {
  "use strict";

  // ---------- full-screen menu ----------
  var btn = document.querySelector(".menubtn"), ov = document.getElementById("ov");
  if (btn && ov) {
    var pic = ov.querySelector(".ov__pic img");
    var set = function (open) {
      if (open) { ov.hidden = false; requestAnimationFrame(function () { ov.classList.add("is-in"); }); }
      else { ov.classList.remove("is-in"); ov.hidden = true; }
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector(".menubtn__t").textContent = open ? "Закрыть" : "Меню";
      document.body.classList.toggle("ov-open", open);
      if (open) { var a = ov.querySelector("a"); if (a) a.focus({ preventScroll: true }); }
    };
    btn.addEventListener("click", function () { set(ov.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) { set(false); btn.focus(); } });
    ov.querySelectorAll(".ov__list a").forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        if (!pic) return;
        var src = a.getAttribute("data-img");
        if (pic.getAttribute("src") === src) return;
        pic.style.opacity = 0;
        setTimeout(function () { pic.src = src; pic.style.opacity = 1; }, 180);
      });
      a.addEventListener("click", function () { set(false); });
    });
  }

  // ---------- Barnaul clock ----------
  var EVENTS = [
    { d: "2026-11-20", t: "20:00", n: "Вечер свеч" },
    { d: "2026-11-21", t: "19:00", n: "Гастроэкскурсия с Юлией Дворниковой" }
  ];
  function barnaulNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Barnaul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date(Date.now() + 7 * 3600 * 1000);
      parts = { year: d.getUTCFullYear(), month: ("0" + (d.getUTCMonth() + 1)).slice(-2), day: ("0" + d.getUTCDate()).slice(-2), hour: ("0" + d.getUTCHours()).slice(-2), minute: ("0" + d.getUTCMinutes()).slice(-2) };
    }
    return { date: parts.year + "-" + parts.month + "-" + parts.day, h: +parts.hour, m: +parts.minute, hm: parts.hour + ":" + parts.minute };
  }
  function tomorrow(date) { var d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
  function status() {
    var n = barnaulNow(), open, txt;
    if (n.h >= 11) { open = true; txt = "Ресторан открыт до 24:00"; }
    else if (n.h >= 8) { open = true; txt = "Кондитерская открыта, ресторан с 11:00"; }
    else { open = false; txt = "Сейчас закрыто, кондитерская откроется в 08:00"; }
    var ev = EVENTS.filter(function (e) { return e.d === n.date; })[0], when = "Сегодня";
    if (!ev) { ev = EVENTS.filter(function (e) { return e.d === tomorrow(n.date); })[0]; when = "Завтра"; }
    var evTxt = ev ? ' · ' + when + " в " + ev.t + ": " + ev.n : "";
    return '<span class="dot' + (open ? "" : " is-off") + '"></span>В Барнауле ' + n.hm + " · " + txt + evTxt;
  }
  function paintLive() { document.querySelectorAll("[data-live]").forEach(function (el) { el.innerHTML = status(); }); }
  if (document.querySelector("[data-live]")) { paintLive(); setInterval(paintLive, 30000); }
})();

// Залы: колонки коллажа едут с разной скоростью, фото открывается на весь экран.
(function () {
  "use strict";
  var col = document.querySelector(".collage");
  if (!col) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cols = [].slice.call(col.querySelectorAll(".collage__col"));
  if (!reduce && window.matchMedia("(min-width: 900px)").matches) {
    var tick = false;
    var paint = function () {
      tick = false;
      var r = col.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height) - .5;
      cols.forEach(function (c) { c.style.transform = "translateY(" + (p * (+c.getAttribute("data-speed")) * r.height * .5) + "px)"; });
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }
  var items = [].slice.call(col.querySelectorAll(".collage__item")).sort(function (a, b) { return a.getAttribute("data-i") - b.getAttribute("data-i"); });
  var lb = document.querySelector(".lb");
  if (!lb) return;
  var img = lb.querySelector(".lb__img"), cnt = lb.querySelector(".lb__count"), at = 0, opener = null;
  var show = function (i) { at = (i + items.length) % items.length; var im = items[at].querySelector("img"); img.src = im.src; img.alt = im.alt; cnt.textContent = (at + 1) + " / " + items.length; };
  var close = function () { lb.hidden = true; document.body.style.overflow = ""; if (opener) opener.focus(); };
  items.forEach(function (it, i) { it.addEventListener("click", function () { opener = it; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb__x").focus(); }); });
  lb.querySelector(".lb__x").addEventListener("click", close);
  lb.querySelector(".lb__prev").addEventListener("click", function () { show(at - 1); });
  lb.querySelector(".lb__next").addEventListener("click", function () { show(at + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(at + 1); if (e.key === "ArrowLeft") show(at - 1); });
  var tx = 0;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) show(at + (d < 0 ? 1 : -1)); });
})();

// Находки: золотая линия растёт, а находки загораются по мере чтения.
(function () {
  "use strict";
  var tl = document.querySelector(".tl");
  if (!tl) return;
  const collection = tl.closest("details");
  function openLinkedCollection() {
    if (location.hash === "#nahodki") collection.open = true;
  }
  openLinkedCollection();
  window.addEventListener("hashchange", openLinkedCollection);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fill = tl.querySelector(".tl__fill"), items = [].slice.call(tl.querySelectorAll(".tl__i"));
  if (reduce) { items.forEach(function (i) { i.classList.add("on"); }); fill.style.height = "100%"; return; }
  var t = false;
  var paint = function () {
    t = false;
    var r = tl.getBoundingClientRect(), mark = window.innerHeight * 0.62;
    var h = Math.max(0, Math.min(r.height, mark - r.top));
    fill.style.height = h + "px";
    items.forEach(function (i) { i.classList.toggle("on", i.getBoundingClientRect().top + 14 < mark); });
  };
  window.addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(paint); } }, { passive: true });
  collection.addEventListener("toggle", paint);
  window.addEventListener("resize", paint);
  paint();
})();

(function () {
  const album = document.querySelector(".archive-album");
  if (!album) return;
  const controls = album.querySelector(".album-controls");
  const buttons = controls.querySelectorAll("button");
  function show(selected) {
    for (const button of buttons) {
      const active = button === selected;
      document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
      button.setAttribute("aria-pressed", String(active));
    }
  }
  for (const button of buttons) button.addEventListener("click", () => show(button));
  show(buttons[0]);
  controls.hidden = false;
})();
