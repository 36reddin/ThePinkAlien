function initBoxmaker() {
  const snackGrid = document.querySelector('.snack-grid');
  if (!snackGrid) return;

  const addToCartBtn = document.getElementById('add-to-cart');
  const spaceshipCart = document.getElementById('spaceship-cart');

  // ---- Container / picks state ----
  const containerSelect = document.getElementById('container-select');
  const picksTray = document.getElementById('picks-tray');
  const picksCountEl = document.getElementById('picks-count');
  const picksMaxEl = document.getElementById('picks-max');

  // ---- Cart UI ----
  const cartOpenBtn = document.getElementById('cart-open');
  const cartModal = document.getElementById('cart-modal');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartCountEl = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartClearBtn = document.getElementById('cart-clear');
  const cartCheckoutBtn = document.getElementById('cart-checkout');

  let containers = [];
  let maxPicks = 0; // 👈 start locked until container chosen
  let picks = [];   // array of {id,name,src}

  function normalizeSrc(src = '') {
    if (src.startsWith('RESOURCES/images/')) src = src.replace(/^RESOURCES\/images\//, 'images/');
    src = src.replace('RESOURCES/images', 'images');
    return src;
  }

  function updateAddToCartVisibility() {
    if (!addToCartBtn) return;
    const isFull = maxPicks > 0 && picks.length >= maxPicks;
    addToCartBtn.hidden = !isFull;
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('pinkAlien_cart') || '[]') || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem('pinkAlien_cart', JSON.stringify(cart || []));
  }

  function getSelectedContainer() {
    const id = containerSelect?.value || '';
    if (!id) return null;
    return containers.find(c => c.id === id) || null;
  }

  function renderCart() {
    const cart = loadCart();
    const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    if (cartCountEl) cartCountEl.textContent = String(count);

    if (!cartItemsEl || !cartTotalEl) return;

    let total = 0;
    cartItemsEl.innerHTML = cart.map((item, idx) => {
      const line = (item.price || 0) * (item.qty || 1);
      total += line;

      return `
        <div class="cart-item">
          <div class="cart-item-top">
            <img src="${item.containerSrc}" alt="${item.containerName}">
            <div>
              <div class="cart-item-name">${item.containerName} × ${item.qty || 1}</div>
              <div class="cart-item-meta">${item.picks?.length || 0} picks • $${Number(item.price || 0).toFixed(2)}</div>
            </div>
          </div>
          <div class="cart-item-meta" style="margin-top:8px">
            ${Array.isArray(item.picks) ? item.picks.map(p => p.name).join(', ') : ''}
          </div>
          <button class="cart-item-remove" type="button" data-remove="${idx}">Remove</button>
        </div>
      `;
    }).join('');

    cartTotalEl.textContent = total.toFixed(2);

    cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-remove'));
        const next = loadCart();
        next.splice(i, 1);
        saveCart(next);
        renderCart();
      });
    });
  }

  function openCart() {
    if (!cartModal) return;
    cartModal.hidden = false;
    renderCart();
  }
  function closeCart() {
    if (!cartModal) return;
    cartModal.hidden = true;
  }

  if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target?.dataset?.close) closeCart();
    });
  }
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
  }
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      alert('Checkout coming soon 🙂 (this is where Stripe/Wix checkout would hook in)');
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (maxPicks <= 0) return;
      if (picks.length < maxPicks) return;

      const c = getSelectedContainer();
      if (!c) return;

      const cart = loadCart();

      cart.push({
        containerId: c.id,
        containerName: c.name,
        containerSrc: normalizeSrc(c.src || ''),
        price: Number(c.price || 0),
        qty: 1,
        picks: [...picks]
      });

      saveCart(cart);
      renderCart();

      // clear picks after adding
      picks = [];
      updateCount();
      renderPickSlots();
      saveState();
      updateAddToCartVisibility();
    });
  }

  function setHeaderImageFromContainer(containerId) {
    // If blank / placeholder, DO NOT change the mothership image
    if (!containerId) return;

    const c = containers.find(x => x.id === containerId);
    if (!c || !spaceshipCart) return;

    const newSrc = normalizeSrc(c.src || '');
    if (newSrc) spaceshipCart.src = newSrc;
    spaceshipCart.alt = c.name ? `${c.name} preview` : 'Selected container';
  }

  async function loadContainers() {
    try {
      const res = await fetch('RESOURCES/data/containers.json');
      containers = await res.json();
    } catch (e) {
      containers = window.containers || [];
    }
  }

  function saveState() {
    const id = containerSelect?.value || '';
    if (id) localStorage.setItem('pinkAlien_containerId', id);
    else localStorage.removeItem('pinkAlien_containerId');

    localStorage.setItem('pinkAlien_picks', JSON.stringify(picks));
  }

  function restoreState() {
    const savedId = localStorage.getItem('pinkAlien_containerId') || '';
    const savedPicks = localStorage.getItem('pinkAlien_picks');

    if (savedPicks) {
      try { picks = JSON.parse(savedPicks) || []; } catch { picks = []; }
    }

    return savedId;
  }

  function setMaxPicksFromContainer(containerId) {
    const c = containers.find(x => x.id === containerId);
    maxPicks = c?.maxPicks ?? 0;

    // Trim picks if container got smaller
    if (picks.length > maxPicks) picks = picks.slice(0, maxPicks);

    if (picksMaxEl) picksMaxEl.textContent = String(maxPicks);
    updateCount();
    renderPickSlots();
    updateAddToCartVisibility();
  }

  function updateCount() {
    if (picksCountEl) picksCountEl.textContent = String(picks.length);
    if (picksMaxEl) picksMaxEl.textContent = String(maxPicks);
  }

  function renderContainerOptions(savedId) {
    if (!containerSelect) return;

    // Build options with a real placeholder first
    const placeholder = `<option value="" selected>Pick a container here!</option>`;
    const options = containers.map(c => {
      const label = `${c.name} • ${c.weight} • $${Number(c.price).toFixed(2)} • ${c.maxPicks} picks`;
      return `<option value="${c.id}">${label}</option>`;
    }).join('');

    containerSelect.innerHTML = placeholder + options;

    // Decide initial selection:
    // - If there’s a savedId that matches a container, use it
    // - Otherwise default to placeholder ("")
    const validSaved = savedId && containers.some(c => c.id === savedId);
    containerSelect.value = validSaved ? savedId : '';

    // Apply initial state
    if (containerSelect.value) {
      setMaxPicksFromContainer(containerSelect.value);
      setHeaderImageFromContainer(containerSelect.value);
    } else {
      // placeholder mode: lock picks + keep mothership image
      maxPicks = 0;
      picks = [];
      updateCount();
      renderPickSlots();
      updateAddToCartVisibility();
    }

    // On change: if placeholder, lock; else apply container
    containerSelect.addEventListener('change', () => {
      const id = containerSelect.value || '';

      if (!id) {
        maxPicks = 0;
        picks = [];
        updateCount();
        renderPickSlots();
        updateAddToCartVisibility();
        saveState();
        return;
      }

      setMaxPicksFromContainer(id);
      setHeaderImageFromContainer(id);
      saveState();
    });
  }

  function renderPickSlots() {
    if (!picksTray) return;

    picksTray.innerHTML = '';

    // If locked (no container), show some empty boxes as a hint
    const slotsToShow = Math.max(maxPicks, 6);

    for (let i = 0; i < slotsToShow; i++) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'pick-slot';
      slot.dataset.index = String(i);

      const picked = picks[i];
      if (picked) {
        slot.classList.add('filled');
        slot.innerHTML = `
          <img src="${picked.src}" alt="${picked.name}">
          <div class="slot-label">${picked.name}</div>
          <div class="slot-x" aria-hidden="true">×</div>
        `;
        slot.setAttribute('aria-label', `Remove ${picked.name}`);
      } else {
        slot.innerHTML = `<div class="slot-empty">Empty</div>`;
        slot.setAttribute('aria-label', 'Empty pick slot');
      }

      slot.addEventListener('click', () => {
        if (maxPicks <= 0) return; // locked
        const idx = Number(slot.dataset.index);
        if (!picks[idx]) return;

        picks.splice(idx, 1);
        updateCount();
        renderPickSlots();
        saveState();
        updateAddToCartVisibility();
      });

      picksTray.appendChild(slot);
    }
  }

  function trayNudge() {
    if (!picksTray) return;
    picksTray.classList.add('tray-nudge');
    setTimeout(() => picksTray.classList.remove('tray-nudge'), 280);
  }

  // ---- Click a candy card = add next pick ----
  snackGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.snack-item');
    if (!card) return;

    // Must choose container first
    if (maxPicks <= 0) {
      trayNudge();
      return;
    }

    if (picks.length >= maxPicks) {
      trayNudge();
      return;
    }

    const pick = {
      id: card.dataset.id || '',
      name: card.dataset.name || 'Candy',
      src: card.dataset.src || card.querySelector('img')?.src || ''
    };

    picks.push(pick);
    updateCount();
    renderPickSlots();
    saveState();
    updateAddToCartVisibility();

    // animate candy to mothership/container image
    const img = card.querySelector('img');
    if (img && spaceshipCart) animateToCart(img, spaceshipCart);
  });

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
      imgClone.style.transform =
        `translate3d(${centerX - imgRect.left}px, ${centerY - imgRect.top}px, 0) scale(0.3) rotate(720deg)`;
      imgClone.style.opacity = '0';
    }, 100);

    setTimeout(() => {
      cart.classList.add('bounce-effect');
      setTimeout(() => cart.classList.remove('bounce-effect'), 300);
    }, 500);

    imgClone.addEventListener('transitionend', function (ev) {
      if (ev.propertyName === 'opacity' && imgClone.parentNode) {
        imgClone.parentNode.removeChild(imgClone);
      }
    });
  }

  // ---- Boot ----
  (async function boot() {
    await loadContainers();
    const savedId = restoreState();
    renderContainerOptions(savedId);
    renderPickSlots();
    updateCount();
    updateAddToCartVisibility();
    renderCart();
  })();
}

window.boxmakerInit = initBoxmaker;
