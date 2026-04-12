# `bestandsuebersicht.html` — Technische Dokumentation

**BäckereiOS · Stand: April 2026**  
Letzte relevante Änderungen: Balken-Farblogik (Zelle-für-Zelle), Überhang-Zone (kleine Zellen, nur bei Überschuss)

---

## 1. Zweck und Kontext

Diese Seite zeigt den aktuellen **Frosterbestand aller Produkte** bewertet gegen den Bedarf bis zum nächsten **Montag** (dem wöchentlichen Backtag-Cut). Sie ist die operative Kernanzeige für die Nachtschicht: Was ist noch da, was fehlt, was reicht über Montag hinaus?

Der Nutzer sieht auf einen Blick:
- Wie weit der Bestand eines Produkts zeitlich reicht (Ladebalken)
- Ob der Montag gedeckt ist oder nicht (Gesamtstatus)
- Wie viele Tage nach Montag der Bestand noch ausreicht (Überhang)
- Wann die Inventur gemacht wurde und ob der Froster bereits erledigt ist

---

## 2. Abhängigkeiten

| Datei / Ressource | Rolle |
|---|---|
| `systemdesign.css` | Design-Token (Farben, Fonts, Abstände) |
| `feiertage_nds.js` | Stellt `window.BOS_BESONDERE_TAGE_IN(n)` bereit — prüft ob in n Tagen ein Feiertag liegt |
| `produktions_gehirn.js` | Stellt `window.BOS_STAMMDATEN` bereit (alle Produkte inkl. `needs[]`, `legacyKey`, `station`, `inventurRelevant`, `charge`, `pressenGroesse`) |
| `inventurdaten.js` | Stellt `window.BOS_INVENTUR` bereit — enthält `products{}` mit Beständen und Timestamps |
| `shell.js` | Navigation (Tab-Bar) |
| `wochenconfig.json` | Optional — Sondertage (Feiertag, Schließtag, Hamster-Tage). Wird on-demand gefetcht. |

> **Wichtig:** `produktions_gehirn.js` ist der einzige erlaubte Schreiber von `BOS_STAMMDATEN`. Felder, die das Gehirn nicht kennt, werden dort aktiv gestripped. Nie direkt in `BOS_STAMMDATEN` schreiben.

---

## 3. Globale Variablen

```js
var activeStation = 'alle';          // Aktiver Stationsfilter
var latestInvTsGlobal = 0;           // Höchster Inventur-Timestamp über alle Produkte
var anchorDate = new Date();         // Startdatum für Bedarfsberechnung (morgen oder übermorgen)
var isInitialized = false;           // Guard gegen Doppel-Init
var retryCount = 0;                  // Zähler für Init-Retry (max 20 × 50ms)
var nurInvRelevant = true;           // Wenn true: nur inventurRelevant===true Produkte anzeigen
var inventurRelevantKeys = new Set();// Set von legacyKeys die in der Inventur relevant sind
var wochenconfig = {};               // Map: datum (YYYY-MM-DD) → typ ('zu'|'hamster_1'|'hamster_2'|'hamster_3')
var frosterOffset = 1;               // 1 = Froster offen (anchorDate = morgen), 2 = Froster erledigt (= übermorgen)
var exportZielDate = null;           // Datum für Druck/Teilen-Berechnung (unabhängig von Anzeige)
```

---

## 4. Initialisierungsfluss

```
DOMContentLoaded
  └─ BOS_GEHIRN.init()          (async, produktions_gehirn.js)
       └─ initApp()
            ├─ Retry-Loop (max 20×50ms falls BOS_STAMMDATEN/BOS_INVENTUR noch nicht da)
            ├─ inventurRelevantKeys befüllen (aus BOS_STAMMDATEN.inventurRelevant)
            ├─ setupTimeLogic()
            │    ├─ latestInvTsGlobal ermitteln
            │    ├─ Gecachten Urlaubsschlüssel anwenden (localStorage)
            │    ├─ frosterOffset setzen (1 oder 2)
            │    ├─ anchorDate setzen (heute + frosterOffset)
            │    ├─ Froster-Meldung rendern
            │    ├─ Inventur-Meldung rendern
            │    └─ Stale-Overlay ggf. einblenden
            ├─ buildStationFilter()
            ├─ renderGrid()
            └─ pruefeWochenkonfigHinweis()
```

### `anchorDate` — die zentrale Zeitachse

`anchorDate` ist der **erste berechnete Tag** — also der Tag, für den der Bestand schon bereitgestellt sein muss. Er hängt am Froster-Status:

| Uhrzeit | Froster-Status | frosterOffset | anchorDate |
|---|---|---|---|
| 00:00–01:29 oder 20:01–23:59 | Offen | 1 | Morgen |
| 01:30–20:00 | Erledigt | 2 | Übermorgen |

> **Kritische Regel:** Der Froster-Status wird immer aus `new Date()` (aktuelle Uhrzeit) berechnet — **nie** aus dem Inventur-Timestamp. Diese Regel darf nicht geändert werden. Siehe auch: Poka-Yoke-Prinzip des Frosters in der Gesamtarchitektur.

---

## 5. Stale-Data-Schutz

Veraltete Inventuren werden erkannt und gesperrt:

| Alter der Inventur | Verhalten |
|---|---|
| < 24h | Normal |
| 24–48h | Warnoverlay mit "Trotzdem anzeigen"-Option |
| > 48h | Hardlock — nur Schlüssel-Import entsperrt |

### Urlaubsschlüssel-Mechanismus

Wenn die lokale Inventur veraltet ist, wird automatisch ein gecachter Schlüssel aus `localStorage` ('BOS_URLAUBSSCHLUESSEL_CACHE') geprüft. Bedingungen:
- `exportedAt` vorhanden
- Nicht älter als 24h
- Enthält `products` mit Einträgen

Manuelle Eingabe via Schlüssel-Box: Der Nutzer kann eine WhatsApp-Nachricht einfügen (inkl. `---INVENTURDATEN---`-Block). Der Base64-kodierte JSON-Block wird dekodiert, validiert, und als `BOS_INVENTUR` gesetzt.

---

## 6. Kern-Berechnungsfunktionen

### `getDaysToNextMonday()`
Gibt zurück, wie viele Tage von `anchorDate` bis zum nächsten Montag liegen (0 wenn anchorDate selbst Montag ist).

```js
// Beispiel: anchorDate = Dienstag → gibt 6 zurück (Di bis Mo = 6 Tage)
// anchorDate = Montag → gibt 0 zurück
```

### `calcNeedUntilMonday(prodId)`
Summiert den täglichen Bedarf von `anchorDate` bis einschließlich nächstem Montag. Berücksichtigt `wochenconfig`-Typen:

| Typ | Effekt auf dailyNeed |
|---|---|
| `zu` | 0 |
| `hamster_1` | Ø aus Sa-Bedarf und normalem Bedarf |
| `hamster_2` | Sa-Bedarf |
| `hamster_3` | Sa×1,5 (Sa) oder ×2 (andere Tage) |

### `calcReachDays(prodId, stock)`
Zählt tageweise wie weit der Bestand reicht. Beginnt bei `anchorDate`, zieht täglich `dailyNeed` ab bis `remaining < 0`. Gibt Anzahl gedeckter Tage zurück.

```
remaining = stock
für jeden Tag (max 21):
  remaining -= dailyNeed
  wenn remaining < 0: STOP
  days++
return days
```

> Gibt `0` zurück wenn stock null oder 0. Gibt `21` zurück wenn Wochenbedarf = 0 (kein Verbrauch konfiguriert).

### `calcNeedUntilDate(prodId, zielDate)`
Wie `calcNeedUntilMonday`, aber mit frei wählbarem Zieldatum. Wird für Export/Druck genutzt.

### `calcDayBreakdown(prodId)`
Gibt ein Array von Tagesobjekten zurück (10 Tage ab anchorDate), jedes mit:
- `label`: Wochentag + Datum
- `need`: Tagesbedarf (nach wochenconfig angepasst)
- `icon`: Emoji für Sondertyp
- `isMon`: true beim Montag (Cut-Tag)
- `isOverhang`: true für Tage nach Montag

---

## 7. Ladebalken-Architektur

Der Ladebalken einer Produktkarte besteht aus zwei Zonen:

```
┌─────────────────────────────────────┬──────────┐
│         PFLICHTZONE (flex:1)        │ ÜBERHANG │
│  ❄ ❄ │ Di │ Mi │ Do │ Fr │ Sa │ Mo │ Di│Mi│Do │
└─────────────────────────────────────┴──────────┘
  Froster  anchorDate → nächster Montag   (nur bei Überschuss, kleine Zellen)
```

### Pflichtzone

- Enthält: `frosterOffset` Froster-Zellen + `pflichtCells` Tages-Zellen
- `pflichtCells = getDaysToNextMonday() + 1` (anchorDate bis einschl. Montag)
- Nimmt den verfügbaren Platz via `flex:1`

**Zellfarbe pro Tag (ab Index 0 = anchorDate):**

```js
if (isClosed)       → 'lb-cell lb-zu'           // Schließtag
if (isMonTag)       → 'lb-cell lb-filled-' + colorClass   // Montag: grün/rot je Gesamtstatus
if (i < reachDays)  → 'lb-cell lb-filled-green'  // Bestand reicht noch
else                → 'lb-cell lb-filled-red'     // Bestand erschöpft
```

> **Achtung:** `colorClass` (global grün/rot) wird **nur** für die Montagszelle verwendet. Alle anderen Zellen entscheiden individuell anhand von `reachDays`.

### Überhang-Zone

- Wird **nur bei Überschuss** (`colorClass === 'green'`) gerendert
- Anzahl Zellen: `reachDays - pflichtCells` (Tage nach Montag die noch gedeckt sind)
- Zellbreite: feste **14px** (`lb-cell-small`) — nicht proportional zur Pflichtzone
- Farbe: Pastell-Grün (`lb-filled-overhang` = `rgba(45,158,95,0.28)`)
- Bei Defizit: Zone existiert nicht im DOM

```js
var isUeberschuss = (colorClass === 'green');
if (isUeberschuss && reachDays > pflichtCells) {
    var extraDays = reachDays - pflichtCells;
    // je Tag: eine lb-cell-small lb-filled-overhang
}
```

### CSS-Klassen Übersicht Ladebalken

| Klasse | Bedeutung | Farbe |
|---|---|---|
| `lb-filled-green` | Bestand reicht für diesen Tag | `#2d9e5f` (satt grün) |
| `lb-filled-red` | Bestand erschöpft ab diesem Tag | `#c94a4a` (rot) |
| `lb-filled-yellow` | (reserviert, derzeit ungenutzt) | `#d4a017` |
| `lb-filled-grey` | (reserviert) | `var(--border-s)` |
| `lb-filled-overhang` | Überschuss-Tage nach Montag | `rgba(45,158,95,0.28)` (pastell) |
| `lb-froster` | Froster-Zelle (ausgegraut, ❄) | `rgba(0,0,0,0.04)` |
| `lb-zu` | Schließtag (🔒) | `rgba(0,0,0,0.04)` |
| `lb-cell-small` | Kleine Zelle für Überhang | 14px fix |

---

## 8. `colorClass` — Gesamtstatus einer Karte

```js
if (stock === null)               → colorClass = 'grey'   // nicht gezählt
if (need === 0 || stock >= need)  → colorClass = 'green'  // gedeckt
else                              → colorClass = 'red'    // Lücke
```

`colorClass` bestimmt:
1. Die Farbe der **Montagszelle** im Ladebalken
2. Das **Status-Badge** auf der Karte (`status-badge.green/red/grey`)
3. Ob die **Überhang-Zone** gerendert wird (`green` → ja, sonst nein)
4. Die Stil-Klasse der **Karte** selbst (`no-data` bei grey)

---

## 9. `buildCard()` — Aufbau einer Produktkarte

```
buildCard(k, name, stock, need, colorClass, statusText, reachDays, pflichtDays, vonKollegen, prodTs, medianTs)
```

Gibt ein DOM-Element zurück mit:

1. **Kollegen-Badge** (grüner `+`-Punkt oben rechts) — wenn `vonKollegen === true`
2. **Header-Zeile** — Produktname + `stock / need Bl.` + Akkordeon-Pfeil
3. **Ladebalken** — Pflichtzone + Überhang-Zone (s. Abschnitt 7)
4. **Akkordeon-Detail** (`card-detail`, initial `display:none`) mit:
   - Froster-Zeilen (kursiv, gedimmt)
   - Tagesaufschlüsselung bis Montag
   - `Bedarf bis Mo`-Summenzeile
   - Optional: "Weitere Tage"-Button + Überhang-Tage

### Kollegen-Erkennung

Ein Produkt gilt als "von Kollegen gezählt" wenn:
```js
(prodTs - medianTs) > 5 * 60 * 1000  // 5 Minuten über dem Median-Timestamp
```
Der Median aller Produkt-Timestamps dient als Referenz für "wann wurde die Inventur gemacht". Deutlich spätere Einträge kommen von jemandem, der nach der Hauptinventur ergänzt hat.

---

## 10. Wochenconfig-System

`wochenconfig.json` kann optional Sondertage definieren. Format:

```json
{
  "tage": [
    { "datum": "2026-04-18", "typ": "zu" },
    { "datum": "2026-04-17", "typ": "hamster_2" }
  ]
}
```

Die Checkbox im Dashboard ist nur aktiv wenn:
1. `BOS_BESONDERE_TAGE_IN(14)` mindestens einen Treffer liefert (Feiertag in 14 Tagen)
2. `wochenconfig.json` per Fetch erreichbar ist

Wenn aktiviert: `wochenconfig`-Map wird befüllt und `renderGrid()` neu aufgerufen. Alle Bedarfsberechnungen prüfen täglich gegen diese Map.

---

## 11. Export & Druck

**Wichtig:** `exportZielDate` ist **unabhängig** vom Darstellungs-Horizont (Montag). Der Nutzer kann ein beliebiges Zieldatum wählen (Dropdown: 14 Tage voraus).

`shareBestand()` — WhatsApp-tauglicher Textexport mit:
- Froster-Status
- Bedarf bis gewähltem Datum
- Pro Produkt: `stock/need Bl. → prod. X Bl.` oder `→ ok`
- Flags: ✅ / ⚠️ / ❌

`printBestand()` — Öffnet neues Fenster mit Drucklayout:
- Produkte nach Station gruppiert
- Dreieck-Verteilung (2 Zeilen: Aufteilung in 2er/3er)
- Manuelle Verteilungs-Leerfelder
- "Prod. ab"-Datum pro Produkt
- Pressenberechnung wenn `p.pressenGroesse` definiert

---

## 12. Bekannte Besonderheiten & Fallstricke

### `anchorDate` ist kein `new Date()` 
Alle Schleifen in `calcNeedUntilMonday`, `calcReachDays`, `buildCard` starten bei `anchorDate`, nicht bei heute. `anchorDate` liegt 1 oder 2 Tage in der Zukunft. Wer eine neue Berechnungsfunktion schreibt, muss davon ausgehen, dass Tag 0 = anchorDate, nicht heute.

### `reachDays` ist relativ zu `anchorDate`
`reachDays = 3` bedeutet: der Bestand deckt die ersten 3 Tage ab anchorDate. Es bedeutet **nicht** "in 3 Tagen ab heute ist der Bestand leer".

### Froster-Zellen zählen nicht zu `reachDays`
`reachDays` zählt nur echte Verbrauchstage (ab anchorDate). Die Froster-Zellen sind rein visuell und werden vor anchorDate dargestellt. Index `i` in der Pflichtschleife entspricht direkt dem `reachDays`-Zähler.

### `pflichtCells` kann variieren
Je nach Wochentag von anchorDate: Dienstag → 6 Zellen, Mittwoch → 5, Montag → 0 (nur Montagszelle). Der Balken passt sich an.

### Überhang-Zellen haben feste Breite (nicht proportional)
`lb-cell-small` ist 14px breit — egal ob 1 oder 10 Tage Überhang. Das ist bewusst so: die Überhang-Zone ist "nice to have" und soll optisch kleiner wirken als die Pflichtzone.

### Die Legende ist veraltet
Die HTML-Legende unten auf der Seite nennt noch einen gelben "Fast gedeckt"-Zustand (≤20% Lücke). Diese Logik existiert im Code nicht mehr aktiv — `colorClass` kennt nur `green`, `red` und `grey`. Die Legende sollte bei Gelegenheit bereinigt werden.

### `toggleUeberhang` prüft `display === 'table-row-group'`
Das Akkordeon-Detail der Überhang-Tage nutzt `display: table-row-group` als Zustandsmarker, nicht eine CSS-Klasse. Bei Refactoring darauf achten.

---

## 13. Erweiterungshinweise

**Sniper-Menü (geplant):** Pro Karte soll ein Tap-Bereich entstehen mit 3 Links: Schnellrechner, Verlauf, Logbuch — jeweils mit `?key=legacyKey`. Kann als `onclick` auf der Karte oder als eigenes Button-Element implementiert werden.

**Neue Farbe `lb-filled-yellow` aktivieren:** CSS-Klasse ist vorhanden. Um einen "Fast gedeckt"-Zustand einzuführen (z.B. ≤20% Lücke), müsste in `renderGrid()` die `colorClass`-Logik um einen `yellow`-Zweig erweitert werden — und die Montagszelle sowie `status-badge` entsprechend angepasst werden.

**Maximaler Überhang:** Derzeit ist `calcReachDays` auf 21 Tage begrenzt. Das reicht für 3 Wochen Vorrat. Wenn Produkte längere Reichweiten haben können, muss dieser Wert angehoben werden — aber beachten: die Überhang-Zone würde dann sehr viele kleine Zellen erzeugen. Ggf. eine Obergrenze für angezeigte Überhang-Tage einbauen (z.B. max. 7).

**Wochenconfig für einzelne Stationen:** Derzeit gilt `wochenconfig` global für alle Produkte. Wenn stationsspezifische Feiertage nötig werden, müsste `wochenconfig` auf `{ datum: { station: typ } }` erweitert werden.
