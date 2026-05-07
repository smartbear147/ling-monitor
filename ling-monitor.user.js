// ==UserScript==
// @name 灵界助手
// @namespace https://ling.muge.info
// @version 1.9.9
// @description 自动雇佣护道者、购买商人物品、死亡复活、关闭打赏弹窗、自动寻宝、铭文洗练，支持手机端拖拽
// @match https://ling.muge.info/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @grant unsafeWindow
// @run-at document-idle
// @downloadURL https://gitee.com/smartbear147/ling-monitor/raw/main/ling-monitor.user.js
// @updateURL https://gitee.com/smartbear147/ling-monitor/raw/main/ling-monitor.user.js
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
            border-radius: 12px; z-index: 2147483647 !important;
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
        #monitor-panel.minimized {
            width: 48px; height: 48px;
            min-width: 48px; max-width: 48px;
            border-radius: 50%;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            padding: 0;
            box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 20px var(--mp-accent-glow);
        }
        #monitor-panel.minimized:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 30px var(--mp-accent-dim);
        }
        #monitor-panel.minimized::before { display: none; }
        #monitor-panel.minimized .mp-gold-line { display: none; }
        #monitor-panel.minimized #monitor-header {
            padding: 0;
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: var(--mp-bg);
            border-radius: 50%;
        }
        #monitor-panel.minimized .mp-header-title { display: none; }
        #monitor-panel.minimized .mp-header-right { display: none; }
        #monitor-panel.minimized .mp-minimized-icon {
            display: flex;
            font-size: 20px;
            color: var(--mp-accent);
        }
        .mp-minimized-icon { display: none; }

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
        #monitor-minimize, #monitor-close {
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
        #monitor-close {
            color: var(--mp-red);
            font-size: 14px; font-weight: bold;
        }
        #monitor-close:hover {
            background: var(--mp-red-glow);
        }

        /* === Tab 栏 === */
        .mp-tab-bar {
            display: flex;
            border-bottom: 1px solid var(--mp-border);
            position: relative;
            z-index: 1;
        }
        .mp-tab {
            flex: 1; padding: 8px 0;
            text-align: center;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px; font-weight: 600;
            letter-spacing: 1px;
            color: var(--mp-text-muted);
            background: transparent;
            border: none; cursor: pointer;
            transition: all 0.15s;
            position: relative;
        }
        .mp-tab:hover:not(.active) { color: var(--mp-text-secondary); }
        .mp-tab.active { color: var(--mp-accent); }
        .mp-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0; left: 20%; right: 20%;
            height: 2px;
            background: var(--mp-accent);
            border-radius: 1px;
        }

        /* === Tab 内容 === */
        .mp-tab-content { display: none; }
        .mp-tab-content.active { display: block; }

        /* === 状态行 === */
        .mp-status-line {
            padding: 6px 12px;
            display: flex; align-items: center; gap: 6px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px; font-weight: 600; letter-spacing: 1px;
            border-bottom: 1px solid var(--mp-border);
        }
        .mp-status-line .mp-status-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: currentColor;
        }
        .mp-status-line.status-stopped { color: var(--mp-text-muted); }
        .mp-status-line.status-running {
            color: var(--mp-jade);
        }
        .mp-status-line.status-running .mp-status-dot {
            animation: mp-pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes mp-pulse-dot {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
        }
        .mp-daynight-indicator {
            margin-left: auto;
            font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
        }
        .mp-daynight-indicator.day { color: var(--mp-log-warn); }
        .mp-daynight-indicator.night { color: var(--mp-log-info); }

        /* === 日志区域 === */
        #monitor-log, #treasure-log, #inscription-log {
            padding: 8px 12px; max-height: 200px; overflow-y: auto;
            background: var(--mp-bg-card);
            scrollbar-width: thin; scrollbar-color: var(--mp-border-subtle) transparent;
            outline: none;
        }
        #monitor-log::-webkit-scrollbar, #treasure-log::-webkit-scrollbar, #inscription-log::-webkit-scrollbar { width: 5px; }
        #monitor-log::-webkit-scrollbar-track, #treasure-log::-webkit-scrollbar-track, #inscription-log::-webkit-scrollbar-track { background: transparent; }
        #monitor-log::-webkit-scrollbar-thumb, #treasure-log::-webkit-scrollbar-thumb, #inscription-log::-webkit-scrollbar-thumb { background: var(--mp-border-subtle); border-radius: 3px; }
        .mp-log-line {
            padding: 3px 0 3px 10px;
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
            margin-right: 8px;
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
        .mp-bottom-bar {
            padding: 8px 12px;
            border-top: 1px solid var(--mp-border);
            display: flex; gap: 6px;
            background: var(--mp-bg);
            position: relative;
            z-index: 1;
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
        .mp-btn.mp-btn-treasure {
            background: linear-gradient(135deg, var(--mp-jade) 0%, #3a8a80 100%);
            color: #fff;
            box-shadow: 0 2px 8px var(--mp-jade-glow), var(--mp-shadow-inner);
        }
        .mp-btn.mp-btn-treasure:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--mp-jade-glow);
        }
        .mp-btn.mp-btn-treasure:active { transform: translateY(0) scale(0.97); }
        .mp-btn.mp-btn-treasure-stop {
            background: linear-gradient(135deg, var(--mp-red) 0%, #c84040 100%);
            color: #fff;
            box-shadow: 0 2px 8px var(--mp-red-glow);
        }
        .mp-btn.mp-btn-treasure-stop:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--mp-red-glow);
        }
        .mp-btn.mp-btn-pause {
            background: linear-gradient(135deg, #f0a050 0%, #d08030 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(240,160,80,0.3);
        }
        .mp-btn.mp-btn-pause:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(240,160,80,0.4);
        }
        .mp-btn.mp-btn-pause:active { transform: translateY(0) scale(0.97); }
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
        #config-panel, #inscription-config-panel {
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
        #config-panel::-webkit-scrollbar, #inscription-config-panel::-webkit-scrollbar { width: 5px; }
        #config-panel::-webkit-scrollbar-thumb, #inscription-config-panel::-webkit-scrollbar-thumb { background: var(--mp-border-subtle); border-radius: 3px; }
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
            border: 1px solid var(--mp-accent-dim);
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
        #config-panel select,
        #inscription-config-panel input[type=number],
        #inscription-config-panel input[type=text],
        #inscription-config-panel select {
            width: 100%; padding: 5px 8px;
            background: var(--mp-bg-input);
            color: var(--mp-text);
            border: 1px solid var(--mp-text-muted) !important;
            border-radius: 5px;
            font-family: inherit;
            font-size: 11px; font-weight: 500;
            transition: all 0.15s;
        }
        #config-panel input:focus, #config-panel select:focus,
        #inscription-config-panel input:focus, #inscription-config-panel select:focus {
            outline: none;
            border-color: var(--mp-accent) !important;
            box-shadow: 0 0 0 2px var(--mp-accent-glow);
        }
        #config-panel input[type=checkbox],
        #inscription-config-panel input[type=checkbox] {
            -webkit-appearance: none; appearance: none;
            width: 16px; height: 16px;
            background: var(--mp-bg-input);
            border: 1.5px solid var(--mp-text-muted);
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        }
        #config-panel input[type=checkbox]:checked,
        #inscription-config-panel input[type=checkbox]:checked {
            background: var(--mp-accent);
            border-color: var(--mp-accent);
        }
        #config-panel input[type=checkbox]:checked::after,
        #inscription-config-panel input[type=checkbox]:checked::after {
            content: '';
            position: absolute;
            left: 0.25em; top: 0.05em;
            width: 0.35em; height: 0.6em;
            border: solid var(--mp-bg);
            border-width: 0 0.14em 0.14em 0;
            transform: rotate(45deg);
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

        /* === 铭文洗练统计区域 === */
        #inscription-stats {
            padding: 6px 12px;
            display: flex; gap: 4px;
            flex-wrap: wrap;
            border-bottom: 1px solid var(--mp-border);
        }
        .ip-stat {
            flex: 1; min-width: 40px;
            text-align: center;
            padding: 2px;
            background: var(--mp-bg-card);
            border-radius: 6px;
        }
        .ip-stat-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: var(--mp-accent);
        }
        .ip-stat-label {
            font-size: 9px;
            font-weight: 600;
            color: var(--mp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* === 铭文状态（复用 .mp-status-line） === */
        .mp-status-line.status-idle { color: var(--mp-text-muted); }
        .mp-status-line.status-paused { color: var(--mp-log-warn); }
        .mp-status-line.status-discarding { color: var(--mp-red); }

        /* === 铭文目标属性列表 === */
        .affix-list { display: flex; flex-direction: column; gap: 4px; }
        .affix-row {
            display: flex; align-items: center; gap: 4px;
            background: var(--mp-bg-card);
            border: 1px solid var(--mp-border-subtle);
            border-radius: 6px;
            padding: 5px 8px;
            transition: all 0.15s;
        }
        .affix-row:hover { border-color: var(--mp-text-muted); }
        .affix-row.dragging { opacity: 0.4; }
        .affix-row.drag-over { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
        .affix-handle {
            cursor: grab; color: var(--mp-text-muted);
            font-size: 12px; user-select: none;
            flex-shrink: 0;
        }
        #inscription-config-panel .affix-row .target-stat-select {
            flex: 0 0 70px; width: 70px;
            padding: 3px 8px;
            background: var(--mp-bg-input) !important;
            color: var(--mp-text);
            border: 1px solid var(--mp-text-muted) !important;
            border-radius: 6px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            height: 26px; box-sizing: border-box;
            appearance: none; -webkit-appearance: none;
            text-align: center; text-align-last: center;
        }
        #inscription-config-panel .affix-row .affix-value {
            flex: 1; min-width: 40px;
            background: var(--mp-bg-input) !important;
            color: var(--mp-text);
            border: 1px solid var(--mp-text-muted) !important;
            border-radius: 6px; padding: 3px 8px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            height: 26px; box-sizing: border-box;
        }
        .affix-value:focus { outline: none; border-color: var(--mp-accent); }
        .affix-del {
            cursor: pointer; color: var(--mp-red);
            font-size: 14px; font-weight: bold;
            user-select: none;
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px; transition: all 0.15s;
            flex-shrink: 0;
        }
        .affix-del:hover { background: var(--mp-red-glow); }
        .affix-add {
            cursor: pointer; color: var(--mp-accent);
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: 11px; font-weight: 500;
            text-align: center; padding: 6px;
            border: 1px dashed var(--mp-border-subtle);
            border-radius: 6px; margin-top: 4px;
            transition: all 0.15s;
        }
        .affix-add:hover { border-color: var(--mp-accent); background: var(--mp-accent-subtle); }
    `);

    // --- 版本与配置 ---
    const SCRIPT_VERSION = '1.9.9';

    const DEFAULT_CONFIG = {
        protectors: {
            hireProtector: true,               // 新增：监控模式下是否雇佣护道者
            priorities: [
                { nameMatch: '蜉蝣一梦', sortBy: 'attack', sortOrder: 'desc' },
                { realmMatch: '渡劫|大乘|合道', sortBy: 'attack', sortOrder: 'desc' }
            ],
            maxRetries: 3,
            retryDelayMs: 800,
            hireMode: 'together',
            onNoProtector: 'escape',
            fightAttackThreshold: 0,
            hirePriceThreshold: 2000,
            afterEscape: 'stop',
        },
        merchant: {
            highPriceThreshold: 7500000,
            stonePriority: ['传说', '史诗', '稀有', '优良', '普通', '极品', '上品', '中品', '下品'],
            itemKeywords: ['洗炼石', '空白卷轴', '妖丹', '涅槃重生丹', '太虚道典'],
            fallbackToExpensive: true,
        },
        general: {
            highLevelMeditate: true,
        },
        treasureHunt: {
            batchSize: 0,
            intervalMs: 2000,
            useQuantity: 10,
            hireProtector: true,
        },
        dayNight: {
            enabled: false,
            checkIntervalSec: 30,
            maxMeditateRetries: 3,
            meditateRetryIntervalSec: 5,
        },
        inscription: {
            targetStats: [
                { stat: '攻击', minValue: 50 },
                { stat: '防御', minValue: 50 },
                { stat: '气血', minValue: 100 },
                { stat: '神识', minValue: 20 }
            ],
            stopMode: 'any',
            maxAttempts: 0,
            resultAnimationMs: 1500,
            discardDelayMs: 500,
            autoCloseDialogs: true,
            notifyOnComplete: true,
        },
    };

    function loadConfig() {
        const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        defaults._version = SCRIPT_VERSION;
        const saved = GM_getValue('ling_config', null);
        if (saved) {
            try {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                const result = {
                    ...defaults, ...parsed,
                    protectors: { ...defaults.protectors, ...(parsed.protectors || {}) },
                    merchant: { ...defaults.merchant, ...(parsed.merchant || {}) },
                    general: { ...defaults.general, ...(parsed.general || {}) },
                    treasureHunt: { ...defaults.treasureHunt, ...(parsed.treasureHunt || {}) },
                    dayNight: { ...defaults.dayNight, ...(parsed.dayNight || {}) },
                    inscription: { ...defaults.inscription, ...(parsed.inscription || {}) },
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

    // --- 工具函数 ---
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escapeHTML(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function createLogFn(logElId) {
        return function (msg, type) {
            console.log(msg);
            const logEl = document.getElementById(logElId);
            if (!logEl) return;
            const line = document.createElement('div');
            const cls = type ? ` log-${type}` : '';
            line.className = `mp-log-line${cls}`;
            const now = new Date();
            const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
            line.innerHTML = `<span class="mp-log-time">[${ts}]</span><span class="mp-log-content">${escapeHTML(msg)}</span>`;
            const atBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 30;
            logEl.appendChild(line);
            if (atBottom) logEl.scrollTop = logEl.scrollHeight;
            while (logEl.children.length > 100) logEl.removeChild(logEl.firstChild);
        };
    }

    const monitorLog = createLogFn('monitor-log');
    const thLog = createLogFn('treasure-log');
    const inscriptionLog = createLogFn('inscription-log');

    function isRunning() {
        return window.__monitorRunning || window.__thRunning || window.__inscriptionRunning;
    }

    function activeLog() {
        if (window.__monitorRunning) return monitorLog;
        if (window.__thRunning) return thLog;
        return inscriptionLog;
    }

    function isOverlayVisible(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        if (el.classList.contains('hidden')) return false;
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
    }

    function clickButtonByText(root, text) {
        const btns = (root || document).querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.trim() === text) { btn.click(); return true; }
        }
        return false;
    }

    async function dismissLeaveModal(overlayId, logMsg) {
        const overlay = document.getElementById(overlayId);
        const leaveBtn = overlay?.querySelector('.modal-btn--outline');
        if (leaveBtn) {
            activeLog()(logMsg, 'action');
            leaveBtn.click();
            await sleep(300);
            toggleAutoCheckbox(true);
        }
    }

    let _apiCallCounter = 0;
    function callApi(method, path, body) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('API 调用超时')), 10000);
            const eventName = '__monitorApiResult_' + (++_apiCallCounter);
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

    async function withFetchIntercept(target, urlMatch, filterFn, actionFn) {
        const origFetch = target.fetch;
        let captured = null;
        target.fetch = async function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            const resp = await origFetch.apply(this, args);
            if (url.includes(urlMatch)) {
                try {
                    const clone = resp.clone();
                    const data = await clone.json();
                    if (!filterFn || filterFn(data)) captured = data;
                } catch (e) { }
            }
            return resp;
        };
        try {
            return await actionFn(() => captured);
        } finally {
            target.fetch = origFetch;
        }
    }

    // --- Toast 拦截 ---
    const _uw = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
    window.__lastToast = '';
    window.__lastToastTime = 0;
    window.__shenshiInsufficient = false;

    // --- 昼夜状态 ---
    const dayNightState = {
        currentIsDay: null,
        lastCheckTime: 0,
        transitioning: false,
        meditateRetryCount: 0,
    };
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
    window._origAlert = window.alert;
    window._origConfirm = window.confirm;
    window._origPrompt = window.prompt;
    window.alert = function () { return undefined; };
    window.confirm = function () { return true; };
    window.prompt = function (msg, def) { return def || ''; };

    let config = loadConfig();

    // --- 同步停止状态UI ---
    function setStoppedUI(btnId, statusId, btnText, btnClass) {
        const btn = document.getElementById(btnId);
        const status = document.getElementById(statusId);
        if (btn) { btn.textContent = btnText; btn.className = btnClass; }
        if (status) {
            const extra = statusId === 'monitor-status' ? '<span id="daynight-indicator" class="mp-daynight-indicator" style="display:none;"></span>' : '';
            status.innerHTML = '<span class="mp-status-dot"></span>已停止' + extra;
            status.className = 'mp-status-line status-stopped';
        }
    }

    function syncStopUI() {
        setStoppedUI('monitor-toggle', 'monitor-status', '启动', 'mp-btn mp-btn-start');
    }

    function syncStopTHUI() {
        setStoppedUI('treasure-toggle', 'treasure-status', '寻宝', 'mp-btn mp-btn-treasure');
        window.__thRunning = false;
    }

    // --- 统一弹窗检查 ---
    async function checkAllPopups() {
        // 1. 死亡
        const d = document.getElementById('deathOverlay');
        if (isOverlayVisible('deathOverlay') && d.querySelector('.btn-revive') && !dying) {
            dying = true;
            try { await handleDeath(); } finally { dying = false; }
            return;
        }

        // // 2. 逮捕
        // const arrest = document.getElementById('arrestOverlay');
        // if (arrest && !arrest.classList.contains('hidden')) {
        //     if (window.__monitorRunning) {
        //         monitorLog('被逮捕！停止探索', 'error');
        //         window.__monitorRunning = false;
        //         syncStopUI();
        //     }
        //     if (window.__thRunning) {
        //         thLog('被逮捕！停止寻宝', 'error');
        //         syncStopTHUI();
        //     }
        //     stopMainLoop();
        //     return;
        // }

        // 3. PVP
        if (isOverlayVisible('pvpEncounterModal')) {
            await dismissLeaveModal('pvpEncounterModal', '遭遇PVP，悄然离去');
            return;
        }

        // 4. 邀约
        if (isOverlayVisible('encounterInviteModal')) {
            await dismissLeaveModal('encounterInviteModal', '收到邀约，婉言告辞');
            return;
        }

        // 5. 公告
        const announce = document.getElementById('announceOverlay');
        if (announce && !announce.classList.contains('hidden')) {
            activeLog()('关闭公告弹窗', 'action');
            const closeBtn = announce.querySelector('.announce-close, .announce-confirm');
            if (closeBtn) closeBtn.click();
            return;
        }

        // 6. 打赏
        const tipDismissed = await dismissTipDialog(600);
        if (tipDismissed) {
            activeLog()('已关闭打赏弹窗', 'info');
            return;
        }

        // 7. 遭遇妖兽（两种模式都处理）
        {
            const o = document.getElementById('encounterOverlay');
            if (isOverlayVisible('encounterOverlay') && !hiring) {
                const encounterMode = window.__thRunning ? 'treasure' : 'monitor';
                if (encounterMode === 'treasure' && !config.treasureHunt.hireProtector) {
                    // 寻宝模式关闭雇佣 -> 直接迎战
                    hiring = true;
                    try {
                        thLog('遭遇妖兽，直接迎战...', 'info');
                        const battleResult = await withFetchIntercept(_uw, 'combat-choice', null, async (getCaptured) => {
                            clickButtonByText(o, '迎战');
                            for (let i = 0; i < 150; i++) {
                                await sleep(200);
                                if (!isRunning() || getCaptured()) break;
                            }
                            return getCaptured();
                        });
                        if (battleResult?.data) parseBattleResult(battleResult.data, thLog);
                        signalBattleEnd(battleResult);
                    } finally {
                        hiring = false;
                    }
                    return;
                }
                if (encounterMode === 'monitor' && !config.protectors.hireProtector) {
                    // 监控模式关闭雇佣 -> 直接迎战
                    hiring = true;
                    try {
                        monitorLog('遭遇妖兽，直接迎战...', 'info');
                        const battleResult = await withFetchIntercept(_uw, 'combat-choice', null, async (getCaptured) => {
                            clickButtonByText(o, '迎战');
                            for (let i = 0; i < 150; i++) {
                                await sleep(200);
                                if (!isRunning() || getCaptured()) break;
                            }
                            return getCaptured();
                        });
                        if (battleResult?.data) parseBattleResult(battleResult.data, monitorLog);
                        signalBattleEnd(battleResult);
                    } finally {
                        hiring = false;
                    }
                    return;
                }
                await hireProtector(encounterMode);
                return;
            }
            if (hiring && !isOverlayVisible('encounterOverlay')) {
                hiring = false;
            }
        }

        // 8. 商人
        if (isRunning() && isOverlayVisible('merchantOverlay')) {
            if (!shopping) await handleMerchant();
            return;
        }

        // 8.5. 昼夜自动切换
        if (window.__monitorRunning && config.dayNight.enabled && !dayNightState.transitioning) {
            const now = Date.now();
            const intervalMs = config.dayNight.checkIntervalSec * 1000;
            if (now - dayNightState.lastCheckTime >= intervalMs) {
                dayNightState.lastCheckTime = now;
                if (!hiring && !shopping && !isOverlayVisible('encounterOverlay') && !isOverlayVisible('merchantOverlay')) {
                    try {
                        const playerInfo = await getPlayerInfo();
                        if (playerInfo && playerInfo.data && typeof playerInfo.data.isNight === 'boolean') {
                            const newIsDay = !playerInfo.data.isNight;
                            const oldIsDay = dayNightState.currentIsDay;
                            dayNightState.currentIsDay = newIsDay;
                            updateDayNightIndicator(newIsDay);
                            if (oldIsDay !== null && oldIsDay !== newIsDay) {
                                monitorLog(`昼夜切换: ${oldIsDay ? '白天' : '夜晚'} → ${newIsDay ? '白天' : '夜晚'}`, 'action');
                                await handleDayNightTransition(newIsDay);
                            }
                            if (newIsDay) {
                                const isMeditating = playerInfo.data.isMeditating
                                    || document.getElementById('meditateBtn')?.classList.contains('meditating');
                                if (isMeditating) {
                                    dayNightState.meditateRetryCount = 0;
                                } else if (dayNightState.meditateRetryCount < config.dayNight.maxMeditateRetries) {
                                    dayNightState.meditateRetryCount++;
                                    const retryIntervalMs = config.dayNight.meditateRetryIntervalSec * 1000;
                                    dayNightState.lastCheckTime = now - intervalMs + retryIntervalMs;
                                    monitorLog(`白天未在冥想，重新冥想... (${dayNightState.meditateRetryCount}/${config.dayNight.maxMeditateRetries})`, 'warn');
                                    await switchToMeditate();
                                } else if (dayNightState.meditateRetryCount === config.dayNight.maxMeditateRetries) {
                                    dayNightState.meditateRetryCount++;
                                    monitorLog(`冥想重试已达上限(${config.dayNight.maxMeditateRetries}次)，不再重试`, 'error');
                                }
                            } else {
                                dayNightState.meditateRetryCount = 0;
                            }
                        }
                    } catch (e) { /* API 失败跳过 */ }
                }
            }
        }

        // 9. 神识不足（仅监控模式）
        if (window.__monitorRunning && window.__shenshiInsufficient) {
            window.__shenshiInsufficient = false;
            monitorLog('检测到神识不足...', 'info');

            const useHighLevelMeditate = config.general.highLevelMeditate;
            let instantMeditateOk = false;

            if (useHighLevelMeditate) {
                monitorLog('尝试高级冥想...', 'info');
                try {
                    const data = await callApi('POST', '/api/game/meditate/instant', { grade: 2 });
                    if (data && (data.code === 0 || data.code === 200)) {
                        instantMeditateOk = true;
                        monitorLog('高级冥想成功，点击冥想修炼...', 'success');
                        await sleep(500);
                        const medBtnOk = document.getElementById('meditateBtn');
                        if (medBtnOk && !medBtnOk.classList.contains('meditating')) {
                            medBtnOk.click();
                        }
                        await sleep(500);
                        if (clickButtonByText(document, '收功')) {
                            monitorLog('已点击收功', 'action');
                        }
                        await waitMeditateStop(monitorLog);
                        toggleAutoCheckbox(true);
                        monitorLog('已勾选自动', 'action');
                    } else {
                        monitorLog('高级冥想失败: ' + (data?.message || '未知原因') + '，转为冥想修炼', 'warn');
                    }
                } catch (e) {
                    monitorLog('高级冥想异常: ' + e.message + '，转为冥想修炼', 'error');
                }
            } else {
                monitorLog('高级冥想已关闭，转为普通冥想...', 'info');
            }

            if (instantMeditateOk) return;

            if (window._autoExploreRunning) {
                window.stopAutoExplore('神识不足', false);
            }
            const medBtn = document.getElementById('meditateBtn');
            if (medBtn && !medBtn.classList.contains('meditating')) {
                medBtn.click();
            }
            toggleAutoCheckbox(false);
            window.__monitorRunning = false;
            syncStopUI();
            monitorLog('神识不足，已自动冥想并停止脚本', 'warn');
        }
    }

    // --- 整理储物袋 ---
    let _lastMerge = 0;
    async function mergeInventory() {
        const now = Date.now();
        if (now - _lastMerge < 300000) return;
        _lastMerge = now;
        try {
            const r = await callApi('POST', '/api/game/inventory/merge', {});
            if (r?.code === 200) activeLog('整理储物袋完成', 'success');
            else activeLog(`整理储物袋失败: ${r?.message || '未知错误'}`, 'error');
        } catch {}
    }

    // --- 主循环管理 ---
    function startMainLoop() {
        if (window.__mainLoopInterval) return;
        window.__mainLoopInterval = setInterval(async () => {
            try {
                if (!isRunning()) return;
                await checkAllPopups();
                await mergeInventory();
            } catch (e) { console.error('[灵界助手] 主循环异常:', e); }
        }, 500);
    }

    function stopMainLoop() {
        if (window.__mainLoopInterval) {
            clearInterval(window.__mainLoopInterval);
            window.__mainLoopInterval = null;
        }
    }

    // --- 自动勾选"自动"复选框 ---
    function toggleAutoCheckbox(enable) {
        const labels = document.querySelectorAll('.adventure-toggle-label');
        for (const label of labels) {
            if (label.textContent.trim() === '自动') {
                const parent = label.closest('label') || label.parentElement;
                const checkbox = parent ? parent.querySelector('input[type="checkbox"]') : null;
                if (checkbox && checkbox.checked !== enable) {
                    checkbox.checked = enable;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }

    // --- 等待护道者列表加载 ---
    async function waitForProtectorList(timeout = 8000) {
        await sleep(800);
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!isRunning()) return 'stopped';
            const count = document.querySelectorAll('.protector-card:not(.protector-card--master)').length;
            const list = document.getElementById('encounterProtectorList');
            const listText = list ? list.textContent : '';
            const hasEmptyText = listText.includes('暂无空闲');

            if (list && hasEmptyText) return 'empty';
            if (count > 0) return 'loaded';
            await sleep(800);
        }
        return 'timeout';
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
        if (overlay) clickButtonByText(overlay, '雇佣护道');
    }

    // --- 关闭打赏弹窗 ---
    async function dismissTipDialog(timeout = 3000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!isRunning()) return false;
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

    // --- 共享护道者逻辑 ---
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
        if (rule.nameMatch && !rule.nameMatch.split('|').some(k => prot.name.includes(k))) return false;
        if (rule.excludeName && prot.name.includes(rule.excludeName)) return false;
        if (rule.realmMatch && !rule.realmMatch.split('|').some(k => prot.realm.includes(k))) return false;
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
            const realmKey = rule.realmMatch;
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

    async function refreshAndRecurse(attempt, logFn, retryDelay) {
        dismissModal();
        await sleep(retryDelay);
        if (!isRunning()) return false;
        clickHireProtector();
        await sleep(retryDelay);
        if (!isRunning()) return false;
        const loaded = await waitForProtectorList(8000);
        if (loaded === 'timeout') return false;
        return await findAndHireProtector(attempt + 1, logFn);
    }

    async function findAndHireProtector(attempt, logFn) {
        if (!isRunning()) return false;
        const protectorPriorities = config.protectors.priorities;
        const maxRetries = config.protectors.maxRetries;
        const retryDelay = config.protectors.retryDelayMs;

        const items = document.querySelectorAll('.protector-card:not(.protector-card--master)');
        if (items.length === 0) {
            if (!isRunning()) return false;
            if (attempt < maxRetries) {
                logFn(`[尝试${attempt}] 未找到合适护道者，刷新列表...`, 'action');
                return await refreshAndRecurse(attempt, logFn, retryDelay);
            }
            logFn(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`, 'error');
            return false;
        }

        const priceThreshold = config.protectors.hirePriceThreshold || 0;
        const wantSolo = config.protectors.hireMode === 'solo';
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
            let price = 0;
            const btns = item.querySelectorAll('.prot-btn');
            for (const btn of btns) {
                const isSoloBtn = btn.classList.contains('prot-btn--solo');
                if (wantSolo === isSoloBtn) {
                    const numMatch = btn.textContent.replace(/\s+/g, '').match(/(\d[\d,]*)$/);
                    if (numMatch) price = parseInt(numMatch[1].replace(/,/g, ''));
                    break;
                }
            }
            protectors.push({ name, realm, attack, index, price });
        });

        let selected = selectProtectors(protectors, protectorPriorities);
        if (priceThreshold > 0 && selected && selected.length > 0) {
            selected = selected.filter(p => {
                if (p.price > priceThreshold) {
                    logFn(`跳过 ${p.name}（${p.realm}），价格${p.price}超过阈值${priceThreshold}`, 'warn');
                    return false;
                }
                return true;
            });
        }
        if (!selected || selected.length === 0) {
            if (!isRunning()) return false;
            if (attempt < maxRetries) {
                logFn(`[尝试${attempt}] 未找到合适护道者，刷新列表...`, 'action');
                return await refreshAndRecurse(attempt, logFn, retryDelay);
            }
            logFn(`[尝试${attempt}] ${maxRetries}次均未找到合适护道者`, 'error');
            return false;
        }

        for (let i = 0; i < selected.length; i++) {
            if (!isRunning()) return false;
            const candidate = selected[i];
            logFn(`[尝试${attempt}] 选择: ${candidate.name} ${candidate.realm} 攻击:${candidate.attack} (${candidate.priority})`, 'info');

            const resp = await withFetchIntercept(_uw, 'encounter-hire-protector', null, async (getCaptured) => {
                if (items[candidate.index]) {
                    const btns = items[candidate.index].querySelectorAll('.prot-btn');
                    const wantSolo = config.protectors.hireMode === 'solo';
                    for (const btn of btns) {
                        const text = btn.textContent.trim();
                        if (wantSolo) {
                            if (text.includes('单独') || text.includes('单 独')) {
                                btn.click();
                                logFn(` 已点击单独雇佣 ${candidate.name}`, 'action');
                                break;
                            }
                        } else {
                            if (text.includes('协同') || text.includes('协 同')) {
                                btn.click();
                                logFn(` 已点击协同雇佣 ${candidate.name}`, 'action');
                                break;
                            }
                        }
                    }
                }
                for (let i = 0; i < 40; i++) {
                    await sleep(200);
                    if (!isRunning() || getCaptured()) break;
                }
                return getCaptured();
            });
            if (!isRunning()) return false;

            let hireResult;
            if (!resp) {
                hireResult = { status: 'no_response' };
            } else if (resp.code === 400) {
                hireResult = { status: 'failed', message: resp.message || '雇佣失败' };
            } else {
                hireResult = { status: 'success' };
            }

            if (hireResult.status === 'failed') {
                logFn(` 雇佣失败(code=400): ${hireResult.message}，尝试下一个候选者`, 'warn');
                continue;
            }

            if (hireResult.status === 'success') {
                logFn(' 雇佣成功！', 'success');
                return resp;
            }

            const toast = window.__lastToast || '';
            if (toast) {
                logFn(` 护道者提示: ${toast}`, 'info');
            }
            logFn(' 雇佣完成（无明确响应）', 'warn');
            return resp || true;
        }

        if (!isRunning()) return false;
        if (attempt < maxRetries) {
            logFn(`[尝试${attempt}] 当前列表所有护道者不可用，刷新...`, 'action');
            return await refreshAndRecurse(attempt, logFn, retryDelay);
        }
        logFn(`[尝试${attempt}] ${maxRetries}次尝试均失败`, 'error');
        return false;
    }

    // --- 逃跑逻辑 ---
    let hiring = false;
    let lastEncounterTime = 0;
    async function tryEscape(maxAttempts = 5) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (!isRunning()) return false;
            monitorLog(`逃跑尝试 ${attempt}/${maxAttempts}...`, 'action');
            const overlay = document.getElementById('encounterOverlay');
            const clicked = overlay ? clickButtonByText(overlay, '逃跑') : false;
            if (!clicked) {
                monitorLog('未找到逃跑按钮', 'error');
                return false;
            }

            await sleep(800);
            if (!isRunning()) return false;
            const stillVisible = isOverlayVisible('encounterOverlay');
            if (!stillVisible) {
                monitorLog('逃跑成功！', 'success');
                return true;
            }
            monitorLog('逃跑失败，遭遇面板仍在，继续尝试...', 'warn');
            await sleep(500);
        }
        monitorLog(`${maxAttempts}次逃跑均失败`, 'error');
        return false;
    }

    // --- 等待冥想完全停止 ---
    async function waitMeditateStop(logFn) {
        for (let i = 0; i < 20; i++) {
            await sleep(1500);
            if (!isRunning()) return false;
            const medBtn = document.getElementById('meditateBtn');
            if (!(medBtn && medBtn.classList.contains('meditating'))) return true;
            const sb = document.querySelector('.btn-stop-meditate');
            if (sb) {
                if (logFn) logFn('检测到重新冥想，再次收功...', 'action');
                sb.click();
            }
        }
        return true;
    }

    // --- 昼夜自动切换 ---
    function updateDayNightIndicator(isDay) {
        const el = document.getElementById('daynight-indicator');
        if (!el) return;
        if (isDay === null) { el.style.display = 'none'; return; }
        el.style.display = '';
        el.className = 'mp-daynight-indicator ' + (isDay ? 'day' : 'night');
        el.textContent = isDay ? '白天 - 冥想中' : '夜晚 - 探索中';
    }

    function removeDayNightIndicator() {
        const el = document.getElementById('daynight-indicator');
        if (el) el.style.display = 'none';
    }

    async function switchToExplore() {
        dayNightState.transitioning = true;
        try {
            const medBtn = document.getElementById('meditateBtn');
            if (medBtn && medBtn.classList.contains('meditating')) {
                const stopBtn = document.querySelector('.btn-stop-meditate');
                if (stopBtn) {
                    stopBtn.click();
                    monitorLog('收功中...', 'action');
                    await waitMeditateStop(monitorLog);
                }
            }
            if (!window.__monitorRunning) return;
            toggleAutoCheckbox(true);
            monitorLog('夜晚降临，开始探索', 'success');
            updateDayNightIndicator(false);
        } finally {
            dayNightState.transitioning = false;
        }
    }

    async function switchToMeditate() {
        dayNightState.transitioning = true;
        try {
            toggleAutoCheckbox(false);
            if (!window.__monitorRunning) return;
            const medBtn = document.getElementById('meditateBtn');
            if (medBtn && !medBtn.classList.contains('meditating')) {
                medBtn.click();
                monitorLog('白天到来，进入冥想', 'success');
            }
            updateDayNightIndicator(true);
        } finally {
            dayNightState.transitioning = false;
        }
    }

    async function handleDayNightTransition(newIsDay) {
        if (newIsDay) {
            await switchToMeditate();
        } else {
            await switchToExplore();
        }
    }

    // --- 启动前校验（虚空淬体、道韵加成、收功） ---
    async function preStartCheck(mode) {
        const logFn = mode === 'monitor' ? monitorLog : thLog;

        const [playerInfo, masterInfo] = await Promise.all([
            getPlayerInfo().catch(() => null),
            getMasterOverview().catch(() => null),
        ]);
        if (playerInfo && playerInfo.data) {
            if (playerInfo.data.voidBodyBuffExpire) {
                const remain = Math.max(0, Math.round((playerInfo.data.voidBodyBuffExpire - Date.now()) / 1000));
                const h = Math.floor(remain / 3600);
                const m = Math.floor((remain % 3600) / 60);
                const s = remain % 60;
                logFn(`虚空淬体生效中，倍率 x${playerInfo.data.voidBodyBuffMultiplier}，剩余 ${h}时${m}分${s}秒`, 'success');
            } else if (!window._origConfirm('当前没有虚空淬体加成，是否继续？')) {
                return { ok: false };
            }
        }

        if (masterInfo && masterInfo.data) {
            if (masterInfo.data.exploreBoostEnabled) {
                logFn('道韵加成已开启', 'success');
            } else if (!window._origConfirm('道韵加成未开启，是否继续？')) {
                return { ok: false };
            }
        }

        if (playerInfo && playerInfo.data && playerInfo.data.isMeditating) {
            const status = document.getElementById(mode === 'monitor' ? 'monitor-status' : 'treasure-status');
            if (status) status.innerHTML = '<span class="mp-status-dot"></span>收功中...';
            logFn('正在收功...', 'action');

            const stopBtn = document.querySelector('.btn-stop-meditate');
            if (stopBtn) stopBtn.click();

            const stopOk = await waitMeditateStop(logFn);
            if (!stopOk) return { ok: false };
            logFn('收功完成', 'success');
        }

        if (config.dayNight.enabled && playerInfo && playerInfo.data) {
            dayNightState.currentIsDay = typeof playerInfo.data.isNight === 'boolean' ? !playerInfo.data.isNight : null;
            dayNightState.lastCheckTime = 0;
        }

        return { ok: true, playerInfo };
    }

    // --- 逃跑后处理 ---
    function handleEscapeResult(escaped, reason, mode = 'monitor') {
        if (!escaped) {
            monitorLog('逃跑失败，继续探索...', 'warn');
            return;
        }
        if (config.protectors.afterEscape === 'stop') {
            if (mode === 'monitor') {
                monitorLog('逃跑成功！点击冥想修炼...', 'success');
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                    if (btn.offsetParent !== null && btn.textContent.trim().includes('冥想修炼')) {
                        btn.click();
                        break;
                    }
                }
                monitorLog(reason || '已逃跑并进入冥想，脚本停止', 'success');
                window.__monitorRunning = false;
                if (!window.__thRunning) stopMainLoop();
                syncStopUI();
            } else {
                thLog('逃跑成功，停止寻宝', 'success');
                syncStopTHUI();
                if (!window.__monitorRunning) stopMainLoop();
            }
        } else {
            const logFn = mode === 'monitor' ? monitorLog : thLog;
            logFn('逃跑成功！继续...', 'success');
        }
    }

    // --- 雇佣护道者主流程 ---
    async function hireProtector(mode = 'monitor') {
        const logFn = mode === 'monitor' ? monitorLog : thLog;

        if (hiring) return;
        if (!isRunning()) return;
        hiring = true;
        const now = Date.now();
        if (now - lastEncounterTime < 3000) { hiring = false; return; }
        lastEncounterTime = now;

        try {
            logFn('遭遇妖兽！开始雇佣流程...', 'info');
            if (!isRunning()) return;
            const overlay = document.getElementById('encounterOverlay');
            if (!overlay) {
                logFn('未找到遭遇界面', 'error');
                return;
            }

            const overlayBtns = overlay.querySelectorAll('button');
            const step1 = clickButtonByText(overlay, '雇佣护道');
            if (!step1) {
                logFn('未找到雇佣护道按钮', 'error');
                return;
            }
            logFn('已点击雇佣护道', 'action');
            if (!isRunning()) return;
            const loaded = await waitForProtectorList(8000);
            if (!isRunning()) return;

            if (loaded === 'empty') {
                dismissModal();
                await sleep(800);
                if (!isRunning()) return;

                if (config.protectors.onNoProtector === 'escape') {
                    logFn('暂无空闲护道者，尝试逃跑...', 'info');
                    const escaped = await tryEscape();
                    if (!isRunning()) return;
                    handleEscapeResult(escaped, '已逃跑并进入冥想，脚本停止', mode);
                    return;
                }

                const threshold = config.protectors.fightAttackThreshold;
                if (threshold > 0) {
                    const atkEl = document.getElementById('encounterMonsterAtk');
                    if (atkEl) {
                        const enemyAttack = parseInt(atkEl.textContent);
                        if (enemyAttack > threshold) {
                            logFn(`妖兽攻击${enemyAttack}超过阈值${threshold}，转为逃跑...`, 'warn');
                            if (!isRunning()) return;
                            const escaped = await tryEscape();
                            if (!isRunning()) return;
                            handleEscapeResult(escaped, '妖兽攻击超过阈值，已逃跑并进入冥想，脚本停止', mode);
                            return;
                        }
                    }
                }

                logFn('暂无空闲护道者，选择迎战...', 'info');
                if (!isRunning()) return;
                const fightOverlay = document.getElementById('encounterOverlay');
                if (fightOverlay) {
                    const battleResult = await withFetchIntercept(_uw, 'combat-choice', null, async (getCaptured) => {
                        clickButtonByText(fightOverlay, '迎战');
                        for (let i = 0; i < 150; i++) {
                            await sleep(200);
                            if (!isRunning() || getCaptured()) break;
                        }
                        return getCaptured();
                    });
                    if (battleResult?.data) parseBattleResult(battleResult.data, logFn);
                    signalBattleEnd(battleResult);
                }
                return;
            }

            if (loaded === 'timeout') {
                logFn('护道者列表加载超时', 'error');
                return;
            }

            const hired = await findAndHireProtector(1, logFn);
            if (!isRunning()) return;
            if (!hired) {
                logFn('雇佣失败，无合适人选', 'error');
                return;
            }

            if (hired?.data) parseBattleResult(hired.data, logFn);
            signalBattleEnd(hired);
        } catch (e) {
            logFn('错误: ' + e.message, 'error');
        } finally {
            hiring = false;
        }
    }

    let _battleEndResolve = null;
    let _pendingBattleResult = undefined;
    function signalBattleEnd(result) {
        if (_battleEndResolve) {
            const r = _battleEndResolve;
            _battleEndResolve = null;
            _pendingBattleResult = undefined;
            r(result);
        } else {
            _pendingBattleResult = result;
        }
    }
    async function waitForBattleEnd(maxWait = 60000) {
        if (_pendingBattleResult !== undefined) {
            const r = _pendingBattleResult;
            _pendingBattleResult = undefined;
            return r;
        }
        const start = Date.now();
        while (Date.now() - start < maxWait) {
            if (!isRunning()) return null;
            if (_pendingBattleResult !== undefined) {
                const r = _pendingBattleResult;
                _pendingBattleResult = undefined;
                return r;
            }
            await sleep(300);
        }
        return null;
    }
    function parseBattleResult(data, logFn) {
        if (!data?.logs) return;
        for (const log of data.logs) {
            const m = log.match(/你击败了\s*(.+?)！获得\s*(\d+)\s*修为.*?(\d+)\s*灵石/);
            if (m) {
                logFn(`击败 ${m[1]}，获得 ${m[2]} 修为，${m[3]} 灵石`, 'success');
                return;
            }
        }
        if (data.status === 'defeat') logFn('战斗失败', 'error');
    }

    // --- 商人逻辑 ---
    let shopping = false;
    let dying = false;
    async function handleMerchant() {
        if (shopping) return;
        if (!isRunning()) return;
        shopping = true;
        try {
            activeLog()('遇到云游商人！', 'info');
            if (!isRunning()) { shopping = false; return; }
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
            const expensiveItems = allItems.filter(i => i.price > mcfg.highPriceThreshold);
            if (expensiveItems.length > 0) {
                expensiveItems.sort((a, b) => b.price - a.price);
                clickBuyItem(expensiveItems[0].name);
                bought = { ...expensiveItems[0], reason: '高价物品' };
            }
            if (!bought) {
                const itemKeywords = mcfg.itemKeywords || [];
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
            if (!bought && mcfg.fallbackToExpensive && allItems.length > 0) {
                const sorted = [...allItems].sort((a, b) => b.price - a.price);
                clickBuyItem(sorted[0].name);
                bought = { ...sorted[0], reason: '最贵物品' };
            }
            if (!bought) {
                activeLog()('无可购买商品，婉拒告辞', 'info');
                const leaveBtn = document.getElementById('merchantLeaveBtn');
                if (leaveBtn) leaveBtn.click();
            }

            for (let i = 0; i < 10; i++) {
                await sleep(100);
                const stillVisible = document.querySelector('.modal-overlay:not([style*="display: none"]) .merchant-item');
                if (!stillVisible) break;
            }

            const logFn = activeLog();
            logFn('商人物品列表:', 'info');
            allItems.forEach(item => logFn(` ${item.name} (${item.price}灵石)`, 'info'));
            if (bought) {
                logFn(`购买: ${bought.name} (${bought.price}灵石) [${bought.reason}]`, 'success');
            }
            logFn('云游商人已处理', 'success');
        } catch (e) {
            activeLog()('商人错误: ' + e.message, 'error');
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

    // --- 死亡复活流程 ---
    async function handleDeath() {
        monitorLog('检测到死亡画面，点击引渡归来...', 'info');
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
        monitorLog('已点击引渡归来，等待复活...', 'action');
        await sleep(800);

        monitorLog('点击地图按钮...', 'action');
        const iconBtns = document.querySelectorAll('.btn-icon');
        for (const btn of iconBtns) {
            if (btn.textContent.includes('地图')) {
                btn.click();
                break;
            }
        }
        await sleep(1000);

        await withFetchIntercept(_uw, '/api/game/move',
            (data) => data.code === 200 && typeof data.data === 'string',
            async (getCaptured) => {
                const nodes = document.querySelectorAll('.map-node');
                if (nodes.length >= 4) {
                    const nameEl = nodes[3].querySelector('.map-node-name');
                    const mapName = nameEl ? nameEl.textContent.trim() : '第四个地图';
                    monitorLog(`点击第四个地图: ${mapName}...`, 'action');
                    nodes[3].click();
                }

                for (let i = 0; i < 25; i++) {
                    await sleep(200);
                    if (getCaptured()) break;
                }

                if (getCaptured()) {
                    monitorLog(getCaptured().data, 'success');
                } else {
                    monitorLog('移动超时，未收到响应', 'warn');
                }
            }
        );
        await sleep(300);

        monitorLog('死亡后流程完成，继续探索...', 'success');
        toggleAutoCheckbox(true);
    }

    // ==================== 寻宝功能 ====================

    async function getTreasureMapItemId() {
        const resp = await callApi('GET', '/api/game/inventory');
        if (!resp || resp.code !== 200) return null;
        const items = resp.data || [];
        const map = items.find(i => i.name === '藏宝图' && i.quantity > 0);
        if (!map) return null;
        return { itemId: map.itemId || map.id, quantity: map.quantity };
    }

    async function useTreasureMap(itemId) {
        const eventName = '__useItemResult_' + Date.now();
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                window.removeEventListener(eventName, handler);
                reject(new Error('超时'));
            }, 11000);
            const handler = (e) => {
                clearTimeout(timeout);
                window.removeEventListener(eventName, handler);
                resolve(e.detail);
            };
            window.addEventListener(eventName, handler);
            const hook = document.createElement('script');
            hook.textContent = `(async()=>{const eventName=${JSON.stringify(eventName)};let done=false;let watchdog=null;let restore=()=>{};const emit=(detail)=>window.dispatchEvent(new CustomEvent(eventName,{detail}));const finish=(detail)=>{if(done)return;done=true;if(watchdog)clearTimeout(watchdog);restore();emit(detail)};try{const _post=api.post;const _orig=_post.bind(api);restore=()=>{api.post=_post};watchdog=setTimeout(()=>finish({code:-1,message:'超时'}),10000);api.post=function(p,b){if(p==='/api/game/use-item'){b=Object.assign({},b,{quantity:${config.treasureHunt.useQuantity ?? 10}});if(!done){done=true;if(watchdog)clearTimeout(watchdog);restore();try{const r=_orig(p,b);Promise.resolve(r).then(d=>emit(d)).catch(()=>emit({code:-1,message:'请求失败'}));return r}catch(e){emit({code:-1,message:e.message});throw e}}}return _orig(p,b)};await useItem(${JSON.stringify(itemId)})}catch(e){finish({code:-1,message:e.message})}})()`;
            document.head.appendChild(hook);
            hook.remove();
        });
    }

    async function autoTreasureHunt() {
        const thStartTime = Date.now();
        thLog('=== 开始自动寻宝 ===', 'success');
        let used = 0, encounterCount = 0, totalXiuwei = 0, totalLingshi = 0;
        const batch = config.treasureHunt.batchSize || Infinity;
        const intervalMs = config.treasureHunt.intervalMs;

        try {
            while (window.__thRunning && used < batch) {
                let mapInfo;
                try {
                    mapInfo = await getTreasureMapItemId();
                } catch (e) {
                    thLog(`获取藏宝图失败: ${e.message}`, 'error');
                    await sleep(intervalMs);
                    continue;
                }
                if (!mapInfo) {
                    thLog('没有更多藏宝图了', 'warn');
                    break;
                }
                if (mapInfo.quantity <= 0) {
                    thLog('藏宝图已用完', 'warn');
                    break;
                }

                thLog(`使用藏宝图 (剩余 ${mapInfo.quantity} 张)...`, 'action');

                const playerInfo = await getPlayerInfo().catch(() => null);
                const isMeditating = (playerInfo && playerInfo.data && playerInfo.data.isMeditating)
                    || (document.getElementById('meditateBtn')?.classList.contains('meditating'));
                if (isMeditating) {
                    thLog('正在收功...', 'action');
                    const stopBtn = document.querySelector('.btn-stop-meditate');
                    if (stopBtn) stopBtn.click();
                    const stopOk = await waitMeditateStop(thLog);
                    if (!stopOk || !window.__thRunning) break;
                    thLog('收功完成', 'success');
                }

                let result;
                try {
                    result = await useTreasureMap(mapInfo.itemId);
                } catch (e) {
                    thLog(`使用失败: ${e.message}`, 'error');
                    await sleep(intervalMs);
                    continue;
                }
                if (!window.__thRunning) break;

                if (!result || result.code !== 200) {
                    const errMsg = result?.message || '未知错误';
                    thLog(`使用失败: ${errMsg}`, 'error');
                    if (errMsg.includes('神识不足')) {
                        thLog('神识不足，停止寻宝', 'warn');
                        break;
                    }
                    if (errMsg.includes('未处理的遇敌')) {
                        thLog('等待遇敌处理...', 'action');
                        // 等待 encounterOverlay 出现
                        for (let i = 0; i < 20; i++) {
                            await sleep(500);
                            if (!window.__thRunning) break;
                            if (isOverlayVisible('encounterOverlay')) break;
                        }
                        // 等待 encounterOverlay 消失（主循环处理完成）
                        for (let i = 0; i < 60; i++) {
                            await sleep(500);
                            if (!window.__thRunning) break;
                            if (!isOverlayVisible('encounterOverlay')) break;
                        }
                        continue;
                    }
                    await sleep(intervalMs);
                    continue;
                }

                used++;

                const rd = result?.data;
                if (rd) {
                    if (rd.type === 'encounter') {
                        thLog(`进入 ${rd.treasureLevelName || '未知洞府'}`, 'warn');
                    } else {
                        const summary = rd.message || rd.desc || rd.text || (typeof rd === 'string' ? rd : JSON.stringify(rd));
                        thLog(`结果: ${summary}`, 'success');
                    }
                }

                if (isOverlayVisible('encounterOverlay')) {
                    encounterCount++;
                    const name = document.getElementById('encounterMonsterName')?.textContent || '';
                    const realm = document.getElementById('encounterMonsterRealm')?.textContent || '';
                    const atk = document.getElementById('encounterMonsterAtk')?.textContent || '';
                    const hp = document.getElementById('encounterMonsterHp')?.textContent || '';
                    thLog(`遭遇 ${name} (${realm}) 攻:${atk} 血:${hp}`, 'warn');
                    const battleData = await waitForBattleEnd();
                    if (battleData?.data?.logs) {
                        for (const log of battleData.data.logs) {
                            const m = log.match(/你击败了\s*(.+?)！获得\s*(\d+)\s*修为.*?(\d+)\s*灵石/);
                            if (m) {
                                totalXiuwei += parseInt(m[2]);
                                totalLingshi += parseInt(m[3]);
                                break;
                            }
                        }
                    }
                    if (!window.__thRunning) break;
                } else {
                    thLog('寻宝完成', 'success');
                }

                if (!window.__thRunning) break;
                await sleep(intervalMs);
            }
        } catch (e) {
            thLog(`寻宝异常: ${e.message}`, 'error');
        }

        const elapsed = Math.round((Date.now() - thStartTime) / 1000);
        const em = Math.floor(elapsed / 60), es = elapsed % 60;
        thLog(`=== 寻宝结束，共使用 ${used} 次藏宝图，遭遇 ${encounterCount} 次，获得 ${totalXiuwei} 修为 ${totalLingshi} 灵石，耗时 ${em}分${es}秒 ===`, 'success');
        const medBtn = document.getElementById('meditateBtn');
        if (medBtn && !medBtn.classList.contains('meditating')) {
            medBtn.click();
            thLog('已进入冥想', 'success');
        }
        syncStopTHUI();
        if (!window.__monitorRunning) stopMainLoop();
    }

    // ==================== 铭文洗练功能 ====================

    let inscriptionStats = {
        totalPulls: 0,
        keptCount: 0,
        discardedCount: 0,
        bestResult: null,
        startTime: null,
    };

    function updateInscriptionStatusUI(status) {
        const statusEl = document.getElementById('inscription-status');
        if (!statusEl) return;

        switch (status) {
            case 'running':
                statusEl.innerHTML = '<span class="mp-status-dot"></span>洗练中';
                statusEl.className = 'mp-status-line status-running';
                break;
            case 'paused':
                statusEl.innerHTML = '<span class="mp-status-dot"></span>暂停';
                statusEl.className = 'mp-status-line status-paused';
                break;
            case 'discarding':
                statusEl.innerHTML = '<span class="mp-status-dot"></span>放弃中';
                statusEl.className = 'mp-status-line status-discarding';
                break;
            case 'idle':
            default:
                statusEl.innerHTML = '<span class="mp-status-dot"></span>待命';
                statusEl.className = 'mp-status-line status-idle';
                break;
        }
    }

    function updateInscriptionStatsDisplay() {
        const totalEl = document.getElementById('inscription-stat-total');
        const keptEl = document.getElementById('inscription-stat-kept');
        const bestEl = document.getElementById('inscription-stat-best');

        if (totalEl) totalEl.textContent = inscriptionStats.totalPulls;
        if (keptEl) keptEl.textContent = inscriptionStats.keptCount;
        if (bestEl && inscriptionStats.bestResult) {
            bestEl.textContent = `${inscriptionStats.bestResult.stat}+${inscriptionStats.bestResult.value}`;
        }
    }

    function parseInscriptionResultCards() {
        const grid = document.querySelector('.insc-result-grid');
        if (!grid) return [];

        const cards = grid.querySelectorAll('.insc-result-card');
        const results = [];

        cards.forEach(card => {
            const qualityEl = card.querySelector('.insc-result-card__quality');
            const statEl = card.querySelector('.insc-result-card__stat');
            const valueEl = card.querySelector('.insc-result-card__value');

            if (!statEl || !valueEl) return;

            const quality = qualityEl ? qualityEl.textContent.trim() : '';
            const stat = statEl.textContent.trim();
            const valueText = valueEl.textContent.trim();
            const value = parseInt(valueText.replace(/[+]/g, '')) || 0;

            results.push({
                quality,
                stat,
                value,
                element: card,
                rawText: `${quality ? quality + ' ' : ''}${stat} +${value}`
            });
        });

        return results;
    }

    function checkInscriptionTargetMet(results) {
        const inscriptionConfig = config.inscription;
        if (inscriptionConfig.targetStats.length === 0) {
            return { met: true, matches: [], reason: '无目标' };
        }

        const matches = [];
        for (const result of results) {
            for (const target of inscriptionConfig.targetStats) {
                if (result.stat.includes(target.stat)) {
                    if (!target.minValue || result.value >= target.minValue) {
                        matches.push({
                            card: result,
                            target: target.stat,
                            quality: result.quality,
                            value: result.value,
                            required: target.minValue || 0
                        });
                        break;
                    }
                }
            }
        }

        const uniqueMatches = [];
        const seenCards = new Set();
        for (const match of matches) {
            if (!seenCards.has(match.card.rawText)) {
                seenCards.add(match.card.rawText);
                uniqueMatches.push(match);
            }
        }

        let met = false;
        if (inscriptionConfig.stopMode === 'any') {
            met = uniqueMatches.length > 0;
        } else if (inscriptionConfig.stopMode === 'all') {
            const matchedStats = new Set(uniqueMatches.map(m => m.target));
            const requiredStats = new Set(inscriptionConfig.targetStats.filter(t => t.minValue > 0).map(t => t.stat));
            met = [...requiredStats].every(s => matchedStats.has(s));
        }

        const reason = met ? '目标达成' : (uniqueMatches.length > 0 ? `部分匹配(${uniqueMatches.length})` : '无匹配');

        return { met, matches: uniqueMatches, reason };
    }

    function getBestInscriptionResult(results) {
        const inscriptionConfig = config.inscription;
        let best = null;
        let bestScore = -1;

        for (const r of results) {
            let score = 0;
            for (const target of inscriptionConfig.targetStats) {
                if (r.stat.includes(target.stat)) {
                    score += r.value * 10;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                best = r;
            }
        }
        return best;
    }

    function clickInscriptionTenPull() {
        const buttons = document.querySelectorAll('.modal-action-btn__text');
        for (const btn of buttons) {
            if (btn.textContent.trim() === '十连灵纹') {
                const clickTarget = btn.closest('button') || btn;
                clickTarget.click();
                return true;
            }
        }
        return false;
    }

    function clickInscriptionDiscardAll() {
        const buttons = document.querySelectorAll('button.modal-btn--outline');
        for (const btn of buttons) {
            if (btn.textContent.trim() === '全部放弃') {
                btn.click();
                inscriptionLog('已点击「全部放弃」', 'action');
                return true;
            }
        }
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
            if (btn.onclick && btn.onclick.toString().includes('discardAllInscriptionsFromTenPull')) {
                btn.click();
                inscriptionLog('已点击「全部放弃」（onclick匹配）', 'action');
                return true;
            }
        }
        return false;
    }

    async function handleInscriptionDiscardConfirmDialog(timeout = 3000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const confirmBtnById = document.getElementById('gameDialogConfirmBtn');
            const cancelBtnById = document.getElementById('gameDialogCancelBtn');
            if (confirmBtnById && cancelBtnById) {
                const cText = confirmBtnById.textContent.trim();
                if (cText === '确 定' || cText === '确定') {
                    inscriptionLog('确认弹窗，点击「确定」', 'action');
                    confirmBtnById.click();
                    return true;
                }
            }

            const btnRows = document.querySelectorAll('.modal-btn-row');
            for (const row of btnRows) {
                const cancelBtn = row.querySelector('#gameDialogCancelBtn, .modal-btn--outline');
                const confirmBtn = row.querySelector('#gameDialogConfirmBtn, .modal-btn--gold');
                const cancelText = cancelBtn ? cancelBtn.textContent.trim() : '';
                const confirmText = confirmBtn ? confirmBtn.textContent.trim() : '';
                if ((cancelText === '取 消' || cancelText === '取消') &&
                    (confirmText === '确 定' || confirmText === '确定')) {
                    inscriptionLog('确认弹窗，点击「确定」', 'action');
                    confirmBtn.click();
                    return true;
                }
            }
            await sleep(200);
        }
        inscriptionLog('等待确认弹窗超时', 'warn');
        return false;
    }

    async function waitForInscriptionResultGrid(timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const grid = document.querySelector('.insc-result-grid');
            if (grid && grid.children.length > 0) {
                await sleep(config.inscription.resultAnimationMs);
                return true;
            }
            await sleep(300);
        }
        return false;
    }

    async function waitForInscriptionResultGridGone(timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const grid = document.querySelector('.insc-result-grid');
            if (!grid || grid.children.length === 0 || grid.offsetParent === null) {
                return true;
            }
            await sleep(300);
        }
        return false;
    }

    async function waitForInscriptionTenPullButton(timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const buttons = document.querySelectorAll('.modal-action-btn__text');
            for (const btn of buttons) {
                if (btn.textContent.trim() === '十连灵纹') {
                    const parentBtn = btn.closest('button');
                    if (parentBtn && !parentBtn.disabled && parentBtn.offsetParent !== null) {
                        return true;
                    }
                }
            }
            await sleep(500);
        }
        return false;
    }

    async function performInscriptionDiscard() {
        updateInscriptionStatusUI('discarding');
        inscriptionLog('开始放弃流程...', 'action');

        const discarded = clickInscriptionDiscardAll();
        if (!discarded) {
            inscriptionLog('未找到「全部放弃」按钮', 'error');
            const closeBtn = document.querySelector('.modal-close, [class*="close"]');
            if (closeBtn) {
                closeBtn.click();
                inscriptionLog('已关闭结果面板', 'info');
            }
            updateInscriptionStatusUI('running');
            return false;
        }

        await sleep(500);
        const confirmed = await handleInscriptionDiscardConfirmDialog(3000);
        if (!confirmed) {
            inscriptionLog('未检测到确认弹窗', 'warn');
        } else {
            inscriptionLog('已确认放弃', 'success');
        }

        await sleep(800);

        if (config.inscription.autoCloseDialogs) {
            const continueBtns = document.querySelectorAll('button');
            for (const btn of continueBtns) {
                if (btn.textContent.trim() === '继续') {
                    btn.click();
                    await sleep(300);
                }
            }
        }

        inscriptionStats.discardedCount++;
        inscriptionLog(`已放弃 (累计: ${inscriptionStats.discardedCount}) | 等待 ${config.inscription.discardDelayMs/1000}s`, 'info');
        await sleep(config.inscription.discardDelayMs);

        updateInscriptionStatusUI('running');
        return true;
    }

    async function performInscriptionKeep(results, matches) {
        inscriptionLog('发现符合要求的铭文！', 'success');
        matches.forEach(m => {
            inscriptionLog(`  ✓ ${m.target} +${m.value} (要求≥${m.required})${m.quality ? ' [' + m.quality + ']' : ''}`, 'success');
        });

        const best = getBestInscriptionResult(results);
        if (best) {
            inscriptionLog(`  最佳: ${best.stat} +${best.value}${best.quality ? ' [' + best.quality + ']' : ''}`, 'success');
            if (!inscriptionStats.bestResult || best.value > inscriptionStats.bestResult.value) {
                inscriptionStats.bestResult = { quality: best.quality, stat: best.stat, value: best.value };
            }
        }

        inscriptionStats.keptCount++;
        updateInscriptionStatsDisplay();

        if (config.inscription.notifyOnComplete && Notification.permission === 'granted') {
            new Notification('铭文洗练完成', {
                body: `第${inscriptionStats.totalPulls}次十连达成！${matches.map(m => `${m.target}+${m.value}`).join(', ')}`,
                icon: 'https://ling.muge.info/favicon.ico'
            });
        }
    }

    async function startInscriptionPulling() {
        if (window.__inscriptionRunning) {
            inscriptionLog('洗练已在运行中', 'warn');
            return;
        }

        inscriptionStats = {
            totalPulls: 0,
            keptCount: 0,
            discardedCount: 0,
            bestResult: null,
            startTime: Date.now(),
        };
        updateInscriptionStatsDisplay();

        window.__inscriptionRunning = true;
        window.__inscriptionPaused = false;
        updateInscriptionStatusUI('running');
        inscriptionLog('=== 开始铭文洗练 ===', 'success');
        inscriptionLog(`目标: ${config.inscription.targetStats.map(t => `${t.stat}≥${t.minValue || 0}`).join(', ')}`, 'info');
        inscriptionLog(`模式: ${config.inscription.stopMode === 'any' ? '任一满足' : (config.inscription.stopMode === 'all' ? '全部满足' : '永不停')}`, 'info');

        try {
            while (window.__inscriptionRunning) {
                if (window.__inscriptionPaused) {
                    await sleep(1000);
                    continue;
                }

                if (config.inscription.maxAttempts > 0 && inscriptionStats.totalPulls >= config.inscription.maxAttempts) {
                    inscriptionLog(`达到最大次数 ${config.inscription.maxAttempts}，停止`, 'warn');
                    break;
                }

                if (config.inscription.autoCloseDialogs) {
                    const gridGone = await waitForInscriptionResultGridGone(5000);
                    if (!gridGone) {
                        const closeBtns = document.querySelectorAll('.modal-close, .btn-close, [class*="close-btn"]');
                        for (const btn of closeBtns) {
                            if (btn.offsetParent !== null) {
                                btn.click();
                                break;
                            }
                        }
                        await sleep(500);
                    }
                }

                const btnAvailable = await waitForInscriptionTenPullButton(5000);
                if (!btnAvailable) {
                    inscriptionLog('十连按钮不可用，请检查材料', 'error');
                    await sleep(3000);
                    continue;
                }

                const clicked = clickInscriptionTenPull();
                if (!clicked) {
                    inscriptionLog('未找到十连按钮', 'error');
                    await sleep(3000);
                    continue;
                }

                inscriptionStats.totalPulls++;
                inscriptionLog(`--- 第 ${inscriptionStats.totalPulls} 次 ---`, 'action');

                const appeared = await waitForInscriptionResultGrid(8000);
                if (!appeared) {
                    inscriptionLog('等待结果超时', 'error');
                    continue;
                }

                const results = parseInscriptionResultCards();
                if (results.length === 0) {
                    inscriptionLog('解析失败，尝试放弃...', 'error');
                    await performInscriptionDiscard();
                    continue;
                }

                const summary = results.map(r => `${r.stat}+${r.value}`).join(' ');
                inscriptionLog(summary, 'info');

                const { met, matches, reason } = checkInscriptionTargetMet(results);

                if (met) {
                    await performInscriptionKeep(results, matches);
                    break;
                } else {
                    inscriptionLog(`无符合 (${reason})，执行放弃`, 'warn');
                    if (matches.length > 0) {
                        matches.forEach(m => inscriptionLog(`  ~ ${m.target}+${m.value} (不满足≥${m.required})`, 'warn'));
                    }
                    await performInscriptionDiscard();
                }

                updateInscriptionStatsDisplay();
            }
        } catch (e) {
            inscriptionLog('出错: ' + e.message, 'error');
            console.error(e);
        } finally {
            window.__inscriptionRunning = false;
            window.__inscriptionPaused = false;
            updateInscriptionStatusUI('idle');
            const toggleBtn = document.getElementById('inscription-toggle');
            if (toggleBtn) { toggleBtn.textContent = '开始洗练'; toggleBtn.className = 'mp-btn mp-btn-start'; }

            const elapsed = inscriptionStats.startTime ? Math.round((Date.now() - inscriptionStats.startTime) / 1000) : 0;
            inscriptionLog(`=== 结束 | ${inscriptionStats.totalPulls}次 | 达成${inscriptionStats.keptCount} | ${Math.floor(elapsed/60)}分${elapsed%60}秒 ===`, 'info');
            if (inscriptionStats.bestResult) {
                inscriptionLog(`最佳: ${inscriptionStats.bestResult.stat}+${inscriptionStats.bestResult.value}`, 'success');
            }
        }
    }

    function stopInscriptionPulling() {
        window.__inscriptionRunning = false;
        window.__inscriptionPaused = false;
        inscriptionLog('手动停止', 'warn');
    }

    function pauseInscriptionPulling() {
        window.__inscriptionPaused = !window.__inscriptionPaused;
        if (window.__inscriptionPaused) {
            inscriptionLog('已暂停', 'warn');
            updateInscriptionStatusUI('paused');
        } else {
            inscriptionLog('已恢复', 'info');
            updateInscriptionStatusUI('running');
        }
    }

    function syncStopInscriptionUI() {
        const btn = document.getElementById('inscription-toggle');
        const status = document.getElementById('inscription-status');
        if (btn) { btn.textContent = '开始洗练'; btn.className = 'mp-btn mp-btn-start'; }
        if (status) {
            status.innerHTML = '<span class="mp-status-dot"></span>待命';
            status.className = 'mp-status-line status-idle';
        }
    }

    // ==================== 面板 UI ====================

    function createPanel() {
        const existing = document.getElementById('monitor-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'monitor-panel';
        panel.innerHTML = `
            <div class="mp-gold-line"></div>
            <div id="monitor-header">
                <span class="mp-header-title">v${SCRIPT_VERSION}</span>
                <span class="mp-minimized-icon">&#x2699;</span>
                <div class="mp-header-right">
                    <span id="monitor-minimize" title="缩小">&#x25BC;</span>
                    <span id="monitor-close" title="关闭">&#x2716;</span>
                </div>
            </div>
            <div id="monitor-body">
                <div class="mp-tab-bar">
                    <button class="mp-tab active" data-tab="monitor">探索</button>
                    <button class="mp-tab" data-tab="treasure">寻宝</button>
                    <button class="mp-tab" data-tab="inscription">铭文</button>
                    <button class="mp-tab" data-tab="changelog">更新</button>
                </div>
                <div id="tab-monitor" class="mp-tab-content active">
                    <div id="monitor-status" class="mp-status-line status-stopped">
                        <span class="mp-status-dot"></span>已停止
                        <span id="daynight-indicator" class="mp-daynight-indicator" style="display:none;"></span>
                    </div>
                    <div id="monitor-log"></div>
                </div>
                <div id="tab-treasure" class="mp-tab-content">
                    <div id="treasure-status" class="mp-status-line status-stopped">
                        <span class="mp-status-dot"></span>已停止
                    </div>
                    <div id="treasure-log"></div>
                </div>
                <div id="tab-inscription" class="mp-tab-content">
                    <div id="inscription-stats">
                        <div class="ip-stat">
                            <div class="ip-stat-value" id="inscription-stat-total">0</div>
                            <div class="ip-stat-label">次数</div>
                        </div>
                        <div class="ip-stat">
                            <div class="ip-stat-value" id="inscription-stat-kept">0</div>
                            <div class="ip-stat-label">达成</div>
                        </div>
                        <div class="ip-stat">
                            <div class="ip-stat-value" id="inscription-stat-best">-</div>
                            <div class="ip-stat-label">最佳</div>
                        </div>
                    </div>
                    <div id="inscription-status" class="mp-status-line status-idle">
                        <span class="mp-status-dot"></span>待命
                    </div>
                    <div id="inscription-log"></div>
                </div>
                <div id="tab-changelog" class="mp-tab-content">
                    <div id="changelog-list" style="padding:8px 10px;font-size:12px;line-height:1.8;color:var(--mp-text);">
                        <div style="margin-bottom:12px;">
                            <div style="color:var(--mp-accent);font-weight:bold;">v1.9.9</div>
                            <div>• 移除宗门回血功能，修复战斗后回血重复调用导致寻宝循环卡死</div>
                            <div>• 简化战斗结束信号机制，移除冗余 Promise 同步链</div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="color:var(--mp-accent);font-weight:bold;">v1.9.8</div>
                            <div>• 寻宝使用物品数量支持配置，新增"每次使用数量"选项</div>
                            <div>• 优化寻宝战斗结束判断，改为依据接口返回而非面板状态</div>
                            <div>• 护道者优先级设置移入护道者设置区域</div>
                            <div>• 优化配置面板布局，取消勾选时隐藏关联设置</div>
                            <div>• 修复复选框在夜间模式下未选中状态显示异常</div>
                            <div>• 切换到更新Tab时自动关闭配置面板</div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="color:var(--mp-accent);font-weight:bold;">v1.9.7</div>
                            <div>• 修复配置修改后收起面板未保存的问题</div>
                        </div>
                    </div>
                </div>
                <div class="mp-bottom-bar">
                    <button id="monitor-toggle" class="mp-btn mp-btn-start">启动</button>
                    <button id="treasure-toggle" class="mp-btn mp-btn-treasure" style="display:none">寻宝</button>
                    <button id="inscription-toggle" class="mp-btn mp-btn-start" style="display:none">开始洗练</button>
                    <button id="inscription-pause" class="mp-btn mp-btn-pause" style="display:none">暂停</button>
                    <button id="monitor-config" class="mp-btn mp-btn-config">配置</button>
                    <button id="monitor-clear" class="mp-btn mp-btn-clear">清日志</button>
                </div>
            </div>
        `;
        panel.onclick = function (e) { e.stopPropagation(); };
        document.body.appendChild(panel);

        // 恢复面板位置
        const savedPos = GM_getValue('ling_panel_pos', null);
        if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            panel.style.right = 'auto';
            panel.style.left = Math.max(0, Math.min(savedPos.left, maxLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(savedPos.top, maxTop)) + 'px';
        }

        // --- Tab 切换 ---
        const tabs = panel.querySelectorAll('.mp-tab');
        const tabContents = panel.querySelectorAll('.mp-tab-content');
        const monitorToggle = document.getElementById('monitor-toggle');
        const treasureToggle = document.getElementById('treasure-toggle');
        const inscriptionToggle = document.getElementById('inscription-toggle');
        const inscriptionPause = document.getElementById('inscription-pause');
        const configBtn = document.getElementById('monitor-config');
        const clearBtn = document.getElementById('monitor-clear');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                tabContents.forEach(tc => tc.classList.toggle('active', tc.id === `tab-${target}`));
                const isChangelog = target === 'changelog';
                monitorToggle.style.display = target === 'monitor' ? '' : 'none';
                treasureToggle.style.display = target === 'treasure' ? '' : 'none';
                inscriptionToggle.style.display = target === 'inscription' ? '' : 'none';
                inscriptionPause.style.display = target === 'inscription' ? '' : 'none';
                configBtn.style.display = isChangelog ? 'none' : '';
                clearBtn.style.display = isChangelog ? 'none' : '';
                const logId = target === 'treasure' ? 'treasure-log' : (target === 'inscription' ? 'inscription-log' : 'monitor-log');
                const logEl = document.getElementById(logId);
                if (logEl) logEl.scrollTop = logEl.scrollHeight;
                if (configPanelEl) {
                    autoSaveConfig(true);
                    configPanelEl.remove();
                    configPanelEl = null;
                    if (!isChangelog) toggleConfigPanel();
                }
            });
        });

        // --- 拖拽 ---
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let touchStartX, touchStartY;
        const header = document.getElementById('monitor-header');

        const startDrag = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialLeft = panel.offsetLeft;
            initialTop = panel.offsetTop;
            panel.style.right = 'auto';
        };
        const doDrag = (clientX, clientY) => {
            if (!isDragging) return;
            let newLeft = initialLeft + clientX - startX;
            let newTop = initialTop + clientY - startY;
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        };
        const endDrag = () => {
            if (isDragging) {
                GM_setValue('ling_panel_pos', { left: panel.offsetLeft, top: panel.offsetTop });
            }
            isDragging = false;
        };

        let mouseStartX, mouseStartY;
        header.addEventListener('mousedown', (e) => {
            if (e.target.id && (e.target.id.includes('minimize') || e.target.id.includes('close'))) return;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            startDrag(e.clientX, e.clientY);
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const moved = Math.abs(e.clientX - mouseStartX) + Math.abs(e.clientY - mouseStartY);
                if (moved < 10 && panel.classList.contains('minimized')) {
                    isDragging = false;
                    toggleMinimize();
                    return;
                }
            }
            endDrag();
        });

        header.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.id && (target.id.includes('minimize') || target.id.includes('close'))) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            startDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            doDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchend', (e) => {
            if (isDragging) {
                const moved = Math.abs((e.changedTouches[0]?.clientX || 0) - touchStartX)
                             + Math.abs((e.changedTouches[0]?.clientY || 0) - touchStartY);
                if (moved < 10 && panel.classList.contains('minimized')) {
                    isDragging = false;
                    toggleMinimize();
                    e.preventDefault();
                    return;
                }
            }
            endDrag();
        });

        // --- 缩小/展开 ---
        const minimizeBtn = document.getElementById('monitor-minimize');

        const toggleMinimize = () => {
            const isMinimized = panel.classList.contains('minimized');
            if (isMinimized) {
                panel.classList.remove('minimized');
                const body = document.getElementById('monitor-body');
                if (body) body.style.display = '';
                const configP = document.getElementById('config-panel');
                if (configP) configP.style.display = '';
            } else {
                panel.classList.add('minimized');
            }
        };

        minimizeBtn.addEventListener('click', (e) => {
            toggleMinimize();
            e.stopPropagation();
        });

        // 圆形图标点击展开已由 mouseup/touchend 处理

        window.__monitorRunning = false;
        window.__thRunning = false;
        let monitorStartToken = 0;
        let treasureStartToken = 0;

        // --- 关闭面板 ---
        document.getElementById('monitor-close').addEventListener('click', (e) => {
            const panel = document.getElementById('monitor-panel');
            monitorStartToken++;
            treasureStartToken++;
            if (window.__monitorRunning) {
                window.__monitorRunning = false;
                toggleAutoCheckbox(false);
                syncStopUI();
            }
            if (window.__thRunning) {
                syncStopTHUI();
            }
            stopMainLoop();
            panel.style.display = 'none';
            monitorLog('面板已关闭，刷新页面可重新加载', 'info');
            e.stopPropagation();
        });

        // --- 监控启动/停止 ---
        monitorToggle.addEventListener('click', async (e) => {
            const btn = e.target;
            const status = document.getElementById('monitor-status');
            if (!window.__monitorRunning) {
                window.__monitorRunning = true;
                const startToken = ++monitorStartToken;
                const check = await preStartCheck('monitor');
                if (startToken !== monitorStartToken || !window.__monitorRunning) return;
                if (!check.ok) { window.__monitorRunning = false; return; }
                btn.textContent = '停止';
                btn.className = 'mp-btn mp-btn-stop';
                status.className = 'mp-status-line status-running';
                status.innerHTML = '<span class="mp-status-dot"></span>运行中<span id="daynight-indicator" class="mp-daynight-indicator" style="display:none;"></span>';
                startMainLoop();
                if (config.dayNight.enabled && dayNightState.currentIsDay === true) {
                    monitorLog('探索已启动（当前白天，自动冥想）', 'success');
                    await switchToMeditate();
                } else {
                    toggleAutoCheckbox(true);
                    monitorLog('探索已启动', 'success');
                    if (config.dayNight.enabled) {
                        updateDayNightIndicator(dayNightState.currentIsDay);
                    }
                }
            } else {
                monitorStartToken++;
                btn.textContent = '启动';
                btn.className = 'mp-btn mp-btn-start';
                status.innerHTML = '<span class="mp-status-dot"></span>已停止';
                status.className = 'mp-status-line status-stopped';
                hiring = false;
                shopping = false;
                window.__monitorRunning = false;
                if (!window.__thRunning) stopMainLoop();
                toggleAutoCheckbox(false);
                dayNightState.currentIsDay = null;
                dayNightState.transitioning = false;
                removeDayNightIndicator();
                monitorLog('探索已暂停', 'warn');
            }
            e.stopPropagation();
        });

        // --- 寻宝启动/停止 ---
        treasureToggle.addEventListener('click', async (e) => {
            if (window.__thRunning) {
                treasureStartToken++;
                window.__thRunning = false;
                syncStopTHUI();
                if (!window.__monitorRunning) stopMainLoop();
                thLog('已停止寻宝', 'warn');
            } else {
                window.__thRunning = true;
                const startToken = ++treasureStartToken;
                const check = await preStartCheck('treasure');
                if (startToken !== treasureStartToken || !window.__thRunning) return;
                if (!check.ok) { window.__thRunning = false; return; }
                const btn = document.getElementById('treasure-toggle');
                const status = document.getElementById('treasure-status');
                btn.textContent = '停止寻宝';
                btn.className = 'mp-btn mp-btn-treasure-stop';
                status.innerHTML = '<span class="mp-status-dot"></span>寻宝中';
                status.className = 'mp-status-line status-running';
                startMainLoop();
                autoTreasureHunt().catch(e => thLog(`寻宝致命错误: ${e.message}`, 'error'));
            }
            e.stopPropagation();
        });

        // --- 铭文洗练启动/停止 ---
        inscriptionToggle.addEventListener('click', async (e) => {
            if (window.__inscriptionRunning) {
                stopInscriptionPulling();
                syncStopInscriptionUI();
                inscriptionLog('已停止洗练', 'warn');
            } else {
                const btn = document.getElementById('inscription-toggle');
                const status = document.getElementById('inscription-status');
                btn.textContent = '停止洗练';
                btn.className = 'mp-btn mp-btn-stop';
                status.innerHTML = '<span class="mp-status-dot"></span>洗练中';
                status.className = 'mp-status-line status-running';
                startInscriptionPulling().catch(e => inscriptionLog(`洗练致命错误: ${e.message}`, 'error'));
            }
            e.stopPropagation();
        });

        // --- 铭文洗练暂停 ---
        inscriptionPause.addEventListener('click', (e) => {
            if (window.__inscriptionRunning) {
                pauseInscriptionPulling();
                const btn = document.getElementById('inscription-pause');
                btn.textContent = window.__inscriptionPaused ? '继续' : '暂停';
            }
            e.stopPropagation();
        });

        // --- 清日志 ---
        document.getElementById('monitor-clear').addEventListener('click', (e) => {
            const activeTab = panel.querySelector('.mp-tab.active');
            const tabName = activeTab ? activeTab.dataset.tab : 'monitor';
            const logId = tabName === 'treasure' ? 'treasure-log' : (tabName === 'inscription' ? 'inscription-log' : 'monitor-log');
            const logEl = document.getElementById(logId);
            if (logEl) logEl.innerHTML = '';
            e.stopPropagation();
        });

        // --- 配置按钮 ---
        document.getElementById('monitor-config').addEventListener('click', (e) => {
            toggleConfigPanel();
            e.stopPropagation();
        });

        monitorLog('灵界助手已加载', 'info');
    }

    // ==================== 配置面板 UI ====================

    function renderProtectorSection(cfg) {
        return `<div class="cfg-section">
            <div class="cfg-section-label">护道者设置</div>
            <div class="cfg-row cfg-checkbox-row">
                <input id="cfg-th-hireProtector" type="checkbox" ${cfg.treasureHunt.hireProtector !== false ? 'checked' : ''}>
                <label class="cfg-label" style="margin-bottom:0;">遭遇时雇佣护道者</label>
                <span class="cfg-hint">关闭则直接迎战</span>
            </div>
            <div id="cfg-th-hire-details" style="${cfg.treasureHunt.hireProtector !== false ? '' : 'display:none;'}">
                <div class="cfg-row">
                    <label class="cfg-label">雇佣模式</label>
                    <select id="cfg-hireMode">
                        <option value="together" ${cfg.protectors.hireMode === 'together' ? 'selected' : ''}>协同（并肩作战，分担伤害）</option>
                        <option value="solo" ${cfg.protectors.hireMode === 'solo' ? 'selected' : ''}>单独（护道者替你承担全部攻击）</option>
                    </select>
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">雇佣价格阈值 (超过则跳过，0=不限制)</label>
                    <input id="cfg-hirePriceThreshold" type="number" value="${cfg.protectors.hirePriceThreshold || 0}">
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
                        <option value="continue" ${cfg.protectors.afterEscape === 'continue' ? 'selected' : ''}>继续探索</option>
                    </select>
                </div>
                <div id="cfg-th-priority-wrap" style="margin-top:10px;">
                    ${renderPrioritySection(cfg)}
                </div>
            </div>
        </div>`;
    }

    function renderPrioritySection(cfg) {
        return `<div class="cfg-section">
            <div class="cfg-section-label">护道者优先级（按顺序匹配，按|分隔）</div>
            <div id="cfg-priority-list" class="priority-list">
                ${cfg.protectors.priorities.map((r, i) => {
                    const isName = !!r.nameMatch;
                    const keyword = isName ? r.nameMatch : (r.realmMatch || '');
                    return `<div class="priority-row" draggable="true" data-idx="${i}">
                        <span class="priority-handle" title="拖拽排序">⠿</span>
                        <select class="priority-type">
                            <option value="realm" ${!isName ? 'selected' : ''}>按境界</option>
                            <option value="name" ${isName ? 'selected' : ''}>按名字</option>
                        </select>
                        <input class="priority-keyword" type="text" value="${escapeHTML(keyword)}" placeholder="关键词">
                        <span class="priority-del" title="删除">&times;</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="priority-add" id="cfg-priority-add">+ 添加规则</div>
        </div>`;
    }

    let configPanelEl = null;

    function autoSaveConfig(silent) {
        try {
            const el = id => document.getElementById(id);
            if (el('cfg-hireMode')) config.protectors.hireMode = el('cfg-hireMode').value;
            if (el('cfg-monitor-hireProtector')) config.protectors.hireProtector = el('cfg-monitor-hireProtector').checked;
            if (el('cfg-onNoProtector')) config.protectors.onNoProtector = el('cfg-onNoProtector').value;
            if (el('cfg-fightThreshold')) config.protectors.fightAttackThreshold = parseInt(el('cfg-fightThreshold').value) || 0;
            if (el('cfg-hirePriceThreshold')) config.protectors.hirePriceThreshold = parseInt(el('cfg-hirePriceThreshold').value) || 0;
            if (el('cfg-afterEscape')) config.protectors.afterEscape = el('cfg-afterEscape').value;
            if (el('cfg-highPrice')) config.merchant.highPriceThreshold = parseInt(el('cfg-highPrice').value) || 7500000;
            if (el('cfg-stonePriority')) config.merchant.stonePriority = el('cfg-stonePriority').value.split('|').map(s => s.trim()).filter(Boolean);
            if (el('cfg-itemKeywords')) config.merchant.itemKeywords = el('cfg-itemKeywords').value.split('|').map(s => s.trim()).filter(Boolean);
            if (el('cfg-fallback')) config.merchant.fallbackToExpensive = el('cfg-fallback').checked;
            if (el('cfg-highLevelMeditate')) config.general.highLevelMeditate = el('cfg-highLevelMeditate').checked;
            if (el('cfg-th-batchSize')) config.treasureHunt.batchSize = parseInt(el('cfg-th-batchSize').value) || 0;
            if (el('cfg-th-intervalMs')) config.treasureHunt.intervalMs = parseInt(el('cfg-th-intervalMs').value) || 2000;
            if (el('cfg-th-useQuantity')) config.treasureHunt.useQuantity = Math.max(1, parseInt(el('cfg-th-useQuantity').value) || 10);
            if (el('cfg-th-hireProtector')) config.treasureHunt.hireProtector = el('cfg-th-hireProtector').checked;
            if (el('cfg-dn-enabled')) config.dayNight.enabled = el('cfg-dn-enabled').checked;
            if (el('cfg-dn-interval')) config.dayNight.checkIntervalSec = Math.max(10, parseInt(el('cfg-dn-interval').value) || 30);
            if (el('cfg-dn-maxRetries')) config.dayNight.maxMeditateRetries = Math.max(1, parseInt(el('cfg-dn-maxRetries').value) || 3);
            if (el('cfg-dn-retryInterval')) config.dayNight.meditateRetryIntervalSec = Math.max(1, parseInt(el('cfg-dn-retryInterval').value) || 5);
            if (el('ic-stopMode')) config.inscription.stopMode = el('ic-stopMode').value;
            if (el('ic-maxAttempts')) config.inscription.maxAttempts = parseInt(el('ic-maxAttempts').value) || 0;
            if (el('ic-resultAnim')) config.inscription.resultAnimationMs = parseInt(el('ic-resultAnim').value) || 1500;
            if (el('ic-discardDelay')) config.inscription.discardDelayMs = parseInt(el('ic-discardDelay').value) || 2000;
            if (el('ic-autoDialog')) config.inscription.autoCloseDialogs = el('ic-autoDialog').checked;
            if (el('ic-notify')) config.inscription.notifyOnComplete = el('ic-notify').checked;
            const targetList = el('ic-target-list');
            if (targetList) {
                const rows = targetList.querySelectorAll('.affix-row');
                const targetStats = [];
                rows.forEach(row => {
                    const stat = row.querySelector('.target-stat-select').value;
                    const minValue = parseInt(row.querySelector('.affix-value').value) || 0;
                    targetStats.push({ stat, minValue });
                });
                if (targetStats.length > 0) {
                    config.inscription.targetStats = targetStats;
                }
            }
            const priorityList = el('cfg-priority-list');
            if (priorityList) {
                const rows = priorityList.querySelectorAll('.priority-row');
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
            }
            saveConfig(config);
            if (!silent) {
                const activeTab = document.querySelector('.mp-tab.active');
                const tabName = activeTab ? activeTab.dataset.tab : 'monitor';
                const logFn = tabName === 'treasure' ? thLog : (tabName === 'inscription' ? inscriptionLog : monitorLog);
                logFn('配置已保存', 'success');
            }
        } catch (e) {
            const activeTab = document.querySelector('.mp-tab.active');
            const tabName = activeTab ? activeTab.dataset.tab : 'monitor';
            const logFn = tabName === 'treasure' ? thLog : (tabName === 'inscription' ? inscriptionLog : monitorLog);
            logFn('配置保存失败: ' + e.message, 'error');
        }
    }

    function toggleConfigPanel() {
        if (configPanelEl) {
            autoSaveConfig();
            configPanelEl.remove();
            configPanelEl = null;
            return;
        }
        const activeTab = document.querySelector('.mp-tab.active');
        const isTreasure = activeTab && activeTab.dataset.tab === 'treasure';
        const isInscription = activeTab && activeTab.dataset.tab === 'inscription';
        const panel = document.createElement('div');
        panel.id = isInscription ? 'inscription-config-panel' : 'config-panel';
        const cfg = JSON.parse(JSON.stringify(config));
    
        // 1. 在模板外部构建 protectorSectionHTML
        let protectorSectionHTML = '';
        if (isTreasure) {
            protectorSectionHTML = renderProtectorSection(cfg);
        } else if (isInscription) {
            protectorSectionHTML = '';
        } else {
            protectorSectionHTML = `
                <div class="cfg-section">
                    <div class="cfg-section-label">护道者设置</div>
                    <div class="cfg-row cfg-checkbox-row">
                        <input id="cfg-monitor-hireProtector" type="checkbox" ${cfg.protectors.hireProtector !== false ? 'checked' : ''}>
                        <label class="cfg-label" style="margin-bottom:0;">遭遇时雇佣护道者</label>
                        <span class="cfg-hint">关闭则直接迎战</span>
                    </div>
                    <div id="cfg-hire-details" style="${cfg.protectors.hireProtector !== false ? '' : 'display:none;'}">
                        <div class="cfg-row">
                            <label class="cfg-label">雇佣模式</label>
                            <select id="cfg-hireMode">
                                <option value="together" ${cfg.protectors.hireMode === 'together' ? 'selected' : ''}>协同（并肩作战，分担伤害）</option>
                                <option value="solo" ${cfg.protectors.hireMode === 'solo' ? 'selected' : ''}>单独（护道者替你承担全部攻击）</option>
                            </select>
                        </div>
                        <div class="cfg-row">
                            <label class="cfg-label">雇佣价格阈值 (超过则跳过，0=不限制)</label>
                            <input id="cfg-hirePriceThreshold" type="number" value="${cfg.protectors.hirePriceThreshold || 0}">
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
                                <option value="continue" ${cfg.protectors.afterEscape === 'continue' ? 'selected' : ''}>继续探索</option>
                            </select>
                        </div>
                    </div>
                    <div id="cfg-priority-wrap" style="margin-top:10px;${cfg.protectors.hireProtector !== false ? '' : 'display:none;'}">
                        ${renderPrioritySection(cfg)}
                    </div>
                </div>`;
        }

        // 2. 构建完整的模板，直接插入 protectorSectionHTML 变量
        panel.innerHTML = `
            <div class="cfg-header">
                <span class="cfg-title">${isTreasure ? '寻宝配置' : (isInscription ? '铭文配置' : '探索配置')}</span>
                <span class="cfg-close">&times;</span>
            </div>

            ${protectorSectionHTML}

            ${isTreasure || isInscription ? '' : `
            <div class="cfg-section">
                <div class="cfg-section-label">通用设置</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="cfg-highLevelMeditate" type="checkbox" ${cfg.general.highLevelMeditate ? 'checked' : ''}>
                    <label class="cfg-label" style="margin-bottom:0;">仙缘高级冥想</label>
                    <span class="cfg-hint">关闭则直接冥想并停止脚本</span>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">昼夜自动切换</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="cfg-dn-enabled" type="checkbox" ${cfg.dayNight.enabled ? 'checked' : ''}>
                    <label class="cfg-label" style="margin-bottom:0;">启用昼夜自动切换</label>
                    <span class="cfg-hint">白天冥想，夜晚探索</span>
                </div>
                <div id="cfg-dn-settings" style="${cfg.dayNight.enabled ? '' : 'display:none;'}">
                    <div class="cfg-row">
                        <label class="cfg-label">检查间隔（秒）</label>
                        <input id="cfg-dn-interval" type="number" value="${cfg.dayNight.checkIntervalSec}" min="10" max="300">
                        <span class="cfg-hint">建议 30-60 秒</span>
                    </div>
                    <div class="cfg-row">
                        <label class="cfg-label">冥想最大重试次数</label>
                        <input id="cfg-dn-maxRetries" type="number" value="${cfg.dayNight.maxMeditateRetries}" min="1" max="10">
                        <span class="cfg-hint">白天冥想失败时的重试上限</span>
                    </div>
                    <div class="cfg-row">
                        <label class="cfg-label">重试间隔（秒）</label>
                        <input id="cfg-dn-retryInterval" type="number" value="${cfg.dayNight.meditateRetryIntervalSec}" min="1" max="60">
                        <span class="cfg-hint">冥想失败后多久重试</span>
                    </div>
                </div>
            </div>`}

            ${isInscription ? '' : `
            <div class="cfg-section">
                <div class="cfg-section-label">商人设置</div>
                <div class="cfg-row">
                    <label class="cfg-label">高价阈值 (灵石)</label>
                    <input id="cfg-highPrice" type="number" value="${cfg.merchant.highPriceThreshold}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">商品关键词 (|分隔，按顺序优先)</label>
                    <input id="cfg-itemKeywords" type="text" value="${escapeHTML((cfg.merchant.itemKeywords || []).join('|'))}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">品质优先级 (|分隔)</label>
                    <input id="cfg-stonePriority" type="text" value="${escapeHTML(cfg.merchant.stonePriority.join('|'))}">
                </div>
                <div class="cfg-row cfg-hint" style="padding:0;">匹配规则：先按关键词顺序，同关键词按品质优先级，高价物品始终最优先</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="cfg-fallback" type="checkbox" ${cfg.merchant.fallbackToExpensive ? 'checked' : ''}>
                    <label class="cfg-label" style="margin-bottom:0;">无匹配时买最贵</label>
                    <span class="cfg-hint">关闭则无匹配时自动婉拒</span>
                </div>
            </div>`}

            ${isTreasure ? `<div class="cfg-section">
                <div class="cfg-section-label">寻宝设置</div>
                <div class="cfg-row">
                    <label class="cfg-label">每批使用数量 (0 = 全部用完)</label>
                    <input id="cfg-th-batchSize" type="number" value="${cfg.treasureHunt.batchSize}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">使用间隔 (毫秒)</label>
                    <input id="cfg-th-intervalMs" type="number" value="${cfg.treasureHunt.intervalMs}">
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">每次使用数量</label>
                    <input id="cfg-th-useQuantity" type="number" value="${cfg.treasureHunt.useQuantity ?? 10}" min="1">
                </div>
            </div>` : ''}

            ${isInscription ? `<div class="cfg-section">
                <div class="cfg-section-label">目标属性（不限品质，只看属性和数值）</div>
                <div id="ic-target-list" class="affix-list">
                    ${cfg.inscription.targetStats.map((t, i) => `
                        <div class="affix-row" draggable="true" data-idx="${i}">
                            <span class="affix-handle" title="排序">⠿</span>
                            <select class="target-stat-select">
                                <option value="攻击" ${t.stat === '攻击' ? 'selected' : ''}>攻击</option>
                                <option value="防御" ${t.stat === '防御' ? 'selected' : ''}>防御</option>
                                <option value="气血" ${t.stat === '气血' ? 'selected' : ''}>气血</option>
                                <option value="神识" ${t.stat === '神识' ? 'selected' : ''}>神识</option>
                            </select>
                            <span style="font-size:11px;color:var(--mp-text-muted);">≥</span>
                            <input class="affix-value" type="number" value="${t.minValue || 0}" min="0" placeholder="值">
                            <span class="affix-del" title="删除">&times;</span>
                        </div>
                    `).join('')}
                </div>
                <div class="affix-add" id="ic-target-add">+ 添加</div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">设置</div>
                <div class="cfg-row">
                    <label class="cfg-label">停止模式</label>
                    <select id="ic-stopMode" style="width:100%;">
                        <option value="any" ${cfg.inscription.stopMode === 'any' ? 'selected' : ''}>任一满足即停</option>
                        <option value="all" ${cfg.inscription.stopMode === 'all' ? 'selected' : ''}>全部满足才停</option>
                        <option value="manual" ${cfg.inscription.stopMode === 'manual' ? 'selected' : ''}>永不停</option>
                    </select>
                </div>
                <div class="cfg-row">
                    <label class="cfg-label">最大次数 <span class="cfg-hint">0=无限</span></label>
                    <input id="ic-maxAttempts" type="number" value="${cfg.inscription.maxAttempts}" min="0">
                </div>
                <div class="cfg-row" style="display:flex;gap:4px;">
                    <div style="flex:1;">
                        <label class="cfg-label">动画等待(ms)</label>
                        <input id="ic-resultAnim" type="number" value="${cfg.inscription.resultAnimationMs}" min="500" max="5000">
                    </div>
                    <div style="flex:1;">
                        <label class="cfg-label">放弃等待(ms)</label>
                        <input id="ic-discardDelay" type="number" value="${cfg.inscription.discardDelayMs}" min="500" max="10000">
                    </div>
                </div>
            </div>

            <div class="cfg-section">
                <div class="cfg-section-label">选项</div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="ic-autoDialog" type="checkbox" ${cfg.inscription.autoCloseDialogs ? 'checked' : ''}>
                    <label class="cfg-label" style="margin:0;">自动关闭弹窗</label>
                </div>
                <div class="cfg-row cfg-checkbox-row">
                    <input id="ic-notify" type="checkbox" ${cfg.inscription.notifyOnComplete ? 'checked' : ''}>
                    <label class="cfg-label" style="margin:0;">浏览器通知</label>
                </div>
            </div>` : ''}
    
            <div class="cfg-bottom-bar">
                <button id="cfg-reset" class="cfg-btn cfg-btn-reset">重置默认</button>
            </div>
        `;
    
        const monitorPanel = document.getElementById('monitor-panel');
        monitorPanel.appendChild(panel);
        configPanelEl = panel;
    
        panel.querySelector('.cfg-close').addEventListener('click', () => {
            autoSaveConfig();
            if (window.__inscriptionRunning) {
                window.__inscriptionRunning = false;
                syncStopInscriptionUI();
            }
            panel.remove();
            configPanelEl = null;
        });

        const onNoProtectorEl = document.getElementById('cfg-onNoProtector');
        if (onNoProtectorEl) {
            onNoProtectorEl.addEventListener('change', (e) => {
                document.getElementById('cfg-fightThreshold-wrap').style.display = e.target.value === 'fight' ? '' : 'none';
                document.getElementById('cfg-afterEscape-wrap').style.display = e.target.value === 'escape' ? '' : 'none';
            });
        }

        const monitorHireEl = document.getElementById('cfg-monitor-hireProtector');
        if (monitorHireEl) {
            monitorHireEl.addEventListener('change', (e) => {
                const details = document.getElementById('cfg-hire-details');
                if (details) details.style.display = e.target.checked ? '' : 'none';
                const priorityWrap = document.getElementById('cfg-priority-wrap');
                if (priorityWrap) priorityWrap.style.display = e.target.checked ? '' : 'none';
            });
        }

        const thHireEl = document.getElementById('cfg-th-hireProtector');
        if (thHireEl) {
            thHireEl.addEventListener('change', (e) => {
                const details = document.getElementById('cfg-th-hire-details');
                if (details) details.style.display = e.target.checked ? '' : 'none';
            });
        }

        ['cfg-hireMode', 'cfg-onNoProtector', 'cfg-afterEscape',
         'cfg-fightThreshold', 'cfg-hirePriceThreshold', 'cfg-highPrice', 'cfg-stonePriority',
         'cfg-itemKeywords', 'cfg-fallback', 'cfg-highLevelMeditate',
         'cfg-th-batchSize', 'cfg-th-intervalMs', 'cfg-th-hireProtector',
         'cfg-dn-enabled', 'cfg-dn-interval', 'cfg-dn-maxRetries', 'cfg-dn-retryInterval',
         'ic-stopMode', 'ic-maxAttempts', 'ic-resultAnim', 'ic-discardDelay',
         'ic-autoDialog', 'ic-notify'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => autoSaveConfig());
        });

        const dnEnabled = document.getElementById('cfg-dn-enabled');
        if (dnEnabled) {
            dnEnabled.addEventListener('change', (e) => {
                const settings = document.getElementById('cfg-dn-settings');
                if (settings) settings.style.display = e.target.checked ? '' : 'none';
            });
        }

        document.getElementById('cfg-reset').addEventListener('click', () => {
            const activeTab = document.querySelector('.mp-tab.active');
            const tabName = activeTab ? activeTab.dataset.tab : 'monitor';
            if (tabName === 'inscription') {
                config.inscription = JSON.parse(JSON.stringify(DEFAULT_CONFIG.inscription));
            } else {
                config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            }
            saveConfig(config);
            panel.remove();
            configPanelEl = null;
            const logFn = tabName === 'treasure' ? thLog : (tabName === 'inscription' ? inscriptionLog : monitorLog);
            logFn('配置已重置为默认值', 'warn');
        });

        const list = document.getElementById('cfg-priority-list');

        if (list) {
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
                    <input class="priority-keyword" type="text" value="${escapeHTML(keyword)}" placeholder="关键词">
                    <span class="priority-del" title="删除">&times;</span>
                `;
                bindRowEvents(row);
                return row;
            }

            function bindRowEvents(row) {
                row.querySelector('.priority-del').addEventListener('click', () => { row.remove(); autoSaveConfig(); });
                row.querySelector('.priority-type').addEventListener('change', () => autoSaveConfig());
                row.querySelector('.priority-keyword').addEventListener('change', () => autoSaveConfig());
                row.addEventListener('dragstart', e => {
                    row.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                row.addEventListener('dragend', () => { row.classList.remove('dragging'); autoSaveConfig(); });
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

        // 铭文目标属性列表
        const targetList = document.getElementById('ic-target-list');
        const STAT_OPTIONS = ['攻击', '防御', '气血', '神识'];

        if (targetList) {
            function makeTargetRow(stat = '攻击', minValue = 0) {
                const row = document.createElement('div');
                row.className = 'affix-row';
                row.draggable = true;
                row.innerHTML = `
                    <span class="affix-handle" title="排序">⠿</span>
                    <select class="target-stat-select">
                        ${STAT_OPTIONS.map(s => `<option value="${s}" ${s === stat ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <span style="font-size:11px;color:var(--mp-text-muted);">≥</span>
                    <input class="affix-value" type="number" value="${minValue}" min="0" placeholder="值">
                    <span class="affix-del" title="删除">&times;</span>
                `;
                bindTargetRowEvents(row);
                return row;
            }

            function bindTargetRowEvents(row) {
                row.querySelector('.affix-del').addEventListener('click', () => { row.remove(); autoSaveConfig(); });
                row.querySelector('.target-stat-select').addEventListener('change', () => autoSaveConfig());
                row.querySelector('.affix-value').addEventListener('change', () => autoSaveConfig());
                row.addEventListener('dragstart', e => {
                    row.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                row.addEventListener('dragend', () => { row.classList.remove('dragging'); autoSaveConfig(); });
                row.addEventListener('dragover', e => {
                    e.preventDefault();
                    const dragging = targetList.querySelector('.dragging');
                    if (dragging && dragging !== row) {
                        const rect = row.getBoundingClientRect();
                        const mid = rect.top + rect.height / 2;
                        if (e.clientY < mid) {
                            targetList.insertBefore(dragging, row);
                        } else {
                            targetList.insertBefore(dragging, row.nextSibling);
                        }
                    }
                });
            }

            targetList.querySelectorAll('.affix-row').forEach(bindTargetRowEvents);

            document.getElementById('ic-target-add').addEventListener('click', () => {
                const row = makeTargetRow();
                targetList.appendChild(row);
            });
        }
    }

    // ==================== 初始化 ====================
    createPanel();
})();
