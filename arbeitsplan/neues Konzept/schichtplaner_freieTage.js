// ── SchichtPlaner — Freie Tage, Aktionszentrale ─────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, saveToStorage(),
//                 renderWochenplan(), renderFehlzeiten()

// ── Freie Tage ──────────────────────────────────────────
function renderFreieTage() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const grid = document.getElementById('freitagGrid');
  if (!grid) return;

  const typBadge = (typ) => {
    if (!typ) return '';
    if (typ === 'wunsch')  return `<span style="background:#fff8e0;color:#8a6000;border:1px solid #e8d090;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">★ Wunsch</span>`;
    if (typ === 'auto')    return `<span style="background:#f0f0f0;color:#666;border:1px solid #ccc;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">Auto</span>`;
    return `<span style="background:#eef4fb;color:var(--blue);border:1px solid #b8d0e8;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">Manuell</span>`;
  };

  const tabelleRows = (config.personen || []).filter(p => !p.azubi).map(p => {
    const tag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
    const typ = FLUSS_LOGIK.getFreierTagTyp(p.id, weekKey, config.freieTage);

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
      config.freieTage[weekKey][p.id] = { tag: val, typ: oldTyp };
    } else {
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
    const tag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
    if (tag) return false;
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

  if (config.freieTage) delete config.freieTage[weekKey];

  if (config.manuelleZuweisungen) {
    FLUSS_LOGIK.getWeekDates(currentMonday)
      .map(d => FLUSS_LOGIK.dateToISO(d))
      .forEach(d => delete config.manuelleZuweisungen[d]);
  }

  // Varianten für diese Woche löschen
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;

  saveToStorage();
  renderWochenLabel(); // Varianten-Anzeige zurücksetzen
  renderFreieTage();
  renderWochenplan();
  const banner = document.getElementById('variantenBanner');
  if (banner) banner.innerHTML = '';
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

// ── renderVarianten ─────────────────────────────────────
// Varianten werden jetzt über die Kopfzeilen-Pfeile gesteuert.
// Diese Funktion befüllt nur noch das globale VARIANTEN-Array
// und aktualisiert den Header — kein DOM-Banner mehr.
function renderVarianten(varianten) {
  // VARIANTEN-Array aktualisieren (wird von changeVariante() genutzt)
  VARIANTEN.splice(0, VARIANTEN.length, ...varianten);
  currentVariante = 0;
  // Header aktualisieren: "Variante A / 3"
  if (typeof renderWochenLabel === 'function') renderWochenLabel();
  // Legacy — window._aktuelleVarianten bleibt für eventuelle externe Nutzung
  window._aktuelleVarianten = varianten;
}

function varianteUebernehmen(idx) {
  // Backward-Kompatibilität — wird nicht mehr aus dem DOM aufgerufen,
  // kann aber noch programmatisch genutzt werden.
  const v = window._aktuelleVarianten?.[idx];
  if (!v) return;
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = Object.assign({}, v);
  currentVariante = idx;
  saveToStorage();
  renderWochenLabel();
  renderFreieTage();
  renderWochenplan();
  renderWocheStatus(); renderFreiStatus();
  renderVorschlaege();
}

function renderAktionsZentrale(extra) {
  const karten = [];
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);

  // Kein Plan generiert → Hinweis statt Joker-Analyse
  if (!_wocheHatDaten(weekKey)) {
    const zentrale = document.getElementById('aktionsZentrale');
    const inhalt   = document.getElementById('aktionsInhalt');
    if (inhalt) inhalt.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;color:var(--text-dim)">
      <i class="ph ph-magic-wand" style="font-size:20px;flex-shrink:0"></i>
      <span style="font-size:13px">Kein Plan für diese Woche — <strong>Generieren</strong> drücken.</span>
    </div>`;
    return;
  }

  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);

  wochenplan.forEach(tag => {
    Object.entries(tag.zuweisung || {}).forEach(([posId, z]) => {
      if (z.status !== 'joker') return;
      const pos = (config.positionen||[]).find(p=>p.id===posId);
      karten.push(`<div style="display:flex;align-items:center;gap:12px">
        <i class="ph ph-warning" style="font-size:22px;color:var(--red);flex-shrink:0"></i>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--red)">Joker — ${pos?.label || posId}</div>
          <div style="font-size:12px;color:#8a3030;margin-top:2px">${tag.tagKurz} ${tag.datumFormatiert} · Kein qualifizierter Mitarbeiter verfügbar</div>
        </div>
      </div>`);
    });
  });

  const vorschlaege = FLUSS_LOGIK.berechneVorschlaege(config, weekKey, currentMonday);
  const hatJoker = karten.length > 0;
  window._aktuelleVorschlaege = vorschlaege;

  if (hatJoker && vorschlaege.length > 0) {
    // ── Problem + Lösung in einer gemeinsamen Karte ──
    const jokerBlock = karten.map(k => k).join('');
    karten.length = 0; // joker-karten ersetzen durch merged card

    const loesungen = vorschlaege.map((v, i) => {
      const vonIdx = TAGE_NAMEN_LANG.indexOf(v.vonTag);
      const aufIdx = TAGE_NAMEN_LANG.indexOf(v.aufTag);
      const vonKurz = TAGE_NAMEN_KURZ[vonIdx] || v.vonTag;
      const aufKurz = TAGE_NAMEN_KURZ[aufIdx] || v.aufTag;
      const hintText = v.hint
        ? `<span style="font-size:11px;color:#5a8a60;margin-left:4px">(${v.hint})</span>`
        : '';
      return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 0;${i > 0 ? 'border-top:1px solid #e8d090;' : ''}">
        <div style="flex:1;font-size:13px;color:#5a3a00;line-height:1.5">
          <strong>${v.personName}</strong> hat ${vonKurz} als freien Tag.
          Freien Tag auf <strong>${aufKurz}</strong> verschieben${hintText} —
          dann ist die Lücke geschlossen.
        </div>
        <button class="btn" style="padding:6px 14px;font-size:13px;flex-shrink:0;align-self:center"
          onclick="vorschlagUebernehmen('${v.personId}','${v.aufTag}')">Übernehmen</button>
      </div>`;
    }).join('');

    karten.push(`<div style="background:#fffbf0;border:1.5px solid #e8b060;border-radius:10px;overflow:hidden">
      <!-- Problem-Teil -->
      <div style="padding:12px 16px;border-bottom:2px solid #e8c878">
        ${jokerBlock}
      </div>
      <!-- Lösung-Teil -->
      <div style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <i class="ph ph-lightbulb" style="font-size:18px;color:#b8790a;flex-shrink:0"></i>
          <span style="font-weight:700;font-size:13px;color:#7a5200;text-transform:uppercase;letter-spacing:0.4px">Lösungsvorschlag</span>
        </div>
        ${loesungen}
      </div>
    </div>`);
  } else if (hatJoker) {
    // Joker ohne Vorschlag — karten bleiben wie sie sind
  }

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

// ── Auto-Verteilen ──────────────────────────────────────
// Berechnet bis zu 3 Varianten, befüllt VARIANTEN-Array,
// wendet Variante 0 sofort an. Navigation via Kopfzeilen-Pfeile.
function autoVerteilen() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  if (istWocheBestaetigt(weekKey)) {
    alert('Diese Woche ist bereits bestätigt. Erst "Zurücksetzen" um neu zu planen.');
    return;
  }
  const varianten = FLUSS_LOGIK.autoVerteilVarianten(config, weekKey, 3);

  // VARIANTEN-Array befüllen — changeVariante() kann jetzt navigieren
  VARIANTEN.splice(0, VARIANTEN.length, ...varianten);
  currentVariante = 0;
  window._aktuelleVarianten = varianten;

  // Erste Variante direkt anwenden
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = Object.assign({}, varianten[0]);
  saveToStorage();

  renderWochenLabel(); // "Variante A / 3" im Header
  renderFreieTage();
  renderWochenplan();
  renderWocheStatus(); renderFreiStatus();
  renderVorschlaege();
}
