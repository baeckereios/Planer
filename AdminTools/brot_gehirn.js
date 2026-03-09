/* =========================================================
   BÄCKEREIOS - BROT RECHEN-GEHIRN (V2 - Automatischer Standard)
   ========================================================= */

window.BOS_BROT_BRAIN = {

    calculate: function(teigId, currentMode, produkteMengen, chargenMenge) {
        const t = window.BOS_BROT_DATEN[teigId];
        if (!t) return { show: false };

        let zielTeigGewicht = 0;
        let gesamtBroteFiktiv = 0;
        let istEimerModus = false;

        // --- SCHRITT 1: BEDARF ERMITTELN ---
        if (currentMode === 'produkte') {
            (t.endprodukte || []).forEach((p, idx) => {
                const menge = produkteMengen[idx] || 0;
                zielTeigGewicht += (menge * p.einwaage);
                gesamtBroteFiktiv += menge;
            });
        } else if (currentMode === 'chargen') {
            istEimerModus = true;
            const chargen = chargenMenge || 0;
            const broteProCharge = t.charge_brote || 21;
            const stdEinwaage = t.endprodukte[0].einwaage || 1000;
            
            gesamtBroteFiktiv = chargen * broteProCharge;
            zielTeigGewicht = gesamtBroteFiktiv * stdEinwaage;
        }

        if (zielTeigGewicht === 0) return { show: false };

        // --- SCHRITT 2: DER MOMENTANE STANDARD (Wetter/Mehlcharge) ---
        let wasserAbzugGramm = 0;
        let hefeAbzugGramm = 0;

        if (t.korrektur_aktiv && t.korrektur_referenz_brote > 0) {
            // Die App rechnet das Verhältnis: "Wie viel produzieren wir jetzt im Vergleich zur Referenz?"
            const verhaeltnis = gesamtBroteFiktiv / t.korrektur_referenz_brote;
            
            // Abzüge proportional anpassen
            wasserAbzugGramm = (t.korrektur_wasser || 0) * 1000 * verhaeltnis;
            hefeAbzugGramm = (t.korrektur_hefe || 0) * verhaeltnis;
        }

        // --- SCHRITT 3: MASSEN-PARADOXON ---
        const kompensationsGewicht = zielTeigGewicht + wasserAbzugGramm;
        const faktor = kompensationsGewicht / t.r100.gesamt;

        // --- SCHRITT 4: REZEPT HOCHRECHNEN ---
        let calcMehl = t.r100.mehl * faktor;
        let calcWasser = (t.r100.wasser * faktor) - wasserAbzugGramm; 
        let calcZutaten = t.r100.zutaten * faktor;
        let calcSauer = t.r100.sauer * faktor;
        
        calcZutaten = Math.max(0, calcZutaten - hefeAbzugGramm);

        // --- SCHRITT 5: BRÜHSTÜCK ---
        let bruehText = "-";
        if (t.r100.brueh > 0) {
            if (istEimerModus) {
                const finalBrueh = (t.r100.brueh / t.r100.gesamt) * zielTeigGewicht;
                bruehText = this.formatGramm(finalBrueh) + ` <br><span style="font-size:0.6rem; color:#94a3b8;">(Ist in deinen ${chargenMenge} Eimern)</span>`;
            } else {
                const schritt = t.charge_brote || 21;
                let gerundeteBrote = Math.round(gesamtBroteFiktiv / schritt) * schritt;
                if (gerundeteBrote === 0 && gesamtBroteFiktiv > 0) gerundeteBrote = schritt; 
                
                const chargen = gerundeteBrote / schritt;
                const bruehProBrot = (t.r100.brueh / t.r100.gesamt) * t.endprodukte[0].einwaage;
                const finalBrueh = gerundeteBrote * bruehProBrot;

                bruehText = this.formatGramm(finalBrueh) + ` <br><span style="font-size:0.6rem; color:#94a3b8;">(${chargen} Eimer richten)</span>`;
            }
        }

        // Info-Text generieren, damit der Kneter weiß, was die App getan hat
        let korrekturInfo = "";
        if (t.korrektur_aktiv && (wasserAbzugGramm > 0 || hefeAbzugGramm > 0)) {
            korrekturInfo = `Automatisch abgezogen: `;
            if (wasserAbzugGramm > 0) korrekturInfo += `${(wasserAbzugGramm/1000).toFixed(2)} L Wasser `;
            if (hefeAbzugGramm > 0) korrekturInfo += ` | ${Math.round(hefeAbzugGramm)} g Hefe/Zutaten`;
        }

        return {
            show: true,
            zielTeigGewicht: zielTeigGewicht,
            gesamtBroteFiktiv: gesamtBroteFiktiv,
            istEimerModus: istEimerModus,
            calcMehl: calcMehl,
            calcWasser: calcWasser,
            calcZutaten: calcZutaten,
            calcSauer: calcSauer,
            bruehText: bruehText,
            korrekturInfo: korrekturInfo
        };
    },

    formatGramm: function(val) {
        if (val >= 1000) return (val / 1000).toFixed(2) + " kg";
        return Math.round(val) + " g";
    }
};
