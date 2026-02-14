/**
 * 音效管理器 - 使用 Web Audio API 生成音效
 */

var AudioManager = {
    context: null,
    enabled: true,
    
    // 初始化音频上下文
    init: function() {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.context = new AudioContext();
            } else {
                console.warn('Web Audio API 不支持');
                this.enabled = false;
            }
        } catch (e) {
            console.warn('Web Audio API 不支持');
            this.enabled = false;
        }
    },

    // 确保音频上下文已启动
    ensureContext: function() {
        if (!this.context) {
            this.init();
        }
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    // 播放音效开关
    setEnabled: function(enabled) {
        this.enabled = enabled;
    },

    // 播放移动音效
    playMove: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var oscillator = this.context.createOscillator();
        var gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = 150;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.05);
    },

    // 播放吃食物音效
    playEat: function(value) {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var oscillator = this.context.createOscillator();
        var gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // 根据食物价值调整音调
        var baseFreq = 400 + (value * 50);
        oscillator.frequency.setValueAtTime(baseFreq, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.context.currentTime + 0.1);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.15);
    },

    // 播放死亡音效（马里奥死亡风格）
    playDie: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var self = this;
        var notes = [440, 415, 392, 370, 349, 330, 311, 294]; // 下降音阶
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                var oscillator = self.context.createOscillator();
                var gainNode = self.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(self.context.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.15, self.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, self.context.currentTime + 0.1);
                
                oscillator.start(self.context.currentTime);
                oscillator.stop(self.context.currentTime + 0.1);
            }, index * 80);
        });
    },

    // 播放穿透道具音效（马里奥加命风格）
    playPenetrate: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var self = this;
        // 马里奥加命音效：上行的欢快音阶
        var notes = [523, 659, 783, 1046, 1318]; // C5, E5, G5, C6, E6
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                var oscillator = self.context.createOscillator();
                var gainNode = self.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(self.context.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.15, self.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, self.context.currentTime + 0.15);
                
                oscillator.start(self.context.currentTime);
                oscillator.stop(self.context.currentTime + 0.15);
            }, index * 60);
        });
    },

    // 播放游戏开始音效
    playStart: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
        var self = this;
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                var oscillator = self.context.createOscillator();
                var gainNode = self.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(self.context.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, self.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, self.context.currentTime + 0.2);
                
                oscillator.start(self.context.currentTime);
                oscillator.stop(self.context.currentTime + 0.2);
            }, index * 100);
        });
    },

    // 播放升级音效
    playUpgrade: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var notes = [523, 659, 783, 1046]; // C5, E5, G5, C6
        var self = this;
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                var oscillator = self.context.createOscillator();
                var gainNode = self.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(self.context.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'triangle';
                
                gainNode.gain.setValueAtTime(0.15, self.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, self.context.currentTime + 0.3);
                
                oscillator.start(self.context.currentTime);
                oscillator.stop(self.context.currentTime + 0.3);
            }, index * 80);
        });
    },

    // 播放胜利音效
    playWin: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var notes = [523, 659, 783, 1046, 1318]; // C5, E5, G5, C6, E6
        var self = this;
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                var oscillator = self.context.createOscillator();
                var gainNode = self.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(self.context.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.15, self.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, self.context.currentTime + 0.4);
                
                oscillator.start(self.context.currentTime);
                oscillator.stop(self.context.currentTime + 0.4);
            }, index * 120);
        });
    },

    // 播放暂停音效
    playPause: function() {
        if (!this.enabled || !this.context) return;
        this.ensureContext();
        
        var oscillator = this.context.createOscillator();
        var gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = 300;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }
};

// 初始化
AudioManager.init();
