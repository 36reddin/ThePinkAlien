const DEFAULT_PRICE = 17.00; // change later

// Renderer: load products.json and populate #snack-grid, then call boxmakerInit()
(async function () {
    const grid = document.getElementById('snack-grid');
    if (!grid) return;

    try {
        let products = null;
        try {
            const res = await fetch('RESOURCES/data/products.json');
            products = await res.json();
        } catch (e) {
            // fetch may fail when opening the file via file:// in some browsers
            products = (window.products && Array.isArray(window.products)) ? window.products : null;
            if (!products) {
                // attempt to load fallback JS that declares window.PRODUCTS
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'RESOURCES/JS/products-data.js';
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('could not load products-data.js'));
                    document.head.appendChild(s);
                });
                products = window.products || [];
            }
        }

        function formatPrice(p) {
            if (typeof p === 'number') return '$' + p.toFixed(2);
            return p;
        }

        const html = (products || []).map(prod => {
            // Normalize image paths: many product src values point to RESOURCES/IMAGES/Products/... in data
            let src = prod.src || '';
            if (src.startsWith('RESOURCES/IMAGES/')) {
                // map to repo-root IMAGES/ path
                src = src.replace(/^RESOURCES\/IMAGES\//, 'IMAGES/');
            }
            // if path contains /Products/ ensure it still points to that folder under IMAGES
            src = src.replace('RESOURCES/IMAGES', 'IMAGES');

            return `
            <div class="snack-item" data-id="${prod.id}">
                <div class="snack-image"><img src="${src}" alt="${(prod.name || '')}"></div>
                <div class="card-bottom">
                    <div class="snack-info">
                        <div class="name">${prod.name || 'Placeholder'}</div>
                    </div>
                    <div class="controls">
                        <button class="minus" aria-label="Remove one">-</button>
                        <span class="quantity">0</span>
                        <button class="plus" aria-label="Add one">+</button>
                    </div>
                </div>
            </div>`;
        }).join('\n');

        grid.innerHTML = html;

        // allow other scripts to wire event handlers (like boxmaker.js)
        if (window.boxmakerInit && typeof window.boxmakerInit === 'function') {
            // small delay to ensure DOM insertion is complete
            setTimeout(() => window.boxmakerInit(), 20);
        }
    } catch (err) {
        console.error('Could not load products.json', err);
    }
})();
