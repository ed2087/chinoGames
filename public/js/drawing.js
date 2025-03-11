console.log("Drawing app loaded!");
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const drawingAudio = document.getElementById("drawingAudio");
const fullscreenButton = document.getElementById("fullscreenButton");

let lineWidth = 8;
let drawing = false;
let hue = 0;

// 📏 Resize Canvas & Restore Previous Drawing
function resizeCanvas() {
    try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Restore saved drawing (if available)
        const savedImage = localStorage.getItem("drawingCanvas");
        if (savedImage) {
            let img = new Image();
            img.src = savedImage;
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    } catch (e) {
        console.error("localStorage error:", e);
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// 🎨 Start Drawing - Now audio plays continuously
function startDrawing(e) {
    console.log("Drawing started!");
    e.preventDefault();
    drawing = true;
    ctx.beginPath();
    draw(e);

    // 🔊 Only play audio if it's NOT already playing
    if (drawingAudio.paused) {
        drawingAudio.loop = true; // Ensure looping is enabled
        drawingAudio.play().catch(err => console.warn("Audio play blocked:", err));
    }
}

// 🚫 Stop Drawing - No more stopping the audio!
function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    saveDrawing();
    
    // 🔊 Don't stop the audio, let it play continuously
}


// 🚫 Stop Drawing
function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    saveDrawing();

    // 🔊 Stop the sound when drawing stops
    drawingAudio.pause();
    drawingAudio.currentTime = 0;
}

// 🖍️ Draw on Canvas
function draw(e) {
    if (!drawing) return;

    let x = e.clientX || (e.touches && e.touches[0].clientX);
    let y = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    hue = (hue + 2) % 360;
}

// 🧹 Clear Canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem("drawingCanvas");

    // 🔇 Stop audio when clearing
    drawingAudio.pause();
    drawingAudio.currentTime = 0;
}


// 🔲 **Force Fullscreen Fix**
function requestFullScreen() {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.error("Fullscreen error:", err));
        } else if (docEl.mozRequestFullScreen) { 
            docEl.mozRequestFullScreen();
        } else if (docEl.webkitRequestFullscreen) { 
            docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) { 
            docEl.msRequestFullscreen();
        }
    }
}

// 📺 **Fix: Fullscreen Must Be Triggered by User**
fullscreenButton.addEventListener("click", requestFullScreen);

// 💾 Save Drawing
function saveDrawing() {
    try {
        localStorage.setItem("drawingCanvas", canvas.toDataURL());
    } catch (e) {
        console.error("localStorage save error:", e);
    }
}

// ➕ Increase Line Width
function increaseLineWidth() {
    if (lineWidth < 30) {
        lineWidth += 2;
        document.getElementById("lineWidthDisplay").textContent = lineWidth;
    }
}

// ➖ Decrease Line Width
function decreaseLineWidth() {
    if (lineWidth > 2) {
        lineWidth -= 2;
        document.getElementById("lineWidthDisplay").textContent = lineWidth;
    }
}

// 🖱️ Add Mouse & Touch Event Listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDrawing);

// 🎮 Optimized Game Loop
function gameLoop() {
    requestAnimationFrame(gameLoop);
}
gameLoop();
