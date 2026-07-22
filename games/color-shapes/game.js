class ColoringGame {
    constructor() {
        this.canvas = document.getElementById('coloringCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.shapeLabel = document.querySelector('.shape-label');
        this.nextBtn = document.getElementById('nextBtn');
        this.nextBtnShown = false;

        // Game state
        this.selectedColor = null;
        this.currentShapeIndex = 0;
        this.isDrawing = false;
        this.brushSize = 25;
        this.isRandomMode = false;
        this.isTransitioning = false;
        this.targetColoredPixels = 0;
        this.progressCheckCount = 0;

        // Item rotation: 'shape' or 'pokemon'. Every 4th item (index 3, 7, 11...)
        // is a Pokemon, so players see 3 shapes then 1 Pokemon, repeating.
        this.currentType = 'shape';
        this.itemCount = 0;
        this.currentPokemonId = null;
        this.currentPokemon = null;
        this.POKEMON_MAX_ID = 151; // Gen 1 only - recognizable, simple silhouettes

        // Offscreen layers: strokes are painted onto paintCanvas (unclipped),
        // then composited through maskCanvas so coloring can never escape the
        // shape/Pokemon outline, whether that outline is a vector path or a
        // raster silhouette.
        this.paintCanvas = document.createElement('canvas');
        this.paintCtx = this.paintCanvas.getContext('2d');
        this.maskCanvas = document.createElement('canvas');
        this.scratchCanvas = document.createElement('canvas');

        // Performance optimization
        this.lastDrawTime = 0;
        this.drawThrottle = 16;

        // Touch/mouse tracking
        this.lastX = 0;
        this.lastY = 0;

        // Colors and shapes
        this.colors = [
            { name: 'Red', hex: '#FF0000' },
            { name: 'Orange', hex: '#FFA500' },
            { name: 'Yellow', hex: '#FFEB3B' },
            { name: 'Lime', hex: '#AEEA00' },
            { name: 'Green', hex: '#00AA00' },
            { name: 'Teal', hex: '#00A896' },
            { name: 'Cyan', hex: '#00E5FF' },
            { name: 'Sky Blue', hex: '#40C4FF' },
            { name: 'Blue', hex: '#0000FF' },
            { name: 'Indigo', hex: '#3F51B5' },
            { name: 'Purple', hex: '#800080' },
            { name: 'Magenta', hex: '#E91E63' },
            { name: 'Pink', hex: '#FFC0CB' },
            { name: 'Hot Pink', hex: '#FF69B4' },
            { name: 'Brown', hex: '#8B4513' },
            { name: 'Tan', hex: '#D2B48C' },
            { name: 'Gold', hex: '#FFD700' },
            { name: 'Black', hex: '#000000' },
            { name: 'Gray', hex: '#808080' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Rainbow', special: 'rainbow' },
            { name: 'Glow', special: 'glow' }
        ];

        this.shapes = [
            'Circle', 'Square', 'Triangle', 'Rectangle', 'Oval',
            'Star', 'Heart', 'Diamond', 'Pentagon', 'Hexagon'
        ];

        this.init();
    }

    init() {
        this.forceFullScreen();
        this.setupCanvas();
        this.createColorPalette();
        this.loadProgress();
        this.setupEventListeners();

        this.isTransitioning = true;
        this.resetAndDrawItem().then(() => {
            this.isTransitioning = false;
        });

        this.createCustomCursor();

        // Wait for audio permission before welcome message
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                this.speakText("Welcome to Color the Shapes! Choose a color and start coloring!");
            }, 1000);
        });
    }

    forceFullScreen() {
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) { e.preventDefault(); }
        }, { passive: false });

        document.body.style.overscrollBehavior = 'none';

        window.addEventListener('load', () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 0);
        });

        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {});
        }
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth - 40, 450);
        const maxHeight = Math.min(window.innerHeight * 0.5, 450);
        const size = Math.min(maxWidth, maxHeight);

        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalCompositeOperation = 'source-over';

        this.paintCanvas.width = size;
        this.paintCanvas.height = size;
        this.paintCtx.lineCap = 'round';
        this.paintCtx.lineJoin = 'round';

        this.brushSize = Math.max(size / 18, 20);
    }

    async resetAndDrawItem() {
        this.hideNextButton();
        this.clearCanvas();
        this.paintCtx.clearRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);

        if (this.currentType === 'pokemon') {
            await this.drawPokemonSilhouette();
        } else {
            this.drawShapeOutline();
            this.buildShapeMask();
        }

        this.updateShapeLabel();
        this.calculateTargetPixels();
        this.captureBlankSnapshot();
        this.progressCheckCount = 0;
    }

    buildShapeMask() {
        const size = this.canvas.width;
        this.maskCanvas.width = size;
        this.maskCanvas.height = size;
        const mctx = this.maskCanvas.getContext('2d');
        mctx.clearRect(0, 0, size, size);
        mctx.beginPath();
        this.buildShapePath(mctx);
        mctx.fillStyle = '#000';
        mctx.fill();
    }

    async fetchPokemonInfo(id) {
        const cacheKey = `pokemonInfo_${id}`;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);

            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!res.ok) throw new Error(`PokeAPI request failed: ${res.status}`);
            const data = await res.json();
            const artworkUrl = data.sprites && data.sprites.other &&
                data.sprites.other['official-artwork'] &&
                data.sprites.other['official-artwork'].front_default;
            if (!artworkUrl) throw new Error('No artwork available for this Pokemon');

            const info = { id, name: data.name, artworkUrl };
            localStorage.setItem(cacheKey, JSON.stringify(info));
            return info;
        } catch (err) {
            console.warn('Pokemon fetch failed:', err);
            return null;
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // Draws the current Pokemon as a solid gray silhouette (no line art - the
    // artwork itself isn't traced, just its alpha shape) and builds the same
    // kind of mask a vector shape would use. Falls back to a shape on any
    // network/API failure so a flaky connection never breaks the game.
    async drawPokemonSilhouette() {
        const info = await this.fetchPokemonInfo(this.currentPokemonId);

        let img = null;
        if (info) {
            try {
                img = await this.loadImage(info.artworkUrl);
            } catch (err) {
                console.warn('Pokemon image failed to load:', err);
            }
        }

        if (!img) {
            this.currentType = 'shape';
            this.currentPokemon = null;
            this.drawShapeOutline();
            this.buildShapeMask();
            return;
        }

        this.currentPokemon = { id: info.id, name: info.name };

        const size = this.canvas.width;
        const scale = Math.min((size * 0.7) / img.width, (size * 0.7) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        this.maskCanvas.width = size;
        this.maskCanvas.height = size;
        const mctx = this.maskCanvas.getContext('2d');
        mctx.clearRect(0, 0, size, size);
        mctx.drawImage(img, x, y, w, h);
        mctx.globalCompositeOperation = 'source-in';
        mctx.fillStyle = '#000';
        mctx.fillRect(0, 0, size, size);
        mctx.globalCompositeOperation = 'source-over';

        // Recolor a copy of the mask to gray on an isolated canvas, then
        // composite that over the background - keeps the gray strictly
        // inside the silhouette instead of painting the whole canvas.
        this.scratchCanvas.width = size;
        this.scratchCanvas.height = size;
        const sctx = this.scratchCanvas.getContext('2d');
        sctx.clearRect(0, 0, size, size);
        sctx.drawImage(this.maskCanvas, 0, 0);
        sctx.globalCompositeOperation = 'source-in';
        sctx.fillStyle = '#c7c7c7';
        sctx.fillRect(0, 0, size, size);
        sctx.globalCompositeOperation = 'source-over';

        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, size, size);
        this.ctx.drawImage(this.scratchCanvas, 0, 0);
    }

    // Counts the paintable area (mask opacity) so completion percentage
    // matches the actual shape/Pokemon on screen, not a rough guess.
    calculateTargetPixels() {
        const size = this.canvas.width;
        const data = this.maskCanvas.getContext('2d').getImageData(0, 0, size, size).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) count++;
        }
        this.targetColoredPixels = count;
    }

    captureBlankSnapshot() {
        this.blankImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    createColorPalette() {
        const palette = document.querySelector('.color-palette');
        palette.innerHTML = '';

        this.colors.forEach((color, index) => {
            const colorBtn = document.createElement('div');
            colorBtn.className = 'color-btn';
            colorBtn.dataset.colorIndex = index;
            colorBtn.title = color.name;

            if (color.special === 'rainbow') {
                colorBtn.classList.add('color-btn-rainbow');
            } else if (color.special === 'glow') {
                colorBtn.classList.add('color-btn-glow');
            } else {
                colorBtn.style.backgroundColor = color.hex;
                if (color.name === 'White') {
                    colorBtn.style.border = '3px solid #ddd';
                }
            }

            palette.appendChild(colorBtn);
        });
    }

    // Rainbow/Glow aren't a fixed hex - they cycle hue over time so the
    // brush color shifts while a kid drags across the shape.
    getBrushColor() {
        const color = this.colors[this.selectedColor];
        if (!color) return '#000000';

        if (color.special === 'rainbow') {
            const hue = (Date.now() / 8) % 360;
            return `hsl(${hue}, 90%, 55%)`;
        }
        if (color.special === 'glow') {
            const hue = (Date.now() / 15) % 360;
            return `hsl(${hue}, 100%, 65%)`;
        }
        return color.hex;
    }

    createCustomCursor() {
        if (this.cursor) {
            this.cursor.remove();
        }

        this.cursor = document.createElement('div');
        this.cursor.className = 'brush-cursor';
        document.body.appendChild(this.cursor);
        this.updateCursorSize();
    }

    updateCursorSize() {
        if (this.cursor) {
            const size = this.brushSize;
            this.cursor.style.width = size + 'px';
            this.cursor.style.height = size + 'px';
            this.cursor.style.marginLeft = -size/2 + 'px';
            this.cursor.style.marginTop = -size/2 + 'px';

            if (this.selectedColor !== null) {
                this.cursor.style.backgroundColor = this.getBrushColor();
                this.cursor.style.opacity = '0.6';
            } else {
                this.cursor.style.backgroundColor = 'transparent';
                this.cursor.style.opacity = '1';
            }
        }
    }

    setupEventListeners() {
        // Color selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-btn') && !this.isTransitioning) {
                this.selectColor(parseInt(e.target.dataset.colorIndex));
            }
        });

        // Drawing events - Mouse
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Drawing events - Touch
        this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
        this.canvas.addEventListener('touchmove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        this.canvas.addEventListener('touchcancel', this.stopDrawing.bind(this));

        // Cursor tracking
        document.addEventListener('mousemove', this.updateCursor.bind(this));
        this.canvas.addEventListener('mouseenter', () => {
            if (this.cursor) this.cursor.style.display = 'block';
        });
        this.canvas.addEventListener('mouseleave', () => {
            if (this.cursor) this.cursor.style.display = 'none';
        });

        // Shape name clicking
        this.shapeLabel.addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.speakShapeName();
            }
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.isTransitioning = true;
                this.resetAndDrawItem().then(() => {
                    this.isTransitioning = false;
                    this.speakText("Canvas cleared! Start coloring again!");
                });
            }
        });

        // Next button - shown once coloring is mostly done, advances on tap
        this.nextBtn.addEventListener('click', () => {
            if (this.nextBtnShown && !this.isTransitioning) {
                this.advanceToNextItem();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('resize', () => {
            if (!this.isTransitioning) {
                setTimeout(() => {
                    this.isTransitioning = true;
                    this.setupCanvas();
                    this.resetAndDrawItem().then(() => {
                        this.isTransitioning = false;
                    });
                }, 100);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    throttledDraw(e) {
        const now = Date.now();
        if (now - this.lastDrawTime >= this.drawThrottle) {
            this.draw(e);
            this.lastDrawTime = now;
        }
    }

    updateCursor(e) {
        if (this.cursor && !this.isTransitioning) {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
        }
    }

    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        let x, y;

        if (e.touches && e.touches[0]) {
            x = (e.touches[0].clientX - rect.left) * scaleX;
            y = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }

        return { x, y };
    }

    startDrawing(e) {
        e.preventDefault();

        if (this.selectedColor === null || this.isTransitioning) {
            if (!this.isTransitioning) {
                if (window.audioSystem && window.audioSystem.isInitialized) {
                    window.audioSystem.speak("Choose a color first!");
                } else {
                    this.speakShapeName();
                }
            }
            return;
        }

        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('pop');
        }

        this.isDrawing = true;
        const pos = this.getEventPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        const isGlow = this.colors[this.selectedColor].special === 'glow';
        const brushColor = this.getBrushColor();

        this.paintCtx.globalCompositeOperation = 'source-over';
        this.paintCtx.shadowBlur = isGlow ? 18 : 0;
        this.paintCtx.shadowColor = isGlow ? brushColor : 'transparent';
        this.paintCtx.fillStyle = brushColor;
        this.paintCtx.beginPath();
        this.paintCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, 2 * Math.PI);
        this.paintCtx.fill();

        this.compositeVisible();
    }

    draw(e) {
        e.preventDefault();

        if (!this.isDrawing || this.selectedColor === null || this.isTransitioning) return;

        const pos = this.getEventPos(e);
        const isGlow = this.colors[this.selectedColor].special === 'glow';
        const brushColor = this.getBrushColor();

        this.paintCtx.shadowBlur = isGlow ? 18 : 0;
        this.paintCtx.shadowColor = isGlow ? brushColor : 'transparent';
        this.paintCtx.strokeStyle = brushColor;
        this.paintCtx.lineWidth = this.brushSize;

        this.paintCtx.beginPath();
        this.paintCtx.moveTo(this.lastX, this.lastY);
        this.paintCtx.lineTo(pos.x, pos.y);
        this.paintCtx.stroke();

        this.compositeVisible();

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    // Restores the pristine background/outline, then draws the accumulated
    // paint strokes clipped to the mask on top. This is what keeps coloring
    // strictly inside the shape or Pokemon silhouette.
    compositeVisible() {
        if (!this.blankImageData) return;

        this.ctx.putImageData(this.blankImageData, 0, 0);

        const size = this.canvas.width;
        this.scratchCanvas.width = size;
        this.scratchCanvas.height = size;
        const sctx = this.scratchCanvas.getContext('2d');
        sctx.clearRect(0, 0, size, size);
        sctx.drawImage(this.paintCanvas, 0, 0);
        sctx.globalCompositeOperation = 'destination-in';
        sctx.drawImage(this.maskCanvas, 0, 0);
        sctx.globalCompositeOperation = 'source-over';

        this.ctx.drawImage(this.scratchCanvas, 0, 0);
    }

    stopDrawing(e) {
        if (!this.isDrawing || this.isTransitioning) return;

        this.isDrawing = false;

        this.progressCheckCount++;
        setTimeout(() => this.checkColoringProgress(), 100);
    }

    // Doesn't auto-advance - a round brush can't perfectly fill sharp corners
    // (star points, triangle tips), so demanding 100% coverage would leave
    // some shapes impossible to "finish". Instead this just reveals the Next
    // button once coloring is far enough along; the kid decides when they're done.
    checkColoringProgress() {
        if (this.isTransitioning || this.targetColoredPixels === 0 || !this.blankImageData) return;
        if (this.nextBtnShown) return;

        const current = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        const blank = this.blankImageData.data;
        let coloredPixels = 0;

        for (let i = 0; i < current.length; i += 4) {
            const dr = Math.abs(current[i] - blank[i]);
            const dg = Math.abs(current[i + 1] - blank[i + 1]);
            const db = Math.abs(current[i + 2] - blank[i + 2]);

            if (dr + dg + db > 30) {
                coloredPixels++;
            }
        }

        const coloringPercentage = (coloredPixels / this.targetColoredPixels) * 100;
        console.log(`Coloring progress: ${coloringPercentage.toFixed(1)}% (${coloredPixels}/${this.targetColoredPixels})`);

        if (coloringPercentage >= 55) {
            this.showNextButton();
        }
    }

    showNextButton() {
        if (this.nextBtnShown) return;
        this.nextBtnShown = true;
        this.nextBtn.classList.add('show');

        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('chime');
        }
    }

    hideNextButton() {
        this.nextBtnShown = false;
        this.nextBtn.classList.remove('show');
    }

    // Runs when the kid taps the Next button (was auto-triggered before;
    // now it's their call, since demanding full coverage isn't realistic).
    advanceToNextItem() {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.hideNextButton();

        // Use new audio system for celebration
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakCelebration();
            window.audioSystem.playSoundEffect('celebration');
        }

        this.triggerCelebration();

        setTimeout(() => {
            this.nextShape();
        }, 1500);
    }

    // UPDATED METHOD: Enhanced color selection with audio system
    selectColor(colorIndex) {
        if (this.isTransitioning) return;

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        const colorBtn = document.querySelector(`[data-color-index="${colorIndex}"]`);
        colorBtn.classList.add('selected');

        this.selectedColor = colorIndex;
        this.updateCursorSize();

        // Use new audio system for color announcement
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakColor(this.colors[colorIndex].name);
            window.audioSystem.playSoundEffect('chime');
        } else {
            this.speakText(this.colors[colorIndex].name);
        }

        colorBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            colorBtn.style.transform = '';
        }, 200);
    }

    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawShapeOutline() {
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 4]);
        this.ctx.globalCompositeOperation = 'source-over';

        this.drawShape(this.ctx, false);

        this.ctx.setLineDash([]);
    }

    drawShape(ctx, filled = false) {
        ctx.beginPath();
        this.buildShapePath(ctx);

        if (filled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    // Builds the current shape's path on the given context (no beginPath/fill/stroke).
    // Shared by outline drawing, area calculation, and the coloring mask so
    // they can never drift out of sync with each other.
    buildShapePath(ctx) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.32;

        const shapeName = this.shapes[this.currentShapeIndex];

        switch (shapeName) {
            case 'Circle':
                ctx.arc(centerX, centerY, size, 0, 2 * Math.PI);
                break;

            case 'Square':
                ctx.rect(centerX - size, centerY - size, size * 2, size * 2);
                break;

            case 'Triangle':
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX - size, centerY + size);
                ctx.lineTo(centerX + size, centerY + size);
                ctx.closePath();
                break;

            case 'Rectangle':
                ctx.rect(centerX - size * 1.3, centerY - size * 0.8, size * 2.6, size * 1.6);
                break;

            case 'Oval':
                ctx.ellipse(centerX, centerY, size * 1.3, size * 0.8, 0, 0, 2 * Math.PI);
                break;

            case 'Star':
                this.drawStarPath(ctx, centerX, centerY, 5, size, size * 0.5);
                break;

            case 'Heart':
                this.drawHeartPath(ctx, centerX, centerY, size);
                break;

            case 'Diamond':
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX + size, centerY);
                ctx.lineTo(centerX, centerY + size);
                ctx.lineTo(centerX - size, centerY);
                ctx.closePath();
                break;

            case 'Pentagon':
                this.drawPolygonPath(ctx, centerX, centerY, 5, size);
                break;

            case 'Hexagon':
                this.drawPolygonPath(ctx, centerX, centerY, 6, size);
                break;
        }
    }

    drawStarPath(ctx, centerX, centerY, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        ctx.moveTo(centerX, centerY - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = centerX + Math.cos(rot) * outerRadius;
            let y = centerY + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = centerX + Math.cos(rot) * innerRadius;
            y = centerY + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(centerX, centerY - outerRadius);
        ctx.closePath();
    }

    drawHeartPath(ctx, centerX, centerY, size) {
        const topCurveHeight = size * 0.5;

        ctx.moveTo(centerX, centerY + size * 0.4);
        ctx.bezierCurveTo(centerX, centerY - topCurveHeight, centerX - size, centerY - topCurveHeight, centerX - size, centerY);
        ctx.bezierCurveTo(centerX - size, centerY + topCurveHeight, centerX, centerY + topCurveHeight, centerX, centerY + size);
        ctx.bezierCurveTo(centerX, centerY + topCurveHeight, centerX + size, centerY + topCurveHeight, centerX + size, centerY);
        ctx.bezierCurveTo(centerX + size, centerY - topCurveHeight, centerX, centerY - topCurveHeight, centerX, centerY + size * 0.4);
        ctx.closePath();
    }

    drawPolygonPath(ctx, centerX, centerY, sides, radius) {
        const angle = (2 * Math.PI) / sides;

        ctx.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));

        for (let i = 1; i < sides; i++) {
            ctx.lineTo(
                centerX + radius * Math.cos(i * angle),
                centerY + radius * Math.sin(i * angle)
            );
        }

        ctx.closePath();
    }

    // UPDATED METHOD: Enhanced celebration with audio effects
    triggerCelebration() {
        // Play celebration sound
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('sparkle');
        }

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createCelebrationParticle();
            }, i * 80);
        }

        this.createShapeExplosion();
    }

    createShapeExplosion() {
        const emoji = this.currentType === 'pokemon'
            ? '✨'
            : this.getShapeEmoji(this.shapes[this.currentShapeIndex]);

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = emoji;
            particle.style.fontSize = '40px';

            const angle = (i / 10) * 2 * Math.PI;
            const distance = 150 + Math.random() * 100;
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;

            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            particle.style.transform = `translate(-50%, -50%)`;

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.style.transition = 'all 1.2s ease-out';
                particle.style.left = endX + 'px';
                particle.style.top = endY + 'px';
                particle.style.opacity = '0';
                particle.style.transform = `translate(-50%, -50%) scale(2) rotate(720deg)`;
            }, 50);

            setTimeout(() => {
                particle.remove();
            }, 1300);
        }
    }

    createCelebrationParticle() {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.textContent = ['🎉', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 2500);
    }

    getShapeEmoji(shapeName) {
        const emojiMap = {
            'Circle': '⭕',
            'Square': '⬜',
            'Triangle': '🔺',
            'Rectangle': '⬜',
            'Oval': '⭕',
            'Star': '⭐',
            'Heart': '❤️',
            'Diamond': '💎',
            'Pentagon': '⬟',
            'Hexagon': '⬢'
        };

        return emojiMap[shapeName] || '✨';
    }

    // UPDATED METHOD: Enhanced shape transition with audio
    nextShape() {
        this.saveProgress();

        // Clear selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedColor = null;
        this.updateCursorSize();

        this.itemCount++;
        const isPokemonTurn = (this.itemCount % 4 === 3);

        if (isPokemonTurn) {
            this.currentType = 'pokemon';
            this.currentPokemon = null;
            this.currentPokemonId = Math.floor(Math.random() * this.POKEMON_MAX_ID) + 1;
        } else {
            this.currentType = 'shape';

            if (this.isRandomMode) {
                this.currentShapeIndex = Math.floor(Math.random() * this.shapes.length);
            } else {
                this.currentShapeIndex++;

                if (this.currentShapeIndex >= this.shapes.length) {
                    this.isRandomMode = true;
                    this.currentShapeIndex = 0;
                    localStorage.setItem('colorShapesRandomUnlocked', 'true');

                    setTimeout(() => {
                        if (window.audioSystem && window.audioSystem.isInitialized) {
                            window.audioSystem.speak('Amazing! You completed all shapes! Now enjoy random practice mode!');
                        } else {
                            alert('🎉 Amazing! You completed all shapes! Now enjoy random practice mode!');
                        }
                    }, 300);
                }
            }
        }

        this.animateShapeTransition();
    }

    animateShapeTransition() {
        const container = document.querySelector('.canvas-container');

        // Fade out
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        container.style.opacity = '0';
        container.style.transform = 'scale(0.8)';

        setTimeout(() => {
            if (this.currentType === 'pokemon') {
                this.shapeLabel.textContent = 'Loading...';
            }

            this.resetAndDrawItem().then(() => {
                // Fade in
                container.style.opacity = '1';
                container.style.transform = 'scale(1)';

                setTimeout(() => {
                    this.speakShapeName();
                    this.isTransitioning = false;
                }, 200);
            });
        }, 400);
    }

    updateShapeLabel() {
        this.shapeLabel.textContent = this.getCurrentLabel();
    }

    getCurrentLabel() {
        if (this.currentType === 'pokemon' && this.currentPokemon) {
            const name = this.currentPokemon.name;
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return this.shapes[this.currentShapeIndex];
    }

    // UPDATED METHOD: Enhanced speech with audio system
    speakText(text) {
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speak(text);
        } else {
            // Fallback to basic speech
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1.2;
                utterance.volume = 0.8;
                speechSynthesis.speak(utterance);
            }
        }
    }

    speakShapeName() {
        const label = this.getCurrentLabel();

        if (window.audioSystem && window.audioSystem.isInitialized) {
            if (this.currentType === 'pokemon') {
                window.audioSystem.speak(label);
            } else {
                window.audioSystem.speakShape(label);
            }
        } else {
            this.speakText(label);
        }
    }

    loadProgress() {
        const randomUnlocked = localStorage.getItem('colorShapesRandomUnlocked') === 'true';
        if (randomUnlocked) {
            this.isRandomMode = true;
            this.currentShapeIndex = Math.floor(Math.random() * this.shapes.length);
        }
    }

    saveProgress() {
        if (this.isRandomMode) {
            localStorage.setItem('colorShapesRandomUnlocked', 'true');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ColoringGame();
});
