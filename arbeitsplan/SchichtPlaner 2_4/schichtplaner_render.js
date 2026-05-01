// ── SchichtPlaner — Rendering ──────────────────────────
// Abhängigkeiten: config, currentMonday, TAGE_NAMEN_*,
//                 FLUSS_LOGIK, renderAktionsZentrale()

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

// ── Woche navigieren ────────────────────────────────────
function changeWeek(delta) {
  currentMonday = new Date(currentMonday);
  currentMonday.setDate(currentMonday.getDate() + delta * 7);
  renderAll();
}

function renderWochenLabel() {
  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
  const kw = weekKey.split('-W')[1];
  const jahr = weekKey.split('-W')[0];
  const thisMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());
  const isThisWeek = FLUSS_LOGIK.dateToISO(currentMonday) === FLUSS_LOGIK.dateToISO(thisMonday);
  document.getElementById('wochenLabel').innerHTML =
    `<span>KW ${kw}</span> / ${jahr}` + (isThisWeek ? ' <span class="heute-badge">Diese Woche</span>' : '');
  document.getElementById('freieTageWochLabel').textContent = `KW ${kw} / ${jahr}`;

  // Print-Header befüllen
  const plan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const monStr = plan[0]?.datumFormatiert || '';
  const saStr  = plan[5]?.datumFormatiert || '';
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
  buildPrintFreitag(weekKey, plan);
}

// ── Wochenplan rendern ──────────────────────────────────
function renderWochenplan() {
  const wochenplan = FLUSS_LOGIK.berechneWochenplan(config, currentMonday);
  const today = FLUSS_LOGIK.dateToISO(new Date());
  const table = document.getElementById('wochenplanTable');

  // Header
  let html = '<thead><tr><th></th>';
  wochenplan.forEach((tag, i) => {
    const isToday = tag.datum === today;
    html += `<th class="${isToday ? 'today-col' : ''}">
      ${TAGE_NAMEN_KURZ[i]}<br>
      <span style="font-size:11px;font-weight:400">${tag.datumFormatiert}</span>
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
      html += `<td>
        <div class="plan-cell ${statusClass}"
             onclick="zelleTap('${pos.id}', '${tag.datum}', '${z.personId||''}', '${z.person||''}')"
             data-posid="${pos.id}" data-datum="${tag.datum}">
          <span class="cell-name">${z.person || '—'}</span>
          ${subText ? `<span class="cell-sub">${subText}</span>` : ''}
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
          const liste = i === 5
            ? [...(tag.sonderschicht || []).map(p => ({...p, optional: true})),
               ...(tag.verfuegbarUnbesetzt || []).filter(p =>
                 !(tag.sonderschicht || []).some(s => s.id === p.id)
               ).map(p => ({...p, optional: false}))]
            : (tag.verfuegbarUnbesetzt || []).map(p => ({...p, optional: false}));
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

  // ── Trennzeile ──
  const weekKeyFrei = FLUSS_LOGIK.getWeekKey(currentMonday);
  html += `<tr><td colspan="7" style="padding:3px 0;border-bottom:2px solid var(--border)"></td></tr>`;

  // ── Azubi-Zeile ──
  const azubi = (config.personen || []).find(p => p.azubi);
  if (azubi) {
    const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);
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
      return FLUSS_LOGIK.getFreierTag(p.id, weekKeyFrei, config.freieTage) === tag.tag;
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
  const hatFruehschicht = wochenplan.some(t => t.fruehschicht);
  if (hatFruehschicht) {
    html += `<tr><td style="color:#b8790a;font-size:12px">FRÜH&shy;SCHICHT</td>`;
    wochenplan.forEach(tag => {
      const fs = tag.fruehschicht;
      if (!fs) { html += '<td></td>'; return; }
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
}
