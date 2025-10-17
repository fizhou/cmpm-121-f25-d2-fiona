import "./style.css";

const heading = document.createElement("h1");
heading.textContent = "Sketch App :3";
document.body.appendChild(heading);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);
