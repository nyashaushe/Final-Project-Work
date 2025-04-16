console.log("Destination page script loaded.");
console.log("Destination page script loaded.");

// --- DOM Elements ---
const destinationNameElement = document.getElementById('destination-name');
// const favoriteButton = document.getElementById('favorite-button'); // Removed
const weatherInfoElement = document.getElementById('weather-info');
const attractionsListElement = document.getElementById('attractions-list');
const mapContainer = document.getElementById('map-container'); // Map container element
const currencyInfoElement = document.getElementById('currency-info');
const amountInput = document.getElementById('amount-input'); // Added amount input element

// --- Global variable to store fetched rates ---
let conversionRates = null;
let baseCurrencyGlobal = 'USD'; // Store the base currency used for fetching

// --- Constants ---
// API Keys are now read from environment variables
const FOURSQUARE_API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;
const EXCHANGE_RATE_API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // Added Weather API Key
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

    // Fetch data concurrently
    await Promise.all([
        fetchAndDisplayWeather(query),      // Fetch Weather
        fetchAndDisplayAttractions(query), // Fetch Attractions
        fetchAndDisplayCurrency()          // Fetch Currency
    ]);
    // 1. Fetch Weather Data - Handled above
    // 2. Fetch Attractions Data - Handled above
    // 3. Fetch Currency Data - Handled above
    await fetchAndDisplayCurrency(); // Assuming USD base for now
    // 4. Initialize Map - Handled within fetchAndDisplayAttractions

    // Placeholder updates (remove as features are implemented):
    // weatherInfoElement.textContent = `Weather data for ${decodeURIComponent(query)} will be shown here.`; // Removed placeholder
    // mapContainer.textContent = `Map for ${decodeURIComponent(query)} will be displayed here.`; // Removed placeholder

    // Update favorite button state - Removed call to updateFavoriteButton(query);
}


// --- Fetch and Display Weather ---
async function fetchAndDisplayWeather(query) {
    if (!WEATHER_API_KEY) {
        weatherInfoElement.textContent = 'Weather API key not configured.';
        console.error('VITE_WEATHER_API_KEY is missing.');
        return;
    }
    weatherInfoElement.textContent = 'Loading weather...';

    // Use OpenWeatherMap API (Current Weather Data)
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${WEATHER_API_KEY}&units=metric`; // units=metric for Celsius

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenWeatherMap API error: ${response.status} - ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        console.log("Weather Data:", data); // Log for debugging

        displayWeather(data);

    } catch (error) {
        console.error("Error fetching weather data:", error);
        weatherInfoElement.textContent = 'Could not load weather information.';
    }
}

// --- Display Weather in the DOM ---
function displayWeather(data) {
    if (!data || !data.weather || !data.main) {
        weatherInfoElement.textContent = 'Weather data unavailable.';
        return;
    }

    const description = data.weather[0]?.description || 'No description';
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const iconCode = data.weather[0]?.icon;
    const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';

    weatherInfoElement.innerHTML = `
        <img src="${iconUrl}" alt="${description}" style="vertical-align: middle; width: 50px; height: 50px;">
        <span>${description.charAt(0).toUpperCase() + description.slice(1)}</span><br>
        <span>Temperature: ${temp.toFixed(1)}°C</span><br>
        <span>Feels like: ${feelsLike.toFixed(1)}°C</span>
    `;
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

        // Fetch photos for each attraction
        const attractionsWithPhotos = await Promise.all(attractions.map(async (attraction) => {
            const photoUrl = await fetchAttractionPhoto(attraction.fsq_id);
            return { ...attraction, photoUrl }; // Add photoUrl to attraction object
        }));

        displayAttractions(attractionsWithPhotos); // Display attractions with photos

        // Initialize map after fetching attractions
        initializeMap(attractionsWithPhotos); // Pass attractions data to map

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
        const photoUrl = attraction.photoUrl; // Get the photo URL added earlier

        // Add image tag if photoUrl exists
        const imageHtml = photoUrl
            ? `<img src="${photoUrl}" alt="${name}" loading="lazy">` // Added loading="lazy"
            : '<div class="no-image-placeholder" style="height: 150px; background: #ddd; text-align: center; line-height: 150px; color: #888; border-radius: 4px; margin-bottom: 0.5rem;">No Image</div>'; // Placeholder

        // Create data object for the button
        const attractionData = {
            id: attraction.fsq_id,
            name: name,
            address: address,
            // Add other relevant details if needed for favorites page later
        };

        li.innerHTML = `
            ${imageHtml}
            <h4>${name}</h4>
            <p>${address}</p>
            <button class="fav-attraction-btn" data-attraction='${JSON.stringify(attractionData)}'>
                Add Attraction to Favs
            </button>
            `;
            // <p><small>Category: ${attraction.categories?.[0]?.name || 'Uncategorized'}</small></p> // Optional

        attractionsListElement.appendChild(li);

        // Set initial button state after appending
        updateAttractionFavoriteButton(li.querySelector('.fav-attraction-btn'), attractionData.id);
    });
}

// --- Update Individual Attraction Favorite Button State ---
// (Helper function to be called when displaying and after toggling)
function updateAttractionFavoriteButton(buttonElement, attractionId) {
    if (!buttonElement) return;
    if (isAttractionFavorite(attractionId)) {
        buttonElement.textContent = 'Remove Attraction Fav';
        buttonElement.classList.add('is-favorite');
    } else {
        buttonElement.textContent = 'Add Attraction Fav';
        buttonElement.classList.remove('is-favorite');
    }
}


// --- Fetch Photo for a Single Attraction ---
async function fetchAttractionPhoto(fsq_id) {
    if (!fsq_id) return null;

    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: FOURSQUARE_API_KEY
        }
      };

    const photoApiUrl = `https://api.foursquare.com/v3/places/${fsq_id}/photos?limit=1`; // Get only the first photo

    try {
        const response = await fetch(photoApiUrl, options);
        if (!response.ok) {
            // Don't throw error for photo failure, just return null
            console.warn(`Could not fetch photo for ${fsq_id}: ${response.status}`);
            return null;
        }
        const photos = await response.json();

        if (photos && photos.length > 0) {
            const photo = photos[0];
            // Construct URL (e.g., medium size 300x300)
            return `${photo.prefix}300x300${photo.suffix}`;
        }
        return null; // No photos found
    } catch (error) {
        console.error(`Error fetching photo for ${fsq_id}:`, error);
        return null;
    }
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
            conversionRates = data.conversion_rates; // Store rates globally
            baseCurrencyGlobal = baseCurrency; // Store base currency
            displayCurrency(); // Call display without args initially (uses default amount 1)
        } else {
            conversionRates = null; // Clear rates on error
            throw new Error(`ExchangeRate API error: ${data['error-type']}`);
        }
    } catch (error) {
        console.error("Error fetching currency data:", error);
        currencyInfoElement.textContent = 'Could not load currency information.';
    }
}

// --- Display Currency in the DOM ---
function displayCurrency() {
    if (!conversionRates) {
        currencyInfoElement.textContent = 'Currency rates not available.';
        return;
    }

    const amount = parseFloat(amountInput.value) || 0; // Get amount from input, default to 0 if invalid
    const rates = conversionRates;
    const baseCurrency = baseCurrencyGlobal;

    // Display rates for a few major currencies relative to the input amount
    const targetCurrencies = ['EUR', 'GBP', 'JPY', 'CAD']; // Example targets
    let html = `Equivalent to ${amount.toFixed(2)} ${baseCurrency}:<ul>`;

    targetCurrencies.forEach(currency => {
        if (rates[currency]) {
            const convertedValue = amount * rates[currency];
            html += `<li>${convertedValue.toFixed(4)} ${currency}</li>`;
        }
    });

    html += '</ul>';
    currencyInfoElement.innerHTML = html;
}

// --- Add event listener for the amount input ---
if (amountInput) {
    amountInput.addEventListener('input', displayCurrency); // Recalculate when input changes
}


// --- Destination Favorites Logic (Removed) ---
// Functions getFavorites, isFavorite, addFavorite, removeFavorite, updateFavoriteButton were removed
// as the main destination favorite button is gone.


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadDestinationData);

// Removed event listener for favoriteButton


// --- Attraction Favorites Logic ---
const ATTRACTION_FAVORITES_KEY = 'travelExplorerAttractionFavorites';

function getAttractionFavorites() {
    const favoritesJson = localStorage.getItem(ATTRACTION_FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : []; // Stores array of attraction objects
}

function isAttractionFavorite(attractionId) {
    const favorites = getAttractionFavorites();
    return favorites.some(fav => fav.id === attractionId);
}

function addAttractionFavorite(attractionData) {
    const favorites = getAttractionFavorites();
    if (!favorites.some(fav => fav.id === attractionData.id)) {
        favorites.push(attractionData);
        localStorage.setItem(ATTRACTION_FAVORITES_KEY, JSON.stringify(favorites));
        console.log(`Added attraction ${attractionData.name} to favorites.`);
    }
}

function removeAttractionFavorite(attractionId) {
    let favorites = getAttractionFavorites();
    favorites = favorites.filter(fav => fav.id !== attractionId);
    localStorage.setItem(ATTRACTION_FAVORITES_KEY, JSON.stringify(favorites));
    console.log(`Removed attraction ${attractionId} from favorites.`);
}

// --- Event Listener for Attraction Favorite Buttons (using delegation) ---
if (attractionsListElement) {
    attractionsListElement.addEventListener('click', (event) => {
        const button = event.target.closest('.fav-attraction-btn');
        if (button) {
            try {
                const attractionData = JSON.parse(button.dataset.attraction);
                if (isAttractionFavorite(attractionData.id)) {
                    removeAttractionFavorite(attractionData.id);
                } else {
                    addAttractionFavorite(attractionData);
                }
                updateAttractionFavoriteButton(button, attractionData.id); // Update this specific button
            } catch (e) {
                console.error("Error parsing attraction data from button:", e);
            }
        }
    });
}
