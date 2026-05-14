# BäckereiOS — Entwicklungsprotokoll Mai 2026
**Session: Lieferanten-System v2 · NFC-Integration · Backwaren-Steckbriefe**
*Stand: 10. Mai 2026*

---

## Übersicht aller Änderungen

| Datei | Status | Zielordner |
|---|---|---|
| `lieferungen_gehirn.js` | Neu (v2) | `lieferanten/` |
| `lieferanten_inventur.html` | Neu (v2) | `lieferanten/` |
| `lieferanten_auswertung.html` | Neu (v2) | `lieferanten/` |
| `produkt_detail.html` | Neu | `lieferanten/` |
| `lieferanten_db.json` | Migriert | Root |
| `nfc_zentrale.html` | Neu | `admintools/` |
| `steckbrief_editor.html` | Neu | `admintools/` |
| `admin_landing.html` | Erweitert | `admintools/` |
| `steckbrief.html` | Neu | `backwaren/` |
| `backwaren/index.html` | Neu | `backwaren/` |
| `backwaren_steckbrief.json` | Neu | Root |
| `shell.js` | Erweitert | Root |
| `index.html` | Erweitert | Root |

---

## 1. Lieferanten-System v2

### 1.1 Warum neu gebaut

Der Lieferschein vom Lieferanten entfällt. Das alte System war auf `ausgang_filialen` und `eingang` als Pflichtfelder aufgebaut — beides ist nicht mehr zuverlässig verfügbar. Das neue System dreht die Logik um: **Snapshots sind die einzige Wahrheit**, alles andere ist optional.

### 1.2 Neue Datenarchitektur

**Eine Datei statt zwei.** `lieferanten_bestand_db.json` und `lieferanten_db.json` wurden zu einer einzigen `lieferanten_db.json` zusammengeführt.

```json
[
  { "datum": "2026-05-08", "wochentag": "Freitag", "typ": "bestand",
    "timestamp": 1746700000000,
    "bestaende": { "buttercroissant_tk": { "menge": 5, "einheit": "karton", "ts": 1746700000000 } } },

  { "datum": "2026-05-08", "wochentag": "Freitag", "typ": "eingang",
    "eintraege": { "buttercroissant_tk": { "menge": 6 } } },

  { "datum": "2026-05-09", "wochentag": "Samstag", "typ": "ausgang_filialen",
    "eintraege": { "buttercroissant_tk": { "menge": 3 } } }
]
```

| `typ` | Erstellt von | Bedeutung |
|---|---|---|
| `bestand` | Inventur-Seite, NFC-Detail | Gezählter Ist-Bestand |
| `eingang` | Inventur-Seite (optional) | Erfasster Wareneingang |
| `ausgang_filialen` | `mega_erfassung.html`, `datenbank_manager.html` | TK-Abgang an Filialen (vom Backzettel) |

**Wichtig:** `ausgang_filialen` wird von der Bestellberechnung ignoriert. Es fließt nur in die Detailaufschlüsselung ein.

### 1.3 `lieferungen_gehirn.js` v2

Vollständig neu geschrieben. Keine Abhängigkeit mehr von Lieferscheindaten.

**Kernprinzip:**
```
netVerbrauch = bestandVon + eingang_bekannt - bestandBis
netVerbrauch < 0  →  unbekannte Lieferung → Intervall verworfen
netVerbrauch ≥ 0  →  valide → verbrauchProTag = netVerbrauch / tageAnzahl
```

**Gewichteter Durchschnitt:**
```
Ø/Tag = Summe(netVerbrauch) / Summe(tageAnzahl)
```
Längere Intervalle haben mehr Gewicht — korrekt, weil mehr Messtage = mehr Signal.

**Öffentliche Funktionen (`window.LieferungenGehirn`):**

| Funktion | Beschreibung |
|---|---|
| `berechneIntervalle(produkt, db, produktConfig, bisDatum)` | Valide Intervalle für ein Produkt |
| `berechneSchnittProTag(intervalle)` | Gewichteter Ø-Verbrauch/Tag |
| `berechneWochentagsSchnitte(intervalle)` | Ø nach Wochentag (Näherung) |
| `berechneBestellbedarf(schnitt, von, bis, aufschlag)` | Bestellmenge mit Aufschlag |
| `berechneBackstubeVerbrauch(produkt, von, bis, backmengenDb, produktConfig)` | Backstube-Kartons aus backmengen_db |
| `berechneFilialeVerbrauch(produkt, von, bis, db)` | Filialen-Kartons aus ausgang_filialen |
| `getWochentagIndex(datum)` | Mo=0 … So=6 |
| `tageDiff(von, bis)` | Tage zwischen zwei Datumsstrings |

**Wochentag-Konvention:** Mo=0 … So=6, überall konsistent.
**Timezone-Bug vermieden:** Kein `toISOString()`, alle Datums-Strings manuell gebaut.

### 1.4 `lieferanten_inventur.html` v2

**Was raus ist:** Poka-Yoke, `bestandDb`, `lieferantenDb`, `ausgang_filialen`, zwei Download-Calls.

**Was neu ist:**
- Drei Tabs: Inventur · Lieferung (optional) · Bestand
- Lieferung-Tab immer sekundär — auf Liefertagen breiter mit Text, sonst schmal
- Lieferung zeigt **alle** Produkte: erwartete mit "Heute"-Badge, andere mit "Extra"
- Import versteht neues Format, altes Format (`lieferanten_bestand_db.json`) und WhatsApp-Backup
- Speichert **eine** Datei: `lieferanten_db.json`
- NFC-Import: erkennt `?from=nfc`, liest `bos_nfc_scan` aus localStorage, füllt Produkte grün vor
- NFC-Banner zeigt "X Produkte per NFC vorausgezählt", wird nach Save entfernt

### 1.5 `lieferanten_auswertung.html` v2

**Tab 1 — Verbrauch & Bestellung (primär, 2/3):**
- Produkte gruppiert nach Lagertyp
- Pro Produkt: Ø/Tag, Bestellbedarf, Datenqualitäts-Indikator
- Expandierbares Detail: Wochentag-Grid Mo–So + Intervall-Tabelle mit Eingang-Chip
- Einstellungen: Aufschlag %, Bestellzeitraum Von/Bis, Messschieber (Berechnungsbasis bis)
- Alle Settings reagieren live (onchange → renderVerbrauch)

**Tab 2 — Aufschlüsselung (sekundär, 1/3):**
- Produkt-Dropdown + Von/Bis
- Alle Tage des Zeitraums werden angezeigt
- Tage ohne Daten: grau ausgeblendet, "Keine Daten"
- Spalten je nach Produkt-Config:
  - `in_backstube_gebacken: true` → Backstube-Spalte (aus backmengen_db)
  - `lieferung_filiale: true` → Filialen-Spalte (aus ausgang_filialen)
  - Beide → zusätzliche Summen-Spalte
- Summen-Zeile am Ende

**Warum zwei getrennte Systeme:**
Snapshot-Schnitt ist robust gegen fehlende Tage (freier Tag verschwindet im Rauschen). Tagesaufschlüsselung ist ehrlicher — zeigt nur was existiert, keine Interpolation.

### 1.6 Ordnerstruktur

```
/                                ← Root
  lieferanten_config.json        ← Config (direkt hochladbar)
  lieferanten_db.json            ← DB
  backmengen_db.json             ← unverändert
  produkt_config.json            ← unverändert

/lieferanten/
  lieferanten_inventur.html
  lieferanten_auswertung.html
  lieferungen_gehirn.js
  produkt_detail.html

/admintools/                     ← unverändert
  lieferanten_config_editor.html
  mega_erfassung.html
  datenbank_manager.html
```

### 1.7 Was unverändert bleibt

- `mega_erfassung.html` — schreibt weiter `ausgang_filialen`, fließt in Aufschlüsselung ein
- `datenbank_manager.html` — unverändert
- `lieferanten_config_editor.html` — unverändert
- `backmengen_db.json` — unverändert
- `produkt_config.json` — unverändert

### 1.8 Migration

Die migrierte `lieferanten_db.json` enthält:
- Alle `bestand`-Einträge aus alter `lieferanten_bestand_db.json`
- Alle `eingang`-Einträge aus alter `lieferanten_db.json`
- Keine `ausgang_filialen` aus dem Migrationszeitraum

**Kann gelöscht werden nach Deploy:**
- `lieferanten_bestand_db.json`
- alte `lieferanten_db.json` (vor Migration)

---

## 2. NFC-System

### 2.1 Konzept

Zwei Wege zur selben Datenbank:

```
Listenzettel (analog) → lieferanten_inventur.html → lieferanten_db.json
NFC → produkt_detail.html → localStorage → lieferanten_inventur.html → lieferanten_db.json
```

Die Inventur-Seite ist das einzige "Tor" zur DB — egal welcher Eingang genutzt wird.

### 2.2 `produkt_detail.html` (NFC-Landingpage)

URL-Schema: `lieferanten/produkt_detail.html?id=PRODUKT_ID`

Die `id` entspricht dem `id`-Feld in `lieferanten_config.json`.

**Session-Mechanismus:**
Alle NFC-Scans einer Session in `localStorage["bos_nfc_scan"]`:
```json
{ "buttercroissant_tk": 5, "schokocroissant_tk": 3 }
```

**Buttons:**

| Button | Aktion |
|---|---|
| Nächstes Produkt → | Wert in localStorage, Bestätigung, wartet auf nächsten Scan |
| ✓ Scan fertig | Wert speichern + Redirect zu `lieferanten_inventur.html?from=nfc` |
| Session abbrechen | confirm → localStorage löschen → zurück zur Inventur |

**Kontext:** Lädt letzten Bestand aus DB als Referenzwert ("Letzter Bestand: 5 Karton, Di 05.05.").

**Gleiches Produkt zweimal gescannt:** Kein Problem — vorhandener Wert wird im Input angezeigt, überschreibbar.

### 2.3 `nfc_zentrale.html`

Ort: `admintools/nfc_zentrale.html`

**Tab 1 — Lieferanten:**
- App-Teilen-Sektion: editierbares URL-Feld, localStorage-persistent, Default `https://baeckereios.github.io/Planer/`
- Liste aller Lieferanten-Produkte aus `lieferanten_config.json`
- Jedes Produkt mit URL-Anzeige und Schreib-Button

**Tab 2 — Backwaren:**
- Liste aller Produkte aus `produkt_config.json`
- URLs zeigen auf `backwaren/steckbrief.html?id=X`
- Buttons aktiv (Steckbrief-Seite existiert)

**Browser-Check:**
- Android Chrome → grünes Banner, alle Buttons aktiv
- Android anderer Browser → gelbe Warnung, Buttons deaktiviert
- Desktop/iOS → rotes Banner, Buttons deaktiviert

**Mutex:** Nur ein Schreibvorgang gleichzeitig — alle Buttons während des Schreibens gesperrt.

**baseUrl:** Automatisch aus aktuellem Pfad berechnet (entfernt `admintools/...`).

### 2.4 NFC-Chip Platzierung (Empfehlung)

| Ort | Ziel | Nutzen |
|---|---|---|
| Froster pro Produkt | `lieferanten/produkt_detail.html?id=X` | Direktes Zählen |
| Ofen/Backstube | `backwaren/steckbrief.html?id=X` | Backparameter sofort |
| Pausenraum/Tisch | `index.html` (PWA-Root) | App-Entdeckung |

---

## 3. Backwaren-Steckbriefe

### 3.1 Dateistruktur

```
/backwaren_steckbrief.json       ← Root, Datenbasis
/backwaren/steckbrief.html       ← Steckbrief-Ansicht, NFC-Ziel
/backwaren/index.html            ← Übersicht nach Station
/admintools/steckbrief_editor.html ← Editor
```

### 3.2 `backwaren_steckbrief.json`

Schlüssel = `legacyKey` aus `produkt_config.json`.

```json
{
  "butter_croissant_stueck": {
    "produktname": "Butter-Croissant",
    "abschnitte": {
      "teig":    { "sichtbar": false, "text": "" },
      "aufbau":  { "sichtbar": true,  "schritte": ["Blech einölen", "Teiglinge auslegen"] },
      "gare":    { "sichtbar": true,  "text": "60 Min bei 28°C" },
      "backen":  { "sichtbar": true,  "programm": "P12", "temperatur_ober": 185,
                   "temperatur_unter": 170, "minuten": 18, "hinweis": "…" },
      "versand": { "sichtbar": true,  "pro_korb": 10, "hinweis": "…" }
    }
  }
}
```

### 3.3 `backwaren/steckbrief.html`

URL: `steckbrief.html?id=LEGACY_KEY`

**Aufbau:**
- Produktkopf: Name, Lagertyp-Badge, Lieferant, Gebinde-Info
- Optionaler Froster-Chip: aktueller Bestand wenn Inventur < 12h (blau), > 12h (amber, Hinweis)
- Tabs: nur sichtbare Abschnitte — dynamisch
- Motto am Ende: *"Gute Qualität ist es, wenn du für das Produkt in einem anderen Laden bezahlen würdest."*

**Tab-Farben:**

| Tab | Farbe |
|---|---|
| 🌾 Teig | Slate |
| 🔧 Aufbau | Amber |
| ⏱ Gare | Grün |
| 🔥 Backen | Rot |
| 📦 Versand | Violett |

**Aufbau-Tab:** Interaktive Checkboxen — antippen = erledigt (durchgestrichen, grün). "↺ Zurücksetzen" setzt alle zurück. Nicht persistent — nächster Scan = frischer Start.

**Backen-Tab:** Programm, Temp Ober, Temp Unter, Minuten als Hero-Zahlen im Grid.

**Fehlerzustände:**
- Kein `?id=` in URL → "Kein Produkt angegeben"
- `legacyKey` nicht in `produkt_config.json` → "Produkt nicht gefunden"
- Kein Steckbrief in JSON → "Noch kein Steckbrief angelegt · Im Steckbrief-Editor anlegen"

### 3.4 `backwaren/index.html`

**Übersicht aller Backwaren nach Station.**

- Gruppen aus `station`-Feld in `produkt_config.json` — automatisch, kein neues Feld nötig
- "Sonstiges" immer am Ende
- Erstes Akkordeon standardmäßig offen
- Stationskopf zeigt: `2/5` — zwei von fünf haben Steckbrief (grün hervorgehoben)
- Grüner Streifen links = Steckbrief vorhanden, grauer = fehlt noch
- Suchfeld: filtert über alle Stationen, öffnet passende Akkordeons automatisch

### 3.5 `admintools/steckbrief_editor.html`

**Dropdown:** Nur `in_backstube_gebacken: true` und `!ist_rohstoff`, alphabetisch sortiert. Produkte mit vorhandenem Steckbrief mit ✓ markiert.

**Pro Abschnitt:**
- Toggle: Sichtbar/Versteckt
- Klappt sich beim Aktivieren automatisch auf

**Felder pro Abschnitt:**

| Abschnitt | Felder |
|---|---|
| Teig | Freitext (Textarea) |
| Aufbau | Mehrzeiliger Text — eine Zeile = ein Schritt |
| Gare | Freitext (Textarea) |
| Backen | Programm, Temp Ober, Temp Unter, Minuten, Hinweis |
| Versand | Stück pro Korb, Hinweis |

**Vorschau-Button:** Öffnet `backwaren/steckbrief.html?id=X` in neuem Tab.

**Speichern:** Lädt gesamte `backwaren_steckbrief.json` mit allen Produkten herunter — gleicher Workflow wie alle anderen DB-Dateien im System.

---

## 4. Shell & Navigation

### 4.1 Neue Routen in `shell.js`

```javascript
'lieferanten/lieferanten_inventur.html':  { title: 'BÄKO Inventur',  mode: 'full', tab: 'mehr'  },
'lieferanten/lieferanten_auswertung.html':{ title: 'Lieferanten',    mode: 'full', tab: 'mehr'  },
'lieferanten/produkt_detail.html':        { title: 'Produktdetail',  mode: 'full', tab: 'mehr'  },
'backwaren/steckbrief.html':              { title: 'Steckbrief',     mode: 'full', tab: 'mehr'  },
'backwaren/index.html':                   { title: 'Backwaren',      mode: 'full', tab: 'start' },
```

### 4.2 Bugfix: Subfolder-Routing

**Vorher:** `filename = pathname.split('/').pop()` — verlor den Ordnerpfad.

**Nachher:**
```javascript
const pathParts = window.location.pathname.split('/').filter(Boolean);
const filename  = pathParts.pop() || 'index.html';
const folder    = pathParts.pop() || '';
const fullKey   = folder ? folder + '/' + filename : filename;
const config    = PAGE_CONFIG[fullKey] || PAGE_CONFIG[filename] || { ... };
```

Fallback auf reinen Dateinamen — alle bestehenden Seiten funktionieren weiter.

### 4.3 `isSubfolder` erweitert

```javascript
|| window.location.href.includes('/lieferanten/')
|| window.location.href.includes('/backwaren/')
```

Sorgt dafür dass der Zurück-Button auf `../index.html` zeigt statt `index.html`.

### 4.4 `index.html` — neue Kacheln

- "📊 Lieferanten" → `lieferanten/lieferanten_auswertung.html` (Pfad aktualisiert)
- "🥐 Backwaren" → `backwaren/index.html` (neu)
- "BÄKO Inventur"-Kachel → `lieferanten/lieferanten_inventur.html` (Pfad aktualisiert)

### 4.5 `admin_landing.html` — neue Einträge

**Datenpflege:** Zähler 5→6, neuer Eintrag:
- **Steckbrief-Editor** → `steckbrief_editor.html`

**Spezialwerkzeuge:** Zähler 2→3, neuer Eintrag:
- **NFC-Zentrale** → `nfc_zentrale.html`

---

## 5. Offene Punkte

### Sofort deployen
- [ ] `lieferanten/` Ordner anlegen, vier Dateien rein
- [ ] `backwaren/` Ordner anlegen, zwei Dateien rein
- [ ] Migrierte `lieferanten_db.json` ins Root
- [ ] `backwaren_steckbrief.json` ins Root
- [ ] `shell.js`, `index.html`, `admin_landing.html` ersetzen
- [ ] Alte `lieferanten_bestand_db.json` löschen

### Kurzfristig
- [ ] Ersten echten Steckbrief anlegen (z.B. Butter-Croissant im Editor)
- [ ] NFC-Chips bestellen und beschriften
- [ ] PWA-URL in NFC-Zentrale einmal speichern (`https://baeckereios.github.io/Planer/` bereits als Default)

### Mittelfristig
- [ ] Backwaren-Steckbriefe befüllen — Editor pro Produkt durchgehen
- [ ] `produkt_config_editor.html` um `station`-Feld erweitern falls noch nicht vorhanden
- [ ] Froster-Verknüpfung: `produkt_config_key` in `lieferanten_config.json` pflegen damit Steckbrief den aktuellen Bestand anzeigen kann

### Architektur-Notizen
- `lieferanten_config.json` im Root — direkt hochladbar, kein Subfolder
- `backwaren_steckbrief.json` im Root — gleiche Logik
- NFC-Zentrale berechnet `baseUrl` dynamisch — funktioniert auf localhost und GitHub Pages gleich
- `bos_nfc_scan` und `bos_nfc_pwa_url` sind die zwei localStorage-Keys des NFC-Systems
- Wochentag-Konvention überall: Mo=0 … So=6 (nie ändern)
- `legacyKey` bleibt die Verbindung zwischen `produkt_config.json` und `backwaren_steckbrief.json` — nie umbenennen
