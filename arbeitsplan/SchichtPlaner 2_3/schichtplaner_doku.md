# SchichtPlaner — Systemdokumentation
*Nachtschicht-Arbeitsplanung · BäckereiOS*  
*Stand: April 2026 — vollständig überarbeitet*

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Dateistruktur & Architektur](#2-dateistruktur--architektur)
3. [Config-Struktur](#3-config-struktur)
4. [State-Management & Datenladen](#4-state-management--datenladen)
5. [Positionen](#5-positionen)
6. [Personen](#6-personen)
7. [Tagesplan-Algorithmus](#7-tagesplan-algorithmus)
8. [Freie Tage — Auto-Verteilung](#8-freie-tage--auto-verteilung)
9. [Frühschicht-System](#9-frühschicht-system)
10. [Urlaub (geplant)](#10-urlaub-geplant)
11. [Fehlzeiten (spontan)](#11-fehlzeiten-spontan)
12. [Manuelle Overrides & Platzhalter](#12-manuelle-overrides--platzhalter)
13. [Sonderschicht & Verfügbar](#13-sonderschicht--verfügbar)
14. [Joker-System & Vorschläge](#14-joker-system--vorschläge)
15. [Aktionszentrale](#15-aktionszentrale)
16. [Verdrängungslogik](#16-verdrängungslogik)
17. [Azubi-Logik](#17-azubi-logik)
18. [Plan-Export & Import](#18-plan-export--import)
19. [Drucklayout](#19-drucklayout)
20. [Public API (FLUSS_LOGIK)](#20-public-api-fluss_logik)
21. [UI-Komponenten & Flows](#21-ui-komponenten--flows)
22. [BäckereiOS-Integration](#22-bäckereios-integration)
23. [Bekannte Grenzen & offene Punkte](#23-bekannte-grenzen--offene-punkte)
24. [Arbeitsanweisung: Refactoring](#24-arbeitsanweisung-refactoring)

---

## 1. Überblick

Der **SchichtPlaner** ist ein wochenbasiertes Arbeitsplan-Tool für die Nachtschicht-Bäckerei Langrehr. Es löst die tägliche Frage: *"Wer macht was heute Nacht?"*

### Kernprinzipien

- **Kaskade statt Starrhierarchie**: Stammkräfte haben ihre feste Position. Sind sie abwesend, rückt die nächstbeste Person nach — automatisch nach definierten Regeln.
- **Freie Tage als Ressource**: Pro Woche bekommt jede Person einen freien Tag. Ein Score-Algorithmus mit Plan-Simulation verteilt fair und vermeidet Azubi-Einsätze auf 22 Uhr.
- **Joker als Signal**: Kein qualifizierter Mitarbeiter verfügbar → Joker (Heinrich) erscheint als rote Warnung mit Lösungsvorschlägen.
- **Manuelle Eingriffe ohne Datenverlust**: Overrides, Fehlzeiten, Urlaubsplanung — der Algorithmus füllt den Rest.
- **JSON als Wahrheit**: Stammdaten (Personen, Positionen, Urlaub, Frühschicht) kommen aus der deployten `schichtplaner_config.json`. Planungsdaten (freieTage, fehlzeiten, manuelleZuweisungen) sind gerätespezifisch im localStorage.

---

## 2. Dateistruktur & Architektur

```
BäckereiOS-Root/
├── index.html                      — Cockpit (SchichtPlaner-Kachel)
├── shell.js                        — BäckereiOS Shell (Header, Tab-Leiste)
├── schichtplaner_config.json       — Stammdaten (deployed, für alle Geräte)
│
├── arbeitsplan/
│   ├── schichtplaner.html          — Haupt-UI, Rendering, Modals, Tabs
│   ├── fluss_logik.js              — Reines Rechenmodul (kein DOM), IIFE
│   └── schichtplaner_hilfe.html    — Hilfe-Seite (15 Kapitel)
│
└── AdminTools/
    └── schichtplaner_config.html   — Config-Editor (6 Tabs)
```

### Verantwortlichkeiten

| Datei | Verantwortung |
|---|---|
| `fluss_logik.js` | Algorithmen, Berechnungen, kein DOM |
| `schichtplaner.html` | Rendering, User-Interaktion, localStorage |
| `schichtplaner_config.json` | Stammdaten für alle Geräte (deployed) |
| `schichtplaner_config.html` | Config-Editor (Personen, Positionen, Urlaub, Frühschicht) |

### Shell-Integration

`shell.js` injiziert automatisch Header (`← Cockpit | BäckereiOS | SchichtPlaner`) und Tab-Leiste. Subfolder-Erkennung ist für `/arbeitsplan/` und `/AdminTools/` konfiguriert.

Modal-Overlays verwenden `z-index: 600` (über Shell-Header mit `z-index: 500`).

Alle drei Dateien definieren Shell-Fallback-Variablen in `:root`:
```css
--surface: #ffffff; --surface2: #f5f2ee; --border-s: #d8d2c8; --dim: #7a6e64;
```

---

## 3. Config-Struktur

Die `schichtplaner_config.json` enthält alle Stammdaten. Planungsdaten leben im localStorage.

```json
{
  "positionen": [...],
  "personen": [...],
  "joker": "Heinrich",
  "azubiGesperrteAttribute": ["versand"],

  "fruehschichtEinsaetze": [
    {
      "personId": "heinzi",
      "block": "anfang",
      "von": "2026-04-20",
      "bis": "2026-05-10"
    }
  ],

  "urlaub": {
    "dominik": [
      { "von": "2026-04-19", "bis": "2026-05-03", "notiz": "Osterurlaub" }
    ]
  }
}
```

Planungsdaten (nur localStorage, gerätespezifisch):
```json
{
  "fehlzeiten": [
    { "personId": "lars", "typ": "krank", "von": "2026-04-21", "bis": "2026-04-21" }
  ],
  "freieTage": {
    "2026-W17": {
      "rosa":     { "tag": "montag",   "typ": "auto"    },
      "harrison": { "tag": "dienstag", "typ": "wunsch"  },
      "lars":     { "tag": "freitag",  "typ": "manuell" }
    }
  },
  "manuelleZuweisungen": {
    "2026-04-25": {
      "kamut": "heinzi",
      "rheon": "__Wird geklärt"
    }
  }
}
```

**Platzhalter in manuelleZuweisungen**: Werte die mit `__` beginnen sind Freitext-Platzhalter (keine echte PersonId). Der Algorithmus behandelt die Position als besetzt, ohne eine Person einzuplanen.

---

## 4. State-Management & Datenladen

### localStorage Key
```javascript
const STORAGE_KEY = 'schichtplaner_v1';
// Migration von fluss_config_v1 automatisch beim ersten Start
```

### loadConfig() — Ladereihenfolge

```javascript
async function loadConfig() {
  // 1. Planungsdaten aus localStorage (gerätespezifisch)
  let planDaten = { fehlzeiten, freieTage, manuelleZuweisungen };

  // 2. Stammdaten IMMER aus JSON (deployed = Wahrheit für alle Geräte)
  const json = await fetch('../schichtplaner_config.json');
  config = {
    // Aus JSON:
    positionen, personen, joker, azubiGesperrteAttribute, urlaub, fruehschichtEinsaetze,
    // Aus localStorage:
    fehlzeiten, freieTage, manuelleZuweisungen
  };
}
```

**Kritisch**: Stammdaten kommen immer aus der JSON-Datei. Nach jeder Änderung im Config-Editor muss exportiert und deployed werden, damit alle Geräte die neue Config erhalten.

---

## 5. Positionen

```json
{
  "id": "versand_e1",
  "label": "Versand E1",
  "attribut": "versand",
  "gesperrtAm": [],
  "prioritaet": 3
}
```

### Prioritätsbedeutung
- **1 (kritisch)**: Muss besetzt sein.
- **2 (mittel)**: Sollte besetzt sein.
- **3 (Joker-OK)**: Kann im Notfall mit Joker laufen. Joker werden bevorzugt hier platziert.

---

## 6. Personen

```json
{
  "id": "lars",
  "name": "Lars",
  "attribute": ["teigmacher", "rheon", "22uhr", "kamut"],
  "stammkraft_von": null,
  "wunschFreierTag": "mittwoch",
  "gesperrt": [],
  "azubi": false
}
```

**Attribut-Reihenfolge**: Attribut 1 = bevorzugte Einsatzposition, beeinflusst Kaskaden-Logik.

---

## 7. Tagesplan-Algorithmus

`berechneTagesplan(config, date)` in `fluss_logik.js`. Läuft für jeden der 6 Tage (Mo–Sa) separat.

### Phasen

```
Phase 0: Gesperrte Positionen markieren
Phase 1: Manuelle Vorbelegung (höchste Priorität, inkl. Platzhalter)
Phase 2: Positionen sortieren (Prio + Kandidatenengpass)
Phase 3: Hauptschleife — pro Position:
           Stammkraft → Kaskade → Wolke → Azubi (letzter Griff) → Joker
Phase 4: Fix-up-Pass (Joker durch einstufigen Tausch auflösen)
Phase 5: Sonderschicht, Verfügbar, Frühschicht berechnen
```

### Verfügbarkeits-Check `isPersonVerfuegbar()`

Person ist **nicht** verfügbar wenn:
1. `gesperrt[]` enthält den heutigen Wochentag
2. `isPersonFehlendGesamt()` → krank/urlaub (fehlzeiten) ODER geplanter Urlaub (config.urlaub)
3. `isPersonFruehschicht()` → aktiver Frühschicht-Einsatz an diesem Tag
4. Freier Tag dieser Woche trifft auf diesen Tag

### Azubi-Sperre in Frühschicht-Wochen

In Wochen wo ein Frühschicht-Einsatz aktiv ist, wird `22uhr` automatisch zu `azubiGesperrteAttribute` hinzugefügt:

```javascript
const hatFruehschichtDieseWoche = config.fruehschichtEinsaetze.some(e =>
  weekKey >= getWeekKey(new Date(e.von)) && weekKey <= getWeekKey(new Date(e.bis))
);
const azubiGesperrt = [
  ...(config.azubiGesperrteAttribute || ['versand']),
  ...(hatFruehschichtDieseWoche ? ['22uhr'] : [])
];
```

### Fix-up-Pass

Nach dem Hauptdurchlauf: prüfe ob ein Joker durch einstufigen Tausch aufgelöst werden kann. Beispiel: Felix auf 22 Uhr, Rheon hat Joker → Heinzi kann 22 Uhr + Rheon → tausche: Heinzi zu Rheon, Felix bleibt auf 22 Uhr → Joker weg.

**Limitierung**: Nur einstufige Ketten. A→B→C-Tausche werden nicht erkannt.

---

## 8. Freie Tage — Auto-Verteilung

`autoVerteilFreieTage(config, weekKey)` — Score-Algorithmus mit Plan-Simulation.

### Verarbeitungsreihenfolge

**Nicht-22uhr-Personen zuerst** (Rosa, Harrison, Jörg, Dominik), dann **22uhr-Personen** (Lars, Marcel, Pastor, Heinzi). Dadurch weiß die Simulation für Marcel, dass Rosa bereits Montag hat — und bestraft diesen Tag korrekt.

### Score-Formel

```
Score(Person P, Tag T) =
  tagZaehler[T]                           // Gleichverteilung über Woche
  + (historischeHäufigkeit[P][T] × 2)     // Fairness über Wochen
  - (sperrtagePos.includes(T) ? 0.5 : 0)  // Stammkraft-Bonus (Tiebreaker)
  + planSimulation(P, T)                  // +10 wenn 22 Uhr beim Azubi landet
```

### Plan-Simulation

Für jeden Kandidaten-Tag wird `berechneTagesplan()` simuliert:
```javascript
const testPlan = berechneTagesplan(testConfig, wochentage[tIdx]);
const azubiAuf22uhr = Object.entries(testPlan.zuweisung).some(([posId, z]) => {
  const pos = positionen.find(pp => pp.id === posId);
  return pos?.attribut === '22uhr' && z.personId === azubi.id;
});
if (azubiAuf22uhr) azubiStrafe = 10;
```

### Frühschicht-Bonus

Personen in aktiven Frühschicht-Einsätzen werden bei der Tageswahl korrekt berücksichtigt (`isPersonFruehschichtInWoche()`). Ihre Frühschicht-Tage gelten als Arbeitstage, nicht als freie Tage.

---

## 9. Frühschicht-System

### Konzept

Wenn zu viele Mitarbeiter da sind (Vollbesetzung), gehen Marcel oder Heinzi abwechselnd für einen Zeitraum in die Frühschicht. Sie sind dann für 3 Tage (Mo/Di/Mi oder Do/Fr/Sa) aus der Nachtschicht heraus und erscheinen als eigene Zeile im Plan.

### Einsatz-Schema

```json
{
  "personId": "heinzi",
  "block": "anfang",
  "von": "2026-04-20",
  "bis": "2026-05-10"
}
```

- `block: "anfang"` = Mo/Di/Mi
- `block: "ende"` = Do/Fr/Sa

### Tagesblöcke

```javascript
const FRUEHSCHICHT_ANFANG = ['montag','dienstag','mittwoch'];
const FRUEHSCHICHT_ENDE   = ['donnerstag','freitag','samstag'];
```

### Wochenbasierte Prüfung (für Freie-Tage-Verteilung)

```javascript
function isPersonFruehschichtInWoche(personId, tagName, weekKey, config) {
  return config.fruehschichtEinsaetze.some(e => {
    const vonWoche = getWeekKey(new Date(e.von));
    const bisWoche = getWeekKey(new Date(e.bis));
    return weekKey >= vonWoche && weekKey <= bisWoche &&
      (e.block === 'anfang' ? FRUEHSCHICHT_ANFANG : FRUEHSCHICHT_ENDE).includes(tagName);
  });
}
```

### Anzeige

Frühschicht-Zeile erscheint im Plan unterhalb der Positionen, oberhalb der Trennlinie. Nur wenn aktiver Einsatz vorhanden.

### Dokumentation (Config-Editor)

Tab "Frühschicht" in `schichtplaner_config.html`:
- Einsätze anlegen (Person, Block, Von/Bis)
- Status: Aktiv / Geplant / Abgeschlossen
- Dokumentations-Tabelle: Wer hatte wie viele Frühschicht-Wochen

---

## 10. Urlaub (geplant)

Geplanter Urlaub wird in `schichtplaner_config.json` unter `urlaub` gespeichert. Er gilt für alle Geräte nach dem nächsten Deploy.

### Schema

```json
"urlaub": {
  "dominik": [
    { "von": "2026-04-19", "bis": "2026-05-03", "notiz": "Osterurlaub" }
  ]
}
```

### Verarbeitung

`isPersonFehlendGesamt()` kombiniert spontane Fehlzeiten und geplanten Urlaub:

```javascript
function isPersonFehlendGesamt(personId, dateISO, config) {
  if (isPersonFehlend(personId, dateISO, config.fehlzeiten)) return true;
  const urlaubEintraege = (config.urlaub || {})[personId] || [];
  return urlaubEintraege.some(e =>
    e.von && e.bis && dateISO >= e.von && dateISO <= e.bis
  );
}
```

Urlaubspersonen erscheinen in der KRANK/URLAUB-Zeile des Plans mit 🌴.

### Workflow

1. Config-Editor → Tab "Urlaub" → Person aufklappen → Zeitraum + Notiz eingeben
2. Config-Editor → Tab "Daten" → **"Config exportieren"**
3. `schichtplaner_config.json` in Root-Ordner → Deploy
4. Alle Geräte laden beim nächsten Start die neue Config

---

## 11. Fehlzeiten (spontan)

Spontane Einträge (krank, kurzfristiger Urlaub) werden im localStorage gespeichert. Nur gerätespezifisch — werden **nicht** deployed.

```json
"fehlzeiten": [
  { "personId": "lars", "typ": "krank", "von": "2026-04-21", "bis": "2026-04-21" }
]
```

Eingabe: Tab "Fehlzeiten" im Planer oder Tap auf Plan-Zelle → "🤒 Fehlzeit" Tab.

---

## 12. Manuelle Overrides & Platzhalter

### Manuelle Overrides

```json
"manuelleZuweisungen": {
  "2026-04-25": {
    "kamut": "heinzi_1234"
  }
}
```

Werden in Phase 1 des Algorithmus **vor** allen anderen Berechnungen angewendet. Freier Tag wird ignoriert (manuell = bewusste Entscheidung). Krank/Urlaub blockiert auch manuelle Overrides.

### Platzhalter

Werte mit `__`-Präfix sind Freitext-Platzhalter:

```json
"manuelleZuweisungen": {
  "2026-04-25": {
    "kamut": "__Wird geklärt"
  }
}
```

- Position gilt als besetzt (kein Joker, keine Berechnung)
- Keine echte Person wird zur `zugewiesen`-Menge hinzugefügt
- Anzeige: grau, gestrichelt, kursiv
- Vorherige Person wird durch den Algorithmus neu eingeplant

Eingabe: Tap auf Zelle → "✏️ Person ändern" → Freitextfeld "Platzhalter".

---

## 13. Sonderschicht & Verfügbar

### Verfügbar-Zeile

Zeigt Personen die an einem Tag nicht eingeplant wurden, aber verfügbar wären.

Mo–Fr: zeigt `verfuegbarUnbesetzt[]`
Sa: zeigt `sonderschicht[]` (mit "optional"-Label) **und** `verfuegbarUnbesetzt[]` ohne Sonderschicht-Überschneidung

### Sonderschicht (Sa)

Eine Person qualifiziert sich für Sonderschicht auf Samstag wenn:
1. Sie in `verfuegbarUnbesetzt` auf Samstag ist
2. Ihr freier Tag ein Wochentag (Mo–Fr) ist

Anzeige: blaue Zelle, "optional"-Label.

---

## 14. Joker-System & Vorschläge

### Joker

Wenn nach allen Phasen inkl. Fix-up-Pass eine Position keinen qualifizierten Mitarbeiter hat: Joker. Der Joker-Name kommt aus `config.joker` (Standard: "Heinrich"). Anzeige: rote Zelle, "Joker!"-Label.

### Vorschläge `berechneVorschlaege()`

Für **jeden Joker-Tag separat** wird gesucht:
1. Wer hat an diesem Tag frei? (nur `typ: 'auto'`)
2. **22uhr-fähige Personen zuerst** sortiert
3. Für jeden Kandidaten: simuliere alle möglichen Ziel-Tage
4. Akzeptiere nur wenn: Joker-Anzahl **sinkt** (Gesamt-Joker-Count vorher vs. nachher)

```javascript
const jokerVorher = wochenplan.reduce((sum, t) =>
  sum + Object.values(t.zuweisung).filter(z => z.status === 'joker').length, 0);
const jokerNachher = testPlan.reduce(...);
if (jokerNachher >= jokerVorher) continue; // ablehnen
```

---

## 15. Aktionszentrale

Immer sichtbar unterhalb der Plan-Tabelle. Zeigt:

| Status | Anzeige |
|---|---|
| Alles OK | Grüne Box |
| Joker vorhanden | Rote Karte(n) pro Joker |
| Lösungsvorschläge | Gelbe Box mit "Übernehmen"-Buttons |
| Verdrängungshinweis | Gelbe Box mit Ja/Nein |
| Freier Tag verloren | Gelbe Box mit Ersatz-Vorschlag |

---

## 16. Verdrängungslogik

Entsteht bei manuellen Overrides. Zwei Fälle:

### Fall A: Person verdrängt

Neue Person Y auf Position P, alte Person X ist jetzt unbesetzt → Angebot: X bekommt diesen Tag als freien Tag.

### Fall B: Eigener freier Tag geopfert

Y wird auf P gesetzt, aber P's Datum ist Y's freier Tag → freier Tag wird annulliert, Ersatz-Tag wird vorgeschlagen (bevorzugt Samstag wenn Y nicht eingeplant, sonst letzter verfügbarer Wochentag).

### Bekanntes Problem

Bei **mehreren hintereinander** ausgeführten manuellen Eingriffen kann der State inkonsistent werden. Der Algorithmus kennt nicht die "Absicht" hinter einer Kette von Änderungen. **Empfehlung**: Woche zurücksetzen → neu auto-verteilen → gezielt einen einzelnen Eingriff.

---

## 17. Azubi-Logik

### Grundregeln

1. Azubis werden immer **zuletzt** eingeplant (nach allen anderen Optionen)
2. Azubis dürfen keine Attribute aus `azubiGesperrteAttribute` besetzen (Standard: `["versand"]`)
3. In Frühschicht-Wochen: automatische Zusatzsperre für `"22uhr"`
4. Eigene Zeile im Plan: zeigt Lernt / Schule / Frei / Positions-Einsatz

### Azubi-Zeile Anzeige

```
AZUBI  [Lernt] [Lernt] [22 Uhr] [Lernt] [Schule] [Frei]
```

Freitag = "Schule" (hardcoded für Bäckerei Langrehr).

### Status-Anzeige in Freie-Tage-Tab

Wenn Frühschicht-Woche aktiv:
```
🔒 Felix ist diese Woche automatisch für 22 Uhr gesperrt — Frühschicht-Woche, Azubi soll lernen.
```

---

## 18. Plan-Export & Import

### Export `exportArbeitsplan()`

Generiert `arbeitsplan_nachtschicht.js` mit allen freieTage, manuelleZuweisungen als JS-Datei. Dient der Histories-Fortführung.

### Import `importArbeitsplanJS()`

Lädt bestehende JS-Datei, merged mit aktueller Config (bestehende Wochen bleiben, importierte überschreiben).

### Workflow (Histiorie aufbauen)

**⟳ Workflow-Button** im Plan klappt geführte Box auf:
1. **Laden** — bestehende Wochen importieren
2. **Planen** — aktuelle Woche bearbeiten
3. **Speichern** — exportieren

---

## 19. Drucklayout

`drucken()` öffnet ein eigenes Fenster mit sauberem HTML-Dokument (kein CSS-Print-Hack).

### Layout A4 Querformat

```
╔════════════════════════════════════════════════════╗
║ BäckereiOS          KW 17        Bäckerei Langrehr ║
║ Schichtplan Nachtschicht  20.04–25.04  14.04.2026  ║
╠════════════════════════════════════════════════════╣
║ TEIGMACHER  Jörg   Lars   Jörg   Jörg   Jörg  Lars ║
║ KAMUT       Dom    Dom    Dom    Dom    Dom    —    ║
║ ...                                                ║
║ AZUBI       Lernt  Lernt  22Uhr  Lernt  Schule Frei║
║ FREI        Rosa   Harr   Past   Lars   ...        ║
║ KRANK/URL   🌴Dom  🌴Dom  🌴Dom  ...              ║
╠════════════════════════════════════════════════════╣
║ ● Stammkraft  ● Kaskade  ● Wolke  ● Joker  ✓ OK  ║
╚════════════════════════════════════════════════════╝
```

Azubi-Zelle zeigt nur wenn wirklich auf Position eingeplant — sonst "Lernt" in gedimmtem Kursiv.

---

## 20. Public API (FLUSS_LOGIK)

IIFE-Pattern: `var FLUSS_LOGIK = (function(){...})()`. `var` statt `const` für sicheres globales Scope auf GitHub Pages.

### Exportierte Funktionen

| Funktion | Beschreibung |
|---|---|
| `getMondayOfWeek(date)` | Montag der Woche |
| `getWeekKey(monday)` | `"2026-W17"` |
| `getWeekDates(monday)` | Date[] Mo–Sa |
| `getMondayFromWeekKey(weekKey)` | Date aus WeekKey (für Plan-Simulation) |
| `dateToISO(date)` | `"2026-04-21"` |
| `formatDatum(dateISO)` | `"21.04."` |
| `berechneTagesplan(config, date)` | Vollständiger Tagesplan |
| `berechneWochenplan(config, monday)` | 6 Tagespläne |
| `autoVerteilFreieTage(config, weekKey)` | Score-Verteilung |
| `autoVerteilVarianten(config, weekKey, n)` | Bis zu n Varianten |
| `berechneVorschlaege(config, weekKey, monday)` | Joker-Lösungsvorschläge |
| `getFreierTag(personId, weekKey, freieTage)` | Freier Tag einer Person |
| `getFreierTagTyp(...)` | `'auto'` / `'wunsch'` / `'manuell'` |
| `getFreierTagHistorie(config, excludeWeek)` | Historische Häufigkeiten |
| `isPersonFruehschicht(personId, tagName, dateISO, config)` | Datumsbasiert |
| `isPersonFruehschichtInWoche(personId, tagName, weekKey, config)` | Wochenbasiert |
| `getFruehschichtPerson(tagName, dateISO, config)` | Wer ist heute Frühschicht? |
| `TAG_NAMEN` | `['sonntag','montag',...]` |
| `TAG_KURZ` | `['So','Mo',...]` |

---

## 21. UI-Komponenten & Flows

### Plan-Tabelle (vertikal)

```
TEIGMACHER    [Mo] [Di] [Mi] [Do] [Fr] [Sa]
KAMUT         [Mo] [Di] [Mi] [Do] [Fr] [--]
...
VERFÜGBAR     [  ] [Ha] [  ] [  ] [La] [La*]  ← * = optional/Sonderschicht
──────────────────────────────────────────────
AZUBI         [Fe] [Le] [Le] [Le] [Sc] [Fr]
FREI          [Ro] [Ha] [Pa] [La] [  ] [He]
KRANK/URLAUB  [🌴 Do] [🌴 Do] ...
FRÜHSCHICHT   [🌅 He] [🌅 He] [🌅 He]
```

Samstag Verfügbar-Zeile: zeigt `sonderschicht` (optional) UND `verfuegbarUnbesetzt`.

### Farbschema

| Status | Farbe | Bedeutung |
|---|---|---|
| `stammkraft` | Grün | Stammkraft auf eigenem Platz |
| `kaskade` | Amber/Gelb | Stammkraft fehlt, jemand springt ein |
| `wolke` | Blau | Flexible Reserve ohne feste Position |
| `joker` | Rot | Kein Qualifizierter verfügbar |
| `gesperrt` | Grau | Position heute nicht aktiv |
| `manuell` | Lila | Manuell gesetzt |
| Platzhalter | Gestrichelt grau | Freitext, kein echter Mitarbeiter |

### Zell-Tap → Sheet

Tab "🤒 Fehlzeit": Krank/Urlaub mit Schnellauswahl  
Tab "✏️ Person ändern": Dropdown + Freitextfeld für Platzhalter

### Freie-Tage-Tab

- **Status-Banner**: "✓ Alle haben freien Tag" oder "⚠ Lars, Heinzi haben noch keinen"
- **Azubi-Banner**: Erscheint in Frühschicht-Wochen mit Sperr-Hinweis
- **Auto-Verteilen** mit bis zu 3 Varianten
- **Zurücksetzen** (freieTage + manuelleZuweisungen)
- **Freie Tage Wünsche** (Akkordeon, live `onchange`)

---

## 22. BäckereiOS-Integration

### Cockpit

SchichtPlaner-Kachel: Position 2 (Mitte Reihe 1), grün `#2d6a4f`, Icon `ph-calendar-check`.

### Tab-Leiste

| Tab | Ziel |
|---|---|
| Start | `index.html` |
| Druck | `druckzentrale/druckzentrale.html` |
| Brett | `index.html#brett` |
| Mehr | `index.html#mehr` |

### PAGE_CONFIG in shell.js

```javascript
'schichtplaner.html':        { title: 'SchichtPlaner', mode: 'full', tab: 'start' },
'schichtplaner_config.html': { title: 'Konfiguration', mode: 'full', tab: 'start' },
'schichtplaner_hilfe.html':  { title: 'Hilfe',         mode: 'full', tab: 'start' },
```

---

## 23. Bekannte Grenzen & offene Punkte

### Hardcoded

| # | Datei | Was | Fix |
|---|---|---|---|
| 1 | `fluss_logik.js` | Wochenlänge Mo–Sa hardcoded | `getWeekDates()` length: 6 → 7 |
| 2 | `fluss_logik.js` | Sonderschicht nur Samstag | Ruhetag konfigurierbar machen |
| 3 | `schichtplaner.html` | Freitag = "Schule" (Azubi) | Konfigurierbar |

### Algorithmische Grenzen

| Thema | Beschreibung |
|---|---|
| Fix-up-Pass | Nur einstufige Tauschketten. A→B→C nicht lösbar. |
| Manuelle Kaskaden | Mehrere hintereinander ausgeführte manuelle Eingriffe können inkonsistenten State erzeugen. Lösung: Zurücksetzen. |
| Vorschläge | Finden nur Einzelpersonen-Lösungen, keine Zwei-Personen-Tausche. |

### Offene Ideen

- **Entwurfsmodus**: Änderungen in temporärer Kopie, Übernehmen/Verwerfen
- **Plan-Validator**: Entwurf analysieren → Schwachstellen benennen
- **Mehrstufen-Tauschvorschläge**: A→B→C-Ketten
- **Messschieber**: Berechnungsfenster manuell verschieben bei schlechten Daten

---

## 24. Arbeitsanweisung: Refactoring

### Ausgangslage

`schichtplaner.html` ist mit über 100kb / ~2800 Zeilen ein Monolith. Alles in einer Datei: Rendering, Modals, Tabs, State-Management, Drucklogik. Das macht Änderungen fehleranfällig.

### Ziel-Architektur

```
arbeitsplan/
├── schichtplaner.html          — Nur noch: HTML-Struktur, Script-Imports
├── fluss_logik.js              — Unverändertes Rechenmodul (bereits sauber)
├── sp_render.js                — Wochenplan-Rendering, Tabellen-Aufbau
├── sp_ui.js                    — Modals, Tabs, Aktionszentrale, Sheets
├── sp_freieTage.js             — Freie-Tage-Tab, Auto-Verteilen, Varianten
├── sp_druck.js                 — drucken()-Funktion, Print-HTML-Generator
├── sp_config.js                — loadConfig, saveToStorage, State-Variablen
└── schichtplaner_hilfe.html    — Unverändert
```

### Schritt-für-Schritt

**Schritt 1: sp_config.js extrahieren**  
Alles rund um State: `STORAGE_KEY`, `config`, `currentMonday`, `loadConfig()`, `saveToStorage()`, Migration-Code. Diese Datei wird zuerst geladen, alle anderen hängen davon ab.

**Schritt 2: sp_druck.js extrahieren**  
`drucken()`-Funktion komplett auslagern. Keine Abhängigkeiten außer `config` und `FLUSS_LOGIK`. Sicherheit: template literal mit `<\/script>` ist bereits korrekt escaped.

**Schritt 3: sp_freieTage.js extrahieren**  
`renderFreieTage()`, `autoVerteilen()`, `resetWoche()`, `liveFreierTag()`, `renderVarianten()`, `renderWocheStatus()`, `renderFreiStatus()`, `renderVorschlaege()`, `vorschlagUebernehmen()`.

**Schritt 4: sp_ui.js extrahieren**  
`zelleTap()`, `krankTab()`, `personAendern()`, `personAendernZurueck()`, `verdraengungAkzeptieren()`, `addFehlzeit()`, `removeFehlzeit()`, `renderFehlzeiten()`, `switchTab()`, `toggleWorkflow()`, alle Modal-Funktionen.

**Schritt 5: sp_render.js extrahieren**  
`renderWochenplan()`, `renderWochenLabel()`, `buildPrintFreitag()`, `renderAll()`, `changeWeek()`.

**Schritt 6: schichtplaner.html bereinigen**  
Nur noch: HTML-Gerüst, Style-Block, Script-Tags in richtiger Reihenfolge:
```html
<script src="fluss_logik.js"></script>
<script src="sp_config.js"></script>
<script src="sp_render.js"></script>
<script src="sp_ui.js"></script>
<script src="sp_freieTage.js"></script>
<script src="sp_druck.js"></script>
<script>
  loadConfig().then(() => renderAll());
</script>
```

### Ladereihenfolge (kritisch)

`fluss_logik.js` → `sp_config.js` → alle anderen. Jede Datei darf nur Funktionen aus früher geladenen Dateien aufrufen.

### Globale Variablen

`config`, `currentMonday`, `TAGE_NAMEN_LANG`, `TAGE_NAMEN_KURZ` leben in `sp_config.js` und sind global zugänglich. Keine `const` auf Modul-Ebene wenn andere Module darauf zugreifen müssen.

### Test-Kriterien nach Refactoring

- [ ] Tabelle lädt beim Start
- [ ] Auto-Verteilen funktioniert
- [ ] Tap auf Zelle → Modal öffnet
- [ ] Drucken öffnet eigenes Fenster
- [ ] Frühschicht-Einsatz erscheint im Plan
- [ ] Urlaub wird aus JSON geladen
- [ ] localStorage-Daten bleiben erhalten
- [ ] Shell-Header korrekt (nicht transparent)
- [ ] Modals über Shell-Header (z-index 600)

---

*Erstellt im Rahmen von BäckereiOS — April 2026*  
*Entwickelt in Zusammenarbeit mit Claude (Anthropic)*  
*Dokumentation für Übergabe an neuen Chat-Kontext*
