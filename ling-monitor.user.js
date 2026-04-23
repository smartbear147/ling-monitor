// ==UserScript==
// @name 灵界自动监控
// @namespace https://ling.muge.info
// @version 1.0.1
// @description 自动雇佣护道者、购买商人物品、死亡复活、关闭打赏弹窗，支持手机端拖拽
// @match https://ling.muge.info/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @run-at document-idle
// ==/UserScript==

(function () {
    'use strict';

    // --- 主题样式 ---
    GM_addStyle(`
        #monitor-panel {
            position: fixed; top: 10px; right: 10px; width: 300px;
            max-width: calc(100vw - 20px);
            background: var(--bg-panel, #16213e);
            border: 1px solid var(--border-gold, #4ecca3);
            border-radius: 10px; z-index: 99999;
            font-family: monospace; font-size: 12px;
            color: var(--text-primary, #eee);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        #monitor-header {
            cursor: move; padding: 6px 10px;
            background: var(--bg-secondary, #1a1a2e);
            display: flex; justify-content: space-between; align-items: center;
            border-radius: 10px;
        }
        #monitor-header > span:first-child {
            font-weight: bold; color: var(--text-gold, #e0c097);
        }
        #monitor-status { font-size: 12px; }
        #monitor-status.status-stopped { color: var(--text-red, #e74c3c); }
        #monitor-status.status-running { color: var(--accent-jade, #4ecca3); }
        #monitor-minimize { cursor: pointer; font-size: 16px; color: var(--text-muted, #aaa); }
        #monitor-log {
            padding: 8px 10px; max-height: 200px; overflow-y: auto;
        }
        #monitor-log > div {
            padding: 2px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1)); word-break: break-all;
        }
        #monitor-body > div:last-child {
            padding: 6px 10px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
            display: flex; gap: 8px;
        }
        #monitor-toggle, #monitor-config, #monitor-clear {
            flex: 1; padding: 5px; color: #fff; border: none; border-radius: 10px;
            cursor: pointer; font-size: 12px;
        }
        #monitor-toggle.btn-start { background: var(--accent-jade, #27ae60); }
        #monitor-toggle.btn-stop  { background: var(--accent-crimson, #e74c3c); }
        #monitor-config { background: var(--accent-blue, #2980b9); }
        #monitor-clear  { background: var(--text-muted, #555); }

        #config-panel {
            width: 100%; max-height: 50vh; overflow-y: auto;
            background: var(--bg-panel, #16213e);
            border-top: 1px solid var(--border-gold, #4ecca3);
            font-family: monospace; font-size: 12px;
            color: var(--text-primary, #eee);
            padding: 12px; box-sizing: border-box;
        }
        #config-panel label { color: var(--accent-jade, #4ecca3); }
        #config-panel .cfg-title { font-weight: bold; color: var(--text-gold, #e0c097); font-size: 14px; }
        #config-panel input[type=number],
        #config-panel input[type=text],
        #config-panel select,
        #config-panel textarea {
            background: var(--bg-card, #1a1a2e); color: var(--text-primary, #eee);
            border: 1px solid var(--border-color, #444); padding: 3px; border-radius: 3px;
        }
        #config-panel textarea { font-family: monospace; font-size: 11px; }
        #cfg-save {
            flex: 1; padding: 6px; background: var(--accent-jade, #27ae60);
            color: #fff; border: none; border-radius: 4px; cursor: pointer;
        }
        #cfg-reset {
            flex: 1; padding: 6px; background: var(--accent-crimson, #e74c3c);
            color: #fff; border: none; border-radius: 4px; cursor: pointer;
        }

        .priority-list { display: flex; flex-direction: column; gap: 4px; }
        .priority-row {
            display: flex; align-items: center; gap: 4px;
            background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-color, #444);
            border-radius: 4px; padding: 4px 6px;
        }
        .priority-row.dragging { opacity: 0.4; }
        .priority-row.drag-over { border-color: var(--accent-jade, #4ecca3); }
        .priority-handle { cursor: grab; color: var(--text-muted, #888); font-size: 14px; user-select: none; }
        .priority-type {
            background: var(--bg-secondary, #111827); color: var(--text-primary, #eee);
            border: 1px solid var(--border-color, #444); border-radius: 3px;
            padding: 2px 4px; font-size: 11px;
        }
        .priority-keyword {
            flex: 1; min-width: 0; background: var(--bg-secondary, #111827);
            color: var(--text-primary, #eee); border: 1px solid var(--border-color, #444);
            border-radius: 3px; padding: 2px 6px; font-size: 11px;
        }
        .priority-del {
            cursor: pointer; color: var(--accent-crimson, #e74c3c); font-size: 14px;
            font-weight: bold; user-select: none; padding: 0 2px;
        }
        .priority-add {
            cursor: pointer; color: var(--accent-jade, #4ecca3); font-size: 12px;
            text-align: center; padding: 4px; border: 1px dashed var(--border-color, #444);
            border-radius: 4px; margin-top: 4px;
        }
        .priority-add:hover { border-color: var(--accent-jade, #4ecca3); }
    `);

    // --- 默认配置 ---
    const DEFAULT_CONFIG = {
        protectors: {
            priorities: [
                { nameMatch: '阿道夫', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期三劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期二劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期一劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期大圆满',  sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期后期', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期中期', sortBy: 'attack', sortOrder: 'desc' },
            ],
            maxRetries: 3,
            retryDelayMs: 800,
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

    // --- Toast 拦截 ---
    window.__lastToast = '';
    window.__lastToastTime = 0;
    const originalShowToast = window.showToast;
    window.showToast = function (msg) {
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
        document.getElementById('monitor-toggle').addEventListener('click', (e) => {
            window.__monitorRunning = !window.__monitorRunning;
            const btn = e.target;
            const status = document.getElementById('monitor-status');
            if (window.__monitorRunning) {
                btn.textContent = '停止';
                btn.className = 'btn-stop';
                status.textContent = '运行中';
                status.className = 'status-running';
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
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span class="cfg-title">配置编辑</span>
                <span id="config-close" style="cursor:pointer;color:var(--accent-crimson,#e74c3c);font-size:16px;font-weight:bold;">&times;</span>
            </div>
            <div style="margin-bottom:10px;">
                <label>护道者最大重试次数</label><br>
                <input id="cfg-maxRetries" type="number" value="${cfg.protectors.maxRetries}" style="width:60px;">
            </div>
            <div style="margin-bottom:10px;">
                <label>重试延迟(ms)</label><br>
                <input id="cfg-retryDelay" type="number" value="${cfg.protectors.retryDelayMs}" style="width:80px;">
            </div>
            <div style="margin-bottom:10px;">
                <label>无空闲护道者时</label><br>
                <select id="cfg-onNoProtector" style="width:100%;">
                    <option value="escape" ${cfg.protectors.onNoProtector === 'escape' ? 'selected' : ''}>逃跑</option>
                    <option value="fight" ${cfg.protectors.onNoProtector === 'fight' ? 'selected' : ''}>迎战</option>
                </select>
            </div>
            <div style="margin-bottom:10px;">
                <label>迎战妖兽攻击阈值(超过则逃跑，0=不限制)</label><br>
                <input id="cfg-fightThreshold" type="number" value="${cfg.protectors.fightAttackThreshold || 0}" style="width:120px;">
            </div>
            <div style="margin-bottom:10px;">
                <label>逃跑后行为</label><br>
                <select id="cfg-afterEscape" style="width:100%;">
                    <option value="stop" ${cfg.protectors.afterEscape === 'stop' ? 'selected' : ''}>冥想并停止脚本</option>
                    <option value="continue" ${cfg.protectors.afterEscape === 'continue' ? 'selected' : ''}>继续监控</option>
                </select>
            </div>
            <div style="margin-bottom:10px;">
                <label>高价阈值(灵石)</label><br>
                <input id="cfg-highPrice" type="number" value="${cfg.merchant.highPriceThreshold}" style="width:120px;">
            </div>
            <div style="margin-bottom:10px;">
                <label>洗炼石品质优先级(逗号分隔)</label><br>
                <input id="cfg-stonePriority" type="text" value="${cfg.merchant.stonePriority.join(',')}" style="width:100%;">
            </div>
            <div style="margin-bottom:10px;">
                <label>洗炼石关键词(逗号分隔)</label><br>
                <input id="cfg-stoneKeywords" type="text" value="${cfg.merchant.stoneKeywords.join(',')}" style="width:100%;">
            </div>
            <div style="margin-bottom:10px;">
                <label>空白卷轴关键词(逗号分隔)</label><br>
                <input id="cfg-scrollKeywords" type="text" value="${cfg.merchant.scrollKeywords ? cfg.merchant.scrollKeywords.join(',') : '空白卷轴'}" style="width:100%;">
            </div>
            <div style="margin-bottom:10px;">
                <label>无洗炼石时买最贵的</label>
                <input id="cfg-fallback" type="checkbox" ${cfg.merchant.fallbackToExpensive ? 'checked' : ''} style="margin-left:8px;">
            </div>
            <div style="margin-bottom:10px;">
                <label>护道者优先级（按顺序匹配，越靠前越优先）</label>
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
            <div style="display:flex;gap:8px;">
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

        // 保存
        document.getElementById('cfg-save').addEventListener('click', () => {
            try {
                config.protectors.maxRetries = parseInt(document.getElementById('cfg-maxRetries').value) || 3;
                config.protectors.retryDelayMs = parseInt(document.getElementById('cfg-retryDelay').value) || 800;
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

            // Click this candidate's "协同" button
            const items = document.querySelectorAll('.protector-card');
            if (items[candidate.index]) {
                const btns = items[candidate.index].querySelectorAll('.prot-btn');
                for (const btn of btns) {
                    const text = btn.textContent.trim();
                    if (text.includes('协同') || text.includes('协 同')) {
                        btn.click();
                        log(' 已点击协同');
                        break;
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
            if (!window.__monitorRunning) return false;  // 脚本停止时立即退出
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

            // Log
            console.log('商人物品列表:');
            allItems.forEach(item => console.log(` ${item.name} (${item.price}灵石)`));
            if (bought) {
                console.log(`购买: ${bought.name} (${bought.price}灵石) [${bought.reason}]`);
            }
            log('云游商人已处理');

            // 关闭商人窗口
            await sleep(500);
            if (!window.__monitorRunning) { shopping = false; return; }
            const leaveBtn = document.getElementById('merchantLeaveBtn');
            if (leaveBtn) leaveBtn.click();
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
        if (now - lastEncounterTime < 3000) {  // 缩短到3秒，防止重复处理同一遭遇
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
                hiring = false;  // 立即释放
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
            hiring = false;  // 立即释放，允许检测新遭遇
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
