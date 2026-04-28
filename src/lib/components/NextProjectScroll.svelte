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

	onMount(() => {
		if (!browser) return;

		let scrollAccum = 0;

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
		};
	});
</script>

<section class="np-wrapper" style:--fill-progress="{progress}%" data-next-project>
	<!-- 100px-tall accent-color bar that grows L→R as the user scrolls
	     past the page bottom. Reaches 100vw at the same moment fill = 100%
	     (when goto fires). -->
	<div class="np-bar" aria-hidden="true"></div>

	<!-- "NEXT PROJECT" caption pinned to the bottom-right -->
	<a {href} class="link" data-hover={hoverLabel}>{label}</a>
</section>

<style>
	.np-wrapper {
		--fill-progress: 0%;
		position: relative;
		width: 100vw;
		height: 100px;
		background: #ffffff;
		z-index: 1;
		overflow: hidden;
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
		font-weight: 320;
		color: var(--key, #100088);
		letter-spacing: 0.01em;
		line-height: 1;
	}
</style>
