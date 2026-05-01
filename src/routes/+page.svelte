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
			}, 3500)
		);

		return () => {
			timeoutIds.forEach(clearTimeout);
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
		<div class="gallery-wrap">
			<!-- globalWheel: the gallery's Lenis listens to wheel on the entire
			     window so the user can drive horizontal scroll from anywhere on
			     the page. Wheel inside / outside the gallery now go through
			     exactly the same handler — same feel, same smoothing. -->
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
