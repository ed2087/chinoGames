/* ============================================
   SCORING-SYSTEM.JS - Points, Combos, Life
   Purpose: Manages scoring, combos, multipliers, life bar
   ============================================ */

class ScoringSystem {
    constructor() {
        // Score
        this.score = 0;
        this.goal = 10000;
        
        // Life
        this.life = 100; // 0-100%
        this.maxLife = 100;
        this.lifeDrainRate = 0.5; // Life lost per second
        this.lifeDrainInterval = null;
        
        // Combo
        this.combo = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        
        // Statistics
        this.correctPops = 0;
        this.wrongPops = 0;
        this.totalPops = 0;
        this.startTime = null;
        this.endTime = null;
        
        // Points
        this.basePoints = 100;
        this.wrongPenalty = 50;
        this.lifeGainCorrect = 5;
        this.lifeLossWrong = 10;
        
        // Callbacks
        this.onScoreChange = null;
        this.onLifeChange = null;
        this.onComboChange = null;
        this.onGoalReached = null;
        this.onLifeZero = null;
    }
    
    /* ============================================
       GAME CONTROL
       ============================================ */
    
    startGame() {
        console.log('🎮 Starting scoring system...');
        
        // Reset all values
        this.score = 0;
        this.life = 100;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.correctPops = 0;
        this.wrongPops = 0;
        this.totalPops = 0;
        this.startTime = Date.now();
        this.endTime = null;
        
        // Update UI
        this.updateScore();
        this.updateLife();
        this.updateCombo();
        
        // Start life drain
        this.startLifeDrain();
    }
    
    endGame() {
        console.log('🏁 Ending scoring system...');
        
        this.endTime = Date.now();
        this.stopLifeDrain();
    }
    
    /* ============================================
       LIFE MANAGEMENT
       ============================================ */
    
    startLifeDrain() {
        // Drain life slowly over time
        this.lifeDrainInterval = setInterval(() => {
            this.life -= this.lifeDrainRate;
            
            if (this.life <= 0) {
                this.life = 0;
                this.stopLifeDrain();
                
                if (this.onLifeZero) {
                    this.onLifeZero();
                }
            }
            
            this.updateLife();
        }, 1000); // Every second
    }
    
    stopLifeDrain() {
        if (this.lifeDrainInterval) {
            clearInterval(this.lifeDrainInterval);
            this.lifeDrainInterval = null;
        }
    }
    
    gainLife(amount) {
        this.life = Math.min(this.life + amount, this.maxLife);
        this.updateLife();
    }
    
    loseLife(amount) {
        this.life = Math.max(this.life - amount, 0);
        this.updateLife();
        
        if (this.life <= 0) {
            this.stopLifeDrain();
            
            if (this.onLifeZero) {
                this.onLifeZero();
            }
        }
    }
    
    /* ============================================
       SCORING
       ============================================ */
    
    addCorrectPop() {
        this.correctPops++;
        this.totalPops++;
        
        // Increase combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Calculate multiplier based on combo
        this.comboMultiplier = this.getMultiplier();
        
        // Calculate points
        let points = this.basePoints * this.comboMultiplier;
        
        // Bonus points for streaks
        if (this.combo === 5) {
            points += 200; // 5 streak bonus
        } else if (this.combo === 10) {
            points += 500; // 10 streak bonus
        } else if (this.combo === 20) {
            points += 1000; // 20 streak bonus
        }
        
        // Add to score
        this.score += Math.round(points);
        
        // Gain life
        this.gainLife(this.lifeGainCorrect);
        
        // Update UI
        this.updateScore();
        this.updateCombo();
        
        // Check if goal reached
        if (this.score >= this.goal && this.onGoalReached) {
            this.onGoalReached();
        }
        
        console.log(`✅ Correct! +${Math.round(points)} points (x${this.comboMultiplier})`);
        
        return {
            points: Math.round(points),
            combo: this.combo,
            multiplier: this.comboMultiplier,
            bonus: this.combo === 5 || this.combo === 10 || this.combo === 20
        };
    }
    
    addWrongPop() {
        this.wrongPops++;
        this.totalPops++;
        
        // Reset combo
        this.combo = 0;
        this.comboMultiplier = 1;
        
        // Lose points
        this.score = Math.max(0, this.score - this.wrongPenalty);
        
        // Lose life
        this.loseLife(this.lifeLossWrong);
        
        // Update UI
        this.updateScore();
        this.updateCombo();
        
        console.log(`❌ Wrong! -${this.wrongPenalty} points, -${this.lifeLossWrong}% life`);
        
        return {
            penalty: this.wrongPenalty,
            lifeLoss: this.lifeLossWrong
        };
    }
    
    getMultiplier() {
        // Calculate multiplier based on combo
        if (this.combo < 2) return 1;
        if (this.combo < 5) return 2;
        if (this.combo < 10) return 3;
        if (this.combo < 20) return 5;
        return 10; // Max multiplier
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    updateScore() {
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }
    
    updateLife() {
        if (this.onLifeChange) {
            this.onLifeChange(this.life);
        }
    }
    
    updateCombo() {
        if (this.onComboChange) {
            this.onComboChange(this.combo, this.comboMultiplier);
        }
    }
    
    /* ============================================
       STATISTICS
       ============================================ */
    
    getAccuracy() {
        if (this.totalPops === 0) return 0;
        return Math.round((this.correctPops / this.totalPops) * 100);
    }
    
    getPlayTime() {
        if (!this.startTime) return 0;
        const endTime = this.endTime || Date.now();
        return Math.floor((endTime - this.startTime) / 1000); // Seconds
    }
    
    getPlayTimeFormatted() {
        const seconds = this.getPlayTime();
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    getStats() {
        return {
            score: this.score,
            goal: this.goal,
            correctPops: this.correctPops,
            wrongPops: this.wrongPops,
            totalPops: this.totalPops,
            accuracy: this.getAccuracy(),
            maxCombo: this.maxCombo,
            playTime: this.getPlayTime(),
            playTimeFormatted: this.getPlayTimeFormatted()
        };
    }
    
    /* ============================================
       BONUSES & SPECIAL EVENTS
       ============================================ */
    
    getComboMessage() {
        if (this.combo === 3) return "Nice!";
        if (this.combo === 5) return "Great!";
        if (this.combo === 10) return "Amazing!";
        if (this.combo === 15) return "Incredible!";
        if (this.combo === 20) return "UNSTOPPABLE!";
        return null;
    }
    
    shouldShowBonus() {
        // Show bonus message on certain milestones
        return this.combo === 5 || this.combo === 10 || this.combo === 20;
    }
    
    getBonusAmount() {
        if (this.combo === 5) return 200;
        if (this.combo === 10) return 500;
        if (this.combo === 20) return 1000;
        return 0;
    }
    
    /* ============================================
       DIFFICULTY ADJUSTMENT
       ============================================ */
    
    adjustDifficulty() {
        // Increase difficulty as score increases
        if (this.score >= 5000) {
            this.lifeDrainRate = 0.8; // Faster drain
        } else if (this.score >= 2500) {
            this.lifeDrainRate = 0.65;
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        this.stopLifeDrain();
        console.log('🧹 Scoring system destroyed');
    }
}