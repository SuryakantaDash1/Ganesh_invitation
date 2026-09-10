/* ===========================================================
   Ganesh Chaturthi Invitation — scroll choreography
   Ported from the DCLogic component in
   "Ganesh Chaturthi Invitation.dc.html" (Claude Design).
   =========================================================== */
(function () {
  'use strict';

  /* --- Configuration -------------------------------------- */
  var CONFIG = {
    mapsUrl: 'https://maps.app.goo.gl/QvQeZroV7sdXSjsD8?g_st=ac',
    showPetals: true
  };

  /* --- Element lookup ------------------------------------- */
  var el = {};
  ['heroVideo', 'heroText', 'sec2', 'sec3', 'garlandL', 'garlandR',
   'bell1', 'bell2', 'bell3', 'bell4', 'diyaL', 'diyaR',
   'invite', 'guestLine', 'card', 'cardRegion', 'mouse', 'bubble',
   'petals', 'mapBtn', 'frame', 'generator',
   'genTitle', 'genName', 'genPreview', 'genBtn', 'genResult',
   'genLinkOut', 'genCopyBtn', 'genPreviewLink'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  /* --- Easing helpers ------------------------------------- */
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* Progress 0..1 of a sticky scene.
     0 when the section's top edge first crosses the bottom of the viewport,
     1 once the sticky stage has been scrolled all the way through. Counting
     the entry phase means the choreography is already running as the scene
     slides into view, rather than waiting for the stage to pin. */
  function sceneProgress(node, viewportH) {
    var r = node.getBoundingClientRect();
    return clamp01((viewportH - r.top) / Math.max(1, r.height));
  }

  /* --- Per-frame choreography ----------------------------- */
  /* Thresholds are tuned against the progress above: with a 180svh scene the
     stage pins at about p = 0.55, so the decor lands as it settles and the
     copy resolves just after, leaving a still hold before the scene exits. */
  var BELLS = [
    ['bell1', 0.04, 0.30, -150],
    ['bell2', 0.08, 0.36, -190],
    ['bell3', 0.11, 0.40, -190],
    ['bell4', 0.15, 0.46, -150]
  ];

  function frame() {
    var vh = window.innerHeight;

    /* --- Scene 02: garland, bells, lamps, invitation copy --- */
    if (el.sec2) {
      var p = sceneProgress(el.sec2, vh);

      /* Each garland half sweeps in from the edge it hangs against. */
      var g = easeOut(seg(p, 0, 0.26));
      if (el.garlandL) {
        el.garlandL.style.transform = 'translate3d(' + (-110 * (1 - g)) + '%,0,0)';
      }
      if (el.garlandR) {
        el.garlandR.style.transform = 'translate3d(' + (110 * (1 - g)) + '%,0,0)';
      }

      BELLS.forEach(function (spec) {
        var node = el[spec[0]];
        if (!node) return;
        var t = easeOut(seg(p, spec[1], spec[2]));
        node.style.transform = 'translate3d(0,' + (spec[3] * (1 - t)) + '%,0)';
      });

      var d = easeOut(seg(p, 0.26, 0.54));
      if (el.diyaL) {
        el.diyaL.style.transform = 'translate3d(' + (-130 * (1 - d)) + '%,0,0)';
      }
      if (el.diyaR) {
        el.diyaR.style.transform = 'translate3d(' + (130 * (1 - d)) + '%,0,0) scaleX(-1)';
      }

      var i = seg(p, 0.44, 0.70);
      if (el.invite) {
        el.invite.style.opacity = i;
        el.invite.style.transform =
          'translate3d(0,' + (26 * (1 - easeOut(i))) + 'px,0) scale(' + (0.96 + 0.04 * i) + ')';
      }
    }

    /* --- Scene 03: details card, mushak, speech bubble ------ */
    if (el.sec3) {
      var p3 = sceneProgress(el.sec3, vh);

      var c = seg(p3, 0.10, 0.42);
      if (el.card) {
        /* Shrink the card if it would overflow its region on short screens. */
        var s = 1;
        if (el.cardRegion && el.card.scrollHeight) {
          s = Math.max(0.7, Math.min(1, (el.cardRegion.clientHeight - 10) / el.card.scrollHeight));
        }
        el.card.style.opacity = c;
        el.card.style.transform =
          'translate3d(0,' + (30 * (1 - easeOut(c))) + 'px,0) scale(' + s + ')';
      }

      var m = easeOut(seg(p3, 0.22, 0.58));
      if (el.mouse) {
        el.mouse.style.transform = 'translate3d(' + (135 * (1 - m)) + '%,0,0)';
      }
      if (el.bubble) {
        el.bubble.style.opacity = seg(p3, 0.58, 0.74);
      }
    }

    /* --- Scene 01: hero copy fades on first scroll ---------- */
    if (el.heroText) {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      el.heroText.style.opacity = Math.max(0, 1 - y / (vh * 0.45));
    }
  }

  /* --- Render loop ---------------------------------------- */
  var rafId = null;
  var beatId = null;
  var looping = false;

  function loop() {
    frame();
    if (document.hidden) { looping = false; return; }
    looping = true;
    rafId = requestAnimationFrame(loop);
  }

  /* Safari/iOS can silently drop autoplay; nudge the video back. */
  function kickVideo() {
    var v = el.heroVideo;
    if (!v || !v.paused) return;
    v.muted = true;
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () {});
  }

  function tick() {
    frame();
    kickVideo();
  }

  /* --- Interactions --------------------------------------- */
  function openMap() {
    window.open(CONFIG.mapsUrl, '_blank', 'noopener');
  }

  /* --- Personalization -------------------------------------
     A per-guest link (built on generate.html) carries the recipient's
     name as ?to=Mrs.%20Priya%20Sharma. When present, "Dear <name>,"
     is spelled out letter by letter the first time it scrolls into
     view. No parameter, no line — the invite reads exactly as before. */
  function initGuestLine() {
    var node = el.guestLine;
    if (!node) return;
    var raw = new URLSearchParams(window.location.search).get('to');
    if (!raw) return;
    raw = raw.trim();
    if (!raw) return;

    var text = 'Dear ' + raw + ',';
    node.textContent = '';
    text.split('').forEach(function (ch, idx) {
      var span = document.createElement('span');
      span.className = 'invite__guest-char';
      span.style.transitionDelay = (idx * 26) + 'ms';
      span.textContent = ch === ' ' ? ' ' : ch;
      node.appendChild(span);
    });
    node.hidden = false;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          node.classList.add('is-revealed');
          observer.disconnect();
        });
      }, { threshold: 0.5 });
      observer.observe(node);
    } else {
      node.classList.add('is-revealed');
    }
  }

  /* --- Generator route --------------------------------------
     /invite (rewritten to this same page by vercel.json) or the
     #generate hash (works with no server rewrite, e.g. local dev)
     swaps the whole invitation out for a small tool that builds a
     personalized guest link pointing back at the site root.
     Never linked from the invitation itself. */
  function isGeneratorRoute() {
    if (window.location.hash === '#generate') return true;
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    return path === '/invite';
  }

  function baseInviteUrl() {
    return window.location.origin + '/';
  }

  function composedGuestName() {
    var t = el.genTitle ? el.genTitle.value.trim() : '';
    var n = el.genName ? el.genName.value.trim() : '';
    if (!n) return '';
    return t ? (t + ' ' + n) : n;
  }

  function updateGenPreview() {
    if (!el.genPreview) return;
    var c = composedGuestName();
    el.genPreview.textContent = c ? ('Dear ' + c + ',') : 'Dear …,';
  }

  function generateGuestLink() {
    var c = composedGuestName();
    if (!c) {
      if (el.genName) el.genName.focus();
      return;
    }
    var url = baseInviteUrl() + '?to=' + encodeURIComponent(c);
    if (el.genLinkOut) el.genLinkOut.value = url;
    if (el.genPreviewLink) el.genPreviewLink.href = url;
    if (el.genResult) el.genResult.classList.add('is-visible');
    if (el.genCopyBtn) {
      el.genCopyBtn.textContent = 'Copy';
      el.genCopyBtn.classList.remove('is-done');
    }
  }

  function copyGuestLink() {
    if (!el.genLinkOut) return;
    var text = el.genLinkOut.value;
    if (!text) return;
    function done() {
      if (!el.genCopyBtn) return;
      el.genCopyBtn.textContent = 'Copied!';
      el.genCopyBtn.classList.add('is-done');
      setTimeout(function () {
        el.genCopyBtn.textContent = 'Copy';
        el.genCopyBtn.classList.remove('is-done');
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        el.genLinkOut.select();
        document.execCommand('copy');
        done();
      });
    } else {
      el.genLinkOut.select();
      document.execCommand('copy');
      done();
    }
  }

  function startGenerator() {
    if (el.frame) el.frame.hidden = true;
    if (el.generator) el.generator.hidden = false;

    if (el.genTitle) el.genTitle.addEventListener('change', updateGenPreview);
    if (el.genName) {
      el.genName.addEventListener('input', updateGenPreview);
      el.genName.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') generateGuestLink();
      });
    }
    if (el.genBtn) el.genBtn.addEventListener('click', generateGuestLink);
    if (el.genCopyBtn) el.genCopyBtn.addEventListener('click', copyGuestLink);

    updateGenPreview();
  }

  /* --- Boot ----------------------------------------------- */
  function start() {
    if (isGeneratorRoute()) {
      startGenerator();
      return;
    }

    if (el.petals) el.petals.hidden = !CONFIG.showPetals;
    if (el.mapBtn) el.mapBtn.addEventListener('click', openMap);
    initGuestLine();

    document.addEventListener('scroll', tick, { passive: true, capture: true });
    window.addEventListener('resize', tick);
    document.addEventListener('visibilitychange', function () {
      tick();
      if (!looping) loop();
    });

    beatId = setInterval(tick, 100);
    loop();
  }

  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(rafId);
    clearInterval(beatId);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
