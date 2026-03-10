/**
 * AUTOGENERIERTES DURCHSCHNITTSVERBRAUCH GEHIRN
 * Generiert am: 10.3.2026, 09:48:59
 */

const erlaubteProdukte = ["baguettestange_teig_stueck","dinkel_gerster_750g_stueck","eiszapfen_stueck","findling_500g_stueck","gersterbrot_1250g_stueck","hasenberger_stueck","hasenpfoetchen_stueck","kaesebroetchen_stueck","korbgerster_1250g_stueck","kornknacker_stueck","laugenstangen_stueck","plunderstreifen_stueck","puddingbrezel_stueck","rosinen_batzen_stueck","rosinen_hedwig_stueck","schoko_batzen_stueck","stangen_gesamt_stueck","streuselkuchen_stueck","zwiebelstange_stueck","zwiebelstange_teig_stueck"];
const produktEinstellungen = {
    "eiszapfen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 10
    },
    "hasenberger_stueck": {
        "einheit": "blech",
        "stueckProBlech": 20
    },
    "hasenpfoetchen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 20
    },
    "kornknacker_stueck": {
        "einheit": "blech",
        "stueckProBlech": 25
    },
    "laugenstangen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 18
    },
    "plunderstreifen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 16
    },
    "puddingbrezel_stueck": {
        "einheit": "blech",
        "stueckProBlech": 16
    },
    "rosinen_batzen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 12
    },
    "rosinen_hedwig_stueck": {
        "einheit": "blech",
        "stueckProBlech": 20
    },
    "schoko_batzen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 12
    },
    "stangen_gesamt_stueck": {
        "einheit": "blech",
        "stueckProBlech": 6
    },
    "streuselkuchen_stueck": {
        "einheit": "blech",
        "stueckProBlech": 6
    },
    "zwiebelstange_stueck": {
        "einheit": "blech",
        "stueckProBlech": 6
    },
    "zwiebelstange_teig_stueck": {
        "einheit": "blech",
        "stueckProBlech": 3
    }
};
const produktKategorien = {
    "baguettestange_teig_stueck": "Brot",
    "dinkel_gerster_750g_stueck": "Brot",
    "eiszapfen_stueck": "Konditorei",
    "findling_500g_stueck": "Brot",
    "gersterbrot_1250g_stueck": "Brot",
    "hasenberger_stueck": "Brötchen",
    "hasenpfoetchen_stueck": "süßes Kleingebäck",
    "kaesebroetchen_stueck": "Brötchen",
    "korbgerster_1250g_stueck": "Brot",
    "kornknacker_stueck": "Brötchen",
    "laugenstangen_stueck": "Brötchen",
    "plunderstreifen_stueck": "Konditorei",
    "puddingbrezel_stueck": "Konditorei",
    "rosinen_batzen_stueck": "süßes Kleingebäck",
    "rosinen_hedwig_stueck": "süßes Kleingebäck",
    "schoko_batzen_stueck": "süßes Kleingebäck",
    "stangen_gesamt_stueck": "Brot",
    "streuselkuchen_stueck": "Blechkuchen",
    "zwiebelstange_stueck": "Brot",
    "zwiebelstange_teig_stueck": "Brot"
};

const kategorieReihenfolge = ["Brötchen", "Brot", "süßes Kleingebäck", "Kuchen", "Blechkuchen", "Konditorei", "sonstiges"];

function bereinigeAnzeigeName(dbName) {
    return dbName.replace('_stueck', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); 
}

document.addEventListener('DOMContentLoaded', () => {
    datenLadenUndBerechnen();
    const berechnenButton = document.getElementById('btn-berechnen');
    if (berechnenButton) berechnenButton.addEventListener('click', datenLadenUndBerechnen);
});

async function datenLadenUndBerechnen() {
    const ergebnisContainer = document.getElementById('ergebnis-container');
    ergebnisContainer.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">Lade aktuelle Daten...</p>';

    try {
        const response = await fetch('../backmengen_db.json');
        if (!response.ok) throw new Error('Datenbank konnte nicht gefunden werden.');
        const datenbank = await response.json();
        datenVerarbeiten(datenbank);
    } catch (fehler) {
        ergebnisContainer.innerHTML = `<p style="color: red; text-align: center;">Fehler: ${fehler.message}</p>`;
    }
}

function datenVerarbeiten(datenbank) {
    const ausgewaehlteTage = [];
    if (document.getElementById('check-mo').checked) ausgewaehlteTage.push(1);
    if (document.getElementById('check-di').checked) ausgewaehlteTage.push(2);
    if (document.getElementById('check-mi').checked) ausgewaehlteTage.push(3);
    if (document.getElementById('check-do').checked) ausgewaehlteTage.push(4);
    if (document.getElementById('check-fr').checked) ausgewaehlteTage.push(5);
    if (document.getElementById('check-sa').checked) ausgewaehlteTage.push(6);
    if (document.getElementById('check-so').checked) ausgewaehlteTage.push(0);

    const tageRueckblick = parseInt(document.getElementById('tage-rueckblick').value) || 14;
    const heute = new Date();
    const startDatum = new Date(heute.getTime() - (tageRueckblick * 24 * 60 * 60 * 1000));

    const produktErgebnisse = {};

    datenbank.forEach(eintrag => {
        const eintragDatum = new Date(eintrag.datum);
        const wochentag = eintragDatum.getDay(); 

        if (eintragDatum >= startDatum && ausgewaehlteTage.includes(wochentag)) {
            for (const [produktName, menge] of Object.entries(eintrag.produkte)) {
                if (!erlaubteProdukte.includes(produktName)) continue;

                const gepruefteMenge = parseInt(menge);
                if (isNaN(gepruefteMenge) || gepruefteMenge === 0) continue; 

                if (!produktErgebnisse[produktName]) {
                    produktErgebnisse[produktName] = { gesamtMenge: 0, anzahlTage: 0, historie: [] };
                }

                produktErgebnisse[produktName].gesamtMenge += gepruefteMenge;
                produktErgebnisse[produktName].anzahlTage += 1;
                produktErgebnisse[produktName].historie.push(gepruefteMenge);
            }
        }
    });

    htmlKartenZeichnen(produktErgebnisse);
}

function htmlKartenZeichnen(produktErgebnisse) {
    const ergebnisContainer = document.getElementById('ergebnis-container');
    ergebnisContainer.innerHTML = ''; 
    const modusStueckErzwingen = document.getElementById('modus-stueck').checked;

    if (Object.keys(produktErgebnisse).length === 0) {
        ergebnisContainer.innerHTML = '<p style="text-align: center;">Keine Daten gefunden.</p>';
        return;
    }

    const htmlNachKategorie = {};
    kategorieReihenfolge.forEach(kat => htmlNachKategorie[kat] = "");

    for (const [produktName, daten] of Object.entries(produktErgebnisse)) {
        const stueckDurchschnitt = daten.gesamtMenge / daten.anzahlTage;
        let anzeigeText = "";
        let zusatzText = "";

        if (produktEinstellungen[produktName] && produktEinstellungen[produktName].einheit === "blech" && !modusStueckErzwingen) {
            const teiler = produktEinstellungen[produktName].stueckProBlech;
            const blechDurchschnitt = (stueckDurchschnitt / teiler).toFixed(1);
            anzeigeText = `Ø ${blechDurchschnitt} Bleche`;
            zusatzText = `(Entspricht ca. ${Math.round(stueckDurchschnitt)} Stück à ${teiler}er Blech)`;
        } else {
            anzeigeText = `Ø ${Math.round(stueckDurchschnitt)} Stück`;
        }

        let trendSymbol = "➡️"; 
        if (daten.historie.length >= 2) {
            const letzterWert = daten.historie[daten.historie.length - 1];
            const vorletzterWert = daten.historie[daten.historie.length - 2];
            if (letzterWert > vorletzterWert) trendSymbol = "📈"; 
            else if (letzterWert < vorletzterWert) trendSymbol = "📉"; 
        }

        const schickerAnzeigeName = bereinigeAnzeigeName(produktName);

        const karteHTML = `
            <details class="produkt-karte">
                <summary class="produkt-kopf">
                    <span>${schickerAnzeigeName}</span>
                    <span class="trend-anzeige">${trendSymbol}</span>
                </summary>
                <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <p class="durchschnitts-wert"><strong>${anzeigeText}</strong></p>
                    <p class="zusatz-info">${zusatzText}</p>
                    <p class="zusatz-info">Berechnet aus ${daten.anzahlTage} relevanten Backtagen.</p>
                </div>
            </details>
        `;

        const kat = produktKategorien[produktName] || "sonstiges";
        htmlNachKategorie[kat] += karteHTML;
    }

    let finalesHTML = "";
    kategorieReihenfolge.forEach(kat => {
        if (htmlNachKategorie[kat] !== "") {
            finalesHTML += `
                <div style="margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                    <h2 style="font-size: 1.2em; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${kat}</h2>
                </div>
            `;
            finalesHTML += htmlNachKategorie[kat];
        }
    });

    ergebnisContainer.innerHTML = finalesHTML;
}