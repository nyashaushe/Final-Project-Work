console.log("Destination page script loaded.");
console.log("Destination page script loaded.");

// --- DOM Elements ---
const destinationNameElement = document.getElementById('destination-name');
const favoriteButton = document.getElementById('favorite-button');
const weatherInfoElement = document.getElementById('weather-info');
const attractionsListElement = document.getElementById('attractions-list');
const mapContainer = document.getElementById('map-container'); // Map container element
const currencyInfoElement = document.getElementById('currency-info');

// --- Constants ---
// API Keys are now read from environment variables
const FOURSQUARE_API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;
const EXCHANGE_RATE_API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const FAVORITES_KEY = 'travelExplorerFavorites'; // Consistent key with favorites.js

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
    // 1. Fetch Weather Data (TODO)
    // 2. Fetch Attractions Data
    await fetchAndDisplayAttractions(query);
    // 3. Fetch Currency Data
    await fetchAndDisplayCurrency(); // Assuming USD base for now
    // 4. Initialize Map - Handled within fetchAndDisplayAttractions now

    // Placeholder updates (remove as features are implemented):
    weatherInfoElement.textContent = `Weather data for ${decodeURIComponent(query)} will be shown here.`;
    // mapContainer.textContent = `Map for ${decodeURIComponent(query)} will be displayed here.`; // Removed placeholder

    // Update favorite button state
    updateFavoriteButton(query);
}

// --- Global variable for map instance ---
let map = null;

// --- Fetch and Display Attractions ---
async function fetchAndDisplayAttractions(query) {
    attractionsListElement.innerHTML = '<li>Loading attractions...</li>'; // Show loading state

    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: FOURSQUARE_API_KEY // Use the variable read from .env
        }
      };

    // Request geocodes along with other fields
    const apiUrl = `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(query)}&limit=10&fields=name,location,categories,fsq_id,geocodes`; // Added geocodes

    try {
        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Foursquare Data:", data); // Log for debugging

        const attractions = data.results || [];
        displayAttractions(attractions); // Display attractions in the list

        // Initialize map after fetching attractions
        initializeMap(attractions);

    } catch (error) {
        console.error("Error fetching attractions:", error);
        attractionsListElement.innerHTML = '<li>Could not load attractions. Please try again later.</li>';
        mapContainer.textContent = 'Could not load map data.'; // Update map placeholder on error
    }
}

// --- Display Attractions in the DOM ---
function displayAttractions(attractions) {
    attractionsListElement.innerHTML = ''; // Clear loading/error message

    if (!attractions || attractions.length === 0) {
        attractionsListElement.innerHTML = '<li>No attractions found for this location.</li>';
        return;
    }

    attractions.forEach(attraction => {
        const li = document.createElement('li');
        li.className = 'card'; // Use the card style

        const name = attraction.name || 'Unnamed Attraction';
        const address = attraction.location?.formatted_address || 'Address not available';
        // const category = attraction.categories?.[0]?.name || 'Uncategorized'; // Optional: display category

        li.innerHTML = `
            <h4>${name}</h4>
            <p>${address}</p>
            `;
            // <p><small>Category: ${category}</small></p> // Optional

        // TODO: Add image fetching if API provides photo URLs

        attractionsListElement.appendChild(li);
    });
}

// --- Initialize Map ---
function initializeMap(attractions) {
    // Clear placeholder or previous map
    mapContainer.innerHTML = '';
    mapContainer.style.backgroundColor = 'transparent'; // Remove placeholder bg

    if (map) { // If map already exists, remove it before creating a new one
        map.remove();
        map = null;
    }

    if (typeof L === 'undefined') {
        mapContainer.textContent = 'Map library (Leaflet) not loaded.';
        console.error("Leaflet library (L) is not defined.");
        return;
    }

    // Find coordinates for the center (use the first attraction's main coordinates)
    let centerCoords = [51.505, -0.09]; // Default fallback (London)
    let zoomLevel = 13; // Default zoom

    const firstAttractionWithCoords = attractions.find(attr => attr.geocodes?.main);
    if (firstAttractionWithCoords) {
        centerCoords = [
            firstAttractionWithCoords.geocodes.main.latitude,
            firstAttractionWithCoords.geocodes.main.longitude
        ];
    } else if (attractions.length > 0) {
        // Fallback: maybe use location context if available (not implemented here)
        console.warn("No main geocodes found for centering map. Using default.");
    } else {
        mapContainer.textContent = 'No location data available to display map.';
        return; // Cannot initialize map without coordinates
    }

    try {
        map = L.map(mapContainer).setView(centerCoords, zoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add markers for attractions
        attractions.forEach(attraction => {
            if (attraction.geocodes?.main) {
                const markerCoords = [
                    attraction.geocodes.main.latitude,
                    attraction.geocodes.main.longitude
                ];
                const marker = L.marker(markerCoords).addTo(map);
                marker.bindPopup(`<b>${attraction.name || 'Attraction'}</b><br>${attraction.location?.formatted_address || ''}`);
            }
        });

    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        mapContainer.textContent = 'Error displaying map.';
    }
}


// --- Fetch and Display Currency ---
// Note: This currently fetches USD rates. Determining the destination's specific
// currency code from the query requires additional logic or another API.
async function fetchAndDisplayCurrency(baseCurrency = 'USD') {
    currencyInfoElement.textContent = 'Loading currency info...';
    // Use the variable read from .env
    const apiUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${baseCurrency}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json(); // API might return JSON error details
            throw new Error(`ExchangeRate API error: ${response.status} - ${errorData['error-type'] || response.statusText}`);
        }
        const data = await response.json();

        if (data.result === 'success') {
            displayCurrency(data.conversion_rates, baseCurrency);
        } else {
            throw new Error(`ExchangeRate API error: ${data['error-type']}`);
        }
    } catch (error) {
        console.error("Error fetching currency data:", error);
        currencyInfoElement.textContent = 'Could not load currency information.';
    }
}

// --- Display Currency in the DOM ---
function displayCurrency(rates, baseCurrency) {
    // Display rates for a few major currencies relative to the base
    const targetCurrencies = ['EUR', 'GBP', 'JPY', 'CAD']; // Example targets
    let html = `Rates based on 1 ${baseCurrency}:<ul>`;

    targetCurrencies.forEach(currency => {
        if (rates[currency]) {
            html += `<li>1 ${baseCurrency} = ${rates[currency].toFixed(4)} ${currency}</li>`;
        }
    });

    html += '</ul>';
    currencyInfoElement.innerHTML = html;
}


// --- Favorites Logic (adapted from favorites.js) ---
function getFavorites() {
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
}

function isFavorite(query) {
    const favorites = getFavorites();
    return favorites.includes(query);
}

function addFavorite(query) {
    const favorites = getFavorites();
    if (!favorites.includes(query)) {
        favorites.push(query);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        console.log(`Added ${decodeURIComponent(query)} to favorites.`);
    }
}

function removeFavorite(queryToRemove) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav !== queryToRemove);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log(`Removed ${decodeURIComponent(queryToRemove)} from favorites.`);
}

function updateFavoriteButton(query) {
    if (!favoriteButton) return;
    if (isFavorite(query)) {
        favoriteButton.textContent = 'Remove from Favorites';
        favoriteButton.classList.add('is-favorite'); // Optional: for styling
    } else {
        favoriteButton.textContent = 'Add to Favorites';
        favoriteButton.classList.remove('is-favorite'); // Optional: for styling
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadDestinationData);

if (favoriteButton) {
    favoriteButton.addEventListener('click', () => {
        const query = getQueryParam('query');
        if (query) {
            if (isFavorite(query)) {
                removeFavorite(query);
            } else {
                addFavorite(query);
            }
            updateFavoriteButton(query); // Update button text immediately
        }
    });
}
