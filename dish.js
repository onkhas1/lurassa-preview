// Карточка блюда: на компьютере окно по центру, на телефоне шторка снизу.
(function () {
  "use strict";
  if (!window.LCart) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var box = document.createElement("div");
  box.className = "dsh"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "dsh-t");
  box.innerHTML = '<div class="dsh__card"><span class="dsh__grip" aria-hidden="true"></span>' +
    '<button class="dsh__x" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
    '<div class="dsh__pic"></div><div class="dsh__body"><p class="dsh__cat"></p><h2 class="dsh__t" id="dsh-t"></h2><p class="dsh__meta"></p><div class="dsh__extra"></div><div class="dsh__row"><span class="price"></span><span class="dsh__add"></span></div></div></div>';
  document.body.appendChild(box);
  var opener = null;

  function open(id, from) {
    var d = window.LCart.get(id); if (!d) return;
    opener = from || null;
    var pic = box.querySelector(".dsh__pic");
    pic.innerHTML = d.pic ? '<img src="img/dish-' + d.pic + '.webp" alt="' + esc(d.name) + '">' : '<span class="dsh__noimg" aria-hidden="true"></span>';
    box.classList.toggle("dsh--noimg", !d.pic);
    box.querySelector(".dsh__cat").textContent = d.cat || "";
    box.querySelector(".dsh__t").textContent = d.name;
    box.querySelector(".dsh__meta").textContent = d.w ? "Вес " + d.w : "";
    var r = window.LCart.romance(id), extra = "";
    if (r) extra += '<div class="dsh__rom"><b>Случился роман</b><p>К этому блюду подойдёт ' + esc(r.pair) + ". " + esc(r.note) + "</p></div>";
    if (id === "goryachee-3") extra += '<p class="dsh__note">Выберите прожарку стейка: от rare (51–55 °C) до well done (71–80 °C).</p>';
    extra += '<p class="dsh__note">Состав и аллергены уточните у официанта.</p>';
    box.querySelector(".dsh__extra").innerHTML = extra;
    box.querySelector(".price").textContent = window.LCart.rub(d.price);
    box.querySelector(".dsh__add").innerHTML = '<button class="btn btn--red add-wide" type="button" data-add="' + id + '">В заказ</button>';
    box.hidden = false;
    document.body.classList.add("dsh-open");
    requestAnimationFrame(function () { box.classList.add("is-in"); });
    box.querySelector(".dsh__x").focus();
  }
  function close() {
    box.classList.remove("is-in");
    document.body.classList.remove("dsh-open");
    setTimeout(function () { box.hidden = true; }, 250);
    if (opener && opener.focus) opener.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-dish]");
    if (t) { e.preventDefault(); open(t.getAttribute("data-dish"), t); return; }
    if (e.target === box || e.target.closest(".dsh__x")) close();
    // adding from the card: let app.js handle it, then close
    if (e.target.closest(".dsh .add-wide")) setTimeout(close, 150);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) close();
    var t = e.target.closest && e.target.closest('[data-dish][role="button"]');
    if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(t.getAttribute("data-dish"), t); }
  });

  // swipe the sheet down to close on phones
  var y0 = null, card = box.querySelector(".dsh__card");
  card.addEventListener("touchstart", function (e) { if (card.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  card.addEventListener("touchmove", function (e) { if (y0 === null) return; var d = e.touches[0].clientY - y0; if (d > 0) card.style.transform = "translateY(" + d + "px)"; }, { passive: true });
  card.addEventListener("touchend", function (e) {
    if (y0 === null) return; var d = e.changedTouches[0].clientY - y0; y0 = null; card.style.transform = "";
    if (d > 90) close();
  });
})();
