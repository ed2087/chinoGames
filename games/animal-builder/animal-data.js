// ==========================================
// ANIMAL DATA - All Animal Definitions
// Complete database of animals with shapes, sounds, and properties
// ==========================================

const AnimalData = {
    // Bird Definition (Fixed & Larger)
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
                targetPosition: { x: 400, y: 200 },
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
                targetPosition: { x: 400, y: 340 },
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
                targetPosition: { x: 380, y: 180 },
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
                targetPosition: { x: 340, y: 200 },
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
                targetPosition: { x: 350, y: 320 },
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
                targetPosition: { x: 480, y: 310 },
                size: { width: 50, height: 80 },
                snapRadius: 60,
                finalColor: "#8E44AD", // Dark purple for all 3
                strokeColor: "#5B2C6F",
                strokeWidth: 3,
                zIndex: 1,
                rotation: 30
            },
            {
                id: "tail2",
                type: "triangle",
                targetPosition: { x: 510, y: 340 },
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
                type: "triangle", // ❌ was diamond
                targetPosition: { x: 540, y: 370 },
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
                targetPosition: { x: 370, y: 450 },
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
                targetPosition: { x: 430, y: 450 },
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

    // Panda Definition (Fixed with 4 legs!)
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
                targetPosition: { x: 400, y: 220 },
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
                targetPosition: { x: 400, y: 380 },
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
                targetPosition: { x: 340, y: 130 },
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
                targetPosition: { x: 460, y: 130 },
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
                targetPosition: { x: 370, y: 200 },
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
                targetPosition: { x: 430, y: 200 },
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
                targetPosition: { x: 400, y: 240 },
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
                targetPosition: { x: 340, y: 480 },
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
                targetPosition: { x: 460, y: 480 },
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
                targetPosition: { x: 320, y: 350 },
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
                targetPosition: { x: 480, y: 350 },
                size: { width: 45, height: 70 },
                snapRadius: 50,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 3,
                zIndex: 2
            }
        ]
    },

    // Butterfly Definition (Fixed & Larger)
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
                targetPosition: { x: 450, y: 300 },
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
                targetPosition: { x: 450, y: 180 },
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
                targetPosition: { x: 370, y: 260 },
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
                targetPosition: { x: 530, y: 260 },
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
                targetPosition: { x: 380, y: 340 },
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
                targetPosition: { x: 520, y: 340 },
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
                targetPosition: { x: 370, y: 250 },
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
                targetPosition: { x: 530, y: 250 },
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
                targetPosition: { x: 380, y: 330 },
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
                targetPosition: { x: 520, y: 330 },
                size: { radius: 8 },
                snapRadius: 20,
                finalColor: "#8E44AD",
                strokeColor: "#6C3483",
                strokeWidth: 2,
                zIndex: 5
            }
        ]
    },

    // NEW ANIMAL 1: Cat
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
            // Head
            {
                id: "head",
                type: "oval",
                targetPosition: { x: 400, y: 195 },
                size: { width: 130, height: 90 },
                snapRadius: 70,
                finalColor: "#222222", // near-black
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 3
            },
            // Body
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 400, y: 330 },
                size: { width: 140, height: 170 },
                snapRadius: 80,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 2
            },
            // Belly patch
            {
                id: "bellyPatch",
                type: "oval",
                targetPosition: { x: 400, y: 340 },
                size: { width: 60, height: 100 },
                snapRadius: 40,
                finalColor: "#FDFEFE",
                strokeColor: "#D5D8DC",
                strokeWidth: 2,
                zIndex: 3
            },
            // Ears
            {
                id: "ear1",
                type: "triangle",
                targetPosition: { x: 360, y: 130 },
                size: { width: 35, height: 55 },
                snapRadius: 40,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "ear2",
                type: "triangle",
                targetPosition: { x: 440, y: 130 },
                size: { width: 35, height: 65 },
                snapRadius: 40,
                finalColor: "#EEEEEE", // white ear for contrast
                strokeColor: "#AAAAAA",
                strokeWidth: 3,
                zIndex: 4
            },
            // Eyes
            {
                id: "eye1",
                type: "triangle",
                targetPosition: { x: 380, y: 180 },
                size: { width: 24, height: 20 },
                snapRadius: 25,
                finalColor: "#FDFEFE", // white eye
                strokeColor: "#D5D8DC",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "triangle",
                targetPosition: { x: 420, y: 180 },
                size: { width: 24, height: 20 },
                snapRadius: 25,
                finalColor: "#27AE60", // green eye
                strokeColor: "#239B56",
                strokeWidth: 2,
                zIndex: 5
            },
            // Nose
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 215 },
                size: { width: 16, height: 14 },
                snapRadius: 20,
                finalColor: "#E91E63",
                strokeColor: "#C2185B",
                strokeWidth: 2,
                zIndex: 6,
                rotation: 180
            },
            // Arms (arm1 = white)
            {
                id: "arm1",
                type: "oval",
                targetPosition: { x: 330, y: 330 },
                size: { width: 32, height: 54 },
                snapRadius: 40,
                finalColor: "#FDFEFE", // white paw
                strokeColor: "#D5D8DC",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "arm2",
                type: "oval",
                targetPosition: { x: 470, y: 330 },
                size: { width: 32, height: 54 },
                snapRadius: 40,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 3
            },
            // Legs
            {
                id: "leg1",
                type: "oval",
                targetPosition: { x: 360, y: 440 },
                size: { width: 32, height: 54 },
                snapRadius: 35,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg2",
                type: "oval",
                targetPosition: { x: 440, y: 440 },
                size: { width: 32, height: 54 },
                snapRadius: 35,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 3
            },
            // Tail
            {
                id: "tail",
                type: "triangle",
                targetPosition: { x: 310, y: 310 },
                size: { width: 90, height: 160 },
                snapRadius: 60,
                finalColor: "#222222",
                strokeColor: "#111111",
                strokeWidth: 3,
                zIndex: 1,
                rotation: -45
            }
        ]
    },

    // NEW ANIMAL 2: Fish
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
        totalShapes: 8,
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
                targetPosition: { x: 400, y: 250 },
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
                targetPosition: { x: 320, y: 250 },
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
                targetPosition: { x: 300, y: 230 },
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
                targetPosition: { x: 300, y: 280 },
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
                targetPosition: { x: 520, y: 250 },
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
                targetPosition: { x: 400, y: 180 },
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
                targetPosition: { x: 400, y: 320 },
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
                targetPosition: { x: 350, y: 200 },
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
                targetPosition: { x: 350, y: 300 },
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

    // NEW ANIMAL 3: Elephant
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
            // BODY
            {
                id: "body",
                type: "oval",
                targetPosition: { x: 460, y: 390 },
                size: { width: 240, height: 180 },
                snapRadius: 100,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 1
            },
            // HEAD (left of body)
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 330, y: 320 },
                size: { radius: 70 },
                snapRadius: 60,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 3
            },
            // EARS (big, flared out)
            {
                id: "ear1",
                type: "oval",
                targetPosition: { x: 235, y: 230 },
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
                targetPosition: { x: 410, y: 230 },
                size: { width: 140, height: 140 },
                snapRadius: 60,
                finalColor: "#AEB6BF",
                strokeColor: "#85929E",
                strokeWidth: 3,
                zIndex: 1
            },
            // EYES
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 300, y: 305 },
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
                targetPosition: { x: 355, y: 305 },
                size: { radius: 15 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            // TRUNK
            {
                id: "trunk",
                type: "oval",
                targetPosition: { x: 330, y: 390 },
                size: { width: 40, height: 140 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 4,
                zIndex: 4
            },
            // LEGS (4 total)
            {
                id: "leg1",
                type: "rectangle",
                targetPosition: { x: 380, y: 500 },
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
                targetPosition: { x: 420, y: 500 },
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
                targetPosition: { x: 485, y: 500 },
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
                targetPosition: { x: 540, y: 500 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#85929E",
                strokeColor: "#5D6D7E",
                strokeWidth: 3,
                zIndex: 2
            }
        ]
    },

    // NEW ANIMAL 4: Turtle
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
        totalShapes: 8,
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
                targetPosition: { x: 400, y: 280 },
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
                targetPosition: { x: 400, y: 280 },
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
                targetPosition: { x: 400, y: 180 },
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
                targetPosition: { x: 385, y: 170 },
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
                targetPosition: { x: 415, y: 170 },
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
                targetPosition: { x: 330, y: 330 },
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
                targetPosition: { x: 470, y: 330 },
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
                targetPosition: { x: 330, y: 215 },
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
                targetPosition: { x: 470, y: 215 },
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
                targetPosition: { x: 400, y: 360 },
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

    // NEW ANIMAL 5: Lion
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
        totalShapes: 14,
        canvas: {
            width: 800,
            height: 700,
            centerX: 400,
            centerY: 350
        },
        shapes: [
            // Mane and Head
            {
                id: "mane",
                type: "circle",
                targetPosition: { x: 400, y: 200 },
                size: { radius: 100 },
                snapRadius: 110,
                finalColor: "#D4AF37", // Mane - more golden
                strokeColor: "#B8860B",
                strokeWidth: 4,
                zIndex: 1
            },
            {
                id: "head",
                type: "circle",
                targetPosition: { x: 400, y: 200 },
                size: { radius: 60 },
                snapRadius: 70,
                finalColor: "#FFD966", // Lighter yellow for head
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2
            },

            // Body
            {
                id: "body",
                type: "rectangle",
                targetPosition: { x: 400, y: 380 },
                size: { width: 160, height: 200 },
                snapRadius: 90,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 4,
                zIndex: 2
            },

            // Eyes
            {
                id: "eye1",
                type: "circle",
                targetPosition: { x: 380, y: 185 },
                size: { radius: 8 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },
            {
                id: "eye2",
                type: "circle",
                targetPosition: { x: 420, y: 185 },
                size: { radius: 8 },
                snapRadius: 20,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5
            },

            // Nose
            {
                id: "nose",
                type: "triangle",
                targetPosition: { x: 400, y: 210 },
                size: { width: 15, height: 12 },
                snapRadius: 22,
                finalColor: "#2C3E50",
                strokeColor: "#1B2631",
                strokeWidth: 2,
                zIndex: 5,
                rotation: 180
            },

            // Arms (NEW)
            {
                id: "arm1",
                type: "rectangle",
                targetPosition: { x: 340, y: 370 },
                size: { width: 28, height: 70 },
                snapRadius: 40,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "arm2",
                type: "rectangle",
                targetPosition: { x: 460, y: 370 },
                size: { width: 28, height: 70 },
                snapRadius: 40,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },

            // Legs
            {
                id: "leg1",
                type: "rectangle",
                targetPosition: { x: 350, y: 520 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },
            {
                id: "leg2",
                type: "rectangle",
                targetPosition: { x: 450, y: 520 },
                size: { width: 40, height: 80 },
                snapRadius: 50,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 3
            },

            // Feet
            {
                id: "foot1",
                type: "circle",
                targetPosition: { x: 350, y: 580 },
                size: { radius: 25 },
                snapRadius: 35,
                finalColor: "#B8860B",
                strokeColor: "#9A7209",
                strokeWidth: 3,
                zIndex: 4
            },
            {
                id: "foot2",
                type: "circle",
                targetPosition: { x: 450, y: 580 },
                size: { radius: 25 },
                snapRadius: 35,
                finalColor: "#B8860B",
                strokeColor: "#9A7209",
                strokeWidth: 3,
                zIndex: 4
            },

            // Tail
            {
                id: "tail1",
                type: "diamond",
                targetPosition: { x: 320, y: 420 },
                size: { width: 60, height: 40 },
                snapRadius: 40,
                finalColor: "#FFD966",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2,
                rotation: 45
            },
            {
                id: "tail2",
                type: "diamond",
                targetPosition: { x: 280, y: 450 },
                size: { width: 40, height: 30 },
                snapRadius: 35,
                finalColor: "#D4AF37",
                strokeColor: "#B8860B",
                strokeWidth: 3,
                zIndex: 2,
                rotation: 30
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

console.log('🦋 AnimalData loaded - 8 animals with complete definitions ready');












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

console.log('🦋 AnimalData loaded - Animal definitions ready');