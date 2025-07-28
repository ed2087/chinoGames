// Divine intervention powers 
// Divine intervention powers

class GodPowers {
    constructor(world, ecosystem) {
        this.world = world;
        this.ecosystem = ecosystem;
        this.isActive = false;
        this.selectedPower = 'spawn';
        this.powerCooldowns = {};
        
        this.powers = {
            spawn: { cooldown: 0, cost: 0 },
            resources: { cooldown: 1, cost: 0 },
            weather: { cooldown: 5, cost: 0 },
            disaster: { cooldown: 10, cost: 0 },
            evolution: { cooldown: 15, cost: 0 },
            time: { cooldown: 0, cost: 0 },
            terraform: { cooldown: 20, cost: 0 }
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('engine-mousedown', (e) => {
            if (this.isActive) {
                this.usePower(e.detail.world, e.detail.button);
            }
        });
        
        document.addEventListener('engine-touchstart', (e) => {
            if (this.isActive && e.detail.touches.length === 1) {
                this.usePower(e.detail.touches[0].world, 0);
            }
        });
        
        document.addEventListener('engine-keydown', (e) => {
            this.handleKeyboard(e.detail.key);
        });
    }
    
    handleKeyboard(key) {
        switch (key.toLowerCase()) {
            case 'g':
                this.toggleGodMode();
                break;
            case '1':
                this.selectedPower = 'spawn';
                break;
            case '2':
                this.selectedPower = 'resources';
                break;
            case '3':
                this.selectedPower = 'weather';
                break;
            case '4':
                this.selectedPower = 'disaster';
                break;
            case '5':
                this.selectedPower = 'evolution';
                break;
            case '6':
                this.selectedPower = 'time';
                break;
            case '7':
                this.selectedPower = 'terraform';
                break;
            case '+':
                this.adjustTimeScale(1.5);
                break;
            case '-':
                this.adjustTimeScale(0.75);
                break;
        }
    }
    
    toggleGodMode() {
        this.isActive = !this.isActive;
        document.dispatchEvent(new CustomEvent('god-mode-toggle', { 
            detail: { active: this.isActive } 
        }));
    }
    
    usePower(position, button = 0) {
        const powerName = this.selectedPower;
        
        if (!this.canUsePower(powerName)) return;
        
        switch (powerName) {
            case 'spawn':
                this.spawnCreature(position, button);
                break;
            case 'resources':
                this.createResources(position, button);
                break;
            case 'weather':
                this.changeWeather(position);
                break;
            case 'disaster':
                this.createDisaster(position);
                break;
            case 'evolution':
                this.triggerEvolution(position);
                break;
            case 'terraform':
                this.terraform(position);
                break;
        }
        
        this.powerCooldowns[powerName] = this.powers[powerName].cooldown;
    }
    
    canUsePower(powerName) {
        return !this.powerCooldowns[powerName] || this.powerCooldowns[powerName] <= 0;
    }
    
    spawnCreature(position, button) {
        let species = null;
        
        switch (button) {
            case 0: // Left click - random
                species = Random.choice(['herbivore', 'carnivore', 'omnivore']);
                break;
            case 2: // Right click - carnivore
                species = 'carnivore';
                break;
            default:
                species = 'herbivore';
        }
        
        const creature = this.ecosystem.spawnCreature(position, species);
        
        // Divine blessing - make them slightly better
        creature.dna.maxHealth *= 1.2;
        creature.dna.maxEnergy *= 1.2;
        creature.health = creature.maxHealth;
        creature.energy = creature.maxEnergy;
        
        this.createVisualEffect(position, 'spawn', new Color(255, 255, 0));
    }
    
    createResources(position, button) {
        const resourceTypes = ['food', 'water', 'mineral'];
        let type = resourceTypes[button] || Random.choice(resourceTypes);
        
        // Create cluster of resources
        for (let i = 0; i < 5; i++) {
            const offset = new Vector2D(
                Random.float(-30, 30),
                Random.float(-30, 30)
            );
            const resourcePos = position.clone().add(offset);
            this.world.addResource(type, resourcePos, Random.float(100, 300));
        }
        
        this.createVisualEffect(position, 'resources', new Color(0, 255, 0));
    }
    
    changeWeather(position) {
        // Affect temperature and humidity in area
        const radius = 100;
        
        this.world.environment.temperature += Random.float(-10, 10);
        this.world.environment.humidity += Random.float(-0.3, 0.3);
        this.world.environment.humidity = Math.max(0, Math.min(1, this.world.environment.humidity));
        
        // Affect creatures in area
        const nearbyCreatures = this.ecosystem.getCreaturesNear(position, radius);
        nearbyCreatures.forEach(creature => {
            // Weather affects energy
            creature.energy += Random.float(-50, 50);
            creature.energy = Math.max(0, Math.min(creature.maxEnergy, creature.energy));
        });
        
        this.createVisualEffect(position, 'weather', new Color(100, 150, 255), radius);
    }
    
createDisaster(position) {
       const disasters = ['meteor', 'flood', 'drought', 'plague', 'earthquake'];
       const disaster = Random.choice(disasters);
       const radius = Random.float(50, 150);
       
       switch (disaster) {
           case 'meteor':
               this.meteorStrike(position, radius);
               break;
           case 'flood':
               this.flood(position, radius);
               break;
           case 'drought':
               this.drought(position, radius);
               break;
           case 'plague':
               this.plague(position, radius);
               break;
           case 'earthquake':
               this.earthquake(position, radius);
               break;
       }
       
       this.createVisualEffect(position, 'disaster', new Color(255, 0, 0), radius);
   }
   
   meteorStrike(position, radius) {
       // Kill creatures in blast radius
       this.ecosystem.killCreaturesInArea(position, radius * 0.5);
       
       // Damage creatures in outer radius
       const damagedCreatures = this.ecosystem.getCreaturesNear(position, radius);
       damagedCreatures.forEach(creature => {
           const distance = position.distance(creature.position);
           const damage = 100 * (1 - distance / radius);
           creature.takeDamage(damage);
       });
       
       // Remove resources
       this.world.resources = this.world.resources.filter(resource => {
           return position.distance(resource.position) > radius * 0.7;
       });
   }
   
   flood(position, radius) {
       // Slower creatures have higher chance of death
       const affectedCreatures = this.ecosystem.getCreaturesNear(position, radius);
       affectedCreatures.forEach(creature => {
           const survivalChance = creature.dna.speed / 100;
           if (Math.random() > survivalChance) {
               creature.takeDamage(creature.maxHealth * 0.7);
           }
       });
       
       // Convert some resources to water
       this.world.resources.forEach(resource => {
           if (position.distance(resource.position) <= radius && resource.type !== 'water') {
               if (Math.random() < 0.3) {
                   resource.type = 'water';
                   resource.color = new Color(100, 150, 255);
               }
           }
       });
   }
   
   drought(position, radius) {
       // Remove water resources
       this.world.resources = this.world.resources.filter(resource => {
           if (resource.type === 'water' && position.distance(resource.position) <= radius) {
               return Math.random() < 0.2; // 20% survive
           }
           return true;
       });
       
       // Creatures lose energy faster
       const affectedCreatures = this.ecosystem.getCreaturesNear(position, radius);
       affectedCreatures.forEach(creature => {
           creature.energy *= 0.7;
       });
   }
   
   plague(position, radius) {
       // Spread disease based on social behavior
       const patient_zero = this.ecosystem.getCreaturesNear(position, 20)[0];
       if (!patient_zero) return;
       
       const infectedCreatures = new Set([patient_zero]);
       const toProcess = [patient_zero];
       
       while (toProcess.length > 0 && infectedCreatures.size < 50) {
           const current = toProcess.pop();
           const nearby = this.ecosystem.getCreaturesNear(current.position, 30);
           
           nearby.forEach(creature => {
               if (!infectedCreatures.has(creature)) {
                   const infectionChance = creature.dna.social * 0.3;
                   if (Math.random() < infectionChance) {
                       infectedCreatures.add(creature);
                       toProcess.push(creature);
                   }
               }
           });
       }
       
       // Apply plague effects
       infectedCreatures.forEach(creature => {
           creature.takeDamage(creature.maxHealth * Random.float(0.3, 0.8));
           creature.color = Color.lerp(creature.color, new Color(100, 50, 50), 0.5);
       });
   }
   
   earthquake(position, radius) {
       // Larger creatures are more affected
       const affectedCreatures = this.ecosystem.getCreaturesNear(position, radius);
       affectedCreatures.forEach(creature => {
           const damage = creature.dna.size * 2;
           creature.takeDamage(damage);
           
           // Shake them around
           creature.velocity.add(new Vector2D(
               Random.float(-50, 50),
               Random.float(-50, 50)
           ));
       });
       
       // Scatter resources
       this.world.resources.forEach(resource => {
           if (position.distance(resource.position) <= radius) {
               resource.position.add(new Vector2D(
                   Random.float(-30, 30),
                   Random.float(-30, 30)
               ));
           }
       });
   }
   
   triggerEvolution(position) {
       const radius = 80;
       const affectedCreatures = this.ecosystem.getCreaturesNear(position, radius);
       
       // Rapid mutation
       affectedCreatures.forEach(creature => {
           creature.dna.mutate(0.8, 0.4); // High mutation rate and strength
           
           // Update creature properties
           creature.size = creature.dna.size;
           creature.maxSpeed = creature.dna.speed;
           creature.maxForce = creature.dna.agility;
           creature.visionRange = creature.dna.visionRange;
           creature.color = creature.generateColor();
           creature.species = creature.dna.getSpeciesType();
       });
       
       this.createVisualEffect(position, 'evolution', new Color(255, 0, 255), radius);
   }
   
   terraform(position) {
       const radius = 120;
       
       // Create resources based on terrain type
       const terrainTypes = ['fertile', 'rocky', 'watery', 'volcanic'];
       const terrain = Random.choice(terrainTypes);
       
       for (let i = 0; i < 15; i++) {
           const angle = Random.float(0, Math.PI * 2);
           const distance = Random.float(0, radius);
           const resourcePos = position.clone().add(new Vector2D(
               Math.cos(angle) * distance,
               Math.sin(angle) * distance
           ));
           
           switch (terrain) {
               case 'fertile':
                   this.world.addResource('food', resourcePos, Random.float(150, 300));
                   break;
               case 'rocky':
                   this.world.addResource('mineral', resourcePos, Random.float(100, 200));
                   break;
               case 'watery':
                   this.world.addResource('water', resourcePos, Random.float(200, 400));
                   break;
               case 'volcanic':
                   // Mixed resources but some danger
                   if (Math.random() < 0.7) {
                       this.world.addResource(Random.choice(['food', 'mineral']), resourcePos);
                   } else {
                       // Volcanic hazard - damage nearby creatures
                       const nearbyCreatures = this.ecosystem.getCreaturesNear(resourcePos, 20);
                       nearbyCreatures.forEach(creature => creature.takeDamage(30));
                   }
                   break;
           }
       }
       
       this.createVisualEffect(position, 'terraform', new Color(139, 69, 19), radius);
   }
   
   adjustTimeScale(factor) {
       const newScale = this.ecosystem.timeScale * factor;
       this.ecosystem.setTimeScale(newScale);
       
       document.dispatchEvent(new CustomEvent('time-scale-change', {
           detail: { scale: this.ecosystem.timeScale }
       }));
   }
   
   createVisualEffect(position, type, color, radius = 30) {
       // Create a temporary visual effect
       const effect = {
           position: position.clone(),
           color: color,
           radius: radius,
           maxRadius: radius,
           life: 1.0,
           type: type,
           startTime: performance.now()
       };
       
       // Store effect for rendering
       if (!this.visualEffects) this.visualEffects = [];
       this.visualEffects.push(effect);
       
       // Auto-remove after duration
       setTimeout(() => {
           const index = this.visualEffects.indexOf(effect);
           if (index > -1) this.visualEffects.splice(index, 1);
       }, 2000);
   }
   
   update(deltaTime) {
       // Update cooldowns
       Object.keys(this.powerCooldowns).forEach(power => {
           if (this.powerCooldowns[power] > 0) {
               this.powerCooldowns[power] -= deltaTime;
               if (this.powerCooldowns[power] <= 0) {
                   this.powerCooldowns[power] = 0;
               }
           }
       });
       
       // Update visual effects
       if (this.visualEffects) {
           this.visualEffects.forEach(effect => {
               effect.life -= deltaTime * 0.5;
               effect.radius = effect.maxRadius * effect.life;
           });
           
           this.visualEffects = this.visualEffects.filter(effect => effect.life > 0);
       }
   }
   
   render(ctx) {
       // Render visual effects
       if (this.visualEffects) {
           this.visualEffects.forEach(effect => {
               ctx.save();
               ctx.globalAlpha = effect.life;
               ctx.strokeStyle = effect.color.toString();
               ctx.lineWidth = 3;
               ctx.beginPath();
               ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
               ctx.stroke();
               
               // Add effect-specific visuals
               if (effect.type === 'spawn') {
                   ctx.fillStyle = effect.color.toString();
                   for (let i = 0; i < 8; i++) {
                       const angle = (i / 8) * Math.PI * 2;
                       const x = effect.position.x + Math.cos(angle) * effect.radius * 0.5;
                       const y = effect.position.y + Math.sin(angle) * effect.radius * 0.5;
                       ctx.beginPath();
                       ctx.arc(x, y, 3, 0, Math.PI * 2);
                       ctx.fill();
                   }
               }
               
               ctx.restore();
           });
       }
       
       // Render god mode indicator
       if (this.isActive) {
           ctx.save();
           ctx.globalAlpha = 0.8;
           ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
           ctx.fillRect(-10000, -10000, 20000, 20000);
           ctx.restore();
       }
   }
   
   // Power status for UI
   getPowerStatus() {
       return {
           isActive: this.isActive,
           selectedPower: this.selectedPower,
           cooldowns: {...this.powerCooldowns},
           timeScale: this.ecosystem.timeScale
       };
   }
   
   selectPower(powerName) {
       if (this.powers[powerName]) {
           this.selectedPower = powerName;
       }
   }
}