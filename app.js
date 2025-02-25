// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
let timeLimitReached = false; // New flag to indicate that the time limit has been reached

const steps = ["Inhale", "Hold", "Exhale", "Wait"];

// Update the displayed total time
function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  document.getElementById("timeDisplay").textContent = `${minutes}:${seconds}`;
}

// Play a brief tone (100ms beep at 440Hz) using the Web Audio API
function playTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // A4 440Hz
    oscillator.connect(context.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  }
}

// Begin the breathing cycle; each phase lasts 4 seconds.
function nextPhase() {
  const timeLimitInput = document.getElementById("timeLimit").value;
  const timeLimitSec = timeLimitInput && !isNaN(timeLimitInput)
    ? parseInt(timeLimitInput, 10) * 60
    : 0;

  // Check if the time limit has been reached and set the flag without immediately ending the session
  if (timeLimitSec && totalSeconds >= timeLimitSec) {
    timeLimitReached = true;
  }

  // Display the current phase
  document.getElementById("instruction").textContent = steps[stepIndex];
  let countdown = 4;
  document.getElementById("countdown").textContent = countdown;

  const intervalId = setInterval(() => {
    countdown_timer(countdown, intervalId);
  }, 1000);
}

function countdown_timer(countdown, intervalId) {
  if (!isPlaying) {
    clearInterval(intervalId);
    return;
  }
  if (countdown <= 1) {
    clearInterval(intervalId);
    // Play tone if enabled
    if (document.getElementById("soundToggle").checked) {
      playTone();
    }
    totalSeconds += countdown;
    updateTimeDisplay();

    if (timeLimitReached) {
      // If time limit reached but the current phase is not "Exhale", skip ahead until Exhale is reached
      if (steps[stepIndex] !== "Exhale") {
        do {
          stepIndex = (stepIndex + 1) % steps.length;
        } while (steps[stepIndex] !== "Exhale");
        nextPhase();
      } else {
        // If in Exhale phase and time limit reached, finish the session and hide the countdown timer
        isPlaying = false;
        document.getElementById("instruction").textContent = "Complete!";
        document.getElementById("startButton").textContent = "Start";
        document.getElementById("countdown").textContent = "";
        timeLimitReached = false; // Reset the flag for a potential restart
      }
    } else {
      // Normal cycle: move to the next phase and continue the session
      stepIndex = (stepIndex + 1) % steps.length;
      nextPhase();
    }
  } else {
    countdown--;
    document.getElementById("countdown").textContent = countdown;
    totalSeconds++;
    updateTimeDisplay();
  }
}

// Toggle between start and pause actions.
function togglePlay() {
  if (!isPlaying) {
    // Start the breathing session.
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    timeLimitReached = false;
    document.getElementById("startButton").textContent = "Pause";
    document.getElementById("instruction").textContent = "Starting...";
    updateTimeDisplay();
    nextPhase();
  } else {
    // Pause the session.
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
    document.getElementById("instruction").textContent = "Paused";
  }
}

// Reset the app to its initial state.
function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  timeLimitReached = false;
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").textContent = 4;
  document.getElementById("timeDisplay").textContent = "00:00";
  document.getElementById("startButton").textContent = "Start";
}

// Bind event listeners to the buttons.
document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetApp);
