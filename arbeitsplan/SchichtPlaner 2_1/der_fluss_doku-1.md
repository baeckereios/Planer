# Der Fluss — Systemdokumentation
*Nachtschicht-Arbeitsplanung · BäckereiOS*  
*Stand: April 2026*

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Dateien & Architektur](#2-dateien--architektur)
3. [Config-Struktur (`fluss_config.json`)](#3-config-struktur)
4. [Positionen](#4-positionen)
5. [Personen](#5-personen)
6. [Tagesplan-Algorithmus](#6-tagesplan-algorithmus)
7. [Freie Tage — Auto-Verteilung](#7-freie-tage--auto-verteilung)
8. [Manuelle Overrides](#8-manuelle-overrides)
9. [Fehlzeiten](#9-fehlzeiten)
10. [Sonderschicht & Verfügbar](#10-sonderschicht--verfügbar)
11. [Joker-System & Vorschläge](#11-joker-system--vorschläge)
12. [Aktionszentrale](#12-aktionszentrale)
13. [Verdrängungslogik](#13-verdrängungslogik)
14. [Plan-Export & Import](#14-plan-export--import)
15. [Archiv & Samstag-Rotation](#15-archiv--samstag-rotation)
16. [Public API (`FLUSS_LOGIK`)](#16-public-api-fluss_logik)
17. [UI-Komponenten & Flows](#17-ui-komponenten--flows)
18. [Bekannte Grenzen & offene Ideen](#18-bekannte-grenzen--offene-ideen)

---

## 1. Überblick

**Der Fluss** ist ein wochenbasiertes Arbeitsplan-Tool für die Nachtschicht-Bäckerei. Es löst das Problem der täglichen Frage: „Wer macht was heute Nacht?"

### Kernprinzipien

- **Kaskade statt Starrhierarchie**: Jede Position hat eine Stammkraft. Ist diese abwesend, rückt der nächstbeste nach — automatisch, nach einem definierten Regelwerk.
- **Freie Tage als Ressource**: Pro Woche bekommt jede Person einen freien Tag. Wessen Tag es ist, entscheidet ein Score-Algorithmus mit Fairness-Mechanismus.
- **Joker als letztes Mittel**: Gibt es für eine Position keinen qualifizierten Mitarbeiter, tritt der Joker (typisch: Heinrich) ein — sichtbar als Warnung, nicht still.
- **Manuelle Eingriffe ohne Datenverlust**: Positions-Overrides, Fehlzeiten und freie-Tage-Anpassungen lassen sich jederzeit setzen — der Algorithmus füllt um sie herum.

---

## 2. Dateien & Architektur

```
fluss/
├── index.html          — Haupt-UI, gesamte Renderlogik, Modals, Tabs
├── fluss_logik.js      — Reines Rechenmodul (kein DOM), IIFE-Pattern
└── fluss_config.json   — Standardkonfiguration (Fallback wenn kein localStorage)
```

### Trennung der Verantwortlichkeiten

| Datei | Verantwortung |
|---|---|
| `fluss_logik.js` | Berechnungen, Algorithmen, keine DOM-Zugriffe |
| `index.html` | Rendering, User-Interaktion, localStorage |
| `fluss_config.json` | Default-Daten, wird bei erstem Start geladen |

### State-Management

Alles liegt in `localStorage` unter dem Key `fluss_config_v1`. Die Variable `config` im Script ist die aktuelle In-Memory-Kopie. Bei jeder Änderung: `saveToStorage()`.

```javascript
const STORAGE_KEY = 'fluss_config_v1';
let config = null; // wird durch loadConfig() befüllt
let currentMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());
```

---

## 3. Config-Struktur

Die gesamte Config ist ein einziges JSON-Objekt. Alle Felder:

```json
{
  "positionen": [ /* siehe Abschnitt 4 */ ],
  "personen":   [ /* siehe Abschnitt 5 */ ],
  "joker": "Heinrich",
  
  "fehlzeiten": [
    {
      "personId": "ulf",
      "typ": "krank",
      "von": "2026-04-15",
      "bis": "2026-04-18"
    }
  ],

  "freieTage": {
    "2026-W17": {
      "rosa":     { "tag": "montag",    "typ": "auto"    },
      "harrison": { "tag": "dienstag",  "typ": "wunsch"  },
      "lars":     { "tag": "freitag",   "typ": "manuell" }
    }
  },

  "manuelleZuweisungen": {
    "2026-04-25": {
      "kamut": "heinzi",
      "rheon": "lars"
    }
  }
}
```

---

## 4. Positionen

### Schema

```json
{
  "id":         "versand_e1",
  "label":      "Versand E1",
  "attribut":   "versand",
  "gesperrtAm": [],
  "prioritaet": 3
}
```

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | Interner Schlüssel, unveränderlich |
| `label` | string | Anzeigename in der Tabelle |
| `attribut` | string | Qualifikations-Tag — muss in `personen[].attribute` stehen |
| `gesperrtAm` | string[] | Wochentage an denen diese Position nicht besetzt wird (z.B. `["samstag"]` für Kamut) |
| `prioritaet` | 1 \| 2 \| 3 | Bestimmt Reihenfolge im Algorithmus |

### Aktuelle Positionen

| ID | Label | Attribut | Gesperrt | Prio |
|---|---|---|---|---|
| `teigmacher` | Teigmacher | `teigmacher` | — | 1 |
| `kamut` | Kamut | `kamut` | Samstag | 1 |
| `ofen` | Ofen | `ofen` | — | 1 |
| `rheon` | Rheon | `rheon` | — | 2 |
| `versand_e1` | Versand E1 | `versand` | — | 3 |
| `versand_e2` | Versand E2 | `versand` | — | 3 |
| `versand_e3` | 22 Uhr | `22uhr` | — | 3 |

### Prioritätsbedeutung

- **1 (kritisch)**: Muss besetzt sein. Joker-Risiko hier ist gravierend.
- **2 (mittel)**: Sollte besetzt sein. Joker möglich aber problematisch.
- **3 (Joker-OK)**: Kann im Notfall mit Joker laufen. Algorithmus platziert Joker bevorzugt hier.

---

## 5. Personen

### Schema

```json
{
  "id":             "lars",
  "name":           "Lars",
  "attribute":      ["teigmacher", "rheon", "22uhr", "kamut"],
  "stammkraft_von": null,
  "wunschFreierTag": "mittwoch",
  "gesperrt":       [],
  "azubi":          false
}
```

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | Interner Schlüssel, Kleinschreibung, unveränderlich |
| `name` | string | Anzeigename |
| `attribute` | string[] | Qualifikationen — Überschneidung mit `positionen[].attribut` ermöglicht Einsatz |
| `stammkraft_von` | string \| null | ID der Position, für die diese Person Stammkraft ist |
| `wunschFreierTag` | string \| null | Gewünschter freier Wochentag — wird vom Algorithmus bevorzugt |
| `gesperrt` | string[] | Wochentage an denen diese Person **nie** arbeitet |
| `azubi` | bool | Sonderregeln: letzter Griff im Kaskade, eigene Zeile, Sperrtage über `gesperrt` |

### Aktuelle Belegschaft

| Name | Stammkraft | Attribute | Sperrtage |
|---|---|---|---|
| Rosa | Versand E1 | versand | — |
| Harrison | Versand E2 | versand | — |
| Pastor | — | versand, 22uhr | — |
| Lars | — | teigmacher, rheon, 22uhr, kamut | — |
| Marcel | — | rheon, teigmacher, 22uhr, versand, kamut, ofen | — |
| Heinzi | — | rheon, ofen, kamut, 22uhr | — |
| Dominik | Kamut | kamut, teigmacher | — |
| Jörg | Teigmacher | teigmacher | — |
| Ulf | Ofen | ofen, teigmacher | — |
| **Felix** | — | 22uhr | Fr, Sa (Azubi) |
| *Heinrich* | — | alle | — (Joker) |

---

## 6. Tagesplan-Algorithmus

Die Herzstück-Funktion `berechneTagesplan(config, date)` in `fluss_logik.js`. Läuft für jeden der 6 Wochentage (Mo–Sa) separat.

### Phasen im Überblick

```
Phase 0: Gesperrte Positionen markieren
Phase 1: Manuelle Vorbelegung (höchste Priorität)
Phase 2: Positionen sortieren (Prio + Kandidatenengpass)
Phase 3: Hauptschleife (Stammkraft → Kaskade → Wolke → Joker)
Phase 4: Fix-up-Pass (Joker durch Tausch auflösen)
Phase 5: Sonderschicht & Verfügbar berechnen
```

### Phase 0 — Gesperrte Positionen

Positionen mit `gesperrtAm` enthält den heutigen Wochentag → Status `gesperrt`, Person `null`. Kamut ist z.B. samstags gesperrt.

### Phase 1 — Manuelle Vorbelegung

Aus `config.manuelleZuweisungen[dateISO]` werden Overrides geladen. Diese werden **vor** dem Algorithmus angewendet:

```javascript
if (isPersonFehlend(...)) continue;       // krank/urlaub: blockiert
if (person.gesperrt.includes(tagName)) continue; // Sperrtag: blockiert
// freier Tag: wird IGNORIERT — manuell = bewusste Entscheidung
result.zuweisung[posId] = { status: 'manuell', ... };
zugewiesen.add(personId);
```

Manuell belegte Positionen werden dann aus dem Sortier-Pool entfernt.

### Phase 2 — Sortierung

Alle noch offenen aktiven Positionen werden sortiert:

1. **Priorität aufsteigend** (1 zuerst)
2. **Kandidatenanzahl aufsteigend** — Positionen mit weniger qualifizierten Personen kommen zuerst (engste Besetzung hat Vorrang)

### Phase 3 — Hauptschleife

Für jede sortierte Position:

```
1. Ist die Stammkraft verfügbar und noch nicht zugewiesen?
   → Stammkraft zuweisen (Status: 'stammkraft')

2. Sonst: Kandidaten sammeln
   - Haben das richtige Attribut
   - Sind nicht bereits zugewiesen
   - Azubi nicht für Versand
   - Azubi kommt immer zuletzt (sort)

3. Kandidat gefunden?
   → Zuweisen mit Status 'kaskade' (hat eigene Stammkraft-Position)
     oder 'wolke' (flexible Person ohne feste Position)

4. Kein Kandidat?
   → Joker (Status: 'joker'), Warnung wird gesetzt
```

### Phase 4 — Fix-up-Pass

Nach dem Hauptdurchlauf: für jede Joker-Position wird geprüft ob ein **Tausch** den Joker auflösen kann.

**Logik:**
```
Für jede Joker-Position J:
  Für jede besetzte Position A (Person X sitzt dort):
    Kann X auch J füllen? (Attribut-Check)
    Gibt es jemanden Y (noch nicht zugewiesen) der A füllen kann?
    → Ja: Tausch durchführen. X geht zu J, Y geht zu A.
```

Dies löst z.B. den Fall: Felix sitzt auf 22Uhr, Rheon ist Joker → Heinzi kann Rheon, Heinzi kann auch 22Uhr → aber Felix kann **nur** 22Uhr → daher: Heinzi von Rheon auf 22Uhr, Felix bleibt auf 22Uhr und jemand anderes füllt Rheon. (Konkrete Variante je nach Verfügbarkeit.)

### Zuweisung-Objekt

Jede Zelle in `result.zuweisung[posId]` hat dieses Schema:

```javascript
{
  person: "Lars",          // Anzeigename, null wenn gesperrt
  personId: "lars",        // ID für Weitervarbeitung, null bei Joker/gesperrt
  status: "stammkraft",    // stammkraft | kaskade | wolke | joker | gesperrt | manuell
  grund: "Stammkraft",     // Erklärungstext (für Tooltip/Detail)
  stammkraftName: "Ulf",   // Wer normalerweise hier sitzt (wenn abwesend)
  stammkraftGrund: "krank" // Warum die Stammkraft fehlt
}
```

### Status-Farben

| Status | Farbe | Bedeutung |
|---|---|---|
| `stammkraft` | Grün | Reguläre Stammkraft anwesend |
| `kaskade` | Gelb | Vertretung mit eigener Stammkraft-Position |
| `wolke` | Blau | Flexible Person ohne feste Position |
| `joker` | Rot | Kein qualifizierter Mitarbeiter — Joker tritt ein |
| `gesperrt` | Grau | Position heute nicht besetzt |
| `manuell` | Lila | Manuell override durch Disponenten |

---

## 7. Freie Tage — Auto-Verteilung

### Speicherstruktur

```json
"freieTage": {
  "2026-W17": {
    "rosa": { "tag": "montag", "typ": "auto" }
  }
}
```

**Typen:**
- `auto` — vom Algorithmus vergeben, kann durch Auto-Verteilen überschrieben werden
- `wunsch` — entspricht `person.wunschFreierTag`, wird von Auto-Verteilen nicht überschrieben
- `manuell` — manuell gesetzt (Dropdown oder Verdrängungslogik), wird von Auto-Verteilen nicht überschrieben

### Score-Formel

```
Score(Person, Tag) = tagZaehler[tag]
                   + historischeHäufigkeit[person][tag] × 2
                   - (tag ist Sperrtag der Stammkraft-Position ? 0.5 : 0)
```

- **`tagZaehler`**: Wie viele Personen haben diesen Tag diese Woche schon → Gleichverteilung
- **`historischeHäufigkeit × 2`**: Wer diesen Tag häufig hatte, bekommt ihn seltener → Fairness über Wochen
- **`−0.5 Bonus`**: Wenn die Position an diesem Tag gesperrt ist (z.B. Kamut Sa), bekommt Dominik leicht bevorzugt Samstag frei → Logische Konsequenz

**Niedrigster Score gewinnt.**

### Verarbeitungsreihenfolge

1. Bestehende `wunsch` und `manuell` Einträge werden übernommen (nicht überschrieben)
2. Alle Personen mit `wunschFreierTag` bekommen diesen (sofern nicht gesperrt für den Tag)
3. Alle restlichen Personen: Score-basierte Zuweisung in Config-Reihenfolge

### Varianten

`autoVerteilVarianten(config, weekKey, anzahl=3)` generiert bis zu 3 verschiedene gültige Verteilungen durch zufällige Permutation der Personen-Reihenfolge beim Score-Durchlauf. Nur bei echtem Gleichstand entstehen unterschiedliche Varianten.

---

## 8. Manuelle Overrides

### Speicherstruktur

```json
"manuelleZuweisungen": {
  "2026-04-25": {
    "kamut": "heinzi",
    "rheon": "lars"
  }
}
```

Key: ISO-Datum. Wert: `{ positionId → personId }`.

### Verhalten

- Werden **vor** dem Algorithmus angewendet (Phase 1)
- Überschreiben freie Tage — Disponenten treffen bewusste Entscheidungen
- Werden durch `krank`/`urlaub` blockiert (Fehlzeit hat Vorrang)
- Werden durch persönliche Sperrtage blockiert (`person.gesperrt`)
- Status in der Zelle: `manuell` (lila)

### Zurücksetzen

- **Einzeln**: Tap auf manuell-belegte Zelle → Sheet → Tab "Person ändern" → "Zurücksetzen"
- **Ganze Woche**: "Zurücksetzen"-Button im Freie-Tage-Tab — löscht sowohl `freieTage[weekKey]` als auch alle `manuelleZuweisungen` für die 6 Tage der Woche

---

## 9. Fehlzeiten

### Speicherstruktur

```json
"fehlzeiten": [
  {
    "personId": "ulf",
    "typ": "krank",
    "von": "2026-04-15",
    "bis": "2026-04-18"
  }
]
```

- `typ`: `"krank"` oder `"urlaub"`
- Datumsbereich: inklusiv beidseitig (ISO-String-Vergleich)

### Wirkung

Eine Person gilt als fehlend wenn: `von <= datum <= bis`. Fehlende Personen werden aus dem `verfuegbar`-Pool entfernt und können **auch durch manuelle Overrides nicht eingesetzt werden**.

### Schnelleingabe

Tap auf eine Plan-Zelle → Sheet → Tab "🤒 Fehlzeit":
- Person & Position vorbelegt
- Von = angeklickter Tag
- Schnellbuttons: **Nur heute**, **+1 Tag**, **Bis Sa**, **+1 Woche**
- Nach Eintragen: Plan wird sofort neu berechnet

---

## 10. Sonderschicht & Verfügbar

### Verfügbar-Zeile (Mo–Fr)

Personen die verfügbar (`isPersonVerfuegbar = true`) aber in keiner Position eingeplant sind, erscheinen in der **VERFÜGBAR**-Zeile — ein Signal: "Diese Person ist heute über."

### Sonderschicht-Zeile (Sa)

Nur Samstag. Zeigt maximal 1 Person die:
1. Verfügbar ist (nicht krank, nicht gesperrt)
2. Nicht eingeplant wurde
3. Ihren freien Tag bereits **Mo–Fr** hatte

Logik: Wer Samstag als freien Tag hat, wird nicht angezeigt (er hat ja frei). Wer seinen freien Tag unter der Woche hatte UND samstags nicht gebraucht wird, ist ein legitimer optionaler Sonderschicht-Kandidat.

### Verknüpfung mit freiem Tag

Damit Lars samstags als Sonderschicht erscheint:
- Lars muss einen freien Tag **Mo–Fr** haben (nicht Sa)
- Lars darf samstags nicht in einer Position eingeplant sein
- Lars darf nicht krank/gesperrt sein

---

## 11. Joker-System & Vorschläge

### Joker-Entstehung

Wenn für eine Position kein qualifizierter Mitarbeiter gefunden wird (nach Kaskade + Fix-up-Pass), tritt der **Joker** ein. Name kommt aus `config.joker` (Standard: "Heinrich"). Status: `joker`, rot hervorgehoben.

### Fix-up-Pass

Vor dem Joker läuft noch ein Tausch-Versuch. Dieser kann einstufige Ketten lösen (A → B, jemand füllt A nach). Mehrstufige Ketten (A → B → C) sind noch nicht implementiert.

### Vorschläge-Algorithmus

`berechneVorschlaege(config, weekKey, monday)`:

1. Gibt es einen Joker? Wenn nicht → leeres Array
2. Alle `auto`-freien-Tage dieser Woche sind "beweglich"
3. Sonderschicht-Kandidaten werden bevorzugt geprüft (wahrscheinlichste Lösung)
4. Für jede bewegliche Person: teste jeden alternativen freien Tag (Sa bevorzugt für Sonderschicht-Kandidaten)
5. Würde dieser Tausch den Joker auflösen? (`testPlan` mit Deep-Copy)
6. Ja → Vorschlag aufnehmen, Hint "löst Joker und Sonderschicht" wenn zutreffend
7. Maximal 3 Vorschläge

---

## 12. Aktionszentrale

Permanent sichtbare Statusbox zwischen Plan und Legende. Zeigt immer genau einen der folgenden Zustände:

### Alles OK

```
✓ Alles in Ordnung — kein Handlungsbedarf
```
Grüne Box, keine Aktion nötig.

### Joker-Warnung

```
⚠ Joker — Rheon
Fr 24.04. · Kein qualifizierter Mitarbeiter verfügbar
```
Rote Box, pro Joker eine Karte.

### Lösungsvorschläge

Erscheint unterhalb der Joker-Warnungen wenn Vorschläge vorhanden:

```
💡 Lösungsvorschläge
Lars: Do → Sa  (löst Joker und Sonderschicht)  [Übernehmen]
```

### Verdrängungshinweis

Nach manueller Überschreibung wenn die ursprüngliche Person unbesetzt ist:

```
🔀 Verdrängung — Lars
Nicht mehr eingeplant auf Fr · Bisheriger freier Tag: Sa.
Lars wird dann Samstag als Sonderschicht verfügbar.
[✓ Fr als freien Tag]  [Nein]
```

### Freier-Tag-verloren

Nach manueller Überschreibung wenn die neue Person ihren eigenen freien Tag opfert:

```
📅 Freier Tag verloren — Lars
Lars hat Fr eingesprungen und dabei den freien Tag verloren.
Ersatz: Sa als neuen freien Tag?
[✓ Sa als freien Tag]  [Nein]
```

---

## 13. Verdrängungslogik

Entsteht durch manuelle Überschreibung. Zwei Fälle:

### Fall A: Alte Person verdrängt

Person X saß auf Position P. Durch manuellen Override sitzt jetzt Y auf P. X ist nicht mehr eingeplant.

**Erkennung** in `personAendern()`:
```javascript
const istUnbesetzt = !Object.values(tag.zuweisung)
  .some(z => z.personId === altePersonId);
```

**Vorschlag**: Setze X's freien Tag auf den Verdrängungstag. X wurde verdrängt → bekommt frei → wird ggf. Sa Sonderschicht-Kandidat.

### Fall B: Neue Person opfert eigenen freien Tag

Person Y wird auf Position P gesetzt — aber P's Datum ist Y's eigener freier Tag. Der freie Tag wird automatisch annulliert.

**Erkennung**:
```javascript
const freiTagGeopfert = freiTag === tagName;
if (freiTagGeopfert) delete config.freieTage[weekKey][neuePersonId];
```

**Vorschlag**: Setze Y's freien Tag auf einen anderen Tag (bevorzugt Samstag, wenn nicht eingeplant und nicht gesperrt). Berechnung: alle Tage an denen Y nicht eingeplant ist.

---

## 14. Plan-Export & Import

### Export

Button "Plan speichern" → generiert `arbeitsplan_nachtschicht.js`:

```javascript
window.NACHTSCHICHT_PLAENE = {
  "2026-W17": {
    "montag":    { "teigmacher": "Jörg", ... },
    "dienstag":  { ... },
    ...
  }
};
```

### Import

Button "Plan laden" → importiert die JS-Datei, merged mit aktueller Config (bestehende Wochen bleiben erhalten, importierte Wochen überschreiben).

### Anzeigeseite

`arbeitsplan.html` im Root lädt `arbeitsplan_nachtschicht.js` und zeigt alle gespeicherten Wochen in lesbarer Form.

---

## 15. Archiv & Samstag-Rotation

### Archiv-Tab

Zeigt die letzten 12 Wochen aus `config.freieTage`. Pro Person: welcher Tag war frei, Samstage farblich hervorgehoben.

### Samstag-Rotation

Der Score-Algorithmus gewichtet die historische Häufigkeit eines Tags für eine Person mit `×2`. Wer Samstag öfter hatte, bekommt ihn seltener. Das führt über die Wochen zu einer fairen Rotation ohne explizite Zähler-Logik.

---

## 16. Public API (`FLUSS_LOGIK`)

Das Modul ist ein IIFE (`var FLUSS_LOGIK = (function(){...})()`), zugänglich als globale Variable. `var` statt `const` um sicheres globales Scope auf GitHub Pages zu garantieren.

### Exportierte Funktionen

| Funktion | Parameter | Rückgabe | Beschreibung |
|---|---|---|---|
| `getMondayOfWeek(date)` | Date | Date | Montag der Woche für ein beliebiges Datum |
| `getWeekKey(monday)` | Date | string | ISO-8601 Wochenschlüssel (`"2026-W17"`) |
| `getWeekDates(monday)` | Date | Date[] | Array mit 6 Dates Mo–Sa |
| `dateToISO(date)` | Date | string | `"2026-04-21"` |
| `formatDatum(dateISO)` | string | string | `"21.04."` |
| `berechneTagesplan(config, date)` | object, Date | TagesplanResult | Vollständiger Tagesplan für einen Tag |
| `berechneWochenplan(config, monday)` | object, Date | TagesplanResult[] | Array von 6 Tagesplänen |
| `autoVerteilFreieTage(config, weekKey)` | object, string | FreieTageZuweisung | Score-basierte Verteilung |
| `autoVerteilVarianten(config, weekKey, n)` | object, string, number | FreieTageZuweisung[] | Bis zu n verschiedene Verteilungen |
| `berechneVorschlaege(config, weekKey, monday)` | object, string, Date | Vorschlag[] | Joker-Lösungsvorschläge |
| `getFreierTag(personId, weekKey, freieTage)` | string, string, object | string\|null | Freier Tag einer Person für eine Woche |
| `getFreierTagTyp(personId, weekKey, freieTage)` | string, string, object | string\|null | Typ des freien Tags |
| `getFreierTagHistorie(config, excludeWeekKey)` | object, string | object | Historische Häufigkeiten aller Personen |

### Exportierte Konstanten

| Konstante | Wert |
|---|---|
| `TAG_NAMEN` | `['sonntag','montag','dienstag','mittwoch','donnerstag','freitag','samstag']` |
| `TAG_KURZ` | `['So','Mo','Di','Mi','Do','Fr','Sa']` |

---

## 17. UI-Komponenten & Flows

### Wochennavigation

Pfeile navigieren `currentMonday` ±7 Tage. Alle Render-Funktionen lesen `currentMonday` als globalen State.

### Plan-Tabellen-Struktur (vertikal)

```
TEIGMACHER    [Mo] [Di] [Mi] [Do] [Fr] [Sa]
KAMUT         [Mo] [Di] [Mi] [Do] [Fr] [--]
OFEN          ...
RHEON         ...
VERSAND E1    ...
VERSAND E2    ...
22 UHR        ...
Sonderschicht [  ] [  ] [  ] [  ] [  ] [La]   ← nur wenn jemand verfügbar
──────────────────────────────────────────
AZUBI         [Fe] [Fe] [  ] [Fe] [Sc] [Fr]
FREI          [Ro] [Ha] [Pa] [La] [  ] [Ma]   ← Chips, farblich
KRANK/URLAUB  [🌴 Do] ...                      ← Chips, nur wenn Einträge
```

### Tap-Interaktion auf Plan-Zellen

Tap → Sheet mit zwei Tabs:

**Tab "🤒 Fehlzeit"**: Krank/Urlaub melden mit Datumsbereich-Schnellauswahl

**Tab "✏️ Person ändern"**: Dropdown mit allen Personen + "Übernehmen" / "Zurücksetzen". Übernehmen löst ggf. Verdrängungslogik aus.

### Freie Tage Tab

- Auto-Verteilen (mit Variantenauswahl)
- Zurücksetzen (löscht freieTage + manuelleZuweisungen der Woche)
- Akkordeon "Varianten" — aufklappbar, bis zu 3 Optionen
- Akkordeon "Freie Tage Wünsche" — Dropdown pro Person, speichert live (`onchange`)

### Drucken

`window.print()` direkt. `@media print` blendet alles außer Plan und einem kompakten Freie-Tage-Streifen aus. A4 Querformat, 8mm Rand.

---

## 18. Bekannte Grenzen & offene Ideen

### Hardcoded — bewusst nicht konfiguriert

Diese Punkte sind technisch bekannt und dokumentiert, aber absichtlich nicht in die Config aufgenommen — entweder weil sie für den aktuellen Betrieb nicht relevant sind, oder weil der Aufwand den Nutzen nicht rechtfertigt.

| # | Wo | Was | Änderung nötig in |
|---|---|---|---|
| 1 | `fluss_logik.js` | Wochenlänge Mo–Sa (6 Tage). Sonntag ist immer Betriebspause. | `getWeekDates()`: `length: 6` → 7; `TAG_NAMEN`-Logik anpassen |
| 2 | `fluss_logik.js` | Sonderschicht-Kandidaten nur Samstag (`dayJS === 6`). Andere Ruhetage funktionieren nicht. | Samstag-Sonderschicht-Block auf konfigurierbaren Ruhetag umstellen |
| 3 | `fluss_logik.js` | Max. 1 Sonderschicht-Kandidat (`.slice(0, 1)`). Mehrere gleichzeitig nicht möglich. | `.slice(0, 1)` entfernen oder Limit konfigurierbar machen |
| 4 | `fluss_logik.js` | `autoVerteilFreieTage` kennt nur Mo–Sa als mögliche freie Tage. Sonntag fehlt explizit. | `tagZaehler` erweitern |
| 5 | `index.html` | Azubi-Zeile: Freitag heißt immer "Schule". Bäckerei/Berufsschul-spezifisch. | Render-Zeile im Azubi-Block: `tag.tag === 'freitag' ? 'Schule' : 'Frei'` |
| 6 | `index.html` | Zeile "Verfügbar" / "Sonderschicht" — Beschriftung fest im Code. | Label aus Config oder Einstellungen lesen |

### Konfigurierbar (seit letztem Stand)

- **Azubi-gesperrte Attribute**: in Konfiguration → Einstellungen pflegbar. Standard: `["versand"]`. Weitere Attribute können hinzugefügt werden.

### Bekannte algorithmische Grenzen

| Thema | Beschreibung |
|---|---|
| Fix-up-Pass | Löst nur einstufige Tauschketten. Drei-Personen-Ketten (A→B→C) werden nicht erkannt. |
| Varianten | Entstehen nur bei echtem Score-Gleichstand. Bei eindeutiger Datenlage immer 1 Variante. |
| Mehrtages-Override | Manuelle Overrides gelten pro Tag. Eine "für den Rest der Woche"-Funktion fehlt. |

### Offene Ideen (dokumentiert)

- **Mehrstufen-Tauschvorschläge**: z.B. "Jörg frei Do → Lars Teigmacher → Azubi 22Uhr"
- **Optimierungs-Vorschläge ohne Joker**: System erkennt wenn jemand auf einem nicht-Sa-Tag verfügbar ist und schlägt Freie-Tag-Verschiebung vor
- **Wochenmuster für Frosterliste**: Mo–So Basismuster pro Produkt (Langzeit-Idee)
- **Datenvalidierung im Export**: Prüfung ob Plan vollständig vor Export

---

*Erstellt im Rahmen von BäckereiOS — April 2026*  
*Entwickelt in Zusammenarbeit mit Claude (Anthropic)*
