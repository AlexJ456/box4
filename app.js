// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];

// Prevent screen from sleeping
function preventSleep() {
  if (navigator.wakeLock) {
    navigator.wakeLock.request('screen')
      .catch(err => console.log('Wake Lock error:', err));
  }
}

/**
 * Update the displayed total time.
 */
function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("timeDisplay").textContent = `${minutes}:${seconds}`;
}

/**
 * Play a brief tone (100ms beep at 440Hz) using the Web Audio API.
 */
function playTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 440; // A4 440Hz
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
  // Get the optional time limit (in seconds).
  const timeLimitInput = document.getElementById("timeLimit").value;
  const timeLimitSec =
    timeLimitInput !== "" && !isNaN(timeLimitInput)
      ? parseInt(timeLimitInput, 10) * 60
      : 0;
  
  // If a time limit is set and reached, check if we need to complete the session
  if (timeLimitSec && totalSeconds >= timeLimitSec) {
    // If we're in the exhale phase, end now
    if (steps[stepIndex] === "Exhale") {
      completeSession();
      return;
    }
    // If we're in another phase, allow a safety margin to complete before forcing session end
    else if (totalSeconds > timeLimitSec + 16) {
      completeSession();
      return;
    }
  }
  
  // Display the current breathing phase.
  document.getElementById("instruction").textContent = steps[stepIndex];
  document.getElementById("countdown").style.display = "block";
  let countdown = 4;
  document.getElementById("countdown").textContent = countdown;

  const intervalId = setInterval(() => {
    if (!isPlaying) {
      clearInterval(intervalId);
      return;
    }
    if (countdown <= 1) {
      clearInterval(intervalId);
      // Play tone if enabled.
      if (document.getElementById("soundToggle").checked) {
        playTone();
      }
      totalSeconds += countdown; // Add any remaining seconds.
      updateTimeDisplay();
      // Move to the next phase.
      stepIndex = (stepIndex + 1) % steps.length;
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
 * Complete the breathing session.
 */
function completeSession() {
  isPlaying = false;
  document.getElementById("instruction").textContent = "Complete!";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("startButton").textContent = "Start";
}

/**
 * Toggle between start and pause actions.
 */
function togglePlay() {
  if (!isPlaying) {
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    document.getElementById("startButton").textContent = "Pause";
    document.getElementById("instruction").textContent = "Starting...";
    document.getElementById("countdown").style.display = "none";
    updateTimeDisplay();
    preventSleep();
    nextPhase();
  } else {
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
  }
}

/**
 * Reset the session.
 */
function resetSession() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  updateTimeDisplay();
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("startButton").textContent = "Start";
}

// Event listeners for control and shortcut buttons.
document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetSession);
document.getElementById("shortcut2min").addEventListener("click", () => {
  document.getElementById("timeLimit").value = 2;
  togglePlay();
});
document.getElementById("shortcut5min").addEventListener("click", () => {
  document.getElementById("timeLimit").value = 5;
  togglePlay();
});
document.getElementById("shortcut10min").addEventListener("click", () => {
  document.getElementById("timeLimit").value = 10;
  togglePlay();
});
