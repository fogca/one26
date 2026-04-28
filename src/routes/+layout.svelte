<script lang="ts">
	import { page } from '$app/stores';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import gsap from 'gsap';
	import { CustomEase } from 'gsap/CustomEase';
	import favicon from '$lib/assets/favicon.png';
	import Color from '$lib/components/Color.svelte';
	import CustomCursor from '$lib/components/CustomCursor.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ShuffleText from '$lib/components/ShuffleText.svelte';

	gsap.registerPlugin(CustomEase);
	if (!CustomEase.get('panelSilk')) CustomEase.create('panelSilk', 'M0,0 C0.76,0 0.24,1 1,1');
	if (!CustomEase.get('contentFade'))
		CustomEase.create('contentFade', 'M0,0 C0.22,1 0.36,1 1,1');

	// Nav order for directional page transitions (klsr-style left/right slide).
	// Pages later in this array slide IN from the left when entered (right-direction motion);
	// earlier pages slide IN from the right (left-direction motion).
	const NAV_ORDER = ['/', '/works', '/office', '/contact'];

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
	let lastDirection: 'left' | 'right' = 'right';

	// ── Outgoing animation: shrink + darken + panel slide-in (direction-aware) ──
	onNavigate((navigation) => {
		if (!navigation.from) return;
		if (navigation.from.url.pathname === navigation.to?.url.pathname) return;

		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		if (prefersReducedMotion) return;

		needsEntryAnim = true;

		// Determine motion direction based on nav order
		const fromIdx = NAV_ORDER.indexOf(navigation.from.url.pathname);
		const toIdx = NAV_ORDER.indexOf(navigation.to?.url.pathname ?? '');
		const direction: 'left' | 'right' =
			fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx ? 'left' : 'right';
		lastDirection = direction;

		// Lock the shrink to the visible-viewport rectangle (not the full page).
		// 1) transformOrigin = viewport center in element-local coords
		// 2) clip-path = inset(top, 0, bottom, 0) to mask off everything above/below
		//    the current viewport so the wrapper visually behaves like a viewport-sized
		//    panel. Browser clips natively (works for images/videos without any
		//    slicing/snapshotting).
		const wrapper = document.querySelector<HTMLElement>('.page-wrapper');
		if (wrapper) {
			const rect = wrapper.getBoundingClientRect();
			const vh = window.innerHeight;
			const originY = vh / 2 - rect.top;
			const topInset = Math.max(0, -rect.top); // hidden above viewport
			const bottomInset = Math.max(0, rect.height - topInset - vh); // hidden below viewport
			gsap.set(wrapper, {
				transformOrigin: `50% ${originY}px`,
				clipPath: `inset(${topInset}px 0px ${bottomInset}px 0px)`
			});
		}

		// Pre-position the panel offstage based on direction.
		// NAV_ORDER is left→right: ['/', '/works', '/office', '/contact'].
		// 'right' direction (forward — moving toward a page on the right):
		//     panel slides IN from the RIGHT (the side the next page is on).
		// 'left'  direction (back — moving toward a page on the left):
		//     panel slides IN from the LEFT.
		gsap.set('.transition-panel', {
			x: direction === 'right' ? '100%' : '-100%'
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
					duration: PANEL_DURATION,
					ease: 'panelSilk'
				},
				OUT_DURATION * PANEL_DELAY_RATIO
			);
		});
	});

	// ── Incoming animation: new page fades in over the panel ──
	afterNavigate(() => {
		if (!needsEntryAnim) return;
		needsEntryAnim = false;

		const pathname = $page.url.pathname;
		const newConfig = getPageText(pathname);
		const showShuffle = showGlobalShuffle(pathname);
		// Panel exits to the OPPOSITE side of where it entered, so the wipe
		// continues its motion (right-incoming → exits left, vice versa).
		const panelExitX = lastDirection === 'right' ? '-100%' : '100%';

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
				gsap.set('.transition-panel', {
					x: lastDirection === 'right' ? '100%' : '-100%'
				});
			}
		});

		// 1) Brief hold, then panel slides OUT (continuing the wipe motion)
		tl.to(
			'.transition-panel',
			{
				x: panelExitX,
				duration: PANEL_DURATION,
				ease: 'panelSilk'
			},
			0.15
		);

		// 2) Header & content fade in AFTER the panel is mostly out
		//    (shuffle has been running since before the panel started moving)
		tl.to(
			['header', '.page-content'],
			{
				opacity: 1,
				duration: FADE_IN_DURATION,
				ease: 'contentFade',
				stagger: 0.08
			},
			'+=0.3'
		);
	});

	// works/[slug] uses its own in-page ShuffleText; hide global one there
	function showGlobalShuffle(pathname: string): boolean {
		if (pathname === '/') return false;
		if (
			pathname.startsWith('/works/') &&
			pathname !== '/works' &&
			pathname !== '/works/list'
		)
			return false;
		return true;
	}

	// 現在のページに応じたbodyクラス
	$effect(() => {
		const pathname = $page.url.pathname;
		const body = document.body;

		body.classList.remove(
			'page-home',
			'page-works',
			'page-office',
			'page-works-detail',
			'page-contact'
		);

		if (pathname === '/') {
			body.classList.add('page-home');
		} else if (pathname === '/works') {
			body.classList.add('page-works');
		} else if (pathname === '/office') {
			body.classList.add('page-office');
		} else if (pathname === '/contact') {
			body.classList.add('page-contact');
		} else if (pathname.startsWith('/works/')) {
			body.classList.add('page-works-detail');
		}
	});

	// ページごとのテキスト定義
	function getPageText(pathname: string): { text: string; enableHover: boolean } {
		if (pathname === '/') {
			return { text: '', enableHover: true };
		} else if (pathname === '/works/list') {
			return { text: 'Work<br>Archives / List', enableHover: false };
		} else if (pathname === '/works') {
			return { text: 'Work<br>Archives', enableHover: false };
		} else if (pathname === '/office') {
			return { text: 'Studio &<br>Recruitment', enableHover: false };
		} else if (pathname === '/contact') {
			return {
				text: "get in touch<br>and let's make<br>something fun together",
				enableHover: false
			};
		} else if (pathname.startsWith('/works/')) {
			return { text: '', enableHover: false };
		}
		return { text: '', enableHover: false };
	}

	// Shuffle reveal is now driven entirely by afterNavigate (fade-in onComplete)
	// so it fires once the page is solidly visible — eliminates the inconsistent
	// "didn't see the shuffle" cases that happened when the trigger ran during
	// the early/invisible part of the fade-in.
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="../css/base.css?var=1.00" />
	<link rel="stylesheet" href="../css/rendering.css?var=1.00" />
	<link rel="stylesheet" href="https://use.typekit.net/iqk5bse.css" />
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
			/>
		{/if}

		<div class="page-content">
			{@render children()}

			<!-- Footer is hidden on Home and on slug pages — slug pages render
			     their own NextProjectScroll hand-off instead. -->
			{#if $page.route.id !== '/' && $page.route.id !== '/works/[slug]'}
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
		font-weight: 300;
	}

	/* The "behind" color exposed during scale-down — accent color */
	.transition-bg {
		background: var(--key, #100088);
		min-height: 100vh;
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
		will-change: transform;
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
