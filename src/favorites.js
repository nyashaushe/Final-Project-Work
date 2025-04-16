console.log("Favorites page script loaded.");

// --- DOM Elements ---
const favoritesListElement = document.getElementById('favorites-list'); // For destinations
const favoriteAttractionsListElement = document.getElementById('favorite-attractions-list'); // For attractions

// --- Favorites Logic (using localStorage) ---
const FAVORITES_KEY = 'travelExplorerFavorites'; // Key for destinations
const ATTRACTION_FAVORITES_KEY = 'travelExplorerAttractionFavorites'; // Key for attractions

// === Destination Favorites ===
function getDestinationFavorites() { // Renamed
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
}

// Note: Functions to add favorites live in destination.js

function displayDestinationFavorites() { // Renamed
    if (!favoritesListElement) return;

    const favorites = getDestinationFavorites(); // Use renamed function
    favoritesListElement.innerHTML = ''; // Clear loading message

    if (favorites.length === 0) {
        favoritesListElement.innerHTML = '<li>You have no favorite destinations yet.</li>'; // Updated text
        return;
    }

    favorites.forEach(favQuery => {
        const li = document.createElement('li');
        // Create a link to the destination page for the favorite
        const link = document.createElement('a');
        // Update link to include base path
        link.href = `/Final-Project-Work/destination.html?query=${encodeURIComponent(favQuery)}`;
        link.textContent = decodeURIComponent(favQuery); // Display the saved query name

        // Optional: Add a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.style.marginLeft = '10px';
        removeButton.onclick = () => {
            removeDestinationFavorite(favQuery); // Use renamed function
            // displayDestinationFavorites(); // Refresh handled by calling function below
        };

        li.appendChild(link);
        li.appendChild(removeButton);
        favoritesListElement.appendChild(li);
    });
}

function removeDestinationFavorite(queryToRemove) { // Renamed
    let favorites = getDestinationFavorites(); // Use renamed function
    favorites = favorites.filter(fav => fav !== queryToRemove);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log(`Removed destination ${decodeURIComponent(queryToRemove)} from favorites.`);
    displayDestinationFavorites(); // Refresh destination list
}

// === Attraction Favorites ===

function getAttractionFavorites() {
    const favoritesJson = localStorage.getItem(ATTRACTION_FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : []; // Stores array of attraction objects
}

function removeAttractionFavorite(attractionIdToRemove) {
    let favorites = getAttractionFavorites();
    favorites = favorites.filter(fav => fav.id !== attractionIdToRemove);
    localStorage.setItem(ATTRACTION_FAVORITES_KEY, JSON.stringify(favorites));
    console.log(`Removed attraction ${attractionIdToRemove} from favorites.`);
    displayAttractionFavorites(); // Refresh attraction list
}

function displayAttractionFavorites() {
    if (!favoriteAttractionsListElement) return;

    const favorites = getAttractionFavorites();
    favoriteAttractionsListElement.innerHTML = ''; // Clear loading/previous content

    if (favorites.length === 0) {
        favoriteAttractionsListElement.innerHTML = '<li>You have no favorite attractions yet.</li>';
        return;
    }

    favorites.forEach(attraction => {
        const li = document.createElement('li');
        // Display attraction details (adjust as needed)
        li.innerHTML = `
            <h4>${attraction.name || 'Unnamed Attraction'}</h4>
            <p>${attraction.address || 'Address not available'}</p>
            <button class="remove-attraction-fav-btn" data-id="${attraction.id}">Remove</button>
        `;
        // Add some basic styling or classes if desired
        li.style.marginBottom = '1rem';
        li.style.paddingBottom = '1rem';
        li.style.borderBottom = '1px solid #ccc'; // Separator

        favoriteAttractionsListElement.appendChild(li);
    });
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    displayDestinationFavorites(); // Call renamed function
    displayAttractionFavorites(); // Display attraction favorites
});

// Add event listener for removing attraction favorites (using delegation)
if (favoriteAttractionsListElement) {
    favoriteAttractionsListElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-attraction-fav-btn')) {
            const attractionIdToRemove = event.target.dataset.id;
            if (attractionIdToRemove) {
                removeAttractionFavorite(attractionIdToRemove);
            }
        }
    });
}
