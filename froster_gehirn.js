/**
 * BÄCKEREIOS - ZENTRALES FROSTER-GEHIRN V122
 * Revision: Container-Logik (Batch Size), Glättung, Frische-Wächter 
 * NEU: Bugfix in Slider-Logik (Crash-Test erst NACH der Umverteilung).
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

    calculateAutoPlanning: function(prodId, session) {
        if (!window.BOS_STAMMDATEN || !window.BOS_STAMMDATEN[prodId]) return [];
        const p = window.BOS_STAMMDATEN[prodId];
        
        const stock = (typeof session.inventory?.[prodId] === 'object')
                        ? (session.inventory[prodId].stock || 0)
                        : (session.inventory?.[prodId] || 0);
        const shortage  = session.shortages?.[prodId] || 0;
        const todayIdx  = session.startDayIdx ?? new Date().getDay();
        const targetDay = session.targetDays?.[prodId] || 1;
        
        const BATCH = p.batchSize || 1; 

        const startStep  = (session.frosterDone && shortage === 0) ? 2 : 1;
        const rawSteps   = (targetDay - todayIdx + 7) % 7 || 7;
        const totalSteps = rawSteps < 3 ? rawSteps + 7 : rawSteps;
        const prodDayIdxs = session.productionDays?.[prodId] || [];

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
        
        const planned = new Array(totalSteps + 1).fill(0);

        const prodSteps = []; 
        const seenDays = new Set();
        for (let i = 0; i <= totalSteps; i++) { 
             const dIdx = (todayIdx + i) % 7;
             if (i < totalSteps && prodDayIdxs.includes(dIdx) && !seenDays.has(dIdx)) {
                 prodSteps.push(i);
                 seenDays.add(dIdx);
             }
        }

        if (totalNeeded === 0 || prodSteps.length === 0) return planned;

        const totalBatches = Math.ceil(totalNeeded / BATCH);
        const numProdDays  = prodSteps.length;

        const baseBatchesPerDay = Math.floor(totalBatches / numProdDays);
        let remainder = totalBatches % numProdDays;

        const batchesDistrib = new Array(numProdDays).fill(baseBatchesPerDay);
        
        for (let i = numProdDays - 1; i >= numProdDays - remainder; i--) {
            batchesDistrib[i]++;
        }

        const stepBatches = {};
        prodSteps.forEach((stepIdx, i) => {
            stepBatches[stepIdx] = batchesDistrib[i];
        });

        let valid = false;
        let sanityCounter = 0;

        while (!valid && sanityCounter < 50) { 
            valid = true;
            let currentRunStock = effectiveStock;
            
            for (let i = 0; i <= totalSteps; i++) {
                let stockAfterNeed = currentRunStock - consumptions[i];

                if (stockAfterNeed < 0) {
                    let donorIdx = -1;
                    for (let d = numProdDays - 1; d >= 0; d--) {
                        if (batchesDistrib[d] > 0) {
                            donorIdx = d;
                            break;
                        }
                    }

                    let receiverIdx = -1;
                    for (let r = 0; r < numProdDays; r++) {
                        if (prodSteps[r] < i) { 
                             receiverIdx = r;
                        } else {
                            break;
                        }
                    }

                    if (donorIdx > -1 && receiverIdx > -1 && donorIdx > receiverIdx) {
                        batchesDistrib[donorIdx]--;
                        batchesDistrib[receiverIdx]++;
                        
                        prodSteps.forEach((stepIdx, idx) => {
                            stepBatches[stepIdx] = batchesDistrib[idx];
                        });
                        
                        valid = false; 
                        break; 
                    }
                }
                currentRunStock = stockAfterNeed + (stepBatches[i] ? stepBatches[i] * BATCH : 0);
            }
            sanityCounter++;
        }

        prodSteps.forEach((stepIdx, i) => {
            planned[stepIdx] = batchesDistrib[i] * BATCH;
        });

        return planned;
    },

    recalculateShift: function(prodId, session, currentPlan, changedStepIdx, newAmount) {
        const p = window.BOS_STAMMDATEN[prodId];
        if (!p) return null;

        const BATCH = p.batchSize || 1;
        
        // Sicherstellen, dass der neue Wert ein Vielfaches der Batch-Size ist
        let safeNewAmount = Math.max(0, Math.ceil(newAmount / BATCH) * BATCH);
        
        const oldAmount = currentPlan[changedStepIdx];
        const delta = oldAmount - safeNewAmount; 

        if (delta === 0) return currentPlan; 

        // 1. Plan-Kopie erstellen (OHNE voreiligen Crash-Test!)
        let testPlan = [...currentPlan];
        testPlan[changedStepIdx] = safeNewAmount;
        
        // 2. Empfänger / Spender für die Differenz finden
        let futureProdSteps = [];
        const prodDayIdxs = session.productionDays?.[prodId] || [];
        const todayIdx = session.startDayIdx ?? new Date().getDay();
        
        for (let i = changedStepIdx + 1; i < currentPlan.length; i++) {
            let dIdx = (todayIdx + i) % 7;
            if (prodDayIdxs.includes(dIdx) && i < currentPlan.length - 1) { 
                futureProdSteps.push(i);
            }
        }

        // Wenn wir reduzieren wollen (delta > 0), aber keine Folgetage mehr existieren -> Geht nicht!
        if (delta > 0 && futureProdSteps.length === 0) {
            return null;
        }

        // 3. Verteilung der Ladungen (Batches)
        let batchesToDistribute = delta / BATCH;
        
        let sanity = 0;
        while (batchesToDistribute !== 0 && sanity < 1000) {
            let changedInLoop = false;
            
            for (let i = 0; i < futureProdSteps.length; i++) {
                let step = futureProdSteps[i];
                
                if (batchesToDistribute > 0) {
                    // Vorne abgezogen, hinten drauflegen
                    testPlan[step] += BATCH;
                    batchesToDistribute--;
                    changedInLoop = true;
                } else if (batchesToDistribute < 0) {
                    // Vorne erhöht, hinten abziehen (aber nicht unter Null!)
                    if (testPlan[step] >= BATCH) {
                        testPlan[step] -= BATCH;
                        batchesToDistribute++;
                        changedInLoop = true;
                    }
                }
                
                if (batchesToDistribute === 0) break;
            }
            
            // Wenn wir nichts mehr umverteilen konnten (z.B. alle Folgetage auf 0), brechen wir ab.
            // Die "Überproduktion" bleibt dann einfach am aktuellen Tag stehen.
            if (!changedInLoop) break; 
            
            sanity++;
        }

        // 4. JETZT ERST DER CRASH-TEST! 
        // Hat unsere Reduzierung + Verteilung irgendwo eine Lücke gerissen?
        let finalCheck = this.calculateChain(prodId, session, testPlan);
        if (!finalCheck.isOk) {
            return null; // Das Minimum wurde wirklich unterschritten.
        }

        return testPlan;
    }
};
