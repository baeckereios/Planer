/**
 * BäckereiOS Shell v1.0
 * Injiziert Header und Navigation in alle Unterseiten.
 */

(function() {
    'use strict';

        const PAGE_CONFIG = {
        'setup.html':                { title: 'PlanungsAssistent',  mode: 'minimal'                  },
        'schnellrechner.html':       { title: 'Schnellrechner',     mode: 'full', tab: 'rechner'    },
        'baguette_rechner.html':     { title: 'Stangenrechner',     mode: 'full', tab: 'mehr'       },
        'frosterliste.html':         { title: 'Frosterliste',       mode: 'full', tab: 'mehr'       },
        'frosterliste_wochentag.html': { title: 'Frosterliste\nWochentag', mode: 'full', tab: 'mehr'  },
        'ofenangriff.html':          { title: 'Ofenangriff',        mode: 'full', tab: 'mehr'       },
        'pausenraum.html':           { title: 'Pausenraum',         mode: 'full', tab: 'mehr'       },
        'bestandsuebersicht.html':   { title: 'Bestände',           mode: 'full', tab: 'mehr'       },
        'inventur_dateneingabe.html':{ title: 'Inventur',           mode: 'full', tab: 'mehr'       },
        'produktion_melden.html':   { title: 'Produktion melden',  mode: 'full', tab: 'mehr'       },
        'verbrauchsuebersicht.html': { title: 'Mengenangaben',      mode: 'full', tab: 'mehr'       },
        'schablone.html':            { title: 'Verbrauchsschablone', mode: 'full', tab: 'mehr'      },
        'wetter_analyse.html':       { title: 'Wetterrückblick',    mode: 'full', tab: 'mehr'       },
        'wetter_planung.html':       { title: 'Wettervorschau',     mode: 'full', tab: 'mehr'       },
        'verlauf.html':              { title: 'Produktverlauf',     mode: 'full', tab: 'mehr'       },
        'durchschnittsrechner.html': { title: 'Durchschnittsrechner', mode: 'full', tab: 'mehr'     },
        '14_tage_logbuch.html':      { title: '14-Tage Logbuch',    mode: 'full', tab: 'mehr'       },
        'brot_historie.html':        { title: 'Backmengen-Historie', mode: 'full', tab: 'mehr'       },
        'hilfe.html':                { title: 'Hilfe',              mode: 'full', tab: 'mehr'       },
        'changelog.html':            { title: 'Changelog',          mode: 'full', tab: 'mehr'       },
        'brot_rechner.html':         { title: 'BrotRechner',        mode: 'full', tab: 'mehr'       },
        'sauerteig_rechner.html':    { title: 'Sauerteig & Vortag', mode: 'full', tab: 'mehr'       },
        'lieferanten_inventur.html': { title: 'BÄKO Inventur',      mode: 'full', tab: 'mehr'       },
        'lieferanten_auswertung.html':{ title: 'Lieferanten',        mode: 'full', tab: 'mehr'       },
        'lieferanten_config_editor.html':{ title: 'Lieferanten-Config', mode: 'full', tab: 'mehr'   },
        'druckzentrale.html':        { title: 'Druckzentrale',      mode: 'full', tab: 'mehr'       },
        'schlawiner_rechner.html':   { title: 'Schlawiner\nRechner', mode: 'full', tab: 'mehr'      },
        'archiv.html':               { title: 'Archiv',             mode: 'full', tab: 'mehr'       },
        'wurm.html':                 { title: 'Der Wurm',           mode: 'full', tab: 'start'      },
    };

    const filename = window.location.pathname.split('/').pop() || 'index.html';
    const config   = PAGE_CONFIG[filename] || { title: '', mode: 'full', tab: 'mehr' };

    // NEU: Die intelligente Ordner-Erkennung
    const isSubfolder = window.location.href.includes('/baeko_bestellung/') || window.location.href.includes('/news_rohstoffe/') || window.location.href.includes('/azubi_meisterhaft/') || window.location.href.includes('/games/') || window.location.href.includes('/nachtschicht/') || window.location.href.includes('/durchschnittsverbauch/') || window.location.href.includes('/organisation/') || window.location.href.includes('/druckzentrale/') || window.location.href.includes('/schlawiner_rechner/') || window.location.href.includes('/archiv/');
    const base = isSubfolder ? '../' : '';

    const isMinimal = config.mode === 'minimal';
    const activeTab = config.tab || 'start';

    const style = document.createElement('style');
    style.textContent = `
        @import url('https://unpkg.com/@phosphor-icons/web@2.1.1/src/index.css');
        .bos-shell-header { position: fixed; top: 0; left: 0; right: 0; z-index: 500; background: var(--surface); border-bottom: 1.5px solid var(--border); box-shadow: 0 2px 10px var(--shadow); }
        .bos-shell-topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; height: 52px; }
        .bos-back-btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); text-decoration: none; display: flex; align-items: center; gap: 5px; padding: 6px 10px; border: 1.5px solid var(--border-s); border-radius: 8px; background: var(--surface2); transition: border-color 0.15s, color 0.15s; white-space: nowrap; }
        .bos-back-btn:hover { border-color: var(--amber); color: var(--amber); }
        .bos-shell-logo { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.5rem; color: var(--text); line-height: 1; text-decoration: none; letter-spacing: -0.5px; }
        .bos-shell-logo span { color: var(--amber); font-style: italic; }
        .bos-page-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; color: var(--amber); text-align: right; min-width: 80px; white-space: pre-line; line-height: 1.3; }
        .bos-shell-bottom { position: fixed; bottom: 0; left: 0; right: 0; z-index: 500; }
        .bos-status-strip { background: var(--surface2); border-top: 1px solid var(--border); padding: 5px 16px; display: flex; justify-content: space-between; font-family: 'Barlow Condensed', sans-serif; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.8px; color: var(--dim); }
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
        let invDot = '', invText = '–';
        
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
                invDot  = diffH > 24 ? 'warn' : 'ok';
                invText = pad(inv.getDate()) + '.' + pad(inv.getMonth() + 1) + '. ' + pad(inv.getHours()) + ':' + pad(inv.getMinutes());
            } else {
                invDot = 'warn'; invText = 'Nicht erfasst';
            }
        } else {
            invDot = 'warn'; invText = 'Keine Daten';
        }

        // Dot und Text separat setzen
        const dot = document.getElementById('bos-dot-inv');
        const lbl = document.getElementById('bos-label-inv');
        if (dot) { dot.className = 'bos-dot ' + invDot; }
        if (lbl) lbl.textContent = invText;
    }

    function buildBottomNav() {
        // Phosphor Icons laden falls noch nicht vorhanden
        if (!document.querySelector('script[src*="phosphor-icons"]')) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/index.js';
            document.head.appendChild(ph);
        }

        const tabs = [
            { id: 'start',   icon: 'ph ph-bread',            iconActive: 'ph-duotone ph-bread',            label: 'Start',     href: base + 'index.html'          },
            { id: 'rechner', icon: 'ph ph-calculator',        iconActive: 'ph-duotone ph-calculator',        label: 'Rechner',   href: base + 'schnellrechner.html' },
            { id: 'brett',   icon: 'ph ph-chat-circle-dots',  iconActive: 'ph-duotone ph-chat-circle-dots',  label: 'Brett',     href: base + 'index.html#brett'    },
            { id: 'mehr',    icon: 'ph ph-squares-four',      iconActive: 'ph-duotone ph-squares-four',      label: 'Mehr',      href: base + 'index.html#mehr'     },
        ];

        const tabsHTML = tabs.map(t => {
            const isActive = t.id === activeTab;
            const iconClass = isActive ? t.iconActive : t.icon;
            return `<a href="${t.href}" class="bos-tab-btn ${isActive ? 'active' : ''}"><span class="bos-tab-icon"><i class="${iconClass}"></i></span><span class="bos-tab-label">${t.label}</span></a>`;
        }).join('');

        const nav = document.createElement('div');
        nav.className = 'bos-shell-bottom';
        nav.innerHTML = `<div class="bos-status-strip">
            <div class="bos-status-item" style="flex-direction:column;align-items:flex-start;gap:1px;">
                <span style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.8px;color:var(--dim,#6b7280);opacity:0.7;">Datensatz bis</span>
                <span id="bos-label-datum" style="font-weight:800;font-size:0.68rem;">–</span>
            </div>
            <div class="bos-status-item" style="flex-direction:column;align-items:flex-end;gap:1px;">
                <span style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.8px;color:var(--dim,#6b7280);opacity:0.7;display:flex;align-items:center;gap:4px;"><span class="bos-dot" id="bos-dot-inv"></span>Inventur von</span>
                <span id="bos-label-inv" style="font-weight:800;font-size:0.68rem;">–</span>
            </div>
        </div><div class="bos-tab-bar">${tabsHTML}</div>`;
        document.body.appendChild(nav);

        // DB-Datum laden
        fetch(base + 'backmengen_db.json', { cache: 'no-store' })
            .then(r => r.json())
            .then(db => {
                if (Array.isArray(db) && db.length) {
                    const latest = [...db].sort((a, b) => b.datum.localeCompare(a.datum))[0].datum;
                    const p = latest.split('-');
                    const el = document.getElementById('bos-label-datum');
                    if (el) el.textContent = p[2] + '.' + p[1] + '.' + p[0].slice(2);
                }
            }).catch(() => {
                const el = document.getElementById('bos-label-datum');
                if (el) el.textContent = '?';
            });
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
        
        script.onload = function() { getStatusHTML(); };
        script.onerror = function() { getStatusHTML(); };
        
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
