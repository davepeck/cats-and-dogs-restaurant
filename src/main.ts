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
};

// Load images
const images = {
  background: new Image(),
  girlForward: new Image(),
  girlLeft: new Image(),
  girlRight: new Image(),
  table: new Image(),
  cat1: new Image(),
  cat3: new Image(), // I'll use cat1 and cat3 as they look good together
  speechBubble: new Image(),
  mangoCakeIcon: new Image(),
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
  cat3: null as HTMLCanvasElement | null,
  speechBubble: null as HTMLCanvasElement | null,
  mangoCakeIcon: null as HTMLCanvasElement | null,
  salmonPlate: null as HTMLCanvasElement | null,
  shrimpPlate: null as HTMLCanvasElement | null,
  mangoCakePlate: null as HTMLCanvasElement | null,
  milkMug: null as HTMLCanvasElement | null,
};

let imagesLoaded = 0;
const totalImages = 13;

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
    transparentImages.cat3 = makeWhiteTransparent(images.cat3);
    transparentImages.speechBubble = makeWhiteTransparent(images.speechBubble);
    transparentImages.mangoCakeIcon = makeWhiteTransparent(
      images.mangoCakeIcon
    );
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

images.cat3.onload = onImageLoad;
images.cat3.src = "/img/cat3.png";

images.speechBubble.onload = onImageLoad;
images.speechBubble.src = "/img/speech-bubble-fixed.png";

images.mangoCakeIcon.onload = onImageLoad;
images.mangoCakeIcon.src = "/img/mango-cake-icon.png";

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
  const moveSpeed = 3;

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

  // Cat positions that match the render function
  const cat1X = tableStartX + 150;
  const cat2X = tableStartX + 400;

  // Check if player is in serving area (in front of table)
  const isInServingArea =
    gameState.player.x >= tableStartX && gameState.player.y >= tableY - 80;

  if (isInServingArea) {
    // Check if player is aligned with any cat (33% of sprite width tolerance)
    const catWidth = 64;
    const servingTolerance = catWidth * 0.33;

    // Check cat 1
    if (Math.abs(gameState.player.x - cat1X) <= servingTolerance) {
      gameState.nearbyCustomer = 0;
    }
    // Check cat 2
    else if (Math.abs(gameState.player.x - cat2X) <= servingTolerance) {
      gameState.nearbyCustomer = 1;
    }
  }

  // If not in serving area, check food stations
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

  // Handle serving when spacebar is pressed
  if (
    keys.Space &&
    gameState.nearbyCustomer !== null &&
    gameState.carriedItem
  ) {
    console.log(
      `Serving ${gameState.carriedItem.type} to cat ${gameState.nearbyCustomer}`
    );
    gameState.carriedItem = null; // Remove the carried item
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

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, 1024, 1024);

  // Draw background
  ctx.drawImage(images.background, 0, 0, 1024, 1024);

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

  // Draw cat customers BEHIND the table (so table will overlap them)
  if (transparentImages.cat1 && transparentImages.cat3) {
    const tableStartX = Math.floor(1024 * (1 / 3));
    const tableY = 600;
    const catScale = 0.5; // Scale cats down to appropriate size

    // Position cats along the table length
    const cat1X = tableStartX + 150; // First cat position
    const cat3X = tableStartX + 400; // Second cat position
    const catY = tableY - 20; // Position them slightly behind/above table level

    ctx.imageSmoothingEnabled = false;

    // Draw serving highlight if player can serve a cat
    if (gameState.nearbyCustomer !== null) {
      ctx.imageSmoothingEnabled = true; // Enable smoothing for glow

      const targetCatX = gameState.nearbyCustomer === 0 ? cat1X : cat3X;
      const glowRadius = 80; // Bright glow around serveable cat
      const glowGradient = ctx.createRadialGradient(
        targetCatX,
        catY,
        0,
        targetCatX,
        catY,
        glowRadius
      );
      glowGradient.addColorStop(0, "rgba(0, 255, 0, 0.8)"); // Bright green glow
      glowGradient.addColorStop(0.5, "rgba(0, 255, 0, 0.5)"); // Mid fade
      glowGradient.addColorStop(1, "rgba(0, 255, 0, 0)"); // Fade to transparent

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(targetCatX, catY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.imageSmoothingEnabled = false; // Back to pixelated for sprites
    }

    // Draw first cat (cat1)
    const cat1Width = transparentImages.cat1.width * catScale;
    const cat1Height = transparentImages.cat1.height * catScale;
    ctx.drawImage(
      transparentImages.cat1,
      cat1X - cat1Width / 2,
      catY - cat1Height / 2,
      cat1Width,
      cat1Height
    );

    // Draw second cat (cat3)
    const cat3Width = transparentImages.cat3.width * catScale;
    const cat3Height = transparentImages.cat3.height * catScale;
    ctx.drawImage(
      transparentImages.cat3,
      cat3X - cat3Width / 2,
      catY - cat3Height / 2,
      cat3Width,
      cat3Height
    );

    // Draw speech bubble above cat1 with mango cake icon
    if (transparentImages.speechBubble && transparentImages.mangoCakeIcon) {
      const bubbleScale = 0.35; // Scale speech bubble down significantly
      const bubbleWidth = transparentImages.speechBubble.width * bubbleScale;
      const bubbleHeight = transparentImages.speechBubble.height * bubbleScale;

      // Position bubble above cat1, accounting for the triangle being on bottom-left
      // The triangle should point toward cat1's head
      const bubbleX = cat1X + 20; // Offset slightly right so triangle points to cat
      const bubbleY = catY - cat1Height / 2 - bubbleHeight / 2 - 20; // Above cat's head

      // Draw the speech bubble
      ctx.drawImage(
        transparentImages.speechBubble,
        bubbleX - bubbleWidth / 2,
        bubbleY - bubbleHeight / 2,
        bubbleWidth,
        bubbleHeight
      );

      // Draw mango cake icon inside the speech bubble
      const iconScale = 0.15; // Very small scale for the icon
      const iconWidth = transparentImages.mangoCakeIcon.width * iconScale;
      const iconHeight = transparentImages.mangoCakeIcon.height * iconScale;

      // Center the icon in the bubble (slightly up from center)
      const iconX = bubbleX;
      const iconY = bubbleY - 10; // Slightly above center of bubble

      ctx.drawImage(
        transparentImages.mangoCakeIcon,
        iconX - iconWidth / 2,
        iconY - iconHeight / 2,
        iconWidth,
        iconHeight
      );
    }

    ctx.imageSmoothingEnabled = true;
  }

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
}
