// druckzentrale_modul_g.js
// Modul G — Tab 2: Bestand & Verbrauch (individuelles Formular)
// Status: Scaffold — Produktauswahl und Formular-Generierung folgen
// Print-CSS: DZ_PRINT_CSS_G

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_G = [
    '/* --- BESTAND & VERBRAUCH (Tab 2) --- */',
    '/* Folgt mit Implementierung */'
].join('\n');

// ── INIT ─────────────────────────────────────────────────────────────
function DZ_G_render() {
    var container = document.getElementById('tab2-container');
    if (!container) return;

    container.innerHTML = [
        '<div style="padding:40px 0;text-align:center;color:var(--dim);">',
        '  <div style="font-size:2rem;margin-bottom:12px;">🚧</div>',
        '  <div style="font-family:\'Barlow Condensed\';font-weight:900;font-size:1.1rem;letter-spacing:1px;text-transform:uppercase;">',
        '    Bestand &amp; Verbrauch',
        '  </div>',
        '  <div style="font-size:0.8rem;margin-top:8px;">In Entwicklung</div>',
        '</div>'
    ].join('\n');
}
