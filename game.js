// Matter.js Aliases
const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint, Constraint } = Matter;

// 🔹 Global SETTINGS (Auto-Adjusted)
const SETTINGS = {
    gravity: 1,
    numShapes: 10, // Will be adjusted dynamically
    shapeMinSize: 20,
    shapeMaxSize: 80,
    numChains: 2, // Will be adjusted dynamically
    chainLinks: 7,
    chainSpacing: 700,
    nextButtonDelay: 5000,
    airResistance: 0.01,
    angularDamping: 0.1,
    lightSource: { x: 400, y: 100 }
};

// Create Physics Engine
const engine = Engine.create();
const world = engine.world;
world.gravity.y = SETTINGS.gravity;

// Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 🔹 Resize Canvas for Any Device
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Matter.js Renderer
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: "black"
    }
});
Render.run(render);

// Run Matter.js Engine
const runner = Runner.create();
Runner.run(runner, engine);

// 🔹 FPS Counter
let fps = 0;
let lastFrameTime = performance.now();
const fpsDisplay = document.createElement("div");
fpsDisplay.style.position = "absolute";
fpsDisplay.style.top = "10px";
fpsDisplay.style.left = "10px";
fpsDisplay.style.color = "white";
fpsDisplay.style.fontSize = "16px";
fpsDisplay.innerText = "FPS: --";
document.body.appendChild(fpsDisplay);

function updateFPS() {
    let now = performance.now();
    fps = Math.round(1000 / (now - lastFrameTime));
    lastFrameTime = now;
    fpsDisplay.innerText = `FPS: ${fps}`;
}
setInterval(updateFPS, 1000);

// 🔹 Adaptive Object Scaling Based on Device Size
function adjustSettings() {
    let width = window.innerWidth;

    if (width < 800) {
        SETTINGS.numShapes = 8;
        SETTINGS.numChains = 1;
        SETTINGS.chainLinks = 5;
    } else if (width < 1200) {
        SETTINGS.numShapes = 10;
        SETTINGS.numChains = 2;
        SETTINGS.chainLinks = 4;
    } else {
        SETTINGS.numShapes = 30;
        SETTINGS.numChains = 5;
        SETTINGS.chainLinks = 8;
    }
}
adjustSettings();
window.addEventListener("resize", adjustSettings);

// 🔹 Create Boundaries (Keep Everything Inside the Screen)
function createBoundaries() {
    let ground = Bodies.rectangle(canvas.width / 2, canvas.height, canvas.width, 50, { isStatic: true });
    let leftWall = Bodies.rectangle(0, canvas.height / 2, 50, canvas.height, { isStatic: true });
    let rightWall = Bodies.rectangle(canvas.width, canvas.height / 2, 50, canvas.height, { isStatic: true });
    let ceiling = Bodies.rectangle(canvas.width / 2, 0, canvas.width, 50, { isStatic: true });

    World.add(world, [ground, leftWall, rightWall, ceiling]);
}

// 🔹 Spawn Random Shapes
function spawnShapes() {
    let colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FFAFCC", "#A2D2FF", "#BDB2FF"];

    for (let i = 0; i < SETTINGS.numShapes; i++) {
        let size = Math.random() * (SETTINGS.shapeMaxSize - SETTINGS.shapeMinSize) + SETTINGS.shapeMinSize;
        let color = colors[Math.floor(Math.random() * colors.length)];
        let shapeType = Math.random() > 0.5 ? "circle" : "rectangle";

        let shape;
        if (shapeType === "circle") {
            shape = Bodies.circle(Math.random() * canvas.width, Math.random() * canvas.height / 2, size / 2, {
                restitution: 0.8,
                friction: 0.5,
                render: { fillStyle: color },
                airResistance: SETTINGS.airResistance,
                angularDamping: SETTINGS.angularDamping
            });
        } else {
            shape = Bodies.rectangle(Math.random() * canvas.width, Math.random() * canvas.height / 2, size, size, {
                restitution: 0.8,
                friction: 0.5,
                render: { fillStyle: color },
                airResistance: SETTINGS.airResistance,
                angularDamping: SETTINGS.angularDamping
            });
        }

        World.add(world, shape);
    }
}

// 🔹 Spawn Chains
function spawnChains() {
    let colors = ["#FFFFFF", "#A2D2FF", "#FFAFCC"];
    let startX = (canvas.width - (SETTINGS.numChains - 1) * SETTINGS.chainSpacing) / 2;

    for (let i = 0; i < SETTINGS.numChains; i++) {
        let base = Bodies.circle(startX + i * SETTINGS.chainSpacing, 50, 10, { isStatic: true });
        let lastBody = base;

        for (let j = 0; j < SETTINGS.chainLinks; j++) {
            let size = 30;
            let body = Bodies.circle(lastBody.position.x, lastBody.position.y + size, size / 2, {
                restitution: 0.6,
                friction: 0.5,
                render: { fillStyle: colors[Math.floor(Math.random() * colors.length)] },
                airResistance: SETTINGS.airResistance,
                angularDamping: SETTINGS.angularDamping
            });

            let constraint = Constraint.create({
                bodyA: lastBody,
                bodyB: body,
                length: size,
                stiffness: 0.5
            });

            World.add(world, [body, constraint]);
            lastBody = body;
        }

        World.add(world, base);
    }
}

// 🔹 Allow User to Drag Shapes
function enableDragging() {
    let mouse = Mouse.create(render.canvas);
    let mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });

    World.add(world, mouseConstraint);
    render.mouse = mouse;
}

// 🔹 Add "Next" Button
function showNextButton() {
    let button = document.createElement("button");
    button.innerText = "Next";
    button.style.position = "absolute";
    button.style.top = "20px";
    button.style.right = "20px";
    button.style.padding = "10px 20px";
    button.style.fontSize = "20px";
    button.style.background = "white";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.onclick = () => window.location.href = "/next";

    document.body.appendChild(button);
}

// 🔹 Initialize Everything
function startGame() {
    createBoundaries();
    spawnShapes();
    spawnChains();
    enableDragging();
    setTimeout(showNextButton, SETTINGS.nextButtonDelay);
}
window.onload = startGame;

