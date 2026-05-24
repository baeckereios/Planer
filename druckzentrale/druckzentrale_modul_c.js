// druckzentrale_modul_c.js
// Modul C — Wochenziele + Körner + Produktionsnotizen
// Zuständig für: HTML-Template (Körner-Tabelle), DZ_renderWochenziele()
// Print-CSS: DZ_PRINT_CSS_C

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_C = [
    '/* --- WOCHENZIELE + KÖRNER --- */',
    '.wz-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
    '.wz-subtitle { font-size: 9pt; font-weight: normal; color: #444; margin-bottom: 12px; }',
    '.wz-table, .koerner-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #000; }',
    '.wz-table th, .koerner-table th { background: #d0d0d0; padding: 8px 10px; font-size: 8.5pt; font-weight: bold; text-align: left; text-transform: uppercase; border: 1px solid #000; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.wz-table th.r, .wz-table td.r { text-align: right; }',
    '.wz-table td, .koerner-table td { padding: 7px 10px; border: 1px solid #ccc; font-size: 10pt; }',

    '/* Station-Kopf */',
    '.wz-st td { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;',
    '    background: #3a3a3a; color: #fff; padding: 8px 10px;',
    '    border-top: 2px solid #000; border-bottom: 2px solid #000;',
    '    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '/* Zebra */',
    '.wz-row:nth-child(odd)  td { background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.wz-row:nth-child(even) td { background: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '/* Körner — immer neue Seite */',
    '.koerner-wrap { break-before: page; page-break-before: always; }',
    '.koerner-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
    '.koerner-table td.kl { background: #e8e8e8; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.koerner-table td.day { background: #d0d0d0; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '/* Produktionsnotizen — immer neue Seite */',
    '.pn-wrap { break-before: page; page-break-before: always; display: block !important; }',
    '.pn-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px; }',
    '.pn-subtitle { font-size: 9pt; color: #444; margin-bottom: 14px; }',
    '.pn-station { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;',
    '    background: #3a3a3a; color: #fff; padding: 7px 10px; margin: 14px 0 0;',
    '    border: 1px solid #3a3a3a;',
    '    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.pn-row { display: flex; align-items: stretch;',
    '    border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ddd;',
    '    break-inside: avoid; page-break-inside: avoid; }',
    '.pn-row:last-child { border-bottom: 1px solid #ccc; }',
    '.pn-row:nth-child(odd)  { background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.pn-row:nth-child(even) { background: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.pn-name { width: 155px; flex-shrink: 0; font-size: 9pt; font-weight: bold;',
    '    padding: 6px 8px; border-right: 1px solid #ccc; display: flex; align-items: center; }',
    '.pn-days { display: flex; flex: 1; }',
    '.pn-day { flex: 1; border-right: 1px solid #ddd; display: flex; flex-direction: column; min-height: 30px; }',
    '.pn-day:last-child { border-right: none; }',
    '.pn-day-label { font-size: 6.5pt; font-weight: 700; color: #ccc; text-align: center; padding: 2px 0 0;',
    '    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.pn-day-field { flex: 1; }'
].join('\n');

// ── HTML-TEMPLATE ────────────────────────────────────────────────────
function DZ_C_render() {
    var body = document.getElementById('module-C-body');
    if (!body) return;

    body.innerHTML = [
        '<div id="wochenziele-content"><div class="dz-loading">Wird geladen…</div></div>',
        '<div id="produktionsnotizen-content"></div>',
        '<div class="koerner-wrap" style="margin-top:30px;">',
        '  <div class="koerner-title">Körner einweichen</div>',
        '  <div style="margin-bottom:12px;">',
        '    <table class="koerner-table" style="margin-bottom:0;">',
        '      <tr>',
        '        <td class="kl" style="width:140px;">Pressen Aufteilung</td>',
        '        <td class="schreib"></td><td class="schreib"></td><td class="schreib"></td>',
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

// ── HILFSFUNKTIONEN ──────────────────────────────────────────────────
function DZ_C_fmtDate(d) {
    return DZ_pad(d.getDate()) + '.' + DZ_pad(d.getMonth() + 1) + '.';
}

// Fehlmenge aus BOS_INVENTUR lesen (analog zu DZ_getStock)
function DZ_C_getFehlmenge(prodId) {
    if (!window.BOS_INVENTUR || !window.BOS_STAMMDATEN) return 0;
    var sd  = window.BOS_STAMMDATEN;
    var inv = window.BOS_INVENTUR;
    var legacyKey = (sd[prodId]) ? sd[prodId].legacyKey : null;
    var key = legacyKey || prodId;
    if (inv.products && inv.products[key]) {
        return inv.products[key].fehlmenge || 0;
    }
    return 0;
}

// ── RENDER WOCHENZIELE ───────────────────────────────────────────────
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

    var vonStr   = DZ_anchorDate ? DZ_C_fmtDate(DZ_anchorDate) : '?';
    var zielStr1 = zielDate1 ? DZ_C_fmtDate(zielDate1) : '?';
    var zielStr2 = zielDate2 ? DZ_C_fmtDate(zielDate2) : '?';

    var html = '<div class="wz-title">WOCHENZIELE</div>' +
               '<div class="wz-subtitle">Zeitraum ab ' + vonStr + '</div>' +
               '<table class="wz-table"><thead><tr>' +
               '<th>Produkt</th>' +
               '<th class="r">Bedarf bis ' + zielStr1 + '</th>' +
               '<th class="r">Bedarf bis ' + zielStr2 + '</th>' +
               '</tr></thead>';

    order.forEach(function(st) {
        html += '<tbody>';
        html += '<tr class="wz-st"><td colspan="3">' + st + '</td></tr>';
        groups[st].forEach(function(k) {
            var p       = window.BOS_STAMMDATEN[k];
            var einheit = DZ_getEinheit(p);
            var need1      = zielDate1 ? DZ_calcNeed(k, zielDate1) : 0;
            var need2      = zielDate2 ? DZ_calcNeed(k, zielDate2) : 0;
            var fehlmenge  = DZ_C_getFehlmenge(k);
            var stock      = DZ_getStock(k) || 0;
            var total1     = Math.max(0, need1 - stock) + fehlmenge;
            var total2     = Math.max(0, need2 - stock) + fehlmenge;

            // Anzeige: Gesamtwert, bei Bestand/Fehlmenge mit Hinweis
            function fmtNeed(total, need) {
                if (total <= 0) return '—';
                var str = total + ' ' + einheit;
                var hints = [];
                if (stock  > 0) hints.push('−' + stock + ' Bestand');
                if (fehlmenge > 0) hints.push('+' + fehlmenge + ' Fehlmenge');
                if (hints.length > 0) str += ' <span style="font-size:8pt;color:#888;">(' + hints.join(', ') + ')</span>';
                return str;
            }

            html += '<tr class="wz-row">' +
                    '<td>' + p.name + '</td>' +
                    '<td class="r">' + fmtNeed(total1, need1) + '</td>' +
                    '<td class="r">' + fmtNeed(total2, need2) + '</td>' +
                    '</tr>';
        });
        html += '</tbody>';
    });

    html += '</table>';
    el.innerHTML = html;

    DZ_C_renderProduktionsnotizen(order, groups, vonStr, zielStr2);
}

// ── RENDER PRODUKTIONSNOTIZEN ────────────────────────────────────────
function DZ_C_renderProduktionsnotizen(order, groups, vonStr, bisStr) {
    var el = document.getElementById('produktionsnotizen-content');
    if (!el) return;

    var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    // ── PRINT-Version (display:flex, unsichtbar im Screen) ──
    var printHtml = '<div class="pn-wrap" style="display:none;">' +
        '<div class="pn-title">Produktion notieren</div>' +
        '<div class="pn-subtitle">Zeitraum ' + vonStr + ' — ' + bisStr + '</div>';

    order.forEach(function(st) {
        printHtml += '<div class="pn-station">' + st + '</div>';
        groups[st].forEach(function(k) {
            var p = window.BOS_STAMMDATEN[k];
            printHtml += '<div class="pn-row">' +
                '<div class="pn-name">' + p.name + '</div>' +
                '<div class="pn-days">';
            DAYS.forEach(function(tag) {
                printHtml += '<div class="pn-day">' +
                    '<div class="pn-day-label">' + tag + '</div>' +
                    '<div class="pn-day-field"></div>' +
                    '</div>';
            });
            printHtml += '</div></div>';
        });
    });
    printHtml += '</div>';

    // ── SCREEN-Version (einfache Tabelle, nur im Akkordeon sichtbar) ──
    var screenHtml = '<div class="screen-only no-print" style="margin-top:20px;padding:12px;' +
        'background:#f5f5f5;border-radius:8px;border:1px solid #ddd;">' +
        '<div style="font-size:0.75rem;font-weight:900;text-transform:uppercase;' +
        'letter-spacing:1px;color:#555;margin-bottom:8px;">Produktion notieren · ' +
        vonStr + ' — ' + bisStr + '</div>';

    order.forEach(function(st) {
        screenHtml += '<div style="font-size:0.72rem;font-weight:900;text-transform:uppercase;' +
            'letter-spacing:1px;background:#3a3a3a;color:#fff;padding:5px 8px;margin-top:10px;">' +
            st + '</div>';

        // Tabellenkopf
        screenHtml += '<table style="width:100%;border-collapse:collapse;font-size:0.7rem;">' +
            '<thead><tr>' +
            '<th style="text-align:left;padding:3px 6px;border:1px solid #ccc;background:#e0e0e0;width:35%;">Produkt</th>';
        DAYS.forEach(function(tag) {
            screenHtml += '<th style="text-align:center;padding:3px 2px;border:1px solid #ccc;' +
                'background:#e0e0e0;font-size:0.65rem;">' + tag + '</th>';
        });
        screenHtml += '</tr></thead><tbody>';

        groups[st].forEach(function(k, i) {
            var p  = window.BOS_STAMMDATEN[k];
            var bg = i % 2 === 0 ? '#fff' : '#f5f5f5';
            screenHtml += '<tr style="background:' + bg + ';">' +
                '<td style="padding:4px 6px;border:1px solid #ddd;font-size:0.72rem;font-weight:600;">' +
                p.name + '</td>';
            DAYS.forEach(function() {
                screenHtml += '<td style="border:1px solid #ddd;min-height:22px;min-width:24px;"></td>';
            });
            screenHtml += '</tr>';
        });
        screenHtml += '</tbody></table>';
    });
    screenHtml += '</div>';

    el.innerHTML = printHtml + screenHtml;
}
