(function () {
	const root = document.documentElement;
	const panels = Array.from(document.querySelectorAll(".poem-panel"));
	const meter = document.querySelector(".scroll-meter span");
	let ticking = false;

	function viewportHeight() {
		return Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight);
	}

	function setAppHeight() {
		root.style.setProperty("--app-height", `${viewportHeight()}px`);
	}

	function updateScrollState() {
		const scrollTop = window.scrollY || window.pageYOffset;
		const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
		const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

		root.style.setProperty("--meter", progress.toFixed(4));
		if (meter) {
			meter.style.transform = `scaleY(${progress})`;
		}

		panels.forEach((panel) => {
			const rect = panel.getBoundingClientRect();
			const panelProgress = Math.min(1, Math.max(-1, rect.top / Math.max(1, window.innerHeight)));
			panel.style.setProperty("--scroll-progress", panelProgress.toFixed(4));
		});

		ticking = false;
	}

	function requestScrollUpdate() {
		if (!ticking) {
			window.requestAnimationFrame(updateScrollState);
			ticking = true;
		}
	}

	function observePanels() {
		if (!("IntersectionObserver" in window)) {
			panels.forEach((panel) => panel.classList.add("is-visible"));
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
				}
			});
		}, {
			root: null,
			threshold: 0.34,
			rootMargin: "0px 0px -8% 0px"
		});

		panels.forEach((panel) => observer.observe(panel));
	}

	function handleResize() {
		setAppHeight();
		requestScrollUpdate();
	}

	window.addEventListener("scroll", requestScrollUpdate, { passive: true });
	window.addEventListener("resize", handleResize, { passive: true });
	window.addEventListener("orientationchange", () => window.setTimeout(handleResize, 220), { passive: true });

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", handleResize, { passive: true });
	}

	setAppHeight();
	observePanels();
	updateScrollState();
}());
