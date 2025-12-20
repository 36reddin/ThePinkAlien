// boxmaker-render.js
(async function () {
  const grid = document.getElementById('snack-grid');
  if (!grid) return;

  try {
    let products = null;
    try {
      const res = await fetch('RESOURCES/data/products.json');
      products = await res.json();
    } catch (e) {
      products = (window.products && Array.isArray(window.products)) ? window.products : null;
      if (!products) {
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

    const html = (products || []).map(prod => {
      let src = prod.src || '';
      if (src.startsWith('RESOURCES/images/')) src = src.replace(/^RESOURCES\/images\//, 'images/');
      src = src.replace('RESOURCES/images', 'images');

      const safeName = (prod.name || 'Candy').replace(/"/g, '&quot;');

      return `
        <button class="snack-item"
          type="button"
          data-id="${prod.id}"
          data-name="${safeName}"
          data-src="${src}"
          aria-label="Add ${safeName}"
        >
          <div class="snack-image">
            <img src="${src}" alt="${safeName}">
          </div>
          <div class="snack-info">
            <div class="name">${safeName}</div>
          </div>
        </button>
      `;
    }).join('\n');

    grid.innerHTML = html;

    if (window.boxmakerInit && typeof window.boxmakerInit === 'function') {
      setTimeout(() => window.boxmakerInit(), 20);
    }
  } catch (err) {
    console.error('Could not load products.json', err);
  }
})();
