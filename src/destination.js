console.log("Destination page script loaded.");

// --- DOM Elements ---
const destinationNameElement = document.getElementById('destination-name');
const favoriteButton = document.getElementById('favorite-button');
const weatherInfoElement = document.getElementById('weather-info');
const attractionsListElement = document.getElementById('attractions-list');
const mapContainer = document.getElementById('map-container');
const currencyInfoElement = document.getElementById('currency-info');

// --- Function to get query parameter ---
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// --- Fetch and Display Data ---
async function loadDestinationData() {
    const query = getQueryParam('query');

    if (!query) {
        destinationNameElement.textContent = "No destination specified.";
        // Clear loading messages
        weatherInfoElement.textContent = '';
        attractionsListElement.innerHTML = '';
        currencyInfoElement.textContent = '';
        mapContainer.textContent = 'Please search for a destination first.';
        return;
    }

    destinationNameElement.textContent = `Details for ${decodeURIComponent(query)}`;

    // TODO: Implement API calls
    // 1. Fetch Weather Data
    // 2. Fetch Attractions Data
    // 3. Fetch Currency Data
    // 4. Initialize Map

    // Placeholder updates:
    weatherInfoElement.textContent = `Weather data for ${decodeURIComponent(query)} will be shown here.`;
    attractionsListElement.innerHTML = `<li>Attractions for ${decodeURIComponent(query)} will be listed here.</li>`;
    currencyInfoElement.textContent = `Currency information for ${decodeURIComponent(query)} will be shown here.`;
    mapContainer.textContent = `Map for ${decodeURIComponent(query)} will be displayed here.`;

    // TODO: Add favorite button functionality (check if already favorite, add/remove)
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadDestinationData);

if (favoriteButton) {
    favoriteButton.addEventListener('click', () => {
        const query = getQueryParam('query');
        if (query) {
            alert(`Add/Remove ${decodeURIComponent(query)} from favorites - functionality to be implemented.`);
            // TODO: Implement localStorage logic for favorites
        }
    });
}
