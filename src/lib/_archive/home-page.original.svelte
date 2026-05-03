<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ShuffleText from '$lib/components/ShuffleText.svelte';
	import HorizontalGallery from '$lib/components/HorizontalGallery.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showContent = $state(false);
	let revealStep = $state(0); // 0: hidden, 1: "We bring…", 2: also "Welcome:)", 3: show gallery
	let works = $derived(data.works || []);

	// Hero copy / Japanese subtitle come from microCMS `pages`. Hardcoded
	// fallbacks keep the page rendering even if the CMS is unreachable
	// (server load returns page: null on error).
	const FALLBACK_HERO_COPY =
		"We bring an inventive<br>perspective to every project<br>with our ideas and passion.";
	const FALLBACK_HERO_SUBTITLE =
		'時代に流されることのない普遍性と、<br class="sp">未来を切り拓く革新性が共存する<br>ヴィジュアルコミュニケーションを、<br class="sp">創造し続けます。';

	let heroText = $derived(data.page?.hero_copy?.trim() || FALLBACK_HERO_COPY);
	let heroSubtitle = $derived(data.page?.hero_subtitle?.trim() || FALLBACK_HERO_SUBTITLE);

	// Map microCMS works → HorizontalGallery's item shape.
	let galleryItems = $derived(
		works
			.filter((w) => w.thumbnail?.url)
			.map((w) => ({ id: w.id, src: w.thumbnail!.url, alt: w.title }))
	);

	onMount(() => {
		if (!browser) return;

		// Toggle a body class while the reveal sequence is running so the
		// global Header can be hidden via CSS. Otherwise navigating *to*
		// home from another page leaves the Header faded-in (by the layout's
		// afterNavigate) for ~300 ms before the white overlay covers it,
		// reading as a flicker. Cleared once revealStep === 3.
		document.body.classList.add('reveal-pending');

		const timeoutIds: ReturnType<typeof setTimeout>[] = [];

		timeoutIds.push(
			setTimeout(() => {
				revealStep = 1;
			}, 300)
		);
		timeoutIds.push(
			setTimeout(() => {
				revealStep = 2;
			}, 2000)
		);
		timeoutIds.push(
			setTimeout(() => {
				revealStep = 3;
				showContent = true;
				document.body.classList.remove('reveal-pending');
			}, 3500)
		);

		return () => {
			timeoutIds.forEach(clearTimeout);
			// Defensive — make sure the class doesn't leak when the user
			// navigates away mid-reveal.
			document.body.classList.remove('reveal-pending');
		};
	});
</script>

<svelte:head>
	<title>Kazuki Kaneko | one inc.</title>
	<meta
		name="description"
		content="時代に流されることのない普遍性と、未来を切り拓く革新性が共存するヴィジュアルコミュニケーションを、創造し続けます。"
	/>
	<meta property="og:title" content="Kazuki Kaneko | one inc." />
	<meta
		property="og:description"
		content="時代に流されることのない普遍性と、未来を切り拓く革新性が共存するヴィジュアルコミュニケーションを、創造し続けます。"
	/>
	<meta name="twitter:title" content="Kazuki Kaneko | one inc." />
	<meta
		name="twitter:description"
		content="時代に流されることのない普遍性と、未来を切り拓く革新性が共存するヴィジュアルコミュニケーションを、創造し続けます。"
	/>
</svelte:head>

<main class="top-page">
	<!-- Reveal Animation: bg fades at step 3; final line stays mounted + visible.
	     After reveal completes, the overlay drops to z-index 1 so it no longer
	     intercepts the Header (z 100) and the shuffle text behaves like the
	     global one on other pages (just sits in normal stacking). -->
	<div class="reveal-overlay" class:revealed={revealStep === 3}>
		<div class="reveal-overlay-bg" class:hidden={revealStep === 3} aria-hidden="true"></div>
		{#if revealStep === 1}
			<div class="reveal-text">
				<ShuffleText text="Welcome:)" />
			</div>
		{/if}

		{#if revealStep === 2 || revealStep === 3}
			<div class="reveal-text">
				<ShuffleText text={heroText} subtitle={heroSubtitle} />
			</div>
		{/if}
	</div>

	{#if showContent}
		<!-- Right-side anchor link to the full Work Archives. Positioned
		     just above the gallery strip so it lives in dead space without
		     fighting the hero shuffle. -->
		<a href="/work" class="archives-link" data-hover="Discover" lang="en">
			Work Archives →
		</a>

		<div class="gallery-wrap">
			<!-- globalWheel: the gallery's Lenis listens to wheel anywhere on the
			     page so the user can drive horizontal scroll from outside the
			     gallery footprint. Component defaults (gap=0, Y-only parallax,
			     no scale/opacity falloff) mirror the gsproductions / nrby ref. -->
			<HorizontalGallery
				items={galleryItems}
				hoverLabel="Discover"
				globalWheel
			/>
		</div>
	{/if}
</main>

<style>
	.top-page {
		position: relative;
		width: 100%;
		min-height: 100vh;
		background: var(--background);
	}

	/* ── Reveal Animation overlay ──
	   During the reveal (steps 1, 2) the overlay sits at z 9999 to fully cover
	   the page (Header + content). Once the reveal lands (step 3) we drop the
	   stacking so the overlay matches the layout of every other page — the
	   shuffle text is no longer pinned above the Header. */
	.reveal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		pointer-events: none;
	}

	.reveal-overlay.revealed {
		z-index: 1;
	}

	.reveal-overlay-bg {
		position: absolute;
		inset: 0;
		background: var(--background);
		z-index: 0;
		transition: opacity 0.6s ease-out;
	}

	.reveal-overlay-bg.hidden {
		opacity: 0;
		pointer-events: none;
	}

	/* No font-size / weight here — let the inner ShuffleText (.text-content.h1)
	   keep the same h1 sizing as the global ShuffleText on other pages. */
	.reveal-text {
		position: relative;
		z-index: 1;
		color: var(--key);
	}

	/* ── Gallery container — anchored to bottom-left (20px / 20px) ── */
	.gallery-wrap {
		position: fixed;
		left: 0;
		bottom: 20px;
		width: 100vw;
		height: 40vh;
	}

	/* "Work Archives →" anchor link aligned to the bottom edge of the hero
	   (shuffle title + Japanese subtitle), positioned on the right.

	   The ShuffleText is `position: fixed; top: var(--shuffle-height);
	   left: var(--padding)` (its default mode), so the hero starts at the
	   shuffle-height offset from the viewport top — NOT at viewport centre.

	   Vertical math:
	     hero top    = var(--shuffle-height)
	     heroHeight  = 3 lines × 1.1 × h1-font-size  (shuffle title)
	                 + 12px                           (subtitle margin-top)
	                 + N lines × 1.725 × 16px         (subtitle; N varies by viewport)
	     hero bottom = var(--shuffle-height) + heroHeight
	   Inline coefficients: 3 × 1.1 = 3.3 ; 2 × 1.725 = 3.45 (desktop) ;
	                        4 × 1.725 = 6.9 (mobile, because <br class="sp">
	                        adds two extra row breaks). */
	.archives-link {
		position: fixed;
		right: var(--padding);
		bottom: auto;
		top: calc(var(--shuffle-height) + var(--h1-font-size) * 3.3 + 12px + 16px * 3.45);
		/* Lift the link by half its own height so its vertical centre sits
		   on the calculated hero-bottom line, instead of its top edge. */
		transform: translateY(-50%);
		z-index: 50;
		font-family: var(--font-en-main, 'Helvetica Neue', Arial, sans-serif);
		font-size: 24px;
		font-weight: var(--font-weight-regular);
		font-variation-settings: 'wght' var(--font-weight-regular);
		letter-spacing: 0.04em;
		color: var(--key);
		text-decoration: none;
		border-bottom: 0;
		padding-bottom: 0;
		transition: opacity 0.2s ease;
	}
	.archives-link:hover {
		opacity: 0.6;
	}

	@media (max-width: 767px) {
		.archives-link {
			font-size: 18px;
			top: calc(var(--shuffle-height) + var(--h1-font-size) * 3.3 + 12px + 16px * 6.9);
		}
	}

	/* The home reveal text is purely decorative — keep it from intercepting
	   pointer events so the Header (z-index 100) underneath stays clickable
	   even after the reveal-overlay (z-index 9999) settles in place. */
	.reveal-text :global(.shuffle-text) {
		pointer-events: none;
	}

	@media (max-width: 767px) {
		/* On mobile the reveal copy anchors top-left so it matches the x-axis
		   alignment used on every other page (/office, /jobs, /contact, /works
		   shuffle text all sit flush at the viewport's left edge on mobile).
		   The global ShuffleText mobile padding-top: 15vh keeps it clear of
		   the Header. */
		.reveal-overlay {
			align-items: flex-start;
			justify-content: flex-start;
		}

		/* Drop the inner reveal-text wrapper's centering so the shuffle child
		   inherits a 0-left position from the overlay's flex-start. */
		.reveal-text {
			width: 100%;
		}
	}
</style>
