# Dokumentation: `baguette_rechner.html` (Stangenrechner)

**Letzte Aktualisierung:** April 2026  
**Status:** Produktiv  
**Registriert in:** `shell.js`

---

## 1. Zweck und Kontext

Der Stangenrechner berechnet den **Teigling-Bedarf für Baguette und Zwiebelstangen** über einen frei wählbaren Zeitraum. Er berücksichtigt den aktuellen Froster-Bestand und gibt aus, wie viele Teiglinge heute Nacht produziert werden müssen.

Der Rechner arbeitet mit **zwei Produktpaaren** (je Fertigware + Teig), die über Tabs umgeschaltet werden:

| Tab | Produkt A (Einheit: Bleche) | Produkt B (Einheit: Dielen) |
|---|---|---|
| Baguette | Stangen Gesamt | Baguette Teig |
| Zwiebel | Zwiebelstange | Zwiebel Teig |

---

## 2. Externe Abhängigkeiten

Die Seite lädt drei externe Scripts, **bevor** eigener Code ausgeführt wird:

```html
<script src="inventurdaten.js"></script>
<script src="produktions_gehirn.js"></script>
<script src="shell.js" defer></script>
```

### `inventurdaten.js`
Stellt `window.BOS_INVENTUR` bereit. Struktur:
```json
{
  "products": {
    "stangen_gesamt_stueck": { "stock": 3, "ts": 1712901600000 },
    "baguettestange_teig_stueck": { "locs": [5, 2], "ts": 1712901600000 }
  }
}
```
- `stock`: direkter Bestandswert in Blechen/Dielen
- `locs`: Array von Teilbeständen (werden summiert, falls `stock` fehlt)
- `ts`: Unix-Timestamp in Millisekunden (entscheidend für Inventur-Alters-Prüfung)

### `produktions_gehirn.js`
Stellt `window.BOS_GEHIRN` bereit — den zentralen Gatekeeper für Stammdaten.

Wichtige Methoden:
- `await window.BOS_GEHIRN.init()` → muss als erstes im DOMContentLoaded aufgerufen werden; gibt `true/false` zurück
- `window.BOS_GEHIRN.bosIdFuerKey(legacyKey)` → übersetzt einen Legacy-Produktschlüssel (z.B. `'stangen_gesamt_stueck'`) in eine BOS-interne ID
- `window.BOS_GEHIRN._db` → Array aller Rohdaten-Einträge aus der Produktionsdatenbank

Nach `init()` liegt `window.BOS_STAMMDATEN` vor. Struktur:
```json
{
  "<bosId>": {
    "needs": [2, 3, 2, 1, 2, 5, 1],
    "charge": 6
  }
}
```
- `needs[0..6]`: Durchschnittsbedarf pro Wochentag (BOS-Index, **Mo=0..So=6**)
- `charge`: Stück pro Blech bzw. Diele

### `shell.js`
Rendert die globale Navigation (Tab-Bar, Header, Statusstreifen). Hat keine direkte Auswirkung auf die Rechenlogik.

---

## 3. Wochentag-Konvention (BOS-Index) ⚠️

Die gesamte Logik dieser Seite benutzt einen **eigenen Wochentags-Index**:

```
BOS: Mo=0, Di=1, Mi=2, Do=3, Fr=4, Sa=5, So=6
JS:  So=0, Mo=1, Di=2, Mi=3, Do=4, Fr=5, Sa=6
```

Die Konvertierung erfolgt über:
```javascript
const JS_ZU_BOS = [6, 0, 1, 2, 3, 4, 5];
// Verwendung: JS_ZU_BOS[new Date().getDay()]
```

**Kritisch:** Immer `JS_ZU_BOS` verwenden, wenn `new Date().getDay()` in einen BOS-Index umgewandelt werden soll. Direktes Verwenden von `getDay()` als Array-Index in `needs[]` liefert falsche Werte.

Hilfsfunktionen:
```javascript
heuteBos()    // → aktueller Tag als BOS-Index (0–6)
heuteBosIdx() // → identisch, zweiter Name (historisch)
```

---

## 4. Zeitraum-Logik (Das wichtigste Konzept)

### 4.1 Von-Bis-Dropdowns

Beide Dropdowns speichern **keine Daten**, sondern **Offsets** (Ganzzahlen):
- `dd-von.value` = Anzahl Tage ab heute (0 = heute, 1 = morgen, ...)
- `dd-bis.value` = ebenfalls Anzahl Tage ab heute

Der Bis-Offset ist **immer ≥ Von-Offset**. `fuelleBisDropdown(vonOffset)` baut das Bis-Dropdown so auf, dass es ab dem Von-Datum beginnt.

### 4.2 Semantik des Von-Datums: Der Froster-Stand

Das Von-Datum ist **nicht** der erste Produktionstag — es ist das Datum, **bis zu dem der aktuelle Froster-Bestand reicht**. Die Ware liegt also bereits im Laden.

Konsequenz: Die Bedarfsberechnung startet am Tag **nach** dem Von-Datum.

```javascript
function getStartTag() {
    const vonOffset = parseInt(document.getElementById('dd-von').value);
    const heute = new Date(); heute.setHours(0,0,0,0);
    const vonD = new Date(heute); vonD.setDate(heute.getDate() + vonOffset + 1); // +1!
    return JS_ZU_BOS[vonD.getDay()];
}
```

Beispiel: Von = Montag → `getStartTag()` liefert Dienstag (BOS=1).

### 4.3 Anzahl der Tage

```javascript
function getTageAnzahl() {
    const vonOffset = parseInt(document.getElementById('dd-von').value) || 0;
    const bisOffset = parseInt(document.getElementById('dd-bis').value) || 1;
    return Math.max(1, bisOffset - vonOffset);
}
```

**Kein `+ 1`** — das ist beabsichtigt und wurde in April 2026 korrigiert.

Begründung: Da `getStartTag()` bereits um +1 verschiebt, würde ein `+ 1` in `getTageAnzahl()` dazu führen, dass immer ein Tag zu viel berechnet wird. Die Schleife in `zeigeAktiv()` iteriert `tage`-mal ab `start`, womit das Bis-Datum exakt der letzte berechnete Tag ist.

**Merkhilfe:** Von und Bis sind *inklusive* Grenzen im Display, aber die Berechnung läuft von `Von+1` bis `Bis` (also `Bis - Von` Schritte).

### 4.4 Globaler Zustand: `window._zielBos`

```javascript
window._zielBos = JS_ZU_BOS[bisD.getDay()];
```

Wird in `dropdownUpdate()` gesetzt und von mehreren Funktionen gelesen:
- `zeigeAktiv()` → für den Bedarf-Banner ("bis Mo")
- `tagesBedarf()` → Loop-Abbruchbedingung
- `reichtBis()` → Loop-Abbruchbedingung

⚠️ Dieser Wert ist ein globales Zustandsobjekt. Wenn `dropdownUpdate()` nicht aufgerufen wird, ist `_zielBos` veraltet.

### 4.5 Spannen-Label

```javascript
const tage = bisOffset - vonOffset + 1; // im Label: Gesamtzahl der aufgespannten Tage
document.getElementById('lbl-spanne').textContent = tage + ' Tag' + (tage === 1 ? '' : 'e');
```

⚠️ Im Label wird `+ 1` benutzt, weil dort die *kalendarischen* Tage angezeigt werden (Von-Tag und Bis-Tag gezählt), nicht die berechneten Tage. Das ist korrekt und soll nicht geändert werden.

---

## 5. Produktschlüssel und TABS-Struktur

### 5.1 Legacy-Keys

Die vier Produkte haben historisch gewachsene Schlüssel, die als Legacy weiterverwendet werden:

| Produkt | Legacy-Key |
|---|---|
| Stangen Gesamt | `stangen_gesamt_stueck` |
| Baguette Teig | `baguettestange_teig_stueck` |
| Zwiebelstange | `zwiebelstange_stueck` |
| Zwiebelstange Teig | `zwiebelstange_teig_stueck` |

Diese Schlüssel werden an `BOS_GEHIRN.bosIdFuerKey()` übergeben, um die interne BOS-ID zu erhalten, mit der dann in `BOS_STAMMDATEN` nachgeschlagen wird.

### 5.2 ProdKeys

Für localStorage-Speicherung (Modus, manuelle Werte) werden Kurzschlüssel verwendet:

| ProdKey | Produkt |
|---|---|
| `stangen` | Stangen Gesamt |
| `bagteig` | Baguette Teig |
| `zwiebel` | Zwiebelstange |
| `zwiebelteig` | Zwiebelstange Teig |

### 5.3 TABS-Objekt

```javascript
const TABS = {
    baguette: {
        a: { key: 'stangen_gesamt_stueck', prodKey: 'stangen', label: 'Stangen Gesamt', einheit: 'Bl.' },
        b: { key: 'baguettestange_teig_stueck', prodKey: 'bagteig', label: 'Baguette Teig', einheit: 'Dl.' },
        aufnameA: 'Stangen Gesamt', aufnameB: 'Baguette Teig',
        color: 'baguette', ...
    },
    zwiebel: { ... }
};
```

`aktiverTab` (`'baguette'` oder `'zwiebel'`) steuert, welches Tab gerade aktiv ist. Jeder Tab-Wechsel ruft `setTab(tab)` auf, das alle DOM-Elemente aktualisiert.

---

## 6. Berechnungsfluss

```
DOMContentLoaded
    → BOS_GEHIRN.init()
    → stammdaten = BOS_STAMMDATEN
    → fuelleVonDropdown()
    → fuelleBisDropdown(0)
    → dd-von=0, dd-bis=1 (Default: heute → morgen)
    → alleTabellen()       (Tageswerte-Tabellen aufbauen)
    → ladeInventur()       (Bestände aus BOS_INVENTUR befüllen, wenn <24h)
    → dropdownUpdate()     → window._zielBos setzen → berechne()
```

### `berechne()` im Detail

```javascript
function berechne() {
    // 1. Bedarf summieren (getStartTag + getTageAnzahl)
    const bedarfA = tagesBedarfEffektiv(keyA, prodKeyA);
    const bedarfB = tagesBedarfEffektiv(keyB, prodKeyB);

    // 2. Charge aus Stammdaten
    const chargeA = getCharge(keyA);
    const chargeB = getCharge(keyB);

    // 3. Bestand aus Eingabefeldern
    const bestandA = parseFloat(document.getElementById('bestand-a').value) || 0;
    const bestandB = parseFloat(document.getElementById('bestand-b').value) || 0;

    // 4. Produktionsbedarf (in Blechen/Dielen, aufgerundet)
    const prodA = Math.max(0, Math.ceil(bedarfA - bestandA));
    const prodB = Math.max(0, Math.ceil(bedarfB - bestandB));

    // 5. Teiglinge gesamt
    const fehlen = prodA * chargeA + prodB * chargeB;

    // 6. Anzeige aktualisieren
    zeigeAktiv(...);
}
```

### `tagesBedarfEffektiv(legacyKey, prodKey)`

Summiert die effektiven Bedarfswerte (auto oder manuell überschrieben) für alle Tage im gewählten Zeitraum:

```javascript
for (let i = 0; i < tage; i++) {
    total += needs[(start + i) % 7] || 0;
}
```

`(start + i) % 7` sorgt für korrekten Wochenumbruch.

---

## 7. Manueller Modus

Pro Produkt kann zwischen `auto` (Ø aus DB) und `manuell` (handeingegebene Werte) gewechselt werden.

**Speicherung:** localStorage
- Schlüssel `BOS_BAG_MODUS`: `{"stangen":"auto","bagteig":"auto",...}`
- Schlüssel `BOS_BAG_MANUELL`: `{"stangen":{"0":3,"1":4,...},...}` (Index = BOS-Wochentag)

**Logik in `getNeedsEffektiv()`:**
```javascript
if (modus[prodKey] === 'manuell' && manuellWerte[prodKey]) {
    return autoNeeds.map((v, i) => {
        const m = manuellWerte[prodKey][i];
        return (m !== undefined && m !== null && m !== '') ? parseFloat(m) : v;
    });
}
return autoNeeds;
```

Nur befüllte Felder überschreiben den Auto-Wert — leere Felder fallen auf den Auto-Wert zurück. Das ist gewollt.

---

## 8. Inventur-Automatik

`ladeInventur()` läuft beim Start und prüft das Alter der Inventur:

- Jünger als 24 Stunden → Auto-Fill der Bestandsfelder, kein Warning
- Älter als 24 Stunden → Warning-Banner sichtbar, **kein** Auto-Fill

Die Bestands-Werte werden aus `BOS_INVENTUR.products[legacyKey]` gelesen:
```javascript
const bestand = invProd.stock !== undefined
    ? invProd.stock
    : (invProd.locs || [0]).reduce((x, y) => x + y, 0);
```

Bei Tab-Wechsel (`setTab()`) wird der Bestand ebenfalls direkt aus `BOS_INVENTUR` geladen — **nicht** aus dem DOM oder einem Cache. Das ist wichtig: Wenn kein Inventur-Eintrag vorhanden ist, bleibt das Feld leer (statt einen alten Wert zu halten).

---

## 9. `reichtBis()` — Bestandsreichweite

Berechnet textuell, bis wann der aktuelle Bestand reicht (angezeigt, wenn Produktion ausreichend):

```javascript
function reichtBis(bestand, legacyKey, prodKey) {
    // Läuft tageweise ab morgen vorwärts
    // Stoppt, wenn Bestand < Tagesverbrauch
    // oder wenn window._zielBos erreicht
}
```

Rückgabewerte:
- `"Reicht nicht bis morgen (noch X Bl.)"` → Bestand reicht nicht mal für morgen
- `"Reicht bis Freitag (noch X Bl.)"` → Bestand wird an genanntem Tag aufgebraucht
- `"Reicht über Montag hinaus (noch X Dl.)"` → Bestand reicht über den Bis-Tag hinaus

Die Einheitsbestimmung (Bl. vs. Dl.) erfolgt über den Legacy-Key:
```javascript
const isBleche = ['stangen_gesamt_stueck', 'zwiebelstange_stueck'].includes(legacyKey);
```

---

## 10. DOM-Elemente (Übersicht)

| ID | Typ | Funktion |
|---|---|---|
| `dd-von` | `<select>` | Von-Datum (Offset-Werte 0–9) |
| `dd-bis` | `<select>` | Bis-Datum (Offset-Werte ab Von) |
| `lbl-spanne` | `<div>` | Anzeige "X Tage" |
| `tab-baguette` / `tab-zwiebel` | `<button>` | Tab-Umschalter |
| `bestand-a` / `bestand-b` | `<input>` | Bestandseingabe (Bleche/Dielen) |
| `label-a` / `label-b` | `<div>` | Produktname (ändert sich per Tab) |
| `sub-a` / `sub-b` | `<div>` | Charge-Anzeige |
| `bedarf-aktiv` | `<div>` | Bedarf-Banner ("Stangen: X Bl. · Teig: Y Dl. bis Mo") |
| `tgesamt-aktiv` | `<div>` | Gesamt-Ergebnis-Box (dunkel/grün) |
| `teigling-aktiv` | `<div>` | Zahl der Teiglinge (oder ✓) |
| `tlabel-aktiv` | `<div>` | Beschriftung unter Zahl |
| `prod-a` / `prod-b` | `<div>` | Bleche / Dielen Produktionszahl |
| `aufname-a` / `aufname-b` | `<div>` | Produktname unter Zahl |
| `einheit-a` / `einheit-b` | `<div>` | Einheiten-Text ("Bleche (à 6 Stk)") |
| `auf-box-a` / `auf-box-b` | `<div>` | Farbige Ergebnis-Boxen |
| `tage-abrechnung` | `<div>` | Tabelle Tagesaufschlüsselung |
| `akk-body-aktiv` | `<div>` | Akkordeon Tageswerte (ein/ausklappbar) |
| `table-a` / `table-b` | `<table>` | Tageswerte-Tabelle je Produkt |
| `modus-auto-a/b` | `<button>` | Auto-Modus-Button |
| `modus-man-a/b` | `<button>` | Manuell-Modus-Button |
| `basis-banner` | `<div>` | DB-Zeitraum-Info ("Ø-Werte aus DB 01.01.26 – 31.03.26") |
| `inv-warn` | `<div>` | Warnung bei Inventur > 24h |

---

## 11. Funktionsübersicht

| Funktion | Aufruf durch | Beschreibung |
|---|---|---|
| `heuteBos()` | intern | Heutiger Wochentag als BOS-Index |
| `heuteBosIdx()` | intern | Alias für `heuteBos()` |
| `getStartTag()` | `tagesBedarfEffektiv`, `zeigeAktiv` | Erster zu berechnender Tag (Von + 1) |
| `getTageAnzahl()` | `tagesBedarfEffektiv`, `zeigeAktiv` | Anzahl zu berechnender Tage |
| `datumLabel(d)` | Dropdown-Befüllung | `"Montag, 14.04."` aus Date-Objekt |
| `fuelleVonDropdown()` | DOMContentLoaded | Von-Dropdown mit 10 Tagen befüllen |
| `fuelleBisDropdown(vonOffset)` | `vonGeaendert`, DOMContentLoaded | Bis-Dropdown ab Von-Datum befüllen |
| `vonGeaendert()` | `onchange` dd-von | Bis-Dropdown neu befüllen + neu rechnen |
| `dropdownUpdate()` | `vonGeaendert`, DOMContentLoaded | `_zielBos` setzen + `berechne()` |
| `getNeedsEffektiv(legacyKey, prodKey)` | `tagesBedarfEffektiv`, `zeigeAktiv` | Auto-Needs oder manuell überschrieben |
| `tagesBedarfEffektiv(legacyKey, prodKey)` | `berechne()` | Summe der Bedarfe über Zeitraum |
| `getCharge(legacyKey)` | `berechne()` | Charge (Stk/Blech oder Stk/Diele) |
| `berechne()` | viele | Hauptfunktion, alle Ergebnisse aktualisieren |
| `zeigeAktiv(...)` | `berechne()` | DOM mit Ergebnissen befüllen |
| `reichtBis(bestand, legacyKey, prodKey)` | `zeigeAktiv` | Text "Reicht bis..." berechnen |
| `tagesBedarf(legacyKey, zielBos)` | nicht aktiv genutzt | Legacy-Funktion, wird von `tagesBedarfEffektiv` verdrängt |
| `setTab(tab)` | `onclick` Tab-Buttons | Tab wechseln, DOM komplett neu aufbauen |
| `setModusAktiv(ab, m)` | `onclick` Modus-Buttons | Auto/Manuell pro Produkt setzen |
| `aktualisiereTagTabelleAB()` | `alleTabellen`, `setTab` | Beide Tageswerte-Tabellen neu aufbauen |
| `aktualisiereTagTabelleEinzel(ab)` | `aktualisiereTagTabelleAB`, `setModusAktiv` | Eine Tageswerte-Tabelle neu aufbauen |
| `updateManuell(inp)` | `oninput` in Tageswerte-Inputs | Manuellen Wert speichern + neu rechnen |
| `speichereModus()` | Modus-Funktionen | localStorage schreiben |
| `speichereManuell()` | `updateManuell` | localStorage schreiben |
| `toggleTageAkk(id)` | `onclick` Akkordeon-Header | Tageswerte ein-/ausklappen |
| `ladeInventur()` | DOMContentLoaded | Inventur-Alter prüfen, ggf. Auto-Fill |
| `befuelleInputsAusInventur(tabName)` | `ladeInventur`, `setTab` | Bestandsfelder aus Inventur befüllen |
| `alleTabellen()` | DOMContentLoaded | Alle Tageswerte-Tabellen initialisieren |

---

## 12. Bekannte Fallstricke

### Off-by-one bei `getTageAnzahl()` (behoben April 2026)
`bisOffset - vonOffset` **ohne** `+ 1`. Der `+1` existiert bereits implizit durch `getStartTag()`. Wer das wieder anfasst: Testfall ist Von=Montag, Bis=Montag — die Tabelle darf nur Dienstag bis Montag zeigen (7 Tage), nicht bis Dienstag (8 Tage).

### Das Spannen-Label in `dropdownUpdate()` nutzt `+ 1`
```javascript
const tage = bisOffset - vonOffset + 1; // NUR fürs Label!
```
Das ist korrekt — das Label zeigt die Kalender-Tage des Zeitraums (inkl. Von-Tag). Dieser `+ 1` gehört **nicht** in `getTageAnzahl()`.

### `tagesBedarf()` ist eine veraltete Funktion
Sie existiert noch im Code, wird aber durch `tagesBedarfEffektiv()` verdrängt. Nicht für neue Logik verwenden.

### `window._zielBos` ist globaler Zustand
Wird in `dropdownUpdate()` gesetzt. Bei direktem Aufruf von `berechne()` ohne vorherigen `dropdownUpdate()` kann der Wert veraltet sein. Immer über `dropdownUpdate()` → `berechne()` gehen.

### Tab-Wechsel lädt Inventur direkt aus `BOS_INVENTUR`
In `setTab()` werden die Bestands-Inputs direkt aus `window.BOS_INVENTUR` befüllt — **nicht** aus dem DOM-Cache. Wer Bestands-Defaults ändern will, muss das dort tun, nicht in `ladeInventur()`.

### Manuelle Werte überleben Tab-Wechsel und Seiten-Reload
`BOS_BAG_MANUELL` im localStorage bleibt erhalten. Bei unerwarteten Werten im Rechner: localStorage prüfen/löschen.

---

## 13. Erweiterung: Neues Produkt hinzufügen

1. Legacy-Key in `produktions_gehirn.js` / `produkt_config.json` anlegen
2. Neues Tab in `TABS` definieren (analog zu `baguette`/`zwiebel`)
3. Tab-Button im HTML ergänzen
4. `aktualisiereTagTabelleEinzel()` kennt bereits alle prodKeys über das `MAP`-Objekt — dort ebenfalls eintragen
5. In `reichtBis()`: Legacy-Key in die `isBleche`-Prüfung aufnehmen, falls es ein Blech-Produkt ist
6. In `shell.js` registrieren (falls neue Seite)

---

## 14. Änderungshistorie (diese Datei)

| Datum | Änderung |
|---|---|
| April 2026 | `getTageAnzahl()`: `+ 1` entfernt (Off-by-one, Bis-Tag wurde als Dienstag statt Montag angezeigt) |
| April 2026 | Dokumentation erstellt |
