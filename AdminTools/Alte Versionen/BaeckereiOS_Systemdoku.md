# BäckereiOS — System-Dokumentation
> Stand: Februar 2026 · Version ~V119 (froster_gehirn.js)

---

## 1. Datei-Übersicht & Aufgabenverteilung

| Datei | Typ | Aufgabe |
|---|---|---|
| `index.html` | UI | Cockpit / Startseite, Navigation zu allen Modulen |
| `setup.html` | UI | 7-Schritt-Assistent: Sitzung aufbauen, nach `planer.html` übergeben |
| `planer.html` | UI | Produktionsplanung: Inputs erfassen, Berechnung anzeigen |
| `schnellrechner.html` | UI | Sandbox: Einzelprodukt schnell durchrechnen |
| `verbrauchsuebersicht.html` | UI | Stammdaten-Ansicht: Tagesbedarfe je Produkt als Tabelle |
| `frosterliste.html` | UI | Druckvorlage Frosterliste (A4, S/W), kein JS-Datenzugang |
| `stammdaten.js` | Daten | Produktstammdaten: `window.BOS_STAMMDATEN` |
| `inventurdaten.js` | Daten | Aktueller Froster-Ist-Bestand: `window.BOS_INVENTUR` |
| `froster_gehirn.js` | Logik | Kernberechnung: `window.BOS_BRAIN.calculateChain()` |
| `export.js` | Logik | Druck + WhatsApp: `window.BOSExport` |
| `translations.js` | Daten | Mehrsprachigkeit: `window.BOS_LANG` |
| `systemdesign.css` | Design | Globales Design-System: CSS-Variablen, Basis-Klassen |

---

## 2. Globale JavaScript-Objekte (window.*)

### `window.BOS_STAMMDATEN`
Definiert in `stammdaten.js`. Unveränderlich zur Laufzeit.

```js
{
  "p1": {
    name: "Hasenpfoten",
    needs: [14, 14, 14, 14, 16, 30, 23],  // Index 0=So, 1=Mo, ..., 6=Sa
    sun: 0,        // Grill-Zusatzmenge
    unit: 0,       // 0=Bleche, 1=Kartons, 2=Paletten, 3=Stück
    station: "Brötchenstraße"
  }, ...
}
```

**needs-Index-Mapping:** BOS-intern ist `bosIdx = jsDay === 0 ? 6 : jsDay - 1`
→ JS-Sonntag (0) = BOS-Index 6, JS-Montag (1) = BOS-Index 0

### `window.BOS_INVENTUR`
Definiert in `inventurdaten.js`. Wird von `frosterliste.html` und `setup.html` gelesen.

```js
{
  globalDayIdx: 5,   // Letzter Zähltag (5=Samstag)
  products: {
    "p1": { stock: 0, rest: 0, new: 0, ts: 1772150400000 }
    // ts = Unix-Timestamp in ms der letzten Zählung
  }
}
```

**24h-Regel in setup.html:** `ts > 0 && (Date.now() - ts) < 86400000` → Bestand automatisch übernehmen, sonst manuelle Eingabe.

### `window.BOS_BRAIN`
Definiert in `froster_gehirn.js`. Die einzige Berechnungsinstanz im System.

```js
BOS_BRAIN.calculateChain(prodId, session, plannedProd)
// Returns: { productId, productName, chain: [...], isOk, maxDeficit }
```

**chain[i]-Objekt:**
```js
{
  stepIdx, dayIdx, dayName,
  need,              // Tagesbedarf (nach Hamster/Grill angepasst)
  actualConsumption, // 0 wenn frosterDone && i < 2
  planned,           // Produktionsmenge aus Input
  stockAfterNeed,    // Bestand nach Verbrauch (negativ = Lücke)
  restAfter,         // stockAfterNeed + planned (Übergabe an nächsten Tag)
  isWarning          // true wenn stockAfterNeed<0 oder nächster Morgen gefährdet
}
```

**Hamster-Multiplikatoren** (aus `session.weekConfig[dayIdx].hamster`):
- `0` → × 1.0 (Normal)
- `1` → × 1.5 (🐹 Hamster, `Math.ceil`)
- `2` → × 2.0 (🐹🐹 Ultra = Samstagsmenge, `Math.ceil`)

**Grill-Zuschlag:** `cfg.grill && p.sun > 0 → adj += p.sun`

**startStep-Logik:** `session.frosterDone ? 2 : 1` → Wenn Froster heute schon gezählt, beginnt der Verbrauch erst ab Übermorgen.

### `window.BOS_SESSION` (localStorage)
Von `setup.html` geschrieben, von `planer.html` gelesen.

```js
{
  selectedIds:  ["p1", "p2"],        // Gewählte Produkt-IDs
  inventory:    { "p1": 10 },        // Ist-Bestand (Bleche)
  frosterDone:  true | false,        // Froster heute gezählt?
  weekConfig: {
    0: { status: "auf"|"zu", hamster: 0|1|2, grill: false },
    // Key = JS-Wochentag (0=So ... 6=Sa)
  },
  shortages:    { "p1": 2 },         // Fehlmengen
  targetDays:   { "p1": 1 },         // 1=Mo, 2=Di (Folgewoche)
  station:      "Brötchenstraße"     // Station des Nutzers
}
```

### `window.BOSExport`
Definiert in `export.js`.

| Methode | Funktion |
|---|---|
| `printProductionPlan(data)` | Öffnet Druckfenster mit Produktionsplan (A4 oder 80mm) |
| `printFrosterReport(data)` | Druckt Froster-Status-Bericht |
| `shareProductionPlan(data)` | WhatsApp-Text generieren + öffnen |
| `shareFrosterStatus(data)` | WhatsApp-Text Froster-Status |

### `window.BOS_LANG`
Definiert in `translations.js`. Schlüssel: `de`, `en`, `vi`.
Genutzt nur in `index.html` und `schnellrechner.html` über `id="lang-*"`-Attribute.

---

## 3. Datenfluss: setup.html → planer.html

```
setup.html
  ├─ Schritt 0: Station wählen          → sess.station
  ├─ Schritt 1: Produkte wählen         → sess.selectedIds[]
  ├─ Schritt 2: Froster-Inventar        → sess.inventory{}
  │    └─ Prüft BOS_INVENTUR[id].ts (24h-Regel)
  │         ✅ frisch (<24h)  → automatisch übernehmen
  │         ❌ alt / fehlt   → manuelle Eingabe
  ├─ Schritt 3: Froster-Status          → sess.frosterDone
  ├─ Schritt 4: Wochen-Planung          → sess.weekConfig{}
  ├─ Schritt 5: Fehlmengen              → sess.shortages{}
  └─ Schritt 6: Planungs-Ziel           → sess.targetDays{}
         ↓
  localStorage.setItem('BOS_SESSION', JSON.stringify(sess))
         ↓
planer.html
  ├─ liest BOS_SESSION aus localStorage
  ├─ baut DOM (plan-cards) per buildDOM()
  └─ calculateMath()
       ├─ liest alle d-input Werte
       ├─ ruft BOS_BRAIN.calculateChain() pro Produkt
       ├─ aktualisiert Bubbles: (restAfter / nextNeed)
       ├─ aktualisiert Badges: ✓ Gedeckt / ⚠️ Deficit
       └─ aktualisiert Fortschrittsbalken
```

---

## 4. Abhängigkeits-Matrix

| Datei liest → | BOS_STAMMDATEN | BOS_INVENTUR | BOS_BRAIN | BOS_SESSION | BOSExport | BOS_LANG |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| setup.html | ✅ | ✅ | — | schreibt | — | — |
| planer.html | ✅ | — | ✅ | liest | ✅ | — |
| schnellrechner.html | ✅ | ✅ | — | — | — | ✅ |
| verbrauchsuebersicht.html | ✅ | — | — | — | — | — |
| frosterliste.html | — | — | — | — | — | — |
| index.html | — | — | — | — | — | ✅ |

---

## 5. Stations-System

Definiert als Array in `setup.html`:
```js
const STATIONS = ["Brötchenstraße", "Nachtschicht", "Frühschicht", "Rondo", "Konditorei", "Versand"];
```

Jedes Produkt in `stammdaten.js` hat ein `station`-Feld. Produkte ohne `station`-Feld fallen standardmäßig in `"Brötchenstraße"`.

**Bekannte Besetzung:**
- Brötchenstraße: p1–p7, p11–p14 (Gebäck, Plunder, Schnecken)
- Nachtschicht: p8–p10, p1771* (Brot, Baguette, Schlawiner)
- Frühschicht/Rondo/Konditorei/Versand: bislang keine Produkte hinterlegt

---

## 6. CSS-Variablen (systemdesign.css)

| Variable | Bedeutung |
|---|---|
| `--amber` | Primärfarbe #c07a10 |
| `--green` | Erfolg/OK |
| `--red` | Fehler/Lücke |
| `--surface` | Kartenoberfläche |
| `--surface2` | Hintergrundebene |
| `--border` / `--border-s` | Rahmenfarben |
| `--shadow` | Box-Shadow-Farbe |
| `--dim` | Gedämpfte Textfarbe |
| `--text` | Haupttextfarbe |
| `--bg` | Seitenhintergrund |

Theme-Umschaltung via `data-theme="light|dark"` auf `<html>`.

---

## 7. Bekannte Architektur-Grenzen

1. **Kein Server** — alles läuft lokal, keine persistente Datenbank. `inventurdaten.js` ist eine statische Datei die manuell aktualisiert werden muss.
2. **localStorage als Übergabe** — `BOS_SESSION` enthält nur die aktuelle Sitzung, kein Verlauf.
3. **Sprache** — Nur `index.html` und `schnellrechner.html` sind mehrsprachig. Setup/Planer sind hart deutsch.
4. **`froster_gehirn.js` kennt nur `session.inventory[id]` als Zahl** (oder `{stock}`-Objekt per V-Check) — keine Einheit.
5. **`frosterliste.html` ist vollständig entkoppelt** — kein Datenaustausch mit dem Rest des Systems.

---

## 8. Experten-Modus — Konzeptvorschlag

### Wer ist der Experte?
Jemand der die Produkte, Bedarfe und Bestände kennt und keine Assistenten-Führung braucht. Er will **direkt einsteigen** ohne 7 Schritte.

### Zwei sinnvolle Einstiegspunkte:

**A) Direkt-Inventur (`inventur_expert.html`)**
- Alle Produkte als Eingabeformular, gruppiert nach Station
- Bestand direkt eingeben → schreibt `BOS_INVENTUR` in localStorage (oder generiert Download der aktualisierten `.js`)
- Mit Timestamp pro Produkt → füttert die 24h-Prüfung im Setup automatisch
- Kein Assistent-Flow, kein Weiter-Button-Klicken

**B) Direkt-Planer (erweiterter `planer.html`-Modus)**
- Aufgerufen mit `planer.html?expert=1` oder separater Link
- Oben: kompakte Inline-Editoren für Bestand, Froster-Status, Wochenkonfig
- Kein Setup-Durchlauf nötig
- Erfahrener Nutzer passt alles direkt in einer Ansicht an

### Was der Experten-Modus NICHT ist:
- Kein verstecktes Power-User-Menü mit Schaltern
- Kein separates Login
- Kein "Profi-Theme"

### Empfehlung für Umsetzung:
1. `inventur_expert.html` bauen (direkte Inventureingabe mit localStorage-Persistenz)
2. In `index.html` als zweiten Einstieg unter "Arbeitsgeräte" aufnehmen
3. Setup-Assistent bleibt für neue/wechselnde Mitarbeiter
