// baeko_bestellung/lager_gehirn.js
window.BOS_LAGER_BRAIN = {
    
    // 1. INVENTUR-LOGIK: Berechnet die Bestellmenge
    calculate: function(id, counted, delivery, isHoliday) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        const target = isHoliday ? (p.soll_ft || p.soll) : p.soll;
        const current = parseFloat(counted || 0) + parseFloat(delivery || 0);
        let orderAmount = 0;
        
        if (p.threshold !== undefined) {
            // Spezial-Logik für Schwellenwert (z.B. Frikadellen)
            orderAmount = (current < p.threshold) ? (target - current) : 0;
        } else {
            // Standard-Logik: Loch im Regal füllen
            orderAmount = Math.max(0, target - current);
        }
        return { id, name: p.name, unit: p.unit, current, target, order: orderAmount };
    },

    // 2. KREUZ-RECHNUNG: Für HasenBerger & KornKnacker
    // Formel KornKnacker: Pressen = (Bleche * 25 / 30) * 1.06
    convertCross: function(id, value, source) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        if (source === 'alt') {
            // Presse -> Blech: (Pressen * Stück pro Presse) / Stück pro Blech
            return (value * p.val_alt) / p.val_blech;
        } else {
            // Blech -> Presse: (Bleche * Stück pro Blech / Stück pro Presse) * Schlüsselzahl
            const f = p.factor || 1;
            return (value * p.val_blech / p.val_alt) * f;
        }
    },

    // 3. STANDARD-UMRECHNUNG: Bleche -> Kartons (Croissants etc.)
    // Formel: Kartons = (Bleche * Stk_Blech) / Stk_Karton
    convertStandard: function(id, bleche) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        if (!p.stueck_pro_blech || !p.stueck_pro_karton) return 0;
        return (bleche * p.stueck_pro_blech) / p.stueck_pro_karton;
    },

    // 4. WHATSAPP-EXPORT: Erzeugt die Nachricht für den Chef
    generateWhatsAppText: function(results) {
        let t = "Hallo, hier ist die aktuelle BÄKO-Bestellung:\n\n";
        results.forEach(r => { 
            if(r.order > 0) t += `* ${r.name}: ${r.current} ${r.unit} im Bestand. Bitte *${r.order} ${r.unit}* nachbestellen (Soll: ${r.target}).\n\n`; 
        });
        return encodeURIComponent(t + "Vielen Dank!");
    }
};
