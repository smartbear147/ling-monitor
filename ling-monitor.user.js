// ==UserScript==
// @name 灵界自动监控 (手机版)
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

    // --- 默认配置 ---
    const DEFAULT_CONFIG = {
        protectors: {
            priorities: [
                { nameMatch: '魔君本相', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期三劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期二劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫期一劫仙人', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期大圆满', excludeName: '魔君本相', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期后期', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '大乘期中期', sortBy: 'attack', sortOrder: 'desc' },
            ],
            maxRetries: 3,
            retryDelayMs: 800,
            onNoProtector: 'escape', // 'escape' = 逃跑, 'fight' = 迎战
            fightAttackThreshold: 0, // 迎战时妖兽攻击阈值，超过则逃跑，0=不限制
        },
        merchant: {
            highPriceThreshold: 7500000,
            stonePriority: ['传说', '史诗', '稀有', '优良', '普通'],
            stoneKeywords: ['洗炼石', '洗练石'],
            fallbackToExpensive: true,
        },
    };

    // --- 配置读写 ---
    function loadConfig() {
        const saved = GM_getValue('ling_config', null);
        if (saved) {
            try {
                return typeof saved === 'string' ? JSON.parse(saved) : saved;
            } catch (e) { /* fallback */ }
        }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
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
            btn.style.background = '#27ae60';
        }
        if (status) {
            status.textContent = '已停止';
            status.style.color = '#e74c3c';
        }
    }

    // --- 控制面板 UI ---
    function createPanel() {
        const existing = document.getElementById('monitor-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'monitor-panel';
        panel.innerHTML = `
            <div id="monitor-header" style="cursor:move;padding:6px 10px;background:#1a1a2e;display:flex;justify-content:space-between;align-items:center;border-radius:10px;">
                <span style="font-weight:bold;color:#e0c097;">自动监控</span>
                <span style="display:flex;align-items:center;gap:8px;">
                    <span id="monitor-status" style="font-size:12px;color:#e74c3c;border-radius:10px;">已停止</span>
                    <span id="monitor-move" style="cursor:pointer;font-size:16px;color:#aaa;" title="移动位置">&#x2630;</span>
                    <span id="monitor-minimize" style="cursor:pointer;font-size:16px;color:#aaa;" title="缩小">&#x25BC;</span>
                </span>
            </div>
            <div id="monitor-body">
                <div style="padding:8px 10px;max-height:200px;overflow-y:auto;" id="monitor-log"></div>
                <div style="padding:6px 10px;border-top:1px solid #444;display:flex;gap:8px;">
                    <button id="monitor-toggle" style="flex:1;padding:5px;background:#27ae60;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:12px;">启动</button>
                    <button id="monitor-config" style="flex:1;padding:5px;background:#2980b9;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:12px;">配置</button>
                    <button id="monitor-clear" style="flex:1;padding:5px;background:#555;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:12px;">清日志</button>
                </div>
            </div>
        `;
        panel.style.cssText = 'position:fixed;top:10px;right:10px;width:300px;max-width:calc(100vw - 20px);background:#16213e;border:1px solid #4ecca3;border-radius:10px;z-index:99999;font-family:monospace;font-size:12px;color:#eee;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
        panel.onclick = function (e) { e.stopPropagation(); };
        document.body.appendChild(panel);

        // 移动功能 (手机端优化)
        let isMoving = false;
        let startX, startY, initialLeft, initialTop;

        const moveBtn = document.getElementById('monitor-move');
        const header = document.getElementById('monitor-header');

        moveBtn.addEventListener('click', (e) => {
            isMoving = !isMoving;
            moveBtn.style.color = isMoving ? '#4ecca3' : '#aaa';
            if (isMoving) {
                log('点击屏幕任意位置以移动面板');
            }
            e.stopPropagation();
        });

        document.addEventListener('touchstart', (e) => {
            if (!isMoving) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = panel.offsetLeft;
            initialTop = panel.offsetTop;
            e.preventDefault(); // 防止页面滚动
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isMoving) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            panel.style.left = (initialLeft + deltaX) + 'px';
            panel.style.top = (initialTop + deltaY) + 'px';
            panel.style.right = 'auto';
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (isMoving) {
                isMoving = false;
                moveBtn.style.color = '#aaa';
            }
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
            line.style.cssText = 'padding:2px 0;border-bottom:1px solid #333;word-break:break-all;';
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
                btn.style.background = '#e74c3c';
                status.textContent = '运行中';
                status.style.color = '#4ecca3';
                toggleAutoCheckbox(true);
                startMonitorLoop();
                log('监控已启动');
            } else {
                btn.textContent = '启动';
                btn.style.background = '#27ae60';
                status.textContent = '已停止';
                status.style.color = '#e74c3c';
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
        panel.style.cssText = 'width:100%;max-height:50vh;overflow-y:auto;background:#16213e;border-top:1px solid #4ecca3;font-family:monospace;font-size:12px;color:#eee;padding:12px;box-sizing:border-box;';
        const cfg = JSON.parse(JSON.stringify(config));
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-weight:bold;color:#e0c097;font-size:14px;">配置编辑</span>
                <span id="config-close" style="cursor:pointer;color:#e74c3c;font-size:16px;font-weight:bold;">&times;</span>
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">护道者最大重试次数</label><br>
                <input id="cfg-maxRetries" type="number" value="${cfg.protectors.maxRetries}" style="width:60px;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">重试延迟(ms)</label><br>
                <input id="cfg-retryDelay" type="number" value="${cfg.protectors.retryDelayMs}" style="width:80px;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">无空闲护道者时</label><br>
                <select id="cfg-onNoProtector" style="width:100%;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
                    <option value="escape" ${cfg.protectors.onNoProtector === 'escape' ? 'selected' : ''}>逃跑</option>
                    <option value="fight" ${cfg.protectors.onNoProtector === 'fight' ? 'selected' : ''}>迎战</option>
                </select>
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">迎战妖兽攻击阈值(超过则逃跑，0=不限制)</label><br>
                <input id="cfg-fightThreshold" type="number" value="${cfg.protectors.fightAttackThreshold || 0}" style="width:120px;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">高价阈值(灵石)</label><br>
                <input id="cfg-highPrice" type="number" value="${cfg.merchant.highPriceThreshold}" style="width:120px;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">洗炼石品质优先级(逗号分隔)</label><br>
                <input id="cfg-stonePriority" type="text" value="${cfg.merchant.stonePriority.join(',')}" style="width:100%;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">洗炼石关键词(逗号分隔)</label><br>
                <input id="cfg-stoneKeywords" type="text" value="${cfg.merchant.stoneKeywords.join(',')}" style="width:100%;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">无洗炼石时买最贵的</label>
                <input id="cfg-fallback" type="checkbox" ${cfg.merchant.fallbackToExpensive ? 'checked' : ''} style="margin-left:8px;">
            </div>
            <div style="margin-bottom:10px;">
                <label style="color:#4ecca3;">护道者优先级 (JSON)</label><br>
                <textarea id="cfg-priorities" rows="8" style="width:100%;background:#1a1a2e;color:#eee;border:1px solid #444;padding:3px;border-radius:3px;font-family:monospace;font-size:11px;">${JSON.stringify(cfg.protectors.priorities, null, 2)}</textarea>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="cfg-save" style="flex:1;padding:6px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;">保存</button>
                <button id="cfg-reset" style="flex:1;padding:6px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;">重置默认</button>
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
                config.merchant.highPriceThreshold = parseInt(document.getElementById('cfg-highPrice').value) || 7500000;
                config.merchant.stonePriority = document.getElementById('cfg-stonePriority').value.split(',').map(s => s.trim()).filter(Boolean);
                config.merchant.stoneKeywords = document.getElementById('cfg-stoneKeywords').value.split(',').map(s => s.trim()).filter(Boolean);
                config.merchant.fallbackToExpensive = document.getElementById('cfg-fallback').checked;
                const prioritiesText = document.getElementById('cfg-priorities').value.trim();
                const priorities = JSON.parse(prioritiesText);
                if (!Array.isArray(priorities)) throw new Error('优先级必须是数组');
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
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const count = document.querySelectorAll('.protector-item').length;
            const list = document.getElementById('encounterProtectorList');
            if (list && list.textContent.includes('暂无空闲')) return 'empty';
            if (count > 0) return 'loaded';
            await sleep(800);
        }
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
        const protectorPriorities = config.protectors.priorities;
        const maxRetries = config.protectors.maxRetries;
        const retryDelay = config.protectors.retryDelayMs;

        // Parse all protectors
        const items = document.querySelectorAll('.protector-item');
        if (items.length === 0) {
            if (attempt < maxRetries) {
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`);
                dismissModal();
                await sleep(retryDelay);
                clickHireProtector();
                await sleep(retryDelay);
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
            const metaEl = item.querySelector('.prot-meta');
            if (!nameEl) return;
            const name = nameEl.textContent.replace(realmEl ? realmEl.textContent : '', '').trim();
            const realm = realmEl ? realmEl.textContent.trim() : '';
            let attack = 0;
            if (metaEl) {
                const atkMatch = metaEl.textContent.match(/基础攻击:\s*(\d+)/);
                if (atkMatch) attack = parseInt(atkMatch[1]);
            }
            protectors.push({ name, realm, attack, index });
        });

        const selected = selectProtectors(protectors, protectorPriorities);
        if (!selected || selected.length === 0) {
            if (attempt < maxRetries) {
                log(`[尝试${attempt}] 未找到合适护道者，刷新列表...`);
                dismissModal();
                await sleep(retryDelay);
                clickHireProtector();
                await sleep(retryDelay);
                const loaded = await waitForProtectorList(8000);
                if (!loaded) return false;
                return await findAndHireProtector(attempt + 1);
            }
            log(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`);
            return false;
        }

        // Try each candidate in priority order
        for (let i = 0; i < selected.length; i++) {
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

            // Click this candidate's hire button
            const items = document.querySelectorAll('.protector-item');
            if (items[candidate.index]) {
                const btn = items[candidate.index].querySelector('.btn-choose-prot');
                if (btn) btn.click();
            }
            await sleep(800);

            // Click confirm
            const confirmed = await clickConfirm();
            if (!confirmed) {
                if (window.__origFetchHire) window.fetch = window.__origFetchHire;
                log(' 未找到确认按钮');
                continue;
            }
            await sleep(800);

            // Check hire response
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
                dismissModal();
                await sleep(800);
                clickHireProtector();
                await sleep(800);
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
        if (attempt < maxRetries) {
            log(`[尝试${attempt}] 当前列表所有护道者不可用，刷新...`);
            dismissModal();
            await sleep(retryDelay);
            clickHireProtector();
            await sleep(retryDelay);
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
    function dismissTipDialog() {
        const modal = document.getElementById('gameDialogModal');
        if (!modal) return false;
        if (getComputedStyle(modal).display === 'none') return false;
        if (!modal.textContent.includes('打赏')) return false;
        const btns = modal.querySelectorAll('button');
        for (const btn of btns) {
            const t = btn.textContent.trim();
            if (t === '取 消' || t === '取消') {
                btn.click();
                return true;
            }
        }
        return false;
    }

    // --- 商人逻辑 ---
    let shopping = false;
    async function handleMerchant() {
        if (shopping) return;
        shopping = true;
        try {
            log('遇到云游商人！');
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
            // 优先级3: 买最贵的
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
            const leaveBtn = document.getElementById('merchantLeaveBtn');
            if (leaveBtn) leaveBtn.click();

            // 重新勾选自动
            await sleep(500);
            toggleAutoCheckbox(true);
            log('已重新勾选自动');
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
        hiring = true;
        const now = Date.now();
        if (now - lastEncounterTime < 10000) {
            hiring = false;
            return;
        }
        lastEncounterTime = now;
        try {
            log('遭遇妖兽！开始雇佣流程...');
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
            await sleep(800);
            const loaded = await waitForProtectorList(8000);
            if (loaded === 'empty') {
                dismissModal();
                await sleep(800);
                if (config.protectors.onNoProtector === 'fight') {
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
                                    const escaped = await tryEscape();
                                    if (escaped) {
                                        log('逃跑成功！点击冥想修炼...');
                                        const btns = document.querySelectorAll('button');
                                        for (const btn of btns) {
                                            if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                                                btn.click();
                                                break;
                                            }
                                        }
                                        log('妖兽攻击超过阈值，已逃跑并进入冥想，脚本停止');
                                    } else {
                                        log('逃跑失败，脚本停止');
                                    }
                                    hiring = false;
                                    window.__monitorRunning = false;
                                    if (window.__monitorInterval) {
                                        clearInterval(window.__monitorInterval);
                                        window.__monitorInterval = null;
                                    }
                                    syncStopUI();
                                    return;
                                }
                            }
                        }
                    }
                }
                log('暂无空闲护道者，选择迎战...');
                // 在遭遇界面直接点击迎战按钮
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
                    const o = document.getElementById('encounterOverlay');
                    const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                    if (!overlayVisible) break;
                    await sleep(800);
                }
                log('战斗结束');
                await sleep(800);
                dismissTipDialog();
                await sleep(800);
                toggleAutoCheckbox(true);
                hiring = false;
                return;
            }

            log('暂无空闲护道者，尝试逃跑...');
            const escaped = await tryEscape();
            if (escaped) {
                log('逃跑成功！点击冥想修炼...');
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                    if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                        btn.click();
                        break;
                    }
                }
                const allEls = document.querySelectorAll('a, div, span');
                for (const el of allEls) {
                    if (el.offsetParent !== null && el.textContent.trim() === '冥想修炼') {
                        el.click();
                        break;
                    }
                }
                log('已点击冥想修炼，脚本停止');
                hiring = false;
                window.__monitorRunning = false;
                if (window.__monitorInterval) {
                    clearInterval(window.__monitorInterval);
                    window.__monitorInterval = null;
                }
                syncStopUI();
                return;
            } else {
                log('逃跑失败，脚本停止');
                hiring = false;
                window.__monitorRunning = false;
                if (window.__monitorInterval) {
                    clearInterval(window.__monitorInterval);
                    window.__monitorInterval = null;
                }
                syncStopUI();
                return;
            }

            if (loaded === 'timeout') {
                log('护道者列表加载超时');
                hiring = false;
                return;
            }

            const hired = await findAndHireProtector(1);
            if (!hired) {
                log('雇佣失败，无合适人选');
                hiring = false;
                return;
            }

            // Wait for battle to finish
            log('等待战斗结束...');
            const battleStart = Date.now();
            while (Date.now() - battleStart < 60000) {
                const o = document.getElementById('encounterOverlay');
                const overlayVisible = o && getComputedStyle(o).display !== 'none' && o.offsetParent !== null;
                if (!overlayVisible) break;
                if (Date.now() - battleStart > 10000) {
                    log('战斗超时10秒，重新雇佣...');
                    hiring = false;
                    await sleep(800);
                    await hireProtector();
                    return;
                }
                await sleep(800);
            }
            log('战斗结束');

            // Dismiss tip dialog
            await sleep(800);
            const tipDismissed = dismissTipDialog();
            if (tipDismissed) log('已关闭打赏弹窗');

            // Wait before next action
            await sleep(800);

            // Re-check auto toggle
            toggleAutoCheckbox(true);
            log('已重新勾选自动');
        } catch (e) {
            log('错误: ' + e.message);
        }
        await sleep(3000);
        hiring = false;
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

        // 勾选自动
        log('重新勾选自动...');
        toggleAutoCheckbox(true);
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
        }, 2000);
    }

    // --- 初始化 ---
    createPanel();
    startMonitorLoop();
    log('监控已加载，等待启动...');
})();
