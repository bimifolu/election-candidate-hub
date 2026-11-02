import { candidates, filterCandidates } from './data.js';
import { states } from './map-data.js';

const $ = selector => document.querySelector(selector);
let saved = [];
try { const stored = JSON.parse(localStorage.getItem('candidate-hub-saved') || '[]'); if (Array.isArray(stored)) saved = [...new Set(stored.filter(id => candidates.some(c => c.id === id)))]; } catch { /* Storage can be unavailable in private contexts. */ }
let savedOnly = false;
const selected = new Set();
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500); }
function options(selector, values) { for (const value of [...new Set(values)].sort()) $(selector).add(new Option(value, value)); }
options('#state', states.map(s => s.name));
options('#map-state', states.map(s => s.name));
options('#party', candidates.map(c => c.party));
options('#issue', candidates.flatMap(c => c.priorities));
function render() {
  let list = filterCandidates(candidates, { query: $('#search').value, state: $('#state').value, office: $('input[name=office]:checked').value, party: $('#party').value, issue: $('#issue').value, savedOnly, saved });
  if ($('#sort').value !== 'featured') list.sort((a, b) => a.name.localeCompare(b.name) * ($('#sort').value === 'az' ? 1 : -1));
  $('#result-count').innerHTML = `Showing <strong>${list.length}</strong> ${savedOnly ? 'saved ' : ''}candidate${list.length === 1 ? '' : 's'} <span>· Demo directory</span>`;
  $('#saved-count').textContent = saved.length;
  $('#saved-button').classList.toggle('active', savedOnly);
  $('#saved-button').setAttribute('aria-pressed', String(savedOnly));
  $('#candidate-grid').innerHTML = list.length ? list.map(c => `<article class="candidate-card"><div class="card-portrait ${c.color}"><div class="avatar" aria-hidden="true">${c.initials}</div><button class="save-card" data-save="${c.id}" aria-label="${saved.includes(c.id) ? 'Unsave' : 'Save'} ${c.name}" aria-pressed="${saved.includes(c.id)}">${saved.includes(c.id) ? '♥' : '♡'}</button><span class="sample-label">FICTIONAL PROFILE</span></div><div class="card-body"><span class="office-badge">${c.office}</span><h3>${c.name}</h3><p class="district">⌾ ${c.district} · ${c.state}</p><p class="party-name"><span class="party-dot"></span>${c.party}</p><div class="priority-tags">${c.priorities.slice(0, 2).map(p => `<span>${p}</span>`).join('')}</div><button class="profile-link" data-profile="${c.id}" aria-label="View ${c.name}'s profile">View profile <span>↗</span></button></div><div class="card-bottom"><label><input type="checkbox" data-compare="${c.id}" ${selected.has(c.id) ? 'checked' : ''} aria-label="Compare ${c.name}"> Add to compare</label></div></article>`).join('') : `<div class="empty-state"><h3>${savedOnly && !saved.length ? 'Your shortlist starts here.' : 'No candidates found.'}</h3><p>${savedOnly && !saved.length ? 'Tap the heart on a candidate to save their profile.' : 'Try another name, state, or priority, or clear your filters.'}</p><button class="primary-button" data-reset>Explore all candidates ↗</button></div>`;
  updateCompare();
}
function updateCompare() { $('#compare-tray').hidden = !selected.size; $('#compare-count').textContent = selected.size; $('#compare-button').disabled = selected.size < 2; }
function reset() { $('#search').value = ''; for (const s of ['#state', '#party', '#issue']) $(s).value = ''; $('input[name=office][value=""]').checked = true; savedOnly = false; render(); }
$('#search').addEventListener('input', render);
for (const select of ['#state', '#party', '#issue', '#sort']) $(select).addEventListener('change', render);
document.querySelectorAll('input[name=office]').forEach(input => input.addEventListener('change', render));
$('#reset').addEventListener('click', reset);
$('#saved-button').addEventListener('click', () => { savedOnly = !savedOnly; render(); $('#candidates').scrollIntoView({ behavior: 'smooth' }); });
$('#candidate-grid').addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  const profile = event.target.closest('[data-profile]');
  if (save) {
    const id = save.dataset.save;
    saved = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    try { localStorage.setItem('candidate-hub-saved', JSON.stringify(saved)); } catch { toast('Saved for this visit. Browser storage is unavailable.'); }
    render();
    $(`[data-save="${id}"]`)?.focus();
  }
  if (profile) showProfile(profile.dataset.profile);
  if (event.target.closest('[data-reset]')) reset();
});
$('#candidate-grid').addEventListener('change', event => {
  const box = event.target.closest('[data-compare]');
  if (!box) return;
  if (box.checked && selected.size >= 3) { box.checked = false; toast('Choose up to 3 candidates. Remove one to add another.'); return; }
  if (box.checked) selected.add(box.dataset.compare); else selected.delete(box.dataset.compare);
  updateCompare();
});
$('#clear-compare').addEventListener('click', () => { selected.clear(); render(); });
const dialog = $('#detail-dialog');
function openDialog(content) { $('#dialog-content').innerHTML = content; dialog.setAttribute('aria-labelledby', 'dialog-title'); dialog.showModal(); }
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
function showProfile(id) {
  const c = candidates.find(candidate => candidate.id === id);
  openDialog(`<div class="profile-header"><div class="avatar ${c.color}" aria-hidden="true">${c.initials}</div><div><h2 id="dialog-title">${c.name}</h2><p>${c.occupation}</p><span class="office-badge">${c.office}</span></div></div><p class="dialog-copy">${c.district}, ${c.state} · ${c.party}</p><p class="dialog-copy">${c.bio}</p><h3 class="dialog-heading">What they stand for</h3><div class="priority-tags">${c.priorities.map(p => `<span>${p}</span>`).join('')}</div><h3 class="dialog-heading">Sample platform</h3><ul class="proposal-list">${c.proposals.map(p => `<li>${p}</li>`).join('')}</ul><p class="demo-notice">This is a fictional profile for demonstration. The name, party, biography, and proposals do not describe a verified electoral candidate.</p>`);
}
$('#compare-button').addEventListener('click', () => {
  const list = candidates.filter(c => selected.has(c.id));
  const rows = [['Office', c => c.office], ['Constituency', c => `${c.district}, ${c.state}`], ['Party', c => c.party], ['Background', c => c.occupation], ['Priorities', c => c.priorities.join(', ')], ['Sample proposals', c => `<ul>${c.proposals.map(p => `<li>${p}</li>`).join('')}</ul>`]];
  openDialog(`<h2 id="dialog-title" class="dialog-heading">A clearer view of your options.</h2><p class="dialog-copy">Compare the sample profiles side by side. Candidates may represent different constituencies or offices.</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="Candidate comparison table"><table class="comparison-table"><thead><tr><th scope="col">At a glance</th>${list.map(c => `<th scope="col">${c.name}</th>`).join('')}</tr></thead><tbody>${rows.map(([title, value]) => `<tr><th scope="row">${title}</th>${list.map(c => `<td>${value(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="demo-notice">All profiles and political parties in this prototype are fictional. This comparison is not an endorsement.</p>`);
});
function showGuide() { openDialog(`<h2 id="dialog-title" class="dialog-heading">Get to know your options.</h2><p class="dialog-copy">Candidate Hub helps you explore potential representatives and compare their priorities.</p><ol class="proposal-list"><li><strong>Find your community.</strong> Filter by state and office, or search for a constituency.</li><li><strong>Look beyond the name.</strong> Open a profile to explore its background, priorities, and sample proposals.</li><li><strong>Make a shortlist.</strong> Save profiles with the heart button. Saved profiles stay in this browser.</li><li><strong>Compare thoughtfully.</strong> Select two or three candidates and open the comparison. Check that candidates represent the office and constituency relevant to you.</li></ol><p class="demo-notice">This is an independent prototype with fictional data. Before making a real voting decision, confirm eligibility, candidates, constituencies, and election information with Nigeria’s electoral commission and reliable primary sources.</p>`); }
$('#about-button').addEventListener('click', showGuide);
$('#guide-button').addEventListener('click', showGuide);
render();

let activeMapState = '';
let activeMapOffice = '';
const map = $('#nigeria-map');
const labelOffsets = { Lagos: [-5, 8], 'Akwa Ibom': [4, 5], Anambra: [-3, 0], Imo: [-3, 0], Abia: [3, 3], 'Federal Capital Territory': [0, 0] };
map.innerHTML = states.map((s, index) => {
  const [dx, dy] = labelOffsets[s.name] || [0, 0];
  return `<g class="map-state tone-${index % 4}" role="button" tabindex="0" aria-label="${s.name}: choose an office" data-state="${s.name}"><title>${s.name}</title><path d="${s.path}"/><text x="${s.x + dx}" y="${s.y + dy}">${s.name === 'Federal Capital Territory' ? 'FCT' : s.name}</text></g>`;
}).join('');
// Keep labels above every boundary so adjacent state shapes cannot cover them.
map.querySelectorAll('text').forEach(label => {
  label.setAttribute('class', 'map-label');
  label.setAttribute('aria-hidden', 'true');
  map.appendChild(label);
});
function chooseState(name) {
  activeMapState = name; activeMapOffice = '';
  $('#map-state').value = name;
  document.querySelectorAll('.map-state').forEach(s => s.classList.toggle('selected', s.dataset.state === name));
  openDialog(`<p class="eyebrow">YOUR REPRESENTATION STARTS HERE</p><h2 id="dialog-title" class="state-title">${name}</h2><p class="dialog-copy">Which office would you like to explore?</p><div class="office-choices"><button data-office="Senate"><span class="office-icon">▥</span><h3>Senate</h3><p>Explore contestants for senatorial districts in ${name}.</p><span class="office-arrow">View contestants ↗</span></button><button data-office="House of Representatives"><span class="office-icon">▦</span><h3>House of Representatives</h3><p>Explore contestants for federal constituencies in ${name}.</p><span class="office-arrow">View contestants ↗</span></button></div><p class="demo-notice">Demo only. Contestant lists are not verified election records.</p>`);
}
function showStateContestants(office) {
  activeMapOffice = office;
  const list = filterCandidates(candidates, { state: activeMapState, office });
  $('#dialog-content').innerHTML = `<button class="modal-back" data-back-state>← Choose another office</button><h2 id="dialog-title" class="state-title">${activeMapState}</h2><p class="office-subtitle">${office}</p><p class="dialog-copy">${list.length} sample contestant${list.length === 1 ? '' : 's'} · Fictional profiles</p>${list.length ? `<div class="state-contestants">${list.map(c => `<button class="state-contestant" data-state-profile="${c.id}"><span class="avatar ${c.color}">${c.initials}</span><span><strong>${c.name}</strong><small>${c.district}</small><small>${c.party}</small></span><span class="contestant-arrow">↗</span></button>`).join('')}</div>` : '<div class="empty-state"><span class="office-icon">▤</span><h3>No contestants added yet</h3><p>This state and office do not have profiles in the demo.<br>This does not mean there are no real contestants.</p></div>'}<p class="demo-notice">All listed names, parties, and platforms are fictional examples. Real contestants need to be added and verified for a specific election.</p>`;
  $('#dialog-content .modal-back').focus();
}
map.addEventListener('click', event => { const state = event.target.closest('[data-state]'); if (state) chooseState(state.dataset.state); });
map.addEventListener('keydown', event => { const state = event.target.closest('[data-state]'); if (state && ['Enter', ' '].includes(event.key)) { event.preventDefault(); chooseState(state.dataset.state); } });
map.addEventListener('pointerover', event => { const state = event.target.closest('[data-state]'); if (state) $('#map-hover').textContent = state.dataset.state; });
map.addEventListener('focusin', event => { const state = event.target.closest('[data-state]'); if (state) $('#map-hover').textContent = state.dataset.state; });
$('#map-state').addEventListener('change', event => { if (event.target.value) chooseState(event.target.value); });
$('#dialog-content').addEventListener('click', event => {
  const office = event.target.closest('[data-office]');
  const profile = event.target.closest('[data-state-profile]');
  if (office) showStateContestants(office.dataset.office);
  if (event.target.closest('[data-back-state]')) { dialog.close(); chooseState(activeMapState); }
  if (event.target.closest('[data-back-contestants]')) showStateContestants(activeMapOffice);
  if (profile) { showProfile(profile.dataset.stateProfile); $('#dialog-content').insertAdjacentHTML('afterbegin', '<button class="modal-back" data-back-contestants>← Back to contestants</button>'); $('#dialog-content .modal-back').focus(); }
});
