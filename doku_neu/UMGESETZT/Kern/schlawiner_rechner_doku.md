# Schlawiner-Rechner — Technische Dokumentation

**Datei:** `schlawiner_rechner.html`  
**Pfad im Repo:** `schlawiner_rechner/schlawiner_rechner.html`  
**Letzte Änderung dokumentiert:** April 2026  

---

## 1. Zweck der Seite

Der Schlawiner-Rechner nimmt die tagesaktuelle Sortenverteilung der Schlawiner-Produktion entgegen und berechnet daraus:

- Gesamte Teiglinge der Backstube
- Benötigte Bleche à 48 Stück (Gesamtübersicht)
- Schnittarbeit: Bleche für Stangen & Brote, aufgeteilt nach mit/ohne Mehl
- Schlawinerbleche für normale Sorten (mit/ohne Mehl), aufgeteilt nach Lochblech-Stationen (à 20 Stück)
- Druckausgabe: 2-seitiges A4-Formular für die Backstube

---

## 2. Tab-Struktur

Die Seite hat **drei Tabs**, umgeschaltet via `switchTab(tab)`:

| Tab-ID | Label | Funktion |
|---|---|---|
| `eingabe` | 📋 Eingabe | Zahlen eingeben, importieren |
| `auswertung` | 📊 Auswertung | Berechnetes Ergebnis anzeigen |
| `dbprompt` | 📸 Erfassung | KI-Prompt + DB-Import/Speichern |

Beim Wechsel auf `auswertung` wird automatisch `calc()` ausgeführt.

---

## 3. Das SORTEN-Array — Herzstück der Datendefinition

```js
var SORTEN = [
  { id, name, typ, tpe, mehl },
  ...
]
```

**Jedes Objekt hat genau 5 Felder:**

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | String | Eindeutiger Bezeichner; entspricht dem `inp_`-Prefix der Eingabefelder (`inp_stange3` usw.) |
| `name` | String | Anzeigename in der UI |
| `typ` | String | `'normal'` / `'stange'` / `'brot'` — bestimmt in welchem Block die Sorte erscheint |
| `tpe` | Integer | **Teiglinge pro Einheit** — entscheidend für alle Berechnungen |
| `mehl` | Boolean | `true` = mit Mehl, `false` = ohne Mehl |

### Aktuelle SORTEN-Liste

| id | name | typ | tpe | mehl |
|---|---|---|---|---|
| `schlawiner` | Schlawiner | normal | 1 | true |
| `kuerbis` | Kürbis-Schlawiner | normal | 1 | false |
| `sonnen` | Sonnen-Schlawiner | normal | 1 | false |
| `mohn` | Mohn-Schlawiner | normal | 1 | false |
| `koerner` | gem.Körner Schlawiner | normal | 1 | false |
| `sesam` | Sesam-Schlawiner | normal | 1 | false |
| `kuerbiskaese` | Kürbis-Käse-Schlawiner | normal | 1 | false |
| `loewen` | Löwen-Schlawiner | normal | 1 | false |
| `stange3` | Schlawinerstange (3) | stange | 3 | true |
| `stange5` | Schlawinerstange (5) | stange | 5 | true |
| `brot6` | Schlawinerbrot (6) | brot | 6 | true |
| `kuestange3` | Kü.schlawiner-Stange (3) | stange | 3 | false |
| `sostange3` | So.Schlawiner-Stange (3) | stange | 3 | false |
| `gemstange3` | Schlawinerstange gem. (3) | stange | 3 | false |
| `loewenstange` | Löwen-Schlawinerstange | stange | 3 | false |
| `kuestange5` | Kü.schlawiner-Stange (5) | stange | 5 | false |

> ⚠️ **Kritisch:** Alle Berechnungen basieren auf diesem Array. Eine neue Sorte **muss** hier eingetragen werden, bevor sie irgendwo sonst auftaucht. Ohne Eintrag in SORTEN wird sie nirgends mitgerechnet.

---

## 4. Eingabefelder

Jede Sorte hat genau ein Eingabefeld mit der ID `inp_` + `s.id`:

```html
<input id="inp_stange3" type="number" inputmode="numeric" min="0" value="0" oninput="calc()">
```

**Was wird eingegeben?**

- Bei normalen Sorten (`typ:'normal'`, `tpe:1`): **Anzahl der Teiglinge** (= Stück)
- Bei Stangen/Broten (`typ:'stange'/'brot'`, `tpe > 1`): **Anzahl der Stangen/Brote** — also die echten Einheiten, nicht die Teiglinge dahinter

Jede Eingabe triggert sofort `calc()`.

---

## 5. Kernberechnungen in `calc()`

```js
var vals = {};
SORTEN.forEach(function(s) {
  vals[s.id] = parseInt(document.getElementById('inp_' + s.id).value) || 0;
});
```

### 5.1 Gesamte Backstube-Teiglinge

```js
var backstube = 0;
SORTEN.forEach(function(s){ backstube += vals[s.id] * s.tpe; });
var bleche48 = backstube / 48;
```

`vals[s.id] * s.tpe` ist der Teigling-Anteil jeder Sorte. Für normale Sorten (`tpe:1`) entspricht das direkt der Eingabe; für Stangen mit `tpe:3` werden z.B. 24 Stangen zu 72 Teiglinge.

### 5.2 Mit/Ohne Mehl — nur normale Sorten

```js
var mehlNormalT = 0, keinNormalT = 0;
SORTEN.filter(function(s){ return s.typ === 'normal'; }).forEach(function(s){
  if (s.mehl) mehlNormalT += vals[s.id]; else keinNormalT += vals[s.id];
});
```

Da normale Sorten `tpe:1` haben, ist `vals[s.id]` hier bereits die Teiglinge. Bleche = Teiglinge / 48.

---

## 6. Schnittarbeit — `renderSchnittGruppiert(vals)`

Zeigt die Bleche für Stangen & Brote, gruppiert nach `tpe` (3er / 5er / 6er).

```js
var gruppen = [
  { tpe:3, label:'3er Stangen' },
  { tpe:5, label:'5er Stangen' },
  { tpe:6, label:'Brote (6er)' },
];
```

Für jede Gruppe werden alle SORTEN mit passendem `tpe` und `typ === 'stange'/'brot'` gesammelt und aufaddiert:

```js
var mehlT = 0, keinT = 0, mehlStk = 0, keinStk = 0;
sorten.forEach(function(s){
  var t = vals[s.id] * s.tpe;
  if (s.mehl) { mehlT += t; mehlStk += vals[s.id]; }
  else        { keinT += t; keinStk += vals[s.id]; }
});
```

| Variable | Bedeutung |
|---|---|
| `mehlT` | Teiglinge mit Mehl in dieser Gruppe → für Blechberechnung |
| `keinT` | Teiglinge ohne Mehl → für Blechberechnung |
| `mehlStk` | Anzahl der Stangen/Brote mit Mehl → für Anzeige "X Stk." |
| `keinStk` | Anzahl der Stangen/Brote ohne Mehl → für Anzeige "X Stk." |

> ⚠️ **Wichtig:** `mehlStk`/`keinStk` sind die echten Stangen/Brote aus dem Eingabefeld, **nicht** die Teiglinge. Für die Blechzahl werden die Teiglinge (`mehlT`/`keinT`) verwendet: `mehlT / 48`.

**Angezeigt wird pro Chip:**
- Blechzahl (aus Teiglinge / 48)
- Stück (direkte Stangen-/Brot-Anzahl aus Eingabe)

---

## 7. Lochbleche — `renderLoch(slot, vals, mitMehl)`

Nur für **normale Sorten** (`typ:'normal'`). Lochblech à 20 Stück.

```js
var lochbleche = menge / 20;
var volle = Math.floor(lochbleche);
var einzelne = Math.round((lochbleche - volle) * 20);
```

Ausgabe z.B.: `3 volle + 7 einzelne` oder `2 volle` oder `14 einzelne`.

---

## 8. Druck — `drucken()`

Erzeugt zwei HTML-Seiten in `#print-container`, dann `window.print()`.

### Seite 1 (`print-page1`):
- Grundlage: Bleche à 48 gesamt
- Schnittarbeit Stangen & Brote (identische Logik wie `renderSchnittGruppiert`, inkl. Stk.-Anzeige)
- Schlawinerbleche normale Sorten (mit/ohne Mehl)
- Sticken-Zählgitter (1–12, je mit Mehl-Checkbox)

### Seite 2 (`print-page2`):
- Lochblech-Station: normale Sorten nach mit/ohne Mehl
- Stangen & Brote je nach mit/ohne Mehl mit Stückzahl

> ⚠️ **Wenn `renderSchnittGruppiert` geändert wird, muss die parallele Logik in `drucken()` identisch mitgepflegt werden.** Beide Stellen rechnen unabhängig voneinander.

### Print-CSS

Alle Print-Styles sind unter `@media print` definiert. Klassen-Präfix: `pp-`. Die Seite blendet beim Drucken alles außer `#print-container` aus:

```css
body > *:not(#print-container) { display: none !important; }
#print-container { display: block !important; }
```

---

## 9. Datenaustausch

### 9.1 Base64-Share/Import (Tab Eingabe)

`teilen()` serialisiert alle `vals` als JSON, Base64-kodiert, mit Marker:

```
🥐 Schlawiner-Zahlen
---SCHLAWINER---
<base64>
```

`importVals()` liest den Marker, dekodiert, füllt Eingabefelder.

> ⚠️ Die Keys im Base64-Objekt sind die **SORTEN-ids** (`stange3`, `kuerbis` usw.), nicht die DB-Keys.

### 9.2 DB-Auto-Fill aus `schlawiner_db.json` / localStorage

`ladeAusDB()` läuft bei `window.onload`. Zeitfenster:

| Uhrzeit | Verhalten |
|---|---|
| 18:00–23:59 | Lädt Daten für **morgen** |
| 00:00–05:59 | Lädt Daten für **heute** |
| 06:00–17:59 | Kein Auto-Fill |

Reihenfolge: erst `localStorage` (`schlawiner_db`), dann Fallback auf `schlawiner_db.json` via fetch.

Gültigkeitsfenster: 12 Stunden ab `gespeichert_am`. Ältere Daten werden ignoriert.

### 9.3 DB_KEY_MAP — Übersetzung SORTEN-id → JSON-Key

```js
var DB_KEY_MAP = {
  'schlawiner':   'schlawiner_klassisch_stueck',
  'stange3':      'schlawiner_stange3_stueck',
  ...
};
```

Der SORTEN-id `schlawiner` heißt in der DB `schlawiner_klassisch_stueck` — das ist die einzige Stelle wo diese Übersetzung stattfindet.

> ⚠️ Neue Sorte = neuer Eintrag in `DB_KEY_MAP` + in `SCHLAWINER_KEYS`.

### 9.4 SCHLAWINER_KEYS

```js
var SCHLAWINER_KEYS = [
  'schlawiner_gesamt_stueck', 'schlawiner_gesamt_bleche',
  'schlawiner_klassisch_stueck', ...
];
```

Diese Liste wird im **Erfassungs-Tab** verwendet, um importierte JSON-Daten zu validieren und zu filtern. Sie muss alle Keys enthalten, die die DB haben kann.

---

## 10. Sitzungsspeicherung (localStorage)

| Key | Inhalt | Zweck |
|---|---|---|
| `schlawiner_last` | `{ id: wert, ... }` | Letzte eingegebene Werte — werden beim nächsten Öffnen vorgeladen |
| `schlawiner_db` | `{ gespeichert_am, produkte: {...} }` | DB-Daten aus Erfassungs-Tab, 12h gültig |
| `schlawiner_history` | Array von `{ datum, ... }` | Gespeicherte Einträge (History-Hinweis in UI) |

---

## 11. Neue Sorte hinzufügen — Checkliste

1. **SORTEN-Array** — neues Objekt mit `id`, `name`, `typ`, `tpe`, `mehl`
2. **Eingabe-HTML** — neues `<div class="inp-row">` im passenden Section-Card-Block
3. **DB_KEY_MAP** — `'neue_id': 'schlawiner_neue_id_stueck'`
4. **SCHLAWINER_KEYS** — `'schlawiner_neue_id_stueck'` anhängen
5. **KI-Prompt** im Erfassungs-Tab (`dbp-prompt-ta`) — neue Zeile im Mapping

> Wenn alle 5 Punkte erledigt sind, ist die Sorte automatisch in allen Berechnungen, der Auswertung und dem Druck enthalten — da alles über das SORTEN-Array iteriert.

---

## 12. Neue Gruppe (tpe-Wert) hinzufügen

Falls eine neue Gruppierung nötig wird (z.B. 4er Stangen):

1. Neues Objekt in `gruppen`-Array in `renderSchnittGruppiert()`
2. **Identisches** Objekt in `gruppen`-Array in `drucken()` — beide Stellen sind unabhängig
3. SORTEN-Einträge mit neuem `tpe`-Wert anlegen

---

## 13. Tabu-Zonen / Was nicht geändert werden darf

- **`tpe`-Werte** in SORTEN dürfen nicht geändert werden — sie spiegeln reale Backgegebenheiten wider (3 Teiglinge auf einer Stange usw.)
- **Lochblech-Divisor 20** und **Blech-Divisor 48** sind feste Backstube-Werte
- **Print-Layout** (`@media print`): Seitenaufteilung auf 2 Seiten ist bewusst so — Seite 1 = Vorbereitung, Seite 2 = Lochblech-Station
- **Zeitfenster** in `getZielDatum()` sind auf den Nachtschicht-Workflow abgestimmt

---

## 14. Abhängigkeiten

| Ressource | Zweck |
|---|---|
| `../systemdesign.css` | BäckereiOS-Basisstyles (Variablen, Typografie) |
| `../shell.js` | Navigation/Shell-Integration |
| `schlawiner_db.json` | Optionale DB-Datei für Auto-Fill (muss im selben Ordner liegen) |
| Phosphor Icons `@2.1.1` | Icons (via shell.js eingebunden) |

Die Seite hat **keine weiteren externen Abhängigkeiten** und funktioniert vollständig offline.

---

## 15. Bekannte Eigenheiten

- `vals` enthält bei Stangen/Broten die **Einheiten-Anzahl** (Stangen), nicht Teiglinge. Teiglinge werden erst durch `* s.tpe` berechnet.
- Der Druck-Container ist im DOM immer vorhanden, aber per CSS auf `display:none` — erst beim Drucken sichtbar.
- `history_hint` zeigt die Anzahl gespeicherter Verlaufseinträge an, aber das History-Feature selbst ist nicht vollständig implementiert (localStorage-Key wird gesetzt, aber keine dedizierte Ansicht).
- `getZielDatum()` gibt `null` zurück wenn tagsüber (06:00–17:59) — `ladeAusDB()` prüft das nicht explizit, aber `dbpFuelleFelder()` filtert ältere Daten über den 12h-Check.
