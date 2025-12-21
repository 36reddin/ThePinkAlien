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
  let maxPicks = 0; // locked until container chosen
  let picks = [];   // array of {id,name,src}

  // ---- Sides preview (auto-created) ----
  let sidesPreviewEl = null;

  function normalizeSrc(src = '') {
    if (src.startsWith('RESOURCES/images/')) src = src.replace(/^RESOURCES\/images\//, 'images/');
    src = src.replace('RESOURCES/images', 'images');
    return src;
  }

  function ensureSidesPreviewEl() {
    if (!spaceshipCart) return null;
    if (sidesPreviewEl && sidesPreviewEl.isConnected) return sidesPreviewEl;

    // Try to find existing element first
    let existing = document.getElementById('sides-preview');
    if (existing) {
      sidesPreviewEl = existing;
      return sidesPreviewEl;
    }

    // Create one next to the container image
    const wrap = spaceshipCart.parentElement || spaceshipCart;
    const img = document.createElement('img');
    img.id = 'sides-preview';
    img.alt = 'Sides preview';
    img.hidden = true;
    img.style.display = 'block';
    img.style.maxWidth = '160px';
    img.style.height = 'auto';
    img.style.marginLeft = '12px';

    // If parent is not flex, we still append; CSS later can make it perfect.
    wrap.appendChild(img);

    sidesPreviewEl = img;
    return sidesPreviewEl;
  }

  function setSidesPreviewFromContainer(containerId) {
    const el = ensureSidesPreviewEl();
    if (!el) return;

    if (!containerId) {
      el.hidden = true;
      el.removeAttribute('src');
      return;
    }

    const c = containers.find(x => x.id === containerId);
    if (!c || !c.includeSides) {
      el.hidden = true;
      el.removeAttribute('src');
      return;
    }

    // Recommended: put sidesSrc + sidesAlt on the container object in containers.json
    const sidesSrc = normalizeSrc(c.sidesSrc || '');
    if (!sidesSrc) {
      // includeSides true, but no image provided yet
      el.hidden = true;
      el.removeAttribute('src');
      return;
    }

    el.src = sidesSrc;
    el.alt = c.sidesAlt || 'Sides included';
    el.hidden = false;
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

  // A stable signature to detect duplicate “same container + same picks”
  // NOTE: This does NOT affect the draft; only cart merging.
  function cartSignature(containerId, picksArr) {
    const ids = (Array.isArray(picksArr) ? picksArr : [])
      .map(p => p?.id || '')
      .filter(Boolean)
      .sort(); // order-insensitive match
    return `${containerId}::${ids.join('|')}`;
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

      const qty = item.qty || 1;
      const picksText = Array.isArray(item.picks) ? item.picks.map(p => p.name).join(', ') : '';

      return `
        <div class="cart-item">
          <div class="cart-item-top">
            <img src="${item.containerSrc}" alt="${item.containerName}">
            <div>
              <div class="cart-item-name">${item.containerName} <span style="opacity:.9">× ${qty}</span></div>
              <div class="cart-item-meta">${item.picks?.length || 0} picks • $${Number(item.price || 0).toFixed(2)}</div>
            </div>
          </div>

          <div class="cart-item-meta" style="margin-top:8px">
            ${picksText}
          </div>

          <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
            <button class="cart-item-edit" type="button" data-edit="${idx}">Edit box</button>
            <button class="cart-item-remove" type="button" data-remove="${idx}">Remove</button>
          </div>
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

    cartItemsEl.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-edit'));
        const cartNow = loadCart();
        const item = cartNow[i];
        if (!item) return;

        // Load the builder state from the cart item
        if (containerSelect) containerSelect.value = item.containerId || '';

        setMaxPicksFromContainer(item.containerId || '');
        setHeaderImageFromContainer(item.containerId || '');
        setSidesPreviewFromContainer(item.containerId || '');

        picks = Array.isArray(item.picks) ? item.picks.map(p => ({ ...p })) : [];
        // Trim just in case container changed and is smaller
        if (picks.length > maxPicks) picks = picks.slice(0, maxPicks);

        updateCount();
        renderPickSlots();
        saveState();
        updateAddToCartVisibility();

        closeCart();

        // optional: bring user back to the top where the container preview is
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
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

      const newItem = {
        containerId: c.id,
        containerName: c.name,
        containerSrc: normalizeSrc(c.src || ''),
        price: Number(c.price || 0),
        qty: 1,
        picks: [...picks]
      };

      // ---- MERGE DUPLICATES IN CART ONLY ----
      const sig = cartSignature(newItem.containerId, newItem.picks);
      const existingIdx = cart.findIndex(it => cartSignature(it.containerId, it.picks) === sig);

      if (existingIdx >= 0) {
        cart[existingIdx].qty = (cart[existingIdx].qty || 1) + 1;
      } else {
        cart.push(newItem);
      }

      saveCart(cart);
      renderCart();

      // clear draft picks after adding
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
      setSidesPreviewFromContainer(containerSelect.value);
    } else {
      // placeholder mode: lock picks + keep mothership image
      maxPicks = 0;
      picks = [];
      setSidesPreviewFromContainer(''); // hide
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
        setSidesPreviewFromContainer(''); // hide
        updateCount();
        renderPickSlots();
        updateAddToCartVisibility();
        saveState();
        return;
      }

      setMaxPicksFromContainer(id);
      setHeaderImageFromContainer(id);
      setSidesPreviewFromContainer(id);
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
    ensureSidesPreviewEl(); // create/hook sides preview early
    const savedId = restoreState();
    renderContainerOptions(savedId);
    renderPickSlots();
    updateCount();
    updateAddToCartVisibility();
    renderCart();
  })();
}

window.boxmakerInit = initBoxmaker;
