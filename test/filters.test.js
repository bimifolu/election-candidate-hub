import test from 'node:test';
import assert from 'node:assert/strict';
import { candidates, filterCandidates } from '../data.js';

test('search matches names, constituencies and priorities without case sensitivity', () => {
  assert.deepEqual(filterCandidates(candidates, { query: '  AMARA  ' }).map(c => c.id), ['amara']);
  assert.deepEqual(filterCandidates(candidates, { query: 'Ikeja' }).map(c => c.id), ['tunde']);
  assert.equal(filterCandidates(candidates, { query: 'Healthcare' }).length, 3);
});
test('filters combine and do not return candidates outside the selected office', () => {
  assert.deepEqual(filterCandidates(candidates, { state: 'Lagos', office: 'Senate', issue: 'Education' }).map(c => c.id), ['amara']);
  assert.equal(filterCandidates(candidates, { state: 'Lagos', party: 'People’s Coalition' }).length, 0);
});
test('saved filter respects the shortlist and other filters', () => {
  assert.equal(filterCandidates(candidates, { savedOnly: true }).length, 0);
  assert.deepEqual(filterCandidates(candidates, { savedOnly: true, saved: ['amara', 'emi'], state: 'Rivers' }).map(c => c.id), ['emi']);
  assert.equal(filterCandidates(candidates).length, 6);
});
