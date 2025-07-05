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

// Load and draw the background image
const backgroundImage = new Image();
backgroundImage.onload = () => {
  ctx.drawImage(backgroundImage, 0, 0, 1024, 1024);
};
backgroundImage.src = "/img/background.png";
