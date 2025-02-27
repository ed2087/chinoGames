const maxWidth = 850;
const maxHeight = 768;

// Detect the actual screen size
const screenWidth = Math.min(window.innerWidth, maxWidth);
const screenHeight = Math.min(window.innerHeight, maxHeight);

console.log("Screen Detected Width:", screenWidth);
console.log("Screen Detected Height:", screenHeight);
console.log("Window Detected Width:", window.innerWidth);
console.log("Window Detected Height:", window.innerHeight);

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: screenWidth,
    height: screenHeight,
    backgroundColor: "#ffcc66",
    physics: {
        default: "arcade",
        arcade: { debug: true } // Enable debug mode
    },
    scene: { preload, create, update }
};

let game = new Phaser.Game(config);

// --- Hardcoded & Responsive Sizes ---
const trayX = config.width / 2;
const trayY = config.height - 400;
const trayWidth = 650;
const trayHeight = 400;
const menuFoodSize = 85;
const draggedFoodSize = 45;
const placedFoodSize = 40;
const maxFood = 10;
const totalFoodImages = 709; 
const numFoodToLoad = 100;

let foodTray = [];
let trayZone;
let foodSprites = [];
let emitter;
let randomFoodImages = [];

function preload() {
    this.load.image("particle", "sprites/particle.png"); // Particle for food explosion

    // Generate random unique food images
    let availableImages = Array.from({ length: totalFoodImages }, (_, i) => i + 1);
    for (let i = 0; i < numFoodToLoad; i++) {
        let randomIndex = Math.floor(Math.random() * availableImages.length);
        let foodId = availableImages.splice(randomIndex, 1)[0];
        randomFoodImages.push(foodId);
        this.load.image(`food${foodId}`, `sprites/FortressSide_Pack25_Fast_food_ (${foodId}).png`);
    }
}

function create() {
    // Debugging Info
    console.log("Game canvas width:", config.width);
    console.log("Game canvas height:", config.height);
    console.log("Tray X:", trayX);
    console.log("Tray Y:", trayY);
    console.log("Tray Width:", trayWidth);
    console.log("Tray Height:", trayHeight);
    console.log("Loaded Food Images:", randomFoodImages);

    // Draw game area border
    let gameDebugBorder = this.add.graphics();
    gameDebugBorder.lineStyle(5, 0x00ff00, 1);
    gameDebugBorder.strokeRect(0, 0, config.width, config.height);

    // Draw the tray
    let trayGraphics = this.add.graphics();
    trayGraphics.fillStyle(0x888888, 1);
    trayGraphics.fillRect(trayX - trayWidth / 2, trayY - trayHeight / 2, trayWidth, trayHeight);

    // Tray debug border
    let debugBorder = this.add.graphics();
    debugBorder.lineStyle(5, 0xff0000, 1);
    debugBorder.strokeRect(trayX - trayWidth / 2, trayY - trayHeight / 2, trayWidth, trayHeight);

    // Define tray drop zone
    trayZone = this.add.zone(trayX, trayY, trayWidth, trayHeight);
    this.physics.world.enable(trayZone);
    trayZone.body.setAllowGravity(false);
    trayZone.body.moves = false;

    // Particle system for food explosion
    let particles = this.add.particles("particle");

    emitter = particles.createEmitter({
        speed: 200,
        scale: { start: 0.5, end: 0 },
        blendMode: "ADD",
        lifespan: 500
    });

    // Populate the HTML food menu
    let menu = document.getElementById("food-menu");
    randomFoodImages.forEach(foodId => {
        let img = document.createElement("img");
        let foodPath = `sprites/FortressSide_Pack25_Fast_food_ (${foodId}).png`; // 🔥 Save correct image path
        img.src = foodPath;
        img.draggable = true;
        img.dataset.foodName = `food${foodId}`;
        img.dataset.foodPath = foodPath; // 🔥 Store path for saving
        img.style.width = `${menuFoodSize}px`;
        img.style.height = `${menuFoodSize}px`;
        img.addEventListener("click", handleFoodClick);
        img.addEventListener("touchstart", handleFoodTouch, { passive: false });
        menu.appendChild(img);
    });

    // Drag events
    this.input.on("dragstart", (pointer, gameObject) => {
        gameObject.setScale(draggedFoodSize / 100);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

    this.input.on("dragend", (pointer, gameObject) => {
        // Check if dropped on tray
        if (Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), trayZone.getBounds())) {
            gameObject.setScale(placedFoodSize / 100);
            foodTray.push({ key: gameObject.texture.key, x: gameObject.x, y: gameObject.y, path: gameObject.texture.key.replace("food", "sprites/FortressSide_Pack25_Fast_food_ (") + ").png" }); // 🔥 Save correct path
        } else {
            emitter.explode(10, gameObject.x, gameObject.y);
            gameObject.destroy();
        }
    });

    // DONE button with animation
    let doneButton = this.add.text(config.width - 250, 50, "DONE", {
        fontSize: "50px",
        fill: "#fff",
        backgroundColor: "#ff5733",
        padding: { x: 10, y: 10 },
        fontStyle: "bold"
    })
    .setInteractive()
    .setStroke("#ff0000", 8)
    .setShadow(2, 2, "#000", 5)
    .setScale(1);

    // Button hover effects
    doneButton.on("pointerover", () => {
        doneButton.setScale(1.4);
    });

    doneButton.on("pointerout", () => {
        doneButton.setScale(1);
    });

    // Save meal & switch to saved.html
    doneButton.on("pointerdown", () => {
        let savedMeals = JSON.parse(localStorage.getItem("savedMeals")) || [];
        savedMeals.push(foodTray);
        localStorage.setItem("savedMeals", JSON.stringify(savedMeals));

        window.location.href = "saved.html";
    });
}

// Handle food click from HTML menu
function handleFoodClick(event) {
    let foodKey = event.target.dataset.foodName;
    let foodPath = event.target.dataset.foodPath; // 🔥 Get correct image path
    let scene = game.scene.scenes[0];

    console.log("Food Spawned:", foodPath);

    let foodSprite = scene.add.image(config.width / 2, config.height / 2 - 100, foodKey)
        .setScale(placedFoodSize / 100)
        .setInteractive();

    foodSprite.setData("foodPath", foodPath); // 🔥 Store path for saving
    scene.input.setDraggable(foodSprite);
}

// Handle touch support for mobile
function handleFoodTouch(event) {
    event.preventDefault();
    let foodKey = event.target.dataset.foodName;
    let foodPath = event.target.dataset.foodPath; // 🔥 Get correct image path
    let scene = game.scene.scenes[0];

    let foodSprite = scene.add.image(config.width / 2, config.height / 2 - 100, foodKey)
        .setScale(placedFoodSize / 100)
        .setInteractive();

    foodSprite.setData("foodPath", foodPath); // 🔥 Store path for saving
    scene.input.setDraggable(foodSprite);
}

function update() {}
