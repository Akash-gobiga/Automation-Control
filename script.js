// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbLlLHRNwksic6G7QtCnKqYtVV_KDpqWc",
    authDomain: "iwms-v2.firebaseapp.com",
    databaseURL: "https://iwms-v2-default-rtdb.firebaseio.com",
    projectId: "iwms-v2",
    storageBucket: "iwms-v2.appspot.com",
    messagingSenderId: "170990257252",
    appId: "1:170990257252:web:ac7db0672e97972ba7cb71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let isProcessingCommand = false; // Flag to prevent processing multiple commands

// Function to control LEDs and Bell
window.toggleLED = function (ledId, isChecked) {
    set(ref(database, `Automation/${ledId}`), isChecked ? 1 : 0)
        .then(() => {
            const ledName = ledId === 'Led-4' ? "Bell" : ledId.replace("-", " ");
            console.log(`${ledName} turned ${isChecked ? "ON" : "OFF"}`);
        })
        .catch((error) => {
            console.error("Error updating database:", error);
        });
};

window.toggleAllLEDs = function (isChecked) {
    // Toggle the individual LEDs without feedback for each
    toggleLED('Led-1', isChecked);
    toggleLED('Led-2', isChecked);
    toggleLED('Led-3', isChecked);
    
    // Provide feedback for all lights
    if (isChecked) {
        updateStatus("All lights ON");  // This will say "All lights ON"
    } else {
        updateStatus("All lights OFF"); // This will say "All lights OFF"
    }
};

// Start Listening for Voice Commands
window.startListening = function () {
    const recognition = new webkitSpeechRecognition(); // For Chrome compatibility
    recognition.continuous = false; // Stop after first recognition
    recognition.interimResults = false; // No interim results

    recognition.onresult = function (event) {
        if (isProcessingCommand) return; // Prevent multiple processing
        isProcessingCommand = true; // Set flag

        const command = event.results[0][0].transcript.toLowerCase();
        console.log("Voice command:", command);
        processCommand(command);

        // Reset flag after processing
        setTimeout(() => {
            isProcessingCommand = false;
        }, 1000); // Adjust timeout as necessary
    };

    recognition.start();
};

function speak(message) {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString(); // Format time as HH:MM:SS
}

function updateStatus(message) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    speak(message);
}

let lastCommand = ""; // To store the last recognized command

function processCommand(command) {
    if (command === lastCommand) {
        // If the command is the same as the last one, ignore it
        return;
    }

    lastCommand = command; // Update the last command to the current one

    if (command.includes("led 1 on")) {
        toggleLED('Led-1', true);
        speak("LED 1 is on");
    } else if (command.includes("led 1 off")) {
        toggleLED('Led-1', false);
        speak("LED 1 is off");
    } else if (command.includes("led 2 on")) {
        toggleLED('Led-2', true);
        speak("LED 2 is on");
    } else if (command.includes("led 2 off")) {
        toggleLED('Led-2', false);
        speak("LED 2 is off");
    } else if (command.includes("led 3 on")) {
        toggleLED('Led-3', true);
        speak("LED 3 is on");
    } else if (command.includes("led 3 off")) {
        toggleLED('Led-3', false);
        speak("LED 3 is off");
    } else if (command.includes("bell on")) {
        toggleLED('Led-4', true);
        speak("Bell is on");
    } else if (command.includes("bell off")) {
        toggleLED('Led-4', false);
        speak("Bell is off");
    } else if (command.includes("all lights on")) {
        toggleAllLEDs(true);
    } else if (command.includes("all lights off")) {
        toggleAllLEDs(false);
    } else if (command.includes("what time is it")) {
        const currentTime = getCurrentTime();
        updateStatus(`Current time is ${currentTime}`);
        speak(`Current time is ${currentTime}`); // Speak the current time
    } else {
        updateStatus("Command not recognized");
        console.log("Command not recognized");
    }
}

// Listen for changes in Firebase and update the switch states accordingly
onValue(ref(database, 'Automation'), (snapshot) => {
    const automations = snapshot.val();
    console.log("Current automations:", automations);  // Debugging output
    let allOn = true; // Flag to check if all LEDs 1, 2, and 3 are on

    for (let ledId in automations) {
        const toggleSwitch = document.querySelector(`input[type="checkbox"][onchange*="${ledId}"]`);
        if (toggleSwitch) {
            toggleSwitch.checked = automations[ledId] === 1;

            // Check if any of LEDs 1, 2, or 3 is off
            if (['Led-1', 'Led-2', 'Led-3'].includes(ledId) && automations[ledId] === 0) {
                allOn = false; // At least one of these LEDs is off
            }
        }
    }
    // Update the All lights toggle based on the individual LEDs' status
    document.getElementById('led1-3').checked = allOn; // Update the "All lights" toggle
});
