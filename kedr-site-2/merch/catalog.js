/* Каталог мерча: фильтры, поиск, страницы по 12 позиций, просмотр фото и заявка.
   Данные берутся из products.js (window.CATALOG). */
(function () {
  'use strict';

  var DATA = window.CATALOG || { categories: [], products: [] };
  var BASE = '../';   /* страница лежит в папке merch, а пути к фото в products.js считаются от корня сайта */
  var PER = 12;       /* позиций на странице: делится на 2, 3 и 4 колонки */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s) { return document.querySelector(s); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function url(p) { return /^(https?:|data:|\/)/.test(p) ? p : BASE + p; }

  var grid = $('#grid'), chipsEl = $('#chips'), qEl = $('#q'), pagesEl = $('#pages'),
      statusEl = $('#status'), emptyEl = $('#empty');
  grid.style.setProperty('--ratio', grid.dataset.ratio || '4/5');

  /* ---------- data ---------- */
  var products = (DATA.products || []).map(function (p, i) {
    var name = p.name || 'Без названия';
    return {
      id: p.id || ('p' + i),
      category: p.category || '',
      name: name,
      desc: p.desc || '',
      price: p.price || '',
      art: p.art || '',
      photos: (p.photos || []).map(function (x) {
        var o = typeof x === 'string' ? { src: x } : x;
        return { src: url(o.src), alt: o.alt || name, pos: o.pos };
      }),
      hay: [name, p.desc, p.art, p.category].join(' ').toLowerCase()
    };
  });
  var cats = (DATA.categories || []).slice();
  products.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });

  var state = { cat: '', q: '', page: 1 };

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return products.filter(function (p) {
      return (!state.cat || p.category === state.cat) && (!q || p.hay.indexOf(q) >= 0);
    });
  }

  /* ---------- filters ---------- */
  function chip(label, n, value) {
    var b = el('button', 'chip');
    b.type = 'button';
    b.dataset.cat = value;
    b.appendChild(document.createTextNode(label));
    b.appendChild(el('small', '', String(n)));
    b.setAttribute('aria-pressed', value === state.cat ? 'true' : 'false');
    b.addEventListener('click', function () {
      state.cat = value;
      state.page = 1;
      syncChips();
      render();
    });
    return b;
  }
  function buildChips() {
    chipsEl.textContent = '';
    chipsEl.appendChild(chip('Все', products.length, ''));
    cats.forEach(function (c) {
      var n = products.filter(function (p) { return p.category === c; }).length;
      if (n) chipsEl.appendChild(chip(c, n, c));
    });
  }
  function syncChips() {
    Array.prototype.forEach.call(chipsEl.children, function (b) {
      b.setAttribute('aria-pressed', b.dataset.cat === state.cat ? 'true' : 'false');
    });
  }

  /* ---------- cards ---------- */
  function card(p) {
    var li = el('li', 'card');
    var tile;
    if (p.photos.length) {
      tile = el('button', 'tile');
      tile.type = 'button';
      tile.setAttribute('aria-label', 'Открыть фото: ' + p.name + (p.photos.length > 1 ? ' (' + p.photos.length + ' фото)' : ''));
      var im = new Image();
      im.src = p.photos[0].src;
      im.alt = '';
      im.loading = 'lazy';
      im.decoding = 'async';
      if (p.photos[0].pos) im.style.objectPosition = p.photos[0].pos;
      tile.appendChild(im);
      if (p.photos.length > 1) tile.appendChild(el('span', 'tile-n', p.photos.length + ' фото'));
      tile.addEventListener('click', function () { window.KedrLightbox.open(p.photos, 0, tile); });
    } else {
      tile = el('div', 'tile empty');
      tile.setAttribute('aria-hidden', 'true');
      tile.appendChild(el('span', '', p.category || 'Фото'));
    }
    li.appendChild(tile);

    var body = el('div', 'card-body');
    body.appendChild(el('h3', '', p.name));
    if (p.desc) body.appendChild(el('p', 'spec', p.desc));
    if (p.art) body.appendChild(el('p', 'art', 'Арт. ' + p.art));
    var foot = el('div', 'card-foot');
    foot.appendChild(el('span', 'c-price' + (/\d/.test(p.price) ? '' : ' ask'), p.price || 'по запросу'));
    var order = el('button', 'btn ghost small', 'Заказать');
    order.type = 'button';
    order.addEventListener('click', function () { orderItem(p); });
    foot.appendChild(order);
    body.appendChild(foot);
    li.appendChild(body);
    return li;
  }

  /* ---------- pages ---------- */
  function pageList(cur, n) {
    var set = {};
    set[1] = 1;
    set[n] = 1;
    for (var i = cur - 1; i <= cur + 1; i++) if (i > 1 && i < n) set[i] = 1;
    var arr = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    var out = [], prev = 0;
    arr.forEach(function (x) {
      if (prev && x - prev > 1) out.push('…');
      out.push(x);
      prev = x;
    });
    return out;
  }
  function pbtn(text, label, page, disabled) {
    var b = el('button', 'pg-btn', text);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.disabled = disabled;
    b.addEventListener('click', function () { go(page); });
    return b;
  }
  function renderPages(n) {
    pagesEl.textContent = '';
    pagesEl.hidden = n < 2;
    if (n < 2) return;
    pagesEl.appendChild(pbtn('←', 'Предыдущая страница', state.page - 1, state.page <= 1));
    pageList(state.page, n).forEach(function (x) {
      if (x === '…') { pagesEl.appendChild(el('span', 'gap', '…')); return; }
      var b = pbtn(String(x), 'Страница ' + x, x, false);
      if (x === state.page) b.setAttribute('aria-current', 'page');
      pagesEl.appendChild(b);
    });
    pagesEl.appendChild(pbtn('→', 'Следующая страница', state.page + 1, state.page >= n));
  }
  function go(p) {
    state.page = p;
    render();
    var cur = pagesEl.querySelector('[aria-current="page"]');
    if (cur) cur.focus({ preventScroll: true });
    $('#catalog').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- render ---------- */
  function render() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > pages) state.page = pages;
    var from = (state.page - 1) * PER;
    var slice = list.slice(from, from + PER);

    grid.textContent = '';
    slice.forEach(function (p) { grid.appendChild(card(p)); });
    emptyEl.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    statusEl.textContent = list.length
      ? 'Показано ' + (from + 1) + '–' + (from + slice.length) + ' из ' + list.length
      : 'Ничего не найдено';
    renderPages(pages);
  }

  qEl.addEventListener('input', function () { state.q = qEl.value; state.page = 1; render(); });
  $('#reset').addEventListener('click', function () {
    state.cat = ''; state.q = ''; state.page = 1; qEl.value = '';
    syncChips();
    render();
  });

  /* ---------- order ---------- */
  var itemEl = $('#o-item'), nameEl = $('#o-name');
  function orderItem(p) {
    itemEl.value = p.name + (p.art ? ' (арт. ' + p.art + ')' : '');
    $('#order').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { nameEl.focus({ preventScroll: true }); }, reduce ? 0 : 500);
  }

  /* lead form: replace this handler with the Bitrix24 CRM form embed on the live site */
  var form = $('#lead'), st = $('#f-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    st.hidden = false;
    st.textContent = 'Это пробная страница, форма пока не отправляет данные. Позвоните +7 (495) 969-52-38 или напишите на info@agkedr.ru.';
  });

  /* back to top */
  var up = $('#up');
  function onScroll() { up.classList.toggle('show', window.scrollY > 700); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  buildChips();
  render();
})();
