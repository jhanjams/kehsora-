/* ==========================================================================
   KEHSORA — Combo builder
   Shoppers choose N concentrates; the combo product is added to the cart with
   the picks as line item properties, so they show in the cart, at checkout
   and on the order ("Concentrate 1: Rosemary Hair Oil Concentrate" …).
   Works with the theme cart drawer (window.Kehsora) when present.
   ========================================================================== */
(function () {
  'use strict';

  function formatMoney(cents, format) {
    if (window.Kehsora && window.Kehsora.formatMoney) return window.Kehsora.formatMoney(cents, format);
    var amount = (Number(cents) / 100).toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    return (format || '{{amount}}').replace(/\{\{\s*\w+\s*\}\}/, amount);
  }

  function initCombo(root) {
    if (!root || root.dataset.comboReady) return;
    root.dataset.comboReady = 'true';

    var configEl = root.parentElement.querySelector('[data-combo-config]') || document.querySelector('[data-combo-config]');
    var config = {};
    try { config = JSON.parse(configEl.textContent); } catch (e) { config = {}; }

    var form = root.querySelector('[data-combo-form]');
    var list = root.querySelector('[data-combo-choices]');
    if (!form || !list) return;
    var pick = parseInt(list.getAttribute('data-pick'), 10) || 0;
    var allIncluded = list.getAttribute('data-all') === 'true';
    var choices = Array.prototype.slice.call(list.querySelectorAll('[data-combo-choice]'));
    var included = Array.prototype.slice.call(root.querySelectorAll('[data-combo-included]'));
    var addBtn = form.querySelector('[data-combo-add]');
    var buyBtn = form.querySelector('[data-combo-buy]');
    var counter = root.querySelector('[data-combo-selected]');
    var savings = root.querySelector('[data-combo-savings]');
    var available = addBtn && addBtn.getAttribute('data-available') === 'true';
    // The combo's own Shopify price (cents), rendered by Liquid
    var priceEl = root.querySelector('[data-combo-price]');
    var comboPrice = priceEl ? parseInt(priceEl.getAttribute('data-combo-price'), 10) || 0 : 0;

    var selected = choices.filter(function (c) { return c.classList.contains('is-selected'); });

    function render() {
      choices.forEach(function (c) {
        var on = selected.indexOf(c) > -1;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      list.classList.toggle('is-full', !allIncluded && selected.length >= pick);
      if (counter) counter.textContent = selected.length;

      var remaining = pick - selected.length;
      var ready = remaining === 0 && pick > 0;
      if (addBtn) {
        if (!available) {
          addBtn.disabled = true;
          addBtn.textContent = addBtn.getAttribute('data-label-soldout');
        } else {
          addBtn.disabled = !ready;
          addBtn.textContent = ready
            ? addBtn.getAttribute('data-label-add')
            : (addBtn.getAttribute('data-label-more') || '').replace('[count]', remaining);
        }
      }
      if (buyBtn) buyBtn.disabled = !(ready && available);

      // "Worth ₹X separately — you save ₹Y" (only when it's actually a saving)
      if (savings) {
        var worth = selected.concat(included).reduce(function (sum, el) {
          return sum + (parseInt(el.getAttribute('data-value'), 10) || 0);
        }, 0);
        var save = worth - comboPrice;
        if (ready && comboPrice > 0 && save > 0 && config.savingsText) {
          savings.textContent = config.savingsText
            .replace('[worth]', formatMoney(worth, config.moneyFormat))
            .replace('[save]', formatMoney(save, config.moneyFormat));
          savings.hidden = false;
        } else {
          savings.hidden = true;
        }
      }
    }

    list.addEventListener('click', function (e) {
      var c = e.target.closest('[data-combo-choice]');
      if (!c || c.disabled || allIncluded) return;
      var i = selected.indexOf(c);
      if (i > -1) {
        selected.splice(i, 1);
      } else if (selected.length < pick) {
        selected.push(c);
      } else {
        c.classList.remove('combo-shake'); void c.offsetWidth; c.classList.add('combo-shake');
        return;
      }
      render();
    });

    function properties() {
      var props = {};
      var label = config.propertyLabel || 'Concentrate';
      selected.forEach(function (c, i) { props[label + ' ' + (i + 1)] = c.getAttribute('data-title'); });
      if (included.length) {
        props[config.includesLabel || 'Includes'] = included.map(function (c) { return c.getAttribute('data-title'); }).join(', ');
      }
      return props;
    }

    function add() {
      var fd = new FormData(form);
      var item = { id: Number(fd.get('id')), quantity: parseInt(fd.get('quantity'), 10) || 1, properties: properties() };
      if (window.Kehsora && window.Kehsora.addToCart) return window.Kehsora.addToCart([item]);
      return fetch((window.KehsoraConfig && window.KehsoraConfig.routes.cartAdd || '/cart/add') + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: [item] })
      }).then(function (r) {
        return r.json().then(function (d) { if (!r.ok || d.status) throw new Error(d.description || d.message); return d; });
      });
    }

    function showError(err) {
      var toast = document.querySelector('[data-toast]');
      if (toast) {
        toast.textContent = (err && err.message) || 'Something went wrong. Please try again.';
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 3000);
      } else {
        window.alert((err && err.message) || 'Something went wrong.');
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (selected.length !== pick) return;
      addBtn.setAttribute('aria-busy', 'true');
      add().then(function () {
        var cfg = window.KehsoraConfig || {};
        if (cfg.cartType === 'page' || !(window.Kehsora && window.Kehsora.openCart)) {
          window.location.href = (cfg.routes && cfg.routes.cart) || '/cart';
        } else {
          window.Kehsora.openCart();
        }
      }).catch(showError).finally(function () { addBtn.removeAttribute('aria-busy'); });
    });

    if (buyBtn) {
      buyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (selected.length !== pick) return;
        buyBtn.setAttribute('aria-busy', 'true');
        add().then(function () { window.location.href = '/checkout'; })
          .catch(function (err) { buyBtn.removeAttribute('aria-busy'); showError(err); });
      });
    }

    render();
  }

  function initAll(scope) {
    Array.prototype.slice.call((scope || document).querySelectorAll('[data-combo]')).forEach(initCombo);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
