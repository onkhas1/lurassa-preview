// Главная Люрассы: фото на первом экране, прейскурант, галерея залов, находки, застолье.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rub(n) { return n.toLocaleString("ru-RU") + " ₽"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- Прейскурант (runs before app.js so cart state applies to it) ----------
  var tabs = document.querySelector(".tabs2");
  var list = document.querySelector(".carte__list[aria-live]");
  var PICK = ["zakuski", "supy", "goryachee", "lepnye", "pech", "deserty"];
  if (tabs && list && window.MENU) {
    var cats = window.MENU.filter(function (c) { return PICK.indexOf(c.id) > -1; });
    tabs.innerHTML = cats.map(function (c, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-cat="' + c.id + '">' + c.title + "</button>";
    }).join("");
    var show = function (id) {
      var c = cats.filter(function (x) { return x.id === id; })[0];
      list.innerHTML = c.items.slice(0, 8).map(function (it, i) {
        var key = c.id + "-" + i;
        return '<li><button type="button" class="nm dish-open" data-dish="' + key + '">' + esc(it[0]) + '</button><span class="dots"></span><span class="w">' + it[1] + '</span><span class="price">' + rub(it[2]) +
          '</span><span data-slot><button class="add" type="button" data-add="' + key + '" aria-label="Добавить: ' + esc(it[0]) +
          '"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg></button></span></li>';
      }).join("");
      tabs.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-cat") === id)); });
      window.dispatchEvent(new Event("cart:refresh"));
    };
    tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) show(b.getAttribute("data-cat")); });
    show(cats[0].id);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  function init() {
    // ---------- hero: slow crossfade of real photos ----------
    var slides = [].slice.call(document.querySelectorAll(".hero2__media img"));
    if (slides.length > 1 && !reduce) {
      var cur = 0;
      setInterval(function () {
        if (document.hidden) return;
        var next = (cur + 1) % slides.length;
        slides[next].classList.remove("is-on"); void slides[next].offsetWidth;
        slides[next].classList.add("is-on");
        var prev = slides[cur];
        setTimeout(function () { prev.classList.remove("is-on"); }, 1800);
        cur = next;
      }, 6000);
    }

    // ---------- reveals ----------
    var els = document.querySelectorAll(".rv, .wipe");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -10% 0px" });
      els.forEach(function (el) { io.observe(el); });
    } else { els.forEach(function (el) { el.classList.add("in"); }); }

    // ---------- gallery ----------
    var track = document.querySelector(".gal__track");
    if (track) {
      var items = [].slice.call(track.querySelectorAll(".gal__item"));
      var countEl = document.querySelector(".gal__count b");
      var prevBtn = document.querySelector('.gal__nav [data-dir="-1"]'), nextBtn = document.querySelector('.gal__nav [data-dir="1"]');
      var base = function () { return items[0].offsetLeft; };
      var current = function () {
        var x = track.scrollLeft + 8, idx = 0;
        items.forEach(function (it, i) { if (it.offsetLeft - base() <= x) idx = i; });
        return idx;
      };
      var sync = function () {
        countEl.textContent = current() + 1;
        prevBtn.disabled = track.scrollLeft < 4;
        nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      };
      var go = function (i) {
        i = Math.max(0, Math.min(items.length - 1, i));
        track.scrollTo({ left: items[i].offsetLeft - base(), behavior: reduce ? "auto" : "smooth" });
      };
      prevBtn.addEventListener("click", function () { go(current() - 1); });
      nextBtn.addEventListener("click", function () { go(current() + 1); });
      track.addEventListener("scroll", function () { requestAnimationFrame(sync); }, { passive: true });
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
      });
      // drag with a mouse
      var down = false, sx = 0, sl = 0, moved = false;
      track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.style.scrollSnapType = "none"; });
      window.addEventListener("pointermove", function (e) { if (!down) return; var d = e.clientX - sx; if (Math.abs(d) > 4) moved = true; track.scrollLeft = sl - d; });
      window.addEventListener("pointerup", function () { if (!down) return; down = false; track.style.scrollSnapType = ""; if (moved) go(current()); setTimeout(function () { moved = false; }, 0); });
      sync();

      // lightbox
      var lb = document.querySelector(".lb"), lbImg = lb.querySelector(".lb__img"), lbCount = lb.querySelector(".lb__count"), at = 0, opener = null;
      var showLb = function (i) {
        at = (i + items.length) % items.length;
        var im = items[at].querySelector("img");
        lbImg.src = im.src; lbImg.alt = im.alt;
        lbCount.textContent = (at + 1) + " / " + items.length;
      };
      var closeLb = function () { lb.hidden = true; document.body.style.overflow = ""; if (opener) opener.focus(); };
      items.forEach(function (it, i) {
        it.addEventListener("click", function () { if (moved) return; opener = it; showLb(i); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb__x").focus(); });
      });
      lb.querySelector(".lb__x").addEventListener("click", closeLb);
      lb.querySelector(".lb__prev").addEventListener("click", function () { showLb(at - 1); });
      lb.querySelector(".lb__next").addEventListener("click", function () { showLb(at + 1); });
      lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
      document.addEventListener("keydown", function (e) {
        if (lb.hidden) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") showLb(at + 1);
        if (e.key === "ArrowLeft") showLb(at - 1);
      });
      var tx = 0;
      lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener("touchend", function (e) { var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) showLb(at + (d < 0 ? 1 : -1)); });
    }

    // ---------- finds: the big year follows the open entry ----------
    var big = document.getElementById("year-big");
    document.querySelectorAll(".ledger button").forEach(function (b) {
      b.addEventListener("mouseenter", function () {
        var y = b.getAttribute("data-year");
        if (big && big.textContent !== y && window.matchMedia("(hover: hover)").matches) { big.classList.add("is-out"); setTimeout(function () { big.textContent = y; big.classList.remove("is-out"); }, 200); }
      });
      b.addEventListener("click", function () {
        var li = b.parentElement;
        li.parentElement.querySelectorAll("li").forEach(function (x) { x.classList.remove("is-open"); x.firstElementChild.setAttribute("aria-expanded", "false"); });
        li.classList.add("is-open"); b.setAttribute("aria-expanded", "true");
        var y = b.getAttribute("data-year");
        if (big && big.textContent !== y) {
          big.classList.add("is-out");
          setTimeout(function () { big.textContent = y; big.classList.remove("is-out"); }, reduce ? 0 : 300);
        }
      });
    });

    var led = document.querySelector(".ledger");
    if (led && big) led.addEventListener("mouseleave", function () {
      var o = led.querySelector("li.is-open button"); if (!o) return;
      var y = o.getAttribute("data-year"); if (big.textContent === y) return;
      big.classList.add("is-out"); setTimeout(function () { big.textContent = y; big.classList.remove("is-out"); }, 200);
    });

    // ---------- feast: guests → tables of 8 ----------
    var range = document.getElementById("g-range");
    if (range) {
      var nEl = document.getElementById("g-n"), wEl = document.getElementById("g-word"), fEl = document.getElementById("g-fmt");
      var svg = document.querySelector(".seats"), wa = document.getElementById("g-wa");
      var word = function (n) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? "гость" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "гостя" : "гостей"; };
      var fmt = function (n) {
        if (n <= 6) return "Стол в зале. Забронируйте его в форме внизу страницы.";
        if (n <= 20) return "Компания за длинным столом. Меню и рассадку обсудим заранее.";
        if (n <= 50) return "Большое застолье. Подберём зал, меню и блюда по предзаказу.";
        return "Банкетный зал целиком, до 80 гостей.";
      };
      // one table = 8 seats (4 each side), up to 5 tables in a row
      var draw = function (n) {
        var tables = Math.ceil(n / 8), cols = Math.min(5, tables), rows = Math.ceil(tables / cols);
        var cw = 80, ch = 44, tw = 56, th = 14, out = "", left = n;
        for (var t = 0; t < tables; t++) {
          var cx = (t % cols) * cw, cy = Math.floor(t / cols) * ch;
          var x = cx + (cw - tw) / 2, y = cy + 15;
          out += '<rect x="' + x + '" y="' + y + '" width="' + tw + '" height="' + th + '" rx="2"/>';
          var seats = Math.min(8, left); left -= seats;
          for (var s = 0; s < seats; s++) {
            var side = s % 2, k = Math.floor(s / 2);
            var sx = x + 7 + k * ((tw - 14) / 3), sy = side ? y + th + 6 : y - 6;
            out += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy + '" r="3.4"/>';
          }
        }
        svg.setAttribute("viewBox", "0 0 " + (cols * cw) + " " + (rows * ch));
        svg.style.maxWidth = (cols * cw * 1.25) + "px";
        svg.innerHTML = out;
      };
      var update = function () {
        var n = +range.value;
        nEl.textContent = n; wEl.textContent = word(n); fEl.textContent = fmt(n); draw(n);
        wa.href = "https://wa.me/79231614002?text=" + encodeURIComponent("Здравствуйте! Хотим застолье в Люрассе, нас " + n + " " + word(n) + ".");
      };
      range.addEventListener("input", update);
      update();
    }
  }
})();
