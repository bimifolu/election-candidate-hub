import { candidates, filterCandidates, getDistricts, senateSource } from './data.js';
import { states } from './map-data.js';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const field = value => escapeHtml(value === null || value === undefined || String(value).trim() === '' ? 'Not stated in PDF' : value);
const colors = new Set(['rose', 'sage', 'sand', 'lavender', 'peach', 'blue']);
const color = candidate => colors.has(candidate.color) ? candidate.color : 'sage';
const sourceUrl = './sources/senate-2027.pdf';
const sourceLink = candidate => `${sourceUrl}#page=${Number(candidate.sourcePage) || 1}`;
const sourceNotice = 'Details transcribed from the supplied 2027 Senate PDF. Candidate status and document authenticity have not been independently verified.';
const pageSize = 24;
let currentPage = 1;
let saved = [];
try {
  const stored = JSON.parse(localStorage.getItem('candidate-hub-saved') || '[]');
  if (Array.isArray(stored)) saved = [...new Set(stored.filter(id => candidates.some(c => c.id === id)))];
} catch { /* Browser storage may be unavailable. */ }
let savedOnly = false;
const selected = new Set();
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
function options(selector, values) {
  for (const value of [...new Set(values)].sort()) $(selector).add(new Option(value, value));
}
options('#state', states.map(s => s.name));
options('#map-state', states.map(s => s.name));
options('#party', candidates.map(c => c.party));
function refreshDistrictOptions() {
  const selector = $('#district');
  const state = $('#state').value;
  const office = $('input[name=office]:checked').value;
  selector.replaceChildren(new Option(state ? 'All senatorial districts' : 'Choose a state first', ''));
  selector.disabled = !state || office === 'House of Representatives';
  if (!selector.disabled) options('#district', getDistricts(candidates, state, 'Senate'));
}
function candidateCard(c) {
  const id = escapeHtml(c.id);
  const name = escapeHtml(c.name);
  return `<article class="candidate-card"><div class="card-portrait ${color(c)}"><div class="avatar" aria-hidden="true">${escapeHtml(c.initials)}</div><button class="save-card" data-save="${id}" aria-label="${saved.includes(c.id) ? 'Unsave' : 'Save'} ${name}" aria-pressed="${saved.includes(c.id)}">${saved.includes(c.id) ? '♥' : '♡'}</button><span class="sample-label">2027 SENATE · SUPPLIED PDF</span></div><div class="card-body"><span class="office-badge">${escapeHtml(c.office)}</span><h3>${name}</h3><p class="district">⌾ ${escapeHtml(c.district)} · ${escapeHtml(c.state)}</p><p class="party-name"><span class="party-dot"></span>${field(c.party)}</p><div class="priority-tags"><span>Age: ${field(c.age)}</span><span>Gender: ${field(c.gender)}</span></div><p class="card-qualification" title="${escapeHtml(c.qualifications)}">${field(c.qualifications)}</p><button class="profile-link" data-profile="${id}" aria-label="View ${name}'s profile">View details <span>↗</span></button></div><div class="card-bottom"><label><input type="checkbox" data-compare="${id}" ${selected.has(c.id) ? 'checked' : ''} aria-label="Compare ${name}"> Add to compare</label></div></article>`;
}
function render() {
  let list = filterCandidates(candidates, {
    query: $('#search').value, state: $('#state').value,
    office: $('input[name=office]:checked').value,
    party: $('#party').value, district: $('#district').value, savedOnly, saved,
  });
  if ($('#sort').value !== 'featured') list.sort((a, b) => a.name.localeCompare(b.name) * ($('#sort').value === 'az' ? 1 : -1));
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = list.slice(start, start + pageSize);
  $('#result-count').innerHTML = list.length ? `Showing <strong>${start + 1}–${start + visible.length}</strong> of <strong>${list.length}</strong> ${savedOnly ? 'saved ' : ''}candidates` : 'No candidates found';
  $('#saved-count').textContent = saved.length;
  $('#saved-button').classList.toggle('active', savedOnly);
  $('#saved-button').setAttribute('aria-pressed', String(savedOnly));
  const house = $('input[name=office]:checked').value === 'House of Representatives';
  const emptyTitle = house ? 'House candidate data not supplied' : savedOnly && !saved.length ? 'Your shortlist starts here.' : 'No candidates found.';
  const emptyText = house ? 'The supplied PDF contains Senate candidates only. A House of Representatives list has not been added.' : savedOnly && !saved.length ? 'Tap the heart on a candidate to save their profile.' : 'Try another name, state, district, or party, or clear your filters.';
  $('#candidate-grid').innerHTML = visible.length ? visible.map(candidateCard).join('') : `<div class="empty-state"><h3>${emptyTitle}</h3><p>${emptyText}</p><button class="primary-button" data-reset>Explore Senate candidates ↗</button></div>`;
  $('#pagination').hidden = list.length <= pageSize;
  $('#page-prev').disabled = currentPage === 1;
  $('#page-next').disabled = currentPage === pages;
  $('#page-status').textContent = `Page ${currentPage} of ${pages}`;
  updateCompare();
}
function updateCompare() {
  $('#compare-tray').hidden = !selected.size;
  $('#compare-count').textContent = selected.size;
  $('#compare-button').disabled = selected.size < 2;
}
function renderFromFirstPage() { currentPage = 1; render(); }
function reset() {
  $('#search').value = '';
  for (const selector of ['#state', '#party']) $(selector).value = '';
  $('#sort').value = 'featured';
  $('input[name=office][value=""]').checked = true;
  savedOnly = false;
  refreshDistrictOptions();
  renderFromFirstPage();
}
$('#search').addEventListener('input', renderFromFirstPage);
for (const selector of ['#party', '#district', '#sort']) $(selector).addEventListener('change', renderFromFirstPage);
$('#state').addEventListener('change', () => { refreshDistrictOptions(); renderFromFirstPage(); });
document.querySelectorAll('input[name=office]').forEach(input => input.addEventListener('change', () => { refreshDistrictOptions(); renderFromFirstPage(); }));
$('#reset').addEventListener('click', reset);
$('#saved-button').addEventListener('click', () => { savedOnly = !savedOnly; renderFromFirstPage(); $('#candidates').scrollIntoView({ behavior: 'smooth' }); });
for (const [selector, delta] of [['#page-prev', -1], ['#page-next', 1]]) $(selector).addEventListener('click', () => {
  currentPage += delta; render(); $('#result-count').focus();
});
$('#candidate-grid').addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  const profile = event.target.closest('[data-profile]');
  if (save) {
    const id = save.dataset.save;
    saved = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    try { localStorage.setItem('candidate-hub-saved', JSON.stringify(saved)); } catch { toast('Saved for this visit. Browser storage is unavailable.'); }
    render();
    document.querySelectorAll('[data-save]').forEach(button => { if (button.dataset.save === id) button.focus(); });
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
function openDialog(content) {
  $('#dialog-content').innerHTML = content;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
function showProfile(id, fromMap = false) {
  const c = candidates.find(candidate => candidate.id === id);
  if (!c) return;
  const facts = [['Party', c.party], ['Age (as listed)', c.age], ['Gender (as listed)', c.gender], ['PWD (as listed)', c.pwd], ['Qualification(s)', c.qualifications], ['Remarks', c.remarks]];
  openDialog(`${fromMap ? '<button class="modal-back" data-back-contestants>← Back to contestants</button>' : ''}<div class="profile-header"><div class="avatar ${color(c)}" aria-hidden="true">${escapeHtml(c.initials)}</div><div><h2 id="dialog-title">${escapeHtml(c.name)}</h2><p>${escapeHtml(c.district)} · ${escapeHtml(c.state)}</p><span class="office-badge">${escapeHtml(c.office)} · 2027 supplied list</span></div></div><h3 class="dialog-heading">Candidate details</h3><dl class="profile-facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${field(value)}</dd></div>`).join('')}</dl><div class="profile-source"><h3>Source record</h3><p>${escapeHtml(senateSource.filename || '2027 SENATE FINAL LIST OF CANDIDATES.pdf')}</p><a href="${sourceLink(c)}" target="_blank" rel="noopener">View PDF page ${Number(c.sourcePage)} · row ${Number(c.sourceRow || c.serial)} ↗</a></div><p class="demo-notice">${sourceNotice} Blank fields are shown as “Not stated in PDF”. Ages and other details are reproduced as listed.</p>`);
  if (fromMap) $('#dialog-content .modal-back').focus();
}
$('#compare-button').addEventListener('click', () => {
  const list = candidates.filter(c => selected.has(c.id));
  const rows = [['Office', c => c.office], ['Constituency', c => `${c.district}, ${c.state}`], ['Party', c => c.party], ['Age (as listed)', c => c.age], ['Gender (as listed)', c => c.gender], ['PWD (as listed)', c => c.pwd], ['Qualification(s)', c => c.qualifications], ['Remarks', c => c.remarks]];
  openDialog(`<h2 id="dialog-title" class="dialog-heading">A clearer view of your options.</h2><p class="dialog-copy">Compare details from the supplied Senate list. Check that the candidates represent the district relevant to you.</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="Candidate comparison table"><table class="comparison-table"><thead><tr><th scope="col">At a glance</th>${list.map(c => `<th scope="col">${escapeHtml(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([title, value]) => `<tr><th scope="row">${title}</th>${list.map(c => `<td>${field(value(c))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Source</th>${list.map(c => `<td><a href="${sourceLink(c)}" target="_blank" rel="noopener">PDF page ${Number(c.sourcePage)}, row ${Number(c.sourceRow || c.serial)} ↗</a></td>`).join('')}</tr></tbody></table></div><p class="demo-notice">${sourceNotice}</p>`);
});
function showGuide() {
  openDialog(`<h2 id="dialog-title" class="dialog-heading">Get to know your options.</h2><p class="dialog-copy">Explore candidate details from the supplied 2027 Senate list.</p><ol class="proposal-list"><li><strong>Find your community.</strong> Select a state on the map and choose Senate.</li><li><strong>Choose a senatorial district.</strong> Use the district filter to see contestants for your constituency.</li><li><strong>Read the source.</strong> Open a profile for the party, age, gender, qualifications, PWD entry, and remarks as listed. Each profile links to its PDF page.</li><li><strong>Make a shortlist.</strong> Save profiles with the heart button, or compare two or three candidates. Saved profiles stay in this browser.</li></ol><p class="demo-notice">${sourceNotice} House of Representatives data has not been supplied.</p><p class="dialog-copy"><a class="source-link" href="${sourceUrl}" target="_blank" rel="noopener">Open the supplied Senate PDF ↗</a></p>`);
}
$('#about-button').addEventListener('click', showGuide);
$('#guide-button').addEventListener('click', showGuide);
refreshDistrictOptions();
render();

let activeMapState = '';
let activeMapOffice = '';
let activeMapDistrict = '';
const map = $('#nigeria-map');
const labelOffsets = { Lagos: [-5, 8], 'Akwa Ibom': [4, 5], Anambra: [-3, 0], Imo: [-3, 0], Abia: [3, 3], 'Federal Capital Territory': [0, 0] };
map.innerHTML = states.map((s, index) => {
  const [dx, dy] = labelOffsets[s.name] || [0, 0];
  return `<g class="map-state tone-${index % 4}" role="button" tabindex="0" aria-label="${escapeHtml(s.name)}: choose an office" data-state="${escapeHtml(s.name)}"><title>${escapeHtml(s.name)}</title><path d="${escapeHtml(s.path)}"/><text x="${s.x + dx}" y="${s.y + dy}">${escapeHtml(s.name === 'Federal Capital Territory' ? 'FCT' : s.name)}</text></g>`;
}).join('');
// Draw labels above all state boundaries so neighbouring shapes cannot cover them.
map.querySelectorAll('text').forEach(label => {
  label.setAttribute('class', 'map-label');
  label.setAttribute('aria-hidden', 'true');
  map.appendChild(label);
});
function chooseState(name) {
  activeMapState = name; activeMapOffice = ''; activeMapDistrict = '';
  $('#map-state').value = name;
  document.querySelectorAll('.map-state').forEach(s => s.classList.toggle('selected', s.dataset.state === name));
  openDialog(`<p class="eyebrow">YOUR REPRESENTATION STARTS HERE</p><h2 id="dialog-title" class="state-title">${escapeHtml(name)}</h2><p class="dialog-copy">Which office would you like to explore?</p><div class="office-choices"><button data-office="Senate"><span class="office-icon">▥</span><h3>Senate</h3><p>Choose a senatorial district in ${escapeHtml(name)} and explore the supplied list.</p><span class="office-arrow">Choose district ↗</span></button><button data-office="House of Representatives"><span class="office-icon">▦</span><h3>House of Representatives</h3><p>Candidate data for this office has not been supplied.</p><span class="office-arrow">View availability ↗</span></button></div><p class="demo-notice">Senate records come from the supplied 2027 PDF. They have not been independently verified.</p>`);
}
function showStateContestants(office, focusFilter = false) {
  if (office !== activeMapOffice) activeMapDistrict = '';
  activeMapOffice = office;
  const districts = office === 'Senate' ? getDistricts(candidates, activeMapState, office) : [];
  if (activeMapDistrict && !districts.includes(activeMapDistrict)) activeMapDistrict = '';
  const list = filterCandidates(candidates, { state: activeMapState, office, district: activeMapDistrict });
  const selector = office === 'Senate' ? `<div class="district-choice"><label for="senate-district">Filter by senatorial district / constituency</label><select id="senate-district"><option value="">All senatorial districts (${districts.length})</option>${districts.map(d => `<option value="${escapeHtml(d)}"${activeMapDistrict === d ? ' selected' : ''}>${escapeHtml(d)}</option>`).join('')}</select></div>` : '';
  $('#dialog-content').innerHTML = `<button class="modal-back" data-back-state>← Choose another office</button><h2 id="dialog-title" class="state-title">${escapeHtml(activeMapState)}</h2><p class="office-subtitle">${escapeHtml(office)}</p>${selector}<p class="dialog-copy" id="state-result-count" role="status" aria-live="polite">${list.length} contestant${list.length === 1 ? '' : 's'}${office === 'Senate' ? ' in the supplied PDF' : ''}${activeMapDistrict ? ` · ${escapeHtml(activeMapDistrict)}` : ''}</p>${list.length ? `<div class="state-contestants">${list.map(c => `<button class="state-contestant" data-state-profile="${escapeHtml(c.id)}"><span class="avatar ${color(c)}" aria-hidden="true">${escapeHtml(c.initials)}</span><span><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.district)}</small><small>${field(c.party)} · Age: ${field(c.age)} · Gender: ${field(c.gender)}</small></span><span class="contestant-arrow">↗</span></button>`).join('')}</div>` : `<div class="empty-state"><span class="office-icon">▤</span><h3>${office === 'Senate' ? 'No contestants found' : 'House candidate data not supplied'}</h3><p>${office === 'Senate' ? 'There are no records for this selection in the supplied dataset.' : 'The uploaded PDF contains Senate candidates only.<br>A House of Representatives list has not been added.'}</p></div>`}<p class="demo-notice">${office === 'Senate' ? sourceNotice : 'An empty list means data has not been added here. It does not mean there are no real contestants.'}</p>`;
  if (focusFilter && $('#senate-district')) $('#senate-district').focus();
  else $('#dialog-content .modal-back').focus();
}
map.addEventListener('click', event => { const state = event.target.closest('[data-state]'); if (state) chooseState(state.dataset.state); });
map.addEventListener('keydown', event => { const state = event.target.closest('[data-state]'); if (state && ['Enter', ' '].includes(event.key)) { event.preventDefault(); chooseState(state.dataset.state); } });
map.addEventListener('pointerover', event => { const state = event.target.closest('[data-state]'); if (state) $('#map-hover').textContent = state.dataset.state; });
map.addEventListener('focusin', event => { const state = event.target.closest('[data-state]'); if (state) $('#map-hover').textContent = state.dataset.state; });
$('#map-state').addEventListener('change', event => { if (event.target.value) chooseState(event.target.value); });
$('#dialog-content').addEventListener('change', event => {
  if (event.target.id === 'senate-district') { activeMapDistrict = event.target.value; showStateContestants('Senate', true); }
});
$('#dialog-content').addEventListener('click', event => {
  const office = event.target.closest('[data-office]');
  const profile = event.target.closest('[data-state-profile]');
  if (office) showStateContestants(office.dataset.office, office.dataset.office === 'Senate');
  if (event.target.closest('[data-back-state]')) chooseState(activeMapState);
  if (event.target.closest('[data-back-contestants]')) showStateContestants(activeMapOffice, true);
  if (profile) showProfile(profile.dataset.stateProfile, true);
});
