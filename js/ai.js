/**
 * AI控制器 - 控制电脑玩家的行为
 */

class AIController {
    constructor(snake, allSnakes, foodManager) {
        this.snake = snake;
        this.allSnakes = allSnakes;
        this.foodManager = foodManager;
        this.gridSize = foodManager.gridSize;
        this.lastScore = snake.score; // 上次的分数
        this.lastItemCount = 0; // 上次的道具数量
        this.forceTarget = null; // 强制获取的目标
        
        // AI策略：survival(保命优先), length(长度优先), aggressive(进攻优先), item(道具优先)
        this.strategy = snake.aiStrategy || this.randomStrategy();
        
        // 步数统计（替代时间倒计时）
        this.stepsSinceLastGain = 0; // 自上次获得以来的步数
        this.stepsThreshold = this.randomStepsThreshold(); // 随机步数阈值 8~16步
        
        // 防止原地转圈
        this.lastPositions = []; // 记录最近的位置
        this.maxPositionHistory = 4; // 记录最近4个位置
        this.circleDetectionCount = 0; // 检测到转圈的次数
        
        // 策略切换计时
        this.strategySwitchInterval = 5000; // 5秒切换一次策略
        this.lastStrategySwitchTime = Date.now();
    }

    // 随机分配AI策略
    randomStrategy() {
        const strategies = ['survival', 'length', 'aggressive', 'item'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }

    // 检查并切换策略
    checkAndSwitchStrategy() {
        const now = Date.now();
        if (now - this.lastStrategySwitchTime >= this.strategySwitchInterval) {
            this.strategy = this.randomStrategy();
            this.lastStrategySwitchTime = now;
            return true; // 返回true表示已切换
        }
        return false;
    }

    // 获取当前实际使用的策略（考虑保命策略的长度限制）
    getEffectiveStrategy() {
        // 保命策略需要长度大于50才能使用
        if (this.strategy === 'survival' && this.snake.getLength() <= 50) {
            // 长度不足时，随机使用其他策略
            const fallbackStrategies = ['length', 'aggressive', 'item'];
            return fallbackStrategies[Math.floor(Math.random() * fallbackStrategies.length)];
        }
        return this.strategy;
    }

    // 生成随机步数阈值 8~16步
    randomStepsThreshold() {
        return 8 + Math.floor(Math.random() * 9); // 8~16步
    }

    // 更新引用
    updateReferences(allSnakes, foodManager) {
        this.allSnakes = allSnakes;
        this.foodManager = foodManager;
        this.gridSize = foodManager.gridSize;
    }

    // 检查是否获得道具或食物，并更新统计
    checkGainAndReset() {
        let hasGained = false;
        
        // 检查分数是否变化（吃到食物）
        if (this.snake.score > this.lastScore) {
            this.lastScore = this.snake.score;
            hasGained = true;
        }
        
        // 检查道具数量是否变化
        const currentItemCount = this.snake.reviveCount + this.snake.penetrateCount;
        if (currentItemCount > this.lastItemCount) {
            this.lastItemCount = currentItemCount;
            hasGained = true;
        }
        
        // 如果获得了东西，重置步数统计和位置历史
        if (hasGained) {
            this.stepsSinceLastGain = 0;
            this.stepsThreshold = this.randomStepsThreshold();
            this.forceTarget = null;
            this.lastPositions = []; // 重置位置历史
            this.circleDetectionCount = 0;
            return true;
        }
        
        return false;
    }

    // 检查是否超过步数阈值需要强制获取
    checkStepsThreshold() {
        // 步数超过阈值，需要主动获取
        return this.stepsSinceLastGain >= this.stepsThreshold;
    }

    // 选择强制获取的目标（最近的道具或食物）
    selectForceTarget() {
        const head = this.snake.getHead();
        const foods = this.foodManager.getFoods();
        const items = this.foodManager.getItems();
        
        let bestTarget = null;
        let minDistance = Infinity;
        
        // 优先找道具
        for (let item of items) {
            const dist = Math.abs(head.x - item.x) + Math.abs(head.y - item.y);
            if (dist < minDistance) {
                minDistance = dist;
                bestTarget = item;
            }
        }
        
        // 没有道具就找食物
        if (!bestTarget && foods.length > 0) {
            for (let food of foods) {
                const dist = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestTarget = food;
                }
            }
        }
        
        return bestTarget;
    }

    // 记录当前位置到历史
    recordPosition(head) {
        const posKey = `${head.x},${head.y}`;
        this.lastPositions.push(posKey);
        if (this.lastPositions.length > this.maxPositionHistory) {
            this.lastPositions.shift();
        }
    }

    // 检测是否在原地转圈
    isCircling() {
        if (this.lastPositions.length < this.maxPositionHistory) return false;
        
        // 检查最近的位置是否有重复（说明在转圈）
        const uniquePositions = new Set(this.lastPositions);
        // 如果4个位置中只有2个或更少的不同位置，说明在转圈
        if (uniquePositions.size <= 2) {
            this.circleDetectionCount++;
            return true;
        }
        
        // 检查是否形成小循环（如 A->B->A->B）
        const last4 = this.lastPositions.slice(-4);
        if (last4[0] === last4[2] && last4[1] === last4[3]) {
            this.circleDetectionCount++;
            return true;
        }
        
        this.circleDetectionCount = 0;
        return false;
    }

    // 检测是否在追着自己的尾巴玩（围绕自己身体转圈）
    isChasingOwnTail(head, possibleMoves) {
        // 检查是否只有1-2个可行移动（被自己的身体包围）
        if (possibleMoves.length > 2) return false;
        
        // 检查最近的移动是否一直在围绕自己的身体
        if (this.lastPositions.length < 6) return false;
        
        // 获取自己身体的所有位置
        const bodyPositions = new Set();
        for (let segment of this.snake.body) {
            bodyPositions.add(`${segment.x},${segment.y}`);
        }
        
        // 检查最近的位置是否都在自己身体附近
        let nearBodyCount = 0;
        for (let posKey of this.lastPositions) {
            const [px, py] = posKey.split(',').map(Number);
            // 检查这个位置是否紧邻自己的身体
            let isNearBody = false;
            for (let segment of this.snake.body) {
                const dist = Math.abs(segment.x - px) + Math.abs(segment.y - py);
                if (dist <= 2) {
                    isNearBody = true;
                    break;
                }
            }
            if (isNearBody) nearBodyCount++;
        }
        
        // 如果最近6个位置都在身体附近，说明在追着自己的尾巴玩
        if (nearBodyCount >= 6) {
            return true;
        }
        
        return false;
    }

    // 获取远离自己身体的移动方向
    getMoveAwayFromBody(head, possibleMoves) {
        if (possibleMoves.length === 0) return null;
        
        let bestMove = null;
        let maxMinDist = -1;
        
        for (let move of possibleMoves) {
            // 计算这个移动方向距离自己身体的最小距离
            let minDist = Infinity;
            for (let i = 0; i < this.snake.body.length; i++) {
                const segment = this.snake.body[i];
                const dist = Math.abs(segment.x - move.x) + Math.abs(segment.y - move.y);
                if (dist < minDist) minDist = dist;
            }
            
            // 选择距离身体最远的方向
            if (minDist > maxMinDist) {
                maxMinDist = minDist;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 获取AI的下一步移动方向
    // 优化后的优先级：保命（空间+风险）→ 道具 → 食物 → 探索
    // 新增：8~16步内必须获取道具或食物
    getNextMove() {
        if (!this.snake.alive) return null;
        
        // 检查是否需要切换策略（每5秒）
        this.checkAndSwitchStrategy();
        
        const head = this.snake.getHead();
        const foods = this.foodManager.getFoods();
        const items = this.foodManager.getItems();
        
        // 记录位置用于检测转圈
        this.recordPosition(head);
        
        // 获取所有可能的移动方向
        const possibleMoves = this.getPossibleMoves(head);
        
        if (possibleMoves.length === 0) {
            return this.getAnyMove(head);
        }
        
        // 检查是否获得道具或食物，并重置步数统计
        this.checkGainAndReset();
        
        // 增加步数计数
        this.stepsSinceLastGain++;
        
        // 检查是否超过步数阈值（8~16步）
        const needForceGet = this.checkStepsThreshold();
        
        // 检测是否在转圈
        const isCircling = this.isCircling();
        
        // 检测是否在追着自己的尾巴玩
        const isChasingTail = this.isChasingOwnTail(head, possibleMoves);
        
        // 如果检测到在追尾巴，强制选择远离身体的方向
        if (isChasingTail && !needForceGet) {
            const awayMove = this.getMoveAwayFromBody(head, possibleMoves);
            if (awayMove) {
                // 重置位置历史，避免重复检测
                this.lastPositions = [];
                return { x: awayMove.x - head.x, y: awayMove.y - head.y };
            }
        }
        
        // 如果超过步数阈值，强制选择目标并朝其移动
        if (needForceGet) {
            if (!this.forceTarget) {
                this.forceTarget = this.selectForceTarget();
            }
            
            if (this.forceTarget) {
                // 强制朝目标移动（忽略风险，必须成功获取）
                const forceMove = this.getForceMoveTowards(head, this.forceTarget, possibleMoves);
                if (forceMove) {
                    return { x: forceMove.x - head.x, y: forceMove.y - head.y };
                }
            }
        }
        
        // 评估每个移动的得分（空间、风险、目标距离）
        let scoredMoves = this.evaluateMoves(head, possibleMoves, foods, items, needForceGet);
        
        // 如果在转圈，优先选择能打破循环的移动（选择空间最大的方向）
        if (isCircling && !needForceGet) {
            scoredMoves.sort((a, b) => b.space - a.space);
            const bestSpaceMove = scoredMoves[0];
            if (bestSpaceMove && bestSpaceMove.space > 5) {
                return { x: bestSpaceMove.x - head.x, y: bestSpaceMove.y - head.y };
            }
        }
        
        // 选择得分最高的移动
        scoredMoves.sort((a, b) => b.score - a.score);
        const bestMove = scoredMoves[0];
        
        // 如果不是强制获取模式，且最好的移动风险太高，选择最安全的
        if (!needForceGet && bestMove.risk >= 8 && scoredMoves.length > 1) {
            // 找风险最低但空间尚可的移动
            const safeMoves = scoredMoves.filter(m => m.risk < 5);
            if (safeMoves.length > 0) {
                safeMoves.sort((a, b) => b.space - a.space);
                return { x: safeMoves[0].x - head.x, y: safeMoves[0].y - head.y };
            }
        }
        
        return { x: bestMove.x - head.x, y: bestMove.y - head.y };
    }

    // 强制朝目标移动 - 使用BFS寻找实际可达的路径
    getForceMoveTowards(head, target, possibleMoves) {
        // 首先尝试直接选择最接近目标的方向
        let bestMove = null;
        let minDist = Infinity;
        
        for (let move of possibleMoves) {
            const dist = Math.abs(move.x - target.x) + Math.abs(move.y - target.y);
            if (dist < minDist) {
                minDist = dist;
                bestMove = move;
            }
        }
        
        // 如果已经到达目标位置旁边，直接返回
        if (minDist <= 1) {
            return bestMove;
        }
        
        // 使用BFS找到实际能到达目标的路径
        const path = this.findPathToTarget(head, target);
        if (path && path.length > 0) {
            const nextStep = path[0];
            // 找到对应的移动
            const move = possibleMoves.find(m => m.x === nextStep.x && m.y === nextStep.y);
            if (move) {
                return move;
            }
        }
        
        // 如果没有找到路径，选择最接近目标的安全移动
        return bestMove;
    }

    // BFS寻路 - 找到从起点到目标的最短路径
    findPathToTarget(start, target) {
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Set();
        visited.add(`${start.x},${start.y}`);
        
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }, // 左
            { x: 1, y: 0 }   // 右
        ];
        
        let iterations = 0;
        const maxIterations = 100; // 限制搜索范围
        
        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            
            // 到达目标
            if (current.x === target.x && current.y === target.y) {
                return current.path;
            }
            
            // 探索四个方向
            for (let dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;
                
                // 检查是否已访问
                if (visited.has(key)) continue;
                
                // 检查是否是安全位置（可以穿过有穿透道具时的蛇身）
                if (!this.isSafeForForceMove(newX, newY)) continue;
                
                visited.add(key);
                queue.push({
                    x: newX,
                    y: newY,
                    path: [...current.path, { x: newX, y: newY }]
                });
            }
        }
        
        return null; // 没有找到路径
    }

    // 检查位置是否安全（强制移动时使用，允许穿过可穿透的障碍）
    isSafeForForceMove(x, y) {
        // 检查边界
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            return false;
        }
        
        // 检查是否是其他蛇的身体（不包括头部，因为头部会移动）
        for (let snake of this.allSnakes) {
            if (!snake.alive) continue;
            
            for (let i = 0; i < snake.body.length; i++) {
                const segment = snake.body[i];
                if (segment.x === x && segment.y === y) {
                    // 如果是自己的身体，不能穿过（除非是头部，会移动）
                    if (snake === this.snake) {
                        // 自己的身体，只要不是头部就可以穿过（假设有穿透道具）
                        if (i === 0) continue; // 头部会移动
                        return this.snake.penetrateCount > 0; // 有穿透道具才能穿过
                    }
                    // 其他蛇的身体
                    return this.snake.penetrateCount > 0; // 有穿透道具才能穿过
                }
            }
        }
        
        return true;
    }

    // 评估所有可能的移动
    // isStagnant: 是否超过步数阈值需要强制获取
    evaluateMoves(head, possibleMoves, foods, items, isStagnant = false) {
        // 强制获取模式下的优先级倍数（大幅提高）
        const stagnationMultiplier = isStagnant ? 10 : 1;
        // 强制获取模式下降低风险权重
        const riskWeight = isStagnant ? 1 : 5;
        
        // 根据AI策略调整权重
        const strategyWeights = this.getStrategyWeights();
        
        return possibleMoves.map(move => {
            const newX = head.x + move.x;
            const newY = head.y + move.y;
            
            // 计算空间分数（可用格子数）
            const space = this.calculateSpace(newX, newY, 8);
            const spaceScore = Math.min(space, 20) * 2 * strategyWeights.space; // 根据策略调整
            
            // 风险分数（强制获取模式下大幅降低风险权重）
            const riskPenalty = move.risk * riskWeight * strategyWeights.risk;
            
            // 道具分数（强制获取模式下优先级大幅提高）
            let itemScore = 0;
            if (items.length > 0) {
                const nearestItem = this.findNearest(newX, newY, items);
                if (nearestItem) {
                    const dist = Math.abs(newX - nearestItem.x) + Math.abs(newY - nearestItem.y);
                    let priority = 30;
                    if (nearestItem.type === 'revive') priority = 50;
                    if (nearestItem.type === 'penetrate') priority = 60;
                    // 强制获取模式下道具优先级提高10倍，策略权重调整
                    itemScore = Math.max(0, priority * stagnationMultiplier - dist * 2) * strategyWeights.item;
                }
            }
            
            // 食物分数（强制获取模式下优先级大幅提高）
            let foodScore = 0;
            if (foods.length > 0) {
                const nearestFood = this.findNearest(newX, newY, foods);
                if (nearestFood) {
                    const dist = Math.abs(newX - nearestFood.x) + Math.abs(newY - nearestFood.y);
                    // 强制获取模式下食物优先级提高10倍，策略权重调整
                    foodScore = (Math.max(0, 20 * stagnationMultiplier - dist * 2) + nearestFood.value * 2 * stagnationMultiplier) * strategyWeights.food;
                }
            }
            
            // 进攻分数（针对其他蛇的头部）
            let attackScore = 0;
            if (strategyWeights.attack > 0) {
                attackScore = this.calculateAttackScore(newX, newY) * strategyWeights.attack;
            }
            
            // 综合得分
            // 强制获取模式下，道具和食物分数占主导，风险几乎不考虑
            const score = spaceScore - riskPenalty + itemScore + foodScore + attackScore;
            
            return {
                ...move,
                space,
                score,
                risk: move.risk
            };
        });
    }

    // 获取策略权重
    getStrategyWeights() {
        // 使用实际生效的策略（考虑保命策略的长度限制）
        const effectiveStrategy = this.getEffectiveStrategy();
        
        switch (effectiveStrategy) {
            case 'survival': // 保命优先：空间>风险>食物>道具>进攻
                return { space: 3, risk: 3, food: 1, item: 0.5, attack: 0 };
            case 'length': // 长度优先：食物>空间>风险>道具>进攻
                return { space: 1.5, risk: 1, food: 3, item: 0.5, attack: 0 };
            case 'aggressive': // 进攻优先：进攻>空间>风险>食物>道具
                return { space: 1.5, risk: 0.5, food: 1, item: 0.5, attack: 3 };
            case 'item': // 道具优先：道具>空间>风险>食物>进攻
                return { space: 1.5, risk: 1, food: 0.5, item: 3, attack: 0 };
            default: // 平衡策略
                return { space: 2, risk: 2, food: 1, item: 1, attack: 0 };
        }
    }

    // 计算进攻分数（针对其他蛇头部的威胁）
    calculateAttackScore(x, y) {
        let score = 0;
        for (let snake of this.allSnakes) {
            if (!snake.alive || snake === this.snake) continue;
            
            const otherHead = snake.getHead();
            const dist = Math.abs(otherHead.x - x) + Math.abs(otherHead.y - y);
            
            // 距离其他蛇头部越近，进攻分数越高
            if (dist <= 2) {
                score += (3 - dist) * 10;
            }
        }
        return score;
    }

    // 计算从某个位置出发的可用空间（使用BFS）
    calculateSpace(startX, startY, maxDepth) {
        const visited = new Set();
        const queue = [{ x: startX, y: startY, depth: 0 }];
        visited.add(`${startX},${startY}`);
        let space = 0;
        
        while (queue.length > 0) {
            const { x, y, depth } = queue.shift();
            space++;
            
            if (depth >= maxDepth) continue;
            
            const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            for (let dir of directions) {
                const nx = x + dir.x;
                const ny = y + dir.y;
                const key = `${nx},${ny}`;
                
                if (visited.has(key)) continue;
                if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) continue;
                if (this.isOccupied(nx, ny)) continue;
                
                visited.add(key);
                queue.push({ x: nx, y: ny, depth: depth + 1 });
            }
        }
        
        return space;
    }

    // 检查某个位置是否被占用
    isOccupied(x, y) {
        for (let snake of this.allSnakes) {
            if (!snake.alive) continue;
            for (let segment of snake.body) {
                if (segment.x === x && segment.y === y) return true;
            }
        }
        return false;
    }

    // 找到最近的目标
    findNearest(x, y, targets) {
        if (targets.length === 0) return null;
        
        let nearest = targets[0];
        let minDist = Math.abs(x - nearest.x) + Math.abs(y - nearest.y);
        
        for (let i = 1; i < targets.length; i++) {
            const dist = Math.abs(x - targets[i].x) + Math.abs(y - targets[i].y);
            if (dist < minDist) {
                minDist = dist;
                nearest = targets[i];
            }
        }
        
        return nearest;
    }

    // 获取所有可能的移动方向（不撞墙不撞自己）
    getPossibleMoves(head) {
        const directions = [
            { x: 0, y: -1, name: 'up' },
            { x: 0, y: 1, name: 'down' },
            { x: -1, y: 0, name: 'left' },
            { x: 1, y: 0, name: 'right' }
        ];
        
        const possible = [];
        
        for (let dir of directions) {
            // 检查是否会180度转向
            if (this.snake.direction.x === -dir.x && this.snake.direction.y === -dir.y) {
                continue;
            }
            
            const newX = head.x + dir.x;
            const newY = head.y + dir.y;
            
            // 检查边界
            if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
                continue;
            }
            
            // 检查是否会撞到自己
            if (this.willHitSelf(newX, newY)) {
                continue;
            }
            
            // 检查是否会撞到其他蛇
            const collisionRisk = this.getCollisionRisk(newX, newY);
            
            possible.push({
                ...dir,
                risk: collisionRisk,
                x: newX,
                y: newY
            });
        }
        
        return possible;
    }

    // 检查是否会撞到自己
    willHitSelf(x, y) {
        // 排除尾部，因为尾部会移动
        for (let i = 0; i < this.snake.body.length - 1; i++) {
            if (this.snake.body[i].x === x && this.snake.body[i].y === y) {
                return true;
            }
        }
        return false;
    }

    // 获取碰撞风险等级 (0-10)
    getCollisionRisk(x, y) {
        let risk = 0;
        
        for (let snake of this.allSnakes) {
            if (!snake.alive) continue;
            
            for (let i = 0; i < snake.body.length; i++) {
                const segment = snake.body[i];
                
                // 检查是否直接碰撞
                if (segment.x === x && segment.y === y) {
                    return 10; // 必然碰撞
                }
                
                // 检查周围格子的风险
                const distance = Math.abs(segment.x - x) + Math.abs(segment.y - y);
                if (distance <= 2) {
                    risk += (3 - distance);
                }
            }
            
            // 检查其他蛇的头部移动方向（预测）
            if (snake.id !== this.snake.id && snake.alive) {
                const otherHead = snake.getHead();
                const nextX = otherHead.x + snake.direction.x;
                const nextY = otherHead.y + snake.direction.y;
                
                if (nextX === x && nextY === y) {
                    risk += 5; // 可能迎头相撞
                }
            }
        }
        
        return Math.min(risk, 10);
    }

    // 选择最佳道具（用于兼容旧代码）
    selectBestItem(head, items) {
        return this.findNearest(head.x, head.y, items);
    }

    // 选择最佳食物（用于兼容旧代码）
    selectBestFood(head, foods) {
        if (foods.length === 0) return null;
        
        let bestFood = foods[0];
        let bestScore = -Infinity;
        
        for (let food of foods) {
            const distance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
            const score = food.value * 10 - distance;
            
            if (score > bestScore) {
                bestScore = score;
                bestFood = food;
            }
        }
        
        return bestFood;
    }

    // 找到向目标移动的最佳方向（用于兼容旧代码）
    findBestMoveToTarget(head, target, possibleMoves) {
        if (possibleMoves.length === 0 || !target) return null;
        
        const movesWithDistance = possibleMoves.map(move => {
            const distance = Math.abs(move.x - target.x) + Math.abs(move.y - target.y);
            return { ...move, distance };
        });
        
        movesWithDistance.sort((a, b) => {
            const scoreA = a.distance + a.risk * 2;
            const scoreB = b.distance + b.risk * 2;
            return scoreA - scoreB;
        });
        
        const bestMove = movesWithDistance[0];
        return { x: bestMove.x - head.x, y: bestMove.y - head.y };
    }

    // 选择最安全的移动（用于兼容旧代码）
    selectSafestMove(head, possibleMoves) {
        if (possibleMoves.length === 0) return null;
        
        possibleMoves.sort((a, b) => a.risk - b.risk);
        
        const safestMove = possibleMoves[0];
        return { x: safestMove.x - head.x, y: safestMove.y - head.y };
    }

    // 获取任意可能的移动（用于紧急情况）
    getAnyMove(head) {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        
        for (let dir of directions) {
            if (this.snake.direction.x === -dir.x && this.snake.direction.y === -dir.y) {
                continue;
            }
            return dir;
        }
        
        return this.snake.direction; // 保持原方向
    }

    // 执行AI移动
    executeMove() {
        if (!this.snake.alive || !this.snake.aiEnabled) return;
        
        const nextMove = this.getNextMove();
        if (nextMove) {
            this.snake.setDirection(nextMove);
        }
    }
}

/**
 * AI管理器 - 管理所有AI控制器
 */
class AIManager {
    constructor() {
        this.controllers = new Map();
    }

    // 创建AI控制器
    createController(snake, allSnakes, foodManager) {
        const controller = new AIController(snake, allSnakes, foodManager);
        this.controllers.set(snake.id, controller);
        return controller;
    }

    // 更新所有AI
    updateAll(allSnakes, foodManager) {
        for (let [id, controller] of this.controllers) {
            controller.updateReferences(allSnakes, foodManager);
            controller.executeMove();
        }
    }

    // 更新特定AI
    update(snakeId) {
        const controller = this.controllers.get(snakeId);
        if (controller) {
            controller.executeMove();
        }
    }

    // 清除所有控制器
    clear() {
        this.controllers.clear();
    }

    // 移除特定控制器
    remove(snakeId) {
        this.controllers.delete(snakeId);
    }
}
