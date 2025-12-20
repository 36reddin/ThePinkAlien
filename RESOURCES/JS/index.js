document.addEventListener('DOMContentLoaded', () => {
	console.log('Welcome to The Pink Alien!');

	// Smooth-scroll internal anchors (anchors with hashes)
	document.querySelectorAll('a[href^="#"]').forEach(a => {
		a.addEventListener('click', (e) => {
			const href = a.getAttribute('href');
			if (href && href.startsWith('#') && href.length > 1) {
				const target = document.querySelector(href);
				if (target) {
					e.preventDefault();
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		});
	});

	// Navigation link active state
	const navLinks = document.querySelectorAll('nav ul li a');
	function setActiveLink(link) {
		navLinks.forEach(nav => nav.classList.remove('active'));
		if (link) link.classList.add('active');
	}
	navLinks.forEach(link => {
		link.addEventListener('click', () => setActiveLink(link));
	});
	// If page loaded with a hash, try to mark corresponding nav link
	if (location.hash) {
		const match = Array.from(navLinks).find(a => a.getAttribute('href') === location.hash);
		if (match) setActiveLink(match);
	}

	// Product click behaviour (simple popup)
	document.querySelectorAll('.product').forEach(product => {
		product.addEventListener('click', () => {
			const titleEl = product.querySelector('h3');
			const title = titleEl ? titleEl.innerText : 'product';
			alert(`You clicked on ${title}!`);
		});
	});

	// Footer year: replace any 4-digit year with current year
	const footerP = document.querySelector('footer p');
	if (footerP) {
		footerP.textContent = footerP.textContent.replace(/\d{4}/, new Date().getFullYear());
	}

	// Lazy-load images and hide broken images
	document.querySelectorAll('img').forEach(img => {
		try {
			img.loading = 'lazy';
		} catch (e) {
			// ignore if property unsupported
		}
		img.addEventListener('error', () => {
			img.style.display = 'none';
		});
	});
});
