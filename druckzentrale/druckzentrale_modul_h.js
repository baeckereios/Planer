// druckzentrale_modul_h.js
// Modul H — Nachbestellung
// Eigenständiges Formular (kein Report-Header, keine BOS-Datenabhängigkeit)
// DOM-Anker: #module-H-body

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_H = [
    '.nb-form { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; max-width: 100%; }',
    '.nb-bos-bar { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #bbb; padding-bottom: 5px; margin-bottom: 14px; }',
    '.nb-bos-logo { font-family: Georgia, serif; font-size: 13pt; font-weight: 900; color: #000; line-height: 1; }',
    '.nb-bos-logo span { font-style: italic; color: #888; font-weight: normal; }',
    '.nb-bos-sub { font-size: 7.5pt; color: #999; letter-spacing: 0.5px; text-transform: uppercase; }',
    '.nb-header { font-size: 22pt; font-weight: 900; text-align: center; letter-spacing: 2px; border: 4px solid #000; padding: 14px 20px; margin-bottom: 16px; background: #fff; }',
    '.nb-meta-row { display: flex; gap: 24px; margin-bottom: 16px; }',
    '.nb-meta-field { display: flex; align-items: center; gap: 8px; flex: 1; border-bottom: 2px solid #000; padding-bottom: 6px; }',
    '.nb-label { font-weight: bold; font-size: 10pt; white-space: nowrap; }',
    '.nb-select, .nb-input { border: none !important; background: transparent !important; font-size: 11pt; flex: 1; padding: 0 !important; outline: none; }',
    '.nb-status-row { display: flex; gap: 16px; margin-bottom: 16px; }',
    '.nb-status-block { flex: 1; border: 2px solid #000; padding: 12px 14px; }',
    '.nb-status-title { font-weight: 900; font-size: 10pt; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; }',
    '.nb-check-option { display: flex; align-items: flex-start; gap: 10px; padding: 5px 0; cursor: pointer; font-size: 9.5pt; line-height: 1.35; }',
    '.nb-checkbox { width: 18px; height: 18px; min-width: 18px; border: 2px solid #000; background: #fff; position: relative; margin-top: 1px; }',
    '.nb-check-option.checked .nb-checkbox::after { content: "✓"; position: absolute; top: -3px; left: 1px; font-size: 14pt; font-weight: 900; color: #000; line-height: 1; }',
    '.nb-produkte-block { margin-bottom: 16px; }',
    '.nb-produkte-label { font-weight: bold; font-size: 10pt; margin-bottom: 6px; }',
    '.nb-textarea { width: 100%; border: 2px solid #000 !important; padding: 10px !important; font-size: 10pt; min-height: 100px; resize: vertical; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; background: #fff !important; }',
    '.nb-sig-block { margin-bottom: 14px; }',
    '.nb-sig-line { border-bottom: 2px solid #000; height: 36px; margin-bottom: 4px; }',
    '.nb-sig-label { font-size: 8.5pt; color: #555; text-align: center; }',
    '.nb-wichtig { border: 2px solid #000; padding: 10px 14px; font-size: 9pt; line-height: 1.45; background: #f5f5f5; }',
    '.nb-wichtig strong { font-weight: 900; }',
    '.nb-screen-hint { font-size: 8.5pt; color: #888; margin-top: 6px; text-align: center; }'
].join('\n');

// ── HTML-TEMPLATE ─────────────────────────────────────────────────────
function DZ_H_render() {
    var anchor = document.getElementById('module-H-body');
    if (!anchor) return;

    anchor.innerHTML = [
        '<div class="nb-form">',

        '  <div class="nb-bos-bar">',
        '    <div class="nb-bos-logo">Bäckerei<span>OS</span></div>',
        '    <div class="nb-bos-sub">Produktionskommunikation</div>',
        '  </div>',

        '  <div class="nb-header">❗ NACHBESTELLUNG ❗</div>',

        '  <div class="nb-meta-row">',
        '    <div class="nb-meta-field">',
        '      <span class="nb-label">Wochentag:</span>',
        '      <select id="nb-wochentag" class="nb-select">',
        '        <option value="">—</option>',
        '        <option>Montag</option>',
        '        <option>Dienstag</option>',
        '        <option>Mittwoch</option>',
        '        <option>Donnerstag</option>',
        '        <option>Freitag</option>',
        '        <option>Samstag</option>',
        '        <option>Sonntag</option>',
        '      </select>',
        '    </div>',
        '    <div class="nb-meta-field">',
        '      <span class="nb-label">Filiale:</span>',
        '      <input type="text" id="nb-filiale" class="nb-input" placeholder="—">',
        '    </div>',
        '  </div>',

        '  <div class="nb-status-row">',

        '    <div class="nb-status-block">',
        '      <div class="nb-status-title">Status: Backzettel</div>',
        '      <div class="nb-check-option" onclick="this.classList.toggle(\'checked\')">',
        '        <div class="nb-checkbox"></div>',
        '        <span>wurde noch nicht eingepflegt</span>',
        '      </div>',
        '      <div class="nb-check-option" onclick="this.classList.toggle(\'checked\')">',
        '        <div class="nb-checkbox"></div>',
        '        <span>weiß nicht, bitte selbst prüfen</span>',
        '      </div>',
        '      <div class="nb-check-option" onclick="this.classList.toggle(\'checked\')">',
        '        <div class="nb-checkbox"></div>',
        '        <span>wurde auch im Backzettel eingepflegt</span>',
        '      </div>',
        '    </div>',

        '    <div class="nb-status-block">',
        '      <div class="nb-status-title">Status: Froster</div>',
        '      <div class="nb-check-option" onclick="this.classList.toggle(\'checked\')">',
        '        <div class="nb-checkbox"></div>',
        '        <span>wurde bereits aus dem Froster geholt</span>',
        '      </div>',
        '      <div class="nb-check-option" onclick="this.classList.toggle(\'checked\')">',
        '        <div class="nb-checkbox"></div>',
        '        <span>bitte selbst noch organisieren</span>',
        '      </div>',
        '    </div>',

        '  </div>',

        '  <div class="nb-produkte-block">',
        '    <div class="nb-produkte-label">Welche Produkte / Mengen / Details?</div>',
        '    <textarea id="nb-details" class="nb-textarea" rows="6" placeholder="z. B. 12× Buttertoast, 2× Laugenstangen …"></textarea>',
        '  </div>',

        '  <div class="nb-sig-block">',
        '    <div class="nb-sig-line"></div>',
        '    <div class="nb-sig-label">Unterschrift / Kürzel Produktionsleitung</div>',
        '  </div>',

        '  <div class="nb-wichtig">',
        '    <strong>WICHTIG:</strong> Ist bei den aktuellen Backzetteln (oben drauf) oder ',
        '    offensichtlich auf dem Tisch im Kuchenversand zu hinterlegen.',
        '  </div>',

        '  <div class="nb-screen-hint no-print">Checkboxen antippen zum Markieren · Drucken über "Auswahl drucken"</div>',

        '</div>'
    ].join('\n');
}
