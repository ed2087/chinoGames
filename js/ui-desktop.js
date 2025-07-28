// Desktop RTS-style interface

class DesktopUI {
    constructor(engine, world, ecosystem, godPowers) {
        this.engine = engine;
        this.world = world;
        this.ecosystem = ecosystem;
        this.godPowers = godPowers;
        
        this.panels = {};
        this.isVisible = true;
        this.selectedCreature = null;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'desktop-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: white;
        `;
        document.body.appendChild(this.container);
        
        this.createStatsPanel();
        this.createGodPanel();
        this.createInfoPanel();
        this.createControlPanel();
    }
    
    createStatsPanel() {
        this.panels.stats = document.createElement('div');
        this.panels.stats.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            pointer-events: auto;
            min-width: 200px;
        `;
        
        this.panels.stats.innerHTML = `
            <h3>🌍 Ecosystem Stats</h3>
            <div id="population-stats"></div>
            <div id="species-breakdown"></div>
            <div id="environment-info"></div>
        `;
        
        this.container.appendChild(this.panels.stats);
    }
    
    createGodPanel() {
        this.panels.god = document.createElement('div');
        this.panels.god.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(50, 20, 80, 0.9);
            padding: 15px;
            border-radius: 8px;
            pointer-events: auto;
            min-width: 250px;
            border: 2px solid gold;
        `;
        
        this.panels.god.innerHTML = `
            <h3>⚡ God Powers</h3>
            <div style="margin-bottom: 10px;">
                <button id="god-mode-toggle">Toggle God Mode (G)</button>
            </div>
            <div id="power-buttons"></div>
            <div id="time-controls" style="margin-top: 15px;">
                <h4>Time Control</h4>
                <button id="time-btn-0.5">0.5x</button>
                <button id="time-btn-0.75">0.75x</button>
                <button id="time-btn-1.33">1.33x</button>
                <button id="time-btn-2">2x</button>
                <div id="time-scale-display">Time Scale: 1x</div>
            </div>
        `;
        
        this.container.appendChild(this.panels.god);
        
        // Create power buttons after DOM is ready
        setTimeout(() => {
            this.createPowerButtons();
            this.setupGodPanelEvents();
        }, 0);
    }
    
    createPowerButtons() {
        const powerContainer = document.getElementById('power-buttons');
        if (!powerContainer) {
            console.error('Power buttons container not found');
            return;
        }
        
        const powers = [
            { name: 'spawn', icon: '🦠', desc: 'Spawn Creature', key: '1' },
            { name: 'resources', icon: '🌿', desc: 'Create Resources', key: '2' },
            { name: 'weather', icon: '🌦️', desc: 'Change Weather', key: '3' },
            { name: 'disaster', icon: '💥', desc: 'Create Disaster', key: '4' },
            { name: 'evolution', icon: '🧬', desc: 'Trigger Evolution', key: '5' },
            { name: 'terraform', icon: '🏔️', desc: 'Terraform', key: '7' }
        ];
        
        powers.forEach(power => {
            const button = document.createElement('button');
            button.id = `power-${power.name}`;
            button.innerHTML = `${power.icon} ${power.desc} (${power.key})`;
            button.style.cssText = `
                display: block;
                width: 100%;
                margin: 3px 0;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 3px;
                cursor: pointer;
            `;
            
            button.addEventListener('click', () => {
                this.godPowers.selectPower(power.name);
                this.updatePowerButtons();
            });
            
            powerContainer.appendChild(button);
        });
    }
    
    setupGodPanelEvents() {
        const toggleButton = document.getElementById('god-mode-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.godPowers.toggleGodMode();
            });
        }
    }
    
    createInfoPanel() {
        this.panels.info = document.createElement('div');
        this.panels.info.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            pointer-events: auto;
            min-width: 300px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        this.panels.info.innerHTML = `
            <h3>📊 Selected Creature</h3>
            <div id="creature-details">Click on a creature to see details</div>
        `;
        
        this.container.appendChild(this.panels.info);
    }
    
    createControlPanel() {
        this.panels.controls = document.createElement('div');
        this.panels.controls.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            pointer-events: auto;
        `;
        
        this.panels.controls.innerHTML = `
            <h3>🎮 Controls</h3>
            <div style="font-size: 11px; line-height: 1.4;">
                <strong>Camera:</strong><br>
                • Middle Mouse: Pan<br>
                • Scroll: Zoom<br><br>
                <strong>God Powers:</strong><br>
                • G: Toggle God Mode<br>
                • 1-7: Select Power<br>
                • Left Click: Use Power<br>
                • +/-: Time Scale<br><br>
                <strong>Info:</strong><br>
                • Click creature for details<br>
                • R: Toggle UI visibility
            </div>
        `;
        
        this.container.appendChild(this.panels.controls);
    }
    
    setupEventListeners() {
        // Creature selection
        document.addEventListener('engine-mousedown', (e) => {
            if (e.detail.button === 0 && !this.godPowers.isActive) {
                this.selectCreatureAt(e.detail.world);
            }
        });
        
        // God mode toggle events
        document.addEventListener('god-mode-toggle', (e) => {
            this.updateGodModeUI(e.detail.active);
        });
        
        // Time scale changes
        document.addEventListener('time-scale-change', (e) => {
            this.updateTimeScaleDisplay(e.detail.scale);
        });
        
        // Keyboard shortcuts
        document.addEventListener('engine-keydown', (e) => {
            if (e.detail.key.toLowerCase() === 'r') {
                this.toggleVisibility();
            }
        });
        
        // Debug mode
        document.addEventListener('engine-keydown', (e) => {
            if (e.detail.key.toLowerCase() === 'd') {
                window.DEBUG_MODE = !window.DEBUG_MODE;
            }
        });
    }
    
    selectCreatureAt(worldPos) {
        let closest = null;
        let closestDistance = Infinity;
        
        this.ecosystem.creatures.forEach(creature => {
            if (creature.isDead) return;
            
            const distance = worldPos.distance(creature.position);
            if (distance <= creature.size && distance < closestDistance) {
                closest = creature;
                closestDistance = distance;
            }
        });
        
        this.selectedCreature = closest;
        this.updateCreatureDetails();
    }
    
    updateCreatureDetails() {
        const detailsDiv = document.getElementById('creature-details');
        if (!detailsDiv) return;
        
        if (!this.selectedCreature || this.selectedCreature.isDead) {
            detailsDiv.innerHTML = 'No creature selected or creature died';
            this.selectedCreature = null;
            return;
        }
        
        const c = this.selectedCreature;
        const healthPercent = ((c.health / c.maxHealth) * 100).toFixed(1);
        const energyPercent = ((c.energy / c.maxEnergy) * 100).toFixed(1);
        
        detailsDiv.innerHTML = `
            <strong>Species:</strong> ${c.species}<br>
            <strong>Age:</strong> ${c.age.toFixed(1)}s / ${c.lifespan.toFixed(1)}s<br>
            <strong>Health:</strong> ${healthPercent}% (${c.health.toFixed(1)}/${c.maxHealth.toFixed(1)})<br>
            <strong>Energy:</strong> ${energyPercent}% (${c.energy.toFixed(1)}/${c.maxEnergy.toFixed(1)})<br>
            <strong>Size:</strong> ${c.size.toFixed(1)}<br>
            <strong>Speed:</strong> ${c.maxSpeed.toFixed(1)}<br>
            <strong>Vision:</strong> ${c.visionRange.toFixed(1)}<br>
            <strong>Aggression:</strong> ${(c.aggression * 100).toFixed(1)}%<br>
            <strong>Social:</strong> ${(c.social * 100).toFixed(1)}%<br>
            <strong>Intelligence:</strong> ${(c.intelligence * 100).toFixed(1)}%<br>
            <strong>Position:</strong> (${c.position.x.toFixed(1)}, ${c.position.y.toFixed(1)})<br>
            <strong>Memory:</strong> ${c.memory.length}/${c.maxMemorySize}
        `;
    }
    
    updateGodModeUI(active) {
        const button = document.getElementById('god-mode-toggle');
        if (button) {
            if (active) {
                button.textContent = '⚡ God Mode ON (G)';
                button.style.background = 'rgba(255, 215, 0, 0.3)';
                this.panels.god.style.borderColor = '#FFD700';
            } else {
                button.textContent = 'Toggle God Mode (G)';
                button.style.background = 'rgba(255, 255, 255, 0.1)';
                this.panels.god.style.borderColor = 'gold';
            }
        }
        
        this.updatePowerButtons();
    }
    
    updatePowerButtons() {
        const status = this.godPowers.getPowerStatus();
        
        ['spawn', 'resources', 'weather', 'disaster', 'evolution', 'terraform'].forEach(powerName => {
            const button = document.getElementById(`power-${powerName}`);
            if (!button) return;
            
            const isSelected = status.selectedPower === powerName;
            const isOnCooldown = status.cooldowns[powerName] > 0;
            
            if (!status.isActive) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else if (isOnCooldown) {
                button.style.opacity = '0.6';
                button.style.background = 'rgba(255, 0, 0, 0.2)';
                button.style.cursor = 'not-allowed';
            } else if (isSelected) {
                button.style.opacity = '1';
                button.style.background = 'rgba(255, 215, 0, 0.3)';
                button.style.cursor = 'pointer';
            } else {
                button.style.opacity = '1';
                button.style.background = 'rgba(255, 255, 255, 0.1)';
                button.style.cursor = 'pointer';
            }
        });
    }
    
    updateTimeScaleDisplay(scale) {
        const display = document.getElementById('time-scale-display');
        if (display) {
            display.textContent = `Time Scale: ${scale.toFixed(2)}x`;
        }
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    
    update(deltaTime) {
        if (!this.isVisible) return;
        
        this.updateStats();
        this.updatePowerButtons();
        this.updateCreatureDetails();
    }
    
    updateStats() {
        const stats = this.ecosystem.statistics;
        const speciesCount = this.ecosystem.getSpeciesCount();
        
        // Population stats
        const popDiv = document.getElementById('population-stats');
        if (popDiv) {
            const trend = stats.getPopulationTrend();
            const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
            
            popDiv.innerHTML = `
                <strong>Total Population:</strong> ${stats.totalCreatures} ${trendIcon}<br>
                <strong>Average Age:</strong> ${stats.averageAge.toFixed(1)}s<br>
                <strong>Average Size:</strong> ${stats.averageSize.toFixed(1)}
            `;
        }
        
        // Species breakdown
        const speciesDiv = document.getElementById('species-breakdown');
        if (speciesDiv) {
            let breakdown = '<strong>Species:</strong><br>';
            Object.entries(speciesCount).forEach(([species, count]) => {
                const icon = species === 'carnivore' ? '🦖' : species === 'herbivore' ? '🐑' : '🐺';
                breakdown += `${icon} ${species}: ${count}<br>`;
            });
            speciesDiv.innerHTML = breakdown;
        }
        
        // Environment info
        const envDiv = document.getElementById('environment-info');
        if (envDiv) {
            envDiv.innerHTML = `
                <strong>Environment:</strong><br>
                🌡️ Temperature: ${this.world.environment.temperature.toFixed(1)}°C<br>
                💧 Humidity: ${(this.world.environment.humidity * 100).toFixed(1)}%<br>
                🌪️ Wind: ${this.world.environment.windSpeed.toFixed(1)} m/s<br>
                🍃 Resources: ${this.world.resources.length}
            `;
        }
    }
    
    render(ctx) {
        // Highlight selected creature
        if (this.selectedCreature && !this.selectedCreature.isDead) {
            ctx.save();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.selectedCreature.position.x,
                this.selectedCreature.position.y,
                this.selectedCreature.size + 5,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}