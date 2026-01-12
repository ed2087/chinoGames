// Mobile touch-optimized interface 
// Mobile touch-optimized interface

class MobileUI {
    constructor(engine, world, ecosystem, godPowers) {
        this.engine = engine;
        this.world = world;
        this.ecosystem = ecosystem;
        this.godPowers = godPowers;
        
        this.isDrawerOpen = false;
        this.selectedCreature = null;
        this.lastTap = 0;
        
        this.createUI();
        this.setupEventListeners();
        this.setupGestures();
    }
    
    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'mobile-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: white;
        `;
        document.body.appendChild(this.container);
        
        this.createTopBar();
        this.createFloatingButton();
        this.createBottomDrawer();
        this.createInfoModal();
    }
    
    createTopBar() {
        this.topBar = document.createElement('div');
        this.topBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
            padding: 10px 15px;
            pointer-events: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        this.topBar.innerHTML = `
            <div id="mobile-stats" style="flex: 1;">
                <div style="font-size: 12px; opacity: 0.8;">Population: <span id="pop-count">0</span></div>
            </div>
            <div id="god-mode-indicator" style="
                padding: 5px 10px; 
                border-radius: 15px; 
                background: rgba(255,215,0,0.2);
                border: 1px solid gold;
                font-size: 12px;
                display: none;
            ">⚡ GOD MODE</div>
            <div>
                <button id="mobile-menu-btn" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 16px;
                ">☰</button>
            </div>
        `;
        
        this.container.appendChild(this.topBar);
        
        // Menu button handler
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            this.toggleDrawer();
        });
    }
    
    createFloatingButton() {
        this.fab = document.createElement('button');
        this.fab.id = 'god-mode-fab';
        this.fab.innerHTML = '⚡';
        this.fab.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
background: linear-gradient(45deg, #6a0dad, #9932cc);
           border: 3px solid gold;
           color: white;
           font-size: 24px;
           box-shadow: 0 4px 15px rgba(0,0,0,0.3);
           pointer-events: auto;
           cursor: pointer;
           transition: all 0.3s ease;
           z-index: 15;
       `;
       
       this.fab.addEventListener('click', () => {
           this.godPowers.toggleGodMode();
           navigator.vibrate && navigator.vibrate(50);
       });
       
       this.container.appendChild(this.fab);
   }
   
   createBottomDrawer() {
       this.drawer = document.createElement('div');
       this.drawer.id = 'bottom-drawer';
       this.drawer.style.cssText = `
           position: absolute;
           bottom: -400px;
           left: 0;
           right: 0;
           height: 450px;
           background: linear-gradient(to top, rgba(20,20,40,0.95), rgba(40,20,60,0.9));
           border-top-left-radius: 20px;
           border-top-right-radius: 20px;
           padding: 20px;
           pointer-events: auto;
           transition: bottom 0.3s ease;
           overflow-y: auto;
           border-top: 2px solid gold;
       `;
       
       this.drawer.innerHTML = `
           <div style="text-align: center; margin-bottom: 10px;">
               <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;"></div>
           </div>
           
           <h3 style="margin: 0 0 15px 0; text-align: center;">⚡ God Powers</h3>
           
           <div id="mobile-power-grid" style="
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 10px;
               margin-bottom: 20px;
           "></div>
           
           <div id="mobile-time-controls" style="margin-bottom: 20px;">
               <h4 style="margin: 0 0 10px 0;">⏰ Time Control</h4>
               <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                   <button onclick="planetSimulator.godPowers.adjustTimeScale(0.5)" class="time-btn">0.5x</button>
                   <button onclick="planetSimulator.godPowers.adjustTimeScale(0.75)" class="time-btn">0.75x</button>
                   <button onclick="planetSimulator.godPowers.adjustTimeScale(1.33)" class="time-btn">1.33x</button>
                   <button onclick="planetSimulator.godPowers.adjustTimeScale(2)" class="time-btn">2x</button>
               </div>
               <div id="mobile-time-display" style="margin-top: 8px; font-size: 12px; opacity: 0.8;">Time Scale: 1x</div>
           </div>
           
           <div id="mobile-ecosystem-stats">
               <h4 style="margin: 0 0 10px 0;">📊 Ecosystem Stats</h4>
               <div id="mobile-species-info" style="font-size: 12px; line-height: 1.4;"></div>
           </div>
       `;
       
       this.createMobilePowerButtons();
       this.container.appendChild(this.drawer);
   }
   
   createMobilePowerButtons() {
       const powerGrid = document.getElementById('mobile-power-grid');
       const powers = [
           { name: 'spawn', icon: '🦠', desc: 'Spawn' },
           { name: 'resources', icon: '🌿', desc: 'Resources' },
           { name: 'weather', icon: '🌦️', desc: 'Weather' },
           { name: 'disaster', icon: '💥', desc: 'Disaster' },
           { name: 'evolution', icon: '🧬', desc: 'Evolution' },
           { name: 'terraform', icon: '🏔️', desc: 'Terraform' }
       ];
       
       powers.forEach(power => {
           const button = document.createElement('button');
           button.id = `mobile-power-${power.name}`;
           button.innerHTML = `<div style="font-size: 20px;">${power.icon}</div><div style="font-size: 11px;">${power.desc}</div>`;
           button.style.cssText = `
               background: rgba(255,255,255,0.1);
               border: 1px solid rgba(255,255,255,0.3);
               color: white;
               border-radius: 8px;
               padding: 15px 10px;
               cursor: pointer;
               text-align: center;
               transition: all 0.2s ease;
               min-height: 70px;
               display: flex;
               flex-direction: column;
               justify-content: center;
               align-items: center;
           `;
           
           button.addEventListener('click', () => {
               this.godPowers.selectPower(power.name);
               this.updateMobilePowerButtons();
               this.closeDrawer();
               navigator.vibrate && navigator.vibrate(30);
           });
           
           powerGrid.appendChild(button);
       });
       
       // Add time button styles
       const style = document.createElement('style');
       style.textContent = `
           .time-btn {
               background: rgba(255,255,255,0.1);
               border: 1px solid rgba(255,255,255,0.3);
               color: white;
               border-radius: 4px;
               padding: 8px 12px;
               font-size: 12px;
               cursor: pointer;
               transition: all 0.2s ease;
           }
           .time-btn:active {
               background: rgba(255,215,0,0.3);
               transform: scale(0.95);
           }
       `;
       document.head.appendChild(style);
   }
   
   createInfoModal() {
       this.infoModal = document.createElement('div');
       this.infoModal.id = 'creature-info-modal';
       this.infoModal.style.cssText = `
           position: absolute;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%) scale(0);
           width: 90%;
           max-width: 350px;
           background: rgba(20,20,40,0.95);
           border: 2px solid gold;
           border-radius: 10px;
           padding: 20px;
           pointer-events: auto;
           transition: transform 0.3s ease;
           z-index: 20;
       `;
       
       this.infoModal.innerHTML = `
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
               <h3 style="margin: 0;">📊 Creature Info</h3>
               <button id="close-modal" style="
                   background: none;
                   border: none;
                   color: white;
                   font-size: 20px;
                   cursor: pointer;
               ">✕</button>
           </div>
           <div id="mobile-creature-details">Tap a creature to see details</div>
       `;
       
       this.container.appendChild(this.infoModal);
       
       document.getElementById('close-modal').addEventListener('click', () => {
           this.hideCreatureInfo();
       });
   }
   
   setupEventListeners() {
       // God mode toggle events
       document.addEventListener('god-mode-toggle', (e) => {
           this.updateGodModeUI(e.detail.active);
       });
       
       // Time scale changes
       document.addEventListener('time-scale-change', (e) => {
           this.updateTimeScaleDisplay(e.detail.scale);
       });
       
       // Touch handling for creature selection
       document.addEventListener('engine-touchstart', (e) => {
           if (e.detail.touches.length === 1) {
               this.handleTap(e.detail.touches[0].world);
           }
       });
       
       // Drawer swipe handling
       let startY = 0;
       let currentY = 0;
       let isDragging = false;
       
       this.drawer.addEventListener('touchstart', (e) => {
           startY = e.touches[0].clientY;
           isDragging = true;
       });
       
       this.drawer.addEventListener('touchmove', (e) => {
           if (!isDragging) return;
           currentY = e.touches[0].clientY;
           const deltaY = currentY - startY;
           
           if (deltaY > 20) { // Swipe down to close
               this.closeDrawer();
           }
       });
       
       this.drawer.addEventListener('touchend', () => {
           isDragging = false;
       });
   }
   
   setupGestures() {
       // Long press for quick god mode
       let longPressTimer;
       
       this.engine.canvas.addEventListener('touchstart', (e) => {
           if (e.touches.length === 1) {
               longPressTimer = setTimeout(() => {
                   if (!this.godPowers.isActive) {
                       this.godPowers.toggleGodMode();
                       navigator.vibrate && navigator.vibrate([50, 100, 50]);
                   }
               }, 800);
           }
       });
       
       this.engine.canvas.addEventListener('touchend', () => {
           clearTimeout(longPressTimer);
       });
       
       this.engine.canvas.addEventListener('touchmove', () => {
           clearTimeout(longPressTimer);
       });
   }
   
   handleTap(worldPos) {
       const currentTime = Date.now();
       const timeSinceLastTap = currentTime - this.lastTap;
       
       if (timeSinceLastTap < 300) {
           // Double tap - show creature info
           this.selectCreatureAt(worldPos);
           if (this.selectedCreature) {
               this.showCreatureInfo();
           }
       } else if (!this.godPowers.isActive) {
           // Single tap - select creature
           this.selectCreatureAt(worldPos);
       }
       
       this.lastTap = currentTime;
   }
   
   selectCreatureAt(worldPos) {
       let closest = null;
       let closestDistance = Infinity;
       
       this.ecosystem.creatures.forEach(creature => {
           if (creature.isDead) return;
           
           const distance = worldPos.distance(creature.position);
           if (distance <= creature.size * 2 && distance < closestDistance) {
               closest = creature;
               closestDistance = distance;
           }
       });
       
       this.selectedCreature = closest;
   }
   
   showCreatureInfo() {
       if (!this.selectedCreature) return;
       
       this.updateCreatureDetails();
       this.infoModal.style.transform = 'translate(-50%, -50%) scale(1)';
       
       // Auto hide after 5 seconds
       setTimeout(() => {
           this.hideCreatureInfo();
       }, 5000);
   }
   
   hideCreatureInfo() {
       this.infoModal.style.transform = 'translate(-50%, -50%) scale(0)';
   }
   
   updateCreatureDetails() {
       const detailsDiv = document.getElementById('mobile-creature-details');
       
       if (!this.selectedCreature || this.selectedCreature.isDead) {
           detailsDiv.innerHTML = 'No creature selected or creature died';
           return;
       }
       
       const c = this.selectedCreature;
       const healthPercent = ((c.health / c.maxHealth) * 100).toFixed(0);
       const energyPercent = ((c.energy / c.maxEnergy) * 100).toFixed(0);
       
       const speciesIcon = c.species === 'carnivore' ? '🦖' : c.species === 'herbivore' ? '🐑' : '🐺';
       
       detailsDiv.innerHTML = `
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
               <div><strong>${speciesIcon} ${c.species}</strong></div>
               <div>Age: ${c.age.toFixed(1)}s</div>
               <div>❤️ Health: ${healthPercent}%</div>
               <div>⚡ Energy: ${energyPercent}%</div>
               <div>📏 Size: ${c.size.toFixed(1)}</div>
               <div>💨 Speed: ${c.maxSpeed.toFixed(0)}</div>
               <div>👁️ Vision: ${c.visionRange.toFixed(0)}</div>
               <div>🧠 IQ: ${(c.intelligence * 100).toFixed(0)}</div>
               <div>😠 Aggro: ${(c.aggression * 100).toFixed(0)}%</div>
               <div>👥 Social: ${(c.social * 100).toFixed(0)}%</div>
           </div>
       `;
   }
   
   toggleDrawer() {
       if (this.isDrawerOpen) {
           this.closeDrawer();
       } else {
           this.openDrawer();
       }
   }
   
   openDrawer() {
       this.drawer.style.bottom = '0px';
       this.isDrawerOpen = true;
       navigator.vibrate && navigator.vibrate(30);
   }
   
   closeDrawer() {
       this.drawer.style.bottom = '-400px';
       this.isDrawerOpen = false;
   }
   
   updateGodModeUI(active) {
       const indicator = document.getElementById('god-mode-indicator');
       
       if (active) {
           this.fab.innerHTML = '⚡';
           this.fab.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
           this.fab.style.boxShadow = '0 4px 20px rgba(255,215,0,0.5)';
           indicator.style.display = 'block';
       } else {
           this.fab.innerHTML = '⚡';
           this.fab.style.background = 'linear-gradient(45deg, #6a0dad, #9932cc)';
           this.fab.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
           indicator.style.display = 'none';
       }
       
       this.updateMobilePowerButtons();
   }
   
   updateMobilePowerButtons() {
       const status = this.godPowers.getPowerStatus();
       
       ['spawn', 'resources', 'weather', 'disaster', 'evolution', 'terraform'].forEach(powerName => {
           const button = document.getElementById(`mobile-power-${powerName}`);
           if (!button) return;
           
           const isSelected = status.selectedPower === powerName;
           const isOnCooldown = status.cooldowns[powerName] > 0;
           
           if (!status.isActive) {
               button.style.opacity = '0.5';
               button.style.pointerEvents = 'none';
           } else if (isOnCooldown) {
               button.style.opacity = '0.6';
               button.style.background = 'rgba(255, 0, 0, 0.2)';
               button.style.pointerEvents = 'none';
           } else if (isSelected) {
               button.style.opacity = '1';
               button.style.background = 'rgba(255, 215, 0, 0.3)';
               button.style.pointerEvents = 'auto';
               button.style.transform = 'scale(1.05)';
           } else {
               button.style.opacity = '1';
               button.style.background = 'rgba(255, 255, 255, 0.1)';
               button.style.pointerEvents = 'auto';
               button.style.transform = 'scale(1)';
           }
       });
   }
   
   updateTimeScaleDisplay(scale) {
       const display = document.getElementById('mobile-time-display');
       if (display) {
           display.textContent = `Time Scale: ${scale.toFixed(2)}x`;
       }
   }
   
   update(deltaTime) {
       this.updateMobileStats();
       this.updateMobilePowerButtons();
   }
   
   updateMobileStats() {
       // Update population counter
       const popCount = document.getElementById('pop-count');
       if (popCount) {
           popCount.textContent = this.ecosystem.statistics.totalCreatures;
       }
       
       // Update detailed stats in drawer
       const speciesInfo = document.getElementById('mobile-species-info');
       if (speciesInfo) {
           const speciesCount = this.ecosystem.getSpeciesCount();
           const stats = this.ecosystem.statistics;
           
           let info = `🌍 Total: ${stats.totalCreatures} creatures<br>`;
           info += `📈 Avg Age: ${stats.averageAge.toFixed(1)}s<br>`;
           info += `📏 Avg Size: ${stats.averageSize.toFixed(1)}<br><br>`;
           
           Object.entries(speciesCount).forEach(([species, count]) => {
               const icon = species === 'carnivore' ? '🦖' : species === 'herbivore' ? '🐑' : '🐺';
               info += `${icon} ${species}: ${count}<br>`;
           });
           
           info += `<br>🌡️ Temp: ${this.world.environment.temperature.toFixed(1)}°C<br>`;
           info += `💧 Humidity: ${(this.world.environment.humidity * 100).toFixed(0)}%<br>`;
           info += `🍃 Resources: ${this.world.resources.length}`;
           
           speciesInfo.innerHTML = info;
       }
   }
   
   render(ctx) {
       // Highlight selected creature
       if (this.selectedCreature && !this.selectedCreature.isDead) {
           ctx.save();
           ctx.strokeStyle = '#FFD700';
           ctx.lineWidth = 3;
           ctx.beginPath();
           ctx.arc(
               this.selectedCreature.position.x,
               this.selectedCreature.position.y,
               this.selectedCreature.size + 8,
               0,
               Math.PI * 2
           );
           ctx.stroke();
           
           // Pulsing effect
           const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.3;
           ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
           ctx.lineWidth = 2;
           ctx.beginPath();
           ctx.arc(
               this.selectedCreature.position.x,
               this.selectedCreature.position.y,
               (this.selectedCreature.size + 12) * pulse,
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