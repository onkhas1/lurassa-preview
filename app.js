// Корзина Люрассы: блюда из меню + свои позиции (коробка конфет, сертификат, стейк с прожаркой),
// подсказка «Случился роман», бронь-заглушка.
(function () {
  "use strict";

  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>';

  // ---------- catalog ----------
  var byId = {};
  (window.MENU || []).forEach(function (cat) {
    cat.items.forEach(function (it, i) {
      var id = cat.id + "-" + i;
      byId[id] = { id: id, name: it[0], w: it[1], price: it[2], pic: it[3] || null, cat: cat.title };
    });
  });

  // steaks ask for doneness (temperatures from the restaurant's printed menu)
  var STEAKS = { "goryachee-3": true };
  var DONENESS = [
    ["rare", "Rare", "51–55 °C"], ["medium rare", "Medium rare", "55–60 °C"], ["medium", "Medium", "57–66 °C"],
    ["medium well", "Medium well", "63–69 °C"], ["well done", "Well done", "71–80 °C"]
  ];

  // «Случился роман» — pairs from the restaurant's printed menu
  var ROMANCE = {
    "zakuski-12": { pair: "тёмный нефильтрованный стаут «Фляйсбах Драй Стаут»", note: "Свежесть огурца и прохлада мяты оттеняют насыщенный характер стаута, а его обжаренные ноты дополняют рыбу." },
    "goryachee-6": { pair: "настойка «Брусника-крапива»", note: "Ягодная кислинка подчёркивает сочность утки, а травяные оттенки поддерживают лесной характер блюда." },
    "goryachee-16": { pair: "красное сухое вино «Адагум Эстейт» из Краснодарского края", note: "Вино дополняет мясной вкус, а сливочная нежность пюре и сыра придаёт сочетанию глубину." },
    "goryachee-1": { pair: "коктейль «Купеческая роскошь»", note: "Маракуйя и облепиха добавляют кислинку, игристое — лёгкость, а ром — характер." }
  };

  // ---------- state ----------
  var KEY = "lurassa-cart", XKEY = "lurassa-extra";
  var cart = {}, extra = {};
  try { cart = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { cart = {}; }
  try { extra = JSON.parse(localStorage.getItem(XKEY) || "{}") || {}; } catch (e) { extra = {}; }
  Object.keys(extra).forEach(function (k) {
    var x = extra[k];
    if (x && typeof x.name === "string" && x.price > 0) byId[k] = { id: k, name: x.name, w: String(x.w || ""), price: +x.price, custom: true };
  });
  Object.keys(cart).forEach(function (id) {
    var q = parseInt(cart[id], 10);
    if (!byId[id] || !(q > 0)) delete cart[id]; else cart[id] = Math.min(q, 99);
  });
  function save() {
    var keep = {};
    Object.keys(cart).forEach(function (k) { if (byId[k] && byId[k].custom) keep[k] = { name: byId[k].name, w: byId[k].w, price: byId[k].price }; });
    try { localStorage.setItem(KEY, JSON.stringify(cart)); localStorage.setItem(XKEY, JSON.stringify(keep)); } catch (e) {}
  }

  function count() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
  function sum() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id] * byId[id].price; }, 0); }
  function rub(n) { return n.toLocaleString("ru-RU") + " ₽"; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function setQty(id, q) { if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 99); save(); render(); }

  // public API for page widgets (candy box, certificate)
  window.LCart = {
    addCustom: function (key, info) {
      byId[key] = { id: key, name: info.name, w: info.w || "", price: info.price, custom: true };
      setQty(key, (cart[key] || 0) + 1);
      toast("Добавлено в заказ", esc(info.name));
    },
    open: function () { openDrawer(); },
    get: function (id) { return byId[id]; },
    romance: function (id) { return ROMANCE[id]; },
    rub: rub
  };

  // ---------- rendering ----------
  var drawer = document.querySelector(".drawer");
  var bar = document.querySelector(".cartbar");

  function render() {
    var n = count();
    document.querySelectorAll(".cart-btn__n").forEach(function (el) { el.textContent = n ? n : ""; });
    if (bar) {
      bar.classList.toggle("is-on", n > 0);
      bar.querySelector(".cartbar__sum").innerHTML = rub(sum()) + "<small>" + n + " " + plural(n, "позиция", "позиции", "позиций") + "</small>";
    }
    document.querySelectorAll("[data-slot]").forEach(function (slot) {
      var el = slot.querySelector("[data-add]");
      if (!el) return;
      var id = el.getAttribute("data-add");
      if (STEAKS[id]) return; // steaks always open the doneness picker
      var q = cart[id] || 0;
      if (q > 0 && slot.getAttribute("data-mode") !== "qty") { slot.setAttribute("data-mode", "qty"); slot.innerHTML = qtyHtml(id, q); }
      else if (q > 0) { slot.querySelector(".qty span").textContent = q; }
      else if (slot.getAttribute("data-mode") === "qty") { slot.setAttribute("data-mode", "add"); slot.innerHTML = addHtml(id); }
    });
    renderDrawer();
  }

  function addHtml(id) { return '<button class="add" type="button" data-add="' + id + '" aria-label="Добавить: ' + esc(byId[id].name) + '">' + PLUS + "</button>"; }
  function qtyHtml(id, q) {
    var d = byId[id];
    return '<div class="qty" data-add="' + id + '"><button type="button" data-dec="' + id + '" aria-label="Убрать одну: ' + esc(d.name) + '">−</button><span aria-live="polite">' + q + '</span><button type="button" data-inc="' + id + '" aria-label="Добавить ещё: ' + esc(d.name) + '">+</button></div>';
  }

  function renderDrawer() {
    if (!drawer) return;
    var body = drawer.querySelector(".drawer__body");
    var ids = Object.keys(cart);
    if (!ids.length) {
      body.innerHTML = '<div class="empty"><b>Корзина пуста</b>Добавьте блюда из меню, и они появятся здесь.</div>';
      drawer.classList.remove("is-checkout");
    } else {
      body.innerHTML = ids.map(function (id) {
        var d = byId[id];
        return '<div class="line"><div><div class="line__name">' + esc(d.name) + '</div><div class="line__meta">' + (d.w ? esc(d.w) + " · " : "") + rub(d.price) + "</div></div>" +
          '<div class="price">' + rub(d.price * cart[id]) + "</div>" + qtyHtml(id, cart[id]) + "</div>";
      }).join("");
    }
    drawer.querySelector(".total span:last-child").textContent = rub(sum());
    drawer.querySelectorAll(".to-checkout, .checkout button[type=submit]").forEach(function (b) { b.disabled = !ids.length; });
  }

  // ---------- feedback ----------
  function stamp(btn) {
    var host = btn.closest(".plate, .mitem, .carte__list li");
    if (!host) return;
    var s = document.createElement("span");
    s.className = "stamp"; s.textContent = "В заказе";
    if (host.classList.contains("plate")) { s.style.left = "14px"; s.style.top = "14px"; }
    host.style.position = host.style.position || "relative";
    host.appendChild(s);
    setTimeout(function () { s.classList.add("out"); }, 1100);
    setTimeout(function () { s.remove(); }, 1600);
  }

  var toastEl = null, toastT = 0;
  function toast(title, html) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = "<b>" + title + "</b><p>" + html + "</p>";
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 6500);
  }

  function romance(id) {
    var r = ROMANCE[id];
    if (!r) return;
    toast("Случился роман", "К блюду «" + esc(byId[id].name) + "» подойдёт " + esc(r.pair) + ". " + esc(r.note));
  }

  // ---------- doneness picker ----------
  var picker = null;
  function pickDoneness(id, btn) {
    if (!picker) {
      picker = document.createElement("div");
      picker.className = "pick"; picker.hidden = true;
      picker.setAttribute("role", "dialog"); picker.setAttribute("aria-modal", "true"); picker.setAttribute("aria-label", "Прожарка стейка");
      picker.innerHTML = '<div class="pick__box"><div class="pick__head"><b>Какая прожарка?</b><button class="pick__x" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button></div><div class="pick__list"></div><p class="pick__note">Температура внутри стейка, как в меню ресторана.</p></div>';
      document.body.appendChild(picker);
      picker.querySelector(".pick__x").addEventListener("click", closePick);
      picker.addEventListener("click", function (e) { if (e.target === picker) closePick(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !picker.hidden) closePick(); });
    }
    var base = byId[id];
    picker.querySelector(".pick__list").innerHTML = DONENESS.map(function (d, i) {
      return '<button type="button" class="pick__opt" data-d="' + i + '"><span>' + d[1] + "</span><small>" + d[2] + "</small></button>";
    }).join("");
    picker.querySelectorAll(".pick__opt").forEach(function (o) {
      o.addEventListener("click", function () {
        var d = DONENESS[+o.getAttribute("data-d")], key = id + "~" + d[0];
        byId[key] = { id: key, name: base.name + " · " + d[1], w: base.w, price: base.price, custom: true };
        setQty(key, (cart[key] || 0) + 1);
        closePick(); stamp(btn);
        toast("Добавлено в заказ", esc(base.name) + ", прожарка " + d[1].toLowerCase() + ".");
      });
    });
    picker.hidden = false; picker._opener = btn;
    picker.querySelector(".pick__opt").focus();
  }
  function closePick() { picker.hidden = true; if (picker._opener) picker._opener.focus(); }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t) return;
    var id;
    if ((id = t.getAttribute("data-add")) && (t.classList.contains("add") || t.classList.contains("add-wide"))) {
      if (STEAKS[id]) { pickDoneness(id, t); return; }
      stamp(t); setQty(id, (cart[id] || 0) + 1); romance(id);
    } else if ((id = t.getAttribute("data-inc"))) { setQty(id, (cart[id] || 0) + 1); }
    else if ((id = t.getAttribute("data-dec"))) { setQty(id, (cart[id] || 0) - 1); }
    else if (t.hasAttribute("data-open-cart")) { e.preventDefault(); openDrawer(); }
    else if (t.hasAttribute("data-close-cart")) { closeDrawer(); }
    else if (t.classList.contains("to-checkout")) { drawer.classList.add("is-checkout"); var f = drawer.querySelector(".checkout input"); if (f) f.focus(); }
  });

  var lastFocus = null;
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderDrawer();
    drawer.querySelector(".x").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("is-open", "is-checkout"); drawer.setAttribute("aria-hidden", "true");
    drawer.querySelector(".checkout").style.display = ""; drawer.querySelector(".checkout-ok").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) closeDrawer(); });
  if (drawer) {
    drawer.querySelector(".drawer__bg").addEventListener("click", closeDrawer);
    var co = drawer.querySelector(".checkout");
    co.addEventListener("submit", function (e) {
      e.preventDefault();
      co.style.display = "none"; drawer.querySelector(".checkout-ok").hidden = false;
      cart = {}; save(); render();
    });
  }

  // ---------- booking form (prototype) ----------
  document.querySelectorAll("form[data-book]").forEach(function (f) {
    var d = f.querySelector('input[type="date"]');
    if (d) { var t = new Date(); d.min = t.toISOString().slice(0, 10); if (!d.value) d.value = d.min; }
    f.addEventListener("submit", function (e) { e.preventDefault(); f.classList.add("is-sent"); f.querySelector(".form__ok").focus(); });
  });

  // ---------- full menu page ----------
  var mroot = document.getElementById("menu-root");
  if (mroot) {
    var tabs = document.querySelector(".tabs__in");
    tabs.innerHTML = window.MENU.map(function (c) { return '<a href="#' + c.id + '">' + c.title + "</a>"; }).join("");
    mroot.innerHTML = window.MENU.map(function (c) {
      return '<section class="mcat" id="' + c.id + '"><div class="mcat__head"><h2>' + c.title + "</h2>" + (c.note ? "<p>" + c.note + "</p>" : "") + '</div><div class="mitems">' +
        c.items.map(function (it, i) {
          var id = c.id + "-" + i, d = byId[id];
          return '<div class="mitem' + (d.pic ? " mitem--pic" : "") + '">' +
            (d.pic ? '<button type="button" class="mitem__pic" data-dish="' + id + '" aria-label="Подробнее: ' + esc(d.name) + '"><img src="img/dish-' + d.pic + '.webp" alt="" loading="lazy" width="84" height="84"></button>' : "") +
            '<div><button type="button" class="mitem__name dish-open" data-dish="' + id + '">' + esc(d.name) + (ROMANCE[id] ? ' <span class="tag">роман</span>' : "") + '</button><div class="mitem__w">' + d.w + (STEAKS[id] ? " · выберите прожарку" : "") + '</div></div>' +
            '<div class="mitem__act"><span class="price">' + rub(d.price) + '</span><span data-slot>' + addHtml(id) + "</span></div></div>";
        }).join("") + "</div></section>";
    }).join("");
    var links = tabs.querySelectorAll("a");
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + en.target.id;
          a.classList.toggle("is-active", on);
          if (on) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        });
      });
    }, { rootMargin: "-130px 0px -65% 0px" });
    document.querySelectorAll(".mcat").forEach(function (s) { io.observe(s); });
  }

  window.addEventListener("cart:refresh", render);
  render();
})();
