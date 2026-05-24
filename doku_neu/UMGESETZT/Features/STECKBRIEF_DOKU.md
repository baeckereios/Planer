# Steckbrief-System — Dokumentation

**Dateien:** `backwaren/steckbrief.html`, `AdminTools/steckbrief_editor.html`, `backwaren_steckbrief.json`
**Stand:** Mai 2026

---

## Übersicht

Das Steckbrief-System stellt pro Produkt eine kompakte Arbeitsansicht bereit — erreichbar per NFC-Chip an der Backstube oder über den Vorschau-Link im Editor. Es zeigt Teig, Aufbau, Gare, Back- und Versandinfos als anklickbare Tab-Abschnitte, sowie — wenn aktuell — den aktuellen Froster-Bestand.

---

## Dateien

### `backwaren/steckbrief.html`
Die Ansichtsseite. Wird mit `?id=<legacyKey>` aufgerufen.

**Lädt:**
- `../produkt_config.json` — Produktmetadaten (Name, Charge, `inventurRelevant`, `einheit` etc.)
- `../backwaren_steckbrief.json` — Steckbrief-Inhalte (Abschnitte + Felder)
- `../lieferanten_config.json` — für TK-Ware: Verbindung `produkt_config_key → id`
- `../lieferanten_db.json` — für TK-Ware: Bestandseinträge
- `../inventurdaten.js` — für Froster-Backwaren: setzt `window.BOS_INVENTUR`

### `AdminTools/steckbrief_editor.html`
Der Pflegedialog. Produkt aus Dropdown wählen, Abschnitte ein-/ausschalten, Felder befüllen, speichern.

**Lädt:**
- `../produkt_config.json` — befüllt das Dropdown (alle Produkte, kein Filter)
- `../backwaren_steckbrief.json` — lädt vorhandene Steckbriefe; Produkte mit Eintrag werden mit `✓` markiert

**Speichern:** Löst einen Download von `backwaren_steckbrief.json` aus (Snapshot-Workflow). Datei muss manuell ins Repo committed und deployed werden.

### `backwaren_steckbrief.json`
Zentrale Datendatei. Keyed nach `legacyKey`.

```json
{
  "butter_croissant_stueck": {
    "produktname": "Butter-Croissant",
    "abschnitte": {
      "backen": {
        "sichtbar": true,
        "programm": "P12",
        "temperatur_ober": 185,
        "temperatur_unter": 170,
        "minuten": 18,
        "hinweis": "Gut im Auge behalten — Croissants nehmen schnell Farbe."
      },
      "versand": { "sichtbar": true, "pro_korb": 12, "hinweis": "" },
      "teig":    { "sichtbar": false, "text": "" },
      "aufbau":  { "sichtbar": false, "schritte": [] },
      "gare":    { "sichtbar": false, "text": "" }
    }
  }
}
```

---

## Abschnitte

| Key | Label | Felder |
|---|---|---|
| `teig` | 🌾 Teig | `text` (Freitext) |
| `aufbau` | 🔧 Aufbau | `schritte` (Array, eine Zeile = eine Aufgabe, ankreuzbar) |
| `gare` | ⏱ Gare | `text` (Freitext) |
| `backen` | 🔥 Backen | `programm`, `temperatur_ober`, `temperatur_unter`, `minuten`, `hinweis` |
| `versand` | 📦 Versand | `pro_korb`, `hinweis` |

Abschnitte mit `sichtbar: false` werden in der Ansicht nicht angezeigt und erscheinen nicht als Tab.

---

## Bestand-Chip

Direkt unter dem Produktkopf wird — wenn die Daten aktuell sind — ein Bestandshinweis eingeblendet. **Beide Quellen zeigen nichts an wenn der Timestamp älter als 12 Stunden ist.**

### Quelle 1: TK-Ware (lieferanten_db)
- Bedingung: Produkt ist in `lieferanten_config.json` via `produkt_config_key === legacyKey` auffindbar
- Datenquelle: letzter `typ: "bestand"`-Eintrag in `lieferanten_db.json` für die Lieferanten-Produkt-ID
- Anzeige: `❄️ Froster: <Menge> <Einheit> · HH:MM Uhr`

### Quelle 2: Froster-Backwaren (BOS_INVENTUR)
- Bedingung: `produkt.inventurRelevant === true` in `produkt_config.json`
- Datenquelle: `window.BOS_INVENTUR.products[legacyKey]` aus `inventurdaten.js`
- Felder: `stock` (Gesamtbestand), `ts` (Unix-Timestamp ms), `locs` (Verteilung), `fehlmenge`
- Anzeige: `🧊 Froster: <stock> <einheit> · HH:MM Uhr`

> **Unterscheidung:** ❄️ = TK-Lieferware, 🧊 = selbst produzierte Froster-Backware

---

## Workflow: Steckbrief anlegen

1. `AdminTools/steckbrief_editor.html` öffnen
2. Produkt aus Dropdown wählen
3. Gewünschte Abschnitte per Toggle auf **Sichtbar** stellen
4. Inhalte eintragen
5. **⬇️ Speichern** → Download `backwaren_steckbrief.json`
6. Datei ins Repo committen und deployen

---

## Bekannte Einschränkungen

- **Kein Live-Speichern:** Der Editor speichert per Download, nicht direkt ins Repo. Jede Änderung erfordert einen Deploy.
- **Keine Filterung im Dropdown:** Der Editor zeigt alle Produkte aus `produkt_config.json`, auch Rohstoffe und interne Hilfspositionen. Hintergrund: Die ursprünglich geplanten Felder `in_backstube_gebacken` / `ist_rohstoff` wurden nie in die `produkt_config` aufgenommen — sie existieren nur in `lieferanten_config.json`.
- **inventurdaten.js muss aktuell sein:** Die Datei wird statisch deployed. Ist sie älter als 12h, zeigt der Chip nichts an — das ist gewollt.
