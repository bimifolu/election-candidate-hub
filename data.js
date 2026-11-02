import { senateCandidates, senateSource } from './senate-data.js';
export { senateSource };

const colors = ['rose', 'sage', 'sand', 'lavender', 'peach', 'blue'];
// Keep the supplied document's names and qualifications intact. These extra
// fields only support the directory's visual presentation.
export const candidates = senateCandidates.map((candidate, index) => ({
  ...candidate,
  initials: candidate.name.trim().split(/\s+/).slice(0, 2).map(word => [...word][0]).join(''),
  color: colors[index % colors.length],
}));

export function getDistricts(items, state, office = 'Senate') {
  if (!state) return [];
  return [...new Set(items.filter(c => c.state === state && c.office === office).map(c => c.district))].sort((a, b) => a.localeCompare(b));
}

export function filterCandidates(items, { query = '', state = '', office = '', district = '', party = '', savedOnly = false, saved = [] } = {}) {
  const term = query.trim().toLocaleLowerCase();
  const savedIds = new Set(saved);
  return items.filter(c => (
    (!term || [c.name, c.state, c.district, c.party, c.qualifications].filter(Boolean).join(' ').toLocaleLowerCase().includes(term)) &&
    (!state || c.state === state) &&
    (!office || c.office === office) &&
    (!district || c.district === district) &&
    (!party || c.party === party) &&
    (!savedOnly || savedIds.has(c.id))
  ));
}
