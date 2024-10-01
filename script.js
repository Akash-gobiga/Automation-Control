// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAzbmHjRnnn3ebOn7_ijdoy2t2B9vadL4",
    authDomain: "eco-smart-wms.firebaseapp.com",
    databaseURL: "https://eco-smart-wms-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "eco-smart-wms",
    storageBucket: "eco-smart-wms.appspot.com",
    messagingSenderId: "230677104278",
    appId: "1:230677104278:web:4a9f2b1757c98b0e1da4b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let isProcessingCommand = false; // Flag to prevent processing multiple commands

// Function to control LEDs and Bell
window.toggleLED = function (ledId, isChecked) {
    const ledPath = `Automation/LEDs/${ledId}/state`;
    const currentTime = new Date().toISOString();
    
    set(ref(database, ledPath), isChecked ? 1 : 0)
        .then(() => {
            // Update last updated timestamp
            set(ref(database, `Automation/LEDs/${ledId}/lastUpdated`), currentTime);
            const ledName = ledId === 'LED-4' ? "Bell" : ledId.replace("-", " ");
            console.log(`${ledName} turned ${isChecked ? "ON" : "OFF"}`);

            // Update the "All Lights" button state only for the first three LEDs
            if (ledId !== 'LED-4') {
                updateAllLightsButtonState();
            }
        })
        .catch((error) => {
            console.error("Error updating database:", error);
        });
};

window.toggleAllLEDs = function (isChecked) {
    toggleLED('LED-1', isChecked);
    toggleLED('LED-2', isChecked);
    toggleLED('LED-3', isChecked);
    
    // Feedback for all lights
    updateStatus(isChecked ? "All lights ON" : "All lights OFF");
};

// Update the "All Lights" button state based on individual light statuses
function updateAllLightsButtonState() {
    onValue(ref(database, 'Automation/LEDs'), (snapshot) => {
        const leds = snapshot.val();
        let allOn = true;

        // Check only the first three LEDs (LED-1, LED-2, LED-3)
        for (const ledId of ['LED-1', 'LED-2', 'LED-3']) {
            if (leds[ledId]?.state === 0) { // Check if the LED state is defined
                allOn = false; // If any of the first three LEDs is off, set allOn to false
                break; // No need to check further
            }
        }

        // Update the "All Lights" button state
        const allLightsButton = document.getElementById('all-lights');
        allLightsButton.checked = allOn;
    });
}

// Start Listening for Voice Commands
window.startListening = function () {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        console.log("Speech recognition started.");
        toggleListeningButton(true);  // Change button color when mic is on
    };

    recognition.onend = function() {
        console.log("Speech recognition ended.");
        toggleListeningButton(false);  // Revert button color when mic is off
    };

    recognition.onresult = function (event) {
        console.log("Speech recognition result:", event);
        if (isProcessingCommand) return;
        isProcessingCommand = true;

        const command = event.results[0][0].transcript.toLowerCase();
        console.log("Voice command:", command);
        processCommand(command);

        setTimeout(() => {
            isProcessingCommand = false;
        }, 1000);
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.start();
};

// Listen for changes in Firebase and update the switch states accordingly
onValue(ref(database, 'Automation/LEDs'), (snapshot) => {
    const leds = snapshot.val();

    for (let ledId in leds) {
        const toggleSwitch = document.getElementById(ledId);
        if (toggleSwitch) {
            toggleSwitch.checked = leds[ledId].state === 1;
        }
    }

    // Update the "All Lights" button state based on the first three LEDs
    updateAllLightsButtonState();
});

// Monitor Trash Bin Status
onValue(ref(database, 'Trash-Bins'), (snapshot) => {
    const bins = snapshot.val();
    const binStatusDiv = document.getElementById('trash-bin-status');
    binStatusDiv.innerHTML = '';  // Clear previous data

    for (const location in bins) {
        for (const binId in bins[location]) {
            const bin = bins[location][binId];
            const binInfo = `
                <div>
                    <strong>${location} - ${bin.binColor} Bin</strong>: 
                    Status: ${bin.status}, Distance: ${bin.distance}cm, 
                    Last Updated: ${bin.lastUpdated}, Location: ${bin.geoLocation}
                </div>`;
            binStatusDiv.innerHTML += binInfo;
        }
    }
});

// Call this function initially to set the button state correctly
updateAllLightsButtonState();
