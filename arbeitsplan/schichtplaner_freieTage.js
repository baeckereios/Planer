// ── SchichtPlaner — Freie Tage, Aktionszentrale ─────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, saveToStorage(),
//                 renderWochenplan(), renderFehlzeiten()

// ── Freie Tage ──────────────────────────────────────────
function renderFreieTage() {
  const weekKey = getSchichtWeekKey();
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

    // Anzahl freier Tage für diese Person (aus feiertagsWocheConfig)
    const fwConfig = config.feiertagsWocheConfig || {};
    // Feiertagsarbeiter: erstes Dropdown gesperrt (sie arbeiten am Feiertag)
    const istFeiertagsArbeiter = (fwConfig.feiertagsArbeiter || []).includes(p.id);
    // feiertagsArbeiter: zeige gewählten Tag, nur Feiertag selbst ist deaktiviert
    const effectiveTag = tag; // null wird im select als '—' angezeigt
    const feiertagsTag = fwConfig.datum
      ? TAGE_NAMEN_LANG[FLUSS_LOGIK.getWeekDates(currentMonday).map(d=>FLUSS_LOGIK.dateToISO(d)).indexOf(fwConfig.datum)]
      : null;
    const options = `<option value="">—</option>` + TAGE_NAMEN_LANG.map((t, i) => {
      // Feiertagsarbeiter dürfen den Feiertag nicht als freien Tag wählen
      const disabledByFeiertag = istFeiertagsArbeiter && t === feiertagsTag;
      const disabled = locked.includes(t) || disabledByFeiertag ? 'disabled' : '';
      return `<option value="${t}" ${effectiveTag === t ? 'selected' : ''} ${disabled}>${TAGE_NAMEN_KURZ[i]}</option>`;
    }).join('');
    const extraTage = (fwConfig.sonntagsArbeiter || []).includes(p.id) ? 1 : 0;
    const feiertagsArbeit = (fwConfig.feiertagsArbeiter || []).includes(p.id) ? 1 : 0;
    const hatFeiertag = fwConfig.datum ? 1 : 0;
    // Feiertags-Woche: Basis immer 0 — delta (auto-gesetzt) enthält den Anspruch
    // Normale Woche: Basis 1
    const basisFreieTage = hatFeiertag ? 0 : 1;
    // Manuelles Delta aus freiTageAnpassung
    const deltaKey = `freiTageAnpassung_${p.id}`;
    const delta = config[deltaKey] || 0;
    const gesamtFreieTage = Math.max(0, basisFreieTage + delta);
    const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '';

    // Zweiter freier Tag aus freieTage_2
    const tag2Key = weekKey;
    const eintrag2 = config.freieTage2?.[tag2Key]?.[p.id];
    const tag2 = typeof eintrag2 === 'string' ? eintrag2 : eintrag2?.tag;
    const options2 = `<option value="">—</option>` + TAGE_NAMEN_LANG.map((t, i) => {
      const disabledByFeiertag2 = istFeiertagsArbeiter && t === feiertagsTag;
      const disabled = locked.includes(t) || t === effectiveTag || disabledByFeiertag2 ? 'disabled' : '';
      return `<option value="${t}" ${tag2 === t ? 'selected' : ''} ${disabled}>${TAGE_NAMEN_KURZ[i]}</option>`;
    }).join('');
    const zweitesDropdown = gesamtFreieTage >= 2 ? `
      <select id="frei2-${p.id}" onchange="liveZweiterFreierTag('${p.id}', this.value)"
        title="Zweiter freier Tag"
        style="background:#f0f6ff;border:1px solid #b8d0e8;color:var(--blue);padding:4px 8px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:14px;width:60px;margin-left:4px">
        ${options2}
      </select>` : '';

    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:7px 12px;font-weight:700;white-space:nowrap">
        ${p.name}
        ${hatFeiertag ? `<span style="font-size:11px;color:var(--blue);margin-left:4px">${gesamtFreieTage}×frei</span>` : ''}
      </td>
      <td style="padding:4px 12px">
        <select id="frei-${p.id}" onchange="liveFreierTag('${p.id}', this.value)"
          style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:14px;width:60px">
          ${options}
        </select>
        ${wunschIndikator}
        ${zweitesDropdown}
      </td>
      <td style="padding:4px 8px">${typBadge(typ)}</td>
      <td style="padding:4px 8px">
        <select onchange="setFreiTageAnpassung('${p.id}', this.value)"
          title="Freie Tage anpassen (Vereinbarung mit Produktionsleitung)"
          style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;width:52px">
          <option value="-1" ${delta===-1?'selected':''}>−1</option>
          <option value="0"  ${delta===0 ?'selected':''}>±0</option>
          <option value="1"  ${delta===1 ?'selected':''}>+1</option>
          <option value="2"  ${delta===2 ?'selected':''}>+2</option>
        </select>
      </td>
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
      <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim)" title="Anpassung freier Tage">Δ</th>
    </tr></thead>
    <tbody>${tabelleRows.join('')}${azubiRow}</tbody>
  </table>`;

  grid.innerHTML = tabelle;
}

function saveFreieTage() {
  const weekKey = getSchichtWeekKey();
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
  // Alle Varianten synchronisieren
  VARIANTEN.forEach(v => {
    if (!v.freieTage) v.freieTage = {};
    Object.entries(config.freieTage[weekKey] || {}).forEach(([pid, eintrag]) => {
      v.freieTage[pid] = typeof eintrag === 'string' ? eintrag : Object.assign({}, eintrag);
    });
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
  const weekKey = getSchichtWeekKey();
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
  const weekKey = getSchichtWeekKey();
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
  const weekKey = getSchichtWeekKey();
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
  const weekKey = getSchichtWeekKey();
  if (!confirm('Freie Tage und manuelle Positions-Änderungen dieser Woche zurücksetzen?')) return;

  if (config.freieTage) delete config.freieTage[weekKey];

  const weekDatesReset = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  if (config.manuelleZuweisungen) {
    weekDatesReset.forEach(d => delete config.manuelleZuweisungen[d]);
  }
  // Änderungsbadges dieser Woche löschen
  if (config.planAenderungen) {
    config.planAenderungen = config.planAenderungen.filter(e => !weekDatesReset.includes(e.datum));
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
  const weekKey = getSchichtWeekKey();
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
  const person = (config.personen || []).find(p => p.id === personId);
  const typ = val && val === person?.wunschFreierTag ? 'wunsch' : 'manuell';

  // Aktuelle Woche aktualisieren
  if (val) config.freieTage[weekKey][personId] = { tag: val, typ };
  else delete config.freieTage[weekKey][personId];

  // Wünsche global in alle Varianten übernehmen
  VARIANTEN.forEach(v => {
    if (!v || typeof v !== 'object') return;
    if (!v.freieTage) v.freieTage = {};
    if (val) v.freieTage[personId] = { tag: val, typ };
    else delete v.freieTage[personId];
  });

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
  // Varianten als vollständige Entwürfe wrappen
  const wrapped = varianten.map(v => ({
    freieTage: v && typeof v === 'object' && v.freieTage ? v.freieTage : (v || {}),
    manuelleZuweisungen: v && typeof v === 'object' && v.manuelleZuweisungen ? v.manuelleZuweisungen : {}
  }));
  VARIANTEN.splice(0, VARIANTEN.length, ...wrapped);
  currentVariante = 0;
  if (typeof renderWochenLabel === 'function') renderWochenLabel();
  window._aktuelleVarianten = varianten;
}

function varianteUebernehmen(idx) {
  const variant = VARIANTEN[idx];
  if (!variant) return;
  const weekKey = getSchichtWeekKey();
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = Object.assign({}, variant.freieTage || {});
  const weekDatesVU = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  weekDatesVU.forEach(d => delete config.manuelleZuweisungen[d]);
  Object.entries(variant.manuelleZuweisungen || {}).forEach(([d,v]) => {
    config.manuelleZuweisungen[d] = Object.assign({}, v);
  });
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
  const weekKey = getSchichtWeekKey();

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

  const wochenplan = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);

  // Feiertags-Joker unterdrücken — erwartet wenn Bäckerei offen mit wenig Personal
  const feiertagsDatum = (config.feiertagsWocheConfig || {}).datum;

  wochenplan.forEach(tag => {
    if (tag.datum === feiertagsDatum) return; // Feiertag-Joker ausblenden
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

  const vorschlaege = FLUSS_LOGIK.berechneVorschlaege(configForFluss(), weekKey, currentMonday);
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
    // Joker ohne Freitag-Verschiebungs-Vorschlag —
    // aber vielleicht gibt es direkt verfügbare (unbesetzte) Personen
  }

  // ── Verfügbar-Direktzuweisung: unbesetzte Personen für Joker-Positionen ──
  // Ergänzt oder ersetzt den Freitag-Verschiebungs-Vorschlag.
  // ── Freier-Tag-Verschiebungs-Vorschläge (eigene Logik) ──────
  // Für jeden Joker: wer hat GENAU diesen Tag als freien Tag
  // und hat die nötige Qualifikation? → freien Tag verschieben.
  if (hatJoker && vorschlaege.length === 0) {
    const verschiebeVorschlaege = [];
    wochenplan.forEach(tag => {
      Object.entries(tag.zuweisung || {}).forEach(([posId, z]) => {
        if (z.status !== 'joker') return;
        const pos = (config.positionen||[]).find(p => p.id === posId);
        const benoetigtesAttr = pos?.attribut;

        // Wer hat diesen Tag frei UND hat das nötige Attribut?
        const kandidaten = (config.personen||[]).filter(p => {
          if (p.azubi) return false;
          // Hat freien Tag an diesem Tag
          const ft = FLUSS_LOGIK.getFreierTag(p.id, getSchichtWeekKey(), config.freieTage);
          if (ft !== tag.tag) return false;
          // Hat nötige Qualifikation
          if (benoetigtesAttr && !(p.attribute||[]).includes(benoetigtesAttr)) return false;
          return true;
        });

        kandidaten.forEach(p => {
          // Besten Ersatztag finden: Sa bevorzugen, sonst letzter freier Tag
          const besetzt = wochenplan
            .filter(t => Object.values(t.zuweisung||{}).some(z => z.personId === p.id))
            .map(t => t.tag);
          const kandidatenTage = ['samstag','freitag','donnerstag','mittwoch','dienstag','montag']
            .filter(t => t !== tag.tag && !(p.gesperrt||[]).includes(t) && !besetzt.includes(t));
          const ersatzTag = kandidatenTage[0];
          if (!ersatzTag) return;

          const ersatzIdx = TAGE_NAMEN_LANG.indexOf(ersatzTag);
          const tagIdx    = TAGE_NAMEN_LANG.indexOf(tag.tag);
          verschiebeVorschlaege.push({
            personId: p.id, personName: p.name,
            posId, posLabel: pos?.label || posId,
            datum: tag.datum, tagKurz: tag.tagKurz, datumFormatiert: tag.datumFormatiert,
            vonTag: tag.tag, vonKurz: TAGE_NAMEN_KURZ[tagIdx] || tag.tag,
            aufTag: ersatzTag, aufKurz: TAGE_NAMEN_KURZ[ersatzIdx] || ersatzTag
          });
        });
      });
    });

    if (verschiebeVorschlaege.length > 0) {
      const jokerBlock = karten.map(k => k).join('');
      karten.length = 0;

      const items = verschiebeVorschlaege.map((v, i) =>
        `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 0;${i > 0 ? 'border-top:1px solid #e8d090;' : ''}">
          <div style="flex:1;font-size:13px;color:#5a3a00;line-height:1.5">
            <strong>${v.personName}</strong> hat ${v.vonKurz} als freien Tag —
            arbeitet stattdessen <strong>${v.posLabel}</strong>.
            Freier Tag rückt auf <strong>${v.aufKurz}</strong>.
          </div>
          <button class="btn" style="padding:6px 14px;font-size:13px;flex-shrink:0;align-self:center"
            onclick="verschiebeFreienTag('${v.personId}','${v.datum}','${v.posId}','${v.aufTag}')">Übernehmen</button>
        </div>`
      ).join('');

      karten.push(`<div style="background:#fffbf0;border:1.5px solid #e8b060;border-radius:10px;overflow:hidden">
        <div style="padding:12px 16px;border-bottom:2px solid #e8c878">${jokerBlock}</div>
        <div style="padding:12px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <i class="ph ph-lightbulb" style="font-size:18px;color:#b8790a;flex-shrink:0"></i>
            <span style="font-weight:700;font-size:13px;color:#7a5200;text-transform:uppercase;letter-spacing:0.4px">Lösungsvorschlag</span>
          </div>
          ${items}
        </div>
      </div>`);
      window._verschiebeVorschlaege = verschiebeVorschlaege;
    }
  }

  if (hatJoker) {
    const direktVorschlaege = [];
    wochenplan.forEach(tag => {
      Object.entries(tag.zuweisung || {}).forEach(([posId, z]) => {
        if (z.status !== 'joker') return;
        const pos = (config.positionen||[]).find(p => p.id === posId);
        // Wer ist an diesem Tag in verfuegbarUnbesetzt?
        const kandidaten = (tag.verfuegbarUnbesetzt || []).filter(p => {
          // Nicht wenn freier Tag an diesem Tag
          const freiTag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
          if (freiTag === tag.tag) return false;
          // Nicht wenn Fehlzeit
          if ((config.fehlzeiten||[]).some(f =>
            f.personId === p.id && tag.datum >= f.von && tag.datum <= f.bis)) return false;
          return true;
        });
        kandidaten.forEach(p => {
          direktVorschlaege.push({ personId: p.id, personName: p.name, datum: tag.datum,
            tagName: tag.tag, tagKurz: tag.tagKurz, datumFormatiert: tag.datumFormatiert,
            posId, posLabel: pos?.label || posId });
        });
      });
    });

    if (direktVorschlaege.length > 0) {
      // Direkt-Vorschläge als eigene Karte — zusätzlich zu eventuellen Freitag-Vorschlägen
      const direktItems = direktVorschlaege.map((v, i) =>
        `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 0;${i > 0 ? 'border-top:1px solid #e8d090;' : ''}">
          <div style="flex:1;font-size:13px;color:#5a3a00;line-height:1.5">
            <strong>${v.personName}</strong> ist ${v.tagKurz} ${v.datumFormatiert} nicht eingeplant
            und kann direkt auf <strong>${v.posLabel}</strong> gesetzt werden.
          </div>
          <button class="btn" style="padding:6px 14px;font-size:13px;flex-shrink:0;align-self:center"
            onclick="direktZuweisen('${v.personId}','${v.posId}','${v.datum}')">Einsetzen</button>
        </div>`
      ).join('');
      karten.push(`<div style="background:#eef4fb;border:1.5px solid #b8d0e8;border-radius:10px;overflow:hidden">
        <div style="padding:10px 16px;border-bottom:1px solid #b8d0e8">
          <div style="display:flex;align-items:center;gap:8px">
            <i class="ph ph-user-check" style="font-size:18px;color:var(--blue);flex-shrink:0"></i>
            <span style="font-weight:700;font-size:13px;color:var(--blue);text-transform:uppercase;letter-spacing:0.4px">Direkt verfügbar</span>
          </div>
        </div>
        <div style="padding:10px 16px">${direktItems}</div>
      </div>`);
      window._direktVorschlaege = direktVorschlaege;
    }
  }

  // ── Samstag-Sonderschicht-Regel ────────────────────────────
  // Regel: Max 1 Person in Sonderschicht am Samstag.
  // Wenn 2 da sind: einer bekommt Samstag frei, übernimmt dafür
  // einen Azubi-22Uhr-Tag in der Woche. Azubi wechselt zurück zu Lernt.
  const samstag = wochenplan.find(t => t.tag === 'samstag');
  // Alle ungeplanten Personen am Samstag: sonderschicht + verfuegbarUnbesetzt
  const saVerfuegbar = samstag ? [
    ...(samstag.sonderschicht || []),
    ...(samstag.verfuegbarUnbesetzt || []).filter(p =>
      !(samstag.sonderschicht || []).some(s => s.id === p.id))
  ] : [];
  if (saVerfuegbar.length >= 2) {
    const kandidaten = saVerfuegbar.slice(0, 2);

    // Azubi-Tage finden (22 Uhr von Felix besetzt)
    const azubi = (config.personen || []).find(p => p.azubi);
    const azubiTage = azubi ? wochenplan.filter(t =>
      t.tag !== 'samstag' &&
      Object.entries(t.zuweisung || {}).some(([posId, z]) =>
        z.personId === azubi.id
      )
    ) : [];

    if (azubiTage.length > 0) {
      // Samstag-Historie: wer hatte am längsten keinen Samstag frei?
      const historie = FLUSS_LOGIK.getFreierTagHistorie(configForFluss(), null);
      const saSortiert = [...kandidaten].sort((a, b) => {
        const saA = (historie[a.id] || {})['samstag'] || 0;
        const saB = (historie[b.id] || {})['samstag'] || 0;
        return saA - saB; // weniger Samstage → kommt zuerst
      });

      const items = saSortiert.map((kand, i) => {
        const zielTag = azubiTage[0];
        const zielPos = Object.entries(zielTag.zuweisung || {}).find(([,z]) => z.personId === azubi.id);
        if (!zielPos) return '';
        const [posId] = zielPos;
        const posLabel = (config.positionen||[]).find(p=>p.id===posId)?.label || posId;
        const saAnzahl = (historie[kand.id] || {})['samstag'] || 0;
        const stern = i === 0
          ? `<span title="Hat am längsten keinen Samstag frei gehabt (${saAnzahl}× in der Historie)" style="color:#b8790a;font-size:15px;margin-right:4px">★</span>`
          : `<span title="${saAnzahl}× Samstag frei in der Historie" style="color:#ccc;font-size:15px;margin-right:4px">☆</span>`;
        return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:${i>0?'10px 0 0':'0 0 10px'};${i>0?'border-top:1px solid #d4f0dc;':''}">
          <div style="font-size:13px;color:#1a4e2e;line-height:1.5">
            ${stern}<strong>${kand.name}</strong> bekommt <strong>Samstag frei</strong> →
            übernimmt dafür <strong>${posLabel}</strong> am <strong>${zielTag.tagKurz} ${zielTag.datumFormatiert}</strong>.
            Felix wechselt zurück zu Lernt.
          </div>
          <button class="btn" style="padding:6px 14px;font-size:13px;flex-shrink:0;align-self:center;background:var(--green)"
            onclick="saUmplanen('${kand.id}','${posId}','${zielTag.datum}')">Umplanen</button>
        </div>`;
      }).filter(Boolean).join('');

      if (items) {
        karten.push(`<div style="background:#f0faf4;border:1.5px solid #9ed4b0;border-radius:10px;overflow:hidden">
          <div style="padding:9px 14px;border-bottom:1px solid #9ed4b0;display:flex;align-items:center;gap:8px">
            <i class="ph ph-arrows-left-right" style="font-size:16px;color:var(--green)"></i>
            <span style="font-weight:700;font-size:12px;color:var(--green);text-transform:uppercase;letter-spacing:0.4px">Samstag-Optimierung</span>
          </div>
          <div style="padding:12px 14px">${items}</div>
        </div>`);
      }
    }
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
  const weekKey = getSchichtWeekKey();
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
  const rawWeekKey = FLUSS_LOGIK.getWeekKey(currentMonday); // für FLUSS_LOGIK (kein Präfix)
  const schichtWK  = getSchichtWeekKey();                    // für freieTage

  if (istWocheBestaetigt(schichtWK)) {
    alert('Diese Woche ist bereits bestätigt. Erst "Zurücksetzen" um neu zu planen.');
    return;
  }
  // Mehr Kandidaten berechnen → bessere Auswahl (20 Versuche, 3 beste)
  // Feiertags-Woche: feiertagsWocheConfig automatisch aus BOS_FEIERTAGE_NDS befüllen
  // wenn noch leer — kein manuelles Öffnen des Akkordeons nötig
  if (!config.feiertagsWocheConfig) config.feiertagsWocheConfig = {};
  if (!config.feiertagsWocheConfig.datum && window.BOS_FEIERTAGE?.feiertage) {
    const wocheDatenAuto = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
    const wocheSetAuto = new Set(wocheDatenAuto);
    const gefunden = window.BOS_FEIERTAGE.feiertage.find(ft => wocheSetAuto.has(ft.datum));
    if (gefunden) {
      config.feiertagsWocheConfig.datum = gefunden.datum;
      config.feiertagsWocheConfig.name  = gefunden.name;
      console.log('[autoVerteilen] Feiertag erkannt:', gefunden.name, gefunden.datum);
    }
  }
  const fwConfig = config.feiertagsWocheConfig || {};
  if (fwConfig.datum) {
    const wocheTageF = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
    if (wocheTageF.includes(fwConfig.datum)) {
      const feiertagsWochentag = TAGE_NAMEN_LANG[wocheTageF.indexOf(fwConfig.datum)];
      const personen = (config.personen || []).filter(p => !p.azubi);
      if (!config.freieTage) config.freieTage = {};
      if (!config.freieTage[schichtWK]) config.freieTage[schichtWK] = {};

      personen.forEach(p => {
        const hatSonntag  = (fwConfig.sonntagsArbeiter  || []).includes(p.id);
        const hatFeiertag = (fwConfig.feiertagsArbeiter || []).includes(p.id);
        const bestehendes = config.freieTage[schichtWK][p.id];
        const bestTag = typeof bestehendes === 'string' ? bestehendes : bestehendes?.tag;
        const bestTyp = typeof bestehendes === 'string' ? 'auto' : (bestehendes?.typ || null);

        if (hatFeiertag) {
          // Feiertagsarbeiter: nur löschen wenn noch kein Ausgleichstag gewählt
          if (!bestehendes || bestTag === feiertagsWochentag) {
            delete config.freieTage[schichtWK][p.id];
          }
          // sonst: bereits gewählter Ausgleichstag bleibt erhalten
        } else {
          // Alle anderen: Feiertag als versprochen — nur wenn noch kein Eintrag
          if (!bestehendes || bestTyp === 'auto') {
            config.freieTage[schichtWK][p.id] = { tag: feiertagsWochentag, typ: 'versprochen' };
          }
        }

        // Delta nur setzen wenn noch nicht gesetzt
        const extraAnspruch = (hatSonntag ? 1 : 0) + (hatFeiertag ? 1 : 0);
        if (!config[`freiTageAnpassung_${p.id}`]) {
          config[`freiTageAnpassung_${p.id}`] = extraAnspruch;
        }
      });
    }
  }

  // Vor dem Generieren: manuell/wunsch-gesetzte Einträge sichern
  // Diese sind bekannte Constraints — der Algorithmus soll drumherum planen
  const fixierteEintraege = {};
  Object.entries(config.freieTage[schichtWK] || {}).forEach(([personId, eintrag]) => {
    if (personId === '_meta') return;
    const typ = typeof eintrag === 'string' ? 'auto' : (eintrag?.typ || 'auto');
    if (typ === 'wunsch' || typ === 'manuell' || typ === 'versprochen') {
      fixierteEintraege[personId] = eintrag;
    }
  });
  if (Object.keys(fixierteEintraege).length > 0) {
    console.log('[autoVerteilen] Fixierte Wünsche:', Object.entries(fixierteEintraege).map(([id, e]) => {
      const p = (config.personen||[]).find(x=>x.id===id);
      return `${p?.name||id}: ${e?.tag||e}`;
    }).join(', '));
  }

  const t0 = performance.now();
  const varianten = FLUSS_LOGIK.autoVerteilVarianten(configForFluss(), rawWeekKey, 100);
  const _genDauer = Math.round(performance.now()-t0);
  console.log('[autoVerteilen] Berechnung:', _genDauer, 'ms, Kandidaten:', varianten?.length || 0);

  // Guard: kein Ergebnis wenn Constraints zu eng
  if (!varianten || varianten.length === 0 || !varianten[0]) {
    const zentrale = document.getElementById('aktionsInhalt');
    if (zentrale) zentrale.innerHTML = `<div style="padding:12px 16px;background:#fff0f0;border:1.5px solid #e8b0b0;border-radius:10px;color:#a03030;font-size:13px">
      <i class="ph ph-warning" style="margin-right:6px"></i>
      Keine Verteilung berechenbar — zu viele Einschränkungen (Urlaub, Sperrtage).
    </div>`;
    return;
  }

  // Joker-Anzahl pro Variante berechnen (zur Sortierung)
  function _jokerCount(varFreieTage) {
    // Geschichte erhalten + aktuelle Variante einsetzen — konsistent mit Rendering
    const flussConfig = configForFluss();
    const plan = FLUSS_LOGIK.berechneWochenplan(
      { ...flussConfig, freieTage: { ...flussConfig.freieTage, [rawWeekKey]: varFreieTage } },
      currentMonday
    );
    return plan.reduce((sum, tag) =>
      sum + Object.values(tag.zuweisung || {}).filter(z => z.status === 'joker').length, 0
    );
  }

  // ── Local-Search Optimizer ───────────────────────────────
  // Regel A: Wer an einem Wochentag in VERFÜGBAR steht → bekommt diesen Tag frei
  // Regel B: Klassische Joker-Reduktion durch Freie-Tag-Verschiebung
  function _verfuegbarWochentage(freieTage) {
    const flussConfig = configForFluss();
    const plan = FLUSS_LOGIK.berechneWochenplan(
      { ...flussConfig, freieTage: { ...flussConfig.freieTage, [rawWeekKey]: freieTage } },
      currentMonday
    );
    const result = {}; // { personId: [tagName, ...] }
    plan.forEach(tag => {
      if (tag.tag === 'samstag') return; // Sa-Verfügbar ist erlaubt
      [...(tag.verfuegbarUnbesetzt || []), ...(tag.sonderschicht || [])].forEach(p => {
        if (!result[p.id]) result[p.id] = [];
        result[p.id].push(tag.tag);
      });
    });
    return result;
  }

  function _optimiere(startFT, maxRunden) {
    const personen = (config.personen || []).filter(p => !p.azubi);
    const tage = TAGE_NAMEN_LANG;
    let ft = Object.assign({}, startFT);
    let joker = _jokerCount(ft);

    // Hilfsfunktion: ist ein Eintrag ein weicher Wunsch?
    const istWunsch = (eintrag) => {
      const typ = typeof eintrag === 'string' ? 'auto' : (eintrag?.typ || 'auto');
      return typ === 'wunsch' || typ === 'manuell' || typ === 'versprochen';
    };

    // ── Stufe 1: Wünsche respektieren ─────────────────────
    for (let r = 0; r < maxRunden; r++) {
      let verbessert = false;

      // A: Verfügbar-Wochentage auflösen (nur nicht-Wunsch-Personen)
      const verfMap = _verfuegbarWochentage(ft);
      for (const [personId, verfTage] of Object.entries(verfMap)) {
        if (istWunsch(ft[personId])) continue;
        const p = personen.find(x => x.id === personId);
        if (!p) continue;
        for (const tag of verfTage) {
          if ((p.gesperrt || []).includes(tag)) continue;
          const altTag = typeof ft[personId] === 'string' ? ft[personId] : ft[personId]?.tag;
          if (tag === altTag) continue;
          const test = { ...ft, [personId]: { tag, typ: 'auto' } };
          const tj = _jokerCount(test);
          if (tj <= joker) { ft = test; joker = tj; verbessert = true; if (!joker) return ft; }
        }
      }

      // B: Joker reduzieren (nur nicht-Wunsch-Personen)
      for (const p of personen) {
        if (istWunsch(ft[p.id])) continue;
        for (const tag of tage) {
          if ((p.gesperrt || []).includes(tag)) continue;
          const altTag = typeof ft[p.id] === 'string' ? ft[p.id] : ft[p.id]?.tag;
          if (tag === altTag) continue;
          const test = { ...ft, [p.id]: { tag, typ: ft[p.id]?.typ || 'auto' } };
          const tj = _jokerCount(test);
          if (tj < joker) { ft = test; joker = tj; verbessert = true; if (!joker) return ft; }
        }
      }

      if (!verbessert) break;
    }

    if (joker === 0) return ft; // Wünsche gerettet, fertig

    // ── Stufe 2: Wünsche opfern wenn nötig ────────────────
    // Nur wenn noch Joker übrig — NIEMALS versprochen opfern (Feiertag, harte Constraints)
    for (let r = 0; r < maxRunden; r++) {
      let verbessert = false;
      for (const p of personen) {
        const pTypS2 = typeof ft[p.id] === 'string' ? 'auto' : (ft[p.id]?.typ || 'auto');
        if (pTypS2 === 'versprochen') continue; // versprochen = absolut geschützt
        if (!istWunsch(ft[p.id])) continue; // nur wunsch/manuell
        for (const tag of tage) {
          if ((p.gesperrt || []).includes(tag)) continue;
          const altTag = typeof ft[p.id] === 'string' ? ft[p.id] : ft[p.id]?.tag;
          if (tag === altTag) continue;
          // Wunsch geopfert: als 'wunsch_offen' markieren → zählt NICHT in Historie
          // → Person bekommt nächste Woche automatisch höhere Priorität für ihren Wunschtag
          const test = { ...ft, [p.id]: { tag, typ: 'wunsch_offen' } };
          const tj = _jokerCount(test);
          if (tj < joker) { // nur wenn wirklich besser (nicht nur gleich)
            ft = test; joker = tj; verbessert = true;
            if (!joker) return ft;
          }
        }
      }
      if (!verbessert) break;
    }
    return ft;
  }

  // Varianten nach Qualität sortieren: Joker-frei zuerst
  const t2 = performance.now();
  const variantenMitQualitaet = varianten
    .filter(v => v && Object.keys(v).filter(k => k !== '_meta').length > 0)
    .map(v => {
      // Fixierte Wünsche aufstempeln — Algorithmus darf diese nicht überschreiben
      const mitWuenschen = { ...v, ...fixierteEintraege };
      const optimiert = _optimiere(mitWuenschen, 25);
      return { freieTage: optimiert, manuelleZuweisungen: {}, joker: _jokerCount(optimiert) };
    })
    .sort((a, b) => a.joker - b.joker);
  console.log('[autoVerteilen] Optimierung:', Math.round(performance.now()-t2), 'ms');

  // Nur die 3 besten zeigen — Duplikate (gleiche Joker-Struktur) überspringen
  const seen = new Set();
  const variantenObjekte = variantenMitQualitaet.filter(v => {
    const key = JSON.stringify(v.freieTage);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
  VARIANTEN.splice(0, VARIANTEN.length, ...variantenObjekte);
  currentVariante = 0;
  window._aktuelleVarianten = varianten;

  // DEBUG
  console.group('[autoVerteilen] ' + variantenObjekte.length + ' Varianten generiert');
  variantenObjekte.forEach((v, i) => {
    console.log('Variante ' + String.fromCharCode(65+i) + ':', JSON.stringify(v.freieTage));
  });
  console.groupEnd();

  // Erste Variante direkt anwenden — manuelle Zuweisungen + Änderungslogs dieser Woche löschen
  if (!config.freieTage) config.freieTage = {};
  const ersteVariante = variantenObjekte[0]?.freieTage || varianten[0];
  if (ersteVariante) config.freieTage[schichtWK] = Object.assign({}, ersteVariante);
  const weekDatesAV = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  if (config.manuelleZuweisungen) weekDatesAV.forEach(d => delete config.manuelleZuweisungen[d]);
  // Änderungsbadges der aktuellen Woche löschen — frischer Plan hat keine Badges
  if (config.planAenderungen) {
    config.planAenderungen = config.planAenderungen.filter(e => !weekDatesAV.includes(e.datum));
  }
  saveToStorage();

  // Checkbox zurücksetzen nach Generieren (nächste Woche braucht neue Bestätigung)
  const chk = document.getElementById('chkFreieTageOk');
  if (chk) { chk.checked = false; if (typeof updateGeneriereBtn === 'function') updateGeneriereBtn(); }

  renderWochenLabel(); // "Variante A / 3" im Header
  renderFreieTage();
  renderWochenplan();
  renderWocheStatus(); renderFreiStatus();
  renderAktionsZentrale(
    `<div style="font-size:11px;color:var(--text-dim);text-align:right;padding-top:4px">
      <i class="ph ph-timer"></i> ${variantenObjekte.length} Varianten aus 100 Kandidaten in ${_genDauer} ms (inkl. Optimierung)
    </div>`
  );
}

// ── Direkte Zuweisung (ungeplante Person → Joker-Position) ──
function direktZuweisen(personId, posId, datum) {
  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  if (!config.manuelleZuweisungen[datum]) config.manuelleZuweisungen[datum] = {};
  config.manuelleZuweisungen[datum][posId] = personId;

  const person = (config.personen||[]).find(p => p.id === personId);
  const pos    = (config.positionen||[]).find(p => p.id === posId);
  if (typeof logAenderung === 'function') {
    logAenderung(datum, posId, `Direktzuweisung: ${person?.name || personId} → ${pos?.label || posId}`);
  }

  saveToStorage();
  renderWochenplan();
  renderAktionsZentrale();
}

// ── Freien Tag verschieben + Position besetzen ──────────
function verschiebeFreienTag(personId, datum, posId, neuerFreierTag) {
  const schichtWK = getSchichtWeekKey();

  // 1. Manuelle Zuweisung für die Position
  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  if (!config.manuelleZuweisungen[datum]) config.manuelleZuweisungen[datum] = {};
  config.manuelleZuweisungen[datum][posId] = personId;

  // 2. Freien Tag verschieben
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[schichtWK]) config.freieTage[schichtWK] = {};
  config.freieTage[schichtWK][personId] = { tag: neuerFreierTag, typ: 'manuell' };

  // 3. Änderung protokollieren
  const person = (config.personen||[]).find(p => p.id === personId);
  const pos    = (config.positionen||[]).find(p => p.id === posId);
  if (typeof logAenderung === 'function') {
    logAenderung(datum, posId, `Einspringer (frei verschoben): ${person?.name} → ${pos?.label}`);
  }

  saveToStorage();
  renderWochenplan();
  renderFreieTage();
  renderFreiStatus();
  renderAktionsZentrale();
}

// ── Samstag-Optimierung: Person bekommt Sa frei, übernimmt Azubi-Tag ──
function saUmplanen(personId, posId, datum) {
  const schichtWK = getSchichtWeekKey();
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[schichtWK]) config.freieTage[schichtWK] = {};

  // 1. Person bekommt Samstag als freien Tag (kein weiterer freier Tag)
  config.freieTage[schichtWK][personId] = { tag: 'samstag', typ: 'manuell' };

  // 2. Manuelle Zuweisung: Person auf die Azubi-Position
  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  if (!config.manuelleZuweisungen[datum]) config.manuelleZuweisungen[datum] = {};
  config.manuelleZuweisungen[datum][posId] = personId;

  // 3. Azubi an diesem Tag aus manuellen Zuweisungen entfernen
  const azubi = (config.personen || []).find(p => p.azubi);
  if (azubi) {
    Object.keys(config.manuelleZuweisungen[datum] || {}).forEach(pid => {
      if (config.manuelleZuweisungen[datum][pid] === azubi.id) {
        delete config.manuelleZuweisungen[datum][pid];
      }
    });
  }

  const person = (config.personen||[]).find(p => p.id === personId);
  const pos    = (config.positionen||[]).find(p => p.id === posId);
  if (typeof logAenderung === 'function') {
    logAenderung(datum, posId, `Sa-Optimierung: ${person?.name} → ${pos?.label}, Sa frei`);
  }

  // Variante aktualisieren
  if (VARIANTEN[currentVariante]) {
    VARIANTEN[currentVariante].freieTage = Object.assign({}, config.freieTage[schichtWK]);
    VARIANTEN[currentVariante].manuelleZuweisungen = Object.assign({}, config.manuelleZuweisungen);
  }

  saveToStorage();
  renderWochenplan();
  renderFreieTage();
  renderFreiStatus();
  renderAktionsZentrale();
}

// ── Freie-Tage-Anpassung (Δ-Dropdown) ───────────────────
function setFreiTageAnpassung(personId, val) {
  const delta = parseInt(val) || 0;
  config[`freiTageAnpassung_${personId}`] = delta;
  saveToStorage();
  renderFreieTage();
}

// ── Feiertags-Woche: Akkordeon rendern ───────────────────
function renderFeiertagsWoche() {
  const inhalt = document.getElementById('feiertagsWocheInhalt');
  const badge  = document.getElementById('feiertagsWocheBadge');
  if (!inhalt) return;

  // Feiertage dieser Woche direkt berechnen (unabhängig von feiertagsConfig)
  const wocheTage = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  const jahr = parseInt(wocheTage[0].split('-')[0]);

  const wocheSet = new Set(wocheTage);
  const fwCfg = config.feiertagsWocheConfig || {};

  // Feiertage aus BOS_FEIERTAGE_NDS (Wahrheitsquelle) — Fallback auf leere Liste
  const alleF = window.BOS_FEIERTAGE?.feiertage || [];
  const feiertagsListe = alleF
    .filter(ft => wocheSet.has(ft.datum))
    .map(ft => [ft.datum, { name: ft.name, offen: fwCfg.offen || false }]);

  if (feiertagsListe.length === 0) {
    inhalt.innerHTML = `<p style="font-size:13px;color:var(--text-dim);padding:4px 0">Kein Feiertag in dieser Woche.</p>`;
    if (badge) badge.textContent = 'Kein Feiertag';
    return;
  }

  if (badge) badge.textContent = feiertagsListe.map(([,f]) => f.name).join(', ');

  const personen = config.personen || []; // Azubi eingeschlossen — kann an Feiertag arbeiten
  if (!config.feiertagsWocheConfig) config.feiertagsWocheConfig = {};

  let html = '';
  feiertagsListe.forEach(([datum, ft]) => {
    const offen = ft.offen;
    const [j,m,t] = datum.split('-');
    const datumDE = `${t}.${m}.${j}`;
    const wochentag = ['So','Mo','Di','Mi','Do','Fr','Sa'][new Date(datum+'T12:00').getDay()];

    const sonntagsCheckboxen = personen.map(p => {
      const checked = (fwCfg.sonntagsArbeiter || []).includes(p.id);
      return `<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;padding:2px 0">
        <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--amber)"
          onchange="toggleFeiertagsPerson('sonntagsArbeiter','${p.id}',this.checked)">
        ${p.name}
      </label>`;
    }).join('');

    const feiertagsCheckboxen = personen.map(p => {
      const checked = (fwCfg.feiertagsArbeiter || []).includes(p.id);
      return `<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;padding:2px 0">
        <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--blue)"
          onchange="toggleFeiertagsPerson('feiertagsArbeiter','${p.id}',this.checked)">
        ${p.name}
      </label>`;
    }).join('');

    html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px">
      <div style="padding:9px 14px;background:var(--bg3);display:flex;align-items:center;justify-content:space-between">
        <div>
          <span style="font-weight:700;font-size:14px">${ft.name}</span>
          <span style="font-size:11px;color:var(--text-dim);margin-left:8px">${wochentag} ${datumDE}</span>
        </div>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <span style="font-size:11px;padding:2px 8px;border-radius:4px;font-weight:700;${offen?'background:#fffbf0;color:#7a5200;border:1px solid #e8d090':'background:var(--green-bg);color:var(--green);border:1px solid #b0d8bc'}">
            ${offen ? 'Offen' : 'Geschlossen'}
          </span>
          <input type="checkbox" ${offen?'checked':''} style="accent-color:var(--amber);width:16px;height:16px"
            onchange="toggleFeiertagsOffen('${datum}', this.checked)">
        </label>
      </div>
      <div style="padding:10px 14px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim);margin-bottom:6px">
          Wer arbeitet am Sonntag?
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0 16px;margin-bottom:12px">${sonntagsCheckboxen}</div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim);margin-bottom:6px">
          Wer arbeitet am Feiertag?
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0 16px">${feiertagsCheckboxen}</div>
      </div>
    </div>`;
  });

  // Zusammenfassung
  const sonntagsAnzahl = (fwCfg.sonntagsArbeiter || []).length;
  const feiertagsAnzahl = (fwCfg.feiertagsArbeiter || []).length;
  const hatFeiertag = feiertagsListe.length > 0;
  html += `<div style="background:var(--bg3);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text-dim);margin-top:4px">
    <i class="ph ph-info" style="margin-right:6px"></i>
    ${hatFeiertag
      ? `Feiertags-Woche: Die meisten Kollegen bekommen <strong>keinen</strong> weiteren freien Tag.
         ${sonntagsAnzahl > 0 ? `Sonntags-Arbeiter (${sonntagsAnzahl}): +1 freier Tag.` : ''}
         ${feiertagsAnzahl > 0 ? `Feiertags-Arbeiter (${feiertagsAnzahl}): +1 freier Tag.` : ''}`
      : 'Keine Sonderregeln diese Woche.'}
  </div>`;

  // Datum für Algorithmus speichern
  fwCfg.datum = feiertagsListe[0]?.[0] || null;
  fwCfg.name  = feiertagsListe[0]?.[1]?.name || null;
  saveToStorage();

  inhalt.innerHTML = html;
  renderFreieTage(); // Grid aktualisieren (Anzeige ×frei)
}

function toggleFeiertagsOffen(datum, wert) {
  if (!config.feiertagsWocheConfig) config.feiertagsWocheConfig = {};
  config.feiertagsWocheConfig.offen = wert;
  _applyFeiertagsVoreinstellung();
  saveToStorage();
  renderFeiertagsWoche();
  renderFreieTage();
}

function toggleFeiertagsPerson(liste, personId, wert) {
  if (!config.feiertagsWocheConfig) config.feiertagsWocheConfig = {};
  const arr = config.feiertagsWocheConfig[liste] || [];
  if (wert && !arr.includes(personId)) arr.push(personId);
  if (!wert) { const i = arr.indexOf(personId); if (i > -1) arr.splice(i, 1); }
  config.feiertagsWocheConfig[liste] = arr;

  // Sofort freieTage für alle auf Feiertag setzen — Grid zeigt neuen Stand
  _applyFeiertagsVoreinstellung();
  saveToStorage();
  renderFeiertagsWoche();
  renderFreieTage();
}

function _applyFeiertagsVoreinstellung() {
  const fwConfig = config.feiertagsWocheConfig || {};
  if (!fwConfig.datum) return;
  const schichtWK = getSchichtWeekKey();
  const wocheTage = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  if (!wocheTage.includes(fwConfig.datum)) return;
  const feiertagsWochentag = TAGE_NAMEN_LANG[wocheTage.indexOf(fwConfig.datum)];
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[schichtWK]) config.freieTage[schichtWK] = {};
  const personen = (config.personen || []).filter(p => !p.azubi);
  personen.forEach(p => {
    const hatSonntag  = (fwConfig.sonntagsArbeiter  || []).includes(p.id);
    const hatFeiertag = (fwConfig.feiertagsArbeiter || []).includes(p.id);

    if (hatFeiertag) {
      // Arbeitet am Feiertag → kein freier Tag AM Feiertag, bekommt Ausgleichstag
      delete config.freieTage[schichtWK][p.id];
    } else {
      // Feiertag = versprochen frei
      config.freieTage[schichtWK][p.id] = { tag: feiertagsWochentag, typ: 'versprochen' };
    }

    // Anspruch auf extra freien Tag berechnen
    const extraAnspruch = (hatSonntag ? 1 : 0) + (hatFeiertag ? 1 : 0);
    config[`freiTageAnpassung_${p.id}`] = extraAnspruch > 0 ? extraAnspruch : 0;
  });
}

// ── Zweiter freier Tag ───────────────────────────────────
function liveZweiterFreierTag(personId, val) {
  const weekKey = getSchichtWeekKey();
  if (!config.freieTage2) config.freieTage2 = {};
  if (!config.freieTage2[weekKey]) config.freieTage2[weekKey] = {};

  if (val) {
    config.freieTage2[weekKey][personId] = { tag: val, typ: 'versprochen' };
  } else {
    delete config.freieTage2[weekKey][personId];
  }

  // Custom-Einsatz in fruehschichtEinsaetze aktualisieren
  _syncCustomEinsatz(personId, weekKey);
  saveToStorage();
  renderFreieTage();
}

// ── Custom-Einsatz synchronisieren ──────────────────────
// Erzeugt/löscht einen fruehschichtEinsatz { block:'custom', tage:[...] }
// damit fluss_logik.js die Person an diesen Tagen aus dem Pool nimmt.
function _syncCustomEinsatz(personId, weekKey) {
  const eintrag2 = config.freieTage2?.[weekKey]?.[personId];
  const tag2 = typeof eintrag2 === 'string' ? eintrag2 : eintrag2?.tag;

  // Alte custom-Einträge für diese Person+Woche entfernen
  config.fruehschichtEinsaetze = (config.fruehschichtEinsaetze || [])
    .filter(e => !(e.personId === personId && e.block === 'custom' && e._wochenkey === weekKey));

  if (!tag2) return; // kein zweiter freier Tag → kein Einsatz nötig

  // Wochendaten für von/bis
  const weekDates = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));
  const datum = weekDates[TAGE_NAMEN_LANG.indexOf(tag2)];
  if (!datum) return;

  config.fruehschichtEinsaetze.push({
    personId,
    block: 'custom',
    tage: [tag2],
    von: datum,
    bis: datum,
    _wochenkey: weekKey, // Marker zum späteren Aufräumen
    _autogeneriert: true
  });
}
