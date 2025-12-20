// Exported initializer: call after products are rendered into the DOM
function initBoxmaker() {
    const spaceshipCart = document.getElementById('spaceship-cart');
    const SNACK_GRID_SELECTOR = '.snack-grid';

    // wire plus/minus for current DOM
    function wireQuantityButtons() {
        const plusButtons = document.querySelectorAll('.plus');
        const minusButtons = document.querySelectorAll('.minus');

        plusButtons.forEach((button) => {
            button.removeEventListener('click', plusHandler);
            button.addEventListener('click', plusHandler);
        });

        minusButtons.forEach((button) => {
            button.removeEventListener('click', minusHandler);
            button.addEventListener('click', minusHandler);
        });
    }

    function plusHandler() {
        const snackItem = this.closest('.snack-item');
        const quantitySpan = snackItem.querySelector('.quantity');
        let quantity = parseInt(quantitySpan.textContent, 10) || 0;
        quantity++;
        quantitySpan.textContent = quantity;
        const snackImage = snackItem.querySelector('img');
        if (snackImage && spaceshipCart) animateToCart(snackImage, spaceshipCart);
    }

    function minusHandler() {
        const snackItem = this.closest('.snack-item');
        const quantitySpan = snackItem.querySelector('.quantity');
        let quantity = parseInt(quantitySpan.textContent, 10) || 0;
        if (quantity > 0) {
            quantity--;
            quantitySpan.textContent = quantity;
        }
    }

    // Ensure the grid exists
    const snackGrid = document.querySelector(SNACK_GRID_SELECTOR);
    if (!snackGrid) return;

    // rewire quantity after rendering
    wireQuantityButtons();

    // animation function
    function animateToCart(img, cart) {
        const imgClone = img.cloneNode(true);
        const imgRect = img.getBoundingClientRect();
        const cartRect = cart.getBoundingClientRect();
        const centerX = cartRect.left + cartRect.width / 2 - imgRect.width / 2;
        const centerY = cartRect.top + cartRect.height / 2 - imgRect.height / 2;
        imgClone.style.position = 'fixed';
        imgClone.style.left = `${imgRect.left}px`;
        imgClone.style.top = `${imgRect.top}px`;
        imgClone.style.width = `${imgRect.width}px`;
        imgClone.style.height = `${imgRect.height}px`;
        imgClone.style.transition = 'transform 1s ease-in-out, opacity 1s ease-in-out';
        imgClone.style.opacity = '1';
        document.body.appendChild(imgClone);
        setTimeout(() => {
            imgClone.style.transform = `translate3d(${centerX - imgRect.left}px, ${centerY - imgRect.top}px, 0) scale(0.3) rotate(720deg)`;
            imgClone.style.opacity = '0';
        }, 100);
        setTimeout(() => {
            if (cart) {
                cart.classList.add('bounce-effect');
                setTimeout(() => cart.classList.remove('bounce-effect'), 300);
            }
        }, 500);
        imgClone.addEventListener('transitionend', function (e) {
            if (e.propertyName === 'opacity' && imgClone.parentNode) imgClone.parentNode.removeChild(imgClone);
        });
    }
}

// Expose initializer
window.boxmakerInit = initBoxmaker;
