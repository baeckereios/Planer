// druckzentrale_modul_d.js
// Modul D — Verbrauchs-Matrix
// Zuständig für: DZ_renderVerbrauchsMatrix(), _renderStationMatrix()
// Print-CSS: DZ_PRINT_CSS_D

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_D = [
    '/* --- VERBRAUCHS-MATRIX --- */',
    '.wz-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #000; }',
    '.wz-table th { background: #e0e0e0; padding: 8px 10px; font-size: 8.5pt; font-weight: bold; text-align: left; text-transform: uppercase; border: 1px solid #000; }',
    '.wz-table th.r, .wz-table td.r { text-align: right; }',
    '.wz-table td { padding: 7px 10px; border: 1px solid #000; font-size: 10pt; }',
    '.wz-st td { background: #f0f0f0; font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #000; border-top: 2px solid #000; border-bottom: 2px solid #000; }',
    '.wz-row:nth-child(even) { background: #fafafa; }',
    '.matrix-station-wrap .wz-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; }'
].join('\n');

// ── RENDER ───────────────────────────────────────────────────────────
function DZ_renderVerbrauchsMatrix() {
    var el = document.getElementById('matrix-content');
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

    var html = '';
    var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo'];

    for (var i = 0; i < order.length; i += 2) {
        html += '<div class="matrix-page pb-after">';
        html += _renderStationMatrix(order[i], groups[order[i]], DAYS);
        if (i + 1 < order.length) {
            html += '<div style="height:30px;"></div>';
            html += _renderStationMatrix(order[i + 1], groups[order[i + 1]], DAYS);
        }
        html += '</div>';
    }

    el.innerHTML = html;
}

function _renderStationMatrix(st, keys, DAYS) {
    var html = '<div class="matrix-station-wrap">';
    html += '<div class="wz-title">VERBRAUCHS-MATRIX &mdash; ' + st + '</div>';
    html += '<table class="wz-table"><thead><tr>';
    html += '<th>Produkt</th>';
    DAYS.forEach(function(d) { html += '<th class="r">' + d + '</th>'; });
    html += '<th class="r" style="border-left:2px solid #111;">Summe</th>';
    html += '</tr></thead><tbody>';

    keys.forEach(function(k) {
        var p = window.BOS_STAMMDATEN[k];
        var einheit = DZ_getEinheit(p);
        var n = p.needs || [0, 0, 0, 0, 0, 0, 0];
        var matrixNeeds = [n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[0]];
        var sum = matrixNeeds.reduce(function(a, b) { return a + b; }, 0);
        var sumTxt = sum > 0 ? sum + ' ' + einheit : '—';

        html += '<tr class="wz-row">';
        html += '<td>' + p.name + '</td>';
        matrixNeeds.forEach(function(val) {
            html += '<td class="r">' + (val > 0 ? val : '<span style="color:#ccc;"></span>') + '</td>';
        });
        html += '<td class="r" style="border-left:2px solid #111;font-weight:900;">' + sumTxt + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}
