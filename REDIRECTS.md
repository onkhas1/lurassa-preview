# Переезд ресторана ЛЮРАССА

| Старый путь | Новый путь | HTTP |
|---|---|---|
| /menu | /menu.html | 301 |
| /banket | /bankety.html | 301 |
| /history | /istoriya.html | 301 |
| /sweetshop | /konditerskaya.html | 301 |
| /tpost/… | /afisha.html | 301 |

Настрой правила на сервере или CDN, который принимает запросы к старым адресам. При сохранении GitHub Pages используй правила перенаправления на проксирующем CDN. Для Nginx добавь в блок server домена следующие правила, проверь конфигурацию командой nginx -t и примени её в момент переезда.

```nginx
location = /menu { return 301 https://lurassa.ru/menu.html$is_args$args; }
location = /banket { return 301 https://lurassa.ru/bankety.html$is_args$args; }
location = /history { return 301 https://lurassa.ru/istoriya.html$is_args$args; }
location = /sweetshop { return 301 https://lurassa.ru/konditerskaya.html$is_args$args; }
location ^~ /tpost/ { return 301 https://lurassa.ru/afisha.html$is_args$args; }
```

В production-копии исходников переключи PREVIEW на False в _src/seo.py и выполни python3 -IB _src/build.py. Опубликуй robots-production.txt под именем robots.txt в корне домена. Превью собирай с PREVIEW = True. Заполни координаты ресторана объектом GeoCoordinates с числовыми latitude и longitude и подтверди priceRange перед открытием индексации.

Проверь каждый старый адрес командой curl -I и переход до конечной страницы командой curl -IL. Ожидаемый результат — один ответ 301 с нужным Location и затем 200. Проверь доступность sitemap.xml, изображения для соцсетей и отсутствие noindex на новом домене.

После изменения menu-data.js выполни node tools/build-menu.js из каталога сайта. Команда обновляет блюда, ссылки категорий и JSON-LD в menu.html. Полная сборка обновляет также версии CSS и JS на всех страницах. При публикации обновления меню используй полную сборку, чтобы браузеры получили свежие данные.

[Директива return в документации Nginx](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#return)
