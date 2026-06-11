/* ==========================================================================
   BABEL BRIDGE — THE PRISM (prism.js) · shell.js companion, no build step
   Include after shell.js:  <script src="assets/prism.js"></script>

   Canonical spectrum (LOCKED by Tim): plain (⚪ white light, default) ·
   barstool (🔴) · timbit (🟡) · boardroom (🔵) · swiss (⬜).
   picture (🟢) is RESERVED for v2 — shown as a disabled chip, never built.

   Authoring (declarative, scanned on DOMContentLoaded + Prism.scan(root)):
     <p data-prism-id="doc-8020">…</p>              → resolves data/spectra.json
     <p data-prism='{"barstool":"…","timbit":"…"}'>…</p>  → inline block
   No spectrum = no icon, no placeholder (graceful absence — an icon that
   opens an empty drawer is theatre).

   Block schema: { plain?, barstool?, timbit?, boardroom?, swiss?, locked?, meta? }
   plain defaults to the element's own text — white light, what was composed.
   locked:true = verbatim-locked canon: the Plain tab shows the sacred line
   untouched; every other color is a FRAMING expansion — the quote is never
   re-voiced, rewritten, or compressed.

   Voice: opens at the global `hb1000-voice` (5-value enum; legacy 'tim'
   reads as 'plain'); chips switch locally per prism — the global key is
   never written from here. Listens to 'hb-voice-change'.
   All spectra are pre-authored seed data — nothing is ever generated
   client-side, and nothing here sends anything anywhere.
   ========================================================================== */
(function () {
  'use strict';

  var VOICE_KEY = 'hb1000-voice';
  var VOICES = ['plain', 'barstool', 'timbit', 'boardroom', 'swiss'];
  var ORDER  = ['plain', 'boardroom', 'swiss', 'barstool', 'timbit']; /* compression order */
  var META = {
    plain:     { dot: '⚪', label: 'Plain',     tip: 'White light — the message as composed (default). a.k.a. Plain English' },
    boardroom: { dot: '🔵', label: 'Boardroom', tip: 'a.k.a. Formal · Culture Agent · Wisdom-Giant · Statesman' },
    swiss:     { dot: '⬜', label: 'Swiss',     tip: 'a.k.a. Swiss Protocol · Architect · Scientist — institutional precision' },
    barstool:  { dot: '🔴', label: 'Barstool',  tip: 'a.k.a. Raw Tim · Street — blunt, with care' },
    timbit:    { dot: '🟡', label: 'Timbit',    tip: 'the compressed bite — a.k.a. the Cliché, its attached anchor' },
    picture:   { dot: '🟢', label: 'Picture',   tip: 'reserved (v2) — the visual channel. Not built yet, on purpose.' }
  };
  var GLYPH = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 3 L22 20 L2 20 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M12 10 L12 16" stroke="currentColor" stroke-width="1.6"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function voiceGet() {
    try {
      var v = localStorage.getItem(VOICE_KEY);
      if (v === 'tim') v = 'plain'; /* legacy 2-value pilot migrates on read */
      return VOICES.indexOf(v) >= 0 ? v : 'plain';
    } catch (e) { return 'plain'; }
  }
  function colorsOf(block) {
    return ORDER.filter(function (c) { return block && typeof block[c] === 'string' && block[c].length; });
  }

  /* ---------------- spectra registry (data/spectra.json, loaded once) ---------------- */
  var spectraP = null;
  function loadSpectra() {
    if (!spectraP) {
      spectraP = fetch('data/spectra.json?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('spectra.json HTTP ' + r.status); return r.json(); })
        .then(function (j) { return (j && j.spectra) || {}; })
        .catch(function () { return {}; }); /* graceful absence on file:// etc. */
    }
    return spectraP;
  }

  /* ---------------- the popover / bottom sheet (singleton) ---------------- */
  var pop = null, popBlock = null, popId = null, popCur = 'plain', popLocal = false,
      popAnchor = null, prevFocus = null;

  function viralHref() { return 'prism.html' + (popId ? '?id=' + encodeURIComponent(popId) : ''); }

  function buildPop() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'prism-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', 'Babel prism — read this in another voice');
    pop.hidden = true;
    pop.innerHTML =
      '<div class="pp-head"><span class="pp-glyph" aria-hidden="true">' + GLYPH + '</span>' +
        '<b>Babel prism</b><span class="pp-lock" hidden title="Verbatim-locked canon — the quote is never re-voiced">🔒 verbatim canon</span>' +
        '<button type="button" class="pp-x" aria-label="Close the prism">✕</button></div>' +
      '<div class="pp-chips" role="group" aria-label="Registers"></div>' +
      '<div class="pp-note" hidden></div>' +
      '<div class="pp-body"></div>' +
      '<div class="pp-actions"><button type="button" class="btn pp-copy">Copy this rendering</button><span class="pp-copied" hidden>copied ✓</span></div>' +
      '<div class="pp-foot">Same facts. Different register.' +
        '<a class="pp-viral" href="prism.html">Rendered by Babel Bridge — get your own prism →</a></div>';
    document.body.appendChild(pop);

    pop.querySelector('.pp-x').addEventListener('click', closePop);
    pop.querySelector('.pp-copy').addEventListener('click', function () {
      var txt = (popBlock && popBlock[popCur]) || '';
      var tail = '\n\n— ' + META[popCur].label + ' rendering · Same facts. Different register.' +
                 '\nRendered by Babel Bridge — get your own prism → ' + viralHref();
      var done = function () {
        var ok = pop.querySelector('.pp-copied');
        ok.hidden = false; setTimeout(function () { ok.hidden = true; }, 1400);
      };
      try { navigator.clipboard.writeText(txt + tail).then(done, done); } catch (e) { done(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (!pop || pop.hidden) return;
      if (ev.key === 'Escape') { closePop(); return; }
      if (ev.key !== 'Tab') return;
      /* focus trap */
      var f = pop.querySelectorAll('button, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', function (ev) {
      if (pop && !pop.hidden && !pop.contains(ev.target) &&
          !(ev.target.closest && ev.target.closest('.prism-glyph'))) closePop();
    });
    document.addEventListener('hb-voice-change', function (ev) {
      /* prisms follow the ambient voice unless the reader picked a chip here */
      if (pop && !pop.hidden && !popLocal && ev.detail) {
        var v = ev.detail.voice;
        if (popBlock && popBlock[v]) { popCur = v; renderPop(); }
      }
    });
    window.addEventListener('resize', function () { if (pop && !pop.hidden) place(); });
    return pop;
  }

  function renderPop() {
    var colors = colorsOf(popBlock);
    var chips = pop.querySelector('.pp-chips');
    chips.innerHTML = colors.map(function (c) {
      var m = META[c];
      return '<button type="button" class="pp-chip" role="button" data-color="' + c + '" title="' + esc(m.tip) + '"' +
        ' aria-pressed="' + (c === popCur ? 'true' : 'false') + '">' + m.dot + ' ' + m.label + '</button>';
    }).join('') +
      '<button type="button" class="pp-chip" disabled title="' + esc(META.picture.tip) + '">' +
        META.picture.dot + ' ' + META.picture.label + '</button>';
    Array.prototype.forEach.call(chips.querySelectorAll('.pp-chip[data-color]'), function (b) {
      b.addEventListener('click', function () {
        popCur = b.getAttribute('data-color');
        popLocal = true; /* local override only — never writes hb1000-voice */
        renderPop();
      });
    });

    var note = pop.querySelector('.pp-note');
    pop.querySelector('.pp-lock').hidden = !popBlock.locked;
    if (popBlock.locked) {
      note.hidden = false;
      note.textContent = (popCur === 'plain')
        ? 'Verbatim-locked canon — shown untouched.'
        : 'Framing expansion (' + META[popCur].label + ') — the verbatim line inside never changes.';
    } else { note.hidden = true; note.textContent = ''; }

    pop.querySelector('.pp-body').textContent = popBlock[popCur] || '';
    pop.querySelector('.pp-viral').setAttribute('href', viralHref());
  }

  function place() {
    if (window.matchMedia && window.matchMedia('(max-width:700px)').matches) {
      pop.classList.add('sheet'); pop.style.left = pop.style.top = ''; return;
    }
    pop.classList.remove('sheet');
    var r = popAnchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.max(8, Math.min(r.left - 12, window.innerWidth - w - 8));
    var top = (r.bottom + 8 + h <= window.innerHeight) ? r.bottom + 8 : Math.max(8, r.top - h - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }

  function openPop(anchor, block, id) {
    buildPop();
    popAnchor = anchor; popBlock = block; popId = id || null; popLocal = false;
    var v = voiceGet();
    popCur = (typeof block[v] === 'string' && block[v].length) ? v : 'plain';
    prevFocus = document.activeElement;
    pop.hidden = false;
    renderPop(); place();
    pop.querySelector('.pp-x').focus();
  }
  function closePop() {
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }

  /* ---------------- icon attachment ---------------- */
  function attach(el, block, id) {
    if (!el || el.__hbPrism || !block) return;
    var b = {};
    for (var k in block) if (Object.prototype.hasOwnProperty.call(block, k)) b[k] = block[k];
    if (typeof b.plain !== 'string' || !b.plain.length) b.plain = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!colorsOf(b).filter(function (c) { return c !== 'plain'; }).length) return; /* no spectrum = no icon */
    el.__hbPrism = true;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prism-glyph';
    btn.setAttribute('aria-label', 'Refract — read this in another voice');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('title', 'Refract — read this in another voice');
    btn.innerHTML = GLYPH;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      if (pop && !pop.hidden && popAnchor === btn) { closePop(); return; }
      openPop(btn, b, id);
    });
    el.appendChild(btn);
  }

  /** Scan a root (default: document) for data-prism / data-prism-id elements. */
  function scan(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll('[data-prism]'), function (el) {
      try { attach(el, JSON.parse(el.getAttribute('data-prism')), null); }
      catch (e) { /* malformed inline block → graceful absence */ }
    });
    var idEls = root.querySelectorAll('[data-prism-id]');
    if (idEls.length) loadSpectra().then(function (S) {
      Array.prototype.forEach.call(idEls, function (el) {
        var id = el.getAttribute('data-prism-id');
        if (S[id]) attach(el, S[id], id);
      });
    });
  }

  /** Static (always-open) renderer — used by prism.html, the receiver page. */
  function renderInline(container, block, id) {
    var colors = colorsOf(block);
    if (!colors.length) { container.innerHTML = '<p class="muted">This spectrum is empty.</p>'; return; }
    var v = voiceGet();
    var cur = (block[v] ? v : 'plain');
    container.classList.add('prism-inline');
    function draw() {
      container.innerHTML =
        '<div class="pp-chips" role="group" aria-label="Registers">' +
        colors.map(function (c) {
          var m = META[c];
          return '<button type="button" class="pp-chip" data-color="' + c + '" title="' + esc(m.tip) + '"' +
            ' aria-pressed="' + (c === cur ? 'true' : 'false') + '">' + m.dot + ' ' + m.label + '</button>';
        }).join('') +
        '<button type="button" class="pp-chip" disabled title="' + esc(META.picture.tip) + '">' + META.picture.dot + ' Picture</button></div>' +
        (block.locked ? '<div class="pp-note">' + (cur === 'plain'
          ? 'Verbatim-locked canon — shown untouched.'
          : 'Framing expansion (' + META[cur].label + ') — the verbatim line inside never changes.') + '</div>' : '') +
        '<div class="pp-body"></div>';
      container.querySelector('.pp-body').textContent = block[cur] || '';
      Array.prototype.forEach.call(container.querySelectorAll('.pp-chip[data-color]'), function (btn) {
        btn.addEventListener('click', function () { cur = btn.getAttribute('data-color'); draw(); });
      });
    }
    draw();
  }

  window.Prism = { scan: scan, spectra: loadSpectra, renderInline: renderInline, voice: voiceGet, META: META, ORDER: ORDER };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(); });
  } else { scan(); }
})();
