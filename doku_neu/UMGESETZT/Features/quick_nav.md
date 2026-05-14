# Quick-Nav Buttons — `bestandsuebersicht.html`

**Stand:** Mai 2026  
**Autor:** [Claude]  
**Querverweise:** `bestandsuebersicht.html`, `schnellrechner.html`, `durchschnittsverbauch/verlauf.html`, `durchschnittsverbauch/14_tage_logbuch.html`, `backwaren/steckbrief.html`, `window.BOS_STAMMDATEN`, `produkt_config.json`  
**Ersetzt:** Sniper-Menü (Long-Press-Konzept, verworfen wegen fehlender Entdeckbarkeit)

---

## Konzept

Kompakte Button-Leiste im Kartenheader der Bestandsübersicht. Direkt sichtbar ohne Interaktion — keine versteckte Geste nötig. Jeder Button navigiert zur entsprechenden Produktseite mit vorausgefülltem `?key=` Parameter.

---

## Aussehen

Zweizeiliger Kartenheader:

```
KORNKNACKER                    136 / 200 Bl. ▾
[🧮 Rechner] [📈 Verlauf] [📓 Logbuch] ([📋 Steckbrief])
```

Tap auf die gesamte Karte (außer Buttons) → Akkordeon auf/zu wie bisher.

---

## Buttons

| Icon | Label | Ziel | Bedingung |
|---|---|---|---|
| 🧮 | Rechner | `schnellrechner.html?key=LEGACY_KEY` | immer |
| 📈 | Verlauf | `durchschnittsverbauch/verlauf.html?key=LEGACY_KEY` | immer |
| 📓 | Logbuch | `durchschnittsverbauch/14_tage_logbuch.html?key=LEGACY_KEY` | immer |
| 📋 | Steckbrief | `backwaren/steckbrief.html?id=LEGACY_KEY` | nur wenn `in_backstube_gebacken: true` |

---

## Technische Details

### Key-Auflösung in bestandsuebersicht.html

```javascript
var lk = (window.BOS_STAMMDATEN && window.BOS_STAMMDATEN[k] && window.BOS_STAMMDATEN[k].legacyKey)
    ? window.BOS_STAMMDATEN[k].legacyKey : k;
```

### Akkordeon-Schutz

Jeder Button hat `onclick="event.stopPropagation()"` — verhindert dass der Tap gleichzeitig das Akkordeon öffnet/schließt.

### CSS

Klassen: `.quick-nav` (flex container), `.quick-nav a` (einzelner Button). Nutzt `var(--surface2)`, `var(--border-s)`, `var(--text)` — passt sich automatisch an Hell/Dunkel-Theme an.

---

## URL-Parameter-Handling in Zielseiten

### Schnellrechner (`schnellrechner.html`)

Options im `<select id="prod-select">` haben den internen BOS_STAMMDATEN-Key als Value — **nicht** den `legacyKey`. Deshalb muss der übergebene `legacyKey` erst zurückaufgelöst werden:

```javascript
const urlKey = new URLSearchParams(window.location.search).get('key');
if (urlKey) {
    const stammdatenKey = Object.keys(window.BOS_STAMMDATEN).find(id =>
        window.BOS_STAMMDATEN[id].legacyKey === urlKey
    ) || urlKey;
    sel.value = stammdatenKey;
    if (sel.value) syncStock();
}
```

### Verlauf (`durchschnittsverbauch/verlauf.html`)

Arbeitet intern mit Produktnamen. Nach `renderProdListe()` in `init()`:

```javascript
const urlKey = new URLSearchParams(window.location.search).get('key');
if (urlKey) {
    const treffer = alleProdukte.find(p => p.legacyKey === urlKey);
    if (treffer) toggleProdukt(treffer.name);
}
```

### Logbuch (`durchschnittsverbauch/14_tage_logbuch.html`)

`cfgData` war ursprünglich nur im `DOMContentLoaded`-Block als `const` definiert und in `ladeHistorie()` nicht erreichbar. Fix: als `let` deklariert und als Parameter übergeben.

```javascript
// DOMContentLoaded:
let cfgData = [];
// ... befüllen ...
ladeHistorie(einheitMap, kategorienMapSortiert, cfgData);

// ladeHistorie Signatur:
async function ladeHistorie(einheitMap = {}, kategorienMap = {}, cfgData = []) {
```

URL-Parameter-Handling nach `baueFilter()`:

```javascript
const urlKey = new URLSearchParams(window.location.search).get('key');
if (urlKey) {
    const treffer = cfgData.find(p => p.legacyKey === urlKey);
    if (treffer && treffer.name) {
        aktiveProdukte.add(treffer.name);
        document.querySelectorAll('.filter-chip').forEach(c => {
            if (c.textContent === treffer.name) c.classList.add('aktiv');
        });
        aktualisiereHinweis();
    } else {
        // Produkt nicht gefunden
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '⚠ Produkt für "' + urlKey + '" nicht in produkt_config.json gefunden.';
    }
}
// Nach renderLogbuch(): Hinweis wenn keine Einträge vorhanden
if (urlKey && aktiveProdukte.size > 0) {
    const inhalt = document.getElementById('logbuch-inhalt');
    if (inhalt && inhalt.innerHTML.trim() === '') {
        inhalt.innerHTML = '<div ...>Keine Einträge für dieses Produkt in den letzten 14 Tagen.</div>';
    }
}
```

---

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `bestandsuebersicht.html` | CSS ergänzt, `prod-header` zweizeilig, Quick-Nav Buttons in `buildCard`, Sniper-Menü entfernt |
| `schnellrechner.html` | legacyKey → BOS_STAMMDATEN-Key Rückauflösung in `init()` |
| `durchschnittsverbauch/verlauf.html` | URL-Parameter-Handling in `init()` nach `renderProdListe()` |
| `durchschnittsverbauch/14_tage_logbuch.html` | `cfgData` als Parameter, URL-Parameter-Handling + zwei Fehlerhinweise |

---

## Tabu-Zonen

- `event.stopPropagation()` auf den Buttons nicht entfernen.
- Pfad `durchschnittsverbauch/` — intentionaler Tippfehler, nie korrigieren.
- `legacyKey` nie umbenennen.
- Steckbrief-Bedingung (`in_backstube_gebacken`) erhalten.
- Im Logbuch `cfgData` als Parameter belassen — nicht zurück zu `const` im äußeren Block.

---

## Erweiterungshinweise

- **Neuen Button** → `btns +=` in `buildCard` + Zielseite um `?key=` Handling erweitern.
- **Labels kürzen** → Text in den `btns`-Strings anpassen.
- Jede neue Zielseite braucht die legacyKey→Name Auflösung individuell — die drei bestehenden Mechanismen zeigen drei verschiedene Wege (select value, toggleProdukt, Set + Chip).
