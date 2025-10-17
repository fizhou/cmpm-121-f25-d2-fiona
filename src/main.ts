import "./style.css";

const heading = document.createElement("h1");
heading.textContent = "Sketch App :3";
document.body.appendChild(heading);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.strokeStyle = "black";
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
