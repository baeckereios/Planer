# BäckereiOS — Vollständige Systemdokumentation
**Version 15 · GitHub Revision v11 · Stand: 2026-03-01**

---

## Was ist BäckereiOS?

BäckereiOS ist eine **Offline-PWA** für Froster-Produktionsplanung einer Bäckerei. Läuft vollständig im Browser, kein Server, wird über **GitHub Pages** ausgeliefert, auf Android/iOS installierbar.

- **Live:** `https://baeckereios.github.io/Planer`
- **Nutzer:** Ulf (Nachtschicht, Entwickler), Kollegen (Teigmacher, Rondo, Nachtschicht, Produktionsleiter)

```
/Planer/
  index.html                    Cockpit / Startseite
  setup.html                    8-Schritt-Assistent
  planer.html                   Produktionsplan
  schnellrechner.html           Einzel-Kalkulation (standalone)
  stammdaten.js                 Produktdaten (Readonly)
  inventurdaten.js              Frosterbestände (Ulf pflegt)
  froster_gehirn.js             Kern-Algorithmus (BOS_BRAIN)
  export.js                     WhatsApp/Druck-Export
  translations.js               Mehrsprachigkeit (BOS_LANG)
  systemdesign.css              Design-System
  service-worker.js             PWA Offline-Cache
  manifest.json                 PWA-Metadaten
  icon-192.png / icon-512.png   App-Icons
  admin_tools/
    admin_landing.html          Admin-Einstieg
    inventur_dateneingabe.html  Inventur-Tool (Pfade: ../)
```

---

## Das zentrale Problem (Warum 1+1≠2)

Produkt das heute im Laden gebraucht wird → musste **1–2 Tage vorher** produziert werden (Auftauzeit im Froster). Deshalb:

```
FALSCH: Produktion heute = Bedarf morgen
RICHTIG: Gesamtbedarf(heute→Ziel) - Frosterbestand = proportional auf Produktionstage verteilen
```

---

## Manifest & Spielregeln (ABSOLUT)

- **Logik vor Eleganz** — korrekte Berechnung > schöner Code
- **Keine stillen Architektur-Änderungen** — erst besprechen
- **Poka-Yoke** — Fehler durch Design verhindern
- **calcRowStatus-Mathematik nur nach Rücksprache ändern**
- **Hilfetexte in setup.html niemals kürzen**

---

## Index-Falle (immer beachten!)

| | Mo | Di | Mi | Do | Fr | Sa | So |
|-|----|----|----|----|----|----|-----|
| **BOS needs[]** | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| **JS getDay()** | 1 | 2 | 3 | 4 | 5 | 6 | 0 |

Umrechnung: `bosIdx = (jsDay === 0) ? 6 : jsDay - 1`

---

## BOS_SESSION — Das Kernobjekt

Wird in `setup.html` aufgebaut, in `localStorage['BOS_SESSION']` gespeichert, in `planer.html` geladen.

```javascript
sess = {
  selectedIds:    ["p1","p4"],        // Produkt-IDs
  inventory:      { "p4": 25 },       // Bestände (oder {p4:{stock:25,ts:…}})
  frosterDone:    true,               // true→startStep=2, false→startStep=1
  weekConfig: {
    0: {status:'auf', hamster:0, grill:false},  // JS-Index! 0=So
    1: {status:'auf', hamster:1, grill:true},   // 1=Mo
    // …bis 6=Sa
  },
  shortages:      { "p4": 5 },        // Fehlmengen für morgen
  targetDays:     { "p4": 2 },        // Planungsziel: JS-Wochentag (2=Di)
  productionDays: { "p4": [1,3,5] },  // Erlaubte Produktionstage (JS)
  station:        "Brötchenstraße",
  startDayIdx:    1,                  // JS-Wochentag heute (1=Mo)
  autoPlanning:   { "p4": [0,24,0,48] },
  prePlanned:     { "p4": [0,24,0,48] }
}
```

---

## stammdaten.js

```javascript
window.BOS_STAMMDATEN = {
  "p4": {
    "name":    "Kaesebroetchen",
    "needs":   [16,16,17,17,18,23,20], // BOS-Index: 0=Mo…6=So !!
    "sun":     5,    // Zusatzbedarf Grillwetter
    "unit":    0,    // 0=Bleche, 1=Pressen×(25/30)×1.06, 2=Pressen×(20/30), 3=Brühst.÷9
    "station": "Brötchenstraße",
    "step":    6     // Schrittgröße (optional, default=6)
  }
}
```

**18 Produkte:** p1 Hasenpfoten, p2 Laugenstangen(sun=10), p3 Rosinenbroetchen, p4 Kaesebroetchen(sun=5), p5 SchokoBatzen, p6 RosinenBatzen, p7 Zimtwolken(So=0), p11 Plunderstreifen(So=0), p12 Eiszapfen(nur Di/Do/Sa), p13 Puddingbrezeln(nur Mo/Mi/Fr), p14 Mohnschnecken(So=0) — alle Brötchenstraße. p8 Schlawiner(Brühst÷9), p9 Kornknacker(Pressen), p10 Hasenberger(Pressen), p177…98/04/85/26 Baguettes — alle Nachtschicht.

> **TODO:** Rondo, Frühschicht, Konditorei, Versand fehlen noch als Stationen.

---

## inventurdaten.js

```javascript
window.BOS_INVENTUR = {
  "products": {
    "p4": { "locs":[12,8,0,0], "stock":20, "ts":1735000000000 }
  },
  "stocks": { "p4": 20 }  // Schnell-Lookup
}
```

24h-Regel: `isFresh = ts > 0 && (Date.now() - ts) < 86_400_000` → sonst Bestand=0 + Warnung.

---

## froster_gehirn.js — window.BOS_BRAIN

### calculateChain(prodId, session, plannedProd)

Simuliert Bestandsverlauf. Prüft Lücken. Live bei jeder Eingabe in planer.html aufgerufen.

```javascript
// startStep = frosterDone ? 2 : 1
// actualConsumption = 0 wenn i < startStep

getAdjustedNeed(dIdx, isDayZero):
  bosIdx = (dIdx === 0) ? 6 : dIdx - 1
  base   = p.needs[bosIdx]
  if (status==='zu') return 0
  if (hamster===1) adj = ceil(adj*1.5)
  if (hamster===2) adj = ceil(adj*2.0)
  if (grill && sun) adj += p.sun
  if (isDayZero) adj += shortage

Rückgabe je chain[i]:
  stepIdx, dayIdx, dayName
  need, actualConsumption, planned
  stockAfterNeed    // NACH Verbrauch, VOR Produktion
  restAfter         // NACH Verbrauch + Produktion
  isWarning         // isDayBroken || isNextMorningInDanger

isDayBroken = stockAfterNeed < 0
isNextMorningInDanger = (i >= startStep-1) && (stockForTomorrow < nextNeed) && (i < totalSteps)
```

### calculateAutoPlanning(prodId, session)

4 Phasen:

```
Phase 1: Gewichte berechnen
  weight = verbrauch[eigenerTag] + alle Folgetage bis nächster ProdTag + verbrauch[nächsterProdTag]

Phase 2: Proportionale Verteilung
  share = weight / totalWeight
  planned[step] = ceil(totalNeeded * share / STEP) * STEP

Phase 3: Sicherheits-Pass
  Bestand negativ → vorheriger ProdTag += ceil(-rest/STEP)*STEP

Phase 4: Überhang-Trim
  maxAcceptable = targetConsumption + STEP
  while (finalStock - STEP > maxAcceptable && planned[last] >= STEP):
    planned[last] -= STEP
```

### STEP-System

`const STEP = p.step || 6` — Standard 6, individuell je Produkt in stammdaten.js setzbar.

---

## setup.html (1418 Zeilen)

**Globale Variablen:**
```javascript
let currentStep = 0, maxUnlocked = 0;
let sess = { selectedIds:[], inventory:{}, frosterDone:null, weekConfig:{},
             shortages:{}, targetDays:{}, station:"", productionDays:{},
             autoPlanning:null, startDayIdx:new Date().getDay() };
const STATIONS = ["Brötchenstraße","Nachtschicht","Frühschicht","Rondo","Konditorei","Versand"];
```

**8 Schritte:** 1=startDayIdx, 2=selectedIds, 3=inventory(24h-Check), 4=frosterDone(Poka-Yoke!), 5=weekConfig, 6=shortages, 7=targetDays, 8=productionDays→AutoPlanning

**Funktionen:** init, renderStartDay, renderProducts, renderInv, overrideInv, renderWeek, cycleHamster, toggleAufZu, toggleGrill, toggleAllGrill, renderExtra, renderTarget, setTarget, setFrosterStatus, goToStep, nav, validateStep, validate, refreshUI, finishSetup

---

## planer.html (731 Zeilen)

```javascript
let sess = null;
let todayJS = new Date().getDay();  // → überschrieben durch sess.startDayIdx
let productionPrintData = {};
const domCache = {};  // {prodId: {card, badge, rows:[{need,inp,bub,line}]}}
```

**Funktionen:** init (Retry-Mechanismus), buildDOM, calculateMath, resetAll, printPlan

**calcRowStatus (TABU):** stockAfterNeed<0 → rot | isWarning → gelb | restAfter>=nextConsumption → grün

---

## schnellrechner.html (273 Zeilen)

```javascript
let todayIdx    = (new Date().getDay()===0) ? 6 : new Date().getDay()-1; // BOS-Index!
let targetIdx   = null;   // Wochentag-Index (0–6)
let targetOffset = null;  // !! Absoluter Abstand Tage (2–9) — verhindert Doppel-Wochentag-Verwechslung
let frosterDone = null;

let simClosed  = {};  // KEY = OFFSET (nicht Wochentag!): simClosed[3]="3 Tage ab heute zu"
let simHamster = {};  // KEY = OFFSET
let simSun     = {};  // KEY = OFFSET
```

**Warum Offset-Keys?** simClosed[dIdx] würde Mi dieser Woche = Mi nächster Woche. simClosed[i] unterscheidet sie eindeutig.

**calculate():** `for i=offset to targetOffset: dIdx=(todayIdx+i)%7; need = simClosed[i]?0:p.needs[dIdx]`

**Funktionen:** applyLang, init, renderToday, resetTarget, renderTarget, buildSandbox, setFroster, calculate, syncStock

---

## inventur_dateneingabe.html

**Pfade:** `../systemdesign.css`, `../stammdaten.js`, `../inventurdaten.js`

```javascript
let workingData  = {};  // {k: {locs:[0,0,0,0], stock:0, ts:0}}
let activeStation = 'alle';
```

**Funktionen:** prepareData, buildStationFilter (dynamisch!), renderList (4 Felder+Summe), updateLoc, generateInventurJS

**Workflow:** Zählen (~5min) → Eingabe → GENERIEREN → GitHub Upload (~1min) → alle Geräte aktuell

---

## 🚫 Tabu-Zonen

1. **Poka-Yoke Froster** (setup.html Schritt 4) — 2 Buttons, kein Default, niemals Vorauswahl
2. **calcRowStatus-Mathematik** (planer.html) — nur nach Absprache
3. **calculateChain-Kern** (froster_gehirn.js) — isDayBroken/isNextMorningInDanger/startStep nicht anfassen
4. **Hilfetexte setup.html** — niemals kürzen

---

## Deployment

1. Dateien auf GitHub hochladen
2. service-worker.js Cache-Version +1
3. service-worker.js auch hochladen
4. Clients aktualisieren sich automatisch beim nächsten Online-Start

---

## Roadmap

- [ ] Stationen vervollständigen (Rondo, Frühschicht, Konditorei, Versand)
- [ ] step je Produkt nach Stikken-Abstimmung eintragen
- [ ] Schnellrechner Offset-System verifizieren
- ❌ Kein Backend (bewusst)
- ❌ Kein Inventur-Autosync (bewusst)

---

## Quick Debug

```javascript
// Browser-Konsole:
window.BOS_STAMMDATEN   // Produkte geladen?
window.BOS_INVENTUR     // Bestände geladen?
window.BOS_BRAIN        // Algorithmus geladen?
JSON.parse(localStorage.getItem('BOS_SESSION'))  // Session?
```

Clients laden alte Version → service-worker.js Cache-Version vergessen.
Schnellrechner rechnet nicht → frosterDone null (Button nicht gedrückt).
Schnellrechner falsche Folgewoche → targetOffset prüfen.
