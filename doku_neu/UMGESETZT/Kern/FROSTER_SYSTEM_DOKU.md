# Froster-System — Dokumentation
**BäckereiOS · Entstanden: Mai 2026**

---

## Übersicht

Das Froster-System besteht aus drei Teilen:

1. **`froster_konfiguration.html`** — Admin-Editor für die gesamte Froster-Config
2. **`froster_auslastung.html`** — Echtzeit-Anzeige der aktuellen Froster-Belegung beider Räume
3. **`froster_config.json`** — persistente Konfigurationsdatei, einzige Wahrheitsquelle für alle Froster-Parameter

Ein vierter Teil — der **Froster-Optimierer** — ist konzipiert aber noch nicht gebaut. Er ist am Ende dieses Dokuments vollständig beschrieben.

---

## Physikalisches Modell

### Blechgrößen

Es gibt drei physisch unterschiedlich große Blechtypen im Betrieb. Die Größe (in Zentimetern messbar) bestimmt, wie viele Bleche in einen Stikken passen:

| Key | Bezeichnung |
|-----|-------------|
| `kuchenblech` | Kuchenblech |
| `schlawinerblech` | Schlawinerblech / Rote Diele |
| `lochblech` | Lochblech |

Rollcontainer für TK-Lieferware (`karton`) sind in der Config definiert, fließen aber **nicht** in die Hauptberechnung ein (→ siehe TK-Entscheidung).

### Stikken-Typen

Es gibt drei Stikken-Typen mit unterschiedlicher Grundfläche:

| Key | Bezeichnung | Einheiten (24er-Basis) |
|-----|-------------|----------------------|
| `stikken_24` | 24er Stikken | 1.0 |
| `stikken_20` | 20er Stikken | 1.0 |
| `schlawinerstikken` | Schlawinerstikken | 0.5 |

Der **Rollcontainer** ist für TK-Lieferware reserviert und wird separat behandelt.

### Kapazitäts-Matrix — Bleche pro Stikken

Die Anzahl der Bleche die in einen Stikken passen hängt von beiden Achsen ab:

| Stikken-Typ | Kuchenblech | Schlawinerblech | Lochblech |
|-------------|-------------|-----------------|-----------|
| **24er Stikken** | 96 | 48 | 24 |
| **20er Stikken** | 80 | 40 | 20 |
| **Schlawinerstikken** | 32 | 16 | — (passt nicht rein) |

Die Matrix ist editierbar in `froster_konfiguration.html`. Der Schlawinerstikken hat für Lochbleche `null` — diese Kombination existiert physisch nicht.

### Normalisierung auf 24er-Äquivalente

Da Stikken unterschiedliche Größen haben, wird alles auf **24er-Äquivalente** normalisiert:

```
Stikken_24er_Äquivalent = physische_Stikken × einheiten
```

Beispiel: 2 Schlawinerstikken × 0.5 = **1.0** 24er-Äquivalent.

Dies ermöglicht eine einheitliche Gesamtberechnung über alle Stikken-Typen hinweg.

---

## Rechenkette

```
Bestand [Bleche] ÷ kapazitaet[blechgroesse][stikken_typ] = physische Stikken
physische Stikken × einheiten = 24er-Äquivalente
∑ alle Produkte = Gesamtbelegung des Raums
Gesamtbelegung + Sperrflächen = effektive Belegung
effektive Belegung ÷ Kapazität = Auslastung [%]
```

**Wichtig:** Der Bestand wird in **Blechen** erfasst, nicht in Stück.

---

## Datenquellen

| Datei | Pfad | Inhalt |
|-------|------|--------|
| `inventurdaten.js` | `../inventurdaten.js` (Root) | `window.BOS_INVENTUR` — Bestand in Blechen je `legacyKey` |
| `produkt_config.json` | `../produkt_config.json` (Root) | Produktdefinitionen, Produktnamen |
| `froster_config.json` | `../froster_config.json` (Root) | Froster-Konfiguration (Kapazitäten, Zuweisungen, Sperrflächen) |

Der Identifier für die Produkt-Verknüpfung ist der **`legacyKey`** aus `produkt_config.json` — er entspricht dem Key in `BOS_INVENTUR.stocks` (z.B. `kornknacker_stueck`).

Produkte die in die Froster-Auslastung einfließen werden über `inventurRelevant: true` in `produkt_config.json` markiert.

---

## `froster_config.json` — Struktur

```json
{
  "blechgroessen": {
    "kuchenblech":     { "label": "Kuchenblech" },
    "schlawinerblech": { "label": "Schlawinerblech / Rote Diele" },
    "lochblech":       { "label": "Lochblech" }
  },

  "stikken_typen": {
    "stikken_24": {
      "label": "24er Stikken",
      "einheiten": 1.0,
      "kapazitaet": { "kuchenblech": 96, "schlawinerblech": 48, "lochblech": 24 }
    },
    "stikken_20": {
      "label": "20er Stikken",
      "einheiten": 1.0,
      "kapazitaet": { "kuchenblech": 80, "schlawinerblech": 40, "lochblech": 20 }
    },
    "schlawinerstikken": {
      "label": "Schlawinerstikken",
      "einheiten": 0.5,
      "kapazitaet": { "kuchenblech": 32, "schlawinerblech": 16, "lochblech": null }
    }
  },

  "froster_raeume": {
    "froster_a": {
      "label": "Froster A",
      "kapazitaet_normal": 70,
      "kapazitaet_maximal": 110
    },
    "froster_b": {
      "label": "Froster B",
      "kapazitaet": 50
    }
  },

  "sperrflaechen": {
    "froster_a": [
      { "id": "abc123", "label": "Croissant etc", "stikken": 2 }
    ],
    "froster_b": []
  },

  "produkt_zuweisung": [
    {
      "id": "kornknacker_stueck",
      "name": "Kornknacker",
      "kategorie": "Brötchen",
      "manuell": false,
      "blechgroesse": "lochblech",
      "stikken_typ": "stikken_24",
      "froster_raum": "froster_a"
    }
  ]
}
```

---

## Zwei Froster-Räume

### Froster A
- Hauptraum, größerer der beiden
- Hat zwei Zustände: **Normal** (geordnet, jeder Stikken an seinem Platz) und **Maximal** (Gänge zusätzlich befüllt)
- Beide Kapazitätswerte werden in der Auslastungsanzeige gleichzeitig angezeigt

### Froster B
- Zweiter Raum, einfachere Struktur
- Hat nur einen Zustand (eine Kapazitätszahl)
- Ansonsten identische Funktionalität

### Entscheidung: TK-Ware / Rollcontainer
TK-Lieferware auf Rollcontainern wird **nicht** in die Berechnung einbezogen. Begründung: die Anzahl der Rollcontainer ist immer gleich — sie stellen eine konstante Grundbelegung dar. In der Config ist eine feste **reservierte** Menge als Sperrfläche einzutragen wenn nötig.

---

## Sperrflächen

Sperrflächen modellieren temporär belegte Flächen die nicht durch Inventurprodukte erfasst werden — z.B. ein Stikken mit Mischmasch, eine Sonderlieferung, reservierter Platz.

**Eigenschaften:**
- Persistent in `froster_config.json` gespeichert (überleben Seitenreloads)
- Pro Froster-Raum separat
- Beschriftbar (z.B. "Croissant etc", "Mischmasch KW20")
- Stikken-Anzahl editierbar (Schritte: 0.5)
- Löschbar per ✕ wenn der Platz wieder frei ist
- Fließen als **Summand** in die Gesamtbelegung ein: `Produkte + Sperrflächen = Gesamt`
- Werden im UI als goldene Badge angezeigt (Zahl groß, "STIKKEN" darunter, Beschriftung rechts)
- Im Ausdruck als eigene Zeile in der Tabelle sichtbar

**Workflow:** Täglich wenn neue Stikken hereinkommen → Sperrfläche eintragen → Froster speichern → am nächsten Tag oder wenn der Platz frei ist → löschen.

---

## `froster_konfiguration.html`

Admin-Werkzeug mit vier aufklappbaren Sektionen:

### 1. Kapazitäts-Matrix (standardmäßig eingeklappt)
Tabelle: Stikken-Typen als Zeilen, Blechgrößen als Spalten. Alle Werte editierbar. `—` bei ungültigen Kombinationen (z.B. Lochblech in Schlawinerstikken). Einheiten-Spalte (24er-Normalisierung) ebenfalls editierbar.

### 2. Froster-Räume
Zwei Karten nebeneinander:
- **Froster A** (blau): Bezeichnung + zwei Kapazitätszahlen (Normal + Maximal)
- **Froster B** (lila): Bezeichnung + eine Kapazitätszahl

### 3. Sperrflächen
Pro Raum eine Spalte. Bestehende Einträge editierbar (Stikken-Zahl + Beschriftung), löschbar. Neue Einträge mit Formular am Ende jeder Spalte hinzufügbar.

### 4. Produkt-Zuweisung
Tabelle aller Froster-Produkte. Pro Produkt drei Dropdowns:
- **Blechgröße** — welches physische Blech
- **Stikken-Typ** — in welchem Stikken-Typ steht das Produkt normalerweise
- **Froster-Raum** — in welchem der beiden Räume

Produkte mit `inventurRelevant: true` werden beim Laden der Produkt-Config automatisch eingelesen (Badge: `auto`). Zusätzliche Produkte können manuell aus der restlichen Produktliste hinzugefügt werden (Badge: `manuell`, löschbar). Auto-Produkte können nicht manuell gelöscht werden.

**Migration:** Alte `froster_zustaende`-Struktur (Vorgängerformat) wird beim Laden automatisch in `froster_raeume` migriert. Produkte ohne `froster_raum` bekommen automatisch `froster_a`.

---

## `froster_auslastung.html`

### Zwei-Spalten-Layout
Froster A (links, blau) und Froster B (rechts, lila) nebeneinander. Auf Mobile gestapelt.

### Pro Raum:
- **Großzahl** — aktuelle Belegung in 24er-Äquivalenten, farbcodiert:
  - Grün: < 70 % der Normalkapazität
  - Gelb/Amber: 70–90 %
  - Rot: > 90 %
- **Subzeile** — Prozent + Hinweis auf Sperrflächen wenn vorhanden
- **Balkendiagramm** — mit Markierungslinien für Normal (grün) und Maximal (rot), Skala bis 115 % der Maximalkapazität
- **Kapazitäts-Zeilen** — Normal und Maximal gleichzeitig sichtbar mit Prozent und absoluten Zahlen
- **Sperrflächen-Badges** — goldene Kacheln mit großer Stikken-Zahl und Beschriftung
- **Produkttabelle** (aufklappbar) — sortiert nach Stikken-Anteil (größte zuerst), mit Blech-Typ, Bleche-Anzahl, Stikken-Wert und proportionalem Balken

### Laden
Auto-Load beim Start: `froster_config.json`, `produkt_config.json`, `inventurdaten.js`. Timestamp der letzten Inventur im Header.

### Drucken
Eigener Button pro Raum. Öffnet neues Fenster mit vollständig eigenständigem HTML (keine CSS-Variablen, Inline-Styles, eigene Fonts). Druckt sich automatisch. Inhalt: BäckereiOS-Header, Datum, Inventur-Timestamp, Großzahl, Kapazitätsbalken, Produkttabelle mit Sperrflächen, Fußzeile. Optimiert auf eine DIN-A4-Seite.

---

## Architektur-Entscheidungen (Protokoll)

| Entscheidung | Begründung |
|---|---|
| Bestand in Blechen, nicht Stück | Stikken-Berechnung braucht Bleche als Einheit. Die Umrechnung Stück→Blech über `charge` wäre ein unnötiger Zwischenschritt |
| 24er-Äquivalent als Gemeinsamwährung | Froster hat verschiedene Stikken-Typen — eine einheitliche Vergleichsgröße ist nötig. Der 24er ist der Basis-Stikken |
| Kapazität der Zustände als einfache Zahl | Ursprünglich geplant als Summe aus (Anzahl 24er × 1 + Anzahl 20er × 1 + Anzahl Schlawiner × 0.5). Das wurde verworfen: die Rechnung geht am Ende sowieso auf 24er-Äquivalente zurück — also direkt eingeben |
| TK-Rollcontainer aus Hauptrechnung raus | Immer gleiche Anzahl → keine Dynamik → feste Sperrfläche wenn nötig |
| Sperrflächen persistent | Täglich neue Anlieferungen → müssen auch nach Reload noch da sein |
| Froster B: nur ein Zustand | Froster B ist kleiner und einfacher strukturiert — Normal/Maximal-Unterschied existiert dort nicht |
| Auto-Migration alter Configs | Nahtloser Übergang ohne Datenverlust |
| Print: neues Fenster statt CSS-Media-Query | CSS-Print ist auf Mobile unzuverlässig — neues Fenster mit eigenem HTML ist garantiert korrekt |

---

---

# Froster-Optimierer — Konzept (noch nicht gebaut)

> Dieser Abschnitt dokumentiert das vollständig durchdachte Konzept eines Produktions-Optimierers der auf dem Froster-System aufbaut. Er ist nicht implementiert, aber so weit ausgearbeitet dass er als direkte Grundlage für die Entwicklung dienen kann.

---

## Problem und Ziel

**Problem:** Die Produktion wird aktuell aus Erfahrungswissen heraus geplant. Es gibt kein Werkzeug das systematisch beantwortet: an welchen Tagen soll welches Produkt produziert werden, damit der Froster möglichst gleichmäßig ausgelastet ist?

**Ziel:** Ein Simulationswerkzeug das für jede Station (z.B. Nachtschicht, Konditorei) einen Wochenproduktionsplan generiert bei dem:
1. Die Froster-Kurve über Mo–So so flach wie möglich ist (keine Berge und Täler)
2. Zu jedem Zeitpunkt die Versorgung gesichert ist (nächster Tag immer gedeckt)
3. Keine verbotenen Tage oder Kombinationen verletzt werden
4. Die Stationen nicht überlastet werden

---

## Eingaben pro Produkt

Für jedes Froster-Produkt werden folgende Parameter konfiguriert:

| Parameter | Bedeutung | Beispiel |
|-----------|-----------|---------|
| `produktionstage` | Anzahl Tage pro Woche an denen produziert wird | 3 |
| `erlaubte_tage` | Welche Wochentage erlaubt sind | Mo, Di, Mi, Do (kein Sa/So) |
| `sperrtage` | Einzelne Tage die explizit verboten sind | Fr gesperrt |
| `nicht_gleichzeitig` | Produkte die nicht am selben Tag produziert werden dürfen | Produkt A ≠ Produkt B |
| `station` | Welche Station produziert (aus `produkt_config.json`) | Nachtschicht |

Die Wahl **welche** konkreten Tage produziert werden (innerhalb des erlaubten Rahmens) überlässt der Benutzer dem Programm.

---

## Bestehende Infrastruktur

Das Fundament existiert bereits in `froster_gehirn.js`:

### `BOS_BRAIN.calculateChain(prodId, session, plannedProd)`
Simuliert für ein einzelnes Produkt den Bestandsverlauf über Zeit:
- Startbestand aus Inventur
- Täglich: Verbrauch abziehen (aus `BOS_STAMMDATEN[id].needs` — d.h. dem Wurm)
- Produktionsmengen addieren
- Ergebnis: `chain[]` mit `restAfter` pro Tag, `isOk`, `maxDeficit`

### `BOS_BRAIN.calculateAutoPlanning(prodId, session)`
Berechnet automatisch wie viel an welchem Produktionstag produziert werden soll:
- Verteilt Gesamtbedarf gleichmäßig auf die Produktionstage
- Verschiebt Chargen nach vorne wenn ein Engpass droht
- Gibt `planned[]` zurück (Menge pro Schritt)

### `BOS_STAMMDATEN[id].needs[0..6]`
Durchschnittsverbrauch pro Wochentag (Mo=0..So=6), berechnet vom Wurm aus der historischen Verkaufsdatenbank. Ist die Verbrauchskurve die der Optimierer als Grundlage nutzt.

Der Optimierer **baut auf diesen Funktionen auf** — er ruft sie für jeden Kandidatenplan auf und aggregiert die Ergebnisse zu einer Froster-Gesamtkurve.

---

## Algorithmus

Der Algorithmus folgt dem Muster des SchichtPlaners: **N Kandidaten generieren → bewerten → Local Search**.

### Schritt 1: Kandidaten generieren
Für jeden Kandidatenplan:
- Pro Produkt: wähle zufällig `produktionstage` Tage aus `erlaubte_tage` (unter Beachtung von `sperrtage` und `nicht_gleichzeitig`)
- Rufe `calculateAutoPlanning()` auf um die Produktionsmengen für diese Tagekombination zu ermitteln

### Schritt 2: Bewerten
Für einen gegebenen Plan:
1. `calculateChain()` für alle Produkte aufrufen
2. Pro Tag: Bestandsveränderungen aller Produkte in Blechen summieren
3. Bleche → 24er-Äquivalente (über `froster_config.json`)
4. **Froster-Kurve** = Froster-Belegung an jedem Tag der Woche
5. **Score** = Standardabweichung der Kurve (niedrig = gut) + Penalty wenn ein Tag die Normalkapazität überschreitet
6. Harte Bedingung: jeder Tag muss gedeckt sein (`isOk` = true für alle Produkte). Ungültige Pläne werden verworfen.

### Schritt 3: Local Search
Startend vom besten Kandidaten:
- Wähle zufällig ein Produkt und tausche einen seiner Produktionstage gegen einen anderen erlaubten Tag
- Bewerte den neuen Plan
- Behalte ihn wenn der Score besser ist
- Wiederhole N Iterationen

### Ergebnis
Der Plan mit dem niedrigsten Score (flachste Kurve, keine Kapazitätsverletzungen) wird ausgegeben.

---

## Zwei Optimierungsziele

Beide Ziele fließen in den Score ein:

### 1. Froster-Gleichmäßigkeit
Die Standardabweichung der täglichen Froster-Belegung über die Woche wird minimiert. Ein Plan bei dem der Froster jeden Tag auf ähnlichem Niveau ist schlägt einen Plan mit starken Schwankungen.

### 2. Stations-Gleichmäßigkeit
Produkte einer Station (z.B. Nachtschicht) sollen nicht alle auf denselben Tag fallen. Pro Station und Tag wird die Anzahl der zu produzierenden Produkte gezählt — eine hohe Konzentration wird mit einer Strafe belegt.

Wenn beide Ziele in Konflikt geraten (Froster will Montag produzieren, Nachtschicht ist Montag schon voll) gilt: **Froster-Gleichmäßigkeit hat Vorrang**, Stations-Überladung ist eine weiche Strafe, keine harte Grenze.

---

## Konfiguration pro Produkt (geplantes Schema)

In `froster_config.json` unter `produkt_zuweisung` würde jedes Produkt um folgende Felder erweitert:

```json
{
  "id": "hasenpfoetchen_stueck",
  "froster_raum": "froster_a",
  "blechgroesse": "lochblech",
  "stikken_typ": "stikken_24",
  "optimierer": {
    "aktiv": true,
    "produktionstage": 3,
    "erlaubte_tage": [1, 2, 3, 4, 5],
    "sperrtage": [],
    "nicht_gleichzeitig": ["rosinen_batzen_stueck"]
  }
}
```

`erlaubte_tage` und `sperrtage` nutzen JS-Wochentag-Notation (0=So, 1=Mo, ..., 6=Sa).

---

## Verbindung zum Planer

Der Produktionsplan den der Optimierer ausgibt hat dieselbe Struktur wie `sess.productionDays` und `calculateAutoPlanning()`-Output im bestehenden Planer. Das bedeutet:

- Der Optimierer kann direkt als **Vorschlag für die `planer.html`-Session** dienen
- Der Planer kann den vorgeschlagenen Plan laden und der Benutzer kann ihn manuell anpassen
- Die bestehende `recalculateShift()`-Logik bleibt unverändert nutzbar

Dies ist die sauberste Verbindung: Optimierer **schlägt vor**, Planer **korrigiert bei Bedarf**.

---

## Offene Designfragen (für spätere Implementierung)

| Frage | Status |
|-------|--------|
| Wochenzyklus Mo–So fest oder rollierend? | Offen — wahrscheinlich Mo–So fest, da Froster-Größe wöchentlich schwankt |
| Samstag als Produktionstag: globales Flag oder pro Produkt? | Offen — besprochen als globale Konfiguration (`Sa einbeziehen: ja/nein`) |
| Wie viele Kandidaten? Wie viele Local-Search-Iterationen? | Offen — Erfahrungswert aus SchichtPlaner: 100 Kandidaten, 500 LS-Iterationen als Startpunkt |
| Anzeige der Froster-Kurve: Mo–So Balkendiagramm? | Nicht spezifiziert — naheliegend wäre dasselbe visuelle System wie `froster_auslastung.html` |
| Speicherort des Optimierer-Ergebnisses? | Wahrscheinlich `localStorage` als Planvorschlag, per Button in Planer-Session übertragbar |

---

## Einordnung

Dieser Optimierer ist konzeptionell das interessanteste Werkzeug in BäckereiOS — weil er nicht nur dokumentiert, sondern **entscheidet**. Er modelliert den Froster als Pufferspeicher und beantwortet die Frage die bisher durch Erfahrungswissen gelöst wurde:

> *Wann soll was produziert werden, damit immer genug da ist, aber der Froster nie überquillt?*

In der Logistik heißt dieses Problem **Bestandsführung mit Pufferlager**. BäckereiOS löst es für eine Bäckerei — mit echten Verbrauchsdaten aus der eigenen Verkaufshistorie, echten physischen Constraints (Blechgrößen, Stikken-Kapazitäten, Stationszeiten) und einem Optimierungsalgorithmus der die flachste Kurve findet.

---

*Dokument erstellt: Mai 2026 · BäckereiOS · N. Wolf / Ulf*
