<!--
  Logo@.svelte
  ────────────────────────────────────────────────────────────
  Animated text logo. Reads "one inc." (note the space after
  "one" — required).

  Two continuous animations:

  1. Weight oscillation — font-weight loops between a light and
     a heavy weight. Uses the `font-weight` property (not
     `font-variation-settings`) because CSS only interpolates
     font-weight smoothly across browsers. The font is a
     variable font so intermediate weights render correctly.

  2. Color-flip rotation — ported 1:1 from the office-portfolio
     capture (OTIF/CMS/pjs/one/_src/identity/capture_logo.js v4,
     the motion in 01_logo_rotation_noblur.mp4): hold on the key
     color, flip each char 180° on the X axis with a per-char
     stagger to reveal the opposite-accent back face, hold, flip
     back. Driven by rAF with a steep easeInOutExpo ("hang then
     snap"), not CSS keyframes — CSS can't express the measured
     per-char eased drive.

  Notes
  • The container is `inline-block`, NOT `inline-flex`, because
    flex containers collapse text-only nodes (e.g. the space
    between "one" and "inc."). With inline-block the space char
    span renders as a real space.
-->

<script lang="ts">
	import { onMount } from 'svelte';

	const text = 'one inc.';
	const chars = text.split('');

	// Motion constants — same values as the portfolio capture (v4).
	const ROT_DURATION = 2000; // ms per half-turn
	const STAGGER = 100; // ms delay per char, left to right
	const HOLD = 700; // ms pause on each color
	const EASE_K = 12; // easeInOutExpo steepness — higher = harder hang-then-snap

	let charEls: HTMLElement[] = $state([]);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let disposed = false;
		let raf = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const easeInOutExpo = (t: number) => {
			if (t <= 0) return 0;
			if (t >= 1) return 1;
			return t < 0.5
				? Math.pow(2, EASE_K * t - EASE_K / 2) / 2
				: (2 - Math.pow(2, -EASE_K * t + EASE_K / 2)) / 2;
		};

		const rotateTo = (toDeg: number) =>
			new Promise<void>((resolve) => {
				const els = charEls.filter(Boolean);
				const froms = els.map((el) => {
					const m = /rotateX\(([-\d.]+)deg\)/.exec(el.style.transform || '');
					return m ? parseFloat(m[1]) : 0;
				});
				const start = performance.now();
				const frame = (now: number) => {
					if (disposed) return resolve();
					let allDone = true;
					els.forEach((el, i) => {
						const elapsed = now - start - i * STAGGER;
						if (elapsed < 0) {
							allDone = false;
							return;
						}
						const t = Math.min(elapsed / ROT_DURATION, 1);
						if (t < 1) allDone = false;
						const deg = froms[i] + (toDeg - froms[i]) * easeInOutExpo(t);
						el.style.transform = `rotateX(${deg}deg)`;
					});
					if (!allDone) raf = requestAnimationFrame(frame);
					else resolve();
				};
				raf = requestAnimationFrame(frame);
			});

		const sleep = (ms: number) =>
			new Promise<void>((r) => {
				timer = setTimeout(r, ms);
			});

		(async () => {
			// [hold key] -> [flip to alt] -> [hold alt] -> [flip back] -> repeat.
			while (!disposed) {
				await sleep(HOLD);
				await rotateTo(180);
				if (disposed) break;
				await sleep(HOLD);
				await rotateTo(0);
			}
		})();

		return () => {
			disposed = true;
			cancelAnimationFrame(raf);
			if (timer) clearTimeout(timer);
		};
	});
</script>

<span class="logo" lang="en" aria-label={text}>
	{#each chars as ch, i}
		<span class="char" class:space={ch === ' '} bind:this={charEls[i]} aria-hidden="true">
			<span class="face front">{ch}</span>
			<span class="face back">{ch}</span>
		</span>
	{/each}
</span>

<style>
	.logo {
		display: inline-block;
		font-family: var(--font-en-main, 'Helvetica Neue', Arial, sans-serif);
		font-size: 24px;
		line-height: 1;
		letter-spacing: 0.025em;
		color: inherit;
		/* Base weight pulled from the global token. The animation below
		   overrides this on each keyframe — values are intentionally
		   *outside* the design tokens (lighter than light, heavier than
		   medium) because they're animation extremes, not body weights. */
		font-weight: var(--font-weight-light);
		animation: logo-weight 4.5s ease-in-out infinite;
	}

	/* Make sure none of the nested spans (chars, faces) inherit a different
	   line-height that pushes the back face out of alignment with the front
	   during the 3D flip. */
	.logo * {
		line-height: 1;
	}

	@media (min-width: 768px) {
		.logo {
			font-size: 28px;
		}
	}

	.char {
		position: relative;
		display: inline-block;
		transform-style: preserve-3d;
		/* Rotation is driven by the rAF loop in <script> (inline transform),
		   matching the portfolio capture's eased drive exactly. */
		will-change: transform;
	}

	/* Render the space char as a visible 5px gap. `white-space: pre` is no
	   longer needed because the width is set explicitly. */
	.char.space {
		width: 5px;
	}

	.face {
		display: inline-block;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}

	.face.back {
		position: absolute;
		inset: 0;
		transform: rotateX(180deg);
		/* Opposite accent — kept in sync with --key by Color.svelte, so the
		   flip always reads as blue ⇄ orange whichever color the visit got. */
		color: var(--key-alt, #8d2a00);
	}

	/* Variable-font weight axis loops between thin and thick. font-weight is
	   reliably interpolated by all major browsers; font-variation-settings
	   was not — that's why the previous version looked static. */
	@keyframes logo-weight {
		0%,
		100% {
			font-weight: 220;
		}
		50% {
			font-weight: 680;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.logo {
			animation: none;
		}
	}
</style>
