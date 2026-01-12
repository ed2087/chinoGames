// DNA, behavior, evolution 
// DNA, behavior, evolution

class Creature {
    constructor(position, dna = null) {
        this.position = position.clone();
        this.velocity = new Vector2D();
        this.acceleration = new Vector2D();
        
        // Physical properties
        this.dna = dna || new DNA();
        this.size = this.dna.size;
        this.mass = this.size * this.size;
        this.maxSpeed = this.dna.speed;
        this.maxForce = this.dna.agility;
        
        // Life properties
        this.health = this.dna.maxHealth;
        this.maxHealth = this.dna.maxHealth;
        this.energy = this.dna.maxEnergy;
        this.maxEnergy = this.dna.maxEnergy;
        this.age = 0;
        this.lifespan = this.dna.lifespan;
        
        // Behavioral properties
        this.visionRange = this.dna.visionRange;
        this.aggression = this.dna.aggression;
        this.social = this.dna.social;
        this.intelligence = this.dna.intelligence;
        
        // State
        this.isDead = false;
        this.isHungry = true;
        this.isThirsty = true;
        this.target = null;
        this.lastReproduction = 0;
        
        // Appearance
        this.color = this.generateColor();
        this.species = this.dna.getSpeciesType();
        
        // Memory and learning
        this.memory = [];
        this.maxMemorySize = Math.floor(this.intelligence * 10);
        
        // Relationships
        this.pack = [];
        this.enemies = [];
    }
    
    generateColor() {
        // Color based on DNA traits
        const r = Math.floor(this.dna.aggression * 255);
        const g = Math.floor(this.dna.social * 255);
        const b = Math.floor(this.dna.intelligence * 255);
        return new Color(r, g, b);
    }
    
    update(deltaTime, world, creatures) {
        if (this.isDead) return;
        
        this.age += deltaTime;
        
        // Consume energy
        this.energy -= deltaTime * (5 + this.size);
        
        // Hunger and thirst
        this.isHungry = this.energy < this.maxEnergy * 0.7;
        this.isThirsty = this.energy < this.maxEnergy * 0.5;
        
        // Death conditions
        if (this.energy <= 0 || this.age >= this.lifespan || this.health <= 0) {
            this.die();
            return;
        }
        
        // Behavior
        this.behave(world, creatures);
        
        // Physics
        this.velocity.add(this.acceleration);
        this.velocity.multiply(0.95); // Friction
        
        if (this.velocity.magnitude() > this.maxSpeed) {
            this.velocity.normalize();
            this.velocity.multiply(this.maxSpeed);
        }
        
        this.position.add(this.velocity.clone().multiply(deltaTime));
        this.acceleration.multiply(0);
        
        // World boundaries
        this.wrapAround(world);
        
        // Update memory
        this.updateMemory(world);
    }
    
    behave(world, creatures) {
        const forces = [];
        
        // Basic needs
        if (this.isHungry || this.isThirsty) {
            const seekForce = this.seekResource(world);
            if (seekForce) forces.push(seekForce.multiply(2));
        }
        
        // Predator behavior
        if (this.species === 'carnivore') {
            const huntForce = this.hunt(creatures);
            if (huntForce) forces.push(huntForce.multiply(1.5));
        }
        
        // Prey behavior
        if (this.species === 'herbivore') {
            const fleeForce = this.flee(creatures);
            if (fleeForce) forces.push(fleeForce.multiply(3));
        }
        
        // Social behavior
        if (this.social > 0.5) {
            const flockForce = this.flock(creatures);
            if (flockForce) forces.push(flockForce.multiply(this.social));
        }
        
        // Reproduction behavior
        if (this.canReproduce()) {
            const mateForce = this.seekMate(creatures);
            if (mateForce) forces.push(mateForce);
        }
        
        // Exploration
        const wanderForce = this.wander();
        forces.push(wanderForce.multiply(0.2));
        
        // Apply all forces
        forces.forEach(force => this.acceleration.add(force));
    }
    
    seekResource(world) {
        const resourceType = this.isThirsty ? 'water' : 'food';
        const closest = world.getClosestResource(this.position, resourceType);
        
        if (closest) {
            const distance = this.position.distance(closest.position);
            
            if (distance < this.size + closest.size) {
                // Consume resource
                const consumed = closest.consume(20);
                this.energy += consumed;
                this.energy = Math.min(this.energy, this.maxEnergy);
            }
            
            return this.seek(closest.position);
        }
        
        return null;
    }
    
    hunt(creatures) {
        if (this.species !== 'carnivore') return null;
        
        const nearbyPrey = creatures.filter(c => 
            c !== this && 
            !c.isDead && 
            c.species === 'herbivore' &&
            this.position.distance(c.position) < this.visionRange
        );
        
        if (nearbyPrey.length > 0) {
            const closest = nearbyPrey.reduce((closest, current) => {
                const closestDist = this.position.distance(closest.position);
                const currentDist = this.position.distance(current.position);
                return currentDist < closestDist ? current : closest;
            });
            
            const distance = this.position.distance(closest.position);
            
            if (distance < this.size + closest.size) {
                // Attack
                closest.takeDamage(this.aggression * 50);
                if (closest.isDead) {
                    this.energy += closest.size * 50;
                    this.energy = Math.min(this.energy, this.maxEnergy);
                }
            }
            
            return this.seek(closest.position);
        }
        
        return null;
    }
    
    flee(creatures) {
        const nearbyPredators = creatures.filter(c => 
            c !== this && 
            !c.isDead && 
            c.species === 'carnivore' &&
            this.position.distance(c.position) < this.visionRange
        );
        
        if (nearbyPredators.length > 0) {
            const fleeForce = new Vector2D();
            
            nearbyPredators.forEach(predator => {
                const away = this.position.clone().subtract(predator.position);
                const distance = away.magnitude();
                if (distance > 0) {
                    away.normalize();
                    away.multiply(1 / distance); // Closer = stronger force
                    fleeForce.add(away);
                }
            });
            
            if (fleeForce.magnitude() > 0) {
                fleeForce.normalize();
                fleeForce.multiply(this.maxForce);
                return fleeForce;
            }
        }
        
        return null;
    }
    
    flock(creatures) {
        const neighbors = creatures.filter(c => 
            c !== this && 
            !c.isDead && 
            c.species === this.species &&
            this.position.distance(c.position) < this.visionRange * 0.5
        );
        
        if (neighbors.length === 0) return null;
        
        // Separation
        const separate = new Vector2D();
        neighbors.forEach(neighbor => {
            const away = this.position.clone().subtract(neighbor.position);
            const distance = away.magnitude();
            if (distance > 0 && distance < this.size * 3) {
                away.normalize();
                away.multiply(1 / distance);
                separate.add(away);
            }
        });
        
        // Alignment
        const avgVelocity = new Vector2D();
        neighbors.forEach(neighbor => {
            avgVelocity.add(neighbor.velocity);
        });
        avgVelocity.multiply(1 / neighbors.length);
        
        // Cohesion
        const avgPosition = new Vector2D();
        neighbors.forEach(neighbor => {
            avgPosition.add(neighbor.position);
        });
        avgPosition.multiply(1 / neighbors.length);
        const cohesion = this.seek(avgPosition);
        // Combine flocking forces
       if (separate.magnitude() > 0) {
           separate.normalize();
           separate.multiply(this.maxForce * 1.5);
       }
       
       if (avgVelocity.magnitude() > 0) {
           avgVelocity.normalize();
           avgVelocity.multiply(this.maxForce);
       }
       
       const flockForce = new Vector2D();
       flockForce.add(separate);
       flockForce.add(avgVelocity.multiply(0.5));
       if (cohesion) flockForce.add(cohesion.multiply(0.3));
       
       return flockForce;
   }
   
   seekMate(creatures) {
       const potentialMates = creatures.filter(c => 
           c !== this && 
           !c.isDead && 
           c.species === this.species &&
           c.canReproduce() &&
           this.position.distance(c.position) < this.visionRange
       );
       
       if (potentialMates.length > 0) {
           const closest = potentialMates.reduce((closest, current) => {
               const closestDist = this.position.distance(closest.position);
               const currentDist = this.position.distance(current.position);
               return currentDist < closestDist ? current : closest;
           });
           
           const distance = this.position.distance(closest.position);
           
           if (distance < this.size * 2) {
               // Attempt reproduction
               return this.reproduce(closest);
           }
           
           return this.seek(closest.position);
       }
       
       return null;
   }
   
   seek(target) {
       const desired = target.clone().subtract(this.position);
       desired.normalize();
       desired.multiply(this.maxSpeed);
       
       const steer = desired.subtract(this.velocity);
       if (steer.magnitude() > this.maxForce) {
           steer.normalize();
           steer.multiply(this.maxForce);
       }
       
       return steer;
   }
   
   wander() {
       const wanderForce = new Vector2D(
           Random.float(-1, 1),
           Random.float(-1, 1)
       );
       wanderForce.normalize();
       wanderForce.multiply(this.maxForce * 0.1);
       return wanderForce;
   }
   
   canReproduce() {
       return this.age > this.lifespan * 0.2 && 
              this.energy > this.maxEnergy * 0.8 && 
              this.age - this.lastReproduction > 30;
   }
   
   reproduce(mate) {
       if (!this.canReproduce() || !mate.canReproduce()) return null;
       
       // Create offspring
       const childDNA = DNA.crossover(this.dna, mate.dna);
       childDNA.mutate();
       
       const childPosition = this.position.clone().add(new Vector2D(
           Random.float(-20, 20),
           Random.float(-20, 20)
       ));
       
       const offspring = new Creature(childPosition, childDNA);
       
       // Reproduction cost
       this.energy -= this.maxEnergy * 0.3;
       mate.energy -= mate.maxEnergy * 0.3;
       
       this.lastReproduction = this.age;
       mate.lastReproduction = mate.age;
       
       return offspring;
   }
   
   takeDamage(amount) {
       this.health -= amount;
       if (this.health <= 0) {
           this.die();
       }
   }
   
   die() {
       this.isDead = true;
       this.velocity.multiply(0);
   }
   
   updateMemory(world) {
       // Remember resource locations
       const nearbyResources = world.getResourcesNear(this.position, this.visionRange);
       nearbyResources.forEach(resource => {
           this.addToMemory({
               type: 'resource',
               resourceType: resource.type,
               position: resource.position.clone(),
               timestamp: world.time
           });
       });
       
       // Limit memory size
       if (this.memory.length > this.maxMemorySize) {
           this.memory.shift();
       }
   }
   
   addToMemory(item) {
       this.memory.push(item);
   }
   
   wrapAround(world) {
       if (this.position.x > world.width / 2) this.position.x = -world.width / 2;
       if (this.position.x < -world.width / 2) this.position.x = world.width / 2;
       if (this.position.y > world.height / 2) this.position.y = -world.height / 2;
       if (this.position.y < -world.height / 2) this.position.y = world.height / 2;
   }
   
   render(ctx) {
       if (this.isDead) return;
       
       ctx.save();
       ctx.translate(this.position.x, this.position.y);
       
       // Rotate to face movement direction
       if (this.velocity.magnitude() > 0.1) {
           const angle = Math.atan2(this.velocity.y, this.velocity.x);
           ctx.rotate(angle);
       }
       
       // Health bar
       if (this.health < this.maxHealth * 0.8) {
           const barWidth = this.size * 2;
           const barHeight = 3;
           const healthPercent = this.health / this.maxHealth;
           
           ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
           ctx.fillRect(-barWidth/2, -this.size - 10, barWidth, barHeight);
           
           ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
           ctx.fillRect(-barWidth/2, -this.size - 10, barWidth * healthPercent, barHeight);
       }
       
       // Body
       ctx.fillStyle = this.color.toString();
       ctx.beginPath();
       
       if (this.species === 'carnivore') {
           // Triangle for carnivores
           ctx.moveTo(this.size, 0);
           ctx.lineTo(-this.size/2, -this.size/2);
           ctx.lineTo(-this.size/2, this.size/2);
       } else {
           // Circle for herbivores
           ctx.arc(0, 0, this.size, 0, Math.PI * 2);
       }
       
       ctx.fill();
       
       // Eyes
       ctx.fillStyle = 'white';
       ctx.beginPath();
       ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
       ctx.fill();
       ctx.beginPath();
       ctx.arc(this.size * 0.3, this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
       ctx.fill();
       
       ctx.fillStyle = 'black';
       ctx.beginPath();
       ctx.arc(this.size * 0.4, -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
       ctx.fill();
       ctx.beginPath();
       ctx.arc(this.size * 0.4, this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
       ctx.fill();
       
       // Vision range (debug)
       if (window.DEBUG_MODE) {
           ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
           ctx.beginPath();
           ctx.arc(0, 0, this.visionRange, 0, Math.PI * 2);
           ctx.stroke();
       }
       
       ctx.restore();
   }
}

class DNA {
   constructor() {
       // Physical traits
       this.size = Random.float(5, 20);
       this.speed = Random.float(20, 100);
       this.agility = Random.float(0.5, 3);
       this.maxHealth = Random.float(50, 200);
       this.maxEnergy = Random.float(100, 500);
       this.lifespan = Random.float(60, 300);
       
       // Behavioral traits
       this.visionRange = Random.float(30, 150);
       this.aggression = Random.float(0, 1);
       this.social = Random.float(0, 1);
       this.intelligence = Random.float(0, 1);
       
       // Dietary preference
       this.carnivorousness = Random.float(0, 1);
   }
   
   getSpeciesType() {
       if (this.carnivorousness > 0.7) return 'carnivore';
       if (this.carnivorousness < 0.3) return 'herbivore';
       return 'omnivore';
   }
   
   static crossover(parent1, parent2) {
       const child = new DNA();
       
       // Average traits with some randomness
       child.size = this.blendTrait(parent1.size, parent2.size);
       child.speed = this.blendTrait(parent1.speed, parent2.speed);
       child.agility = this.blendTrait(parent1.agility, parent2.agility);
       child.maxHealth = this.blendTrait(parent1.maxHealth, parent2.maxHealth);
       child.maxEnergy = this.blendTrait(parent1.maxEnergy, parent2.maxEnergy);
       child.lifespan = this.blendTrait(parent1.lifespan, parent2.lifespan);
       child.visionRange = this.blendTrait(parent1.visionRange, parent2.visionRange);
       child.aggression = this.blendTrait(parent1.aggression, parent2.aggression);
       child.social = this.blendTrait(parent1.social, parent2.social);
       child.intelligence = this.blendTrait(parent1.intelligence, parent2.intelligence);
       child.carnivorousness = this.blendTrait(parent1.carnivorousness, parent2.carnivorousness);
       
       return child;
   }
   
   static blendTrait(trait1, trait2) {
       const blend = Random.float(0.3, 0.7);
       return trait1 * blend + trait2 * (1 - blend);
   }
   
   mutate(mutationRate = 0.1, mutationStrength = 0.1) {
       this.size = Random.mutate(this.size, mutationRate, mutationStrength);
       this.speed = Random.mutate(this.speed, mutationRate, mutationStrength);
       this.agility = Random.mutate(this.agility, mutationRate, mutationStrength);
       this.maxHealth = Random.mutate(this.maxHealth, mutationRate, mutationStrength);
       this.maxEnergy = Random.mutate(this.maxEnergy, mutationRate, mutationStrength);
       this.lifespan = Random.mutate(this.lifespan, mutationRate, mutationStrength);
       this.visionRange = Random.mutate(this.visionRange, mutationRate, mutationStrength);
       this.aggression = Random.mutate(this.aggression, mutationRate, mutationStrength);
       this.social = Random.mutate(this.social, mutationRate, mutationStrength);
       this.intelligence = Random.mutate(this.intelligence, mutationRate, mutationStrength);
       this.carnivorousness = Random.mutate(this.carnivorousness, mutationRate, mutationStrength);
       
       // Ensure values stay within reasonable bounds
       this.size = Math.max(3, Math.min(30, this.size));
       this.speed = Math.max(10, Math.min(150, this.speed));
       this.agility = Math.max(0.1, Math.min(5, this.agility));
       this.maxHealth = Math.max(20, Math.min(300, this.maxHealth));
       this.maxEnergy = Math.max(50, Math.min(1000, this.maxEnergy));
       this.lifespan = Math.max(30, Math.min(500, this.lifespan));
       this.visionRange = Math.max(20, Math.min(200, this.visionRange));
       this.aggression = Math.max(0, Math.min(1, this.aggression));
       this.social = Math.max(0, Math.min(1, this.social));
       this.intelligence = Math.max(0, Math.min(1, this.intelligence));
       this.carnivorousness = Math.max(0, Math.min(1, this.carnivorousness));
   }
   
   clone() {
       const copy = new DNA();
       copy.size = this.size;
       copy.speed = this.speed;
       copy.agility = this.agility;
       copy.maxHealth = this.maxHealth;
       copy.maxEnergy = this.maxEnergy;
       copy.lifespan = this.lifespan;
       copy.visionRange = this.visionRange;
       copy.aggression = this.aggression;
       copy.social = this.social;
       copy.intelligence = this.intelligence;
       copy.carnivorousness = this.carnivorousness;
       return copy;
   }
}