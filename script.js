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

// Function to control LEDs and update location and lastUpdated
window.toggleLED = function (ledId, isChecked) {
    const ledPath = `Automation/LEDs/${ledId}/state`;
    const currentTime = new Date().toLocaleString();  // Capture the current time for lastUpdated
    const locations = {
        "LED-1": "Main Hall",
        "LED-2": "Corridor",
        "LED-3": "Gym Area",
        "LED-4": "Library"
    };

    // Set LED state, location, and lastUpdated in the database
    set(ref(database, `Automation/LEDs/${ledId}`), {
        state: isChecked ? 1 : 0,
        lastUpdated: currentTime,
        location: locations[ledId] // Store the location corresponding to the LED
    }).then(() => {
        const ledName = ledId === 'LED-4' ? "Bell" : ledId.replace("-", " ");
        console.log(`${ledName} turned ${isChecked ? "ON" : "OFF"} at ${currentTime}`);

        // Update the "All Lights" button state only for the first three LEDs
        if (ledId !== 'LED-4') {
            updateAllLightsButtonState();
        }
    }).catch((error) => {
        console.error("Error updating database:", error);
    });
};

// Function to toggle all LEDs
window.toggleAllLEDs = function (isChecked) {
    toggleLED('LED-1', isChecked);
    toggleLED('LED-2', isChecked);
    toggleLED('LED-3', isChecked);
};

// Function to update "All Lights" button state based on individual light statuses
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

// Listen for changes in Firebase and update the UI with the location and lastUpdated
onValue(ref(database, 'Automation/LEDs'), (snapshot) => {
    const leds = snapshot.val();

    for (let ledId in leds) {
        const toggleSwitch = document.getElementById(ledId);
        if (toggleSwitch) {
            toggleSwitch.checked = leds[ledId].state === 1;
        }

        // Display the lastUpdated and location in the console (or the UI)
        console.log(`${ledId} last updated at: ${leds[ledId].lastUpdated}, Location: ${leds[ledId].location}`);
    }

    // Update the "All Lights" button state
    updateAllLightsButtonState();
});

// Initialize the "All Lights" button state
updateAllLightsButtonState();
