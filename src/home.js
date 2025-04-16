console.log("Home page script loaded.");

// --- DOM Elements ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const featuredList = document.getElementById('featured-list');

// --- Featured Destinations (Static Example) ---
const featuredDestinations = [
    { name: "Paris, France", description: "The city of lights and love.", image: "/placeholder-paris.jpg" }, // Placeholder image path
    { name: "Tokyo, Japan", description: "A vibrant metropolis blending tradition and modernity.", image: "/placeholder-tokyo.jpg" },
    { name: "Rome, Italy", description: "Eternal city with ancient wonders.", image: "/placeholder-rome.jpg" }
];

function displayFeaturedDestinations() {
    if (!featuredList) return;

    featuredList.innerHTML = ''; // Clear loading message

    if (featuredDestinations.length === 0) {
        featuredList.innerHTML = '<p>No featured destinations available right now.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none'; // Basic styling
    ul.style.padding = '0';

    featuredDestinations.forEach(dest => {
        const li = document.createElement('li');
        li.style.marginBottom = '1rem'; // Basic spacing
        li.innerHTML = `
            <h4>${dest.name}</h4>
            <p>${dest.description}</p>
            <!-- <img src="${dest.image}" alt="${dest.name}" width="100"> Placeholder -->
        `;
        ul.appendChild(li);
    });
    featuredList.appendChild(ul);
}

// --- Search Functionality ---
function handleSearch(event) {
    event.preventDefault(); // Prevent default form submission
    const query = searchInput.value.trim();

    if (query) {
        console.log(`Searching for: ${query}`);
        // Redirect to destination page with the query
        // Using URLSearchParams for clean parameter passing
        // Use relative path for GitHub Pages compatibility
        window.location.href = `destination.html?query=${encodeURIComponent(query)}`;
    } else {
        alert("Please enter a destination to search for.");
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    displayFeaturedDestinations();

    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
});
