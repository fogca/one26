<!--
  NextProjectScroll.svelte
  ─────────────────────────────────────────────────────────────
  Bottom-of-page hand-off block. The user has scrolled to the
  end of the document; additional wheel input is captured (and
  the default scroll behaviour is cancelled) to grow a 100px
  tall accent-color bar from the LEFT edge towards the RIGHT.
  When the bar reaches 100% of the viewport width (= 100vw),
  the next project is loaded.

  The slug page wraps its body in `{#key data.work.id}` so the
  whole page (including this component) is fully re-mounted on
  navigation — that's how all content (images, body, etc.) is
  guaranteed to refresh.

  Props
  - href             — destination URL (required)
  - label            — caption rendered at bottom-right (default "NEXT PROJECT")
  - hoverLabel       — text for the CustomCursor pill (default "Next Project")
  - completeDistance — px of additional wheel input needed to reach 100%
                       (default 800)
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	type Props = {
		href: string;
		label?: string;
		hoverLabel?: string;
		completeDistance?: number;
	};

	let {
		href,
		label = 'Next Project',
		hoverLabel = 'Next Project',
		completeDistance = 2000
	}: Props = $props();

	let progress = $state(0);
	let triggered = $state(false);
	// Visibility flag — the bar is hidden (translated off below the viewport)
	// until the user scrolls within REVEAL_THRESHOLD_PX of the page bottom,
	// at which point it slides up. Keeps the fixed-position element from
	// reading like a permanent footer / header on long pages.
	let atEnd = $state(false);

	// How close to the bottom the user has to get before the bar slides in.
	const REVEAL_THRESHOLD_PX = 120;

	onMount(() => {
		if (!browser) return;

		let scrollAccum = 0;

		const updateAtEnd = () => {
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			atEnd = window.scrollY >= docHeight - REVEAL_THRESHOLD_PX;
		};

		// Sync once on mount in case the page loads already-scrolled (e.g. back
		// button restoring scroll position) and listen for subsequent changes.
		updateAtEnd();
		window.addEventListener('scroll', updateAtEnd, { passive: true });
		window.addEventListener('resize', updateAtEnd);

		const onWheel = (e: WheelEvent) => {
			if (triggered) return;

			// Wheel up: NEVER preventDefault — the user must always be able to
			// scroll back up the page. Drop the accumulator so the bar resets.
			if (e.deltaY < 0) {
				if (scrollAccum > 0) {
					scrollAccum = 0;
					progress = 0;
				}
				return;
			}

			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const atBottom = window.scrollY >= docHeight - 1;

			// Wheel down but not at bottom yet — let native scroll run.
			if (!atBottom) {
				if (scrollAccum > 0) {
					scrollAccum = 0;
					progress = 0;
				}
				return;
			}

			// Wheel down at the page bottom — capture as fill progress.
			e.preventDefault();
			scrollAccum = Math.min(completeDistance, scrollAccum + e.deltaY);
			progress = (scrollAccum / completeDistance) * 100;

			if (progress >= 100 && !triggered) {
				triggered = true;
				goto(href);
			}
		};

		window.addEventListener('wheel', onWheel, { passive: false });

		return () => {
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('scroll', updateAtEnd);
			window.removeEventListener('resize', updateAtEnd);
		};
	});
</script>

<section
	class="np-wrapper"
	class:visible={atEnd}
	style:--fill-progress="{progress}%"
	data-next-project
	aria-hidden={!atEnd}
>
	<!-- 100px-tall accent-color bar that grows L→R as the user scrolls
	     past the page bottom. Reaches 100vw at the same moment fill = 100%
	     (when goto fires). -->
	<div class="np-bar" aria-hidden="true"></div>

	<!-- "NEXT PROJECT" caption pinned to the bottom-right -->
	<a {href} class="link" data-hover={hoverLabel}>{label}</a>
</section>

<style>
	/* Fixed to the viewport bottom so vigorous scroll / elastic overscroll
	   can't reveal whatever sits below it. Hidden (translated below the
	   viewport) until the user scrolls within REVEAL_THRESHOLD_PX of the
	   page bottom — then `.visible` is added and it slides up. The
	   .work-container reserves 100px of bottom padding so nothing critical
	   is ever hidden underneath the bar when it's visible. */
	.np-wrapper {
		--fill-progress: 0%;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100px;
		background: #ffffff;
		z-index: 50;
		overflow: hidden;
		transform: translateY(100%);
		pointer-events: none;
		transition:
			transform 0.55s cubic-bezier(0.76, 0, 0.24, 1),
			opacity 0.35s ease;
		opacity: 0;
		will-change: transform;
	}

	.np-wrapper.visible {
		transform: translateY(0);
		pointer-events: auto;
		opacity: 1;
	}

	.np-bar {
		position: absolute;
		top: auto;
		bottom: 0;
		left: 0;
		height: 10px;
		width: var(--fill-progress, 0%);
		background: var(--key, #100088);
		will-change: width;
	}

	.link {
		position: absolute;
		right: var(--padding, 25px);
		bottom: var(--padding, 25px);
		text-decoration: none;
		font-size: clamp(20px, 3vw, 36px);
		font-weight: var(--font-weight-light);
		font-variation-settings: 'wght' var(--font-weight-light);
		color: var(--key, #100088);
		letter-spacing: 0.01em;
		line-height: 1;
	}
</style>
