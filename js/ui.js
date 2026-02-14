/**
 * UI管理器
 */

const UI = {
    // 初始化UI
    init() {
        this.setupEventListeners();
        this.renderPlayerConfigs();
        this.updateConfigDisplay();
        this.updateInitialPageDisplay();
    },

    // 更新页面初始显示（与配置同步）
    updateInitialPageDisplay() {
        const config = GameConfig.get();
        // 更新主页面显示的格子信息
        this.updateGridInfo(config.initialGridSize);
        // 初始化存活计数
        this.updateAliveCount(0, 0);
    },

    // 设置事件监听
    setupEventListeners() {
        // 开始/重新开始按钮
        document.getElementById('btn-start').addEventListener('click', () => {
            if (window.game) {
                // 直接调用start，start内部会处理reset
                window.game.start();
            }
        });

        // 暂停按钮
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (window.game) {
                window.game.togglePause();
            }
        });

        // 配置按钮
        document.getElementById('btn-config').addEventListener('click', () => {
            this.showModal();
        });

        // 音效按钮
        document.getElementById('btn-sound').addEventListener('click', () => {
            this.toggleSound();
        });

        // 关闭模态框
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        // 保存配置
        document.getElementById('btn-save-config').addEventListener('click', () => {
            this.saveConfig();
        });

        // 重置配置
        document.getElementById('btn-reset-config').addEventListener('click', () => {
            this.resetConfig();
        });

        // 格子大小滑块
        document.getElementById('initial-grid-size').addEventListener('input', (e) => {
            document.getElementById('grid-size-value').textContent = e.target.value;
        });

        // 升级间隔滑块
        document.getElementById('upgrade-interval').addEventListener('input', (e) => {
            document.getElementById('upgrade-value').textContent = e.target.value + '秒';
        });

        // 玩家数量滑块
        document.getElementById('player-count').addEventListener('input', (e) => {
            document.getElementById('player-count-value').textContent = e.target.value;
            // 实时更新玩家配置显示
            const config = GameConfig.get();
            config.playerCount = parseInt(e.target.value);
            this.renderPlayerConfigs();
        });

        // 点击模态框外部关闭
        document.getElementById('config-modal').addEventListener('click', (e) => {
            if (e.target.id === 'config-modal') {
                this.hideModal();
            }
        });

        // 操作说明折叠功能
        const instructionsHeader = document.getElementById('instructions-header');
        const instructionsContent = document.getElementById('instructions-content');
        const instructionsToggle = document.getElementById('instructions-toggle');
        
        if (instructionsHeader && instructionsContent) {
            instructionsHeader.addEventListener('click', () => {
                instructionsContent.classList.toggle('expanded');
                instructionsToggle.classList.toggle('expanded');
            });
        }
    },

    // 渲染玩家配置
    renderPlayerConfigs() {
        const container = document.getElementById('player-configs');
        const config = GameConfig.get();
        
        container.innerHTML = '';
        
        // 确保玩家数组存在
        if (!config.players || config.players.length === 0) {
            console.warn('玩家配置为空，使用默认配置');
            return;
        }
        
        for (let i = 0; i < 12; i++) {
            const player = config.players[i];
            // 如果玩家配置不存在，跳过或使用默认值
            if (!player) {
                console.warn(`玩家${i + 1}配置不存在`);
                continue;
            }
            
            const isActive = i < config.playerCount;
            // 玩家1-2可以选择人类或AI，玩家3-12只能是AI
            const canBeHuman = i < 2;
            
            const div = document.createElement('div');
            div.className = 'player-config-item';
            div.style.opacity = isActive ? '1' : '0.4';
            
            const playerColor = player.color || '#888888';
            const playerName = player.name || `玩家${i + 1}`;
            const playerType = player.type || 'ai';
            
            if (canBeHuman) {
                // 玩家1-2：可以选择人类或AI
                div.innerHTML = `
                    <div class="player-config-header">
                        <div class="player-color-preview" style="background-color: ${playerColor}"></div>
                        <span>${playerName}</span>
                    </div>
                    <div class="player-config-options">
                        <label>
                            <input type="radio" name="player-type-${i}" value="human" ${playerType === 'human' ? 'checked' : ''} ${!isActive ? 'disabled' : ''}>
                            人类玩家
                        </label>
                        <label>
                            <input type="radio" name="player-type-${i}" value="ai" ${playerType === 'ai' ? 'checked' : ''} ${!isActive ? 'disabled' : ''}>
                            电脑玩家
                        </label>
                    </div>
                `;
            } else {
                // 玩家3-6：只能是AI
                div.innerHTML = `
                    <div class="player-config-header">
                        <div class="player-color-preview" style="background-color: ${playerColor}"></div>
                        <span>${playerName}</span>
                    </div>
                    <div class="player-config-options">
                        <label>
                            <input type="radio" name="player-type-${i}" value="ai" checked disabled>
                            电脑玩家
                        </label>
                    </div>
                `;
            }
            
            container.appendChild(div);
        }
    },

    // 更新配置显示
    updateConfigDisplay() {
        const config = GameConfig.get();
        
        // 更新格子大小滑块
        const gridSizeInput = document.getElementById('initial-grid-size');
        if (gridSizeInput) {
            gridSizeInput.value = config.initialGridSize;
            document.getElementById('grid-size-value').textContent = config.initialGridSize;
        }
        
        // 更新升级间隔滑块
        const upgradeInput = document.getElementById('upgrade-interval');
        if (upgradeInput) {
            upgradeInput.value = config.upgradeInterval;
            document.getElementById('upgrade-value').textContent = config.upgradeInterval + '秒';
        }
        
        // 更新游戏速度下拉框
        const speedSelect = document.getElementById('game-speed');
        if (speedSelect) {
            speedSelect.value = config.speedLevel || 6;
        }
        
        // 更新玩家数量滑块
        const playerCountInput = document.getElementById('player-count');
        if (playerCountInput) {
            playerCountInput.value = config.playerCount;
            document.getElementById('player-count-value').textContent = config.playerCount;
        }
    },

    // 显示模态框
    showModal() {
        this.renderPlayerConfigs();
        this.updateConfigDisplay();
        document.getElementById('config-modal').classList.add('active');
    },

    // 隐藏模态框
    hideModal() {
        document.getElementById('config-modal').classList.remove('active');
    },

    // 保存配置
    saveConfig() {
        const config = GameConfig.get();
        
        // 保存玩家数量
        config.playerCount = parseInt(document.getElementById('player-count').value);
        
        // 保存玩家类型（只保存玩家1-2的，玩家3-12强制为AI）
        for (let i = 0; i < 2; i++) {
            const typeRadio = document.querySelector(`input[name="player-type-${i}"]:checked`);
            if (typeRadio && !typeRadio.disabled) {
                config.players[i].type = typeRadio.value;
            }
        }
        // 玩家3-12强制设为AI
        for (let i = 2; i < 12; i++) {
            if (config.players[i]) {
                config.players[i].type = 'ai';
            }
        }
        
        // 保存游戏参数
        config.initialGridSize = parseInt(document.getElementById('initial-grid-size').value);
        config.upgradeInterval = parseInt(document.getElementById('upgrade-interval').value);
        config.speedLevel = parseInt(document.getElementById('game-speed').value);
        config.gameSpeed = GameConfig.getSpeedFromLevel(config.speedLevel);
        
        GameConfig.update(config);
        this.hideModal();
        
        // 如果游戏未运行，重置游戏
        if (window.game && !window.game.isRunning) {
            window.game.reset();
        }
        
        this.showToast('配置已保存');
    },

    // 重置配置
    resetConfig() {
        GameConfig.reset();
        this.renderPlayerConfigs();
        this.updateConfigDisplay();
        this.showToast('配置已重置');
    },

    // 切换音效
    toggleSound() {
        const config = GameConfig.get();
        config.soundEnabled = !config.soundEnabled;
        AudioManager.setEnabled(config.soundEnabled);
        GameConfig.update(config);
        
        const btn = document.getElementById('btn-sound');
        if (config.soundEnabled) {
            btn.textContent = '🔊';
            btn.classList.remove('muted');
        } else {
            btn.textContent = '🔇';
            btn.classList.add('muted');
        }
    },

    // 更新玩家面板
    // 排序规则：1.存活的按分数倒序 2.死亡的按分数倒序
    updatePlayerPanel(snakes) {
        const container = document.getElementById('players-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 分离存活和死亡的玩家
        const aliveSnakes = snakes.filter(s => s.alive);
        const deadSnakes = snakes.filter(s => !s.alive);
        
        // 存活的按分数倒序排列
        aliveSnakes.sort((a, b) => b.score - a.score);
        
        // 死亡的也按分数倒序排列
        deadSnakes.sort((a, b) => b.score - a.score);
        
        // 合并：存活的在前，死亡的在后
        const sortedSnakes = [...aliveSnakes, ...deadSnakes];
        
        // 更新存活计数
        this.updateAliveCount(aliveSnakes.length, snakes.length);
        
        for (let snake of sortedSnakes) {
            const div = document.createElement('div');
            div.className = `player-status ${snake.alive ? 'alive' : 'dead'} ${snake.aiEnabled ? 'ai-mode' : ''}`;
            div.style.borderLeftColor = snake.color;
            
            const reviveDisplay = snake.reviveCount > 0 ? `<span class="player-item" title="拥有翻转续命道具">⭐x${snake.reviveCount}</span>` : '';
            const penetrateDisplay = snake.penetrateCount > 0 ? `<span class="player-item" title="拥有穿透道具">🔷x${snake.penetrateCount}</span>` : '';
            
            div.innerHTML = `
                <div class="player-header">
                    <span class="player-name" style="color: ${snake.color}">${snake.name}</span>
                    <span class="player-type ${snake.type}">${snake.type === 'human' ? '人类' : '电脑'}</span>
                    ${reviveDisplay}${penetrateDisplay}
                </div>
                <div class="player-stats">
                    <span class="player-hp">HP: ${snake.getLength()}</span>
                    <span class="player-score">分数: ${snake.score}</span>
                    <span class="player-status-text ${snake.alive ? 'alive' : 'dead'}">
                        ${snake.alive ? (snake.aiEnabled ? '自动中' : '存活') : '死亡'}
                    </span>
                </div>
            `;
            
            container.appendChild(div);
        }
    },

    // 更新开始按钮
    updateStartButton(isRunning) {
        const btn = document.getElementById('btn-start');
        btn.textContent = isRunning ? '重新开始' : '开始游戏';
    },

    // 更新暂停按钮
    updatePauseButton(isPaused) {
        const btn = document.getElementById('btn-pause');
        btn.textContent = isPaused ? '继续' : '暂停';
        btn.disabled = !window.game || !window.game.isRunning;
    },

    // 更新计时器
    updateTimer(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').textContent = `时间: ${mins}:${secs}`;
    },

    // 更新格子信息
    updateGridInfo(size) {
        document.getElementById('grid-info').textContent = `格子: ${size}×${size}`;
    },

    // 更新存活计数
    updateAliveCount(alive, total) {
        const element = document.getElementById('alive-count');
        if (element) {
            element.textContent = `存活: ${alive}/${total}`;
        }
    },

    // 更新缩圈倒计时
    updateShrinkTimer(seconds) {
        const element = document.getElementById('shrink-timer');
        if (element) {
            if (seconds > 0) {
                element.textContent = `缩圈: ${seconds}s`;
            } else {
                element.textContent = '缩圈: --';
            }
        }
    },

    // 显示遮罩层
    showOverlay(title, message) {
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
        document.getElementById('game-overlay').classList.add('active');
    },

    // 隐藏遮罩层
    hideOverlay() {
        document.getElementById('game-overlay').classList.remove('active');
    },

    // 显示提示
    showToast(message, duration = 2000) {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 136, 0.9);
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
};

// 添加toast动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        10% { opacity: 1; transform: translateX(-50%) translateY(0); }
        90% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);
