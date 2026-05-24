# Druckzentrale — Architekturdokumentation

> BäckereiOS · Stand: April 2026  
> Pfad: `druckzentrale/`  
> Einstieg: `druckzentrale.html`

---

## Übersicht

Die Druckzentrale ist die zentrale Druckschnittstelle von BäckereiOS. Sie bündelt mehrere unabhängige Druckmodule unter einer gemeinsamen Oberfläche und ermöglicht die selektive Auswahl und den gebündelten Ausdruck auf A4.

Seit dem Refactoring (April 2026) ist die Seite vollständig modularisiert: Jedes Druckmodul lebt in einer eigenen JS-Datei und bringt sein eigenes HTML-Template, seine eigene Logik, seinen eigenen localStorage-Key und sein eigenes Print-CSS mit. Die HTML-Datei ist reines Skelett.

---

## Dateistruktur

```
druckzentrale/
├── druckzentrale.html          ← Skelett + Tab-Navigation + Script-Tags
├── druckzentrale.css           ← Screen-Styles (inkl. Tab-Navigation)
├── druckzentrale_logic.js      ← Berechnungen (shared, keine DOM-Abhängigkeit)
├── druckzentrale_ui.js         ← Tab-Nav, Toggle, Druck-Engine, Init
├── druckzentrale_modul_a.js    ← Frühschicht-Formular
├── druckzentrale_modul_b.js    ← Froster-Bestand
├── druckzentrale_modul_c.js    ← Wochenziele + Körner
├── druckzentrale_modul_d.js    ← Verbrauchs-Matrix
├── druckzentrale_modul_e.js    ← Frosterliste (Kopiervorlage)
├── druckzentrale_modul_f.js    ← BÄKO-Übersicht
├── druckzentrale_modul_g.js    ← Tab 2: Bestand & Verbrauch (in Entwicklung)
└── DRUCKZENTRALE.md            ← diese Datei
```

**Gelöscht beim Refactoring:**
- `druckzentrale_baeko.js` → Inhalt vollständig in `druckzentrale_modul_f.js` überführt

---

## Script-Ladereihenfolge

Die Reihenfolge in `druckzentrale.html` ist bewusst gewählt und darf nicht geändert werden:

```
druckzentrale_logic.js      ← zuerst: stellt DZ_pad, DZ_getStock, DZ_calcNeed etc. bereit
druckzentrale_modul_a.js    ← Module: registrieren DZ_PRINT_CSS_*, render-Funktionen, Persistenz
druckzentrale_modul_b.js
druckzentrale_modul_c.js
druckzentrale_modul_d.js
druckzentrale_modul_e.js
druckzentrale_modul_f.js
druckzentrale_modul_g.js
druckzentrale_ui.js         ← zuletzt: DOMContentLoaded, ruft alle Module auf
shell.js                    ← BäckereiOS-Standard, immer am Ende
```

`inventurdaten.js` wird im `<head>` mit `defer` geladen. Das bedeutet: Es ist beim `DOMContentLoaded` noch nicht zwingend fertig. Die `druckzentrale_ui.js` berücksichtigt das mit einem Retry-Mechanismus in `DZ_init()` (bis zu 40 × 100ms) und einem direkten `BOS_INVENTUR`-Fallback in `_checkAndLockFroster()`.

---

## Tab-Struktur

### Tab 1 — Dokumente (`#tab-dokumente`)
Die bestehenden Druckmodule A–F. Auswahl per Checkbox-Karten, gebündelter Druck über "Auswahl drucken".

### Tab 2 — Bestand & Verbrauch (`#tab-formular`)
Geplantes individuelles Formular: Produktauswahl → generiertes Bestand-vs-Verbrauch-Druckdokument. Implementierung in `druckzentrale_modul_g.js`. Stand: Scaffold mit Platzhalter.

Tab-Switching via `DZ_switchTab(tabId)` in `druckzentrale_ui.js`.

---

## Modul-Anatomie

Jedes Modul folgt dem gleichen Aufbau:

```js
// 1. Print-CSS — globale Konstante, wird von _collectPrintCSS() eingesammelt
var DZ_PRINT_CSS_X = [ '...css...' ].join('\n');

// 2. HTML-Template-Funktion (optional, nur wenn das Modul eigenes HTML hat)
//    Schreibt in #module-X-body
function DZ_X_render() { ... }

// 3. Init-Funktion (optional, für localStorage-Restore o.ä.)
window.DZ_X_init = function() { ... };

// 4. Render-Funktion (für dynamische Inhalte, wird von _rerender() aufgerufen)
function DZ_renderX() { ... }
```

`druckzentrale_ui.js` ruft beim `DOMContentLoaded` in dieser Reihenfolge:
1. `DZ_A_render()`, `DZ_C_render()`, `DZ_E_render()`, `DZ_G_render()` — Templates in DOM schreiben
2. `setupFruehschicht()` — Dropdowns + Notizzeilen (braucht DOM aus Modul A)
3. `DZ_E_init()` — Frosterliste befüllen (braucht DOM aus Modul E)
4. `DZ_A_initExtra()` — Extra-Zeilen aus localStorage (braucht DOM aus Modul A)
5. `DZ_init(callback)` — Inventur + Stammdaten laden, danach Inventur-Status setzen

---

## Druckmodule im Detail

### Modul A — Frühschicht-Formular
**Datei:** `druckzentrale_modul_a.js`  
**DOM-Anker:** `#module-A-body`  
**localStorage:** `BOS_FS_EXTRA_v2` (dynamisch hinzugefügte Zeilen)

Feste Zeilen (6 Stück): Mohn+Sesam, Schokocroissants, Laugenecken, Buttercroissants, Minibuttercroissants, Minischokocroissants. Danach dynamische Extra-Zeilen via `fs_addExtraRow()`, dann Käsebrötchen.

Zebra-Muster: gerade Zeilen grau (`#e8e8e8`), hardcoded im HTML als Inline-Style für Print-Kompatibilität.

Notiz-Zeilen (3 Stück): werden von `addNotizRow()` in `druckzentrale_ui.js` erzeugt, da `setupFruehschicht()` zentralisiert ist.

**Wichtig:** `setupFruehschicht()` läuft in `druckzentrale_ui.js`, nicht im Modul selbst. Das Modul stellt nur DOM bereit.

---

### Modul B — Froster-Bestand
**Datei:** `druckzentrale_modul_b.js`  
**DOM-Anker:** `#froster-content`  
**Lock-Bedingung:** Inventur älter als 24h → `🔒 GESPERRT`-Badge, Karte nicht anklickbar

Liest aus `BOS_STAMMDATEN` (gefiltert auf `inventurRelevant === true`) und `BOS_INVENTUR`. Gruppierung nach `p.station`. Bestand via `DZ_getStock(k)` aus `druckzentrale_logic.js`.

**Lock-Logik (in `druckzentrale_ui.js`):**
```
DZ_getInvInfo().ageH >= 9999  →  Keine Inventur gefunden
DZ_getInvInfo().isOld         →  Inventur > 24h alt
```
In beiden Fällen: `_checkAndLockFroster(true)` → prüft zuerst Urlaubsschlüssel-Cache, dann direkten `BOS_INVENTUR`-Check (Timing-Fallback), sonst `_lockFroster()`.

**Bekanntes Problem (behoben):** `inventurdaten.js` kommt via `defer` manchmal nach dem `DZ_init`-Retry-Timeout an. `DZ_latestInvTs` war dann `0` obwohl Daten vorhanden. Fix: `_checkAndLockFroster()` prüft `BOS_INVENTUR.products` direkt nochmal bevor es sperrt.

---

### Modul C — Wochenziele + Körner
**Datei:** `druckzentrale_modul_c.js`  
**DOM-Anker:** `#module-C-body` (Template), `#wochenziele-content` (dynamischer Teil)  
**Konfiguration:** Zwei Datums-Dropdowns (`#zeit-C1`, `#zeit-C2`), Default Mittwoch + Samstag

Template enthält die statische Körner-Tabelle (Einweichen Mo–Sa). Der dynamische Wochenziele-Teil (`DZ_renderWochenziele()`) wird bei Toggle und bei Datums-Änderung neu gerendert.

Berechnung: `DZ_calcNeed(prodId, zielDate)` summiert tagesweise von `DZ_anchorDate` bis Zieldatum. Berücksichtigt `DZ_wochenconfig` (zu, hamster_1/2/3).

---

### Modul D — Verbrauchs-Matrix
**Datei:** `druckzentrale_modul_d.js`  
**DOM-Anker:** `#matrix-content`

Rendert je zwei Stationen pro Druckseite (`matrix-page pb-after`). Spalten: Mo Di Mi Do Fr Sa So + Mo (Mo doppelt, weil Wochenbeginn). Zeigt `p.needs[0..6]` aus Stammdaten.

Print: Jede `matrix-page`-Div bekommt beim Druck automatisch den Report-Header vorangestellt (Sonderbehandlung in `doPrint()`).

---

### Modul E — Frosterliste (Kopiervorlage)
**Datei:** `druckzentrale_modul_e.js`  
**DOM-Anker:** `#module-E-body` (Template), `#fl-tbody` (Tabelleninhalt)  
**localStorage:** `BOS_FL_STATE_v1` (Zellinhalte), `BOS_FL_ROWS_v1` (Anzahl Extra-Zeilen)  
**Abhängigkeit:** `../frosterliste_produkte.js` → `FL_PRODUKTE[]`

`FL_PRODUKTE` wird im HTML nach den Modulen geladen (`<script src="../frosterliste_produkte.js">`). Jedes Produkt hat `mosa`, `so` (null = kein Sonntag-Feld → `.no-sunday`-Zelle), `wohin`.

`WOHIN_LABELS` übersetzt Config-Keys in Klartext: `koma7` → `Koma 7` usw.

Alle Zellen (`produkt-mosa`, `produkt-so`, `produkt-wohin`) sind `contenteditable`. Änderungen werden sofort via `saveState()` in localStorage geschrieben.

Print: Modul E bekommt **keinen** Report-Header (Sonderbehandlung in `doPrint()`), weil die Frosterliste ein eigenständiges Formular ist.

---

### Modul F — BÄKO-Übersicht
**Datei:** `druckzentrale_modul_f.js`  
**DOM-Anker:** `#baeko-content`  
**Datenquellen:** `lieferanten_config.json`, `lieferanten_bestand_db.json`  
**Fallback-Pfade:** zuerst relativ (`lieferanten_config.json`), dann `../lieferanten_config.json`

Lädt beide JSON-Dateien parallel beim Scriptstart (IIFE). Wenn beide geladen: `_bk_geladen = true`. Falls Modul F zu dem Zeitpunkt bereits aktiv ist, wird direkt gerendert.

Bestellempfehlung: `avg_tagesverbrauch × 7 × (1 + sicherheitsaufschlag)`. Aufschlag default 15%, überschreibbar via `einstellungen.sicherheitsaufschlag` in `lieferanten_config.json`.

Lagertyp-Reihenfolge: `tk → kuehl → trocken → sonstiges`.

---

### Modul G — Bestand & Verbrauch (Tab 2)
**Datei:** `druckzentrale_modul_g.js`  
**DOM-Anker:** `#tab2-container`  
**Status:** Scaffold

Geplante Funktion: Produktauswahl (Checkboxen aus `BOS_STAMMDATEN`) → generiertes Druckformular mit Bestand-Ist-Wert und Verbrauchsverlauf. Eigene Druckfunktion unabhängig von Tab 1.

**Erweiterung:** `DZ_PRINT_CSS_G` + eigene `doPrintTab2()` Funktion. `_collectPrintCSS()` in `druckzentrale_ui.js` bindet `DZ_PRINT_CSS_G` bereits ein.

---

## druckzentrale_logic.js — Shared Berechnungen

Keine DOM-Abhängigkeit. Exportiert:

| Funktion | Beschreibung |
|---|---|
| `DZ_pad(n)` | Zweistellige Zahl als String |
| `DZ_getLatestInvTs()` | Neuester Timestamp aus `BOS_INVENTUR.products` |
| `DZ_getStock(prodId)` | Bestand eines Produkts aus `BOS_INVENTUR` |
| `DZ_calcNeed(prodId, zielDate)` | Summierter Bedarf von anchorDate bis zielDate |
| `DZ_getEinheit(p)` | Einheiten-Kürzel (Bl., Dl., …) |
| `DZ_buildZeitspanneOptions(sel, defaultDay)` | Füllt Datums-Dropdown mit 14 Tagen |
| `DZ_parseDate(sel)` | Select-Wert → Date-Objekt |
| `DZ_getInvInfo()` | `{ ageH, dateStr, isOld }` |
| `DZ_init(cb)` | Initialisiert Stammdaten + Inventur, ruft Callback |

**Globale Variablen (nach Init gesetzt):**

| Variable | Inhalt |
|---|---|
| `DZ_anchorDate` | Startdatum für Bedarfsrechnung (heute +1 oder +2 je nach Uhrzeit) |
| `DZ_invRelevant` | Set der legacyKeys mit `inventurRelevant === true` |
| `DZ_wochenconfig` | `{ 'YYYY-MM-DD': 'zu'/'hamster_1'/... }` |
| `DZ_latestInvTs` | Neuester Inventur-Timestamp (ms) |

**Anchor-Logik:**  
`fDone = (minNow >= 90 && minNow <= 1200)` → Frühschicht fertig (1:30–20:00 Uhr)  
→ `anchorDate = heute + 2` (für morgen früh produzieren)  
→ sonst `anchorDate = heute + 1`

---

## druckzentrale_ui.js — Kern

### `_collectPrintCSS()`
Sammelt Base-CSS + alle `DZ_PRINT_CSS_*`-Konstanten der Module ein. Kein Modul muss sich selbst um den Druck kümmern — es reicht, die Konstante zu definieren.

### `doPrint()`
1. Formularwerte "einbrennen" (value-Attribute setzen, für iframe-Kopie)
2. Aktive Module zu einem HTML-Dokument zusammenbauen
3. Sonderbehandlung: Modul E ohne Header, Modul D mit Header pro `matrix-page`
4. iframe erstellen, HTML hineinschreiben, `print()` nach 400ms

### `DZ_switchTab(tabId)`
Versteckt alle `.dz-tab-content`, aktiviert den gewählten. Setzt aktiven Tab-Button.

---

## localStorage-Keys

| Key | Modul | Inhalt |
|---|---|---|
| `BOS_FS_EXTRA_v2` | Modul A | Dynamisch hinzugefügte Frühschicht-Zeilen |
| `BOS_FL_STATE_v1` | Modul E | Zellinhalte der Frosterliste |
| `BOS_FL_ROWS_v1` | Modul E | Anzahl Extra-Zeilen |
| `BOS_URLAUBSSCHLUESSEL_CACHE` | Modul B (Lock) | Urlaubsmodus-Inventur-Cache |

---

## Print-CSS Architektur

Kein Print-CSS in `druckzentrale.css`. Alles Print-relevante lebt in den Modulen als JS-String-Konstante (`DZ_PRINT_CSS_A` bis `DZ_PRINT_CSS_G`) und wird zur Laufzeit von `_collectPrintCSS()` zusammengesetzt. Das ermöglicht:

- Modul ändern → Print-CSS mit ändern, an einem Ort
- Modul entfernen → sein Print-CSS fällt automatisch weg
- Neues Modul → einfach `DZ_PRINT_CSS_X` definieren, wird automatisch eingesammelt

---

## Externe Abhängigkeiten

| Datei | Bereitgestellt durch | Inhalt |
|---|---|---|
| `../produktions_gehirn.js` | BäckereiOS Core | `BOS_GEHIRN`, `BOS_STAMMDATEN` |
| `../inventurdaten.js` | BäckereiOS Core | `BOS_INVENTUR` (defer!) |
| `../feiertage_nds.js` | BäckereiOS Core | Feiertagskalender NDS |
| `../frosterliste_produkte.js` | BäckereiOS Core | `FL_PRODUKTE[]` |
| `../systemdesign.css` | BäckereiOS Core | CSS-Variablen, Base-Styles |
| `../shell.js` | BäckereiOS Core | Tab-Bar, Navigation |
| `lieferanten_config.json` | Lieferanten-System | Produktkonfiguration |
| `lieferanten_bestand_db.json` | Lieferanten-System | Bestandshistorie |

---

## Bekannte Fallstricke

**`inventurdaten.js` kommt zu spät (defer-Timing)**  
Symptom: Froster-Bestand zeigt "GESPERRT" obwohl Inventur frisch ist.  
Ursache: `DZ_init` gibt nach 40 Retries auf, `BOS_INVENTUR` ist noch null.  
Fix: `_checkAndLockFroster()` prüft `BOS_INVENTUR.products` direkt nochmal bevor es sperrt.

**`DZ_latestInvTs` bleibt 0**  
Folge des obigen Problems. Nach dem Fix wird `DZ_latestInvTs` in `_checkAndLockFroster()` nachträglich korrigiert, damit Modul B korrekt rendert.

**Modul F lädt Daten beim Scriptstart**  
`druckzentrale_modul_f.js` startet einen `fetch()` sofort beim Laden. Wenn Modul F noch nicht aktiv ist, wird nach Ladeschluss nur ein Flag gesetzt. Render passiert erst beim Toggle. Falls Modul F bereits aktiv (z.B. durch `_rerenderAllActive()`), wird direkt gerendert.

**Print-Iframe und `contenteditable`**  
Beim Druck wird der DOM in einen iframe kopiert. `contenteditable`-Inhalte gehen dabei verloren wenn sie nicht im `textContent` stehen. Die Frosterliste ist davon betroffen — sie wird deswegen nicht über den generischen Pfad, sondern direkt als `content = body.innerHTML` in den iframe übernommen. Das funktioniert korrekt solange keine aktiven Fokus-Zustände beim Druck vorliegen.

---

## Neues Modul hinzufügen

1. Datei `druckzentrale_modul_x.js` anlegen
2. `var DZ_PRINT_CSS_X = [...]` definieren
3. `function DZ_X_render()` schreibt HTML in einen DOM-Anker
4. In `druckzentrale.html`: Ctrl-Card + `#module-X` + `#module-X-body` ergänzen, Script-Tag vor `druckzentrale_ui.js` einfügen
5. In `druckzentrale_ui.js`:
   - `_active` um `X: false` erweitern
   - `DZ_X_render()` im DOMContentLoaded-Block aufrufen
   - `_rerender('X')` in `_rerender()` ergänzen
   - `DZ_PRINT_CSS_X` in `_collectPrintCSS()` einbinden (sofern nicht schon per `typeof`-Check abgedeckt)

---

*Dokument gepflegt von: [Claude] · Zuletzt aktualisiert: April 2026*
