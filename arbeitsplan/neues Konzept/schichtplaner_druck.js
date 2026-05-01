// ── SchichtPlaner — Druck, Export & Import ──────────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, renderAll()
// Kein DOM-Lesen außer toggleWorkflow() und importConfig().

function drucken() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const kw = weekKey.split('-W')[1];
  const jahr = weekKey.split('-W')[0];
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const positionen = config.positionen || [];
  const personen = config.personen || [];
  const TL = TAGE_NAMEN_LANG;
  const TK = TAGE_NAMEN_KURZ;

  // ── Tabellenkopf ──
  const datumsHeader = wochenplan.map(t =>
    `<th><div class="day-name">${t.tagKurz}</div><div class="day-date">${t.datumFormatiert}</div></th>`
  ).join('');

  // ── Positionszeilen ──
  const posZeilen = positionen.map(pos => {
    const zellen = wochenplan.map(tag => {
      const z = tag.zuweisung[pos.id];
      if (!z) return '<td></td>';
      if (z.status === 'gesperrt') return '<td class="gesperrt">–</td>';
      const cls = z.status === 'stammkraft' ? 'stamm' :
                  z.status === 'joker'      ? 'joker' :
                  z.status === 'kaskade'    ? 'kaskade' : 'wolke';
      return `<td class="${cls}">${z.person || '–'}</td>`;
    }).join('');
    return `<tr><td class="pos-label">${pos.label}</td>${zellen}</tr>`;
  }).join('');

  // ── Frühschicht-Zeile ──
  const hatFruehschicht = wochenplan.some(t => t.fruehschicht);
  const fruehZeile = hatFruehschicht ? `
    <tr class="frueh-zeile">
      <td class="pos-label">Frühschicht</td>
      ${wochenplan.map(t => t.fruehschicht
        ? `<td class="frueh">🌅 ${t.fruehschicht.name}</td>`
        : '<td></td>').join('')}
    </tr>` : '';

  // ── Trennlinie ──
  const trenn = `<tr class="trenn"><td colspan="${wochenplan.length + 1}"></td></tr>`;

  // ── Azubi-Zeile (zusammenfassen) ──
  const azubi = personen.find(p => p.azubi);
  let azubiZeile = '';
  if (azubi) {
    const zellen = wochenplan.map(tag => {
      const frei = FLUSS_LOGIK.getFreierTag(azubi.id, weekKey, config.freieTage);
      const fehlzeit = (config.fehlzeiten || []).find(f =>
        f.personId === azubi.id && tag.datum >= f.von && tag.datum <= f.bis
      );
      if (fehlzeit) return `<td class="azubi-cell">${fehlzeit.typ === 'urlaub' ? '🌴' : '🤒'}</td>`;
      if ((azubi.gesperrt || []).includes(tag.tag)) return `<td class="azubi-cell muted">Schule</td>`;
      if (frei === tag.tag) return `<td class="azubi-cell muted">Frei</td>`;
      // Eingeplant?
      const aufPosition = positionen.find(pos => {
        const z = tag.zuweisung[pos.id];
        return z && z.personId === azubi.id;
      });
      if (aufPosition) return `<td class="azubi-cell einsatz">${aufPosition.label}</td>`;
      return `<td class="azubi-cell muted">Lernt</td>`;
    }).join('');
    azubiZeile = `<tr class="azubi-zeile"><td class="pos-label azubi-label">Azubi</td>${zellen}</tr>`;
  }

  // ── Frei-Zeile ──
  const freiZellen = wochenplan.map(tag => {
    const freie = personen
      .filter(p => !p.azubi)
      .filter(p => FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage) === tag.tag)
      .map(p => p.name);
    return `<td class="frei-cell">${freie.length ? `<div class="frei-namen">${freie.join(', ')}</div>` : ''}</td>`;
  }).join('');
  const freiZeile = `<tr class="frei-zeile"><td class="pos-label">Frei</td>${freiZellen}</tr>`;

  // ── Krank/Urlaub-Zeile ──
  const fehlZellen = wochenplan.map(tag => {
    const fehlende = (config.fehlzeiten || [])
      .filter(f => tag.datum >= f.von && tag.datum <= f.bis)
      .map(f => {
        const p = personen.find(pp => pp.id === f.personId);
        const icon = f.typ === 'urlaub' ? '🌴' : '🤒';
        return p ? `${icon} ${p.name}` : '';
      }).filter(Boolean);
    return `<td class="fehl-cell">${fehlende.length ? `<div class="fehl-namen">${fehlende.join(', ')}</div>` : ''}</td>`;
  }).join('');
  const fehlZeile = `<tr class="fehl-zeile"><td class="pos-label">Krank/Urlaub</td>${fehlZellen}</tr>`;

  // ── Legende & Footer ──
  const jokers = wochenplan.flatMap(t =>
    Object.entries(t.zuweisung || {})
      .filter(([,z]) => z.status === 'joker')
      .map(([posId]) => {
        const pos = positionen.find(p => p.id === posId);
        return `${t.tagKurz} ${pos?.label || posId}`;
      })
  );
  const statusStr = jokers.length > 0
    ? `<span class="footer-warn">⚠ Joker: ${jokers.join(' · ')}</span>`
    : `<span class="footer-ok">✓ Vollbesetzt</span>`;

  // ── HTML zusammenbauen ──
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>SchichtPlaner KW${kw} ${jahr}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Barlow Condensed', sans-serif; background: white; color: #1a1510; font-size: 13px; }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 10px;
    border-bottom: 3px solid #1a1510;
  }
  .logo { font-family: 'Fraunces', serif; font-weight: 900; font-size: 24px; letter-spacing: -0.5px; line-height: 1; }
  .logo span { color: #b8790a; font-style: italic; }
  .logo-sub { font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #7a6e60; margin-top: 3px; }
  .kw-block { text-align: center; }
  .kw-num { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 900; color: #b8790a; line-height: 1; }
  .kw-range { font-size: 11px; color: #7a6e60; margin-top: 2px; letter-spacing: 0.5px; }
  .meta { text-align: right; font-size: 9px; color: #7a6e60; line-height: 1.8; }
  .meta strong { font-size: 11px; color: #1a1510; }

  /* ── Tabelle ── */
  table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  th { padding: 5px 8px; text-align: center; border-bottom: 2px solid #1a1510; }
  th:first-child { text-align: left; width: 88px; }
  td { padding: 5px 8px; text-align: center; border-bottom: 1px solid #e0dbd4; vertical-align: middle; }
  td:first-child { text-align: left; }

  .day-name { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .day-date { font-size: 9px; color: #7a6e60; font-weight: 400; margin-top: 1px; }

  .pos-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7a6e60; white-space: nowrap; }

  /* Zellen-Status */
  .stamm   { color: #2e6b42; font-weight: 800; font-size: 13px; }
  .kaskade { color: #7a5200; font-weight: 700; font-size: 13px; }
  .wolke   { color: #1a3a5e; font-weight: 600; font-size: 13px; }
  .joker   { color: #b03030; font-weight: 700; font-style: italic; font-size: 13px; }
  .gesperrt { color: #ccc; font-size: 11px; }

  /* Frühschicht */
  .frueh-zeile td { background: #fffbf0; }
  .frueh { color: #b8790a; font-weight: 700; font-size: 12px; }
  .frueh-zeile .pos-label { color: #b8790a; }

  /* Trennlinie */
  .trenn td { border-top: 2px solid #1a1510; padding: 0; height: 4px; border-bottom: none; }

  /* Azubi */
  .azubi-zeile td { background: #f0f4fb; }
  .azubi-label { color: #2a4e7a; }
  .azubi-cell { font-size: 11px; font-weight: 600; }
  .azubi-cell.einsatz { color: #2a4e7a; font-weight: 800; }
  .azubi-cell.muted { color: #b0b8c8; font-style: italic; }

  /* Frei */
  .frei-zeile .pos-label { color: #9b2c2c; }
  .frei-cell { vertical-align: top; padding: 4px 8px; }
  .frei-namen { font-size: 10px; font-weight: 700; color: #9b2c2c; line-height: 1.4; }
  .krank-namen { font-size: 10px; color: #b8790a; }
  .fehl-zeile .pos-label { color: #b8790a; }
  .fehl-cell { vertical-align: top; padding: 4px 8px; }
  .fehl-namen { font-size: 10px; font-weight: 700; color: #b8790a; line-height: 1.4; }

  /* ── Footer ── */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1.5px solid #1a1510;
    margin-top: 8px;
    padding-top: 6px;
    font-size: 9px;
    color: #7a6e60;
  }
  .legende { display: flex; gap: 14px; }
  .leg { display: flex; align-items: center; gap: 4px; }
  .leg-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .footer-ok   { color: #2e6b42; font-weight: 700; font-size: 10px; }
  .footer-warn { color: #b03030; font-weight: 700; font-size: 10px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">Bäckerei<span>OS</span></div>
    <div class="logo-sub">Schichtplan Nachtschicht</div>
  </div>
  <div class="kw-block">
    <div class="kw-num">KW ${kw}</div>
    <div class="kw-range">${wochenplan[0]?.datumFormatiert} — ${wochenplan[5]?.datumFormatiert} · ${jahr}</div>
  </div>
  <div class="meta">
    <strong>Bäckerei Langrehr</strong><br>
    Gedruckt ${new Date().toLocaleDateString('de-DE')}<br>
    ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr
  </div>
</div>

<table>
  <thead>
    <tr>
      <th></th>
      ${datumsHeader}
    </tr>
  </thead>
  <tbody>
    ${posZeilen}
    ${fruehZeile}
    ${trenn}
    ${azubiZeile}
    ${freiZeile}
    ${fehlZeile}
  </tbody>
</table>

<div class="footer">
  <div class="legende">
    <div class="leg"><div class="leg-dot" style="background:#2e6b42"></div> Stammkraft</div>
    <div class="leg"><div class="leg-dot" style="background:#7a5200"></div> Kaskade</div>
    <div class="leg"><div class="leg-dot" style="background:#1a3a5e"></div> Wolke</div>
    <div class="leg"><div class="leg-dot" style="background:#b03030"></div> Joker</div>
  </div>
  ${statusStr}
</div>

</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 600);
}

function toggleWorkflow() {
  const box = document.getElementById('workflowBox');
  const btn = document.getElementById('workflowBtn');
  const open = box.style.display !== 'none';
  box.style.display = open ? 'none' : 'block';
  btn.style.color = open ? '' : 'var(--amber)';
  btn.style.borderColor = open ? '' : 'var(--amber)';
}

function importArbeitsplanJS(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      // window.NACHTSCHICHT_PLAENE aus dem JS-Inhalt extrahieren
      const content = e.target.result;
      // Sicher evaluieren: JSON-Teil extrahieren
      const match = content.match(/window\.NACHTSCHICHT_PLAENE\s*=\s*(\{[\s\S]*?\});\s*$/m)
                 || content.match(/window\.NACHTSCHICHT_PLAENE\s*=\s*(\{[\s\S]*\})/);
      if (!match) throw new Error('Format nicht erkannt');
      const data = JSON.parse(match[1]);
      localStorage.setItem('fluss_arbeitsplaene', JSON.stringify(data));
      const count = Object.keys(data).length;
      alert(`${count} Woche(n) geladen. Jetzt exportieren um aktuelle Woche hinzuzufügen.`);
    } catch(err) {
      alert('Fehler beim Laden: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function exportArbeitsplan() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const plan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const personen = config.personen || [];
  const positionen = config.positionen || [];

  // Frei-Personen pro Tag vorberechnen
  plan.forEach(tag => {
    tag.freiPersonen = personen.filter(p => {
      if (p.azubi) return false;
      if ((config.fehlzeiten||[]).some(f => f.personId===p.id && tag.datum>=f.von && tag.datum<=f.bis)) return false;
      return FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage) === tag.tag;
    }).map(p => p.name);
  });

  // Freie-Tage-Liste
  const freieTageList = personen.filter(p => !p.azubi).map(p => ({
    name: p.name,
    tag: FLUSS_LOGIK.getFreierTag(p.id, weekKey, config.freieTage),
    typ: FLUSS_LOGIK.getFreierTagTyp(p.id, weekKey, config.freieTage),
    wunschFreierTag: p.wunschFreierTag || null
  }));

  // Bestehende Pläne laden und neuen hinzufügen
  let existing = {};
  try {
    const stored = localStorage.getItem('fluss_arbeitsplaene');
    if (stored) existing = JSON.parse(stored);
  } catch(e) {}

  existing[weekKey] = {
    erstellt: new Date().toISOString(),
    wochenplan: plan,
    freieTage: freieTageList,
    positionen: positionen
  };

  // Als JS-Datei exportieren
  const js = `// Arbeitsplan Nachtschicht — BäckereiOS\n// Erstellt: ${new Date().toLocaleString('de-DE')}\n\nwindow.NACHTSCHICHT_PLAENE = ${JSON.stringify(existing, null, 2)};\n`;
  const blob = new Blob([js], { type: 'application/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'arbeitsplan_nachtschicht.js';
  a.click();

  // Auch lokal speichern
  localStorage.setItem('fluss_arbeitsplaene', JSON.stringify(existing));
}

function exportConfig() {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'schichtplaner_config.json';
  a.click();
}

function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      config = JSON.parse(e.target.result);
      saveToStorage();
      renderAll();
      alert('Konfiguration geladen.');
    } catch(err) {
      alert('Fehler beim Laden: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
