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
};

// Load images
const images = {
  background: new Image(),
  girlForward: new Image(),
  girlLeft: new Image(),
  girlRight: new Image(),
  table: new Image(),
};

// Store processed transparent versions of character images
const transparentImages = {
  girlForward: null as HTMLCanvasElement | null,
  girlLeft: null as HTMLCanvasElement | null,
  girlRight: null as HTMLCanvasElement | null,
  table: null as HTMLCanvasElement | null,
};

let imagesLoaded = 0;
const totalImages = 5;

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

// Keyboard input handling
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
    e.preventDefault();
    keys[e.code as keyof typeof keys] = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
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

  // Handle movement and direction
  if (keys.ArrowLeft && !keys.ArrowRight) {
    gameState.player.x -= moveSpeed;
    gameState.player.direction = "left";
  } else if (keys.ArrowRight && !keys.ArrowLeft) {
    gameState.player.x += moveSpeed;
    gameState.player.direction = "right";
  } else {
    gameState.player.direction = "forward";
  }

  // Keep player within bounds (adjusted for smaller character and table layout)
  // Left side: more room for server area, right side: stop before table
  const leftMargin = 60; // Smaller margin since character is smaller
  const rightMargin = Math.floor(1024 * (1 / 3)) - 30; // Stop before table starts with small buffer
  gameState.player.x = Math.max(
    leftMargin,
    Math.min(rightMargin, gameState.player.x)
  );
}

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, 1024, 1024);

  // Draw background
  ctx.drawImage(images.background, 0, 0, 1024, 1024);

  // Draw table extending from right edge to about 2/3 across the canvas
  // Table should be tiled horizontally
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

    // Re-enable smoothing
    ctx.imageSmoothingEnabled = true;
  }
}
