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

class cursorPreview {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "25px Lucida Console";
    ctx.fillStyle = "black";
    ctx.fillText("+", this.x - 7, this.y + 6);
    ctx.restore();
  }
}

const strokes: DisplayCommand[] = [];
const redoStack: DisplayCommand[] = [];

const drawingChanged = new Event("drawing-changed");

let currentStroke: MarkerCommand | null = null;
let currentPreview: cursorPreview | null = null;

type toolMovedDetail = { x: number; y: number };
type toolMovedEvent = CustomEvent<toolMovedDetail>;

const toolMoved = "tool-moved";

class EmojiCommand implements DisplayCommand {
  emoji: string;
  x: number;
  y: number;
  size: number;

  constructor(emoji: string, x: number, y: number, size = 48) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.size = size;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font =
      `${this.size}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

class StickerPreviewCommand implements DisplayCommand {
  emoji: string;
  x: number;
  y: number;
  size: number;

  constructor(emoji: string, x: number, y: number, size = 48) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.size = size;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.5; // ghost preview
    ctx.font =
      `${this.size}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

const stickers = [
  { label: "Heart 💖", emoji: "💖" },
  { label: "Star ⭐", emoji: "⭐" },
  { label: "Sparkle ✨", emoji: "✨" },
];

let selectedSticker: string | null = null;
let stickerPreview: StickerPreviewCommand | null = null;
let draggingSticker: EmojiCommand | null = null;

//

canvas.addEventListener("mouseenter", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentPreview = new cursorPreview(cursor.x, cursor.y);
  canvas.dispatchEvent(
    new CustomEvent<toolMovedDetail>(toolMoved, {
      detail: { x: cursor.x, y: cursor.y },
    }),
  );
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mouseleave", () => {
  currentPreview = null;
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousedown", (e) => {
  if (selectedSticker) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;

    redoStack.length = 0; // new action invalidates redo
    const cmd = new EmojiCommand(selectedSticker, x, y);
    strokes.push(cmd);
    draggingSticker = cmd;

    canvas.dispatchEvent(new Event("drawing-changed"));
    return;
  }

  // Marker behavior (no sticker selected)
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
  if (selectedSticker) return;

  const x = e.offsetX;
  const y = e.offsetY;

  currentPreview = new cursorPreview(x, y);
  canvas.dispatchEvent(
    new CustomEvent<toolMovedDetail>(toolMoved, { detail: { x, y } }),
  );

  if (cursor.active && currentStroke) {
    currentStroke.drag(x, y);
  }

  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (!selectedSticker || !stickerPreview) {
    return;
  }
  const r = canvas.getBoundingClientRect();
  stickerPreview.x = e.clientX - r.left;
  stickerPreview.y = e.clientY - r.top;
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!draggingSticker) {
    return;
  }
  const r = canvas.getBoundingClientRect();
  draggingSticker.drag(e.clientX - r.left, e.clientY - r.top);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentStroke = null;
  draggingSticker = null;

  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of strokes) {
    cmd.display(ctx);
  }

  if (stickerPreview) {
    stickerPreview.display(ctx);
  }

  if (!selectedSticker && !cursor.active && currentPreview) {
    currentPreview.draw(ctx);
  }
});

canvas.addEventListener("tool-moved", () => {
  canvas.dispatchEvent(drawingChanged);
});

// UI BUTTONS

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

// MARKER STATUS CONTROLS

const markerStatus = document.createElement("div");
markerStatus.className = "marker-status default";

const labels: Record<string, string> = {
  default: "Default Marker",
  thin: "Thin Marker",
  thick: "Thick Marker",
  heart: "Heart Sticker",
  star: "Star Sticker",
  sparkle: "Sparkle Sticker",
};

markerStatus.textContent = labels["default"] ?? "Marker";
document.body.appendChild(markerStatus);

function updateMarkerStatus(
  kind: "default" | "thin" | "thick" | "heart" | "star" | "sparkle",
) {
  {
    markerStatus.classList.toggle("default", kind === "default");
    markerStatus.classList.toggle("thin", kind === "thin");
    markerStatus.classList.toggle("thick", kind === "thick");
    markerStatus.classList.toggle("heart", kind === "heart");
    markerStatus.classList.toggle("star", kind === "star");
    markerStatus.classList.toggle("sparkle", kind === "sparkle");
    markerStatus.textContent = labels[kind] ?? "Marker";
  }
}

// MARKER BUTTONS

const defaultButton = document.createElement("button");
defaultButton.textContent = "Default Marker";
document.body.appendChild(defaultButton);

defaultButton.addEventListener("click", () => {
  defaultMarkerWidth = 3;
  selectedSticker = null;
  canvas.dispatchEvent(drawingChanged);
  updateMarkerStatus("default");
});

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

thinButton.addEventListener("click", () => {
  defaultMarkerWidth = 1;
  selectedSticker = null;
  canvas.dispatchEvent(drawingChanged);
  updateMarkerStatus("thin");
});

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

thickButton.addEventListener("click", () => {
  defaultMarkerWidth = 5;
  selectedSticker = null;
  canvas.dispatchEvent(drawingChanged);
  updateMarkerStatus("thick");
});

// STICKER BUTTONS

const stickerButtons: HTMLButtonElement[] = [];
const stickerBar = document.createElement("div");
document.body.appendChild(stickerBar);

const customSticker = document.createElement("button");
customSticker.textContent = "Custom Sticker";
stickerBar.appendChild(customSticker);

customSticker.addEventListener("click", () => {
  const emoji = prompt("Enter an emoji for your custom sticker:", "🌟");

  if (emoji == null) {
    return;
  } else if (emoji) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.addEventListener("click", () => selectSticker(emoji, btn));
    stickerBar.appendChild(btn);
    stickerButtons.push(btn);
    selectSticker(emoji, btn);
  }
});

function selectSticker(emoji: string, clickedBtn: HTMLButtonElement) {
  stickerButtons.forEach((b) => b.classList.remove("selectedTool"));
  clickedBtn.classList.add("selectedTool");

  selectedSticker = emoji;

  if (!stickerPreview) {
    stickerPreview = new StickerPreviewCommand(
      emoji,
      canvas.width / 2,
      canvas.height / 2,
    );
  } else {
    stickerPreview.emoji = emoji;
  }

  if (emoji === "💖") updateMarkerStatus("heart");
  else if (emoji === "⭐") updateMarkerStatus("star");
  else if (emoji === "✨") updateMarkerStatus("sparkle");

  canvas.dispatchEvent(new Event("tool-moved"));
}

stickers.forEach(({ label, emoji }) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", () => selectSticker(emoji, btn));
  stickerBar.appendChild(btn);
  stickerButtons.push(btn);
});
