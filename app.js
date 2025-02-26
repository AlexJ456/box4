// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];
let timeLimitReached = false;

// Prevent screen from sleeping
function preventSleep() {
  if (navigator.wakeLock) {
    navigator.wakeLock.request('screen')
      .catch(err => console.log('Wake Lock error:', err));
  }
}

function updateTimeDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("timeDisplay").textContent = `${minutes}:${seconds}`;
}

function playTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 440;
    oscillator.connect(context.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  }
}

function nextPhase() {
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
      if (document.getElementById("soundToggle").checked) {
        playTone();
      }
      totalSeconds += countdown;
      updateTimeDisplay();
      stepIndex = (stepIndex + 1) % steps.length;
      nextPhase();
    } else {
      countdown--;
      document.getElementById("countdown").textContent = countdown;
      totalSeconds++;
      updateTimeDisplay();

      const timeLimitInput = document.getElementById("timeLimit").value;
      const timeLimitSec = timeLimitInput !== "" && !isNaN(timeLimitInput)
        ? parseInt(timeLimitInput, 10) * 60
        : 0;

      if (timeLimitSec && totalSeconds >= timeLimitSec) {
        timeLimitReached = true;
      }

      if (timeLimitReached) {
        if (steps[stepIndex] === "Exhale" && countdown === 1) {
          completeSession();
          clearInterval(intervalId);
          return;
        } else if (timeLimitSec && totalSeconds >= timeLimitSec + 16) {
          completeSession();
          clearInterval(intervalId);
          return;
        }
      }
    }
  }, 1000);
}

function completeSession() {
  isPlaying = false;
  timeLimitReached = false;
  document.getElementById("instruction").textContent = "Complete!";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("startButton").textContent = "Start";
  document.getElementById("controls").style.display = "block";
  document.getElementById("shortcuts").style.display = "block";
}

function togglePlay() {
  if (!isPlaying) {
    isPlaying = true;
    totalSeconds = 0;
    stepIndex = 0;
    timeLimitReached = false;
    document.getElementById("startButton").textContent = "Pause";
    document.getElementById("instruction").textContent = "Starting...";
    document.getElementById("countdown").style.display = "none";
    updateTimeDisplay();
    document.getElementById("controls").style.display = "none";
    document.getElementById("shortcuts").style.display = "none";
    preventSleep();
    nextPhase();
  } else {
    isPlaying = false;
    document.getElementById("startButton").textContent = "Start";
    document.getElementById("instruction").textContent = "Paused";
  }
}

function resetApp() {
  isPlaying = false;
  totalSeconds = 0;
  stepIndex = 0;
  timeLimitReached = false;
  document.getElementById("instruction").textContent = "Press Start to Begin";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("timeDisplay").textContent = "00:00";
  document.getElementById("startButton").textContent = "Start";
  document.getElementById("controls").style.display = "block";
  document.getElementById("shortcuts").style.display = "block";
}

function startShortcutSession(minutes) {
  document.getElementById("timeLimit").value = minutes;
  if (!isPlaying) togglePlay();
}

document.getElementById("startButton").addEventListener("click", togglePlay);
document.getElementById("resetButton").addEventListener("click", resetApp);
document.getElementById("shortcut2min").addEventListener("click", () => startShortcutSession(2));
document.getElementById("shortcut5min").addEventListener("click", () => startShortcutSession(5));
document.getElementById("shortcut10min").addEventListener("click", () => startShortcutSession(10));
