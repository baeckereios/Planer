# NFC-Pausentimer

**Status:** Idee / Nebenkriegsschauplatz  
**Aufwand:** Trivial — eine einzelne HTML-Seite  
**Abhängigkeiten:** Keine (localStorage, kein Backend)

---

## Konzept

Zwei NFC-Aufkleber in der Pausenecke. Jeder Mitarbeiter nutzt das eigene Handy.

| Aufkleber | URL | Aktion |
|-----------|-----|--------|
| **START** | `/pause?action=start` | Startet 30-Min-Countdown |
| **STOP** | `/pause?action=stop` | Stoppt den Timer, zeigt Ergebnis |

Zwei Aufkleber statt einem — bewusste Geste, verhindert versehentliches Stoppen beim Vorbeigehen.

---

## UI

- Großer Countdown, gut lesbar (Vollbild-Ansatz)
- **Grün** solange Zeit übrig
- **Orange** unter 5 Minuten
- **Rot** bei Überschreitung
- Optional: kleiner Verlauf der letzten Pausen der Schicht

---

## Technik

- Eine HTML-Seite, URL-Parameter `?action=start` / `?action=stop`
- localStorage für Timestamps und Verlauf
- Kein Backend, kein MacroDroid, keine Architektur-Diskussion
- Läuft auf jedem Handy mit Chrome (Android NFC-Scan öffnet direkt die Seite)

---

## Warum zwei Aufkleber?

Ein einziger Aufkleber würde toggle-artig funktionieren — aber dann reicht ein versehentliches Drankommen mit dem Handy. Zwei Aufkleber = zwei bewusste Handlungen = kein falsches Stempeln.

---

## Abgrenzung

Kein Überwachungsinstrument. Läuft lokal auf dem eigenen Gerät, keine zentralen Daten, kein Heinrich-Dashboard. Rein persönliches Tool: *„Wieviel Pause habe ich noch?"*

