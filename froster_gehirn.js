/**
 * BÄCKEREIOS - ZENTRALES FROSTER-GEHIRN V119
 * Revision: Korrektur der vorausschauenden Warnung bei aktivem Froster-Status.
 */
window.BOS_BRAIN = {
    calculateChain: function(prodId, session, plannedProd) {
        if (!window.BOS_STAMMDATEN || !window.BOS_STAMMDATEN[prodId]) return null;
        const p = window.BOS_STAMMDATEN[prodId];
        
        const stock = (typeof session.inventory?.[prodId] === 'object') 
                        ? (session.inventory[prodId].stock || 0) 
                        : (session.inventory?.[prodId] || 0);
                        
        const shortage    = session.shortages?.[prodId] || 0;
        const todayIdx    = session.startDayIdx ?? new Date().getDay();
        const targetDay   = session.targetDays?.[prodId] || 1;
        // Bei Fehlmenge: effektiver Bestand ist reduziert
        const effectiveStock = stock - shortage;
        // frosterDone überspringt Schritt 1 NUR wenn kein Mangel herrscht
        const startStep   = (session.frosterDone && shortage === 0) ? 2 : 1;

        let currentRest = effectiveStock;
        let results = [];
        let allMandatoryCovered = true;
        let maxDeficit = 0;

        const getAdjustedNeed = (dIdx) => {
            let bosIdx = (dIdx === 0) ? 6 : dIdx - 1;
            let base = p.needs[bosIdx] || 0;
            const cfg = session.weekConfig?.[dIdx] || { status: 'auf', hamster: 0, grill: false };
            if (cfg.status === 'zu') return 0;
            let adj = base;
            if (cfg.hamster === 1) adj = Math.ceil(adj * 1.5);
            else if (cfg.hamster === 2) adj = Math.ceil(adj * 2);
            if (cfg.grill && p.sun) adj += p.sun;
            return Math.ceil(adj);
        };
        const raw = (targetDay - todayIdx + 7) % 7 || 7;
        const totalStepsNeeded = raw < 3 ? raw + 7 : raw;

        for (let i = 0; i <= totalStepsNeeded; i++) {
            let dIdx = (todayIdx + i) % 7;
            let dailyNeed = getAdjustedNeed(dIdx);
            let prodAmount = plannedProd?.[i] || 0;
            
            let nextDIdx = (todayIdx + i + 1) % 7;
            let nextNeed = getAdjustedNeed(nextDIdx);
            
            let actualConsumption = (i >= startStep) ? dailyNeed : 0;
            
            let stockAfterNeed = currentRest - actualConsumption;
            let stockForTomorrow = stockAfterNeed + prodAmount;
            
            // LOGIK-FIX: Die Warnung für den "Nächsten Morgen" darf nur greifen, 
            // wenn dieser Morgen nicht bereits durch den Froster-Status (startStep) abgedeckt ist.
            let isDayBroken = (stockAfterNeed < 0);
            let isNextMorningInDanger = (i >= (startStep - 1)) && (stockForTomorrow < nextNeed && i < totalStepsNeeded);

            results.push({
                stepIdx: i,
                dayIdx: dIdx,
                dayName: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][dIdx],
                need: dailyNeed,
                actualConsumption: actualConsumption,
                planned: prodAmount,
                stockAfterNeed: stockAfterNeed,
                restAfter: stockForTomorrow,
                isWarning: isDayBroken || isNextMorningInDanger
            });

            // Nur echte Verbrauchslücken zählen als Planfehler
            // Negativer Start durch Fehlmenge (actualConsumption=0) ist kein Fehler
            if (actualConsumption > 0 && stockAfterNeed < 0) {
                allMandatoryCovered = false;
                maxDeficit = Math.min(maxDeficit, stockAfterNeed);
            }
            if (stockForTomorrow < 0 && i > 0) {
                allMandatoryCovered = false;
                maxDeficit = Math.min(maxDeficit, stockForTomorrow);
            }

            currentRest = stockForTomorrow;
        }

        return { productId: prodId, productName: p.name, chain: results, isOk: allMandatoryCovered, maxDeficit: maxDeficit };
    },

    // =========================================================
    // AUTOMATISCHE PRODUKTIONSMENGEN-BERECHNUNG
    // Berechnet für jeden Produktionstag die nötige Menge (Variante 1: sequenziell).
    // Gibt ein Array zurück das direkt als plannedProd genutzt werden kann.
    // =========================================================
    calculateAutoPlanning: function(prodId, session) {
        if (!window.BOS_STAMMDATEN || !window.BOS_STAMMDATEN[prodId]) return [];
        const p = window.BOS_STAMMDATEN[prodId];

        const stock = (typeof session.inventory?.[prodId] === 'object')
                        ? (session.inventory[prodId].stock || 0)
                        : (session.inventory?.[prodId] || 0);

        const shortage    = session.shortages?.[prodId] || 0;
        const todayIdx    = session.startDayIdx ?? new Date().getDay();
        const targetDay   = session.targetDays?.[prodId] || 1;
        const startStep   = (session.frosterDone && shortage === 0) ? 2 : 1;
        const rawSteps    = (targetDay - todayIdx + 7) % 7 || 7;
        const totalSteps  = rawSteps < 3 ? rawSteps + 7 : rawSteps;
        const prodDayIdxs = session.productionDays?.[prodId] || [];
        const STEP = p.step || 6; // Schrittgröße: Standard 6, individuell per stammdaten.js

        // Hilfsfunktion: bereinigter Tagesbedarf (identisch zu calculateChain)
        const effectiveStock = stock - shortage;

        const getAdjustedNeed = (dIdx) => {
            const bosIdx = (dIdx === 0) ? 6 : dIdx - 1;
            const base   = p.needs[bosIdx] || 0;
            const cfg    = session.weekConfig?.[dIdx] || { status: 'auf', hamster: 0, grill: false };
            if (cfg.status === 'zu') return 0;
            let adj = base;
            if (cfg.hamster === 1) adj = Math.ceil(adj * 1.5);
            else if (cfg.hamster === 2) adj = Math.ceil(adj * 2);
            if (cfg.grill && p.sun) adj += p.sun;
            return Math.ceil(adj);
        };

        // Verbrauchsarray aufbauen (actualConsumption je Step)
        let runningStock = effectiveStock;
        const consumptions = [];
        for (let i = 0; i <= totalSteps; i++) {
            const dIdx = (todayIdx + i) % 7;
            consumptions.push(i >= startStep ? getAdjustedNeed(dIdx) : 0);
        }

        // Welche Steps sind Produktionstage?
        // Letzter Step (target) hat kein Input-Feld → nie produzieren
        // Jeder Wochentag darf nur EINMAL als Produktionstag vorkommen (bei >7-Tage-Fenstern)
        const isProdStep = [];
        const seenProdDays = new Set();
        for (let i = 0; i <= totalSteps; i++) {
            const dIdx = (todayIdx + i) % 7;
            const canProd = i < totalSteps && prodDayIdxs.includes(dIdx) && !seenProdDays.has(dIdx);
            if (canProd) seenProdDays.add(dIdx);
            isProdStep.push(canProd);
        }

        // ── Phase 1: Coverage-Fenster und Gewichte je Produktionstag ──────────
        const prodSteps = []; // { stepIdx, coverUntil, nextProdStep, weight }
        for (let i = 0; i <= totalSteps; i++) {
            if (!isProdStep[i]) continue;
            let coverUntil    = totalSteps;
            let nextProdStep  = -1;
            for (let j = i + 1; j <= totalSteps; j++) {
                if (isProdStep[j]) { coverUntil = j - 1; nextProdStep = j; break; }
            }
            // Gewicht = eigener Tagesverbrauch + Folgetage bis zum nächsten Produktionstag
            // + Verbrauch des nächsten Produktionstages selbst (damit dieser morgens nicht leer startet)
            let weight = consumptions[i]; // eigener Tagesverbrauch (Produktion kommt erst nach Verbrauch)
            for (let k = i + 1; k <= coverUntil; k++) weight += consumptions[k];
            if (nextProdStep >= 0) weight += consumptions[nextProdStep]; // nächster Prod-Tag braucht Startbestand
            prodSteps.push({ stepIdx: i, coverUntil, nextProdStep, weight });
        }

        const planned = new Array(totalSteps + 1).fill(0);
        if (prodSteps.length === 0) return planned;

        // ── Phase 2: Gesamtbedarf und proportionale Verteilung ──────────────
        // Keine explizite Reserve: das Aufrunden auf STEP-Stufen liefert den Puffer
        const totalConsumption = consumptions.reduce((a, b) => a + b, 0);
        const totalNeeded      = Math.max(0, totalConsumption - stock);
        const totalWeight      = prodSteps.reduce((a, p) => a + p.weight, 0);

        if (totalNeeded > 0) {
            prodSteps.forEach(ps => {
                // Anteil proportional zum Verbrauch im eigenen Fenster
                const share = totalWeight > 0 ? ps.weight / totalWeight : 1 / prodSteps.length;
                const raw   = totalNeeded * share;
                planned[ps.stepIdx] = Math.ceil(raw / STEP) * STEP;
            });
        }

        // ── Phase 3: Sicherheits-Pass (sequenziell) ─────────────────────────
        // Prüft zwei Fälle:
        // a) Lücke AN einem Produktionstag (Bestand < Verbrauch vor eigener Produktion)
        //    → diesen Step selbst anheben (kann nicht rückwärts)
        // b) Lücke ZWISCHEN Produktionstagen
        //    → letzten Produktionstag anheben
        let currentRest  = effectiveStock;
        let lastProdStep = -1;

        for (let i = 0; i <= totalSteps; i++) {
            const restAfterConsumption = currentRest - consumptions[i];

            if (isProdStep[i]) {
                // Fall a: eigener Tagesverbrauch nicht gedeckt
                if (restAfterConsumption < 0) {
                    if (lastProdStep >= 0) {
                        // Vorheriger Produktionstag gibt die Differenz ab
                        const extra = Math.ceil(-restAfterConsumption / STEP) * STEP;
                        planned[lastProdStep] += extra;
                        currentRest           += extra; // Nachrechnen: vorheriger Tag hat jetzt mehr geliefert
                    } else {
                        // Kein früherer Prod-Tag → dieser Tag muss selbst mehr produzieren
                        const extra = Math.ceil(-restAfterConsumption / STEP) * STEP;
                        planned[i]  += extra;
                    }
                }
                lastProdStep = i;
            }

            currentRest = (currentRest - consumptions[i]) + planned[i];

            // Fall b: Bestand zwischen zwei Produktionstagen negativ
            if (currentRest < 0 && lastProdStep >= 0) {
                const extra = Math.ceil(-currentRest / STEP) * STEP;
                planned[lastProdStep] += extra;
                currentRest           += extra;
            }
        }

        // ── Phase 4: Überhang-Trim ───────────────────────────────────────
        // Wenn der Endbestand am Ziel-Tag mehr als 12 Bleche über dem
        // Ziel-Tages-Verbrauch liegt, kürzen wir den letzten Produktionstag
        // in 12er-Schritten — solange die Versorgung noch gesichert bleibt.
        if (lastProdStep >= 0) {
            const targetConsumption = consumptions[totalSteps]; // Verbrauch am Ziel-Tag
            const maxAcceptable     = targetConsumption + STEP;  // bis zu 1 Schritt Reserve ok

            let finalStock = stock;
            for (let i = 0; i <= totalSteps; i++) {
                finalStock = finalStock - consumptions[i] + planned[i];
            }

            while (finalStock - STEP > maxAcceptable && planned[lastProdStep] >= STEP) {
                planned[lastProdStep] -= STEP;
                finalStock            -= STEP;
            }
        }

        return planned;
    }
};
