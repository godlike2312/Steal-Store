// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// DOM Elements
const body = document.body;
const loader = document.querySelector('.loader');
const mainNav = document.querySelector('.main-nav');
const menuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const cartToggles = document.querySelectorAll('.cart-toggle');
const cartDrawer = document.querySelector('.cart-drawer');
const closeCart = document.querySelector('.close-cart');
const overlay = document.querySelector('.overlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = document.querySelectorAll('.cart-count');

// Page Load Animation
window.addEventListener('load', () => {
    // Initial load animation
    const tl = gsap.timeline();
    
    tl.to('.loader-content h1', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out'
    })
    .to('.loader-line', {
        width: 200,
        duration: 1.8,
        ease: 'power3.inOut'
    })
    .to(body, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.inOut'
    })
    .to(loader, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 0.5,
        onComplete: () => {
            loader.style.display = 'none';
            // Initialize after loader is gone
            initAnimations();
        }
    });
    
    // Update cart count
    updateCartCount();
});

// Initialize all animations after page load
function initAnimations() {
    // Update cart count on page load
    updateCartCount();
    
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
            
            // Staggered animation for mobile nav links
            if (mobileNav.classList.contains('active')) {
                gsap.to(mobileNavLinks, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.5,
                    ease: 'power3.out',
                    delay: 0.2
                });
            } else {
                gsap.to(mobileNavLinks, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    ease: 'power3.in'
                });
            }
        });
    }
    
    // Page transition loader
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
        // Skip links that open in new tabs or are anchors on the same page
        if (link.getAttribute('target') === '_blank' || link.getAttribute('href')?.startsWith('#')) {
            return;
        }
        
        link.addEventListener('click', (e) => {
            // Don't show loader for current page links
            if (link.getAttribute('href') === window.location.pathname) {
                return;
            }
            
            e.preventDefault();
            const href = link.getAttribute('href');
            
            // Close mobile nav if open
            if (mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Show loader
            loader.style.display = 'flex';
            loader.style.opacity = '0';
            
            gsap.to(loader, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.inOut',
                onComplete: () => {
                    window.location.href = href;
                }
            });
        });
    });
    
    // Cart drawer toggle
    cartToggles.forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('click', () => {
                if (cartDrawer) {
                    cartDrawer.classList.add('active');
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    
                    // Cart open animation
                    gsap.from('.cart-drawer > *', {
                        opacity: 0,
                        x: 20,
                        stagger: 0.1,
                        duration: 0.4,
                        ease: 'power3.out'
                    });
                    
                    renderCart();
                }
            });
        }
    });
    
    // Close cart
    if (closeCart) {
        closeCart.addEventListener('click', closeCartDrawer);
    }
    
    // Overlay click to close mobile nav and cart
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                gsap.to(mobileNavLinks, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    ease: 'power3.in'
                });
            }
            
            closeCartDrawer();
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Add to cart functionality for all pages
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            
            // Default product data
            let productData = {
                id: Date.now(), // Generate a temporary ID
                name: "Product",
                price: 99.99,
                image: "/static/img/product-placeholder.jpg",
                quantity: 1
            };
            
            // Try to get product data from card
            if (productCard) {
                const productId = button.dataset.productId || productCard.dataset.productId;
                const productName = productCard.querySelector('h3')?.textContent || "Product";
                const productPriceText = productCard.querySelector('.price')?.textContent || "$99.99";
                const productPrice = parseFloat(productPriceText.replace('$', ''));
                const productImage = productCard.querySelector('img')?.src || "/static/img/product-placeholder.jpg";
                
                productData = {
                    id: productId ? parseInt(productId) : Date.now(),
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                };
            }
            
            // Add to cart
            addToCart(productData);
            
            // Button animation
            gsap.to(e.target, {
                scale: 1.1,
                duration: 0.1,
                onComplete: () => {
                    gsap.to(e.target, {
                        scale: 1,
                        duration: 0.1
                    });
                }
            });
            
            // Cart count animation
            cartCount.forEach(count => {
                gsap.from(count, {
                    scale: 1.5,
                    duration: 0.3,
                    ease: 'elastic.out(1, 0.4)'
                });
            });
            
            // Open cart drawer
            cartDrawer.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderCart();
        });
    });
}

// Close cart drawer
function closeCartDrawer() {
    if (cartDrawer) {
        cartDrawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Add item to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(product);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // If cart is open, update display
    if (cartDrawer.classList.contains('active')) {
        renderCart();
    }
}

// Update cart count display
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.forEach(el => {
        el.textContent = totalItems;
    });
}

// Render cart items
function renderCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalAmountElements = document.querySelectorAll('.total-amount');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is currently empty.</p>
                <a href="/products" class="btn primary-btn">Shop Now</a>
            </div>
        `;
        
        totalAmountElements.forEach(el => {
            el.textContent = '$0.00';
        });
        
        return;
    }
    
    let cartHTML = '';
    let totalAmount = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        cartHTML += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                </div>
                <button class="remove-item">×</button>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    
    totalAmountElements.forEach(el => {
        el.textContent = `$${totalAmount.toFixed(2)}`;
    });
    
    // Add event listeners to cart item buttons
    const minusButtons = document.querySelectorAll('.quantity-btn.minus');
    const plusButtons = document.querySelectorAll('.quantity-btn.plus');
    const removeButtons = document.querySelectorAll('.remove-item');
    
    minusButtons.forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });
    
    plusButtons.forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
    
    removeButtons.forEach(button => {
        button.addEventListener('click', removeItem);
    });
}

// Decrease item quantity
function decreaseQuantity(e) {
    const cartItem = e.target.closest('.cart-item');
    const itemId = parseInt(cartItem.dataset.id);
    const item = cart.find(item => item.id === itemId);
    
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart = cart.filter(item => item.id !== itemId);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

// Increase item quantity
function increaseQuantity(e) {
    const cartItem = e.target.closest('.cart-item');
    const itemId = parseInt(cartItem.dataset.id);
    const item = cart.find(item => item.id === itemId);
    
    item.quantity += 1;
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

// Remove item from cart
function removeItem(e) {
    const cartItem = e.target.closest('.cart-item');
    const itemId = parseInt(cartItem.dataset.id);
    
    // Animation
    gsap.to(cartItem, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
            cart = cart.filter(item => item.id !== itemId);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            renderCart();
        }
    });
} 