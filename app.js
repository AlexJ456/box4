// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
let timeLimitReached = false; // Not used explicitly now but can be extended later if needed
const steps = ["Inhale", "Hold", "Exhale", "Wait"];

/**
 * Update the displayed total time.
 */
function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("timeDisplay").textContent = `${minutes}:${seconds}`;
}

/**
 * Play a brief tone (100ms beep at 440Hz) via the Web Audio API.
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
  // Get time limit from the input field (in seconds)
  const timeLimitInput = document.getElementById("timeLimit").value;
  const timeLimitSec =
    timeLimitInput !== "" && !isNaN(timeLimitInput)
      ? parseInt(timeLimitInput, 10) * 60
      : 0;

  // If a time limit is set and exceeded, complete the session
  if (timeLimitSec && totalSeconds >= timeLimitSec) {
    isPlaying = false;
    document.getElementById("instruction").textContent = "Complete!";
    document.getElementById("startButton").textContent = "Start";
    return;
  }

  // Display the current breathing phase
  document.getElementById("instruction").textContent = steps[stepIndex];
  let countdown = 4;
  document.getElementById("countdown").textContent = countdown;

  const intervalId = setInterval(() => {
    if (!isPlaying) {
      clearInterval(intervalId);
      return;
    }
    if (countdown <= 1) {
      clearInterval(intervalId);
      // Play tone if the sound toggle is on
      if (document.getElementById("soundToggle").checked) {
        playTone();
      }
      totalSeconds += countdown;
      updateTimeDisplay();
      // Move to the next phase
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
 * Toggle between start and pause actions.
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
    // Hide the shortcut buttons when the session starts
    document.getElementById("shortcuts").style.display = "none";
    nextPhase();
  } else {
    // Pause the session
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
    document.getElementById("instruction").textContent = "Paused";
  }
}

/**
 * Reset the app to its initial state.
 */
function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  timeLimitReached = false;
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").textContent = "4";
  document.getElementById("timeDisplay").textContent = "00:00";
  document.getElementById("startButton").textContent = "Start";
  // Show the shortcut buttons again when the app is reset
  document.getElementById("shortcuts").style.display = "block";
}

/**
 * Start a session with a predefined time limit.
 */
function startShortcutSession(minutes) {
  document.getElementById("timeLimit").value = minutes;
  if (!isPlaying) {
    togglePlay();
  }
}

// Bind event listeners for main and shortcut buttons.
document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetApp);
document.getElementById("shortcut2min").addEventListener("click", () => startShortcutSession(2));
document.getElementById("shortcut5min").addEventListener("click", () => startShortcutSession(5));
document.getElementById("shortcut10min").addEventListener("click", () => startShortcutSession(10));
