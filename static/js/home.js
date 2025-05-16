// Initialize animations when the page content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hero section animations (will start after loader animation completes)
    function initHeroAnimations() {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroCta = document.querySelector('.hero-cta');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        // Initial state - hidden
        gsap.set([heroTitle, heroSubtitle, heroCta, scrollIndicator], { 
            opacity: 0,
            y: 30
        });
        
        // Timeline for hero section animation
        const heroTimeline = gsap.timeline({ delay: 0.5 });
        
        heroTimeline.to(heroTitle, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out'
        })
        .to(heroSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.6')
        .to(heroCta, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.6')
        .to(scrollIndicator, {
            opacity: 0.6,
            y: 0,
            duration: 0.6,
            ease: 'power3.out'
        }, '-=0.4');
    }
    
    // Product cards reveal animation
    function initProductsAnimation() {
        const productCards = document.querySelectorAll('.product-card');
        
        gsap.set(productCards, { 
            opacity: 0,
            y: 50
        });
        
        ScrollTrigger.batch(productCards, {
            onEnter: batch => {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: 'power3.out'
                });
            },
            start: 'top 90%',
            once: true
        });
    }
    
    // Brand philosophy section animation
    function initPhilosophyAnimation() {
        const philosophyContent = document.querySelector('.philosophy-content');
        const philosophyImage = document.querySelector('.philosophy-image');
        
        gsap.set(philosophyContent.children, { 
            opacity: 0,
            x: -30
        });
        
        gsap.set(philosophyImage, { 
            opacity: 0,
            x: 30
        });
        
        ScrollTrigger.create({
            trigger: '.brand-philosophy',
            start: 'top 70%',
            onEnter: () => {
                gsap.to(philosophyContent.children, {
                    opacity: 1,
                    x: 0,
                    stagger: 0.2,
                    duration: 0.8,
                    ease: 'power3.out'
                });
                
                gsap.to(philosophyImage, {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    ease: 'power3.out'
                });
            },
            once: true
        });
    }
    
    // Newsletter section animation
    function initNewsletterAnimation() {
        const newsletterContent = document.querySelector('.newsletter-content');
        
        gsap.set(newsletterContent.children, { 
            opacity: 0,
            y: 30
        });
        
        ScrollTrigger.create({
            trigger: '.newsletter',
            start: 'top 70%',
            onEnter: () => {
                gsap.to(newsletterContent.children, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.2,
                    duration: 0.8,
                    ease: 'power3.out'
                });
            },
            once: true
        });
    }
    
    // Parallax scroll effect for hero section
    function initParallaxEffect() {
        gsap.to('.hero', {
            backgroundPosition: '50% 70%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }
    
    // Add scroll-triggered animations to sections
    function initSectionAnimations() {
        // Select all section headers
        const sectionHeaders = document.querySelectorAll('.section-header');
        
        // Animate section headers on scroll
        sectionHeaders.forEach(header => {
            gsap.set(header.children, { 
                opacity: 0,
                y: 20
            });
            
            ScrollTrigger.create({
                trigger: header,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(header.children, {
                        opacity: 1,
                        y: 0,
                        stagger: 0.2,
                        duration: 0.8,
                        ease: 'power3.out'
                    });
                },
                once: true
            });
        });
    }
    
    // Cursor effect for interactive elements
    function initCursorEffect() {
        const links = document.querySelectorAll('a, button');
        
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    // Wait for the page load animation to complete before initializing other animations
    window.addEventListener('load', () => {
        // Small delay to ensure the loader animation has finished
        setTimeout(() => {
            initHeroAnimations();
            initProductsAnimation();
            initPhilosophyAnimation();
            initNewsletterAnimation();
            initParallaxEffect();
            initSectionAnimations();
            initCursorEffect();
        }, 100);
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
}); 