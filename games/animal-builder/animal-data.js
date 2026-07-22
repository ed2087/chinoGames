// ==========================================
// ANIMAL DATA - All Animal Definitions
// Complete database of animals with shapes, sounds, and properties
// ==========================================

const AnimalData = {
    // Bird Definition
    bird: {
        name: "Bird",
        emoji: "🐦",
        sounds: {
            animalSound: "Tweet tweet chirp! I'm a happy little bird!",
            completionPhrase: "Amazing! You built a beautiful bird that loves to fly!",
            encouragement: "Birds have feathers and can soar through the sky!",
            shapeSuccess: "Perfect! That shape fits just right!"
        },
        difficulty: 1,
        totalShapes: 10,
        canvas: {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300
        },
        shapes: [
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 360, y: 195 },
                size: { radius: 60 },
                snapRadius: 70,
                finalColor: "#FFD93D",
                strokeColor: "#E67E22",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 360, y: 335 },
                size: { width: 120, height: 160 },
                snapRadius: 80,
                finalColor: "#FFD93D",
                strokeColor: "#E67E22",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "eye",
                type: "circle",
                targetPosition: { x: 340, y: 175 },
                size: { radius: 12 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#2C3E50",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "beak",
                type: "triangle",
                targetPosition: { x: 300, y: 195 },
                size: { width: 40, height: 25 },
                snapRadius: 40,
                finalColor: "#FF6B35",
                strokeColor: "#E55100",
                strokeWidth: 3,
                zIndex: 4,
                rotation: 0
            },
            {
                id: "wing",
                type: "triangle",
                targetPosition: { x: 310, y: 315 },
                size: { width: 70, height: 90 },
                snapRadius: 60,
                finalColor: "#F39C12",
                strokeColor: "#D68910",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 15
            },
           {
                id: "tail1",
                type: "triangle",
                targetPosition: { x: 440, y: 305 },
                size: { width: 50, height: 80 },
                snapRadius: 60,
                finalColor: "#8E44AD",
                strokeColor: "#5B2C6F",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 30
            },
            {
                id: "tail2",
                type: "triangle",
                targetPosition: { x: 470, y: 335 },
                size: { width: 50, height: 80 },
                snapRadius: 60,
                finalColor: "#8E44AD",
                strokeColor: "#5B2C6F",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 60
            },
            {
                id: "tail3",
                type: "triangle",
                targetPosition: { x: 500, y: 365 },
                size: { width: 50, height: 80 },
                snapRadius: 60,
                finalColor: "#8E44AD",
                strokeColor: "#5B2C6F",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 90
            },
            {
                id: "foot1",
                type: "triangle",
                targetPosition: { x: 330, y: 445 },
                size: { width: 30, height: 40 },
                snapRadius: 35,
                finalColor: "#FF6B35",
                strokeColor: "#E55100",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 180
            },
            {
                id: "foot2",
                type: "triangle",
                targetPosition: { x: 390, y: 445 },
                size: { width: 30, height: 40 },
                snapRadius: 35,
                finalColor: "#FF6B35",
                strokeColor: "#E55100",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 180
            }
        ]
    },

    // Panda Definition
    panda: {
        name: "Panda",
        emoji: "🐼",
        sounds: {
            animalSound: "I'm a cuddly panda! I love bamboo and hugs!",
            completionPhrase: "Wonderful! You made an adorable panda bear!",
            encouragement: "Pandas are black and white and very gentle!",
            shapeSuccess: "Great job! That piece fits perfectly!"
        },
        difficulty: 2,
        totalShapes: 11,
        canvas: {
            width: 800,
            height: 700,
            centerX: 400,
            centerY: 350
        },
        shapes: [
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 400, y: 263 },
                size: { radius: 80 },
                snapRadius: 90,
                finalColor: "#FFFFFF",
                strokeColor: "#2C3E50",
                strokeWidth: 4,
                zIndex: 2
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 423 },
                size: { width: 160, height: 200 },
                snapRadius: 100,
                finalColor: "#FFFFFF",
                strokeColor: "#2C3E50",
                strokeWidth: 4,
                zIndex: 1
            },
            {
                id: "ear1",
                type: "circle",
                targetPosition: { x: 340, y: 173 },
                size: { radius: 35 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "ear2",
                type: "circle",
                targetPosition: { x: 460, y: 173 },
                size: { radius: 35 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 370, y: 243 },
                size: { radius: 15 },
                snapRadius: 30,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 430, y: 243 },
                size: { radius: 15 },
                snapRadius: 30,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 283 },
                size: { width: 16, height: 12 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5,
                rotation: 180
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 340, y: 523 },
                size: { width: 50, height: 80 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 460, y: 523 },
                size: { width: 50, height: 80 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 320, y: 393 },
                size: { width: 45, height: 70 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 480, y: 393 },
                size: { width: 45, height: 70 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 2
            }
        ]
    },

    // Butterfly Definition
    butterfly: {
        name: "Butterfly",
        emoji: "🦋",
        sounds: {
            animalSound: "Flutter flutter! I'm a colorful butterfly!",
            completionPhrase: "Beautiful! You created a lovely butterfly!",
            encouragement: "Butterflies have pretty wings and love flowers!",
            shapeSuccess: "Perfect! That wing looks amazing!"
        },
        difficulty: 3,
        totalShapes: 9,
        canvas: {
            width: 900,
            height: 600,
            centerX: 450,
            centerY: 300
        },
        shapes: [
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 450, y: 315 },
                size: { width: 45, height: 230 },
                snapRadius: 40,
                finalColor: "#8E44AD",
                strokeColor: "#6C3483",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 450, y: 195 },
                size: { radius: 25 },
                snapRadius: 30,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "topWing1",
                type: "oval",
                targetPosition: { x: 370, y: 275 },
                size: { width: 130, height: 90 },
                snapRadius: 60,
                finalColor: "#E74C3C",
                strokeColor: "#C0392B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "topWing2",
                type: "oval",
                targetPosition: { x: 530, y: 275 },
                size: { width: 130, height: 90 },
                snapRadius: 60,
                finalColor: "#E74C3C",
                strokeColor: "#C0392B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "bottomWing1",
                type: "oval",
                targetPosition: { x: 380, y: 355 },
                size: { width: 90, height: 70 },
                snapRadius: 50,
                finalColor: "#F39C12",
                strokeColor: "#D68910",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "bottomWing2",
                type: "oval",
                targetPosition: { x: 520, y: 355 },
                size: { width: 90, height: 70 },
                snapRadius: 50,
                finalColor: "#F39C12",
                strokeColor: "#D68910",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "spot1",
                type: "circle",
                targetPosition: { x: 370, y: 265 },
                size: { radius: 10 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "spot2",
                type: "circle",
                targetPosition: { x: 530, y: 265 },
                size: { radius: 10 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "spot3",
                type: "circle",
                targetPosition: { x: 380, y: 345 },
                size: { radius: 8 },
                snapRadius: 20,
                finalColor: "#8E44AD",
                strokeColor: "#6C3483",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "spot4",
                type: "circle",
                targetPosition: { x: 520, y: 345 },
                size: { radius: 8 },
                snapRadius: 20,
                finalColor: "#8E44AD",
                strokeColor: "#6C3483",
                strokeWidth: 2,
                zIndex: 5
            }
        ]
    },

    // Cat Definition (redesigned: matching ears, round eyes, tucked-in tail)
    cat: {
        name: "Cat",
        emoji: "🐱",
        sounds: {
            animalSound: "Meow meow! I'm a fluffy kitty cat!",
            completionPhrase: "Purr-fect! You made an adorable cat!",
            encouragement: "Cats love to purr and play with yarn!",
            shapeSuccess: "Meow-nificent! That fits perfectly!"
        },
        difficulty: 2,
        totalShapes: 13,
        canvas: {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300
        },
        shapes: [
            {
                id: "head",
                type: "oval",
                targetPosition: { x: 400, y: 205 },
                size: { width: 130, height: 100 },
                snapRadius: 70,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 355 },
                size: { width: 150, height: 180 },
                snapRadius: 80,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "bellyPatch",
                type: "oval",
                targetPosition: { x: 400, y: 365 },
                size: { width: 65, height: 110 },
                snapRadius: 40,
                finalColor: "#FDFEFE",
                strokeColor: "#D5D8DC",
                strokeWidth: 2,
                zIndex: 3
            },
            {
                id: "ear1",
                type: "triangle",
                targetPosition: { x: 355, y: 145 },
                size: { width: 38, height: 60 },
                snapRadius: 40,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "ear2",
                type: "triangle",
                targetPosition: { x: 445, y: 145 },
                size: { width: 38, height: 60 },
                snapRadius: 40,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 375, y: 200 },
                size: { radius: 14 },
                snapRadius: 25,
                finalColor: "#27AE60",
                strokeColor: "#1B1B1B",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 425, y: 200 },
                size: { radius: 14 },
                snapRadius: 25,
                finalColor: "#27AE60",
                strokeColor: "#1B1B1B",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 228 },
                size: { width: 16, height: 13 },
                snapRadius: 20,
                finalColor: "#E91E63",
                strokeColor: "#C2185B",
                strokeWidth: 2,
                zIndex: 6,
                rotation: 180
            },
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 335, y: 355 },
                size: { width: 34, height: 56 },
                snapRadius: 40,
                finalColor: "#FDFEFE",
                strokeColor: "#D5D8DC",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 465, y: 355 },
                size: { width: 34, height: 56 },
                snapRadius: 40,
                finalColor: "#FDFEFE",
                strokeColor: "#D5D8DC",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 365, y: 465 },
                size: { width: 34, height: 56 },
                snapRadius: 35,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 435, y: 465 },
                size: { width: 34, height: 56 },
                snapRadius: 35,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "tail",
                type: "triangle",
                targetPosition: { x: 300, y: 415 },
                size: { width: 42, height: 105 },
                snapRadius: 55,
                finalColor: "#3D3D3D",
                strokeColor: "#1B1B1B",
                strokeWidth: 3,
                zIndex: 1,
                rotation: -35
            }
        ]
    },

    // Fish Definition
    fish: {
        name: "Fish",
        emoji: "🐟",
        sounds: {
            animalSound: "Blub blub! I'm a swimming fish!",
            completionPhrase: "Fantastic! You made a beautiful fish!",
            encouragement: "Fish swim in the ocean with their fins!",
            shapeSuccess: "Swimming-sational! Perfect placement!"
        },
        difficulty: 2,
        totalShapes: 9,
        canvas: {
            width: 800,
            height: 500,
            centerX: 400,
            centerY: 250
        },
        shapes: [
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 390, y: 250 },
                size: { width: 200, height: 120 },
                snapRadius: 80,
                finalColor: "#3498DB",
                strokeColor: "#2980B9",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 310, y: 250 },
                size: { radius: 60 },
                snapRadius: 70,
                finalColor: "#5DADE2",
                strokeColor: "#3498DB",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "right-eye",
                type: "circle",
                targetPosition: { x: 290, y: 230 },
                size: { radius: 12 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "left-eye",
                type: "circle",
                targetPosition: { x: 290, y: 280 },
                size: { radius: 12 },
                snapRadius: 25,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "tailMain",
                type: "triangle",
                targetPosition: { x: 510, y: 250 },
                size: { width: 80, height: 100 },
                snapRadius: 60,
                finalColor: "#2980B9",
                strokeColor: "#1B4F72",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 90
            },
            {
                id: "topFin",
                type: "triangle",
                targetPosition: { x: 390, y: 180 },
                size: { width: 60, height: 40 },
                snapRadius: 45,
                finalColor: "#E74C3C",
                strokeColor: "#C0392B",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 0
            },
            {
                id: "bottomFin",
                type: "triangle",
                targetPosition: { x: 390, y: 320 },
                size: { width: 60, height: 40 },
                snapRadius: 45,
                finalColor: "#E74C3C",
                strokeColor: "#C0392B",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 180
            },
            {
                id: "sideFin1",
                type: "triangle",
                targetPosition: { x: 340, y: 200 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#F39C12",
                strokeColor: "#D68910",
                strokeWidth: 3,
                zIndex: 3,
                rotation: -45
            },
            {
                id: "sideFin2",
                type: "triangle",
                targetPosition: { x: 340, y: 300 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#F39C12",
                strokeColor: "#D68910",
                strokeWidth: 3,
                zIndex: 3,
                rotation: 45
            }
        ]
    },

    // Elephant Definition
    elephant: {
        name: "Elephant",
        emoji: "🐘",
        sounds: {
            animalSound: "Trumpet! I'm a big gray elephant!",
            completionPhrase: "Ele-fantastic! You built a magnificent elephant!",
            encouragement: "Elephants are gentle giants with long trunks!",
            shapeSuccess: "Trunk-tastic! That piece fits great!"
        },
        difficulty: 3,
        totalShapes: 12,
        canvas: {
            width: 900,
            height: 700,
            centerX: 450,
            centerY: 350
        },
        shapes: [
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 538, y: 390 },
                size: { width: 240, height: 180 },
                snapRadius: 100,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 1
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 408, y: 320 },
                size: { radius: 70 },
                snapRadius: 60,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 3
            },
            {
                id: "ear1",
                type: "oval",
                targetPosition: { x: 313, y: 230 },
                size: { width: 140, height: 140 },
                snapRadius: 70,
                finalColor: "#AEB6BF",
                strokeColor: "#85929E",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "ear2",
                type: "oval",
                targetPosition: { x: 488, y: 230 },
                size: { width: 140, height: 140 },
                snapRadius: 60,
                finalColor: "#AEB6BF",
                strokeColor: "#85929E",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 378, y: 305 },
                size: { radius: 15 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 433, y: 305 },
                size: { radius: 15 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "trunk",
                type: "oval",
                targetPosition: { x: 408, y: 390 },
                size: { width: 40, height: 140 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 4
            },
            {
                id: "leg1",
                type: "rectangle",
                targetPosition: { x: 458, y: 500 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg2",
                type: "rectangle",
                targetPosition: { x: 498, y: 500 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg3",
                type: "rectangle",
                targetPosition: { x: 563, y: 500 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg4",
                type: "rectangle",
                targetPosition: { x: 618, y: 500 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 3,
                zIndex: 2
            }
        ]
    },

    // Turtle Definition
    turtle: {
        name: "Turtle",
        emoji: "🐢",
        sounds: {
            animalSound: "I'm a slow and steady turtle!",
            completionPhrase: "Shell-tastic! You built an amazing turtle!",
            encouragement: "Turtles carry their homes on their backs!",
            shapeSuccess: "Turtle-y awesome! Perfect fit!"
        },
        difficulty: 2,
        totalShapes: 9,
        canvas: {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300
        },
        shapes: [
            {
                id: "shell",
                type: "oval",
                targetPosition: { x: 400, y: 320 },
                size: { width: 180, height: 140 },
                snapRadius: 90,
                finalColor: "#27AE60",
                strokeColor: "#1E8449",
                strokeWidth: 4,
                zIndex: 2
            },
            {
                id: "shellPattern",
                type: "diamond",
                targetPosition: { x: 400, y: 320 },
                size: { width: 120, height: 80 },
                snapRadius: 60,
                finalColor: "#229954",
                strokeColor: "#1E8449",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "head",
                type: "oval",
                targetPosition: { x: 400, y: 220 },
                size: { width: 60, height: 70 },
                snapRadius: 50,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 385, y: 210 },
                size: { radius: 6 },
                snapRadius: 15,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 415, y: 210 },
                size: { radius: 6 },
                snapRadius: 15,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 330, y: 370 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 470, y: 370 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "frontLeg1",
                type: "oval",
                targetPosition: { x: 330, y: 255 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "frontLeg2",
                type: "oval",
                targetPosition: { x: 470, y: 255 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "tail",
                type: "triangle",
                targetPosition: { x: 400, y: 400 },
                size: { width: 20, height: 30 },
                snapRadius: 25,
                finalColor: "#58D68D",
                strokeColor: "#27AE60",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 180
            }
        ]
    },

    // Lion Definition (redesigned: spiky mane, rounded oval limbs, real tail with tuft)
    lion: {
        name: "Lion",
        emoji: "🦁",
        sounds: {
            animalSound: "Roar! I'm the king of the jungle!",
            completionPhrase: "Roar-some! You built a mighty lion!",
            encouragement: "Lions are brave and have big manes!",
            shapeSuccess: "Mane-ificent! That looks perfect!"
        },
        difficulty: 3,
        totalShapes: 20,
        canvas: {
            width: 800,
            height: 700,
            centerX: 400,
            centerY: 350
        },
        shapes: [
            {
                id: "mane",
                type: "circle",
                targetPosition: { x: 400, y: 210 },
                size: { radius: 98 },
                snapRadius: 105,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "maneSpike1",
                type: "triangle",
                targetPosition: { x: 400, y: 96 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#D4AF37",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 0
            },
            {
                id: "maneSpike2",
                type: "triangle",
                targetPosition: { x: 485, y: 125 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 60
            },
            {
                id: "maneSpike3",
                type: "triangle",
                targetPosition: { x: 540, y: 210 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#D4AF37",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 90
            },
            {
                id: "maneSpike4",
                type: "triangle",
                targetPosition: { x: 485, y: 295 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 120
            },
            {
                id: "maneSpike5",
                type: "triangle",
                targetPosition: { x: 315, y: 295 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#D4AF37",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 240
            },
            {
                id: "maneSpike6",
                type: "triangle",
                targetPosition: { x: 260, y: 210 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 270
            },
            {
                id: "maneSpike7",
                type: "triangle",
                targetPosition: { x: 315, y: 125 },
                size: { width: 34, height: 58 },
                snapRadius: 38,
                finalColor: "#D4AF37",
                strokeColor: "#8A6508",
                strokeWidth: 2,
                zIndex: 1,
                rotation: 300
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 400, y: 210 },
                size: { radius: 62 },
                snapRadius: 70,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 378, y: 200 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 422, y: 200 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 228 },
                size: { width: 15, height: 12 },
                snapRadius: 22,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5,
                rotation: 180
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 390 },
                size: { width: 190, height: 170 },
                snapRadius: 100,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 4,
                zIndex: 1
            },
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 320, y: 370 },
                size: { width: 40, height: 75 },
                snapRadius: 45,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 480, y: 370 },
                size: { width: 40, height: 75 },
                snapRadius: 45,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 355, y: 520 },
                size: { width: 42, height: 85 },
                snapRadius: 50,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 445, y: 520 },
                size: { width: 42, height: 85 },
                snapRadius: 50,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "foot1",
                type: "circle",
                targetPosition: { x: 355, y: 562 },
                size: { radius: 22 },
                snapRadius: 30,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "foot2",
                type: "circle",
                targetPosition: { x: 445, y: 562 },
                size: { radius: 22 },
                snapRadius: 30,
                finalColor: "#B8860B",
                strokeColor: "#8A6508",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "tail",
                type: "triangle",
                targetPosition: { x: 310, y: 430 },
                size: { width: 46, height: 130 },
                snapRadius: 60,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 1,
                rotation: -30
            }
        ]
    },

    // Dog Definition (new)
    dog: {
        name: "Dog",
        emoji: "🐶",
        sounds: {
            animalSound: "Woof woof! I'm a friendly puppy!",
            completionPhrase: "Paw-some! You built an adorable dog!",
            encouragement: "Dogs love to play fetch and wag their tails!",
            shapeSuccess: "Woof-tastic! Great placement!"
        },
        difficulty: 2,
        totalShapes: 12,
        canvas: {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300
        },
        shapes: [
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 400, y: 190 },
                size: { radius: 65 },
                snapRadius: 75,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "ear1",
                type: "oval",
                targetPosition: { x: 335, y: 145 },
                size: { width: 40, height: 68 },
                snapRadius: 45,
                finalColor: "#8B5A2B",
                strokeColor: "#6B4522",
                strokeWidth: 3,
                zIndex: 1,
                rotation: -20
            },
            {
                id: "ear2",
                type: "oval",
                targetPosition: { x: 465, y: 145 },
                size: { width: 40, height: 68 },
                snapRadius: 45,
                finalColor: "#8B5A2B",
                strokeColor: "#6B4522",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 20
            },
            {
                id: "snout",
                type: "oval",
                targetPosition: { x: 400, y: 232 },
                size: { width: 55, height: 42 },
                snapRadius: 40,
                finalColor: "#E8C9A0",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "nose",
                type: "circle",
                targetPosition: { x: 400, y: 245 },
                size: { radius: 10 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 372, y: 180 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 428, y: 180 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 345 },
                size: { width: 150, height: 150 },
                snapRadius: 85,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 335, y: 340 },
                size: { width: 35, height: 60 },
                snapRadius: 40,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 465, y: 340 },
                size: { width: 35, height: 60 },
                snapRadius: 40,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 365, y: 445 },
                size: { width: 35, height: 65 },
                snapRadius: 40,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 435, y: 445 },
                size: { width: 35, height: 65 },
                snapRadius: 40,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "tail",
                type: "triangle",
                targetPosition: { x: 500, y: 335 },
                size: { width: 32, height: 80 },
                snapRadius: 45,
                finalColor: "#D2A679",
                strokeColor: "#9C7248",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 55
            }
        ]
    },

    // Rabbit Definition (new)
    rabbit: {
        name: "Rabbit",
        emoji: "🐰",
        sounds: {
            animalSound: "Hop hop! I'm a bouncy bunny!",
            completionPhrase: "Hop-py days! You built a cute bunny rabbit!",
            encouragement: "Rabbits have long ears and love carrots!",
            shapeSuccess: "Hop-tastic! That fits perfectly!"
        },
        difficulty: 2,
        totalShapes: 14,
        canvas: {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300
        },
        shapes: [
            {
                id: "ear1",
                type: "oval",
                targetPosition: { x: 375, y: 140 },
                size: { width: 30, height: 120 },
                snapRadius: 50,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 1,
                rotation: -8
            },
            {
                id: "ear2",
                type: "oval",
                targetPosition: { x: 425, y: 140 },
                size: { width: 30, height: 120 },
                snapRadius: 50,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 8
            },
            {
                id: "earInner1",
                type: "oval",
                targetPosition: { x: 375, y: 148 },
                size: { width: 14, height: 95 },
                snapRadius: 30,
                finalColor: "#FFB6C1",
                strokeColor: "#E89AAA",
                strokeWidth: 2,
                zIndex: 2,
                rotation: -8
            },
            {
                id: "earInner2",
                type: "oval",
                targetPosition: { x: 425, y: 148 },
                size: { width: 14, height: 95 },
                snapRadius: 30,
                finalColor: "#FFB6C1",
                strokeColor: "#E89AAA",
                strokeWidth: 2,
                zIndex: 2,
                rotation: 8
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 400, y: 260 },
                size: { radius: 60 },
                snapRadius: 70,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 380, y: 250 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 420, y: 250 },
                size: { radius: 9 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 272 },
                size: { width: 13, height: 11 },
                snapRadius: 20,
                finalColor: "#FF8FA3",
                strokeColor: "#E06377",
                strokeWidth: 2,
                zIndex: 5,
                rotation: 180
            },
            {
                id: "tail",
                type: "circle",
                targetPosition: { x: 478, y: 428 },
                size: { radius: 20 },
                snapRadius: 35,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 1
            },
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 400 },
                size: { width: 140, height: 150 },
                snapRadius: 85,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 2
            },
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 345, y: 390 },
                size: { width: 32, height: 55 },
                snapRadius: 40,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 455, y: 390 },
                size: { width: 32, height: 55 },
                snapRadius: 40,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 365, y: 478 },
                size: { width: 42, height: 62 },
                snapRadius: 45,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 435, y: 478 },
                size: { width: 42, height: 62 },
                snapRadius: 45,
                finalColor: "#F5F5F5",
                strokeColor: "#C7C7C7",
                strokeWidth: 3,
                zIndex: 3
            }
        ]
    }

};

// Utility functions for working with animal data
AnimalData.getAllAnimals = function() {
    return Object.keys(this).filter(key => typeof this[key] === 'object' && this[key].name);
};

AnimalData.getAnimal = function(animalId) {
    return this[animalId] || null;
};

AnimalData.getShapesByType = function(animalId) {
    const animal = this.getAnimal(animalId);
    if (!animal) return {};

    const shapesByType = {};
    animal.shapes.forEach(shape => {
        if (!shapesByType[shape.type]) {
            shapesByType[shape.type] = [];
        }
        shapesByType[shape.type].push(shape);
    });

    return shapesByType;
};

AnimalData.getRequiredShapes = function(animalId) {
    const shapesByType = this.getShapesByType(animalId);
    const required = {};

    Object.keys(shapesByType).forEach(type => {
        required[type] = shapesByType[type].length;
    });

    return required;
};

// Make available globally
window.AnimalData = AnimalData;

console.log('🦋 AnimalData loaded - 10 animals with complete definitions ready');
