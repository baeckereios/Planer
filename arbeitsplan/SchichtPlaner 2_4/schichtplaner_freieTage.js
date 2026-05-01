// ── SchichtPlaner — Freie Tage, Aktionszentrale ─────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, saveToStorage(),
//                 renderWochenplan(), renderFehlzeiten()

// ── Freie Tage ──────────────────────────────────────────
function renderFreieTage() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const grid = document.getElementById('freitagGrid');

  const typBadge = (typ) => {
    if (!typ) return '';
    if (typ === 'wunsch')  return `<span style="background:#fff8e0;color:#8a6000;border:1px solid #e8d090;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">★ Wunsch</span>`;
    if (typ === 'auto')    return `<span style="background:#f0f0f0;color:#666;border:1px solid #ccc;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">Auto</span>`;
    return `<span style="background:#eef4fb;color:var(--blue);border:1px solid #b8d0e8;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">Manuell</span>`;
  };

  // Übersichtstabelle
  const tabelleRows = (config.personen || []).filter(p => !p.azubi).map(p => {
    const tag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
    const typ = FLUSS_LOGIK.getFreierTagTyp(p.id, weekKey, config.freieTage);

    // Wunsch-Indikator
    let wunschIndikator = '';
    if (p.wunschFreierTag) {
      if (tag === p.wunschFreierTag) {
        wunschIndikator = `<span style="color:var(--green);font-size:14px;margin-left:4px" title="Wunschtag hat geklappt">✓</span>`;
      } else if (tag) {
        const wunschIdx = TAGE_NAMEN_LANG.indexOf(p.wunschFreierTag);
        wunschIndikator = `<span style="color:var(--red-bright);font-size:14px;margin-left:4px" title="Wunsch war ${TAGE_NAMEN_KURZ[wunschIdx]}">✗</span>`;
      }
    }

    const locked = p.gesperrt || [];
    const options = `<option value="">—</option>` + TAGE_NAMEN_LANG.map((t, i) => {
      const disabled = locked.includes(t) ? 'disabled' : '';
      return `<option value="${t}" ${tag === t ? 'selected' : ''} ${disabled}>${TAGE_NAMEN_KURZ[i]}</option>`;
    }).join('');

    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:7px 12px;font-weight:700;white-space:nowrap">${p.name}</td>
      <td style="padding:4px 12px">
        <select id="frei-${p.id}" onchange="liveFreierTag('${p.id}', this.value)"
          style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:14px;width:60px">
          ${options}
        </select>
        ${wunschIndikator}
      </td>
      <td style="padding:7px 8px">${typBadge(typ)}</td>
    </tr>`;
  });

  // Azubi-Zeile
  const azubi = (config.personen || []).find(p => p.azubi);
  const azubiRow = azubi ? `<tr style="border-bottom:1px solid var(--border);opacity:0.5">
    <td style="padding:7px 12px;font-weight:700">${azubi.name} <span class="azubi-badge">Azubi</span></td>
    <td colspan="2" style="padding:7px 12px;font-size:13px;color:var(--text-dim)">Über Sperrtage geregelt</td>
  </tr>` : '';

  const tabelle = `<table style="width:100%;border-collapse:collapse;background:var(--bg2)">
    <thead><tr style="border-bottom:2px solid var(--border)">
      <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim)">Person</th>
      <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim)">Freier Tag</th>
      <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim)">Typ</th>
    </tr></thead>
    <tbody>${tabelleRows.join('')}${azubiRow}</tbody>
  </table>`;

  grid.innerHTML = tabelle;
}

function saveFreieTage() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  const bestehend = config.freieTage[weekKey] || {};
  config.freieTage[weekKey] = {};
  (config.personen || []).forEach(p => {
    const val = document.getElementById(`frei-${p.id}`)?.value;
    if (!val) return;
    const oldEntry = bestehend[p.id];
    const oldTag = typeof oldEntry === 'string' ? oldEntry : oldEntry?.tag;
    const oldTyp = typeof oldEntry === 'string' ? 'auto' : (oldEntry?.typ || 'auto');
    if (val === oldTag) {
      // Unverändert → Typ beibehalten
      config.freieTage[weekKey][p.id] = { tag: val, typ: oldTyp };
    } else {
      // Aktiv geändert
      const typ = val === p.wunschFreierTag ? 'wunsch' : 'manuell';
      config.freieTage[weekKey][p.id] = { tag: val, typ };
    }
  });
  saveToStorage();
  renderWochenplan();
  renderFreieTage();
  renderVorschlaege();
}

function istWocheBestaetigt(weekKey) {
  return !!(config.freieTage?.[weekKey]?._meta?.bestaetigt);
}

function wocheBestaetigen() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
  config.freieTage[weekKey]._meta = {
    bestaetigt: new Date().toISOString(),
    bestaetigtAm: new Date().toLocaleDateString('de-DE')
  };
  saveToStorage();
  renderFreieTage();
  renderVorschlaege();
}

function renderFreiStatus() {
  const banner = document.getElementById('freiStatusBanner');
  if (!banner) return;
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const personen = (config.personen || []).filter(p => !p.azubi);

  const ohneFrei = personen.filter(p => {
    // Kein freier Tag gesetzt
    const tag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
    if (tag) return false;
    // Auch kein Urlaubszeitraum der diese Woche abdeckt (wäre kein normaler Schicht-Tag)
    const wochentage = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
    const hatUrlaub = (config.urlaub?.[p.id] || []).some(e =>
      e.von && e.bis && wochentage.some(d => d >= e.von && d <= e.bis)
    );
    return !hatUrlaub;
  });

  if (ohneFrei.length === 0) {
    banner.innerHTML = `<div style="display:flex;align-items:center;gap:8px;background:var(--green-bg);border:1px solid #b0d8bc;border-radius:8px;padding:8px 12px;font-size:13px;color:var(--green)">
      <i class="ph ph-check-circle" style="font-size:16px;flex-shrink:0"></i>
      <span><strong>Alle haben einen freien Tag</strong> diese Woche.</span>
    </div>`;
  } else {
    const namen = ohneFrei.map(p => `<strong>${p.name}</strong>`).join(', ');
    banner.innerHTML = `<div style="display:flex;align-items:center;gap:8px;background:#fff8e8;border:1px solid #e8d090;border-radius:8px;padding:8px 12px;font-size:13px;color:#7a5200">
      <i class="ph ph-warning" style="font-size:16px;flex-shrink:0"></i>
      <span>${namen} ${ohneFrei.length === 1 ? 'hat' : 'haben'} noch keinen freien Tag.</span>
    </div>`;
  }
}

function renderWocheStatus() {
  const banner = document.getElementById('wocheStatusBanner');
  if (banner) banner.innerHTML = '';

  // Azubi-22uhr-Sperre Hinweis
  const hinweis = document.getElementById('azubi22Hinweis');
  if (!hinweis) return;
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const hatFruehschicht = (config.fruehschichtEinsaetze || []).some(e => {
    const vonWoche = FLUSS_LOGIK.getWeekKey(new Date(e.von));
    const bisWoche = FLUSS_LOGIK.getWeekKey(new Date(e.bis));
    return weekKey >= vonWoche && weekKey <= bisWoche;
  });
  const azubi = (config.personen || []).find(p => p.azubi);
  if (hatFruehschicht && azubi) {
    hinweis.innerHTML = `<div style="display:flex;align-items:center;gap:8px;background:#fff8e8;border:1px solid #e8d090;border-radius:8px;padding:9px 13px;margin-bottom:12px;font-size:13px;color:#7a5200">
      <i class="ph ph-lock" style="font-size:16px;flex-shrink:0"></i>
      <span><strong>${azubi.name}</strong> ist diese Woche automatisch für 22 Uhr gesperrt — Frühschicht-Woche, Azubi soll lernen.</span>
    </div>`;
  } else {
    hinweis.innerHTML = '';
  }
}

function resetWoche() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!confirm('Freie Tage und manuelle Positions-Änderungen dieser Woche zurücksetzen?')) return;

  // Freie Tage löschen
  if (config.freieTage) delete config.freieTage[weekKey];

  // Manuelle Overrides aller Tage dieser Woche löschen
  if (config.manuelleZuweisungen) {
    FLUSS_LOGIK.getWeekDates(currentMonday)
      .map(d => FLUSS_LOGIK.dateToISO(d))
      .forEach(d => delete config.manuelleZuweisungen[d]);
  }

  saveToStorage();
  renderFreieTage();
  renderWochenplan();
  document.getElementById('variantenBanner').innerHTML = '';
}

function liveFreierTag(personId, val) {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
  const person = (config.personen || []).find(p => p.id === personId);
  if (val) {
    const typ = val === person?.wunschFreierTag ? 'wunsch' : 'manuell';
    config.freieTage[weekKey][personId] = { tag: val, typ };
  } else {
    delete config.freieTage[weekKey][personId];
  }
  saveToStorage();
  renderWochenplan();
  renderFreieTage();
  renderWocheStatus(); renderFreiStatus();
  renderVorschlaege();
}

function renderVarianten(varianten) {
  const banner = document.getElementById('variantenBanner');
  if (!banner) return;
  if (!varianten || varianten.length <= 1) { banner.innerHTML = ''; return; }
  const items = varianten.map((v, i) => {
    const tage = Object.entries(v)
      .filter(([k]) => k !== '_meta')
      .map(([id, e]) => {
        const p = (config.personen||[]).find(p=>p.id===id);
        const tag = typeof e==='string'?e:e.tag;
        const ti = TAGE_NAMEN_LANG.indexOf(tag);
        return `${p?.name||id}: ${TAGE_NAMEN_KURZ[ti]||tag}`;
      }).join(' · ');
    return `<div style="padding:8px 0;border-bottom:1px solid #e8d8a0">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="color:#7a5200;font-weight:700;font-size:12px">Variante ${i+1}</span>
        <button class="btn" style="padding:3px 10px;font-size:12px" onclick="varianteUebernehmen(${i})">Übernehmen</button>
      </div>
      <div style="font-size:11px;color:#5a4a20;margin-top:2px">${tage}</div>
    </div>`;
  }).join('');
  banner.innerHTML = `<details style="margin-bottom:12px">
    <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fffbf0;border:1px solid #e8d090;border-radius:var(--radius);font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#7a5200">
      <span><i class="ph ph-shuffle" style="margin-right:6px"></i>${varianten.length} Verteilungsvarianten</span>
      <i class="ph ph-caret-down" style="font-size:16px"></i>
    </summary>
    <div style="background:#fffbf0;border:1px solid #e8d090;border-top:none;border-radius:0 0 var(--radius) var(--radius);padding:0 14px">
      ${items}
    </div>
  </details>`;
  window._aktuelleVarianten = varianten;
}

function varianteUebernehmen(idx) {
  const v = window._aktuelleVarianten?.[idx];
  if (!v) return;
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = v;
  saveToStorage();
  renderFreieTage();
  renderWochenplan();
  renderWocheStatus(); renderFreiStatus();
  renderVorschlaege();
  document.getElementById('variantenBanner').innerHTML = '';
}

function renderAktionsZentrale(extra) {
  // extra = optionale zusätzliche Karte (z.B. Verdrängungsvorschlag)
  const karten = [];
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);

  // ── Joker-Warnungen ──
  wochenplan.forEach(tag => {
    Object.entries(tag.zuweisung || {}).forEach(([posId, z]) => {
      if (z.status !== 'joker') return;
      const pos = (config.positionen||[]).find(p=>p.id===posId);
      karten.push(`<div style="display:flex;align-items:center;gap:12px;background:#fdf0f0;border:1.5px solid #e8b0b0;border-radius:10px;padding:12px 16px">
        <i class="ph ph-warning" style="font-size:24px;color:var(--red);flex-shrink:0"></i>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:var(--red)">Joker — ${pos?.label || posId}</div>
          <div style="font-size:12px;color:#8a3030;margin-top:2px">${tag.tagKurz} ${tag.datumFormatiert} · Kein qualifizierter Mitarbeiter verfügbar</div>
        </div>
      </div>`);
    });
  });

  // ── Joker-Vorschläge ──
  const vorschlaege = FLUSS_LOGIK.berechneVorschlaege(config, weekKey, currentMonday);
  const hatJoker = karten.length > 0;
  if (hatJoker && vorschlaege.length > 0) {
    const items = vorschlaege.map((v, i) => {
      const vonIdx = TAGE_NAMEN_LANG.indexOf(v.vonTag);
      const aufIdx = TAGE_NAMEN_LANG.indexOf(v.aufTag);
      const hint = v.hint ? `<span style="font-size:11px;color:#5a8a60;margin-left:6px">(${v.hint})</span>` : '';
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8d090;gap:8px">
        <span style="font-size:13px"><strong>${v.personName}</strong>: ${TAGE_NAMEN_KURZ[vonIdx]} → ${TAGE_NAMEN_KURZ[aufIdx]}${hint}</span>
        <button class="btn" style="padding:4px 12px;font-size:12px;flex-shrink:0" onclick="vorschlagUebernehmen('${v.personId}','${v.aufTag}')">Übernehmen</button>
      </div>`;
    }).join('');
    karten.push(`<div style="background:#fffbf0;border:1.5px solid #e8d090;border-radius:10px;padding:12px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <i class="ph ph-lightbulb" style="font-size:20px;color:#b8790a;flex-shrink:0"></i>
        <span style="font-weight:700;font-size:14px;color:#7a5200">Lösungsvorschläge</span>
      </div>
      ${items}
    </div>`);
    window._aktuelleVorschlaege = vorschlaege;
  }

  // ── Extra-Karte (Verdrängung etc.) ──
  if (extra) karten.push(extra);

  const zentrale = document.getElementById('aktionsZentrale');
  const inhalt = document.getElementById('aktionsInhalt');
  if (!zentrale || !inhalt) return;

  if (karten.length === 0) {
    zentrale.style.display = 'block';
    inhalt.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--green-bg);border:1.5px solid #b0d8bc;border-radius:10px;color:var(--green)">
      <i class="ph ph-check-circle" style="font-size:20px;flex-shrink:0"></i>
      <span style="font-size:13px;font-weight:700">Alles in Ordnung — kein Handlungsbedarf</span>
    </div>`;
  } else {
    zentrale.style.display = 'block';
    inhalt.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">${karten.join('')}</div>`;
  }
}

function renderVorschlaege() { renderAktionsZentrale(); }

function vorschlagUebernehmen(personId, aufTag) {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
  config.freieTage[weekKey][personId] = { tag: aufTag, typ: 'auto' };
  saveToStorage();
  renderFreieTage();
  renderWochenplan();
  renderVorschlaege();
}

function autoVerteilen() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (istWocheBestaetigt(weekKey)) {
    alert('Diese Woche ist bereits bestätigt. Erst "Zurücksetzen" um neu zu planen.');
    return;
  }
  // Varianten berechnen
  const varianten = FLUSS_LOGIK.autoVerteilVarianten(config, weekKey, 3);
  // Erste Variante direkt anwenden
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = varianten[0];
  saveToStorage();
  renderFreieTage();
  renderWochenplan();
  renderWocheStatus(); renderFreiStatus();
  renderVorschlaege();
  // Varianten anzeigen wenn es mehrere gibt
  renderVarianten(varianten);
}
