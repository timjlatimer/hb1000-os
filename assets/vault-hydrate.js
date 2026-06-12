/* HB1000 OS — Vault hydration (Phase 2, Slice 0.5)
 *
 * On page load, pulls decision stores from the vault (data/vault/ in this
 * repo) that are MISSING locally and fills localStorage with them, so any
 * browser — Tim's, Fidel's, Casey's — starts from the same shared state.
 *
 * Rules:
 * - Local data always wins when present. Hydration never overwrites;
 *   explicit overwrites happen only via Restore on vault.html.
 * - Read-only against GitHub (no token needed); silently skips offline.
 * - Runs once per tab session. If anything was filled, reloads once so
 *   page scripts that read localStorage at parse time see vault state.
 */
(function () {
  'use strict';

  var SESSION_FLAG = 'hb1000-vault-hydrated';
  var INTERNAL = 'hb1000-vault'; // the vault layer's own keys — never synced
  var OWNER = 'timjlatimer', REPO = 'hb1000-os', BRANCH = 'main', DIR = 'data/vault';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/';
  var HEADERS = { 'Accept': 'application/vnd.github+json' };

  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
  } catch (e) { return; }

  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\n/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  fetch(API + DIR + '?ref=' + BRANCH + '&t=' + Date.now(), { headers: HEADERS })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var missing = (Array.isArray(items) ? items : [])
        .filter(function (f) { return f.type === 'file' && /\.json$/.test(f.name); })
        .map(function (f) { return f.name.replace(/\.json$/, ''); })
        .filter(function (k) { return k.indexOf(INTERNAL) !== 0 && localStorage.getItem(k) === null; });

      if (!missing.length) {
        sessionStorage.setItem(SESSION_FLAG, '1');
        return null;
      }

      return Promise.all(missing.map(function (key) {
        return fetch(API + DIR + '/' + key + '.json?ref=' + BRANCH + '&t=' + Date.now(), { headers: HEADERS })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (f) {
            if (f && f.content) { localStorage.setItem(key, b64decode(f.content)); return key; }
            return null;
          })
          .catch(function () { return null; });
      })).then(function (filled) {
        sessionStorage.setItem(SESSION_FLAG, '1');
        if (filled.filter(Boolean).length) location.reload();
      });
    })
    .catch(function () {
      try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) {}
    });
})();
