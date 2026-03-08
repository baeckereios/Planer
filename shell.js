/**
 * BäckereiOS Shell v1.0
 * Injiziert Header und Navigation in alle Unterseiten.
 */

(function() {
    'use strict';

        const PAGE_CONFIG = {
        'setup.html':                { title: 'PlanungsAssistent',  mode: 'minimal'                  },
        'schnellrechner.html':       { title: 'Schnellrechner',     mode: 'full', tab: 'rechner'    },
        'frosterliste.html':         { title: 'Frosterliste',       mode: 'full', tab: 'mehr'       },
        'ofenangriff.html':          { title: 'Ofenangriff',        mode: 'full', tab: 'mehr'       },
        'pausenraum.html':           { title: 'Pausenraum',         mode: 'full', tab: 'mehr'       },
        'bestandsuebersicht.html':   { title: 'Bestände',           mode: 'full', tab: 'mehr'       },
        'verbrauchsuebersicht.html': { title: 'Mengenangaben',      mode: 'full', tab: 'mehr'       },
        'lager_inventur.html':       { title: 'BÄKO Lager',         mode: 'full', tab: 'mehr'       },
        'lager_auswertung.html':     { title: 'Lager-Auswertung',   mode: 'full', tab: 'mehr'       },
        'baeko_lager_analyse_klon.html': { title: 'Lager-Analyse',    mode: 'full', tab: 'mehr'       },
        'blechrechner.html':         { title: 'BlechRechner',       mode: 'full', tab: 'mehr'       },
        'Backplan_Aktuell.html':     { title: 'Wochenplan',         mode: 'full', tab: 'mehr'       },
        'rohstoff_fakten.html':      { title: 'RohstoffFakten',     mode: 'full', tab: 'mehr'       },
        'das_magazin.html':          { title: 'Das Magazin',         mode: 'full', tab: 'mehr'       },
        'geschichte.html':           { title: 'Leitartikel',         mode: 'full', tab: 'mehr'       },
        'wissen_start.html':         { title: 'Azubi & Meisterhaft',mode: 'full', tab: 'mehr'       },
        'azubi_meisterhaft.html':    { title: 'Azubi & Meisterhaft',mode: 'full', tab: 'mehr'       },
        'history.html':              { title: 'Geschichte',         mode: 'full', tab: 'mehr'       },
        'mythen.html':               { title: 'Mythen & Fakten',    mode: 'full', tab: 'mehr'       },
        'pausen_snacks.html':        { title: 'Pausen-Snacks',      mode: 'full', tab: 'mehr'       },
        'changelog.html':            { title: 'Changelog',          mode: 'full', tab: 'mehr'       },
        'backspiel.html':            { title: 'BäckerRun',          mode: 'full', tab: 'mehr'       },
        'games.html':                { title: 'BäckerSpiele',       mode: 'full', tab: 'mehr'       },
    };

    const filename = window.location.pathname.split('/').pop() || 'index.html';
    const config   = PAGE_CONFIG[filename] || { title: '', mode: 'full', tab: 'mehr' };

    // NEU: Die intelligente Ordner-Erkennung
    const isSubfolder = window.location.href.includes('/baeko_bestellung/') || window.location.href.includes('/news_rohstoffe/') || window.location.href.includes('/azubi_meisterhaft/') || window.location.href.includes('/games/');
    const base = isSubfolder ? '../' : '';

    const isMinimal = config.mode === 'minimal';
    const activeTab = config.tab || 'start';

    const style = document.createElement('style');
    style.textContent = `
        .bos-shell-header { position: fixed; top: 0; left: 0; right: 0; z-index: 500; background: var(--surface); border-bottom: 1.5px solid var(--border); box-shadow: 0 2px 10px var(--shadow); }
        .bos-shell-topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; height: 52px; }
        .bos-back-btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); text-decoration: none; display: flex; align-items: center; gap: 5px; padding: 6px 10px; border: 1.5px solid var(--border-s); border-radius: 8px; background: var(--surface2); transition: border-color 0.15s, color 0.15s; white-space: nowrap; }
        .bos-back-btn:hover { border-color: var(--amber); color: var(--amber); }
        .bos-shell-logo { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.5rem; color: var(--text); line-height: 1; text-decoration: none; letter-spacing: -0.5px; }
        .bos-shell-logo span { color: var(--amber); font-style: italic; }
        .bos-page-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; color: var(--amber); text-align: right; min-width: 80px; }
        .bos-shell-bottom { position: fixed; bottom: 0; left: 0; right: 0; z-index: 500; }
        .bos-status-strip { background: var(--surface2); border-top: 1px solid var(--border); padding: 5px 16px; display: flex; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.8px; color: var(--dim); }
        .bos-status-item { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .bos-dot { width: 6px; height: 6px; border-radius: 50%; background: #bbb; flex-shrink: 0; }
        .bos-dot.ok { background: #2ecc71; }
        .bos-dot.warn { background: #e74c3c; }
        .bos-tab-bar { background: var(--surface); border-top: 1.5px solid var(--border); padding: 7px 0 10px; display: flex; justify-content: space-around; align-items: flex-end; }
        .bos-tab-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; padding: 3px 14px; color: var(--dim); text-decoration: none; -webkit-tap-highlight-color: transparent; transition: color 0.15s; min-width: 60px; }
        .bos-tab-btn:hover { color: var(--text); }
        .bos-tab-btn.active { color: var(--amber); }
        .bos-tab-icon { font-size: 1.35rem; line-height: 1; transition: transform 0.15s; }
        .bos-tab-btn.active .bos-tab-icon { transform: scale(1.1); }
        .bos-tab-label { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 0.63rem; letter-spacing: 0.8px; text-transform: uppercase; line-height: 1; }
    `;
    document.head.appendChild(style);

    function buildHeader() {
        const header = document.createElement('div');
        header.className = 'bos-shell-header';
        header.innerHTML = `
            <div class="bos-shell-topbar">
                <a href="${base}index.html" class="bos-back-btn">← Cockpit</a>
                <a href="${base}index.html" class="bos-shell-logo">Bäckerei<span>OS</span></a>
                <div class="bos-page-title">${config.title}</div>
            </div>
        `;
        document.body.prepend(header);
    }

    function getStatusHTML() {
        let invDot = '', invText = 'Inventur: Lade...';
        
        if (typeof window.BOS_INVENTUR !== 'undefined' && window.BOS_INVENTUR.products) {
            let latestTs = 0;
            for (const key in window.BOS_INVENTUR.products) {
                if (window.BOS_INVENTUR.products[key].ts > latestTs) {
                    latestTs = window.BOS_INVENTUR.products[key].ts;
                }
            }
            
            if (latestTs > 0) {
                const inv = new Date(latestTs);
                const pad = x => String(x).padStart(2, '0');
                const diffH = (Date.now() - latestTs) / 3600000;
                
                const timeStr = pad(inv.getHours()) + ':' + pad(inv.getMinutes()) + ' Uhr';
                const dateStr = pad(inv.getDate()) + '.' + pad(inv.getMonth() + 1) + '.' + inv.getFullYear();
                
                invDot  = diffH > 24 ? 'warn' : 'ok';
                invText = 'Inventur: ' + timeStr + ', ' + dateStr + (diffH > 24 ? ' 🔴' : '');
            } else {
                invDot = 'warn'; 
                invText = 'Inventur: Nicht erfasst';
            }
        } else {
            invDot = 'warn'; 
            invText = 'Fehler: Keine Daten';
        }

        return `<div class="bos-status-item"><div class="bos-dot ${invDot}"></div><span>${invText}</span></div>`;
    }

    function buildBottomNav() {
        const tabs = [
            { id: 'start',     icon: '🏠', label: 'Start',     href: base + 'index.html'          },
            { id: 'rechner',   icon: '🧮', label: 'Rechner',   href: base + 'schnellrechner.html' },
            { id: 'assistent', icon: '🚀', label: 'Assistent', href: base + 'setup.html'           },
            { id: 'mehr',      icon: '☰',  label: 'Mehr',      href: base + 'index.html#mehr'      },
        ];

        const tabsHTML = tabs.map(t => `<a href="${t.href}" class="bos-tab-btn ${t.id === activeTab ? 'active' : ''}"><span class="bos-tab-icon">${t.icon}</span><span class="bos-tab-label">${t.label}</span></a>`).join('');

        const nav = document.createElement('div');
        nav.className = 'bos-shell-bottom';
        nav.innerHTML = `<div class="bos-status-strip"><div class="bos-status-item"><div class="bos-dot"></div><span>Inventur: Lade...</span></div></div><div class="bos-tab-bar">${tabsHTML}</div>`;
        document.body.appendChild(nav);
    }

    function adjustBodyPadding() {
        document.body.style.paddingTop = '52px';
        if (!isMinimal) {
            const current = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
            if (current < 90) document.body.style.paddingBottom = '90px';
        }
    }

    function hideOldHeader() {
        ['.app-header', '.brand-header'].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
        });
    }

    function loadInventurDataAndUpdate() {
        const script = document.createElement('script');
        // Hier greift jetzt der intelligente Pfad!
        script.src = base + 'inventurdaten.js?v=' + Date.now(); 
        
        script.onload = function() {
            const strip = document.querySelector('.bos-status-strip');
            if (strip) strip.innerHTML = getStatusHTML();
        };
        script.onerror = function() {
            const strip = document.querySelector('.bos-status-strip');
            if (strip) strip.innerHTML = getStatusHTML();
        };
        
        document.head.appendChild(script);
    }

    function init() {
        hideOldHeader();
        buildHeader();
        if (!isMinimal) buildBottomNav();
        adjustBodyPadding();
        
        loadInventurDataAndUpdate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
