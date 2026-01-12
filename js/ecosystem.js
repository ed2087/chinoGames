// Population dynamics, food chains 
// Population dynamics, food chains

class Ecosystem {
    constructor(world) {
        this.world = world;
        this.creatures = [];
        this.deadCreatures = [];
        this.statistics = new EcosystemStats();
        this.evolutionPressures = new EvolutionPressures();
        
        this.reproductionQueue = [];
        this.timeScale = 1;
        this.maxPopulation = 200;
        
        // Population control
        this.lastPopulationCheck = 0;
        this.populationCheckInterval = 5; // seconds
    }
    
    update(deltaTime) {
        const scaledDeltaTime = deltaTime * this.timeScale;
        
        // Update all creatures
        this.creatures.forEach(creature => {
            creature.update(scaledDeltaTime, this.world, this.creatures);
        });
        
        // Handle reproduction queue
        this.processReproduction();
        
        // Remove dead creatures
        this.removeDeadCreatures();
        
        // Population management
        this.managePopulation(scaledDeltaTime);
        
        // Update statistics
        this.statistics.update(this.creatures, scaledDeltaTime);
        
        // Apply evolution pressures
        this.evolutionPressures.update(this.creatures, scaledDeltaTime);
    }
    
    processReproduction() {
        this.reproductionQueue.forEach(offspring => {
            if (this.creatures.length < this.maxPopulation) {
                this.creatures.push(offspring);
            }
        });
        this.reproductionQueue = [];
        
        // Check for natural reproduction
        for (let i = 0; i < this.creatures.length; i++) {
            const creature = this.creatures[i];
            if (creature.isDead || !creature.canReproduce()) continue;
            
            for (let j = i + 1; j < this.creatures.length; j++) {
                const mate = this.creatures[j];
                if (mate.isDead || !mate.canReproduce()) continue;
                if (mate.species !== creature.species) continue;
                
                const distance = creature.position.distance(mate.position);
                if (distance < creature.size + mate.size) {
                    const offspring = creature.reproduce(mate);
                    if (offspring) {
                        this.reproductionQueue.push(offspring);
                        break;
                    }
                }
            }
        }
    }
    
    removeDeadCreatures() {
        const aliveBefore = this.creatures.length;
        
        this.creatures.forEach(creature => {
            if (creature.isDead) {
                this.deadCreatures.push({
                    species: creature.species,
                    age: creature.age,
                    size: creature.size,
                    dna: creature.dna.clone(),
                    deathTime: this.world.time
                });
            }
        });
        
        this.creatures = this.creatures.filter(creature => !creature.isDead);
        
        // Clean up old death records
        const cutoffTime = this.world.time - 300; // Keep records for 5 minutes
        this.deadCreatures = this.deadCreatures.filter(death => death.deathTime > cutoffTime);
    }
    
    managePopulation(deltaTime) {
        this.lastPopulationCheck += deltaTime;
        
        if (this.lastPopulationCheck >= this.populationCheckInterval) {
            this.lastPopulationCheck = 0;
            
            // Add creatures if population is too low
            if (this.creatures.length < 10) {
                for (let i = 0; i < 5; i++) {
                    this.addRandomCreature();
                }
            }
            
            // Remove oldest creatures if population is too high
            if (this.creatures.length > this.maxPopulation) {
                this.creatures.sort((a, b) => b.age - a.age);
                const toRemove = this.creatures.length - this.maxPopulation;
                for (let i = 0; i < toRemove; i++) {
                    this.creatures[i].die();
                }
            }
        }
    }
    
    addRandomCreature() {
        const position = new Vector2D(
            Random.float(-this.world.width/3, this.world.width/3),
            Random.float(-this.world.height/3, this.world.height/3)
        );
        
        // Create creature with evolved traits if we have death data
        let dna;
        if (this.deadCreatures.length > 0) {
            dna = this.evolveFromPopulation();
        } else {
            dna = new DNA();
        }
        
        const creature = new Creature(position, dna);
        this.creatures.push(creature);
        return creature;
    }
    
    evolveFromPopulation() {
        // Select successful traits from the population
        const successfulCreatures = this.deadCreatures
            .filter(death => death.age > death.dna.lifespan * 0.5)
            .sort((a, b) => b.age - a.age)
            .slice(0, 10);
        
        if (successfulCreatures.length >= 2) {
            const parent1 = Random.choice(successfulCreatures);
            const parent2 = Random.choice(successfulCreatures);
            const dna = DNA.crossover(parent1.dna, parent2.dna);
            dna.mutate(0.15, 0.15);
            return dna;
        }
        
        return new DNA();
    }
    
    addCreature(creature) {
        this.creatures.push(creature);
    }
    
    getCreaturesNear(position, radius) {
        return this.creatures.filter(creature => 
            !creature.isDead && 
            position.distance(creature.position) <= radius
        );
    }
    
    getSpeciesCount() {
        const counts = {};
        this.creatures.forEach(creature => {
            if (!creature.isDead) {
                counts[creature.species] = (counts[creature.species] || 0) + 1;
            }
        });
        return counts;
    }
    
    render(ctx) {
        // Render creatures
        this.creatures.forEach(creature => {
            creature.render(ctx);
        });
        
        // Render statistics overlay
        this.statistics.render(ctx);
    }
    
    // God powers interface
    spawnCreature(position, species = null) {
        const dna = new DNA();
        if (species === 'carnivore') {
            dna.carnivorousness = 0.9;
            dna.aggression = 0.8;
        } else if (species === 'herbivore') {
            dna.carnivorousness = 0.1;
            dna.social = 0.8;
        }
        
        const creature = new Creature(position, dna);
        this.addCreature(creature);
        return creature;
    }
    
    killCreaturesInArea(position, radius) {
        this.creatures.forEach(creature => {
            if (position.distance(creature.position) <= radius) {
                creature.die();
            }
        });
    }
    
    mutateCreaturesInArea(position, radius, mutationStrength = 0.3) {
        this.creatures.forEach(creature => {
            if (position.distance(creature.position) <= radius) {
                creature.dna.mutate(1.0, mutationStrength);
                creature.color = creature.generateColor();
            }
        });
    }
    
    setTimeScale(scale) {
        this.timeScale = Math.max(0.1, Math.min(10, scale));
    }
}

class EcosystemStats {
    constructor() {
        this.totalCreatures = 0;
        this.speciesCounts = {};
        this.averageAge = 0;
        this.averageSize = 0;
        this.birthRate = 0;
        this.deathRate = 0;
        
        this.history = [];
        this.maxHistoryLength = 300; // 5 minutes at 60fps
        
        this.lastBirthCount = 0;
        this.lastDeathCount = 0;
        this.totalBirths = 0;
        this.totalDeaths = 0;
    }
    
    update(creatures, deltaTime) {
        this.totalCreatures = creatures.filter(c => !c.isDead).length;
        
        // Species counts
        this.speciesCounts = {};
        let totalAge = 0;
        let totalSize = 0;
        
        creatures.forEach(creature => {
            if (!creature.isDead) {
                this.speciesCounts[creature.species] = (this.speciesCounts[creature.species] || 0) + 1;
                totalAge += creature.age;
                totalSize += creature.size;
            }
        });
        
        this.averageAge = this.totalCreatures > 0 ? totalAge / this.totalCreatures : 0;
        this.averageSize = this.totalCreatures > 0 ? totalSize / this.totalCreatures : 0;
        
        // Record history
        this.history.push({
            time: performance.now(),
            population: this.totalCreatures,
            species: {...this.speciesCounts},
            averageAge: this.averageAge,
            averageSize: this.averageSize
        });
        
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }
    }
    
    render(ctx) {
        // Don't render stats on canvas, this will be handled by UI
    }
    
    getPopulationTrend() {
        if (this.history.length < 2) return 0;
        
        const recent = this.history.slice(-30); // Last 30 frames
        const start = recent[0].population;
        const end = recent[recent.length - 1].population;
        
        return end - start;
    }
}

class EvolutionPressures {
    constructor() {
        this.predationPressure = 0;
        this.resourceScarcity = 0;
        this.competitionLevel = 0;
        this.environmentalStress = 0;
    }
    
    update(creatures, deltaTime) {
        // Calculate predation pressure
        const carnivores = creatures.filter(c => !c.isDead && c.species === 'carnivore').length;
        const herbivores = creatures.filter(c => !c.isDead && c.species === 'herbivore').length;
        
        this.predationPressure = herbivores > 0 ? carnivores / herbivores : 0;
        
        // Calculate competition level
        const totalCreatures = creatures.filter(c => !c.isDead).length;
        this.competitionLevel = Math.min(totalCreatures / 100, 1);
        
        // Apply pressures
        this.applyPressures(creatures);
    }
    
    applyPressures(creatures) {
        // High predation pressure favors speed and agility in herbivores
        if (this.predationPressure > 0.3) {
            creatures.forEach(creature => {
                if (!creature.isDead && creature.species === 'herbivore') {
                    // Slight evolutionary pressure
                    creature.dna.speed *= 1.001;
                    creature.dna.agility *= 1.001;
                }
            });
        }
        
        // High competition favors intelligence and social behavior
        if (this.competitionLevel > 0.7) {
            creatures.forEach(creature => {
                if (!creature.isDead) {
                    creature.dna.intelligence *= 1.0005;
                    creature.dna.social *= 1.0005;
                }
            });
        }
    }
}