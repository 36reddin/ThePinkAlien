function initBoxmaker() {
  const snackGrid = document.querySelector('.snack-grid');
  if (!snackGrid) return;

  const spaceshipCart = document.getElementById('spaceship-cart');

  // ---- Container / picks state ----
  const containerSelect = document.getElementById('container-select');
  const picksTray = document.getElementById('picks-tray');
  const picksCountEl = document.getElementById('picks-count');
  const picksMaxEl = document.getElementById('picks-max');

  let containers = [];
  let maxPicks = 12;
  let picks = []; // array of {id,name,src}

  // Try load containers.json (you have this data already)
  async function loadContainers() {
    try {
      const res = await fetch('RESOURCES/data/containers.json');
      containers = await res.json();
    } catch (e) {
      containers = window.containers || [];
    }
  }

  function saveState() {
    localStorage.setItem('pinkAlien_containerId', containerSelect?.value || '');
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
    maxPicks = c?.maxPicks ?? maxPicks;

    // Trim picks if container got smaller
    if (picks.length > maxPicks) picks = picks.slice(0, maxPicks);

    picksMaxEl.textContent = String(maxPicks);
    updateCount();
    renderPickSlots();
  }

  function updateCount() {
    picksCountEl.textContent = String(picks.length);
  }

  function renderContainerOptions(savedId) {
    if (!containerSelect) return;

    containerSelect.innerHTML = containers.map(c => {
      const label = `${c.name} • ${c.weight} • $${Number(c.price).toFixed(2)} • ${c.maxPicks} picks`;
      return `<option value="${c.id}">${label}</option>`;
    }).join('');

    // pick saved container if possible; else first container
    const initialId =
      (savedId && containers.some(c => c.id === savedId)) ? savedId :
      (containers[0]?.id || '');

    if (initialId) containerSelect.value = initialId;
    setMaxPicksFromContainer(containerSelect.value);

    containerSelect.addEventListener('change', () => {
      setMaxPicksFromContainer(containerSelect.value);
      saveState();
    });
  }

  function renderPickSlots() {
    if (!picksTray) return;

    picksTray.innerHTML = '';
    for (let i = 0; i < maxPicks; i++) {
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
        // remove clicked pick (and collapse left so no holes)
        const idx = Number(slot.dataset.index);
        if (!picks[idx]) return;

        picks.splice(idx, 1);
        updateCount();
        renderPickSlots();
        saveState();
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

    // animate candy to mothership (keeps your existing vibe)
    const img = card.querySelector('img');
    if (img && spaceshipCart) animateToCart(img, spaceshipCart);
  });

  // ---- Your existing animation, unchanged ----
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
  })();
}

window.boxmakerInit = initBoxmaker;
