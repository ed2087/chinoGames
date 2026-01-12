// ==========================================
// ADAPTIVE DIFFICULTY FOR FREE-FORM DRAWING
// ==========================================

class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 15;
        this.currentAnimalIndex = 0;
        this.sessionStats = {
            pathsCompleted: 0,
            pathsFailed: 0,
            totalDrawingTime: 0,
            averageAccuracy: 0,
            sessionStartTime: Date.now()
        };
        
        // Animal rotation
        this.animals = ['penguin', 'teddy', 'ducky'];
        
        // Performance tracking
        this.recentPerformance = [];
        this.maxPerformanceHistory = 5;
        
        // Success/failure streaks
        this.currentStreak = 0;
        this.streakType = null;
        
        // Difficulty settings for obstacle-based gameplay
        this.adaptiveSettings = {
            numObstacles: 2,
            obstacleSize: 'medium',
            canvasComplexity: 1,
            encouragementLevel: 'high'
        };
        
        this.loadProgress();
    }
    
    generateLevel() {
        const animal = this.getCurrentAnimal();
        const difficulty = this.calculateDifficulty();
        
        return {
            levelNumber: this.currentLevel,
            animalType: animal,
            difficulty: difficulty,
            settings: { ...this.adaptiveSettings },
            stats: { ...this.sessionStats }
        };
    }
    
    getCurrentAnimal() {
        return this.animals[this.currentAnimalIndex];
    }
    
    nextAnimal() {
        this.currentAnimalIndex = (this.currentAnimalIndex + 1) % this.animals.length;
        return this.getCurrentAnimal();
    }
    
    // Obstacle-focused difficulty calculation
    calculateDifficulty() {
        let baseDifficulty = Math.min(Math.floor(this.currentLevel / 3) + 1, 5);
        
        // Adjust based on recent performance
        const recentSuccess = this.getRecentSuccessRate();
        
        if (recentSuccess > 0.8) {
            // Child doing well - increase obstacles
            baseDifficulty = Math.min(baseDifficulty + 1, 5);
            this.adaptiveSettings.numObstacles = Math.min(this.adaptiveSettings.numObstacles + 1, 6);
        } else if (recentSuccess < 0.4) {
            // Child struggling - reduce obstacles
            baseDifficulty = Math.max(baseDifficulty - 1, 1);
            this.adaptiveSettings.numObstacles = Math.max(this.adaptiveSettings.numObstacles - 1, 1);
        }
        
        // Update obstacle complexity
        this.updateObstacleSettings(baseDifficulty);
        
        return baseDifficulty;
    }
    
    updateObstacleSettings(difficulty) {
        switch (difficulty) {
            case 1:
                this.adaptiveSettings.numObstacles = 1;
                this.adaptiveSettings.obstacleSize = 'small';
                break;
            case 2:
                this.adaptiveSettings.numObstacles = 2;
                this.adaptiveSettings.obstacleSize = 'small';
                break;
            case 3:
                this.adaptiveSettings.numObstacles = 3;
                this.adaptiveSettings.obstacleSize = 'medium';
                break;
            case 4:
                this.adaptiveSettings.numObstacles = 4;
                this.adaptiveSettings.obstacleSize = 'medium';
                break;
            default:
                this.adaptiveSettings.numObstacles = Math.min(5 + (difficulty - 5), 8);
                this.adaptiveSettings.obstacleSize = 'large';
                break;
        }
    }
    
    getRecentSuccessRate() {
        if (this.recentPerformance.length === 0) return 0.5;
        
        const successes = this.recentPerformance.filter(p => p.success).length;
        return successes / this.recentPerformance.length;
    }
    
    onPathCompleted(pathData) {
        const performance = this.analyzePerformance(pathData, true);
        
        // Update session stats
        this.sessionStats.pathsCompleted++;
        this.sessionStats.totalDrawingTime += performance.drawingTime;
        this.sessionStats.averageAccuracy = this.updateAverageAccuracy(performance.accuracy);
        
        // Track performance
        this.recentPerformance.push({
            success: true,
            accuracy: performance.accuracy,
            time: performance.drawingTime,
            difficulty: this.adaptiveSettings.numObstacles,
            timestamp: Date.now()
        });
        
        // Update streak
        this.updateStreak(true);
        
        // Clean old data
        this.cleanPerformanceHistory();
        
        // Advance level
        this.advanceLevel();
        
        return {
            levelComplete: true,
            performance: performance,
            nextLevel: this.generateLevel(),
            encouragement: this.generateEncouragement(performance, true)
        };
    }
    
    onPathFailed(pathData) {
        const performance = this.analyzePerformance(pathData, false);
        
        // Update session stats
        this.sessionStats.pathsFailed++;
        
        // Track failure
        this.recentPerformance.push({
            success: false,
            accuracy: performance.accuracy,
            time: performance.drawingTime,
            difficulty: this.adaptiveSettings.numObstacles,
            timestamp: Date.now()
        });
        
        // Update streak
        this.updateStreak(false);
        
        // Adapt to make easier
        this.adaptToFailure();
        
        this.cleanPerformanceHistory();
        
        return {
            levelComplete: false,
            performance: performance,
            retry: true,
            encouragement: this.generateEncouragement(performance, false)
        };
    }
    
    analyzePerformance(pathData, success) {
        if (!pathData || pathData.length === 0) {
            return {
                accuracy: success ? 0.8 : 0.2,
                drawingTime: 0,
                pathLength: 0,
                efficiency: 0.5
            };
        }
        
        const startTime = pathData[0].timestamp;
        const endTime = pathData[pathData.length - 1].timestamp;
        const drawingTime = (endTime - startTime) / 1000;
        
        // Calculate path length
        let totalDistance = 0;
        for (let i = 1; i < pathData.length; i++) {
            const dx = pathData[i].x - pathData[i - 1].x;
            const dy = pathData[i].y - pathData[i - 1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        
        // Simple efficiency based on path length vs direct distance
        const directDistance = pathData.length > 1 ? 
            Math.sqrt(
                Math.pow(pathData[pathData.length - 1].x - pathData[0].x, 2) +
                Math.pow(pathData[pathData.length - 1].y - pathData[0].y, 2)
            ) : 100;
        
        const efficiency = Math.min(directDistance / totalDistance, 1.0) || 0.5;
        
        return {
            accuracy: success ? 0.9 : 0.3,
            drawingTime: drawingTime,
            pathLength: totalDistance,
            efficiency: efficiency,
            points: pathData.length
        };
    }
    
    updateStreak(success) {
        if (this.streakType === null || (this.streakType === 'success') === success) {
            this.currentStreak++;
            this.streakType = success ? 'success' : 'failure';
        } else {
            this.currentStreak = 1;
            this.streakType = success ? 'success' : 'failure';
        }
    }
    
    adaptToFailure() {
        // Make things easier after failure
        this.adaptiveSettings.numObstacles = Math.max(1, this.adaptiveSettings.numObstacles - 1);
        this.adaptiveSettings.obstacleSize = 'small';
        this.adaptiveSettings.encouragementLevel = 'high';
        
        // Multiple failures - make even easier
        if (this.streakType === 'failure' && this.currentStreak >= 3) {
            this.adaptiveSettings.numObstacles = 1;
        }
    }
    
    generateEncouragement(performance, success = true) {
        const messages = {
            excellent: [
                "Amazing! You found a perfect path!",
                "Wonderful! Your animal friend is so happy!",
                "Incredible! You're getting really good at this!"
            ],
            good: [
                "Great job! That was a nice path!",
                "Well done! You helped your friend get home!",
                "Fantastic! Keep up the good work!"
            ],
            okay: [
                "Good try! You're learning so much!",
                "Nice work! Drawing paths is tricky!",
                "You did it! Practice makes perfect!"
            ],
            struggled: [
                "Good try! Let's try again together!",
                "You're doing great! Keep practicing!",
                "That was a good start! Try once more!"
            ]
        };
        
        let category;
        if (!success) {
            category = 'struggled';
        } else if (performance.efficiency > 0.8 && performance.drawingTime < 15) {
            category = 'excellent';
        } else if (performance.efficiency > 0.6) {
            category = 'good';
        } else {
            category = 'okay';
        }
        
        const categoryMessages = messages[category];
        return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    }
    
    advanceLevel() {
        this.currentLevel++;
        this.nextAnimal();
    }
    
    cleanPerformanceHistory() {
        if (this.recentPerformance.length > this.maxPerformanceHistory) {
            this.recentPerformance = this.recentPerformance.slice(-this.maxPerformanceHistory);
        }
    }
    
    updateAverageAccuracy(newAccuracy) {
        const totalPaths = this.sessionStats.pathsCompleted;
        const currentAvg = this.sessionStats.averageAccuracy;
        
        if (totalPaths === 1) return newAccuracy;
        return ((currentAvg * (totalPaths - 1)) + newAccuracy) / totalPaths;
    }
    
    // Progress persistence
    saveProgress() {
        const progressData = {
            currentLevel: this.currentLevel,
            sessionStats: this.sessionStats,
            adaptiveSettings: this.adaptiveSettings,
            lastPlayed: Date.now()
        };
        
        try {
            localStorage.setItem('pathHome_progress', JSON.stringify(progressData));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('pathHome_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentLevel = data.currentLevel || 1;
                this.adaptiveSettings = { ...this.adaptiveSettings, ...data.adaptiveSettings };
                
                console.log('Loaded progress: Level', this.currentLevel);
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
        }
    }
    
    getSessionSummary() {
        const sessionTime = (Date.now() - this.sessionStats.sessionStartTime) / 1000 / 60;
        
        return {
            timePlayedMinutes: Math.round(sessionTime * 10) / 10,
            pathsCompleted: this.sessionStats.pathsCompleted,
            pathsFailed: this.sessionStats.pathsFailed,
            successRate: this.sessionStats.pathsCompleted / (this.sessionStats.pathsCompleted + this.sessionStats.pathsFailed) || 0,
            averageAccuracy: Math.round(this.sessionStats.averageAccuracy * 100),
            currentLevel: this.currentLevel,
            currentStreak: this.currentStreak,
            streakType: this.streakType
        };
    }
    
    resetSession() {
        this.sessionStats = {
            pathsCompleted: 0,
            pathsFailed: 0,
            totalDrawingTime: 0,
            averageAccuracy: 0,
            sessionStartTime: Date.now()
        };
        this.recentPerformance = [];
        this.currentStreak = 0;
        this.streakType = null;
    }
}