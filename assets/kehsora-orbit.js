/* ==========================================================================
   KEHSORA — Product orbit hero
   - Bottles ride an elliptical ring that turns slowly; the gold text on the
     ring scrolls with them. Drag to spin it.
   - Tap a bottle: the others fly out, the chosen bottle travels into the
     centre over its giant name (FLIP animation), details + Add to cart appear.
   - Arrows / dots / keyboard switch products; Back returns to the ring.
   No libraries: requestAnimationFrame + the Web Animations API.
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initOrbit(root) {
    if (!root || root.dataset.orbitReady) return;
    root.dataset.orbitReady = 'true';

    var stage = root.querySelector('[data-orbit-stage]');
    var path = root.querySelector('[data-orbit-path]');
    var band = root.querySelector('[data-orbit-band]');
    var edgeA = root.querySelector('[data-orbit-edge-a]');
    var edgeB = root.querySelector('[data-orbit-edge-b]');
    var textPath = root.querySelector('[data-orbit-textpath]');
    var textEl = textPath ? textPath.parentNode : null;
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-orbit-item]'));
    var spots = Array.prototype.slice.call(root.querySelectorAll('[data-spot]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-orbit-dot]'));
    var n = items.length;
    if (!stage || !n) return;

    var speedSetting = parseFloat(root.getAttribute('data-speed') || '3');
    var speed = reduceMotion ? 0 : speedSetting * 0.00005; // radians per ms
    var angle = 0;
    var velocity = 0;
    var g = {};            // geometry
    var pathLength = 1;
    var running = false;
    var visible = true;
    var current = -1;      // open spotlight index, -1 = ring
    var last = 0;

    /* ---------- geometry ---------- */
    function ellipseD(cx, cy, rx, ry) {
      // starts at the left, runs along the FRONT (bottom) arc left→right, then back over the top
      return 'M ' + (cx - rx) + ' ' + cy +
        ' A ' + rx + ' ' + ry + ' 0 0 0 ' + (cx + rx) + ' ' + cy +
        ' A ' + rx + ' ' + ry + ' 0 0 0 ' + (cx - rx) + ' ' + cy;
    }

    function layout() {
      var W = stage.clientWidth, H = stage.clientHeight;
      var mobile = W < 860;
      g.W = W; g.H = H; g.mobile = mobile;
      g.cx = W / 2;
      g.cy = H * (mobile ? 0.64 : 0.63);
      // phones: a narrower, more tilted ring that sits fully inside the screen,
      // so the back bottles rise clear of the front ones
      g.rx = Math.min(W * (mobile ? 0.39 : 0.41), 660);
      g.ry = g.rx * (mobile ? 0.62 : 0.28);
      g.band = mobile ? Math.max(16, Math.min(g.ry * 0.2, 24)) : Math.max(20, Math.min(g.ry * 0.3, 56));
      g.bw = Math.max(mobile ? 52 : 70, Math.min(g.rx * (mobile ? 0.62 : 0.32), 200));
      // slim cutout bottles: narrower frame, height capped so the front bottle stays on screen
      g.cut = !!root.querySelector('.orbit-item.is-cutout');
      g.ratio = g.cut ? 20 / 9 : 1.5;
      if (g.cut) {
        // the front bottle (scale 1.12) stands on the ring; keep its top below the headline area
        var room = (g.cy + g.ry) - H * (mobile ? 0.3 : 0.33);
        g.bw = Math.max(mobile ? 48 : 56, Math.min(g.bw * 0.92, room / (g.ratio * 1.12)));
      }
      stage.style.setProperty('--bottle-w', g.bw + 'px');

      // Fade out the back of the ring (its text would read upside down)
      var ringEl = root.querySelector('[data-orbit-ring]');
      var fadeStart = Math.max(0, (g.cy - g.ry - g.band) / H * 100);
      var fadeEnd = Math.min(100, (g.cy + g.ry * 0.15) / H * 100);
      var mask = 'linear-gradient(to bottom, transparent ' + fadeStart.toFixed(1) + '%, rgba(0,0,0,.15) ' + ((fadeStart + fadeEnd) / 2).toFixed(1) + '%, #000 ' + fadeEnd.toFixed(1) + '%)';
      ringEl.style.webkitMaskImage = mask;
      ringEl.style.maskImage = mask;

      var d = ellipseD(g.cx, g.cy, g.rx, g.ry);
      path.setAttribute('d', d);
      band.setAttribute('d', d);
      band.style.strokeWidth = g.band + 'px';
      edgeA.setAttribute('d', ellipseD(g.cx, g.cy, g.rx + g.band / 2, g.ry + g.band / 2));
      edgeB.setAttribute('d', ellipseD(g.cx, g.cy, Math.max(1, g.rx - g.band / 2), Math.max(1, g.ry - g.band / 2)));

      // Fill the ring with enough repeats of the text to cover twice its length
      pathLength = path.getTotalLength ? path.getTotalLength() : TAU * g.rx;
      if (textEl && textPath) {
        textEl.style.fontSize = (mobile ? Math.max(9, Math.round(g.band * 0.44)) : Math.max(11, Math.round(g.band * 0.36))) + 'px';
        var base = textPath.getAttribute('data-text') || '';
        textPath.textContent = base;
        var unit = textPath.getComputedTextLength ? textPath.getComputedTextLength() : base.length * 10;
        var repeats = unit > 0 ? Math.ceil((pathLength * 2) / unit) + 1 : 1;
        textPath.textContent = new Array(repeats + 1).join(base);
      }
      render();
    }

    /* ---------- per-frame placement ---------- */
    function itemPose(i) {
      var t = (i / n) * TAU + Math.PI / 2 - angle; // item 0 starts at the front
      var depth = (Math.sin(t) + 1) / 2;           // 1 = front (bottom of ring)
      var x = g.cx + g.rx * Math.cos(t);
      var y = g.cy + g.ry * Math.sin(t);
      // phones: back bottles shrink further so the front one reads as the hero
      var scale = g.mobile ? 0.4 + 0.72 * depth : 0.5 + 0.62 * depth;
      var tilt = Math.cos(t) * (g.mobile ? -9 : -16) + Math.sin(t * 2 + i) * (g.mobile ? 2 : 4);
      return { x: x, y: y, depth: depth, scale: scale, tilt: tilt };
    }

    function transformFor(p, extraX, extraY) {
      var h = g.bw * g.ratio;
      return 'translate(' + (p.x - g.bw / 2 + (extraX || 0)) + 'px,' + (p.y - h * 0.94 + (extraY || 0)) + 'px) rotate(' + p.tilt.toFixed(2) + 'deg) scale(' + p.scale.toFixed(3) + ')';
    }

    function render() {
      if (!g.W) return;
      for (var i = 0; i < n; i++) {
        if (current > -1) break;
        var p = itemPose(i);
        var el = items[i];
        el.style.transform = transformFor(p);
        el.style.zIndex = String(Math.round(p.depth * 100));
        el.style.opacity = (g.mobile ? 0.25 + 0.75 * Math.pow(p.depth, 1.4) : 0.5 + 0.5 * p.depth).toFixed(3);
        el.style.filter = 'brightness(' + ((g.mobile ? 0.45 : 0.55) + (g.mobile ? 0.55 : 0.45) * p.depth).toFixed(3) + ')';
      }
      if (textPath) {
        var phase = ((angle / TAU) * pathLength) % pathLength;
        if (phase < 0) phase += pathLength;
        textPath.setAttribute('startOffset', (phase - pathLength).toFixed(1));
      }
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min(64, now - (last || now));
      last = now;
      if (!dragging) {
        angle += speed * dt + velocity * dt;
        velocity *= Math.pow(0.94, dt / 16);
        if (Math.abs(velocity) < 0.00001) velocity = 0;
      }
      render();
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || current > -1 || !visible) return;
      running = true; last = 0;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    /* ---------- drag to spin ---------- */
    var dragging = false, dragX = 0, dragMoved = 0, lastMoveT = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (current > -1 || e.button !== 0) return;
      dragging = true; dragMoved = 0; dragX = e.clientX; lastMoveT = performance.now(); velocity = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX;
      dragX = e.clientX;
      dragMoved += Math.abs(dx);
      if (dragMoved > 6) root.classList.add('is-dragging');
      var now = performance.now();
      var delta = -dx * 0.0055;
      angle += delta;
      velocity = delta / Math.max(8, now - lastMoveT);
      lastMoveT = now;
      if (!running) render();
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      setTimeout(function () { root.classList.remove('is-dragging'); }, 0);
    });

    /* ---------- spotlight ---------- */
    function setDots(i) { dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); }); }
    function spotFor(i) { return spots[i]; }

    function open(i) {
      if (i === current) return;
      if (current > -1) { swap(i); return; }
      stop();
      // where the bottle is on the ring right now (for the FLIP)
      var item = items[i];
      var from = item.querySelector('.orbit-item-img').getBoundingClientRect();
      var pose = itemPose(i);
      current = i;
      root.classList.add('is-spot');

      // everyone else flies outward
      items.forEach(function (el, k) {
        var p = itemPose(k);
        var dx = (p.x - g.cx), dy = (p.y - g.cy) - g.ry;
        var len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        var push = Math.max(g.W, g.H) * 0.75;
        el.style.transition = reduceMotion ? 'none' : 'transform .85s cubic-bezier(.5,0,.2,1), opacity .6s ease';
        el.style.pointerEvents = 'none';
        if (k === i) { el.style.opacity = '0'; el.style.transition = 'none'; return; }
        el.style.transform = transformFor(p, dx / len * push, dy / len * push - 80);
        el.style.opacity = '0';
      });

      var spot = spotFor(i);
      spot.classList.add('is-active');
      spot.setAttribute('aria-hidden', 'false');
      setDots(i);
      var bottle = spot.querySelector('[data-spot-bottle]');
      if (bottle && bottle.animate && !reduceMotion) {
        var to = bottle.getBoundingClientRect();
        var sx = from.width / Math.max(1, to.width);
        var dx2 = (from.left + from.width / 2) - (to.left + to.width / 2);
        var dy2 = (from.top + from.height / 2) - (to.top + to.height / 2);
        bottle.animate([
          { transform: 'translate(' + dx2 + 'px,' + dy2 + 'px) rotate(' + pose.tilt + 'deg) scale(' + sx + ')', opacity: 1 },
          { transform: 'translate(0,-6vh) rotate(-16deg) scale(1.04)', opacity: 1, offset: 0.65 },
          { transform: 'translate(0,0) rotate(-9deg) scale(1)', opacity: 1 }
        ], { duration: 1100, easing: 'cubic-bezier(.22,.8,.24,1)' });
      }
      var focusTarget = spot.querySelector('button[type="submit"], a');
      if (focusTarget) setTimeout(function () { focusTarget.focus({ preventScroll: true }); }, 700);
    }

    // Next / previous: the current bottle disappears where it stands (it never
    // slides sideways), then the next one drops in from the top.
    var swapTimers = [];
    function swap(i) {
      var n2 = spots.length;
      i = ((i % n2) + n2) % n2;
      if (i === current) return;
      // a quick second tap finishes the running swap first
      swapTimers.forEach(clearTimeout); swapTimers = [];
      spots.forEach(function (s, k) {
        s.classList.remove('is-leaving', 'is-dropping');
        if (k !== current) s.classList.remove('is-active');
      });
      var prev = spotFor(current);
      var next = spotFor(i);
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true');
      current = i;
      setDots(i);
      swapTimers.push(setTimeout(function () {
        prev.classList.remove('is-active', 'is-leaving');
        next.classList.add('is-active', 'is-dropping');
        next.setAttribute('aria-hidden', 'false');
      }, reduceMotion ? 0 : 140));
      swapTimers.push(setTimeout(function () {
        next.classList.remove('is-dropping');
      }, reduceMotion ? 0 : 1150));
    }

    function close() {
      if (current < 0) return;
      swapTimers.forEach(clearTimeout); swapTimers = [];
      spots.forEach(function (s, k) { if (k !== current) s.classList.remove('is-active'); s.classList.remove('is-leaving', 'is-dropping'); });
      var spot = spotFor(current);
      spot.classList.add('is-leaving');
      spot.setAttribute('aria-hidden', 'true');
      var back = current;
      current = -1;
      setTimeout(function () {
        spot.classList.remove('is-active', 'is-leaving');
        root.classList.remove('is-spot');
        // bottles glide back onto the ring
        items.forEach(function (el, k) {
          var p = itemPose(k);
          el.style.transition = reduceMotion ? 'none' : 'transform .9s cubic-bezier(.22,.8,.24,1), opacity .7s ease';
          el.style.transform = transformFor(p);
          el.style.opacity = (0.5 + 0.5 * p.depth).toFixed(3);
          el.style.pointerEvents = '';
        });
        setTimeout(function () {
          items.forEach(function (el) { el.style.transition = ''; });
          start();
          if (items[back]) items[back].focus({ preventScroll: true });
        }, reduceMotion ? 0 : 950);
      }, reduceMotion ? 0 : 350);
    }

    items.forEach(function (el, i) {
      el.addEventListener('click', function (e) {
        if (root.classList.contains('is-dragging')) { e.preventDefault(); return; }
        open(i);
      });
    });
    var backBtn = root.querySelector('[data-orbit-back]');
    if (backBtn) backBtn.addEventListener('click', close);
    var prevBtn = root.querySelector('[data-orbit-prev]');
    var nextBtn = root.querySelector('[data-orbit-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { swap(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { swap(current + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { swap(k); }); });

    root.addEventListener('keydown', function (e) {
      if (current < 0) return;
      // Let Escape close only the top layer: if the cart drawer or search is open, leave the spotlight alone
      if (document.body.classList.contains('cart-open') || document.querySelector('[data-search].open')) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowRight') { swap(current + 1); }
      else if (e.key === 'ArrowLeft') { swap(current - 1); }
    });

    // Size buttons in the spotlight update the price shown beside the bottle
    root.addEventListener('change', function (e) {
      var r = e.target;
      if (!r.matches('.spot-sizes input[type="radio"]')) return;
      var spot = r.closest('[data-spot]');
      var price = spot.querySelector('[data-spot-price]');
      var size = spot.querySelector('[data-spot-size]');
      if (price) price.textContent = r.getAttribute('data-price');
      if (size) size.textContent = r.getAttribute('data-title');
    });

    /* ---------- lifecycle ---------- */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    layout();
    start();

    root.orbit = { open: open, close: close, swap: swap };
  }

  function initAll(scope) {
    Array.prototype.slice.call((scope || document).querySelectorAll('[data-orbit]')).forEach(initOrbit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();

  // Theme editor: re-init on section reload, open the block being edited
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
  document.addEventListener('shopify:block:select', function (e) {
    var root = e.target.closest('[data-orbit]');
    if (!root || !root.orbit) return;
    var idx = parseInt(e.target.getAttribute('data-index'), 10);
    if (!isNaN(idx) && e.target.matches('[data-orbit-item]')) root.orbit.open(idx);
  });
})();
