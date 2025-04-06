// Get references to DOM elements
const canvas = document.getElementById('courseCanvas');
const ctx = canvas.getContext('2d');
const clubSelect = document.getElementById('clubSelect');
const swingButton = document.getElementById('swingButton');
const promptMessage = document.getElementById('promptMessage');

// Set canvas dimensions
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

// Game objects: ball and hole
let ball = { x: 50, y: canvas.height - 50, radius: 10 };
const hole = { x: canvas.width - 100, y: 100, radius: 15 };

// Club multipliers to adjust distance based on club type
const clubMultipliers = {
  driver: 1.2,
  iron: 0.9,
  hybrid: 1.0,
  putter: 0.5
};

let motionData = null;       // Latest device motion event data
let swingInProgress = false; // Prevent overlapping swings

// Variables for drawing the shot angle
let isDrawing = false;
let drawnAngle = null;   // The calculated angle (in degrees) from the drawn line
let lineEnd = null;      // The current end point of the drawn line

// Draw the course, ball, and hole
function drawCourse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grass field
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the hole as a black circle
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
  
  // Draw the ball as a white circle with a black border
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.closePath();
  
  // If an angle has been drawn, show the red line
  if (lineEnd) {
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Animate the ball moving to the target position
function animateBall(targetX, targetY) {
  swingInProgress = true;
  const frames = 60;
  const dx = (targetX - ball.x) / frames;
  const dy = (targetY - ball.y) / frames;
  let frame = 0;
  
  function animate() {
    if (frame < frames) {
      ball.x += dx;
      ball.y += dy;
      drawCourse();
      frame++;
      requestAnimationFrame(animate);
    } else {
      ball.x = targetX;
      ball.y = targetY;
      drawCourse();
      swingInProgress = false;
      // Reset for the next shot
      drawnAngle = null;
      lineEnd = null;
      promptMessage.textContent = "Press near the ball and drag to draw your shot direction.";
      swingButton.disabled = true;
    }
  }
  animate();
}

// Calculate and execute the swing using the drawn angle
function takeSwing() {
  if (swingInProgress) return;
  if (drawnAngle === null) {
    alert("Please draw the angle first!");
    return;
  }
  
  const selectedClub = clubSelect.value;
  const baseAngle = drawnAngle;
  
  // Determine swing strength and deviation.
  let swingStrength = 10; // Default strength
  let deviation = 0;      // Default deviation (perfectly straight)
  
  if (motionData && motionData.acceleration) {
    swingStrength = Math.abs(motionData.acceleration.x) || 10;
    deviation = motionData.acceleration.y || 0;
  } else {
    // Simulate swing strength and deviation
    swingStrength = Math.random() * 15 + 5; // Between 5 and 20
    deviation = (Math.random() - 0.5) * 10;   // Between -5 and 5 degrees
  }
  
  // Adjust swing strength for the selected club
  swingStrength *= clubMultipliers[selectedClub];
  
  // Final angle includes any deviation
  const finalAngle = baseAngle + deviation;
  const rad = finalAngle * Math.PI / 180;
  
  // Calculate the target position based on swing strength
  const distance = swingStrength * 10;
  const targetX = ball.x + distance * Math.cos(rad);
  const targetY = ball.y - distance * Math.sin(rad);
  
  animateBall(targetX, targetY);
}

// Device motion handler for phone swings
function handleMotion(event) {
  motionData = event;
}

// Utility: get pointer coordinates relative to the canvas
function getPointerPosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Pointer event handlers for drawing the shot angle
function startDrawing(e) {
  const pos = getPointerPosition(e);
  // Start drawing only if the pointer is near the ball (within ball radius + 20 pixels)
  const dist = Math.hypot(pos.x - ball.x, pos.y - ball.y);
  if (dist <= ball.radius + 20) {
    isDrawing = true;
  }
}

function duringDrawing(e) {
  if (!isDrawing) return;
  const pos = getPointerPosition(e);
  lineEnd = pos;
  drawCourse();
}

function endDrawing(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const pos = getPointerPosition(e);
  lineEnd = pos;
  drawCourse();
  
  // Calculate the drawn angle using the line from the ball to the pointer
  const dx = pos.x - ball.x;
  const dy = ball.y - pos.y; // Invert dy because canvas y-axis increases downward
  drawnAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  promptMessage.textContent = "Swing now!";
  swingButton.disabled = false;
}

// Set up pointer event listeners on the canvas
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', duringDrawing);
canvas.addEventListener('pointerup', endDrawing);
canvas.addEventListener('pointercancel', endDrawing);

// Set up the swing button and device motion event
swingButton.addEventListener('click', takeSwing);

if (window.DeviceMotionEvent) {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', handleMotion);
  }
}

// Draw the initial course
drawCourse();
