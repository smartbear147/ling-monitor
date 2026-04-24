// ==UserScript==
// @name 灵界自动监控
// @namespace https://ling.muge.info
// @version 1.0.1
// @description 自动雇佣护道者、购买商人物品、死亡复活、关闭打赏弹窗，支持手机端拖拽
// @match https://ling.muge.info/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @grant unsafeWindow
// @run-at document-idle
// ==/UserScript==

(function () {
    'use strict';

    // --- 主题样式 ---
    GM_addStyle(`
        /* === 主题变量 (跟随页面亮暗模式) === */
        html.theme-dark #monitor-panel,
        html:not(.theme-light) #monitor-panel {
            --mp-bg: #0e1525;
            --mp-bg-section: #151d2e;
            --mp-bg-deep: #111827;
            --mp-text: #e8e0d0;
            --mp-text-bright: #f0ece4;
            --mp-text-secondary: #a8a090;
            --mp-text-muted: #6a6560;
            --mp-accent: #c9993a;
            --mp-accent-dim: rgba(201,153,58,0.2);
            --mp-accent-glow: rgba(201,153,58,0.08);
            --mp-accent-subtle: rgba(201,153,58,0.05);
            --mp-red: #EF4444;
            --mp-red-subtle: rgba(239,68,68,0.15);
            --mp-blue: #3B82F6;
            --mp-gray: #6a6560;
            --mp-border: rgba(201,153,58,0.1);
            --mp-border-strong: rgba(201,153,58,0.2);
            --mp-hover: rgba(201,153,58,0.08);
            --mp-input-bg: #0e1525;
            --mp-input-border: rgba(201,153,58,0.15);
            --mp-scrollbar: #1a2540;
            --mp-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--mp-accent-glow);
            --mp-header-grad: linear-gradient(135deg, #111827 0%, #0a0f1c 100%);
        }
        html.theme-light #monitor-panel {
            --mp-bg: #f0efed;
            --mp-bg-section: #eeedeb;
            --mp-bg-deep: #eeedeb;
            --mp-text: #1a1a1a;
            --mp-text-bright: #1a1a1a;
            --mp-text-secondary: #4a5a5a;
            --mp-text-muted: #8a9090;
            --mp-accent: #16A34A;
            --mp-accent-dim: rgba(22,163,74,0.3);
            --mp-accent-glow: rgba(22,163,74,0.08);
            --mp-accent-subtle: rgba(22,163,74,0.05);
            --mp-red: #DC2626;
            --mp-red-subtle: rgba(220,38,38,0.12);
            --mp-blue: #2563EB;
            --mp-gray: #8a9090;
            --mp-border: rgba(60,60,60,0.12);
            --mp-border-strong: rgba(60,60,60,0.2);
            --mp-hover: rgba(60,60,60,0.05);
            --mp-input-bg: #eeedeb;
            --mp-input-border: rgba(60,60,60,0.2);
            --mp-scrollbar: rgba(60,60,60,0.2);
            --mp-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
            --mp-header-grad: linear-gradient(135deg, #eae9e7 0%, #f3f2f0 100%);
        }

        /* === 面板整体 === */
        #monitor-panel {
            position: fixed; top: 10px; right: 10px; width: 320px;
            max-width: calc(100vw - 20px);
            background: var(--mp-bg);
            border: 1px solid var(--mp-accent-dim);
            border-radius: 12px; z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
            font-size: 12px; font-weight: 500;
            color: var(--mp-text);
            box-shadow: var(--mp-shadow);
            overflow: hidden;
            transition: width 0.2s ease;
        }
        #monitor-panel.minimized #monitor-body { display: none; }
        #monitor-panel.minimized { width: auto; min-width: 180px; }

        /* === 头部 === */
        #monitor-header {
            cursor: move; padding: 10px 14px;
            background: var(--mp-header-grad);
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--mp-border);
            user-select: none;
        }
        #monitor-header > span:first-child {
            font-weight: 600; color: var(--mp-text-bright); font-size: 13px; letter-spacing: 0.5px;
        }
        #monitor-status { font-size: 11px; font-weight: 500; letter-spacing: 0.3px; }
        #monitor-status.status-stopped { color: var(--mp-red); }
        #monitor-status.status-running { color: var(--mp-accent); }
        #monitor-minimize {
            cursor: pointer; font-size: 14px; color: var(--mp-text-secondary);
            width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
            border-radius: 6px; transition: background 0.15s, color 0.15s;
        }
        #monitor-minimize:hover { background: var(--mp-hover); color: var(--mp-text); }

        /* === 日志区域 === */
        #monitor-log {
            padding: 8px 12px; max-height: 200px; overflow-y: auto;
            background: var(--mp-bg-deep);
            scrollbar-width: thin; scrollbar-color: var(--mp-scrollbar) transparent;
        }
        #monitor-log::-webkit-scrollbar { width: 4px; }
        #monitor-log::-webkit-scrollbar-track { background: transparent; }
        #monitor-log::-webkit-scrollbar-thumb { background: var(--mp-scrollbar); border-radius: 2px; }
        #monitor-log > div {
            padding: 3px 0; border-bottom: 1px solid var(--mp-border);
            word-break: break-all; color: var(--mp-text-secondary); font-size: 11px; line-height: 1.5;
        }
        #monitor-log > div:last-child { border-bottom: none; }

        /* === 底部按钮栏 === */
        #monitor-body > div:last-child {
            padding: 8px 12px; border-top: 1px solid var(--mp-border);
            display: flex; gap: 6px; background: var(--mp-bg);
        }
        #monitor-toggle, #monitor-config, #monitor-clear {
            flex: 1; padding: 7px 4px; color: #fff; border: none; border-radius: 8px;
            cursor: pointer; font-size: 11px; font-weight: 500;
            transition: filter 0.15s, transform 0.1s;
            font-family: inherit;
        }
        #monitor-toggle:active, #monitor-config:active, #monitor-clear:active {
            transform: scale(0.97);
        }
        #monitor-toggle.btn-start { background: var(--mp-accent); }
        #monitor-toggle.btn-start:hover { filter: brightness(1.15); }
        #monitor-toggle.btn-stop  { background: var(--mp-red); }
        #monitor-toggle.btn-stop:hover { filter: brightness(1.15); }
        #monitor-config { background: var(--mp-blue); }
        #monitor-config:hover { filter: brightness(1.15); }
        #monitor-clear  { background: var(--mp-gray); }
        #monitor-clear:hover { filter: brightness(1.2); }

        /* === 配置面板 === */
        #config-panel {
            width: 100%; max-height: 50vh; overflow-y: auto;
            background: var(--mp-bg);
            border-top: 1px solid var(--mp-border);
            font-family: inherit; font-size: 12px;
            color: var(--mp-text);
            padding: 12px; padding-bottom: 30px; box-sizing: border-box;
            position: relative;
            scrollbar-width: thin; scrollbar-color: var(--mp-scrollbar) transparent;
        }
        #config-panel::-webkit-scrollbar { width: 4px; }
        #config-panel::-webkit-scrollbar-thumb { background: var(--mp-scrollbar); border-radius: 2px; }
        #config-panel .cfg-bottom-bar {
            position: relative; bottom: 0px; left: 0; right: 0;
            background: transparent;
            padding: 12px 0 0; border-top: none;
            display: flex; gap: 8px;
        }
        #config-panel label { color: var(--mp-accent); font-weight: 500; font-size: 11px; }
        #config-panel .cfg-title { font-weight: 600; color: var(--mp-text-bright); font-size: 13px; letter-spacing: 0.3px; }
        #config-panel .cfg-section {
            margin-bottom: 14px; padding: 10px 12px;
            background: var(--mp-bg-section); border-radius: 8px;
            border: 1px solid var(--mp-border);
        }
        #config-panel .cfg-section-label {
            font-size: 10px; font-weight: 600; color: var(--mp-text-muted);
            text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 8px;
        }
        #config-panel input[type=number],
        #config-panel input[type=text],
        #config-panel select,
        #config-panel textarea {
            background: var(--mp-input-bg); color: var(--mp-text);
            border: 1px solid var(--mp-input-border); padding: 5px 8px; border-radius: 6px;
            font-family: inherit; font-size: 11px;
            transition: border-color 0.15s;
            width: 100%; box-sizing: border-box;
        }
        #config-panel input:focus, #config-panel select:focus {
            outline: none; border-color: var(--mp-accent);
            box-shadow: 0 0 0 2px var(--mp-accent-glow);
        }
        #config-panel textarea { font-family: monospace; font-size: 11px; }
        #config-panel .cfg-row { margin-bottom: 10px; }
        #config-panel .cfg-row label { display: block; margin-bottom: 4px; }
        #cfg-save {
            flex: 1; padding: 8px 0; background: var(--mp-accent);
            color: #fff; border: none; border-radius: 8px; cursor: pointer;
            font-weight: 600; font-family: inherit; font-size: 12px;
            transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
            box-shadow: 0 2px 8px var(--mp-accent-dim);
        }
        #cfg-save:hover { filter: brightness(1.15); box-shadow: 0 4px 12px var(--mp-accent-dim); }
        #cfg-save:active { transform: scale(0.97); }
        #cfg-reset {
            flex: 1; padding: 8px 0;
            background: var(--mp-bg-section);
            color: var(--mp-text-secondary);
            border: 1px solid var(--mp-border-strong); border-radius: 8px;
            cursor: pointer; font-weight: 500; font-family: inherit; font-size: 12px;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        #cfg-reset:hover { background: var(--mp-bg-deep); color: var(--mp-text); border-color: var(--mp-text-muted); }
        #cfg-reset:active { transform: scale(0.97); }

        /* === 优先级列表 === */
        .priority-list { display: flex; flex-direction: column; gap: 4px; }
        .priority-row {
            display: flex; align-items: center; gap: 4px;
            background: var(--mp-bg-deep); border: 1px solid var(--mp-border-strong);
            border-radius: 6px; padding: 5px 8px;
            transition: border-color 0.15s;
        }
        .priority-row:hover { border-color: var(--mp-text-muted); }
        .priority-row.dragging { opacity: 0.4; }
        .priority-row.drag-over { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
        .priority-handle { cursor: grab; color: var(--mp-text-muted); font-size: 14px; user-select: none; }
        #config-panel .priority-row .priority-type {
            background: var(--mp-input-bg) !important; color: var(--mp-text);
            border: 1px solid var(--mp-border-strong); border-radius: 5px;
            padding: 3px 8px; font-size: 11px; font-family: inherit;
            width: 56px !important; min-width: 56px !important; max-width: 56px !important;
            height: 26px; box-sizing: border-box;
            flex-shrink: 0; flex-grow: 0;
            appearance: none; -webkit-appearance: none;
            text-align: center; text-align-last: center;
        }
        #config-panel .priority-row .priority-keyword {
            flex: 1; min-width: 0; background: var(--mp-input-bg) !important;
            color: var(--mp-text); border: 1px solid var(--mp-border-strong);
            border-radius: 5px; padding: 3px 8px; font-size: 11px; font-family: inherit;
            height: 26px; box-sizing: border-box;
        }
        .priority-keyword:focus { outline: none; border-color: var(--mp-accent); }
        .priority-del {
            cursor: pointer; color: var(--mp-red); font-size: 14px;
            font-weight: bold; user-select: none; padding: 0 4px;
            width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
            border-radius: 4px; transition: background 0.15s;
        }
        .priority-del:hover { background: var(--mp-red-subtle); }
        .priority-add {
            cursor: pointer; color: var(--mp-accent); font-size: 11px; font-weight: 500;
            text-align: center; padding: 6px; border: 1px dashed var(--mp-border-strong);
            border-radius: 6px; margin-top: 4px;
            transition: border-color 0.15s, background 0.15s;
        }
        .priority-add:hover { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
    `);

    // --- 默认配置 ---
    const DEFAULT_CONFIG = {
        protectors: {
            priorities: [
                { nameMatch: '阿道夫', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期三劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期二劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期一劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期大圆满', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期后期', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期中期', sortBy: 'attack', sortOrder: 'desc' },
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
            stonePriority: ['传说', '史诗', '稀有', '优良', '普通'],
            stoneKeywords: ['洗炼石'],
            scrollKeywords: ['空白卷轴'],
            fallbackToExpensive: true,
        },
    };

    // --- 配置读写 ---
    function loadConfig() {
        const saved = GM_getValue('ling_config', null);
        const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        if (saved) {
            try {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                // 合并默认配置，确保缺失字段有默认值
                return { ...defaults, ...parsed, merchant: { ...defaults.merchant, ...(parsed.merchant || {}) } };
            } catch (e) { /* fallback */ }
        }
        return defaults;
    }

    function saveConfig(cfg) {
        GM_setValue('ling_config', JSON.stringify(cfg));
    }

    let config = loadConfig();

    // --- 工具函数 ---
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(msg);
        if (typeof window.__monitorLog === 'function') {
            window.__monitorLog(msg);
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

    // --- Toast 拦截 (用 unsafeWindow 绑定到页面真实 window) ---
    const _uw = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
    window.__lastToast = '';
    window.__lastToastTime = 0;
    const originalShowToast = _uw.showToast;
    _uw.showToast = function (msg) {
        window.__lastToast = msg;
        window.__lastToastTime = Date.now();
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
            btn.className = 'btn-start';
        }
        if (status) {
            status.textContent = '已停止';
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
            <div id="monitor-header">
                <span>自动监控</span>
                <span style="display:flex;align-items:center;gap:8px;">
                    <span id="monitor-status" class="status-stopped">已停止</span>
                    <span id="monitor-minimize" title="缩小">&#x25BC;</span>
                </span>
            </div>
            <div id="monitor-body">
                <div id="monitor-log"></div>
                <div>
                    <button id="monitor-toggle" class="btn-start">启动</button>
                    <button id="monitor-config">配置</button>
                    <button id="monitor-clear">清日志</button>
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
        window.__monitorLog = function (msg) {
            const logEl = document.getElementById('monitor-log');
            if (!logEl) return;
            const line = document.createElement('div');
            line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
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
                btn.textContent = '停止';
                btn.className = 'btn-stop';
                status.textContent = '收功中...';
                status.className = 'status-running';
                // 先收功，等冥想彻底停止后再启动自动探索
                const stopBtn = document.querySelector('.btn-stop-meditate');
                if (stopBtn) {
                    log('正在收功...');
                    stopBtn.click();
                    // 轮询等待冥想完全停止（游戏可能自动重新冥想，需要反复收功）
                    for (let i = 0; i < 20; i++) {
                        await sleep(1500);
                        if (!window.__monitorRunning) { syncStopUI(); return; }
                        const medBtn = document.getElementById('meditateBtn');
                        const isMeditating = medBtn && medBtn.classList.contains('meditating');
                        if (!isMeditating) break;
                        const sb = document.querySelector('.btn-stop-meditate');
                        if (sb) {
                            log('检测到重新冥想，再次收功...');
                            sb.click();
                        }
                    }
                    if (!window.__monitorRunning) { syncStopUI(); return; }
                    log('收功完成，启动监控');
                }
                // 收功完毕后才开启自动探索和监控循环
                status.textContent = '运行中';
                toggleAutoCheckbox(true);
                startMonitorLoop();
                log('监控已启动');
            } else {
                btn.textContent = '启动';
                btn.className = 'btn-start';
                status.textContent = '已停止';
                status.className = 'status-stopped';
                hiring = false;
                shopping = false;
                if (window.__monitorInterval) {
                    clearInterval(window.__monitorInterval);
                    window.__monitorInterval = null;
                }
                toggleAutoCheckbox(false);
                log('监控已暂停');
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

        log('监控面板已加载（点击启动按钮开始）');
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
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span class="cfg-title">配置编辑</span>
                <span id="config-close" style="cursor:pointer;color:var(--mp-red);font-size:16px;font-weight:bold;">&times;</span>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">护道者设置</div>
                <div class="cfg-row">
                    <label>雇佣模式</label>
                    <select id="cfg-hireMode">
                        <option value="together" ${cfg.protectors.hireMode === 'together' ? 'selected' : ''}>协同（并肩作战，分担伤害）</option>
                        <option value="solo" ${cfg.protectors.hireMode === 'solo' ? 'selected' : ''}>单独（护道者替你承担全部攻击）</option>
                    </select>
                </div>
                <div class="cfg-row">
                    <label>最大重试次数</label>
                    <input id="cfg-maxRetries" type="number" value="${cfg.protectors.maxRetries}">
                </div>
                <div class="cfg-row">
                    <label>重试延迟(ms)</label>
                    <input id="cfg-retryDelay" type="number" value="${cfg.protectors.retryDelayMs}">
                </div>
                <div class="cfg-row">
                    <label>无空闲护道者时</label>
                    <select id="cfg-onNoProtector">
                        <option value="escape" ${cfg.protectors.onNoProtector === 'escape' ? 'selected' : ''}>逃跑</option>
                        <option value="fight" ${cfg.protectors.onNoProtector === 'fight' ? 'selected' : ''}>迎战</option>
                    </select>
                </div>
                <div class="cfg-row" id="cfg-fightThreshold-wrap" style="${cfg.protectors.onNoProtector === 'fight' ? '' : 'display:none;'}">
                    <label>迎战妖兽攻击阈值(超过则逃跑，0=不限制)</label>
                    <input id="cfg-fightThreshold" type="number" value="${cfg.protectors.fightAttackThreshold || 0}">
                </div>
                <div class="cfg-row" id="cfg-afterEscape-wrap" style="${cfg.protectors.onNoProtector === 'escape' ? '' : 'display:none;'}">
                    <label>逃跑后行为</label>
                    <select id="cfg-afterEscape">
                        <option value="stop" ${cfg.protectors.afterEscape === 'stop' ? 'selected' : ''}>冥想并停止脚本</option>
                        <option value="continue" ${cfg.protectors.afterEscape === 'continue' ? 'selected' : ''}>继续监控</option>
                    </select>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">商人设置</div>
                <div class="cfg-row">
                    <label>高价阈值(灵石)</label>
                    <input id="cfg-highPrice" type="number" value="${cfg.merchant.highPriceThreshold}">
                </div>
                <div class="cfg-row">
                    <label>洗炼石品质优先级(逗号分隔)</label>
                    <input id="cfg-stonePriority" type="text" value="${cfg.merchant.stonePriority.join(',')}">
                </div>
                <div class="cfg-row">
                    <label>洗炼石关键词(逗号分隔)</label>
                    <input id="cfg-stoneKeywords" type="text" value="${cfg.merchant.stoneKeywords.join(',')}">
                </div>
                <div class="cfg-row">
                    <label>空白卷轴关键词(逗号分隔)</label>
                    <input id="cfg-scrollKeywords" type="text" value="${cfg.merchant.scrollKeywords ? cfg.merchant.scrollKeywords.join(',') : '空白卷轴'}">
                </div>
                <div class="cfg-row" style="display:flex;align-items:center;gap:8px;">
                    <input id="cfg-fallback" type="checkbox" ${cfg.merchant.fallbackToExpensive ? 'checked' : ''}>
                    <label style="margin-bottom:0;">无洗炼石时买最贵的</label>
                    <span style="font-size:11px;opacity:0.6;">关闭则无匹配商品时自动婉拒</span>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">护道者优先级（按顺序匹配，越靠前越优先）</div>
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
                <button id="cfg-save">保存</button>
                <button id="cfg-reset">重置默认</button>
            </div>
        `;
        const monitorPanel = document.getElementById('monitor-panel');
        monitorPanel.appendChild(panel);
        configPanelEl = panel;
        document.getElementById('config-close').addEventListener('click', () => {
            panel.remove();
            configPanelEl = null;
        });

        // 联动：无空闲护道者时 → 显示/隐藏关联配置
        document.getElementById('cfg-onNoProtector').addEventListener('change', (e) => {
            document.getElementById('cfg-fightThreshold-wrap').style.display = e.target.value === 'fight' ? '' : 'none';
            document.getElementById('cfg-afterEscape-wrap').style.display = e.target.value === 'escape' ? '' : 'none';
        });

        // 保存
        document.getElementById('cfg-save').addEventListener('click', () => {
            try {
                config.protectors.maxRetries = parseInt(document.getElementById('cfg-maxRetries').value) || 3;
                config.protectors.retryDelayMs = parseInt(document.getElementById('cfg-retryDelay').value) || 800;
                config.protectors.hireMode = document.getElementById('cfg-hireMode').value;
                config.protectors.onNoProtector = document.getElementById('cfg-onNoProtector').value;
                config.protectors.fightAttackThreshold = parseInt(document.getElementById('cfg-fightThreshold').value) || 0;
                config.protectors.afterEscape = document.getElementById('cfg-afterEscape').value;
                config.merchant.highPriceThreshold = parseInt(document.getElementById('cfg-highPrice').value) || 7500000;
                config.merchant.stonePriority = document.getElementById('cfg-stonePriority').value.split(',').map(s => s.trim()).filter(Boolean);
                config.merchant.stoneKeywords = document.getElementById('cfg-stoneKeywords').value.split(',').map(s => s.trim()).filter(Boolean);
                config.merchant.scrollKeywords = document.getElementById('cfg-scrollKeywords').value.split(',').map(s => s.trim()).filter(Boolean);
                config.merchant.fallbackToExpensive = document.getElementById('cfg-fallback').checked;
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
                log('配置已保存');
            } catch (e) {
                log('配置保存失败: ' + e.message);
            }
        });

        // 重置
        document.getElementById('cfg-reset').addEventListener('click', () => {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            saveConfig(config);
            panel.remove();
            configPanelEl = null;
            log('配置已重置为默认值');
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
            row.querySelector('.priority-del').addEventListener('click', () => row.remove());
            row.addEventListener('dragstart', e => {
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            row.addEventListener('dragend', () => row.classList.remove('dragging'));
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
            list.appendChild(makeRow('', 'realm'));
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

            log(`[waitForProtectorList] cards: ${count}, hasEmptyText: ${hasEmptyText}`);

            if (list && hasEmptyText) {
                log('[waitForProtectorList] 检测到"暂无空闲"');
                return 'empty';
            }
            if (count > 0) {
                log('[waitForProtectorList] 列表已加载');
                return 'loaded';
            }
            await sleep(800);
        }
        log('[waitForProtectorList] 超时');
        return 'timeout';
    }

    // --- 护道者选择与雇佣 ---
    function matchProtector(prot, rule) {
        if (rule.nameMatch && !prot.name.includes(rule.nameMatch)) return false;
        if (rule.excludeName && prot.name.includes(rule.excludeName)) return false;
        if (rule.realmMatch && !prot.realm.includes(rule.realmMatch)) return false;
        if (rule.realmContains && !prot.realm.includes(rule.realmContains)) return false;
        return true;
    }

    function selectProtectors(protectors, priorities) {
        const result = [];
        for (const rule of priorities) {
            const matched = protectors.filter(p => matchProtector(p, rule));
            if (rule.sortBy === 'attack') {
                matched.sort((a, b) => rule.sortOrder === 'asc' ? a.attack - b.attack : b.attack - a.attack);
            }
            const label = rule.nameMatch || rule.realmMatch || 'unknown';
            result.push(...matched.map(p => ({ ...p, priority: label })));
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
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`);
                dismissModal();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                clickHireProtector();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                const loaded = await waitForProtectorList(8000);
                if (!loaded) return false;
                return await findAndHireProtector(attempt + 1);
            }
            log(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`);
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
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`);
                dismissModal();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                clickHireProtector();
                await sleep(retryDelay);
                if (!window.__monitorRunning) return false;
                const loaded = await waitForProtectorList(8000);
                if (!loaded) return false;
                return await findAndHireProtector(attempt + 1);
            }
            log(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`);
            return false;
        }

        // Try each candidate in priority order
        for (let i = 0; i < selected.length; i++) {
            if (!window.__monitorRunning) return false;
            const candidate = selected[i];
            log(`[尝试${attempt}] 选择: ${candidate.name} ${candidate.realm} 攻击:${candidate.attack} (${candidate.priority})`);

            // Hook fetch to capture hire response
            window.__hireResponse = null;
            if (!window.__origFetchHire) window.__origFetchHire = window.fetch;
            window.fetch = async function (...args) {
                const resp = await window.__origFetchHire.apply(this, args);
                try {
                    const clone = resp.clone();
                    const data = await clone.json();
                    window.__hireResponse = data;
                } catch (e) { }
                return resp;
            };

            // Click the hire button based on config (协同 or 单独)
            const items = document.querySelectorAll('.protector-card');
            if (items[candidate.index]) {
                const btns = items[candidate.index].querySelectorAll('.prot-btn');
                const wantSolo = config.protectors.hireMode === 'solo';
                for (const btn of btns) {
                    const text = btn.textContent.trim();
                    if (wantSolo) {
                        if (text.includes('单独') || text.includes('单 独')) {
                            btn.click();
                            log(' 已点击单独');
                            break;
                        }
                    } else {
                        if (text.includes('协同') || text.includes('协 同')) {
                            btn.click();
                            log(' 已点击协同');
                            break;
                        }
                    }
                }
            }
            await sleep(800);
            if (!window.__monitorRunning) return false;

            // Check hire response (no confirm button needed, 协同 directly hires)
            const resp = window.__hireResponse;
            if (window.__origFetchHire) window.fetch = window.__origFetchHire;
            window.__hireResponse = null;
            let hireResult;
            if (!resp) {
                hireResult = { status: 'no_response' };
            } else if (resp.code === 400) {
                hireResult = { status: 'failed', message: resp.message || '雇佣失败' };
            } else {
                hireResult = { status: 'success' };
            }

            if (hireResult.status === 'failed') {
                log(` 雇佣失败(code=400): ${hireResult.message}`);
                log(' 刷新列表重新雇佣...');
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
                log(' 雇佣成功！');
                return true;
            }

            // No response, check toast
            const toast = window.__lastToast || '';
            if (toast) {
                log(` 护道者提示: ${toast}`);
            }
            log(' 雇佣完成（无明确响应）');
            return true;
        }

        // All candidates in this attempt failed
        if (!window.__monitorRunning) return false;
        if (attempt < maxRetries) {
            log(`[尝试${attempt}] 当前列表所有护道者不可用，刷新...`);
            dismissModal();
            await sleep(retryDelay);
            if (!window.__monitorRunning) return false;
            clickHireProtector();
            await sleep(retryDelay);
            if (!window.__monitorRunning) return false;
            const loaded = await waitForProtectorList(8000);
            if (!loaded) return false;
            return await findAndHireProtector(attempt + 1);
        }
        log(`[尝试${attempt}] ${maxRetries}次尝试均失败`);
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
    async function handleMerchant() {
        if (shopping) return;
        if (!window.__monitorRunning) return;
        shopping = true;
        try {
            log('遇到云游商人！');
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
            // 优先级2: 洗炼石
            if (!bought) {
                for (const quality of mcfg.stonePriority) {
                    const stone = allItems.find(i => i.name.includes(quality) && mcfg.stoneKeywords.some(kw => i.name.includes(kw)));
                    if (stone) {
                        clickBuyItem(stone.name);
                        bought = { ...stone, reason: '洗炼石' };
                        break;
                    }
                }
            }
            // 优先级3: 空白卷轴（按稀有度降序）
            if (!bought) {
                for (const quality of mcfg.stonePriority) {
                    const scroll = allItems.find(i => i.name.includes(quality) && mcfg.scrollKeywords.some(kw => i.name.includes(kw)));
                    if (scroll) {
                        clickBuyItem(scroll.name);
                        bought = { ...scroll, reason: '空白卷轴' };
                        break;
                    }
                }
            }
            // 优先级4: 买最贵的
            if (!bought && mcfg.fallbackToExpensive && allItems.length > 0) {
                const sorted = [...allItems].sort((a, b) => b.price - a.price);
                clickBuyItem(sorted[0].name);
                bought = { ...sorted[0], reason: '最贵物品' };
            }
            // 未购买任何商品，点击婉拒关闭
            if (!bought) {
                log('无可购买商品，婉拒告辞');
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
            console.log('商人物品列表:');
            allItems.forEach(item => console.log(` ${item.name} (${item.price}灵石)`));
            if (bought) {
                console.log(`购买: ${bought.name} (${bought.price}灵石) [${bought.reason}]`);
            }
            log('云游商人已处理');
        } catch (e) {
            log('商人错误: ' + e.message);
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
                log('脚本已停止，退出逃跑流程');
                return false;
            }
            log(`逃跑尝试 ${attempt}/${maxAttempts}...`);
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
                log('未找到逃跑按钮');
                return false;
            }

            // 等待800ms后检查遭遇面板是否还在
            await sleep(800);
            if (!window.__monitorRunning) {
                log('脚本已停止，退出逃跑流程');
                return false;
            }
            const o = document.getElementById('encounterOverlay');
            const stillVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
            if (!stillVisible) {
                log('逃跑成功！');
                return true;
            }
            log('逃跑失败，遭遇面板仍在，继续尝试...');
            await sleep(500);
        }
        log(`${maxAttempts}次逃跑均失败`);
        return false;
    }

    // --- 雇佣护道者主流程 ---
    async function hireProtector() {
        if (hiring) return;
        if (!window.__monitorRunning) return; // 检查是否已停止
        hiring = true;
        const now = Date.now();
        if (now - lastEncounterTime < 3000) { // 缩短到3秒，防止重复处理同一遭遇
            hiring = false;
            return;
        }
        lastEncounterTime = now;
        try {
            log('遭遇妖兽！开始雇佣流程...');
            if (!window.__monitorRunning) { hiring = false; return; }
            const overlay = document.getElementById('encounterOverlay');
            if (!overlay) {
                log('未找到遭遇界面');
                hiring = false;
                return;
            }

            // 根据设置决定：优先雇佣，无空闲时迎战或逃跑
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
                log('未找到雇佣护道按钮');
                hiring = false;
                return;
            }
            log('已点击雇佣护道');
            if (!window.__monitorRunning) { hiring = false; return; }
            const loaded = await waitForProtectorList(8000);
            if (!window.__monitorRunning) { hiring = false; return; }
            if (loaded === 'empty') {
                dismissModal();
                await sleep(800);
                if (!window.__monitorRunning) { hiring = false; return; }

                // 根据配置决定：逃跑或迎战
                if (config.protectors.onNoProtector === 'escape') {
                    // 逃跑逻辑
                    log('暂无空闲护道者，尝试逃跑...');
                    const escaped = await tryEscape();
                    if (!window.__monitorRunning) { hiring = false; return; }
                    hiring = false;

                    if (escaped) {
                        if (config.protectors.afterEscape === 'stop') {
                            // 点击冥想修炼并停止脚本
                            log('逃跑成功！点击冥想修炼...');
                            const btns = document.querySelectorAll('button');
                            for (const btn of btns) {
                                if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                                    btn.click();
                                    break;
                                }
                            }
                            log('已逃跑并进入冥想，脚本停止');
                            window.__monitorRunning = false;
                            if (window.__monitorInterval) {
                                clearInterval(window.__monitorInterval);
                                window.__monitorInterval = null;
                            }
                            syncStopUI();
                        } else {
                            // 继续监控
                            log('逃跑成功！继续监控...');
                        }
                    } else {
                        // 逃跑失败，继续监控等待下次遭遇
                        log('逃跑失败，继续监控...');
                    }
                    return;
                }

                // onNoProtector === 'fight'
                // 检查妖兽攻击力是否超过阈值
                const threshold = config.protectors.fightAttackThreshold;
                if (threshold > 0) {
                    const fightOverlay = document.getElementById('encounterOverlay');
                    if (fightOverlay) {
                        const metaText = fightOverlay.textContent;
                        const atkMatch = metaText.match(/攻击\s*(\d+)/);
                        if (atkMatch) {
                            const enemyAttack = parseInt(atkMatch[1]);
                            if (enemyAttack > threshold) {
                                log(`妖兽攻击${enemyAttack}超过阈值${threshold}，转为逃跑...`);
                                if (!window.__monitorRunning) { hiring = false; return; }
                                const escaped = await tryEscape();
                                if (!window.__monitorRunning) { hiring = false; return; }
                                hiring = false;

                                if (escaped) {
                                    if (config.protectors.afterEscape === 'stop') {
                                        log('逃跑成功！点击冥想修炼...');
                                        const btns = document.querySelectorAll('button');
                                        for (const btn of btns) {
                                            if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                                                btn.click();
                                                break;
                                            }
                                        }
                                        log('妖兽攻击超过阈值，已逃跑并进入冥想，脚本停止');
                                        window.__monitorRunning = false;
                                        if (window.__monitorInterval) {
                                            clearInterval(window.__monitorInterval);
                                            window.__monitorInterval = null;
                                        }
                                        syncStopUI();
                                    } else {
                                        log('逃跑成功！继续监控...');
                                    }
                                } else {
                                    // 逃跑失败，继续监控等待下次遭遇
                                    log('逃跑失败，继续监控...');
                                }
                                return;
                            }
                        }
                    }
                }

                log('暂无空闲护道者，选择迎战...');
                // 在遭遇界面直接点击迎战按钮
                if (!window.__monitorRunning) { hiring = false; return; }
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
                log('已点击迎战，等待战斗结束...');
                const battleStart = Date.now();
                while (Date.now() - battleStart < 60000) {
                    if (!window.__monitorRunning) { hiring = false; return; }
                    const o = document.getElementById('encounterOverlay');
                    const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                    if (!overlayVisible) break;
                    await sleep(800);
                }
                log('战斗结束');
                hiring = false; // 立即释放
                if (!window.__monitorRunning) return;
                const tipDismissed = await dismissTipDialog(2000);
                if (tipDismissed) log('已关闭打赏弹窗');
                return;
            }

            if (loaded === 'timeout') {
                log('护道者列表加载超时');
                hiring = false;
                return;
            }

            // loaded === 'loaded' - 执行雇佣逻辑
            const hired = await findAndHireProtector(1);
            if (!window.__monitorRunning) { hiring = false; return; }
            if (!hired) {
                log('雇佣失败，无合适人选');
                hiring = false;
                return;
            }

            // Wait for battle to finish
            log('等待战斗结束...');
            const battleStart = Date.now();
            while (Date.now() - battleStart < 60000) {
                if (!window.__monitorRunning) { hiring = false; return; }
                const o = document.getElementById('encounterOverlay');
                const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                if (!overlayVisible) break;
                if (Date.now() - battleStart > 10000) {
                    log('战斗超时10秒，重新雇佣...');
                    hiring = false;
                    if (!window.__monitorRunning) return;
                    await sleep(800);
                    await hireProtector();
                    return;
                }
                await sleep(800);
            }
            log('战斗结束');
            hiring = false; // 立即释放，允许检测新遭遇
            if (!window.__monitorRunning) return;

            // Dismiss tip dialog
            if (!window.__monitorRunning) return;
            const tipDismissed = await dismissTipDialog(2000);
            if (tipDismissed) log('已关闭打赏弹窗');

        } catch (e) {
            log('错误: ' + e.message);
            hiring = false;
        }
    }

    // --- 死亡复活流程 ---
    async function handleDeath() {
        log('检测到死亡画面，点击引渡归来...');
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
        log('已点击引渡归来，等待复活...');
        await sleep(3000);

        // 点击地图
        log('点击地图按钮...');
        const iconBtns = document.querySelectorAll('.btn-icon');
        for (const btn of iconBtns) {
            if (btn.textContent.includes('地图')) {
                btn.click();
                break;
            }
        }
        await sleep(300);

        // 点击第四个地图节点
        const nodes = document.querySelectorAll('.map-node');
        if (nodes.length >= 4) {
            const fourthNode = nodes[3];
            fourthNode.click();
            const nameEl = fourthNode.querySelector('.map-node-name');
            const mapName = nameEl ? nameEl.textContent.trim() : '第四个地图';
            log(`点击第四个地图: ${mapName}...`);
        }
        await sleep(300);

        // 点击神行符传送
        log('使用神行符传送...');
        const allBtns = document.querySelectorAll('.btn-dialog-confirm, button');
        for (const btn of allBtns) {
            if (btn.textContent.includes('神行符')) {
                btn.click();
                break;
            }
        }
        await sleep(300);

        // 关闭地图面板
        log('关闭地图面板...');
        const closeBtn = document.querySelector('.btn-panel-close');
        if (closeBtn) closeBtn.click();
        await sleep(300);

        log('死亡后流程完成，继续监控...');
    }

    // --- 主监控循环 ---
    let __lastHandledToast = ''; // 避免重复处理同一条toast
    function startMonitorLoop() {
        window.__monitorInterval = setInterval(async () => {
            try {
                if (!window.__monitorRunning) return;

                // Check for death overlay first
                const d = document.getElementById('deathOverlay');
                if (d && getComputedStyle(d).display !== 'none' && d.offsetParent !== null) {
                    await handleDeath();
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

                // 检测神识不足 toast
                const toast = window.__lastToast || '';
                if (toast.includes('神识不足') && window.__lastToastTime !== __lastHandledToast) {
                    __lastHandledToast = window.__lastToastTime;
                    log('检测到神识不足，尝试高级冥想...');

                    // 先尝试高级冥想
                    let instantMeditateOk = false;
                    try {
                        const data = await callApi('POST', '/api/game/meditate/instant', { grade: 2 });
                        if (data && (data.code === 0 || data.code === 200)) {
                            instantMeditateOk = true;
                            log('高级冥想成功，点击冥想修炼...');
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
                                    log('已点击收功');
                                    break;
                                }
                            }
                            await sleep(500);
                        } else {
                            log('高级冥想失败: ' + (data?.message || '未知原因') + '，转为冥想修炼');
                        }
                    } catch (e) {
                        log('高级冥想异常: ' + e.message + '，转为冥想修炼');
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
                    log('神识不足，已自动冥想并停止脚本');
                    return;
                }
            } catch (e) {
                /* ignore */
            }
        }, 500);
    }

    // --- 初始化 ---
    createPanel();
    startMonitorLoop();
    log('监控已加载，等待启动...');
})();
