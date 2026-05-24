# BäckereiOS — Savepoint-Dokumentation
**Stand: 24. März 2026 · Nachtschicht-Session**

---

## 1. Systemübersicht

BäckereiOS ist eine mobile-first PWA (vanilla HTML/CSS/JS, GitHub Pages) für Bäckereiproduktionsplanung in Seelze/NDS. Kernvision: Zentralisierung von Produktionswissen damit Mitarbeiter autonom arbeiten können.

### Architekturprinzipien
- **Single Source of Truth**: `produkt_config.json` für alle Produktdaten
- **Fail Fast**: Wenn das System keine Daten findet → laute Fehlermeldung, kein stiller Fallback
- **Einbahnstraße**: `produkt_config.json` → Autosync → `stammdaten.js` (läuft aus)
- **Keine doppelte Datenpflege**: Config einmal befüllen, überall verfügbar

---

## 2. Dateistruktur

```
BaeckereiOS/
│
├── index.html                          ← Startseite: Einfach-Modus + Mehr-Tab
├── shell.js                            ← Header/Navigation für alle Seiten
├── systemdesign.css                    ← Globales Designsystem
│
├── produkt_config.json                 ← Single Source of Truth (71 Produkte)
├── backmengen_db.json                  ← Rohdaten (wächst täglich ~3.8 KB/Tag)
├── taeglicher_verbrauch.json           ← NEU: Berechnungsgrundlage-Config
├── wettergehirn.js                     ← Wetter-Berechnungslogik
├── stammdaten.js                       ← VERALTET — wird ersetzt, noch aktiv
├── inventurdaten.js                    ← Aktuelle Lagerbestände
│
├── inventur_dateneingabe.html          ← NEU: Inventureingabe (aus AdminTools verschoben)
├── verbrauchsuebersicht.html           ← Mengenübersicht (live aus DB+Config)
├── fahrplan.html                       ← Roadmap mit Erklärungen
├── schnellrechner.html                 ← noch stammdaten.js (pending Gehirn)
├── planer.html / setup.html            ← noch stammdaten.js (pending Gehirn)
├── bestandsuebersicht.html             ← noch stammdaten.js (pending Gehirn)
│
├── durchschnittsverbauch/              ← [Tippfehler im Ordnernamen — NICHT korrigieren!]
│   ├── 14_tage_logbuch.html            ← Rohdaten-Logbuch mit Filtermenü
│   ├── verlauf.html                    ← Produktverlauf-Diagramm (bis 5 Produkte)
│   ├── wetter_planung.html             ← Wettervorschau (7 Tage, Open-Meteo)
│   └── wetter_analyse.html             ← Wetterrückblick (Regen vs. Sonne)
│
├── AdminTools/
│   ├── produkt_config_editor.html      ← Config-Editor + Berechnungsgrundlage-Block
│   ├── stammdaten_autosync.html        ← Neustart-Modus, Skip-Buttons
│   ├── datenbank_manager.html          ← Zettel-Workflow, Ausreißer, neue Produkte
│   └── flag_statistik.html             ← Ausreißer-Visualisierung
│
└── organisation/
    └── frosterliste_wochentag.html
```

---

## 3. Datenstrukturen

### 3.1 produkt_config.json
Array von Produktobjekten. **Jedes Produkt:**

```json
{
  "artNr": "134001",
  "name": "Hasenberger",
  "kategorie": "Brötchen",
  "charge": 20,
  "einheit": "bleche",
  "legacyKey": "hasenberger_stueck",
  "station": "Brötchenstraße",
  "unit": 0,
  "batchSize": 12,
  "backTage": [1,2,3,4,5,6],
  "inventurRelevant": true,
  "filialeProdukt": false,
  "hinweis": null
}
```

**Felder:**
| Feld | Typ | Bedeutung |
|---|---|---|
| `artNr` | string\|null | Artikelnummer |
| `name` | string | Anzeigename |
| `kategorie` | string | Brötchen/Brot/Konditorei/Fettgebäck/Snack |
| `charge` | number | Stück pro Blech (z.B. 20) |
| `einheit` | string | `"bleche"` oder `"stueck"` |
| `legacyKey` | string\|null | DB-Schlüssel z.B. `"hasenberger_stueck"` |
| `station` | string | Brötchenstraße/Nachtschicht/Rondo/Frühschicht/Konditorei/Versand |
| `unit` | number | 0=Bleche, 1=Pressen(KK), 2=Pressen(HB), 3=Brühstücke |
| `batchSize` | number | Produktionsschritte (Vielfache), z.B. 12 |
| `backTage` | number[] | JS-Wochentage: Mo=1, Di=2, ..., So=0. Leer = alle Tage |
| `inventurRelevant` | boolean | Erscheint in Inventur-Dateneingabe |
| `filialeProdukt` | boolean | TK/Teigling aus Filiale (für Filialausfall-Ausschlüsse) |
| `hinweis` | string\|null | Freitext-Notiz |

### 3.2 backmengen_db.json
Array von Tageseinträgen:

```json
{
  "datum": "2026-03-23",
  "wochentag": "Montag",
  "kontext": {
    "wetter": "sonnig",
    "temperatur": 18,
    "feiertag": false,
    "ferien": false,
    "besonderheit": null,
    "ausschluss_sondertag": false,
    "ausschluss_einschraenkung": false
  },
  "produkte": {
    "hasenberger_stueck": 940,
    "hasenberger_bleche": 47.0,
    "kornknacker_stueck": 830,
    "kornknacker_bleche": 33.2
  },
  "flags": {
    "hasenberger_stueck": {
      "type": "outlier_accepted",
      "value": 940
    }
  }
}
```

**Wachstum:** ~3.8 KB/Eintrag → ~1.3 MB nach 1 Jahr → Jahres-Archivierung geplant für Ende 2026.

### 3.3 taeglicher_verbrauch.json ← NEU
```json
{
  "zeitraum_tage": 14,
  "feiertage_ausschliessen": true,
  "sondertage_ausschliessen": true,
  "ausgeschlossene_tage": [
    { "datum": "2026-02-14", "grund": "Valentinstag" }
  ]
}
```
Liegt im **Stammverzeichnis** neben `produkt_config.json`. Wird vom Config-Editor geschrieben und von der Mengenübersicht gelesen. Schnellrechner und Planer kennen sie noch nicht (offener Draht → wartet auf `produktions_gehirn.js`).

### 3.4 wettergehirn.js — Globale Exporte
```js
window.WetterGehirn           // Klasse: DB laden, Durchschnitte, Empfehlungen
window.bosWmoSymbol(code)     // WMO-Code → {sym, label}
window.bosTextWetterSymbol(t) // DB-Wettertext → Emoji
window.bosSegment(datum, temp, wetter) // → 'grillwetter'|'regen'|'normal'
window.bosBacktagHinweis(segment)      // → {text, typ}|null
window.BOS_WETTER_LAT         // 52.3977 (Seelze)
window.BOS_WETTER_LON         // 9.5947
window.BOS_MIN_DATENSAETZE    // 60 (Freischaltung Wetteranalyse)
```

---

## 4. Schlüsselkonventionen

### Wochentag-Indizes
**Achtung: Zwei verschiedene Systeme!**

| System | Mo | Di | Mi | Do | Fr | Sa | So |
|---|---|---|---|---|---|---|---|
| **BOS-Index** (needs-Array) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| **JS-Wochentag** (getDay()) | 1 | 2 | 3 | 4 | 5 | 6 | 0 |
| **backTage-Feld** | 1 | 2 | 3 | 4 | 5 | 6 | 0 |

Konvertierung: `JS_ZU_BOS = [6,0,1,2,3,4,5]` (JS-Index → BOS-Index)

### Pfade
- `durchschnittsverbauch/` — Tippfehler im Ordnernamen, **niemals korrigieren** (bricht alle Links)
- Alle Tools im Stammverzeichnis fetchen mit relativem Pfad `./`
- Tools in `AdminTools/` fetchen mit `../` (eine Ebene höher)
- Tools in `durchschnittsverbauch/` fetchen mit `../`

### legacyKey-Format
`produktname_stueck` — alles lowercase, Umlaute ersetzt:
- ä→ae, ö→oe, ü→ue, ß→ss
- Leerzeichen und Sonderzeichen → `_`
- Immer `_stueck` am Ende
- Bleche-Key: `_stueck` durch `_bleche` ersetzen

### Poka-Yoke Froster (schnellrechner.html, planer.html)
**Unveränderlich:** 2 Buttons, keine Vorauswahl, BERECHNEN gesperrt bis Auswahl gemacht. Nie anfassen.

---

## 5. Diese Session: Was gebaut wurde

### 5.1 Neue Dateien
| Datei | Ordner | Zweck |
|---|---|---|
| `taeglicher_verbrauch.json` | Stammverzeichnis | Berechnungsgrundlage-Config |
| `inventur_dateneingabe.html` | Stammverzeichnis | Inventureingabe (verschoben aus AdminTools) |
| `verlauf.html` | `durchschnittsverbauch/` | Produktverlauf-Diagramm Chart.js |
| `wetter_planung.html` | `durchschnittsverbauch/` | 7-Tage Wettervorschau + Countdown |
| `fahrplan.html` | Stammverzeichnis | Roadmap mit Erklärungen in Klarsprache |
| `wettergehirn.js` | Stammverzeichnis | Wetter-Berechnungslogik |

### 5.2 Wesentlich geänderte Dateien

**`produkt_config.json`**
- 9 legacyKey-Fixes (u.a. `dinkel_rublikuchen→dinkel_rueblikuchen`)
- Neue Felder: `station`, `unit`, `batchSize`, `backTage`, `inventurRelevant`, `filialeProdukt`

**`produkt_config_editor.html`**
- Neue Spalte: `einheit` (Bleche-Checkbox)
- ⚙-Button pro Produkt → ausklappbare Detailzeile mit: station, unit, batchSize, backTage, inventurRelevant, filialeProdukt
- Neuer Block unten: **Berechnungsgrundlage** — Zeitraum, Feiertage, Sondertage, Kalender-Picker für manuelle Ausschlüsse
- Speichert `taeglicher_verbrauch.json` als zweiten Download

**`verbrauchsuebersicht.html`**
- Komplett neu gebaut: live aus DB + Config (kein `stammdaten.js` mehr)
- Liest `taeglicher_verbrauch.json`: Zeitraum, Feiertags-/Sondertag-Ausschlüsse
- Stück/Bleche-Toggle, Charge-Division korrekt
- Zeigt "Basis: X Tage · Y ausgeschlossen"

**`inventur_dateneingabe.html`**
- `admin_design.css` → `systemdesign.css`
- `stammdaten.js` entfernt → liest `produkt_config.json` direkt
- Zeigt nur Produkte mit `inventurRelevant: true`
- **Kern-Fix**: Antippen eines Eingabefelds entsperrt Karte sofort (kein "Zählen"-Button mehr nötig)
- DOM-basierte Rendering (keine inline Event-Handler mehr)
- base64 Export/Import als geschlossenes Akkordeon unten
- Fortschrittsbalken "X von Y gezählt"

**`index.html`**
- Einfach-Modus: 7 Hauptkacheln + 3 schmale Info-Buttons (Mengenübersicht, Inventur, Admin)
- Ballast entfernt: Markt & News, Magazin, Leitartikel, BäckerSpiele, Azubi & Meisterhaft
- Wettertools umbenannt: WetterAussicht → Wettervorschau + Wetterrückblick

**`shell.js`**
- Alle neuen Seiten eingetragen
- Tote Seiten entfernt (10 Einträge)

**`14_tage_logbuch.html`**
- Filtermenü: Produkte nach Kategorie, leer starten, erste Kategorie aufgeklappt
- Kategorien direkt aus `produkt_config.json` (nicht mehr Legacy-Globals)
- Wetter-Symbole neben Datum: ☀️🌧⛅
- Tagesübersicht auffälliger Tage mit Tooltip
- Bug-Fix: `wetterSymbol` in `_renderData` gespeichert

**`datenbank_manager.html`**
- Neue Produkterkennung: Prompts fragen Gemini nach unbekannten Produkten
- `unbekannt`-Array im JSON-Response → blaues Panel mit "Anlegen oder Ignorieren"
- Beim Anlegen: legacyKey automatisch generiert, `produkt_config.json` Download

**`wetter_analyse.html`** (umbenannt zu Wetterrückblick)
- Zweck-Banner mit Link zur Wettervorschau
- Unterscheidung klar: Rückblick (historisch) vs. Vorschau (vorwärts)

---

## 6. Offene Baustellen

### 🔴 Höchste Priorität

#### `produktions_gehirn.js` (noch nicht gebaut)
Das wichtigste offene Projekt. Ersetzt `stammdaten.js` vollständig.

**Was es tun muss:**
1. `produkt_config.json` laden → station, unit, batchSize, backTage, charge, einheit
2. `backmengen_db.json` laden → Ø-Durchschnitte pro Wochentag berechnen
3. `taeglicher_verbrauch.json` lesen → Zeitraum + Ausschlüsse respektieren
4. Ausschlusslogik:
   - Feiertage → alle Produkte ausschließen
   - `ausschluss_sondertag: true` + `filialeProdukt: true` → nur Filialprodukte ausschließen
   - Manuelle `ausgeschlossene_tage` → alle Produkte ausschließen
5. `window.BOS_STAMMDATEN` kompatibles Objekt befüllen (gleiche Struktur wie heute)
6. **Fail Fast**: wenn DB fehlt oder <7 Einträge → klare Fehlermeldung, kein stiller Fallback

**Offene Drähte** (warten auf das Gehirn):
- `schnellrechner.html` — noch `stammdaten.js`
- `planer.html` / `setup.html` — noch `stammdaten.js`
- `bestandsuebersicht.html` — noch `stammdaten.js`
- `taeglicher_verbrauch.json` wird von Schnellrechner/Planer noch ignoriert

#### Config befüllen (Handarbeit)
Für alle 71 Produkte im Config-Editor eintragen:
- `station` — wo wird es gemacht?
- `unit` — Bleche/Pressen/Brühstücke
- `batchSize` — Produktionsschritte
- `backTage` — an welchen Tagen?
- `inventurRelevant` — für Frosterzählung?
- `filialeProdukt` — TK/Teigling aus Filiale?

### 🟡 Mittlere Priorität

#### Wettergehirn-Segmentanalyse (wartet auf Daten)
- Countdown: 60 Erfassungstage → Sommer 2026
- Gerüst in `wetter_planung.html` und `wettergehirn.js` bereits fertig
- Schaltet sich automatisch frei

#### Datenbankarchivierung (Jahreswechsel 2026/2027)
- Am Jahresende: `backmengen_db.json` → `backmengen_db_2026.json`
- Neue leere DB beginnt
- `db_archive.json` als Steuerdatei: `["backmengen_db_2026.json"]`
- Alle Tools müssen lernen mehrere DB-Dateien zu laden

#### Alte Seiten aufräumen
- `Backplan_Aktuell.html` löschen (ersetzt durch Wettervorschau)
- `stammdaten.js` nach Gehirn-Umstieg archivieren
- Tote Seiten auf GitHub in Archiv-Ordner

### 🔵 Längerfristig

#### Übersetzungen
- `translations.js` auf aktuellen Stand bringen
- Arabisch (irakischer Dialekt) — RTL-Layout (`dir="rtl"`)
- Vietnamesisch
- Sprachumschalter im Einfach-Modus (Flaggen-Symbole)
- Produktnamen für nicht-deutsche Kollegen (phonetische Annäherung)
- Sprachauswahl in localStorage dauerhaft speichern

#### Anleitungen
- Schnellrechner DE+AR ✅ bereits vorhanden
- Planer/Setup-Assistent — DE+AR
- 14-Tage Logbuch — DE+AR
- Datenbank-Manager — DE+AR
- ❓-Button in jedem Tool → öffnet passende Anleitung in gewählter Sprache

#### Config-Hilfe-Seite
Eigene Dokumentation nur für den Config-Editor — was bedeutet jedes Feld, was passiert wenn man es ändert?

#### hilfe.html aktualisieren
Komplett veraltet. Neu: kontextsensitiv, FAQ aus echten Kollegenfragen.

---

## 7. Kritische Regeln (nie brechen)

1. **`durchschnittsverbauch/`** — Tippfehler bleibt. Für immer.
2. **Poka-Yoke Froster** — 2 Buttons, keine Vorauswahl, BERECHNEN gesperrt. Nicht anfassen.
3. **`calcRowStatus` Mathematik** — vor Änderungen konsultieren.
4. **Hilfetexte** — nie kürzen.
5. **Keine stillen Architekturänderungen** — immer absprechen.
6. **shell.js** — bei jeder neuen Seite oder neuem Unterordner sofort eintragen.
7. **`cache: 'no-store'`** — bei allen fetch()-Aufrufen auf JSON-Dateien.

---

## 8. Datenbankwachstum & Projektionen

| Zeitraum | Einträge | Größe |
|---|---|---|
| Heute (März 2026) | 17 | ~63 KB |
| 3 Monate | ~90 | ~335 KB |
| 6 Monate | ~180 | ~669 KB |
| 12 Monate | ~360 | ~1.3 MB |
| 24 Monate | ~720 | ~2.6 MB |

Harmlos für GitHub Pages. Jahres-Archivierung trotzdem vorbereiten.

---

## 9. Deployment-Checkliste für diese Session

Folgende Dateien wurden geändert und müssen auf GitHub deployed werden:

### Stammverzeichnis
- [ ] `index.html`
- [ ] `shell.js`
- [ ] `wettergehirn.js`
- [ ] `verbrauchsuebersicht.html`
- [ ] `inventur_dateneingabe.html` ← neu hier, war in AdminTools
- [ ] `fahrplan.html`
- [ ] `taeglicher_verbrauch.json` ← neue Datei

### durchschnittsverbauch/
- [ ] `14_tage_logbuch.html`
- [ ] `verlauf.html` ← neue Datei
- [ ] `wetter_planung.html` ← neue Datei
- [ ] `wetter_analyse.html`

### AdminTools/
- [ ] `produkt_config_editor.html`
- [ ] `datenbank_manager.html`

### Nicht mehr benötigt (optional löschen/archivieren)
- `AdminTools/inventur_dateneingabe.html` ← liegt jetzt im Stammverzeichnis
- `Backplan_Aktuell.html` ← ersetzt durch wetter_planung.html

---

## 10. Nächste Sitzung: Empfohlene Reihenfolge

1. **Config befüllen** — station, unit, batchSize, backTage, filialeProdukt für alle 71 Produkte
2. **`produktions_gehirn.js` bauen** — das Herzstück
3. **Schnellrechner + Planer umstellen** — stammdaten.js raus, Gehirn rein
4. **Wettergehirn Sommer 2026** — wenn 60 Erfassungstage erreicht
5. **Übersetzungen** — nach Abschluss der Kernfunktionalität

---

*Generiert: 24. März 2026 · BäckereiOS Nachtschicht-Session*
*Nächstes Einlesen: Diese Datei als erstes hochladen.*
