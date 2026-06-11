// One-shot authoring tool (NOT part of the app — no build step; run once, then delete).
// Maps the 25 timbits.json core records into spectra.json field-for-field so the
// verbatim quotes stay byte-identical. Mapping (locked contract):
//   quote    -> plain   (locked: true — verbatim canon, never re-voiced)
//   barstool -> barstool (the Raw Tim mode)
//   context  -> boardroom (the Culture Agent mode)
//   derived  -> swiss   (the Swiss Protocol structured view, same shape culture.html renders)
//   timbit   -> timbit  (the cliché / bumper-sticker)
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const tb = JSON.parse(readFileSync(new URL('timbits.json', dir), 'utf8'));
const sp = JSON.parse(readFileSync(new URL('spectra.json', dir), 'utf8'));

const cats = tb.meta.categories;
let added = 0;

for (const t of tb.core) {
  const cat = cats[t.category] || {};
  sp.spectra[t.id] = {
    title: `Timbit ${t.id} — ${t.title}`,
    locked: true,
    plain: t.quote,
    barstool: t.barstool,
    timbit: t.timbit,
    boardroom: t.context,
    swiss: `Record ${t.id} · code ${t.jCode} (${cat.label || t.category}). Principle, verbatim: “${t.quote}” Context: ${t.context}`,
    meta: {
      authored_by: 'prism-core (field-for-field mapping — nothing authored)',
      authored_at: '2026-06-11',
      source: `data/timbits.json core → ${t.id}: quote→plain (verbatim), barstool→barstool (Raw Tim), context→boardroom (Culture Agent), derived→swiss (Swiss Protocol structured view), timbit→timbit (the cliché)`
    }
  };
  added++;
}

writeFileSync(new URL('spectra.json', dir), JSON.stringify(sp, null, 2) + '\n', 'utf8');
console.log(`mapped ${added} timbits; total spectra: ${Object.keys(sp.spectra).length}`);
