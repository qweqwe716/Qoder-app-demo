/**
 * 蛇类 - 管理单个蛇的状态和行为
 */

class Snake {
    constructor(config, gridSize) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type; // 'human' 或 'ai'
        this.color = config.color;
        this.controls = config.controls;
        
        this.gridSize = gridSize;
        this.reset();
    }

    // 重置蛇的状态
    reset() {
        // 根据玩家ID设置不同的初始位置（支持12人）
        const margin = Math.floor(this.gridSize / 10); // 边距为格子大小的10%
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);
        
        const startPositions = [
            { x: margin, y: margin },                                   // 玩家1: 左上
            { x: this.gridSize - margin - 1, y: this.gridSize - margin - 1 },  // 玩家2: 右下
            { x: this.gridSize - margin - 1, y: margin },                  // 玩家3: 右上
            { x: margin, y: this.gridSize - margin - 1 },                  // 玩家4: 左下
            { x: centerX, y: margin },      // 玩家5: 上中
            { x: centerX, y: this.gridSize - margin - 1 }, // 玩家6: 下中
            { x: Math.floor(this.gridSize * 0.25), y: Math.floor(this.gridSize * 0.25) }, // 玩家7: 左中上
            { x: Math.floor(this.gridSize * 0.75), y: Math.floor(this.gridSize * 0.25) }, // 玩家8: 右中上
            { x: Math.floor(this.gridSize * 0.25), y: Math.floor(this.gridSize * 0.75) }, // 玩家9: 左中下
            { x: Math.floor(this.gridSize * 0.75), y: Math.floor(this.gridSize * 0.75) }, // 玩家10: 右中下
            { x: margin, y: centerY }, // 玩家11: 左中
            { x: this.gridSize - margin - 1, y: centerY } // 玩家12: 右中
        ];
        
        const startDirs = [
            { x: 1, y: 0 },   // 玩家1: 向右
            { x: -1, y: 0 },  // 玩家2: 向左
            { x: -1, y: 0 },  // 玩家3: 向左
            { x: 1, y: 0 },   // 玩家4: 向右
            { x: 0, y: 1 },   // 玩家5: 向下
            { x: 0, y: -1 },  // 玩家6: 向上
            { x: 1, y: 0 },   // 玩家7: 向右
            { x: -1, y: 0 },  // 玩家8: 向左
            { x: 1, y: 0 },   // 玩家9: 向右
            { x: -1, y: 0 },  // 玩家10: 向左
            { x: 1, y: 0 },   // 玩家11: 向右
            { x: -1, y: 0 }   // 玩家12: 向左
        ];
        
        const pos = startPositions[this.id - 1] || startPositions[0];
        const dir = startDirs[this.id - 1] || startDirs[0];
        
        // 计算身体各段位置，确保在边界内
        const headX = Math.max(0, Math.min(pos.x, this.gridSize - 1));
        const headY = Math.max(0, Math.min(pos.y, this.gridSize - 1));
        
        this.body = [
            { x: headX, y: headY },
            { x: Math.max(0, Math.min(headX - dir.x, this.gridSize - 1)), y: Math.max(0, Math.min(headY - dir.y, this.gridSize - 1)) },
            { x: Math.max(0, Math.min(headX - dir.x * 2, this.gridSize - 1)), y: Math.max(0, Math.min(headY - dir.y * 2, this.gridSize - 1)) }
        ];
        
        this.direction = { ...dir };
        this.nextDirection = { ...dir };
        this.alive = true;
        this.growAmount = 0;
        this.score = 0;
        this.aiEnabled = this.type === 'ai';
        this.lastMoveTime = 0;
        this.blinking = false; // 闪烁状态
        this.blinkCount = 0; // 闪烁次数
        this.blinkStartTime = 0; // 闪烁开始时间
        this.blockedCount = 0; // 连续被阻挡次数
        this.maxBlockedCount = 2; // 最大允许连续被阻挡次数（2个周期）
        this.reviveCount = 0; // 翻转续命道具数量
        this.penetrateCount = 0; // 穿透道具数量
        this.isPenetrating = false; // 是否正在穿透状态
        this.penetrateBlinkCount = 0; // 穿透闪烁次数
    }

    // 设置方向
    setDirection(newDir) {
        // 防止180度转向
        if (this.direction.x !== -newDir.x || this.direction.y !== -newDir.y) {
            this.nextDirection = { ...newDir };
        }
    }

    // 处理键盘输入
    handleInput(keyCode) {
        if (!this.alive || this.aiEnabled) return false;
        
        const dirs = {
            [this.controls.up]: { x: 0, y: -1 },
            [this.controls.down]: { x: 0, y: 1 },
            [this.controls.left]: { x: -1, y: 0 },
            [this.controls.right]: { x: 1, y: 0 }
        };
        
        if (dirs[keyCode]) {
            this.setDirection(dirs[keyCode]);
            return true;
        }
        return false;
    }

    // 切换AI模式
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        return this.aiEnabled;
    }

    // 移动蛇
    move(allSnakes) {
        if (!this.alive) return null;
        
        // 应用下一个方向
        this.direction = { ...this.nextDirection };
        
        // 计算新头部位置
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // 检查是否可以移动（是否被阻挡）
        const blockType = this.isBlocked(newHead, allSnakes);
        
        if (blockType !== 'free') {
            // 检查是否有穿透道具
            if (this.penetrateCount > 0 && !this.isPenetrating) {
                this.penetrateCount--;
                this.isPenetrating = true;
                this.penetrateBlinkCount = 3;
                // 计算穿透后的位置
                const penetratedHead = this.calculatePenetratedPosition(newHead, blockType);
                if (penetratedHead) {
                    this.body.unshift(penetratedHead);
                    this.body.pop();
                    return 'penetrated';
                }
            }
            
            // 被阻挡无法前进：增加被阻挡计数
            this.blockedCount++;
            
            // 检查是否超过最大允许被阻挡次数
            if (this.blockedCount >= this.maxBlockedCount) {
                // 检查是否有翻转续命道具
                if (this.reviveCount > 0) {
                    return 'need_revive';
                }
                // 死亡并清除尸体
                this.die();
                this.body = []; // 清除尸体
                return 'died';
            }
            
            // 未达到死亡条件：增加3格并闪烁，但不移动
            this.grow(3);
            this.startBlinking();
            return 'blocked';
        }
        
        // 成功移动，重置被阻挡计数
        this.blockedCount = 0;
        
        // 移动身体
        this.body.unshift(newHead);
        
        // 如果没有增长，移除尾部
        if (this.growAmount > 0) {
            this.growAmount--;
        } else {
            this.body.pop();
        }
        
        return newHead;
    }

    // 检查是否被阻挡，返回阻挡类型：'free'|'wall'|'self'|'other'
    isBlocked(newHead, allSnakes) {
        // 检查边界
        if (newHead.x < 0 || newHead.x >= this.gridSize || 
            newHead.y < 0 || newHead.y >= this.gridSize) {
            return 'wall';
        }
        
        // 检查当前身体是否已在边界外（异常情况）
        for (let segment of this.body) {
            if (segment.x < 0 || segment.x >= this.gridSize || 
                segment.y < 0 || segment.y >= this.gridSize) {
                return 'wall';
            }
        }
        
        // 检查是否撞到自己（除了尾部，因为尾部会移动）
        for (let i = 0; i < this.body.length - 1; i++) {
            if (newHead.x === this.body[i].x && newHead.y === this.body[i].y) {
                return 'self';
            }
        }
        
        // 检查是否撞到其他蛇
        if (allSnakes) {
            for (let otherSnake of allSnakes) {
                if (otherSnake.id === this.id || !otherSnake.alive) continue;
                
                for (let segment of otherSnake.body) {
                    if (newHead.x === segment.x && newHead.y === segment.y) {
                        return 'other';
                    }
                }
            }
        }
        
        return 'free';
    }

    // 计算穿透后的位置
    calculatePenetratedPosition(newHead, blockType) {
        // 如果是墙壁穿透，从对面出来
        if (blockType === 'wall') {
            let penetratedX = newHead.x;
            let penetratedY = newHead.y;
            
            // 使用独立的 if 语句，确保角落情况也能正确处理
            if (newHead.x < 0) penetratedX = this.gridSize - 1;
            if (newHead.x >= this.gridSize) penetratedX = 0;
            if (newHead.y < 0) penetratedY = this.gridSize - 1;
            if (newHead.y >= this.gridSize) penetratedY = 0;
            
            return { x: penetratedX, y: penetratedY };
        }
        
        // 如果是撞到自己或其他蛇，直接穿透过去（保持原方向继续前进）
        if (blockType === 'self' || blockType === 'other') {
            // 直接移动到目标位置（穿透）
            return { x: newHead.x, y: newHead.y };
        }
        
        return null;
    }

    // 开始闪烁
    startBlinking() {
        this.blinking = true;
        this.blinkCount = 0;
        this.blinkStartTime = Date.now();
    }

    // 更新闪烁状态
    updateBlinking() {
        if (!this.blinking) return;
        
        const elapsed = Date.now() - this.blinkStartTime;
        const blinkDuration = 300; // 每次闪烁300ms
        const totalBlinks = 3;
        
        if (elapsed >= blinkDuration * totalBlinks * 2) {
            this.blinking = false;
            this.blinkCount = 0;
        } else {
            this.blinkCount = Math.floor(elapsed / blinkDuration);
        }
    }

    // 更新穿透闪烁状态
    updatePenetrateBlinking() {
        if (!this.isPenetrating) return;
        
        // 每次游戏更新（tick）减少一次闪烁计数
        if (this.penetrateBlinkCount > 0) {
            this.penetrateBlinkCount--;
            // 触发一次闪烁效果
            this.startBlinking();
        } else {
            this.isPenetrating = false;
        }
    }

    // 获取当前透明度（用于闪烁效果）
    getOpacity() {
        if (!this.blinking) return 1;
        // 奇数次闪烁时半透明
        return this.blinkCount % 2 === 0 ? 1 : 0.4;
    }

    // 增长蛇
    grow(amount) {
        this.growAmount += amount;
        this.score += amount;
    }

    // 蛇死亡
    die() {
        this.alive = false;
        this.deathTime = Date.now(); // 记录死亡时间
    }

    // 使用翻转续命道具重生
    revive(gridSize, allSnakes) {
        this.reviveCount--;
        this.blockedCount = 0;
        
        // 寻找可存活的位置
        const safePosition = this.findSafePosition(gridSize, allSnakes);
        
        if (safePosition) {
            // 重置为3格长度，确保在边界内
            const headX = Math.max(0, Math.min(safePosition.x, gridSize - 1));
            const headY = Math.max(0, Math.min(safePosition.y, gridSize - 1));
            
            this.body = [
                { x: headX, y: headY },
                { x: Math.max(0, Math.min(headX - safePosition.dir.x, gridSize - 1)), y: Math.max(0, Math.min(headY - safePosition.dir.y, gridSize - 1)) },
                { x: Math.max(0, Math.min(headX - safePosition.dir.x * 2, gridSize - 1)), y: Math.max(0, Math.min(headY - safePosition.dir.y * 2, gridSize - 1)) }
            ];
            this.direction = { ...safePosition.dir };
            this.nextDirection = { ...safePosition.dir };
            this.gridSize = gridSize;
            return true;
        }
        
        // 找不到安全位置，死亡
        this.die();
        this.body = [];
        return false;
    }

    // 寻找可存活的安全位置
    findSafePosition(gridSize, allSnakes) {
        const directions = [
            { x: 1, y: 0 },   // 右
            { x: -1, y: 0 },  // 左
            { x: 0, y: 1 },   // 下
            { x: 0, y: -1 }   // 上
        ];
        
        // 获取所有被占用的格子
        const occupiedCells = [];
        if (allSnakes) {
            for (let snake of allSnakes) {
                if (snake.id !== this.id && snake.alive) {
                    occupiedCells.push(...snake.body);
                }
            }
        }
        
        // 收集所有可能的起始位置
        const candidates = [];
        const margin = 3; // 距离边界的最小距离
        
        for (let x = margin; x < gridSize - margin; x++) {
            for (let y = margin; y < gridSize - margin; y++) {
                // 检查这个位置是否被占用
                const isOccupied = occupiedCells.some(cell => cell.x === x && cell.y === y);
                if (!isOccupied) {
                    // 检查每个方向是否可以存活（前方3格都是空的）
                    for (let dir of directions) {
                        let canSurvive = true;
                        for (let i = 1; i <= 3; i++) {
                            const checkX = x + dir.x * i;
                            const checkY = y + dir.y * i;
                            if (checkX < 0 || checkX >= gridSize || 
                                checkY < 0 || checkY >= gridSize ||
                                occupiedCells.some(cell => cell.x === checkX && cell.y === checkY)) {
                                canSurvive = false;
                                break;
                            }
                        }
                        if (canSurvive) {
                            candidates.push({ x, y, dir });
                        }
                    }
                }
            }
        }
        
        // 随机选择一个安全位置
        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        return null;
    }

    // 获取头部位置
    getHead() {
        return this.body[0];
    }

    // 获取蛇的长度（HP）
    getLength() {
        return this.body.length;
    }

    // 检查是否与其他蛇碰撞（现在由isBlocked统一处理，此方法保留用于兼容性）
    checkCollisionWith(otherSnake) {
        // 碰撞检测已移至isBlocked方法
        return false;
    }

    // 缩短蛇身
    shrink(amount) {
        // 确保不会缩短到少于3格
        const minLength = 3;
        const currentLength = this.getLength();
        const canRemove = Math.max(0, currentLength - minLength);
        const actualRemove = Math.min(amount, canRemove);
        
        for (let i = 0; i < actualRemove; i++) {
            if (this.body.length > minLength) {
                this.body.pop();
            }
        }
    }

    // 更新格子大小（难度升级时）
    updateGridSize(newSize) {
        const scale = newSize / this.gridSize;
        this.gridSize = newSize;
        
        // 调整蛇的位置
        this.body = this.body.map(segment => ({
            x: Math.floor(segment.x * scale),
            y: Math.floor(segment.y * scale)
        }));
        
        // 确保蛇在边界内
        this.body = this.body.map(segment => ({
            x: Math.max(0, Math.min(segment.x, newSize - 1)),
            y: Math.max(0, Math.min(segment.y, newSize - 1))
        }));
    }

    // 获取蛇占据的所有格子
    getOccupiedCells() {
        return this.body.map(segment => ({ x: segment.x, y: segment.y }));
    }

    // 序列化状态（用于AI决策）
    getState() {
        return {
            id: this.id,
            body: [...this.body],
            head: this.getHead(),
            direction: { ...this.direction },
            alive: this.alive,
            length: this.getLength(),
            color: this.color
        };
    }
}
