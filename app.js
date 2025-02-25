// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];
let wakeLock = null;

// Update the displayed total time in mm:ss format.
function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = `${minutes}:${seconds}`;
}

// Play a brief 100ms tone at 440Hz using the Web Audio API.
function playTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // 440Hz (A4)
    oscillator.connect(context.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  }
}

// Request a wake lock using the Wake Lock API so the display stays on.
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock active');
    }
  } catch (err) {
    console.error('Wake Lock request failed:', err);
  }
}

// Release the wake lock when the session ends or is paused.
function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
      console.log('Wake Lock released');
    });
  }
}

// Begin the breathing cycle. Each phase lasts 4 seconds.
function nextPhase() {
  // Retrieve the time limit (in seconds) from the input.
  const timeLimitInput = document.getElementById('timeLimit').value;
  const timeLimitSec = timeLimitInput && !isNaN(timeLimitInput) ? parseInt(timeLimitInput, 10) : 0;

  // If a time limit is set and exceeded, only end if the current phase is Exhale.
  if (timeLimitSec && totalSeconds >= timeLimitSec && steps[stepIndex] === "Exhale") {
    isPlaying = false;
    document.getElementById('instruction').textContent = "Complete!";
    document.getElementById('startButton').textContent = "Start";
    // Hide the countdown once complete.
    document.getElementById('countdown').textContent = "";
    releaseWakeLock();
    return;
  }

  // Display the current phase.
  document.getElementById('instruction').textContent = steps[stepIndex];

  // Start the 4-second countdown for the current phase.
  let countdown = 4;
  document.getElementById('countdown').textContent = countdown;

  const intervalId = setInterval(() => {
    if (!isPlaying) {
      clearInterval(intervalId);
      return;
    }
    if (countdown <= 1) {
      clearInterval(intervalId);
      totalSeconds++;
      updateTimeDisplay();
      // Play tone if enabled.
      if (document.getElementById('soundToggle').checked) {
        playTone();
      }
      // Move to the next phase.
      stepIndex = (stepIndex + 1) % steps.length;
      nextPhase();
    } else {
      countdown--;
      totalSeconds++;
      updateTimeDisplay();
      document.getElementById('countdown').textContent = countdown;
    }
  }, 1000);
}

// Toggle between starting and pausing the exercise.
function togglePlay() {
  if (!isPlaying) {
    // Start the breathing session.
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    document.getElementById('startButton').textContent = "Pause";
    document.getElementById('instruction').textContent = "Starting...";
    updateTimeDisplay();
    // Hide controls and shortcut buttons while the session is ongoing.
    document.getElementById('controls').style.display = "none";
    document.getElementById('shortcuts').style.display = "none";
    // Request wake lock so the display does not turn off.
    requestWakeLock();
    // Start the breathing cycle; the countdown now appears.
    nextPhase();
  } else {
    // Pause the session.
    isPlaying = false;
    document.getElementById('startButton').textContent = "Start";
    document.getElementById('instruction').textContent = "Paused";
    releaseWakeLock();
  }
}

// Reset the app to its initial state.
function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  document.getElementById('instruction').textContent = "Press Start to Begin";
  document.getElementById('countdown').textContent = "";
  document.getElementById('timeDisplay').textContent = "00:00";
  document.getElementById('startButton').textContent = "Start";
  // Restore the controls and shortcuts.
  document.getElementById('controls').style.display = "block";
  document.getElementById('shortcuts').style.display = "block";
  releaseWakeLock();
}

// Start a session with a predefined time limit (in minutes).
function startShortcutSession(minutes) {
  document.getElementById('timeLimit').value = minutes * 60;
  if (!isPlaying) {
    togglePlay();
  }
}

// Bind event listeners to the main and shortcut buttons.
document.getElementById('startButton').addEventListener('click', togglePlay);
document.getElementById('resetButton').addEventListener('click', resetApp);
document.getElementById('shortcut2min').addEventListener('click', () => startShortcutSession(2));
document.getElementById('shortcut5min').addEventListener('click', () => startShortcutSession(5));
document.getElementById('shortcut10min').addEventListener('click', () => startShortcutSession(10));
