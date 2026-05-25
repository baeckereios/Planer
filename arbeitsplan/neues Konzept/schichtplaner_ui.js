// ── SchichtPlaner — UI, Modals, Tabs, Fehlzeiten ───────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, saveToStorage(),
//                 renderWochenplan(), renderFreieTage(),
//                 renderAktionsZentrale()

// ── Detail-Modal ────────────────────────────────────────
function krankTab(tab) {
  const isKrank = tab === 'krank';
  document.getElementById('krankInhalt').style.display = isKrank ? '' : 'none';
  document.getElementById('aendernInhalt').style.display = isKrank ? 'none' : '';
  document.getElementById('tabKrank').style.borderBottomColor = isKrank ? 'var(--amber)' : 'transparent';
  document.getElementById('tabKrank').style.color = isKrank ? 'var(--amber)' : 'var(--text-dim)';
  document.getElementById('tabAendern').style.borderBottomColor = !isKrank ? 'var(--amber)' : 'transparent';
  document.getElementById('tabAendern').style.color = !isKrank ? 'var(--amber)' : 'var(--text-dim)';
}

function personAendern() {
  const modal = document.getElementById('krankModal');
  const posId = modal.dataset.posId;
  const datum = modal.dataset.datum;
  const altePersonId = modal.dataset.personId;

  // Platzhalter hat Vorrang vor Person-Select
  const platzhalterText = document.getElementById('aendernPlatzhalter').value.trim();
  const neuePersonId = platzhalterText
    ? '__' + platzhalterText
    : document.getElementById('aendernPerson').value;

  if (!neuePersonId || !posId || !datum) return;

  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  if (!config.manuelleZuweisungen[datum]) config.manuelleZuweisungen[datum] = {};
  config.manuelleZuweisungen[datum][posId] = neuePersonId;

  // Platzhalter: keine weiteren Aktionen nötig
  if (neuePersonId.startsWith('__')) {
    saveToStorage();
    modal.classList.remove('open');
    renderWochenplan();
    return;
  }
  config.manuelleZuweisungen[datum][posId] = neuePersonId;

  // Freien Tag annullieren wenn Person auf ihren eigenen freien Tag gesetzt wird
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const neueP = (config.personen || []).find(p => p.id === neuePersonId);
  const tagName = FLUSS_LOGIK.TAG_NAMEN[new Date(datum).getDay()];
  const freiTag = FLUSS_LOGIK.getFreierTag(neuePersonId, weekKey, config.freieTage);
  const freiTagGeopfert = freiTag === tagName;
  if (freiTagGeopfert && neueP) {
    if (!config.freieTage) config.freieTage = {};
    if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
    delete config.freieTage[weekKey][neuePersonId];
  }

  saveToStorage();
  modal.classList.remove('open');
  // Änderung protokollieren
  const neuePersonObj = (config.personen || []).find(p => p.id === neuePersonId);
  const posObj2 = (config.positionen || []).find(p => p.id === posId);
  logAenderung(datum, posId, `Manuell: ${neuePersonObj?.name || neuePersonId} → ${posObj2?.label || posId}`);
  renderWochenplan();

  // Wenn neue Person ihren freien Tag geopfert hat → Ersatz vorschlagen
  if (freiTagGeopfert && neueP) {
    const tagIdx = FLUSS_LOGIK.TAG_NAMEN.indexOf(tagName);
    const tagKurz = FLUSS_LOGIK.TAG_KURZ[tagIdx] || tagName;
    // Besten Ersatztag ermitteln: Sa wenn verfügbar, sonst erster unbesetzter Tag
    const wochenplan2 = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
    const besetzteTageFuerPerson = wochenplan2
      .filter(t => Object.values(t.zuweisung||{}).some(z => z.personId === neuePersonId))
      .map(t => t.tag);
    const kandidaten = FLUSS_LOGIK.TAG_NAMEN.filter(t =>
      t !== 'sonntag' && !besetzteTageFuerPerson.includes(t) &&
      !(neueP.gesperrt||[]).includes(t)
    );
    // Samstag bevorzugen
    const ersatzTag = kandidaten.includes('samstag') ? 'samstag'
      : kandidaten[kandidaten.length - 1] || null;
    const ersatzIdx = FLUSS_LOGIK.TAG_NAMEN.indexOf(ersatzTag);
    const ersatzKurz = ersatzTag ? FLUSS_LOGIK.TAG_KURZ[ersatzIdx] : null;

    const extraKarte = `<div style="display:flex;align-items:flex-start;gap:12px;background:#fffbf0;border:1.5px solid #e8d090;border-radius:10px;padding:12px 16px">
      <i class="ph ph-calendar-x" style="font-size:22px;color:#b8790a;flex-shrink:0;margin-top:2px"></i>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;color:#7a5200">Freier Tag verloren — ${neueP.name}</div>
        <div style="font-size:12px;color:#8a6000;margin-top:2px">
          ${neueP.name} hat ${tagKurz} eingesprungen und dabei den freien Tag verloren.
          ${ersatzKurz ? `Ersatz: ${ersatzKurz} als neuen freien Tag?` : 'Kein Ersatztag verfügbar.'}
        </div>
        ${ersatzTag ? `<div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn" style="padding:5px 14px;font-size:13px"
            onclick="verdraengungAkzeptieren('${neuePersonId}','${ersatzTag}','${weekKey}')">
            ✓ ${ersatzKurz} als freien Tag
          </button>
          <button class="btn btn-secondary" style="padding:5px 12px;font-size:13px"
            onclick="renderAktionsZentrale()">Nein</button>
        </div>` : ''}
      </div>
    </div>`;
    renderAktionsZentrale(extraKarte);
    return;
  }

  // Verdrängung prüfen: ist die alte Person jetzt unbesetzt?
  if (altePersonId && altePersonId !== neuePersonId) {
    const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
    const tag = wochenplan.find(t => t.datum === datum);
    const verdraengtePerson = (config.personen || []).find(p => p.id === altePersonId);
    const istUnbesetzt = tag && !Object.values(tag.zuweisung || {})
      .some(z => z.personId === altePersonId);

    if (verdraengtePerson && istUnbesetzt) {
      const weekKey2 = FLUSS_LOGIK.getWeekKey(currentMonday);
      const tagIdx = FLUSS_LOGIK.TAG_NAMEN.indexOf(tag.tag);
      const tagKurz = FLUSS_LOGIK.TAG_KURZ[tagIdx] || tag.tag;
      const alterFreierTag = FLUSS_LOGIK.getFreierTag(altePersonId, weekKey2, config.freieTage);
      const altIdx = FLUSS_LOGIK.TAG_NAMEN.indexOf(alterFreierTag);
      const altKurz = alterFreierTag ? FLUSS_LOGIK.TAG_KURZ[altIdx] || alterFreierTag : null;
      const saHinweis = tag.tag !== 'samstag'
        ? ` ${verdraengtePerson.name} wird dann Samstag als Sonderschicht verfügbar.` : '';
      const extraKarte = `<div style="display:flex;align-items:flex-start;gap:12px;background:#fffbf0;border:1.5px solid #e8d090;border-radius:10px;padding:12px 16px">
        <i class="ph ph-shuffle" style="font-size:22px;color:#b8790a;flex-shrink:0;margin-top:2px"></i>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:#7a5200">Verdrängung — ${verdraengtePerson.name}</div>
          <div style="font-size:12px;color:#8a6000;margin-top:2px">
            Nicht mehr eingeplant auf ${tagKurz}${altKurz ? ` · Bisheriger freier Tag: ${altKurz}` : ''}.${saHinweis}
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn" style="padding:5px 14px;font-size:13px"
              onclick="verdraengungAkzeptieren('${altePersonId}','${tag.tag}','${weekKey2}')">
              ✓ ${tagKurz} als freien Tag
            </button>
            <button class="btn btn-secondary" style="padding:5px 12px;font-size:13px"
              onclick="renderAktionsZentrale()">
              Nein
            </button>
          </div>
        </div>
      </div>`;
      renderAktionsZentrale(extraKarte);
    }
  }
}

function verdraengungAkzeptieren(personId, neuerTag, weekKey) {
  if (!config.freieTage) config.freieTage = {};
  if (!config.freieTage[weekKey]) config.freieTage[weekKey] = {};
  config.freieTage[weekKey][personId] = { tag: neuerTag, typ: 'manuell' };
  saveToStorage();
  renderWochenplan();
  renderFreieTage();
}

function personAendernZurueck() {
  const modal = document.getElementById('krankModal');
  const posId = modal.dataset.posId;
  const datum = modal.dataset.datum;
  if (!posId || !datum) return;
  if (config.manuelleZuweisungen?.[datum]) {
    delete config.manuelleZuweisungen[datum][posId];
    if (Object.keys(config.manuelleZuweisungen[datum]).length === 0)
      delete config.manuelleZuweisungen[datum];
  }
  saveToStorage();
  modal.classList.remove('open');
  renderWochenplan();
}

function zelleTap(posId, datum, personId, personName) {
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const tag = wochenplan.find(t => t.datum === datum);
  const z = tag?.zuweisung[posId];
  const pos = (config.positionen || []).find(p => p.id === posId);

  if (!z || z.status === 'gesperrt') { showDetail(posId, datum); return; }

  document.getElementById('krankTitel').textContent = `${personName || '—'} — ${tag.tagKurz} ${tag.datumFormatiert}`;
  document.getElementById('krankSubtitel').textContent = `Position: ${pos?.label || posId}`;
  document.getElementById('krankVon').value = datum;
  document.getElementById('krankBis').value = datum;
  document.getElementById('krankTyp').value = 'krank';

  // Person-Auswahl für "ändern" Tab befüllen
  const alle = (config.personen || []).filter(p =>
    p.attribut !== undefined || true // alle zeigen, auch wenn nicht qualifiziert
  );
  const select = document.getElementById('aendernPerson');
  select.innerHTML = `<option value="">— Person wählen —</option>` +
    (config.personen || []).map(p =>
      `<option value="${p.id}" ${p.id === personId ? 'selected' : ''}>${p.name}</option>`
    ).join('');

  // Platzhalterfeld leeren
  const phField = document.getElementById('aendernPlatzhalter');
  if (phField) phField.value = '';

  const modal = document.getElementById('krankModal');
  modal.dataset.personId = personId || '';
  modal.dataset.posId = posId;
  modal.dataset.datum = datum;

  krankTab('krank'); // Standard: Fehlzeit-Tab
  modal.classList.add('open');
}

function krankBisSetzen(tage) {
  const von = document.getElementById('krankVon').value;
  if (!von) return;
  const d = new Date(von);
  d.setDate(d.getDate() + tage);
  document.getElementById('krankBis').value = FLUSS_LOGIK.dateToISO(d);
}

function krankBisWochenende() {
  const von = document.getElementById('krankVon').value;
  if (!von) return;
  const d = new Date(von);
  // Nächsten Samstag finden
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  document.getElementById('krankBis').value = FLUSS_LOGIK.dateToISO(d);
}

function krankEintragen() {
  const personId = document.getElementById('krankModal').dataset.personId;
  const typ = document.getElementById('krankTyp').value;
  const von = document.getElementById('krankVon').value;
  const bis = document.getElementById('krankBis').value;
  if (!personId || !von || !bis) return;
  if (!config.fehlzeiten) config.fehlzeiten = [];
  config.fehlzeiten.push({ personId, typ, von, bis });
  saveToStorage();
  document.getElementById('krankModal').classList.remove('open');
  renderWochenplan();
  renderFehlzeiten();

  // Krankheits-Assistent nur bei Krankheit (nicht Urlaub) und nur für heute/diese Woche
  if (typ !== 'krank') return;
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const wochentage = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));

  // Alle betroffenen Tage dieser Woche sammeln
  const betroffeneTage = wochentage.filter(d => d >= von && d <= bis);
  if (betroffeneTage.length === 0) return;

  // Änderungsprotokoll: betroffene Positionen pro Tag loggen
  const person = (config.personen || []).find(p => p.id === personId);
  const configOhne = JSON.parse(JSON.stringify(config));
  configOhne.fehlzeiten = (configOhne.fehlzeiten || []).filter(f =>
    !(f.personId === personId && von >= f.von && von <= f.bis));
  betroffeneTage.forEach(datum => {
    const planMit  = FLUSS_LOGIK.berechneWochenplan(config, currentMonday).find(t => t.datum === datum);
    const planOhne = FLUSS_LOGIK.berechneWochenplan(configOhne, currentMonday).find(t => t.datum === datum);
    if (!planMit || !planOhne) return;
    Object.entries(planMit.zuweisung || {}).forEach(([posId, z]) => {
      const vorher = planOhne.zuweisung[posId];
      if (!vorher) return;
      // Nur loggen wenn sich etwas verschlechtert hat
      const statusRank = { stammkraft: 0, kaskade: 1, wolke: 2, joker: 3 };
      const rankVorher = statusRank[vorher.status] ?? 99;
      const rankNachher = statusRank[z.status] ?? 99;
      if (rankNachher > rankVorher) {
        logAenderung(datum, posId, `Fehlzeit: ${person?.name || personId}`);
      }
    });
  });

  // Optionen für alle betroffenen Tage berechnen
  const alleOptionen = betroffeneTage.flatMap(datum =>
    FLUSS_LOGIK.berechneKrankheitsOptionen(config, weekKey, currentMonday, personId, datum)
  );

  if (alleOptionen.length > 0) {
    const person = (config.personen || []).find(p => p.id === personId);
    renderKrankheitsAssistent(alleOptionen, person?.name || personId);
  }
}

function closeKrankModal(e) {
  if (e.target === document.getElementById('krankModal'))
    document.getElementById('krankModal').classList.remove('open');
}

function showDetail(posId, datum) {
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const tag = wochenplan.find(t => t.datum === datum);
  if (!tag) return;
  const z = tag.zuweisung[posId];
  const pos = (config.positionen || []).find(p => p.id === posId);

  document.getElementById('modalTitle').textContent =
    `${pos?.label || posId} — ${tag.tagKurz} ${tag.datumFormatiert}`;

  let content = '';
  const rows = [
    ['Besetzt durch', z.person || '—'],
    ['Status', statusLabel(z.status)],
  ];
  if (z.stammkraftName) {
    rows.push(['Stammkraft', z.stammkraftName]);
    rows.push(['Stammkraft-Status', z.stammkraftGrund || '?']);
  }
  if (z.grund) rows.push(['Grund', z.grund]);

  // Änderungsprotokoll prüfen
  const aenderung = (config.planAenderungen || []).find(e => e.datum === datum && e.posId === posId);
  if (aenderung) {
    const zeit = new Date(aenderung.zeitstempel).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    rows.push(['⚠ Geändert', `${zeit} Uhr`]);
    rows.push(['Grund', aenderung.grund]);
  }

  content = rows.map(([l, v]) =>
    `<div class="modal-row"><span class="modal-label">${l}</span><span>${v}</span></div>`
  ).join('');

  document.getElementById('modalContent').innerHTML = content;
  document.getElementById('detailModal').classList.add('open');
}

function statusLabel(s) {
  return { stammkraft: 'Stammkraft', kaskade: 'Kaskade', wolke: 'Wolke', joker: 'Joker', gesperrt: 'Gesperrt', offen: 'Offen' }[s] || s;
}

function closeModal(e) {
  if (e.target === document.getElementById('detailModal')) {
    document.getElementById('detailModal').classList.remove('open');
  }
}

// ── Tab-Switching ───────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');

  if (id === 'freieTage') { renderFreieTage(); renderWocheStatus(); renderFreiStatus(); renderFreiStatus(); renderVorschlaege(); }
  if (id === 'konfiguration') renderKonfiguration();
  if (id === 'fehlzeiten') renderFehlzeiten();
  if (id === 'uebersicht') renderUebersicht();
  if (id === 'archiv') renderArchiv();
}

function renderArchiv() {
  const container = document.getElementById('archivInhalt');
  const currentWeekKey = FLUSS_LOGIK.getWeekKey(currentMonday);

  // Alle gespeicherten Wochen sammeln und sortieren (neueste zuerst)
  const alleWochen = Object.keys(config.freieTage || {})
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 12); // Max 12 Wochen anzeigen

  if (alleWochen.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);padding:16px;font-size:14px">Noch keine Wochen gespeichert.</p>';
    return;
  }

  const personen = (config.personen || []).filter(p => !p.azubi);

  // Sa-Gesamtstatistik
  const saGesamt = {};
  personen.forEach(p => {
    saGesamt[p.id] = 0;
    alleWochen.forEach(wk => {
      const tag = FLUSS_LOGIK.getFreierTag(p.id, wk, config.freieTage);
      if (tag === 'samstag') saGesamt[p.id]++;
    });
  });

  // KW-Header
  const kwHeaders = alleWochen.map(wk => {
    const kw = wk.split('-W')[1];
    const isCurrent = wk === currentWeekKey;
    return `<th class="archiv-kw-header ${isCurrent ? 'current' : ''}">KW${kw}</th>`;
  }).join('');

  // Zeilen pro Person
  const rows = personen.map(p => {
    const zellen = alleWochen.map(wk => {
      const tag = FLUSS_LOGIK.getFreierTag(p.id, wk, config.freieTage);
      const typ = FLUSS_LOGIK.getFreierTagTyp(p.id, wk, config.freieTage);
      if (!tag) return `<td><span class="archiv-cell-leer">—</span></td>`;
      const tagIdx = TAGE_NAMEN_LANG.indexOf(tag);
      const label = TAGE_NAMEN_KURZ[tagIdx] || tag;
      const isSa = tag === 'samstag';
      return `<td><span class="${isSa ? 'archiv-cell-sa' : 'archiv-cell-tag'}" title="${typ || ''}">${label}</span></td>`;
    }).join('');

    const saCount = saGesamt[p.id];
    const saBar = saCount > 0
      ? `<span style="background:#fff3d0;color:#8a6000;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px">${saCount}× Sa</span>`
      : '';

    return `<tr>
      <td>${p.name}${saBar}</td>
      ${zellen}
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="section-title" style="padding:16px 0 8px">Freie Tage — letzte ${alleWochen.length} Wochen</div>
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:12px">
      Samstag <span class="archiv-cell-sa" style="font-size:11px">Sa</span> farblich hervorgehoben.
      Wird vom Auto-Verteilen zur fairen Rotation genutzt.
    </p>
    <div style="overflow-x:auto">
      <table class="archiv-table">
        <thead>
          <tr>
            <th>Person</th>
            ${kwHeaders}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderUebersicht() {
  const positionen = config.positionen || [];
  const grid = document.getElementById('uebersichtGrid');
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const historie = FLUSS_LOGIK.getFreierTagHistorie(config, null);

  // Sa-Ranking für alle Personen
  const saZaehler = {};
  (config.personen || []).forEach(p => {
    saZaehler[p.id] = (historie[p.id] || {})['samstag'] || 0;
  });

  grid.innerHTML = '<div class="uebersicht-grid">' +
    (config.personen || []).map(p => {
      const stammkraftPos = positionen.find(pp => pp.id === p.stammkraft_von);
      const rolle = stammkraftPos
        ? `<span class="ue-rolle stammkraft">${stammkraftPos.label}</span>`
        : `<span class="ue-rolle wolke">Wolke</span>`;
      const azubiBadge = p.azubi ? '<span class="azubi-badge">Azubi</span>' : '';

      const attrPills = (p.attribute || []).map((a, i) =>
        `<div class="ue-attr"><span class="ue-attr-num">${i+1}</span>${a}</div>`
      ).join('');

      const tags = [];
      if ((p.gesperrt || []).length > 0) {
        const sperr = p.gesperrt.map(t => t.substring(0,2).toUpperCase()).join(', ');
        tags.push(`<span class="ue-tag sperr">Gesperrt: ${sperr}</span>`);
      }
      const freiTag = FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage);
      const freiTyp = FLUSS_LOGIK.getFreierTagTyp(p.id, weekKey, config.freieTage);
      if (freiTag) {
        const idx = TAGE_NAMEN_LANG.indexOf(freiTag);
        const typLabel = freiTyp === 'wunsch' ? ' ★' : freiTyp === 'auto' ? ' (Auto)' : ' (M)';
        tags.push(`<span class="ue-tag">Frei KW ${weekKey.split('-W')[1]}: ${TAGE_NAMEN_KURZ[idx] || freiTag}${typLabel}</span>`);
      }
      if (p.wunschFreierTag) {
        const idx = TAGE_NAMEN_LANG.indexOf(p.wunschFreierTag);
        tags.push(`<span class="ue-tag">Wunsch: ${TAGE_NAMEN_KURZ[idx] || p.wunschFreierTag}</span>`);
      }

      // Sa-Statistik
      if (!p.azubi) {
        const saAnzahl = saZaehler[p.id] || 0;
        tags.push(`<span class="ue-tag" style="color:var(--amber);border-color:var(--amber)">Sa frei: ${saAnzahl}×</span>`);
      }

      return `<div class="ue-card">
        <div class="ue-card-top">
          <div class="ue-name">${p.name}${azubiBadge}</div>
          ${rolle}
        </div>
        <div class="ue-attr-list">${attrPills || '<span style="color:var(--text-dim);font-size:13px">Keine Attribute</span>'}</div>
        ${tags.length > 0 ? `<div class="ue-footer">${tags.join('')}</div>` : ''}
      </div>`;
    }).join('') +
  '</div>';
}

// ── Krankheits-Assistent ────────────────────────────────

function renderKrankheitsAssistent(optionen, krankerName) {
  const TK = TAGE_NAMEN_KURZ;
  const TL = TAGE_NAMEN_LANG;

  const typLabel = {
    direkt:              { icon: 'ph-check-circle', farbe: '#2e6b42', bg: '#e8f5ec', border: '#b0d8bc', titel: 'Direkt verfügbar' },
    freitag_verschieben: { icon: 'ph-arrows-clockwise', farbe: '#7a5200', bg: '#fffbf0', border: '#e8d090', titel: 'Freier Tag verschieben' },
    freitag_aufloesen:   { icon: 'ph-calendar-x', farbe: '#9b2c2c', bg: '#fdf0f0', border: '#e8b0b0', titel: 'Freier Tag opfern — Versprechen Folgewoche' }
  };

  const karten = optionen.map((opt, i) => {
    const t = typLabel[opt.typ];
    const tagKurz = TK[TL.indexOf(opt.tagName) + 1] || opt.tagName;

    let beschreibung = '';
    if (opt.typ === 'direkt') {
      beschreibung = `${opt.personName} ist heute verfügbar und kann ${opt.posLabel} übernehmen.`;
    } else if (opt.typ === 'freitag_verschieben') {
      const neuerKurz = TK[TL.indexOf(opt.neuerFreierTag) + 1] || opt.neuerFreierTag;
      beschreibung = `${opt.personName} hat heute frei, arbeitet stattdessen ${opt.posLabel}. Freier Tag rückt auf ${neuerKurz}.`;
    } else if (opt.typ === 'freitag_aufloesen') {
      beschreibung = `${opt.personName} opfert den heutigen freien Tag. In der Folgewoche wird ${opt.personName} bei der Verteilung bevorzugt.`;
    }

    return `<div style="display:flex;align-items:flex-start;gap:12px;background:${t.bg};border:1.5px solid ${t.border};border-radius:10px;padding:12px 16px;margin-bottom:8px">
      <i class="ph ${t.icon}" style="font-size:22px;color:${t.farbe};flex-shrink:0;margin-top:2px"></i>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:${t.farbe};text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px">${t.titel}</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:8px;line-height:1.4">${beschreibung}</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px">
          ${tagKurz} · ${opt.posLabel} · ${opt.datum}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" style="padding:5px 14px;font-size:13px"
            onclick="krankheitsOptionUebernehmen(${i})">
            ✓ Übernehmen
          </button>
          <button class="btn btn-secondary" style="padding:5px 12px;font-size:13px"
            onclick="renderAktionsZentrale()">
            Ignorieren
          </button>
        </div>
      </div>
    </div>`;
  });

  const header = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <i class="ph ph-first-aid" style="font-size:20px;color:var(--red-bright)"></i>
    <span style="font-weight:700;font-size:15px;color:var(--red-bright)">Lücke durch Ausfall — ${krankerName}</span>
  </div>`;

  // Optionen global speichern damit onclick-Handler darauf zugreifen kann
  window._krankheitsOptionen = optionen;

  renderAktionsZentrale(header + karten.join(''));
}

function krankheitsOptionUebernehmen(idx) {
  const opt = window._krankheitsOptionen?.[idx];
  if (!opt) return;

  // Manuell zuweisen
  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  if (!config.manuelleZuweisungen[opt.datum]) config.manuelleZuweisungen[opt.datum] = {};
  config.manuelleZuweisungen[opt.datum][opt.posId] = opt.personId;

  // Freien Tag behandeln
  if (opt.typ === 'freitag_verschieben') {
    if (!config.freieTage) config.freieTage = {};
    if (!config.freieTage[opt.weekKey]) config.freieTage[opt.weekKey] = {};
    config.freieTage[opt.weekKey][opt.personId] = { tag: opt.neuerFreierTag, typ: 'manuell' };
  } else if (opt.typ === 'freitag_aufloesen') {
    // Heutigen freien Tag entfernen
    if (config.freieTage?.[opt.weekKey]?.[opt.personId]) {
      delete config.freieTage[opt.weekKey][opt.personId];
    }
    // Versprechen in Folgewoche setzen (typ: 'versprochen' → beim Auto-Verteilen bevorzugt)
    if (opt.versprechenWK) {
      if (!config.freieTage) config.freieTage = {};
      if (!config.freieTage[opt.versprechenWK]) config.freieTage[opt.versprechenWK] = {};
      config.freieTage[opt.versprechenWK][opt.personId] = { tag: 'samstag', typ: 'versprochen' };
    }
  }

  saveToStorage();
  window._krankheitsOptionen = null;
  // Änderung protokollieren
  logAenderung(opt.datum, opt.posId, `Notfall-Einspringer: ${opt.personName} → ${opt.posLabel}`);
  renderWochenplan();
  renderAktionsZentrale();
}
function renderPersonSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">— Person wählen —</option>' +
    (config.personen || [])
      .map(p => `<option value="${p.id}">${p.name}</option>`)
      .join('');
}

function addFehlzeit() {
  const personId = document.getElementById('fz-person').value;
  const typ = document.getElementById('fz-typ').value;
  const von = document.getElementById('fz-von').value;
  const bis = document.getElementById('fz-bis').value;
  if (!personId || !von || !bis) { alert('Bitte alle Felder ausfüllen.'); return; }
  if (von > bis) { alert('"Von" muss vor "Bis" liegen.'); return; }
  if (!config.fehlzeiten) config.fehlzeiten = [];
  config.fehlzeiten.push({ personId, typ, von, bis });
  saveToStorage();
  renderFehlzeiten();
  renderWochenplan();
}

function removeFehlzeit(idx) {
  config.fehlzeiten.splice(idx, 1);
  saveToStorage();
  renderFehlzeiten();
  renderWochenplan();
}

function renderFehlzeiten() {
  renderPersonSelect('fz-person');
  const liste = document.getElementById('fehlzeitenListe');

  // Spontane Fehlzeiten (löschbar)
  const spontan = (config.fehlzeiten || []).map((f, i) => ({...f, _idx: i}))
    .sort((a, b) => b.von.localeCompare(a.von));

  // Geplanter Urlaub aus Config (nur anzeigen, nicht löschbar)
  const geplantUrlaub = Object.entries(config.urlaub || {}).flatMap(([personId, eintraege]) =>
    (eintraege || [])
      .filter(e => e.von && e.bis)
      .map(e => ({ personId, von: e.von, bis: e.bis, notiz: e.notiz, _config: true }))
  ).sort((a, b) => b.von.localeCompare(a.von));

  if (spontan.length === 0 && geplantUrlaub.length === 0) {
    liste.innerHTML = '<p style="color:var(--text-dim);font-size:14px">Keine Fehlzeiten erfasst.</p>';
    return;
  }

  const spontanHtml = spontan.map(f => {
    const person = (config.personen || []).find(p => p.id === f.personId);
    const typBadge = f.typ === 'krank'
      ? `<span style="color:#f08080">${f.typ}</span>`
      : `<span style="color:#80c0f0">${f.typ}</span>`;
    return `<div class="list-item">
      <div class="list-item-info">
        <div class="list-item-name">${person?.name || f.personId}</div>
        <div class="list-item-sub">${typBadge} · ${f.von} bis ${f.bis}</div>
      </div>
      <button class="btn btn-danger" onclick="removeFehlzeit(${f._idx})">
        <i class="ph ph-trash"></i>
      </button>
    </div>`;
  }).join('');

  const geplantHtml = geplantUrlaub.length > 0 ? `
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:8px">
        🌴 Geplanter Urlaub (Config)
      </div>
      ${geplantUrlaub.map(f => {
        const person = (config.personen || []).find(p => p.id === f.personId);
        return `<div class="list-item" style="opacity:0.85">
          <div class="list-item-info">
            <div class="list-item-name">${person?.name || f.personId}</div>
            <div class="list-item-sub">
              <span style="color:#80c0f0">urlaub</span> · ${f.von} bis ${f.bis}
              ${f.notiz ? `<span style="color:var(--text-dim);margin-left:6px">${f.notiz}</span>` : ''}
            </div>
          </div>
          <span style="font-size:11px;color:var(--text-dim);padding:4px 8px;border:1px solid var(--border);border-radius:6px;white-space:nowrap">Config</span>
        </div>`;
      }).join('')}
    </div>` : '';

  liste.innerHTML = spontanHtml + geplantHtml;
}


// ── Top-Tab-Navigation ──────────────────────────────────
// Schaltet zwischen Plan / Freie Tage / Konfiguration um.
function switchTopTab(tabName, btn) {
  document.querySelectorAll('.top-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.top-tab-btn').forEach(el => el.classList.remove('active'));
  const content = document.getElementById('top-tab-' + tabName);
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');
  // Freie-Tage-Tab lazy rendern
  if (tabName === 'freieTage') {
    renderFreieTage();
    renderWocheStatus();
    renderFreiStatus();
    renderVorschlaege();
  }
  if (tabName === 'konfig') {
    renderFruehschichtAccordion();
  }
}

// ── Top-Tab-Navigation ──────────────────────────────────
function switchTopTab(tabName, btn) {
  document.querySelectorAll('.top-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.top-tab-btn').forEach(el => el.classList.remove('active'));
  const content = document.getElementById('top-tab-' + tabName);
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');
  if (tabName === 'freieTage') {
    renderFreieTage();
    renderWocheStatus();
    renderFreiStatus();
    renderVorschlaege();
  }
}

// ── Urlaub & Krank exportieren ──────────────────────────
// Exportiert config.fehlzeiten als ladbare JS-Datei.
// Format: window.BOS_FEHLZEITEN = [...] — analog zu exportArbeitsplan().
function exportUrlaubKrank() {
  const fehlzeiten  = config.fehlzeiten || [];
  const einsaetze   = config.fruehschichtEinsaetze || [];
  const anheften    = !!config.fruehschichtFreitagAnheften;
  const datum = new Date().toLocaleDateString('de-DE');
  const iso   = new Date().toISOString().split('T')[0];

  const fruehschicht = { einsaetze, freierTagAnheften: anheften };

  const inhalt = [
    `// BäckereiOS — Urlaub, Krank & Frühschicht-Einsätze`,
    `// Erstellt: ${datum}`,
    `// Fehlzeiten: ${fehlzeiten.length}  ·  Frühschicht-Einsätze: ${einsaetze.length}`,
    `// Diese Datei deployten damit alle Geräte denselben Stand haben.`,
    ``,
    `window.BOS_FEHLZEITEN = ${JSON.stringify(fehlzeiten, null, 2)};`,
    ``,
    `window.BOS_FRUEHSCHICHT = ${JSON.stringify(fruehschicht, null, 2)};`
  ].join('\n');

  const blob = new Blob([inhalt], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `urlaub_krank.js`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// ═══════════════════════════════════════════════════════
// ── Frühschicht-Einsätze (im Konfiguration-Tab) ────────
// ═══════════════════════════════════════════════════════

function renderFruehschichtAccordion() {
  // Checkbox-Zustand setzen
  const chk = document.getElementById('chkFruehAnheften');
  if (chk) chk.checked = !!config.fruehschichtFreitagAnheften;

  // Personen-Select befüllen
  const sel = document.getElementById('fs-person');
  if (sel) {
    const aktuell = sel.value;
    sel.innerHTML = '<option value="">— Person wählen —</option>' +
      (config.personen || []).filter(p => !p.azubi)
        .map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (aktuell) sel.value = aktuell;
  }

  // Liste rendern
  const liste = document.getElementById('fruehschichtListe');
  if (!liste) return;
  const einsaetze = config.fruehschichtEinsaetze || [];
  if (einsaetze.length === 0) {
    liste.innerHTML = '<p style="color:var(--text-dim);font-size:13px;margin-top:8px">Keine Einsätze eingetragen.</p>';
    return;
  }
  liste.innerHTML = einsaetze.map((e, i) => {
    const p    = (config.personen || []).find(p => p.id === e.personId);
    const blk  = e.block === 'ende' ? 'Do/Fr/Sa — Ende' : 'Mo/Di/Mi — Anfang';
    const vonF = e.von ? new Date(e.von + 'T12:00').toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }) : '?';
    const bisF = e.bis ? new Date(e.bis + 'T12:00').toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }) : '?';
    return `<div class="list-item" style="margin-top:8px">
      <div class="list-item-info">
        <div class="list-item-name">🌅 ${p?.name || e.personId}</div>
        <div class="list-item-sub">${blk} · ${vonF} – ${bisF}</div>
      </div>
      <button class="btn btn-danger" onclick="removeFruehschichtEinsatz(${i})">
        <i class="ph ph-trash"></i>
      </button>
    </div>`;
  }).join('');
}

function addFruehschichtEinsatz() {
  const personId = document.getElementById('fs-person')?.value;
  const block    = document.getElementById('fs-block')?.value || 'anfang';
  const von      = document.getElementById('fs-von')?.value;
  const bis      = document.getElementById('fs-bis')?.value;
  if (!personId || !von || !bis) { alert('Bitte Person, Von und Bis ausfüllen.'); return; }
  if (von > bis) { alert('"Von" muss vor oder gleich "Bis" liegen.'); return; }
  if (!config.fruehschichtEinsaetze) config.fruehschichtEinsaetze = [];
  config.fruehschichtEinsaetze.push({ personId, block, von, bis });
  saveToStorage();
  renderFruehschichtAccordion();
  renderAll();
}

function removeFruehschichtEinsatz(idx) {
  if (!confirm('Einsatz löschen?')) return;
  config.fruehschichtEinsaetze.splice(idx, 1);
  saveToStorage();
  renderFruehschichtAccordion();
  renderAll();
}

function toggleFruehschichtAnheften(val) {
  config.fruehschichtFreitagAnheften = val;
  saveToStorage();
  renderWochenplan();
}
