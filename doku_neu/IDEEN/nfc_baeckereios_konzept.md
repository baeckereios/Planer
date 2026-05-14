# NFC-Konzept für BäckereiOS

## Grundprinzip

NFC-Aufkleber an festen Stationen in der Bäckerei. Chip enthält eine URL, Scan öffnet direkt die richtige Seite im Browser. Keine App nötig außer Chrome auf Android. Kein Backend, kein MacroDroid.

**Hauptnutzen:** Entdeckbarkeit + Schnellzugriff. Kollegen erfahren über den Chip, dass eine Funktion existiert — und landen sofort dort.

---

## Anwendungsfall 1: Lager-Inventur (Priorität: hoch, wartet auf Lagersystem-Überarbeitung)

**Kontext:** Nur für Produkte mit **festem Standort** — TK-Ware, Rohstoffe. Nicht für selbst produzierte Backwaren die überall stehen.

**Flow:**
1. Chip klebt am Regalfach (nicht am Produkt)
2. Scan → Produktseite öffnet mit letztem bekannten Bestand als Referenz
3. Aktuelle Anzahl eingeben → weiter zum nächsten Chip
4. Am Ende: „Erfassung abschließen" → Export als JS/JSON-Datei

**Vorteil:** Statt in einer langen Liste das richtige Produkt zu suchen — einfach Handy dranhalten, Zahl eingeben, weiter. Extrem schnell im Durchlauf.

**Status:** Wird erst gebaut wenn das Lagersystem überarbeitet ist (Lieferschein-Erfassung hat sich geändert → Datenkette muss neu gedacht werden).

---

## Anwendungsfall 2: Allgemeine Station-Schnellzugriffe

Aufkleber an festen Stationen als physischer Einstiegspunkt ins System:

| Station | Ziel |
|---------|------|
| Froster | Froster-Bestand |
| Ofen | Ofensimulator |
| Frühstückstisch | baeckereios.github.io (allgemein) |
| Klemmbrett | Frosterliste / Checkliste |

**Hauptzweck hier:** App-Verbreitung unter Kollegen + Entdeckbarkeit von Funktionen.

---

## Technische Grundlage

- Chip speichert URL mit ID-Parameter: `baeckereios.github.io/inventur?id=xyz`
- Bekannte ID → direkt zur Produktseite
- Unbekannte ID → Registrierungsmaske
- Zwischenspeicher während Erfassungsrunde: `localStorage`
- Export am Ende: fertiger JS/JSON-Blob zum Einpflegen

---

## Was bereits existiert (Nebenkriegsschauplatz)

`haushalt.html` — separates Tool für private Haushaltsverwaltung mit NFC, gebaut in dieser Session. Gleiches Grundprinzip: Chip → URL → Registrierung → Verknüpfung Ort↔Gegenstand → Status (eingelagert/entnommen) → Kategorie-Counter. Technisch übertragbar auf Betriebsmaterialien (Backpapier, Handschuhe, Reinigung) — aber das ist ein dritter Kontext, noch nicht angegangen.

---

## Was NICHT funktioniert

- **MacroDroid als Hintergrund-Scanner:** Löst das falsche Problem. Scan-Moment ist bewusst, App muss sowieso offen sein.
- **NFC für Backwaren im Froster:** Kein fester Standort → kein Sinn. Füllstand-Logik läuft weiter über tagesaktuelle Erfassung.
