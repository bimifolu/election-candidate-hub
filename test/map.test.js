import test from 'node:test';
import assert from 'node:assert/strict';
import { states } from '../map-data.js';
import { candidates, filterCandidates } from '../data.js';

test('map includes each of Nigeria’s 36 states and the FCT exactly once', () => {
  const expected = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  assert.deepEqual(states.map(s => s.name).sort(), expected.sort());
  for (const state of states) { assert.ok(state.path.startsWith('M')); assert.ok(Number.isFinite(state.x)); assert.ok(Number.isFinite(state.y)); }
});
test('all imported Senate and House profiles belong to mapped states', () => {
  for (const c of candidates) assert.ok(states.some(s => s.name === c.state), `Unknown state: ${c.state}`);
  assert.equal(filterCandidates(candidates, { office: 'House of Representatives' }).length, 3560);
  assert.equal(filterCandidates(candidates, { office: 'Senate' }).length, 1303);
  assert.ok(filterCandidates(candidates, { state: 'Lagos', office: 'Senate' }).length > 0);
});
