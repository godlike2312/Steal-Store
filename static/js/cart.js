// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalElement = document.querySelector('.subtotal');
    const shippingElement = document.querySelector('.shipping');
    const totalAmountElement = document.querySelector('.total-amount');
    const checkoutButton = document.querySelector('.checkout-btn');
    
    // Cart state
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Initialize animations
    function initAnimations() {
        // Fade in cart items one by one
        gsap.from('.cart-page > *', {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power3.out',
            delay: 0.3
        });
    }
    
    // Render cart items
    function renderCart() {
        if (cart.length === 0) {
            // Empty cart state
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is currently empty.</p>
                    <a href="/products" class="btn primary-btn">Continue Shopping</a>
                </div>
            `;
            
            // Update totals
            updateTotals(0);
            
            // Disable checkout button
            checkoutButton.disabled = true;
            
            return;
        }
        
        // Enable checkout button
        checkoutButton.disabled = false;
        
        // Render each cart item
        let cartHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
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
                    <div class="cart-item-total">
                        <p>$${itemTotal.toFixed(2)}</p>
                        <button class="remove-item">×</button>
                    </div>
                </div>
            `;
        });
        
        // Add cart summary for mobile view
        cartHTML += `
            <div class="cart-summary-mobile">
                <button class="proceed-to-checkout">Proceed to Checkout</button>
            </div>
        `;
        
        cartItemsContainer.innerHTML = cartHTML;
        
        // Update totals
        updateTotals(subtotal);
        
        // Add event listeners to cart item buttons
        attachCartItemListeners();
        
        // Apply fade-in animation to new elements
        gsap.from('.cart-item', {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power3.out'
        });
    }
    
    // Update cart totals
    function updateTotals(subtotal) {
        // Calculate shipping (free over $100, otherwise $10)
        const shipping = subtotal > 0 ? (subtotal >= 100 ? 0 : 10) : 0;
        
        // Calculate total
        const total = subtotal + shipping;
        
        // Update UI elements
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        totalAmountElement.textContent = `$${total.toFixed(2)}`;
    }
    
    // Attach event listeners to cart item buttons
    function attachCartItemListeners() {
        const minusButtons = document.querySelectorAll('.quantity-btn.minus');
        const plusButtons = document.querySelectorAll('.quantity-btn.plus');
        const removeButtons = document.querySelectorAll('.remove-item');
        const proceedToCheckoutBtn = document.querySelector('.proceed-to-checkout');
        
        minusButtons.forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });
        
        plusButtons.forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });
        
        removeButtons.forEach(button => {
            button.addEventListener('click', removeItem);
        });
        
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', () => {
                checkoutButton.click();
            });
        }
    }
    
    // Decrease item quantity
    function decreaseQuantity(e) {
        const cartItem = e.target.closest('.cart-item');
        const itemId = parseInt(cartItem.dataset.id);
        const item = cart.find(item => item.id === itemId);
        
        if (item.quantity > 1) {
            // Decrease quantity
            item.quantity -= 1;
            
            // Update quantity display with animation
            const quantityElement = cartItem.querySelector('.quantity');
            
            gsap.to(quantityElement, {
                scale: 0.8,
                duration: 0.2,
                onComplete: () => {
                    quantityElement.textContent = item.quantity;
                    gsap.to(quantityElement, {
                        scale: 1,
                        duration: 0.2
                    });
                }
            });
            
            // Update item total price
            const itemTotal = item.price * item.quantity;
            cartItem.querySelector('.cart-item-total p').textContent = `$${itemTotal.toFixed(2)}`;
            
            // Save updated cart to localStorage
            saveCart();
            
            // Update totals
            const subtotal = calculateSubtotal();
            updateTotals(subtotal);
        } else {
            // If quantity is 1, remove the item
            removeItem(e);
        }
    }
    
    // Increase item quantity
    function increaseQuantity(e) {
        const cartItem = e.target.closest('.cart-item');
        const itemId = parseInt(cartItem.dataset.id);
        const item = cart.find(item => item.id === itemId);
        
        // Increase quantity
        item.quantity += 1;
        
        // Update quantity display with animation
        const quantityElement = cartItem.querySelector('.quantity');
        
        gsap.to(quantityElement, {
            scale: 1.2,
            duration: 0.2,
            onComplete: () => {
                quantityElement.textContent = item.quantity;
                gsap.to(quantityElement, {
                    scale: 1,
                    duration: 0.2
                });
            }
        });
        
        // Update item total price
        const itemTotal = item.price * item.quantity;
        cartItem.querySelector('.cart-item-total p').textContent = `$${itemTotal.toFixed(2)}`;
        
        // Save updated cart to localStorage
        saveCart();
        
        // Update totals
        const subtotal = calculateSubtotal();
        updateTotals(subtotal);
    }
    
    // Remove item from cart
    function removeItem(e) {
        const cartItem = e.target.closest('.cart-item');
        const itemId = parseInt(cartItem.dataset.id);
        
        // Animation for removing item
        gsap.to(cartItem, {
            opacity: 0,
            x: 20,
            height: 0,
            marginBottom: 0,
            padding: 0,
            duration: 0.5,
            ease: 'power3.in',
            onComplete: () => {
                // Remove item from array
                cart = cart.filter(item => item.id !== itemId);
                
                // Save updated cart to localStorage
                saveCart();
                
                // Re-render cart if it's now empty
                if (cart.length === 0) {
                    renderCart();
                } else {
                    // Just update the totals
                    const subtotal = calculateSubtotal();
                    updateTotals(subtotal);
                }
            }
        });
    }
    
    // Calculate subtotal from cart items
    function calculateSubtotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Save cart to localStorage and update header cart count
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count in header (if exists)
        const headerCartCount = document.querySelector('.cart-count');
        if (headerCartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            headerCartCount.textContent = totalItems;
        }
    }
    
    // Checkout button click
    checkoutButton.addEventListener('click', () => {
        // In a real app, this would redirect to checkout
        // For demo, we'll show an animation
        
        gsap.to('.cart-container', {
            opacity: 0,
            y: -20,
            duration: 0.5,
            ease: 'power3.in',
            onComplete: () => {
                cartItemsContainer.innerHTML = `
                    <div class="checkout-success">
                        <h2>Thank you for your order!</h2>
                        <p>Your order has been placed successfully.</p>
                        <p>Order #: STL-${Math.floor(Math.random() * 10000)}</p>
                        <a href="/" class="btn primary-btn">Return to Home</a>
                    </div>
                `;
                
                document.querySelector('.cart-summary').style.display = 'none';
                
                gsap.to('.cart-container', {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'power3.out'
                });
                
                // Clear cart
                cart = [];
                saveCart();
            }
        });
    });
    
    // Initialize
    renderCart();
    initAnimations();
}); 