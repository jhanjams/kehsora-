/* ==========================================================================
   KEHSORA — Site Script
   Static-preview behaviour. In Shopify, the cart functions below should be
   replaced with Shopify's Ajax Cart API (/cart/add.js, /cart/change.js,
   /cart.js) — the markup hooks (data-*) stay the same.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Product catalogue (mirrors the 5 Shopify products) ---------- */
  var SIZES = {
    '30ml': { now: 349, was: 499 },
    '50ml': { now: 499, was: 699 }
  };

  var PRODUCTS = {
    'bhringraj': {
      name: 'Bhringraj Hair Oil Concentrate',
      kicker: 'HAIR FALL & ROOTS',
      concern: 'hairfall',
      badge: 'BESTSELLER',
      benefit: 'Ayurveda’s “ruler of hair” — reduces fall, promotes growth',
      rating: 4.8, reviews: 112,
      desc: 'Bhringraj is known in Ayurveda as the “ruler of hair” — and this concentrate is formulated to actually earn that name. Traditionally infused to draw out its full potency, it’s built to reduce hair fall and support visibly thicker regrowth, not just add a familiar name to the label.',
      chips: ['Reduces hair fall', 'Strengthens roots', 'Promotes regrowth'],
      ingredients: 'Heat-infused Bhringraj (Eclipta alba), coconut oil base, curry leaves, fenugreek seed extract, Vitamin E (natural preservative). Formulated using traditional Ayurvedic infusion — not a diluted trace-amount blend.',
      images: ['assets/bhringraj-1.jpg', 'assets/bhringraj-2.jpg']
    },
    'rosemary': {
      name: 'Rosemary Hair Oil Concentrate',
      kicker: 'GROWTH & CIRCULATION',
      concern: 'growth',
      badge: 'NEW',
      benefit: 'Stimulates scalp circulation, strengthens roots',
      rating: 4.7, reviews: 86,
      desc: 'Rosemary has been used for centuries as a remedy for scalp health, across the Mediterranean and in Ayurveda alike. It works by improving blood circulation to the scalp, so hair follicles receive more of what they need to actually grow stronger — while its natural antimicrobial and anti-inflammatory properties calm an irritated or flaky scalp.',
      chips: ['Scalp circulation', 'Follicle strength', 'Calms irritation'],
      ingredients: 'Rosemary concentrate. [Add the full ingredient list from the product label.]',
      images: ['assets/rosemary-1.jpg', 'assets/rosemary-2.jpg']
    },
    'pumpkin-seed': {
      name: 'Pumpkin Seed Hair Oil Concentrate',
      kicker: 'DENSITY & THICKNESS',
      concern: 'growth',
      badge: 'TOP RATED',
      benefit: 'Zinc-rich, backed by modern research',
      rating: 4.8, reviews: 64,
      desc: 'Pumpkin seed isn’t part of ancient Ayurvedic tradition — it’s a newer addition, backed by modern research rather than centuries of folklore. Rich in zinc, fatty acids and antioxidants, it has been linked in clinical studies to reduced hair thinning. Cold-pressed to preserve its natural nutrients.',
      chips: ['Supports density', 'Zinc-rich', 'Research-backed'],
      ingredients: 'Cold-pressed pumpkin seed oil. [Add the full ingredient list from the product label.]',
      images: ['assets/pumpkin-seed-1.jpg', 'assets/pumpkin-seed-2.jpg']
    },
    'jojoba': {
      name: 'Jojoba Hair Oil Concentrate',
      kicker: 'SCALP & BALANCE',
      concern: 'scalp',
      badge: 'GENTLE DAILY',
      benefit: 'Lightweight, mimics your scalp’s natural sebum',
      rating: 4.6, reviews: 51,
      desc: 'Jojoba closely mimics your scalp’s own natural sebum, which means it absorbs rather than sits heavy on top — ideal for an oily scalp or anyone who finds traditional oils too greasy to use regularly. Naturally lightweight and non-comedogenic, and gentle enough for daily use.',
      chips: ['Lightweight', 'Balances oily scalp', 'Fast-absorbing'],
      ingredients: 'Jojoba oil. [Add the full ingredient list from the product label.]',
      images: ['assets/jojoba-1.jpg', 'assets/jojoba-2.jpg']
    },
    'sweet-almond': {
      name: 'Sweet Almond Hair Oil Concentrate',
      kicker: 'SHINE & SOFTNESS',
      concern: 'dryness',
      badge: 'EVERYDAY',
      benefit: 'Vitamin E-rich — softens, adds shine, reduces breakage',
      rating: 4.7, reviews: 58,
      desc: 'Rich in Vitamin E, sweet almond is a deeply nourishing concentrate formulated to soften hair, add natural shine, and strengthen strands against breakage. Gentle enough for most hair types including sensitive scalps — a dependable everyday choice for dry, dull or brittle hair.',
      chips: ['Adds shine', 'Softens hair', 'Reduces breakage'],
      ingredients: 'Sweet almond oil. [Add the full ingredient list from the product label.]',
      images: ['assets/sweet-almond-1.jpg', 'assets/sweet-almond-2.jpg']
    }
  };
  window.KEHSORA_PRODUCTS = PRODUCTS;

  var FREE_SHIP = 999;
  var CART_KEY = 'kehsora_cart_v1';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var rupee = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- Hide broken images until real assets are uploaded ---------- */
  function guardImages(root) {
    $$('img', root).forEach(function (img) {
      var mark = function () { img.classList.add('img-missing'); };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) mark();
      img.addEventListener('error', mark);
      img.addEventListener('load', function () { img.classList.remove('img-missing'); });
    });
  }

  /* ---------- Cart store ---------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable */ }
    renderCart();
  }
  function addToCart(item) {
    var items = readCart();
    var id = item.handle + '|' + item.size;
    var found = items.filter(function (i) { return i.id === id; })[0];
    if (found) found.qty += item.qty || 1;
    else items.push({ id: id, handle: item.handle, name: item.name, size: item.size, price: Number(item.price), img: item.img, qty: item.qty || 1 });
    writeCart(items);
    var count = $('[data-cart-count]');
    if (count) { count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); }
    toast('Added to cart — ' + item.name);
  }
  function setQty(id, qty) {
    var items = readCart().map(function (i) { if (i.id === id) i.qty = qty; return i; }).filter(function (i) { return i.qty > 0; });
    writeCart(items);
  }
  function totals(items) {
    return items.reduce(function (a, i) { a.qty += i.qty; a.sub += i.qty * i.price; return a; }, { qty: 0, sub: 0 });
  }

  function lineHTML(i) {
    return '<div class="cart-line">' +
      '<a class="cart-line-img" href="product.html?p=' + esc(i.handle) + '"><img src="' + esc(i.img) + '" alt="' + esc(i.name) + '"></a>' +
      '<div><div class="cart-line-name">' + esc(i.name) + '</div>' +
      '<div class="cart-line-meta">' + esc(i.size) + ' · ' + rupee(i.price) + '</div>' +
      '<div class="qty"><button data-qty-dec="' + esc(i.id) + '" aria-label="Decrease">&minus;</button><span>' + i.qty + '</span><button data-qty-inc="' + esc(i.id) + '" aria-label="Increase">+</button></div></div>' +
      '<div><div class="cart-line-price">' + rupee(i.price * i.qty) + '</div><button class="cart-line-remove" data-remove="' + esc(i.id) + '">Remove</button></div>' +
      '</div>';
  }
  function shipHTML(sub) {
    var left = FREE_SHIP - sub;
    var pct = Math.min(100, Math.round(sub / FREE_SHIP * 100));
    var msg = left > 0 ? 'You’re ' + rupee(left) + ' away from <strong>free shipping</strong>' : 'You’ve unlocked <strong>free shipping</strong> ✦';
    return '<div class="ship-progress">' + msg + '<div class="ship-bar"><span style="width:' + pct + '%"></span></div></div>';
  }

  function renderCart() {
    var items = readCart();
    var t = totals(items);

    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = t.qty;
      el.classList.toggle('has-items', t.qty > 0);
    });

    // Drawer
    var body = $('[data-cart-body]'), foot = $('[data-cart-foot]');
    if (body) {
      body.innerHTML = items.length
        ? items.map(lineHTML).join('')
        : '<div class="cart-empty"><p>Your cart is empty.</p><a href="shop.html" class="btn btn-ghost-gold btn-sm">Shop the range</a></div>';
      guardImages(body);
    }
    if (foot) {
      foot.style.display = items.length ? '' : 'none';
      var sub = $('[data-cart-subtotal]', foot); if (sub) sub.textContent = rupee(t.sub);
      var ship = $('[data-ship]', foot); if (ship) ship.innerHTML = shipHTML(t.sub);
    }

    // Cart page
    var page = $('[data-cart-page]');
    if (page) {
      var list = $('[data-cart-page-items]');
      list.innerHTML = items.length
        ? items.map(lineHTML).join('')
        : '<div class="cart-empty" style="text-align:left;padding:2rem 0;"><p>Your cart is empty.</p><a href="shop.html" class="btn btn-gold">Shop the range</a></div>';
      guardImages(list);
      $$('[data-cart-page-sub]').forEach(function (el) { el.textContent = rupee(t.sub); });
      var shipRow = $('[data-cart-page-ship]'); if (shipRow) shipRow.textContent = t.sub >= FREE_SHIP ? 'Free' : 'Calculated at checkout';
      var shipBar = $('[data-cart-page-progress]'); if (shipBar) shipBar.innerHTML = items.length ? shipHTML(t.sub) : '';
      var checkout = $('[data-checkout]'); if (checkout) checkout.classList.toggle('btn-disabled', !items.length);
    }
  }

  function openCart() { document.body.classList.add('cart-open', 'no-scroll'); }
  function closeCart() { document.body.classList.remove('cart-open', 'no-scroll'); }

  var toastTimer;
  function toast(msg) {
    var el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ---------- Global click handling ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var add = t.closest('[data-add-to-cart]');
    if (add) {
      e.preventDefault();
      var qtyEl = $('[data-pdp-qty]');
      addToCart({
        handle: add.dataset.handle,
        name: add.dataset.name,
        price: add.dataset.price,
        size: add.dataset.size || '30ml',
        img: add.dataset.img,
        qty: add.hasAttribute('data-pdp-add') && qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1
      });
      if (add.hasAttribute('data-buy-now')) { window.location.href = 'cart.html'; return; }
      if (!$('[data-cart-page]')) openCart();
      return;
    }
    if (t.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (t.closest('[data-cart-close]')) { closeCart(); return; }

    var inc = t.closest('[data-qty-inc]'), dec = t.closest('[data-qty-dec]'), rem = t.closest('[data-remove]');
    if (inc || dec || rem) {
      var id = (inc || dec || rem).getAttribute(inc ? 'data-qty-inc' : dec ? 'data-qty-dec' : 'data-remove');
      var line = readCart().filter(function (i) { return i.id === id; })[0];
      if (!line) return;
      setQty(id, rem ? 0 : line.qty + (inc ? 1 : -1));
      return;
    }

    if (t.closest('[data-mobile-menu-btn]')) { $('[data-mobile-nav]').classList.add('open'); document.body.classList.add('no-scroll'); return; }
    if (t.closest('[data-mobile-nav-close]') || (t.closest('[data-mobile-nav] a'))) { $('[data-mobile-nav]').classList.remove('open'); document.body.classList.remove('no-scroll'); }

    if (t.closest('[data-search-open]')) { var so = $('[data-search]'); so.classList.add('open'); setTimeout(function () { $('input', so).focus(); }, 100); return; }
    if (t.closest('[data-search-close]')) { $('[data-search]').classList.remove('open'); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeCart();
      var s = $('[data-search]'); if (s) s.classList.remove('open');
      var m = $('[data-mobile-nav]'); if (m) { m.classList.remove('open'); document.body.classList.remove('no-scroll'); }
    }
  });

  /* ---------- Header on scroll ---------- */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, .reveal-stagger').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal, .reveal-stagger').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero video: fade in only when a real file is present ---------- */
  var vid = $('[data-hero-video]');
  if (vid) {
    vid.addEventListener('loadeddata', function () { vid.classList.add('ready'); });
    vid.addEventListener('error', function () { vid.remove(); }, true);
  }

  /* ---------- Tabs (shop by concern / shop filters) ---------- */
  $$('[data-tabs]').forEach(function (group) {
    $$('.concern-tab', group).forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.concern-tab', group).forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        if (tab.dataset.target) {
          $$('.concern-panel', group).forEach(function (p) { p.classList.toggle('active', p.id === tab.dataset.target); });
        }
      });
    });
  });

  /* ---------- Accordion ---------- */
  $$('.accordion-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.accordion-item');
      item.classList.toggle('open');
      btn.setAttribute('aria-expanded', item.classList.contains('open'));
    });
  });

  /* ---------- Forms (newsletter + contact) ---------- */
  $$('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.dataset.success || 'Thank you — we’ll be in touch.';
      var note = document.createElement('p');
      note.className = 'form-success';
      note.textContent = msg;
      form.replaceWith(note);
    });
  });

  /* ---------- Search ---------- */
  var searchForm = $('[data-search] form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('input', searchForm).value.trim();
      window.location.href = 'shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  }

  /* ---------- Shop page (renders from the catalogue) ---------- */
  var shopGrid = $('[data-shop-grid]');
  if (shopGrid) {
    var params = new URLSearchParams(location.search);
    var query = (params.get('q') || '').toLowerCase();
    var current = params.get('concern') || 'all';

    var cardHTML = function (h) {
      var p = PRODUCTS[h];
      return '<article class="product-card" data-concern="' + p.concern + '">' +
        '<a href="product.html?p=' + h + '" class="product-card-media"><span class="product-badge">' + esc(p.badge) + '</span><img src="' + p.images[0] + '" alt="' + esc(p.name) + '" loading="lazy"></a>' +
        '<div class="product-card-body"><div class="product-card-kicker">' + esc(p.kicker) + '</div>' +
        '<h3><a href="product.html?p=' + h + '">' + esc(p.name) + '</a></h3>' +
        '<p class="product-card-benefit">' + esc(p.benefit) + '</p>' +
        '<div class="product-rating"><span class="stars">★★★★★</span> ' + p.rating + ' (' + p.reviews + ')</div>' +
        '<div class="product-price-row"><span class="price-now">' + rupee(SIZES['30ml'].now) + '</span><span class="price-was">' + rupee(SIZES['30ml'].was) + '</span><span class="price-off">30% OFF</span></div>' +
        '<button class="btn btn-ghost-gold btn-sm btn-block" data-add-to-cart data-handle="' + h + '" data-name="' + esc(p.name) + '" data-price="' + SIZES['30ml'].now + '" data-size="30ml" data-img="' + p.images[0] + '">Add to Cart</button>' +
        '</div></article>';
    };

    var draw = function () {
      var handles = Object.keys(PRODUCTS).filter(function (h) {
        var p = PRODUCTS[h];
        var matchC = current === 'all' || p.concern === current;
        var matchQ = !query || (p.name + ' ' + p.kicker + ' ' + p.benefit + ' ' + p.chips.join(' ')).toLowerCase().indexOf(query) > -1;
        return matchC && matchQ;
      });
      shopGrid.innerHTML = handles.length ? handles.map(cardHTML).join('') : '';
      $('[data-shop-empty]').style.display = handles.length ? 'none' : '';
      $('[data-shop-count]').textContent = handles.length + (handles.length === 1 ? ' product' : ' products') + (query ? ' for “' + query + '”' : '');
      guardImages(shopGrid);
    };

    $$('[data-filter]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.filter === current);
      btn.addEventListener('click', function () {
        current = btn.dataset.filter;
        $$('[data-filter]').forEach(function (b) { b.classList.toggle('active', b === btn); });
        draw();
      });
    });
    draw();
  }

  /* ---------- Product page (fills from ?p=handle) ---------- */
  var pdp = $('[data-pdp]');
  if (pdp) {
    var handle = new URLSearchParams(location.search).get('p') || 'bhringraj';
    var prod = PRODUCTS[handle] || PRODUCTS.bhringraj;
    if (!PRODUCTS[handle]) handle = 'bhringraj';
    var fill = function (sel, val, html) { $$(sel).forEach(function (el) { if (html) el.innerHTML = val; else el.textContent = val; }); };

    document.title = prod.name + ' — Kehsora';
    fill('[data-p-name]', prod.name);
    fill('[data-p-kicker]', prod.kicker);
    fill('[data-p-desc]', prod.desc);
    fill('[data-p-ingredients]', prod.ingredients);
    fill('[data-p-rating]', prod.rating + ' (' + prod.reviews + ' reviews)');
    fill('[data-p-short]', prod.name.replace(' Hair Oil Concentrate', ''));
    fill('[data-p-chips]', prod.chips.map(function (c) { return '<span class="ingredient-benefit-chip">' + esc(c) + '</span>'; }).join(''), true);

    var main = $('[data-gallery-main]');
    main.src = prod.images[0]; main.alt = prod.name;
    var thumbs = $('[data-thumbs]');
    thumbs.innerHTML = prod.images.map(function (src, i) {
      return '<button class="pdp-thumb' + (i === 0 ? ' active' : '') + '" data-src="' + src + '" aria-label="View image ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join('');
    guardImages(pdp);
    thumbs.addEventListener('click', function (e) {
      var th = e.target.closest('.pdp-thumb'); if (!th) return;
      $$('.pdp-thumb', thumbs).forEach(function (x) { x.classList.remove('active'); });
      th.classList.add('active');
      main.classList.remove('img-missing');
      main.src = th.dataset.src;
    });

    var buttons = $$('[data-pdp-add]');
    var setSize = function (size) {
      var s = SIZES[size];
      fill('[data-price-now]', rupee(s.now));
      fill('[data-price-was]', rupee(s.was));
      buttons.forEach(function (b) {
        b.dataset.handle = handle; b.dataset.name = prod.name; b.dataset.price = s.now; b.dataset.size = size; b.dataset.img = prod.images[0];
      });
    };
    $$('.size-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        $$('.size-opt').forEach(function (o) { o.classList.remove('active'); });
        opt.classList.add('active');
        setSize(opt.dataset.size);
      });
    });
    setSize('30ml');

    var qtyEl = $('[data-pdp-qty]');
    $('[data-pdp-inc]').addEventListener('click', function () { qtyEl.textContent = Math.min(20, (parseInt(qtyEl.textContent, 10) || 1) + 1); });
    $('[data-pdp-dec]').addEventListener('click', function () { qtyEl.textContent = Math.max(1, (parseInt(qtyEl.textContent, 10) || 1) - 1); });

    // "You may also like" — everything except the current product
    $$('[data-related] [data-handle-card]').forEach(function (card) {
      if (card.dataset.handleCard === handle) card.remove();
    });
    var rel = $$('[data-related] [data-handle-card]');
    rel.slice(4).forEach(function (c) { c.remove(); });
  }

  guardImages(document);
  renderCart();
})();
