(function () {
	const root = document.documentElement;
	const progress = document.querySelector(".progress span");
	const revealItems = Array.from(document.querySelectorAll(".reveal"));
	let ticking = false;

	root.classList.add("js-enabled");

	function setViewportHeight() {
		const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
		root.style.setProperty("--vh", `${height * 0.01}px`);
	}

	function updateProgress() {
		const scrollTop = window.scrollY || window.pageYOffset;
		const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
		const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));

		root.style.setProperty("--progress", ratio.toFixed(4));
		if (progress) {
			progress.style.transform = `scaleX(${ratio})`;
		}
		ticking = false;
	}

	function requestProgressUpdate() {
		if (!ticking) {
			window.requestAnimationFrame(updateProgress);
			ticking = true;
		}
	}

	function revealFallback() {
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}

	function revealVisibleItems() {
		const viewport = window.innerHeight || root.clientHeight;

		revealItems.forEach((item) => {
			const rect = item.getBoundingClientRect();
			if (rect.top < viewport * 0.9 && rect.bottom > viewport * 0.08) {
				item.classList.add("is-visible");
			}
		});
	}

	function observeReveals() {
		if (!("IntersectionObserver" in window)) {
			revealFallback();
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					observer.unobserve(entry.target);
				}
			});
		}, {
			threshold: 0.18,
			rootMargin: "0px 0px -12% 0px"
		});

		revealItems.forEach((item) => observer.observe(item));
	}

	function handleResize() {
		setViewportHeight();
		requestProgressUpdate();
	}

	window.addEventListener("scroll", requestProgressUpdate, { passive: true });
	window.addEventListener("resize", handleResize, { passive: true });
	window.addEventListener("orientationchange", () => window.setTimeout(handleResize, 220), { passive: true });

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", handleResize, { passive: true });
	}

	setViewportHeight();
	observeReveals();
	revealVisibleItems();
	window.requestAnimationFrame(revealVisibleItems);
	updateProgress();
}());
