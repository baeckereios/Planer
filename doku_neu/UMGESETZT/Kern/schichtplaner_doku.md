# SchichtPlaner — Systemdokumentation

> BäckereiOS · Nachtschicht-Arbeitsplanung · Stand: April 2026  
> Ersetzt: `der_fluss_doku-1.md` und frühere `schichtplaner_doku.md`

---

## Inhaltsverzeichnis

1. [Überblick & Kernprinzipien](#1-überblick--kernprinzipien)
2. [Dateistruktur & Architektur](#2-dateistruktur--architektur)
3. [Config-Struktur](#3-config-struktur)
4. [Positionen](#4-positionen)
5. [Personen & Attribut-Sterne](#5-personen--attribut-sterne)
6. [Tagesplan-Algorithmus](#6-tagesplan-algorithmus)
7. [Freie Tage — Score-Algorithmus](#7-freie-tage--score-algorithmus)
8. [Frühschicht-Integration](#8-frühschicht-integration)
9. [Krankheits-Assistent](#9-krankheits-assistent)
10. [Änderungsprotokoll](#10-änderungsprotokoll)
11. [Manuelle Overrides & Verdrängungslogik](#11-manuelle-overrides--verdrängungslogik)
12. [Joker-System & Aktionszentrale](#12-joker-system--aktionszentrale)
13. [Plan-Export & Import](#13-plan-export--import)
14. [Archiv & Übersicht](#14-archiv--übersicht)
15. [Public API (FLUSS_LOGIK)](#15-public-api-fluss_logik)
16. [Konfiguration im Editor](#16-konfiguration-im-editor)
17. [localStorage-Keys](#17-localstorage-keys)
18. [Bekannte Grenzen & offene Ideen](#18-bekannte-grenzen--offene-ideen)

---

## 1. Überblick & Kernprinzipien

Der **SchichtPlaner** löst die tägliche Frage: *„Wer macht was heute Nacht?"* — für die Nachtschicht-Bäckerei Langrehr.

### Kernprinzipien

- **Kaskade statt Starrhierarchie**: Stammkräfte haben feste Positionen. Fehlen sie, rückt nach definierten Regeln die nächstbeste Person nach — automatisch.
- **Freie Tage als Ressource**: Pro Woche bekommt jede Person einen freien Tag. Ein Score-Algorithmus verteilt fair, rotiert Samstage, respektiert Wünsche und Frühschicht-Blöcke.
- **Joker als Signal**: Kein qualifizierter Mitarbeiter verfügbar → Joker erscheint als rote Warnung mit Lösungsvorschlägen.
- **Manuelle Eingriffe ohne Datenverlust**: Overrides, Fehlzeiten, Frühschicht-Einsätze — der Algorithmus füllt den Rest.
- **JSON als Wahrheit**: Stammdaten kommen aus der deployten `schichtplaner_config.json` und gelten für alle Geräte. Planungsdaten (freieTage, Fehlzeiten, Änderungsprotokoll) sind gerätespezifisch im localStorage.

---

## 2. Dateistruktur & Architektur

Das System wurde im April 2026 vollständig modularisiert. Der ursprüngliche Monolith (`schichtplaner.html`, ~2800 Zeilen) wurde in 7 Dateien aufgeteilt.

```
BäckereiOS-Root/
├── schichtplaner_config.json     — Stammdaten (deployed, Wahrheit für alle Geräte)
│
└── arbeitsplan/
    ├── schichtplaner.html        — HTML-Skelett + Script-Imports + Init (325 Zeilen)
    ├── schichtplaner.css         — Gesamtes CSS inkl. @media print (799 Zeilen)
    ├── fluss_logik.js            — Reines Rechenmodul, kein DOM (IIFE-Pattern)
    ├── schichtplaner_config.js   — State, loadConfig(), saveToStorage(), logAenderung()
    ├── schichtplaner_render.js   — Wochenplan-Rendering, buildPrintFreitag(), renderAll()
    ├── schichtplaner_ui.js       — Modals, Tabs, Fehlzeiten, Archiv, Übersicht, Krankheits-Assistent
    ├── schichtplaner_freieTage.js — Freie-Tage-Tab, Auto-Verteilen, Varianten, Aktionszentrale
    ├── schichtplaner_druck.js    — drucken(), Export/Import-Funktionen
    └── schichtplaner_hilfe.html  — Hilfe-Seite (15 Kapitel)

AdminTools/
└── schichtplaner_config.html    — Config-Editor (8 Tabs)
```

### Ladereihenfolge (bindend)

```html
<script src="fluss_logik.js"></script>         ← IIFE → FLUSS_LOGIK global
<script src="schichtplaner_config.js"></script>  ← config, currentMonday global
<script src="schichtplaner_render.js"></script>  ← renderWochenplan() etc.
<script src="schichtplaner_ui.js"></script>      ← Modals, zelleTap() etc.
<script src="schichtplaner_freieTage.js"></script> ← renderAktionsZentrale() etc.
<script src="schichtplaner_druck.js"></script>   ← drucken(), Export/Import
<script>
  loadConfig().then(() => renderAll());
</script>
```

**Regel:** Jede Datei darf nur Funktionen aus früher geladenen Dateien aufrufen.  
**Globale Variablen:** `config`, `currentMonday`, `TAGE_NAMEN_LANG`, `TAGE_NAMEN_KURZ` — alle in `schichtplaner_config.js`, kein `const` auf Modul-Ebene wenn andere Module darauf zugreifen müssen.

### Verantwortlichkeiten

| Datei | Verantwortung |
|---|---|
| `fluss_logik.js` | Alle Berechnungen, Algorithmen — kein DOM, keine Seiteneffekte |
| `schichtplaner_config.js` | State-Management, Datenladen, Änderungsprotokoll |
| `schichtplaner_render.js` | DOM-Aufbau der Wochenplan-Tabelle |
| `schichtplaner_ui.js` | User-Interaktion, Modals, Fehlzeiten, Krankheits-Assistent |
| `schichtplaner_freieTage.js` | Freie-Tage-Tab, Auto-Verteilen, Aktionszentrale |
| `schichtplaner_druck.js` | Print-Fenster, JS/JSON-Export/Import |
| `schichtplaner_config.html` | Admin-UI, kein Deployment nötig für Nutzung |

---

## 3. Config-Struktur

### Stammdaten (`schichtplaner_config.json`) — für alle Geräte

```json
{
  "positionen": [ ... ],
  "personen":   [ ... ],
  "joker": "Heinrich",
  "azubiGesperrteAttribute": ["versand"],

  "urlaub": {
    "dominik": [{ "von": "2026-04-19", "bis": "2026-05-03", "notiz": "Osterurlaub" }]
  },

  "fruehschichtEinsaetze": [
    { "personId": "heinzi", "block": "anfang", "von": "2026-04-20", "bis": "2026-05-10" }
  ],

  "tagGewichte": {
    "montag": 0.5, "dienstag": 0, "mittwoch": 0,
    "donnerstag": 0, "freitag": 0, "samstag": 1.0
  },
  "wunschGewicht":     1.5,
  "wunschBasisBonus":  3,
  "wunschAbschwaecher": 0.5,
  "fruehschichtFreitagAnheften": true
}
```

### Planungsdaten (localStorage, gerätespezifisch)

```json
{
  "fehlzeiten": [
    { "personId": "lars", "typ": "krank", "von": "2026-04-21", "bis": "2026-04-21" }
  ],
  "freieTage": {
    "2026-W17": {
      "rosa":     { "tag": "montag",   "typ": "auto"      },
      "harrison": { "tag": "dienstag", "typ": "wunsch"    },
      "lars":     { "tag": "freitag",  "typ": "manuell"   },
      "heinzi":   { "tag": "samstag",  "typ": "versprochen" }
    }
  },
  "manuelleZuweisungen": {
    "2026-04-25": { "kamut": "heinzi" }
  },
  "planAenderungen": [
    {
      "datum": "2026-04-25",
      "posId": "kamut",
      "zeitstempel": "2026-04-25T08:14:00.000Z",
      "grund": "Fehlzeit: Dominik"
    }
  ]
}
```

### `freieTage`-Typen

| Typ | Bedeutung |
|---|---|
| `auto` | Vom Auto-Verteiler gesetzt |
| `wunsch` | Wunsch-Tag der Person wurde vergeben |
| `manuell` | Manuell gesetzt (z.B. nach Verdrängung) |
| `versprochen` | Gutschrift nach Opfer des freien Tags — Folgewoche bevorzugt |

`wunsch`, `manuell` und `versprochen` werden beim Auto-Verteilen **nicht überschrieben**.

---

## 4. Positionen

```json
{
  "id": "versand_e1",
  "label": "Versand E1",
  "attribut": "versand",
  "gesperrtAm": ["samstag"],
  "prioritaet": 3
}
```

### `gesperrtAm` — UI-Darstellung invertiert

Im Config-Editor wird `gesperrtAm` als **"Aktiv an"** dargestellt — alle Tage angehakt bedeutet immer aktiv, abwählen = sperren. Die JSON-Logik bleibt unverändert. `fluss_logik.js` kennt nur `gesperrtAm`.

### Prioritätsbedeutung

| Wert | Label | Bedeutung |
|---|---|---|
| 1 | Kritisch | Muss besetzt sein — Joker hier ist gravierend |
| 2 | Mittel | Sollte besetzt sein |
| 3 | Joker-OK | Kann im Notfall unbesetzt bleiben |

---

## 5. Personen & Attribut-Sterne

```json
{
  "id": "lars",
  "name": "Lars",
  "attribute": ["teigmacher", "rheon", "22uhr", "kamut"],
  "stammkraft_von": null,
  "wunschFreierTag": "mittwoch",
  "gesperrt": ["freitag"],
  "azubi": false
}
```

### Attribut-Reihenfolge = Priorität

Die Reihenfolge in `attribute[]` bestimmt die Einsatz-Präferenz des Algorithmus. Attribut 1 = bevorzugte Position. Im Config-Editor wird das als **Sterne** dargestellt:

| Index | Sterne | Bedeutung |
|---|---|---|
| 0 (erstes) | ★★★ | Bevorzugte Position, höchste Kompetenz |
| 1 | ★★ | Gute Alternative |
| 2+ | ★ | Kann es, aber nicht bevorzugt |

Die Sterne sind reine Darstellung — die JSON-Reihenfolge ist die Wahrheit.

### Azubi-Logik

- Wird im Algorithmus als letzter Griff eingesetzt
- Eigene Tabellenzeile (nur wenn wirklich eingeplant zeigt Name, sonst "Lernt")
- Gesperrte Attribute in `azubiGesperrteAttribute` (Standard: `["versand"]`)
- In Frühschicht-Wochen: automatisch für 22-Uhr gesperrt

---

## 6. Tagesplan-Algorithmus

`berechneTagesplan(config, date)` in `fluss_logik.js`. Läuft für jeden der 6 Tage (Mo–Sa) separat.

```
Phase 0: Gesperrte Positionen markieren (gesperrtAm enthält heutigen Tag)
Phase 1: Manuelle Vorbelegung (manuelleZuweisungen — höchste Priorität)
Phase 2: Positionen sortieren (Prio 1 zuerst, dann nach Kandidatenengpass)
Phase 3: Hauptschleife — pro Position:
           Stammkraft → Kaskade → Wolke → Azubi (letzter Griff) → Joker
Phase 4: Fix-up-Pass (Joker durch einstufigen Tausch auflösen)
Phase 5: Sonderschicht, Verfügbar, Frühschicht berechnen
```

### `isPersonVerfuegbar()` — Verfügbarkeits-Check

Person ist **nicht** verfügbar wenn:
1. In `gesperrt[]` steht der heutige Wochentag
2. `fehlzeiten` enthält einen Eintrag der das Datum abdeckt
3. `urlaub` (aus Config) enthält einen Eintrag der das Datum abdeckt
4. `freieTage[weekKey][personId]` ist auf den heutigen Tag gesetzt
5. `isPersonFruehschicht()` gibt `true` zurück (Person ist heute in der Frühschicht)

### Farbschema der Zellen

| Status | Farbe | Bedeutung |
|---|---|---|
| `stammkraft` | Grün | Stammkraft auf eigenem Platz |
| `kaskade` | Amber | Stammkraft fehlt, jemand springt ein |
| `wolke` | Blau | Flexible Reserve ohne feste Position |
| `joker` | Rot | Kein Qualifizierter verfügbar |
| `gesperrt` | Grau | Position heute nicht aktiv |
| `manuell` | Lila | Manuell gesetzt |
| Platzhalter | Gestrichelt grau | Freitext, kein echter Mitarbeiter |

---

## 7. Freie Tage — Score-Algorithmus

### Grundstruktur

`autoVerteilFreieTage(config, weekKey)` in `fluss_logik.js`.

```
1. Bestehende wunsch/manuell/versprochen-Einträge erhalten (nicht überschreiben)
2. Score-Verteilung für alle übrigen Personen
3. Nicht-22uhr-Personen zuerst, dann 22uhr-Personen (Simulation-Reihenfolge)
```

### Score-Formel

Für jeden verfügbaren Tag `t` einer Person `p`:

```
score(t) = tagZaehler[t]                          ← wie viele anderen haben schon t?
         + personHistorie[t] × 2                   ← wie oft hatte p schon t?
         - (position_gesperrt_an_t ? 0.5 : 0)      ← kleine Bonus wenn Stammkraft-Position sowieso gesperrt
         + azubiStrafe                             ← +10 wenn Azubi durch diese Wahl auf 22uhr landet
         + tagGewichte[t]                          ← konfigurierbares Basisgewicht (Mo: 0.5, Sa: 1.0)
         + anheftungsBonus                         ← -4 wenn t direkt an Frühschicht-Block angrenzt
         + wunschBonus                             ← -wunschBasis + wunschErfuellt × wunschAbschwaecher
```

**Niedrigster Score gewinnt.**

### Tag-Gewichte (`tagGewichte`)

Konfigurierbar in `schichtplaner_config.json` und im Editor (Einstellungen-Tab).

Standard: Mo `0.5`, Sa `1.0`, alle anderen `0`.

Bedeutung: Basisaufschlag auf den Score. Höher = Tag wird seltener zugeteilt. Samstag und Montag gelten als begehrter.

### Wunsch-Bonus (`wunschBasisBonus`, `wunschAbschwaecher`)

Ersetzte die frühere "Wunsch-Vorphase" (absoluter Vorrang). Wünsche sind jetzt in den Score integriert und unterliegen der Fairness.

| Konfigurationsfeld | Standard | Bedeutung |
|---|---|---|
| `wunschBasisBonus` | 3 | Anfängliche Stärke des Bonus (als negativer Score) |
| `wunschAbschwaecher` | 0.5 | Wie viel Stärke pro Erfüllung verloren geht |

Beispiel mit Defaults: 0× erfüllt → `-3` (starker Zug), 6× erfüllt → `0` (neutral), 8× → `+1` (leichte Benachteiligung).

`getWunschErfuelltHistorie()` zählt nur Einträge bei denen `typ === 'wunsch'` UND `tag === person.wunschFreierTag`. Wenn der Wunsch-Tag gewinnt, wird `typ: 'wunsch'` gesetzt — der Zähler wächst korrekt.

### Wunsch-Gewicht (`wunschGewicht`)

Standard: `1.5`. Steuert wie stark vergangene Wunsch-Einträge in der `getFreierTagHistorie()` zählen, unabhängig vom Bonus-System.

### Varianten

`autoVerteilVarianten(config, weekKey, n)` shuffled die Personen-Reihenfolge und berechnet bis zu `n` verschiedene Ergebnisse. Die erste Variante ist immer die Standard-Reihenfolge.

---

## 8. Frühschicht-Integration

### Frühschicht-Blöcke

Jeder Einsatz in `fruehschichtEinsaetze` hat einen Block:

| Block | Tage | Bedeutung |
|---|---|---|
| `anfang` | Mo, Di, Mi | Person arbeitet Anfang der Woche Frühschicht |
| `ende` | Do, Fr, Sa | Person arbeitet Ende der Woche Frühschicht |

### Auswirkung auf Verfügbarkeit

`isPersonFruehschicht()` prüft anhand Datum + Block ob die Person heute in der Frühschicht ist. Wenn ja → sie ist für die Nachtschicht nicht verfügbar.

### Auswirkung auf freie Tage

Frühschicht-Tage sind als freier Tag für diese Person gesperrt. Logik in `autoVerteilFreieTage` und `autoVerteilVariante`:

```
fruehBlock === 'anfang' → Mo/Di/Mi aus verfügbaren freien Tagen herausfiltern
fruehBlock === 'ende'   → Do/Fr/Sa aus verfügbaren freien Tagen herausfiltern
```

Das gilt auch für Wunsch-Tags — ein Wunsch auf einem Frühschicht-Tag wird ignoriert.

### Anheftungs-Bonus (`fruehschichtFreitagAnheften`)

Konfigurierbar (Standard: `true`). Wenn aktiv:

| Block | Bevorzugter freier Tag | Begründung |
|---|---|---|
| `anfang` (Mo/Di/Mi) | **Donnerstag** | Verlängerter Übergang zur Nachtschicht |
| `ende` (Do/Fr/Sa) | **Mittwoch** | Puffer vor dem Frühschicht-Block |

Score-Bonus: `-4` für den anhängenden Tag. Stark genug um zu gewinnen, nicht absolut — bei Konflikten greift die nächstbeste Option.

---

## 9. Krankheits-Assistent

Wird automatisch ausgelöst nach `krankEintragen()` wenn `typ === 'krank'` und betroffene Tage in der aktuellen Woche liegen.

### Funktions-Aufruf

```javascript
FLUSS_LOGIK.berechneKrankheitsOptionen(config, weekKey, monday, krankePersonId, datum)
```

Gibt ein Array von Optionen zurück, sortiert nach Eingriffstiefe.

### Drei Options-Typen (Priorität: 1 > 2 > 3)

**Typ `direkt`** — kein Seiteneffekt  
Person hat das nötige Attribut, ist heute verfügbar, hat keinen freien Tag heute. Springt direkt ein.

**Typ `freitag_verschieben`** — freier Tag rückt nach hinten  
Person hat heute frei (`typ: 'auto'`), arbeitet stattdessen. Freier Tag verschiebt sich auf den letzten verfügbaren späteren Tag dieser Woche (Samstag bevorzugt).  
> Wunsch-freie Tage (`typ: 'wunsch'`) werden nicht angefasst.

**Typ `freitag_aufloesen`** — Versprechen Folgewoche  
Person hat heute frei, kein späterer Tag mehr verfügbar. Freier Tag fällt weg. In der Folgewoche wird `{ tag: 'samstag', typ: 'versprochen' }` gesetzt — dieser Eintrag wird beim Auto-Verteilen nicht überschrieben und bevorzugt behandelt.

### Darstellung

Karten in der Aktionszentrale mit Farb-Codierung, Beschreibung der Konsequenz und Buttons "Übernehmen" / "Ignorieren". Optionen werden in `window._krankheitsOptionen` zwischengespeichert.

### Übernehmen

`krankheitsOptionUebernehmen(idx)` in `schichtplaner_ui.js`:
- Schreibt manuelle Zuweisung
- Passt `freieTage` an (verschieben/auflösen)
- Trägt Änderung ins Protokoll ein
- Rendert neu

---

## 10. Änderungsprotokoll

`planAenderungen` ist ein Array im localStorage (gerätespezifisch). Es markiert Zellen die sich in der aktuellen oder vergangenen Wochen geändert haben.

### Eintrag-Schema

```json
{
  "datum":       "2026-04-25",
  "posId":       "kamut",
  "zeitstempel": "2026-04-25T08:14:00.000Z",
  "grund":       "Fehlzeit: Dominik"
}
```

### Automatisch geloggt bei

| Aktion | Funktion | Grund-Text |
|---|---|---|
| Krank melden | `krankEintragen()` | `"Fehlzeit: [Name]"` |
| Option übernehmen | `krankheitsOptionUebernehmen()` | `"Notfall-Einspringer: [Name] → [Position]"` |
| Person manuell ändern | `personAendern()` | `"Manuell: [Name] → [Position]"` |

### Bereinigung

Einträge älter als 7 Tage werden automatisch entfernt (`logAenderung()` in `schichtplaner_config.js`).

### Darstellung

Geänderte Zellen bekommen eine orange Umrandung + kleines `!`-Badge oben rechts. Im Detail-Modal (Tap auf Zelle) erscheinen Zeitstempel und Grund.

---

## 11. Manuelle Overrides & Verdrängungslogik

### Manuelle Zuweisung

Schreibt in `config.manuelleZuweisungen[datum][posId]`. Zwei Varianten:

- **Echte Person**: PersonId → Algorithmus behandelt Position als besetzt
- **Platzhalter**: `__Text` → Gestrichelte Zelle mit Freitext, kein Mitarbeiter eingeplant

### Verdrängungslogik (nach `personAendern()`)

**Fall A — Alte Person verdrängt:**  
Alte Person sitzt nach der Änderung auf keiner Position mehr → Vorschlag: deren freien Tag auf den Verdrängungstag setzen.

**Fall B — Neue Person opfert freien Tag:**  
Neue Person hat heute frei, wird trotzdem eingesetzt → `delete config.freieTage[weekKey][neuePersonId]`. Vorschlag: Ersatztag vergeben (Samstag bevorzugt, sonst spätester freier Tag).

Beide Fälle erscheinen als Karte in der Aktionszentrale mit "Übernehmen" / "Nein".

---

## 12. Joker-System & Aktionszentrale

### Joker

Entsteht wenn für eine Position kein qualifizierter Mitarbeiter verfügbar ist. Joker = die in `config.joker` benannte Person. Erscheint als rote Zelle im Plan.

`berechneVorschlaege(config, weekKey, monday)` sucht nach Personen die ihren freien Tag verschieben könnten um den Joker zu vermeiden — einstufige Tauschketten.

### Aktionszentrale

`renderAktionsZentrale(extraKarte)` in `schichtplaner_freieTage.js`. Zeigt:

- **Grün**: "Alles in Ordnung" wenn keine Joker und kein Extra
- **Joker-Karten**: Pro Joker eine rote Karte mit Vorschlägen
- **Krankheits-Assistent-Karten** (via `extraKarte`-Parameter)
- **Verdrängungshinweise** (via `extraKarte`-Parameter)

---

## 13. Plan-Export & Import

### Export Arbeitsplan (JS-Datei)

`exportArbeitsplan()` in `schichtplaner_druck.js`. Generiert `arbeitsplan_nachtschicht.js`:

```javascript
window.NACHTSCHICHT_PLAENE = {
  "2026-W17": {
    "erstellt": "...",
    "wochenplan": [...],
    "freieTage": [...],
    "positionen": [...]
  }
};
```

Neue Woche wird zu bestehenden Wochen hinzugefügt — Daten akkumulieren sich über die Zeit.

### Import Arbeitsplan

Liest die JS-Datei, extrahiert `window.NACHTSCHICHT_PLAENE` per Regex, speichert in `localStorage('fluss_arbeitsplaene')`.

### Export/Import Config (JSON)

`exportConfig()` schreibt alle Stammdaten inkl. aller Algorithmus-Parameter. `importConfig()` liest sie zurück. Planungsdaten (freieTage, Fehlzeiten) werden dabei bewusst nicht überschrieben.

### Druck

`drucken()` öffnet ein eigenes Fenster mit fertigem HTML, A4 Querformat. Enthält: Positionszeilen, Frühschicht-Zeile, Trennlinie, Azubi-Zeile, Frei-Zeile, Krank/Urlaub-Zeile, Legende + Status.

---

## 14. Archiv & Übersicht

### Archiv-Tab

Letzte 12 Wochen aus `config.freieTage`. Pro Person: welcher Tag frei, Samstage amber hervorgehoben, `×N Sa`-Badge. Auto-Verteiler nutzt diese Daten zur fairen Samstag-Rotation.

### Übersicht-Tab

Pro Person: Stammkraft-Rolle, Attribute mit Sternen, aktueller freier Tag, Wunsch-Tag, Sperrtage, Sa-Statistik.

---

## 15. Public API (FLUSS_LOGIK)

IIFE-Pattern: `var FLUSS_LOGIK = (function(){...})()`. `var` für sicheres globales Scope auf GitHub Pages.

### Exportierte Funktionen

| Funktion | Beschreibung |
|---|---|
| `getMondayOfWeek(date)` | Montag der Woche |
| `getWeekKey(monday)` | `"2026-W17"` |
| `getWeekDates(monday)` | Date[] Mo–Sa |
| `getMondayFromWeekKey(weekKey)` | Date aus WeekKey |
| `dateToISO(date)` | `"2026-04-21"` |
| `formatDatum(dateISO)` | `"21.04."` |
| `berechneTagesplan(config, date)` | Vollständiger Tagesplan |
| `berechneWochenplan(config, monday)` | 6 Tagespläne |
| `autoVerteilFreieTage(config, weekKey)` | Score-Verteilung |
| `autoVerteilVarianten(config, weekKey, n)` | Bis zu n Varianten |
| `berechneVorschlaege(config, weekKey, monday)` | Joker-Lösungsvorschläge |
| `berechneKrankheitsOptionen(config, weekKey, monday, krankePersonId, datum)` | Krankheits-Assistent-Optionen |
| `getFreierTag(personId, weekKey, freieTage)` | Freier Tag einer Person |
| `getFreierTagTyp(personId, weekKey, freieTage)` | `'auto'` / `'wunsch'` / `'manuell'` / `'versprochen'` |
| `getFreierTagHistorie(config, excludeWeekKey)` | Historische Häufigkeiten |
| `isPersonFruehschicht(personId, tagName, dateISO, config)` | Datumsbasiert |
| `isPersonFruehschichtInWoche(personId, tagName, weekKey, config)` | Wochenbasiert |
| `getFruehschichtPerson(tagName, dateISO, config)` | Wer ist heute Frühschicht? |
| `TAG_NAMEN` | `['sonntag','montag',...]` |
| `TAG_KURZ` | `['So','Mo',...]` |

### Private Hilfsfunktionen (nicht exportiert, relevant für Debugging)

| Funktion | Beschreibung |
|---|---|
| `_getFruehschichtBlock(personId, weekKey, config)` | `'anfang'` / `'ende'` / `null` |
| `getWunschErfuelltHistorie(config, excludeWeekKey)` | Wie oft wurde der Wunsch je Person erfüllt? |

---

## 16. Konfiguration im Editor

`AdminTools/schichtplaner_config.html` — 8 Tabs:

| Tab | Inhalt |
|---|---|
| Personen | Hinzufügen, Bearbeiten (Name, Stammkraft, Wunsch-Tag, Attribute mit Sternen, Sperrtage, Azubi) |
| Positionen | Hinzufügen, Bearbeiten — "Aktiv an"-Checkboxen (UI-invertierung von `gesperrtAm`) |
| Frühschicht | Einsätze mit Person, Block (anfang/ende), Von/Bis-Datum |
| Urlaub | Pro Person: Zeiträume mit Notiz — erscheint im Plan, gilt für alle Geräte nach Deploy |
| Einstellungen | Joker-Name, Algorithmus-Parameter, Azubi-Sperren, Frühschicht-Anheftung |
| Übersicht | Aktuelle Woche: alle Personen mit Rollen und freien Tagen |
| Archiv | Letzte 12 Wochen: freie Tage + Samstag-Statistik |
| Daten | Export/Import Config-JSON, Vollexport, Reset |

### Algorithmus-Parameter im Editor (Einstellungen-Tab)

| Feld | ID | Standard | Beschreibung |
|---|---|---|---|
| Tag-Gewichte | `tagGewichteGrid` | Mo: 0.5, Sa: 1.0 | Basisaufschlag pro Tag |
| Wunsch-Gewicht | `wunschGewichtInput` | 1.5 | Gewichtungsfaktor für Wunsch-Einträge in der Historie |
| Wunsch Basis-Stärke | `wunschBasisBonusInput` | 3 | Anfangsstärke des Wunsch-Bonus |
| Wunsch Abschwächung | `wunschAbschwInput` | 0.5 | Bonus-Verlust pro Erfüllung |
| Frühschicht anheften | `fruehschichtAnheftenToggle` | ✓ | Do/Mi als bevorzugter freier Tag bei Frühschicht |
| Azubi-Sperren | `azubiSperrenListe` | versand | Attribute die Azubis nicht besetzen dürfen |

---

## 17. localStorage-Keys

| Key | Modul | Inhalt |
|---|---|---|
| `schichtplaner_v1` | `schichtplaner_config.js` | Planungsdaten (fehlzeiten, freieTage, manuelleZuweisungen, planAenderungen) |
| `fluss_arbeitsplaene` | `schichtplaner_druck.js` | Exportierte Wochenpläne (JS-Datei-Inhalt) |

**Migration:** Beim ersten Start wird `fluss_config_v1` automatisch nach `schichtplaner_v1` migriert.

---

## 18. Bekannte Grenzen & offene Ideen

### Hardcoded

| # | Datei | Was | Fix |
|---|---|---|---|
| 1 | `fluss_logik.js` | Wochenlänge Mo–Sa, Sonntag immer Pause | `getWeekDates()` + `TAG_NAMEN`-Logik |
| 2 | `fluss_logik.js` | Sonderschicht nur Samstag | Ruhetag konfigurierbar machen |
| 3 | `fluss_logik.js` | Max. 1 Sonderschicht-Kandidat | `.slice(0, 1)` entfernen |
| 4 | `schichtplaner_render.js` | Azubi Freitag = "Schule" | Label konfigurierbar |
| 5 | `schichtplaner_render.js` | Änderungsprotokoll nur gerätespezifisch | Deployment via JSON wenn mehrere Planer nötig |

### Algorithmische Grenzen

| Thema | Beschreibung |
|---|---|
| Fix-up-Pass | Nur einstufige Tauschketten. A→B→C nicht lösbar. |
| Krankheits-Assistent | Nur einstufige Einspringer. Kein zweistufiger Tausch (Pastor→Versand, Felix→22Uhr). |
| Vorschläge | Nur Einzelpersonen-Verschiebungen. |

### Offene Ideen (dokumentiert, noch nicht gebaut)

- **Zweistufige Tauschvorschläge** — Pastor rückt in Versand, Felix in 22-Uhr
- **Plan-Varianten im Druck** — Auto-Verteiler-Varianten druckbar/exportierbar
- **Änderungsprotokoll deployen** — via JSON statt nur localStorage, für mehrere Geräte
- **Entwurfsmodus** — Änderungen in temporärer Kopie, Übernehmen/Verwerfen
- **Messschieber** — Berechnungsfenster manuell verschieben bei schlechten Daten

---

*Dokumentation erstellt im Rahmen von BäckereiOS · April 2026*  
*Entwickelt in Zusammenarbeit mit Claude (Anthropic) · [Claude]*
