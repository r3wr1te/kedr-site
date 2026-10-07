/* Просмотр фото целиком, без обрезки.
   KedrLightbox.open(items, index, fromElement)  items: [{src, alt}]
   Стрелки, свайп, Esc, возврат фокуса на карточку. Стили лежат в site.css (.lb). */
(function () {
  'use strict';
  var lb, img, cap, count, bx, bp, bn;
  var items = [], idx = 0, back = null, tx = null;

  function build() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Просмотр фото');
    lb.innerHTML =
      '<button class="lb-btn lb-x" type="button" aria-label="Закрыть">×</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Предыдущее фото">←</button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Следующее фото">→</button>' +
      '<div class="lb-stage"><img class="lb-img" alt=""></div>' +
      '<div class="lb-bar"><span class="lb-cap"></span><span class="lb-count"></span></div>';
    document.body.appendChild(lb);
    img = lb.querySelector('.lb-img');
    cap = lb.querySelector('.lb-cap');
    count = lb.querySelector('.lb-count');
    bx = lb.querySelector('.lb-x');
    bp = lb.querySelector('.lb-prev');
    bn = lb.querySelector('.lb-next');

    bx.addEventListener('click', close);
    bp.addEventListener('click', function () { step(-1); });
    bn.addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-stage')) close();
    });
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    img.addEventListener('error', function () { cap.textContent = 'Не удалось загрузить фото'; });
    document.addEventListener('keydown', onKey);
  }

  function show() {
    var it = items[idx];
    img.src = it.src;
    img.alt = it.alt || '';
    cap.textContent = it.alt || '';
    count.textContent = items.length > 1 ? (idx + 1) + ' / ' + items.length : '';
    bp.hidden = bn.hidden = items.length < 2;
    if (items.length > 1) {
      var nx = items[(idx + 1) % items.length];
      var pre = new Image();
      pre.src = nx.src;
    }
  }

  function open(list, i, from) {
    build();
    items = list;
    idx = i || 0;
    back = from || null;
    show();
    lb.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    bx.focus();
  }

  function close() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    img.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (back) back.focus();
  }

  function step(d) {
    if (items.length < 2) return;
    idx = (idx + d + items.length) % items.length;
    show();
  }

  function onKey(e) {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowLeft') { step(-1); }
    else if (e.key === 'ArrowRight') { step(1); }
    else if (e.key === 'Tab') {
      var f = [bx, bp, bn].filter(function (b) { return !b.hidden; });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  window.KedrLightbox = { open: open, close: close };
})();
