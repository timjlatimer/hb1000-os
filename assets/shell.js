/* ==========================================================================
   THE HB1000 OPERATING SYSTEM — shared shell
   Shell.init('<pageId>')  → injects nav sidebar + 🔒 guard banner + the
                             Ambient Catch Button (A5) + first-login ceremony gate
   Shell.loadJSON(path)    → fetch helper with cache-busting
   Helpers: Shell.pill(), Shell.rygDot(), Shell.splitBar(), Shell.esc(),
            Shell.acceptanceState(cardFile), Shell.flypaperCounts(),
            Shell.catchOpen() / Shell.catchClose()
   Ground rules: draft-only — nothing sends; the human approves every move.
   ========================================================================== */
(function () {
  'use strict';

  var PAGES = [
    { id: 'model',      file: 'index.html',      label: 'The Model',                sub: 'the diamond, split by the equator' },
    { id: 'card',       file: 'card.html',       label: 'Dingo Card',               sub: '2D ⇄ 3D · the core screen' },
    { id: 'city',       file: 'city.html',       label: 'Dingo City',               sub: 'two-ring Living Portfolio' },
    { id: 'command',    file: 'command.html',    label: 'Command Deck',             sub: 'scale-to-100 · exception-first' },
    { id: 'nursery',    file: 'nursery.html',    label: 'The Nursery',              sub: 'intake → scoring → graduation' },
    { id: 'flypaper',   file: 'flypaper.html',   label: 'Flypaper',                 sub: 'catch a cloud butterfly · Maria’s desk' },
    { id: 'library',    file: 'library.html',     label: 'Library',                  sub: 'the Cloud Butterfly Library · a commons' },
    { id: 'north-star', file: 'north-star.html', label: 'North Star Builder',       sub: 'Prime · Local · Vivid Vision' },
    { id: 'purpose',    file: 'purpose.html',    label: 'Do Before I Die',          sub: 'Purpose DNA · the apex' },
    { id: 'ptk',        file: 'ptk.html',        label: 'PTK — Promises to Keep', sub: 'the dual ledger · Ghost Buster' },
    { id: 'culture',    file: 'culture.html',    label: 'Culture Chaser + Timbits', sub: 'daily 100 pts · 25 Timmyisms' },
    { id: 'fleet',      file: 'fleet.html',      label: 'Agent Fleet',              sub: 'Golden Age · Mr & Mrs Fix-It' },
    { id: 'doctrine',   file: 'doctrine.html',   label: 'The Doctrine',             sub: '80/20 · lanes · Standing Orders' },
    { id: 'loop',       file: 'loop.html',       label: 'Learning Loop V13.0',      sub: 'The Genie Release' },
    { id: 'life',       file: 'life.html',       label: 'Build Your Own Life',      sub: 'the agnostic mode' },
    { id: 'feed',       file: 'feed.html',       label: 'Show Me Feed',             sub: 'live activity wall' }
  ];

  var SOUL_QUOTES = [
    '“The Dingo Card IS the operating system. Everything else is a field on it, a feed into it, or a score from it.”',
    '“Ship it ugly. Use it daily. Success = ‘the card was used yesterday’ — NOT ‘the card is complete.’”'
  ];

  var GUARD_TEXT = '<b>Draft-only — nothing sends.</b> The human approves every move. ' +
    'Seed data is real; live wiring is simulated.';

  /* ========================================================================
     CARDHOLDER MODE — the front door session (login.html writes it).
     localStorage 'hb1000-cardholder' = { name, card, role }.
     Tim's MVP doctrine: people are ISSUED Dingo cards; they sign in and
     land on THEIR card — the back engine stays hidden. So when a holder
     with role !== 'admin' is signed in, the nav reduces to: My Card ·
     My Promises (ptk.html) · Flypaper · Library · Take the walk · Sign out.
     Admin (or nobody signed in) gets the full engine-room nav.
     Direct URLs always still work —
     this is presentation, not security (real auth = Phase 5 Firebase);
     the guard banner on every page already says what is simulated.
     ======================================================================== */
  var CH_KEY = 'hb1000-cardholder';

  function cardholderGet() {
    try {
      var c = JSON.parse(localStorage.getItem(CH_KEY));
      if (c && typeof c === 'object' && c.name && c.card) return c;
    } catch (e) { /* absent or corrupt → not signed in */ }
    return null;
  }

  function signOut() {
    try { localStorage.removeItem(CH_KEY); } catch (e) { /* private mode */ }
    location.href = 'login.html';
  }

  /* ========================================================================
     ACCEPTANCE STATE — the Assignment Acceptance Ceremony's ledger (read-only
     here). localStorage 'hb1000-acceptance' = { "<cardId>": { state, … } }
     per ACCEPTANCE-CEREMONY-SPEC §1; ceremony.html owns the state machine and
     all writes. The shell only READS it for two jobs: the ceremony-pending
     dot on the cardholder nav, and the first-login-per-card ceremony gate
     (card.html → ceremony.html when a holder's card has NO acceptance state).
     ======================================================================== */
  var ACC_KEY = 'hb1000-acceptance';

  function acceptanceGet(cardFile) {
    if (!cardFile) return null;
    /* accept a card id or a file-ish ref: 'seba-hub-occupancy' ·
       'data/cards/seba-hub-occupancy.json' · 'seba-hub-occupancy.json' */
    var id = String(cardFile).replace(/^.*[\\\/]/, '').replace(/\.json$/i, '');
    try {
      var all = JSON.parse(localStorage.getItem(ACC_KEY));
      if (all && typeof all === 'object' && all[id] && all[id].state) return all[id];
    } catch (e) { /* no ledger yet → no state */ }
    return null;
  }

  /* ========================================================================
     THE BABEL PRISM VOICE — global register (localStorage 'hb1000-voice')
     Canonical 5-color spectrum (LOCKED by Tim): plain (⚪ white light,
     default) · barstool (🔴) · timbit (🟡) · boardroom (🔵) · swiss (⬜);
     picture (🟢) reserved v2, never stored. Legacy 2-value pilot migrates:
     stored 'tim' reads/writes as 'plain'; 'swiss' carries over unchanged.
     One key, one event ('hb-voice-change'), one component (assets/prism.js
     owns per-element refraction; this is the ambient default prisms open at).
     Pilot content keys keep working as a pure CSS swap: .v-tim blocks render
     in every voice EXCEPT swiss; .v-swiss blocks render in swiss only.
     Verbatim-locked canon (Prime North Star, the 25 Timbit quotes,
     Constitution, focal promises, Vivid Vision lines) is never re-voiced;
     the 🔒 guard banner text is identical in every voice.
     ======================================================================== */
  var VOICE_KEY = 'hb1000-voice';
  var VOICES = ['plain', 'barstool', 'timbit', 'boardroom', 'swiss'];
  var VOICE_META = {
    plain:     { dot: '⚪', label: 'Plain',     tip: 'White light — as composed (default). a.k.a. Plain English' },
    barstool:  { dot: '🔴', label: 'Barstool',  tip: 'a.k.a. Raw Tim · Street — blunt, with care' },
    timbit:    { dot: '🟡', label: 'Timbit',    tip: 'the compressed bite — a.k.a. the Cliché' },
    boardroom: { dot: '🔵', label: 'Boardroom', tip: 'a.k.a. Formal · Culture Agent · Wisdom-Giant · Statesman' },
    swiss:     { dot: '⬜', label: 'Swiss',     tip: 'a.k.a. Swiss Protocol · Architect — institutional precision' }
  };

  function voiceNorm(v) {
    if (v === 'tim') return 'plain'; /* legacy pilot value migrates */
    return VOICES.indexOf(v) >= 0 ? v : 'plain';
  }

  function voiceGet() {
    try { return voiceNorm(localStorage.getItem(VOICE_KEY)); }
    catch (e) { return 'plain'; }
  }

  function voiceApply(v) {
    document.body.setAttribute('data-voice', v);
    var chips = document.querySelectorAll('.voice-chips .vc-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute('aria-pressed', chips[i].getAttribute('data-voice') === v ? 'true' : 'false');
    }
  }

  function voiceSet(v) {
    v = voiceNorm(v);
    try { localStorage.setItem(VOICE_KEY, v); } catch (e) { /* private mode */ }
    voiceApply(v);
    var ev;
    try { ev = new CustomEvent('hb-voice-change', { detail: { voice: v } }); }
    catch (e) {
      ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('hb-voice-change', true, false, { voice: v });
    }
    document.dispatchEvent(ev);
  }

  function buildVoiceToggle() {
    var span = document.createElement('span');
    span.className = 'voice-chips';
    span.setAttribute('role', 'group');
    span.setAttribute('aria-label', 'Voice register — the Babel prism spectrum');
    span.innerHTML = '<span class="vlbl">Voice:</span>' + VOICES.map(function (v) {
      var m = VOICE_META[v];
      return '<button type="button" class="vc-chip" data-voice="' + v + '" aria-pressed="false" title="' +
        esc(m.tip) + '">' + m.dot + ' <span class="vc-name">' + m.label + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(span.querySelectorAll('.vc-chip'), function (b) {
      b.addEventListener('click', function () { voiceSet(b.getAttribute('data-voice')); });
    });
    return span;
  }

  /* ========================================================================
     "TAKE THE WALK" — 7-stop guided onboarding overlay.
     Narrative pattern ported from the model tour (legacy); vocabulary locked.
     State persists in localStorage 'hb1000-walk':
       { offered, dismissed, finished, done:[stopIds], last }
     ======================================================================== */
  var WALK_KEY = 'hb1000-walk';

  /* Ruby Red's cash-flow ledger — the worked example carried over from the
     model tour (legacy). Totals are computed from these rows, never asserted. */
  var WALK_INCOME = 2400;
  var WALK_GAP = -90; /* income minus (expenses + one flat tire) */
  var WALK_AGENTS = [
    ['Budget Guardian', 45], ['Bill Negotiator', 30], ['Benefits Navigator', 125],
    ['Deal Hunter', 65], ['Utility Optimizer', 28], ['Emergency Fund', 18],
    ['Transportation', 40]
  ];

  function walkLedgerHTML() {
    var recovered = 0;
    var agentRows = WALK_AGENTS.map(function (a) {
      recovered += a[1];
      return '<div class="wl-row"><span>' + esc(a[0]) + '</span>' +
             '<span class="num">+$' + a[1] + '</span></div>';
    }).join('');
    var breathing = WALK_GAP + recovered;
    return '<div class="walk-ledger">' +
      '<div class="wl-h">Ruby Red’s cash flow — one month</div>' +
      '<div class="wl-row"><span>Income</span><span class="num">$' + WALK_INCOME.toLocaleString() + '</span></div>' +
      '<div class="wl-row bad"><span>Expenses + one flat tire</span><span class="num">−$' + (WALK_INCOME - WALK_GAP).toLocaleString() + '</span></div>' +
      '<div class="wl-row gap"><span>The gap</span><span class="num">−$' + Math.abs(WALK_GAP) + '</span></div>' +
      '<div class="wl-sep">Then 7 agents went to work</div>' +
      '<div class="wl-agents">' + agentRows + '</div>' +
      '<div class="wl-row rec"><span>Recovered</span><span class="num">+$' + recovered + '</span></div>' +
      '<div class="wl-row breathe"><span>Breathing room</span><span class="num">+$' + breathing + '</span></div>' +
      '<div class="wl-note">Worked example from the model tour (legacy) — the job the fleet exists to do.</div>' +
    '</div>';
  }

  var WALK_STOPS = [
    {
      id: 'ruby-red',
      title: 'Start with Ruby Red',
      /* IMG-05 (Phase-4 harvest, Tim-approved) — painterly repaint; retires the photoreal render */
      img: 'assets/img/ruby-red-hero.webp',
      alt: 'Ruby Red — a working mother in a deep ruby-red cardigan at her lamplit kitchen table, household ledger and coin jar before her, children’s drawings on the refrigerator behind',
      text: 'Ruby Red is the Local North Star — a working mother of two, the CFO of her ' +
            'household, doing the books at a kitchen table where one flat tire can break the ' +
            'month. The empathy rule is simple: <b>it’s expensive to be poor</b>, and we think ' +
            'that’s a crime. Last month her ledger came up $90 short — then seven agents went ' +
            'to work. If we solve it for Ruby Red, we solve it for everyone.',
      extra: walkLedgerHTML,
      href: 'purpose.html', live: 'Do Before I Die'
    },
    {
      id: 'prime-diamond',
      title: 'The Prime &amp; the diamond',
      img: 'assets/img/constellation-hero-eCPSWtgTNHnuAjKsiYYpFM.webp',
      alt: 'A cockpit window onto rings of gold and green stars',
      text: 'The whole system is <b>one diamond split by the equator</b>. Above the line lives ' +
            'the WHY — the Prime North Star, your “Ding in the Universe,” the vision every ' +
            'token spent must serve. At the centre sits HB1000: human brilliance (gold) married ' +
            'to the AI fleet (blue). Below the line is the HOW — service rings piping finance, ' +
            'integrity, and marketing into every operation. Every element on the map clicks ' +
            'through to a working room.',
      href: 'index.html', live: 'The Model'
    },
    {
      id: 'dingo-card',
      title: 'The Dingo Card &amp; the soul rule',
      img: 'assets/img/showme-dingo-card.png',
      alt: 'A live 5×5 Dingo Card with the gold PTK centre square',
      text: 'Every operation runs on one screen: a 5×5 <b>Dingo Card</b> — 25 squares, each a ' +
            'job with a KPI, an agent bar, and an RYG dot, with PTK locked in the gold centre. ' +
            'One human — the <b>Dingo Caller</b> — owns the card; the agents do the heavy ' +
            'lifting. The soul rule: the Dingo Card IS the operating system — everything else ' +
            'is a field on it, a feed into it, or a score from it. Success is binary: was the ' +
            'card used yesterday?',
      href: 'card.html', live: 'Dingo Card'
    },
    {
      id: 'ptk',
      title: 'PTK — Promises to Keep',
      /* IMG-04 (Phase-4 harvest, Tim-approved) — dark five-panel poster; retires the white PowerPoint table */
      img: 'assets/img/execution-fails-dark.webp',
      alt: 'When execution fails, it fails by inches — five vintage vignettes in gold-ruled frames: resistance, confusion, mistrust, frustration, false starts, with a thin gold dawn behind them all',
      text: '<b>PTK — Promises to Keep</b> — is the moral KPI of the whole system, and it holds ' +
            'the centre square of every Dingo Card. It’s a dual ledger: promises made to ' +
            'others and promises made to yourself, with the Ghost Buster chasing the ones ' +
            'going quiet. When execution fails it fails by inches — resistance, confusion, ' +
            'mistrust, false starts — and a kept promise is the antidote to every one of them. ' +
            'Type it like you’d say it; the card never forgets.',
      href: 'ptk.html', live: 'PTK — Promises to Keep'
    },
    {
      id: 'nursery',
      title: 'The Nursery &amp; the butterflies',
      img: 'assets/img/pearl-worldview.webp',
      alt: 'The PEARL worldview poster — protector of projects, guardian of vision',
      text: 'Ideas arrive as <b>Cloud Butterflies</b> — raw, unfiltered flashes caught by ' +
            'Flypaper before they fly away. The Nursery is where they germinate: intake, ' +
            'scoring, then graduation to the registry — or an honest rest on the shelf. It’s ' +
            'the inner ring of the two-ring Living Portfolio, and it exists because a founder ' +
            'who starts thirty things needs a system that catches everything and grows only ' +
            'the few that score.',
      href: 'nursery.html', live: 'The Nursery'
    },
    {
      id: 'fleet',
      title: 'The agent fleet &amp; the 80/20 covenant',
      img: 'assets/img/fleet-command-jebSA6bMc9XXygDD8TmueP.webp',
      alt: 'A glowing circuit map of the agent fleet around a gold hub',
      text: 'Below the equator the <b>AI fleet</b> does the heavy lifting — the Golden Age ' +
            'routing library, Mr &amp; Mrs Fix-It, agents working 24/7 inside the safety ' +
            'fence. The covenant is <b>80/20</b>: agents carry at least 80% of the load and ' +
            'the human Caller never more than 20 — the split bar alarms red the moment the ' +
            'human share creeps over. The human approves the sensitive gates; nothing moves ' +
            'without a yes.',
      href: 'fleet.html', live: 'Agent Fleet'
    },
    {
      id: 'command-deck',
      title: 'The Command Deck — used yesterday?',
      img: 'assets/img/showme-seba-console.png',
      alt: 'The live approval console — threads of decisions awaiting a human',
      text: 'The <b>Command Deck</b> is how one human runs a hundred cards: exception-first, ' +
            'so only the items that need a decision ever reach the screen. One dashboard, many ' +
            'gauges, every gauge has a mechanic — and every number computed, never asserted. ' +
            'The only success metric that matters, on every card, every day: <b>was it used ' +
            'yesterday?</b> You’ve seen the walk — now go run the rooms.',
      href: 'command.html', live: 'Command Deck'
    }
  ];

  function walkLoad() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(WALK_KEY)); } catch (e) { /* fresh */ }
    if (!s || typeof s !== 'object') s = {};
    if (!(s.done instanceof Array)) s.done = [];
    return s;
  }
  function walkSave(s) {
    try { localStorage.setItem(WALK_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }
  function walkNextStop(s) {
    for (var i = 0; i < WALK_STOPS.length; i++) {
      if (s.done.indexOf(WALK_STOPS[i].id) < 0) return i;
    }
    return 0;
  }
  function walkUpdatePill() {
    var n = document.querySelector('#hb-walk-pill .wp-n');
    if (!n) return;
    var s = walkLoad();
    n.textContent = s.finished ? '✓ walked' : (s.done.length + '/' + WALK_STOPS.length);
  }

  var walkEl = null, walkCur = 0, walkPrevFocus = null;

  function walkBuild() {
    if (walkEl) return walkEl;
    walkEl = document.createElement('div');
    walkEl.className = 'walk-overlay';
    walkEl.setAttribute('role', 'dialog');
    walkEl.setAttribute('aria-modal', 'true');
    walkEl.setAttribute('aria-label', 'Take the walk — seven stops through the operating system');
    walkEl.innerHTML =
      '<div class="walk-card">' +
        '<button type="button" class="walk-x" aria-label="Close the walk">✕</button>' +
        '<img class="walk-img" src="" alt="">' +
        '<div class="walk-body">' +
          '<div class="walk-stopno"></div>' +
          '<h2></h2>' +
          '<div class="walk-text"></div>' +
          '<div class="walk-extra"></div>' +
          '<div class="walk-live"></div>' +
        '</div>' +
        '<div class="walk-foot">' +
          '<button type="button" class="btn walk-prev">← Prev</button>' +
          '<div class="walk-dots" role="tablist" aria-label="Walk stops"></div>' +
          '<button type="button" class="btn walk-next">Next →</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(walkEl);

    var dots = walkEl.querySelector('.walk-dots');
    WALK_STOPS.forEach(function (st, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Stop ' + (i + 1) + ' — ' + st.title.replace(/&amp;/g, '&'));
      d.addEventListener('click', function () { walkShow(i); });
      dots.appendChild(d);
    });

    walkEl.querySelector('.walk-x').addEventListener('click', walkClose);
    walkEl.addEventListener('click', function (ev) { if (ev.target === walkEl) walkClose(); });
    walkEl.querySelector('.walk-prev').addEventListener('click', function () {
      if (walkCur > 0) walkShow(walkCur - 1);
    });
    walkEl.querySelector('.walk-next').addEventListener('click', function () {
      if (walkCur < WALK_STOPS.length - 1) walkShow(walkCur + 1);
      else { var s = walkLoad(); s.finished = true; walkSave(s); walkClose(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (!walkEl || !walkEl.classList.contains('open')) return;
      if (ev.key === 'Escape') walkClose();
      else if (ev.key === 'ArrowRight' && walkCur < WALK_STOPS.length - 1) walkShow(walkCur + 1);
      else if (ev.key === 'ArrowLeft' && walkCur > 0) walkShow(walkCur - 1);
    });
    return walkEl;
  }

  function walkShow(i) {
    walkBuild();
    walkCur = Math.max(0, Math.min(WALK_STOPS.length - 1, i));
    var st = WALK_STOPS[walkCur];

    walkEl.querySelector('.walk-img').src = st.img;
    walkEl.querySelector('.walk-img').alt = st.alt;
    walkEl.querySelector('.walk-stopno').textContent =
      'Stop ' + (walkCur + 1) + ' of ' + WALK_STOPS.length;
    walkEl.querySelector('.walk-body h2').innerHTML = st.title;
    walkEl.querySelector('.walk-text').innerHTML = st.text;
    walkEl.querySelector('.walk-extra').innerHTML =
      (typeof st.extra === 'function') ? st.extra() : (st.extra || '');
    walkEl.querySelector('.walk-live').innerHTML =
      '<a class="btn gold-cta" href="' + esc(st.href) + '">EXPLORE LIVE → ' + esc(st.live) + '</a>';

    walkEl.querySelector('.walk-prev').disabled = (walkCur === 0);
    walkEl.querySelector('.walk-next').textContent =
      (walkCur === WALK_STOPS.length - 1) ? 'Finish the walk ✓' : 'Next →';

    /* persist: this stop is now seen */
    var s = walkLoad();
    if (s.done.indexOf(st.id) < 0) s.done.push(st.id);
    s.last = walkCur;
    walkSave(s);

    var dots = walkEl.querySelectorAll('.walk-dots button');
    for (var d = 0; d < dots.length; d++) {
      dots[d].className = (s.done.indexOf(WALK_STOPS[d].id) >= 0 ? 'done' : '') +
                          (d === walkCur ? ' cur' : '');
    }
    walkUpdatePill();
    walkEl.querySelector('.walk-card').scrollTop = 0;
  }

  function walkOpen(i) {
    walkBuild();
    walkPrevFocus = document.activeElement;
    walkEl.classList.add('open');
    document.body.classList.add('walk-open');
    walkShow(i == null ? walkNextStop(walkLoad()) : i);
    walkEl.querySelector('.walk-x').focus();
  }

  function walkClose() {
    if (!walkEl) return;
    walkEl.classList.remove('open');
    document.body.classList.remove('walk-open');
    var s = walkLoad();
    s.dismissed = true; /* dismissal persists; the sidebar pill stays available */
    walkSave(s);
    walkUpdatePill();
    if (walkPrevFocus && walkPrevFocus.focus) walkPrevFocus.focus();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ========================================================================
     THE AMBIENT CATCH BUTTON (Amendment A5) — capture from EVERY screen.
     The round gold button — the descendant of Maria's "Big Round Button" —
     floats bottom-right on every shelled page, above the mobile thumb zone.
     One tap → quick-catch sheet (Name it + verbatim dump + 🪤 CAUGHT) →
     back to work in seconds. Maria hosts the Flypaper (A6).
     Writes localStorage 'hb1000-flypaper' in the EXACT shape flypaper.html
     owns (FLYPAPER-LANDING-SPEC §8); raw text is stored immutable — we never
     summarize the Caller's words. Every capture also lands on Tim's review
     queue ('hb1000-review-queue', render-only on command.html).
     One tap to dismiss · Esc closes · never modal-traps (non-modal dialog,
     no focus trap, scroll never locked) · reduced-motion handled in CSS.
     The R-### id continues the registry YTD sequence — baseYTD is computed
     from data/butterfly-registry.json at save time, never hard-coded.
     Draft-only — nothing sends.
     ======================================================================== */
  var FLY_KEY = 'hb1000-flypaper';
  var REVIEW_KEY = 'hb1000-review-queue';
  var FLY_DAY1 = new Date(2026, 0, 11); /* Day 1 = 2026-01-11 (spec §6) */

  function flyLoad() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(FLY_KEY)); } catch (e) { /* fresh */ }
    if (!s || typeof s !== 'object') s = {};
    if (!s.settings || typeof s.settings !== 'object') {
      s.settings = { autoSkip: false, libraryAfterCatch: false };
    }
    if (!(s.days instanceof Array)) s.days = [];
    if (!(s.captures instanceof Array)) s.captures = [];
    return s;
  }
  function flySave(s) {
    try { localStorage.setItem(FLY_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }
  function flyDayNo(d) {
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    /* round, not floor — a DST jump makes local-midnight gaps ±1h off a clean day */
    return Math.round((a - FLY_DAY1) / 86400000) + 1; /* Day 1 inclusive; zero-hunt days still count */
  }
  function flyIdMax(rows) {
    var max = 0;
    (rows || []).forEach(function (b) {
      var m = /(\d+)\s*$/.exec(String((b && b.id) || ''));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return max;
  }
  var flyBaseP = null;
  function flyBase() { /* baseYTD = highest numeric id suffix in the registry (spec §6) */
    if (!flyBaseP) {
      flyBaseP = Shell.loadJSON('data/butterfly-registry.json')
        .then(function (j) { return flyIdMax(j && j.butterflies); })
        .catch(function () { return 0; /* registry unreachable → local sequence carries */ });
    }
    return flyBaseP;
  }

  var FLY_STOP = ' the and that this with from have what when where will would could should ' +
    'about into just like them they then than there their your because every been being ' +
    'over under only also more most some such very make made need want time today ' +
    'butterfly butterflies idea ideas ';
  function flyTokens(s) {
    var out = {}, m = String(s || '').toLowerCase().match(/[a-z][a-z']{3,}/g) || [];
    m.forEach(function (w) { if (FLY_STOP.indexOf(' ' + w + ' ') < 0) out[w] = 1; });
    return out;
  }
  /* the swarm rule, verbatim: 3+ butterflies / same topic / 7 days (spec §7).
     The new capture sharing a token with 2+ others in the window = the 3rd. */
  function flySwarm(store, title, raw) {
    var toks = flyTokens(title + ' ' + raw), counts = {}, now = Date.now(), w;
    store.captures.forEach(function (c) {
      var t = Date.parse(c.captured_at);
      if (!t || now - t > 7 * 86400000) return;
      var ct = flyTokens((c.title || '') + ' ' + (c.raw_text || ''));
      for (var k in toks) { if (ct[k]) counts[k] = (counts[k] || 0) + 1; }
    });
    var best = null;
    for (w in counts) { if (counts[w] >= 2 && (!best || counts[w] > counts[best])) best = w; }
    return best;
  }
  var FLY_DEADLINE = /\bby (mon|tue|wed|thu|fri|sat|sun)|\bdue\b|deadline|hearing/i; /* spec §2 */

  function reviewPush(entry) {
    var q = [];
    try { q = JSON.parse(localStorage.getItem(REVIEW_KEY)) || []; } catch (e) { /* fresh */ }
    if (!(q instanceof Array)) q = [];
    q.push(entry);
    try { localStorage.setItem(REVIEW_KEY, JSON.stringify(q)); } catch (e) { /* private mode */ }
  }

  var catchBtn = null, catchSheet = null, catchScrim = null, catchPrevFocus = null;

  function catchToast(html) {
    var t = document.getElementById('hb-catch-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'hb-catch-toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(t._hbT);
    t._hbT = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }

  function catchBuild() {
    if (catchBtn) return;

    catchScrim = document.createElement('div');
    catchScrim.id = 'hb-catch-scrim';
    catchScrim.setAttribute('aria-hidden', 'true');

    catchSheet = document.createElement('div');
    catchSheet.id = 'hb-catch-sheet';
    catchSheet.setAttribute('role', 'dialog'); /* non-modal on purpose — never traps */
    catchSheet.setAttribute('aria-label', 'The Flypaper — quick catch');
    catchSheet.innerHTML =
      '<div class="cs-head">' +
        '<span class="cs-fly" aria-hidden="true">🦋</span>' +
        '<div class="cs-hgroup">' +
          '<div class="cs-t">The <b>Flypaper</b> — quick catch</div>' +
          /* Tim's line, verbatim — never re-voiced */
          '<div class="cs-canon">“Butterflies are like hearing light — name it before it’s gone.”' +
            ' <span class="cs-attr">— Tim</span></div>' +
        '</div>' +
        '<button type="button" class="cs-x" aria-label="Close — back to work">✕</button>' +
      '</div>' +
      /* Maria hosts (A6) — warm framing copy only; no streak-shaming, ever */
      '<p class="cs-maria">Maria: “Ciao! Did your HB1000 bring me a butterfly? Name it quick and ' +
        'dump it raw — I’ll keep it safe. Even the half-asleep ones. <i>Especially</i> those.”</p>' +
      '<label class="cs-lbl" for="hb-catch-title">Name it</label>' +
      '<input id="hb-catch-title" type="text" autocomplete="off" autocapitalize="sentences" placeholder="Name it">' +
      '<label class="cs-lbl" for="hb-catch-raw">Core insight — verbatim</label>' +
      '<textarea id="hb-catch-raw" autocapitalize="sentences" ' +
        'placeholder="Define it — dump it raw. Voice button on your keyboard works great. ' +
        'We never summarize your words."></textarea>' +
      '<div class="cs-msg" role="status" aria-live="polite"></div>' +
      '<div class="cs-actions">' +
        '<button type="button" id="hb-catch-save" class="btn gold-cta">🪤 CAUGHT</button>' +
        '<a class="cs-full" href="flypaper.html">open the full Flypaper →</a>' +
      '</div>' +
      '<div class="cs-foot">Draft-only — nothing sends. Export to ship.</div>';

    catchBtn = document.createElement('button');
    catchBtn.id = 'hb-catch-btn';
    catchBtn.type = 'button';
    catchBtn.setAttribute('aria-haspopup', 'dialog');
    catchBtn.setAttribute('aria-expanded', 'false');
    catchBtn.setAttribute('aria-controls', 'hb-catch-sheet');
    catchBtn.setAttribute('aria-label', 'Catch a cloud butterfly — quick Flypaper capture');
    catchBtn.title = 'Catch a cloud butterfly — the Flypaper is always open';
    catchBtn.textContent = '🦋';

    document.body.appendChild(catchScrim);
    document.body.appendChild(catchSheet);
    document.body.appendChild(catchBtn);

    catchBtn.addEventListener('click', function () {
      if (catchSheet.classList.contains('open')) catchClose(); else catchOpen();
    });
    catchScrim.addEventListener('click', catchClose);
    catchSheet.querySelector('.cs-x').addEventListener('click', catchClose);
    catchSheet.querySelector('#hb-catch-save').addEventListener('click', catchSave);
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!catchSheet.classList.contains('open')) return;
      if (walkEl && walkEl.classList.contains('open')) return; /* the walk owns its own Esc */
      catchClose();
    });
  }

  function catchOpen() {
    catchBuild();
    flyBase(); /* pre-warm the registry id sequence */
    catchPrevFocus = document.activeElement;
    catchScrim.classList.add('open');
    catchSheet.classList.add('open');
    catchBtn.setAttribute('aria-expanded', 'true');
    var t = document.getElementById('hb-catch-title');
    if (t) t.focus();
  }

  function catchClose() {
    if (!catchSheet || !catchSheet.classList.contains('open')) return;
    catchScrim.classList.remove('open');
    catchSheet.classList.remove('open');
    catchBtn.setAttribute('aria-expanded', 'false');
    var m = catchSheet.querySelector('.cs-msg');
    if (m) m.textContent = '';
    if (catchPrevFocus && catchPrevFocus.focus) catchPrevFocus.focus();
    else catchBtn.focus();
  }

  function catchSave() {
    var tEl = document.getElementById('hb-catch-title');
    var rEl = document.getElementById('hb-catch-raw');
    var mEl = catchSheet.querySelector('.cs-msg');
    var title = tEl.value.trim();
    if (!title) {
      mEl.textContent = 'Maria: “Give it a name first, tesoro — quick, before it flies.”';
      tEl.focus();
      return;
    }
    if (!rEl.value.trim()) {
      mEl.textContent = 'Maria: “Now dump it raw — your words exactly as they came. I never tidy them.”';
      rEl.focus();
      return;
    }
    mEl.textContent = '';
    var saveBtn = document.getElementById('hb-catch-save');
    saveBtn.disabled = true;

    flyBase().then(function (base) {
      var store = flyLoad();
      /* local max over R-### ids ONLY — a provisional FP-<timestamp> id
         (flypaper.html, registry unreachable) must never inflate the sequence */
      var rMax = 0;
      store.captures.forEach(function (c) {
        var m = /^R-(\d+)$/i.exec(String((c && c.id) || ''));
        if (m) rMax = Math.max(rMax, parseInt(m[1], 10));
      });
      var n = Math.max(base, rMax) + 1;
      var now = new Date();
      var tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* old engine */ }
      var ch = cardholderGet();
      var raw = rEl.value; /* verbatim, immutable — stored exactly as typed/dictated */
      var words = raw.trim().split(/\s+/).length;
      var swarmTok = flySwarm(store, title, raw);
      var cap = {
        id: 'R-' + n,
        day_no: flyDayNo(now),
        captured_at: now.toISOString(),
        tz: tz,
        channel: 'app',
        caller: ch ? ch.name : 'unsigned',
        title: title,
        raw_text: raw,
        enrich: { thesis: '', bar_stool: '', cliche: '' },
        self_score: { humanity: 65, business: 65, fun: 65, wth: 65, total: 260 },
        flags: { lean_canvas: false, swarm: swarmTok, deadline: FLY_DEADLINE.test(title + ' ' + raw) },
        status: 'captured',
        review: 'pending'
      };
      store.captures.push(cap);
      flySave(store);
      reviewPush({ type: 'butterfly-review', id: cap.id, title: title, total: 260, at: cap.captured_at });
      var extra = swarmTok ?
        ' 🐝 Your unconscious is circling “' + esc(swarmTok) + '”.' : '';
      catchToast('🪤 CAPTURED (' + words + ' words). <b>' + esc(cap.id) +
        '</b> is safe on the <a href="flypaper.html">Flypaper</a>.' + extra);
      tEl.value = '';
      rEl.value = '';
      saveBtn.disabled = false;
      catchClose();
    });
  }

  function buildSidebar(pageId) {
    var aside = document.createElement('aside');
    aside.id = 'hb-sidebar';

    var ch = cardholderGet();
    var reduced = !!(ch && ch.role !== 'admin'); /* cardholder mode — their card, not the engine room */

    var links;
    if (reduced) {
      /* ceremony-pending dot — read-only peek at the acceptance ledger */
      var acc = acceptanceGet(ch.card);
      var cerPending = !!(acc && /^(offered|briefed|negotiated)$/.test(acc.state));
      var MY_PAGES = [
        { id: 'card', file: 'card.html?card=' + encodeURIComponent(ch.card),
          label: 'My Card',     sub: '2D ⇄ 3D · ' + ch.card,
          dot: cerPending ? 'Ceremony pending — your assignment awaits' : null },
        { id: 'ptk',  file: 'ptk.html',
          label: 'My Promises', sub: 'PTK — Promises to Keep' },
        { id: 'flypaper', file: 'flypaper.html',
          label: 'Flypaper',    sub: 'catch a cloud butterfly · Maria’s desk' },
        { id: 'library', file: 'library.html',
          label: 'Library',     sub: 'the Cloud Butterfly Library' }
      ];
      links = MY_PAGES.map(function (p) {
        var cur = (p.id === pageId) ? ' class="current" aria-current="page"' : '';
        var dot = p.dot ? ' <span class="nav-cer-dot" title="' + esc(p.dot) +
                          '" aria-label="' + esc(p.dot) + '"></span>' : '';
        return '<a href="' + esc(p.file) + '"' + cur + '>' + esc(p.label) + dot +
               '<span class="sub">' + esc(p.sub) + '</span></a>';
      }).join('') +
      '<a href="login.html" id="hb-signout">Sign out' +
        '<span class="sub">hand the card back · login.html</span></a>';
    } else {
      links = PAGES.map(function (p) {
        var cur = (p.id === pageId) ? ' class="current" aria-current="page"' : '';
        return '<a href="' + p.file + '"' + cur + '>' + esc(p.label) +
               '<span class="sub">' + esc(p.sub) + '</span></a>';
      }).join('');
    }

    var signedLine = '';
    if (ch) {
      signedLine = '<div class="signedin">signed in as <b>' + esc(ch.name) + '</b>' +
        (reduced ? '' : ' · ALL-ACCESS <button type="button" id="hb-signout-mini">sign out</button>') +
        '</div>';
    }

    aside.innerHTML =
      '<div class="brand">' +
        '<div class="t">The <b>HB1000</b> Operating System</div>' +
        '<div class="tag">Human Brilliance + AI, in service of Social Impact Capitalism</div>' +
        signedLine +
        '<button id="hb-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">Menu ☰</button>' +
      '</div>' +
      '<button id="hb-walk-pill" type="button" aria-haspopup="dialog">' +
        '◈ Take the walk<span class="wp-n"></span>' +
        '<span class="wp-sub">7 stops · the whole system in 3 minutes</span>' +
      '</button>' +
      '<nav aria-label="' + (reduced ? 'Your Dingo card' : 'HB1000 OS pages') + '">' + links + '</nav>' +
      '<div class="soul">' +
        SOUL_QUOTES.map(function (q) { return '<p>' + esc(q) + '</p>'; }).join('') +
      '</div>';

    return aside;
  }

  function buildGuardBanner() {
    var div = document.createElement('div');
    div.className = 'guard-banner';
    div.setAttribute('role', 'note');
    div.innerHTML = '<span class="lock" aria-hidden="true">🔒</span><span>' + GUARD_TEXT + '</span>';
    return div;
  }

  var Shell = {

    pages: PAGES,

    /** Open the "Take the walk" guided overlay (optionally at a stop index 0–6). */
    walk: function (i) { walkOpen(i); },

    /** Current voice register: 'plain' (default) | 'barstool' | 'timbit' | 'boardroom' | 'swiss'.
        Legacy stored 'tim' reads as 'plain'. */
    voice: voiceGet,

    /** Set the voice register (5-value enum; legacy 'tim' accepted and normalized to 'plain');
        persists to localStorage 'hb1000-voice' and dispatches 'hb-voice-change'. */
    setVoice: voiceSet,

    /** Signed-in cardholder { name, card, role } from localStorage 'hb1000-cardholder', or null. */
    cardholder: cardholderGet,

    /** Clear the cardholder session and return to the front door (login.html). */
    signOut: signOut,

    /** Acceptance-ceremony state for a card — reads localStorage 'hb1000-acceptance'
        (ACCEPTANCE-CEREMONY-SPEC §1; ceremony.html owns all writes).
        Accepts a card id or file-ish ref ('seba-hub-occupancy' ·
        'data/cards/seba-hub-occupancy.json'). Returns the ledger entry
        { state, rounds, … } or null when the card has no acceptance state.
        Shared by the shell's first-login gate, the cardholder nav dot, and
        card.html's ceremony hook. */
    acceptanceState: acceptanceGet,

    /** Local Flypaper counters from 'hb1000-flypaper' — { today, local }
        (computed, never asserted; registry YTD reconciliation lives in
        flypaper.html). For badges on other pages. */
    flypaperCounts: function () {
      var s = flyLoad(), t = new Date(), n = 0;
      s.captures.forEach(function (c) {
        var d = new Date(c.captured_at);
        if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() &&
            d.getDate() === t.getDate()) n++;
      });
      return { today: n, local: s.captures.length };
    },

    /** Open the ambient quick-catch sheet (A5) programmatically. */
    catchOpen: function () { catchOpen(); },

    /** Close the ambient quick-catch sheet. */
    catchClose: function () { catchClose(); },

    /** Inject the shared nav sidebar + guard banner. Call once, after DOM is ready. */
    init: function (pageId) {
      var go = function () {
        if (document.getElementById('hb-sidebar')) return; // idempotent

        /* ---- first-login-per-card ceremony gate (Phase 4.5) ----
           A signed-in non-admin cardholder opening THEIR OWN card with NO
           acceptance state yet goes to the Acceptance Ceremony first.
           ceremony.html owns the rite and writes hb1000-acceptance; this
           gate (and card.html's ceremony hook) reads it via
           Shell.acceptanceState(cardFile). */
        if (pageId === 'card') {
          var gch = cardholderGet();
          /* Guest is "just looking" (the sample card) — no rite to gate */
          if (gch && gch.role !== 'admin' && gch.role !== 'guest') {
            var gm = /[?&]card=([^&#]+)/.exec(location.search);
            var gcard = gm ? decodeURIComponent(gm[1]) : null;
            if (gcard && gcard === gch.card && !acceptanceGet(gcard)) {
              location.replace('ceremony.html?card=' + encodeURIComponent(gcard));
              return;
            }
          }
        }

        document.body.classList.add('hb-shelled');

        var aside = buildSidebar(pageId);
        document.body.insertBefore(aside, document.body.firstChild);

        var banner = buildGuardBanner();
        var main = document.querySelector('main');
        if (main) {
          main.parentNode.insertBefore(banner, main);
        } else if (aside.nextSibling) {
          document.body.insertBefore(banner, aside.nextSibling);
        } else {
          document.body.appendChild(banner);
        }

        /* ---- Babel prism voice (chips render ONLY on pages with voiced or prism-bearing content) ---- */
        if (document.querySelector('.v-swiss, [data-prism-id], [data-prism]')) banner.appendChild(buildVoiceToggle());
        voiceApply(voiceGet());

        var toggle = document.getElementById('hb-nav-toggle');
        if (toggle) {
          toggle.addEventListener('click', function () {
            var open = aside.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          });
        }

        /* ---- cardholder sign-out (clears hb1000-cardholder → login.html) ---- */
        var so = document.getElementById('hb-signout');
        if (so) so.addEventListener('click', function (ev) { ev.preventDefault(); signOut(); });
        var soMini = document.getElementById('hb-signout-mini');
        if (soMini) soMini.addEventListener('click', signOut);

        /* ---- "Take the walk" wiring ---- */
        var pill = document.getElementById('hb-walk-pill');
        if (pill) pill.addEventListener('click', function () { walkOpen(); });
        walkUpdatePill();

        /* gold CTA on the index hero, above the tabs */
        if (pageId === 'model' && main) {
          var cta = document.createElement('div');
          cta.className = 'walk-cta';
          cta.innerHTML =
            '<button type="button" class="btn gold-cta" id="hb-walk-hero" aria-haspopup="dialog">◈ Take the walk</button>' +
            '<span class="wc-sub">New here? Seven stops — Ruby Red to the Command Deck — in about three minutes.</span>';
          var tabs = main.querySelector('.tabs');
          if (tabs) main.insertBefore(cta, tabs); else main.appendChild(cta);
          cta.querySelector('#hb-walk-hero').addEventListener('click', function () { walkOpen(); });
        }

        /* open on demand (?walk=1) or auto-offer once on first-ever visit to the model */
        var wState = walkLoad();
        var forced = /[?&]walk=1\b/.test(location.search);
        if (forced) {
          walkOpen();
        } else if (pageId === 'model' && !wState.offered && !wState.dismissed && wState.done.length === 0) {
          wState.offered = true;
          walkSave(wState);
          walkOpen(0);
        }

        /* ---- THE AMBIENT CATCH BUTTON (A5) — on every shelled page ---- */
        catchBuild();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go);
      } else {
        go();
      }
    },

    /** Fetch JSON with cache-busting. Returns a Promise of parsed JSON. */
    loadJSON: function (path) {
      var bust = (path.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
      return fetch(path + bust, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('Shell.loadJSON: ' + path + ' → HTTP ' + r.status);
        return r.json();
      });
    },

    /** HTML-escape helper (use on all data-driven text). */
    esc: esc,

    /**
     * Pill badge. kind: good | warn | danger | info | gold | ruby (or omit for neutral).
     * Also accepts ryg values: green→good, yellow→warn, red→danger.
     */
    pill: function (text, kind) {
      var map = { green: 'good', yellow: 'warn', red: 'danger' };
      var k = map[kind] || kind || '';
      return '<span class="pill ' + esc(k) + '">' + esc(text) + '</span>';
    },

    /** RYG status dot. ryg: green | yellow | red (anything else renders grey). */
    rygDot: function (ryg) {
      var cls = { green: 'g', yellow: 'y', red: 'r' }[ryg] || 'grey';
      return '<span class="dot ' + cls + '" title="' + esc(ryg || 'n/a') + '"></span>';
    },

    /**
     * 80/20 split bar. human = human share % (default 20); AI = 100 − human.
     * Cyan = AI share, gold = human share. Computed, never asserted.
     * Adds the covenant alarm style when the human share creeps over 20%.
     */
    splitBar: function (human) {
      var h = Math.max(0, Math.min(100, Number(human == null ? 20 : human)));
      var a = 100 - h;
      var alarm = h > 20 ? ' alarm' : '';
      return '<div class="splitwrap' + alarm + '">' +
        '<div class="splitbar" role="img" aria-label="Caller ' + h + '% · AI agents ' + a + '%">' +
          '<div class="ai" style="width:' + a + '%"></div>' +
          '<div class="human" style="width:' + h + '%"></div>' +
        '</div>' +
        '<div class="legend">' +
          '<span class="a">AI agents <b>' + a + '%</b></span>' +
          '<span class="h">Caller <b>' + h + '%</b></span>' +
        '</div>' +
      '</div>';
    }
  };

  window.Shell = Shell;
})();
