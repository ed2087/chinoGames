class MaterialManager {
    constructor() {
        this.materials = {
            wood: {
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0.0,
                density: 600,
                friction: 0.8,
                restitution: 0.3,
                hitPoints: 5,
                breakForce: 2000,
                sound: 'wood'
            },
            glass: {
                color: 0x87CEEB,
                roughness: 0.05,
                metalness: 0.0,
                opacity: 0.3,
                transparent: true,
                density: 2500,
                friction: 0.1,
                restitution: 0.1,
                hitPoints: 3,
                breakForce: 800,
                sound: 'glass'
            },
            ice: {
                color: 0xDDEEFF,
                roughness: 0.1,
                metalness: 0.0,
                opacity: 0.6,
                transparent: true,
                density: 920,
                friction: 0.05,
                restitution: 0.2,
                hitPoints: 4,
                breakForce: 1200,
                sound: 'ice'
            },
            metal: {
                color: 0xC0C0C0,
                roughness: 0.2,
                metalness: 1.0,
                density: 7800,
                friction: 0.4,
                restitution: 0.6,
                hitPoints: 8,
                breakForce: 5000,
                sound: 'metal'
            }
        };
        
        this.physicsMaterials = {};
        this.threeMaterials = {};
        
        this.initializeMaterials();
    }
    
    initializeMaterials() {
        Object.keys(this.materials).forEach(materialName => {
            const props = this.materials[materialName];
            
            // Create Cannon.js physics material
            this.physicsMaterials[materialName] = new CANNON.Material(materialName);
            this.physicsMaterials[materialName].friction = props.friction;
            this.physicsMaterials[materialName].restitution = props.restitution;
            
            // Create Three.js visual material with procedural textures
            const materialProps = {
                color: props.color,
                roughness: props.roughness,
                metalness: props.metalness
            };
            
            if (props.transparent) {
                materialProps.transparent = true;
                materialProps.opacity = props.opacity;
            }
            
            // Add procedural textures based on material type
            switch (materialName) {
                case 'wood':
                    materialProps.map = this.createWoodTexture();
                    break;
                case 'glass':
                    materialProps.envMapIntensity = 1.0;
                    materialProps.reflectivity = 0.9;
                    break;
                case 'ice':
                    materialProps.map = this.createIceTexture();
                    materialProps.reflectivity = 0.7;
                    break;
                case 'metal':
                    materialProps.map = this.createMetalTexture();
                    break;
            }
            
            this.threeMaterials[materialName] = new THREE.MeshStandardMaterial(materialProps);
        });
    }
    
    createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Wood grain pattern
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#A0522D');
        gradient.addColorStop(0.6, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add wood grain lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 256; i += 8) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.1) * 3);
            ctx.lineTo(256, i + Math.sin(i * 0.1) * 3);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        return texture;
    }
    
    createIceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Ice crystal pattern
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#E6F3FF');
        gradient.addColorStop(1, '#CCE6FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add ice crystals
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 20 + 10;
            
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                const px = x + Math.cos(angle) * size;
                const py = y + Math.sin(angle) * size;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Brushed metal pattern
        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.5, '#C0C0C0');
        gradient.addColorStop(1, '#A0A0A0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add metal brushing lines
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 256; i += 2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + Math.random() * 4 - 2, 256);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
        return texture;
    }
    
    getPhysicsMaterial(materialName) {
        return this.physicsMaterials[materialName];
    }
    
    getThreeMaterial(materialName) {
        return this.threeMaterials[materialName];
    }
    
    getMaterialProperties(materialName) {
        return this.materials[materialName];
    }
    
    createFragmentMaterial(baseMaterial, intensity = 1.0) {
        const baseMat = this.threeMaterials[baseMaterial];
        const fragmentMaterial = baseMat.clone();
        
        // Make fragments slightly darker and more rough
        fragmentMaterial.color.multiplyScalar(0.8);
        fragmentMaterial.roughness = Math.min(1.0, fragmentMaterial.roughness + 0.2);
        
        return fragmentMaterial;
    }
}