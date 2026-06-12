/* HB1000 OS — The Vault sync layer (Phase 2, Slice 0)
 *
 * Doctrine: localStorage is an offline cache; the vault (this GitHub repo,
 * data/vault/) is the source of truth. "If it is not in the vault, it does
 * not exist."
 *
 * Nothing auto-commits. Every push to the vault is an explicit human
 * Approve (a button click on vault.html). The GitHub token is stored in
 * this browser's localStorage only and is sent only to api.github.com.
 */
(function (global) {
  'use strict';

  const CFG = {
    owner: 'timjlatimer',
    repo: 'hb1000-os',
    branch: 'main',
    dir: 'data/vault',
    tokenKey: 'hb1000-vault-token',
    internalPrefix: 'hb1000-vault' // never synced
  };

  const API = 'https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo + '/contents/';

  /* ---------- token ---------- */
  function getToken() { return localStorage.getItem(CFG.tokenKey) || ''; }
  function setToken(t) {
    if (t && t.trim()) localStorage.setItem(CFG.tokenKey, t.trim());
    else localStorage.removeItem(CFG.tokenKey);
  }
  function headers() {
    const h = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const t = getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  /* ---------- helpers ---------- */
  function fileFor(key) { return CFG.dir + '/' + key + '.json'; }

  // UTF-8 safe base64
  function b64encode(str) {
    return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str)));
  }
  function b64decode(b64) {
    const bin = atob(String(b64).replace(/\n/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Canonical form for comparison (whitespace-insensitive for JSON)
  function canon(s) {
    if (s == null) return null;
    try { return JSON.stringify(JSON.parse(s)); } catch (e) { return s; }
  }

  // Pretty-print JSON for readable vault diffs; non-JSON stays raw
  function pretty(s) {
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return s; }
  }

  /* ---------- local side ---------- */
  // Every hb1000-* localStorage key is a syncable decision store,
  // except the vault layer's own internal keys.
  function localKeys() {
    const ks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('hb1000-') === 0 && k.indexOf(CFG.internalPrefix) !== 0) ks.push(k);
    }
    return ks.sort();
  }

  /* ---------- vault side (GitHub Contents API) ---------- */
  async function vaultList() {
    const r = await fetch(API + CFG.dir + '?ref=' + CFG.branch + '&t=' + Date.now(), { headers: headers() });
    if (r.status === 404) return []; // folder not created yet
    if (!r.ok) throw new Error('GitHub ' + r.status + ' listing vault: ' + (await r.text()).slice(0, 200));
    const items = await r.json();
    return (Array.isArray(items) ? items : [])
      .filter(function (f) { return f.type === 'file' && /\.json$/.test(f.name); })
      .map(function (f) { return { key: f.name.replace(/\.json$/, ''), sha: f.sha, path: f.path, size: f.size }; });
  }

  async function vaultGet(key) {
    const r = await fetch(API + fileFor(key) + '?ref=' + CFG.branch + '&t=' + Date.now(), { headers: headers() });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('GitHub ' + r.status + ' reading ' + key + ': ' + (await r.text()).slice(0, 200));
    const f = await r.json();
    return { key: key, sha: f.sha, content: b64decode(f.content) };
  }

  // Commit one local key to the vault. THE human-approved write.
  async function vaultPut(key, message) {
    if (!getToken()) throw new Error('No vault token set. Open vault.html → Setup and paste a fine-grained PAT.');
    const local = localStorage.getItem(key);
    if (local === null) throw new Error('No local data for "' + key + '".');
    const existing = await vaultGet(key);
    const body = {
      message: message || ('vault: ' + key + ' — approved & committed from vault.html'),
      branch: CFG.branch,
      content: b64encode(pretty(local))
    };
    if (existing) body.sha = existing.sha;
    const r = await fetch(API + fileFor(key), {
      method: 'PUT',
      headers: Object.assign(headers(), { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('GitHub ' + r.status + ' committing ' + key + ': ' + (await r.text()).slice(0, 200));
    return r.json();
  }

  // Pull one vault file into localStorage (overwrites local).
  async function restore(key) {
    const v = await vaultGet(key);
    if (!v) throw new Error('"' + key + '" is not in the vault.');
    localStorage.setItem(key, v.content);
    return v;
  }

  /* ---------- status ---------- */
  // Per key: synced | pending (local differs from vault) | local-only | vault-only
  async function statusAll() {
    const inVault = await vaultList();
    const vaultKeys = inVault.map(function (v) { return v.key; });
    const allKeys = Array.from(new Set(localKeys().concat(vaultKeys))).sort();
    const rows = [];
    for (const key of allKeys) {
      const local = localStorage.getItem(key);
      let vault = null;
      if (vaultKeys.indexOf(key) !== -1) vault = await vaultGet(key);
      let state;
      if (local !== null && vault === null) state = 'local-only';
      else if (local === null && vault !== null) state = 'vault-only';
      else if (canon(local) === canon(vault.content)) state = 'synced';
      else state = 'pending';
      rows.push({
        key: key,
        state: state,
        localBytes: local === null ? null : local.length,
        vaultBytes: vault === null ? null : vault.content.length
      });
    }
    return rows;
  }

  global.HB1000Vault = {
    cfg: CFG,
    getToken: getToken,
    setToken: setToken,
    localKeys: localKeys,
    vaultList: vaultList,
    vaultGet: vaultGet,
    vaultPut: vaultPut,
    restore: restore,
    statusAll: statusAll
  };
})(window);
