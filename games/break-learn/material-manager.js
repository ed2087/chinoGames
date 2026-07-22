class MaterialManager {
    constructor() {
        // Each "material" is now a Poke Ball type - different look, different
        // toughness (hitPoints), same break-physics machinery as before.
        this.materials = {
            pokeball: {
                label: 'Poke Ball',
                topColor: '#EE1515',
                bottomColor: '#F5F5F5',
                bandColor: '#1D1D1D',
                buttonColor: '#F5F5F5',
                color: 0xEE1515,
                roughness: 0.35,
                metalness: 0.05,
                density: 900,
                friction: 0.3,
                restitution: 0.6,
                hitPoints: 4,
                breakForce: 900,
                sound: 'pokeball'
            },
            greatball: {
                label: 'Great Ball',
                topColor: '#3B82C4',
                bottomColor: '#F5F5F5',
                bandColor: '#1D1D1D',
                buttonColor: '#F5F5F5',
                bandAccent: '#E4292C',
                color: 0x3B82C4,
                roughness: 0.3,
                metalness: 0.08,
                density: 950,
                friction: 0.3,
                restitution: 0.55,
                hitPoints: 5,
                breakForce: 1200,
                sound: 'pokeball'
            },
            ultraball: {
                label: 'Ultra Ball',
                topColor: '#2B2B2B',
                bottomColor: '#F5F5F5',
                bandColor: '#F5C518',
                buttonColor: '#F5C518',
                color: 0x2B2B2B,
                roughness: 0.25,
                metalness: 0.15,
                density: 1000,
                friction: 0.3,
                restitution: 0.5,
                hitPoints: 6,
                breakForce: 1600,
                sound: 'pokeball'
            },
            masterball: {
                label: 'Master Ball',
                topColor: '#8E44AD',
                bottomColor: '#F48FB1',
                bandColor: '#1D1D1D',
                buttonColor: '#F5F5F5',
                color: 0x8E44AD,
                roughness: 0.2,
                metalness: 0.2,
                density: 1050,
                friction: 0.3,
                restitution: 0.5,
                hitPoints: 7,
                breakForce: 2000,
                sound: 'pokeball'
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

            // Create Three.js visual material with the ball's texture
            const materialProps = {
                color: 0xffffff,
                roughness: props.roughness,
                metalness: props.metalness,
                map: this.createBallTexture(props)
            };

            this.threeMaterials[materialName] = new THREE.MeshStandardMaterial(materialProps);
        });
    }

    // Draws a Poke Ball skin as an equirectangular texture - since
    // THREE.SphereGeometry's default UVs run latitude/longitude, horizontal
    // bands on this canvas wrap around the sphere as top/band/bottom color
    // regions, and the button only appears on the "front" meridian.
    createBallTexture(props) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Top half
        ctx.fillStyle = props.topColor;
        ctx.fillRect(0, 0, 512, 118);

        // Optional accent stripe (Great Ball's red band under the black one)
        if (props.bandAccent) {
            ctx.fillStyle = props.bandAccent;
            ctx.fillRect(0, 100, 512, 14);
        }

        // Center band
        ctx.fillStyle = props.bandColor;
        ctx.fillRect(0, 118, 512, 20);

        // Bottom half
        ctx.fillStyle = props.bottomColor;
        ctx.fillRect(0, 138, 512, 118);

        // Button (only visible on the front-facing meridian, u ~ 0.5)
        const cx = 256, cy = 128;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fillStyle = props.bandColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fillStyle = props.buttonColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - 6, cy - 6, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
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
