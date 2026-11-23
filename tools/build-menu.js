// Run from the site directory after editing menu-data.js.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'menu-data.js'), 'utf8'), context);
const menu = context.window.MENU;
const escape = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

function card(category, item, index) {
  const [name, weight, price, photo] = item;
  const id = escape(category.id + '-' + index);
  const label = escape(name);
  const picture = photo ? `<button type="button" class="mitem__pic" data-dish="${id}" aria-label="Подробнее: ${label}"><img src="img/dish-${escape(photo)}.webp" alt="${label}" loading="lazy" width="84" height="84"></button>` : '';
  const add = `<button class="add" type="button" data-add="${id}" aria-label="Добавить: ${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg></button>`;
  return `<div class="mitem${photo ? ' mitem--pic' : ''}">${picture}<div><button type="button" class="mitem__name dish-open" data-dish="${id}">${label}</button><div class="mitem__w">${escape(weight)}${id === 'goryachee-3' ? ' · выберите прожарку' : ''}</div></div><div class="mitem__act"><span class="price">${price.toLocaleString('ru-RU')} ₽</span><span data-slot>${add}</span></div></div>`;
}

const sections = menu.map(c => `<section class="mcat" id="${escape(c.id)}"><div class="mcat__head"><h2>${escape(c.title)}</h2>${c.note ? '<p>' + escape(c.note) + '</p>' : ''}</div><div class="mitems">
${c.items.map((item, i) => card(c, item, i)).join('\n')}
</div></section>`);
const schema = { '@context': 'https://schema.org', '@type': 'Menu', name: 'Меню ресторана ЛЮРАССА',
  hasMenuSection: menu.map(c => ({ '@type': 'MenuSection', name: c.title,
    hasMenuItem: c.items.map(([name, weight, price]) => ({ '@type': 'MenuItem', name,
      description: weight, offers: { '@type': 'Offer', price, priceCurrency: 'RUB' } })) })) };
const tabs = menu.map(c => `<a href="#${escape(c.id)}">${escape(c.title)}</a>`).join('');
const block = `<!-- MENU:START -->
<nav class="tabs" aria-label="Разделы меню"><div class="tabs__in">${tabs}</div></nav>
<div class="mbody"><div class="wrap"><div id="menu-root">
${sections.join('\n')}
</div></div></div>
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
<!-- MENU:END -->`;
const file = path.join(root, 'menu.html');
const html = fs.readFileSync(file, 'utf8');
const markers = /<!-- MENU:START -->[^]*?<!-- MENU:END -->/g;
if (html.match(markers)?.length !== 1) throw new Error('Проверьте границы MENU в menu.html');
fs.writeFileSync(file, html.replace(markers, () => block));
