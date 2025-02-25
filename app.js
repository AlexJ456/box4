// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
let sessionEndPending = false;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];
let wakeLock = null;

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
 * Request a wake lock to keep the display active.
 */
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {
    console.error("Wake lock request failed:", err);
  }
}

/**
 * Release the wake lock.
 */
function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
    });
  }
}

/**
 * Handle the breathing cycle phases.
 */
function nextPhase() {
  // Make sure the countdown is visible when the session is active.
  document.getElementById("countdown").style.display = "block";
  
  // Retrieve the optional time limit (in seconds)
  const timeLimitInput = document.getElementById("timeLimit").value;
  const timeLimitSec =
    timeLimitInput !== "" && !isNaN(timeLimitInput)
      ? parseInt(timeLimitInput, 10) * 60
      : 0;
  
  // If a time limit is set and reached, only end the session on Exhale.
  if (timeLimitSec && totalSeconds >= timeLimitSec) {
    if (steps[stepIndex] !== "Exhale") {
      sessionEndPending = true;
    } else {
      isPlaying = false;
      document.getElementById("instruction").textContent = "Complete!";
      document.getElementById("startButton").textContent = "Start";
      document.getElementById("countdown").style.display = "none";
      releaseWakeLock();
      sessionEndPending = false;
      return;
    }
  }
  
  // Display the current breathing phase.
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
      // Play tone if enabled.
      if (document.getElementById("soundToggle").checked) {
        playTone();
      }
      totalSeconds += countdown;
      updateTimeDisplay();
      
      // End the session on Exhale if flagged.
      if (sessionEndPending && steps[stepIndex] === "Exhale") {
         isPlaying = false;
         document.getElementById("instruction").textContent = "Complete!";
         document.getElementById("startButton").textContent = "Start";
         document.getElementById("countdown").style.display = "none";
         releaseWakeLock();
         sessionEndPending = false;
         return;
      }
      
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
 * Toggle the start/pause state of the session.
 */
function togglePlay() {
  if (!isPlaying) {
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    sessionEndPending = false;
    document.getElementById("startButton").textContent = "Pause";
    document.getElementById("instruction").textContent = "Starting...";
    updateTimeDisplay();
    // Hide controls and shortcut buttons on session start.
    document.getElementById("controls").style.display = "none";
    document.getElementById("shortcuts").style.display = "none";
    document.getElementById("countdown").style.display = "block";
    requestWakeLock();
    nextPhase();
  } else {
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
    document.getElementById("instruction").textContent = "Paused";
    releaseWakeLock();
  }
}

/**
 * Reset the app to its initial state.
 */
function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  sessionEndPending = false;
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").textContent = "4";
  document.getElementById("timeDisplay").textContent = "00:00";
  document.getElementById("startButton").textContent = "Start";
  // Show controls and shortcuts after resetting.
  document.getElementById("controls").style.display = "block";
  document.getElementById("shortcuts").style.display = "block";
  document.getElementById("countdown").style.display = "none";
  releaseWakeLock();
}

/**
 * Start a session with a preset time limit.
 */
function startShortcutSession(minutes) {
  document.getElementById("timeLimit").value = minutes;
  if (!isPlaying) {
    togglePlay();
  }
}

document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetApp);
document.getElementById("shortcut2min").addEventListener("click", () => startShortcutSession(2));
document.getElementById("shortcut5min").addEventListener("click", () => startShortcutSession(5));
document.getElementById("shortcut10min").addEventListener("click", () => startShortcutSession(10));
