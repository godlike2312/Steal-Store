// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const productCards = document.querySelectorAll('.product-card');
    const categoryFilters = document.querySelectorAll('input[name="category"]');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const sortOptions = document.getElementById('sort-options');
    const clearFilters = document.querySelector('.clear-filters');
    
    // Current filter state
    let activeFilters = {
        categories: ['all'],
        maxPrice: 500,
        sortBy: 'featured'
    };
    
    // Initialize animations
    function initAnimations() {
        // Initial fade-in for product cards with stagger effect
        gsap.set(productCards, { 
            opacity: 0,
            y: 30 
        });
        
        gsap.to(productCards, {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.3
        });
    }
    
    // Filter products based on active filters
    function filterProducts() {
        // Create animation timeline
        const tl = gsap.timeline();
        
        // Fade out all products first
        tl.to(productCards, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            ease: 'power2.in',
            stagger: 0.02,
            onComplete: () => {
                // After fade out, apply filters and fade in filtered products
                const filteredProducts = Array.from(productCards).filter(card => {
                    // Check category filter
                    const cardCategory = card.getAttribute('data-category');
                    const categoryMatch = activeFilters.categories.includes('all') || 
                                        activeFilters.categories.includes(cardCategory);
                    
                    // Check price filter
                    const cardPrice = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
                    const priceMatch = cardPrice <= activeFilters.maxPrice;
                    
                    // Hide or show based on filter match
                    card.style.display = (categoryMatch && priceMatch) ? 'block' : 'none';
                    
                    return categoryMatch && priceMatch;
                });
                
                // Sort filtered products
                sortProducts(filteredProducts);
                
                // Fade in the filtered products
                gsap.to(filteredProducts, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                    stagger: 0.05
                });
            }
        });
    }
    
    // Sort the products
    function sortProducts(products) {
        const productsGrid = document.querySelector('.products-grid');
        
        // Sort based on active sort option
        products.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.price').textContent.replace('$', ''));
            const priceB = parseFloat(b.querySelector('.price').textContent.replace('$', ''));
            
            switch (activeFilters.sortBy) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'newest':
                    // For demo purposes, we'll use ID as a proxy for "newest"
                    const idA = parseInt(a.querySelector('.add-to-cart').getAttribute('data-product-id'));
                    const idB = parseInt(b.querySelector('.add-to-cart').getAttribute('data-product-id'));
                    return idB - idA;
                default:
                    // Featured (default sorting)
                    return 0;
            }
        });
        
        // Rearrange DOM elements based on sort
        products.forEach(product => {
            productsGrid.appendChild(product);
        });
    }
    
    // Update price value display
    function updatePriceDisplay() {
        priceValue.textContent = `$${activeFilters.maxPrice}`;
    }
    
    // Reset filters to default
    function resetFilters() {
        // Reset category checkboxes
        categoryFilters.forEach(filter => {
            filter.checked = filter.value === 'all';
        });
        
        // Reset price range
        priceRange.value = 500;
        
        // Reset sort option
        sortOptions.value = 'featured';
        
        // Reset active filters object
        activeFilters = {
            categories: ['all'],
            maxPrice: 500,
            sortBy: 'featured'
        };
        
        // Update UI
        updatePriceDisplay();
        
        // Apply reset filters
        filterProducts();
    }
    
    // Event Listeners
    // Category filter change
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', () => {
            // If "All Products" is checked, uncheck other categories
            if (filter.value === 'all' && filter.checked) {
                categoryFilters.forEach(f => {
                    if (f.value !== 'all') {
                        f.checked = false;
                    }
                });
                activeFilters.categories = ['all'];
            } else {
                // If any other category is checked, uncheck "All Products"
                const allFilter = document.getElementById('category-all');
                allFilter.checked = false;
                
                // Update active categories
                activeFilters.categories = Array.from(categoryFilters)
                    .filter(f => f.checked)
                    .map(f => f.value);
                
                // If no categories are selected, default to "All Products"
                if (activeFilters.categories.length === 0) {
                    allFilter.checked = true;
                    activeFilters.categories = ['all'];
                }
            }
            
            // Apply filters
            filterProducts();
        });
    });
    
    // Price range change
    priceRange.addEventListener('input', () => {
        activeFilters.maxPrice = parseInt(priceRange.value);
        updatePriceDisplay();
    });
    
    priceRange.addEventListener('change', () => {
        filterProducts();
    });
    
    // Sort options change
    sortOptions.addEventListener('change', () => {
        activeFilters.sortBy = sortOptions.value;
        filterProducts();
    });
    
    // Clear filters
    clearFilters.addEventListener('click', resetFilters);
    
    // Initialize animations and filters
    initAnimations();
    updatePriceDisplay();
    
    // Pagination functionality (simplified for demo)
    const pageNumbers = document.querySelectorAll('.page-number');
    const prevBtn = document.querySelector('.pagination-btn.prev');
    const nextBtn = document.querySelector('.pagination-btn.next');
    
    pageNumbers.forEach(number => {
        number.addEventListener('click', () => {
            // Remove active class from all page numbers
            pageNumbers.forEach(num => num.classList.remove('active'));
            
            // Add active class to clicked page number
            number.classList.add('active');
            
            // Get current page
            const currentPage = parseInt(number.textContent);
            
            // Update pagination buttons
            prevBtn.classList.toggle('disabled', currentPage === 1);
            nextBtn.classList.toggle('disabled', currentPage === pageNumbers.length);
            
            // Scroll to top of products
            window.scrollTo({
                top: document.querySelector('.products-container').offsetTop - 100,
                behavior: 'smooth'
            });
            
            // In a real app, this would load new products
            // For demo, we'll just animate the existing ones
            const tl = gsap.timeline();
            
            tl.to(productCards, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                ease: 'power2.in',
                stagger: 0.02
            })
            .to(productCards, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out',
                stagger: 0.05
            });
        });
    });
    
    // Pagination next button
    nextBtn.addEventListener('click', () => {
        const activePage = document.querySelector('.page-number.active');
        const currentPage = parseInt(activePage.textContent);
        
        if (currentPage < pageNumbers.length) {
            pageNumbers.forEach(num => {
                if (parseInt(num.textContent) === currentPage + 1) {
                    num.click();
                }
            });
        }
    });
    
    // Pagination previous button
    prevBtn.addEventListener('click', () => {
        const activePage = document.querySelector('.page-number.active');
        const currentPage = parseInt(activePage.textContent);
        
        if (currentPage > 1) {
            pageNumbers.forEach(num => {
                if (parseInt(num.textContent) === currentPage - 1) {
                    num.click();
                }
            });
        }
    });
}); 