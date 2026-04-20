# Arbeitsplan-Generator — Technische Dokumentation

> Stand: April 2026 · Nachtschicht-Konfiguration · Vanilla HTML/JS, Single-File

---

## 1. Systemübersicht

Der Generator erstellt einen wochenweisen Arbeitsplan für eine Nachtschicht-Belegschaft. Er löst zwei getrennte Probleme:

1. **Wer bekommt frei?** — Faire Rotation, gewichtet nach Wochentag
2. **Wer arbeitet wo?** — Postenbesetzung nach Fest/Flex-Logik

Diese zwei Schritte laufen sequenziell pro Tag, Mo bis Sa.

### Dateien

| Datei | Inhalt | Gespeichert |
|---|---|---|
| `arbeitsplan_config.json` | Mitarbeiter, Joker, Posten, Azubi, Springer-Pool | Download/Upload |
| `arbeitsplan_chronik.json` | Freie-Tage-Historie, Springer-Historie | Download/Upload |
| `localStorage AP2C` | Config (Sitzungs-Cache) | Browser |
| `localStorage AP2H` | Chronik (Sitzungs-Cache) | Browser |
| `localStorage AP2W` | Wochendaten (Sitzungs-Cache) | Browser |

---

## 2. Datenstrukturen

### 2.1 `cfg` — Konfiguration

```json
{
  "mitarbeiter": [
    { "id": "abc123", "name": "Rosa" }
  ],
  "joker": [
    { "id": "xyz789", "name": "Klaus (Früh)", "posten": ["posId1", "posId2"] }
  ],
  "posten": [
    {
      "id": "pos001",
      "name": "Ofen",
      "samstag": true,
      "isFest": true,
      "hierarchie": ["maId_Ulf", null, null, null, null]
    },
    {
      "id": "pos002",
      "name": "Rheon",
      "samstag": true,
      "isFest": false,
      "hierarchie": ["maId_Lars", "maId_Heinzi", null, null, null]
    }
  ],
  "azubi": {
    "aktiv": true,
    "name": "Felix",
    "schultag": 4,
    "schicht": "pos003"
  },
  "springerPool": ["maId_Rosa", "maId_Harrison"]
}
```

#### Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `mitarbeiter[].id` | string | Eindeutige ID (uid) |
| `mitarbeiter[].name` | string | Anzeigename |
| `joker[].posten` | string[] | PostenIds die dieser Joker abdecken darf |
| `posten[].isFest` | boolean | `true` = Feste Kraft + Kaskade; `false` = gleichberechtigter Flex-Pool |
| `posten[].samstag` | boolean | Posten am Samstag aktiv? |
| `posten[].hierarchie` | (string\|null)[5] | Rang 0 = Stammkraft/Pool-1, Rang 1–4 = Vertretung/Pool-2–5 |
| `azubi.schultag` | 0–5 | Wochentag-Index (0=Mo, 5=Sa) |
| `azubi.schicht` | string\|null | PostenId für Notfall-Einsatz |
| `springerPool` | string[] | MitarbeiterIds die Samstag-Springer sein dürfen |

---

### 2.2 `chr` — Chronik

```json
{
  "freieTage": [
    { "personId": "maId_Rosa", "datum": "2026-04-19", "tagTyp": "sa" },
    { "personId": "maId_Lars", "datum": "2026-04-14", "tagTyp": "mo" }
  ],
  "springer": [
    { "personId": "maId_Rosa", "datum": "2026-04-18" }
  ]
}
```

| Feld | Werte | Bedeutung |
|---|---|---|
| `tagTyp` | `"sa"` / `"mo"` / `"normal"` | Tagestyp für gewichtete Rotation |
| `springer[].datum` | ISO-Datum | Letzter Springer-Einsatz (Sa) |

---

### 2.3 `wo` — Wochendaten (nicht persistent in Datei)

```json
{
  "kw": 17,
  "year": 2026,
  "abwesenheiten": [
    { "id": "uid", "personId": "maId_Dominik", "von": "2026-04-20", "bis": "2026-04-25", "typ": "urlaub" }
  ],
  "freiwuensche": [
    { "id": "uid", "personId": "maId_Jörg", "tag": 5 }
  ],
  "springerAktiv": true
}
```

---

### 2.4 Laufzeitvariablen im Generator

| Variable | Typ | Bedeutung |
|---|---|---|
| `weekFrei` | `{personId: number}` | Anzahl freier Tage diese Woche pro Person |
| `weekWorked` | `{personId: number}` | Anzahl Arbeitstage diese Woche (für Flex-Rotation) |
| `used` | `Set<string>` | Heute bereits verplante Personen (absent + frei + zugewiesen) |
| `freiSet` | `Set<string>` | Heutige freie Personen |
| `abwSet` | `Set<string>` | Heute abwesende Personen (Urlaub/Krank) |
| `actP` | Posten[] | Aktive Posten heute (Sa-inaktive gefiltert) |
| `sortedActP` | Posten[] | Wie `actP`, sortiert nach Besetzungsschwierigkeit |
| `azubiStatus` | string\|null | `'schule'` / `'frei'` / `'lernt'` / Postenname |
| `springerAktivHeute` | boolean | Ob Springer heute tatsächlich aktiv ist |

---

## 3. Kernalgorithmus

### Übersicht pro Tag

```
Für jeden Tag di ∈ [Mo=0 … Sa=5]:

  1. Abwesende bestimmen (abwSet)
  2. Verfügbare bestimmen (verfuegbar)
  3. Aktive Posten bestimmen (actP)
  4. naturalFree berechnen
  5. Springer-Entscheidung
  6. pickFrei() → freiIds
  7. Azubi-Status setzen
  8. Posten sortieren (schwierigste zuerst)
  9. Posten besetzen (Fest/Flex → Joker → Azubi)
 10. Springer bestimmen
 11. Ghost-Fix: Übrige → bonusFrei
 12. Tagesergebnis speichern
```

---

### 3.1 Freie Tage berechnen

```
naturalFree = max(0, verfuegbar.length - actP.length)
```

Mit 9 Mitarbeitern, 1 abwesend, 7 Posten Mo–Fr:
→ `naturalFree = max(0, 8 - 7) = 1`

Mit 9 Mitarbeitern, 0 abwesend, 6 Sa-Posten:
→ `naturalFree = max(0, 9 - 6) = 3`

---

### 3.2 Springer-Entscheidung

```javascript
// Schritt 1: Mit vollem naturalFree simulieren
potentialFrei = pickFrei(di, verfuegbar, naturalFree, ...)

// Schritt 2: Springer nur wenn jemand bereits einen freien Tag diese Woche hat
springerAktivHeute = isSa && wo.springerAktiv
                   && potentialFrei.some(pid => weekFrei[pid] > 0)

// Schritt 3: Wenn Springer aktiv → einen Slot weniger
freiIds = springerAktivHeute
  ? pickFrei(di, verfuegbar, naturalFree - 1, ...)
  : potentialFrei
```

**Wichtig:** Springer aktiviert sich nur wenn jemand seinen *zweiten* freien Tag der Woche bekäme — nicht wenn generell 2 Personen frei wären.

---

### 3.3 `pickFrei()` — Inkrementelle Auswahl mit Feasibility-Check

```
Für jeden der canFree Slots:
  Für jeden verfügbaren, noch nicht gefrei-ten Kandidaten:
    Score berechnen (s)
    canFreePerson() prüfen
    → wenn false: s -= 100.000 (effektiv geblockt)
  Person mit höchstem Score → frei
```

#### Scoring-Formel

```
s = Wunschbonus
  + Rotationsbonus (Tagtyp-gewichtet)
  + Inaktivitätsbonus (Tage seit letztem Frei-Tag)
  - Doppelfreistag-Penalty
  + Sa-Springer-Rotationsbonus (wenn Sa+Springer)
  + Zufalls-Tiebreaker
  - 100.000 (wenn Feasibility fehlschlägt)
```

| Komponente | Wert | Bedingung |
|---|---|---|
| Wunschbonus | +500 | Freiwunsch für diesen Tag eingetragen |
| Rotationsbonus | `(50 - chrFreiCnt * 12) * tagWeight` | Weniger Frei-Tage dieses Typs = höher |
| Inaktivitätsbonus | `min(daysSinceFree, 40) * 2` | Max +80 |
| Doppelfreistag-Penalty | `-(weekFrei * 2000)` | Pro bereits freiem Tag diese Woche |
| Springer-Rotationsbonus | `max(0, 20 - weeksSinceSpringer) * 30` | Wer kürzlich Springer war → bevorzugt frei |
| Zufalls-Tiebreaker | `random() * 4` | Verhindert Muster bei Gleichstand |
| Feasibility-Block | -100.000 | Wenn Freistellen FEHLT verursacht |

#### Taggewichtung (`tagWeight`)

| Typ | Gewicht | Bedeutung |
|---|---|---|
| `sa` | 3.0 | Samstag wertvollster freier Tag |
| `mo` | 1.5 | Montag mittlerer Wert |
| `normal` | 1.0 | Di–Fr Basiswert |

---

### 3.4 `canFreePerson()` — Feasibility-Simulation

Bevor eine Person als frei markiert wird, prüft diese Funktion: *Können trotzdem alle Posten besetzt werden?*

```javascript
function canFreePerson(personId, actP, unavail):
  sim = unavail ∪ {personId}
  sorted = actP sortiert nach (Anzahl verfügbarer Hierarchie-Personen, aufsteigend)
  used = sim

  für jeden Posten in sorted:
    person = erste in hierarchie die nicht in used ist
    wenn keine → joker = erster Joker mit dieser Qualifikation der nicht in used ist
    wenn kein Joker → return false  // FEHLT würde entstehen
    markiere Person/Joker als used

  return true
```

**Komplexität:** O(P × H) pro Kandidat, O(N × P × H) gesamt pro Tag.
Mit N=9, P=7, H=5: ~315 Operationen/Tag. Unkritisch.

---

### 3.5 Postenbesetzung

Posts werden in aufsteigender Schwierigkeit bearbeitet:

```
sortedActP = actP sortiert nach:
  pos.hierarchie.filter(id => id && !used && !absent).length  (aufsteigend)
```

Posts mit wenigen verfügbaren Personen kommen zuerst — verhindert, dass Flex-Pools Personen wegnehmen, die als Vertretung dringend benötigt werden.

#### Fest-Posten (`isFest = true`)

```
Für r = 0 bis 4:
  pid = hierarchie[r]
  wenn pid && pid nicht in used:
    → Person zuweisen, rang = r+1
    → break
```

Rang 1 = Feste Kraft · Rang 2–3 = Vertretung · Rang 4–5 = letzter Ausweg

#### Flex-Posten (`isFest = false`)

```
pool = hierarchie.filter(id => id && id nicht in used)
pool.sort(aufsteigend nach weekWorked[id])
Person mit wenigsten Arbeitstagen diese Woche → zuweisen
```

Alle Pool-Mitglieder gleichberechtigt. Lastverteilung über Woche.

#### Joker-Fallback

```
Wenn Posten nach Hierarchie/Pool nicht besetzt:
  Für jeden Joker in cfg.joker:
    wenn Joker nicht in used
    && pos.id in joker.posten:
      → Joker zuweisen
```

#### Azubi-Fallback

```
Wenn Posten nach Joker nicht besetzt:
  wenn azubi.aktiv
  && azubiStatus === 'lernt'
  && azubi.schicht === pos.id:
    → Azubi zuweisen, azubiStatus = Postenname
```

---

### 3.6 Springer-Auswahl

```
Wenn springerAktivHeute:
  leftover = verfuegbar.filter(m => m nicht in used && m.id in springerPool)
  leftover.sort(absteigend nach weekFrei[id])  // meisten freien Tagen diese Woche
  springerId = leftover[0] oder null
```

Der Springer ist die Person aus dem qualifizierten Pool, die diese Woche bereits am meisten frei hatte — also den geringsten "Anspruch" auf einen weiteren freien Tag hat.

---

### 3.7 Ghost-Fix — bonusFrei

```
leftoverPersons = verfuegbar.filter(m => m nicht in used)
leftoverPersons.sort(aufsteigend nach weekFrei[id])  // wenigste Frei-Tage zuerst
bonusFrei = leftoverPersons.map(id)
```

Personen die weder zugewiesen noch frei sind (weil kein passender Posten), werden automatisch als frei markiert. Sortierung bevorzugt Personen ohne bisherigen Frei-Tag.

---

### 3.8 Azubi-Logik

| Bedingung | Status | Anzeige im Plan |
|---|---|---|
| `di === azubi.schultag` | `'schule'` | 🎓 Schule |
| `di === (azubi.schultag + 1) % 6` | `'frei'` | 🏖 Frei |
| `di` = anderer Tag | `'lernt'` | 👀 Lernt |
| Azubi füllt Notfall-Posten | Postenname | 📋 [Postenname] |

Der Azubi zählt nicht zur Frei-Rotation und beeinflusst `naturalFree` nicht.

---

## 4. Rendering

### Plan-Tabelle

| Zellenklasse | Bedeutung | Farbe |
|---|---|---|
| `r1` | Feste Kraft (Rang 1) | weiß |
| `r2` | Vertretung V1 | leicht blau |
| `r3` | Vertretung V2 | leicht gelb |
| `r4` | Vertretung V3 | amber/gelb |
| `r5` | Vertretung V4 | orange |
| `joker-td` | Joker-Einsatz | rot |
| `fehlt-td` | Nicht besetzbar | dunkelrot |
| Flex-Pool-Zelle | isFlex=true | blauer Punkt, kein Rang |

### Freie-Tage-Übersicht (unter Legende)

| Farbe | Bedeutung |
|---|---|
| Grün ✓ | Genau 1 freier Tag |
| Rot ✗ | Kein freier Tag |
| Gelb ✓ (2×) | 2 freie Tage (Bonus) |

---

## 5. Bekannte Grenzen & Limitierungen

### 5.1 Mathematische Unausweichlichkeit der Doppel-Freitage

Mit **N Mitarbeitern** und **P Posten** entstehen täglich `N - P` freie Slots.
Über 6 Tage: `(N-P)*5 + (N-P_Sa)*1` Slots gesamt.

Beispiel: 9 Mitarbeiter, 7 Posten Mo–Fr, 6 Posten Sa, 0 Abwesende:
→ `5*2 + 1*3 = 13` Frei-Slots für 9 Personen
→ **4 Personen bekommen zwingend 2 freie Tage**

Dieser Überschuss lässt sich durch den Samstag-Springer um 1 reduzieren (auf 12), aber nie vollständig eliminieren solange Mo–Fr mehr als `N - P_Mo_Fr = 2` Slots entstehen.

### 5.2 Kein Mehrtages-Look-ahead

Der Generator optimiert **jeden Tag isoliert**. Die Feasibility-Prüfung (`canFreePerson`) arbeitet nur auf dem aktuellen Tag. Entscheidungen vom Montag (z.B. jemanden frei geben) können Donnerstag zu Problemen führen, wenn diese Person als einzige Vertretung für einen anderen Posten qualifiziert wäre.

Vollständiger Look-ahead wäre NP-schwer für diese Problemgröße und würde die Laufzeit drastisch erhöhen.

### 5.3 Flex-Pool: Reihenfolge bei Gleichstand

Haben zwei Pool-Mitglieder gleich viele Arbeitstage diese Woche (`weekWorked` identisch), entscheidet die Reihenfolge in der Liste (wer zuerst eingetragen wurde). Es gibt keine Chronik darüber, wer welchen Flex-Posten zuletzt gemacht hat.

### 5.4 Joker-Reihenfolge

Bei mehreren qualifizierten Jokern wird der erste in der Liste genommen. Keine Rotation zwischen Jokern implementiert.

### 5.5 Keine manuelle Plan-Korrektur in der UI

Einmal generiert, ist der Plan nicht im Browser editierbar. Anpassungen erfordern Neu-Generierung. Manuelle Korrekturen müssen außerhalb des Tools gemacht werden (z.B. auf dem Ausdruck).

### 5.6 Wunsch-freie-Tage können Gesamtqualität senken

Ein starker Wunsch (+500 Punkte) kann den Algorithmus dazu bringen, eine Person zu befreien, die eigentlich besser für einen schwierigen Posten geeignet wäre. In solchen Fällen zeigt der Generator eine Warnung ("Wunsch nicht erfüllbar"), aber nur wenn der Wunsch gar nicht erfüllt werden konnte — nicht wenn er zu einem suboptimalen Gesamt-Plan geführt hat.

### 5.7 Springer-Pool-Lücke

Wenn der qualifizierte Springer-Pool keine Person enthält, die diese Woche bereits einen freien Tag hatte (also alle Pool-Mitglieder haben noch keinen Frei-Tag), aktiviert der Springer sich nicht — auch wenn `springerAktiv = true`.

Das ist beabsichtigt: niemand soll als Springer arbeiten müssen ohne seinen Frei-Tag bekommen zu haben.

### 5.8 Sa-inaktive Posten erhöhen Frei-Slots

Wenn Posten samstags inaktiv sind (`samstag = false`), steigt `naturalFree` am Samstag entsprechend. Das kann dazu führen, dass samstags mehr Leute frei sind als in einer normalen Woche erwartet.

### 5.9 Keine Postenrotations-Chronik für Flex-Pools

Die Chronik trackt nur *wann jemand frei hatte* (Tagestyp Sa/Mo/Normal). Sie trackt **nicht**, welchen Flex-Posten jemand zuletzt besetzt hat. Langfristige Rotation über Flex-Posten hinweg (z.B. Lars immer Rheon, nie 22Uhr) findet algorithmisch nicht statt.

### 5.10 Azubi-Schultag-Berechnung bei Samstag

`(azubi.schultag + 1) % 6` berechnet "Tag nach Schultag". Bei Schultag=Freitag (4) ergibt das Samstag (5) — korrekt. Bei Schultag=Samstag (5) ergibt das Sonntag (6 % 6 = 0 = Montag) — der Frei-Tag wäre Montag der folgenden Woche, was de facto bedeutet: kein automatischer Frei-Tag in der geplanten Woche.

---

## 6. Variablenreferenz (Vollständig)

### Globaler State

| Variable | Initialisierung | Persistenz |
|---|---|---|
| `cfg` | `{ mitarbeiter:[], joker:[], posten:[], azubi:{...}, springerPool:[] }` | localStorage + JSON |
| `chr` | `{ freieTage:[], springer:[] }` | localStorage + JSON |
| `wo` | `{ kw:null, year:null, abwesenheiten:[], freiwuensche:[], springerAktiv:false }` | localStorage |
| `gplan` | `null` | Session only |

### Generator-Output (`gplan.daily[di]`)

| Feld | Typ | Inhalt |
|---|---|---|
| `date` | Date | JS-Datumsobjekt |
| `di` | 0–5 | Tag-Index |
| `typ` | `'sa'`/`'mo'`/`'normal'` | Tagtyp |
| `isSa` | boolean | Ist Samstag |
| `abwSet` | string[] | Abwesende PersonIds |
| `freiIds` | string[] | Freie PersonIds (inkl. bonusFrei) |
| `asgn` | `{posId: Assignment}` | Postenbesetzung |
| `actP` | Posten[] | Aktive Posten |
| `springerId` | string\|null | Springer PersonId |
| `azubiStatus` | string\|null | Azubi-Tagesstatus |

### Assignment-Objekt

| Feld | Typ | Bedeutung |
|---|---|---|
| `personId` | string | ID oder `'__AZUBI__'` |
| `rang` | 1–5, 99, 999 | 99=Joker, 999=Azubi |
| `isJoker` | boolean | Joker-Einsatz |
| `isFlex` | boolean | Flex-Pool-Zuweisung |
| `isAzubi` | boolean | Azubi-Einsatz |

---

## 7. Konfigurationsregeln

1. **Jeder Posten muss in `hierarchie[0]` entweder eine Person oder `null` haben.** Bei Fest-Posts ist `hierarchie[0]` die Feste Kraft. Bei Flex-Posts sind alle nicht-null Einträge gleichberechtigt.

2. **Dieselbe Person sollte pro Posten nur einmal in der `hierarchie` erscheinen.** Doppeleinträge werden nicht gefangen, führen aber zu korrektem Verhalten (zweiter Treffer würde nie greifen, da Person nach erstem Treffer in `used`).

3. **Joker mit leerem `posten`-Array können keinen Posten übernehmen.** Sie sind effektiv inaktiv.

4. **`springerPool: []` deaktiviert den Springer vollständig**, auch wenn `wo.springerAktiv = true`.

5. **Die Reihenfolge der Posten in `cfg.posten` ist irrelevant** — der Generator sortiert täglich nach Schwierigkeit.

6. **Azubi `schultag` und `schicht` sind unabhängig.** Azubi kann eine Schicht haben ohne Schultag zu nutzen (oder umgekehrt).
