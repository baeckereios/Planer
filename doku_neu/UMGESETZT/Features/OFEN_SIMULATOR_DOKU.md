# Ofen-Simulator – Vollständige Dokumentation

**Datei:** `Ofen_Simulator_v3_tutorial2.html`  
**Zweck:** Interaktiver Lern-Simulator für den Umgang mit dem Stikkenofen (Heißluft-Umluftofen) in der Backstube  
**Zielgruppe:** Azubis, neue Mitarbeiter  
**Technologie:** Vanilla HTML/CSS/JavaScript, keine externen Abhängigkeiten, keine API, keine Bibliotheken  
**Deployment:** Einzelne `.html`-Datei, läuft direkt im Browser (lokal oder auf GitHub Pages)

---

## Inhaltsverzeichnis

1. [Entstehungsgeschichte](#1-entstehungsgeschichte)
2. [Datei-Struktur](#2-datei-struktur)
3. [Datenbank](#3-datenbank)
4. [Display-Simulator](#4-display-simulator)
5. [Physische Aktionen](#5-physische-aktionen)
6. [Produktwahl-Panel](#6-produktwahl-panel)
7. [Folgeprodukt-Empfehlung](#7-folgeprodukt-empfehlung)
8. [Sound-System](#8-sound-system)
9. [Tutorial-System](#9-tutorial-system)
10. [Szenario-Tracker](#10-szenario-tracker)
11. [Zustandsmaschine](#11-zustandsmaschine)
12. [Erweiterung: Neue Programme / Produkte](#12-erweiterung-neue-programme--produkte)
13. [Erweiterung: Neue Tutorials](#13-erweiterung-neue-tutorials)
14. [Bekannte Eigenheiten](#14-bekannte-eigenheiten)
15. [Versions-Übersicht](#15-versions-übersicht)

---

## 1. Entstehungsgeschichte

Der Simulator entstand aus dem Wunsch, Azubis den Umgang mit dem HEUFT-Stikkenofen praxisnah und ohne echte Backware beibringen zu können. Ausgangspunkt war ein Foto des echten Ofen-Displays.

**Kernprobleme die adressiert werden:**
- Azubis schieben Wagen in kalten Ofen (zu früh – Ofen noch nicht auf Temperatur)
- Unklarheit über Programmnummern und welches Produkt zu welchem Programm gehört
- Unverständnis der Anzeige-Elemente (Zug, Schwaden, Abluftklappe)
- Effizienz-Verlust durch fehlende Kenntnis der Folgeprodukt-Logik (Ofenwärme nutzen)

**Design-Entscheidung:** Die Darstellung orientiert sich an einer technischen Zeichnung – weißer Hintergrund, dicke schwarze Linien, Arial. Bewusst keine moderne App-Ästhetik, damit die Wiedererkennung mit dem echten Gerät maximiert wird.

---

## 2. Datei-Struktur

Die gesamte Anwendung ist eine einzige HTML-Datei, aufgeteilt in drei Abschnitte:

```
Ofen_Simulator_v3_tutorial2.html
│
├── <style>          CSS (ca. 500 Zeilen)
│   ├── Produktwahl-Panel
│   ├── Casing / Bezel / Screen
│   ├── Display-Komponenten (Titelleiste, Info-Zeile, Icon-Zeile, Timer, Buttons)
│   ├── Views (Menu, Wagenantrieb, Beenden?, Beendet, Eingabe)
│   ├── Physische Aktionen (Tür-Button)
│   ├── Folgeprodukt-Panel
│   ├── Hint + Szenario
│   └── Spotlight-Tutorial
│
├── <body>           HTML
│   ├── .produkt-panel          ← Dropdown-Auswahl oberhalb des Simulators
│   ├── .casing                 ← Gehäuse mit Bezel
│   │   └── .screen             ← Display
│   │       ├── #v-off          ← Ansicht: Gerät aus
│   │       ├── #v-menu         ← Ansicht: Backprogrammliste
│   │       ├── #v-main         ← Ansicht: Hauptdisplay (Normalzustand)
│   │       ├── #v-wagen        ← Ansicht: Wagenantrieb
│   │       ├── #v-confirm      ← Ansicht: Backprogramm beenden?
│   │       ├── #v-beendet      ← Ansicht: Backprogramm beendet
│   │       └── #v-eg           ← Ansicht: Zahleneingabe (Numpad)
│   ├── .phys-strip             ← Tür-Button (außerhalb Display)
│   ├── #folge-panel            ← Folgeprodukt-Empfehlungen
│   ├── #hint                   ← Kontextueller Hinweis-Banner
│   ├── #tut-start-btn          ← Tutorial-Starttrigger
│   ├── #tut-done-banner        ← Tutorial-Abschluss-Meldung
│   ├── #tut-overlay            ← Spotlight-Overlay (fixed, z-index 900)
│   └── #scenario               ← Szenario-Fortschrittsanzeige
│
└── <script>         JavaScript (ca. 550 Zeilen)
    ├── BACKDB                  ← Produkt-Datenbank
    ├── PROGS                   ← Ofenprogramm-Liste (für Menü-Ansicht)
    ├── OVS                     ← Overlay-Texte (Erklärungen)
    ├── State-Variablen
    ├── Produktwahl-Funktionen
    ├── Folgeprodukt-Logik
    ├── View-Steuerung
    ├── Backprogramm-Logik
    ├── Eingabe / Numpad
    ├── Sound-System
    └── Tutorial-System
```

---

## 3. Datenbank

### 3.1 BACKDB – Produkt-Datenbank

Sitzt ganz oben im `<script>`-Block, klar kommentiert. Jedes Produkt hat Varianten nach Stikken-Anzahl.

```javascript
const BACKDB = [
  {
    name: "Kornknacker",           // Anzeigename im Dropdown
    stikken: [
      {
        anzahl:   1,               // Stikken-Anzahl
        prog:    "003",            // Programmnummer am Ofen
        progName:"KOERNERBROETCHEN ½", // Anzeigename auf Display
        startTemp: 255,            // Vorheiztemperatur (°C) – Start-Button aktiv ab startTemp - tol
        endTemp:   248,            // Ofentemperatur nach dem Backen (für Folgeprodukt-Matching)
        mins:      14,             // Backzeit in Minuten
        steam:     2.0,            // Schwadenmenge in Litern
        luft:      true,           // Umluft aktiv?
        klappe:    false,          // Abluftklappe aktiv?
        tol:       10,             // Temperatur-Toleranz (°C): Start aktiv ab startTemp - tol
      },
      // ... weitere Stikken-Varianten
    ]
  },
  // ... weitere Produkte
];
```

**Aktuell enthaltene Produkte:**
| Produkt | Programme | Stikken |
|---|---|---|
| Kornknacker | 003 / 003 ½ | 1, 2, 3 |
| Schnittbrötchen | 001 / 002 | 1, 2, 3 |
| Mehrkorn | 009 / 010 | 1, 2, 3 |
| Laugenstangen | 005 / 006 | 1, 2, 3 |
| Käsebrötchen | 007 / 008 | 1, 2, 3 |
| Besserdinkel | 152 | 1, 2, 3 |

**⚠ Hinweis zu `endTemp`:** Diese Werte sind derzeit geschätzt (~97% von `startTemp`). Hier sollten die echten Messwerte aus der Backstube eingetragen werden – sie bestimmen die Qualität der Folgeprodukt-Empfehlung.

---

### 3.2 PROGS – Ofenprogramm-Liste

Separate Liste für die direkte Programm-Auswahl im Display-Menü (wie am echten Ofen). Entspricht dem `BACKDB`, ist aber flacher strukturiert.

```javascript
const PROGS = [
  { nr:"001", name:"SCHNITTBROETCHEN", temp:230, steam:3.0, mins:14,
    luft:true, dampf:true, klappe:false, tol:10 },
  // ...
];
```

**Aktuell enthaltene Programme:**
`000 H` · `001 SCHNITTBROETCHEN` · `002 SCHNITTBROETCHEN ½` · `003 KOERNERBROETCHEN` · `004 K` · `005 LAUGENSTANGEN` · `006 LAUGENSTANGEN ½` · `007 KAESEBROETCHEN` · `008 KAESEBROETCHEN ½` · `009 MEHRKORN` · `010 MEHRKORN ½` · `152 BESSERDINKEL`

---

### 3.3 OVS – Erklärungstexte

Tippen auf Anzeige-Elemente öffnet einen erklärenden Overlay. Die Texte stehen in `OVS`:

```javascript
const OVS = {
  luft:    { t: "UMLUFT / GEBLÄSE",   b: "..." },
  dampf:   { t: "SCHWADEN / BESCHWADEN", b: "..." },
  feuchte: { t: "ZUG [%]",            b: "Öffnungsgrad des Zugs..." },
  temp:    { t: "BACKTEMPERATUR",      b: "..." },
  klappe:  { t: "ABLUFTKLAPPE",        b: "..." },
};
```

**Hinweis:** Das Feld `feuchte` heißt im Code noch `feuchte` (historisch), zeigt aber den **Zug-Öffnungsgrad** an (0% = Zug geschlossen, 100% = vollständig offen).

---

## 4. Display-Simulator

### 4.1 Views (Bildschirm-Zustände)

| View-ID | Entspricht | Auslöser |
|---|---|---|
| `v-off` | Gerät ausgeschaltet | `powerOff()` |
| `v-menu` | Backprogrammliste | `openProgList()` / Tippen auf Programmname |
| `v-main` | Hauptdisplay | `show("v-main")` |
| `v-wagen` | Wagenantrieb-Menü | `goWagen()` |
| `v-confirm` | Backprogramm beenden? | `doStop()` während Programm läuft |
| `v-beendet` | Backprogramm beendet | Timer läuft auf 0 |
| `v-eg` | Zahleneingabe (Numpad) | Tippen auf Temperatur oder Timer |

### 4.2 Hauptdisplay-Elemente

```
┌──────────────────────────────────────┐
│ 003  KOERNERBROETCHEN                │ ← Titelleiste (tippar → Programmliste)
├──────────┬──────────┬──────┬─────────┤
│  🔑+Fan  │  3.0 l   │ 0 %  │  255°C  │ ← Info-Zeile (alle tippbar → Overlay)
├──────────┼──────────┼──────┼─────────┤
│  🌀 [grün]│  ☁ Dampf │  🪟  │  🌡     │ ← Icon-Zeile
├──────────┴──────────┴──────┴─────────┤
│           0 : 1 6 : 0 0              │ ← Timer (tippbar → Eingabe)
├────────────┬───────────┬─────────────┤
│   Start    │   Stop    │ Wagenantrieb│
├────────────┴─────────────────────────┤
│    Menü    │         Ofen Aus        │
└────────────┴─────────────────────────┘
```

**Icon-Bedeutungen:**
- **🌀 Umluft** (grün = aktiv): Gebläse läuft
- **☁ Schwaden**: Dampfeinspritzung (leuchtet während Schwaden-Phase)
- **🪟 Abluftklappe**: Öffnet ab ~60% der Backzeit bei entsprechenden Programmen
- **🌡 Thermometer**: Aktiv während Backprogramm läuft

### 4.3 Zug-Simulation (%-Anzeige)

Während des Backens simuliert die %-Anzeige den Zug-Öffnungsgrad:
- **0–30 Sek:** 0% (Zug zu – Schwaden-Phase)
- **30–90 Sek:** steigt auf ~40% (Zug öffnet langsam)
- **Rest der Backzeit:** steigt weiter auf bis zu 100%

**⚠ Dies ist eine Annäherung.** Tatsächliches Verhalten des Zugs am echten Ofen sollte eingetragen werden.

### 4.4 Numpad – Zeiterfassung

Die Zeiterfassung funktioniert wie am echten Ofen: **Stellen von links nach rechts** eingeben.

| Kontext | Format | Beispiel 50 Sekunden |
|---|---|---|
| Backzeit (Timer) | `H : MM : SS` (5 Stellen) | 0 · 0 · 0 · 5 · 0 |
| Nachbackzeit | `MM : SS` (4 Stellen) | 0 · 0 · 5 · 0 |
| Temperatur | Zahl | direkt eintippen |

Leere Stellen werden als `0` gewertet. `⇐` löscht letzte Stelle, `DEL` löscht alles.

---

## 5. Physische Aktionen

### 5.1 Tür-Button

Der Tür-Button sitzt **außerhalb** des Displays – weil das Öffnen der Ofentür eine physische Aktion ist, nicht eine Display-Interaktion.

```
[🚪 Tür öffnen]  ↔  [🚪 Tür schließen]
```

**Auswirkungen:**
- `goWagen()` prüft ob Tür offen ist. Wenn nicht → Hinweis
- `wagenRaus()` prüft ob Tür offen ist. Wenn nicht → Hinweis
- Tutorial-Szenario berücksichtigt Tür-Zustand

### 5.2 Wagenantrieb

Nach Tippen auf „Wagenantrieb" erscheint das echte Menü:

```
┌─────────────────┐
│   Wagen Rein    │
├────────┐────────┤
│  STOP  │        │  ← Achteck (Stop-Schild)
├────────┘────────┤
│   Wagen Raus    │
└─────────────────┘
```

Beim Ein- und Ausfahren: Elektromotor-Sound (~900ms), danach automatisch zurück zum Hauptdisplay.

---

## 6. Produktwahl-Panel

Das Panel **über** dem Simulator ermöglicht die schnelle Auswahl ohne die Programm-Menüs des Displays durchklicken zu müssen.

**Ablauf:**
1. Dropdown 1: Produktname wählen
2. Dropdown 2: Stikken-Anzahl wählen
3. Info-Zeile erscheint: Programm-Nr., Starttemp, Zeit, Schwaden
4. „In Simulator laden ▶" → Programm wird geladen, Vorheizen startet

**Verwendete Funktion:** `ppLoad()` → baut aus dem BACKDB-Eintrag ein `prog`-Objekt und übergibt es an `applyProg()`.

---

## 7. Folgeprodukt-Empfehlung

Nach Ablauf eines Backprogramms erscheint automatisch ein schwarzes Panel:

```
⚡ DIREKT WEITERBACKEN — OFENWÄRME NUTZEN

Ofen ist gerade bei ca. ~248°C. Diese Produkte passen jetzt:

Kornknacker      3 Stk · 255°C · 16 min   [Direkt möglich]
Mehrkorn         3 Stk · 240°C · 17 min   [~8 min kühlen ]
Schnittbrötchen  3 Stk · 230°C · 14 min   [~18 min kühlen]
```

**Badge-Logik:**
| Badge | Bedingung | Bedeutung |
|---|---|---|
| ✅ Direkt möglich (grün) | `|endTemp - startTemp| ≤ 10°C` | Sofort einladen |
| ⚠ ~X min kühlen (gelb) | `endTemp > startTemp + 10` | Kurz warten |
| ❌ +X°C fehlen (orange) | `endTemp < startTemp - 10` | Ofen zu kalt |

Tippen auf einen Vorschlag befüllt die Dropdowns oben vor.

**Basis:** `endTemp`-Feld im BACKDB-Eintrag. Je genauer dieser Wert, desto besser die Empfehlung.

---

## 8. Sound-System

Rein synthetisch über die **Web Audio API** – keine externen Dateien.

```javascript
// Einstiegspunkt – lazy initialization
function getACtx()          // AudioContext (einmalig erstellt)

// Primitiver Ton
function playBeep(freq, dur, type, vol)
  // freq: Frequenz in Hz
  // dur:  Dauer in Sekunden
  // type: "square" | "sawtooth" | "sine" | "triangle"
  // vol:  Lautstärke 0.0–1.0

// Fertig-Alarm: 3 × kurzer Rechteck-Ton (940 Hz)
function playAlarm()        // ausgelöst wenn Timer auf 0

// Elektromotor-Sound für Wagenantrieb
function playWagenMotor(durationMs)
  // Sägezahn ~72 Hz mit LFO-Vibrato
  // Rampt sanft rauf und runter
```

**⚠ Browser-Einschränkung:** Audio wird erst nach der ersten Nutzer-Interaktion entsperrt. Erster Tap auf der Seite reicht – danach funktioniert alles.

---

## 9. Tutorial-System

### 9.1 Konzept

Ein **Spotlight-Tutorial** legt sich als `position:fixed`-Overlay über die gesamte Seite. Das Display verhält sich komplett normal – der Nutzer interagiert wirklich mit dem Simulator, nur geführt.

**Aufbau:**
```
#tut-overlay (fixed, z-index 900)
├── #tut-backdrop    ← dunkler Schleier mit ausgestanztem Loch (clip-path)
├── #tut-ring        ← goldener pulsierender Rahmen ums Zielelement
├── #tut-arrow       ← animierter Pfeil (👆/👉)
└── #tut-bubble      ← Sprechblase mit Text + Buttons
```

### 9.2 Schritt-Definition

Jeder Tutorial-Schritt ist ein Objekt in `TUT_STEPS`:

```javascript
{
  targetId:      "btn-start-tut",  // Welches Element spotlighten (oder null = zentriert)
  text:          "Jetzt Start drücken",  // Überschrift in der Blase
  sub:           "...",            // Erklärungstext
  waitForAction: true,             // true = wartet auf Nutzer-Aktion, false = "Weiter"-Button
  trigger:       "startPressed",   // Name des tutTrigger()-Aufrufs der den Schritt abschließt
  arrow:         "👆",            // Pfeil-Emoji (null = kein Pfeil)
}
```

### 9.3 Element-Mapping

Die Tutorial-IDs werden in `tutGetEl()` auf echte DOM-Selektoren gemappt:

```javascript
const map = {
  "title-bar-tut":   ".title-bar",
  "prog-001-tut":    "#prog-list .menu-item.sel",
  "micon-laden-tut": "#v-menu .micon:first-child",
  "vhbanner-tut":    "#vhbanner",
  "btn-start-tut":   "#btn-start",
};
```

### 9.4 Trigger-System

Wenn eine Nutzer-Aktion eintritt, rufen vorhandene Funktionen `tutTrigger(name)` auf. Das Tutorial prüft ob `name` zum aktuellen Schritt passt und rückt vor.

**Aktuell verknüpfte Aktionen:**

| tutTrigger-Name | Ausgelöst durch |
|---|---|
| `"openProgList"` | Tippen auf Programmname im Display |
| `"selectProg001"` | Tippen auf Menüeintrag in der Programmliste |
| `"loadProgDone"` | Tippen auf „↩ Laden" |
| `"tempReached"` | Vorheizphase abgeschlossen, `enableStart()` aufgerufen |

### 9.5 Scroll-Tracking

```javascript
window.addEventListener('scroll', () => {
  if(!tutActive) return;
  tutSpotlight(TUT_STEPS[tutStep].targetId);
}, {passive:true});
```

Der Spotlight-Rahmen wird bei jedem Scroll-Event neu positioniert – das Loch im Backdrop folgt dem Element.

### 9.6 Aktuelles Tutorial-Szenario

**„Programm wechseln"** – Ofen läuft auf Kornknacker, Ziel ist Schnittbrötchen:

| Schritt | Ziel | Wartet auf |
|---|---|---|
| 1 | Intro-Karte | — |
| 2 | Programmname im Display | Tippen → Menü öffnet |
| 3 | 001 in der Liste | Tippen → Eintrag gewählt |
| 4 | ↩ Laden | Tippen → Programm geladen |
| 5 | Vorheiz-Banner | Warten bis Temperatur erreicht |
| 6 | Start-Button | — |

---

## 10. Szenario-Tracker

Unter dem Simulator zeigt ein schwarzes Panel den Fortschritt beim **Kornknacker-Szenario**:

```
🎮 SZENARIO: 3 STIKKEN KORNKNACKER
① Produkt + Stikken wählen → Laden        [aktiv / erledigt / ausstehend]
② Vorheizen abwarten → Start wird gelb
③ Tür öffnen · Wagenantrieb · Wagen Rein
④ Tür schließen · Start drücken
⑤ Backzeit läuft (⏩ Vorspulen)
⑥ Tür öffnen · Wagen Raus · fertig!
```

**Funktionen:**
```javascript
scMark(i)    // Schritt i als "erledigt" markieren (grün, durchgestrichen)
scActive(i)  // Schritt i als "aktiv" hervorheben (gelb)
```

Schritte werden automatisch markiert wenn die entsprechenden Aktionen im Simulator ausgeführt werden – aber nur wenn das aktive Programm `003` ist.

---

## 11. Zustandsmaschine

Der Ofen-Zustand wird in der Variable `state` gespeichert:

```
"vorheiz"  →  "bereit"  →  "laeuft"
               ↑               ↓
               └── (Stop / Beenden / Fertig)
```

| Zustand | Bedeutung | Start-Button |
|---|---|---|
| `"vorheiz"` | Ofen heizt vor | gesperrt (grau) |
| `"bereit"` | Temperatur erreicht | aktiv (gelb) |
| `"laeuft"` | Backprogramm läuft | nicht relevant |

**Weitere Zustandsvariablen:**

```javascript
remaining    // Restbackzeit in Sekunden
realBaked    // Tatsächlich abgelaufene Backzeit in Sekunden
curTemp      // Aktuelle Ofentemperatur (simuliert)
nachSecs     // Nachbackzeit in Sekunden
doorOpen     // Tür offen? (boolean)
wagenLoaded  // Wagen drin? (boolean)
```

---

## 12. Erweiterung: Neue Programme / Produkte

### Schritt 1: Programm zu `PROGS` hinzufügen

```javascript
{ nr:"011", name:"DINKELBROT", temp:245, steam:2.0, mins:35,
  luft:true, dampf:true, klappe:true, tol:10 }
```

### Schritt 2: Produkt zu `BACKDB` hinzufügen

```javascript
{
  name: "Dinkelbrot",
  stikken: [
    { anzahl:1, prog:"011", progName:"DINKELBROT",
      startTemp:245, endTemp:238, mins:33, steam:1.5,
      luft:true, klappe:true, tol:10 },
    { anzahl:2, prog:"011", progName:"DINKELBROT",
      startTemp:245, endTemp:239, mins:35, steam:2.0,
      luft:true, klappe:true, tol:10 },
  ]
}
```

Das Produkt erscheint danach automatisch im Dropdown und in der Folgeprodukt-Empfehlung.

### endTemp ermitteln

`endTemp` ist die Ofentemperatur direkt nach dem Ausladen. Am echten Gerät ablesen und eintragen. Derzeit sind alle Werte auf ~97% der Starttemperatur geschätzt – Korrekturen willkommen.

---

## 13. Erweiterung: Neue Tutorials

Ein zweites Tutorial (z.B. „Erstmals einheizen") kann parallel zu `TUT_STEPS` definiert werden:

```javascript
const TUT_STEPS_EINHEIZEN = [
  { targetId: null, text: "Ofen einschalten", sub: "...", waitForAction: false },
  { targetId: "btn-start-tut", text: "...", waitForAction: true, trigger: "startPressed" },
  // ...
];
```

`tutStart()` müsste dann parametrisiert werden um das richtige Array zu übergeben. Neuer Trigger-Hook:

```javascript
// In doStart():
tutTrigger("startPressed");
```

Für jeden neuen Tutorial-Schritt der auf eine Nutzer-Aktion wartet: `tutTrigger("deinTriggerName")` in die entsprechende Funktion einfügen.

---

## 14. Bekannte Eigenheiten

| Thema | Details |
|---|---|
| **Zug-Simulation** | Die %-Anzeige simuliert den Öffnungsgrad, basiert aber auf geschätzter Zeitkurve. Echtes Verhalten noch nicht dokumentiert. |
| **endTemp-Werte** | Alle geschätzt (~97% Starttemp). Sollten mit echten Messwerten ersetzt werden. |
| **Spotlight scrollt mit** | Funktioniert per `scroll`-Listener. Bei sehr schnellem Scroll kann kurz ein Versatz sichtbar sein. |
| **Tutorial nur für Prog-Wechsel** | Aktuell ein Szenario. Weitere können nach dem gleichen Muster gebaut werden. |
| **HEUFT-Logo entfernt** | Absichtlich – Trademark-Risiko auf GitHub. Das Gehäuse ist neutral gestaltet. |
| **Audio nach erstem Tap** | Browser-Sicherheitsregel: Audio startet erst nach Nutzerinteraktion. Erster Tap entsperrt. |
| **Fast-Forward** | ⏩-Button springt auf 8 Sekunden Restzeit (nicht auf 0), damit das Beendet-Menü gesehen werden kann. |
| **Vorspulen Nachbackzeit** | Timer und Nachbackzeit-Schleife sind separate `setInterval`-Instanzen. Vorspulen wirkt nur auf laufenden Timer. |

---

## 15. Versions-Übersicht

| Version | Datei | Änderungen |
|---|---|---|
| v1 | `ofen_simulator.html` | Erster Prototyp, 8 Programme, grundlegende Zustände |
| v2 | `ofen_simulator_v2.html` | Echter Ablauf: Vorheizphase, Wagenantrieb-Screen, Eingabe-Numpad, Programmliste aus echten Fotos |
| v3 | `ofen_simulator_v3.html` | Technische Zeichnungs-Ästhetik (von Gemini-Mockup inspiriert), Tür-Button, Vorspulen |
| v4 | `ofen_simulator_v4.html` | Flacheres Design, nur Arial, kein Google Font, kein HEUFT-Logo |
| v5 | `ofen_simulator_v5.html` | Produkt-Datenbank, Dropdowns, Folgeprodukt-Panel |
| v3_fixed | `Ofen_Simulator_v3_fixed.html` | Zeiterfassung per Slot-Eingabe (H:MM:SS / MM:SS) statt Minuten-Eingabe |
| v3_fixed2 | `Ofen_Simulator_v3_fixed2.html` | Zug-%-Anzeige korrigiert (war Feuchte), Zug-Simulation |
| v3_sound | `Ofen_Simulator_v3_sound.html` | Web Audio API: Alarm (Timer-Ende), Elektromotor (Wagen) |
| v3_anim | `Ofen_Simulator_v3_anim.html` | Vorheiz-Balken, ZU KALT-Overlay, Programm-Wechsel-Transition *(später verworfen)* |
| v3_tutorial | `Ofen_Simulator_v3_tutorial.html` | Spotlight-Tutorial-System |
| **v3_tutorial2** | **`Ofen_Simulator_v3_tutorial2.html`** | **Aktueller Stand. Scroll-Tracking für Spotlight** |

**Empfehlung für GitHub:** Nur `Ofen_Simulator_v3_tutorial2.html` deployen. Alle Vorgänger können archiviert oder gelöscht werden.

---

*Dokumentation erstellt im Rahmen der BäckereiOS-Entwicklungssession, Mai 2026.*
