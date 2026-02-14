/**
 * 食物管理器
 */

class FoodManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.foods = [];
        this.maxFoods = 5; // 同时存在的最大食物数量
        this.items = []; // 道具列表（翻转续命等）
        this.itemLifetime = 3000; // 道具存在时间 3秒
        this.foodLifetime = 3000; // 食物存在时间 3秒
    }

    // 生成随机食物
    spawnFood(allSnakes) {
        if (this.foods.length >= this.maxFoods) return null;
        
        const occupiedCells = this.getOccupiedCells(allSnakes);
        const availableCells = [];
        
        // 找出所有可用格子
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (!this.isCellOccupied(x, y, occupiedCells)) {
                    availableCells.push({ x, y });
                }
            }
        }
        
        if (availableCells.length === 0) return null;
        
        // 随机选择一个位置
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        
        // 随机生成食物价值 (1-6)
        const value = Math.floor(Math.random() * 6) + 1;
        
        // 根据价值设置颜色和大小
        const food = {
            x: randomCell.x,
            y: randomCell.y,
            value: value,
            color: this.getFoodColor(value),
            glowColor: this.getFoodGlowColor(value),
            spawnTime: Date.now()
        };
        
        this.foods.push(food);
        return food;
    }

    // 获取食物颜色
    getFoodColor(value) {
        const colors = {
            1: '#ff6b6b', // 红色
            2: '#feca57', // 黄色
            3: '#48dbfb', // 蓝色
            4: '#1dd1a1', // 绿色
            5: '#5f27cd', // 紫色
            6: '#ff9ff3'  // 粉色
        };
        return colors[value] || '#ffffff';
    }

    // 获取食物发光颜色
    getFoodGlowColor(value) {
        const glowColors = {
            1: 'rgba(255, 107, 107, 0.5)',
            2: 'rgba(254, 202, 87, 0.5)',
            3: 'rgba(72, 219, 251, 0.5)',
            4: 'rgba(29, 209, 161, 0.5)',
            5: 'rgba(95, 39, 205, 0.5)',
            6: 'rgba(255, 159, 243, 0.5)'
        };
        return glowColors[value] || 'rgba(255, 255, 255, 0.5)';
    }

    // 检查格子是否被占用
    isCellOccupied(x, y, occupiedCells) {
        return occupiedCells.some(cell => cell.x === x && cell.y === y);
    }

    // 获取所有被占用的格子
    getOccupiedCells(allSnakes) {
        const cells = [];
        
        // 添加蛇占据的格子（只添加在边界内的格子）
        allSnakes.forEach(snake => {
            if (snake.alive) {
                snake.getOccupiedCells().forEach(cell => {
                    // 只添加在边界内的格子
                    if (cell.x >= 0 && cell.x < this.gridSize && 
                        cell.y >= 0 && cell.y < this.gridSize) {
                        cells.push(cell);
                    }
                });
            }
        });
        
        // 添加食物占据的格子
        this.foods.forEach(food => {
            cells.push({ x: food.x, y: food.y });
        });
        
        return cells;
    }

    // 检查蛇是否吃到食物
    checkEat(snake) {
        if (!snake.alive) return null;
        
        const head = snake.getHead();
        
        for (let i = 0; i < this.foods.length; i++) {
            const food = this.foods[i];
            if (head.x === food.x && head.y === food.y) {
                // 蛇增长
                snake.grow(food.value);
                
                // 移除被吃的食物
                this.foods.splice(i, 1);
                
                return food;
            }
        }
        
        return null;
    }

    // 获取所有食物
    getFoods() {
        return this.foods;
    }

    // 更新食物和道具（检查过期）
    update(deltaTime) {
        const now = Date.now();
        
        // 检查食物是否过期
        this.foods = this.foods.filter(food => {
            const age = now - food.spawnTime;
            return age < this.foodLifetime;
        });
        
        // 检查道具是否过期
        this.items = this.items.filter(item => {
            const age = now - item.spawnTime;
            return age < this.itemLifetime;
        });
    }

    // 获取食物的剩余时间比例 (0-1)
    getFoodTimeRatio(food) {
        const age = Date.now() - food.spawnTime;
        return Math.max(0, 1 - age / this.foodLifetime);
    }

    // 获取道具的剩余时间比例 (0-1)
    getItemTimeRatio(item) {
        const age = Date.now() - item.spawnTime;
        return Math.max(0, 1 - age / this.itemLifetime);
    }

    // 更新格子大小
    updateGridSize(newSize) {
        const scale = newSize / this.gridSize;
        this.gridSize = newSize;
        
        // 调整食物位置，确保在边界内
        this.foods = this.foods.map(food => ({
            ...food,
            x: Math.max(0, Math.min(Math.floor(food.x * scale), newSize - 1)),
            y: Math.max(0, Math.min(Math.floor(food.y * scale), newSize - 1))
        }));
        
        // 调整道具位置，确保在边界内
        this.items = this.items.map(item => ({
            ...item,
            x: Math.max(0, Math.min(Math.floor(item.x * scale), newSize - 1)),
            y: Math.max(0, Math.min(Math.floor(item.y * scale), newSize - 1))
        }));
    }

    // 重置
    reset(gridSize) {
        this.gridSize = gridSize;
        this.foods = [];
        this.items = [];
    }

    // 生成翻转续命道具
    spawnReviveItem(allSnakes) {
        // 场上最多只能有一个翻转续命道具
        const hasReviveItem = this.items.some(item => item.type === 'revive');
        if (hasReviveItem) return null;
        return this.spawnItem(allSnakes, 'revive', '翻转续命', '#ffd700', 'rgba(255, 215, 0, 0.5)');
    }

    // 生成穿透道具
    spawnPenetrateItem(allSnakes) {
        // 场上最多只能有一个穿透道具
        const hasPenetrateItem = this.items.some(item => item.type === 'penetrate');
        if (hasPenetrateItem) return null;
        return this.spawnItem(allSnakes, 'penetrate', '穿透', '#00ffff', 'rgba(0, 255, 255, 0.5)');
    }

    // 通用道具生成方法
    spawnItem(allSnakes, type, name, color, glowColor) {
        
        const occupiedCells = this.getOccupiedCells(allSnakes);
        const availableCells = [];
        
        // 找出所有可用格子
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (!this.isCellOccupied(x, y, occupiedCells)) {
                    availableCells.push({ x, y });
                }
            }
        }
        
        if (availableCells.length === 0) return null;
        
        // 随机选择一个位置
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        
        const item = {
            x: randomCell.x,
            y: randomCell.y,
            type: type,
            name: name,
            color: color,
            glowColor: glowColor,
            spawnTime: Date.now()
        };
        
        this.items.push(item);
        return item;
    }

    // 获取所有道具
    getItems() {
        return this.items;
    }

    // 检查蛇是否吃到道具
    checkEatItem(snake) {
        if (!snake.alive) return null;
        
        const head = snake.getHead();
        
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (head.x === item.x && head.y === item.y) {
                // 应用道具效果
                if (item.type === 'revive') {
                    snake.reviveCount++;
                } else if (item.type === 'penetrate') {
                    snake.penetrateCount++;
                }
                
                // 移除被吃的道具
                this.items.splice(i, 1);
                
                return item;
            }
        }
        
        return null;
    }

    // 获取最近的食物
    getNearestFood(x, y) {
        if (this.foods.length === 0) return null;
        
        let nearest = this.foods[0];
        let minDistance = this.getDistance(x, y, nearest.x, nearest.y);
        
        for (let i = 1; i < this.foods.length; i++) {
            const food = this.foods[i];
            const distance = this.getDistance(x, y, food.x, food.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = food;
            }
        }
        
        return nearest;
    }

    // 计算距离
    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2); // 曼哈顿距离
    }
}
