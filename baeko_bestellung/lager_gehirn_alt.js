// baeko_bestellung/lager_gehirn.js
window.BOS_LAGER_BRAIN = {
    
    // 1. INVENTUR-LOGIK: Berechnet die Bestellmenge
    calculate: function(id, counted, delivery, isHoliday) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        const target = isHoliday ? (p.soll_ft || p.soll) : p.soll;
        const current = parseFloat(counted || 0) + parseFloat(delivery || 0);
        let orderAmount = 0;
        
        if (p.threshold !== undefined) {
            orderAmount = (current < p.threshold) ? (target - current) : 0;
        } else {
            orderAmount = Math.max(0, target - current);
        }
        return { id, name: p.name, unit: p.unit, current, target, order: orderAmount };
    },

    // 2. KREUZ-RECHNUNG: Für HasenBerger & KornKnacker
    convertCross: function(id, value, source) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        if (source === 'alt') {
            return (value * p.val_alt) / p.val_blech;
        } else {
            const f = p.factor || 1;
            return (value * p.val_blech / p.val_alt) * f;
        }
    },

    // 3. STANDARD-UMRECHNUNG: Bleche -> Kartons (Croissants etc.)
    convertStandard: function(id, bleche) {
        const p = window.BOS_BAEKO_CONFIG.products[id];
        if (!p.stueck_pro_blech || !p.stueck_pro_karton) return 0;
        return (bleche * p.stueck_pro_blech) / p.stueck_pro_karton;
    },

    // 4. WHATSAPP-EXPORT: Erzeugt die Nachricht inkl. verstecktem Snapshot
    generateWhatsAppText: function(results, snapshot) {
        let t = "Hallo, hier ist die aktuelle BÄKO-Bestellung:\n\n";
        results.forEach(r => { 
            if(r.order > 0) t += `* ${r.name}: ${r.current} ${r.unit} im Bestand. Bitte *${r.order} ${r.unit}* nachbestellen (Soll: ${r.target}).\n\n`; 
        });
        
        t += "Vielen Dank!\n";
        
        // Hängt den Snapshot an - jetzt garantiert GANZ AM ENDE
        if (snapshot) {
            t += "\n--- DATEN FÜR DAS SYSTEM (EINFACH MITKOPIEREN) ---\nBOS-SNAP:" + JSON.stringify(snapshot);
        }
        
        return encodeURIComponent(t);
    }
};
