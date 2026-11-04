import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { repsCandidates, repsSource } from '../reps-data.js';
import { candidates, filterCandidates, getDistricts } from '../data.js';

test('all 300 House pages and 3,560 candidates are represented', () => {
  assert.equal(repsSource.pages, 300);
  assert.equal(repsSource.candidateCount, 3560);
  assert.equal(repsCandidates.length, 3560);
  assert.equal(new Set(repsCandidates.map(c => c.id)).size, 3560);
  assert.equal(new Set(repsCandidates.map(c => c.state)).size, 37);
  assert.equal(new Set(repsCandidates.map(c => `${c.state}/${c.district}`)).size, 364);
  assert.equal(new Set(repsCandidates.map(c => c.sourcePage)).size, 300);
  for (const state of new Set(repsCandidates.map(c => c.state))) {
    const rows = repsCandidates.filter(c => c.state === state);
    assert.deepEqual(rows.map(c => c.serial), Array.from({ length: rows.length }, (_, i) => i + 1));
    assert.ok(getDistricts(repsCandidates, state, 'House of Representatives').length > 0);
  }
});

test('House values and source locations are preserved without inferred content', () => {
  const first = repsCandidates[0];
  assert.deepEqual([first.id, first.name, first.district, first.party, first.age, first.sourcePage], ['reps-2027-abia-1', 'CHIWUBA KALU', 'Aba North/Aba South', 'A', 44, 1]);
  const last = repsCandidates.at(-1);
  assert.deepEqual([last.id, last.name, last.district, last.party, last.age, last.sourcePage], ['reps-2027-zamfara-72', 'ABDULLAHI BILYAMINU', 'Gummi/Bukkuyum', 'YPP', 40, 300]);
  assert.equal(repsCandidates.filter(c => !c.qualifications).length, 194);
  for (const c of repsCandidates) {
    assert.equal(c.office, 'House of Representatives');
    assert.ok(c.pwd);
    assert.equal(c.remarks, '');
    assert.equal(c.bio, undefined);
    assert.equal(c.priorities, undefined);
  }
});

test('House constituency filtering remains separate from Senate districts', () => {
  const houseDistricts = getDistricts(candidates, 'Lagos', 'House of Representatives');
  assert.ok(houseDistricts.includes('Agege'));
  assert.equal(houseDistricts.length, 24);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', office: 'House of Representatives', district: 'Agege' }).length, 8);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', office: 'Senate', district: 'Agege' }).length, 0);
});

test('House source PDF matches its recorded checksum', async () => {
  const pdf = await readFile(new URL('../sources/reps-2027.pdf', import.meta.url));
  const sha = createHash('sha256').update(pdf).digest('hex');
  assert.equal(sha, '3705571b4182a285f1b0d38112608807bbd4a721579f998d18090ef86ccfde19');
  assert.equal(sha, repsSource.sha256);
});
