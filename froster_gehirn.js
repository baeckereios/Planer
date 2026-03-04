/**
 * BÄCKEREIOS - ZENTRALES FROSTER-GEHIRN V120
 * Revision: Container-Logik (Batch Size), Glättung und Frische-Wächter.
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
        
        // Effektiver Startbestand
        const effectiveStock = stock - shortage;
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
            
            // Verbrauch erst ab startStep relevant (wenn Frosterstatus=fertig, ist heute schon safe)
            let actualConsumption = (i >= startStep) ? dailyNeed : 0;
            
            let stockAfterNeed = currentRest - actualConsumption;
            let stockForTomorrow = stockAfterNeed + prodAmount;
            
            let isDayBroken = (stockAfterNeed < 0);
            // Warnung für nächsten Morgen: Nur wenn Bestand für morgen < Bedarf morgen
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
    // AUTOMATISCHE PRODUKTIONSMENGEN-BERECHNUNG V2 (Container-Logik)
    // 1. Berechnet Gesamtbedarf.
    // 2. Teilt durch Gebindegröße (batchSize).
    // 3. Verteilt Ladungen gleichmäßig.
    // 4. Prüft auf Frische-Lücken und schiebt Ladungen bei Bedarf nach vorne.
    // =========================================================
    calculateAutoPlanning: function(prodId, session) {
        if (!window.BOS_STAMMDATEN || !window.BOS_STAMMDATEN[prodId]) return [];
        const p = window.BOS_STAMMDATEN[prodId];
        
        // --- 1. SETUP & DATEN ---
        const stock = (typeof session.inventory?.[prodId] === 'object')
                        ? (session.inventory[prodId].stock || 0)
                        : (session.inventory?.[prodId] || 0);
        const shortage  = session.shortages?.[prodId] || 0;
        const todayIdx  = session.startDayIdx ?? new Date().getDay();
        const targetDay = session.targetDays?.[prodId] || 1;
        
        // Gebindegröße aus Stammdaten (Fallback auf 1)
        const BATCH = p.batchSize || 1; 

        const startStep  = (session.frosterDone && shortage === 0) ? 2 : 1;
        const rawSteps   = (targetDay - todayIdx + 7) % 7 || 7;
        const totalSteps = rawSteps < 3 ? rawSteps + 7 : rawSteps;
        const prodDayIdxs = session.productionDays?.[prodId] || [];

        // Hilfsfunktion Bedarf
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

        // --- 2. GESAMTBEDARF ERMITTELN ---
        // Wir simulieren den Verbrauch über die gesamte Zeitachse
        let totalConsumption = 0;
        const consumptions = [];
        for (let i = 0; i <= totalSteps; i++) {
            const dIdx = (todayIdx + i) % 7;
            const cons = (i >= startStep) ? getAdjustedNeed(dIdx) : 0;
            consumptions.push(cons);
            totalConsumption += cons;
        }

        const effectiveStock = stock - shortage;
        const totalNeeded = Math.max(0, totalConsumption - effectiveStock);
        
        // Ergebnis-Array initialisieren
        const planned = new Array(totalSteps + 1).fill(0);

        // Welche Steps sind Produktionstage?
        // (Wichtig: map speichert Step-Index für schnellen Zugriff)
        const prodSteps = []; 
        const seenDays = new Set();
        for (let i = 0; i <= totalSteps; i++) { // Letzter Step (Target) ist nie Produktionstag
             const dIdx = (todayIdx + i) % 7;
             // Production möglich, wenn Tag gewählt UND (nicht Target-Tag ODER wir erlauben Prod am Target nicht)
             // In der UI ist Target meist Abholtag. Wir produzieren bis i < totalSteps
             if (i < totalSteps && prodDayIdxs.includes(dIdx) && !seenDays.has(dIdx)) {
                 prodSteps.push(i);
                 seenDays.add(dIdx);
             }
        }

        if (totalNeeded === 0 || prodSteps.length === 0) return planned;

        // --- 3. IN LADUNGEN (BATCHES) UMRECHNEN ---
        const totalBatches = Math.ceil(totalNeeded / BATCH);
        const numProdDays  = prodSteps.length;

        // --- 4. VERTEILUNG (GLÄTTUNG) ---
        // Basis-Ladungen pro Tag
        const baseBatchesPerDay = Math.floor(totalBatches / numProdDays);
        let remainder = totalBatches % numProdDays;

        // Verteilung auf die Tage (Array speichert Anzahl Ladungen pro Prod-Tag)
        const batchesDistrib = new Array(numProdDays).fill(baseBatchesPerDay);
        
        // Rest verteilen: Wir geben den Rest den SPÄTEREN Tagen (fürs Glätten besser)
        // Beispiel: 13 Ladungen, 3 Tage -> 4, 4, 5
        for (let i = numProdDays - 1; i >= numProdDays - remainder; i--) {
            batchesDistrib[i]++;
        }

        // Mapping: StepIndex -> Anzahl Ladungen
        const stepBatches = {};
        prodSteps.forEach((stepIdx, i) => {
            stepBatches[stepIdx] = batchesDistrib[i];
        });

        // --- 5. DER FRISCHE-WÄCHTER (SIMULATION & KORREKTUR) ---
        // Wir simulieren den Verlauf. Wenn wir ins Minus laufen, müssen wir
        // eine Ladung von einem SPÄTEREN Tag nach VORNE holen.
        
        let valid = false;
        let sanityCounter = 0;

        while (!valid && sanityCounter < 20) {
            valid = true;
            let currentRunStock = effectiveStock;
            
            for (let i = 0; i <= totalSteps; i++) {
                // Verbrauch abziehen
                currentRunStock -= consumptions[i];
                
                // Produktion draufrechnen (falls Produktionstag)
                if (stepBatches[i]) {
                    // Produktion wirkt für den Bestand NACH dem Verbrauch?
                    // Im Planner gilt: stockAfterNeed = Start - Cons.
                    // stockForTomorrow = stockAfterNeed + Planned.
                    // Das heißt, Produktion füllt das Lager für MORGEN auf.
                    // Wenn stockAfterNeed < 0 ist, ist es zu spät für heute.
                    // Wir müssen also sicherstellen, dass wir VORHER schon genug hatten.
                    
                    // Wir addieren Produktion zum laufenden Bestand für den nächsten Step
                    currentRunStock += (stepBatches[i] * BATCH);
                }

                // CHECK: Sind wir im Minus?
                if (currentRunStock < 0) {
                    // PROBLEM! Wir haben eine Lücke.
                    // Strategie: Hole eine Ladung vom LETZTEN Produktionstag, der noch Ladungen hat,
                    // und schiebe sie auf den SPÄTESTEN Produktionstag VOR der Lücke.
                    
                    // 1. Spender finden (von hinten suchen)
                    let donorIdx = -1;
                    for (let d = numProdDays - 1; d >= 0; d--) {
                        if (batchesDistrib[d] > 0) {
                            donorIdx = d;
                            break;
                        }
                    }

                    // 2. Empfänger finden (Produktionstag <= aktueller Step i)
                    // Da Produktion erst für morgen wirkt, muss ProdTag < i sein, um Lücke bei i zu decken?
                    // Wenn shortage bei Step i (stockAfterNeed < 0), brauchen wir mehr Startbestand bei i.
                    // Das kommt aus Prod bei i-1.
                    // Also suchen wir ProdTag < i.
                    let receiverIdx = -1;
                    for (let r = 0; r < numProdDays; r++) {
                        if (prodSteps[r] <= i) { // Wir probieren es <= i, da Setup meist "Nachtschicht" impliziert
                             receiverIdx = r;
                        } else {
                            break;
                        }
                    }

                    // Kann man verschieben?
                    if (donorIdx > -1 && receiverIdx > -1 && donorIdx > receiverIdx) {
                        batchesDistrib[donorIdx]--;
                        batchesDistrib[receiverIdx]++;
                        
                        // Map updaten
                        prodSteps.forEach((stepIdx, idx) => {
                            stepBatches[stepIdx] = batchesDistrib[idx];
                        });
                        
                        valid = false; // Simulation neu starten
                        break; // Break for-loop, restart while
                    } else {
                        // Keine Verschiebung möglich (Lücke ganz am Anfang oder alles schon vorne).
                        // Dann müssen wir es akzeptieren (oder Gesamtmenge erhöhen, aber das ist hier nicht gewünscht).
                    }
                }
            }
            sanityCounter++;
        }

        // --- 6. OUTPUT GENERIEREN ---
        prodSteps.forEach((stepIdx, i) => {
            planned[stepIdx] = batchesDistrib[i] * BATCH;
        });

        return planned;
    }
};
