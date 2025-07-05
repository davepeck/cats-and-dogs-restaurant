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
    x: 400, // Start near center
    y: 500, // Position on screen
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
};

// Store processed transparent versions of character images
const transparentImages = {
  girlForward: null as HTMLCanvasElement | null,
  girlLeft: null as HTMLCanvasElement | null,
  girlRight: null as HTMLCanvasElement | null,
};

let imagesLoaded = 0;
const totalImages = 4;

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

  // Keep player within bounds (with some margin for character width)
  const margin = 150; // Approximate half-width of character
  gameState.player.x = Math.max(
    margin,
    Math.min(1024 - margin, gameState.player.x)
  );
}

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, 1024, 1024);

  // Draw background
  ctx.drawImage(images.background, 0, 0, 1024, 1024);

  // Draw player character with transparent background
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
    // Center the character image on the player position
    const charWidth = playerImage.width;
    const charHeight = playerImage.height;
    ctx.drawImage(
      playerImage,
      gameState.player.x - charWidth / 2,
      gameState.player.y - charHeight / 2
    );
  }
}
