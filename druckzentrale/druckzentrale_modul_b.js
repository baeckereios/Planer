// druckzentrale_modul_b.js
// Modul B — Froster-Bestand
// Zuständig für: DZ_renderFroster()
// Print-CSS: DZ_PRINT_CSS_B

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_B = [
    '/* --- FROSTER BESTAND --- */',
    '.fd-header { border-bottom: none; margin-bottom: 0; }',
    '.fd-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
    '.fd-meta { font-size: 9pt; color: #555; font-weight: normal; margin-bottom: 12px; display: block; }',

    '/* Station-Kopf */',
    '.fd-station { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;',
    '    background: #3a3a3a; color: #fff;',
    '    padding: 7px 10px; margin: 18px 0 0;',
    '    border: 1px solid #3a3a3a;',
    '    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

    '/* Zeilen */',
    '.fd-row { display: flex; align-items: center; padding: 7px 10px;',
    '    border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ddd;',
    '    break-inside: avoid; page-break-inside: avoid; }',
    '.fd-row:last-child { border-bottom: 1px solid #ccc; }',

    '/* Zebra */',
    '.fd-row.fd-even { background: #f0f0f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    '.fd-row.fd-odd  { background: #ffffff; }',

    '.fd-name { flex: 1; font-size: 10pt; font-weight: bold; }',
    '.fd-nums { font-size: 10pt; width: 80px; text-align: right; margin-right: 15px; }'
].join('\n');

// ── RENDER ───────────────────────────────────────────────────────────
function DZ_renderFroster() {
    var el = document.getElementById('froster-content');
    if (!el) return;
    if (!window.BOS_STAMMDATEN || !window.BOS_INVENTUR) {
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

    var invD   = new Date(DZ_latestInvTs);
    var invStr = DZ_latestInvTs > 0
        ? DZ_pad(invD.getDate()) + '.' + DZ_pad(invD.getMonth() + 1) + '. ' +
          DZ_pad(invD.getHours()) + ':' + DZ_pad(invD.getMinutes()) + ' Uhr'
        : 'Keine Inventur';

    var html = '<div class="fd-header">' +
               '<div class="fd-title">FROSTER-BESTAND</div>' +
               '<div class="fd-meta">Inventur: ' + invStr + '</div>' +
               '</div>';

    order.forEach(function(st) {
        html += '<div class="fd-station-block">';
        html += '<div class="fd-station">' + st + '</div>';
        groups[st].forEach(function(k, i) {
            var p        = window.BOS_STAMMDATEN[k];
            var stock    = DZ_getStock(k);
            var einheit  = DZ_getEinheit(p);
            var stockTxt = (stock === null) ? '—' : stock + ' ' + einheit;
            var zebraClass = (i % 2 === 0) ? 'fd-odd' : 'fd-even';
            html += '<div class="fd-row ' + zebraClass + '">' +
                    '<span class="fd-name">' + p.name + '</span>' +
                    '<span class="fd-nums">' + stockTxt + '</span>' +
                    '</div>';
        });
        html += '</div>';
    });

    el.innerHTML = html;
}
