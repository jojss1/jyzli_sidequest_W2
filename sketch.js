// PANIC BLOB
// Emotion expressed via frantic motion, camera shake, color shift, and environment

let floorY3;
let platforms = [];

// Panic FX
let panic = 0; // 0..1
let shakeAmt = 0; // camera shake strength

// Player character (soft, animated blob)
let blob3 = {
  x: 80,
  y: 0,

  r: 26,
  points: 52,
  wobble: 7,
  wobbleFreq: 1.05,

  t: 0,
  tSpeed: 0.012,

  vx: 0,
  vy: 0,

  // PANIC tuning
  accel: 0.75,
  maxRun: 4.8,
  gravity: 0.7,
  jumpV: -11.5,

  onGround: false,

  frictionAir: 0.992,
  frictionGround: 0.84,
};

function setup() {
  createCanvas(640, 360);
  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  // Platforms
  platforms = [
    { x: 0, y: floorY3, w: width, h: height - floorY3 },
    { x: 120, y: floorY3 - 70, w: 120, h: 12 },
    { x: 300, y: floorY3 - 120, w: 90, h: 12 },
    { x: 440, y: floorY3 - 180, w: 130, h: 12 },
    { x: 520, y: floorY3 - 70, w: 90, h: 12 },
  ];

  // Start blob on the floor
  blob3.y = floorY3 - blob3.r - 1;
}

function draw() {
  // ----- Panic level from movement -----
  const speed = abs(blob3.vx) + abs(blob3.vy) * 0.15;
  panic = lerp(panic, constrain(speed / 6.0, 0, 1), 0.08);

  // Alarm-style background pulse
  const alarm = (sin(frameCount * 0.12) * 0.5 + 0.5) * panic;
  background(240 - alarm * 80, 240 - alarm * 170, 240 - alarm * 170);

  // Camera shake
  shakeAmt = lerp(shakeAmt, panic * 6, 0.1);
  const sx = random(-shakeAmt, shakeAmt);
  const sy = random(-shakeAmt, shakeAmt);

  push();
  translate(sx, sy);

  // ----- Draw platforms -----
  drawPlatforms(alarm);

  // ----- Input -----
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1;

  // Panic twitch
  const twitch = (noise(frameCount * 0.05) - 0.5) * panic * 0.6;
  blob3.vx += blob3.accel * (move + twitch);

  // Friction + clamp
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  // Gravity
  blob3.vy += blob3.gravity;

  // ----- Collision box -----
  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // Horizontal collisions
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) box.x = s.x - box.w;
      else if (blob3.vx < 0) box.x = s.x + s.w;
      blob3.vx = 0;
      shakeAmt += 1.5 * panic;
    }
  }

  // Vertical collisions
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        box.y = s.y - box.h;
        if (blob3.vy > 5) shakeAmt += 3;
        blob3.vy = 0;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        box.y = s.y + s.h;
        blob3.vy = 0;
        shakeAmt += 1.2 * panic;
      }
    }
  }

  // Update blob position
  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // ----- Blob visuals react to panic -----
  blob3.tSpeed = 0.012 + panic * 0.028;
  blob3.wobble = 7 + panic * 9;
  blob3.wobbleFreq = 1.05 + panic * 0.9;

  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  pop();

  // ----- HUD -----
  fill(0);
  text("Move: A/D or ←/→   Jump: Space/W/↑", 10, 18);
  text("Emotion: PANIC   Panic Level: " + nf(panic, 1, 2), 10, 38);
}

// Jump input
function keyPressed() {
  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
    shakeAmt += 2;
  }
}

// AABB overlap test
function overlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Platform visuals (warning stripes + glow)
function drawPlatforms(alarm) {
  fill(190);
  for (const p of platforms) rect(p.x, p.y, p.w, p.h);

  // Warning stripes on thin platforms
  for (const p of platforms) {
    if (p.h > 20) continue;
    const stripeH = 6;
    for (let x = p.x; x < p.x + p.w; x += 14) {
      fill(30, 30, 30, 140);
      rect(x, p.y, 7, stripeH);
      fill(250, 200 - alarm * 80, 20 + alarm * 40, 170);
      rect(x + 7, p.y, 7, stripeH);
    }
  }

  // Floor glow
  fill(255, 60 + alarm * 120, 60 + alarm * 120, 120);
  rect(0, floorY3 - 2, width, 2);
}

// Draw the blob
function drawBlobCircle(b) {
  // Calm blue → anxious red
  const rr = lerp(20, 240, panic);
  const gg = lerp(120, 60, panic);
  const bb = lerp(255, 80, panic);
  fill(rr, gg, bb);

  beginShape();
  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;

    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t,
    );

    const jitter = (noise(i * 0.2, frameCount * 0.06) - 0.5) * panic * 2.2;

    const r = b.r + map(n, 0, 1, -b.wobble, b.wobble) + jitter;
    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }
  endShape(CLOSE);

  // Highlight
  fill(255, 255, 255, 120);
  ellipse(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.5);
}
