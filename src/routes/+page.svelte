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

	// === Experiment Variant ============================================
	// Centered-gallery layout: hero shuffle = 2-line English, gallery is
	// vertically centered (50vh), Japanese subtitle is rendered separately
	// at the bottom-left. Original (3-line, gallery-bottom) layout is
	// preserved at $lib/_archive/home-page.original.svelte.
	// ===================================================================

	// Hardcoded fallbacks. The English copy is intentionally locked to this
	// experiment so the CMS's existing 3-line hero_copy is left untouched
	// (rollback-safe). PC uses 2 lines, mobile uses 3 — different break
	// positions, so we ship two strings and pick at mount.
	const HERO_COPY_PC =
		"We bring an inventive perspective<br>to every project with our ideas and passion.";
	const HERO_COPY_SP =
		"We bring an inventive<br>perspective to every project<br>with our ideas and passion.";
	const FALLBACK_HERO_SUBTITLE =
		'時代に流されることのない普遍性と、<br class="sp">未来を切り拓く革新性が共存する<br>ヴィジュアルコミュニケーションを、<br class="sp">創造し続けます。';

	// matchMedia keeps `isMobile` in sync with viewport changes (e.g. window
	// resize, device rotation). Default false for SSR; corrected in onMount.
	let isMobile = $state(false);
	let heroText = $derived(isMobile ? HERO_COPY_SP : HERO_COPY_PC);
	let heroSubtitle = $derived(data.page?.hero_subtitle?.trim() || FALLBACK_HERO_SUBTITLE);

	// Map microCMS works → HorizontalGallery's item shape.
	let galleryItems = $derived(
		works
			.filter((w) => w.thumbnail?.url)
			.map((w) => ({ id: w.id, src: w.thumbnail!.url, alt: w.title }))
	);

	onMount(() => {
		if (!browser) return;

		// Resolve the SP / PC hero copy switch as soon as we hit the client.
		// reveal step 2 (when the hero ShuffleText mounts) doesn't fire for
		// 2000 ms so isMobile is settled well before then.
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const onMqChange = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};
		mq.addEventListener('change', onMqChange);

		// Toggle a body class while the reveal sequence runs so the global
		// Header can be hidden via CSS during the entrance.
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
			document.body.classList.remove('reveal-pending');
			mq.removeEventListener('change', onMqChange);
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
	<!-- Reveal overlay: bg fades at step 3; the English shuffle stays mounted
	     and visible. After the reveal, overlay z-index drops so it stops
	     intercepting Header / pointer events. -->
	<div class="reveal-overlay" class:revealed={revealStep === 3}>
		<div class="reveal-overlay-bg" class:hidden={revealStep === 3} aria-hidden="true"></div>
		{#if revealStep === 1}
			<div class="reveal-text">
				<ShuffleText text="Welcome:)" />
			</div>
		{/if}

		{#if revealStep === 2 || revealStep === 3}
			<div class="reveal-text">
				<!-- subtitle is NOT passed to ShuffleText in this experiment;
				     the Japanese line is rendered separately at the bottom. -->
				<ShuffleText text={heroText} />
			</div>
		{/if}
	</div>

	{#if showContent}
		<!-- "Work Archives →" sits just above the gallery's top edge on the
		     right. Gallery height = 50vh, centered at 50% → top edge = 25vh. -->
		<a href="/work" class="archives-link" data-hover="Discover" lang="en">
			Work Archives
			<svg
				class="archives-arrow"
				viewBox="0 0 50 93"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M0 7.05L5.82 0C5.82 0 13.5 11.48 24.98 22.96C36.46 34.44 49.54 47.23 49.54 47.23C49.54 47.23 38.83 55.65 26.13 68.35C13.43 81.05 5.66 92.31 5.66 92.31L0.11 84.51L22.93 62.39C32.16 53.16 37.3 46.9 37.3 46.9C37.3 46.9 29.58 36.82 20.63 27.88L0 7.05Z"
				/>
			</svg>
		</a>

		<div class="gallery-wrap">
			<HorizontalGallery
				items={galleryItems}
				hoverLabel="Discover"
				globalWheel
				slideHeight="35vh"
				entryClip={10}
				endHref="/work"
				endDwellMs={150}
			/>
		</div>

		<!-- Japanese subtitle, anchored bottom-left, independent of the
		     ShuffleText component. -->
		<p class="hero-subtitle-bottom" lang="ja">{@html heroSubtitle}</p>
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
	   Steps 1, 2: overlay covers Header + content (z 9999).
	   Step 3:    overlay drops to z 1; pointer-events stay none. */
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

	.reveal-text {
		position: relative;
		z-index: 1;
		color: var(--key);
	}

	/* ── Centered gallery ──
	   35vh tall, centred at 55vh (top: 55vh + translateY(-50%)).
	   Real bounds: 37.5vh → 72.5vh. */
	.gallery-wrap {
		position: fixed;
		left: 0;
		top: 55vh;
		transform: translateY(-50%);
		width: 100vw;
		height: 35vh;
	}

	/* ── Japanese subtitle, bottom-left ── */
	.hero-subtitle-bottom {
		position: fixed;
		left: var(--padding);
		bottom: var(--padding);
		margin: 0;
		max-width: 36em;
		font-family: var(--font-jp-main, var(--font-en-main));
		font-size: 16px;
		line-height: 1.725;
		font-weight: var(--font-weight-regular);
		font-variation-settings: 'wght' var(--font-weight-regular);
		letter-spacing: 0.025em;
		color: var(--key);
		z-index: 50;
	}

	/* ── "Work Archives →" anchor link ──
	   Bottom-left, sitting just under the gallery's bottom edge. The gallery
	   spans 37.5vh → 72.5vh (top 55vh, height 35vh, centred via translateY);
	   a ~2vh gap below the 72.5vh edge reads as "right under the image". */
	.archives-link {
		position: fixed;
		left: var(--padding);
		right: auto;
		bottom: auto;
		top: 74.5vh;
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
	.archives-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
	}
	/* Chevron arrow: height matched to the text cap height; width follows the
	   50:93 viewBox ratio. Inherits the link colour via fill: currentColor. */
	.archives-arrow {
		height: 0.7em;
		width: auto;
		flex: none;
	}
	.archives-link:hover {
		opacity: 0.6;
	}

	/* The home reveal text is purely decorative — keep it from intercepting
	   pointer events so the Header (z-index 100) underneath stays clickable
	   even after the reveal-overlay (z-index 9999) settles in place. */
	.reveal-text :global(.shuffle-text) {
		pointer-events: none;
	}

	@media (max-width: 767px) {
		/* On mobile keep the English shuffle anchored top-left; same as
		   every other page's mobile shuffle alignment. */
		.reveal-overlay {
			align-items: flex-start;
			justify-content: flex-start;
		}

		.reveal-text {
			width: 100%;
		}

		.hero-subtitle-bottom {
			font-size: 13px;
			line-height: 1.7;
			max-width: none;
		}

		/* Mobile: same "under the gallery" anchor as PC, scaled down. */
		.archives-link {
			font-size: 16px;
			top: 75vh;
		}
	}
</style>
