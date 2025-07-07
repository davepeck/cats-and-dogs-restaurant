import "./style.css";

// Create the game canvas
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Catstaurant</h1>
    <canvas id="gameCanvas" width="1024" height="1024"></canvas>
  </div>
`;

// Initialize the game
const canvas = document.querySelector<HTMLCanvasElement>("#gameCanvas")!;
const ctx = canvas.getContext("2d")!;

// Game state
interface Cat {
  id: number;
  x: number;
  y: number;
  targetX: number; // Where the cat is walking to
  targetY: number;
  order: "salmon" | "shrimp" | "mangoCake" | "milk";
  timeRemaining: number; // In seconds
  maxTime: number; // Initial time for this cat
  state: "entering" | "seated" | "eating" | "leaving";
  sprite: HTMLCanvasElement | null; // Which cat sprite to use
}

interface GameState {
  player: {
    x: number;
    y: number;
    direction: "forward" | "left" | "right";
  };
  keys: {
    left: boolean;
    right: boolean;
  };
  nearbyStation: number | null; // Index of the station the player is near, or null
  nearbyCustomer: number | null; // Index of the customer the player is near, or null
  carriedItem: {
    type: "salmon" | "shrimp" | "mangoCake" | "milk" | null;
    image: HTMLCanvasElement | null;
  } | null;
  cats: Cat[]; // Array of active cats
  gameState: "notStarted" | "playing" | "gameOver";
  nextCatId: number;
  catsServed: number;
  lastCatSpawnTime: number;
  catSpawnInterval: number; // Time between cat spawns in milliseconds
}

const gameState: GameState = {
  player: {
    x: 200, // Start in the server area (left side)
    y: 700, // Position lower on screen, near table level
    direction: "forward",
  },
  keys: {
    left: false,
    right: false,
  },
  nearbyStation: null, // No station nearby initially
  nearbyCustomer: null, // No customer nearby initially
  carriedItem: null, // No item carried initially
  cats: [], // Start with no cats
  gameState: "notStarted", // Start with the start screen
  nextCatId: 1,
  catsServed: 0,
  lastCatSpawnTime: 0,
  catSpawnInterval: 8000, // 8 seconds between cat spawns initially
};

// Load images
const images = {
  background: new Image(),
  girlForward: new Image(),
  girlLeft: new Image(),
  girlRight: new Image(),
  table: new Image(),
  cat1: new Image(),
  cat2: new Image(),
  cat3: new Image(),
  cat4: new Image(),
  cat5: new Image(),
  speechBubble: new Image(),
  mangoCakeIcon: new Image(),
  salmonIcon: new Image(),
  shrimpIcon: new Image(),
  milkIcon: new Image(),
  salmonPlate: new Image(),
  shrimpPlate: new Image(),
  mangoCakePlate: new Image(),
  milkMug: new Image(),
};

// Store processed transparent versions of character images
const transparentImages = {
  girlForward: null as HTMLCanvasElement | null,
  girlLeft: null as HTMLCanvasElement | null,
  girlRight: null as HTMLCanvasElement | null,
  table: null as HTMLCanvasElement | null,
  cat1: null as HTMLCanvasElement | null,
  cat2: null as HTMLCanvasElement | null,
  cat3: null as HTMLCanvasElement | null,
  cat4: null as HTMLCanvasElement | null,
  cat5: null as HTMLCanvasElement | null,
  speechBubble: null as HTMLCanvasElement | null,
  mangoCakeIcon: null as HTMLCanvasElement | null,
  salmonIcon: null as HTMLCanvasElement | null,
  shrimpIcon: null as HTMLCanvasElement | null,
  milkIcon: null as HTMLCanvasElement | null,
  salmonPlate: null as HTMLCanvasElement | null,
  shrimpPlate: null as HTMLCanvasElement | null,
  mangoCakePlate: null as HTMLCanvasElement | null,
  milkMug: null as HTMLCanvasElement | null,
};

let imagesLoaded = 0;
const totalImages = 19;

// Function to make white/near-white pixels transparent
function makeWhiteTransparent(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is white or near-white
    // We'll consider a pixel white if all RGB values are above 240
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }

  // Put the modified data back
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    // Process character images to make white backgrounds transparent
    transparentImages.girlForward = makeWhiteTransparent(images.girlForward);
    transparentImages.girlLeft = makeWhiteTransparent(images.girlLeft);
    transparentImages.girlRight = makeWhiteTransparent(images.girlRight);
    transparentImages.table = makeWhiteTransparent(images.table);
    transparentImages.cat1 = makeWhiteTransparent(images.cat1);
    transparentImages.cat2 = makeWhiteTransparent(images.cat2);
    transparentImages.cat3 = makeWhiteTransparent(images.cat3);
    transparentImages.cat4 = makeWhiteTransparent(images.cat4);
    transparentImages.cat5 = makeWhiteTransparent(images.cat5);
    transparentImages.speechBubble = makeWhiteTransparent(images.speechBubble);
    transparentImages.mangoCakeIcon = makeWhiteTransparent(
      images.mangoCakeIcon
    );
    transparentImages.salmonIcon = makeWhiteTransparent(images.salmonIcon);
    transparentImages.shrimpIcon = makeWhiteTransparent(images.shrimpIcon);
    transparentImages.milkIcon = makeWhiteTransparent(images.milkIcon);
    transparentImages.salmonPlate = makeWhiteTransparent(images.salmonPlate);
    transparentImages.shrimpPlate = makeWhiteTransparent(images.shrimpPlate);
    transparentImages.mangoCakePlate = makeWhiteTransparent(
      images.mangoCakePlate
    );
    transparentImages.milkMug = makeWhiteTransparent(images.milkMug);

    // All images loaded and processed, start the game loop
    gameLoop();
  }
}

// Load all images
images.background.onload = onImageLoad;
images.background.src = "/img/background.png";

images.girlForward.onload = onImageLoad;
images.girlForward.src = "/img/girl-forward.png";

images.girlLeft.onload = onImageLoad;
images.girlLeft.src = "/img/girl-left.png";

images.girlRight.onload = onImageLoad;
images.girlRight.src = "/img/girl-right.png";

images.table.onload = onImageLoad;
images.table.src = "/img/table.png";

images.cat1.onload = onImageLoad;
images.cat1.src = "/img/cat1.png";

images.cat2.onload = onImageLoad;
images.cat2.src = "/img/cat2.png";

images.cat3.onload = onImageLoad;
images.cat3.src = "/img/cat3.png";

images.cat4.onload = onImageLoad;
images.cat4.src = "/img/cat4.png";

images.cat5.onload = onImageLoad;
images.cat5.src = "/img/cat5.png";

images.speechBubble.onload = onImageLoad;
images.speechBubble.src = "/img/speech-bubble-fixed.png";

images.mangoCakeIcon.onload = onImageLoad;
images.mangoCakeIcon.src = "/img/mango-cake-icon.png";

images.salmonIcon.onload = onImageLoad;
images.salmonIcon.src = "/img/salmon-icon.png";

images.shrimpIcon.onload = onImageLoad;
images.shrimpIcon.src = "/img/shrimp-icon.png";

images.milkIcon.onload = onImageLoad;
images.milkIcon.src = "/img/milk-icon.png";

images.salmonPlate.onload = onImageLoad;
images.salmonPlate.src = "/img/salmon-plate.png";

images.shrimpPlate.onload = onImageLoad;
images.shrimpPlate.src = "/img/shrimp-plate.png";

images.mangoCakePlate.onload = onImageLoad;
images.mangoCakePlate.src = "/img/mango-cake-plate.png";

images.milkMug.onload = onImageLoad;
images.milkMug.src = "/img/milk-mug.png";

// Keyboard input handling
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
};

document.addEventListener("keydown", (e) => {
  if (
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "Space"
  ) {
    e.preventDefault();

    // Handle game start
    if (e.code === "Space" && gameState.gameState === "notStarted") {
      // Start the game
      gameState.cats = [];
      gameState.gameState = "playing";
      gameState.nextCatId = 1;
      gameState.catsServed = 0;
      gameState.lastCatSpawnTime = 0;
      gameState.catSpawnInterval = 8000;
      gameState.player.x = 200;
      gameState.player.y = 700;
      gameState.player.direction = "forward";
      gameState.carriedItem = null;
      gameState.nearbyStation = null;
      gameState.nearbyCustomer = null;
      console.log("Game started!");
      return;
    }

    // Handle game restart
    if (e.code === "Space" && gameState.gameState === "gameOver") {
      // Reset game state completely
      gameState.cats = [];
      gameState.gameState = "playing";
      gameState.nextCatId = 1;
      gameState.catsServed = 0;
      gameState.lastCatSpawnTime = 0; // Reset to 0 so it gets initialized properly
      gameState.catSpawnInterval = 8000;
      gameState.player.x = 200;
      gameState.player.y = 700;
      gameState.player.direction = "forward";
      gameState.carriedItem = null;
      gameState.nearbyStation = null;
      gameState.nearbyCustomer = null;
      console.log("Game restarted!");
      return;
    }

    keys[e.code as keyof typeof keys] = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "Space"
  ) {
    e.preventDefault();
    keys[e.code as keyof typeof keys] = false;
  }
});

// Game loop
function gameLoop() {
  // Update game state
  update();

  // Render the game
  render();

  // Continue the loop
  requestAnimationFrame(gameLoop);
}

function update() {
  if (
    gameState.gameState === "gameOver" ||
    gameState.gameState === "notStarted"
  ) {
    // Game over or not started state - don't update anything
    return;
  }

  const moveSpeed = 3;
  const currentTime = Date.now();

  // Initialize lastCatSpawnTime if it's not set
  if (gameState.lastCatSpawnTime === 0) {
    gameState.lastCatSpawnTime = currentTime;
  }

  // Calculate delta time for cat updates (time since last frame, not since last spawn)
  const deltaTimeSeconds = 1 / 60; // Assume 60fps for consistent timing

  // Update cats (movement, timers, etc.)
  updateCats(deltaTimeSeconds);

  // Spawn new cats based on timer
  if (currentTime - gameState.lastCatSpawnTime > gameState.catSpawnInterval) {
    console.log(
      `Attempting to spawn cat. Time since last spawn: ${
        currentTime - gameState.lastCatSpawnTime
      }ms`
    );
    spawnCat();
    gameState.lastCatSpawnTime = currentTime;
  }

  // Define constants that match the render function
  const tableY = 600;
  const tableScale = 0.45; // Same scale as in render function
  const tableHeight = 128; // Approximate table height in pixels (you can adjust this)
  const scaledTableHeight = tableHeight * tableScale;
  const tableStartX = Math.floor(1024 * (1 / 3));
  const tableBottomY = tableY + scaledTableHeight / 2; // Bottom edge of table

  const leftMargin = 60;
  const rightMargin = 1024 - 60;
  const stationX = 80;
  const stationSpacing = 120;
  const startY = tableY - 80 + 64;
  const bottomMargin = 900;

  // Store current position for collision detection
  const currentX = gameState.player.x;
  const currentY = gameState.player.y;
  let newX = currentX;
  let newY = currentY;

  // Handle horizontal movement and direction
  if (keys.ArrowLeft && !keys.ArrowRight) {
    newX = currentX - moveSpeed;
    gameState.player.direction = "left";
  } else if (keys.ArrowRight && !keys.ArrowLeft) {
    newX = currentX + moveSpeed;
    gameState.player.direction = "right";
  } else {
    gameState.player.direction = "forward";
  }

  // Handle vertical movement
  if (keys.ArrowUp && !keys.ArrowDown) {
    newY = currentY - moveSpeed;
  } else if (keys.ArrowDown && !keys.ArrowUp) {
    newY = currentY + moveSpeed;
  }

  // Collision detection function
  function wouldCollideWithTable(x: number, y: number): boolean {
    // Add a buffer before the table starts so player can't walk right up to the edge
    const tableBuffer = 40;
    const tableLeftEdge = tableStartX - tableBuffer;

    // If player is in the serving area (left side), no collision with tables
    if (x < tableLeftEdge) {
      return false;
    }

    // If player is in table area, check if they would be on or above the table
    // Allow walking in front of tables (below table bottom edge)
    return y < tableBottomY + 85;
  }

  // Check horizontal movement
  if (newX >= leftMargin && newX <= rightMargin) {
    if (!wouldCollideWithTable(newX, currentY)) {
      gameState.player.x = newX;
    }
  }

  // Check vertical movement
  const topMarginInServingArea = startY - 80; // Allow reaching the topmost food station
  const tableBuffer = 20;
  const tableLeftEdge = tableStartX - tableBuffer;

  if (gameState.player.x < tableLeftEdge) {
    // In serving area - allow full vertical movement within bounds
    if (newY >= topMarginInServingArea && newY <= bottomMargin) {
      gameState.player.y = newY;
    }
  } else {
    // In table area - only allow movement that doesn't collide with tables
    if (
      newY <= bottomMargin &&
      !wouldCollideWithTable(gameState.player.x, newY)
    ) {
      gameState.player.y = newY;
    }
  }

  // Define stations array to match render function
  const stations = [
    { y: startY },
    { y: startY + stationSpacing },
    { y: startY + stationSpacing * 2 },
    { y: startY + stationSpacing * 3 },
  ];

  // Reset proximity states
  gameState.nearbyStation = null;
  gameState.nearbyCustomer = null;

  const handY = gameState.player.y + 16; // Girl's hand position

  // Check for nearby food stations
  const isInServingArea =
    gameState.player.x >= tableStartX && gameState.player.y >= tableY - 80;

  if (!isInServingArea) {
    const pickupAreaLeftBound = stationX - 40;
    const pickupAreaRightBound = Math.floor(1024 * (1 / 3)) - 30;

    // Check if player is within horizontal bounds for pickup
    if (
      gameState.player.x >= pickupAreaLeftBound &&
      gameState.player.x <= pickupAreaRightBound
    ) {
      // Find which station the player's hands are aligned with
      stations.forEach((station, index) => {
        const stationTopY = station.y - 60;
        const stationBottomY = station.y + 60;

        if (handY >= stationTopY && handY <= stationBottomY) {
          gameState.nearbyStation = index;
        }
      });
    }
  }

  // Check for nearby cats (dynamic)
  if (isInServingArea) {
    const catWidth = 64;
    const servingTolerance = catWidth * 0.33;

    gameState.cats.forEach((cat, index) => {
      if (cat.state === "seated") {
        if (Math.abs(gameState.player.x - cat.x) <= servingTolerance) {
          gameState.nearbyCustomer = index;
        }
      }
    });
  }

  // Handle serving when spacebar is pressed
  if (
    keys.Space &&
    gameState.nearbyCustomer !== null &&
    gameState.carriedItem
  ) {
    const targetCat = gameState.cats[gameState.nearbyCustomer];
    if (targetCat && targetCat.order === gameState.carriedItem.type) {
      // Correct order served!
      targetCat.state = "eating";
      targetCat.timeRemaining = 2; // 2 seconds eating time
      gameState.carriedItem = null;
      gameState.catsServed++;
      console.log(
        `Served ${targetCat.order} to cat ${targetCat.id}. Total served: ${gameState.catsServed}`
      );
    }
  }

  // Handle pickup when spacebar is pressed (only if not serving)
  else if (keys.Space && gameState.nearbyStation !== null) {
    const stationTypes = ["salmon", "shrimp", "mangoCake", "milk"] as const;
    const stationImages = [
      transparentImages.salmonPlate,
      transparentImages.shrimpPlate,
      transparentImages.mangoCakePlate,
      transparentImages.milkMug,
    ];

    // Always pick up the item from the nearby station, replacing any carried item
    gameState.carriedItem = {
      type: stationTypes[gameState.nearbyStation],
      image: stationImages[gameState.nearbyStation],
    };
  }
}

// Cat management functions
function getRandomCatSprite(): HTMLCanvasElement | null {
  const catSprites = [
    transparentImages.cat1,
    transparentImages.cat2,
    transparentImages.cat3,
    transparentImages.cat4,
    transparentImages.cat5,
  ];
  const randomIndex = Math.floor(Math.random() * catSprites.length);
  return catSprites[randomIndex];
}

function getRandomOrder(): "salmon" | "shrimp" | "mangoCake" | "milk" {
  const orders = ["salmon", "shrimp", "mangoCake", "milk"] as const;
  const randomIndex = Math.floor(Math.random() * orders.length);
  return orders[randomIndex];
}

function getOrderIcon(
  order: "salmon" | "shrimp" | "mangoCake" | "milk"
): HTMLCanvasElement | null {
  switch (order) {
    case "salmon":
      return transparentImages.salmonIcon;
    case "shrimp":
      return transparentImages.shrimpIcon;
    case "mangoCake":
      return transparentImages.mangoCakeIcon;
    case "milk":
      return transparentImages.milkIcon;
    default:
      return null;
  }
}

function findAvailableSeat(): { x: number; y: number } | null {
  const tableStartX = Math.floor(1024 * (1 / 3));
  const tableY = 600;
  const catScale = 0.5;
  const catWidth = 64 * catScale; // Approximate cat width
  const servingZoneWidth = catWidth * 0.33; // 33% of sprite width
  const minSpacing = catWidth + servingZoneWidth * 2; // Cat width + both serving zones

  // Define possible seat positions along the table
  const seatStartX = tableStartX + 100;
  const seatEndX = 1024 - 100;
  const seatY = tableY - 20;

  // Create array of potential seats
  const potentialSeats: { x: number; y: number }[] = [];

  // Find all available seat positions
  for (let x = seatStartX; x < seatEndX; x += 80) {
    // Increased spacing to 80 pixels
    let canSitHere = true;

    // Check if this position conflicts with any existing cats
    for (const cat of gameState.cats) {
      if (
        cat.state === "seated" ||
        cat.state === "eating" ||
        cat.state === "entering"
      ) {
        const distance = Math.abs(x - cat.targetX); // Use targetX instead of current x for entering cats
        if (distance < minSpacing) {
          canSitHere = false;
          break;
        }
      }
    }

    if (canSitHere) {
      potentialSeats.push({ x, y: seatY });
    }
  }

  // Randomly select from available seats
  if (potentialSeats.length > 0) {
    const randomIndex = Math.floor(Math.random() * potentialSeats.length);
    return potentialSeats[randomIndex];
  }

  return null; // No available seats
}

function spawnCat(): void {
  const seat = findAvailableSeat();
  if (!seat) return; // No available seats

  // Calculate timer duration based on difficulty
  const baseTime = 12; // 12 seconds initially
  const difficultyReduction = Math.floor(gameState.catsServed / 3); // 1 second reduction per 3 cats served
  const timerDuration = Math.max(5, baseTime - difficultyReduction); // Minimum 5 seconds

  const randomOrder = getRandomOrder();
  const randomSprite = getRandomCatSprite();

  console.log(
    `Spawning cat at position (${seat.x}, ${seat.y}) with order: ${randomOrder}, timer: ${timerDuration}s`
  );

  const newCat: Cat = {
    id: gameState.nextCatId++,
    x: 1024 + 50, // Start off-screen to the right
    y: seat.y,
    targetX: seat.x,
    targetY: seat.y,
    order: randomOrder,
    timeRemaining: timerDuration,
    maxTime: timerDuration,
    state: "entering",
    sprite: randomSprite,
  };

  gameState.cats.push(newCat);
}

function updateCats(deltaTime: number): void {
  const catMoveSpeed = 2;

  for (let i = gameState.cats.length - 1; i >= 0; i--) {
    const cat = gameState.cats[i];

    // Update cat movement based on state
    switch (cat.state) {
      case "entering":
        // Move cat towards its target seat
        const dx = cat.targetX - cat.x;
        if (Math.abs(dx) > catMoveSpeed) {
          cat.x += dx > 0 ? catMoveSpeed : -catMoveSpeed;
        } else {
          cat.x = cat.targetX;
          cat.state = "seated";
          console.log(
            `Cat ${cat.id} has seated and is ordering ${cat.order}. Timer: ${cat.timeRemaining}s`
          );
        }
        break;

      case "seated":
        // Cat is seated, countdown timer
        cat.timeRemaining -= deltaTime;
        if (cat.timeRemaining <= 0) {
          // Game over - cat ran out of patience
          console.log(`Cat ${cat.id} ran out of patience! Game over.`);
          gameState.gameState = "gameOver";
          return;
        }
        break;

      case "eating":
        // Cat is eating, wait a bit then start leaving
        cat.timeRemaining -= deltaTime;
        if (cat.timeRemaining <= 0) {
          cat.state = "leaving";
          cat.targetX = 1024 + 50; // Move off-screen to the right
          console.log(`Cat ${cat.id} finished eating and is leaving`);
        }
        break;

      case "leaving":
        // Move cat towards exit
        const exitDx = cat.targetX - cat.x;
        if (Math.abs(exitDx) > catMoveSpeed) {
          cat.x += exitDx > 0 ? catMoveSpeed : -catMoveSpeed;
        } else {
          // Cat has left, remove from array
          console.log(`Cat ${cat.id} has left the restaurant`);
          gameState.cats.splice(i, 1);
        }
        break;
    }
  }
}

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, 1024, 1024);

  // Always draw background first
  ctx.drawImage(images.background, 0, 0, 1024, 1024);

  if (gameState.gameState === "notStarted") {
    // Draw start screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = "white";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Welcome to Catstaurant!", 512, 300);

    ctx.font = "bold 32px Arial";
    ctx.fillText("Serve the cats before they get impatient!", 512, 380);
    ctx.fillText(
      "Use arrow keys to move, SPACE to pick up and serve food",
      512,
      440
    );
    ctx.font = "bold 40px Arial";
    ctx.fillText("Press SPACE to start", 512, 580);
    return;
  }

  if (gameState.gameState === "gameOver") {
    // Draw game over screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = "white";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", 512, 400);

    ctx.font = "bold 32px Arial";
    ctx.fillText(`Cats Served: ${gameState.catsServed}`, 512, 450);
    ctx.font = "bold 40px Arial";
    ctx.fillText("Press SPACE to restart", 512, 500);
    return;
  }

  // Draw food stations on the left side
  if (
    transparentImages.salmonPlate &&
    transparentImages.shrimpPlate &&
    transparentImages.mangoCakePlate &&
    transparentImages.milkMug
  ) {
    const tableY = 600;
    const stationX = 80; // X position for all stations (left side)
    const stationScale = 0.25; // Scale down the food plates/mugs

    // Define the 4 station positions (more spacing between stations)
    const stationSpacing = 120; // Increased from 90 to 120
    const startY = tableY - 80 + 64; // Move all stations down by 64 pixels

    const stations = [
      { food: transparentImages.salmonPlate, y: startY },
      { food: transparentImages.shrimpPlate, y: startY + stationSpacing },
      {
        food: transparentImages.mangoCakePlate,
        y: startY + stationSpacing * 2,
      },
      { food: transparentImages.milkMug, y: startY + stationSpacing * 3 },
    ];

    ctx.imageSmoothingEnabled = false;

    // Draw each station with stacks of 3 plates/mugs in a triangular arrangement
    stations.forEach((station, index) => {
      const foodWidth = station.food.width * stationScale;
      const foodHeight = station.food.height * stationScale;

      // Draw glow effect if player is nearby this station (with smoothing enabled)
      if (gameState.nearbyStation === index) {
        ctx.imageSmoothingEnabled = true; // Enable smoothing for glow

        const glowRadius = 120; // Much larger radius for high visibility
        const glowGradient = ctx.createRadialGradient(
          stationX,
          station.y,
          0,
          stationX,
          station.y,
          glowRadius
        );
        glowGradient.addColorStop(0, "rgba(255, 255, 0, 0.8)"); // Very bright yellow glow
        glowGradient.addColorStop(0.5, "rgba(255, 255, 0, 0.5)"); // Mid fade
        glowGradient.addColorStop(1, "rgba(255, 255, 0, 0)"); // Fade to transparent

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(stationX, station.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = false; // Back to pixelated for food
      }

      // Create a triangular stack pattern
      // Bottom plate (base of triangle)
      ctx.drawImage(
        station.food,
        stationX - foodWidth / 2,
        station.y - foodHeight / 2,
        foodWidth,
        foodHeight
      );

      // Left plate (left side of triangle)
      ctx.drawImage(
        station.food,
        stationX - foodWidth / 2 - 36, // Move left (increased to 36 pixels)
        station.y - foodHeight / 2 - 24, // Move up (increased to 24 pixels)
        foodWidth,
        foodHeight
      );

      // Right plate (right side of triangle)
      ctx.drawImage(
        station.food,
        stationX - foodWidth / 2 + 36, // Move right (increased to 36 pixels)
        station.y - foodHeight / 2 - 24, // Move up (increased to 24 pixels)
        foodWidth,
        foodHeight
      );
    });

    ctx.imageSmoothingEnabled = true;
  }

  // Draw dynamic cats
  gameState.cats.forEach((cat, index) => {
    if (!cat.sprite) return;

    const catScale = 0.5; // Scale cats down to appropriate size
    const catWidth = cat.sprite.width * catScale;
    const catHeight = cat.sprite.height * catScale;

    ctx.imageSmoothingEnabled = false;

    // Draw serving highlight if player can serve this cat
    if (gameState.nearbyCustomer === index && cat.state === "seated") {
      ctx.imageSmoothingEnabled = true; // Enable smoothing for glow

      const glowRadius = 80; // Bright glow around serveable cat
      const glowGradient = ctx.createRadialGradient(
        cat.x,
        cat.y,
        0,
        cat.x,
        cat.y,
        glowRadius
      );
      glowGradient.addColorStop(0, "rgba(0, 255, 0, 0.8)"); // Bright green glow
      glowGradient.addColorStop(0.5, "rgba(0, 255, 0, 0.5)"); // Mid fade
      glowGradient.addColorStop(1, "rgba(0, 255, 0, 0)"); // Fade to transparent

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(cat.x, cat.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.imageSmoothingEnabled = false; // Back to pixelated for sprites
    }

    // Draw the cat
    ctx.drawImage(
      cat.sprite,
      cat.x - catWidth / 2,
      cat.y - catHeight / 2,
      catWidth,
      catHeight
    );

    // Draw speech bubble and order icon for seated cats
    if (cat.state === "seated" && transparentImages.speechBubble) {
      const orderIcon = getOrderIcon(cat.order);
      if (orderIcon) {
        const bubbleScale = 0.35;
        const bubbleWidth = transparentImages.speechBubble.width * bubbleScale;
        const bubbleHeight =
          transparentImages.speechBubble.height * bubbleScale;

        // Position bubble above cat
        const bubbleX = cat.x + 20;
        const bubbleY = cat.y - catHeight / 2 - bubbleHeight / 2 - 20;

        // Draw the speech bubble
        ctx.drawImage(
          transparentImages.speechBubble,
          bubbleX - bubbleWidth / 2,
          bubbleY - bubbleHeight / 2,
          bubbleWidth,
          bubbleHeight
        );

        // Draw order icon inside the speech bubble
        const iconScale = 0.15;
        const iconWidth = orderIcon.width * iconScale;
        const iconHeight = orderIcon.height * iconScale;

        const iconX = bubbleX;
        const iconY = bubbleY - 10;

        ctx.drawImage(
          orderIcon,
          iconX - iconWidth / 2,
          iconY - iconHeight / 2,
          iconWidth,
          iconHeight
        );

        // Draw timer bar above speech bubble
        const timerBarWidth = bubbleWidth;
        const timerBarHeight = 8;
        const timerBarX = bubbleX - timerBarWidth / 2;
        const timerBarY = bubbleY - bubbleHeight / 2 - 15;

        // Timer background (gray)
        ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
        ctx.fillRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);

        // Timer foreground (white, shrinks as time runs out)
        const timerProgress = cat.timeRemaining / cat.maxTime;
        ctx.fillStyle = "white";
        ctx.fillRect(
          timerBarX,
          timerBarY,
          timerBarWidth * timerProgress,
          timerBarHeight
        );
      }
    }

    ctx.imageSmoothingEnabled = true;
  });

  // Draw table extending from right edge to about 2/3 across the canvas
  // Table should be tiled horizontally (drawn AFTER cats so it appears in front)
  if (transparentImages.table) {
    const tableStartX = Math.floor(1024 * (1 / 3)); // Start at 1/3 from left (2/3 coverage)
    const tableY = 600; // Position vertically
    const tableWidth = images.table.naturalWidth;
    const tableHeight = images.table.naturalHeight;

    // Scale the table down to a reasonable size while maintaining pixelation
    const tableScale = 0.45; // Reduced by 25% from 0.6
    const scaledTableWidth = tableWidth * tableScale;
    const scaledTableHeight = tableHeight * tableScale;

    // Tile the table horizontally from tableStartX to the right edge
    const tableEndX = 1024;
    let currentX = tableStartX;

    // Use nearest-neighbor scaling to maintain pixelated look
    ctx.imageSmoothingEnabled = false;

    while (currentX < tableEndX) {
      const remainingWidth = tableEndX - currentX;
      const drawWidth = Math.min(scaledTableWidth, remainingWidth);

      ctx.drawImage(
        transparentImages.table,
        0,
        0, // Source position
        drawWidth / tableScale,
        tableHeight, // Source size (adjust for partial tiles)
        currentX,
        tableY, // Destination position
        drawWidth,
        scaledTableHeight // Destination size
      );

      currentX += scaledTableWidth;
    }

    // Re-enable smoothing for other elements if needed
    ctx.imageSmoothingEnabled = true;
  }

  // Draw player character with transparent background (scaled down)
  let playerImage;
  switch (gameState.player.direction) {
    case "left":
      playerImage = transparentImages.girlLeft;
      break;
    case "right":
      playerImage = transparentImages.girlRight;
      break;
    default:
      playerImage = transparentImages.girlForward;
  }

  if (playerImage) {
    // Scale the character down to sprite size while maintaining pixelation
    const characterScale = 0.4; // Make her much smaller and more sprite-like
    const scaledWidth = playerImage.width * characterScale;
    const scaledHeight = playerImage.height * characterScale;

    // Use nearest-neighbor scaling to maintain pixelated look
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      playerImage,
      gameState.player.x - scaledWidth / 2,
      gameState.player.y - scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Draw carried item in player's hands if carrying something
    if (
      gameState.carriedItem &&
      gameState.carriedItem.type &&
      gameState.carriedItem.image
    ) {
      const carriedScale = 0.15; // Smaller scale for carried items
      const carriedWidth = gameState.carriedItem.image.width * carriedScale;
      const carriedHeight = gameState.carriedItem.image.height * carriedScale;

      // Position near the player's hands (3/4 down, slightly forward)
      const handOffsetY = 0.25 * scaledHeight; // 3/4 down from center
      const handOffsetX =
        gameState.player.direction === "left"
          ? -15
          : gameState.player.direction === "right"
          ? 15
          : 0;

      ctx.drawImage(
        gameState.carriedItem.image,
        gameState.player.x + handOffsetX - carriedWidth / 2,
        gameState.player.y + handOffsetY - carriedHeight / 2,
        carriedWidth,
        carriedHeight
      );
    }

    // Re-enable smoothing
    ctx.imageSmoothingEnabled = true;
  }

  // Draw score in top left area during gameplay
  if (gameState.gameState === "playing") {
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    // Draw "SCORE" label
    ctx.font = "bold 48px monospace";
    ctx.fillText("SCORE", 245, 180); // Center of scoreboard area horizontally

    // Draw score with leading zeros
    ctx.font = "bold 64px monospace";
    const scoreText = gameState.catsServed.toString().padStart(4, "0");
    ctx.fillText(scoreText, 245, 240);
  }
}
