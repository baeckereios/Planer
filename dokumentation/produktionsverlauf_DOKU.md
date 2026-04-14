# Dokumentation: Produktionsverlauf-System

**Letzte Aktualisierung:** April 2026  
**Dateien:** `produktionsverlauf_baguette.html`, `produktionsverlauf_db.json`  
**Zugang:** Von `baguette_rechner.html` via "📋 Produktionsverlauf öffnen"-Button

---

## 1. Zweck und Konzept

Der Produktionsverlauf ist ein **Dokumentations-Werkzeug** (kein Planungswerkzeug). Er erfasst was tatsächlich produziert wurde und was verbraucht wurde — und zeigt daraus den rollenden Froster-Bestand über 9 Tage (heute + 8 Folgetage).

Abgrenzung zum Stangenrechner:
- **Stangenrechner** → Planung: Was muss ich heute Nacht produzieren?
- **Produktionsverlauf** → Dokumentation: Was wurde produziert, was wurde verbraucht, wie entwickelt sich der Bestand?

---

## 2. Dateistruktur

```
produktionsverlauf_baguette.html   ← Seite für Baguette/Zwiebel-Produkte
produktionsverlauf_db.json         ← Gemeinsame Datenbasis für ALLE Produkte
```

### Warum eine gemeinsame DB für alle Produkte?

Die `produktionsverlauf_db.json` ist **produktübergreifend**. Zukünftige Seiten (`produktionsverlauf_zwiebel.html`, `produktionsverlauf_croissant.html` etc.) schreiben ihre Daten alle in dieselbe Datei — unter ihren eigenen Legacy-Keys. Kein Konflikt, volle Kompatibilität.

---

## 3. `produktionsverlauf_db.json` — Datenstruktur

```json
{
  "version": 1,
  "eintraege": {
    "2026-04-13": {
      "stangen_gesamt_stueck": 8,
      "stangen_gesamt_stueck_vbr": 54,
      "baguettestange_teig_stueck": 12
    },
    "2026-04-14": {
      "stangen_gesamt_stueck": 6
    }
  }
}
```

### Key-Schema

| Key | Bedeutung |
|---|---|
| `legacyKey` | Produktionsmenge dieses Tages (Bleche/Dielen) |
| `legacyKey + '_vbr'` | Manuell eingetragener Verbrauch (überschreibt DB-Wert) |

### Automatischer Cleanup

Beim Speichern werden alle Einträge **älter als 14 Tage automatisch gelöscht**. Die Datei wächst nie über ~14 Tage Daten hinaus. Kein manuelles Aufräumen nötig.

### Speicher-Workflow

1. Nutzer trägt Werte ein
2. Klick auf "💾 Speichern"
3. `bereinige()` löscht Einträge > 14 Tage
4. JSON-Download wird ausgelöst (`produktionsverlauf_db.json`)
5. Datei wird wie alle anderen DB-Dateien automatisiert hochgeladen

---

## 4. PRODUKT_CONFIG — für neue Produkte anpassen

```javascript
const PRODUKT_CONFIG = [
  { id:'baguette',    label:'Baguette',      shortLabel:'Baguette',
    legacyKey:'stangen_gesamt_stueck',      einheit:'Bl.', charge:6 },
  { id:'bagteig',     label:'Bag.-Teig',     shortLabel:'Bag.Teig',
    legacyKey:'baguettestange_teig_stueck', einheit:'Dl.', charge:3 },
  { id:'zwiebel',     label:'Zwiebelstange', shortLabel:'Zwiebel',
    legacyKey:'zwiebelstange_stueck',       einheit:'Bl.', charge:6 },
  { id:'zwiebelteig', label:'Zwb.-Teig',     shortLabel:'Zwb.Teig',
    legacyKey:'zwiebelstange_teig_stueck',  einheit:'Dl.', charge:3 },
];
```

**Felder:**
- `id` — interner Bezeichner (localStorage-Key, Chip-ID)
- `label` — Anzeigename lang (Chip, Akkordeon-Header)
- `shortLabel` — Anzeigename kurz (Print-Tabellenkopf)
- `legacyKey` — Schlüssel in `produktionsverlauf_db.json` und `BOS_INVENTUR`/`BOS_GEHIRN._db`
- `einheit` — `'Bl.'` (Bleche) oder `'Dl.'` (Dielen)
- `charge` — Fallback-Wert; echter Wert kommt aus `stammdaten[bosId].charge`

---

## 5. Bestand-Rollrechnung ⚠️ Kernlogik

### Prioritäten pro Tag

```
1. Inventur-Timestamp für exakt dieses Datum?
   → JA: rollBst = Inventur-Wert (Kette neu gestartet)
   → NEIN: weiter zu 2.

2. Effektiver Verbrauch vorhanden?
   (manuell eingetragen ODER in backmengen_db gefunden)
   → JA: rollBst = rollBst + Produktion - Verbrauch
   → NEIN: rollBst = null (Kette stoppt, kein Ø-Fallback)
```

### Formel

```
bestand[Tag+1] = bestand[Tag] + produktion[Tag] − verbrauch_effektiv[Tag]
```

Wobei:
- `produktion[Tag]` = manuell eingetragen in der DB (0 wenn nicht eingetragen)
- `verbrauch_effektiv[Tag]` = manuell > DB > null

### Was NIE passiert

Der **Ø-Durchschnittswert wird niemals für die Bestandsberechnung verwendet**. Er dient ausschließlich der visuellen Orientierung in der Tabelle.

---

## 6. Verbrauch-Priorität (`getVbrEffektiv`)

```javascript
function getVbrEffektiv(prod, isoStr) {
  const manual = getManualVbr(prod.legacyKey, isoStr);
  if (manual !== null) return { wert: manual, quelle: 'manuell' };
  const real = getRealVbr(prod, isoStr);
  if (real !== null) return { wert: real, quelle: 'db' };
  return null;
}
```

| Quelle | Woher | Anzeige im Screen | Anzeige im Print |
|---|---|---|---|
| `'manuell'` | `legacyKey + '_vbr'` in prodDB | teal gefärbt | Wert + `*` |
| `'db'` | `BOS_GEHIRN._db` → Eintrag für Datum | grau als Placeholder | Wert normal |
| `null` | kein Wert | leeres Feld | leer |

---

## 7. Inventur-Neustart (`getBestandFuerDatum`)

```javascript
function getBestandFuerDatum(prod, isoStr) {
  const p = window.BOS_INVENTUR.products?.[prod.legacyKey];
  if (!p || !p.ts) return null;
  const invDatum = new Date(p.ts).toISOString().slice(0,10);
  return invDatum === isoStr ? (p.stock ?? ...) : null;
}
```

Wenn der Inventur-Timestamp (`p.ts`) auf exakt dieses Datum fällt, wird der Inventur-Bestand als Startwert gesetzt und die Rechenkette neu gestartet. Das ermöglicht einen Neustart **mitten in der Woche** nach einer frischen Inventur.

---

## 8. Funktionsübersicht

| Funktion | Aufgabe |
|---|---|
| `getTage()` | Array der nächsten 9 Tage ab heute (BOS-Index, isoStr, etc.) |
| `getNeeds(prod)` | Ø-Werte aus `BOS_STAMMDATEN` via `bosIdFuerKey()` |
| `getCharge(prod)` | Charge aus Stammdaten, Fallback aus PRODUKT_CONFIG |
| `getBestand(prod)` | Aktueller Inventur-Bestand aus `BOS_INVENTUR` |
| `getBestandFuerDatum(prod, isoStr)` | Inventur-Bestand nur wenn Timestamp == Datum |
| `getRealVbr(prod, isoStr)` | Realer Verbrauch aus `BOS_GEHIRN._db` |
| `getVbrEffektiv(prod, isoStr)` | Effektiver Verbrauch: manuell > DB > null |
| `getProd(legacyKey, isoStr)` | Produktionswert aus prodDB |
| `setProd(legacyKey, isoStr, value)` | Produktionswert in prodDB schreiben + Tabelle neu rendern |
| `getManualVbr(legacyKey, isoStr)` | Manuellen Verbrauch aus prodDB lesen (`_vbr`-Key) |
| `setManualVbr(legacyKey, isoStr, value)` | Manuellen Verbrauch schreiben + neu rendern |
| `bereinige()` | Einträge > 14 Tage aus prodDB löschen |
| `speichern()` | bereinige() → JSON-Download |
| `ladeProdDB()` | `produktionsverlauf_db.json` fetchen (cache:no-store) |
| `buildScreenTabelle(prod)` | HTML-Tabelle für ein Produkt (Screen) |
| `renderAkkordeons()` | Alle Akkordeons neu rendern (Öffnungszustand bleibt erhalten) |
| `toggleAkk(gi)` | Akkordeon öffnen/schließen |
| `drucken()` | Eigenständiges Print-Fenster öffnen (window.open) |

---

## 9. Screen-Tabelle: Zell-Struktur pro Tag

```
┌─────────┬──────────────────┬──────────────────┬──────────────────┐
│         │   BST / PROD     │     VERBR.       │       Ø          │
│  Tag    ├──────────────────┼──────────────────┼──────────────────┤
│  Datum  │ [Bestand oben]   │                  │                  │
│         ├ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│         │ [🟡 Prod.-Input] │ [🩵 Vbr.-Input]  │ [grau Ø-Wert]   │
└─────────┴──────────────────┴──────────────────┴──────────────────┘
```

- **Bestand oben** — berechneter rollender Bestand (read-only)
- **Prod.-Input** (amber) — Produktionseintrag (was wurde heute Nacht produziert)
- **Vbr.-Input** (teal wenn manuell) — Verbrauch; Placeholder = DB-Wert, Wert = manuelle Überschreibung
- **Ø-Wert** — Durchschnitt aus backmengen_db, read-only, nur Orientierung

---

## 10. Print-Layout

Eigenständiges `window.open()`-Fenster (wie Bestandsübersicht), kein Druck-Button, `window.print()` automatisch nach 600ms.

**Format:** A4 quer, Margin 8mm/10mm  
**Schriften:** Fraunces (Logo), Barlow Condensed (Tabelle)  
**Spalten pro Produkt:** BST | +PROD | VBR | Ø  
**Trenner:** 2pt Linie zwischen Produktpaaren, 6mm Lücke zwischen Hälften  
**Zebra:** `#efefef` / `#fff`, `print-color-adjust:exact`  
**Manueller Verbrauch:** im Print mit `*` markiert

**Bis zu 4 Produkte** in einer Tabelle (2 links + 2 rechts). Leere Slots erscheinen als leere Spalten.

---

## 11. Neue Seite für ein weiteres Produkt erstellen

**Schritte:**

1. `produktionsverlauf_baguette.html` kopieren → z.B. `produktionsverlauf_zwiebel.html`

2. `<title>` anpassen:
   ```html
   <title>BäckereiOS — Produktionsverlauf Zwiebel</title>
   ```

3. `PRODUKT_CONFIG` auf die relevanten Produkte reduzieren oder anpassen:
   ```javascript
   const PRODUKT_CONFIG = [
     { id:'zwiebel', label:'Zwiebelstange', shortLabel:'Zwiebel',
       legacyKey:'zwiebelstange_stueck', einheit:'Bl.', charge:6 },
     { id:'zwiebelteig', label:'Zwb.-Teig', shortLabel:'Zwb.Teig',
       legacyKey:'zwiebelstange_teig_stueck', einheit:'Dl.', charge:3 },
   ];
   ```

4. `LS_KEY` für localStorage anpassen (verhindert Auswahl-Konflikte zwischen Seiten):
   ```javascript
   const LS_KEY = 'BOS_PROD_AUSWAHL_ZWIEBEL';
   ```

5. In `shell.js` registrieren.

6. Auf der zugehörigen Rechner-Seite den Verlauf-Button verlinken:
   ```html
   <button ... onclick="window.location='produktionsverlauf_zwiebel.html'">
     📋 Produktionsverlauf öffnen
   </button>
   ```

**Die `produktionsverlauf_db.json` bleibt unverändert** — alle Seiten schreiben ihre Legacy-Keys in dieselbe Datei.

---

## 12. localStorage

| Key | Inhalt |
|---|---|
| `BOS_PROD_AUSWAHL` | Array der ausgewählten Produkt-IDs (Standard: `["baguette"]`) |

Für neue Seiten eigenen Key verwenden (z.B. `BOS_PROD_AUSWAHL_ZWIEBEL`).

---

## 13. Externe Abhängigkeiten

| Datei | Stellt bereit | Wird genutzt für |
|---|---|---|
| `inventurdaten.js` | `window.BOS_INVENTUR` | `getBestand()`, `getBestandFuerDatum()` |
| `produktions_gehirn.js` | `window.BOS_GEHIRN`, `window.BOS_STAMMDATEN` | `getNeeds()`, `getCharge()`, `getRealVbr()` |
| `produktionsverlauf_db.json` | `prodDB` | Alle Produktions- und manuellen Verbrauchswerte |
| `shell.js` | Navigation, Tab-Bar | — |
| `systemdesign.css` | Design-Tokens (`--amber`, `--dim`, etc.) | — |

---

## 14. Bekannte Fallstricke

**Kette bricht bei fehlendem Verbrauch** — das ist gewollt. Wenn für einen Tag kein Verbrauch (weder DB noch manuell) existiert, stoppt die Bestandsanzeige. Die Lösung: manuellen Verbrauch eintragen oder warten bis backmengen_db den Wert liefert.

**`renderAkkordeons()` nach jedem `setProd`/`setManualVbr`** — die gesamte Tabelle wird bei jeder Eingabe neu gerendert. Das ist nötig damit der rollende Bestand sofort korrekt angezeigt wird. Öffnungszustand der Akkordeons wird dabei gespeichert und wiederhergestellt.

**`summeNeeds` im Print** — summiert die Ø-Werte aller 9 Tage, nicht die tatsächlichen Verbräuche. Ist ein Planungswert, kein Istwert.

**Inventur-Neustart greift nur wenn `p.ts` auf exakt heute zeigt** — wenn die Inventur gestern gemacht wurde, greift der Neustart nicht mehr (der Timestamp ist von gestern). Normales Verhalten.

---

## 15. Änderungshistorie

| Datum | Änderung |
|---|---|
| April 2026 | Erstellt auf Basis von Gemini-Layout (Print) + eigenem Screen-Code |
| April 2026 | Manuelle Verbrauchseingabe ergänzt (`_vbr`-Keys, teal-Input) |
| April 2026 | Rollrechnung: Produktion wird addiert (`bestand + prod - vbr`) |
| April 2026 | Umbenennung zu `produktionsverlauf_baguette.html` |
| April 2026 | `baguette_rechner.html`: Settings-Card konsolidiert, Verlauf-Button ergänzt |
