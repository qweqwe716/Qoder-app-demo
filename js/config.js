/**
 * 游戏配置管理
 */

var GameConfig = {
    // 默认配置
    defaults: {
        playerCount: 6,
        initialGridSize: 30,
        minGridSize: 6,
        maxGridSize: 120,
        upgradeInterval: 15, // 秒
        gameSpeed: 16, // 毫秒 (约60fps，x6速度)
        speedLevel: 6, // 当前速度档位 x1-x10
        minSpeedLevel: 1,
        maxSpeedLevel: 10,
        soundEnabled: true,
        players: [
            { id: 1, name: '玩家1', type: 'human', color: '#00ff88', controls: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } },
            { id: 2, name: '玩家2', type: 'human', color: '#00d4ff', controls: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } },
            { id: 3, name: '玩家3', type: 'ai', color: '#ffa502', controls: { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH' } },
            { id: 4, name: '玩家4', type: 'ai', color: '#ff6b81', controls: { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' } },
            { id: 5, name: '玩家5', type: 'ai', color: '#a55eea', controls: { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6' } },
            { id: 6, name: '玩家6', type: 'ai', color: '#26de81', controls: { up: 'Numpad7', down: 'Numpad1', left: 'Numpad9', right: 'Numpad3' } },
            { id: 7, name: '玩家7', type: 'ai', color: '#fed330', controls: { up: 'Digit1', down: 'Digit2', left: 'Digit3', right: 'Digit4' } },
            { id: 8, name: '玩家8', type: 'ai', color: '#45aaf2', controls: { up: 'Digit5', down: 'Digit6', left: 'Digit7', right: 'Digit8' } },
            { id: 9, name: '玩家9', type: 'ai', color: '#fd79a8', controls: { up: 'Digit9', down: 'Digit0', left: 'Minus', right: 'Equal' } },
            { id: 10, name: '玩家10', type: 'ai', color: '#00b894', controls: { up: 'BracketLeft', down: 'BracketRight', left: 'Backslash', right: 'Semicolon' } },
            { id: 11, name: '玩家11', type: 'ai', color: '#e17055', controls: { up: 'Quote', down: 'Comma', left: 'Period', right: 'Slash' } },
            { id: 12, name: '玩家12', type: 'ai', color: '#74b9ff', controls: { up: 'IntlBackslash', down: 'ContextMenu', left: 'BrowserBack', right: 'BrowserForward' } }
        ]
    },

    // 可用颜色池
    colorPool: [
        '#00ff88', // 绿色
        '#00d4ff', // 青色
        '#ffa502', // 橙色
        '#ff6b81', // 粉色
        '#a55eea', // 紫色
        '#26de81', // 浅绿
        '#fed330', // 黄色
        '#45aaf2', // 蓝色
        '#fd79a8', // 玫红
        '#00b894', // 薄荷
        '#e17055', // 珊瑚
        '#74b9ff', // 天蓝
        '#a29bfe', // 淡紫
        '#dfe6e9', // 银白
        '#fab1a0'  // 桃色
    ],

    // 当前配置
    current: null,

    // 初始化配置
    init() {
        // 先加载默认配置
        this.current = JSON.parse(JSON.stringify(this.defaults));
        // 从 localStorage 加载保存的配置（如果有）
        this.loadFromStorage();
    },

    // 从本地存储加载配置
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('snakeGameConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.current = { ...this.defaults, ...parsed };
                // 确保玩家数组完整（兼容旧配置）
                if (!this.current.players || this.current.players.length < 12) {
                    this.current.players = JSON.parse(JSON.stringify(this.defaults.players));
                }
            }
        } catch (e) {
            console.warn('无法加载保存的配置:', e);
        }
    },

    // 保存配置到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('snakeGameConfig', JSON.stringify(this.current));
        } catch (e) {
            console.warn('无法保存配置:', e);
        }
    },

    // 获取当前配置
    get() {
        return this.current;
    },

    // 更新配置
    update(newConfig) {
        this.current = { ...this.current, ...newConfig };
        this.saveToStorage();
    },

    // 获取活跃玩家配置（2-12人）
    getActivePlayers() {
        return this.current.players.slice(0, this.current.playerCount);
    },

    // 设置玩家数量
    setPlayerCount(count) {
        this.current.playerCount = Math.max(2, Math.min(12, count));
        // 确保玩家3-12默认为AI
        for (let i = 2; i < this.current.playerCount; i++) {
            if (this.current.players[i]) {
                this.current.players[i].type = 'ai';
            }
        }
    },

    // 为玩家分配随机颜色
    assignRandomColor(playerId) {
        const usedColors = this.current.players
            .filter(p => p.id !== playerId)
            .map(p => p.color);
        
        const availableColors = this.colorPool.filter(c => !usedColors.includes(c));
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        
        const player = this.current.players.find(p => p.id === playerId);
        if (player) {
            player.color = randomColor;
        }
        
        return randomColor;
    },

    // 重置为默认配置
    reset() {
        this.current = JSON.parse(JSON.stringify(this.defaults));
        // 为AI玩家分配随机颜色
        this.current.players.forEach((player, index) => {
            if (index >= 2) {
                this.assignRandomColor(player.id);
            }
        });
        this.saveToStorage();
    },

    // 获取格子大小（根据格子数量计算）
    getCellSize(gridSize) {
        const canvasSize = 600;
        return Math.floor(canvasSize / gridSize);
    },

    // 获取升级后的格子数
    getUpgradedGridSize(currentSize) {
        // 难度越高，格子越少（最大120，最小6）
        const newSize = Math.max(6, currentSize - 5);
        return newSize;
    },

    // 根据速度档位计算实际游戏速度（毫秒）
    // x1 = 100ms (慢), x10 = 10ms (极快)
    getSpeedFromLevel(level) {
        // 档位越高，间隔越短，速度越快
        // x1: 100ms, x2: 55ms, x3: 40ms, x4: 30ms, x5: 25ms
        // x6: 20ms, x7: 17ms, x8: 15ms, x9: 12ms, x10: 10ms
        const speedMap = {
            1: 100, 2: 55, 3: 40, 4: 30, 5: 25,
            6: 20, 7: 17, 8: 15, 9: 12, 10: 10
        };
        return speedMap[level] || 20;
    },

    // 获取速度档位显示文本
    getSpeedLevelText(level) {
        return `x${level}`;
    }
};

// 初始化配置
GameConfig.init();
