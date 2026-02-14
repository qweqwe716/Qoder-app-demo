/**
 * 游戏入口
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    UI.init();
    
    // 创建游戏实例
    window.game = new Game();
    
    // 初始化音效按钮状态
    const config = GameConfig.get();
    const soundBtn = document.getElementById('btn-sound');
    if (!config.soundEnabled) {
        soundBtn.textContent = '🔇';
        soundBtn.classList.add('muted');
        AudioManager.setEnabled(false);
    }
    
    console.log('贪吃蛇游戏已加载完成！');
    console.log('按"开始游戏"按钮开始，或使用空格键暂停，P键切换AI模式');
});
