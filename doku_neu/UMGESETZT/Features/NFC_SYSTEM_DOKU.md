# BäckereiOS · NFC-System Dokumentation

**Erstellt:** 12.05.2026  
**Status:** Produktiv  
**Komponenten:** 2 (NFC-Schild · Froster-Bedarfsrechner)

---

## Übersicht

Das NFC-System besteht aus zwei konzeptionell getrennten Teilen, die zusammenspielen:

**Teil 1 — Das Schild** ist ein physisches A4-Querformat-Dokument, das an Lagerstationen, Regalen oder Rohstoff-Behältern angebracht wird. Es trägt einen NFC-Chip, der beim Antippen mit dem Smartphone direkt eine BäckereiOS-Seite öffnet.

**Teil 2 — Der Froster-Bedarfsrechner** ist die Zielseite hinter dem NFC-Chip am Froster. Er beantwortet eine konkrete Frage: „Wie viele Bleche müssen noch produziert werden, damit wir bis Montag / Dienstag durchkommen?"

Beide Teile sind unabhängig nutzbar. Das Schild kann auf jeden beliebigen Link zeigen; der Bedarfsrechner ist auch ohne Chip über die Druckzentrale erreichbar.

---

## Teil 1 · NFC-Stationsschild

### Dateien

| Datei | Ort | Funktion |
|---|---|---|
| `druckzentrale_modul_schild.js` | `druckzentrale/` | Modul-Logik, Screen-CSS, Print-CSS, NFC-Lesefunktion |
| `druckzentrale.html` | `druckzentrale/` | Enthält Tab „Schilder" (3. Tab) |
| `druckzentrale_ui.js` | `druckzentrale/` | Init-Aufruf `DZ_SCHILD_render()` |

### Aufruf

Das Schild ist als dritter Tab in der Druckzentrale integriert:  
`Druckzentrale → Tab „Schilder"`

Es gibt **keinen Eintrag** in `index.html` (keine Kachel). Der Tab ist ausschließlich über die Druckzentrale erreichbar.

### Funktionsweise

1. **Beschriftung wählen** — per Pill-Button (Froster, Hefe, Mehl, Backprogramm, Bestand, Lieferung, Schichtplan, Druckzentrale) oder „Eigene…" für freie Eingabe.
2. **Hinweistext anpassen** — vorausgefüllt mit Standardtext, frei editierbar.
3. **URL befüllen** — entweder manuell eintippen oder per „📡 Chip lesen" direkt vom programmierten NFC-Chip auslesen (Web NFC API, nur Android Chrome + HTTPS).
4. **Vorschau** — Live-Vorschau im 297:210-Seitenverhältnis, aktualisiert sich bei jeder Eingabe.
5. **Drucken** — eigener Druckjob via verstecktem `<iframe>`, vollständig unabhängig vom Portrait-Druckjob der übrigen Druckzentrale-Module.

### Druckformat

- A4 Querformat (`@page { size: A4 landscape; margin: 0; }`)
- Padding: 14mm oben/unten, 16mm links/rechts
- Schnittecken (1pt, 12mm lang)
- **Kein** Mix mit anderen Modulen möglich — das ist by design

### Schild-Aufbau (Layoutbeschreibung)

```
┌─────────────────────────────────────────────────┬──────────────┐
│ BäckereiOS                          NFC-Station  │ · · · · · · │
│ BÄCKEREI LANGREHR · GARBSEN · HAVELSE            │ NFC-CHIP     │
├──────────────────────────────────────────────────│ HIER         │
│                                                  │ PLATZIEREN   │
│  Froster                                         │              │
│                                                  │ [URL seitl.] │
│  ▌ Hinweis                                       │              │
│  ▌ Chip mit Smartphone antippen...               │              │
│                                                  │              │
│  ① Entsperren  ② Rückseite  ③ Antippen           │              │
├──────────────────────────────────────────────────┴──────────────┤
│ BäckereiOS · Interne Station · Nicht entfernen          • · ·  │
└─────────────────────────────────────────────────────────────────┘
```

Die URL erscheint als schmaler rotierter Streifen an der rechten Kante des NFC-Kastens (vertikal, von unten nach oben lesbar).

### NFC-Chip lesen (Web NFC API)

```
Voraussetzung: Android + Chrome + HTTPS (GitHub Pages erfüllt dies)
```

- Button „📡 Chip lesen" startet `NDEFReader.scan()`
- Bei Erfolg: URL wird automatisch ins Eingabefeld und die Vorschau übernommen
- Unterstützte Record-Types: `url`, `absolute-url`
- Fehlerbehandlung: kein NFC-Support → Fehlermeldung, kein URL-Record → Fehlermeldung

### Architektur-Regeln

- Das Modul fügt seinen eigenen Screen-CSS-Block per `<style id="dz-schild-screen-css">` in `<head>` ein (einmalig beim `DZ_SCHILD_render()`-Aufruf).
- Das Print-HTML wird als verstecktes `<div id="dz-schild-print-src">` an `document.body` angehängt.
- `DZ_SCHILD_print()` liest dieses div aus und schreibt es in ein temporäres iframe — das iframe wird nach dem Drucken automatisch entfernt.
- Keine Abhängigkeit zu `DZ_PRINT_CSS_*` oder `doPrint()` der Druckzentrale.

---

## Teil 2 · Froster-Bedarfsrechner

### Dateien

| Datei | Ort | Funktion |
|---|---|---|
| `froster_bedarf_mo.html` | `frosterauslastung/` | Bedarfsrechner bis nächsten Montag |
| `froster_bedarf_di.html` | `frosterauslastung/` | Bedarfsrechner bis nächsten Dienstag |

`froster_bedarf_di.html` ist identisch mit `_mo`, ausschließlich `ZIEL_WOCHENTAG = 2` und alle Beschriftungen auf „Dienstag".

### Registrierung in shell.js

```js
'frosterauslastung/froster_bedarf_mo.html': { title: 'Froster\nbis Montag',   mode: 'full', tab: 'mehr' },
'frosterauslastung/froster_bedarf_di.html': { title: 'Froster\nbis Dienstag', mode: 'full', tab: 'mehr' },
```

`frosterauslastung/` ist bereits in der `isSubfolder`-Erkennung registriert — `BOS_BASEPATH = '../'` gilt automatisch.

### Kein Eintrag in index.html

Die Seiten sind **absichtlich nicht** als Kacheln im Cockpit sichtbar. Sie sind reine NFC-Zielseiten — erreichbar ausschließlich per Chip-Antippen. Der NFC-Chip am Froster-Schild trägt die jeweilige URL.

### Abhängigkeiten

```
../feiertage_nds.js
../produktions_gehirn.js       → BOS_GEHIRN, BOS_STAMMDATEN
../inventurdaten.js            → BOS_INVENTUR
../druckzentrale/druckzentrale_logic.js   → DZ_init, DZ_calcNeed, DZ_getStock,
                                            DZ_getEinheit, DZ_anchorDate,
                                            DZ_refreshAnchorDate, DZ_invRelevant
../druckzentrale/druckzentrale_modul_c.js → DZ_C_getFehlmenge
```

### Rechenformel

```
Ergebnis = max(0, Bedarf_bis_Zieldatum − Bestand) + Fehlmenge
```

Identisch mit Druckzentrale Modul C (`druckzentrale_modul_c.js`, Zeile ~80).

### Anchor-Datum

Das Anchor-Datum bestimmt, ab welchem Tag `DZ_calcNeed` zu zählen beginnt. Es wird **nicht** aus der Uhrzeit abgeleitet, sondern aus dem Toggle:

| Toggle-Zustand | DZ_anchorDate | Bedeutung |
|---|---|---|
| Froster gemacht ✓ | `heute + 2` | Ware für morgen bereits entnommen → ab übermorgen rechnen |
| Froster nicht gemacht ✗ | `heute + 1` | Ware für morgen noch im Froster → ab morgen rechnen |

Der Bestand wird in **beiden** Fällen normal abgezogen. Der Unterschied liegt ausschließlich im Startdatum der Bedarfsberechnung.

### Schutzebenen (drei Stufen)

**Stufe 1 — Globale Inventur-Prüfung** (beim Seitenstart)

- Maximales Alter: 36 Stunden (`INV_MAX_ALTER_H = 36`)
- Ist die Inventur älter: Seite sperrt komplett, Rechner wird nicht angezeigt
- Fehlerbild: roter Blocker-Block, kein Dropdown sichtbar

**Stufe 2 — Feiertag-Prüfung** (nach erfolgreichem Init)

- Geprüft wird der Zeitraum von `DZ_anchorDate` bis zum Zieldatum (Montag/Dienstag)
- Quelle: `window.BOS_FEIERTAGE` (aus `feiertage_nds.js`)
- Ist ein Feiertag enthalten: Seite sperrt mit Datumsangabe des Feiertags
- Fehlerbild: roter Blocker-Block mit Hinweis auf den Schnellrechner

```
Für Wochen mit Feiertagen bitte den Schnellrechner
mit entsprechenden Einstellungen nutzen.
```

**Stufe 3 — Pro-Produkt Inventur-Alter** (bei jeder Produktauswahl)

- Geprüft wird der `ts`-Zeitstempel des einzelnen Produkts in `BOS_INVENTUR.products`
- Ist der Produkteintrag älter als 36h: Ergebnis-Card zeigt Warnung statt Zahl
- Fehlerbild: orangener Kasten, keine Zahl

```
Leider sind die Bestandsdaten für [Produkt] zu alt,
um verlässliche Rückschlüsse zu ziehen.
```

### Produktfilter

Nur Produkte mit `inventurRelevant: true` in `produkt_config.json` erscheinen im Dropdown. Sortierung alphabetisch nach `name` (Locale `de`).

### Ergebnis-Zustände

| Zustand | Farbe | Bedeutung |
|---|---|---|
| `zero` | Grün | Bestand deckt Bedarf vollständig — 0 Bleche fehlen |
| `loaded` | Golden | Konkrete Fehlmenge in Blechen/Dielen |
| `warn` | Orange | Produktdaten zu alt |
| `err` | Rot | Globale Daten fehlen / Feiertag |

Unter der Zahl erscheint immer eine kurze Erklärungszeile, was eingerechnet wurde (Bestand, Folgetag, Fehlmenge).

### Zieldatum-Berechnung

```js
// Nächster Montag ab heute (nie heute selbst)
function naechsterWochentag(wd) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  var diff = (wd - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;   // heute = Montag → nächsten Montag nehmen
  d.setDate(d.getDate() + diff);
  return d;
}
```

---

## Zusammenspiel der beiden Teile

```
NFC-Chip am Froster-Schild
        │
        │  URL: frosterauslastung/froster_bedarf_mo.html
        ▼
┌─────────────────────────────┐
│  Froster-Bedarfsrechner     │
│  bis Montag, 19.05.         │
│                             │
│  Wurde der Froster          │
│  schon gemacht?             │
│  [ ✓ Ja ]  [ ✗ Nein ]      │
│                             │
│  Produkt: [Hasenberger ▾]  │
│                             │
│        249                  │
│        Bl.                  │
│  Bestand: −54 Bl.           │
└─────────────────────────────┘
```

Das Schild trägt drei Chips:

| Chip | Ziel-URL | Funktion |
|---|---|---|
| 1 | `frosterauslastung/froster_auslastung.html` | Froster-Bestand & Auslastung |
| 2 | `frosterauslastung/froster_bedarf_mo.html` | Noch zu produzieren bis Montag |
| 3 | `frosterauslastung/froster_bedarf_di.html` | Noch zu produzieren bis Dienstag |

---

## Offene Punkte / Erweiterungsideen

- **Mittwoch/Donnerstag** als weitere Zieldaten (separate Dateien nach demselben Muster)
- **Direktanzeige aller Produkte** statt Dropdown — wenn der Froster immer nur für wenige Artikel relevant ist
- **Schreibschutz-Hinweis** auf dem Schild für den Fall, dass jemand die Chips überschreiben will
- **NFC-Chip programmieren** direkt aus der Druckzentrale heraus (Web NFC Write API — selber Mechanismus wie Lesen, nur `ndef.write()`)
