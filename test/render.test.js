// node --test test/ — the shelf data renders 20 cards, 26 photos, 8 spore slots; a done spore print shows colour + photo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const lib = require('../library.js');

const ROOT = path.join(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'shelves/index.json'), 'utf8'));

test('every shelf in the index has a data file, and every photo it names exists as original and thumbnail', () => {
  assert.ok(index.shelves.length >= 1);
  for (const s of index.shelves) {
    const shelf = JSON.parse(fs.readFileSync(path.join(ROOT, `shelves/${s.id}.json`), 'utf8'));
    assert.equal(shelf.id, s.id);
    for (const f of shelf.finds) {
      const ids = [...f.photos, ...(f.spore && f.spore.photo ? [f.spore.photo] : [])];
      for (const p of ids) {
        assert.ok(fs.existsSync(path.join(ROOT, `shelves/${s.id}/img/${p}.jpg`)), `${s.id} ${f.no}: img/${p}.jpg`);
        assert.ok(fs.existsSync(path.join(ROOT, `shelves/${s.id}/thumb/${p}.jpg`)), `${s.id} ${f.no}: thumb/${p}.jpg`);
      }
    }
  }
});

test('shelf 1: 20 cards, 26 photos, 8 pending spore slots, safety flags rendered', () => {
  const shelf = JSON.parse(fs.readFileSync(path.join(ROOT, 'shelves/karaburun-2026-11-18.json'), 'utf8'));
  const html = lib.gridHtml(shelf, 'shelves/karaburun-2026-11-18');
  assert.equal(shelf.finds.length, 20);
  assert.equal(lib.photoCount(shelf), 26);
  assert.equal((html.match(/<article /g) || []).length, 20);
  assert.equal((html.match(/<img /g) || []).length, 26);
  assert.equal((html.match(/Spore print: pending/g) || []).length, 8);
  assert.equal((html.match(/class="chip deadly"/g) || []).length, 2);
  assert.ok(html.includes('data-src="shelves/karaburun-2026-11-18/img/kb-01.jpg"'));
  assert.ok(html.includes('src="shelves/karaburun-2026-11-18/thumb/kb-01.jpg"'));
  assert.match(lib.shelflineHtml(shelf), /<b>20<\/b> finds · <b>26<\/b> photos/);
  assert.ok(lib.shelflineHtml(shelf).includes('Karaburun, Arnavutköy, İstanbul'));
});

test('shelf 2: 31 cards, 48 photos, 20 pending spore slots, 3 deadly flags', () => {
  const shelf = JSON.parse(fs.readFileSync(path.join(ROOT, 'shelves/catalca-2026-11-21.json'), 'utf8'));
  const html = lib.gridHtml(shelf, 'shelves/catalca-2026-11-21');
  assert.equal(shelf.finds.length, 31);
  assert.equal(lib.photoCount(shelf), 48);
  assert.equal((html.match(/<article /g) || []).length, 31);
  assert.equal((html.match(/<img /g) || []).length, 48);
  assert.equal((html.match(/Spore print: pending/g) || []).length, 20);
  assert.equal((html.match(/class="chip deadly"/g) || []).length, 3);
  assert.ok(html.includes('src="shelves/catalca-2026-11-21/thumb/s2-01.jpg"'));
  assert.match(lib.shelflineHtml(shelf), /<b>31<\/b> finds · <b>48<\/b> photos/);
  assert.ok(lib.shelflineHtml(shelf).includes('Çatalca, İstanbul'));
});

test('a done spore print shows the colour disc, the note and the print photo', () => {
  const f = { no: 'KB-15', kind: 'fungus', time: '13:59', photos: ['kb-17'], name: 'Pale veil mushroom', flag: 'deadly', flagText: 'x',
    spore: { status: 'done', colour: 'brown', hex: '#6b4a2b', note: 'Hebeloma', photo: 'kb-15-spore' } };
  const html = lib.sporeHtml(f, 'shelves/x');
  assert.ok(html.includes('class="spore done"'));
  assert.ok(html.includes('background:#6b4a2b'));
  assert.ok(html.includes('Spore print: brown · Hebeloma'));
  assert.ok(html.includes('data-src="shelves/x/img/kb-15-spore.jpg"'));
  assert.equal(lib.sporeHtml({ ...f, spore: undefined }, 'shelves/x'), '', 'no slot on a plant');
});

test('text is escaped into attributes and bodies', () => {
  const html = lib.cardHtml({ no: 'T', kind: 'plant', time: '', photos: [], name: 'a<b>&"c"', flag: 'mild', flagText: 'ok', id: '<script>' }, 'shelves/x');
  assert.ok(html.includes('a&lt;b&gt;&amp;&quot;c&quot;'));
  assert.ok(!html.includes('<script>'));
});

test('shelf nav marks the current shelf', () => {
  const nav = lib.shelvesNavHtml([{ id: 'a', shelf: 1, title: 'A' }, { id: 'b', shelf: 2, title: 'B' }], 'b');
  assert.ok(nav.includes('href="#b" aria-current="page"'));
  assert.ok(!nav.includes('href="#a" aria-current'));
});
