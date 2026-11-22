// Кондитерская: коробка конфет своими руками, подарочный сертификат, хлеб к утру, десерты.
(function () {
  "use strict";
  var rub = function (n) { return n.toLocaleString("ru-RU") + " ₽"; };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var cat = function (id) { return (window.MENU || []).filter(function (c) { return c.id === id; })[0]; };
  var PLUS = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>';

  // ---------- lists with add buttons (bread, desserts) ----------
  function list(el, c) {
    if (!el || !c) return;
    el.innerHTML = c.items.map(function (it, i) {
      var key = c.id + "-" + i;
      return '<li><button type="button" class="nm dish-open" data-dish="' + key + '">' + esc(it[0]) + '</button><span class="dots"></span><span class="w">' + it[1] + '</span><span class="price">' + rub(it[2]) +
        '</span><span data-slot><button class="add" type="button" data-add="' + key + '" aria-label="Добавить: ' + esc(it[0]) + '">' + PLUS + "</button></span></li>";
    }).join("");
  }
  list(document.getElementById("bread-list"), cat("hleb"));
  list(document.getElementById("dessert-list"), cat("deserty"));
  window.dispatchEvent(new Event("cart:refresh"));

  // ---------- candy box ----------
  var konf = cat("konfety");
  var cells = document.querySelector(".cbox__cells");
  if (konf && cells) {
    // each flavour gets its own look: shell colour + topping colour
    var LOOK = [
      ["#3a2418", "#e08a2c"], ["#efe6d6", "#c23b4c"], ["#2e2018", "#7fa35a"], ["#8a5a32", "#d9b07a"], ["#3b2a20", "#c9a26a"],
      ["#7b4a2c", "#a3243a"], ["#8b5a35", "#c49a6c"], ["#22160f", "#6b4b2a"], ["#2a1c14", "#d6556b"]
    ];
    var box = [null, null, null, null, null, null, null, null, null];
    var pal = document.querySelector(".cpal");
    var candy = function (i) {
      var l = LOOK[i % LOOK.length];
      return '<span class="cnd" style="--c1:' + l[0] + ';--c2:' + l[1] + '"></span>';
    };
    pal.innerHTML = konf.items.map(function (it, i) {
      return '<li><button type="button" class="cpal__b" data-k="' + i + '">' + candy(i) + '<span class="cpal__n">' + esc(it[0]) + '</span><span class="cpal__p">' + rub(it[2]) + "</span></button></li>";
    }).join("");
    var draw = function () {
      cells.innerHTML = box.map(function (k, i) {
        return k === null
          ? '<div class="cell" role="listitem" aria-label="Пустая ячейка"></div>'
          : '<button type="button" class="cell is-full" role="listitem" data-cell="' + i + '" aria-label="Убрать: ' + esc(konf.items[k][0]) + '">' + candy(k) + "</button>";
      }).join("");
      var total = box.reduce(function (s, k) { return s + (k === null ? 0 : konf.items[k][2]); }, 0);
      var filled = box.filter(function (k) { return k !== null; }).length;
      document.getElementById("box-sum").textContent = rub(total);
      document.querySelector(".cbox__sum span").textContent = filled === 9 ? "Коробка собрана" : "Конфет в коробке: " + filled + " из 9";
      document.getElementById("box-add").disabled = filled < 9;
    };
    pal.addEventListener("click", function (e) {
      var b = e.target.closest(".cpal__b"); if (!b) return;
      var free = box.indexOf(null); if (free < 0) return;
      box[free] = +b.getAttribute("data-k"); draw();
      var c = cells.children[free]; if (c) { c.classList.add("is-new"); }
    });
    cells.addEventListener("click", function (e) {
      var c = e.target.closest("[data-cell]"); if (!c) return;
      box[+c.getAttribute("data-cell")] = null; draw();
    });
    document.getElementById("box-clear").addEventListener("click", function () { box = box.map(function () { return null; }); draw(); });
    document.getElementById("box-fill").addEventListener("click", function () {
      box = box.map(function (k, i) { return k !== null ? k : i % konf.items.length; }); draw();
    });
    document.getElementById("box-add").addEventListener("click", function () {
      var counts = {};
      box.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
      var parts = Object.keys(counts).map(function (k) { return counts[k] + "× " + konf.items[k][0]; });
      var total = box.reduce(function (s, k) { return s + konf.items[k][2]; }, 0);
      var key = "box:" + box.join("");
      window.LCart.addCustom(key, { name: "Коробка конфет: " + parts.join(", "), w: "9 шт.", price: total });
    });
    draw();
  }

  // ---------- gift certificate ----------
  var gift = document.getElementById("gift");
  if (gift) {
    var amount = 5000, design = "green";
    var DESIGN = { green: "Зелёный", paper: "Сливочный", wine: "Бордо" };
    var own = document.getElementById("gift-own"), toIn = document.getElementById("gift-name"), msgIn = document.getElementById("gift-text");
    var sync = function () {
      document.getElementById("gift-sum").textContent = rub(amount);
      document.getElementById("gift-to").textContent = toIn.value.trim() ? "Для: " + toIn.value.trim() : "Для дорогого гостя";
      document.getElementById("gift-msg").textContent = msgIn.value.trim();
      gift.setAttribute("data-design", design);
    };
    document.getElementById("gift-sums").addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      amount = +b.getAttribute("data-v"); own.value = "";
      this.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      sync();
    });
    own.addEventListener("input", function () {
      var v = Math.round(+own.value);
      if (v >= 1000 && v <= 100000) { amount = v; document.querySelectorAll("#gift-sums .chip").forEach(function (x) { x.classList.remove("is-on"); }); sync(); }
    });
    document.getElementById("gift-designs").addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      design = b.getAttribute("data-d");
      this.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      sync();
    });
    [toIn, msgIn].forEach(function (i) { i.addEventListener("input", sync); });
    document.getElementById("gift-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = "Подарочный сертификат на " + rub(amount) + " · " + DESIGN[design] + (toIn.value.trim() ? " · для: " + toIn.value.trim() : "");
      window.LCart.addCustom("gift:" + amount + ":" + design + ":" + toIn.value.trim().slice(0, 20), { name: name, w: "", price: amount });
    });
    sync();
  }
})();
