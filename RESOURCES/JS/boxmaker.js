function initBoxmaker() {
  // Prefer the ID (safer if you accidentally have multiple grids in the HTML)
  const snackGrid =
    document.getElementById("snack-grid") || document.querySelector(".snack-grid");
  if (!snackGrid) return;

  const addToCartBtn = document.getElementById("add-to-cart");
  const headerImage = document.getElementById("spaceship-cart");

  // ---- Container / picks state ----
  const containerSelect = document.getElementById("container-select");
  const picksTray = document.getElementById("picks-tray");
  const picksCountEl = document.getElementById("picks-count");
  const picksMaxEl = document.getElementById("picks-max");

  // ---- Cart UI ----
  const cartOpenBtn = document.getElementById("cart-open");
  const cartModal = document.getElementById("cart-modal");
  const cartCloseBtn = document.getElementById("cart-close");
  const cartCountEl = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartClearBtn = document.getElementById("cart-clear");
  const cartCheckoutBtn = document.getElementById("cart-checkout");

  // ---- Data ----
  let containers = [];
  let maxPicks = 12;
  let picks = []; // [{id,name,src}]

  const STORAGE = {
    containerId: "pinkAlien_containerId",
    picks: "pinkAlien_picks",
    cart: "pinkAlien_cart",
  };

  // ---------- Helpers ----------
  function normalizeSrc(src = "") {
    // Make paths resilient if you flip between RESOURCES/... and relative folders
    // Examples:
    //  RESOURCES/images/products/x.jpg  -> RESOURCES/images/products/x.jpg (unchanged)
    //  RESOURCES/IMAGES/Products/x.jpg  -> RESOURCES/images/products/x.jpg (fixed-ish)
    //  images/products/x.jpg            -> images/products/x.jpg (unchanged)
    //  /RESOURCES/images/products/x.jpg -> RESOURCES/images/products/x.jpg
    if (!src) return "";

    src = String(src).trim().replace(/^\/+/, "");

    // Normalize slashes and some common casing mistakes
    src = src.replace(/\\/g, "/");
    src = src.replace(/^RESOURCES\/IMAGES\//, "RESOURCES/images/");
    src = src.replace(/^RESOURCES\/Images\//, "RESOURCES/images/");
    src = src.replace(/^RESOURCES\/images\/Products\//, "RESOURCES/images/products/");
    src = src.replace(/^RESOURCES\/images\/PRODUCTS\//, "RESOURCES/images/products/");

    return src;
  }

  function escHtml(s = "") {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updateAddToCartVisibility() {
    if (!addToCartBtn) return;
    addToCartBtn.hidden = !(picks.length >= maxPicks);
  }

  function updateCount() {
    if (picksCountEl) picksCountEl.textContent = String(picks.length);
    if (picksMaxEl) picksMaxEl.textContent = String(maxPicks);
  }

  function saveState() {
    if (containerSelect) localStorage.setItem(STORAGE.containerId, containerSelect.value || "");
    localStorage.setItem(STORAGE.picks, JSON.stringify(picks || []));
  }

  function restoreState() {
    const savedId = localStorage.getItem(STORAGE.containerId) || "";
    const savedPicks = localStorage.getItem(STORAGE.picks);
    if (savedPicks) {
      try {
        const parsed = JSON.parse(savedPicks);
        picks = Array.isArray(parsed) ? parsed : [];
      } catch {
        picks = [];
      }
    }
    return savedId;
  }

  function setMaxPicksFromContainer(containerId) {
    const c = containers.find((x) => x.id === containerId);
    if (c && typeof c.maxPicks === "number") maxPicks = c.maxPicks;

    // Trim picks if new container has fewer slots
    if (picks.length > maxPicks) picks = picks.slice(0, maxPicks);

    updateCount();
    renderPickSlots();
    updateAddToCartVisibility();
  }

  function setHeaderImageFromContainer(containerId) {
    if (!headerImage) return;
    const c = containers.find((x) => x.id === containerId);
    if (!c) return;

    const src = normalizeSrc(c.src || "");
    if (src) headerImage.src = src;
    headerImage.alt = c.name ? `${c.name} preview` : "Selected container";
  }

  function getSelectedContainer() {
    if (!containerSelect) return null;
    return containers.find((c) => c.id === containerSelect.value) || null;
  }

  // ---------- Cart ----------
  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE.cart) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE.cart, JSON.stringify(Array.isArray(cart) ? cart : []));
  }

  function renderCart() {
    const cart = loadCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    if (cartCountEl) cartCountEl.textContent = String(count);

    if (!cartItemsEl || !cartTotalEl) return;

    let total = 0;

    cartItemsEl.innerHTML = cart
      .map((item, idx) => {
        const qty = Number(item.qty) || 1;
        const price = Number(item.price) || 0;
        const line = price * qty;
        total += line;

        const containerName = escHtml(item.containerName || "Container");
        const containerSrc = normalizeSrc(item.containerSrc || "");
        const picksList = Array.isArray(item.picks) ? item.picks.map((p) => escHtml(p.name)).join(", ") : "";

        return `
          <div class="cart-item">
            <div class="cart-item-top">
              <img src="${containerSrc}" alt="${containerName}">
              <div>
                <div class="cart-item-name">${containerName} × ${qty}</div>
                <div class="cart-item-meta">${Array.isArray(item.picks) ? item.picks.length : 0} picks • $${price.toFixed(
                  2
                )}</div>
              </div>
            </div>
            <div class="cart-item-meta" style="margin-top:8px">${picksList}</div>
            <button class="cart-item-remove" type="button" data-remove="${idx}">Remove</button>
          </div>
        `;
      })
      .join("");

    cartTotalEl.textContent = total.toFixed(2);

    cartItemsEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-remove"));
        const next = loadCart();
        if (Number.isFinite(i) && i >= 0) next.splice(i, 1);
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

  if (cartOpenBtn) cartOpenBtn.addEventListener("click", openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);

  if (cartModal) {
    cartModal.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.close) closeCart();
    });
  }

  if (cartClearBtn) {
    cartClearBtn.addEventListener("click", () => {
      saveCart([]);
      renderCart();
    });
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener("click", () => {
      alert("Checkout coming soon 🙂 (this is where Stripe/Wix checkout would hook in)");
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      if (picks.length < maxPicks) return;

      const c = getSelectedContainer();
      if (!c) return;

      const cart = loadCart();
      cart.push({
        containerId: c.id,
        containerName: c.name,
        containerSrc: normalizeSrc(c.src || ""),
        price: Number(c.price || 0),
        qty: 1,
        picks: picks.map((p) => ({
          id: p.id || "",
          name: p.name || "",
          src: normalizeSrc(p.src || ""),
        })),
      });

      saveCart(cart);
      renderCart();

      // Clear picks after adding
      picks = [];
      saveState();
      updateCount();
      renderPickSlots();
      updateAddToCartVisibility();
    });
  }

  // ---------- Containers ----------
  async function loadContainers() {
    // Try a couple likely paths so you don’t get stuck if folders move
    const paths = [
      "RESOURCES/data/containers.json",
      "RESOURCES/DATA/containers.json",
      "RESOURCES/JSON/containers.json",
      "containers.json",
    ];

    for (const p of paths) {
      try {
        const res = await fetch(p, { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          containers = data;
          return;
        }
      } catch {
        // keep trying
      }
    }

    // last resort
    containers = Array.isArray(window.containers) ? window.containers : [];
  }

  function renderContainerOptions(savedId) {
    if (!containerSelect) return;

    // Build options first
    containerSelect.innerHTML = containers
      .map((c) => {
        const name = c.name || "Container";
        const weight = c.weight || "";
        const price = Number(c.price || 0).toFixed(2);
        const mp = typeof c.maxPicks === "number" ? c.maxPicks : maxPicks;
        const label = `${name} • ${weight} • $${price} • ${mp} picks`;
        return `<option value="${escHtml(c.id)}">${escHtml(label)}</option>`;
      })
      .join("");

    // Select initial container
    const initialId =
      savedId && containers.some((c) => c.id === savedId)
        ? savedId
        : containers[0]?.id || "";

    if (initialId) containerSelect.value = initialId;

    // Apply container effects on load
    setMaxPicksFromContainer(containerSelect.value);
    setHeaderImageFromContainer(containerSelect.value);

    // Ensure only ONE change listener
    containerSelect.onchange = () => {
      setMaxPicksFromContainer(containerSelect.value);
      setHeaderImageFromContainer(containerSelect.value);
      saveState();
    };
  }

  // ---------- Picks tray ----------
  function renderPickSlots() {
    if (!picksTray) return;

    picksTray.innerHTML = "";

    for (let i = 0; i < maxPicks; i++) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "pick-slot";
      slot.dataset.index = String(i);

      const picked = picks[i];

      if (picked) {
        slot.classList.add("filled");
        const imgSrc = normalizeSrc(picked.src || "");
        const name = picked.name || "Candy";
        slot.innerHTML = `
          <img src="${imgSrc}" alt="${escHtml(name)}">
          <div class="slot-label">${escHtml(name)}</div>
          <div class="slot-x" aria-hidden="true">×</div>
        `;
        slot.setAttribute("aria-label", `Remove ${name}`);
      } else {
        slot.innerHTML = `<div class="slot-empty">Empty</div>`;
        slot.setAttribute("aria-label", "Empty pick slot");
      }

      slot.addEventListener("click", () => {
        const idx = Number(slot.dataset.index);
        if (!Number.isFinite(idx) || !picks[idx]) return;

        picks.splice(idx, 1); // collapse left
        saveState();
        updateCount();
        renderPickSlots();
        updateAddToCartVisibility();
      });

      picksTray.appendChild(slot);
    }
  }

  function trayNudge() {
    if (!picksTray) return;
    picksTray.classList.add("tray-nudge");
    setTimeout(() => picksTray.classList.remove("tray-nudge"), 280);
  }

  // ---------- Click a candy card = add next pick ----------
  snackGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".snack-item");
    if (!card) return;

    if (picks.length >= maxPicks) {
      trayNudge();
      return;
    }

    const img = card.querySelector("img");
    const pick = {
      id: card.dataset.id || "",
      name: card.dataset.name || "Candy",
      src: normalizeSrc(card.dataset.src || img?.getAttribute("src") || ""),
    };

    picks.push(pick);
    saveState();
    updateCount();
    renderPickSlots();
    updateAddToCartVisibility();

    // Animate candy to header image
    if (img && headerImage) animateToCart(img, headerImage);
  });

  // ---------- Animation ----------
  function animateToCart(img, cart) {
    const imgClone = img.cloneNode(true);
    const imgRect = img.getBoundingClientRect();
    const cartRect = cart.getBoundingClientRect();

    const centerX = cartRect.left + cartRect.width / 2 - imgRect.width / 2;
    const centerY = cartRect.top + cartRect.height / 2 - imgRect.height / 2;

    imgClone.style.position = "fixed";
    imgClone.style.left = `${imgRect.left}px`;
    imgClone.style.top = `${imgRect.top}px`;
    imgClone.style.width = `${imgRect.width}px`;
    imgClone.style.height = `${imgRect.height}px`;
    imgClone.style.transition = "transform 1s ease-in-out, opacity 1s ease-in-out";
    imgClone.style.opacity = "1";
    imgClone.style.zIndex = "200";
    document.body.appendChild(imgClone);

    setTimeout(() => {
      imgClone.style.transform = `translate3d(${centerX - imgRect.left}px, ${
        centerY - imgRect.top
      }px, 0) scale(0.3) rotate(720deg)`;
      imgClone.style.opacity = "0";
    }, 60);

    setTimeout(() => {
      cart.classList.add("bounce-effect");
      setTimeout(() => cart.classList.remove("bounce-effect"), 300);
    }, 500);

    imgClone.addEventListener("transitionend", (ev) => {
      if (ev.propertyName === "opacity" && imgClone.parentNode) {
        imgClone.parentNode.removeChild(imgClone);
      }
    });
  }

  // ---------- Boot ----------
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
