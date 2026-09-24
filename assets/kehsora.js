/* ==========================================================================
   KEHSORA — Theme Script
   - Cart: Shopify Ajax Cart API (/cart/add.js, /cart/change.js). After every
     change the cart drawer and cart page are re-rendered from Liquid using the
     Section Rendering API, so what you see is always Shopify's real cart.
   - Product: variant picker reads the product's real variants (JSON from Liquid).
   ========================================================================== */
(function () {
  'use strict';

  var config = window.KehsoraConfig || {};
  var routes = config.routes || {};
  var strings = config.strings || {};

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Money (Shopify money_format) ---------- */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var fmt = format || config.moneyFormat || '{{amount}}';
    function withDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number === null) return '0';
      var fixed = (number / 100).toFixed(precision);
      var parts = fixed.split('.');
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      return whole + (parts[1] ? decimal + parts[1] : '');
    }
    var match = fmt.match(placeholder);
    var value = '';
    switch (match ? match[1] : 'amount') {
      case 'amount': value = withDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = withDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = withDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = withDelimiters(cents, 0, '.', ','); break;
      case 'amount_with_apostrophe_separator': value = withDelimiters(cents, 2, "'", '.'); break;
      case 'amount_no_decimals_with_space_separator': value = withDelimiters(cents, 0, ' '); break;
      case 'amount_with_space_separator': value = withDelimiters(cents, 2, ' ', ','); break;
      case 'amount_with_period_and_space_separator': value = withDelimiters(cents, 2, ' ', '.'); break;
      default: value = withDelimiters(cents, 2);
    }
    return fmt.replace(placeholder, value);
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  /* ==========================================================================
     CART
     ========================================================================== */
  function cartSectionIds() {
    return $$('[data-cart-section]').map(function (el) { return el.getAttribute('data-section-id'); });
  }

  function setLoading(on) {
    $$('[data-cart-section]').forEach(function (el) { el.classList.toggle('is-loading', on); });
  }

  function renderSections(sections) {
    if (!sections) return;
    Object.keys(sections).forEach(function (id) {
      var html = sections[id];
      if (!html) return;
      var target = document.getElementById('shopify-section-' + id);
      if (!target) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.getElementById('shopify-section-' + id);
      target.innerHTML = fresh ? fresh.innerHTML : html;
    });
    var drawerRoot = $('[data-cart-item-count]');
    if (drawerRoot) updateCount(parseInt(drawerRoot.getAttribute('data-cart-item-count'), 10) || 0);
  }

  function updateCount(count, bump) {
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('has-items', count > 0);
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
  }

  function postJSON(url, body) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.status) {
          var err = new Error(data.description || data.message || strings.error);
          throw err;
        }
        return data;
      });
    });
  }

  function addToCart(items) {
    setLoading(true);
    return postJSON(routes.cartAdd + '.js', {
      items: items,
      sections: cartSectionIds().join(','),
      sections_url: window.location.pathname
    }).then(function (data) {
      renderSections(data.sections);
      var count = $('[data-cart-item-count]');
      updateCount(count ? parseInt(count.getAttribute('data-cart-item-count'), 10) || 0 : 0, true);
      return data;
    }).finally(function () { setLoading(false); });
  }

  function changeLine(line, quantity) {
    setLoading(true);
    return postJSON(routes.cartChange + '.js', {
      line: line,
      quantity: quantity,
      sections: cartSectionIds().join(','),
      sections_url: window.location.pathname
    }).then(function (cart) {
      renderSections(cart.sections);
      updateCount(cart.item_count);
      return cart;
    }).catch(function (err) {
      toast(err.message || strings.error);
    }).finally(function () { setLoading(false); });
  }

  function isCartPage() { return !!$('[data-cart-page]'); }
  function openCart() {
    document.body.classList.add('cart-open', 'no-scroll');
    var close = $('[data-cart-drawer] [data-cart-close]');
    if (close) setTimeout(function () { close.focus(); }, 50);
  }
  function closeCart() { document.body.classList.remove('cart-open', 'no-scroll'); }

  function afterAdd() {
    if (isCartPage()) { toast(strings.added); return; }
    if (config.cartType === 'page') { window.location.href = routes.cart; return; }
    openCart();
  }

  /* Product forms (product cards + product page) */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-product-form]');
    if (!form) return;
    if (!window.fetch) return; // no JS fallback: normal form post to /cart/add
    e.preventDefault();
    var fd = new FormData(form);
    var id = fd.get('id');
    var qty = parseInt(fd.get('quantity'), 10) || 1;
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.setAttribute('aria-busy', 'true');
    addToCart([{ id: Number(id), quantity: qty }])
      .then(afterAdd)
      .catch(function (err) { toast(err.message || strings.error); })
      .finally(function () { if (btn) btn.removeAttribute('aria-busy'); });
  });

  /* ---------- Click handling ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;

    var buyNow = t.closest('[data-buy-now]');
    if (buyNow) {
      e.preventDefault();
      var form = buyNow.closest('form');
      var fd = new FormData(form);
      buyNow.setAttribute('aria-busy', 'true');
      addToCart([{ id: Number(fd.get('id')), quantity: parseInt(fd.get('quantity'), 10) || 1 }])
        .then(function () { window.location.href = '/checkout'; })
        .catch(function (err) { toast(err.message || strings.error); buyNow.removeAttribute('aria-busy'); });
      return;
    }

    var opener = t.closest('[data-cart-open]');
    if (opener) {
      if (isCartPage()) return; // on /cart the link just reloads the cart page
      e.preventDefault();
      openCart();
      return;
    }
    if (t.closest('[data-cart-close]')) { closeCart(); return; }

    var qtyBtn = t.closest('[data-qty-change]');
    if (qtyBtn) {
      e.preventDefault();
      changeLine(parseInt(qtyBtn.getAttribute('data-line'), 10), Math.max(0, parseInt(qtyBtn.getAttribute('data-qty'), 10)));
      return;
    }
    var remove = t.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      changeLine(parseInt(remove.getAttribute('data-line'), 10), 0);
      return;
    }

    var step = t.closest('[data-qty-step]');
    if (step) {
      var input = step.parentElement.querySelector('input');
      var next = (parseInt(input.value, 10) || 1) + parseInt(step.getAttribute('data-qty-step'), 10);
      input.value = Math.max(parseInt(input.min, 10) || 1, next);
      return;
    }

    if (t.closest('[data-mobile-menu-btn]')) { toggleMobileNav(true); return; }
    if (t.closest('[data-mobile-nav-close]') || t.closest('[data-mobile-nav] a')) { toggleMobileNav(false); }

    if (t.closest('[data-search-open]')) {
      var overlay = $('[data-search]');
      overlay.classList.add('open');
      document.body.classList.add('no-scroll');
      setTimeout(function () { $('input[type="search"]', overlay).focus(); }, 80);
      return;
    }
    if (t.closest('[data-search-close]')) { closeSearch(); return; }

    var tab = t.closest('[data-tabs] .concern-tab[data-target]');
    if (tab) {
      var group = tab.closest('[data-tabs]');
      $$('.concern-tab', group).forEach(function (b) { b.classList.toggle('active', b === tab); b.setAttribute('aria-selected', b === tab ? 'true' : 'false'); });
      $$('.concern-panel', group).forEach(function (p) { p.classList.toggle('active', p.id === tab.getAttribute('data-target')); });
      return;
    }

    var acc = t.closest('.accordion-trigger');
    if (acc) {
      var item = acc.closest('.accordion-item');
      item.classList.toggle('open');
      acc.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
      return;
    }

    var thumb = t.closest('.pdp-thumb');
    if (thumb) { showMedia(thumb); return; }
  });

  /* Typed quantity on the cart page / drawer */
  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-qty-input]');
    if (input) {
      var q = parseInt(input.value, 10);
      changeLine(parseInt(input.getAttribute('data-line'), 10), isNaN(q) ? 0 : Math.max(0, q));
      return;
    }
    var note = e.target.closest('[data-cart-note]');
    if (note && window.fetch) {
      postJSON(routes.cartUpdate + '.js', { note: note.value }).catch(function () {});
    }
  });

  function toggleMobileNav(open) {
    var nav = $('[data-mobile-nav]');
    if (!nav) return;
    nav.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
    var btn = $('[data-mobile-menu-btn]');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeSearch() {
    var s = $('[data-search]');
    if (s) s.classList.remove('open');
    if (!document.body.classList.contains('cart-open')) document.body.classList.remove('no-scroll');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeCart();
    closeSearch();
    toggleMobileNav(false);
  });

  /* ==========================================================================
     PRODUCT PAGE: variants + gallery
     ========================================================================== */
  function showMedia(thumb) {
    var gallery = thumb.closest('.pdp-gallery');
    var main = $('[data-gallery-main]', gallery);
    if (!main) return;
    var img = $('img', main);
    if (!img) {
      main.innerHTML = '';
      img = document.createElement('img');
      main.appendChild(img);
    }
    img.removeAttribute('srcset');
    img.src = thumb.getAttribute('data-src');
    if (thumb.getAttribute('data-srcset')) img.setAttribute('srcset', thumb.getAttribute('data-srcset'));
    img.alt = thumb.getAttribute('data-alt') || '';
    $$('.pdp-thumb', gallery).forEach(function (b) { b.classList.toggle('active', b === thumb); });
  }

  function initProduct(root) {
    var form = $('[data-pdp-form]', root);
    var json = $('[data-variants-json]', root);
    if (!form || !json) return;
    var variants;
    try { variants = JSON.parse(json.textContent); } catch (err) { return; }
    var fieldsets = $$('[data-option-index]', form);
    if (!fieldsets.length) return;

    function selectedOptions() {
      return fieldsets.map(function (fs) {
        var checked = $('input:checked', fs);
        return checked ? checked.value : null;
      });
    }

    function markAvailability() {
      var sel = selectedOptions();
      fieldsets.forEach(function (fs, index) {
        $$('input', fs).forEach(function (input) {
          var test = sel.slice(); test[index] = input.value;
          var match = variants.filter(function (v) {
            return v.options.every(function (o, i) { return o === test[i]; });
          })[0];
          var label = form.querySelector('label[for="' + input.id + '"]');
          if (label) label.classList.toggle('is-unavailable', !match || !match.available);
        });
      });
    }

    function update() {
      var sel = selectedOptions();
      var variant = variants.filter(function (v) {
        return v.options.every(function (o, i) { return o === sel[i]; });
      })[0];
      var addBtn = $('[data-add-button]', form);
      var buyBtn = $('[data-buy-now]', form);
      var idInput = $('[data-variant-id]', form);
      markAvailability();

      if (!variant) {
        if (addBtn) { addBtn.disabled = true; addBtn.textContent = strings.unavailable; }
        if (buyBtn) buyBtn.disabled = true;
        return;
      }
      idInput.value = variant.id;
      if (addBtn) { addBtn.disabled = !variant.available; addBtn.textContent = variant.available ? strings.addToCart : strings.soldOut; }
      if (buyBtn) buyBtn.disabled = !variant.available;

      var priceRow = $('[data-price-row]', root);
      if (priceRow) {
        $('[data-price-now]', priceRow).textContent = formatMoney(variant.price);
        var was = $('[data-price-was]', priceRow);
        var off = $('[data-price-off]', priceRow);
        var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        was.hidden = !onSale;
        off.hidden = !onSale;
        if (onSale) {
          was.textContent = formatMoney(variant.compare_at_price);
          off.textContent = (strings.percentOff || '[percent]% OFF').replace('[percent]', Math.floor((variant.compare_at_price - variant.price) * 100 / variant.compare_at_price));
        }
      }

      if (variant.featured_media) {
        var thumb = $('.pdp-thumb[data-media-id="' + variant.featured_media.id + '"]', root);
        if (thumb) showMedia(thumb);
      }

      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    form.addEventListener('change', function (e) {
      if (e.target.matches('[data-option-input]')) update();
    });
    markAvailability();
  }

  /* ==========================================================================
     GENERAL UI
     ========================================================================== */
  var header = $('[data-header]');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var observer = null;
  function initReveal(scope) {
    var els = $$('.reveal, .reveal-stagger', scope);
    if (!('IntersectionObserver' in window) || (window.Shopify && window.Shopify.designMode)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); observer.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    els.forEach(function (el) { observer.observe(el); });
  }

  function init(scope) {
    initReveal(scope);
    $$('[data-pdp]', scope).forEach(initProduct);
  }
  init(document);

  /* Theme editor support */
  document.addEventListener('shopify:section:load', function (e) { init(e.target); onScroll(); });
  document.addEventListener('shopify:block:select', function (e) {
    var panel = e.target.closest('.concern-panel');
    if (panel) {
      var btn = $('[data-target="' + panel.id + '"]');
      if (btn) btn.click();
    }
    var acc = e.target.closest('.accordion-item');
    if (acc && !acc.classList.contains('open')) acc.classList.add('open');
  });
  document.addEventListener('shopify:section:select', function (e) {
    if (e.target.querySelector('[data-cart-drawer]')) openCart();
  });
  document.addEventListener('shopify:section:deselect', function (e) {
    if (e.target.querySelector('[data-cart-drawer]')) closeCart();
  });

  window.Kehsora = { formatMoney: formatMoney, addToCart: addToCart, changeLine: changeLine, openCart: openCart, closeCart: closeCart };
})();
