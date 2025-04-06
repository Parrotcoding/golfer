// Get references to DOM elements
const canvas = document.getElementById('courseCanvas');
const ctx = canvas.getContext('2d');
const clubSelect = document.getElementById('clubSelect');
const angleInput = document.getElementById('angleInput');
const swingButton = document.getElementById('swingButton');

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

let motionData = null;   // To store the latest device motion event
let swingInProgress = false; // Prevent multiple swings at once

// Draw the course, ball, and hole
function drawCourse() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw a green grass field (background)
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

// Animate the ball's movement from its current position to the target
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
    }
  }
  
  animate();
}

// Calculate and execute the swing based on user input and sensor data (or simulation)
function takeSwing() {
  if (swingInProgress) return; // Do nothing if a swing is already happening
  
  const selectedClub = clubSelect.value;
  const baseAngle = parseFloat(angleInput.value); // Intended angle in degrees
  
  // Determine swing strength and deviation.
  // If motion sensor data is available, use it; otherwise, use a simulated random value.
  let swingStrength = 10; // Default strength
  let deviation = 0;      // Default deviation (i.e. a perfectly straight swing)
  
  if (motionData && motionData.acceleration) {
    // Use the x-axis acceleration as swing strength (absolute value)
    swingStrength = Math.abs(motionData.acceleration.x) || 10;
    // Use the y-axis acceleration to simulate a slight deviation from the intended angle
    deviation = motionData.acceleration.y || 0;
  } else {
    // Fallback simulation: random strength and slight random deviation
    swingStrength = Math.random() * 15 + 5; // strength between 5 and 20
    deviation = (Math.random() - 0.5) * 10;   // deviation between -5 and 5 degrees
  }
  
  // Adjust the swing strength according to the selected club
  swingStrength *= clubMultipliers[selectedClub];
  
  // Final swing angle is the intended angle plus any deviation from an imperfect swing
  const finalAngle = baseAngle + deviation;
  
  // Convert the final angle from degrees to radians
  const rad = finalAngle * Math.PI / 180;
  
  // Calculate the target ball position based on the swing strength
  // Here, the swing strength is scaled to provide a visible distance on the canvas.
  const distance = swingStrength * 10;
  const targetX = ball.x + distance * Math.cos(rad);
  const targetY = ball.y - distance * Math.sin(rad);
  
  animateBall(targetX, targetY);
}

// Handle device motion events to capture swing data from a phone
function handleMotion(event) {
  motionData = event;
}

// Set up event listeners
swingButton.addEventListener('click', takeSwing);

// If device motion is supported, request permission on iOS 13+ devices; otherwise, add event listener
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
