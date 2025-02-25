// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];

/**
 * Update the total time display.
 */
function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("timeDisplay").textContent = `${minutes}:${seconds}`;
}

/**
 * Plays a brief tone (100ms beep at 440Hz) using the Web Audio API.
 */
function playTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 440; // A4 (440 Hz)
    oscillator.connect(context.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  }
}

/**
 * Begin the breathing cycle. Each phase lasts 4 seconds.
 */
function nextPhase() {
  // Check for optional time limit
  const timeLimitInput = document.getElementById("timeLimit").value;
  const timeLimitSec =
    timeLimitInput !== "" && !isNaN(timeLimitInput)
      ? parseInt(timeLimitInput, 10) * 60
      : 0;
  if (timeLimitSec && totalSeconds >= timeLimitSec) {
    isPlaying = false;
    document.getElementById("instruction").textContent = "Complete!";
    document.getElementById("startButton").textContent = "Start";
    return;
  }

  // Display the current phase
  document.getElementById("instruction").textContent = steps[stepIndex];
  let countdown = 4;
  document.getElementById("countdown").textContent = countdown;

  const intervalId = setInterval(() => {
    // If the session is paused, stop the countdown
    if (!isPlaying) {
      clearInterval(intervalId);
      return;
    }
    // When countdown reaches 1, end this phase
    if (countdown <= 1) {
      clearInterval(intervalId);
      // Play tone if enabled
      if (document.getElementById("soundToggle").checked) {
        playTone();
      }
      totalSeconds += countdown; // add remaining seconds
      updateTimeDisplay();
      stepIndex = (stepIndex + 1) % steps.length; // move to next phase
      nextPhase();
    } else {
      countdown--;
      document.getElementById("countdown").textContent = countdown;
      totalSeconds++;
      updateTimeDisplay();
    }
  }, 1000);
}

/**
 * Toggle between start and pause.
 */
function togglePlay() {
  if (!isPlaying) {
    // Start the breathing session
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    document.getElementById("startButton").textContent = "Pause";
    document.getElementById("instruction").textContent = "Starting...";
    updateTimeDisplay();
    nextPhase();
  } else {
    // Pause the session
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
    document.getElementById("instruction").textContent = "Paused";
  }
}

/**
 * Resets the app to its initial state.
 */
function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").textContent = "4";
  document.getElementById("timeDisplay").textContent = "00:00";
  document.getElementById("startButton").textContent = "Start";
}

// Bind event listeners to the buttons
document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetApp);
