console.log("Favorites page script loaded.");

// --- DOM Elements ---
const favoritesListElement = document.getElementById('favorites-list');

// --- Favorites Logic (using localStorage) ---
const FAVORITES_KEY = 'travelExplorerFavorites';

function getFavorites() {
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
}

// Note: Functions to add/remove favorites will likely live in destination.js
// or potentially a shared utility module later.

function displayFavorites() {
    if (!favoritesListElement) return;

    const favorites = getFavorites();
    favoritesListElement.innerHTML = ''; // Clear loading message

    if (favorites.length === 0) {
        favoritesListElement.innerHTML = '<li>You have no saved favorites yet.</li>';
        return;
    }

    favorites.forEach(favQuery => {
        const li = document.createElement('li');
        // Create a link to the destination page for the favorite
        const link = document.createElement('a');
        link.href = `destination.html?query=${encodeURIComponent(favQuery)}`; // Use relative path
        link.textContent = decodeURIComponent(favQuery); // Display the saved query name

        // Optional: Add a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.style.marginLeft = '10px';
        removeButton.onclick = () => {
            removeFavorite(favQuery);
            displayFavorites(); // Refresh the list
        };

        li.appendChild(link);
        li.appendChild(removeButton);
        favoritesListElement.appendChild(li);
    });
}

function removeFavorite(queryToRemove) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav !== queryToRemove);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log(`Removed ${decodeURIComponent(queryToRemove)} from favorites.`);
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', displayFavorites);
