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

let defaultMarkerWidth = 3;

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

type point = { x: number; y: number };

class MarkerCommand implements DisplayCommand {
  points: point[] = [];
  color: string;
  width: number;

  constructor(color = "black", width = 2, start?: point) {
    this.color = color;
    this.width = width;

    if (start) {
      this.points.push(start);
    }
  }

  drag(x: number, y: number) {
    this.addPoint({ x, y });
  }

  addPoint(p: point) {
    this.points.push(p);
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 1) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }
}

const strokes: DisplayCommand[] = [];
const drawingChanged = new Event("drawing-changed");
const redoStack: DisplayCommand[] = [];

let currentStroke: MarkerCommand | null = null;

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  redoStack.length = 0;
  currentStroke = new MarkerCommand("black", defaultMarkerWidth, {
    x: cursor.x,
    y: cursor.y,
  });
  strokes.push(currentStroke);

  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentStroke) {
    return;
  }

  const x = e.offsetX;
  const y = e.offsetY;

  currentStroke.drag(x, y);
  cursor.x = x;
  cursor.y = y;

  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentStroke = null;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  for (const cmd of strokes) {
    cmd.display(ctx);
  }
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  strokes.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(drawingChanged);
});

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    const s = strokes.pop()!;
    redoStack.push(s);
    canvas.dispatchEvent(drawingChanged);
  }
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const s = redoStack.pop()!;
    strokes.push(s);
  }

  canvas.dispatchEvent(drawingChanged);
});

const markerStatus = document.createElement("div");
markerStatus.className = "marker-status default";

const labels: Record<string, string> = {
  default: "Default Marker",
  thin: "Thin Marker",
  thick: "Thick Marker",
};

markerStatus.textContent = labels["default"] ?? "Marker";
document.body.appendChild(markerStatus);

function updateMarkerStatus(kind: "default" | "thin" | "thick") {
  markerStatus.classList.toggle("default", kind === "default");
  markerStatus.classList.toggle("thin", kind === "thin");
  markerStatus.classList.toggle("thick", kind === "thick");
  markerStatus.textContent = labels[kind] ?? "Marker";
}

const defaultButton = document.createElement("button");
defaultButton.textContent = "Default Marker";
document.body.appendChild(defaultButton);

defaultButton.addEventListener("click", () => {
  defaultMarkerWidth = 3;

  updateMarkerStatus("default");
});

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

thinButton.addEventListener("click", () => {
  defaultMarkerWidth = 1;

  updateMarkerStatus("thin");
});

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

thickButton.addEventListener("click", () => {
  defaultMarkerWidth = 5;

  updateMarkerStatus("thick");
});
