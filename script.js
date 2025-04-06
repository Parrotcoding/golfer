// Get references to DOM elements
const canvas = document.getElementById('courseCanvas');
const ctx = canvas.getContext('2d');
const clubSelect = document.getElementById('clubSelect');
const swingButton = document.getElementById('swingButton');
const promptMessage = document.getElementById('promptMessage');

// Set canvas dimensions
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

// Game objects: the ball and the hole on the course
let ball = { x: 50, y: canvas.height - 50, radius: 10 };
const hole = { x: canvas.width - 100, y: 100, radius: 15 };

// Club multipliers to adjust the distance based on club type
const clubMultipliers = {
  driver: 1.2,
  iron: 0.9,
  hybrid: 1.0,
  putter: 0.5
};

let motionData = null;      // Latest device motion event data
let swingInProgress = false; // Prevent overlapping swings

// Variables for drawing the intended angle
let isDrawing = false;
let drawnAngle = null;      // Base angle in degrees (set after drawing)
let lineEnd = null;         // End point of the drawn line

// Draw the course with ball and hole
function drawCourse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Grass field
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
      // If an angle was drawn, re-draw the line
      if (lineEnd) {
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(lineEnd.x, lineEnd.y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      frame++;
      requestAnimationFrame(animate);
    } else {
      ball.x = targetX;
      ball.y = targetY;
      drawCourse();
      swingInProgress = false;
      // Reset the drawn angle and prompt for a new shot
      drawnAngle = null;
      lineEnd = null;
      promptMessage.textContent = "Draw the angle from the ball on the course.";
      swingButton.disabled = true;
    }
  }
  
  animate();
}

// Calculate and execute the swing using the drawn angle as the base
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
    // Simulated swing strength and deviation
    swingStrength = Math.random() * 15 + 5; // Between 5 and 20
    deviation = (Math.random() - 0.5) * 10;   // Between -5 and 5 degrees
  }
  
  // Adjust swing strength for the selected club
  swingStrength *= clubMultipliers[selectedClub];
  
  // Final angle incorporates the deviation
  const finalAngle = baseAngle + deviation;
  const rad = finalAngle * Math.PI / 180;
  
  // Calculate the target position based on the swing strength
  const distance = swingStrength * 10;
  const targetX = ball.x + distance * Math.cos(rad);
  const targetY = ball.y - distance * Math.sin(rad);
  
  animateBall(targetX, targetY);
}

// Device motion handler for phone swings
function handleMotion(event) {
  motionData = event;
}

// Canvas mouse event listeners for drawing the angle
canvas.addEventListener('mousedown', function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  // Start drawing if close to the ball
  const dist = Math.hypot(x - ball.x, y - ball.y);
  if (dist <= ball.radius + 10) {
    isDrawing = true;
  }
});

canvas.addEventListener('mousemove', function(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lineEnd = { x, y };
  drawCourse();
  // Draw the intended shot line in red
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.stroke();
});

canvas.addEventListener('mouseup', function(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lineEnd = { x, y };
  drawCourse();
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Calculate the angle using the drawn line.
  // dx: horizontal difference; dy: vertical difference (inverted for canvas)
  const dx = x - ball.x;
  const dy = ball.y - y; 
  drawnAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Prompt the user to swing and enable the swing button
  promptMessage.textContent = "Swing now!";
  swingButton.disabled = false;
});

// Touch event support for mobile devices
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  const dist = Math.hypot(x - ball.x, y - ball.y);
  if (dist <= ball.radius + 10) {
    isDrawing = true;
  }
});

canvas.addEventListener('touchmove', function(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  lineEnd = { x, y };
  drawCourse();
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.stroke();
});

canvas.addEventListener('touchend', function(e) {
  if (!isDrawing) return;
  isDrawing = false;
  if (lineEnd) {
    drawCourse();
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const dx = lineEnd.x - ball.x;
    const dy = ball.y - lineEnd.y;
    drawnAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    promptMessage.textContent = "Swing now!";
    swingButton.disabled = false;
  }
});

// Set up swing button and motion event listeners
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

// Initial drawing of the course
drawCourse();
