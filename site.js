// Общее для всех страниц: полноэкранное меню, живой статус по барнаульскому времени,
// первый экран по времени суток, проявление текста по словам.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var top = document.querySelector(".bk-top");

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

  // ---------- header over the home hero ----------
  if (top && top.classList.contains("bk-top--over")) {
    var hero = document.querySelector(".h3");
    var onS = function () { top.classList.toggle("is-scrolled", !hero || hero.getBoundingClientRect().bottom < 80); };
    window.addEventListener("scroll", onS, { passive: true }); onS();
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

  // ---------- hero mood by time of day ----------
  var h3 = document.querySelector(".h3");
  if (h3) {
    var MOODS = {
      morning: { t: "Завтрак в кондитерской", sub: "Кондитерская открывается в 08:00. Круассан, кофе и никакой спешки, чем не купеческое утро.",
        cta: [["konditerskaya.html#korobka", "Собрать коробку конфет", "light"], ["konditerskaya.html#hleb", "Хлеб к утру", "line"]] },
      day: { t: "Обеденный час", sub: "Обедаем по‑купечески, не торопясь. Хлеб пекут здесь же, а пельмени лепят руками. Открыто с 11:00.",
        cta: [["bron.html", "Забронировать стол", "light"], ["menu.html", "Меню", "line"]] },
      evening: { t: "Ужин у камина", sub: "Тёплый зал, огонь в камине и неспешный разговор. Двери открыты до полуночи.",
        cta: [["bron.html", "Забронировать стол", "light"], ["afisha.html", "Афиша вечера", "line"]] }
    };
    var hour = barnaulNow().h;
    var mood = hour >= 6 && hour < 11 ? "morning" : hour >= 11 && hour < 17 ? "day" : "evening";
    var title = h3.querySelector("[data-mood-text]"), subEl = h3.querySelector("[data-mood-sub]"), ctaEl = h3.querySelector("[data-mood-cta]");
    var timer = 0;
    var apply = function (m) {
      mood = m; h3.setAttribute("data-mood", m);
      [title, subEl, ctaEl].forEach(function (el) { if (el) el.style.opacity = 0; });
      setTimeout(function () {
        var M = MOODS[m];
        title.textContent = M.t;
        if (subEl) subEl.textContent = M.sub;
        if (ctaEl) ctaEl.innerHTML = M.cta.map(function (c) { return '<a class="btn btn--' + c[2] + '" href="' + c[0] + '">' + c[1] + "</a>"; }).join("");
        [title, subEl, ctaEl].forEach(function (el) { if (el) el.style.opacity = 1; });
      }, reduce ? 0 : 300);
      document.querySelectorAll(".moods button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-m") === m)); });
      var imgs = [].slice.call(h3.querySelectorAll('.h3__set[data-for="' + m + '"] img'));
      h3.querySelectorAll(".h3__set img").forEach(function (i) { i.classList.remove("is-on"); });
      if (imgs[0]) { void imgs[0].offsetWidth; imgs[0].classList.add("is-on"); }
      clearInterval(timer);
      if (!reduce && imgs.length > 1) {
        var cur = 0;
        timer = setInterval(function () {
          if (document.hidden) return;
          var next = (cur + 1) % imgs.length, prev = imgs[cur];
          imgs[next].classList.remove("is-on"); void imgs[next].offsetWidth; imgs[next].classList.add("is-on");
          setTimeout(function () { prev.classList.remove("is-on"); }, 1800);
          cur = next;
        }, 6500);
      }
    };
    var bar = h3.querySelector(".moods");
    if (bar) bar.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) apply(b.getAttribute("data-m")); });
    apply(mood);

    // the big word drifts up a little as you scroll away
    var word = h3.querySelector(".h3__word");
    if (word && !reduce) {
      var t = false;
      window.addEventListener("scroll", function () {
        if (t) return; t = true;
        requestAnimationFrame(function () { t = false; var y = Math.min(window.scrollY, window.innerHeight); word.style.transform = "translateY(" + (-y * 0.25) + "px)"; });
      }, { passive: true });
    }
  }

  // ---------- statement: words light up as you read ----------
  var say = document.querySelector("[data-words]");
  if (say) {
    say.innerHTML = say.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    var ws = [].slice.call(say.querySelectorAll(".w"));
    if (reduce) ws.forEach(function (w) { w.classList.add("on"); });
    else {
      var paint = function () {
        var r = say.getBoundingClientRect(), vh = window.innerHeight;
        var p = (vh * 0.92 - r.top) / (r.height + vh * 0.2);
        var k = Math.round(Math.max(0, Math.min(1, p)) * ws.length);
        ws.forEach(function (w, i) { w.classList.toggle("on", i < k); });
      };
      window.addEventListener("scroll", paint, { passive: true }); paint();
    }
  }
  // ---------- scenes: show their text once they settle ----------
  var scenes = document.querySelectorAll(".scene");
  if (scenes.length) {
    if (reduce || !("IntersectionObserver" in window)) scenes.forEach(function (sc) { sc.classList.add("is-in"); });
    else {
      var sio = new IntersectionObserver(function (ents) { ents.forEach(function (en) { en.target.classList.toggle("is-in", en.intersectionRatio > 0.55); }); }, { threshold: [0, .55, 1] });
      scenes.forEach(function (sc) { sio.observe(sc); });
    }
  }
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
  window.addEventListener("resize", paint);
  paint();
})();
