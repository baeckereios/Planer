# BäckereiOS — SAVE GAME MANIFEST v3
> Checkpoint: März 2026 · Session v15+ · Letzter stabiler Stand nach Frosterfehlmengen-Rework
> Lies dieses Manifest vollständig bevor du eine einzige Zeile Code anfasst.
> Dann lies die relevanten Quelldateien. Dann frage wenn nötig.

---

## 0. Wer ist Ulf und wie arbeitet er?

**Ulf, 37, Bäcker Nachtschicht.** Entwickelt BäckereiOS zusammen mit Claude (Anthropic).

**Kommunikation:**
- Direkter, intellektuell fordernder Dialog. Fehler benennen, nicht bestätigen.
- Rückfragen VOR dem Bauen, nicht danach. Lieber eine Frage zu viel.
- Kurze, klare Antworten. Kein "Gerne!", kein "Großartig!".
- Deutsch. Manchmal Voice-to-Text → grammatikalisch rau, aber inhaltlich präzise.
- Schickt Screenshots von Problemen auf seinem Android-Gerät (Chrome).
- Testet lokal via 127.0.0.1:PORT oder GitHub Pages.
- Erwartet Syntax-Checks BEVOR Dateien ausgeliefert werden.

**Arbeitsweise:**
- Mobile-first. Kein Desktop-Testing.
- Hochladen auf GitHub Pages manuell (Download → GitHub Upload).
- Keine npm, keine Build-Tools, keine Frameworks. Vanilla HTML/CSS/JS.

---

## 1. Was ist BäckereiOS?

Eine **offline-fähige Web-App (PWA)** zur Produktionsplanung der Frosterabteilung einer Bäckerei. Keine externe Datenbank, kein Server. Alles läuft lokal über statische HTML/JS-Dateien im Browser.

**Kernfrage der App:** „Wie viele Bleche muss ich heute (und an welchen Tagen) produzieren, damit der Frosterbestand bis Montag oder Dienstag nächste Woche ausreicht?"

**Technischer Stack:** Vanilla HTML + CSS + JavaScript. Keine Frameworks. Keine npm. Keine Build-Tools.

**Hosting:** GitHub Pages (öffentlich zugänglich, kein Auth-Layer in der App selbst).

**Deployment-Datei:** `service-worker.js` mit Cache-Version. Bei Updates MUSS die Cache-Version erhöht werden, sonst sehen Nutzer alte Versionen.

---

## 2. Vollständige Datei-Übersicht (Stand März 2026)

### 2.1 Kern-App-Dateien

| Datei | Zweck | Vorsicht |
|---|---|---|
| `index.html` | Cockpit / Startseite, Navigation, Zitat des Tages | Translations.js überschreibt `lang-*` IDs — nie Text in lang-IDs hartkodieren! |
| `setup.html` | 8-Schritt PlanungsAssistent, schreibt BOS_SESSION | Hauptentwicklungsfeld — Poka-Yoke Schritt 4 NIE anfassen |
| `planer.html` | Produktionsplanung, liest BOS_SESSION | Hauptentwicklungsfeld |
| `froster_gehirn.js` | Kernberechnung: calculateChain + calculateAutoPlanning | NUR nach Rücksprache ändern |
| `export.js` | Druck (A4/80mm) + WhatsApp-Sharing | Ja |
| `stammdaten.js` | Produktstammdaten (statisch) | Selten |
| `inventurdaten.js` | Froster-Ist-Bestand mit Timestamps | Wird von inventur_dateneingabe.html generiert |
| `translations.js` | DE/EN/VI Übersetzungen (nur index + schnellrechner) | Immer mitpflegen wenn lang-IDs geändert werden! |
| `systemdesign.css` | CSS-Variablen, Dark/Light Theme, alle globalen Klassen | Ja |
| `manifest.json` | PWA-Manifest | Selten |
| `service-worker.js` | Offline-Caching | Cache-Version bei jedem Deployment erhöhen |

### 2.2 Produktionstools

| Datei | Zweck |
|---|---|
| `schnellrechner.html` | Einzelprodukt-Sandbox, Schnellrechnung ohne Setup-Flow |
| `frosterliste.html` | A4-Druckvorlage Frosterliste, vollständig entkoppelt |
| `verbrauchsuebersicht.html` | Stammdaten-Tabelle (read-only, Richtwerte) |

### 2.3 Inventur-System

| Datei | Zweck |
|---|---|
| `inventur_dateneingabe.html` | Zählblatt: Bestände eingeben, exportiert inventurdaten.js. Hat Froster-Toggle (schreibt BOS_FROSTER in localStorage) und globalen Reset-Button |
| `bestandsuebersicht.html` | Übersicht aller Bestände als Kreisdiagramme. Liest inventurdaten.js + BOS_FROSTER aus localStorage. Hat Druck + WhatsApp-Share |

### 2.4 Ofenangriff-System

| Datei | Zweck |
|---|---|
| `ofenangriff.html` | Backanleitung mit Programmnummern. Datenpflege-unabhängig, liest ofenangriff.js |
| `ofenangriff_datenpflege.html` | Admin-Tool zum Bearbeiten der Ofenprogramme, exportiert ofenangriff.js |

### 2.5 Pausenraum & Sonstiges

| Datei | Zweck |
|---|---|
| `pausenraum.html` | Pausenraum-Seite: große Zitate-Box mit Auto-Play + Navigation, BäckerRun-Spielkarte |
| `backspiel.html` | BäckerRun — Endless-Runner Spiel (Bäcker springt über Hindernisse) |
| `zitate.js` | 230+ Zitate-Datenbank (Humor, Handwerk, Bäckerei, KI-Entwickler-Sprüche) |
| `changelog.html` | Vollständige Entwicklungshistorie im BäckereiOS-Design |
| `todo.md` | To-Do-Liste (aktuell: Feedback-Formular via Formspree) |

### 2.6 Dokumentation & Backups

| Datei | Zweck |
|---|---|
| `MANIFEST_v3.md` | Dieses Dokument — vollständiger Projektstand für Claude |
| `BaeckereiOS_Systemdoku.html` | Lesbare HTML-Doku für Ulf |

---

## 3. Absolute Architektur-Regeln (NIE brechen ohne Ulf zu fragen)

### 3.1 BäckereiOS-Manifest
```
Logik vor Eleganz.
Keine stillen Architektur-Änderungen.
Bei Zweifeln an Berechnungen: ERST FRAGEN, dann bauen.
Hilfetexte nie kürzen.
```

### 3.2 Poka-Yoke Froster — TABU-ZONE
Schritt 4 (Froster-Status) in setup.html hat exakt **2 Buttons, keine Vorauswahl**. WEITER ist gesperrt bis der User tippt. **Nie anfassen, nie vereinfachen, nie einen Default setzen.**

Dasselbe gilt für den Schnellrechner: BERECHNEN ist gesperrt bis Froster-Status gewählt.

### 3.3 froster_gehirn.js Mathematik
Nur nach expliziter Rücksprache mit Ulf ändern. Erst erklären was sich ändert, dann warten auf Freigabe.

### 3.4 Script-Ladereihenfolge (Android-kritisch)
Scripts kommen **ans Ende des Body** — KEIN `defer` im Head. Grund: Android-Browser Race Condition.

**setup.html:**
```html
<script src="stammdaten.js"></script>
<script src="inventurdaten.js"></script>
<script src="froster_gehirn.js"></script>
<script>/* inline */</script>
```

**planer.html:**
```html
<script src="stammdaten.js"></script>
<script src="froster_gehirn.js"></script>
<script src="export.js"></script>
<script>/* inline */</script>
```

### 3.5 Bootstrap-Pattern (setup.html + planer.html)
```javascript
function _bosBootstrap() {
    if (!window.BOS_STAMMDATEN || !window.BOS_INVENTUR || !window.BOS_BRAIN) {
        setTimeout(_bosBootstrap, 30);
        return;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
}
_bosBootstrap();
```

### 3.6 Translations.js — kritische Falle
Jedes Element mit `id="lang-XYZ"` wird beim Laden vom Übersetzungssystem überschrieben. Wenn Text in einem solchen Element hartkodiert wird (z.B. "PlanungsAssistent"), **muss translations.js denselben Text enthalten**. Sonst wird es beim Laden auf den alten Wert gesetzt.

Aktuelle lang-IDs in index.html die translations.js kennt:
- `lang-slogan`, `lang-quickAccess`, `lang-apps`, `lang-startSetup`, `lang-startSetupSub`, `lang-quickCalc`, `lang-frosterlist`, `lang-overview`

---

## 4. BOS_SESSION — das Herzstück

Wird von `setup.html` in localStorage geschrieben, von `planer.html` gelesen.

```javascript
{
  startDayIdx: 2,          // JS-Wochentag des Planungsstarts (0=So, 1=Mo, ... 6=Sa)
  station: "Froster",      // Gewählte Station
  selectedIds: ["sb", "kb", "cr"], // Gewählte Produkt-IDs aus stammdaten.js
  inventory: {             // Froster-Ist-Bestand
    "sb": 40,
    "kb": 0,
    "cr": -8               // NEU: kann negativ sein wenn effectiveStock < 0
  },
  frosterDone: true,       // Globales frosterDone-Flag
  shortages: {             // Fehlmengen pro Produkt (immer positiv!)
    "sb": 0,
    "kb": 12,
    "cr": 0
  },
  weekConfig: {            // Pro JS-Wochentag: Status, Hamster, Grill
    0: { status: "auf", hamster: 0, grill: false },
    // ...
  },
  targetDays: {            // Ziel-Tag pro Produkt (JS-Wochentag)
    "sb": 1,               // 1 = Montag
    "kb": 2                // 2 = Dienstag
  },
  productionDays: {        // Produktionstage pro Produkt (Array von JS-Wochentagen)
    "sb": [2, 4],          // Mittwoch + Freitag
    "kb": [3]              // Donnerstag
  },
  prePlanned: {            // Auto-Planung Ergebnis (Array von Blechen je Step)
    "sb": [0, 30, 0, 18, 0, 0, 0],
    "kb": [0, 0, 20, 0, 0, 0, 0]
  }
}
```

---

## 5. froster_gehirn.js — vollständige Logik-Dokumentation

### 5.1 Exporte
```javascript
window.BOS_BRAIN = {
    calculateChain(prodId, session, plannedProd) → { chain, isOk, maxDeficit }
    calculateAutoPlanning(prodId, session)        → number[] (Bleche je Step)
}
```

### 5.2 calculateChain — Schritt-für-Schritt

**Inputs:**
- `prodId` — Produkt-ID
- `session` — BOS_SESSION
- `plannedProd` — Array von manuellen Eingaben aus dem Planer

**Kernvariablen:**
```javascript
const stock    = session.inventory[prodId] || 0;     // Rohbestand
const shortage = session.shortages[prodId] || 0;     // Fehlmenge (positiv)
const effectiveStock = stock - shortage;              // Effektiver Startbestand (kann negativ sein!)
const startStep = (session.frosterDone && shortage === 0) ? 2 : 1;
// KRITISCH: frosterDone überspringt Schritt 1 NUR wenn keine Fehlmenge vorhanden
// Bei Fehlmenge: startStep = 1, egal ob frosterDone = true
```

**Loop:**
```
i=0: Heute Nacht (Nachtschicht arbeitet)
i=1: Morgen früh (Froster-Moment: wird der Bestand entnommen?)
     → wenn frosterDone && shortage=0: actualConsumption=0 (bereits entnommen)
     → wenn shortage>0: actualConsumption=dailyNeed (Fehlmenge → Froster noch nicht vollständig)
i=2+: Normale Folgetage
```

**Fehlerprüfung (allMandatoryCovered):**
```javascript
// NUR echter Verbrauch zählt als Planfehler
if (actualConsumption > 0 && stockAfterNeed < 0) {
    allMandatoryCovered = false;
    maxDeficit = Math.min(maxDeficit, stockAfterNeed);
}
// Negativer Startbestand durch Fehlmenge bei i=0 ist KEIN Fehler
// (Frühschicht oder Nachtschicht produziert nach — kein Lückenalarm)
if (stockForTomorrow < 0 && i > 0) {
    allMandatoryCovered = false;
    maxDeficit = Math.min(maxDeficit, stockForTomorrow);
}
```

**Ausgabe pro Step:**
```javascript
{
  dayIdx,           // JS-Wochentag
  need,             // Tagesbedarf (mit Hamster/Grill-Modifikation)
  actualConsumption,// Tatsächlicher Verbrauch (0 wenn Froster-Skip)
  stockAfterNeed,   // Bestand nach Verbrauch
  restAfter,        // Bestand nach Verbrauch + Produktion
  isWarning,        // true wenn Bestand morgen nicht für Tagesbedarf reicht
  planned           // Eingegebene Produktion
}
```

### 5.3 Fehlmengen-Logik (kritisch, März 2026 überarbeitet)

**Kontext:** Fehlmenge = Nachtschicht wollte X Bleche aus dem Lagerraum holen, hatte aber nur Y. Sie braucht noch (X-Y) Bleche. Diese werden von Frühschicht oder Nachtschicht nachproduziert.

**Alte (falsche) Logik:**
```javascript
// Fehlmenge wurde als Zusatzbedarf zum Tagesbedarf addiert → FALSCH
// frosterDone überschrieb Fehlmenge weil startStep=2 → Fehlmenge wurde ignoriert
```

**Neue (korrekte) Logik:**
```javascript
const effectiveStock = stock - shortage;
// Fehlmenge reduziert den verfügbaren Bestand
// Bei Fehlmenge: frosterDone gilt für dieses Produkt als false (startStep=1)
// Keine Sonderbehandlung nötig — effectiveStock kann negativ sein
// Das Gehirn rechnet dann automatisch mehr Produktion
```

**Warum negativer Startbestand kein Alarm auslöst:**
- Bei i=0 (heute Nacht) ist actualConsumption=0 (Froster-Moment noch nicht)
- stockAfterNeed = effectiveStock - 0 = effectiveStock (negativ)
- Fehlerprüfung greift nur wenn actualConsumption > 0 → i=0 ist safe
- Der Plan ist trotzdem korrekt — die Produktion an späteren Tagen gleicht es aus

### 5.4 calculateAutoPlanning — 3-Phasen-Algorithmus

**Phase 1 — Gewichte berechnen:**
```javascript
// Pro Produktionstag: Summe aller Bedarfe die dieser Tag abdeckt
// Gewicht bestimmt welcher Produktionstag wie viel trägt
```

**Phase 2 — Proportionale Verteilung:**
```javascript
// Gesamtproduktion proportional auf Produktionstage verteilen
// STEP-Rundung (Stufengröße aus stammdaten.js)
```

**Phase 3 — Sicherheits-Pass:**
```javascript
// Prüfe alle Schritte rückwärts
// Wenn Lücke an Tag i entsteht: erhöhe Produktion am letzten Produktionstag vor i
// Fall a: Produktionstag VOR der Lücke — erhöhe dort
// Fall b: Kein Produktionstag davor — erhöhe am frühestmöglichen Punkt
```

---

## 6. setup.html — 8 Schritte im Detail

### 6.1 Schritt-Übersicht
| # | DOM-ID | Titel | Validation |
|---|---|---|---|
| 1 | step-0 | Willkommen + Station | station muss gesetzt sein |
| 2 | step-1 | Produkte wählen + Starttag | min. 1 selectedId |
| 3 | step-2 | Froster-Inventar | alle Bestände eingegeben |
| 4 | step-3 | Froster-Status | frosterDone !== null (POKA-YOKE!) |
| 5 | step-4 | Wochen-Planung | keine |
| 6 | step-5 | Fehlmengen | keine |
| 7 | step-6 | Planungs-Ziel | alle targetDays gesetzt |
| 8 | step-7 | Produktions-Tage | min. 1 Prod-Tag/Produkt + autoPlanning nicht null |

### 6.2 Poka-Yoke Lock-System (V153)
Setup-Schritte sind in der richtigen Reihenfolge zu durchlaufen. Produktionstools (Planer, Schnellrechner) sind erst nach vollständigem Setup zugänglich. Verhindert Planung ohne Bestandsdaten.

### 6.3 Schritt 3 — Inventar (24h-Check)
```javascript
const isFresh = ts > 0 && (Date.now() - ts) < 86_400_000;
// Frisch (< 24h): grüner Rahmen, Wert auto-ausgefüllt, "✏️ Ändern"-Button
// Veraltet/fehlt: roter Rahmen, manuelle Eingabe, Warnung mit Alter des Timestamps
```

### 6.4 Schritt 4 — Froster-Status (TABU-ZONE)
- Zwei Buttons: "❄️ FERTIG" und "NOCH NICHT"
- Keine Vorauswahl, WEITER bleibt gesperrt
- Nach Klick FERTIG: "❄️ Bestand gilt ab morgen früh"
- Nach Klick NOCH NICHT: "⏳ Heute noch nicht gezählt"

### 6.5 Starttag-Picker (in Schritt 1 eingebettet)
- Zeigt heute bis Dienstag der Folgewoche
- `daysToNextMon = (8 - realToday) % 7 || 7; daysToNextTue = daysToNextMon + 1`
- Heute = grün markiert, standard vorgewählt
- Sub-Label: "Heute" / "+1d" / "+2d" etc.

---

## 7. planer.html — vollständige Dokumentation

### 7.1 Init-Flow
```
_bosBootstrap() — wartet auf BOS_STAMMDATEN + BOS_BRAIN
    ↓
init()
    ↓ Theme setzen
    ↓ _tryLoad() aufrufen (mit Retry-Loop, 5× à 80ms)
        ↓ localStorage lesen
        ↓ sess = JSON.parse(raw)
        ↓ todayJS = sess.startDayIdx ?? todayJS  ← KRITISCH: überschreibt neues getDay()
        ↓ buildDOM()
        ↓ prePlanned-Injection
        ↓ calculateMath()
```

### 7.2 DOM-Struktur pro Produkt
```
card_${id}          plan-card (rote/grüne Border je isOk)
  badge_${id}       ✓ Gedeckt / ⚠️ N Bleche Deficit
  need_${id}_${i}   Bedarf: N [✓ Froster] [❄️ Frosterfehlmenge: N Bleche]
  inp_${id}_${i}    Eingabefeld (amber border wenn Produktionstag)
  bub_${id}_${i}    (restAfter/actualConsumption_nächster) grün/rot
  line_${id}_${i}   Verbindungslinie grün/rot
```

### 7.3 Fehlmengen-Anzeige im Planer (neu)
```javascript
// Wenn frosterDone UND shortage > 0: zeige Fehlmenge als Info-Zeile
if (step.actualConsumption === 0 && step.need > 0) {
    // "Bedarf: 16 ✓ Froster"
    if (i === 0 && sess.shortages[id]) {
        needDisplay += `<br><small style="color:var(--red);">❄️ Frosterfehlmenge: ${sess.shortages[id]} Bleche</small>`;
    }
}
```

---

## 8. inventur_dateneingabe.html — Zählblatt

### 8.1 Datenschema (workingData)
```javascript
workingData[produktId] = {
    locs: [0, 0, 0, 0],  // 4 Lagerorte (Bleche je Ort)
    stock: 0,             // Summe locs
    ts: 0,                // Timestamp der Zählung (ms)
    counted: false,       // Wurde manuell gezählt?
    _fromFile: false      // Wurde aus inventurdaten.js importiert?
}
```

### 8.2 Karten-Zustände
- **Gesperrt** (counted=false, _fromFile=false): volle Opacity, Eingabefelder gesperrt, "Entsperren"-Button
- **Selbst gezählt** (counted=true): aktiv, Eingabe möglich
- **Aus Datei** (_fromFile=true, counted=false): 35% Opacity, spezielle Darstellung, "Entsperren"-Button zum Überschreiben
- **Entsperrt aus Datei** (_fromFile=true, counted=true): aktiv wie selbst gezählt

### 8.3 Froster-Toggle (schreibt localStorage)
```javascript
// Drei Zustände: null → true → false → null
localStorage.setItem('BOS_FROSTER', 'true' | 'false');
localStorage.removeItem('BOS_FROSTER');  // für null/nicht angegeben
```
Bestandsübersicht liest diesen Wert und zeigt Froster-Status farbig an.

### 8.4 Globaler Reset
```javascript
workingData[k] = { locs: [0,0,0,0], stock: 0, ts: 0, counted: false, _fromFile: false }
// Setzt ALLE Produkte zurück, mit Bestätigungsdialog
```

---

## 9. bestandsuebersicht.html — Bestands-Übersicht

### 9.1 Datenquellen
1. `inventurdaten.js` → BOS_INVENTUR (Bestände mit Timestamps)
2. `stammdaten.js` → BOS_STAMMDATEN (Bedarfe pro Wochentag)
3. `localStorage.getItem('BOS_FROSTER')` → Froster-Status
4. `Date.now()` → aktuelles Datum/Uhrzeit für Anzeige

### 9.2 Bedarfsberechnung (Richtwert)
```javascript
// Summe der Bedarfe von HEUTE bis einschließlich MONTAG (7 Tage max)
// OHNE Hamster/Grill-Modifikationen → expliziter Hinweis "Richtwerte ohne Feiertage/Modifikatoren"
```

### 9.3 Farbcodierung
- Grün: Bestand ≥ 80% des Bedarfs
- Gelb: ≥ 40%
- Rot: < 40%
- Grau: nicht gezählt (ts = 0)

### 9.4 Druckseite (neuer Tab)
- Uhrzeit (Fraunces 2rem) + Datum
- Froster-Status farbig (grün/rot/grau)
- Produkttabelle mit Statusfarben
- Fußnote: "Richtwerte ohne Feiertage/Modifikatoren"
- Manueller Druck-Button (verschwindet beim Drucken via CSS)

---

## 10. ofenangriff.html — Backanleitung

### 10.1 Architektur
- `ofenangriff_datenpflege.html` → exportiert `ofenangriff.js` (Datentrennung)
- `ofenangriff.html` → liest `ofenangriff.js`, rendert Produktgruppen

### 10.2 Features
- Aufklappbare Produktgruppen (alle zugeklappt by default)
- Reset-Button im Header (nicht im Footer)
- "Sticken" statt "STN" (lesbar für unerfahrene Nutzer)
- Druckseite: neuer Tab mit sauberer Tabelle (Android-kompatibel)

### 10.3 Drucklösung (Android-Problem beachten)
`window.print()` wird auf Android Chrome bei programmatisch befüllten Tabs blockiert. Lösung: Neuer Tab mit fertig gerendeter statischer HTML-Tabelle + manueller Druck-Button.

---

## 11. schnellrechner.html — Sandbox

### 11.1 Besonderheiten
- **Kein Setup-Flow** nötig — direkter Einzelprodukt-Rechner
- Froster-Status muss manuell gewählt werden (Poka-Yoke: BERECHNEN gesperrt bis Wahl)
- Fehlmenge erscheint NUR wenn frosterDone=true (rote Box)
- **Sonderbestellung / Frosterfehlmengen** (NEU): Input im Extras-Bereich, rechnet auf Bedarf drauf, erscheint als eigene Zeile in der Ergebnistabelle

### 11.2 Berechnung
```javascript
// offset = frosterDone ? 2 : 1  (Froster-Skip im Sandbox-Modus)
// totalNeed = Summe der Bedarfe ab offset bis targetSteps
// + missing (wenn frosterDone && missing > 0)
// + extraOrder (Sonderbestellung, immer addiert)
// rawNeeded = Math.max(0, totalNeed - stock)
```

---

## 12. index.html — Cockpit

### 12.1 Struktur (von oben nach unten)
```
Brand-Header (Logo, Slogan-Bar)
Container:
  Section: Schnellzugriff
    → PlanungsAssistent (setup.html) [featured card]
    → Schnellrechner (schnellrechner.html) [full-width card]
  Zitat des Tages [stille Trennlinie]
  Section: Arbeitsgeräte
    → Grid: Frosterliste, Ofenangriff, Teamordner, Pausenraum, Bestände
    → Mengenübersicht (full-width)
Settings-Bar: Dark/Light Toggle, Sprache
```

### 12.2 Zitat des Tages
```javascript
// Deterministisch per Datum — jeden Tag dasselbe, täglich wechselnd
var seed = n.getFullYear() * 10000 + (n.getMonth()+1) * 100 + n.getDate();
return qQuotes[seed % qQuotes.length];
// Kein Autoplay, kein Button — stiller Ruhepol zwischen den Sektionen
```

### 12.3 Translations-Falle (KRITISCH)
`lang-startSetup` → "PlanungsAssistent" — **muss in translations.js stehen!**
Sonst wird es beim Laden auf den alten Wert zurückgesetzt.

---

## 13. pausenraum.html — Pausenraum

### 13.1 Features
- **Zitate-Box** (groß, schwarz): Auto-Play (startet nach 3s, alle 6s), Pause, Pfeil-Navigation, Swipe-Geste
- **Dot-Progress** (7 Punkte für 230+ Zitate, segmentweise)
- **BäckerRun-Karte**: Link zu backspiel.html
- **"Weitere Spiele folgen..."** Platzhalter mit "Vorschläge gerne an Ulf"

### 13.2 Zitate-Box Swipe
```javascript
document.querySelector('.quote-card').addEventListener('touchstart', ...);
document.querySelector('.quote-card').addEventListener('touchend', ...);
// diff > 40px → nächstes/vorheriges Zitat
```

---

## 14. zitate.js — Zitate-Datenbank

230+ Zitate in `const QUOTES = [...]`. Kategorien:
- Handwerk & Liebe zum Brot (warm)
- Nachtschicht & Schlafmangel (dunkel/humorvoll)
- Kaffee-Obsession
- Kunden & Kollegen (zynisch)
- BäckereiOS-Entwicklung (KI-flavor, neu März 2026)

**Neue Zitate (März 2026, von Claude hinzugefügt):**
```
"BäckereiOS: Entwickelt von einem Bäcker mit Ideen und einer KI mit zu viel Kaffee im System."
"const frosterDone = true; // Spoiler: war es nicht."
"Der Closure-Bug bei Mohnschnecken bleibt für immer in unserer Seele."
"Version 15 ist nicht die fünfzehnte Version. Sie ist die erste, die hält."
... (25 neue Einträge gesamt)
```

---

## 15. Design-System (systemdesign.css)

### 15.1 CSS-Variablen (Light Mode)
```css
--amber:    #c07a10;  /* Primärfarbe */
--amber-light: rgba(192,122,16,0.12);
--green:    #3da86b;
--red:      #c94a4a;
--surface:  #ffffff;
--surface2: #f5f0e8;
--border:   #e2d9c8;
--border-s: #d0c5b0;
--text:     #1a1510;
--dim:      #7a6f60;
--shadow:   rgba(0,0,0,0.08);
--bg:       #f0ebe0;
```

### 15.2 Fonts
- **Fraunces** (serif, 900 / 900 italic): Hauptüberschriften, Produktnamen, große Zahlen
- **Barlow Condensed** (700/800/900): Labels, Buttons, Badges, Navigation
- **Barlow** (400/600/700): Fließtext, Beschreibungen

### 15.3 Dark Mode
`data-theme="dark"` auf `<html>`. Farben in CSS `[data-theme="dark"]` Block überschrieben.
Gespeichert in `localStorage.getItem('BOS_THEME')`.

---

## 16. stammdaten.js — Produktstammdaten

```javascript
window.BOS_STAMMDATEN = {
  "produktId": {
    name: "Produktname",
    needs: [Mo, Di, Mi, Do, Fr, Sa, So],  // Index 0=Montag, 6=Sonntag
    sun: 0,       // Zusatzbedarf bei Grillwetter
    unit: 0,      // 0=Bleche, 1=Pressen25, 2=Pressen20, 3=Brühstück
    step: 6,      // Mindest-Produktionseinheit (Bleche)
    station: "Froster"
  }
}
```

**Stations (aktuell belegt):** Froster
**Stations (leer/Platzhalter):** Frühschicht, Rondo, Konditorei, Versand

---

## 17. inventurdaten.js — Bestandsdaten

```javascript
window.BOS_INVENTUR = {
    stocks: { "sb": 40, "kb": 0 },           // Bestand je Produkt
    timestamps: { "sb": 1709123456789, ... }, // JS-Timestamp der Zählung
    counted: { "sb": true, "kb": false },     // Wurde gezählt?
    exported: 1709123456789                   // Export-Zeitpunkt
}
```

---

## 18. Entwicklungshistorie — v1 bis v15+

| Version | Änderung |
|---|---|
| v1 | Design-Upgrade: Fraunces/Barlow, CSS-Variablen, Dark Mode, Grid-Layout |
| v2 | Performance: DOM-Caching, DocumentFragment, Fortschrittsbalken |
| v3 | Hamster-Toggle 3-State (×1/×1.5/×2), Bubble-Format (Bestand/Bedarf) |
| v4 | Syntax-Bug-Fix planer.html |
| v5 | Inventar-Timestamp 24h-Check, Station-Auswahl |
| v6 | Script-Fix: kein defer, _bosBootstrap Guard |
| v7 | Bubble-Fix: actualConsumption statt need. Froster-Badge dynamisch |
| v8 | Welcome-Layout, localStorage-Retry |
| v9 | Schritt 8 Produktionstage, calculateAutoPlanning() |
| v10 | Starttag-Picker |
| v11 | Starttag bis Dienstag, Sonntag aus Produktionstagen |
| v12 | Proportionale Auto-Verteilung (3 Phasen) |
| v13 | Phase 3 Fix: Lücken an Produktionstagen |
| v14 | totalSteps-Fix: raw < 3 → raw + 7 |
| v15 | Bootstrap-Fix: wartet auf BOS_BRAIN |
| v15+ | **Frosterfehlmengen-Rework** (März 2026): effectiveStock = stock - shortage, produktspezifisches startStep, Fehlerprüfung repariert |
| v15+ | **Ofenangriff**: Architektur-Refactor (ofenangriff.js getrennt), aufklappbare Gruppen, Druckseite neuer Tab, STN→Sticken, Reset im Header |
| v15+ | **Inventur**: counted/uncounted Flag-System, Unlock für importierte Werte, Froster-Toggle (localStorage), globaler Reset |
| v15+ | **Bestandsübersicht**: neue unabhängige Seite, Kreisdiagramme, Froster-Status, Druck/Share |
| v15+ | **Schnellrechner**: Sonderbestellung/Frosterfehlmengen-Input im Extras-Bereich |
| v15+ | **index.html**: PlanungsAssistent (Name), Schnellrechner in Schnellzugriff, Zitat des Tages (still, ohne Buttons) |
| v15+ | **Pausenraum**: neue Seite mit Zitate-Box (Auto-Play, Swipe), BäckerRun-Karte |
| v15+ | **zitate.js**: 25 neue Einträge (KI-Entwickler-Humor) |
| v15+ | **changelog.html**: vollständige Entwicklungshistorie im BäckereiOS-Design |
| V153 | Poka-Yoke Workflow-Locks: Setup vor Produktionstools |

---

## 19. Offene To-Dos

### Feedback-Formular im Pausenraum (geplant)
- Kollegen sollen Vorschläge/Kritik einschicken können ohne Ulfs Nummer zu kennen
- Favorisierte Lösung: **Formspree.io** — kostenloses Formular → E-Mail an Ulf
- Alternative: QR-Code im Pausenraum physisch → WhatsApp-Gruppe

### Hilfe-Seite (geplant)
- changelog.html bereits fertig als Basis
- Spruch "BäckereiOS: Entwickelt von einem Bäcker mit Ideen und einer KI mit zu viel Kaffee im System." soll groß dort erscheinen
- Weitere Assistenten geplant (PlanungsAssistent ist nur der erste)

---

## 20. Anweisungen für die KI die das liest

1. **Lies dieses Manifest vollständig** — dann relevante Quelldateien — dann fragen.
2. **Rückfragen vor dem Bauen** — nie raten.
3. **Syntax-Check vor Ausgabe** — `node --check datei.js` für alle JS.
4. **Keine stillen Architektur-Änderungen** — immer ankündigen.
5. **Poka-Yoke Froster (Schritt 4)** — nie anfassen.
6. **froster_gehirn.js** — nur nach Rücksprache ändern.
7. **translations.js** — immer mitpflegen wenn lang-IDs geändert werden.
8. **Android-Browser denken** — Race Conditions, localStorage-Timing, kein defer.
9. **service-worker.js** — Cache-Version erhöhen bei Deployment.
10. **Ulf kommuniziert direkt** — kein "Großartig!", kein Lobgesang. Fehler benennen.
11. **Voice-to-Text beachten** — grammatikalisch rau aber inhaltlich präzise.
12. **Wenn unsicher: erst fragen.** Immer.

---

*BäckereiOS · SAVEGAME v3 · März 2026*
*"BäckereiOS: Entwickelt von einem Bäcker mit Ideen und einer KI mit zu viel Kaffee im System."*

---

## 21. Unterordner-Struktur (Ergänzung v4)

### /azubi_meisterhaft/
Eigenständiger Pausenraum-Bereich für Azubis. **Keine Verbindung zum Hauptordner.**

| Datei | Zweck |
|---|---|
| `index.html` | Landing Page des Azubi-Bereichs |
| `azubi_meisterhaft.html` | Hauptseite / Übersicht |
| `wissen_start.html` | Wissenstraining Einstieg |
| `history.html` | Backstuben-Geschichte |
| `history.js` | Daten für Historien-Modul |
| `history_trivia.html` | Quiz zur Backstuben-Geschichte |
| `mythen.html` | Bäckerei-Mythen |
| `news.html` | News/Aktuelles |
| `pausen_snacks.html` | Pausenraum-Snacks Modul |
| `trivia.js` | Quiz-Daten |
| `systemdesign.css` | Eigene CSS (unabhängig vom Haupt-systemdesign.css) |

### /AdminTools/
Administrative Erfassungstools. **Keine Verbindung zum Hauptordner.** Nur für Ulf.

| Datei | Zweck |
|---|---|
| `admin_landing.html` | Landing Page der Admin-Tools |
| `inventur_dateneingabe.html` | Admin-Version der Inventureingabe |
| `ofenangriff_datenpflege.html` | Admin-Tool für Ofenprogramm-Pflege |
| `verbrauchsdaten_admin.html` | Verbrauchsdaten-Erfassung |
| `BaeckereiOS_Systemdoku.html` | Systemdokumentation (HTML) |
| `BaeckereiOS_Systemdoku.md` | Systemdokumentation (Markdown) |

