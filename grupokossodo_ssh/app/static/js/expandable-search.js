// Search functionality with expandable search icon
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchExpandable = document.querySelector('.search-expandable');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    // Function to toggle search input visibility
    function toggleSearchInput() {
        searchExpandable.classList.toggle('active');
        if (searchExpandable.classList.contains('active')) {
            setTimeout(() => {
                searchInput.focus();
            }, 300); // Wait for animation to complete
        } else {
            searchResults.classList.remove('visible');
        }
    }
    
    // Toggle search when clicking the search icon
    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSearchInput();
        });
    }
    
    // Close search when clicking the close button
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', function() {
            searchExpandable.classList.remove('active');
            searchResults.classList.remove('visible');
        });
    }
    
    // Handle click outside to close search
    document.addEventListener('click', function(e) {
        const isClickInside = searchToggleBtn.contains(e.target) || 
                             searchExpandable.contains(e.target) ||
                             searchResults.contains(e.target);
        
        if (!isClickInside && searchExpandable.classList.contains('active')) {
            searchExpandable.classList.remove('active');
            searchResults.classList.remove('visible');
        }
    });
    
    // Show search results when typing in the input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                searchResults.classList.add('visible');
            } else {
                searchResults.classList.remove('visible');
            }
        });
    }
});
