/* * BÄCKEROS MARKT-DATEN
 * Getrennt nach: HARTE FAKTEN (Analyse) vs. WEICHE FAKTEN (Trends)
 */

const marktDaten = {
    meta: {
        ausgabe: "MÄRZ / APRIL 2026"
    },
    rohstoffe: [
        { name: "Weizen (Matif)", preis: "208 €/t", trend: "up", prozent: "+9.2%", info: "(Stabil)" },
        { name: "Butter (Block)", preis: "4.770 €/t", trend: "down", prozent: "-35.5%", info: "(Kaufen!)" },
        { name: "Kakao", preis: "Sehr Hoch", trend: "up", prozent: "+40%", info: "(Krise)" },
        { name: "Zucker", preis: "Index 92", trend: "down", prozent: "-23.0%", info: "(Überschuss)" },
        { name: "Vollei", preis: "2.10 €/kg", trend: "up", prozent: "+4.5%", info: "(Ostern)" },
        { name: "Roggen", preis: "185 €/t", trend: "up", prozent: "+12.0%", info: "(Knapp)" }
    ],
    // HIER: Nur Erklärungen zu Preisen & Gesetzen
    analysen: [
        {
            thema: "Rohstoff Kakao",
            headline: "Warum Schokolade so teuer bleibt",
            text: "Es ist nicht nur Spekulation: In Westafrika (Elfenbeinküste/Ghana) vernichtete das Wetterphänomen El Niño fast 30% der Ernte. Dazu kommt die 'Black Pod'-Krankheit bei den Bäumen. Da neue Bäume 5 Jahre brauchen, um Ertrag zu bringen, wird Schokolade bis mindestens 2027 ein Luxusgut bleiben."
        },
        {
            thema: "Rohstoff Butter",
            headline: "Der Grund für den Preissturz",
            text: "Die Butterblase ist geplatzt, weil die Industrie (Kekshersteller etc.) ihre Lagerbestände zu hoch aufgebaut hatte und nun kaum kauft. Gleichzeitig stieg die Milchleistung in den USA massiv. Das Überangebot drückt den Preis – gut für uns Bäcker!"
        },
        {
            thema: "Rohstoff Roggen",
            headline: "Roggen wird zum Edel-Korn",
            text: "Landwirte bauen immer weniger Roggen an, weil Weizen und Mais ertragreicher und robuster sind. Die Anbaufläche in Deutschland ist auf einem historischen Tiefstand. Das macht Roggen langfristig knapper und teurer als Weizen."
        },
        {
            thema: "Recht & Personal",
            headline: "Die neue Azubi-Vergütung erklärt",
            text: "Der Tarifabschluss erzwingt höhere Löhne, um die Abwanderung in die Industrie zu stoppen. Wichtig: Die Erhöhung ist nicht optional. Prüfe deine Daueraufträge für März, um Mahngebühren der Sozialkassen zu vermeiden."
        },
        {
            thema: "Energie-Politik",
            headline: "Netzentgelte steigen weiter",
            text: "Zwar ist der reine Strompreis stabil, aber die Gebühren für die Netznutzung steigen 2026 erneut. Für Bäckereien mit hohem Ofen-Stromverbrauch lohnt sich jetzt die Prüfung eines 'Lastspitzen-Managements', um teure Peaks zu vermeiden."
        },
        {
            thema: "Kaffee-Markt",
            headline: "Robusta-Knappheit in Vietnam",
            text: "Vietnam (Hauptlieferant für günstige Robusta-Bohnen) leidet unter Dürre. Der Preisabstand zur teureren Arabica-Bohne schrumpft fast auf Null. Es lohnt sich kaum noch, 'billigen' Kaffee zu mischen."
        }
    ],
    // HIER: Inspiration, Marketing, Snacks
    trends: [
        { kategorie: "Trend-Gebäck", headline: "Die New York Roll", text: "Runde, gefüllte Croissants sind der Umsatzbringer. Kunden zahlen bereitwillig 4,50€ für das 'Insta-Erlebnis'." },
        { kategorie: "Marketing", headline: "Google Maps Pflege", text: "Wichtiger als die Website: 80% suchen 'Bäcker' über Maps. Lade aktuelle Fotos der Theke hoch!" },
        { kategorie: "Technik", headline: "KI-Bestellungen", text: "Erste Tests mit WhatsApp-Bots laufen: Kunden sprechen die Bestellung ein, die KI tippt sie in die Kasse." },
        { kategorie: "Nachhaltigkeit", headline: "Retouren-Fermentierung", text: "Altbrot nicht wegwerfen, sondern fermentieren und als Aroma-Booster in den neuen Teig geben." },
        { kategorie: "Snack", headline: "Herzhafte Plunder", text: "Spinat-Feta im Plunderteig wächst stärker als Süßgebäck im Mittagsgeschäft." },
        { kategorie: "Verkauf", headline: "Allergen-Schulung", text: "Verbraucherschützer testen inkognito. Dein Personal muss wissen, wo Nüsse drin sind." },
        { kategorie: "Saison", headline: "Frühe Erdbeeren", text: "Durch den milden Winter startet die deutsche Erdbeersaison wohl schon Ende April." },
        { kategorie: "Personal", headline: "4-Tage-Woche", text: "Betriebe mit 4x9 Stunden Modell berichten von mehr Bewerbern für die Backstube." },
        { kategorie: "Nische", headline: "Emmer & Einkorn", text: "Dinkel ist Mainstream. Urgetreide rechtfertigen Preise über 6€ pro Brot." },
        { kategorie: "Verpackung", headline: "Mehrweg-Kontrollen", text: "Ordnungsämter prüfen jetzt aktiv, ob Mehrwegbecher angeboten werden." }
    ]
};
