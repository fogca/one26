<!--
  HorizontalGallery.svelte
  ─────────────────────────────────────────────────────────────
  Lenis-driven horizontal gallery, modeled on the gsproductions /
  nrby-ss2025 reference.

  Layout
  - Slides sit in a flex row with `gap` between them. Each slide
    width is computed from its image's natural aspect ratio so the
    pictures all sit at a consistent height.

  Scroll-driven entry animation (clip, NOT scale)
  - As a slide approaches the centre from the right edge, its visible
    area widens from a centred horizontal band up to the full slide.
      • slide centre at right viewport edge → top AND bottom of the
        slide are each clipped by `entryClip` (e.g. 25 %, leaving the
        middle 50 % visible — band centred on the slide's vertical
        midline so the visible area grows OUTWARD from the centre)
      • slide centre at the viewport centre → clip = 0 (full visible)
      • slide centre anywhere left of centre → clip = 0
  - Implemented via `clip-path: inset(...)` on the slide. **The image
    itself is never scaled or distorted** — only the visible window
    onto it changes. Aspect ratio is preserved on every frame.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	type Item = {
		id: string;
		src: string;
		alt?: string;
	};

	type Props = {
		items: Item[];
		hoverLabel?: string;
		hrefBuilder?: (item: Item) => string;
		/**
		 * Percent clipped off both the TOP and BOTTOM when a slide first
		 * enters from the right edge — i.e. the visible band is centred
		 * on the slide's vertical midline. The image grows outward from
		 * the centre as the slide moves toward the viewport centre.
		 *   25 = 25 % top + 25 % bottom hidden → 50 % visible band
		 *   35 = 35 % each → 30 % visible band
		 * Relaxes to 0 by the time the slide centre reaches viewport centre.
		 */
		entryClip?: number;
		easingPower?: number;
		wheelMultiplier?: number;
		gap?: string;
		slideHeight?: string;
		/**
		 * Right-edge padding after the last slide, in CSS units. Default
		 * matches the track's left padding so the strip feels symmetrical.
		 * Pass `0` to let the last slide's right edge align with the
		 * viewport's right edge (useful when paired with `endHref`).
		 */
		endPadding?: string;
		/**
		 * Optional URL to navigate to once the gallery scrolls all the way
		 * to its right edge — i.e. the last slide is fully on screen. The
		 * page lingers for `endDwellMs` so the user actually sees the last
		 * slide before the navigation fires. Set empty to disable.
		 */
		endHref?: string;
		/** Milliseconds to dwell at the scroll end before navigating. */
		endDwellMs?: number;
		/**
		 * When true, Lenis listens to wheel/touch on the whole window instead
		 * of just this gallery's footprint.
		 */
		globalWheel?: boolean;
	};

	let {
		items,
		hoverLabel = 'Discover',
		hrefBuilder = (it: Item) => `/work/${it.id}`,
		entryClip = 25,
		// 1 = linear, fully proportional to scroll position. Higher values
		// (2, 3, …) push most of the clip change into the right edge,
		// which reads as "stays still then suddenly enters" — not what
		// the reference does. Stick with 1 unless you specifically want
		// that snap-on-arrival effect.
		easingPower = 1,
		wheelMultiplier = 1,
		gap = '10px',
		slideHeight = '40vh',
		endPadding = '20px',
		endHref = '',
		endDwellMs = 500,
		globalWheel = false
	}: Props = $props();

	let wrapperEl: HTMLDivElement | null = $state(null);
	let trackEl: HTMLDivElement | null = $state(null);
	let ready = $state(false); // toggles the staggered intro reveal
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let lenisInstance: any = $state(null);

	onMount(() => {
		if (!browser || !wrapperEl || !trackEl) return;

		// Trigger the staggered clip reveal on the next frame so the initial
		// inset(100% 0 0 0) state has time to paint before transitioning.
		requestAnimationFrame(() => {
			ready = true;
		});

		const wrapper = wrapperEl;
		const track = trackEl;

		let rafId: number | null = null;
		let scheduled = false;
		let onGlobalWheel: ((e: WheelEvent) => void) | null = null;

		const update = () => {
			scheduled = false;
			const slides = track.querySelectorAll<HTMLElement>('.slide');
			if (slides.length === 0) return;

			const cRect = wrapper.getBoundingClientRect();
			const cCenter = cRect.left + cRect.width / 2;
			const cWidth = cRect.width;

			slides.forEach((slide) => {
				const r = slide.getBoundingClientRect();
				const sCenter = r.left + r.width / 2;

				// Skip slides outside (or just adjacent to) the viewport.
				if (r.right < 0 || r.left > cWidth) return;

				// Distance from the slide centre to the viewport centre,
				// normalised to ±1 by half-viewport-width.
				// Right of centre  → positive (entering)
				// Left of centre   → negative (already entered)
				const distNorm = Math.max(
					-1,
					Math.min(1, (sCenter - cCenter) / (cWidth / 2))
				);

				// Right-side progress: 1 at the right edge, 0 at centre and
				// everything to the left of centre.
				const t = Math.max(0, distNorm);
				const eased = Math.pow(t, easingPower);
				const clipPct = eased * entryClip;

				// Equal top + bottom inset → the visible band stays vertically
				// CENTERED and grows outward as the slide approaches centre.
				// The image inside is unchanged.
				slide.style.setProperty('--clip-top', `${clipPct}%`);
				slide.style.setProperty('--clip-bottom', `${clipPct}%`);
			});
		};

		const onScroll = () => {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(() => {
				update();
				checkEnd();
			});
		};

		// Recompute layout after each image loads:
		//   • slide.width = naturalAspect × slideHeight (px)
		//   • slide.height = slideHeight (fixed)
		// Image fills slide (width:100% / height:100%) via static CSS — no
		// parallax buffer needed (parallax was removed for being too noisy).
		const slideHeightFraction = parseFloat(slideHeight) / 100;

		const recalcLayout = () => {
			const slides = track.querySelectorAll<HTMLElement>('.slide');
			if (slides.length === 0) return;
			const vh = window.innerHeight;
			const heightPx = vh * slideHeightFraction;

			slides.forEach((slide) => {
				const img = slide.querySelector<HTMLImageElement>('img');
				if (img && img.naturalWidth && img.naturalHeight) {
					const w = (img.naturalWidth / img.naturalHeight) * heightPx;
					slide.style.width = `${w}px`;
				}
			});

			// Right-edge breathing room after the last slide. Pass `endPadding`
			// at instantiation; default 20px matches the track's left padding.
			track.style.paddingRight = endPadding;
			update();
		};

		const onResize = () => {
			recalcLayout();
		};

		const imgs = Array.from(track.querySelectorAll<HTMLImageElement>('.slide img'));
		imgs.forEach((img) => {
			if (img.complete) {
				recalcLayout();
			} else {
				img.addEventListener('load', recalcLayout, { once: true });
			}
		});

		// End-of-gallery auto-navigation. Once Lenis reaches its scroll
		// limit (the last slide is fully visible), we wait `endDwellMs`
		// then navigate. Scrolling back away cancels the timer so the
		// user can browse without firing the nav.
		let endTriggered = false;
		let endTimer: ReturnType<typeof setTimeout> | null = null;

		const checkEnd = () => {
			if (!endHref || endTriggered || !lenisInstance) return;
			const limit = lenisInstance.limit ?? 0;
			const atEnd = limit > 0 && lenisInstance.scroll >= limit - 1;
			if (atEnd) {
				if (endTimer === null) {
					endTimer = setTimeout(() => {
						endTriggered = true;
						goto(endHref);
					}, endDwellMs);
				}
			} else if (endTimer !== null) {
				clearTimeout(endTimer);
				endTimer = null;
			}
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		import('@studio-freight/lenis').then((mod: any) => {
			const Lenis = mod.default ?? mod;
			lenisInstance = new Lenis({
				wrapper,
				content: track,
				orientation: 'horizontal',
				gestureOrientation: 'both',
				smoothWheel: true,
				smoothTouch: true,
				wheelMultiplier,
				touchMultiplier: 2,
				// lerp lower than the 0.1 default → softer interpolation,
				// more inertial feel. 0.07 reads as "buttery" without going
				// so slow that the gallery feels laggy.
				lerp: 0.07,
				// Match Lenis's classic smooth-scroll easing curve. The
				// custom easing is what gives the gallery its drift-out
				// feeling at the end of a wheel gesture.
				easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
			});

			lenisInstance.on('scroll', onScroll);

			const raf = (t: number) => {
				lenisInstance?.raf(t);
				rafId = requestAnimationFrame(raf);
			};
			rafId = requestAnimationFrame(raf);

			update();
			window.addEventListener('resize', onResize);

			if (globalWheel) {
				onGlobalWheel = (e: WheelEvent) => {
					if (wrapper.contains(e.target as Node)) return;
					e.preventDefault();
					wrapper.dispatchEvent(
						new WheelEvent('wheel', {
							deltaX: e.deltaX,
							deltaY: e.deltaY,
							deltaZ: e.deltaZ,
							deltaMode: e.deltaMode,
							bubbles: true,
							cancelable: true
						})
					);
				};
				window.addEventListener('wheel', onGlobalWheel, { passive: false });
			}

		});

		return () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			lenisInstance?.destroy();
			lenisInstance = null;
			window.removeEventListener('resize', onResize);
			if (onGlobalWheel) window.removeEventListener('wheel', onGlobalWheel);
			if (endTimer !== null) clearTimeout(endTimer);
		};
	});
</script>

<div
	class="gallery"
	class:ready
	bind:this={wrapperEl}
	style:--slide-height={slideHeight}
>
	<div class="track" bind:this={trackEl} style:gap>
		{#each items as item, i (item.id)}
			<a
				class="slide"
				href={hrefBuilder(item)}
				data-hover={hoverLabel}
				style:--delay="{i * 0.08}s"
			>
				<img src={item.src} alt={item.alt ?? ''} loading="lazy" />
			</a>
		{/each}
	</div>
</div>

<style>
	.gallery {
		position: relative;
		width: 100%;
		height: 100%;
		/* Lenis (orientation: horizontal) drives the scroll on this wrapper —
		   it needs overflow-x: auto so there is something to scroll. */
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
	}
	.gallery::-webkit-scrollbar {
		display: none;
	}

	.track {
		display: flex;
		height: 100%;
		align-items: center;
		/* Without max-content, flex compresses all children to fit the wrapper
		   width and the gallery never overflows → no scroll, slides overlap. */
		width: max-content;
		padding-left: 20px;
		will-change: transform;
	}

	.slide {
		--clip-top: 0%;
		--clip-bottom: 0%;
		flex-shrink: 0;
		width: var(--slide-w, 0); /* set by JS in recalcLayout */
		height: var(--slide-height, 40vh);
		position: relative;
		overflow: hidden;
		text-decoration: none;
		display: block;
		/* Scroll-driven entry window. JS updates the two custom properties
		   per scroll frame — NO CSS transition here, otherwise a 1+s tween
		   would lag behind every per-frame scroll update. Equal top/bottom
		   keeps the visible band CENTERED on the slide, so the area grows
		   outward from the vertical midline. */
		-webkit-clip-path: inset(var(--clip-top) 0 var(--clip-bottom) 0);
		clip-path: inset(var(--clip-top) 0 var(--clip-bottom) 0);
	}

	.slide img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Staggered intro reveal lives here on the <img>, NOT on .slide.
		   Keeping it on a different element means the intro transition
		   never fights the scroll-driven clip updates above. */
		-webkit-clip-path: inset(100% 0 0 0);
		clip-path: inset(100% 0 0 0);
		transition:
			-webkit-clip-path 1.25s cubic-bezier(0.165, 0.84, 0.44, 1),
			clip-path 1.25s cubic-bezier(0.165, 0.84, 0.44, 1);
		transition-delay: var(--delay, 0s);
		will-change: clip-path;
	}

	.gallery.ready .slide img {
		-webkit-clip-path: inset(0 0 0 0);
		clip-path: inset(0 0 0 0);
	}

	/* Hover affordance is carried by the cursor pill, not by dimming.
	   .slide is an <a> so the global a:hover { opacity: 0.7 } in base.css
	   would dim the whole slide — pin it to 1 here. */
	.slide:hover {
		opacity: 1;
	}
</style>
