// druckzentrale_modul_c.js
// Modul C — Wochenziele + Körner
// Zuständig für: HTML-Template (Körner-Tabelle), DZ_renderWochenziele()
// Print-CSS: DZ_PRINT_CSS_C

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_C = [
    '/* --- WOCHENZIELE + KÖRNER --- */',
    '.wz-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
    '.wz-table, .koerner-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #000; }',
    '.wz-table th, .koerner-table th { background: #d0d0d0; padding: 8px 10px; font-size: 8.5pt; font-weight: bold; text-align: left; text-transform: uppercase; border: 1px solid #000; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.wz-table th.r, .wz-table td.r { text-align: right; }',
    '.wz-table td, .koerner-table td { padding: 7px 10px; border: 1px solid #ccc; font-size: 10pt; }',

    '/* Station-Kopf */',
    '.wz-st td { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;',
    '    background: #3a3a3a; color: #fff;',
    '    padding: 8px 10px;',
    '    border-top: 2px solid #000; border-bottom: 2px solid #000;',
    '    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '/* Zebra — zählt pro tbody, also pro Station neu */',
    '.wz-row:nth-child(odd)  td { background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.wz-row:nth-child(even) td { background: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '.koerner-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
    '.koerner-table td.kl { background: #e8e8e8; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.koerner-table td.day { background: #d0d0d0; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }'
].join('\n');

// ── HTML-TEMPLATE (Körner-Teil) ──────────────────────────────────────
function DZ_C_render() {
    var body = document.getElementById('module-C-body');
    if (!body) return;

    body.innerHTML = [
        '<div id="wochenziele-content"><div class="dz-loading">Wird geladen…</div></div>',

        '<div class="koerner-wrap" style="break-inside:avoid;page-break-inside:avoid;margin-top:30px;">',
        '  <div class="koerner-title">Körner einweichen</div>',
        '  <div style="margin-bottom:12px;">',
        '    <table class="koerner-table" style="margin-bottom:0;">',
        '      <tr>',
        '        <td class="kl" style="width:140px;">Pressen Aufteilung</td>',
        '        <td class="schreib"></td>',
        '        <td class="schreib"></td>',
        '        <td class="schreib"></td>',
        '      </tr>',
        '    </table>',
        '  </div>',
        '  <table class="koerner-table">',
        '    <tr>',
        '      <td class="kl" style="width:140px;">Einweichen</td>',
        '      <td class="schreib"></td><td class="schreib"></td><td class="schreib"></td>',
        '      <td class="schreib"></td><td class="schreib"></td><td class="schreib"></td>',
        '    </tr>',
        '    <tr>',
        '      <td></td>',
        '      <td class="day">Mo</td><td class="day">Di</td><td class="day">Mi</td>',
        '      <td class="day">Do</td><td class="day">Fr</td><td class="day">Sa</td>',
        '    </tr>',
        '    <tr>',
        '      <td class="kl">Produktion</td>',
        '      <td class="schreib"></td><td class="schreib"></td><td class="schreib"></td>',
        '      <td class="schreib"></td><td class="schreib"></td><td class="schreib"></td>',
        '    </tr>',
        '  </table>',
        '</div>'
    ].join('\n');
}

// ── RENDER ───────────────────────────────────────────────────────────
function DZ_renderWochenziele(zielDate1, zielDate2) {
    var el = document.getElementById('wochenziele-content');
    if (!el) return;
    if (!window.BOS_STAMMDATEN) {
        el.innerHTML = '<div class="dz-loading">Daten werden geladen…</div>';
        return;
    }

    var groups = {}, order = [];
    for (var k in window.BOS_STAMMDATEN) {
        var p = window.BOS_STAMMDATEN[k];
        if (!DZ_invRelevant.has(p.legacyKey)) continue;
        var st = p.station || 'Sonstige';
        if (!groups[st]) { groups[st] = []; order.push(st); }
        groups[st].push(k);
    }

    var zielStr1 = zielDate1 ? (DZ_pad(zielDate1.getDate()) + '.' + DZ_pad(zielDate1.getMonth() + 1) + '.') : '?';
    var zielStr2 = zielDate2 ? (DZ_pad(zielDate2.getDate()) + '.' + DZ_pad(zielDate2.getMonth() + 1) + '.') : '?';

    var html = '<div class="wz-title">WOCHENZIELE</div>' +
               '<table class="wz-table"><thead><tr>' +
               '<th>Produkt</th>' +
               '<th class="r">Bedarf bis ' + zielStr1 + '</th>' +
               '<th class="r">Bedarf bis ' + zielStr2 + '</th>' +
               '</tr></thead>';

    // Jede Station bekommt ein eigenes tbody —
    // dadurch zählt nth-child(odd/even) pro Station neu
    order.forEach(function(st) {
        html += '<tbody>';
        html += '<tr class="wz-st"><td colspan="3">' + st + '</td></tr>';
        groups[st].forEach(function(k) {
            var p       = window.BOS_STAMMDATEN[k];
            var einheit = DZ_getEinheit(p);
            var need1   = zielDate1 ? DZ_calcNeed(k, zielDate1) : 0;
            var need2   = zielDate2 ? DZ_calcNeed(k, zielDate2) : 0;
            var txt1    = need1 > 0 ? need1 + ' ' + einheit : '—';
            var txt2    = need2 > 0 ? need2 + ' ' + einheit : '—';
            html += '<tr class="wz-row">' +
                    '<td>' + p.name + '</td>' +
                    '<td class="r">' + txt1 + '</td>' +
                    '<td class="r">' + txt2 + '</td>' +
                    '</tr>';
        });
        html += '</tbody>';
    });

    html += '</table>';
    el.innerHTML = html;
}
