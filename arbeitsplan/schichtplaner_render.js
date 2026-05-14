// ── SchichtPlaner — Rendering ──────────────────────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, renderAktionsZentrale()

// CSS für Änderungsmarkierung einmalig injizieren
(function() {
  if (document.getElementById('sp-aenderung-css')) return;
  const style = document.createElement('style');
  style.id = 'sp-aenderung-css';
  style.textContent = `
    .plan-cell-geaendert {
      outline: 2px solid var(--amber) !important;
      outline-offset: -1px;
      position: relative;
    }
    .cell-badge-geaendert {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 16px;
      height: 16px;
      background: var(--amber);
      color: #fff;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      pointer-events: none;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
})();

function buildPrintFreitag(weekKey, plan) {
  const el = document.getElementById('print-freitag');
  if (!el) return;
  const TL = TAGE_NAMEN_LANG;
  const TK = TAGE_NAMEN_KURZ;
  const pers = (config.personen || []).filter(p => !p.azubi);

  // Freie Tage pro Tag gruppieren
  const freiNachTag = {};
  pers.forEach(p => {
    const tag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
    if (!tag) return;
    if (!freiNachTag[tag]) freiNachTag[tag] = [];
    freiNachTag[tag].push(p.name);
  });
  const freiChips = TL.slice(1).map((t, i) => {
    const namen = freiNachTag[t] || [];
    if (!namen.length) return '';
    return `<span style="margin-right:10px;white-space:nowrap">
      <span style="text-transform:uppercase;font-size:7px;letter-spacing:1px;color:#aaa">${TK[i+1]}</span>
      <span style="font-size:10px;font-weight:700;margin-left:4px">${namen.join(', ')}</span>
    </span>`;
  }).join('');

  // Frühschicht
  const fruehPlan = plan.find(t => t.fruehschicht);
  const fruehStr = fruehPlan?.fruehschicht
    ? `🌅 ${fruehPlan.fruehschicht.name} (Mo–Mi)`
    : '';

  // Joker
  const jokers = plan.flatMap(t =>
    Object.entries(t.zuweisung || {})
      .filter(([,z]) => z.status === 'joker')
      .map(([posId]) => {
        const pos = (config.positionen||[]).find(p=>p.id===posId);
        return `${t.tagKurz} ${pos?.label||posId}`;
      })
  );
  const statusStr = jokers.length > 0
    ? `⚠ Joker: ${jokers.join(' · ')}`
    : `✓ Vollbesetzt`;
  const statusColor = jokers.length > 0 ? '#b03030' : '#2e6b42';

  el.innerHTML = `
    <div class="pf-block">
      <div class="pf-label">Freie Tage</div>
      <div>${freiChips || '—'}</div>
    </div>
    ${fruehStr ? `<div class="pf-block">
      <div class="pf-label">Frühschicht</div>
      <div style="font-size:10px;font-weight:700;color:#b8790a">${fruehStr}</div>
    </div>` : ''}
    <div class="pf-block">
      <div class="pf-label">Status</div>
      <div style="font-size:10px;font-weight:700;color:${statusColor}">${statusStr}</div>
    </div>
    <div class="pf-block" style="flex:0">
      <div class="pf-label">Legende</div>
      <div class="pf-legende">
        <div class="pf-leg-item"><div class="pf-dot" style="background:#2e6b42"></div><span>Stammkraft</span></div>
        <div class="pf-leg-item"><div class="pf-dot" style="background:#b8790a"></div><span>Kaskade</span></div>
        <div class="pf-leg-item"><div class="pf-dot" style="background:#1a3a5e"></div><span>Wolke</span></div>
        <div class="pf-leg-item"><div class="pf-dot" style="background:#b03030"></div><span>Joker</span></div>
      </div>
    </div>`;
}

// ── KW-Dropdown befüllen ────────────────────────────────
// Zeigt ±8 Wochen rückwärts und +16 Wochen vorwärts.
// Wochen mit vorhandenen Daten (freieTage / manuelleZuweisungen)
// erhalten ein ●-Marker damit man sofort sieht wo Arbeit steckt.
function renderKWDropdown() {
  if (typeof FLUSS_LOGIK === 'undefined') return;
  const dropdown = document.getElementById('kwDropdown');
  if (!dropdown) return;

  const base = FLUSS_LOGIK.getMondayOfWeek(new Date());
  const currentKey = FLUSS_LOGIK.getWeekKey(currentMonday);

  // Wochen mit Daten ermitteln — nur Keys der aktuellen Schicht
  const schichtPrefix = currentSchicht + '_';
  const mitDaten = new Set([
    ...Object.keys(config.freieTage || {})
      .filter(k => k.startsWith(schichtPrefix))
      .map(k => k.replace(schichtPrefix, '')),
    ...Object.keys(config.manuelleZuweisungen || {})
  ]);

  dropdown.innerHTML = '';
  for (let d = -8; d <= 16; d++) {
    const m = new Date(base);
    m.setDate(base.getDate() + d * 7);
    const key = FLUSS_LOGIK.getWeekKey(m);
    const kw   = key.split('-W')[1];
    const jahr = key.split('-W')[0];
    const opt  = document.createElement('option');
    opt.value = key;
    opt.textContent = `KW ${kw} / ${jahr}${mitDaten.has(key) ? ' ●' : ''}`;
    if (key === currentKey) opt.selected = true;
    dropdown.appendChild(opt);
  }

  // Schicht-Dropdown: gespeicherten Wert wiederherstellen
  const schichtDrop = document.getElementById('schichtDropdown');
  if (schichtDrop) schichtDrop.value = currentSchicht;
}

// ── Woche navigieren ────────────────────────────────────
// Wird intern noch genutzt (z.B. nach Import).
// Nicht mehr über UI-Buttons erreichbar — Ablösung durch selectKW().
function changeWeek(delta) {
  currentMonday = new Date(currentMonday);
  currentMonday.setDate(currentMonday.getDate() + delta * 7);
  renderAll();
}

// ── Wochennavigation aktualisieren ─────────────────────
function renderWochenLabel() {
  const weekKey  = FLUSS_LOGIK.getWeekKey(currentMonday);  // für Anzeige (KW-Nr, Druck)
  const schichtWK = getSchichtWeekKey();                    // für freieTage-Lookups
  const kw   = weekKey.split('-W')[1];
  const jahr = weekKey.split('-W')[0];
  const thisMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());
  const isThisWeek = FLUSS_LOGIK.dateToISO(currentMonday) === FLUSS_LOGIK.dateToISO(thisMonday);

  // KW-Dropdown: ausgewählten Wert aktualisieren
  const kwDrop = document.getElementById('kwDropdown');
  if (kwDrop) kwDrop.value = weekKey;

  // "Diese Woche"-Button: nur sichtbar wenn man woanders ist
  const dieseWocheBtn = document.getElementById('dieseWocheBtn');
  if (dieseWocheBtn) dieseWocheBtn.style.display = isThisWeek ? 'none' : 'inline-block';

  // Varianten-Label + Pfeil-Buttons
  const varLabel = document.getElementById('varianteLabel');
  const varPrev  = document.getElementById('variantePrev');
  const varNext  = document.getElementById('varianteNext');
  if (varLabel) {
    const total     = VARIANTEN.length || 1;
    const buchstabe = String.fromCharCode(65 + currentVariante);
    if (total <= 1) {
      varLabel.innerHTML = `<span style="font-size:12px;color:var(--text-dim)" title="Nur eine mögliche Verteilung — Algorithmus-Parameter lockern für mehr Varianten">
        Variante A <span style="font-size:10px;opacity:0.7">· nur 1 möglich</span>
      </span>`;
    } else {
      const v = VARIANTEN[currentVariante];
      const joker = v?.joker;
      const badge = joker === 0
        ? `<span style="font-size:10px;color:var(--green);margin-left:4px">✓</span>`
        : joker > 0
          ? `<span style="font-size:10px;color:var(--red);margin-left:4px">⚠${joker}</span>`
          : '';
      varLabel.innerHTML = `Variante ${buchstabe} / ${total}${badge}`;
    }
  }
  if (varPrev) varPrev.disabled = currentVariante <= 0 || VARIANTEN.length <= 1;
  if (varNext) varNext.disabled = currentVariante >= VARIANTEN.length - 1 || VARIANTEN.length <= 1;

  // Generieren + Zurücksetzen: bei genehmigter Woche deaktivieren
  const istGenehmigt = _istWocheGenehmigt(schichtWK);
  const genBtn   = document.querySelector('button[onclick="autoVerteilen()"]');
  const resetBtn = document.querySelector('button[onclick="resetWoche()"]');
  if (genBtn)   { genBtn.disabled   = istGenehmigt; genBtn.style.opacity   = istGenehmigt ? '0.38' : '1'; }
  if (resetBtn) { resetBtn.disabled = istGenehmigt; resetBtn.style.opacity = istGenehmigt ? '0.38' : '1'; }

  // Freie-Tage-Tab Label
  const freiLabel = document.getElementById('freieTageWochLabel');
  if (freiLabel) freiLabel.textContent = `KW ${kw} / ${jahr}`;

  // Datumsbereich + Print-Header (ein gemeinsamer berechneWochenplan-Aufruf)
  const planInfo = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
  const monStr = planInfo[0]?.datumFormatiert || '';
  const saStr  = planInfo[5]?.datumFormatiert || '';
  const datumLabel = document.getElementById('wochenDatumLabel');
  if (datumLabel) datumLabel.textContent = monStr && saStr ? `${monStr} – ${saStr}` : '';
  const kwEl = document.getElementById('print-kw');
  if (kwEl) kwEl.textContent = `KW ${kw}`;
  const kwSubEl = document.getElementById('print-kw-sub');
  if (kwSubEl) kwSubEl.textContent = `${monStr} — ${saStr} · ${jahr}`;
  const em = document.getElementById('print-meta');
  if (em) em.innerHTML = `
    <strong>Bäckerei Langrehr</strong><br>
    Gedruckt am ${new Date().toLocaleDateString('de-DE')}<br>
    ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr
  `;

  // Print-Freitag befüllen
  buildPrintFreitag(weekKey, planInfo);
}

// ── Feiertage für Tabellenkopf (aus BOS_FEIERTAGE_NDS) ──────
function _feiertageFuerWoche(wochenplan) {
  const result = {};
  if (!wochenplan || wochenplan.length === 0) return result;
  const planDaten = new Set(wochenplan.map(t => t.datum));
  const alleF = window.BOS_FEIERTAGE?.feiertage || [];
  alleF.forEach(ft => {
    if (!planDaten.has(ft.datum)) return;
    const cfg = (config.feiertagsWocheConfig || {});
    result[ft.datum] = { name: ft.name, offen: cfg.offen || false };
  });
  return result;
}

// ── Woche hat generierte Daten? ─────────────────────────
// true  → Plan anzeigen
// false → leere Tabelle anzeigen (Generieren noch nicht gedrückt / zurückgesetzt)
function _wocheHatDaten(weekKey) {
  const ft = config.freieTage?.[weekKey];
  if (!ft) return false;
  return Object.keys(ft).some(k => k !== '_meta');
}

// ── Woche genehmigt? ───────────────────────────────────────
function _istWocheGenehmigt(weekKey) {
  return !!(config.freieTage?.[weekKey]?._meta?.bestaetigt);
}

// ── Wochenplan rendern ──────────────────────────────────
function renderWochenplan() {
  const weekKey   = FLUSS_LOGIK.getWeekKey(currentMonday); // Anzeige
  const schichtWK = getSchichtWeekKey();                    // freieTage
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
  const today = FLUSS_LOGIK.dateToISO(new Date());
  const table = document.getElementById('wochenplanTable');
  const hatDaten = _wocheHatDaten(schichtWK);
  const istGenehmigt = _istWocheGenehmigt(schichtWK);

  // Keine Positionen für diese Schicht konfiguriert → Hinweis
  if ((config.positionen || []).length === 0) {
    const schichtLabel = {'nacht':'Nachtschicht','frueh':'Frühschicht','kond':'Konditorei'}[currentSchicht] || currentSchicht;
    table.innerHTML = `<tr><td style="padding:20px 14px;color:var(--text-dim);font-size:13px;text-align:center">
      <i class="ph ph-info" style="font-size:20px;display:block;margin-bottom:8px;color:var(--amber)"></i>
      Keine Positionen für <strong>${schichtLabel}</strong> konfiguriert.<br>
      <span style="font-size:11px;margin-top:6px;display:block">Im Config-Editor Positionen mit Schicht-Feld anlegen oder bestehende Positionen zuweisen.</span>
    </td></tr>`;
    if (typeof renderGenehmigenBlock === 'function') renderGenehmigenBlock();
    return;
  }

  // Änderungsprotokoll: Set mit 'datum|posId' für schnellen Lookup
  const aenderungSet = new Set();
  const aenderungInfo = {};
  (config.planAenderungen || []).forEach(e => {
    const key = `${e.datum}|${e.posId}`;
    aenderungSet.add(key);
    aenderungInfo[key] = e;
  });

  // Feiertage für diese Woche berechnen
  const feiertageWoche = _feiertageFuerWoche(wochenplan);

  // Header
  let html = '<thead><tr><th></th>';
  wochenplan.forEach((tag, i) => {
    const isToday = tag.datum === today;
    const ft = feiertageWoche[tag.datum];
    const ftKlass = ft ? (ft.offen ? 'ft-offen' : 'ft-geschlossen') : '';
    const ftHtml = ft ? `
      <div style="font-size:9px;font-weight:700;letter-spacing:0.3px;margin-top:2px;color:${ft.offen ? '#b8790a' : '#888'}">
        ${ft.name}
      </div>
      <span onclick="toggleFeiertag('${tag.datum}')" title="${ft.offen ? 'Laden offen — klicken um zu schließen' : 'Laden geschlossen — klicken um zu öffnen'}"
        style="cursor:pointer;font-size:13px;display:inline-block;margin-top:1px;opacity:0.7">
        ${ft.offen ? '🔓' : '🔒'}
      </span>` : '';
    html += `<th class="${isToday ? 'today-col' : ''} ${ftKlass}" style="${ft && !ft.offen ? 'background:#f5f5f2;' : ft ? 'background:#fffbf0;' : ''}">
      ${TAGE_NAMEN_KURZ[i]}<br>
      <span style="font-size:11px;font-weight:400">${tag.datumFormatiert}</span>
      ${ftHtml}
    </th>`;
  });
  html += '</tr></thead><tbody>';

  // Zeilen pro Position — Sonderschicht direkt nach 22-Uhr-Zeile einfügen
  const positionen = config.positionen || [];
  const samstag = wochenplan[5];
  positionen.forEach(pos => {
    html += `<tr><td>${pos.label}</td>`;
    wochenplan.forEach(tag => {
      const z = tag.zuweisung[pos.id];
      if (!z) { html += '<td></td>'; return; }

      // Geschlossener Feiertag: Zelle ausgrauen
      const ftZelle = feiertageWoche[tag.datum];
      if (ftZelle && !ftZelle.offen) {
        html += `<td style="background:#f5f5f2">
          <div class="plan-cell gesperrt" style="cursor:default;opacity:0.45">
            <span class="cell-name" style="font-size:11px">${ftZelle.name}</span>
          </div>
        </td>`;
        return;
      }

      // Genehmigte Woche: Zellen read-only (kein onclick)
      if (hatDaten && istGenehmigt) {
        const z2 = tag.zuweisung[pos.id];
        if (!z2) { html += '<td></td>'; return; }
        const statusClass2 = z2.status || '';
        html += `<td>
          <div class="plan-cell ${statusClass2}" style="cursor:default;opacity:0.85">
            <span class="cell-name">${z2.person || '—'}</span>
          </div>
        </td>`;
        return;
      }

      // Leere Zelle wenn kein Plan generiert
      if (!hatDaten) {
        html += `<td>
          <div class="plan-cell" style="border:1px dashed #d8d0c8;background:#faf8f5;cursor:pointer;min-height:36px"
               onclick="zelleTap('${pos.id}', '${tag.datum}', '', '')">
          </div>
        </td>`;
        return;
      }

      // Platzhalter-Zelle
      if (z.personId && z.personId.startsWith('__')) {
        const platzText = z.personId.slice(2);
        html += `<td>
          <div class="plan-cell" style="border:1.5px dashed #b0a898;background:#f8f6f2;color:#7a6e64;cursor:pointer"
               onclick="zelleTap('${pos.id}', '${tag.datum}', '', '')">
            <span class="cell-name" style="font-style:italic">${platzText}</span>
          </div>
        </td>`;
        return;
      }

      const statusClass = z.status;
      const subText = z.status === 'gesperrt' ? '—' : z.status === 'joker' ? 'Joker!' : '';
      const aenderungKey = `${tag.datum}|${pos.id}`;
      const geaendert = aenderungSet.has(aenderungKey);
      const aenderungGrund = geaendert ? (aenderungInfo[aenderungKey]?.grund || '') : '';
      const aenderungZeit = geaendert ? (aenderungInfo[aenderungKey]?.zeitstempel || '') : '';
      const zeitFormatiert = aenderungZeit
        ? new Date(aenderungZeit).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
        : '';
      html += `<td>
        <div class="plan-cell ${statusClass}${geaendert ? ' plan-cell-geaendert' : ''}"
             onclick="zelleTap('${pos.id}', '${tag.datum}', '${z.personId||''}', '${z.person||''}')"
             data-posid="${pos.id}" data-datum="${tag.datum}"
             ${geaendert ? `data-aenderung="${aenderungGrund.replace(/"/g,'&quot;')}" data-aenderungzeit="${zeitFormatiert}"` : ''}>
          <span class="cell-name">${z.person || '—'}</span>
          ${subText ? `<span class="cell-sub">${subText}</span>` : ''}
          ${geaendert ? `<span class="cell-badge-geaendert" title="${aenderungGrund}">!</span>` : ''}
        </div>
      </td>`;
    });
    html += '</tr>';

    // Sonderschicht direkt nach 22-Uhr-Zeile
    if (pos.attribut === '22uhr') {
      // Prüfen ob irgendeiner an irgendeinem Tag unbesetzt verfügbar ist
      const hatUnbesetzt = wochenplan.some(t => (t.verfuegbarUnbesetzt||[]).length > 0 || (t.sonderschicht||[]).length > 0);
      if (hatUnbesetzt) {
        html += `<tr><td style="color:var(--blue-bright);font-size:11px;padding-left:8px">Verfügbar</td>`;
        wochenplan.forEach((tag, i) => {
          // Personen mit freiem Tag an diesem Tag ausblenden
          const hatFreienTag = (p) =>
            FLUSS_LOGIK.getFreierTag(p.id, schichtWK, config.freieTage) === tag.tag;
          const verfuegbar = (tag.verfuegbarUnbesetzt || []).filter(p => !hatFreienTag(p));
          const sonderschicht = tag.sonderschicht || [];
          const liste = i === 5
            ? [...sonderschicht.map(p => ({...p, optional: true})),
               ...verfuegbar.filter(p =>
                 !sonderschicht.some(s => s.id === p.id)
               ).map(p => ({...p, optional: false}))]
            : verfuegbar.map(p => ({...p, optional: false}));
          if (liste.length === 0) { html += '<td></td>'; return; }
          const namen = liste.map(p =>
            `<div class="plan-cell wolke" style="cursor:default;margin-bottom:2px">
              <span class="cell-name">${p.name}</span>
              ${p.optional ? '<span class="cell-sub">optional</span>' : ''}
            </div>`
          ).join('');
          html += `<td>${namen}</td>`;
        });
        html += '</tr>';
      }
    }
  });

  // ── Trennzeile + Zusatzzeilen nur wenn Plan generiert ──
  if (!hatDaten) {
    html += '</tbody>';
    table.innerHTML = html;
    renderAktionsZentrale();
    return;
  }
  html += `<tr><td colspan="7" style="padding:3px 0;border-bottom:2px solid var(--border)"></td></tr>`;

  // ── Azubi-Zeile ──
  const azubi = (config.personen || []).find(p => p.azubi);
  if (azubi) {
    const weekKey = getSchichtWeekKey();
    html += `<tr><td style="color:var(--blue);font-size:12px">AZUBI</td>`;
    wochenplan.forEach(tag => {
      const isGesperrt = (azubi.gesperrt || []).includes(tag.tag);
      const fehlzeit = (config.fehlzeiten || []).find(f =>
        f.personId === azubi.id && tag.datum >= f.von && tag.datum <= f.bis);
      const assigned = Object.entries(tag.zuweisung || {})
        .find(([, z]) => z.personId === azubi.id);
      if (isGesperrt) {
        html += `<td><div class="plan-cell gesperrt"><span class="cell-name">${tag.tag === 'freitag' ? 'Schule' : 'Frei'}</span></div></td>`;
      } else if (fehlzeit) {
        html += `<td><div class="plan-cell joker"><span class="cell-name">${fehlzeit.typ}</span></div></td>`;
      } else if (assigned) {
        const pos = (config.positionen || []).find(p => p.id === assigned[0]);
        html += `<td><div class="plan-cell kaskade" onclick="showDetail('${assigned[0]}','${tag.datum}')">
          <span class="cell-name">${azubi.name}</span>
          <span class="cell-sub">${pos?.label || assigned[0]}</span>
        </div></td>`;
      } else {
        html += `<td><div class="plan-cell" style="background:#f5f2ee;border:1px dashed #ccc;color:#aaa;cursor:default">
          <span class="cell-name" style="font-size:12px">Lernt</span>
        </div></td>`;
      }
    });
    html += '</tr>';
  }

  // ── Frei-Zeile ──
  html += `<tr><td style="color:var(--text-dim);font-size:12px">FREI</td>`;
  wochenplan.forEach(tag => {
    const freiPersonen = (config.personen || []).filter(p => {
      if (p.azubi) return false;
      if ((config.fehlzeiten || []).some(f =>
        f.personId === p.id && tag.datum >= f.von && tag.datum <= f.bis)) return false;
      // Erster freier Tag
      if (FLUSS_LOGIK.getFreierTag(p.id, schichtWK, config.freieTage) === tag.tag) return true;
      // Zweiter freier Tag (freieTage2)
      const e2 = config.freieTage2?.[schichtWK]?.[p.id];
      const t2 = typeof e2 === 'string' ? e2 : e2?.tag;
      return t2 === tag.tag;
    });
    const gesperrtPersonen = (config.personen || []).filter(p =>
      !p.azubi && (p.gesperrt || []).includes(tag.tag) &&
      !(config.fehlzeiten || []).some(f =>
        f.personId === p.id && tag.datum >= f.von && tag.datum <= f.bis));
    const alle = [...freiPersonen, ...gesperrtPersonen];
    html += alle.length === 0
      ? `<td style="border-left:1px solid var(--border)"></td>`
      : `<td style="border-left:1px solid var(--border);vertical-align:top;padding:4px 3px">${alle.map(p => {
          const isG = (p.gesperrt || []).includes(tag.tag);
          const col = isG ? 'var(--text-dim)' : 'var(--red)';
          const bg = isG ? 'var(--bg3)' : '#fdf0f0';
          return `<div style="display:block;background:${bg};color:${col};border-radius:4px;padding:2px 6px;font-size:10px;margin-bottom:2px;white-space:nowrap">${p.name}</div>`;
        }).join('')}</td>`;
  });
  html += '</tr>';

  // ── Frühschicht-Zeile ──
  // Nur echte Frühschicht-Einsätze anzeigen — auto-generierte custom-Einträge ausblenden
  const hatFruehschicht = wochenplan.some(t => t.fruehschicht &&
    !(config.fruehschichtEinsaetze || []).some(e =>
      e.personId === t.fruehschicht?.id && e._autogeneriert
    )
  );
  if (hatFruehschicht) {
    html += `<tr><td style="color:#b8790a;font-size:12px">FRÜH&shy;SCHICHT</td>`;
    wochenplan.forEach(tag => {
      const fs = tag.fruehschicht;
      // Auto-generierte custom-Einträge (zweiter freier Tag) nicht anzeigen
      if (!fs || (config.fruehschichtEinsaetze || []).some(e =>
        e.personId === fs.id && e._autogeneriert)) {
        html += '<td></td>'; return;
      }
      html += `<td><div class="plan-cell" style="background:#fff8e8;color:#7a5200;border:1px solid #e8d090;cursor:default">
        <span class="cell-name">🌅 ${fs.name}</span>
      </div></td>`;
    });
    html += '</tr>';
  }
  // KRANK/URLAUB: spontane Fehlzeiten + geplanter Urlaub aus Config
  const hatFehlzeiten = wochenplan.some(tag => {
    const spontan = (config.fehlzeiten || []).some(f => tag.datum >= f.von && tag.datum <= f.bis);
    const geplant = Object.entries(config.urlaub || {}).some(([, eintraege]) =>
      (eintraege || []).some(e => e.von && e.bis && tag.datum >= e.von && tag.datum <= e.bis)
    );
    return spontan || geplant;
  });
  if (hatFehlzeiten) {
    html += `<tr><td style="color:var(--red-bright);font-size:11px">KRANK/<br>URLAUB</td>`;
    wochenplan.forEach(tag => {
      // Geplanter Urlaub aus Config
      const geplant = Object.entries(config.urlaub || {}).flatMap(([personId, eintraege]) =>
        (eintraege || [])
          .filter(e => e.von && e.bis && tag.datum >= e.von && tag.datum <= e.bis)
          .map(() => {
            const p = (config.personen || []).find(p => p.id === personId);
            return { personId, name: p?.name || personId, icon: '🌴' };
          })
      );
      // Spontane Fehlzeiten — nur wenn nicht schon in geplantem Urlaub
      const geplantIds = new Set(geplant.map(g => g.personId));
      const spontanArr = (config.fehlzeiten || [])
        .filter(f => tag.datum >= f.von && tag.datum <= f.bis && !geplantIds.has(f.personId))
        .map(f => {
          const p = (config.personen || []).find(p => p.id === f.personId);
          return { personId: f.personId, name: p?.name || f.personId, icon: f.typ === 'krank' ? '🤒' : '🌴' };
        });
      const fehlende = [...geplant, ...spontanArr].map(({ name, icon }) => {
        const isKrank = icon === '🤒';
        const bg = isKrank ? '#fdf0f0' : '#f0f8ff';
        const col = isKrank ? 'var(--red-bright)' : 'var(--blue-bright)';
        return `<div style="display:inline-block;background:${bg};color:${col};border-radius:4px;padding:2px 6px;font-size:10px;margin:1px;white-space:nowrap">${icon} ${name}</div>`;
      });
      html += fehlende.length === 0
        ? `<td style="border-left:1px solid var(--border)"></td>`
        : `<td style="border-left:1px solid var(--border);vertical-align:top;padding:4px 3px">${fehlende.join('')}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody>';
  table.innerHTML = html;

  // Aktionszentrale aktualisieren (Joker + Vorschläge)
  renderAktionsZentrale();
  // Genehmigen-Block aktualisieren (falls ui.js bereits geladen)
  if (typeof renderGenehmigenBlock === 'function') renderGenehmigenBlock();
}
