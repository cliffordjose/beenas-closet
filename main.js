document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const reveals = document.querySelectorAll('.reveal');

    // Scroll Reveal Logic
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight / 5 * 4;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;

            if (revealTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });

        // Navigation Background Change
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };

    // Initialize Reveals
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Run once on load

    // Smooth Scrolling for Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Parallax Effect for Hero
    const hero = document.querySelector('.hero');
    window.addEventListener('scroll', () => {
        const scrollValue = window.scrollY;
        if (hero) {
            hero.style.backgroundPositionY = `${scrollValue * 0.5}px`;
        }
    });

    // Simple Cart Simulation
    let cartCount = 0;
    const cartBtn = document.getElementById('cart-btn');
    
    document.querySelectorAll('.btn').forEach(btn => {
        if (btn.innerText.includes('View') || btn.innerText.includes('Explore')) return;
        
        btn.addEventListener('click', (e) => {
            if (e.target.innerText === 'Subscribe') return;
            e.preventDefault();
            cartCount++;
            cartBtn.innerText = `Cart (${cartCount})`;
            
            // Basic feedback
            const originalText = e.target.innerText;
            e.target.innerText = 'Added to Cart';
            setTimeout(() => {
                e.target.innerText = originalText;
            }, 2000);
    });

    // -------- DYNAMIC CATALOG LOGIC --------

    // Helper: Resize image to save localStorage space
    const resizeImage = (file, maxWidth, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress heavily to ensure we don't hit localStorage limits too fast
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Load products from localStorage
    const getProducts = () => {
        const products = localStorage.getItem('beenaVogueProducts');
        return products ? JSON.parse(products) : [];
    };

    // Render products on the main page
    const dynamicCatalog = document.getElementById('dynamic-catalog');
    if (dynamicCatalog) {
        const products = getProducts();
        if (products.length === 0) {
            dynamicCatalog.innerHTML = '<p class="reveal active" style="text-align: center; color: var(--color-text-muted); width: 100%; grid-column: 1 / -1;">No new arrivals to display yet. Check back soon!</p>';
        } else {
            dynamicCatalog.innerHTML = ''; // Clear loading text
            products.reverse().forEach((product) => {
                const item = document.createElement('div');
                item.className = 'product-item reveal active';
                item.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-item-img">
                    <div class="product-item-info">
                        <h3>${product.name}</h3>
                        <div class="product-item-category">${product.category}</div>
                        <div class="product-item-price">$${Number(product.price).toFixed(2)}</div>
                        <button class="btn btn-solid cart-btn" data-name="${product.name}">Add to Cart</button>
                    </div>
                `;
                dynamicCatalog.appendChild(item);
            });

            // Re-attach cart buttons logic for new items
            document.querySelectorAll('.cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    cartCount++;
                    cartBtn.innerText = `Cart (${cartCount})`;
                    
                    const originalText = e.target.innerText;
                    e.target.innerText = 'Added';
                    setTimeout(() => {
                        e.target.innerText = originalText;
                    }, 2000);
                });
            });
        }
    }

    // Admin Dashboard Logic
    const adminForm = document.getElementById('add-product-form');
    const adminCatalogList = document.getElementById('admin-catalog-list');

    const renderAdminList = () => {
        if (!adminCatalogList) return;
        const products = getProducts();
        adminCatalogList.innerHTML = '';
        
        if (products.length === 0) {
            adminCatalogList.innerHTML = '<p style="color: var(--color-text-muted);">No products added yet.</p>';
            return;
        }

        products.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'admin-product-item';
            item.innerHTML = `
                <div class="admin-product-info">
                    <img src="${product.image}" class="admin-product-img">
                    <div>
                        <div style="font-weight: 500;">${product.name}</div>
                        <div style="color: var(--color-text-muted); font-size: 0.8rem;">$${product.price} - ${product.category}</div>
                    </div>
                </div>
                <button class="delete-btn" data-index="${index}">Remove</button>
            `;
            adminCatalogList.appendChild(item);
        });

        // Delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                const currentProducts = getProducts();
                currentProducts.splice(index, 1);
                localStorage.setItem('beenaVogueProducts', JSON.stringify(currentProducts));
                renderAdminList();
            });
        });
    };

    if (adminForm) {
        renderAdminList();

        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = adminForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Saving...';
            submitBtn.disabled = true;

            const file = document.getElementById('product-image').files[0];
            const name = document.getElementById('product-name').value;
            const price = document.getElementById('product-price').value;
            const category = document.getElementById('product-category').value;

            if (file) {
                // Resize image to max-width 600px to save storage
                resizeImage(file, 600, (base64Image) => {
                    const products = getProducts();
                    products.push({
                        id: Date.now(),
                        name,
                        price,
                        category,
                        image: base64Image
                    });

                    try {
                        localStorage.setItem('beenaVogueProducts', JSON.stringify(products));
                        adminForm.reset();
                        renderAdminList();
                    } catch (error) {
                        alert("Storage limit exceeded. Please try deleting some older products or using a smaller image.");
                    } finally {
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                    }
                });
            }
        });
    }

});
