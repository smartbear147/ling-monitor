// ==UserScript==
// @name 灵界自动监控
// @namespace https://ling.muge.info
// @version 1.6
// @description 自动雇佣护道者、购买商人物品、死亡复活、关闭打赏弹窗，支持手机端拖拽
// @match https://ling.muge.info/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @grant unsafeWindow
// @run-at document-idle
// @downloadURL https://gh-proxy.org/https://raw.githubusercontent.com/smartbear147/ling-monitor/refs/heads/main/ling-monitor.user.js
// @updateURL https://gh-proxy.org/https://raw.githubusercontent.com/smartbear147/ling-monitor/refs/heads/main/ling-monitor.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 主题样式 ---
    GM_addStyle(`
        /* === 主题变量 (跟随页面亮暗模式) === */
        html.theme-dark #monitor-panel,
        html:not(.theme-light) #monitor-panel {
            --mp-bg: #0e1528;
            --mp-bg-section: rgba(200,160,80,0.03);
            --mp-bg-card: rgba(0,0,0,0.25);
            --mp-bg-input: rgba(0,0,0,0.4);

            --mp-text: #f0ece4;
            --mp-text-secondary: #b8a080;
            --mp-text-muted: #9a8a70;
            --mp-text-bright: #f5f2eb;

            --mp-accent: #d4a84b;
            --mp-accent-dim: rgba(212,168,75,0.25);
            --mp-accent-glow: rgba(212,168,75,0.15);
            --mp-accent-subtle: rgba(212,168,75,0.05);
            --mp-jade: #4ecdc4;
            --mp-jade-glow: rgba(78,205,196,0.2);
            --mp-red: #ff6b6b;
            --mp-red-glow: rgba(255,107,107,0.2);

            --mp-border: rgba(200,160,80,0.08);
            --mp-border-subtle: rgba(200,160,80,0.15);
            --mp-border-strong: rgba(200,160,80,0.25);

            --mp-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(212,168,75,0.08);
            --mp-shadow-inner: inset 0 1px 0 rgba(200,160,80,0.1);

            --mp-header-grad: linear-gradient(180deg, rgba(212,168,75,0.08) 0%, transparent 100%);
            --mp-gold-line: linear-gradient(90deg, transparent 0%, rgba(212,168,75,0.5) 20%, rgba(212,168,75,0.8) 50%, rgba(212,168,75,0.5) 80%, transparent 100%);
            --mp-bg-texture: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(200,160,80,0.02) 2px, rgba(200,160,80,0.02) 4px);

            --mp-log-success: #4ecdc4;
            --mp-log-error: #ff6b6b;
            --mp-log-warn: #f0a050;
            --mp-log-info: #70a0c0;
            --mp-log-action: #d4a84b;
        }
        html.theme-light #monitor-panel {
            --mp-bg: #f5f3ef;
            --mp-bg-section: #f0ece8;
            --mp-bg-card: rgba(90,122,138,0.05);
            --mp-bg-input: #eae6e2;

            --mp-text: #2a3a4a;
            --mp-text-secondary: #5a6a7a;
            --mp-text-muted: #607080;
            --mp-text-bright: #1a2a3a;

            --mp-accent: #b8860b;
            --mp-accent-dim: rgba(184,134,11,0.2);
            --mp-accent-glow: rgba(184,134,11,0.1);
            --mp-accent-subtle: rgba(184,134,11,0.05);
            --mp-jade: #3a8a80;
            --mp-jade-glow: rgba(58,138,128,0.15);
            --mp-red: #c84040;
            --mp-red-glow: rgba(200,64,64,0.15);

            --mp-border: rgba(60,60,60,0.06);
            --mp-border-subtle: rgba(60,60,60,0.12);
            --mp-border-strong: rgba(60,60,60,0.2);

            --mp-shadow: 0 4px 16px rgba(0,0,0,0.08);
            --mp-shadow-inner: inset 0 1px 0 rgba(255,255,255,0.5);

            --mp-header-grad: linear-gradient(180deg, #f8f6f2 0%, #f5f3ef 100%);
            --mp-gold-line: linear-gradient(90deg, transparent 0%, rgba(184,134,11,0.3) 30%, rgba(184,134,11,0.5) 50%, rgba(184,134,11,0.3) 70%, transparent 100%);
            --mp-bg-texture: none;

            --mp-log-success: #3a8a50;
            --mp-log-error: #c84040;
            --mp-log-warn: #b08030;
            --mp-log-info: #3a6a80;
            --mp-log-action: #8a6a20;
        }

        /* === 面板整体 === */
        #monitor-panel {
            position: fixed; top: 10px; right: 10px; width: 320px;
            max-width: calc(100vw - 20px);
            background: var(--mp-bg);
            border: 1px solid var(--mp-border-subtle);
            border-radius: 12px; z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px; font-weight: 500;
            color: var(--mp-text);
            box-shadow: var(--mp-shadow);
            overflow: hidden;
        }
        #monitor-panel::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--mp-bg-texture);
            pointer-events: none;
            z-index: 0;
        }
        .mp-gold-line {
            height: 1px;
            background: var(--mp-gold-line);
            position: relative;
            z-index: 2;
        }
        #monitor-panel.minimized #monitor-body { display: none; }
        #monitor-panel.minimized { width: auto; min-width: 180px; }

        /* === 头部 === */
        #monitor-header {
            cursor: move; padding: 10px 14px;
            background: var(--mp-header-grad);
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: none;
            user-select: none;
            position: relative;
            z-index: 1;
        }
        .mp-header-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; font-size: 13px; letter-spacing: 1.5px;
            color: var(--mp-text-bright);
        }
        .mp-header-right {
            display: flex; align-items: center; gap: 12px;
        }
        #monitor-status {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px; font-weight: 600; letter-spacing: 1px;
            padding: 1px 10px; border-radius: 16px;
            display: flex; align-items: center; gap: 6px;
        }
        #monitor-status.status-stopped {
            background: var(--mp-bg-card);
            color: var(--mp-text-muted);
            border: 1px solid var(--mp-border);
        }
        #monitor-status.status-running {
            background: var(--mp-jade-glow);
            color: var(--mp-jade);
            border: 1px solid rgba(78,205,196,0.3);
            animation: mp-pulse-glow 2s ease-in-out infinite;
        }
        .mp-status-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: currentColor;
        }
        #monitor-status.status-running .mp-status-dot {
            animation: mp-pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes mp-pulse-glow {
            0%, 100% { box-shadow: 0 0 0 rgba(78,205,196,0); }
            50% { box-shadow: 0 0 8px rgba(78,205,196,0.4); }
        }
        @keyframes mp-pulse-dot {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
        }
        #monitor-minimize {
            cursor: pointer;
            width: 24px; height: 24px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            color: var(--mp-text-secondary);
            background: transparent;
            border: none;
            font-size: 12px;
            transition: all 0.15s ease;
        }
        #monitor-minimize:hover {
            background: var(--mp-accent-subtle);
            color: var(--mp-accent);
        }

        /* === 日志区域 === */
        #monitor-log {
            padding: 8px 12px; max-height: 200px; overflow-y: auto;
            background: var(--mp-bg-card);
            scrollbar-width: thin; scrollbar-color: var(--mp-border-subtle) transparent;
        }
        #monitor-log::-webkit-scrollbar { width: 5px; }
        #monitor-log::-webkit-scrollbar-track { background: transparent; }
        #monitor-log::-webkit-scrollbar-thumb { background: var(--mp-border-subtle); border-radius: 3px; }
        .mp-log-line {
            padding: 3px 0 3px 10px;
            display: flex; align-items: flex-start; gap: 8px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            line-height: 1.6;
            border-bottom: 1px solid var(--mp-border);
            position: relative;
        }
        .mp-log-line:last-child { border-bottom: none; }
        .mp-log-time {
            color: var(--mp-text-muted);
            font-size: 10px; font-weight: 500;
            min-width: 60px; flex-shrink: 0;
        }
        .mp-log-content {
            color: var(--mp-text-secondary);
            font-weight: 500;
            word-break: break-all;
        }
        /* === 日志类型色条 === */
        .mp-log-line::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 2px; border-radius: 1px;
            background: var(--mp-border);
        }
        .mp-log-line.log-success::before { background: var(--mp-log-success); }
        .mp-log-line.log-error::before { background: var(--mp-log-error); }
        .mp-log-line.log-warn::before { background: var(--mp-log-warn); }
        .mp-log-line.log-info::before { background: var(--mp-log-info); }
        .mp-log-line.log-action::before { background: var(--mp-log-action); }
        .mp-log-line.log-success .mp-log-content { color: var(--mp-log-success); }
        .mp-log-line.log-error .mp-log-content { color: var(--mp-log-error); }
        .mp-log-line.log-warn .mp-log-content { color: var(--mp-log-warn); }
        .mp-log-line.log-info .mp-log-content { color: var(--mp-log-info); }
        .mp-log-line.log-action .mp-log-content { color: var(--mp-log-action); }

        /* === 底部按钮栏 === */
        #monitor-body > div:last-child {
            padding: 8px 12px;
            border-top: 1px solid var(--mp-border);
            display: flex; gap: 6px;
            background: var(--mp-bg);
        }
        .mp-btn {
            flex: 1; padding: 7px 4px;
            border: none; border-radius: 4px;
            cursor: pointer;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px; font-weight: 600;
            transition: all 0.15s ease;
            position: relative;
            overflow: hidden;
        }
        .mp-btn.mp-btn-start {
            background: linear-gradient(135deg, var(--mp-accent) 0%, #b8860b 100%);
            color: var(--mp-bg);
            box-shadow: 0 2px 8px var(--mp-accent-dim), var(--mp-shadow-inner);
        }
        .mp-btn.mp-btn-start:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--mp-accent-dim);
        }
        .mp-btn.mp-btn-start:active { transform: translateY(0) scale(0.97); }
        .mp-btn.mp-btn-stop {
            background: linear-gradient(135deg, var(--mp-red) 0%, #c84040 100%);
            color: #fff;
            box-shadow: 0 2px 8px var(--mp-red-glow);
        }
        .mp-btn.mp-btn-stop:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--mp-red-glow);
        }
        .mp-btn.mp-btn-stop:active { transform: translateY(0) scale(0.97); }
        .mp-btn.mp-btn-config {
            background: var(--mp-bg-card);
            color: var(--mp-accent);
            border: 1px solid var(--mp-border-subtle);
        }
        .mp-btn.mp-btn-config:hover {
            background: var(--mp-accent-subtle);
            border-color: var(--mp-accent-dim);
        }
        .mp-btn.mp-btn-config:active { transform: scale(0.97); }
        .mp-btn.mp-btn-clear {
            background: var(--mp-bg-card);
            color: var(--mp-text-muted);
            border: 1px solid var(--mp-border);
        }
        .mp-btn.mp-btn-clear:hover {
            background: var(--mp-bg-section);
            color: var(--mp-text-secondary);
            border-color: var(--mp-border-subtle);
        }

        /* === 配置面板 === */
        #config-panel {
            width: 100%; max-height: 50vh; overflow-y: auto;
            background: var(--mp-bg);
            border-top: 1px solid var(--mp-border-subtle);
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 12px;
            color: var(--mp-text);
            padding: 12px; padding-bottom: 30px; box-sizing: border-box;
            position: relative;
            z-index: 1;
            scrollbar-width: thin; scrollbar-color: var(--mp-border-subtle) transparent;
        }
        #config-panel::-webkit-scrollbar { width: 5px; }
        #config-panel::-webkit-scrollbar-thumb { background: var(--mp-border-subtle); border-radius: 3px; }
        .cfg-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 16px;
        }
        .cfg-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; font-size: 14px; letter-spacing: 2px;
            color: var(--mp-text-bright);
        }
        .cfg-close {
            cursor: pointer;
            width: 28px; height: 28px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            color: var(--mp-red); font-size: 18px; font-weight: bold;
            background: transparent;
            transition: all 0.15s;
        }
        .cfg-close:hover { background: var(--mp-red-glow); }
        .cfg-section {
            margin-bottom: 14px; padding: 10px 12px;
            background: var(--mp-bg-section);
            border: 1px solid var(--mp-border);
            border-radius: 8px;
        }
        .cfg-section:last-child { margin-bottom: 0; }
        .cfg-section-label {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 10px; font-weight: 700;
            color: var(--mp-text-muted);
            text-transform: uppercase; letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .cfg-row { margin-bottom: 10px; }
        .cfg-row:last-child { margin-bottom: 0; }
        .cfg-label {
            display: block;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 12px; font-weight: 600;
            color: var(--mp-accent);
            margin-bottom: 6px;
            letter-spacing: 0.5px;
        }
        .cfg-hint {
            font-size: 11px; font-weight: 400;
            color: var(--mp-text-muted);
            margin-left: 8px;
        }
        #config-panel input[type=number],
        #config-panel input[type=text],
        #config-panel select {
            width: 100%; padding: 5px 8px;
            background: var(--mp-bg-input);
            color: var(--mp-text);
            border: 1px solid var(--mp-border-subtle);
            border-radius: 5px;
            font-family: inherit;
            font-size: 11px; font-weight: 500;
            transition: all 0.15s;
        }
        #config-panel input:focus, #config-panel select:focus {
            outline: none;
            border-color: var(--mp-accent);
            box-shadow: 0 0 0 2px var(--mp-accent-glow);
        }
        #config-panel input[type=checkbox] {
            width: 16px; height: 16px;
            accent-color: var(--mp-accent);
        }
        .cfg-checkbox-row {
            display: flex; align-items: center; gap: 8px;
        }
        .cfg-bottom-bar {
            display: flex; gap: 10px;
            margin-top: 16px;
        }
        .cfg-btn {
            flex: 1; padding: 8px 0;
            border-radius: 4px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 12px; font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .cfg-btn-save {
            background: linear-gradient(135deg, var(--mp-accent) 0%, #b8860b 100%);
            color: var(--mp-bg);
            border: none;
            box-shadow: 0 2px 8px var(--mp-accent-dim);
        }
        .cfg-btn-save:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
        .cfg-btn-reset {
            background: var(--mp-bg-card);
            color: var(--mp-text-secondary);
            border: 1px solid var(--mp-border-subtle);
        }
        .cfg-btn-reset:hover {
            background: var(--mp-accent-subtle);
            color: var(--mp-accent);
            border-color: var(--mp-accent-dim);
        }

        /* === 优先级列表 === */
        .priority-list { display: flex; flex-direction: column; gap: 4px; }
        .priority-row {
            display: flex; align-items: center; gap: 4px;
            background: var(--mp-bg-card);
            border: 1px solid var(--mp-border-subtle);
            border-radius: 6px; padding: 5px 8px;
            transition: all 0.15s;
        }
        .priority-row:hover { border-color: var(--mp-text-muted); }
        .priority-row.dragging { opacity: 0.4; }
        .priority-row.drag-over { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
        .priority-handle {
            cursor: grab; color: var(--mp-text-muted);
            font-size: 14px; user-select: none;
            flex-shrink: 0;
        }
        #config-panel .priority-row .priority-type {
            width: 72px; min-width: 72px; max-width: 72px;
            padding: 3px 8px;
            background: var(--mp-bg-input) !important;
            color: var(--mp-text);
            border: 1px solid var(--mp-border);
            border-radius: 6px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            flex-shrink: 0;
            height: 26px; box-sizing: border-box;
            appearance: none; -webkit-appearance: none;
            text-align: center; text-align-last: center;
        }
        #config-panel .priority-row .priority-keyword {
            flex: 1; min-width: 0;
            background: var(--mp-bg-input) !important;
            color: var(--mp-text);
            border: 1px solid var(--mp-border);
            border-radius: 6px; padding: 3px 8px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            height: 26px; box-sizing: border-box;
        }
        .priority-keyword:focus { outline: none; border-color: var(--mp-accent); }
        .priority-del {
            cursor: pointer; color: var(--mp-red);
            font-size: 14px; font-weight: bold;
            user-select: none;
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px; transition: all 0.15s;
            flex-shrink: 0;
        }
        .priority-del:hover { background: var(--mp-red-glow); }
        .priority-add {
            cursor: pointer; color: var(--mp-accent);
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            text-align: center; padding: 6px;
            border: 1px dashed var(--mp-border-subtle);
            border-radius: 6px; margin-top: 4px;
            transition: all 0.15s;
        }
        .priority-add:hover { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
    `);

    // --- 版本与配置 ---
    const SCRIPT_VERSION = '1.6';

    const DEFAULT_CONFIG = {
        protectors: {
            priorities: [
                { nameMatch: '蜉蝣一梦', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫|大乘|合道', sortBy: 'attack', sortOrder: 'desc' }
            ],
            maxRetries: 3,
            retryDelayMs: 800,
            hireMode: 'together', // 'together' = 协同, 'solo' = 单独
            onNoProtector: 'escape', // 'escape' = 逃跑, 'fight' = 迎战
            fightAttackThreshold: 0, // 迎战时妖兽攻击阈值，超过则逃跑，0=不限制
            afterEscape: 'stop', // 'stop' = 冥想并停止脚本, 'continue' = 继续监控
        },
        merchant: {
            highPriceThreshold: 7500000,
            stonePriority: ['传说', '史诗', '稀有', '优良', '普通', '极品', '上品', '中品', '下品'],
            itemKeywords: ['洗炼石', '空白卷轴', '妖丹', '涅槃重生丹', '太虚道典'],
            fallbackToExpensive: true,
        },
        general: {
            highLevelMeditate: true, // 神识不足时尝试高级冥想
        },
    };

    function loadConfig() {
        const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        defaults._version = SCRIPT_VERSION;
        const saved = GM_getValue('ling_config', null);
        if (saved) {
            try {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                // 版本升级时直接用脚本默认配置覆盖
                if (parsed._version !== SCRIPT_VERSION) {
                    log('脚本版本升级，配置已重置为默认值', 'warn');
                    saveConfig(defaults);
                    return defaults;
                }
                const result = {
                    ...defaults, ...parsed,
                    protectors: { ...defaults.protectors, ...(parsed.protectors || {}) },
                    merchant: { ...defaults.merchant, ...(parsed.merchant || {}) },
                    general: { ...defaults.general, ...(parsed.general || {}) },
                };
                result._version = SCRIPT_VERSION;
                return result;
            } catch (e) { /* fallback */ }
        }
        return defaults;
    }

    function saveConfig(cfg) {
        cfg._version = SCRIPT_VERSION;
        GM_setValue('ling_config', JSON.stringify(cfg));
    }

    let config = loadConfig();

    // --- 工具函数 ---
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg, type) {
        console.log(msg);
        if (typeof window.__monitorLog === 'function') {
            window.__monitorLog(msg, type);
        }
    }

    // 通过注入脚本调用游戏的 api.request（页面上下文才有签名能力）
    function callApi(method, path, body) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('API 调用超时')), 10000);
            const eventName = '__monitorApiResult_' + Date.now();
            const handler = (e) => {
                clearTimeout(timeout);
                window.removeEventListener(eventName, handler);
                try { resolve(JSON.parse(e.detail)); }
                catch { resolve(e.detail); }
            };
            window.addEventListener(eventName, handler);
            const bodyStr = body ? ',' + JSON.stringify(body) : '';
            const s = document.createElement('script');
            s.textContent = `api.request(${JSON.stringify(method)},${JSON.stringify(path)}${bodyStr}).then(r=>window.dispatchEvent(new CustomEvent('${eventName}',{detail:JSON.stringify(r)}))).catch(e=>window.dispatchEvent(new CustomEvent('${eventName}',{detail:JSON.stringify({code:-1,message:e.message})})))`;
            document.head.appendChild(s);
            s.remove();
        });
    }

    async function getPlayerInfo() {
        return await callApi('GET', '/api/player/info?fresh=1');
    }

    async function getMasterOverview() {
        return await callApi('GET', '/api/master/overview');
    }

    // --- Toast 拦截 (用 unsafeWindow 绑定到页面真实 window) ---
    const _uw = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
    window.__lastToast = '';
    window.__lastToastTime = 0;
    window.__shenshiInsufficient = false;
    const originalShowToast = _uw.showToast;
    _uw.showToast = function (msg) {
        window.__lastToast = msg;
        window.__lastToastTime = Date.now();
        if (msg && msg.includes('神识不足')) {
            window.__shenshiInsufficient = true;
        }
        if (originalShowToast) originalShowToast.apply(this, arguments);
    };

    // --- 自动接受原生弹窗 ---
    window.addEventListener('dialog', function (e) {
        e.preventDefault();
    }, true);
    window._origAlert = window.alert;
    window._origConfirm = window.confirm;
    window._origPrompt = window.prompt;
    window.alert = function () { return undefined; };
    window.confirm = function () { return true; };
    window.prompt = function (msg, def) { return def || ''; };

    // 同步停止状态UI
    function syncStopUI() {
        const btn = document.getElementById('monitor-toggle');
        const status = document.getElementById('monitor-status');
        if (btn) {
            btn.textContent = '启动';
            btn.className = 'mp-btn mp-btn-start';
        }
        if (status) {
            status.innerHTML = '<span class="mp-status-dot"></span>已停止';
            status.className = 'status-stopped';
        }
    }

    // --- 控制面板 UI ---
    function createPanel() {
        const existing = document.getElementById('monitor-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'monitor-panel';
        panel.innerHTML = `
            <div class="mp-gold-line"></div>
            <div id="monitor-header">
                <span class="mp-header-title">自动监控 v${SCRIPT_VERSION}</span>
                <div class="mp-header-right">
                    <span id="monitor-status" class="status-stopped">
                        <span class="mp-status-dot"></span>
                        已停止
                    </span>
                    <span id="monitor-minimize" title="缩小">&#x25BC;</span>
                </div>
            </div>
            <div id="monitor-body">
                <div id="monitor-log"></div>
                <div>
                    <button id="monitor-toggle" class="mp-btn mp-btn-start">启动</button>
                    <button id="monitor-config" class="mp-btn mp-btn-config">配置</button>
                    <button id="monitor-clear" class="mp-btn mp-btn-clear">清日志</button>
                </div>
            </div>
        `;
        panel.onclick = function (e) { e.stopPropagation(); };
        document.body.appendChild(panel);

        // 移动功能 (PC端和手机端通用 - 直接按住拖动)
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const header = document.getElementById('monitor-header');

        // 开始拖动 - PC端mousedown + 手机端touchstart
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialLeft = panel.offsetLeft;
            initialTop = panel.offsetTop;
            panel.style.right = 'auto';
        };

        // 拖动中 - 计算新位置
        const doDrag = (clientX, clientY) => {
            if (!isDragging) return;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            panel.style.left = (initialLeft + deltaX) + 'px';
            panel.style.top = (initialTop + deltaY) + 'px';
        };

        // 结束拖动
        const endDrag = () => {
            isDragging = false;
        };

        // PC端鼠标事件
        header.addEventListener('mousedown', (e) => {
            // 排除按钮点击（如果点击的是status或minimize，不触发拖动）
            if (e.target.id && (e.target.id.includes('status') || e.target.id.includes('minimize'))) return;
            startDrag(e.clientX, e.clientY);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            doDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            endDrag();
        });

        // 手机端触摸事件
        header.addEventListener('touchstart', (e) => {
            // 排除按钮点击
            const target = e.target;
            if (target.id && (target.id.includes('status') || target.id.includes('minimize'))) return;
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            doDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            endDrag();
        });

        // 缩小/展开
        document.getElementById('monitor-minimize').addEventListener('click', (e) => {
            const body = document.getElementById('monitor-body');
            const arrow = document.getElementById('monitor-minimize');
            const configP = document.getElementById('config-panel');
            if (body.style.display === 'none') {
                body.style.display = '';
                arrow.innerHTML = '&#x25BC;';
                if (configP) configP.style.display = '';
            } else {
                body.style.display = 'none';
                arrow.innerHTML = '&#x25B6;';
                if (configP) configP.style.display = 'none';
            }
            e.stopPropagation();
        });

        // 日志
        window.__monitorLog = function (msg, type) {
            const logEl = document.getElementById('monitor-log');
            if (!logEl) return;
            const line = document.createElement('div');
            const cls = type ? ` log-${type}` : '';
            line.className = `mp-log-line${cls}`;
            line.innerHTML = `<span class="mp-log-time">[${new Date().toLocaleTimeString()}]</span> <span class="mp-log-content">${msg}</span>`;
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
            while (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
        };

        window.__monitorRunning = false;

        // 启动/停止
        document.getElementById('monitor-toggle').addEventListener('click', async (e) => {
            window.__monitorRunning = !window.__monitorRunning;
            const btn = e.target;
            const status = document.getElementById('monitor-status');
            if (window.__monitorRunning) {
                const playerInfo = await getPlayerInfo().catch(() => null);
                if (playerInfo && playerInfo.data) {
                    if (playerInfo.data.voidBodyBuffExpire) {
                        const remain = Math.max(0, Math.round((playerInfo.data.voidBodyBuffExpire - Date.now()) / 1000));
                        const h = Math.floor(remain / 3600);
                        const m = Math.floor((remain % 3600) / 60);
                        const s = remain % 60;
                        log(`虚空淬体生效中，倍率 x${playerInfo.data.voidBodyBuffMultiplier}，剩余 ${h}时${m}分${s}秒`, 'success');
                    } else if (!window._origConfirm('当前没有虚空淬体加成，是否继续启动监控？')) {
                        window.__monitorRunning = false;
                        return;
                    }
                }
                const masterInfo = await getMasterOverview().catch(() => null);
                if (masterInfo && masterInfo.data) {
                    if (masterInfo.data.exploreBoostEnabled) {
                        log('道韵加成已开启', 'success');
                    } else if (!window._origConfirm('道韵加成未开启，是否继续启动监控？')) {
                        window.__monitorRunning = false;
                        return;
                    }
                }
                btn.textContent = '停止';
                btn.className = 'mp-btn mp-btn-stop';
                status.className = 'status-running';
                // 先收功，等冥想彻底停止后再启动自动探索
                const needStopMeditate = playerInfo && playerInfo.data && playerInfo.data.isMeditating;
                if (needStopMeditate) {
                    status.innerHTML = '<span class="mp-status-dot"></span>收功中...';
                    const stopBtn = document.querySelector('.btn-stop-meditate');
                    if (stopBtn) {
                        log('正在收功...', 'action');
                        stopBtn.click();
                    }
                    // 轮询等待冥想完全停止（游戏可能自动重新冥想，需要反复收功）
                    for (let i = 0; i < 20; i++) {
                        await sleep(1500);
                        if (!window.__monitorRunning) { syncStopUI(); return; }
                        const medBtn = document.getElementById('meditateBtn');
                        const stillMeditating = medBtn && medBtn.classList.contains('meditating');
                        if (!stillMeditating) break;
                        const sb = document.querySelector('.btn-stop-meditate');
                        if (sb) {
                            log('检测到重新冥想，再次收功...', 'action');
                            sb.click();
                        }
                    }
                    if (!window.__monitorRunning) { syncStopUI(); return; }
                    log('收功完成，启动监控', 'success');
                }
                // 收功完毕后才开启自动探索和监控循环
                status.innerHTML = '<span class="mp-status-dot"></span>运行中';
                toggleAutoCheckbox(true);
                startMonitorLoop();
                log('监控已启动', 'success');
            } else {
                btn.textContent = '启动';
                btn.className = 'mp-btn mp-btn-start';
                status.innerHTML = '<span class="mp-status-dot"></span>已停止';
                status.className = 'status-stopped';
                hiring = false;
                shopping = false;
                if (window.__monitorInterval) {
                    clearInterval(window.__monitorInterval);
                    window.__monitorInterval = null;
                }
                toggleAutoCheckbox(false);
                log('监控已暂停', 'warn');
            }
            e.stopPropagation();
        });

        // 清日志
        document.getElementById('monitor-clear').addEventListener('click', (e) => {
            document.getElementById('monitor-log').innerHTML = '';
            e.stopPropagation();
        });

        // 配置按钮
        document.getElementById('monitor-config').addEventListener('click', (e) => {
            toggleConfigPanel();
            e.stopPropagation();
        });

        log('监控面板已加载（点击启动按钮开始）', 'info');
    }

    // --- 配置面板 UI ---
    let configPanelEl = null;
    function toggleConfigPanel() {
        if (configPanelEl) {
            configPanelEl.remove();
            configPanelEl = null;
            return;
        }
        const panel = document.createElement('div');
        panel.id = 'config-panel';
        const cfg = JSON.parse(JSON.stringify(config));
        panel.innerHTML = `
            <div class="cfg-header">
                <span class="cfg-title">配置编辑</span>
                <span class="cfg-close">&times;</span>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">护道者设置</div>
                <div class="cfg-row">
                    <label class="cfg-label">雇佣模式</label>
                    <select id="cfg-hireMode">
                        <option value="together" ${cfg.protectors.hireMode === 'together' ? 'selected' : ''}>协同（并肩作战，分担伤害）</option>
                        <option value="solo" ${cfg.protectors.hireMode === 'solo' ? 'selected' : ''}>单独（护道者替你承担全部攻击）</option>
                    </select>
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">无空闲护道者时</label>
                    <select id="cfg-onNoProtector">
                        <option value="escape" ${cfg.protectors.onNoProtector === 'escape' ? 'selected' : ''}>逃跑</option>
                        <option value="fight" ${cfg.protectors.onNoProtector === 'fight' ? 'selected' : ''}>迎战</option>
                    </select>
                </div>
                <div class="cfg-row" id="cfg-fightThreshold-wrap" style="${cfg.protectors.onNoProtector === 'fight' ? '' : 'display:none;'}">
                    <label class="cfg-label">迎战妖兽攻击阈值 (超过则逃跑，0=不限制)</label>
                    <input id="cfg-fightThreshold" type="number" value="${cfg.protectors.fightAttackThreshold || 0}">
                </div>
                <div class="cfg-row" id="cfg-afterEscape-wrap" style="${cfg.protectors.onNoProtector === 'escape' ? '' : 'display:none;'}">
                    <label class="cfg-label">逃跑后行为</label>
                    <select id="cfg-afterEscape">
                        <option value="stop" ${cfg.protectors.afterEscape === 'stop' ? 'selected' : ''}>冥想并停止脚本</option>
                        <option value="continue" ${cfg.protectors.afterEscape === 'continue' ? 'selected' : ''}>继续监控</option>
                    </select>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">通用设置</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="cfg-highLevelMeditate" type="checkbox" ${cfg.general.highLevelMeditate ? 'checked' : ''}>
                    <label class="cfg-label" style="margin-bottom:0;">神识不足时尝试高级冥想</label>
                    <span class="cfg-hint">关闭则直接进入普通冥想并停止脚本</span>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">商人设置</div>
                <div class="cfg-row">
                    <label class="cfg-label">高价阈值 (灵石)</label>
                    <input id="cfg-highPrice" type="number" value="${cfg.merchant.highPriceThreshold}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">商品关键词 (|分隔，按顺序优先)</label>
                    <input id="cfg-itemKeywords" type="text" value="${(cfg.merchant.itemKeywords || []).join('|')}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">品质优先级 (|分隔)</label>
                    <input id="cfg-stonePriority" type="text" value="${cfg.merchant.stonePriority.join('|')}">
                </div>
                <div class="cfg-row cfg-hint" style="padding:0;">匹配规则：先按关键词顺序，同关键词按品质优先级，高价物品始终最优先</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="cfg-fallback" type="checkbox" ${cfg.merchant.fallbackToExpensive ? 'checked' : ''}>
                    <label class="cfg-label" style="margin-bottom:0;">无匹配商品时买最贵的</label>
                    <span class="cfg-hint">关闭则无匹配商品时自动婉拒</span>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">护道者优先级（按顺序匹配，按|分隔）</div>
                <div id="cfg-priority-list" class="priority-list">
                    ${cfg.protectors.priorities.map((r, i) => {
                        const isName = !!r.nameMatch;
                        const keyword = isName ? r.nameMatch : (r.realmMatch || r.realmContains || '');
                        return `<div class="priority-row" draggable="true" data-idx="${i}">
                            <span class="priority-handle" title="拖拽排序">⠿</span>
                            <select class="priority-type">
                                <option value="realm" ${!isName ? 'selected' : ''}>按境界</option>
                                <option value="name" ${isName ? 'selected' : ''}>按名字</option>
                            </select>
                            <input class="priority-keyword" type="text" value="${keyword}" placeholder="关键词">
                            <span class="priority-del" title="删除">&times;</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="priority-add" id="cfg-priority-add">+ 添加规则</div>
            </div>

            <div class="cfg-bottom-bar">
                <button id="cfg-reset" class="cfg-btn cfg-btn-reset">重置默认</button>
            </div>
        `;
        const monitorPanel = document.getElementById('monitor-panel');
        monitorPanel.appendChild(panel);
        configPanelEl = panel;
        panel.querySelector('.cfg-close').addEventListener('click', () => {
            autoSave();
            panel.remove();
            configPanelEl = null;
        });

        // 自动保存
        function autoSave() {
            try {
                config.protectors.hireMode = document.getElementById('cfg-hireMode').value;
                config.protectors.onNoProtector = document.getElementById('cfg-onNoProtector').value;
                config.protectors.fightAttackThreshold = parseInt(document.getElementById('cfg-fightThreshold').value) || 0;
                config.protectors.afterEscape = document.getElementById('cfg-afterEscape').value;
                config.merchant.highPriceThreshold = parseInt(document.getElementById('cfg-highPrice').value) || 7500000;
                config.merchant.stonePriority = document.getElementById('cfg-stonePriority').value.split('|').map(s => s.trim()).filter(Boolean);
                config.merchant.itemKeywords = document.getElementById('cfg-itemKeywords').value.split('|').map(s => s.trim()).filter(Boolean);
                config.merchant.fallbackToExpensive = document.getElementById('cfg-fallback').checked;
                config.general.highLevelMeditate = document.getElementById('cfg-highLevelMeditate').checked;
                const rows = document.querySelectorAll('#cfg-priority-list .priority-row');
                const priorities = [];
                rows.forEach(row => {
                    const type = row.querySelector('.priority-type').value;
                    const kw = row.querySelector('.priority-keyword').value.trim();
                    if (!kw) return;
                    const rule = { sortBy: 'attack', sortOrder: 'desc' };
                    rule[type === 'name' ? 'nameMatch' : 'realmMatch'] = kw;
                    priorities.push(rule);
                });
                config.protectors.priorities = priorities;
                saveConfig(config);
                log('配置已保存', 'success');
            } catch (e) {
                log('配置保存失败: ' + e.message, 'error');
            }
        }

        // 联动：无空闲护道者时 → 显示/隐藏关联配置
        document.getElementById('cfg-onNoProtector').addEventListener('change', (e) => {
            document.getElementById('cfg-fightThreshold-wrap').style.display = e.target.value === 'fight' ? '' : 'none';
            document.getElementById('cfg-afterEscape-wrap').style.display = e.target.value === 'escape' ? '' : 'none';
        });

        // 绑定自动保存事件
        ['cfg-hireMode', 'cfg-onNoProtector', 'cfg-afterEscape'].forEach(id => {
            document.getElementById(id).addEventListener('change', autoSave);
        });
        ['cfg-fightThreshold', 'cfg-highPrice', 'cfg-stonePriority', 'cfg-itemKeywords'].forEach(id => {
            document.getElementById(id).addEventListener('change', autoSave);
        });
        document.getElementById('cfg-fallback').addEventListener('change', autoSave);
        document.getElementById('cfg-highLevelMeditate').addEventListener('change', autoSave);

        // 重置
        document.getElementById('cfg-reset').addEventListener('click', () => {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            saveConfig(config);
            panel.remove();
            configPanelEl = null;
            log('配置已重置为默认值', 'warn');
        });

        // --- 优先级列表交互 ---
        const list = document.getElementById('cfg-priority-list');

        function makeRow(keyword, type) {
            const row = document.createElement('div');
            row.className = 'priority-row';
            row.draggable = true;
            row.innerHTML = `
                <span class="priority-handle" title="拖拽排序">⠿</span>
                <select class="priority-type">
                    <option value="realm" ${type !== 'name' ? 'selected' : ''}>按境界</option>
                    <option value="name" ${type === 'name' ? 'selected' : ''}>按名字</option>
                </select>
                <input class="priority-keyword" type="text" value="${keyword}" placeholder="关键词">
                <span class="priority-del" title="删除">&times;</span>
            `;
            bindRowEvents(row);
            return row;
        }

        function bindRowEvents(row) {
            row.querySelector('.priority-del').addEventListener('click', () => { row.remove(); autoSave(); });
            row.querySelector('.priority-type').addEventListener('change', autoSave);
            row.querySelector('.priority-keyword').addEventListener('change', autoSave);
            row.addEventListener('dragstart', e => {
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            row.addEventListener('dragend', () => { row.classList.remove('dragging'); autoSave(); });
            row.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const dragging = list.querySelector('.dragging');
                if (dragging && dragging !== row) {
                    const rect = row.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    if (e.clientY < mid) {
                        list.insertBefore(dragging, row);
                    } else {
                        list.insertBefore(dragging, row.nextSibling);
                    }
                }
            });
        }

        list.querySelectorAll('.priority-row').forEach(bindRowEvents);

        document.getElementById('cfg-priority-add').addEventListener('click', () => {
            const row = makeRow('', 'realm');
            list.appendChild(row);
            row.querySelector('.priority-keyword').focus();
        });
    }

    // --- 自动勾选"自动"复选框 ---
    function toggleAutoCheckbox(enable) {
        const labels = document.querySelectorAll('.adventure-toggle-label');
        for (const label of labels) {
            if (label.textContent.trim() === '自动') {
                const parent = label.closest('label') || label.parentElement;
                const checkbox = parent ? parent.querySelector('input[type="checkbox"]') : null;
                if (checkbox) {
                    if (enable && !checkbox.checked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    } else if (!enable && checkbox.checked) {
                        checkbox.checked = false;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        }
    }

    // --- 等待护道者列表加载 ---
    async function waitForProtectorList(timeout = 8000) {
        // Wait before first check to allow list to load
        await sleep(800);
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const count = document.querySelectorAll('.protector-card').length;
            const list = document.getElementById('encounterProtectorList');
            const listText = list ? list.textContent : '';
            const hasEmptyText = listText.includes('暂无空闲');

            log(`[waitForProtectorList] cards: ${count}, hasEmptyText: ${hasEmptyText}`, 'info');

            if (list && hasEmptyText) {
                log('[waitForProtectorList] 检测到"暂无空闲"', 'warn');
                return 'empty';
            }
            if (count > 0) {
                log('[waitForProtectorList] 列表已加载', 'success');
                return 'loaded';
            }
            await sleep(800);
        }
        log('[waitForProtectorList] 超时', 'error');
        return 'timeout';
    }

    // --- 护道者选择与雇佣 ---
    const SUB_REALM_ORDER = {
        '前期': 1, '中期': 2, '后期': 3, '大圆满': 4,
        '一劫仙人': 1, '二劫仙人': 2, '三劫仙人': 3, '四劫仙人': 4,
        '五劫仙人': 5, '六劫仙人': 6, '七劫仙人': 7, '八劫仙人': 8, '九劫仙人': 9,
    };

    function getSubRealmTier(realm) {
        for (const [suffix, tier] of Object.entries(SUB_REALM_ORDER)) {
            if (realm.endsWith(suffix)) return tier;
        }
        return 0;
    }

    function matchProtector(prot, rule) {
        if (rule.nameMatch && !prot.name.includes(rule.nameMatch)) return false;
        if (rule.excludeName && prot.name.includes(rule.excludeName)) return false;
        if (rule.realmMatch && !rule.realmMatch.split('|').some(k => prot.realm.includes(k))) return false;
        if (rule.realmContains && !prot.realm.includes(rule.realmContains)) return false;
        return true;
    }

    function selectProtectors(protectors, priorities) {
        const result = [];
        const seen = new Set();
        function addMatched(matched, label) {
            for (const p of matched) {
                if (seen.has(p.index)) continue;
                seen.add(p.index);
                result.push({ ...p, priority: label });
            }
        }
        for (const rule of priorities) {
            const realmKey = rule.realmMatch || rule.realmContains;
            const nameKey = rule.nameMatch;
            if (nameKey && nameKey.includes('|')) {
                for (const keyword of nameKey.split('|')) {
                    const matched = protectors.filter(p => p.name.includes(keyword));
                    matched.sort((a, b) => b.attack - a.attack);
                    addMatched(matched, keyword);
                }
            } else if (realmKey && realmKey.includes('|')) {
                for (const keyword of realmKey.split('|')) {
                    const matched = protectors.filter(p => p.realm.includes(keyword));
                    matched.sort((a, b) => {
                        const tierDiff = getSubRealmTier(b.realm) - getSubRealmTier(a.realm);
                        return tierDiff !== 0 ? tierDiff : b.attack - a.attack;
                    });
                    addMatched(matched, keyword);
                }
            } else {
                const matched = protectors.filter(p => matchProtector(p, rule));
                if (realmKey) {
                    matched.sort((a, b) => {
                        const tierDiff = getSubRealmTier(b.realm) - getSubRealmTier(a.realm);
                        return tierDiff !== 0 ? tierDiff : b.attack - a.attack;
                    });
                } else if (rule.sortBy === 'attack') {
                    matched.sort((a, b) => rule.sortOrder === 'asc' ? a.attack - b.attack : b.attack - a.attack);
                }
                addMatched(matched, nameKey || realmKey || 'unknown');
            }
        }
        return result;
    }

    async function findAndHireProtector(attempt) {
        if (!window.__monitorRunning) return false;
        const protectorPriorities = config.protectors.priorities;
        const maxRetries = config.protectors.maxRetries;
        const retryDelay = config.protectors.retryDelayMs;

        // Parse all protectors
        const items = document.querySelectorAll('.protector-card');
        if (items.length === 0) {
            if (!window.__monitorRunning) return false;
            if (attempt < maxRetries) {
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`, 'action');
                dismissModal();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                clickHireProtector();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                const loaded = await waitForProtectorList(8000);
                if (loaded === 'timeout') return false;
                return await findAndHireProtector(attempt + 1);
            }
            log(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`, 'error');
            return false;
        }

        const protectors = [];
        items.forEach((item, index) => {
            const nameEl = item.querySelector('.prot-name');
            const realmEl = item.querySelector('.prot-realm');
            const statsEl = item.querySelector('.prot-stats');
            if (!nameEl) return;
            const name = nameEl.textContent.replace(realmEl ? realmEl.textContent : '', '').trim();
            const realm = realmEl ? realmEl.textContent.trim() : '';
            let attack = 0;
            if (statsEl) {
                const atkMatch = statsEl.textContent.match(/攻\s*(\d+)/);
                if (atkMatch) attack = parseInt(atkMatch[1]);
            }
            protectors.push({ name, realm, attack, index });
        });

        const selected = selectProtectors(protectors, protectorPriorities);
        if (!selected || selected.length === 0) {
            if (!window.__monitorRunning) return false;
            if (attempt < maxRetries) {
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`, 'action');
                dismissModal();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                clickHireProtector();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                const loaded = await waitForProtectorList(8000);
                if (loaded === 'timeout') return false;
                return await findAndHireProtector(attempt + 1);
            }
            log(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`, 'error');
            return false;
        }

        // Try each candidate in priority order
        for (let i = 0; i < selected.length; i++) {
            if (!window.__monitorRunning) return false;
            const candidate = selected[i];
            log(`[尝试${attempt}] 选择: ${candidate.name} ${candidate.realm} 攻击:${candidate.attack} (${candidate.priority})`, 'info');

            // Hook fetch to capture hire response (only intercept hire API)
            window.__hireResponse = null;
            const origFetch = window.fetch;
            window.fetch = async function (...args) {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                const resp = await origFetch.apply(this, args);
                if (url.includes('encounter-hire-protector')) {
                    try {
                        const clone = resp.clone();
                        const data = await clone.json();
                        window.__hireResponse = data;
                    } catch (e) { }
                }
                return resp;
            };
            let resp;
            try {
                // Click the hire button based on config (协同 or 单独)
                if (items[candidate.index]) {
                    const btns = items[candidate.index].querySelectorAll('.prot-btn');
                    const wantSolo = config.protectors.hireMode === 'solo';
                    for (const btn of btns) {
                        const text = btn.textContent.trim();
                        if (wantSolo) {
                            if (text.includes('单独') || text.includes('单 独')) {
                                btn.click();
                                log(' 已点击单独', 'action');
                                break;
                            }
                        } else {
                            if (text.includes('协同') || text.includes('协 同')) {
                                btn.click();
                                log(' 已点击协同', 'action');
                                break;
                            }
                        }
                    }
                }
                await sleep(800);
                if (!window.__monitorRunning) return false;

                resp = window.__hireResponse;
            } finally {
                window.fetch = origFetch;
                window.__hireResponse = null;
            }
            let hireResult;
            if (!resp) {
                hireResult = { status: 'no_response' };
            } else if (resp.code === 400) {
                hireResult = { status: 'failed', message: resp.message || '雇佣失败' };
            } else {
                hireResult = { status: 'success' };
            }

            if (hireResult.status === 'failed') {
                log(` 雇佣失败(code=400): ${hireResult.message}`, 'error');
                log(' 刷新列表重新雇佣...', 'action');
                if (!window.__monitorRunning) return false;
                dismissModal();
                await sleep(800);
                if (!window.__monitorRunning) return false;
                clickHireProtector();
                await sleep(800);
                if (!window.__monitorRunning) return false;
                const loaded = await waitForProtectorList(8000);
                if (loaded === 'loaded' || loaded === 'empty') {
                    return await findAndHireProtector(attempt + 1);
                }
                return false;
            }

            if (hireResult.status === 'success') {
                log(' 雇佣成功！', 'success');
                return true;
            }

            // No response, check toast
            const toast = window.__lastToast || '';
            if (toast) {
                log(` 护道者提示: ${toast}`, 'info');
            }
            log(' 雇佣完成（无明确响应）', 'warn');
            return true;
        }

        // All candidates in this attempt failed
        if (!window.__monitorRunning) return false;
        if (attempt < maxRetries) {
            log(`[尝试${attempt}] 当前列表所有护道者不可用，刷新...`, 'action');
            dismissModal();
            await sleep(retryDelay);
            if (!window.__monitorRunning) return false;
            clickHireProtector();
            await sleep(retryDelay);
            if (!window.__monitorRunning) return false;
            const loaded = await waitForProtectorList(8000);
            if (loaded === 'timeout') return false;
            return await findAndHireProtector(attempt + 1);
        }
        log(`[尝试${attempt}] ${maxRetries}次尝试均失败`, 'error');
        return false;
    }

    // --- 辅助: 点击确认按钮 ---
    async function clickConfirm() {
        const start = Date.now();
        while (Date.now() - start < 5000) {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
                if (btn.offsetParent === null) continue;
                const t = btn.textContent.trim();
                if ((t === '确 定' || t === '确定' || t === '确认') && !t.includes('选择')) {
                    btn.click();
                    return true;
                }
            }
            await sleep(800);
        }
        return false;
    }

    // --- 辅助: 关闭模态对话框 ---
    function dismissModal() {
        const btns = document.querySelectorAll('.modal-btn--outline');
        for (const btn of btns) {
            if (btn.offsetParent !== null && btn.textContent.trim().includes('取')) {
                btn.click();
                break;
            }
        }
    }

    // --- 辅助: 点击雇佣护道按钮 ---
    function clickHireProtector() {
        const overlay = document.getElementById('encounterOverlay');
        if (!overlay) return;
        const btns = overlay.querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.trim() === '雇佣护道') {
                btn.click();
                return;
            }
        }
    }

    // --- 关闭打赏弹窗 ---
    async function dismissTipDialog(timeout = 3000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__monitorRunning) return false; // 脚本停止时立即退出
            const modal = document.getElementById('gameDialogModal');
            if (modal && getComputedStyle(modal).display !== 'none' && modal.textContent.includes('打赏')) {
                const btns = modal.querySelectorAll('button');
                for (const btn of btns) {
                    const t = btn.textContent.trim();
                    if (t === '取 消' || t === '取消') {
                        btn.click();
                        return true;
                    }
                }
            }
            await sleep(300);
        }
        return false;
    }

    // --- 商人逻辑 ---
    let shopping = false;
    let dying = false;
    async function handleMerchant() {
        if (shopping) return;
        if (!window.__monitorRunning) return;
        shopping = true;
        try {
            log('遇到云游商人！', 'info');
            if (!window.__monitorRunning) { shopping = false; return; }
            const mcfg = config.merchant;
            const items = document.querySelectorAll('.merchant-item');
            if (items.length === 0) {
                shopping = false;
                return;
            }
            const allItems = [];
            items.forEach(item => {
                const nameEl = item.querySelector('.merchant-item__name');
                const btnEl = item.querySelector('.merchant-item__buy-btn');
                if (!nameEl || !btnEl) return;
                const name = nameEl.textContent.trim();
                const priceMatch = btnEl.textContent.match(/(\d+)/);
                const price = priceMatch ? parseInt(priceMatch[1]) : 0;
                allItems.push({ name, price });
            });

            let bought = null;
            // 优先级1: 高价物品
            const expensiveItems = allItems.filter(i => i.price > mcfg.highPriceThreshold);
            if (expensiveItems.length > 0) {
                expensiveItems.sort((a, b) => b.price - a.price);
                clickBuyItem(expensiveItems[0].name);
                bought = { ...expensiveItems[0], reason: '高价物品' };
            }
            // 优先级2: 关键词商品（洗炼石、卷轴等，按配置顺序）
            if (!bought) {
                const itemKeywords = mcfg.itemKeywords || [];
                // 第一层：找有品质的关键词商品
                for (const kw of itemKeywords) {
                    for (const quality of mcfg.stonePriority) {
                        const item = allItems.find(i => i.name.includes(quality) && i.name.includes(kw));
                        if (item) {
                            clickBuyItem(item.name);
                            bought = { ...item, reason: kw };
                            break;
                        }
                    }
                    if (bought) break;
                }
                // 第二层兜底：找纯关键词商品（无品质前缀）
                if (!bought) {
                    for (const kw of itemKeywords) {
                        const item = allItems.find(i => i.name.includes(kw));
                        if (item) {
                            clickBuyItem(item.name);
                            bought = { ...item, reason: kw };
                            break;
                        }
                    }
                }
            }
            // 优先级3: 买最贵的
            if (!bought && mcfg.fallbackToExpensive && allItems.length > 0) {
                const sorted = [...allItems].sort((a, b) => b.price - a.price);
                clickBuyItem(sorted[0].name);
                bought = { ...sorted[0], reason: '最贵物品' };
            }
            // 未购买任何商品，点击婉拒关闭
            if (!bought) {
                log('无可购买商品，婉拒告辞', 'info');
                const leaveBtn = document.getElementById('merchantLeaveBtn');
                if (leaveBtn) leaveBtn.click();
            }

            // 等待商人弹窗消失，防止重复处理
            for (let i = 0; i < 10; i++) {
                await sleep(100);
                const stillVisible = document.querySelector('.modal-overlay:not([style*="display: none"]) .merchant-item');
                if (!stillVisible) break;
            }

            // Log
            log('商人物品列表:', 'info');
            allItems.forEach(item => log(` ${item.name} (${item.price}灵石)`, 'info'));
            if (bought) {
                log(`购买: ${bought.name} (${bought.price}灵石) [${bought.reason}]`, 'success');
            }
            log('云游商人已处理', 'success');
        } catch (e) {
            log('商人错误: ' + e.message, 'error');
        }
        shopping = false;
    }

    function clickBuyItem(itemName) {
        const itemElements = document.querySelectorAll('.merchant-item');
        for (const el of itemElements) {
            const nameEl = el.querySelector('.merchant-item__name');
            if (nameEl && nameEl.textContent.trim() === itemName) {
                el.querySelector('.merchant-item__buy-btn').click();
                return;
            }
        }
    }

    // --- 逃跑逻辑 ---
    let hiring = false;
    let lastEncounterTime = 0;
    async function tryEscape(maxAttempts = 5) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            // 检查是否已停止
            if (!window.__monitorRunning) {
                log('脚本已停止，退出逃跑流程', 'warn');
                return false;
            }
            log(`逃跑尝试 ${attempt}/${maxAttempts}...`, 'action');
            // Click 逃跑 button
            const overlay = document.getElementById('encounterOverlay');
            let clicked = false;
            if (overlay) {
                const btns = overlay.querySelectorAll('button');
                for (const btn of btns) {
                    if (btn.textContent.trim() === '逃跑') {
                        btn.click();
                        clicked = true;
                        break;
                    }
                }
            }
            if (!clicked) {
                log('未找到逃跑按钮', 'error');
                return false;
            }

            // 等待800ms后检查遭遇面板是否还在
            await sleep(800);
            if (!window.__monitorRunning) {
                log('脚本已停止，退出逃跑流程', 'warn');
                return false;
            }
            const o = document.getElementById('encounterOverlay');
            const stillVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
            if (!stillVisible) {
                log('逃跑成功！', 'success');
                return true;
            }
            log('逃跑失败，遭遇面板仍在，继续尝试...', 'warn');
            await sleep(500);
        }
        log(`${maxAttempts}次逃跑均失败`, 'error');
        return false;
    }

    // --- 雇佣护道者主流程 ---
    async function hireProtector() {
        if (hiring) return;
        if (!window.__monitorRunning) return;
        hiring = true;
        const now = Date.now();
        if (now - lastEncounterTime < 3000) {
            hiring = false;
            return;
        }
        lastEncounterTime = now;
        try {
            log('遭遇妖兽！开始雇佣流程...', 'info');
            if (!window.__monitorRunning) return;
            const overlay = document.getElementById('encounterOverlay');
            if (!overlay) {
                log('未找到遭遇界面', 'error');
                return;
            }

            const overlayBtns = overlay.querySelectorAll('button');
            let step1 = false;
            for (const btn of overlayBtns) {
                if (btn.textContent.trim() === '雇佣护道') {
                    btn.click();
                    step1 = true;
                    break;
                }
            }
            if (!step1) {
                log('未找到雇佣护道按钮', 'error');
                return;
            }
            log('已点击雇佣护道', 'action');
            if (!window.__monitorRunning) return;
            const loaded = await waitForProtectorList(8000);
            if (!window.__monitorRunning) return;
            if (loaded === 'empty') {
                dismissModal();
                await sleep(800);
                if (!window.__monitorRunning) return;

                if (config.protectors.onNoProtector === 'escape') {
                    log('暂无空闲护道者，尝试逃跑...', 'info');
                    const escaped = await tryEscape();
                    if (!window.__monitorRunning) return;

                    if (escaped) {
                        if (config.protectors.afterEscape === 'stop') {
                            log('逃跑成功！点击冥想修炼...', 'success');
                            const btns = document.querySelectorAll('button');
                            for (const btn of btns) {
                                if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                                    btn.click();
                                    break;
                                }
                            }
                            log('已逃跑并进入冥想，脚本停止', 'success');
                            window.__monitorRunning = false;
                            if (window.__monitorInterval) {
                                clearInterval(window.__monitorInterval);
                                window.__monitorInterval = null;
                            }
                            syncStopUI();
                        } else {
                            log('逃跑成功！继续监控...', 'success');
                        }
                    } else {
                        log('逃跑失败，继续监控...', 'warn');
                    }
                    return;
                }

                // onNoProtector === 'fight'
                const threshold = config.protectors.fightAttackThreshold;
                if (threshold > 0) {
                    const atkEl = document.getElementById('encounterMonsterAtk');
                    if (atkEl) {
                        const enemyAttack = parseInt(atkEl.textContent);
                        if (enemyAttack > threshold) {
                            log(`妖兽攻击${enemyAttack}超过阈值${threshold}，转为逃跑...`, 'warn');
                            if (!window.__monitorRunning) return;
                            const escaped = await tryEscape();
                            if (!window.__monitorRunning) return;

                            if (escaped) {
                                if (config.protectors.afterEscape === 'stop') {
                                    log('逃跑成功！点击冥想修炼...', 'success');
                                    const btns = document.querySelectorAll('button');
                                    for (const btn of btns) {
                                        if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                                            btn.click();
                                            break;
                                        }
                                    }
                                    log('妖兽攻击超过阈值，已逃跑并进入冥想，脚本停止', 'success');
                                    window.__monitorRunning = false;
                                    if (window.__monitorInterval) {
                                        clearInterval(window.__monitorInterval);
                                        window.__monitorInterval = null;
                                    }
                                    syncStopUI();
                                } else {
                                    log('逃跑成功！继续监控...', 'success');
                                }
                            } else {
                                log('逃跑失败，继续监控...', 'warn');
                            }
                            return;
                        }
                    }
                }

                log('暂无空闲护道者，选择迎战...', 'info');
                if (!window.__monitorRunning) return;
                const fightOverlay = document.getElementById('encounterOverlay');
                if (fightOverlay) {
                    const btns = fightOverlay.querySelectorAll('button');
                    for (const btn of btns) {
                        if (btn.textContent.trim() === '迎战') {
                            btn.click();
                            break;
                        }
                    }
                }
                log('已点击迎战，等待战斗结束...', 'action');
                const battleStart = Date.now();
                while (Date.now() - battleStart < 60000) {
                    if (!window.__monitorRunning) return;
                    const o = document.getElementById('encounterOverlay');
                    const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                    if (!overlayVisible) break;
                    await sleep(800);
                }
                log('战斗结束', 'success');
                if (!window.__monitorRunning) return;
                const tipDismissed = await dismissTipDialog(2000);
                if (tipDismissed) log('已关闭打赏弹窗', 'info');
                return;
            }

            if (loaded === 'timeout') {
                log('护道者列表加载超时', 'error');
                return;
            }

            // loaded === 'loaded' - 执行雇佣逻辑
            const hired = await findAndHireProtector(1);
            if (!window.__monitorRunning) return;
            if (!hired) {
                log('雇佣失败，无合适人选', 'error');
                return;
            }

            log('等待战斗结束...', 'action');
            const battleStart = Date.now();
            while (Date.now() - battleStart < 60000) {
                if (!window.__monitorRunning) return;
                const o = document.getElementById('encounterOverlay');
                const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                if (!overlayVisible) break;
                if (Date.now() - battleStart > 10000) {
                    log('战斗超时10秒，重新雇佣...', 'warn');
                    if (!window.__monitorRunning) return;
                    hiring = false;
                    await sleep(800);
                    await hireProtector();
                    return;
                }
                await sleep(800);
            }
            log('战斗结束', 'success');
            if (!window.__monitorRunning) return;

            const tipDismissed = await dismissTipDialog(2000);
            if (tipDismissed) log('已关闭打赏弹窗', 'info');

        } catch (e) {
            log('错误: ' + e.message, 'error');
        } finally {
            hiring = false;
        }
    }

    // --- 死亡复活流程 ---
    async function handleDeath() {
        log('检测到死亡画面，点击引渡归来...', 'info');
        await sleep(300);
        const deathOverlay = document.getElementById('deathOverlay');
        if (!deathOverlay) return;
        const btns = deathOverlay.querySelectorAll('button');
        let revived = false;
        for (const btn of btns) {
            if (btn.textContent.includes('引渡归来')) {
                btn.click();
                revived = true;
                break;
            }
        }
        if (!revived) return;
        log('已点击引渡归来，等待复活...', 'action');
        await sleep(800);

        // 移动到第四个地图节点
        log('点击地图按钮...', 'action');
        const iconBtns = document.querySelectorAll('.btn-icon');
        for (const btn of iconBtns) {
            if (btn.textContent.includes('地图')) {
                btn.click();
                break;
            }
        }
        await sleep(1000);

        // Hook _uw.fetch 拦截移动响应
        window.__moveResponse = null;
        const origMoveFetch = _uw.fetch;
        _uw.fetch = async function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            const resp = await origMoveFetch.apply(this, args);
            if (url.includes('/api/game/move')) {
                try {
                    const clone = resp.clone();
                    const data = await clone.json();
                    if (data.code === 200 && typeof data.data === 'string') {
                        window.__moveResponse = data;
                    }
                } catch (e) { }
            }
            return resp;
        };

        try {
            const nodes = document.querySelectorAll('.map-node');
            if (nodes.length >= 4) {
                const nameEl = nodes[3].querySelector('.map-node-name');
                const mapName = nameEl ? nameEl.textContent.trim() : '第四个地图';
                log(`点击第四个地图: ${mapName}...`, 'action');
                nodes[3].click();
            }

            // 等待移动响应（最多5秒）
            for (let i = 0; i < 25; i++) {
                await sleep(200);
                if (window.__moveResponse) break;
            }

            if (window.__moveResponse) {
                log(window.__moveResponse.data, 'success');
            } else {
                log('移动超时，未收到响应', 'warn');
            }
        } finally {
            _uw.fetch = origMoveFetch;
            window.__moveResponse = null;
        }
        await sleep(300);

        log('死亡后流程完成，继续监控...', 'success');
        toggleAutoCheckbox(true);
    }

    // --- 主监控循环 ---
    function startMonitorLoop() {
        window.__monitorInterval = setInterval(async () => {
            try {
                if (!window.__monitorRunning) return;

                // Check for death overlay first
                const d = document.getElementById('deathOverlay');
                if (d && getComputedStyle(d).display !== 'none' && d.querySelector('.btn-revive') && !dying) {
                    dying = true;
                    await handleDeath();
                    dying = false;
                    return;
                }

                // Check for encounter overlay
                const o = document.getElementById('encounterOverlay');
                if (o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null && !hiring) {
                    await hireProtector();
                    return;
                }

                // Check for merchant
                const overlays = document.querySelectorAll('.modal-overlay');
                for (const overlay of overlays) {
                    if (getComputedStyle(overlay).display === 'none') continue;
                    if (overlay.querySelector('.merchant-item') && overlay.querySelector('#merchantLeaveBtn')) {
                        if (!shopping) await handleMerchant();
                        return;
                    }
                }

                // 检测神识不足（由 showToast 拦截实时设置标志）
                if (window.__shenshiInsufficient) {
                    window.__shenshiInsufficient = false;
                    log('检测到神识不足...', 'info');

                    // 检查是否启用高级冥想
                    const useHighLevelMeditate = config.general.highLevelMeditate;
                    let instantMeditateOk = false;

                    if (useHighLevelMeditate) {
                        log('尝试高级冥想...', 'info');
                        try {
                            const data = await callApi('POST', '/api/game/meditate/instant', { grade: 2 });
                            if (data && (data.code === 0 || data.code === 200)) {
                                instantMeditateOk = true;
                                log('高级冥想成功，点击冥想修炼...', 'success');
                                await sleep(500);
                                const medBtnOk = document.getElementById('meditateBtn');
                                if (medBtnOk && !medBtnOk.classList.contains('meditating')) {
                                    medBtnOk.click();
                                }
                                await sleep(500);
                                const stopBtns = document.querySelectorAll('button');
                                for (const btn of stopBtns) {
                                    if (btn.textContent.trim() === '收功') {
                                        btn.click();
                                        log('已点击收功', 'action');
                                        break;
                                    }
                                }
                                // 轮询等待冥想完全停止
                                for (let i = 0; i < 20; i++) {
                                    await sleep(1500);
                                    const medBtn = document.getElementById('meditateBtn');
                                    const isMeditating = medBtn && medBtn.classList.contains('meditating');
                                    if (!isMeditating) break;
                                    const sb = document.querySelector('.btn-stop-meditate');
                                    if (sb) {
                                        log('检测到重新冥想，再次收功...', 'action');
                                        sb.click();
                                    }
                                }
                                toggleAutoCheckbox(true);
                                log('已勾选自动', 'action');
                            } else {
                                log('高级冥想失败: ' + (data?.message || '未知原因') + '，转为冥想修炼', 'warn');
                            }
                        } catch (e) {
                            log('高级冥想异常: ' + e.message + '，转为冥想修炼', 'error');
                        }
                    } else {
                        log('高级冥想已关闭，转为普通冥想...', 'info');
                    }

                    if (instantMeditateOk) {
                        // 高级冥想成功，神识已恢复，继续监控
                        return;
                    }

                    // 高级冥想失败，走原有流程：点击冥想修炼并停止脚本
                    if (window._autoExploreRunning) {
                        window.stopAutoExplore('神识不足', false);
                    }
                    const medBtn = document.getElementById('meditateBtn');
                    if (medBtn && !medBtn.classList.contains('meditating')) {
                        medBtn.click();
                    }
                    toggleAutoCheckbox(false);
                    window.__monitorRunning = false;
                    if (window.__monitorInterval) {
                        clearInterval(window.__monitorInterval);
                        window.__monitorInterval = null;
                    }
                    syncStopUI();
                    log('神识不足，已自动冥想并停止脚本', 'warn');
                    return;
                }
            } catch (e) {
                /* ignore */
            }
        }, 500);
    }

    // --- 初始化 ---
    createPanel();
    log('监控已加载，等待启动...', 'info');
})();
