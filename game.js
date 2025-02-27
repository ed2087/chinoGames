const maxWidth = 1300;
const maxHeight = 768;

// Detect the actual screen size
const screenWidth = Math.min(window.innerWidth, maxWidth);
const screenHeight = Math.min(window.innerHeight, maxHeight);

console.log("Screen Detected Width:", screenWidth);
console.log("Screen Detected Height:", screenHeight);

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: screenWidth,
    height: screenHeight,
    backgroundColor: "#ffcc66",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

let game = new Phaser.Game(config);

// === CONTROL VARIABLES ===
const trayX = config.width / 1.7;
const trayY = config.height - 400;
const trayWidth = 500;
const trayHeight = 330;
const trayScale = 0.8;

const menuFoodSize = 60;
const draggedFoodSize = 35;
const placedFoodSize = 30;

const foodMenuX = 140;
const foodMenuY = 180;
const foodMenuSpacing = 10;

const trashX = config.width / 2;
const trashY = config.height - 80;
const trashScale = 0.25;

const buttonScale = 0.8;
const buttonHoverScale = 1.1;

const totalFoodImages = 709;
const numFoodToLoad = 6;

let foodTray = [];
let trayZone;
let emitter;
let randomFoodImages = [];
let trashCan;
let menuFoodSprites = [];
let foodCounter = 0;
let currentFoodIndex = 1;

function preload() {
    this.load.image("particle", "sprites/particle.png");
    this.load.image("trashCan", "gameUtils/trash.png");
    this.load.image("trayTexture", "gameUtils/tray.png");
    loadNextFoodImages(this);
}

function loadNextFoodImages(scene) {
    randomFoodImages = [];

    for (let i = 0; i < numFoodToLoad; i++) {
        let foodId = currentFoodIndex;
        randomFoodImages.push(foodId);
        scene.load.image(`food${foodId}`, `sprites/FortressSide_Pack25_Fast_food_ (${foodId}).png`);

        currentFoodIndex++;
        if (currentFoodIndex > totalFoodImages) {
            currentFoodIndex = 1;
        }
    }
}

function create() {
    let tray = this.add.image(trayX, trayY, "trayTexture").setScale(trayScale);
    tray.displayWidth = trayWidth;
    tray.displayHeight = trayHeight;

    trayZone = this.add.zone(trayX, trayY, trayWidth, trayHeight);
    this.physics.world.enable(trayZone);
    trayZone.body.setAllowGravity(false);
    trayZone.body.moves = false;

    let particles = this.add.particles("particle");
    emitter = particles.createEmitter({
        speed: 200,
        scale: { start: 0.5, end: 0 },
        blendMode: "ADD",
        lifespan: 500
    });

    trashCan = this.add.image(trashX, trashY, "trashCan")
        .setScale(trashScale)
        .setInteractive();

    createSideMenu(this);

    let nextButton = createButton(this, 50, 50, "➡ Next Food", 0xff5733, () => {
        menuFoodSprites = menuFoodSprites.filter(food => {
            if (!food.isDragged) {
                food.destroy();
                return false;
            }
            return true;
        });

        loadNextFoodImages(this);

        this.load.once("complete", () => {
            createSideMenu(this);
        });

        this.load.start();
    });

    let doneButton = createButton(this, config.width - 250, 50, "✅ DONE", 0x28a745, () => {
        let savedMeals = JSON.parse(localStorage.getItem("savedMeals")) || [];
        savedMeals.push(foodTray.map(item => ({ key: item.key, id: item.id })));
        localStorage.setItem("savedMeals", JSON.stringify(savedMeals));

        window.location.href = "saved.html";
    });

    this.input.on("dragstart", (pointer, gameObject) => {
        gameObject.setScale(draggedFoodSize / 100);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

    this.input.on("dragend", (pointer, gameObject) => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), trayZone.getBounds())) {
            gameObject.setScale(placedFoodSize / 100);

            if (!gameObject.isDragged) {
                gameObject.isDragged = true;
                gameObject.draggedFoodID = foodCounter++; // Unique ID for dragged food
                foodTray.push({ sprite: gameObject, key: gameObject.texture.key, id: gameObject.draggedFoodID });
            }
        } 
        else if (Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), trashCan.getBounds())) {
            emitter.explode(10, gameObject.x, gameObject.y);
            gameObject.destroy();

            foodTray = foodTray.filter(item => item.sprite !== gameObject);
        } 
        else {
            gameObject.x = gameObject.originalX;
            gameObject.y = gameObject.originalY;
            gameObject.setScale(menuFoodSize / 100);
        }
    });
}

function createButton(scene, x, y, text, color, callback) {
    let button = scene.add.text(x, y, text, {
        fontSize: "30px",
        fill: "#fff",
        backgroundColor: Phaser.Display.Color.GetColor(color >> 16, (color >> 8) & 255, color & 255),
        padding: { x: 15, y: 10 },
        fontStyle: "bold",
        borderRadius: 8
    })
    .setInteractive()
    .setStroke("#000", 4)
    .setShadow(3, 3, "#444", 5)
    .setScale(buttonScale);

    button.on("pointerover", () => {
        scene.tweens.add({
            targets: button,
            scaleX: buttonHoverScale,
            scaleY: buttonHoverScale,
            duration: 150,
            ease: "Power1"
        });
    });

    button.on("pointerout", () => {
        scene.tweens.add({
            targets: button,
            scaleX: buttonScale,
            scaleY: buttonScale,
            duration: 150,
            ease: "Power1"
        });
    });

    button.on("pointerdown", callback);

    return button;
}

function createSideMenu(scene) {
    randomFoodImages.forEach((foodId, index) => {
        let foodSprite = scene.add.image(
            foodMenuX, 
            foodMenuY + (menuFoodSize + foodMenuSpacing) * index, 
            `food${foodId}`
        )
        .setScale(menuFoodSize / 500)
        .setInteractive();

        foodSprite.menuFoodID = ++foodCounter; // Assign unique ID
        foodSprite.isDragged = false;

        foodSprite.originalX = foodSprite.x;
        foodSprite.originalY = foodSprite.y;

        scene.input.setDraggable(foodSprite);
        menuFoodSprites.push(foodSprite);
    });
}

function update() {}
