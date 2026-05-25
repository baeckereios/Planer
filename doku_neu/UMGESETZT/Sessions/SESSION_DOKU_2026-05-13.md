# Session-Dokumentation — 13.05.2026

---

## 1. steckbrief_editor.html — Leeres Dropdown

**Problem:** Der Dropdown zeigte keine Produkte an.

**Ursache 1 — Falscher Filter:**
```js
// ALT (kaputt)
var relevant = produktConfig.filter(function(p) {
  return p.in_backstube_gebacken && !p.ist_rohstoff;
});
```
Die Felder `in_backstube_gebacken` und `ist_rohstoff` existieren nicht in `produkt_config.json` — sie sitzen in `lieferanten_config.json`. Der Filter gab damit immer `false` zurück.

**Fix:**
```js
// NEU
var relevant = produktConfig.slice(); // alle Produkte, kein Filter
```

**Ursache 2 — Stiller Fetch-Fehler:**
Der `catch`-Block in `ladeJSON()` war leer (`catch(e) {}`). Fehler beim Laden der Config wurden verschluckt. Für Debugging: `console.error()` einbauen.

---

## 2. steckbrief_editor.html — Speichern-Button versteckt

**Problem:** Der Speichern-Button lag hinter der Shell-Navigation oder klaffte in einem weißen Streifen.

**Ursache:** Feste `.aktions-bar` unten konfligierte mit dem Shell-Footer (`DATENSATZ BIS` + Tab-Bar).

**Lösung:** Bottom-Bar komplett entfernt. Button in eine sticky **Top-Bar** umgebaut — analog zu `froster_konfiguration.html`.

```css
/* NEU */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--card-bg, #fff);
  border-bottom: 1.5px solid var(--border-color, #e5e0d8);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

HTML-Struktur:
```html
<div class="top-bar">
  <div class="top-bar-titel">📋 Steckbrief-Editor
    <span>Abschnitte ein/ausschalten und Inhalte pflegen.</span>
  </div>
  <a id="btn-vorschau" class="btn-vorschau" href="#" target="_blank">👁 Vorschau</a>
  <button id="btn-speichern" class="btn-speichern" onclick="speichern()" disabled>⬇️ Speichern</button>
</div>
```

---

## 3. backwaren_index.html — Keine Backwaren angezeigt

**Problem:** "Keine Backwaren in der Config gefunden."

**Ursache:** Gleicher Filter-Bug wie im Editor — `in_backstube_gebacken` nicht in `produkt_config.json`.

**Designentscheidung:** Nur Produkte mit vorhandenem Steckbrief-Eintrag anzeigen. Dadurch ist die Liste selbst-regulierend — neues Produkt im Editor anlegen + deployen → erscheint automatisch.

```js
// NEU
var relevant = produktConfig.filter(function(p) {
  return !!steckbriefe[p.legacyKey || p.id];
});
```

---

## 4. steckbrief.html — Bestand-Chip aus zwei Quellen

**Neue Funktionalität:** Der Bestand-Chip wurde erweitert, um zwei Datenquellen zu unterstützen. **Beide Quellen zeigen nichts an wenn der Timestamp älter als 12 Stunden ist.**

### Quelle 1: TK-Lieferware (`lieferanten_db.json`)
- Bedingung: Produkt hat einen Eintrag in `lieferanten_config.json` via `produkt_config_key === legacyKey`
- Liest letzten `typ: "bestand"`-Eintrag aus `lieferanten_db.json`
- Anzeige: `❄️ Froster: <Menge> <Einheit> · HH:MM Uhr`

### Quelle 2: Froster-Backwaren (`inventurdaten.js`)
- Bedingung: `produkt.inventurRelevant === true` in `produkt_config.json`
- Liest `window.BOS_INVENTUR.products[legacyKey]` aus `inventurdaten.js`
- Felder: `stock`, `ts` (Unix ms), `locs`, `fehlmenge`
- Anzeige: `🧊 Froster: <stock> <einheit> · HH:MM Uhr`

> **Unterscheidung:** ❄️ = TK-Lieferware, 🧊 = selbst produzierte Froster-Backware

**Neu in `steckbrief.html`:**
```html
<script src="../inventurdaten.js"></script>  <!-- vor shell.js -->
<script src="../shell.js" defer></script>
```

**Altes Verhalten entfernt:** Der gelbe "älter als 12h"-Chip (`froster-chip alt`) existiert nicht mehr. Veraltete Daten = kein Chip.

---

## 5. shell.js + index.html — Navigation synchronisiert

**Problem:** `index.html` hatte bereits auf START/TEAM/BRETT/ZENTRAL umgebaut, `shell.js` injizierte noch das alte START/DRUCK/BRETT/MEHR in alle Unterseiten.

### shell.js — Tabs-Array

```js
// ALT
{ id: 'druck', label: 'Druck', href: base + 'druckzentrale/druckzentrale.html' },
{ id: 'mehr',  label: 'Mehr',  href: base + 'index.html#mehr' },

// NEU
{ id: 'team',    label: 'Team',    href: 'https://my.hidrive.com/share/0a5xcrfaf8', target: '_blank' },
{ id: 'zentral', label: 'Zentral', href: base + 'index.html#zentral', customClass: 'bos-tab-btn-zentral' },
```

### shell.js — Zentral-Button CSS

```css
.bos-tab-btn-zentral       { color: var(--v-accent, #3d6b9e); }
.bos-tab-btn-zentral:hover { color: var(--v-header, #2a4a6b); }
.bos-tab-btn-zentral.active{ color: var(--v-header, #2a4a6b); }
```

### shell.js — PAGE_CONFIG

Alle 32 Einträge mit `tab: 'mehr'` → `tab: 'zentral'` geändert. `tab: 'druck'` (druckzentrale, schnelldruck) bleibt unverändert.

### index.html — Hash-Routing

```js
function checkHashTab() {
  const hash = window.location.hash;
  if (hash === '#mehr') { openSidebar(); history.replaceState(null, '', window.location.pathname); }
  else if (hash === '#zentral') { openVerwaltung(); history.replaceState(null, '', window.location.pathname); } // NEU
  else if (hash === '#brett') {
    const btn = document.querySelector('[data-tab="brett"]');
    if (btn) { switchTab('brett', btn); clearBrettBadge(); }
    history.replaceState(null, '', window.location.pathname);
  }
}
```

---

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `AdminTools/steckbrief_editor.html` | Filter entfernt, Bottom-Bar → Top-Bar |
| `backwaren/backwaren_index.html` | Filter auf Steckbrief-Existenz umgestellt |
| `backwaren/steckbrief.html` | Bestand-Chip aus zwei Quellen, 12h-Cutoff für beide, `inventurdaten.js` eingebunden |
| `shell.js` | Tabs auf START/TEAM/BRETT/ZENTRAL, CSS Zentral-Button, 32× `mehr` → `zentral` |
| `index.html` | `checkHashTab()` um `#zentral` ergänzt |

---

## Separate Dokumentation

Für das Steckbrief-System existiert eine eigene Datei: **`STECKBRIEF_DOKU.md`**
