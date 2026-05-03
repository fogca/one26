<script lang="ts">
	import { page } from '$app/stores';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import gsap from 'gsap';
	import { CustomEase } from 'gsap/CustomEase';
	import favicon from '$lib/assets/favicon.png';
	import ogpImage from '$lib/assets/ogp.png';
	import Color from '$lib/components/Color.svelte';
	import CustomCursor from '$lib/components/CustomCursor.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ShuffleText from '$lib/components/ShuffleText.svelte';
	import { reloadFontPlus } from '$lib/js/fontplus';

	gsap.registerPlugin(CustomEase);
	if (!CustomEase.get('panelSilk')) CustomEase.create('panelSilk', 'M0,0 C0.76,0 0.24,1 1,1');
	if (!CustomEase.get('contentFade'))
		CustomEase.create('contentFade', 'M0,0 C0.22,1 0.36,1 1,1');

	// Nav order for directional page transitions (klsr-style left/right slide).
	// Pages later in this array slide IN from the left when entered (right-direction motion);
	// earlier pages slide IN from the right (left-direction motion).
	const NAV_ORDER = ['/', '/work', '/about', '/jobs', '/contact'];

	// ── Stock-aligned timing (mirrors Stock/animation/PageTransition.svelte) ──
	const OUT_DURATION = 1.0;            // s — base duration for shrink + darken
	const FADE_IN_DURATION = 0.9;        // s — incoming page fade in over panel
	const PAGE_SCALE = 0.85;
	const DARKEN_OPACITY = 0.35;
	const DARKEN_DELAY_RATIO = 0.25;
	const DARKEN_DURATION_RATIO = 0.75;
	const PANEL_DELAY_RATIO = 0.45;
	const PANEL_DURATION = 0.95;         // s — panel slide-in duration (silky)

	let { children } = $props();

	let shuffleTextComponent: ShuffleText;
	let needsEntryAnim = false;
	let lastDirection: 'left' | 'right' | 'up' = 'right';

	// Panel offstage position for a given direction. Used both as the
	// pre-navigation start state and as the post-navigation reset state.
	function panelOffstage(dir: 'left' | 'right' | 'up'): { x: string; y: string } {
		if (dir === 'up') return { x: '0%', y: '100%' };
		return { x: dir === 'right' ? '100%' : '-100%', y: '0%' };
	}

	// Panel exit (continuing the wipe past the viewport, opposite side).
	function panelExit(dir: 'left' | 'right' | 'up'): { x: string; y: string } {
		if (dir === 'up') return { x: '0%', y: '-100%' };
		return { x: dir === 'right' ? '-100%' : '100%', y: '0%' };
	}

	// True when the path is a /work/[slug] detail page (not /work itself
	// nor /work/list). Used both for "going INTO a slug" (up direction) and
	// "leaving a slug" (also up direction — slug is conceptually a deeper
	// layer, so escaping it always rises).
	function isSlugPath(pathname: string | undefined | null): boolean {
		if (!pathname) return false;
		return (
			pathname.startsWith('/work/') &&
			pathname !== '/work' &&
			pathname !== '/work/list'
		);
	}

	// Panel color matches the DESTINATION page's background, so the panel
	// slides in IN the new page's color rather than flashing white → black/blue
	// on reveal. Pages keep their own page-bg via body.page-* classes.
	function panelColorFor(pathname: string | undefined | null): string {
		if (!pathname) return '#ffffff';
		if (pathname === '/contact') return 'var(--key, #100088)';
		if (pathname === '/jobs') return '#000000';
		return '#ffffff';
	}

	// ── Outgoing animation: shrink + darken + panel slide-in (direction-aware) ──
	onNavigate((navigation) => {
		if (!navigation.from) return;
		if (navigation.from.url.pathname === navigation.to?.url.pathname) return;

		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		if (prefersReducedMotion) return;

		needsEntryAnim = true;

		// Defensive: wipe any inline state left on .page-wrapper / header /
		// .page-content by a previous incomplete cycle. Without this, residual
		// transforms or filters can keep the layer composited and swallow the
		// first wheel/touch event on the new page.
		gsap.set(['.page-wrapper', 'header', '.page-content'], { clearProps: 'all' });

		// Determine motion direction.
		//   • Going INTO a slug page (/works/[slug]) → always UP, regardless
		//     of where the user came from.
		//   • Going OUT of a slug page → also UP. The slug pages are a
		//     conceptually deeper layer, so escaping them always rises
		//     (slug→slug stays up too via the rule above).
		//   • Otherwise → left/right based on NAV_ORDER position.
		const toPath = navigation.to?.url.pathname ?? '';
		const fromPath = navigation.from.url.pathname;
		const fromIdx = NAV_ORDER.indexOf(fromPath);
		const toIdx = NAV_ORDER.indexOf(toPath);
		const direction: 'left' | 'right' | 'up' =
			isSlugPath(toPath) || isSlugPath(fromPath)
				? 'up'
				: fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx
					? 'left'
					: 'right';
		lastDirection = direction;

		// Lock the shrink to the visible-viewport rectangle (not the full page).
		// 1) transformOrigin = viewport center in element-local coords
		// 2) clip-path = inset(top, 0, bottom, 0) to mask off everything above/below
		//    the current viewport so the wrapper visually behaves like a viewport-sized
		//    panel. Browser clips natively (works for images/videos without any
		//    slicing/snapshotting).
		//
		// Rounding everything to integer pixels avoids a subtle bug where
		// browsers report subpixel scroll positions (e.g. rect.top = -0.5px).
		// Even fractional drift in the origin makes the shrink feel "off-center",
		// which on tall pages (e.g. /works archives) reads as the source page
		// floating slightly DOWN during the scale. Integer values keep the
		// origin glued to the viewport's true vertical centre.
		const wrapper = document.querySelector<HTMLElement>('.page-wrapper');
		if (wrapper) {
			const rect = wrapper.getBoundingClientRect();
			const vh = Math.round(window.innerHeight);
			const rectTop = Math.round(rect.top);
			const rectHeight = Math.round(rect.height);
			const originY = Math.round(vh / 2 - rectTop);
			const topInset = Math.max(0, -rectTop); // hidden above viewport
			const bottomInset = Math.max(0, rectHeight - topInset - vh); // hidden below viewport
			gsap.set(wrapper, {
				transformOrigin: `50% ${originY}px`,
				clipPath: `inset(${topInset}px 0px ${bottomInset}px 0px)`
			});
		}

		// Panel always starts WHITE. After it slides in to cover the screen,
		// we tween its background to the destination page's color so the
		// transition fades smoothly from white → new-page-color while the
		// panel still covers the viewport.
		gsap.set('.transition-panel', {
			...panelOffstage(direction),
			backgroundColor: '#ffffff'
		});

		return new Promise<void>((resolve) => {
			const tl = gsap.timeline({
				onComplete: () => {
					// Reset page-wrapper transforms before new page mounts. We keep
					// page-wrapper at opacity 1 (panel still covers visually) so the
					// ShuffleText can play during the panel slide-out in afterNavigate;
					// individual header/content opacity is what gates their reveal now.
					gsap.set('.page-wrapper', {
						scale: 1,
						zIndex: 1100,
						transformOrigin: 'center center',
						clipPath: 'none'
					});
					resolve();
				}
			});

			// Shrink the current page in place
			tl.to(
				'.page-wrapper',
				{
					scale: PAGE_SCALE,
					duration: OUT_DURATION,
					ease: 'power2.inOut'
				},
				0
			);

			// Darken overlay (neutral gray darken — not a tint of the accent color)
			tl.to(
				'.darken-overlay',
				{
					opacity: DARKEN_OPACITY,
					duration: OUT_DURATION * DARKEN_DURATION_RATIO,
					ease: 'power2.inOut'
				},
				OUT_DURATION * DARKEN_DELAY_RATIO
			);

			// White panel slides IN from `direction`-aware offstage to cover the screen
			tl.to(
				'.transition-panel',
				{
					x: '0%',
					y: '0%',
					duration: PANEL_DURATION,
					ease: 'panelSilk'
				},
				OUT_DURATION * PANEL_DELAY_RATIO
			);

			// Once the white panel has fully covered the screen, fade its
			// background to the destination page's color. This creates the
			// "white pane → fades into the next page's color" handoff before
			// the panel slides out and reveals the new content.
			const destColor = panelColorFor(toPath);
			if (destColor !== '#ffffff') {
				tl.to(
					'.transition-panel',
					{
						backgroundColor: destColor,
						duration: 0.5,
						ease: 'power2.inOut'
					},
					'>'
				);
			}
		});
	});

	// ── Incoming animation: new page fades in over the panel ──
	afterNavigate(() => {
		if (!needsEntryAnim) return;
		needsEntryAnim = false;

		const pathname = $page.url.pathname;
		const newConfig = getPageText(pathname);
		const showShuffle = showGlobalShuffle(pathname);
		const isHome = pathname === '/';
		// Panel exits to the OPPOSITE side of where it entered, so the wipe
		// continues its motion. Up-direction (slug nav) exits upward.
		const exit = panelExit(lastDirection);

		// Page-wrapper stays visible. Header & content are individually hidden
		// so the ShuffleText reveal can play first; they fade in afterwards.
		gsap.set('.page-wrapper', {
			opacity: 1,
			scale: 1,
			filter: 'brightness(1)'
		});
		gsap.set('.darken-overlay', { opacity: 0 });
		gsap.set('header', { opacity: 0 });
		gsap.set('.page-content', { opacity: 0 });

		// Going to home: keep the Header hidden through the entire reveal
		// sequence (≈3.5 s). Adding the class HERE — before the panel
		// slides off — means the Header never gets a chance to flash
		// visible while home/+page.svelte's onMount is still spinning up.
		// The class is removed by home/+page.svelte at revealStep === 3.
		if (isHome) {
			document.body.classList.add('reveal-pending');
		}

		// IMMEDIATELY wipe the previous page's title from the shuffle's active
		// span so when the panel later slides off, the user doesn't see the
		// OLD title flash for a frame before the new shuffle kicks in. The
		// panel still covers the viewport at this point, so the wipe itself
		// is invisible. setRandom() also updates the ghost (which reserves
		// width) to the destination text so the box is the right size when
		// the shuffle starts.
		if (showShuffle && shuffleTextComponent && newConfig.text) {
			shuffleTextComponent.setRandom(newConfig.text);
		}

		// Hold the reveal until FontPlus has applied the subset for this page —
		// otherwise the user sees the new copy in the fallback font and watches
		// it swap. The panel covers the screen during this wait so the delay is
		// invisible. Helper has its own ~1.8 s safety cap.
		reloadFontPlus().then(() => {
			// Kick off the shuffle BEFORE the panel slides off so it's already
			// animating by the time the panel reveals it.
			if (showShuffle && shuffleTextComponent && newConfig.text) {
				shuffleTextComponent.shuffleToText(newConfig.text);
			}

			const tl = gsap.timeline({
				onComplete: () => {
					gsap.set('.page-wrapper', { clearProps: 'all' });
					gsap.set('header', { clearProps: 'all' });
					gsap.set('.page-content', { clearProps: 'all' });
					// Reset panel offstage to its entrance side, ready for the next nav
					gsap.set('.transition-panel', panelOffstage(lastDirection));
				}
			});

			// 1) Brief hold, then panel slides OUT (continuing the wipe motion).
			// `exit` carries both x and y so up-direction (slug) exits upward.
			tl.to(
				'.transition-panel',
				{
					x: exit.x,
					y: exit.y,
					duration: PANEL_DURATION,
					ease: 'panelSilk'
				},
				0.15
			);

			// 2) Content (and on non-home pages, the Header) fade in AFTER
			//    the panel is mostly out. On home we skip the Header here —
			//    the reveal-pending class keeps it hidden via CSS until
			//    home's revealStep 3 timer removes the class.
			const fadeTargets = isHome ? ['.page-content'] : ['header', '.page-content'];
			tl.to(
				fadeTargets,
				{
					opacity: 1,
					duration: FADE_IN_DURATION,
					ease: 'contentFade',
					stagger: 0.08
				},
				'+=0.3'
			);
		});
	});

	// /work/[slug] uses its own in-page ShuffleText; hide global one there
	function showGlobalShuffle(pathname: string): boolean {
		if (pathname === '/') return false;
		if (
			pathname.startsWith('/work/') &&
			pathname !== '/work' &&
			pathname !== '/work/list'
		)
			return false;
		return true;
	}

	// 現在のページに応じたbodyクラス。
	// クラス名 (page-works / page-office / page-works-detail) は CSS との
	// 互換性を保つため旧名を維持（layout.svelte 内の :global(body.page-jobs)
	// などのスタイルセレクタを書き換えずに済む）。
	$effect(() => {
		const pathname = $page.url.pathname;
		const body = document.body;

		body.classList.remove(
			'page-home',
			'page-works',
			'page-office',
			'page-jobs',
			'page-works-detail',
			'page-contact'
		);

		if (pathname === '/') {
			body.classList.add('page-home');
		} else if (pathname === '/work') {
			body.classList.add('page-works');
		} else if (pathname === '/about') {
			body.classList.add('page-office');
		} else if (pathname === '/jobs') {
			body.classList.add('page-jobs');
		} else if (pathname === '/contact') {
			body.classList.add('page-contact');
		} else if (pathname.startsWith('/work/')) {
			body.classList.add('page-works-detail');
		}
	});

	// ページごとのテキスト定義
	// `subtitle` is the optional Japanese supporting line rendered below the
	// shuffle title. Leave the field out (or empty) on pages that don't need it.
	function getPageText(pathname: string): {
		text: string;
		enableHover: boolean;
		subtitle?: string;
	} {
		if (pathname === '/') {
			return { text: '', enableHover: true, subtitle: '' };
		} else if (pathname === '/work/list') {
			return { text: 'Work<br>Archives / List', enableHover: false, subtitle: '' };
		} else if (pathname === '/work') {
			return { text: 'Work<br>Archives', enableHover: false, subtitle: '' };
		} else if (pathname === '/about') {
			return { text: 'About<br>one inc.', enableHover: false, subtitle: '' };
		} else if (pathname === '/jobs') {
			return {
				text: "We're growing.<br>Bring your obsessions.",
				enableHover: false,
				subtitle: ''
			};
		} else if (pathname === '/contact') {
			return {
				text: "get in touch<br>and let's make<br>something fun together",
				enableHover: false,
				subtitle: ''
			};
		} else if (pathname.startsWith('/work/')) {
			return { text: '', enableHover: false, subtitle: '' };
		}
		return { text: '', enableHover: false, subtitle: '' };
	}

	// Shuffle reveal is now driven entirely by afterNavigate (fade-in onComplete)
	// so it fires once the page is solidly visible — eliminates the inconsistent
	// "didn't see the shuffle" cases that happened when the trigger ran during
	// the early/invisible part of the fade-in.

	// ── Site-wide canonical / OGP defaults ────────────────────────────────
	// Each `+page.svelte` can still override <title> / og:image / description
	// via its own <svelte:head>. The layout fills in canonical, og:url and a
	// fallback og:image so every route ships with a valid share preview.
	const SITE_ORIGIN = 'https://one.tokyo.jp';
	// Vite hashes the imported asset → resolves to `/_app/immutable/...png` at
	// build time. Prefixing the site origin gives crawlers an absolute URL
	// (Open Graph requires absolute URLs to fetch the preview image).
	const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}${ogpImage}`;

	// `$derived` so canonical / og:url track the current pathname during SPA
	// navigations (svelte:head re-renders, search bots see the right URL).
	let canonicalUrl = $derived(SITE_ORIGIN + $page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="../css/base.css?var=1.03" />
	<link rel="stylesheet" href="../css/rendering.css?var=1.00" />
	<link rel="stylesheet" href="https://use.typekit.net/iqk5bse.css" />

	<!-- Canonical / Open Graph / Twitter — per-route URL, default image.
	     Pages that need a different image override og:image / twitter:image
	     in their own <svelte:head>. -->
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<!-- Picks a random accent color (--key) per page load and updates favicon -->
<Color />

<!-- Modern silky follow cursor with hover-text via data-hover="…" -->
<CustomCursor />

<div class="transition-bg">
	<div class="page-wrapper">
		<Header />

		<!-- ShuffleText - 全ページ共通（Home・works/[slug]以外。slugは自ページで表示） -->
		{#if showGlobalShuffle($page.url.pathname)}
			<ShuffleText
				bind:this={shuffleTextComponent}
				text={getPageText($page.url.pathname).text}
				subtitle={getPageText($page.url.pathname).subtitle ?? ''}
			/>
		{/if}

		<div class="page-content">
			{@render children()}

			<!-- Footer is hidden on Home and on slug pages — slug pages render
			     their own NextProjectScroll hand-off instead. -->
			{#if $page.route.id !== '/' && $page.route.id !== '/work/[slug]'}
				<Footer />
			{/if}
		</div>

		<!-- Darken overlay lives INSIDE page-wrapper so it scales together with
		     the page and never tints the surrounding transition-bg. -->
		<div class="darken-overlay" aria-hidden="true"></div>
	</div>
</div>

<div class="transition-panel" aria-hidden="true"></div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		--page-bg: #ffffff;
		background: var(--page-bg);
		color: var(--key, #100088);
		font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
		font-weight: var(--font-weight-light);
		font-variation-settings: 'wght' var(--font-weight-light);
	}

	/* The "behind" color exposed during scale-down — accent color */
	.transition-bg {
		background: var(--key, #100088);
		min-height: 100vh;
	}

	/* While the home reveal sequence is running, hide the global Header so
	   it doesn't flicker visible-then-covered when the user lands on home
	   from another route. The reveal-pending class is added by the layout's
	   afterNavigate (home destination) AND home/+page.svelte onMount, then
	   removed when revealStep === 3. GSAP set inline opacity during page
	   transitions, so !important is needed until the reveal completes. */
	:global(body.reveal-pending) header {
		opacity: 0 !important;
		transition: opacity 0.4s ease;
		pointer-events: none;
	}

	/* page-wrapper inherits body's --page-bg so it fully covers transition-bg
	   at scale 1, and only the edges expose the accent color during scale-down.
	   NOTE: no will-change here. `will-change: transform` would make this element
	   a containing block, which re-anchors any descendant position:fixed UI
	   (e.g., /works grid-size buttons at viewport bottom) to page-wrapper's box
	   instead of the viewport — pushing them far below the visible area on long
	   pages. GSAP applies will-change during the transition itself. */
	.page-wrapper {
		background: var(--page-bg);
		min-height: 100vh;
		position: relative;
	}

	/* Neutral gray darken overlay — scoped to .page-wrapper so the surrounding
	   transition-bg (accent color) stays at full saturation. */
	.darken-overlay {
		position: absolute;
		inset: 0;
		background: #1a1a1a;
		opacity: 0;
		z-index: 998;
		pointer-events: none;
		will-change: opacity;
	}

	/* White panel that slides in from the direction of travel and covers
	   the screen while the new page fades in on top of it. */
	.transition-panel {
		position: fixed;
		inset: 0;
		background: white;
		transform: translateX(-100%);
		z-index: 1000;
		pointer-events: none;
		/* NO `will-change: transform` here. A permanently-promoted full-viewport
		   compositor layer can intercept the first wheel/touch event after a
		   transition on macOS/iOS Safari, which produced a "first scroll attempt
		   does nothing, second one works" bug. GSAP applies will-change for the
		   duration of each tween automatically — that's enough. */
	}

	/* Jobs page — black background with white text. */
	:global(body.page-jobs) {
		--page-bg: #000000;
		color: #ffffff;
	}
	:global(body.page-jobs header),
	:global(body.page-jobs header a),
	:global(body.page-jobs .shuffle-text),
	:global(body.page-jobs .shuffle-text *) {
		color: #ffffff;
	}
	:global(body.page-jobs footer) {
		background-color: #000000;
		color: #ffffff;
	}
	:global(body.page-jobs footer hr) {
		background-color: #ffffff;
	}
	:global(body.page-jobs footer svg) {
		color: #ffffff;
	}

	/* Contact page — all text (including Header & ShuffleText) goes white,
	   body bg matches the page bg so transitions stay seamless. */
	:global(body.page-contact) {
		--page-bg: var(--key, #100088);
		color: var(--white, #ffffff);
	}
	:global(body.page-contact header),
	:global(body.page-contact header a),
	:global(body.page-contact .shuffle-text),
	:global(body.page-contact .shuffle-text *) {
		color: var(--white, #ffffff);
	}

	/* Footer on contact: invert bg/hr so it sits on the accent color */
	:global(body.page-contact footer) {
		background-color: var(--key, #100088);
		color: var(--white, #ffffff);
	}
	:global(body.page-contact footer hr) {
		background-color: var(--white, #ffffff);
	}
	:global(body.page-contact footer svg) {
		color: var(--white, #ffffff);
	}
</style>
