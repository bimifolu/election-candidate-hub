import test from 'node:test';
import assert from 'node:assert/strict';
import { candidates, filterCandidates, getDistricts } from '../data.js';

const records = [
  { id: 'one', name: 'ALPHA CANDIDATE', state: 'Lagos', district: 'Lagos Central', office: 'Senate', party: 'AAA', qualifications: 'FSLC B.Sc.' },
  { id: 'two', name: 'BETA CANDIDATE', state: 'Lagos', district: 'Lagos East', office: 'Senate', party: 'BBB', qualifications: '' },
  { id: 'three', name: 'GAMMA CANDIDATE', state: 'Ogun', district: 'Ogun Central', office: 'Senate', party: 'AAA', qualifications: 'SSCE' },
  { id: 'four', name: 'DELTA CANDIDATE', state: 'Lagos', district: 'Ikeja', office: 'House of Representatives', party: 'AAA', qualifications: 'SSCE' },
];

test('search trims input and matches names, constituencies, parties and qualifications', () => {
  assert.deepEqual(filterCandidates(records, { query: '  alpha  ' }).map(c => c.id), ['one']);
  assert.deepEqual(filterCandidates(records, { query: 'lagos east' }).map(c => c.id), ['two']);
  assert.deepEqual(filterCandidates(records, { query: 'b.sc.' }).map(c => c.id), ['one']);
  assert.equal(filterCandidates(records, { query: 'AAA' }).length, 3);
});

test('state, office, district and party filters intersect', () => {
  assert.deepEqual(filterCandidates(records, { state: 'Lagos', office: 'Senate', district: 'Lagos Central', party: 'AAA' }).map(c => c.id), ['one']);
  assert.equal(filterCandidates(records, { state: 'Lagos', district: 'Ogun Central' }).length, 0);
  assert.equal(filterCandidates(records, { district: 'Lagos East', party: 'AAA' }).length, 0);
  assert.equal(filterCandidates(records, { office: 'House of Representatives' }).length, 1);
});

test('district choices depend on the selected state and office', () => {
  assert.deepEqual(getDistricts(records, 'Lagos'), ['Lagos Central', 'Lagos East']);
  assert.deepEqual(getDistricts(records, 'Lagos', 'House of Representatives'), ['Ikeja']);
  assert.deepEqual(getDistricts(records, ''), []);
  assert.deepEqual(getDistricts(records, 'Kaduna'), []);
});

test('saved filtering intersects the other filters without retaining obsolete demo IDs', () => {
  assert.equal(filterCandidates(records, { savedOnly: true }).length, 0);
  assert.deepEqual(filterCandidates(records, { savedOnly: true, saved: ['one', 'two'], district: 'Lagos East' }).map(c => c.id), ['two']);
  assert.equal(filterCandidates(candidates, { savedOnly: true, saved: ['amara', 'zainab', 'tunde'] }).length, 0);
});
