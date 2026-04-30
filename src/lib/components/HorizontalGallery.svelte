<!--
  HorizontalGallery.svelte
  ─────────────────────────────────────────────────────────────
  Lenis-driven horizontal gallery with center-anchored parallax,
  scale and opacity falloff. Modeled on the gsproductions /
  nrby-ss2025 reference.

  How it works
  - Lenis is initialised in `orientation: 'horizontal'` mode on
    the wrapper, so wheel/trackpad/touch becomes a horizontal scroll.
  - On every scroll tick we compute, for each slide:
      • parallax  = signed distance to viewport center, mapped to ±intensity rem
      • scale     = viewport-entry progress eased by `pow(t, easingPower)`
      • opacity   = same easing curve, separate range
  - Values are written as CSS variables on the slide; CSS reads them
    on the inner `<img>` (so clickable bounds stay flat).

  Usage
  ```svelte
  <HorizontalGallery
    items={works.map(w => ({ id: w.id, src: w.thumbnail.url, alt: w.title }))}
    hoverLabel="Discover"
  />
  ```

  Props
  - items            — array of `{ id, src, alt? }`
  - hoverLabel       — text shown by CustomCursor on hover (default 'Discover')
  - hrefBuilder      — `(item) => string` to build the anchor href
  - intensity        — parallax offset in rem (default 50)
  - scaleMin         — minimum scale at slide edges (default 0.8)
  - opacityMin       — minimum opacity at slide edges (default 0.3)
  - easingPower      — pow(t, n) easing strength for entry (default 4)
  - viewportThreshold — entry calc range as a multiple of viewport (default 1.5)
  - wheelMultiplier  — Lenis wheel sensitivity (default 1)
  - gap              — flex gap between slides (default '2rem')
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Item = {
		id: string;
		src: string;
		alt?: string;
	};

	type Props = {
		items: Item[];
		hoverLabel?: string;
		hrefBuilder?: (item: Item) => string;
		intensity?: number;
		scaleMin?: number;
		opacityMin?: number;
		easingPower?: number;
		viewportThreshold?: number;
		wheelMultiplier?: number;
		gap?: string;
		slideHeight?: string; // image height for all viewports (default 50vh)
		/**
		 * When true, Lenis listens to wheel/touch on the whole window instead
		 * of just this gallery's footprint. Use this when the page should
		 * drive the gallery from anywhere, not only when the pointer is over
		 * the slides. Wheel input from outside and inside the gallery then
		 * runs through exactly the same code path, so the feel is identical
		 * across the whole page.
		 */
		globalWheel?: boolean;
	};

	// Defaults are tuned so multiple slides remain clearly visible across
	// the viewport. The reference's raw values (50 / 0.8 / 0.3 / 1.5) work
	// for very wide viewports but cause the right side of the gallery to
	// fade out too early in normal layouts.
	let {
		items,
		hoverLabel = 'Discover',
		hrefBuilder = (it: Item) => `/works/${it.id}`,
		// Parallax magnitude in rem. Also drives the img's overflow buffer
		// (left/width extra) so transparent edges never appear when scrolling.
		// Set lower (e.g. 1〜2) for a subtler effect; 0 disables parallax.
		intensity = 3,
		// Scale defaults to 1 (no scale) so the layout box never desyncs from
		// the visual size — keeps the gap between slides constant. Set < 1
		// only if you want the edge-shrink effect AND can absorb the visual
		// gap drift it introduces.
		scaleMin = 1,
		opacityMin = 0.7,
		easingPower = 3,
		viewportThreshold = 1,
		wheelMultiplier = 1,
		gap = '5px',
		slideHeight = '40vh',
		globalWheel = false
	}: Props = $props();

	let wrapperEl: HTMLDivElement | null = $state(null);
	let trackEl: HTMLDivElement | null = $state(null);
	let ready = $state(false); // toggles the clipRevealUp50 staggered intro
	// Hoisted to component scope so the exported forwardScroll() helper
	// (callable from outside via bind:this) can reach the same instance.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let lenisInstance: any = $state(null);

	onMount(() => {
		if (!browser || !wrapperEl || !trackEl) return;

		// Trigger the staggered clip reveal on the next frame so the initial
		// inset(40% 0 40% 0) state has time to paint before transitioning.
		requestAnimationFrame(() => {
			ready = true;
		});

		const wrapper = wrapperEl;
		const track = trackEl;

		let rafId: number | null = null;
		let scheduled = false;
		// Set when globalWheel is on — captured so the cleanup can remove it.
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
				const sLeft = r.left;

				// only animate slides currently within (or just adjacent to) the viewport
				if (r.right > 0 && sLeft < cWidth) {
					// signed distance from container center, normalised to ±1
					const distNorm = Math.max(
						-1,
						Math.min(1, (sCenter - cCenter) / (cWidth / 2 + r.width / 2))
					);
					const parallax = -(distNorm * intensity);

					let scale = 1;
					let opacity = 1;
					if (sLeft) {
						const entry =
							1 -
							Math.pow(
								1 -
									Math.max(
										0,
										Math.min(1, (cWidth - sLeft) / (cWidth * viewportThreshold))
									),
								easingPower
							);
						scale = scaleMin + entry * (1 - scaleMin);
						opacity = opacityMin + entry * (1 - opacityMin);
					}

					// Scale toward the viewport center so the visual gap between
					// neighbouring slides stays equal to `gap` regardless of scale.
					// Without this, center-origin scaling shrinks each image toward
					// its own center → the gap appears wider when scale < 1.
					const origin =
						distNorm > 0 ? 'left center' : distNorm < 0 ? 'right center' : 'center center';

					// Direct DOM writes are noticeably cheaper than gsap.set when
					// run for every slide on every scroll frame — GSAP's wrapper
					// re-parses each property and walks its plugin chain. CSS
					// custom properties only need setProperty.
					const s = slide.style;
					s.setProperty('--slide-scale', String(scale));
					s.setProperty('--slide-opacity', String(opacity));
					s.setProperty('--image-x', `${parallax}rem`);
					s.setProperty('--slide-origin', origin);
				}
			});
		};

		const onScroll = () => {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(update);
		};

		// Recompute layout after each image loads:
		//   • slide.width = naturalAspect × slideHeight (px)
		//   • img.width   = slide.width + 2 × intensity (px)  ← strictly larger
		//   • img.left    = −intensity (px)                    ← centred overshoot
		//   • track.paddingRight  → last slide can reach viewport center
		// All sizing is written directly to inline `style` so CSS calc/var
		// evaluation timing can't desync img and slide.
		const slideHeightFraction = parseFloat(slideHeight) / 100;
		// one2026's base.css sets html { font-size: 62.5% } → 1rem = 10px.
		// Computing extra in px keeps JS the single source of truth.
		const extraPx = intensity * 10;

		const recalcLayout = () => {
			const slides = track.querySelectorAll<HTMLElement>('.slide');
			if (slides.length === 0) return;
			const vh = window.innerHeight;
			const vw = window.innerWidth;
			const heightPx = vh * slideHeightFraction;

			slides.forEach((slide) => {
				const img = slide.querySelector<HTMLImageElement>('img');
				if (img && img.naturalWidth && img.naturalHeight) {
					const w = (img.naturalWidth / img.naturalHeight) * heightPx;
					slide.style.width = `${w}px`;
					img.style.width = `${w + extraPx * 2}px`;
					img.style.left = `${-extraPx}px`;
				}
			});

			const last = slides[slides.length - 1];
			if (last.offsetWidth > 0) {
				track.style.paddingRight = `${Math.max(0, vw / 2 - last.offsetWidth / 2)}px`;
			}
			update();
		};

		const onResize = () => {
			recalcLayout();
		};

		// Attach a one-shot load listener to every image so we can re-measure
		// once the natural dimensions are available.
		const imgs = Array.from(track.querySelectorAll<HTMLImageElement>('.slide img'));
		imgs.forEach((img) => {
			if (img.complete) {
				recalcLayout();
			} else {
				img.addEventListener('load', recalcLayout, { once: true });
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		import('@studio-freight/lenis').then((mod: any) => {
			const Lenis = mod.default ?? mod;
			lenisInstance = new Lenis({
				wrapper,
				content: track,
				orientation: 'horizontal',
				// 'both' lets the user scroll horizontally with the trackpad/wheel
				// in EITHER axis — vertical wheel input is converted into
				// horizontal scroll on this gallery.
				gestureOrientation: 'both',
				smoothWheel: true,
				wheelMultiplier,
				touchMultiplier: 2
			});

			lenisInstance.on('scroll', onScroll);

			const raf = (t: number) => {
				lenisInstance?.raf(t);
				rafId = requestAnimationFrame(raf);
			};
			rafId = requestAnimationFrame(raf);

			// First-frame layout pass
			update();
			window.addEventListener('resize', onResize);

			// When globalWheel is on, capture wheel events anywhere on the page
			// and re-dispatch them onto the gallery wrapper. Lenis already has a
			// `wheel` listener attached to wrapper — by re-firing the same event
			// there we go through Lenis's exact internal pipeline (no scrollTo
			// tween, no second smoothing layer), so wheel from inside vs outside
			// the gallery feel identical. Skip if the original event already
			// originated inside the wrapper (Lenis would handle it directly).
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
		/* First slide starts 20px in from the wrapper's left edge. */
		padding-left: 20px;
		will-change: transform;
	}

	.slide {
		--slide-scale: 1;
		--slide-opacity: 1;
		--image-x: 0rem;
		flex-shrink: 0;
		/* The slide width is computed in JS from each image's natural aspect
		   ratio × slideHeight (since the <img> is absolutely positioned, the
		   slide otherwise has no intrinsic width). */
		width: var(--slide-w, 0);
		height: var(--slide-height, 40vh);
		position: relative;
		overflow: hidden;
		text-decoration: none;
		display: block;
	}

	.slide img {
		position: absolute;
		top: 0;
		height: 100%;
		/* width and left are written directly to inline style by JS in
		   recalcLayout() — kept out of CSS so calc/var timing can't make
		   img and slide resolve to the same width on early frames. */
		object-fit: cover;
		display: block;
		transform: translate3d(var(--image-x), 0, 0) scale(var(--slide-scale));
		/* Scale toward the side closer to the viewport center so the visible
		   gap between neighbouring slides stays equal regardless of scale. */
		transform-origin: var(--slide-origin, center center);
		opacity: var(--slide-opacity);
		/* Bottom-up clipReveal: image rises from its bottom edge.
		   inset(top right bottom left) — top: 100% hides everything except
		   the bottom edge, then transitions to inset(0) to reveal upward. */
		-webkit-clip-path: inset(100% 0 0 0);
		clip-path: inset(100% 0 0 0);
		transition:
			-webkit-clip-path 1.25s cubic-bezier(0.165, 0.84, 0.44, 1),
			clip-path 1.25s cubic-bezier(0.165, 0.84, 0.44, 1);
		transition-delay: var(--delay, 0s);
		will-change: transform, opacity, clip-path;
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
	.slide:hover img {
		opacity: var(--slide-opacity);
	}
</style>
