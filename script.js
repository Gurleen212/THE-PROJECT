/* =========================================================
   ResQnet — demo data layer + UI logic
   Everything lives in memory (DB object below). No backend,
   no storage — reload resets the network to its seed state.
   ========================================================= */

const GROUPS = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];
const BED_TYPES = ['ICU','General','Ventilator'];
const CITIES = ['Rajpura','Patiala','Chandigarh','Mohali','Ludhiana'];
const LOW_STOCK = 6;      // below this: "low"
const CRITICAL_STOCK = 3; // below this: "critical"

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const DB = {
  hospitals: [
    { id: 'h1', name: 'Rajpura Civil Hospital', city: 'Rajpura', km: 1.8,
      beds: { ICU: { total: 8, occupied: 6 }, General: { total: 40, occupied: 31 }, Ventilator: { total: 4, occupied: 3 } } },
    { id: 'h2', name: 'Patiala Heart Institute', city: 'Patiala', km: 0.9,
      beds: { ICU: { total: 12, occupied: 9 }, General: { total: 60, occupied: 40 }, Ventilator: { total: 6, occupied: 5 } } },
    { id: 'h3', name: 'Chandigarh Sukhna Multispecialty', city: 'Chandigarh', km: 3.4,
      beds: { ICU: { total: 20, occupied: 12 }, General: { total: 90, occupied: 58 }, Ventilator: { total: 10, occupied: 4 } } },
    { id: 'h4', name: 'Mohali Metro Hospital', city: 'Mohali', km: 2.2,
      beds: { ICU: { total: 10, occupied: 10 }, General: { total: 45, occupied: 20 }, Ventilator: { total: 5, occupied: 5 } } },
    { id: 'h5', name: 'Ludhiana Riverside Hospital', city: 'Ludhiana', km: 4.1,
      beds: { ICU: { total: 14, occupied: 8 }, General: { total: 70, occupied: 52 }, Ventilator: { total: 7, occupied: 2 } } },
  ],
  bloodbanks: [
    { id: 'b1', name: 'Rajpura Red Cross Blood Bank', city: 'Rajpura', km: 1.4,
      stock: { 'O+': 11, 'O-': 2, 'A+': 9, 'A-': 3, 'B+': 14, 'B-': 1, 'AB+': 5, 'AB-': 1 } },
    { id: 'b2', name: 'Patiala Lifeline Blood Bank', city: 'Patiala', km: 0.6,
      stock: { 'O+': 18, 'O-': 7, 'A+': 12, 'A-': 5, 'B+': 9, 'B-': 2, 'AB+': 4, 'AB-': 2 } },
    { id: 'b3', name: 'Chandigarh Regional Blood Centre', city: 'Chandigarh', km: 3.0,
      stock: { 'O+': 22, 'O-': 9, 'A+': 20, 'A-': 8, 'B+': 17, 'B-': 6, 'AB+': 9, 'AB-': 4 } },
    { id: 'b4', name: 'Mohali Central Blood Bank', city: 'Mohali', km: 2.5,
      stock: { 'O+': 6, 'O-': 1, 'A+': 4, 'A-': 2, 'B+': 5, 'B-': 0, 'AB+': 2, 'AB-': 0 } },
    { id: 'b5', name: 'Ludhiana Sewa Blood Bank', city: 'Ludhiana', km: 3.9,
      stock: { 'O+': 15, 'O-': 4, 'A+': 10, 'A-': 3, 'B+': 8, 'B-': 3, 'AB+': 3, 'AB-': 1 } },
  ],
  ambulanceServices: [
    { id: 'a1', name: 'Rajpura Rapid Response', city: 'Rajpura', km: 1.2,
      fleet: [{ id: 'a1-1', code: 'AMB-101', status: 'Available' }, { id: 'a1-2', code: 'AMB-102', status: 'En Route' }, { id: 'a1-3', code: 'AMB-103', status: 'Busy' }] },
    { id: 'a2', name: 'Patiala 24x7 Ambulance Service', city: 'Patiala', km: 0.8,
      fleet: [{ id: 'a2-1', code: 'AMB-201', status: 'Available' }, { id: 'a2-2', code: 'AMB-202', status: 'Available' }, { id: 'a2-3', code: 'AMB-203', status: 'Busy' }] },
    { id: 'a3', name: 'Chandigarh City Ambulance Trust', city: 'Chandigarh', km: 2.9,
      fleet: [{ id: 'a3-1', code: 'AMB-301', status: 'Busy' }, { id: 'a3-2', code: 'AMB-302', status: 'Busy' }, { id: 'a3-3', code: 'AMB-303', status: 'En Route' }] },
    { id: 'a4', name: 'Mohali QuickCare Ambulance', city: 'Mohali', km: 2.0,
      fleet: [{ id: 'a4-1', code: 'AMB-401', status: 'Available' }, { id: 'a4-2', code: 'AMB-402', status: 'Available' }] },
    { id: 'a5', name: 'Ludhiana Lifeline Ambulance', city: 'Ludhiana', km: 3.6,
      fleet: [{ id: 'a5-1', code: 'AMB-501', status: 'Available' }, { id: 'a5-2', code: 'AMB-502', status: 'En Route' }, { id: 'a5-3', code: 'AMB-503', status: 'Busy' }] },
  ],
  donors: [
    { id: 'd1', name: 'Manpreet Kaur', group: 'O-', city: 'Rajpura', lastDonation: daysAgo(140) },
    { id: 'd2', name: 'Rohan Verma', group: 'O+', city: 'Rajpura', lastDonation: daysAgo(20) },
    { id: 'd3', name: 'Simran Gill', group: 'B+', city: 'Patiala', lastDonation: daysAgo(200) },
    { id: 'd4', name: 'Arjun Mehta', group: 'A+', city: 'Chandigarh', lastDonation: daysAgo(45) },
    { id: 'd5', name: 'Harpreet Singh', group: 'O-', city: 'Mohali', lastDonation: daysAgo(95) },
    { id: 'd6', name: 'Neha Kapoor', group: 'AB+', city: 'Ludhiana', lastDonation: daysAgo(300) },
    { id: 'd7', name: 'Jaspreet Bhatia', group: 'B-', city: 'Mohali', lastDonation: daysAgo(10) },
    { id: 'd8', name: 'Aditi Sharma', group: 'A-', city: 'Patiala', lastDonation: daysAgo(120) },
    { id: 'd9', name: 'Karanveer Sidhu', group: 'O+', city: 'Chandigarh', lastDonation: daysAgo(60) },
    { id: 'd10', name: 'Priya Nair', group: 'AB-', city: 'Rajpura', lastDonation: daysAgo(400) },
    { id: 'd11', name: 'Gurdeep Brar', group: 'B+', city: 'Mohali', lastDonation: daysAgo(180) },
    { id: 'd12', name: 'Fatima Sheikh', group: 'O-', city: 'Ludhiana', lastDonation: daysAgo(250) },
  ],
  requests: [],
  notifications: [],
  facilityLogin: { hospital: 'h1', bloodbank: 'b1', ambulance: 'a1' },
};

let reqCounter = 1;
let noticeCounter = 1;

/* ---------------- helpers ---------------- */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nowLabel() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const diff = Date.now() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function eligibility(donor) {
  const d = daysSince(donor.lastDonation);
  return d >= 90 ? { eligible: true, daysLeft: 0 } : { eligible: false, daysLeft: 90 - d };
}

function bloodStatus(units) {
  if (units < CRITICAL_STOCK) return 'critical';
  if (units < LOW_STOCK) return 'low';
  return 'ok';
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---------------- ranking / matching ---------------- */

// Lower score = better match. Same city is strongly preferred, then
// distance, then how much availability the resource has to spare.
function rankHospitalsFor(bedType, city) {
  return DB.hospitals
    .map(h => ({ h, avail: h.beds[bedType].total - h.beds[bedType].occupied }))
    .sort((a, b) => {
      const scoreA = (a.h.city === city ? 0 : 50) + a.h.km - Math.min(a.avail, 10);
      const scoreB = (b.h.city === city ? 0 : 50) + b.h.km - Math.min(b.avail, 10);
      return scoreA - scoreB;
    })
    .map(x => x.h);
}

function rankBanksFor(group, city) {
  return DB.bloodbanks
    .map(b => ({ b, units: b.stock[group] }))
    .sort((a, b) => {
      const scoreA = (a.b.city === city ? 0 : 50) + a.b.km - Math.min(a.units, 10);
      const scoreB = (b.b.city === city ? 0 : 50) + b.b.km - Math.min(b.units, 10);
      return scoreA - scoreB;
    })
    .map(x => x.b);
}

function rankAmbulancesFor(city) {
  return DB.ambulanceServices
    .map(a => ({ a, free: a.fleet.filter(v => v.status === 'Available').length }))
    .sort((a, b) => {
      const scoreA = (a.a.city === city ? 0 : 50) + a.a.km - Math.min(a.free, 10);
      const scoreB = (b.a.city === city ? 0 : 50) + b.a.km - Math.min(b.free, 10);
      return scoreA - scoreB;
    })
    .map(x => x.a);
}

function hasAvailability(type, facility, detail) {
  if (type === 'bed') return facility.beds[detail.bedType].total - facility.beds[detail.bedType].occupied > 0;
  if (type === 'blood') return facility.stock[detail.group] > 0;
  if (type === 'ambulance') return facility.fleet.some(v => v.status === 'Available');
  return false;
}

/* ---------------- requests ---------------- */

function createRequest(type, detail, city, urgency, patientName) {
  let candidates;
  if (type === 'bed') candidates = rankHospitalsFor(detail.bedType, city);
  else if (type === 'blood') candidates = rankBanksFor(detail.group, city);
  else candidates = rankAmbulancesFor(city);

  const matched = candidates.find(f => hasAvailability(type, f, detail));

  const req = {
    id: 'r' + reqCounter++,
    type, detail, city, urgency, patientName,
    candidates: candidates.map(f => f.id),
    matchedId: matched ? matched.id : null,
    status: matched ? 'Matched' : 'Unmatched',
    log: [{ time: nowLabel(), text: matched
      ? `Broadcast sent — matched to ${matched.name}`
      : 'Broadcast sent — no facility currently has availability' }],
  };
  DB.requests.unshift(req);
  return req;
}

function facilityListFor(type) {
  if (type === 'bed') return DB.hospitals;
  if (type === 'blood') return DB.bloodbanks;
  return DB.ambulanceServices;
}

function requestsFor(type, facilityId) {
  return DB.requests.filter(r => r.type === type && r.matchedId === facilityId);
}

function acceptRequest(reqId) {
  const req = DB.requests.find(r => r.id === reqId);
  if (!req) return;
  req.status = 'Confirmed';
  const facility = facilityListFor(req.type).find(f => f.id === req.matchedId);
  req.log.push({ time: nowLabel(), text: `Accepted by ${facility.name}` });
  renderAll();
  toast('Request confirmed.');
}

function rejectRequest(reqId) {
  const req = DB.requests.find(r => r.id === reqId);
  if (!req) return;
  const facility = facilityListFor(req.type).find(f => f.id === req.matchedId);
  const idx = req.candidates.indexOf(req.matchedId);
  const rest = req.candidates.slice(idx + 1);
  const nextId = rest.find(id => {
    const f = facilityListFor(req.type).find(x => x.id === id);
    return f && hasAvailability(req.type, f, req.detail);
  });

  if (nextId) {
    const nextFacility = facilityListFor(req.type).find(f => f.id === nextId);
    req.log.push({ time: nowLabel(), text: `Declined by ${facility.name} — redirected to ${nextFacility.name}` });
    req.matchedId = nextId;
    req.status = 'Matched';
  } else {
    req.log.push({ time: nowLabel(), text: `Declined by ${facility.name} — no other facility available nearby` });
    req.matchedId = null;
    req.status = 'Unmatched';
  }
  renderAll();
  toast('Request declined and redirected where possible.');
}

function fulfillRequest(reqId) {
  const req = DB.requests.find(r => r.id === reqId);
  if (!req) return;
  const facility = facilityListFor(req.type).find(f => f.id === req.matchedId);

  if (req.type === 'bed') {
    facility.beds[req.detail.bedType].occupied += 1;
  } else if (req.type === 'blood') {
    facility.stock[req.detail.group] = Math.max(0, facility.stock[req.detail.group] - 1);
    checkShortage(facility, req.detail.group);
  } else if (req.type === 'ambulance') {
    const v = facility.fleet.find(v => v.status === 'Available');
    if (v) v.status = 'Busy';
  }

  req.status = 'Fulfilled';
  req.log.push({ time: nowLabel(), text: `Fulfilled by ${facility.name}` });
  renderAll();
  toast('Marked fulfilled — inventory updated.');
}

/* ---------------- donor recall ---------------- */

function checkShortage(bank, group) {
  const units = bank.stock[group];
  if (units >= LOW_STOCK) return;
  triggerRecall(bank, group, units < CRITICAL_STOCK ? 'critical' : 'low');
}

function triggerRecall(bank, group, severity) {
  const eligible = DB.donors.filter(d => d.city === bank.city && d.group === group && eligibility(d).eligible);
  if (eligible.length === 0) {
    DB.notifications.unshift({
      id: 'n' + noticeCounter++, time: nowLabel(),
      text: `${bank.name} is ${severity} on ${group} (${bank.stock[group]} units) — no eligible donors nearby right now.`,
    });
    return;
  }
  eligible.forEach(d => {
    DB.notifications.unshift({
      id: 'n' + noticeCounter++, time: nowLabel(),
      text: `Recall sent to ${d.name} (${d.group}, ${d.city}) — ${bank.name} is ${severity} on ${group}.`,
    });
  });
}

function logDonation(donorId) {
  const d = DB.donors.find(x => x.id === donorId);
  if (!d) return;
  d.lastDonation = daysAgo(0);
  renderAll();
  toast(`Thanks ${d.name} — donation logged, eligibility reset.`);
}

/* ---------------- rendering ---------------- */

function populateCitySelects() {
  ['search-city', 'sos-city'].forEach(id => {
    const sel = document.getElementById(id);
    const keepFirst = id === 'search-city';
    sel.innerHTML = (keepFirst ? '<option value="">Any nearby city</option>' : '') +
      CITIES.map(c => `<option value="${c}">${c}</option>`).join('');
  });
}

function populateFacilityPickers() {
  const hSel = document.getElementById('hospital-picker');
  hSel.innerHTML = DB.hospitals.map(h => `<option value="${h.id}">${h.name} — ${h.city}</option>`).join('');
  hSel.value = DB.facilityLogin.hospital;

  const bSel = document.getElementById('bloodbank-picker');
  bSel.innerHTML = DB.bloodbanks.map(b => `<option value="${b.id}">${b.name} — ${b.city}</option>`).join('');
  bSel.value = DB.facilityLogin.bloodbank;

  const aSel = document.getElementById('ambulance-picker');
  aSel.innerHTML = DB.ambulanceServices.map(a => `<option value="${a.id}">${a.name} — ${a.city}</option>`).join('');
  aSel.value = DB.facilityLogin.ambulance;
}

function renderPulse() {
  const active = DB.requests.filter(r => r.status === 'Matched' || r.status === 'Confirmed' || r.status === 'Pending').length;
  const bedsFree = DB.hospitals.reduce((s, h) => s + BED_TYPES.reduce((s2, t) => s2 + (h.beds[t].total - h.beds[t].occupied), 0), 0);
  const bloodLow = DB.bloodbanks.reduce((s, b) => s + GROUPS.filter(g => b.stock[g] < LOW_STOCK).length, 0);
  const ambFree = DB.ambulanceServices.reduce((s, a) => s + a.fleet.filter(v => v.status === 'Available').length, 0);

  document.getElementById('pulse-grid').innerHTML = `
    <dt>Active requests</dt><dd>${active}</dd>
    <dt>Beds free, all cities</dt><dd>${bedsFree}</dd>
    <dt>Groups running low</dt><dd>${bloodLow}</dd>
    <dt>Ambulances free</dt><dd>${ambFree}</dd>
  `;
}

function currentSearchType() {
  return document.querySelector('.tab-btn.is-active').dataset.search;
}

function runSearch(e) {
  if (e) e.preventDefault();
  const type = currentSearchType();
  const city = document.getElementById('search-city').value;
  const results = document.getElementById('search-results');

  let rows = [];
  if (type === 'blood') {
    const group = document.getElementById('search-group').value;
    let list = rankBanksFor(group, city || DB.bloodbanks[0].city);
    if (city) list = list.filter(b => b.city === city);
    rows = list.map(b => ({
      id: b.id, name: b.name, meta: `${b.city} · ${b.km} km`,
      figure: b.stock[group], unit: 'units', status: bloodStatus(b.stock[group]),
      onRequest: () => quickRequest('blood', { group }, b.city),
    }));
  } else if (type === 'bed') {
    const bedType = document.getElementById('search-bedtype').value;
    let list = rankHospitalsFor(bedType, city || DB.hospitals[0].city);
    if (city) list = list.filter(h => h.city === city);
    rows = list.map(h => {
      const avail = h.beds[bedType].total - h.beds[bedType].occupied;
      return {
        id: h.id, name: h.name, meta: `${h.city} · ${h.km} km · ${bedType} beds`,
        figure: avail, unit: 'free', status: avail === 0 ? 'critical' : avail <= 2 ? 'low' : 'ok',
        onRequest: () => quickRequest('bed', { bedType }, h.city),
      };
    });
  } else {
    let list = rankAmbulancesFor(city || DB.ambulanceServices[0].city);
    if (city) list = list.filter(a => a.city === city);
    rows = list.map(a => {
      const free = a.fleet.filter(v => v.status === 'Available').length;
      return {
        id: a.id, name: a.name, meta: `${a.city} · ${a.km} km · fleet of ${a.fleet.length}`,
        figure: free, unit: 'free', status: free === 0 ? 'critical' : free === 1 ? 'low' : 'ok',
        onRequest: () => quickRequest('ambulance', {}, a.city),
      };
    });
  }

  if (rows.length === 0) {
    results.innerHTML = `<div class="empty-state">No matches for that city yet — try "Any nearby city" to see the full network.</div>`;
    return;
  }

  results.innerHTML = rows.map((r, i) => `
    <div class="result-card status-${r.status}">
      <div class="result-main">
        <div class="result-name">${escapeHtml(r.name)}</div>
        <div class="result-meta">${escapeHtml(r.meta)}</div>
      </div>
      <div class="result-figure status-${r.status}">${r.figure}<br><span style="font-family:var(--sans);font-weight:500;font-size:0.68rem;color:var(--ink-soft)">${r.unit}</span></div>
      <button class="result-request-btn" type="button" data-idx="${i}">Request</button>
    </div>
  `).join('');

  results.querySelectorAll('.result-request-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => rows[i].onRequest());
  });
}

function quickRequest(type, detail, city) {
  const req = createRequest(type, detail, city, 'standard', 'Public search request');
  renderAll();
  if (req.matchedId) {
    toast(`Request sent — matched to the nearest available facility.`);
  } else {
    toast(`Request logged — nothing available nearby right now.`);
  }
}

function renderDonorView() {
  document.getElementById('donor-count-label').textContent = `${DB.donors.length} donors registered`;
  document.getElementById('donor-tbody').innerHTML = DB.donors.map(d => {
    const e = eligibility(d);
    const statusBadge = e.eligible
      ? `<span class="badge badge-ok">Eligible now</span>`
      : `<span class="badge badge-neutral">${e.daysLeft} days left</span>`;
    return `
      <tr>
        <td>${escapeHtml(d.name)}</td>
        <td class="mono">${d.group}</td>
        <td>${d.city}</td>
        <td>${d.lastDonation}</td>
        <td>${statusBadge}</td>
        <td><button class="small-btn" type="button" data-donor="${d.id}">Log donation today</button></td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-donor]').forEach(btn => {
    btn.addEventListener('click', () => logDonation(btn.dataset.donor));
  });

  const list = document.getElementById('notice-list');
  if (DB.notifications.length === 0) {
    list.innerHTML = `<li>No recall notifications yet — these appear automatically when a blood bank drops below safe stock.</li>`;
  } else {
    list.innerHTML = DB.notifications.slice(0, 20).map(n => `
      <li>${escapeHtml(n.text)}<span class="notice-time">${n.time}</span></li>
    `).join('');
  }
}

function renderHospitalView() {
  const h = DB.hospitals.find(x => x.id === DB.facilityLogin.hospital);
  document.getElementById('bed-tbody').innerHTML = BED_TYPES.map(t => {
    const b = h.beds[t];
    const avail = b.total - b.occupied;
    return `
      <tr>
        <td>${t}</td>
        <td class="mono">${b.total}</td>
        <td class="mono">${b.occupied}</td>
        <td class="mono">${avail}</td>
        <td>
          <span class="qty-controls">
            <button type="button" data-bed="${t}" data-delta="-1">–</button>
            <span class="mono">${b.occupied}</span>
            <button type="button" data-bed="${t}" data-delta="1">+</button>
          </span>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-bed]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.bed, delta = Number(btn.dataset.delta);
      const b = h.beds[t];
      b.occupied = Math.min(b.total, Math.max(0, b.occupied + delta));
      renderAll();
    });
  });

  const reqs = requestsFor('bed', h.id).filter(r => r.status !== 'Fulfilled');
  document.getElementById('hospital-requests-tbody').innerHTML = reqs.length
    ? reqs.map(requestRow).join('')
    : `<tr><td colspan="5" class="empty-state" style="border:none;">No incoming requests for ${escapeHtml(h.name)} right now.</td></tr>`;
  wireRequestActions();
}

function renderBloodbankView() {
  const b = DB.bloodbanks.find(x => x.id === DB.facilityLogin.bloodbank);
  document.getElementById('stock-tbody').innerHTML = GROUPS.map(g => {
    const units = b.stock[g];
    const status = bloodStatus(units);
    const badge = status === 'critical' ? 'badge-critical' : status === 'low' ? 'badge-warn' : 'badge-ok';
    const label = status === 'critical' ? 'Critical' : status === 'low' ? 'Low' : 'Adequate';
    return `
      <tr>
        <td class="mono">${g}</td>
        <td class="mono">${units}</td>
        <td><span class="badge ${badge}">${label}</span></td>
        <td>
          <span class="qty-controls">
            <button type="button" data-stock="${g}" data-delta="-1">–</button>
            <span class="mono">${units}</span>
            <button type="button" data-stock="${g}" data-delta="1">+</button>
          </span>
        </td>
        <td>${status !== 'ok' ? `<button class="recall-btn" type="button" data-recall="${g}">Trigger recall</button>` : ''}</td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-stock]').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.stock, delta = Number(btn.dataset.delta);
      b.stock[g] = Math.max(0, b.stock[g] + delta);
      if (delta < 0) checkShortage(b, g);
      renderAll();
    });
  });

  document.querySelectorAll('[data-recall]').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.recall;
      triggerRecall(b, g, bloodStatus(b.stock[g]));
      renderAll();
      toast('Recall alert sent to eligible nearby donors.');
    });
  });

  const reqs = requestsFor('blood', b.id).filter(r => r.status !== 'Fulfilled');
  document.getElementById('bloodbank-requests-tbody').innerHTML = reqs.length
    ? reqs.map(requestRow).join('')
    : `<tr><td colspan="5" class="empty-state" style="border:none;">No incoming requests for ${escapeHtml(b.name)} right now.</td></tr>`;
  wireRequestActions();
}

function renderAmbulanceView() {
  const a = DB.ambulanceServices.find(x => x.id === DB.facilityLogin.ambulance);
  document.getElementById('fleet-tbody').innerHTML = a.fleet.map(v => `
    <tr>
      <td class="mono">${v.code}</td>
      <td><span class="badge ${v.status === 'Available' ? 'badge-ok' : v.status === 'En Route' ? 'badge-warn' : 'badge-neutral'}">${v.status}</span></td>
      <td>
        <select data-vehicle="${v.id}" class="small-btn" style="padding:6px 8px;">
          <option ${v.status === 'Available' ? 'selected' : ''}>Available</option>
          <option ${v.status === 'En Route' ? 'selected' : ''}>En Route</option>
          <option ${v.status === 'Busy' ? 'selected' : ''}>Busy</option>
        </select>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-vehicle]').forEach(sel => {
    sel.addEventListener('change', () => {
      const v = a.fleet.find(x => x.id === sel.dataset.vehicle);
      v.status = sel.value;
      renderAll();
    });
  });

  const reqs = requestsFor('ambulance', a.id).filter(r => r.status !== 'Fulfilled');
  document.getElementById('ambulance-requests-tbody').innerHTML = reqs.length
    ? reqs.map(requestRow).join('')
    : `<tr><td colspan="4" class="empty-state" style="border:none;">No incoming requests for ${escapeHtml(a.name)} right now.</td></tr>`;
  wireRequestActions();
}

function requestRow(r) {
  const detailLabel = r.type === 'blood' ? r.detail.group : r.type === 'bed' ? r.detail.bedType : '—';
  const urgencyBadge = r.urgency === 'critical' ? 'badge-critical' : r.urgency === 'urgent' ? 'badge-warn' : 'badge-neutral';
  const statusBadge = r.status === 'Confirmed' ? 'badge-ok' : r.status === 'Unmatched' ? 'badge-critical' : 'badge-warn';
  const actions = r.status === 'Matched'
    ? `<button class="small-btn accept" type="button" data-act="accept" data-id="${r.id}">Accept</button>
       <button class="small-btn reject" type="button" data-act="reject" data-id="${r.id}">Decline</button>`
    : r.status === 'Confirmed'
    ? `<button class="small-btn fulfill" type="button" data-act="fulfill" data-id="${r.id}">Mark fulfilled</button>`
    : '—';

  const cols = r.type === 'ambulance'
    ? `<td>${escapeHtml(r.patientName)}</td><td><span class="badge ${urgencyBadge}">${r.urgency}</span></td><td><span class="badge ${statusBadge}">${r.status}</span></td><td>${actions}</td>`
    : `<td>${escapeHtml(r.patientName)}</td><td class="mono">${detailLabel}</td><td><span class="badge ${urgencyBadge}">${r.urgency}</span></td><td><span class="badge ${statusBadge}">${r.status}</span></td><td>${actions}</td>`;

  return `<tr>${cols}</tr>`;
}

function wireRequestActions() {
  document.querySelectorAll('[data-act]').forEach(btn => {
    const id = btn.dataset.id;
    if (btn.dataset.act === 'accept') btn.addEventListener('click', () => acceptRequest(id));
    if (btn.dataset.act === 'reject') btn.addEventListener('click', () => rejectRequest(id));
    if (btn.dataset.act === 'fulfill') btn.addEventListener('click', () => fulfillRequest(id));
  });
}

function cityScore(city) {
  const hs = DB.hospitals.filter(h => h.city === city);
  const bs = DB.bloodbanks.filter(b => b.city === city);
  const as = DB.ambulanceServices.filter(a => a.city === city);

  const bedPct = hs.length
    ? hs.reduce((s, h) => s + BED_TYPES.reduce((s2, t) => s2 + (h.beds[t].total - h.beds[t].occupied), 0), 0) /
      hs.reduce((s, h) => s + BED_TYPES.reduce((s2, t) => s2 + h.beds[t].total, 0), 0)
    : 1;

  const bloodPct = bs.length
    ? bs.reduce((s, b) => s + GROUPS.filter(g => b.stock[g] >= LOW_STOCK).length, 0) / (bs.length * GROUPS.length)
    : 1;

  const ambPct = as.length
    ? as.reduce((s, a) => s + a.fleet.filter(v => v.status === 'Available').length, 0) /
      as.reduce((s, a) => s + a.fleet.length, 0)
    : 1;

  return { bedPct, bloodPct, ambPct };
}

function severityClass(pct) {
  if (pct < 0.3) return 'hm-critical';
  if (pct < 0.6) return 'hm-warn';
  return 'hm-ok';
}

function renderAdminView() {
  const activeCount = DB.requests.filter(r => r.status === 'Matched' || r.status === 'Confirmed').length;
  const unmatched = DB.requests.filter(r => r.status === 'Unmatched').length;
  const criticalGroups = DB.bloodbanks.reduce((s, b) => s + GROUPS.filter(g => bloodStatus(b.stock[g]) === 'critical').length, 0);
  const bedsFree = DB.hospitals.reduce((s, h) => s + BED_TYPES.reduce((s2, t) => s2 + (h.beds[t].total - h.beds[t].occupied), 0), 0);

  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Active requests</div><div class="stat-value">${activeCount}</div></div>
    <div class="stat-card ${unmatched ? 'alert' : ''}"><div class="stat-label">Unmatched requests</div><div class="stat-value">${unmatched}</div></div>
    <div class="stat-card ${criticalGroups ? 'alert' : ''}"><div class="stat-label">Blood groups critical</div><div class="stat-value">${criticalGroups}</div></div>
    <div class="stat-card"><div class="stat-label">Beds free, all cities</div><div class="stat-value">${bedsFree}</div></div>
  `;

  const heat = document.getElementById('heatmap');
  let html = `<div class="hm-label"></div><div class="hm-head">Blood</div><div class="hm-head">Beds</div><div class="hm-head">Ambulance</div>`;
  CITIES.forEach(city => {
    const { bedPct, bloodPct, ambPct } = cityScore(city);
    html += `<div class="hm-label">${city}</div>`;
    html += `<div class="hm-cell ${severityClass(bloodPct)}"><span>Blood</span><span class="hm-pct">${Math.round(bloodPct * 100)}%</span></div>`;
    html += `<div class="hm-cell ${severityClass(bedPct)}"><span>Beds</span><span class="hm-pct">${Math.round(bedPct * 100)}%</span></div>`;
    html += `<div class="hm-cell ${severityClass(ambPct)}"><span>Amb.</span><span class="hm-pct">${Math.round(ambPct * 100)}%</span></div>`;
  });
  heat.innerHTML = html;

  const shortageRows = [];
  DB.bloodbanks.forEach(b => {
    GROUPS.forEach(g => {
      const status = bloodStatus(b.stock[g]);
      if (status !== 'ok') shortageRows.push({ b, g, status });
    });
  });
  document.getElementById('shortage-tbody').innerHTML = shortageRows.length
    ? shortageRows.map(({ b, g, status }) => `
        <tr>
          <td>${escapeHtml(b.name)}</td><td>${b.city}</td><td class="mono">${g}</td><td class="mono">${b.stock[g]}</td>
          <td><span class="badge ${status === 'critical' ? 'badge-critical' : 'badge-warn'}">${status === 'critical' ? 'Critical' : 'Low'}</span></td>
        </tr>
      `).join('')
    : `<tr><td colspan="5" class="empty-state" style="border:none;">No shortages right now — every group is at safe stock.</td></tr>`;

  document.getElementById('log-tbody').innerHTML = DB.requests.length
    ? DB.requests.slice(0, 40).map(r => `
        <tr>
          <td>${r.log[0].time}</td>
          <td style="text-transform:capitalize;">${r.type}</td>
          <td>${escapeHtml(r.patientName)}</td>
          <td>${r.city}</td>
          <td><span class="badge ${r.status === 'Fulfilled' ? 'badge-ok' : r.status === 'Unmatched' ? 'badge-critical' : 'badge-warn'}">${r.status}</span></td>
          <td style="font-size:0.8rem;color:var(--ink-soft);">${r.log.map(l => escapeHtml(l.text)).join(' → ')}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="6" class="empty-state" style="border:none;">No requests logged yet.</td></tr>`;
}

function renderAll() {
  renderPulse();
  const view = document.body.dataset.view;
  if (view === 'public') runSearch();
  if (view === 'donor') renderDonorView();
  if (view === 'hospital') renderHospitalView();
  if (view === 'bloodbank') renderBloodbankView();
  if (view === 'ambulance') renderAmbulanceView();
  if (view === 'admin') renderAdminView();
}

/* ---------------- wiring ---------------- */

function switchView(role) {
  document.body.dataset.view = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('is-active', b.dataset.role === role));
  document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== `view-${role}`; });
  renderAll();
}

function initSearchTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const type = btn.dataset.search;
      document.getElementById('field-group').hidden = type !== 'blood';
      document.getElementById('field-bedtype').hidden = type !== 'bed';
      runSearch();
    });
  });
}

function initSos() {
  const backdrop = document.getElementById('sos-backdrop');
  document.getElementById('open-sos').addEventListener('click', () => {
    backdrop.hidden = false;
    document.getElementById('sos-result').hidden = true;
    document.getElementById('sos-form').hidden = false;
  });
  document.getElementById('close-sos').addEventListener('click', () => { backdrop.hidden = true; });
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.hidden = true; });

  document.getElementById('sos-type').addEventListener('change', (e) => {
    document.getElementById('sos-field-group').hidden = e.target.value !== 'blood';
    document.getElementById('sos-field-bedtype').hidden = e.target.value !== 'bed';
  });

  document.getElementById('sos-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('sos-name').value.trim() || 'Unnamed request';
    const type = document.getElementById('sos-type').value;
    const city = document.getElementById('sos-city').value;
    const urgency = document.getElementById('sos-urgency').value;
    const detail = type === 'blood' ? { group: document.getElementById('sos-group').value }
      : type === 'bed' ? { bedType: document.getElementById('sos-bedtype').value }
      : {};

    const req = createRequest(type, detail, city, urgency, name);
    renderAll();

    const resultBox = document.getElementById('sos-result');
    const facilityList = facilityListFor(type);
    const top3 = req.candidates.slice(0, 3).map(id => facilityList.find(f => f.id === id));
    resultBox.hidden = false;
    document.getElementById('sos-form').hidden = true;
    resultBox.innerHTML = `
      <h3>${req.matchedId ? 'Matched — help is on the way' : 'Broadcast sent'}</h3>
      <p>${req.matchedId
        ? `Nearest available match: <strong>${escapeHtml(facilityList.find(f => f.id === req.matchedId).name)}</strong>. It now has this request in its queue.`
        : `No facility has availability right now — this stays visible to every nearby facility and will match automatically the moment one frees up.`}</p>
      <p>Also notified, in order of distance:</p>
      <ol>${top3.map(f => `<li>${escapeHtml(f.name)} — ${f.city}, ${f.km} km</li>`).join('')}</ol>
    `;
  });
}

function initFacilityPickers() {
  document.getElementById('hospital-picker').addEventListener('change', (e) => {
    DB.facilityLogin.hospital = e.target.value; renderAll();
  });
  document.getElementById('bloodbank-picker').addEventListener('change', (e) => {
    DB.facilityLogin.bloodbank = e.target.value; renderAll();
  });
  document.getElementById('ambulance-picker').addEventListener('change', (e) => {
    DB.facilityLogin.ambulance = e.target.value; renderAll();
  });
}

function init() {
  populateCitySelects();
  populateFacilityPickers();
  initSearchTabs();
  initSos();
  initFacilityPickers();

  document.getElementById('search-form').addEventListener('submit', runSearch);
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.role));
  });

  // Seed a couple of in-flight requests so every dashboard has
  // something to show the moment a visitor lands on it.
  createRequest('blood', { group: 'O-' }, 'Mohali', 'critical', 'Ward request — Mohali Metro');
  createRequest('bed', { bedType: 'ICU' }, 'Mohali', 'critical', 'Family of Ranjit S.');
  createRequest('ambulance', {}, 'Chandigarh', 'urgent', 'Roadside emergency call');
  checkShortage(DB.bloodbanks.find(b => b.id === 'b4'), 'O-');
  checkShortage(DB.bloodbanks.find(b => b.id === 'b4'), 'B-');

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
