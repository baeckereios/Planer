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
    const wochenplan2 = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
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
    const wochenplan = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
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
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
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
    const planMit  = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday).find(t => t.datum === datum);
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
    FLUSS_LOGIK.berechneKrankheitsOptionen(configForFluss(), weekKey, currentMonday, personId, datum)
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
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(configForFluss(), currentMonday);
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
  const currentWeekKey = getSchichtWeekKey(); // schicht-namespace für freieTage-Vergleich

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
  const historie = FLUSS_LOGIK.getFreierTagHistorie(configForFluss(), null);

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

  if (spontan.length === 0) {
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


  liste.innerHTML = spontanHtml;
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
    renderKonfigDateiBox();
  }
  if (tabName === 'statistik') {
    renderStatistik();
  }
}


// ── Urlaub & Krank exportieren ──────────────────────────
// Exportiert config.fehlzeiten als ladbare JS-Datei.
// Format: window.BOS_FEHLZEITEN = [...] — analog zu exportArbeitsplan().
function exportUrlaubKrank() {
  if (!window._urlaubKrankGeladen) {
    alert('Bitte zuerst die aktuelle urlaub_krank.js laden.');
    return;
  }
  const fehlzeiten  = config.fehlzeiten || [];
  const einsaetze   = config.fruehschichtEinsaetze || [];
  const anheften    = !!config.fruehschichtFreitagAnheften;
  const datum = new Date().toLocaleDateString('de-DE');
  const iso   = new Date().toISOString().split('T')[0];

  const fruehschicht = { einsaetze, freierTagAnheften: anheften };

  const feiertage   = config.feiertagsConfig || {};

  const inhalt = [
    `// BäckereiOS — Urlaub, Krank, Frühschicht & Feiertage`,
    `// Erstellt: ${datum}`,
    `// Fehlzeiten: ${fehlzeiten.length}  ·  Frühschicht: ${einsaetze.length}  ·  Feiertage: ${Object.keys(feiertage).length}`,
    `// Diese Datei deployten damit alle Geräte denselben Stand haben.`,
    ``,
    `window.BOS_FEHLZEITEN = ${JSON.stringify(fehlzeiten, null, 2)};`,
    ``,
    `window.BOS_FRUEHSCHICHT = ${JSON.stringify(fruehschicht, null, 2)};`,
    ``,
    `window.BOS_FEIERTAGE = ${JSON.stringify(feiertage, null, 2)};`
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

// ═══════════════════════════════════════════════════════
// ── Statistik-Tab ───────────────────────────────────────
// ═══════════════════════════════════════════════════════

function renderStatistik() {
  const n = Math.max(1, Math.min(52, parseInt(document.getElementById('statistikWochen')?.value) || 8));
  const container = document.getElementById('statistikTabelle');
  if (!container) return;

  // ── Wochen berechnen (älteste links → neueste rechts) ──
  const wochen = [];
  const base = FLUSS_LOGIK.getMondayOfWeek(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(base);
    m.setDate(base.getDate() - i * 7);
    wochen.push(FLUSS_LOGIK.getWeekKey(m));
  }

  const personen = (config.personen || []).filter(p => !p.azubi);
  if (personen.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Keine Personen konfiguriert.</p>';
    return;
  }

  // ── Kopfzeile ──
  const thBase = 'padding:7px 8px;font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;border-bottom:2px solid var(--border);text-align:center;';
  const thLeft = thBase + 'text-align:left;position:sticky;left:0;background:var(--bg2);z-index:2;min-width:80px;';
  const thSummary = thBase + 'min-width:36px;';

  let html = `<table style="border-collapse:collapse;font-size:13px;background:var(--bg2)">`;
  html += `<thead><tr>`;
  html += `<th style="${thLeft}">Person</th>`;
  html += `<th style="${thSummary}color:#8a6000">Sa</th>`;
  html += `<th style="${thSummary}color:#2a4e7a">Mo</th>`;
  html += `<th style="${thSummary}color:var(--green)">✓</th>`;

  wochen.forEach(wk => {
    const kw = wk.split('-W')[1];
    const isCurrentWeek = wk === FLUSS_LOGIK.getWeekKey(base);
    html += `<th style="${thBase}${isCurrentWeek ? 'color:var(--amber);' : 'color:var(--text-dim);'}">
      ${kw}
    </th>`;
  });
  html += `</tr></thead><tbody>`;

  // ── Zeilen ──
  personen.forEach((p, ri) => {
    const rowBg = ri % 2 === 0 ? 'background:var(--bg2)' : 'background:var(--bg)';
    let saCount = 0, moCount = 0, wunschCount = 0;

    const zellen = wochen.map(wk => {
      const swk = currentSchicht + '_' + wk;
      const eintrag = config.freieTage?.[swk]?.[p.id];
      if (!eintrag) {
        return `<td style="text-align:center;padding:5px 6px;color:#ccc;border-bottom:1px solid var(--border)">—</td>`;
      }
      const tag = typeof eintrag === 'string' ? eintrag : eintrag.tag;
      if (!tag) {
        return `<td style="text-align:center;padding:5px 6px;color:#ccc;border-bottom:1px solid var(--border)">—</td>`;
      }

      const tagIdx    = TAGE_NAMEN_LANG.indexOf(tag);
      const tagKurz   = TAGE_NAMEN_KURZ[tagIdx] ?? tag.substring(0, 2);
      const istWunsch = p.wunschFreierTag && tag === p.wunschFreierTag;

      if (tag === 'samstag')  saCount++;
      if (tag === 'montag')   moCount++;
      if (istWunsch)          wunschCount++;

      let bg = 'transparent', color = 'var(--text)', fw = '600', extra = '';
      if (tag === 'samstag') { bg = '#fff3d0'; color = '#8a6000'; fw = '700'; }
      else if (tag === 'montag') { bg = '#eef4fb'; color = '#2a4e7a'; fw = '700'; }

      const wunschMark = istWunsch
        ? `<span style="color:var(--green);font-size:10px;margin-left:1px">✓</span>`
        : '';

      return `<td style="text-align:center;padding:5px 6px;background:${bg};color:${color};font-weight:${fw};border-bottom:1px solid var(--border);white-space:nowrap">
        ${tagKurz}${wunschMark}
      </td>`;
    }).join('');

    // Wunsch-Quote berechnen
    const wochenMitDaten = wochen.filter(wk => {
      const e = config.freieTage?.[currentSchicht + '_' + wk]?.[p.id];
      return e && (typeof e === 'string' ? e : e.tag);
    }).length;
    const wunschQuote = p.wunschFreierTag && wochenMitDaten > 0
      ? `<div style="font-size:10px;color:var(--text-dim);font-weight:400">${wochenMitDaten}W</div>`
      : '';

    html += `<tr style="${rowBg}">`;
    // Sticky Personen-Spalte
    html += `<td style="font-weight:700;padding:6px 10px;white-space:nowrap;position:sticky;left:0;${rowBg};z-index:1;border-bottom:1px solid var(--border)">
      ${p.name}
      ${p.wunschFreierTag ? `<div style="font-size:10px;color:var(--text-dim);font-weight:400">Wunsch: ${TAGE_NAMEN_KURZ[TAGE_NAMEN_LANG.indexOf(p.wunschFreierTag)] || '?'}</div>` : ''}
    </td>`;
    // Summary-Spalten
    html += `<td style="text-align:center;padding:6px 8px;font-weight:700;color:${saCount > 0 ? '#8a6000' : 'var(--text-dim)'};border-bottom:1px solid var(--border)">${saCount}</td>`;
    html += `<td style="text-align:center;padding:6px 8px;font-weight:700;color:${moCount > 0 ? '#2a4e7a' : 'var(--text-dim)'};border-bottom:1px solid var(--border)">${moCount}</td>`;
    html += `<td style="text-align:center;padding:6px 8px;font-weight:700;color:${wunschCount > 0 ? 'var(--green)' : 'var(--text-dim)'};border-bottom:1px solid var(--border)">
      ${p.wunschFreierTag ? wunschCount : '<span style="color:#ddd">—</span>'}
      ${wunschQuote}
    </td>`;
    html += zellen;
    html += `</tr>`;
  });

  // ── Summen-Zeile ──
  html += `<tr style="border-top:2px solid var(--border);background:var(--bg3)">`;
  html += `<td style="font-weight:700;padding:6px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;position:sticky;left:0;background:var(--bg3);z-index:1;color:var(--text-dim)">Gesamt</td>`;
  // Summary-Summen (leer — pro Person schon sichtbar)
  html += `<td colspan="3"></td>`;
  // Pro KW: zähle wie viele Personen Daten haben
  wochen.forEach(wk => {
    const mitDaten = personen.filter(p => {
      const e = config.freieTage?.[currentSchicht + '_' + wk]?.[p.id];
      return e && (typeof e === 'string' ? e : e.tag);
    }).length;
    const anteil = personen.length > 0 ? mitDaten / personen.length : 0;
    const barColor = anteil === 1 ? 'var(--green)' : anteil > 0 ? 'var(--amber)' : '#ddd';
    html += `<td style="text-align:center;padding:4px 6px">
      <div style="font-size:11px;font-weight:700;color:${barColor}">${mitDaten > 0 ? mitDaten + '/' + personen.length : '—'}</div>
    </td>`;
  });
  html += `</tr>`;

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
// ── Genehmigen-Workflow ─────────────────────────────────
// ═══════════════════════════════════════════════════════

// Geladene schichtplaene.js — in-memory bis zum Genehmigen
window._schichtplaeneDaten   = null;
window._schichtplaeneGeladen = false;

// ── schichtplaene.js laden ──────────────────────────────
function ladeSchichtplaene(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      // Robuster Parser — findet window.BOS_SCHICHTPLAENE unabhängig von Kommentaren
      const prefix = 'window.BOS_SCHICHTPLAENE = ';
      const start  = text.indexOf(prefix);
      if (start === -1) throw new Error('window.BOS_SCHICHTPLAENE nicht gefunden');
      const raw   = text.slice(start + prefix.length).trim().replace(/;\s*$/, '');
      const daten = JSON.parse(raw);
      window._schichtplaeneDaten   = daten;
      window._schichtplaeneGeladen = true;
      renderGenehmigenBlock();
    } catch(err) {
      alert('Ungültige schichtplaene.js — konnte nicht gelesen werden.');
    }
  };
  reader.readAsText(file);
  // Input zurücksetzen damit dieselbe Datei nochmal geladen werden kann
  event.target.value = '';
}

// ── Genehmigen-Block rendern ────────────────────────────
function renderGenehmigenBlock() {
  const block = document.getElementById('genehmigenBlock');
  if (!block) return;

  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday); // für Anzeige
  const schichtWK = getSchichtWeekKey();
  const hatDaten    = typeof _wocheHatDaten === 'function' && _wocheHatDaten(schichtWK);
  const istGenehmigt = typeof _istWocheGenehmigt === 'function' && _istWocheGenehmigt(schichtWK);

  // Kein Plan → Block verstecken
  if (!hatDaten) { block.innerHTML = ''; return; }

  // ── Bereits genehmigt ──
  if (istGenehmigt) {
    const datum = config.freieTage?.[weekKey]?._meta?.bestaetigtAm || '';
    block.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;background:var(--green-bg);border:1.5px solid #b0d8bc;border-radius:10px;padding:10px 14px;margin-bottom:4px">
        <i class="ph ph-seal-check" style="font-size:20px;color:var(--green);flex-shrink:0"></i>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--green)">KW ${weekKey.split('-W')[1]} — Genehmigt${datum ? ' am ' + datum : ''}</div>
          <div style="font-size:11px;color:#5a8a5a;margin-top:1px">Plan ist gesperrt · Freie Tage in Statistik eingeflossen</div>
        </div>
      </div>`;
    return;
  }

  // ── Noch nicht genehmigt ──
  const kw = weekKey.split('-W')[1];
  const anzahlWochen = window._schichtplaeneDaten
    ? Object.keys(window._schichtplaeneDaten).length
    : null;
  const statusText = window._schichtplaeneGeladen
    ? `<span style="color:var(--green);font-weight:700"><i class="ph ph-check-circle"></i> schichtplaene.js geladen${anzahlWochen !== null ? ' · ' + anzahlWochen + ' Wochen' : ''}</span>`
    : `<span style="color:var(--text-dim)">Noch nicht geladen — erforderlich vor dem Genehmigen</span>`;

  block.innerHTML = `
    <div style="background:#fffbf0;border:1.5px solid #e8d090;border-radius:10px;padding:12px 16px;margin-bottom:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <i class="ph ph-seal" style="font-size:18px;color:#b8790a"></i>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#7a5200;text-transform:uppercase;letter-spacing:0.4px">Plan genehmigen — KW ${kw}</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;padding:8px 10px;background:white;border:1px solid #e8d090;border-radius:8px">
        <div>
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:2px">
            Datei: <strong>schichtplaene.js</strong> — Root-Ordner (neben schichtplaner_config.json)
          </div>
          <div style="font-size:12px">${statusText}</div>
        </div>
        <label for="importSchichtplaene"
          style="cursor:pointer;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;flex-shrink:0">
          <i class="ph ph-upload-simple"></i> Laden
        </label>
      </div>

      <button onclick="genehmigeWoche()"
        ${window._schichtplaeneGeladen ? '' : 'disabled'}
        style="width:100%;background:${window._schichtplaeneGeladen ? 'var(--green)' : '#aaa'};color:white;border:none;border-radius:8px;padding:10px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;cursor:${window._schichtplaeneGeladen ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.15s">
        <i class="ph ph-seal-check"></i> KW ${kw} genehmigen &amp; schichtplaene.js herunterladen
      </button>
    </div>`;
}

// ── Woche genehmigen ────────────────────────────────────
function genehmigeWoche() {
  if (!window._schichtplaeneGeladen || !window._schichtplaeneDaten) {
    alert('Bitte zuerst schichtplaene.js laden.');
    return;
  }

  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday); // für Anzeige
  const schichtWK = getSchichtWeekKey();
  if (!_wocheHatDaten(schichtWK)) {
    alert('Kein Plan für diese Woche — zuerst Generieren drücken.');
    return;
  }
  if (_istWocheGenehmigt(schichtWK)) {
    alert('Diese Woche ist bereits genehmigt.');
    return;
  }

  // _meta.bestaetigt setzen
  if (!config.freieTage[schichtWK]) config.freieTage[schichtWK] = {};
  config.freieTage[schichtWK]._meta = {
    bestaetigt:   new Date().toISOString(),
    bestaetigtAm: new Date().toLocaleDateString('de-DE')
  };
  saveToStorage();

  // Aktuelle Woche in schichtplaene.js anhängen (mit Schicht-Namespace)
  const daten = window._schichtplaeneDaten;
  daten[schichtWK] = { ...config.freieTage[schichtWK] };

  // Datei generieren und herunterladen
  const anzahl = Object.keys(daten).length;
  const datum  = new Date().toLocaleDateString('de-DE');
  const inhalt = [
    `// BäckereiOS — Genehmigte Schichtpläne`,
    `// Aktualisiert: ${datum} · ${anzahl} Wochen`,
    `// In Root-Ordner deployen (gleiche Ebene wie schichtplaner_config.json)`,
    ``,
    `window.BOS_SCHICHTPLAENE = ${JSON.stringify(daten, null, 2)};`
  ].join('\n');

  const blob = new Blob([inhalt], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'schichtplaene.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);

  // UI aktualisieren
  renderWochenLabel();
  renderWochenplan();
}

// ═══════════════════════════════════════════════════════
// ── Feiertags-Verhalten (Punkt 3) ──────────────────────
// ═══════════════════════════════════════════════════════

function _feiertagsNDS(jahr) {
  // Osterberechnung (Gauß-Algorithmus)
  const a=jahr%19,b=Math.floor(jahr/100),c=jahr%100,d=Math.floor(b/4),
        e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
        h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,
        l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const om=Math.floor((h+l-7*m+114)/31), ot=((h+l-7*m+114)%31)+1;
  const ostern = new Date(jahr, om-1, ot);
  const add = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
  const fmt = d => d.toISOString().split('T')[0];
  return [
    { datum:`${jahr}-01-01`, name:'Neujahr' },
    { datum:fmt(add(ostern,-2)), name:'Karfreitag' },
    { datum:fmt(add(ostern,1)),  name:'Ostermontag' },
    { datum:`${jahr}-05-01`,     name:'Tag der Arbeit' },
    { datum:fmt(add(ostern,39)), name:'Christi Himmelfahrt' },
    { datum:fmt(add(ostern,50)), name:'Pfingstmontag' },
    { datum:`${jahr}-10-03`,     name:'Tag der deutschen Einheit' },
    { datum:`${jahr}-10-31`,     name:'Reformationstag' },
    { datum:`${jahr}-12-25`,     name:'1. Weihnachtstag' },
    { datum:`${jahr}-12-26`,     name:'2. Weihnachtstag' },
  ].sort((a,b)=>a.datum.localeCompare(b.datum));
}

function renderFeiertagsVerhalten() {
  const liste = document.getElementById('feiertagsListe');
  if (!liste) return;

  const heute = new Date().toISOString().split('T')[0];
  const jahr  = new Date().getFullYear();

  // Feiertage: aktuelles Jahr + nächstes Jahr, gefiltert auf ±90 Tage Vergangenheit
  const grenze = new Date(); grenze.setDate(grenze.getDate() - 90);
  const grenzeISO = grenze.toISOString().split('T')[0];
  const feiertage = [
    ..._feiertagsNDS(jahr),
    ..._feiertagsNDS(jahr + 1)
  ].filter(f => f.datum >= grenzeISO);

  if (feiertage.length === 0) {
    liste.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Keine Feiertage im Zeitraum.</p>';
    return;
  }

  const personen = (config.personen || []).filter(p => !p.azubi);

  const karten = feiertage.map(f => {
    const cfg = (config.feiertagsConfig || {})[f.datum] || {};
    const offen = cfg.offen || false;
    const einsatz = cfg.einsatz || [];           // arbeitet an dem Tag (wenn offen)
    const sonntagsArbeiter = cfg.sonntagsArbeiter || []; // bekommt Ausgleich (wenn geschlossen)
    const istVergangenheit = f.datum < heute;
    const dimStyle = istVergangenheit ? 'opacity:0.6' : '';

    // Datum formatieren
    const [j,m,t] = f.datum.split('-');
    const datumDE = `${t}.${m}.${j}`;
    const wochentag = ['So','Mo','Di','Mi','Do','Fr','Sa'][new Date(f.datum+'T12:00').getDay()];

    // Status-Badge
    const badge = offen
      ? `<span style="background:#fff8e8;color:#7a5200;border:1px solid #e8d090;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700">Offen</span>`
      : `<span style="background:var(--green-bg);color:var(--green);border:1px solid #b0d8bc;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700">Geschlossen</span>`;

    // Personen-Checkboxen
    const personenHtml = personen.map(p => {
      const relevant = offen ? einsatz.includes(p.id) : sonntagsArbeiter.includes(p.id);
      return `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;font-size:13px">
        <input type="checkbox" ${relevant ? 'checked' : ''}
          onchange="saveFeiertag('${f.datum}', '${offen ? 'einsatz' : 'sonntagsArbeiter'}', '${p.id}', this.checked)"
          style="accent-color:var(--amber);width:15px;height:15px">
        ${p.name}
      </label>`;
    }).join('');

    // Ausgleich-Info
    const relevantePersonen = offen ? einsatz : sonntagsArbeiter;
    const ausgleichHinweis = relevantePersonen.length > 0
      ? `<div style="margin-top:8px;padding:6px 10px;background:${offen ? '#fff8e8' : 'var(--green-bg)'};border-radius:6px;font-size:11px;color:${offen ? '#7a5200' : 'var(--green)'}">
          <i class="ph ph-arrow-circle-right"></i>
          ${offen
            ? `${relevantePersonen.map(id => personen.find(p=>p.id===id)?.name||id).join(', ')} → Ausgleichstag steht zu`
            : `${relevantePersonen.map(id => personen.find(p=>p.id===id)?.name||id).join(', ')} → +1 freier Tag neben Feiertag`}
        </div>`
      : '';

    return `<div style="${dimStyle};border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
      <!-- Kopfzeile -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--bg3)">
        <div>
          <span style="font-weight:700;font-size:14px">${f.name}</span>
          <span style="font-size:11px;color:var(--text-dim);margin-left:8px">${wochentag} ${datumDE}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${badge}
          <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:var(--text-dim)">
            <input type="checkbox" ${offen ? 'checked' : ''}
              onchange="saveFeiertag('${f.datum}','offen',null,this.checked)"
              style="accent-color:var(--amber)">
            Offen?
          </label>
        </div>
      </div>
      <!-- Personen -->
      <div style="padding:10px 12px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim);margin-bottom:6px">
          ${offen ? 'Wer arbeitet?' : 'Wer arbeitet normalerweise Sonntags?'}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0 16px">${personenHtml}</div>
        ${ausgleichHinweis}
      </div>
    </div>`;
  }).join('');

  liste.innerHTML = karten;
}

function saveFeiertag(datum, feld, personId, wert) {
  if (!config.feiertagsConfig) config.feiertagsConfig = {};
  if (!config.feiertagsConfig[datum]) {
    // Name aus Feiertagsliste ermitteln
    const heute = new Date().getFullYear();
    const alle = [..._feiertagsNDS(heute), ..._feiertagsNDS(heute+1)];
    const ft = alle.find(f => f.datum === datum);
    config.feiertagsConfig[datum] = { name: ft?.name || datum, offen: false, einsatz: [], sonntagsArbeiter: [] };
  }

  const eintrag = config.feiertagsConfig[datum];

  if (feld === 'offen') {
    eintrag.offen = !!wert;
    // Beim Wechsel: Personenlisten leeren (Kontext wechselt)
    eintrag.einsatz = [];
    eintrag.sonntagsArbeiter = [];
    saveToStorage();
    renderFeiertagsVerhalten();
    return;
  }

  if (feld === 'einsatz' || feld === 'sonntagsArbeiter') {
    const arr = eintrag[feld] || [];
    if (wert && !arr.includes(personId)) arr.push(personId);
    if (!wert) { const i = arr.indexOf(personId); if (i > -1) arr.splice(i, 1); }
    eintrag[feld] = arr;
  }

  saveToStorage();
  // Ausgleich-Hinweis neu rendern ohne kompletten Rebuild
  renderFeiertagsVerhalten();
}

// ═══════════════════════════════════════════════════════
// ── urlaub_krank.js Datei-Box ───────────────────────────
// ═══════════════════════════════════════════════════════

window._urlaubKrankGeladen = false;
window._urlaubKrankStats   = null;

function renderKonfigDateiBox() {
  const box = document.getElementById('konfigDateiBox');
  if (!box) return;

  const geladen = !!window._urlaubKrankGeladen;
  const stats   = window._urlaubKrankStats;

  const statusHtml = geladen
    ? `<div style="display:flex;align-items:center;gap:8px;background:var(--green-bg);border:1px solid #b0d8bc;border-radius:7px;padding:7px 11px;font-size:12px;color:var(--green)">
        <i class="ph ph-check-circle" style="font-size:16px;flex-shrink:0"></i>
        <span><strong>urlaub_krank.js geladen</strong> —
          ${stats.fehlzeiten} Fehlzeit${stats.fehlzeiten!==1?'en':''} ·
          ${stats.einsaetze} Frühschicht${stats.einsaetze!==1?'-Einsätze':'-Einsatz'} ·
          ${stats.feiertage} Feiertag${stats.feiertage!==1?'e':''}
        </span>
      </div>`
    : `<div style="display:flex;align-items:center;gap:8px;background:#fff8e8;border:1px solid #e8d090;border-radius:7px;padding:7px 11px;font-size:12px;color:#7a5200">
        <i class="ph ph-warning" style="font-size:16px;flex-shrink:0"></i>
        <span>Noch nicht geladen — bitte zuerst die aktuelle <strong>urlaub_krank.js</strong> aus dem Root-Ordner laden</span>
      </div>`;

  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
      <i class="ph ph-file-js" style="font-size:18px;color:var(--amber)"></i>
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:var(--text)">urlaub_krank.js</span>
      <span style="font-size:11px;color:var(--text-dim);margin-left:2px">→ Root-Ordner (neben schichtplaner_config.json)</span>
    </div>

    ${statusHtml}

    <div style="display:flex;gap:8px;margin-top:10px">
      <label for="importUrlaubKrank"
        style="flex:1;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--bg3);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:var(--text)">
        <i class="ph ph-upload-simple" style="color:var(--amber)"></i>
        ${geladen ? 'Erneut laden' : 'urlaub_krank.js laden'}
      </label>
      <button onclick="exportUrlaubKrank()"
        ${geladen ? '' : 'disabled'}
        style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:${geladen ? 'var(--amber)' : '#ccc'};color:white;border:none;border-radius:8px;padding:9px 12px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;cursor:${geladen ? 'pointer' : 'not-allowed'}">
        <i class="ph ph-download-simple"></i>
        Speichern &amp; deployen
      </button>
    </div>
    <div style="font-size:11px;color:var(--text-dim);margin-top:8px;line-height:1.5">
      Enthält: Fehlzeiten · Frühschicht-Einsätze · Feiertags-Verhalten<br>
      Nach dem Speichern: Datei in den Root-Ordner deployen — dann haben alle Geräte denselben Stand.
    </div>`;
}

// ── urlaub_krank.js laden ───────────────────────────────
function ladeUrlaubKrank(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    try {
      // Robuster Parser für bekanntes Format: window.BOS_VARNAME = {...};
      function extractBOS(varName) {
        const prefix = `window.${varName} = `;
        const start = text.indexOf(prefix);
        if (start === -1) return null;
        const jsonStart = start + prefix.length;
        // Nächste window.-Deklaration oder Dateiende als Grenze
        const nextDecl = text.indexOf('\nwindow.', jsonStart);
        const raw = nextDecl === -1
          ? text.slice(jsonStart).trim()
          : text.slice(jsonStart, nextDecl).trim();
        // Trailing Semikolon entfernen
        return JSON.parse(raw.replace(/;\s*$/, ''));
      }

      const fehlzeiten   = extractBOS('BOS_FEHLZEITEN')   || [];
      const fruehObj     = extractBOS('BOS_FRUEHSCHICHT')  || {};
      const feiertage    = extractBOS('BOS_FEIERTAGE')     || {};

      // In config mergen — geladene Datei ist die Wahrheit
      config.fehlzeiten                = fehlzeiten;
      config.fruehschichtEinsaetze     = fruehObj.einsaetze || [];
      config.fruehschichtFreitagAnheften = fruehObj.freierTagAnheften !== undefined
        ? fruehObj.freierTagAnheften : true;
      config.feiertagsConfig           = feiertage;
      saveToStorage();

      window._urlaubKrankGeladen = true;
      window._urlaubKrankStats   = {
        fehlzeiten: fehlzeiten.length,
        einsaetze:  (fruehObj.einsaetze||[]).length,
        feiertage:  Object.keys(feiertage).length
      };

      renderKonfigDateiBox();
      renderFehlzeiten();
      if (typeof renderFruehschichtAccordion === 'function') renderFruehschichtAccordion();
      if (typeof renderFeiertagsVerhalten   === 'function') renderFeiertagsVerhalten();
    } catch(err) {
      alert('Fehler beim Lesen der Datei:\n' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── Feiertags-Schloss im Planerkopf toggeln ─────────────
function toggleFeiertag(datum) {
  if (!config.feiertagsConfig) config.feiertagsConfig = {};
  if (!config.feiertagsConfig[datum]) {
    config.feiertagsConfig[datum] = { offen: false, einsatz: [], sonntagsArbeiter: [] };
  }
  config.feiertagsConfig[datum].offen = !config.feiertagsConfig[datum].offen;
  saveToStorage();
  renderWochenplan();
  // Feiertags-Akkordeon neu rendern falls offen
  if (typeof renderFeiertagsVerhalten === 'function') renderFeiertagsVerhalten();
}
