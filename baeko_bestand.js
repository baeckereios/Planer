window.BOS_BAEKO_CONFIG = {
    "units": ["Karton", "Sack", "Gebinde", "Dose", "Tüte", "Presse"],
    "products": {
        // --- ZONE 1: RECHNER-WARE (Croissants & Co.) ---
        "bc": { 
            name: "ButterCroissant", unit: "Karton", soll: 35, soll_ft: 45, 
            show_in_inventory: true, show_in_calc: true, 
            stueck_pro_karton: 80, stueck_pro_blech: 15,
            needs_blech: [8, 8, 8, 8, 12, 18, 18]
        },
        "sc": { 
            name: "SchokoCroissant", unit: "Karton", soll: 32, soll_ft: 40, 
            show_in_inventory: true, show_in_calc: true, 
            stueck_pro_karton: 80, stueck_pro_blech: 12,
            needs_blech: [6, 6, 6, 6, 10, 15, 15]
        },
        "le": { 
            name: "Laugenecken", unit: "Karton", soll: 32, soll_ft: 40, 
            show_in_inventory: true, show_in_calc: true, 
            stueck_pro_karton: 80, stueck_pro_blech: 12,
            needs_blech: [5, 5, 5, 5, 8, 12, 12]
        },
        "mbc": { 
            name: "Mini ButterCroissant", unit: "Karton", soll: 24, soll_ft: 30, 
            show_in_inventory: true, show_in_calc: true, 
            stueck_pro_karton: 150, stueck_pro_blech: 30,
            needs_blech: [3, 3, 3, 3, 5, 8, 8]
        },
        "msc": { 
            name: "Mini SchokoCroissant", unit: "Karton", soll: 24, soll_ft: 30, 
            show_in_inventory: true, show_in_calc: true, 
            stueck_pro_karton: 150, stueck_pro_blech: 30,
            needs_blech: [3, 3, 3, 3, 5, 8, 8]
        },

        // --- ZONE 2: REINE LAGERWARE (Nur Zählen) ---
        "ks": { name: "KäseSchnecken", unit: "Karton", soll: 6, soll_ft: 8, show_in_inventory: true, show_in_calc: false },
        "kb": { name: "KäseBälle", unit: "Karton", soll: 5, soll_ft: 7, show_in_inventory: true, show_in_calc: false },
        "frika": { name: "Frikadellen", unit: "Karton", soll: 15, soll_ft: 20, threshold: 3, show_in_inventory: true, show_in_calc: false },
        "ht": { name: "HähnchenTeile", unit: "Karton", soll: 15, soll_ft: 20, threshold: 3, show_in_inventory: true, show_in_calc: false },
        "ve": { name: "VollEi", unit: "Karton", soll: 40, soll_ft: 50, show_in_inventory: true, show_in_calc: false },
        "hefe": { name: "Hefe", unit: "Karton", soll: 35, soll_ft: 45, show_in_inventory: true, show_in_calc: false },
        "eier": { name: "Eier", unit: "Karton", soll: 2, soll_ft: 3, show_in_inventory: true, show_in_calc: false },

        // --- ZONE 3: SYSTEM-WERTE (Versteckt) ---
        "hb": { 
            name: "HasenBerger", type: "cross", 
            show_in_inventory: false, show_in_calc: true, 
            unit_alt: "Presse", val_alt: 30, val_blech: 20,
            needs_blech: [5, 5, 5, 5, 8, 12, 10]
        },
        "kk": { 
            name: "KornKnacker", type: "cross", 
            show_in_inventory: false, show_in_calc: true, 
            unit_alt: "Presse", val_alt: 30, val_blech: 25, factor: 1.06,
            needs_blech: [4, 4, 4, 4, 6, 10, 8]
        }
    }
};
