/**
 * export.js - Zentrale Export-Funktionen für Backstuben OS
 * Einheitliche Druck- und Sharing-Logik für alle Module
 */

const BOSExport = {
    // =========================================================
    // KONFIGURATION
    // =========================================================
    
    config: {
        // WhatsApp-Formatierung
        whatsappMaxLength: 4000,  // WhatsApp hat Grenzen
        truncateNames: true,      // Lange Namen kürzen?
        maxNameLength: 12,        // "Schokobrötchen" → "Schokobrötch"
        
        // Druck-Formatierung
        defaultPaperWidth: 'A4',  // 'A4' | '80mm' | '58mm'
        thermalFontSize: '9pt',
        
        // Icons & Styling
        icons: {
            product: '🍞',
            critical: '🚩',
            ok: '✅',
            froster: '❄️',
            production: '📦'
        }
    },

    // =========================================================
    // HILFSFUNKTIONEN (intern)
    // =========================================================

    /**
     * Name für WhatsApp optimieren (kürzen wenn nötig)
     */
    _shortenName: function(fullName) {
        if (!this.config.truncateNames) return fullName;
        if (fullName.length <= this.config.maxNameLength) return fullName;
        
        // Klammer-Inhalt bevorzugen: "Baguette (rote Diele)" → "rote Diele"
        if (fullName.includes('(')) {
            const match = fullName.match(/\(([^)]+)\)/);
            if (match && match[1].length <= this.config.maxNameLength) {
                return match[1];
            }
        }
        
        // Sonst einfach abschneiden
        return fullName.substring(0, this.config.maxNameLength) + '…';
    },

    /**
     * Zeitstempel formatieren
     */
    _formatTimestamp: function(ts) {
        if (!ts || ts === 0) return 'unbekannt';
        const d = new Date(ts);
        const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        return `${days[d.getDay()]}, ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
    },

    /**
     * Produktdaten normalisieren (verschiedene Quellen)
     */
    _normalizeProducts: function(products, masterData) {
        const normalized = [];
        
        for (let key in products) {
            const p = products[key];
            const master = masterData && masterData[key];
            
            normalized.push({
                key: key,
                name: master ? master.name : (p.name || key),
                stock: parseInt(p.stock) || 0,
                demand: p.demand || 0,
                missing: p.missing || 0,
                timestamp: p.ts || p.timestamp || 0,
                unit: master ? (master.unit || 0) : 0
            });
        }
        
        return normalized.sort((a,b) => a.name.localeCompare(b.name));
    },

    /**
     * Gruppiert Produkte nach Status (kritisch/ok)
     */
    _groupByStatus: function(products, threshold = 0) {
        const critical = [];
        const ok = [];
        
        products.forEach(p => {
            if (p.missing > 0 || (p.demand > 0 && p.stock < p.demand)) {
                critical.push(p);
            } else {
                ok.push(p);
            }
        });
        
        return { critical, ok };
    },

    // =========================================================
    // DRUCK-FUNKTIONEN
    // =========================================================

    /**
     * Generiert Druck-HTML für Produktionsplan
     */
    printProductionPlan: function(data) {
        const {
            title = 'Produktionsplan',
            subtitle = '',
            days = [],           // [{name: 'Montag', products: [{name, amount, special}]}]
            products = [],       // Alternative: flache Produktliste
            theme = 'standard'   // 'standard' | 'thermal'
        } = data;

        // Theme-spezifisches CSS
        const isThermal = theme === 'thermal' || theme === '80mm' || theme === '58mm';
        const paperWidth = isThermal ? '80mm' : '210mm';
        const fontSize = isThermal ? '9pt' : '11pt';

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page { margin: ${isThermal ? '3mm' : '10mm'}; size: ${paperWidth} auto; }
        body { 
            font-family: ${isThermal ? 'Arial, sans-serif' : 'Georgia, serif'}; 
            font-size: ${fontSize}; 
            line-height: 1.3;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        .header { 
            text-align: center; 
            border-bottom: ${isThermal ? '1px solid #000' : '2px solid #000'};
            padding-bottom: ${isThermal ? '2mm' : '5mm'};
            margin-bottom: ${isThermal ? '3mm' : '5mm'};
        }
        h1 { font-size: ${isThermal ? '12pt' : '18pt'}; margin: 0 0 2mm 0; }
        .subtitle { font-size: ${isThermal ? '8pt' : '10pt'}; color: #333; }
        
        .day-section { 
            margin-bottom: ${isThermal ? '4mm' : '8mm'};
            page-break-inside: avoid;
        }
        .day-title { 
            font-weight: bold; 
            font-size: ${isThermal ? '10pt' : '12pt'};
            background: ${isThermal ? 'none' : '#f0f0f0'};
            padding: ${isThermal ? '1mm 0' : '2mm 4mm'};
            margin-bottom: 2mm;
            border-bottom: 1px solid #ccc;
        }
        
        table { width: 100%; border-collapse: collapse; }
        td { 
            padding: ${isThermal ? '1mm 2mm' : '2mm 4mm'};
            border-bottom: ${isThermal ? '0.5px dotted #999' : '1px solid #ddd'};
            vertical-align: top;
        }
        .product-name { font-weight: ${isThermal ? 'normal' : '600'}; }
        .amount { 
            text-align: right; 
            font-weight: bold;
            white-space: nowrap;
        }
        .special { 
            font-size: ${isThermal ? '7pt' : '8pt'}; 
            color: #666;
            font-style: italic;
        }
        
        .footer { 
            margin-top: ${isThermal ? '4mm' : '10mm'};
            font-size: ${isThermal ? '7pt' : '8pt'};
            color: #666;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 2mm;
        }
        
        ${isThermal ? `
        /* Thermodrucker-Optimierungen */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        tr { page-break-inside: avoid; }
        ` : ''}
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.config.icons.production} ${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    </div>
`;

        // Tagesbasierte Ausgabe
        if (days && days.length > 0) {
            days.forEach(day => {
                if (!day.products || day.products.length === 0) return;
                
                html += `
    <div class="day-section">
        <div class="day-title">${day.name}</div>
        <table>
`;
                day.products.forEach(p => {
                    const specialText = p.special > 0 ? `<span class="special">(+${p.special} Kd.)</span>` : '';
                    html += `
            <tr>
                <td class="product-name">${this._shortenName(p.name)}</td>
                <td class="amount">${p.amount + (p.special || 0)} Bleche ${specialText}</td>
            </tr>
`;
                });
                
                html += `
        </table>
    </div>
`;
            });
        }
        
        // Alternative: Flache Produktliste
        else if (products && products.length > 0) {
            html += `
    <table>
`;
            products.forEach(p => {
                html += `
        <tr>
            <td class="product-name">${this._shortenName(p.name)}</td>
            <td class="amount">${p.stock} ${p.unit || 'Bleche'}</td>
        </tr>
`;
            });
            html += `
    </table>
`;
        }
        
        else {
            html += `
    <p style="text-align:center; padding: 20px;">Keine Daten vorhanden.</p>
`;
        }

        html += `
    <div class="footer">
        Gedruckt: ${new Date().toLocaleString('de-DE')}
    </div>
</body>
</html>
`;

        // Ausführung
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Warten auf Laden, dann Drucken
        setTimeout(() => {
            printWindow.print();
            // Automatisch schließen nach Druck (optional)
            // printWindow.close();
        }, 250);
        
        return true;
    },

    /**
     * Froster-Bestand drucken
     */
    printFrosterReport: function(data) {
        const {
            products = [],
            masterData = {},
            timestamp = Date.now(),
            criticalOnly = false
        } = data;

        const normalized = this._normalizeProducts(products, masterData);
        const { critical, ok } = this._groupByStatus(normalized);
        
        const displayProducts = criticalOnly ? critical : [...critical, ...ok];

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Froster-Bestand</title>
    <style>
        @page { margin: 10mm; }
        body { font-family: Georgia, serif; font-size: 11pt; color: #000; }
        h1 { font-size: 18pt; text-align: center; border-bottom: 2px solid #000; padding-bottom: 5mm; }
        
        .status-header { 
            margin: 5mm 0 3mm 0; 
            padding: 2mm 4mm;
            font-weight: bold;
            font-size: 12pt;
        }
        .status-critical { background: #ffebee; color: #c62828; border-left: 3px solid #c62828; }
        .status-ok { background: #e8f5e9; color: #2e7d32; border-left: 3px solid #2e7d32; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        th { text-align: left; border-bottom: 2px solid #000; padding: 2mm; font-size: 10pt; }
        td { padding: 2mm; border-bottom: 1px solid #ddd; }
        .right { text-align: right; }
        .missing { color: #c62828; font-weight: bold; }
        
        .footer { margin-top: 10mm; font-size: 9pt; color: #666; text-align: center; }
    </style>
</head>
<body>
    <h1>${this.config.icons.froster} Froster-Bestand</h1>
    <p style="text-align:center; color:#666;">Stand: ${new Date(timestamp).toLocaleString('de-DE')}</p>
`;

        if (critical.length > 0) {
            html += `
    <div class="status-header status-critical">⚠️ Kritisch (${critical.length} Produkte)</div>
    <table>
        <tr><th>Produkt</th><th class="right">Bestand</th><th class="right">Fehlt</th></tr>
`;
            critical.forEach(p => {
                html += `
        <tr>
            <td>${p.name}</td>
            <td class="right">${p.stock}</td>
            <td class="right missing">${p.missing > 0 ? '-' + p.missing : '✓'}</td>
        </tr>
`;
            });
            html += `    </table>`;
        }

        if (!criticalOnly && ok.length > 0) {
            html += `
    <div class="status-header status-ok">✅ Ausreichend (${ok.length} Produkte)</div>
    <table>
        <tr><th>Produkt</th><th class="right">Bestand</th><th class="right">Reicht bis</th></tr>
`;
            ok.forEach(p => {
                html += `
        <tr>
            <td>${p.name}</td>
            <td class="right">${p.stock}</td>
            <td class="right">${p.daysOk || '?'} Tage</td>
        </tr>
`;
            });
            html += `    </table>`;
        }

        html += `
    <div class="footer">
        Backstuben OS • Froster-Report
    </div>
</body>
</html>
`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
        
        return true;
    },

    // =========================================================
    // WHATSAPP-FUNKTIONEN
    // =========================================================

    /**
     * Generiert WhatsApp-Text für Produktionsplan
     */
    shareProductionPlan: function(data) {
        const {
            title = 'Produktionsplan',
            days = [],
            products = [],
            includeSpecial = true
        } = data;

        let text = `${this.config.icons.production} *${title.toUpperCase()}*\n\n`;
        let hasData = false;

        // Tagesbasiert
        if (days && days.length > 0) {
            days.forEach(day => {
                if (!day.products || day.products.length === 0) return;
                
                text += `*${day.name}*\n`;
                day.products.forEach(p => {
                    const total = p.amount + (p.special || 0);
                    const specialInfo = (includeSpecial && p.special > 0) ? ` (+${p.special} Kd.)` : '';
                    const shortName = this._shortenName(p.name);
                    
                    text += `• ${shortName}: *${total}*${specialInfo}\n`;
                });
                text += '\n';
                hasData = true;
            });
        }
        
        // Flache Liste
        else if (products && products.length > 0) {
            products.forEach(p => {
                text += `• ${this._shortenName(p.name)}: *${p.stock}* ${p.unit || 'Bleche'}\n`;
            });
            hasData = true;
        }

        if (!hasData) {
            text += '_Keine geplante Produktion._\n';
        }

        // Länge prüfen
        if (text.length > this.config.whatsappMaxLength) {
            text = text.substring(0, this.config.whatsappMaxLength - 50) + 
                   '\n\n_[... Liste wurde gekürzt]_';
        }

        this._openWhatsApp(text);
        return text;
    },

    /**
     * Froster-Status via WhatsApp teilen
     */
    shareFrosterStatus: function(data) {
        const {
            products = [],
            masterData = {},
            includeOk = false
        } = data;

        const normalized = this._normalizeProducts(products, masterData);
        const { critical, ok } = this._groupByStatus(normalized);

        let text = `${this.config.icons.froster} *FROSTER-STATUS*\n\n`;
        let hasCritical = false;

        if (critical.length > 0) {
            text += `*KRITISCH (FEHLT):*\n`;
            critical.forEach(p => {
                text += `• ${p.name}: ${p.stock} Bl. (es fehlen ${p.missing})\n`;
            });
            hasCritical = true;
        }

        if (includeOk && ok.length > 0) {
            text += `\n*AUSREICHEND:*\n`;
            ok.slice(0, 5).forEach(p => {  // Max 5, sonst zu lang
                text += `• ${p.name}: ${p.stock} Bl. ✓\n`;
            });
            if (ok.length > 5) {
                text += `• _... und ${ok.length - 5} weitere_\n`;
            }
        }

        if (!hasCritical && !includeOk) {
            text += `_Alles ausreichend eingedeckt! ${this.config.icons.ok}_\n`;
        }

        this._openWhatsApp(text);
        return text;
    },

    /**
     * Intern: WhatsApp öffnen
     */
    _openWhatsApp: function(text) {
        const encoded = encodeURIComponent(text);
        const url = `https://wa.me/?text=${encoded}`;
        
        // Mobile vs Desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && navigator.share) {
            // Native Share API auf Mobile
            navigator.share({
                title: 'Backstuben OS',
                text: text
            }).catch(() => {
                window.open(url, '_blank');  // Fallback
            });
        } else {
            window.open(url, '_blank');
        }
    },

    // =========================================================
    // LEGACY: RÜCKWÄRTSCOMPATIBILITÄT
    // =========================================================

    /**
     * Alte Funktionsaufrufe abfangen
     */
    printPlan: function(data) {
        console.warn('printPlan() ist veraltet. Nutze printProductionPlan() oder printFrosterReport()');
        return this.printProductionPlan(data);
    },
    
    sharePlanWhatsApp: function(data) {
        console.warn('sharePlanWhatsApp() ist veraltet. Nutze shareProductionPlan()');
        return this.shareProductionPlan(data);
    },
    
    shareFrosterWhatsApp: function(data) {
        console.warn('shareFrosterWhatsApp() ist veraltet. Nutze shareFrosterStatus()');
        return this.shareFrosterStatus(data);
    }
};

// Global verfügbar machen
window.BOSExport = BOSExport;
