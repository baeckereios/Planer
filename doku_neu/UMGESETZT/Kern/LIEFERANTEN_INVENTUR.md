# Lieferanten-Inventur — Architekturdokumentation

> BäckereiOS · Stand: April 2026  
> Datei: `lieferanten_inventur.html`  
> Zugehörige Daten: `lieferanten_config.json`, `lieferanten_bestand_db.json`, `lieferanten_db.json`

---

## Zweck

Erfassung des aktuellen Lagerbestands von Lieferantenprodukten (Tiefkühl, Kühl, Trocken, Sonstiges) sowie des täglichen Wareneingangs. Die gespeicherten Daten fließen in die Verbrauchsanalyse (`lieferanten_auswertung.html`) und in die Druckzentrale (Modul F) ein.

---

## Dateistruktur

Alles in einer einzigen HTML-Datei. Kein externes JS, kein externes CSS außer `systemdesign.css`.

```
lieferanten_inventur.html     ← diese Datei
lieferanten_config.json       ← Produktkonfiguration (gleicher Ordner)
lieferanten_bestand_db.json   ← Bestandshistorie, wird hier erzeugt
lieferanten_db.json           ← Eingangsdaten, wird hier erzeugt
systemdesign.css              ← BäckereiOS-Basis
shell.js                      ← Tab-Bar, Navigation (defer)
```

Die JSON-Dateien werden per `fetch()` geladen. Die Seite sucht immer zuerst unter `../datei.json`, dann unter `./datei.json` — falls die HTML in einem Unterordner liegt.

---

## Tab-Struktur

Drei Tabs mit bewusstem visuellem Konzept:

```
[ 📋 Inventur ] [ 🚚 Lieferung ] | [ 📊 Bestand ]
```

Die vertikale Trennlinie (`.tab-btn-sep`) trennt die zwei **Eingabe-Tabs** vom **Ergebnis-Tab** — schon im inaktiven Zustand erkennbar durch den leichten Aubergine-Schimmer des Bestand-Tabs.

### Farben

| Tab | Aktiv | Inaktiv | Bedeutung |
|---|---|---|---|
| Inventur | `#1e293b` dunkelgrau | transparent | Eingabe |
| Lieferung | `#1e293b` dunkelgrau | transparent | Eingabe |
| Bestand | `#6d4c7d` Aubergine | `rgba(109,76,125,0.08)` getönt | Ergebnis |

Inventur und Lieferung haben **dieselbe Aktivfarbe** — sie gehören zusammen. Bestand setzt sich durch Farbe und Tönung auch im inaktiven Zustand ab.

### View-Container

| ID | Hintergrund | Rahmen |
|---|---|---|
| `#view-inventur` | `rgba(30,41,59,0.03)` | `#cbd5e1` schiefergrau |
| `#view-lieferung` | `rgba(30,41,59,0.03)` | `#cbd5e1` schiefergrau |
| `#view-bestand` | `rgba(109,76,125,0.04)` | `#d8b4e8` lila |

### Tab-Breiten (dynamisch)

Kein Liefertag: Inventur flex 1.5 · Lieferung flex 0.5 (nur Icon) · Bestand flex 1  
Liefertag: alle flex 1, Lieferung zeigt vollen Text

---

## Datenquellen

### `lieferanten_config.json`

Wird beim Laden gefetcht. Struktur:

```json
{
  "produkte": [
    {
      "id": "mehl_tipo00",
      "name": "Mehl Tipo 00",
      "lagertyp": "trocken",
      "lieferant": "BÄKO",
      "soll_einheit": "kg",
      "liefertage": [1, 4],
      "gebinde": {
        "form": "Sack",
        "inhalt_stueck": 25,
        "inhalt_einheit": "kg"
      }
    }
  ],
  "einstellungen": {
    "sicherheitsaufschlag": 0.15
  }
}
```

`liefertage` ist ein Array von Wochentagen im Mo=0-Format (Montag=0, Dienstag=1, … Sonntag=6). Wird für `checkDeliveryDay()` und die Lieferungs-Tab-Ansicht verwendet.

### `lieferanten_bestand_db.json`

Array von Bestand-Snapshots, chronologisch sortiert. Wird von dieser Seite erzeugt und per Download ausgegeben.

```json
[
  {
    "datum": "2026-04-12",
    "wochentag": "Sonntag",
    "typ": "bestand",
    "timestamp": 1744416000000,
    "bestaende": {
      "mehl_tipo00": { "menge": 3, "einheit": "kg", "ts": 1744415800000 }
    }
  }
]
```

`timestamp` auf dem Snapshot (ms seit Epoch) ist der Zeitpunkt des Speicherns — wird für den 18h-Check im Bestand-Tab verwendet. `ts` auf jedem Produkt ist der Zeitpunkt der Einzelzählung.

**Wichtig:** Pro Tag gibt es maximal einen Snapshot. Wird an demselben Tag erneut gespeichert, wird der bestehende Eintrag überschrieben (`findIndex` auf `datum`).

### `lieferanten_db.json`

Array von Eingangs-Snapshots. Gleiches Prinzip wie `lieferanten_bestand_db.json`, aber `typ: 'eingang'`. Wird nur erzeugt wenn Liefermengen eingetragen wurden.

---

## Globale Variablen

| Variable | Typ | Inhalt |
|---|---|---|
| `config` | Array | Produkte aus `lieferanten_config.json` |
| `workingData` | Object | Arbeitskopie für laufende Zählung, Key = Produkt-ID |
| `eingangDaten` | Object | Liefermengen der aktuellen Sitzung, Key = Produkt-ID |
| `lieferantenDb` | Array | Geladene `lieferanten_db.json` |
| `bestandDb` | Array | Geladene `lieferanten_bestand_db.json` |
| `isDeliveryDay` | Boolean | true wenn heute Liefertag für mind. 1 Produkt |
| `pokaYokeState` | Boolean/null | Antwort auf Poka-Yoke-Frage (null = nicht beantwortet) |

### `workingData[id]`-Objekt

```js
{
  id: 'mehl_tipo00',
  name: 'Mehl Tipo 00',
  lagertyp: 'trocken',
  lieferant: 'BÄKO',
  gebinde: { form: 'Sack', inhalt_stueck: 25, inhalt_einheit: 'kg' },
  soll_einheit: 'kg',
  menge: 0,        // aktuell eingetippter Wert
  ts: 0,           // Timestamp der Eingabe (ms), 0 = noch nicht gezählt
  counted: false   // true sobald eine Zahl eingetippt wurde
}
```

---

## Funktionen

### Initialisierung

**`window.onload`** (async)  
Lädt nacheinander: `lieferanten_config.json` → `lieferanten_db.json` → `lieferanten_bestand_db.json`. Danach: `checkDeliveryDay()` → `prepareData()` → `renderInventur()` → `renderEingang()`.

**`prepareData()`**  
Befüllt `workingData` aus `config`. Menge/ts/counted starten bei 0/0/false.

**`checkDeliveryDay()`**  
Prüft ob heute (`(getDay()+6)%7`, Mo=0) in irgendeinem `p.liefertage` vorkommt. Setzt `isDeliveryDay`. Passt Tab-Flexbreiten und Poka-Yoke-Sichtbarkeit an.

---

### Tab-Navigation

**`switchTab(tab)`**  
Setzt CSS-Klassen (`active`/`inactive`) auf allen drei Tab-Buttons. Schaltet `display` der drei View-Container. Ruft bei Tab `'bestand'` direkt `renderBestand()` auf — damit ist der Bestand immer frisch wenn man draufklickt.

---

### Tab Inventur

**`renderInventur()`**  
Rendert `#main-list` neu aus `workingData`. Gruppiert nach `LAGERTYP_ORDER`. Ruft `updateFortschritt()` auf.

**`buildListRow(p, 'inventur')`**  
Erzeugt eine `.list-row` mit Zahlen-Input (`#inp_<id>`), Zeitstempel-Zeile (`#ts_<id>`, zunächst versteckt) und `counted`-Klasse falls bereits gezählt.

**`updateMengeDOM(id, val)`**  
Direkte DOM-Manipulation ohne Re-Render — bewusst für flüssiges Tippen. Setzt `workingData[id].counted/menge/ts`, toggled `.counted`-Klasse auf der Zeile, zeigt/versteckt Zeitstempel. Ruft `aktiviereButtons()` und `updateFortschritt()` auf.

**`updateFortschritt()`**  
Aktualisiert Fortschrittsbalken (`#fortschritt-fill`) und Label (`#fortschritt-label`).

---

### Tab Lieferung

**`renderEingang()`**  
Zeigt nur Produkte die heute einen Liefertag haben (`p.liefertage.includes(heute)`). Kein Liefertag heute → Hinweistext. Zeilen haben kein `counted`-Feedback.

**`buildListRow(p, 'lieferung')`**  
Wie Inventur-Zeile, aber ohne Zeitstempel-Zeile. Badge `Liefertag` erscheint wenn `istLiefertag === true`. Input schreibt direkt in `eingangDaten[id]`.

---

### Poka-Yoke

Erscheint nur an Liefertagen (`isDeliveryDay === true`).

**Frage:** "Ist die heutige Lieferung im gezählten Bestand enthalten?"  
**JA** (`pokaYokeState = true`): Beim Speichern wird die Liefermenge vom Bestand abgezogen → Altbestand wird gespeichert.  
**NEIN** (`pokaYokeState = false`): Bestand wird 1:1 gespeichert, kein Abzug.

Solange `pokaYokeState === null`: Speichern-Button gesperrt, auch wenn schon gezählt wurde.

**`setPokaYoke(state)`**  
Setzt `pokaYokeState`, aktualisiert Button-Styling, ruft `aktiviereButtons()`.

---

### Speichern

**`speichernAlles()`**  

Schritt 1 — Eingang (nur wenn `eingangDaten` nicht leer):  
Baut `{ datum, wochentag, typ:'eingang', eintraege }` und fügt es in `lieferantenDb` ein (upsert per Datum+Typ). Trigger Download `lieferanten_db.json`.

Schritt 2 — Bestand:  
Iteriert `workingData`, überspringt ungezählte. Wenn `isDeliveryDay && pokaYokeState === true`: `finalMenge = menge - (eingangDaten[id] || 0)`, mindestens 0.  
Baut `{ datum, wochentag, typ:'bestand', timestamp: Date.now(), bestaende }` und fügt es in `bestandDb` ein (upsert per Datum). Trigger Download `lieferanten_bestand_db.json`.

Schritt 3 — UI: Button zeigt "✓ Gespeichert um HH:MM" für 4 Sekunden.

**`aktiviereButtons()`**  
Speichern-Button: disabled wenn nichts gezählt, oder wenn Liefertag + `pokaYokeState === null`.  
WhatsApp-Button: disabled wenn nichts gezählt.

---

### WhatsApp-Export

**`exportWhatsApp()`**  
Baut eine formatierte Textnachricht mit allen gezählten Produkten gruppiert nach Lagertyp. Hängt am Ende einen Base64-Block an (`---LIEFERANTEN-BESTAND---` + base64-kodiertes JSON) — dient als Backup zum Wiedereinlesen auf anderen Geräten.

Format des Base64-Blocks:
```json
{ "timestamp": 1744416000000, "bestaende": { "id": { "menge": 3, "einheit": "kg", "ts": 1744415800000 } } }
```

Teilt via `navigator.share()` (mobil) oder `navigator.clipboard.writeText()` (Desktop-Fallback), letzter Fallback: `alert()`.

---

### Import

**`importBestand(input)`**  
Liest eine hochgeladene `lieferanten_bestand_db.json`. Nimmt den letzten Eintrag im Array (neuester Snapshot). Befüllt `workingData` mit den gespeicherten Mengen und setzt `counted = true`. Löst `renderInventur()` aus damit die Zeilen als gezählt erscheinen.

Fehlerfall: Kein `bestaende`-Feld → Alert.

---

### Tab Bestand

**`renderBestand()`**  
Wird bei jedem Klick auf den Bestand-Tab aufgerufen (nicht gecacht).

Ablauf:
1. Neuesten Snapshot mit `typ: 'bestand'` aus `bestandDb` suchen (von hinten)
2. Kein Snapshot → Leerseite "Noch keine Inventur erfasst"
3. `snapshot.timestamp` prüfen: älter als 18 Stunden → Leerseite "Inventur zu alt" mit Datum + Uhrzeit der letzten Zählung
4. Frisch → Zeitstempel-Header + Produkte gruppiert nach Lagertyp, nur lesend (kein Input)

Die 18h-Grenze ist bewusst enger als die 24h-Grenze der Druckzentrale (Modul B), weil Lieferantenbestände schneller veralten als Frosterbestände.

**Anzeige-Zustände:**

| Zustand | Icon | Meldung |
|---|---|---|
| Nie gezählt | 📭 | "Noch keine Inventur erfasst" |
| Älter als 18h | ⏰ | "Inventur zu alt" + letztes Datum/Uhrzeit |
| Frisch | — | Produktliste mit Zeitstempel-Header |

---

## Lagertyp-System

| Key | Label | Badge-Farbe | Zeilen-Akzent |
|---|---|---|---|
| `tk` | Tiefkühl | blau `#dbeafe / #1d4ed8` | `#3b82f6` |
| `kuehl` | Kühl | grün `#dcfce7 / #15803d` | `#22c55e` |
| `trocken` | Trocken | gelb `#fef9c3 / #854d0e` | `#f59e0b` |
| `sonstiges` | Sonstiges | lila `#f3e8ff / #6b21a8` | `#a855f7` |

Reihenfolge immer: `tk → kuehl → trocken → sonstiges` (`LAGERTYP_ORDER`).

Der farbige linke Rand (`.list-row.typ-*`) bleibt in allen Zuständen erhalten — auch wenn die Zeile als `counted` grün wird, bleibt der Lagertyp-Akzent sichtbar durch `border-left-color`.

---

## Bekannte Fallstricke

**Wochentag-Rechnung**  
JavaScript `getDay()` gibt So=0, Mo=1, …, Sa=6. Die App rechnet intern mit Mo=0: `(getDay()+6)%7`. Das gilt überall — `checkDeliveryDay()`, `renderEingang()`, `buildListRow()`. Nie vergessen wenn neue Wochentagslogik hinzukommt.

**Upsert-Logik beim Speichern**  
`findIndex` auf `datum` (Bestand) bzw. `datum + typ` (Eingang). Wird am gleichen Tag zweimal gespeichert, überschreibt der neue Eintrag den alten vollständig. Kein Merge, keine Zusammenführung.

**Poka-Yoke nur bei `isDeliveryDay`**  
Wenn kein Liefertag: `pokaYokeState` bleibt `null`, der Abzug-Pfad in `speichernAlles()` wird nie betreten (`isDeliveryDay && pokaYokeState === true` ist false).

**`renderBestand()` liest immer frisch**  
Kein Cache. Jedes Mal wenn der Tab geöffnet wird, wird der neueste Snapshot neu gesucht und gerendert. Das ist Absicht — nach einem Speichern soll der Tab sofort den neuen Stand zeigen ohne Reload.

**Base64-Import via WhatsApp**  
Der WhatsApp-Export enthält einen Base64-Block. Dieser wird in `lieferanten_inventur.html` selbst **nicht** eingelesen — er ist nur als Backup gedacht. Ein separater Import-Mechanismus (z.B. in `inventur_dateneingabe.html`) kann diesen Block dekodieren.

**Daten liegen im gleichen Ordner**  
Die JSON-Dateien werden per Browser-Download erzeugt und müssen manuell in den richtigen Ordner gelegt werden. Es gibt keinen automatischen Schreibzugriff. Das ist eine bewusste Einschränkung der PWA-Architektur.

---

## Erweiterungen / Offene Punkte

- `lieferanten_auswertung.html` — Verbrauchsanalyse aus `lieferanten_bestand_db.json`, noch ungebaut
- Messschieber (gleitendes Berechnungsfenster) für Auswertung geplant
- BÄKO-Druckansicht aus Druckzentrale Modul F — teilt dieselbe Datenbasis

---

*Dokument gepflegt von: [Claude] · Zuletzt aktualisiert: April 2026*
