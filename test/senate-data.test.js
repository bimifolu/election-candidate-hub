import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { senateCandidates, senateSource } from '../senate-data.js';
import { candidates, getDistricts, filterCandidates } from '../data.js';

test('all supplied pages, candidates and districts are represented with unique source IDs', () => {
  assert.equal(senateSource.pages, 127);
  assert.equal(senateCandidates.length, 1303);
  assert.equal(senateSource.candidateCount, 1303);
  assert.equal(new Set(senateCandidates.map(c => c.id)).size, 1303);
  assert.equal(new Set(senateCandidates.map(c => c.state)).size, 37);
  assert.equal(new Set(senateCandidates.map(c => `${c.state}/${c.district}`)).size, 109);
  assert.equal(new Set(senateCandidates.map(c => c.sourcePage)).size, 127);
  for (const state of new Set(senateCandidates.map(c => c.state))) {
    const rows = senateCandidates.filter(c => c.state === state);
    assert.deepEqual(rows.map(c => c.serial), Array.from({ length: rows.length }, (_, i) => i + 1));
    assert.equal(getDistricts(senateCandidates, state, 'Senate').length, state === 'Federal Capital Territory' ? 1 : 3);
  }
});

test('multiline source values and missing qualifications are preserved, without fictional details', () => {
  const get = id => senateCandidates.find(c => c.id === id);
  assert.equal(get('senate-2027-abia-5').name, 'OKORONKWO IKECHUKWU BISHOP GODSWILL');
  assert.equal(get('senate-2027-abia-6').qualifications, 'CHRIST THE KING SCHOOL ABA GOVERNMENT COLLEGE UMUAHIA HARVAD UNIVERSISTY SCHOOL OF ADMIN');
  assert.equal(get('senate-2027-abia-6').age, 66);
  assert.equal(get('senate-2027-abia-6').party, 'APC');
  assert.equal(get('senate-2027-abia-6').sourcePage, 1);
  assert.equal(get('senate-2027-abia-3').qualifications, '');
  assert.equal(get('senate-2027-zamfara-37').name, 'MUHAMMAD SANUSI');
  assert.equal(get('senate-2027-zamfara-37').sourcePage, 127);
  assert.equal(senateCandidates.filter(c => !c.qualifications).length, 72);
  for (const c of senateCandidates) {
    assert.equal(c.office, 'Senate'); assert.equal(c.pwd, 'None'); assert.equal(c.remarks, '');
    assert.ok(Number.isInteger(c.age)); assert.ok(c.age >= 35 && c.age <= 84);
    assert.equal(c.bio, undefined); assert.equal(c.priorities, undefined);
  }
});

test('district-specific results match the supplied Lagos and FCT lists', () => {
  assert.deepEqual(getDistricts(candidates, 'Lagos', 'Senate'), ['Lagos Central', 'Lagos East', 'Lagos West']);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', office: 'Senate', district: 'Lagos Central' }).length, 11);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', office: 'Senate', district: 'Lagos East' }).length, 10);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', office: 'Senate', district: 'Lagos West' }).length, 15);
  assert.equal(filterCandidates(candidates, { state: 'Federal Capital Territory', office: 'Senate' }).length, 20);
});

test('downloadable source PDF matches the supplied document and recorded checksum', async () => {
  const pdf = await readFile(new URL('../sources/senate-2027.pdf', import.meta.url));
  const sha = createHash('sha256').update(pdf).digest('hex');
  assert.equal(sha, '5f02f98a5b406dff57e7e7093590573c491c9f66aa640c73a9f1b272f477590a');
  assert.equal(sha, senateSource.sha256);
});
