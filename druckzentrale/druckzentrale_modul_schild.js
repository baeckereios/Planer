// druckzentrale_modul_schild.js
// Modul Schild — NFC-Stationsschild (A4 Querformat)
// Eigener Tab "Schilder" mit eigenem Druckjob (landscape, kein Mix mit anderen Modulen)

var DZ_SCHILD_STATIONEN = [
    'Froster', 'Hefe', 'Mehl', 'Backprogramm',
    'Bestand', 'Lieferung', 'Schichtplan', 'Druckzentrale'
];

var DZ_SCHILD_NFC_ERKLAERUNG = [
    { num: '①', text: 'NFC-fähiges Smartphone entsperren' },
    { num: '②', text: 'Gerät mit der Rückseite an den Chip-Bereich halten' },
    { num: '③', text: 'Benachrichtigung antippen → BäckereiOS öffnet direkt' }
];

// ── SCREEN-CSS (nur für Tab-Inhalt) ──────────────────────────────────
var DZ_SCHILD_SCREEN_CSS = [
    '.schild-wrap { display: flex; flex-direction: column; gap: 20px; padding: 16px 0; }',
    '.schild-section-title { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim, #888); margin-bottom: 8px; }',
    '.schild-pills { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.schild-pill { padding: 6px 15px; border-radius: 20px; border: 1px solid var(--border-s, #ddd); background: transparent; color: var(--dim, #888); font-size: 13px; cursor: pointer; transition: all .15s; font-family: inherit; }',
    '.schild-pill:hover { border-color: var(--amber, #c8a96e); color: var(--amber, #c8a96e); }',
    '.schild-pill.aktiv { background: var(--amber, #c8a96e); border-color: var(--amber, #c8a96e); color: #1a1a1a; font-weight: 600; }',
    '.schild-field { display: flex; flex-direction: column; gap: 5px; }',
    '.schild-input { background: var(--surface, #fff); border: 1.5px solid var(--border-s, #ddd); border-radius: 8px; padding: 9px 13px; font-size: 14px; color: var(--text, #1a1a1a); font-family: inherit; outline: none; transition: border-color .15s; width: 100%; }',
    '.schild-input:focus { border-color: var(--amber, #c8a96e); }',
    '.schild-row { display: flex; gap: 10px; align-items: flex-end; }',
    '.schild-row .schild-field { flex: 1; }',
    '.schild-btn-nfc { border: 1.5px solid var(--border-s, #ddd); background: transparent; border-radius: 8px; padding: 9px 14px; font-size: 13px; color: var(--dim, #888); cursor: pointer; white-space: nowrap; font-family: inherit; transition: all .15s; }',
    '.schild-btn-nfc:hover { border-color: var(--amber, #c8a96e); color: var(--amber, #c8a96e); }',
    '.schild-btn-nfc.nfc-aktiv { border-color: var(--amber, #c8a96e); color: var(--amber, #c8a96e); animation: schild-pulse 1s infinite; }',
    '.schild-btn-nfc.nfc-ok  { border-color: #3a9a68; color: #3a9a68; }',
    '.schild-btn-nfc.nfc-err { border-color: #c84040; color: #c84040; }',
    '@keyframes schild-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }',
    '.schild-nfc-status { font-size: 11px; color: var(--dim, #888); min-height: 16px; font-family: monospace; }',
    '.schild-custom-row { display: none; }',
    '.schild-btn-print { width: 100%; background: var(--amber, #c8a96e); border: none; border-radius: 8px; padding: 13px; font-size: 15px; font-weight: 700; color: #1a1a1a; cursor: pointer; letter-spacing: 0.04em; font-family: inherit; transition: background .15s; }',
    '.schild-btn-print:hover { background: #d9bb80; }',
    '.schild-disclaimer { font-size: 11px; color: var(--dim, #888); text-align: center; line-height: 1.55; }',
    // Vorschau
    '.schild-preview-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim, #888); margin-bottom: 8px; }',
    '.schild-preview-outer { width: 100%; aspect-ratio: 297/210; background: #fff; border-radius: 4px; box-shadow: 0 4px 24px rgba(0,0,0,.18); overflow: hidden; }',
    '.schild-preview-inner { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 3% 3.5%; gap: 2%; position: relative; color: #1a1a1a; box-sizing: border-box; }',
    '.sp-header { display:flex; align-items:center; justify-content:space-between; padding-bottom:1.5%; border-bottom:2px solid #1a1a1a; flex-shrink:0; }',
    '.sp-brand-main { font-family:Georgia,serif; font-size:clamp(11px,2.4vw,24px); font-weight:900; color:#1a1a1a; }',
    '.sp-brand-os { font-style:italic; font-weight:400; color:#888; font-size:.82em; }',
    '.sp-brand-sub { font-size:clamp(4px,.65vw,7.5px); color:#999; letter-spacing:.12em; text-transform:uppercase; font-family:monospace; margin-top:2px; display:block; }',
    '.sp-tag { font-size:clamp(5px,.72vw,8px); letter-spacing:.14em; text-transform:uppercase; color:#bbb; font-family:monospace; }',
    '.sp-body { flex:1; display:grid; grid-template-columns:1fr auto; gap:3%; min-height:0; }',
    '.sp-left { display:flex; flex-direction:column; justify-content:space-between; gap:1.5%; min-width:0; }',
    '.sp-name { font-family:Georgia,serif; font-size:clamp(22px,6.5vw,72px); line-height:.9; letter-spacing:-.02em; color:#1a1a1a; flex:1; display:flex; align-items:center; font-weight:900; }',
    '.sp-hinweis { background:#f5f2ed; border-left:3px solid #1a1a1a; border-radius:0 4px 4px 0; padding:clamp(3px,.55vw,7px) clamp(5px,.8vw,10px); }',
    '.sp-hinweis-title { font-family:monospace; font-size:clamp(3px,.48vw,6px); text-transform:uppercase; letter-spacing:.15em; color:#999; margin-bottom:2px; }',
    '.sp-hinweis-text { font-size:clamp(5px,.7vw,9px); color:#444; line-height:1.4; }',
    '.sp-steps { display:flex; gap:3%; }',
    '.sp-step { display:flex; gap:4px; flex:1; align-items:flex-start; }',
    '.sp-step-num { font-family:monospace; font-size:clamp(5px,.7vw,9px); color:#1a1a1a; font-weight:700; flex-shrink:0; line-height:1.45; }',
    '.sp-step-txt { font-size:clamp(4px,.62vw,7.5px); color:#666; line-height:1.45; }',
    '.sp-nfc { width:clamp(70px,13vw,148px); flex-shrink:0; border:1.5px dashed #ccc; border-radius:8px; overflow:hidden; display:flex; flex-direction:row; }',
    '.sp-nfc-main { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:clamp(4px,.7vw,9px); padding:clamp(6px,1vw,14px) clamp(5px,.9vw,10px); }',
    '.sp-nfc-icon { width:clamp(36px,6.5vw,72px); height:clamp(36px,6.5vw,72px); border:1.5px solid #1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }',
    '.sp-nfc-lbl { font-family:monospace; font-size:clamp(5px,.65vw,7.5px); text-transform:uppercase; letter-spacing:.1em; color:#888; text-align:center; line-height:1.5; }',
    '.sp-nfc-url { writing-mode:vertical-rl; transform:rotate(180deg); font-family:monospace; font-size:clamp(4px,.5vw,6px); color:#bbb; letter-spacing:.06em; background:#f7f5f2; border-left:1px solid #e8e4de; padding:8px 3px; white-space:nowrap; flex-shrink:0; min-width:14px; width:max(14px,1.8vw); display:flex; align-items:center; justify-content:center; overflow:hidden; }',
    '.sp-right { display:flex; flex-direction:column; gap:clamp(4px,.7vw,8px); flex-shrink:0; width:clamp(70px,13vw,148px); }',
    '.sp-qr { border:1.5px dashed #ccc; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:clamp(4px,.7vw,8px); gap:clamp(2px,.4vw,5px); flex:1; }',
    '.sp-qr canvas, .sp-qr img { width:100% !important; height:auto !important; display:block; }',
    '.sp-qr-lbl { font-family:monospace; font-size:clamp(4px,.55vw,6.5px); text-transform:uppercase; letter-spacing:.1em; color:#bbb; text-align:center; }',
    '.sp-footer { display:flex; justify-content:space-between; align-items:center; padding-top:1%; border-top:1px solid #eee; flex-shrink:0; }',
    '.sp-footer-left { font-family:monospace; font-size:clamp(4px,.6vw,7px); color:#ccc; letter-spacing:.1em; text-transform:uppercase; }',
    '.sp-dots { display:flex; gap:3px; }',
    '.sp-dot { width:clamp(3px,.45vw,5px); height:clamp(3px,.45vw,5px); border-radius:50%; background:#ddd; }',
    '.sp-dot:first-child { background:#1a1a1a; }'
].join('\n');

// ── PRINT-CSS (A4 Querformat, eigenständiger Druckjob) ────────────────
var DZ_SCHILD_PRINT_CSS = [
    '@page { size: 297mm 210mm; margin: 0; }',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { width: 297mm; height: 210mm; background: #fff; }',
    '.schild-print-page {',
    '  width: 297mm; height: 210mm;',
    '  display: flex; flex-direction: column;',
    '  padding: 11mm 13mm 9mm 13mm;',
    '  position: relative; color: #1a1a1a;',
    '}',
    '.schild-print-page::before { content:""; position:absolute; top:5mm; left:5mm; width:9mm; height:9mm; border-top:0.5pt solid #ddd; border-left:0.5pt solid #ddd; }',
    '.schild-print-page::after  { content:""; position:absolute; bottom:5mm; right:5mm; width:9mm; height:9mm; border-bottom:0.5pt solid #ddd; border-right:0.5pt solid #ddd; }',

    // ── Header ──
    '.p-header { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:3mm; border-bottom:1.5pt solid #1a1a1a; flex-shrink:0; }',
    '.p-brand-main { font-family:Georgia,serif; font-size:22pt; font-weight:900; color:#1a1a1a; line-height:1; }',
    '.p-brand-os { font-style:italic; font-weight:400; color:#888; font-size:.8em; }',
    '.p-brand-sub { font-size:7pt; color:#999; letter-spacing:.1em; text-transform:uppercase; font-family:monospace; margin-top:1.5mm; display:block; }',
    '.p-tag { font-size:7.5pt; letter-spacing:.14em; text-transform:uppercase; color:#bbb; font-family:monospace; padding-top:1mm; }',

    // ── Hauptbereich: Name links | NFC+QR rechts ──
    '.p-main { flex:1; display:grid; grid-template-columns:1fr 46mm; gap:7mm; min-height:0; margin-top:3mm; }',

    // Name — vertikal und horizontal zentriert
    '.p-name-area { display:flex; align-items:center; justify-content:flex-start; overflow:hidden; }',
    '.p-name { font-family:Georgia,serif; font-size:58pt; line-height:.88; letter-spacing:-.02em; color:#1a1a1a; font-weight:900; }',

    // Rechte Spalte: NFC oben, QR unten — gleiche Höhe
    '.p-right { display:flex; flex-direction:column; gap:2.5mm; }',
    '.p-nfc { flex:1; border:1pt dashed #ccc; border-radius:3pt; overflow:hidden; display:flex; flex-direction:row; min-height:0; }',
    '.p-nfc-main { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2.5mm; padding:3mm 2mm; }',
    '.p-nfc-icon { width:18mm; height:18mm; border:1.5pt solid #1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }',
    '.p-nfc-icon svg { width:48%; height:48%; }',
    '.p-nfc-lbl { font-family:monospace; font-size:5.5pt; text-transform:uppercase; letter-spacing:.09em; color:#888; text-align:center; line-height:1.45; }',
    '.p-nfc-url { writing-mode:vertical-rl; transform:rotate(180deg); font-family:monospace; font-size:4.5pt; color:#bbb; background:#f7f5f2; border-left:0.5pt solid #e8e4de; padding:3mm 1.5mm; white-space:nowrap; width:5mm; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    '.p-qr { flex:1; border:1pt dashed #ccc; border-radius:3pt; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; gap:1.5mm; min-height:0; }',
    '.p-qr img { width:30mm; height:30mm; display:block; flex-shrink:0; }',
    '.p-qr-lbl { font-family:monospace; font-size:5pt; text-transform:uppercase; letter-spacing:.1em; color:#bbb; text-align:center; }',

    // ── Hinweis — volle Breite, grau ──
    '.p-hinweis { background:#f0ede8; border-left:3pt solid #1a1a1a; border-radius:0 3pt 3pt 0; padding:2.5mm 4mm; flex-shrink:0; margin-top:3mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    '.p-hinweis-title { font-family:monospace; font-size:6.5pt; text-transform:uppercase; letter-spacing:.14em; color:#999; margin-bottom:1.5pt; }',
    '.p-hinweis-text { font-size:10pt; color:#333; line-height:1.4; }',

    // ── Schritte — volle Breite ──
    '.p-steps { display:flex; gap:0; flex-shrink:0; margin-top:2.5mm; padding-top:2.5mm; border-top:0.5pt solid #e0e0e0; }',
    '.p-step { display:flex; gap:3pt; flex:1; align-items:flex-start; padding-right:4mm; }',
    '.p-step:last-child { padding-right:0; }',
    '.p-step-num { font-family:monospace; font-size:9pt; color:#1a1a1a; font-weight:700; flex-shrink:0; line-height:1.4; }',
    '.p-step-txt { font-size:8pt; color:#555; line-height:1.4; }',

    // ── Footer ──
    '.p-footer { display:flex; justify-content:space-between; align-items:center; padding-top:2mm; border-top:0.5pt solid #eee; flex-shrink:0; margin-top:2mm; }',
    '.p-footer-left { font-family:monospace; font-size:5pt; color:#ccc; letter-spacing:.1em; text-transform:uppercase; }',
    '.p-dots { display:flex; gap:1.5mm; }',
    '.p-dot { width:1.8mm; height:1.8mm; border-radius:50%; background:#ddd; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    '.p-dot:first-child { background:#1a1a1a; }'
].join('\n');

// ── RENDER ───────────────────────────────────────────────────────────
function DZ_SCHILD_render() {
    // Screen-CSS injizieren
    var styleEl = document.getElementById('dz-schild-screen-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dz-schild-screen-css';
        styleEl.textContent = DZ_SCHILD_SCREEN_CSS;
        document.head.appendChild(styleEl);
    }

    var container = document.getElementById('tab-schilder');
    if (!container) return;

    var pillsHTML = DZ_SCHILD_STATIONEN.map(function(s, i) {
        return '<button class="schild-pill' + (i === 0 ? ' aktiv' : '') + '" onclick="DZ_SCHILD_setLabel(\'' + s + '\', this)">' + s + '</button>';
    }).join('') + '<button class="schild-pill" onclick="DZ_SCHILD_toggleCustom(this)">Eigene…</button>';

    var stepsHTML = DZ_SCHILD_NFC_ERKLAERUNG.map(function(s) {
        return '<div class="sp-step"><span class="sp-step-num">' + s.num + '</span><span class="sp-step-txt">' + s.text + '</span></div>';
    }).join('');

    var printStepsHTML = DZ_SCHILD_NFC_ERKLAERUNG.map(function(s) {
        return '<div class="p-step"><span class="p-step-num">' + s.num + '</span><span class="p-step-txt">' + s.text + '</span></div>';
    }).join('');

    var nfcSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7a13 13 0 0 1 0 10"/><path d="M17 9.5a8 8 0 0 1 0 5"/><circle cx="6" cy="12" r="4"/><path d="M10 12h4"/></svg>';

    container.innerHTML =
        '<div class="container">' +
        '<div class="schild-wrap">' +

        // ── Konfiguration ──
        '<div>' +
          '<div class="schild-section-title">Stations-Beschriftung</div>' +
          '<div class="schild-pills" id="schild-pills">' + pillsHTML + '</div>' +
        '</div>' +

        '<div class="schild-custom-row" id="schild-custom-row">' +
          '<div class="schild-field">' +
            '<label class="schild-section-title">Eigene Beschriftung</label>' +
            '<input class="schild-input" id="schild-custom-input" type="text" placeholder="z.B. Ofen 2" oninput="DZ_SCHILD_updatePreview()">' +
          '</div>' +
        '</div>' +

        '<div class="schild-field">' +
          '<label class="schild-section-title">Hinweistext</label>' +
          '<input class="schild-input" id="schild-hinweis" type="text" value="Chip mit Smartphone antippen, um direkt zu diesem Bereich in BäckereiOS zu gelangen." oninput="DZ_SCHILD_updatePreview()">' +
        '</div>' +

        '<div>' +
          '<label class="schild-section-title">NFC-Ziel-URL</label>' +
          '<div class="schild-row">' +
            '<div class="schild-field">' +
              '<input class="schild-input" id="schild-url" type="text" value="https://baeckereios.github.io" oninput="DZ_SCHILD_updatePreview()">' +
            '</div>' +
            '<button class="schild-btn-nfc" id="schild-btn-nfc" onclick="DZ_SCHILD_leseChip()">📡 Chip lesen</button>' +
          '</div>' +
          '<div class="schild-nfc-status" id="schild-nfc-status"></div>' +
        '</div>' +

        // ── Vorschau ──
        '<div>' +
          '<div class="schild-preview-label">Vorschau · A4 Querformat</div>' +
          '<div class="schild-preview-outer">' +
            '<div class="schild-preview-inner">' +
              '<div class="sp-header">' +
                '<div>' +
                  '<div class="sp-brand-main"><b>Bäckerei</b><span class="sp-brand-os">OS</span></div>' +
                  '<span class="sp-brand-sub">Bäckerei Langrehr &middot; Garbsen &middot; Havelse</span>' +
                '</div>' +
                '<span class="sp-tag">NFC&#8209;Station</span>' +
              '</div>' +
              '<div class="sp-body">' +
                '<div class="sp-left">' +
                  '<div class="sp-name" id="sp-name">Froster</div>' +
                  '<div class="sp-hinweis">' +
                    '<div class="sp-hinweis-title">Hinweis</div>' +
                    '<div class="sp-hinweis-text" id="sp-hinweis">Chip mit Smartphone antippen, um direkt zu diesem Bereich in BäckereiOS zu gelangen.</div>' +
                  '</div>' +
                  '<div class="sp-steps">' + stepsHTML + '</div>' +
                '</div>' +
                '<div class="sp-right">' +
                  '<div class="sp-nfc">' +
                    '<div class="sp-nfc-main">' +
                      '<div class="sp-nfc-icon">' + nfcSvg + '</div>' +
                      '<div class="sp-nfc-lbl">NFC&#8209;Chip<br>hier platzieren</div>' +
                    '</div>' +
                    '<div class="sp-nfc-url" id="sp-nfc-url">https://baeckereios.github.io</div>' +
                  '</div>' +
                  '<div class="sp-qr">' +
                    '<div id="sp-qr-canvas"></div>' +
                    '<div class="sp-qr-lbl">QR&#8209;Code</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="sp-footer">' +
                '<span class="sp-footer-left">BäckereiOS &middot; Interne Station &middot; Nicht entfernen</span>' +
                '<div class="sp-dots"><div class="sp-dot"></div><div class="sp-dot"></div><div class="sp-dot"></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── Drucken ──
        '<button class="schild-btn-print" onclick="DZ_SCHILD_print()">⎙ &nbsp;Schild drucken</button>' +
        '<div class="schild-disclaimer">Das Schild wird als eigener Druckjob im Querformat geöffnet — unabhängig von anderen Druckzentrale-Modulen.</div>' +

        '</div>' + // schild-wrap
        '</div>';  // container

    // Print-HTML versteckt vorhalten
    var printDiv = document.getElementById('dz-schild-print-src');
    if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'dz-schild-print-src';
        printDiv.style.display = 'none';
        printDiv.innerHTML =
            '<div class="schild-print-page">' +
              '<div class="p-header">' +
                '<div>' +
                  '<div class="p-brand-main"><b>Bäckerei</b><span class="p-brand-os">OS</span></div>' +
                  '<span class="p-brand-sub">Bäckerei Langrehr &middot; Garbsen &middot; Havelse</span>' +
                '</div>' +
                '<span class="p-tag">NFC&#8209;Station</span>' +
              '</div>' +
              '<div class="p-main">' +
                '<div class="p-name-area">' +
                  '<div class="p-name" id="p-name">Froster</div>' +
                '</div>' +
                '<div class="p-right">' +
                  '<div class="p-nfc">' +
                    '<div class="p-nfc-main">' +
                      '<div class="p-nfc-icon">' + nfcSvg + '</div>' +
                      '<div class="p-nfc-lbl">NFC&#8209;Chip<br>hier platzieren</div>' +
                    '</div>' +
                    '<div class="p-nfc-url" id="p-nfc-url">https://baeckereios.github.io</div>' +
                  '</div>' +
                  '<div class="p-qr">' +
                    '<img id="p-qr-img" src="" alt="QR-Code">' +
                    '<div class="p-qr-lbl">QR&#8209;Code</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="p-hinweis">' +
                '<div class="p-hinweis-title">Hinweis</div>' +
                '<div class="p-hinweis-text" id="p-hinweis">Chip mit Smartphone antippen, um direkt zu diesem Bereich in BäckereiOS zu gelangen.</div>' +
              '</div>' +
              '<div class="p-steps">' + printStepsHTML + '</div>' +
              '<div class="p-footer">' +
                '<span class="p-footer-left">BäckereiOS &middot; Interne Station &middot; Nicht entfernen</span>' +
                '<div class="p-dots"><div class="p-dot"></div><div class="p-dot"></div><div class="p-dot"></div></div>' +
              '</div>' +
            '</div>';
        document.body.appendChild(printDiv);
    }
}

// ── QR-CODE GENERIEREN ───────────────────────────────────────────────
function DZ_SCHILD_genQR(url) {
    var wrap = document.getElementById('sp-qr-canvas');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!url || typeof QRCode === 'undefined') return;
    try {
        new QRCode(wrap, {
            text: url,
            width:  128,
            height: 128,
            colorDark:  '#1a1a1a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch(e) { /* QRCode nicht geladen */ }
}

// ── INTERAKTION ───────────────────────────────────────────────────────
function DZ_SCHILD_setLabel(name, btn) {
    document.querySelectorAll('.schild-pill').forEach(function(p) { p.classList.remove('aktiv'); });
    btn.classList.add('aktiv');
    document.getElementById('schild-custom-row').style.display = 'none';
    DZ_SCHILD_updatePreview();
}

function DZ_SCHILD_toggleCustom(btn) {
    document.querySelectorAll('.schild-pill').forEach(function(p) { p.classList.remove('aktiv'); });
    btn.classList.add('aktiv');
    document.getElementById('schild-custom-row').style.display = 'flex';
    document.getElementById('schild-custom-input').focus();
    DZ_SCHILD_updatePreview();
}

function DZ_SCHILD_getLabel() {
    var aktiv = document.querySelector('.schild-pill.aktiv');
    if (!aktiv) return 'Station';
    var custom = document.getElementById('schild-custom-input');
    if (aktiv.textContent.trim() === 'Eigene…') {
        return (custom && custom.value.trim()) ? custom.value.trim() : 'Station';
    }
    return aktiv.textContent.trim();
}

function DZ_SCHILD_updatePreview() {
    var label   = DZ_SCHILD_getLabel();
    var hinweis = (document.getElementById('schild-hinweis') || {}).value || '';
    var url     = (document.getElementById('schild-url') || {}).value || '';

    var spName = document.getElementById('sp-name');
    var spHinw = document.getElementById('sp-hinweis');
    var spUrl  = document.getElementById('sp-nfc-url');
    var pName  = document.getElementById('p-name');
    var pHinw  = document.getElementById('p-hinweis');
    var pUrl   = document.getElementById('p-nfc-url');

    if (spName) spName.textContent = label;
    if (spHinw) spHinw.textContent = hinweis;
    if (spUrl)  spUrl.textContent  = url;
    if (pName)  pName.textContent  = label;
    if (pHinw)  pHinw.textContent  = hinweis;
    if (pUrl)   pUrl.textContent   = url;

    DZ_SCHILD_genQR(url);
}

// ── NFC LESEN ─────────────────────────────────────────────────────────
async function DZ_SCHILD_leseChip() {
    var btn    = document.getElementById('schild-btn-nfc');
    var status = document.getElementById('schild-nfc-status');
    if (!btn || !status) return;

    if (!('NDEFReader' in window)) {
        btn.classList.add('nfc-err');
        status.textContent = '✗ Web NFC nicht verfügbar – nur Android Chrome unterstützt.';
        return;
    }
    try {
        btn.className = 'schild-btn-nfc nfc-aktiv';
        btn.textContent = '📡 Warte auf Chip…';
        status.textContent = 'Gerät an den Chip halten…';

        var reader = new NDEFReader();
        await reader.scan();
        reader.addEventListener('reading', function(evt) {
            var found = null;
            for (var i = 0; i < evt.message.records.length; i++) {
                var r = evt.message.records[i];
                if (r.recordType === 'url' || r.recordType === 'absolute-url') {
                    found = new TextDecoder().decode(r.data);
                    break;
                }
            }
            btn.className = 'schild-btn-nfc' + (found ? ' nfc-ok' : ' nfc-err');
            btn.textContent = '📡 Chip lesen';
            if (found) {
                var inp = document.getElementById('schild-url');
                if (inp) { inp.value = found; DZ_SCHILD_updatePreview(); }
                status.textContent = '✓ ' + found;
            } else {
                status.textContent = '✗ Kein URL-Eintrag auf dem Chip.';
            }
        });
    } catch(e) {
        btn.className = 'schild-btn-nfc nfc-err';
        btn.textContent = '📡 Chip lesen';
        status.textContent = '✗ ' + (e.message || 'Zugriff verweigert.');
    }
}

// ── DRUCKEN (window.open — zuverlässiger für Landscape auf Android) ───
function DZ_SCHILD_print() {
    DZ_SCHILD_updatePreview();

    var printSrc = document.getElementById('dz-schild-print-src');
    if (!printSrc) return;

    // QR-Code als dataURL aus der Vorschau holen
    var qrDataUrl = '';
    var qrCanvas = document.querySelector('#sp-qr-canvas canvas');
    var qrImg    = document.querySelector('#sp-qr-canvas img');
    if (qrCanvas) {
        try { qrDataUrl = qrCanvas.toDataURL('image/png'); } catch(e) {}
    } else if (qrImg) {
        qrDataUrl = qrImg.src;
    }

    // Print-HTML klonen und QR-img befüllen
    var printHTML = printSrc.innerHTML;
    if (qrDataUrl) {
        printHTML = printHTML.replace(
            'id="p-qr-img" src=""',
            'id="p-qr-img" src="' + qrDataUrl + '"'
        );
    }

    var win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        alert('Popup wurde blockiert. Bitte Popups für diese Seite erlauben.');
        return;
    }

    win.document.write(
        '<!DOCTYPE html><html><head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width">' +
        '<style>' + DZ_SCHILD_PRINT_CSS + '</style>' +
        '</head><body>' +
        printHTML +
        '<script>' +
        'window.onload = function() {' +
        '  setTimeout(function() { window.print(); }, 400);' +
        '};' +
        '<\/script>' +
        '</body></html>'
    );
    win.document.close();
}
