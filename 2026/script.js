(function () {
	const root = document.documentElement;
	const pages = Array.from(document.querySelectorAll(".poem-page"));
	const dots = Array.from(document.querySelectorAll(".dot"));
	const prevButton = document.querySelector('[data-action="prev"]');
	const nextButton = document.querySelector('[data-action="next"]');
	const book = document.querySelector(".book");
	const canvas = document.querySelector(".firefly-canvas");
	const context = canvas.getContext("2d");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	let currentPage = 0;
	let isTurning = false;
	let touchStart = null;
	let particles = [];
	let animationFrame = 0;

	function setAppHeight() {
		root.style.setProperty("--app-height", `${window.innerHeight}px`);
	}

	function updateControls() {
		prevButton.disabled = currentPage === 0;
		nextButton.disabled = currentPage === pages.length - 1;
		dots.forEach((dot, index) => {
			dot.classList.toggle("is-active", index === currentPage);
		});
	}

	function clearTurnClasses(page) {
		page.classList.remove("is-enter-next", "is-enter-prev", "is-exit-next", "is-exit-prev");
	}

	function turnTo(nextPageIndex) {
		if (isTurning || nextPageIndex === currentPage || nextPageIndex < 0 || nextPageIndex >= pages.length) {
			return;
		}

		const direction = nextPageIndex > currentPage ? "next" : "prev";
		const outgoingPage = pages[currentPage];
		const incomingPage = pages[nextPageIndex];
		const fastTurn = reducedMotion.matches;

		isTurning = !fastTurn;
		pages.forEach(clearTurnClasses);
		incomingPage.classList.add("is-active", `is-enter-${direction}`);
		outgoingPage.classList.add(`is-exit-${direction}`);
		currentPage = nextPageIndex;
		updateControls();

		window.setTimeout(() => {
			outgoingPage.classList.remove("is-active");
			clearTurnClasses(outgoingPage);
			clearTurnClasses(incomingPage);
			isTurning = false;
		}, fastTurn ? 0 : 740);
	}

	function resizeCanvas() {
		if (!context) {
			return;
		}

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = window.innerWidth;
		const height = window.innerHeight;

		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);

		const count = width < 430 ? 24 : 38;
		particles = Array.from({ length: count }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: 0.8 + Math.random() * 1.9,
			phase: Math.random() * Math.PI * 2,
			speed: 0.25 + Math.random() * 0.55,
			drift: -0.28 + Math.random() * 0.56,
			alpha: 0.24 + Math.random() * 0.44
		}));
	}

	function drawFireflies(time) {
		if (!context) {
			return;
		}

		const width = window.innerWidth;
		const height = window.innerHeight;

		context.clearRect(0, 0, width, height);
		particles.forEach((particle) => {
			particle.phase += 0.018 * particle.speed;
			particle.x += particle.drift * 0.16;
			particle.y += Math.sin(particle.phase) * 0.18 - 0.045;

			if (particle.x < -20) particle.x = width + 20;
			if (particle.x > width + 20) particle.x = -20;
			if (particle.y < -20) particle.y = height + 20;

			const pulse = 0.52 + Math.sin(time * 0.0015 + particle.phase) * 0.34;
			const alpha = Math.max(0.08, particle.alpha * pulse);
			const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 8);

			glow.addColorStop(0, `rgba(255, 237, 172, ${alpha})`);
			glow.addColorStop(0.36, `rgba(244, 212, 142, ${alpha * 0.34})`);
			glow.addColorStop(1, "rgba(244, 212, 142, 0)");
			context.fillStyle = glow;
			context.beginPath();
			context.arc(particle.x, particle.y, particle.radius * 8, 0, Math.PI * 2);
			context.fill();
		});

		animationFrame = window.requestAnimationFrame(drawFireflies);
	}

	function startFireflies() {
		window.cancelAnimationFrame(animationFrame);
		if (!reducedMotion.matches) {
			animationFrame = window.requestAnimationFrame(drawFireflies);
		}
	}

	prevButton.addEventListener("click", () => turnTo(currentPage - 1));
	nextButton.addEventListener("click", () => turnTo(currentPage + 1));

	dots.forEach((dot) => {
		dot.addEventListener("click", () => {
			turnTo(Number(dot.dataset.pageTarget));
		});
	});

	book.addEventListener("touchstart", (event) => {
		const touch = event.changedTouches[0];
		touchStart = {
			x: touch.clientX,
			y: touch.clientY,
			time: Date.now()
		};
	}, { passive: true });

	book.addEventListener("touchend", (event) => {
		if (!touchStart) return;

		const touch = event.changedTouches[0];
		const dx = touch.clientX - touchStart.x;
		const dy = touch.clientY - touchStart.y;
		const elapsed = Date.now() - touchStart.time;
		touchStart = null;

		if (elapsed < 700 && Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.25) {
			turnTo(dx < 0 ? currentPage + 1 : currentPage - 1);
		}
	}, { passive: true });

	book.addEventListener("click", (event) => {
		const rect = book.getBoundingClientRect();
		const offset = event.clientX - rect.left;

		if (offset > rect.width * 0.68) {
			turnTo(currentPage + 1);
		} else if (offset < rect.width * 0.32) {
			turnTo(currentPage - 1);
		}
	});

	window.addEventListener("keydown", (event) => {
		if (event.target.closest("button")) {
			return;
		}

		if (event.key === "ArrowRight" || event.key === " ") {
			turnTo(currentPage + 1);
		}

		if (event.key === "ArrowLeft") {
			turnTo(currentPage - 1);
		}
	});

	window.addEventListener("resize", () => {
		setAppHeight();
		resizeCanvas();
	}, { passive: true });

	window.addEventListener("orientationchange", () => {
		window.setTimeout(() => {
			setAppHeight();
			resizeCanvas();
		}, 250);
	}, { passive: true });

	if (typeof reducedMotion.addEventListener === "function") {
		reducedMotion.addEventListener("change", startFireflies);
	} else if (typeof reducedMotion.addListener === "function") {
		reducedMotion.addListener(startFireflies);
	}

	setAppHeight();
	resizeCanvas();
	startFireflies();
	updateControls();
}());
