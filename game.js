// // Matter.js Aliases
const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint, Composite, Constraint, Events } = Matter;

// 🔹 Global Configuration Object
const CONFIG = {
    engine: Engine.create(),
    world: null,
    runner: Runner.create(),
    canvas: document.getElementById("gameCanvas"),
    ctx: null,
    render: null,

    // Settings
    settings: {
        gravity: 0.5,
        numShapes: 10,
        shapeMinSize: 20,
        shapeMaxSize: 80,
        numChains: 2,
        chainLinks: 7,
        nextButtonDelay: 5000,
        airResistance: 0.01,
        angularDamping: 0.1,
        wallsPadding: 100,
        outOfBoundsThreshold: 300, // Detect & remove off-screen objects
    },

    fps: 0,
    lastFrameTime: performance.now(),
    fpsDisplay: null,

    shapeColors: ["#D72638", "#3E92CC", "#F49D37", "#5A189A", "#3A5A40", "#FFBA08"],
    chainColors: ["#FFFFFF", "#A2D2FF", "#FFAFCC"],

    nextUrl: "/contact",
};

// Initialize the World
CONFIG.world = CONFIG.engine.world;
CONFIG.world.gravity.y = CONFIG.settings.gravity;

// Initialize Canvas
CONFIG.ctx = CONFIG.canvas.getContext("2d");

// 🔹 Resize Canvas AFTER initializing render
function handleResize() {
    if (!CONFIG.render) return; // Prevent error if render isn't ready

    CONFIG.canvas.width = window.innerWidth;
    CONFIG.canvas.height = window.innerHeight;

    CONFIG.render.options.width = CONFIG.canvas.width;
    CONFIG.render.options.height = CONFIG.canvas.height;

    Composite.clear(CONFIG.world, false); // Keep objects, clear boundaries
    createBoundaries();
}

// Attach resize & orientation events
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);
handleResize(); // Call it after everything is set up


function showNextButton() {
    let button = document.createElement("button");
    button.innerText = "Next";
    Object.assign(button.style, { position: "absolute", top: "20px", right: "20px", padding: "10px 20px", fontSize: "20px", background: "white", border: "none", cursor: "pointer" });
    button.onclick = () => window.location.href = CONFIG.nextUrl;
    document.body.appendChild(button);
}

// 🔹 Initialize Matter.js Renderer
CONFIG.render = Render.create({
    canvas: CONFIG.canvas,
    engine: CONFIG.engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "black",
    }
});
Render.run(CONFIG.render);
Runner.run(CONFIG.runner, CONFIG.engine);

// 🔹 FPS Counter
CONFIG.fpsDisplay = document.createElement("div");
Object.assign(CONFIG.fpsDisplay.style, {
    position: "absolute",
    top: "10px",
    left: "10px",
    color: "white",
    fontSize: "16px",
});
CONFIG.fpsDisplay.innerText = "FPS: --";
document.body.appendChild(CONFIG.fpsDisplay);

function updateFPS() {
    let now = performance.now();
    CONFIG.fps = Math.round(1000 / (now - CONFIG.lastFrameTime));
    CONFIG.lastFrameTime = now;
    CONFIG.fpsDisplay.innerText = `FPS: ${CONFIG.fps}`;
    
    adjustSettings(); // 🔥 Re-added FPS-based scaling

    requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);

// 🔹 Adaptive Object Scaling Based on FPS
function adjustSettings() {
    let width = window.innerWidth;
    let numShapes = 100, numChains = 5, chainLinks = 10;

    if (width < 800) {
        numShapes = 8;
        numChains = 1;
        chainLinks = 5;
    } else if (width < 1200) {
        numShapes = 20;
        numChains = 2;
        chainLinks = 4;
    }

    if (CONFIG.fps < 30) {
        numShapes = Math.max(5, numShapes - 10);
        numChains = Math.max(1, numChains - 1);
        chainLinks = Math.max(3, chainLinks - 2);
    } else if (CONFIG.fps > 50) {
        numShapes += 20;
        numChains += 2;
        chainLinks += 3;
    }

    CONFIG.settings.numShapes = numShapes;
    CONFIG.settings.numChains = numChains;
    CONFIG.settings.chainLinks = chainLinks;
}

// 🔹 Create Boundaries
function createBoundaries() {
    let boundaries = [
        Bodies.rectangle(CONFIG.canvas.width / 2, CONFIG.canvas.height, CONFIG.canvas.width, CONFIG.settings.wallsPadding, { 
            isStatic: true, label: "boundary", render: { fillStyle: "#A9A9A9" } // Concrete color
        }),
        Bodies.rectangle(0, CONFIG.canvas.height / 2, CONFIG.settings.wallsPadding, CONFIG.canvas.height, { 
            isStatic: true, label: "boundary", render: { fillStyle: "#B22222" } // Brick red
        }),
        Bodies.rectangle(CONFIG.canvas.width, CONFIG.canvas.height / 2, CONFIG.settings.wallsPadding, CONFIG.canvas.height, { 
            isStatic: true, label: "boundary", render: { fillStyle: "#B22222" } // Brick red
        }),
        Bodies.rectangle(CONFIG.canvas.width / 2, 0, CONFIG.canvas.width, CONFIG.settings.wallsPadding, { 
            isStatic: true, label: "boundary", render: { fillStyle: "#A9A9A9" } // Concrete color
        })
        
    ];
    Composite.add(CONFIG.world, boundaries);
}

// 🔹 Spawn Random Shapes
function spawnShapes() {
    for (let i = 0; i < CONFIG.settings.numShapes; i++) {
        let x = Math.random() * CONFIG.canvas.width;
        let y = Math.random() * CONFIG.canvas.height / 2;
        let size = Math.random() * (CONFIG.settings.shapeMaxSize - CONFIG.settings.shapeMinSize) + CONFIG.settings.shapeMinSize;
        let color = CONFIG.shapeColors[Math.floor(Math.random() * CONFIG.shapeColors.length)];

        // 🔹 Create a shadow (slightly darker, offset behind)
        let shadow = Bodies.rectangle(x + 5, y + 5, size, size, {
            isStatic: true, 
            isSensor: true,  // ✅ Shadow won't affect physics
            render: { fillStyle: "rgba(0,0,0,0.2)", strokeStyle: "transparent" }
        });
        

        // 🔹 Main block
        let shape = Bodies.rectangle(x, y, size, size, {
            restitution: 0.2,
            friction: 0.5,
            density: 0.01,
            render: { 
                fillStyle: color,
                strokeStyle: "#000000", // Black outline
                lineWidth: 4 
            }
        });

        World.add(CONFIG.world, [shadow, shape]); // Add both the shadow and block
    }
}


// 🔹 Spawn Chains (Fix Restored)
function spawnChains() {
    let startX = CONFIG.canvas.width / 2;

    for (let i = 0; i < CONFIG.settings.numChains; i++) {
        let base = Bodies.circle(startX + i * 100, 50, 10, { isStatic: true, label: "chainBase" });
        let lastBody = base;

        for (let j = 0; j < CONFIG.settings.chainLinks; j++) {
            let body = Bodies.circle(lastBody.position.x, lastBody.position.y + 30, 15, { restitution: 0.6, label: "chainLink" });
            let constraint = Constraint.create({ bodyA: lastBody, bodyB: body, length: 30, stiffness: 0.8 });

            World.add(CONFIG.world, [body, constraint]);
            lastBody = body;
        }
        World.add(CONFIG.world, base);
    }
}

// 🔹 Enable Dragging
function enableDragging() {
    let mouse = Mouse.create(CONFIG.render.canvas);
    let mouseConstraint = MouseConstraint.create(CONFIG.engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });

    World.add(CONFIG.world, mouseConstraint);
    CONFIG.render.mouse = mouse;
}

// 🔹 Collision Handling
function handleCollisions(event) {
    event.pairs.forEach(pair => {
        let bodyA = pair.bodyA;
        let bodyB = pair.bodyB;

        if (bodyA.label.includes("boundary") || bodyB.label.includes("boundary") ||
            bodyA.label.includes("chainLink") || bodyB.label.includes("chainLink")) {
            return;
        }

        // bodyA.render.fillStyle = "#FF0000";
        // bodyB.render.fillStyle = "#FF0000";
    });
}
Events.on(CONFIG.engine, "collisionStart", handleCollisions);

// 🔹 Start the Game
function startGame() {
    createBoundaries();
    spawnShapes();
    spawnChains();
    enableDragging();
    setTimeout(showNextButton, CONFIG.settings.nextButtonDelay);
}
window.onload = startGame;
