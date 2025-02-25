// Global state variables
let isPlaying = false;
let totalSeconds = 0;
let stepIndex = 0;
const steps = ["Inhale", "Hold", "Exhale", "Wait"];

// Update the displayed total time.
function updateTimeDisplay() {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    document.getElementById('timeDisplay').textContent = minutes + ':' + seconds;
}

// Play a brief tone (100ms beep at 440Hz) using the Web Audio API.
function playTone() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 (440Hz)
        oscillator.connect(context.destination);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            context.close();
        }, 100);
    }
}

// Begin the breathing cycle. Each phase lasts 4 seconds.
function nextPhase() {
    // Get the optional time limit in seconds.
    const timeLimitInput = document.getElementById('timeLimit').value;
    const timeLimitSec = timeLimitInput !== '' && !isNaN(timeLimitInput) ? parseInt(timeLimitInput, 10) * 60 : 0;

    // If a time limit is set and reached, complete the session.
    if (timeLimitSec > 0 && totalSeconds >= timeLimitSec) {
        // If we're not in the Exhale phase, continue until we complete the next exhale
        if (stepIndex !== 2) { // 2 is the index of "Exhale"
            document.getElementById('instruction').textContent = steps[stepIndex];
            let countdown = 4;
            document.getElementById('countdown').textContent = countdown;
            document.getElementById('countdown').style.color = 'red';
            
            const intervalId = setInterval(() => {
                if (!isPlaying) {
                    clearInterval(intervalId);
                    return;
                }
                
                if (countdown <= 1) {
                    clearInterval(intervalId);
                    
                    // Play tone if enabled.
                    if (document.getElementById('soundToggle').checked) {
                        playTone();
                    }
                    
                    totalSeconds += countdown;
                    updateTimeDisplay();
                    
                    // Move to the next phase.
                    stepIndex = (stepIndex + 1) % steps.length;
                    
                    // If we've reached the end of Exhale, complete the session
                    if (stepIndex === 3) { // 3 is the index after "Exhale"
                        isPlaying = false;
                        document.getElementById('instruction').textContent = "Complete!";
                        document.getElementById('instruction').style.color = 'red';
                        document.getElementById('countdown').style.display = 'none';
                        document.getElementById('startButton').textContent = "Start";
                        // Show the controls and shortcut buttons again
                        document.getElementById('controls').style.display = 'block';
                        document.getElementById('shortcuts').style.display = 'block';
                        // Keep screen on
                        if (navigator.wakeLock) {
                            try {
                                wakeLock.release();
                                wakeLock = null;
                            } catch (err) {
                                console.error(`${err.name}, ${err.message}`);
                            }
                        }
                        return;
                    } else {
                        nextPhase();
                    }
                } else {
                    countdown--;
                    document.getElementById('countdown').textContent = countdown;
                    totalSeconds++;
                    updateTimeDisplay();
                }
            }, 1000);
        } else {
            // We're already in the Exhale phase, so complete normally
            isPlaying = false;
            document.getElementById('instruction').textContent = "Complete!";
            document.getElementById('instruction').style.color = 'red';
            document.getElementById('countdown').style.display = 'none';
            document.getElementById('startButton').textContent = "Start";
            // Show the controls and shortcut buttons again
            document.getElementById('controls').style.display = 'block';
            document.getElementById('shortcuts').style.display = 'block';
            // Release screen wake lock
            if (navigator.wakeLock) {
                try {
                    wakeLock.release();
                    wakeLock = null;
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
            return;
        }
    }

    // Display the current breathing phase.
    document.getElementById('instruction').textContent = steps[stepIndex];
    document.getElementById('instruction').style.color = 'red';
    
    let countdown = 4;
    document.getElementById('countdown').textContent = countdown;
    document.getElementById('countdown').style.color = 'red';
    document.getElementById('countdown').style.display = 'block';
    
    const intervalId = setInterval(() => {
        if (!isPlaying) {
            clearInterval(intervalId);
            return;
        }
        
        if (countdown <= 1) {
            clearInterval(intervalId);
            
            // Play tone if enabled.
            if (document.getElementById('soundToggle').checked) {
                playTone();
            }
            
            totalSeconds++;
            updateTimeDisplay();
            
            // Move to the next phase.
            stepIndex = (stepIndex + 1) % steps.length;
            nextPhase();
        } else {
            countdown--;
            document.getElementById('countdown').textContent = countdown;
            totalSeconds++;
            updateTimeDisplay();
        }
    }, 1000);
}

// Variable to store wake lock
let wakeLock = null;

// Request wake lock to prevent screen from turning off
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
            console.log('Wake Lock is active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

// Toggle between start and pause actions.
function togglePlay() {
    if (!isPlaying) {
        // Start the breathing session.
        isPlaying = true;
        totalSeconds = 0;
        stepIndex = 0;
        document.getElementById('startButton').textContent = "Pause";
        document.getElementById('instruction').textContent = "Starting...";
        document.getElementById('instruction').style.color = 'red';
        updateTimeDisplay();
        
        // Hide the controls (sound and time limit) and shortcut buttons when the session starts.
        document.getElementById('controls').style.display = 'none';
        document.getElementById('shortcuts').style.display = 'none';
        
        // Request wake lock to prevent screen from turning off
        requestWakeLock();
        
        nextPhase();
    } else {
        // Pause the session.
        isPlaying = false;
        document.getElementById('startButton').textContent = "Start";
        document.getElementById('instruction').textContent = "Paused";
        
        // Release wake lock when paused
        if (wakeLock) {
            try {
                wakeLock.release();
                wakeLock = null;
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        }
    }
}

// Reset the app to its initial state.
function resetApp() {
    isPlaying = false;
    totalSeconds = 0;
    stepIndex = 0;
    document.getElementById('instruction').textContent = "Press Start to Begin";
    document.getElementById('instruction').style.color = '';
    document.getElementById('countdown').textContent = "4";
    document.getElementById('countdown').style.color = '';
    document.getElementById('countdown').style.display = 'block';
    document.getElementById('timeDisplay').textContent = "00:00";
    document.getElementById('startButton').textContent = "Start";
    
    // Show the controls and shortcut buttons again when the app resets.
    document.getElementById('controls').style.display = 'block';
    document.getElementById('shortcuts').style.display = 'block';
    
    // Release wake lock when reset
    if (wakeLock) {
        try {
            wakeLock.release();
            wakeLock = null;
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

// Start a session with a predefined time limit.
function startShortcutSession(minutes) {
    document.getElementById('timeLimit').value = minutes;
    // Set the time limit.
    if (!isPlaying) {
        togglePlay(); // Start the session.
    }
}

// Bind event listeners to the main and shortcut buttons.
document.getElementById('startButton').addEventListener('click', togglePlay);
document.getElementById('resetButton').addEventListener('click', resetApp);
document.getElementById('shortcut2min').addEventListener('click', () => startShortcutSession(2));
document.getElementById('shortcut5min').addEventListener('click', () => startShortcutSession(5));
document.getElementById('shortcut10min').addEventListener('click', () => startShortcutSession(10));
