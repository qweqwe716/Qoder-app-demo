/**
 * 游戏主控制器
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.config = GameConfig.get();
        this.gridSize = this.config.initialGridSize;
        this.cellSize = GameConfig.getCellSize(this.gridSize);
        this.currentSpeedLevel = this.config.speedLevel || 6;
        
        this.snakes = [];
        this.foodManager = null;
        this.aiManager = new AIManager();
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoopId = null;
        this.lastUpdateTime = 0;
        this.gameTime = 0; // 游戏时间（秒）
        this.lastUpgradeTime = 0;
        
        this.winner = null;
        
        this.init();
    }

    // 初始化游戏
    init() {
        this.setupEventListeners();
        this.reset();
    }

    // 设置事件监听
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 触摸控制（移动端）
        this.setupTouchControls();
    }

    // 设置触摸控制
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.isRunning || this.isPaused) return;
            
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            
            // 最小滑动距离
            const minSwipeDistance = 30;
            
            if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
                return; // 滑动距离太短，忽略
            }
            
            // 判断滑动方向
            let direction = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                direction = dx > 0 ? 'right' : 'left';
            } else {
                // 垂直滑动
                direction = dy > 0 ? 'down' : 'up';
            }
            
            // 找到人类玩家并设置方向
            const humanSnake = this.snakes.find(s => s.alive && s.type === 'human');
            if (humanSnake) {
                switch (direction) {
                    case 'up':
                        if (humanSnake.direction.y !== 1) {
                            humanSnake.setDirection(0, -1);
                        }
                        break;
                    case 'down':
                        if (humanSnake.direction.y !== -1) {
                            humanSnake.setDirection(0, 1);
                        }
                        break;
                    case 'left':
                        if (humanSnake.direction.x !== 1) {
                            humanSnake.setDirection(-1, 0);
                        }
                        break;
                    case 'right':
                        if (humanSnake.direction.x !== -1) {
                            humanSnake.setDirection(1, 0);
                        }
                        break;
                }
            }
        }, { passive: false });
        
        // 虚拟方向键展开/隐藏控制
        const dToggle = document.getElementById('d-toggle');
        const dPad = document.getElementById('d-pad');
        const dClose = document.getElementById('d-close');
        
        if (dToggle && dPad) {
            dToggle.addEventListener('click', () => {
                dPad.style.display = 'flex';
                dToggle.style.display = 'none';
            });
            
            dToggle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                dPad.style.display = 'flex';
                dToggle.style.display = 'none';
            }, { passive: false });
        }
        
        if (dClose && dPad && dToggle) {
            dClose.addEventListener('click', () => {
                dPad.style.display = 'none';
                dToggle.style.display = 'block';
            });
            
            dClose.addEventListener('touchstart', (e) => {
                e.preventDefault();
                dPad.style.display = 'none';
                dToggle.style.display = 'block';
            }, { passive: false });
        }
        
        // 虚拟方向键控制
        const dPadButtons = document.querySelectorAll('.d-btn[data-dir]');
        dPadButtons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isRunning || this.isPaused) return;
                
                const direction = btn.dataset.dir;
                const humanSnake = this.snakes.find(s => s.alive && s.type === 'human');
                if (!humanSnake) return;
                
                switch (direction) {
                    case 'up':
                        if (humanSnake.direction.y !== 1) {
                            humanSnake.setDirection(0, -1);
                        }
                        break;
                    case 'down':
                        if (humanSnake.direction.y !== -1) {
                            humanSnake.setDirection(0, 1);
                        }
                        break;
                    case 'left':
                        if (humanSnake.direction.x !== 1) {
                            humanSnake.setDirection(-1, 0);
                        }
                        break;
                    case 'right':
                        if (humanSnake.direction.x !== -1) {
                            humanSnake.setDirection(1, 0);
                        }
                        break;
                }
            }, { passive: false });
            
            // 鼠标点击支持（用于桌面端测试）
            btn.addEventListener('click', (e) => {
                if (!this.isRunning || this.isPaused) return;
                
                const direction = btn.dataset.dir;
                const humanSnake = this.snakes.find(s => s.alive && s.type === 'human');
                if (!humanSnake) return;
                
                switch (direction) {
                    case 'up':
                        if (humanSnake.direction.y !== 1) {
                            humanSnake.setDirection(0, -1);
                        }
                        break;
                    case 'down':
                        if (humanSnake.direction.y !== -1) {
                            humanSnake.setDirection(0, 1);
                        }
                        break;
                    case 'left':
                        if (humanSnake.direction.x !== 1) {
                            humanSnake.setDirection(-1, 0);
                        }
                        break;
                    case 'right':
                        if (humanSnake.direction.x !== -1) {
                            humanSnake.setDirection(1, 0);
                        }
                        break;
                }
            });
        });
    }

    // 处理键盘输入
    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused) return;
        
        // 空格键暂停
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
            return;
        }
        
        // P键切换AI模式
        if (e.code === 'KeyP') {
            e.preventDefault();
            this.togglePlayerAI();
            return;
        }
        
        // 处理每个玩家的输入
        for (let snake of this.snakes) {
            if (snake.handleInput(e.code)) {
                e.preventDefault();
                break;
            }
        }
    }

    // 切换暂停
    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        AudioManager.playPause();
        
        if (this.isPaused) {
            UI.showOverlay('游戏暂停', '按空格键继续');
        } else {
            UI.hideOverlay();
            this.lastUpdateTime = performance.now();
        }
        
        UI.updatePauseButton(this.isPaused);
    }

    // 切换玩家AI模式
    togglePlayerAI() {
        for (let snake of this.snakes) {
            if (snake.type === 'human' && snake.alive) {
                const isAI = snake.toggleAI();
                UI.showToast(`${snake.name} 切换到${isAI ? '自动' : '手动'}模式`);
                UI.updatePlayerPanel(this.snakes);
                break;
            }
        }
    }

    // 随机中文名字生成器
    generateRandomChineseName() {
        const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
        const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀', '霞', '平', '刚', '桂', '英', '华', '建', '文', '辉', '宇', '博', '浩', '然', '轩', '昊', '瑞', '泽', '晨', '辰', '逸', '翔', '凯', '乐', '欣', '雨', '雪', '梦', '瑶', '琳', '婷', '慧', '淑'];
        
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const nameLength = Math.random() < 0.5 ? 1 : 2; // 50%概率1个字，50%概率2个字
        let name = '';
        for (let i = 0; i < nameLength; i++) {
            name += names[Math.floor(Math.random() * names.length)];
        }
        
        return surname + name;
    }

    // 重置游戏
    reset() {
        this.stop();
        
        this.config = GameConfig.get();
        this.gridSize = this.config.initialGridSize;
        this.cellSize = GameConfig.getCellSize(this.gridSize);
        
        this.gameTime = 0;
        this.lastUpgradeTime = 0;
        this.winner = null;
        
        // 创建蛇
        this.snakes = [];
        const activePlayers = this.config.getActivePlayers ? 
            this.config.getActivePlayers() : 
            this.config.players.slice(0, this.config.playerCount);
        
        for (let playerConfig of activePlayers) {
            // 生成随机中文名字
            const randomName = this.generateRandomChineseName();
            const configWithRandomName = {
                ...playerConfig,
                name: randomName
            };
            const snake = new Snake(configWithRandomName, this.gridSize);
            this.snakes.push(snake);
        }
        
        // 创建食物管理器
        this.foodManager = new FoodManager(this.gridSize);
        
        // 初始化AI控制器
        this.aiManager.clear();
        for (let snake of this.snakes) {
            if (snake.type === 'ai' || snake.aiEnabled) {
                this.aiManager.createController(snake, this.snakes, this.foodManager);
            }
        }
        
        // 初始生成道具（食物、复活道具、穿透道具平分）
        for (let i = 0; i < 3; i++) {
            if (i === 0) {
                // 第一个生成复活道具
                this.foodManager.spawnReviveItem(this.snakes);
            } else if (i === 1) {
                // 第二个生成穿透道具
                this.foodManager.spawnPenetrateItem(this.snakes);
            } else {
                // 其余生成食物
                this.foodManager.spawnFood(this.snakes);
            }
        }
        
        // 更新UI
        UI.updatePlayerPanel(this.snakes);
        UI.updateGridInfo(this.gridSize);
        UI.updateTimer(0);
        UI.hideOverlay();
        
        this.render();
    }

    // 开始游戏
    start() {
        if (this.isRunning) return;
        
        // 先停止之前的游戏循环
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.lastUpdateTime = performance.now();
        this.currentSpeedLevel = this.config.speedLevel || 6;
        
        AudioManager.playStart();
        UI.updateStartButton(true);
        UI.updatePauseButton(false);
        
        // 延迟一帧启动游戏循环，确保reset完成
        setTimeout(() => {
            this.gameLoop();
        }, 0);
    }

    // 停止游戏
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        UI.updateStartButton(false);
        UI.updatePauseButton(false);
    }

    // 游戏主循环
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        const gameSpeed = GameConfig.getSpeedFromLevel(this.currentSpeedLevel);
        
        if (!this.isPaused && deltaTime >= gameSpeed) {
            this.update(deltaTime);
            this.lastUpdateTime = currentTime;
        }
        
        this.render();
        
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    // 更新游戏状态
    update(deltaTime) {
        // 更新游戏时间
        this.gameTime += deltaTime / 1000;
        UI.updateTimer(Math.floor(this.gameTime));
        
        // 更新缩圈倒计时
        this.updateShrinkTimer();
        
        // 更新食物和道具（检查过期）
        if (this.foodManager) {
            this.foodManager.update(deltaTime);
        }
        
        // 检查是否需要升级难度
        this.checkUpgrade();
        
        // 更新AI
        this.aiManager.updateAll(this.snakes, this.foodManager);
        
        // 移动所有蛇
        const aliveSnakes = this.snakes.filter(s => s.alive);
        
        for (let snake of aliveSnakes) {
            const moveResult = snake.move(this.snakes);
            // 如果被阻挡无法前进，播放音效
            if (moveResult === 'blocked') {
                AudioManager.playEat(3); // 使用吃食物的音效
            } else if (moveResult === 'penetrated') {
                AudioManager.playPenetrate(); // 穿透音效
                UI.showToast(`${snake.name} 穿透了！`, 1500);
            } else if (moveResult === 'need_revive') {
                // 需要使用翻转续命道具重生
                const revived = snake.revive(this.gridSize, this.snakes);
                if (revived) {
                    AudioManager.playUpgrade(); // 使用升级音效表示重生
                    UI.showToast(`${snake.name} 使用翻转续命重生了！`, 3000);
                } else {
                    // 找不到安全位置，死亡
                    snake.die();
                    snake.body = [];
                    AudioManager.playDie();
                    UI.showToast(`${snake.name} 被困死了！`);
                }
            } else if (moveResult === 'died') {
                // 蛇死亡，播放死亡音效
                AudioManager.playDie();
                UI.showToast(`${snake.name} 被困死了！`);
            }
        }
        
        // 更新所有蛇的闪烁状态和穿透状态
        for (let snake of this.snakes) {
            snake.updateBlinking();
            snake.updatePenetrateBlinking();
        }
        
        // 检查蛇之间的碰撞
        this.checkCollisions();
        
        // 检查吃食物
        for (let snake of this.snakes) {
            const eatenFood = this.foodManager.checkEat(snake);
            if (eatenFood) {
                AudioManager.playEat(eatenFood.value);
                UI.updatePlayerPanel(this.snakes);
                
                // 生成新食物
                this.foodManager.spawnFood(this.snakes);
            }
        }
        
        // 检查吃道具
        for (let snake of this.snakes) {
            const eatenItem = this.foodManager.checkEatItem(snake);
            if (eatenItem) {
                AudioManager.playUpgrade();
                UI.showToast(`${snake.name} 获得了 ${eatenItem.name}！`, 3000);
                UI.updatePlayerPanel(this.snakes);
            }
        }
        
        // 确保有足够的道具（食物、复活道具、穿透道具平分刷新机会）
        const totalObjects = this.foodManager.getFoods().length + this.foodManager.getItems().length;
        if (totalObjects < 3) {
            const rand = Math.random();
            if (rand < 0.33) {
                // 33%概率生成食物
                this.foodManager.spawnFood(this.snakes);
            } else if (rand < 0.66) {
                // 33%概率生成复活道具
                this.foodManager.spawnReviveItem(this.snakes);
            } else {
                // 33%概率生成穿透道具
                this.foodManager.spawnPenetrateItem(this.snakes);
            }
        }
        
        // 检查游戏结束
        this.checkGameOver();
        
        // 更新UI
        UI.updatePlayerPanel(this.snakes);
    }

    // 检查碰撞
    checkCollisions() {
        const aliveSnakes = this.snakes.filter(s => s.alive);
        
        for (let i = 0; i < aliveSnakes.length; i++) {
            for (let j = 0; j < aliveSnakes.length; j++) {
                if (i === j) continue;
                
                const snake1 = aliveSnakes[i];
                const snake2 = aliveSnakes[j];
                
                const collision = snake1.checkCollisionWith(snake2);
                
                if (collision === 'hit') {
                    // 撞到对方，播放音效
                    AudioManager.playEat(3);
                }
            }
        }
    }

    // 更新缩圈倒计时显示
    updateShrinkTimer() {
        const upgradeInterval = this.config.upgradeInterval;
        const timeUntilUpgrade = upgradeInterval - (this.gameTime - this.lastUpgradeTime);
        const secondsLeft = Math.ceil(timeUntilUpgrade);
        
        if (secondsLeft > 0) {
            UI.updateShrinkTimer(secondsLeft);
        } else {
            UI.updateShrinkTimer(0);
        }
    }

    // 检查难度升级
    checkUpgrade() {
        const upgradeInterval = this.config.upgradeInterval;
        
        if (this.gameTime - this.lastUpgradeTime >= upgradeInterval) {
            this.lastUpgradeTime = this.gameTime;
            
            // 升级难度：减少格子数
            const newGridSize = GameConfig.getUpgradedGridSize(this.gridSize);
            
            if (newGridSize !== this.gridSize) {
                this.upgradeDifficulty(newGridSize);
            }
        }
    }

    // 升级难度
    upgradeDifficulty(newGridSize) {
        const oldGridSize = this.gridSize;
        this.gridSize = newGridSize;
        this.cellSize = GameConfig.getCellSize(this.gridSize);
        
        // 更新所有蛇的位置
        for (let snake of this.snakes) {
            snake.updateGridSize(newGridSize);
            snake.gridSize = newGridSize;
        }
        
        // 更新食物管理器
        this.foodManager.updateGridSize(newGridSize);
        
        // 提升速度档位
        const oldSpeedLevel = this.currentSpeedLevel;
        if (this.currentSpeedLevel < this.config.maxSpeedLevel) {
            this.currentSpeedLevel++;
        }
        
        // 播放升级音效
        AudioManager.playUpgrade();
        
        // 显示升级提示
        const speedText = this.currentSpeedLevel > oldSpeedLevel ? 
            ` 速度${GameConfig.getSpeedLevelText(this.currentSpeedLevel)}!` : '';
        UI.showToast(`难度升级！格子:${oldGridSize}→${newGridSize}${speedText}`);
        UI.updateGridInfo(newGridSize);
    }

    // 检查游戏结束
    checkGameOver() {
        // 检查是否所有玩家都阵亡
        const allDead = this.snakes.every(snake => !snake.alive);
        
        if (allDead) {
            // 找出获胜者（死亡前长度最长的）
            let winner = null;
            let maxLength = 0;
            
            for (let snake of this.snakes) {
                // 使用score字段（包含吃到的所有长度）
                if (snake.score > maxLength) {
                    maxLength = snake.score;
                    winner = snake;
                }
            }
            
            this.winner = winner;
            this.endGame();
        }
    }

    // 结束游戏
    endGame() {
        this.stop();
        
        if (this.winner) {
            AudioManager.playWin();
            UI.showOverlay(
                '游戏结束',
                `${this.winner.name} 获胜！总长度: ${this.winner.score + 3}`
            );
        } else {
            UI.showOverlay('游戏结束', '平局！');
        }
    }

    // 渲染游戏画面
    render() {
        // 自适应画布大小
        this.resizeCanvas();
        
        // 清空画布
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制食物
        this.drawFoods();
        
        // 绘制道具
        this.drawItems();
        
        // 绘制蛇
        this.drawSnakes();
    }

    // 自适应调整画布大小（已禁用，使用固定大小）
    resizeCanvas() {
        // 固定画布大小为 600x600，根据格子数计算格子大小
        const fixedCanvasSize = 600;
        const newCellSize = fixedCanvasSize / this.gridSize;
        
        if (this.canvas.width !== fixedCanvasSize) {
            this.canvas.width = fixedCanvasSize;
            this.canvas.height = fixedCanvasSize;
            this.cellSize = newCellSize;
        }
    }

    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = '#1e1e2e';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            
            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    // 绘制食物
    drawFoods() {
        const foods = this.foodManager.getFoods();
        const time = Date.now();
        
        for (let food of foods) {
            const x = food.x * this.cellSize;
            const y = food.y * this.cellSize;
            const centerX = x + this.cellSize / 2;
            const centerY = y + this.cellSize / 2;
            
            // 获取剩余时间比例
            const timeRatio = this.foodManager.getFoodTimeRatio(food);
            
            // 发光效果 - 快消失时闪烁
            let pulse = Math.sin((time - food.spawnTime) / 200) * 0.2 + 0.8;
            if (timeRatio < 0.3) {
                pulse = Math.sin(time / 50) * 0.3 + 0.7; // 快消失时快速闪烁
            }
            const radius = Math.max(2, (this.cellSize / 2 - 2) * pulse);
            
            // 外发光 - 根据剩余时间调整透明度
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.max(0, radius * 1.5)
            );
            gradient.addColorStop(0, food.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.globalAlpha = timeRatio; // 根据剩余时间调整透明度
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 食物主体
            this.ctx.fillStyle = food.color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 显示数值
            this.ctx.fillStyle = '#000';
            this.ctx.font = `bold ${Math.max(10, this.cellSize * 0.5)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.value.toString(), centerX, centerY);
            
            this.ctx.globalAlpha = 1; // 重置透明度
            
            // 绘制倒计时圆环
            if (timeRatio > 0) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
                this.ctx.stroke();
            }
        }
    }

    // 绘制道具
    drawItems() {
        const items = this.foodManager.getItems();
        const time = Date.now();
        
        for (let item of items) {
            const x = item.x * this.cellSize;
            const y = item.y * this.cellSize;
            const centerX = x + this.cellSize / 2;
            const centerY = y + this.cellSize / 2;
            
            // 获取剩余时间比例
            const timeRatio = this.foodManager.getItemTimeRatio(item);
            
            // 旋转动画效果 - 快消失时旋转更快
            let rotation = (time - item.spawnTime) / 1000;
            let pulse = Math.sin((time - item.spawnTime) / 200) * 0.2 + 0.8;
            if (timeRatio < 0.3) {
                rotation = (time - item.spawnTime) / 200; // 快消失时快速旋转
                pulse = Math.sin(time / 50) * 0.3 + 0.7; // 快消失时快速闪烁
            }
            const radius = Math.max(2, (this.cellSize / 2 - 2) * pulse);
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotation);
            
            // 根据剩余时间调整透明度
            this.ctx.globalAlpha = timeRatio;
            
            // 外发光
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(0, radius * 2));
            gradient.addColorStop(0, item.color);
            gradient.addColorStop(0.5, item.glowColor);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 根据道具类型绘制不同形状
            this.ctx.fillStyle = item.color;
            if (item.type === 'penetrate') {
                // 穿透道具 - 绘制菱形
                this.ctx.beginPath();
                this.ctx.moveTo(0, -radius);
                this.ctx.lineTo(radius, 0);
                this.ctx.lineTo(0, radius);
                this.ctx.lineTo(-radius, 0);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // 翻转续命道具 - 绘制星形
                this.ctx.beginPath();
                const spikes = 5;
                const outerRadius = radius;
                const innerRadius = radius * 0.4;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const r = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // 中心圆点
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
            
            // 绘制倒计时圆环（不旋转）
            if (timeRatio > 0) {
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
    }

    // 绘制蛇
    drawSnakes() {
        for (let snake of this.snakes) {
            if (!snake.alive) continue;
            
            const body = snake.body;
            
            // 获取闪烁透明度
            const blinkOpacity = snake.getOpacity();
            
            for (let i = body.length - 1; i >= 0; i--) {
                const segment = body[i];
                
                // 跳过边界外的身体段
                if (segment.x < 0 || segment.x >= this.gridSize || 
                    segment.y < 0 || segment.y >= this.gridSize) {
                    continue;
                }
                
                const x = segment.x * this.cellSize;
                const y = segment.y * this.cellSize;
                const size = Math.max(1, this.cellSize - 1);
                
                // 身体渐变效果
                const alpha = (1 - (i / body.length) * 0.5) * blinkOpacity;
                const color = this.hexToRgba(snake.color, alpha);
                
                // 发光效果（头部）
                if (i === 0 && size > 0) {
                    const glowGradient = this.ctx.createRadialGradient(
                        x + size / 2, y + size / 2, 0,
                        x + size / 2, y + size / 2, Math.max(0, size)
                    );
                    const glowColor = this.hexToRgba(snake.color, blinkOpacity * 0.8);
                    glowGradient.addColorStop(0, glowColor);
                    glowGradient.addColorStop(1, 'transparent');
                    
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
                }
                
                // 身体段
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x + 1, y + 1, size - 1, size - 1);
                
                // 头部特殊标记
                if (i === 0) {
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 1, y + 1, size - 1, size - 1);
                    
                    // 眼睛
                    const eyeSize = Math.max(2, size / 6);
                    this.ctx.fillStyle = '#fff';
                    
                    // 根据方向绘制眼睛
                    let eye1X, eye1Y, eye2X, eye2Y;
                    const offset = size / 3;
                    
                    if (snake.direction.x === 1) { // 向右
                        eye1X = x + size - offset; eye1Y = y + offset;
                        eye2X = x + size - offset; eye2Y = y + size - offset;
                    } else if (snake.direction.x === -1) { // 向左
                        eye1X = x + offset; eye1Y = y + offset;
                        eye2X = x + offset; eye2Y = y + size - offset;
                    } else if (snake.direction.y === -1) { // 向上
                        eye1X = x + offset; eye1Y = y + offset;
                        eye2X = x + size - offset; eye2Y = y + offset;
                    } else { // 向下
                        eye1X = x + offset; eye1Y = y + size - offset;
                        eye2X = x + size - offset; eye2Y = y + size - offset;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                    this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }

    // 辅助函数：hex颜色转rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
