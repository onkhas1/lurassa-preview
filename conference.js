(() => {
  const gallery = document.querySelector(".conference-gallery__track");
  document.querySelectorAll(".conference-views a").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const slide = document.querySelector(link.hash);
      gallery.scrollTo({
        left: slide.offsetLeft - gallery.firstElementChild.offsetLeft,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
      });
    });
  });

  const navigation = document.querySelector(".conference-menu__tabs");
  if (!navigation) return;

  const tabs = Array.from(navigation.querySelectorAll("a"));
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  navigation.setAttribute("role", "tablist");

  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute("aria-selected", String(active));
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, i) => {
    tab.id = panels[i].id + "-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;

    tab.addEventListener("click", event => {
      event.preventDefault();
      select(i, true);
      history.replaceState(null, "", tab.hash);
    });

    tab.addEventListener("keydown", event => {
      const last = tabs.length - 1;
      const destinations = {
        ArrowLeft: (i + last) % tabs.length,
        ArrowRight: (i + 1) % tabs.length,
        Home: 0,
        End: last,
        " ": i
      };
      const next = destinations[event.key];
      if (typeof next !== "number") return;
      event.preventDefault();
      select(next, true);
      history.replaceState(null, "", tabs[next].hash);
    });
  });

  function selectHash() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(Math.max(0, index));
  }
  window.addEventListener("hashchange", selectHash);
  selectHash();
})();
