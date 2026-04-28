<!--
  NextProjectScroll.svelte
  ─────────────────────────────────────────────────────────────
  "Next Project" hand-off block. Sits at the natural end of the page
  (no extra scroll runway). Once the user has reached the bottom of
  the document, additional downward wheel input is *captured* and
  converted into a karaoke-style text fill. When the fill reaches
  100%, navigates to the next project.

  Behaviour
  - The block is `height: 100vh` so it always fills the final viewport
    when the page is fully scrolled — visually "everything is locked
    in place" with no whitespace below.
  - Below the page bottom, native scroll cannot go further. We attach
    a `wheel` listener to *capture* downward deltas at that point,
    `preventDefault()` to block any rubber-band, and accumulate them
    into a 0→1 fill progress.
  - Scrolling up past the threshold drains the accumulator, so the
    fill is reversible until the threshold is crossed.

  Usage
  ```svelte
  {#if navigation?.next}
    <NextProjectScroll
      href={`/works/${navigation.next.id}`}
      title={navigation.next.title}
    />
  {/if}
  ```

  Props
  - href             — destination URL (required)
  - title            — name of the next project, rendered as karaoke fill
  - label            — small caption above the title (default "Next Project")
  - hoverLabel       — text for the CustomCursor pill (default "Next Project")
  - completeDistance — px of additional wheel input needed to reach 100%
                       (default 800 — higher = harder to fully fill)
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	type Props = {
		href: string;
		title?: string;
		label?: string;
		hoverLabel?: string;
		completeDistance?: number;
	};

	let {
		href,
		title = '',
		label = 'Next Project',
		hoverLabel = 'Next Project',
		completeDistance = 800
	}: Props = $props();

	let progress = $state(0);
	let triggered = $state(false);

	onMount(() => {
		if (!browser) return;

		let scrollAccum = 0;

		const onWheel = (e: WheelEvent) => {
			if (triggered) return;

			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const atBottom = window.scrollY >= docHeight - 1;

			if (!atBottom) {
				// Not at the page bottom yet — let native scroll run.
				if (scrollAccum > 0) {
					scrollAccum = 0;
					progress = 0;
				}
				return;
			}

			// At bottom — capture additional wheel as fill progress.
			// (Up-deltas drain the accumulator so fill is reversible.)
			e.preventDefault();
			scrollAccum = Math.max(0, Math.min(completeDistance, scrollAccum + e.deltaY));
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

<section
	class="next-project"
	style:--fill-progress="{progress}%"
	data-next-project
>
	<a {href} class="link" data-hover={hoverLabel}>
		<span class="label">{label}</span>
		<span class="title">{title}</span>
	</a>
</section>

<style>
	.next-project {
		--fill-progress: 0%;
		width: 100%;
		/* Full viewport height so when the user reaches the page bottom,
		   the entire block sits locked in place (no whitespace below). */
		height: 100vh;
		display: flex;
		align-items: flex-end;
		padding: 60px var(--padding, 25px);
		box-sizing: border-box;
	}

	.link {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		text-decoration: none;
		text-align: left;
		width: 100%;
	}

	.label {
		font-size: var(--fs-h6, 12px);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
	}

	.title {
		font-size: clamp(40px, 8vw, 120px);
		font-weight: 320;
		line-height: 1;
		max-width: 100%;
		word-break: break-word;
		/* karaoke fill — outline drawn by text-stroke, filled portion by
		   a linear-gradient clipped to the text. */
		-webkit-text-stroke: 1px currentColor;
		-webkit-text-fill-color: transparent;
		background-image: linear-gradient(
			to right,
			currentColor 0%,
			currentColor var(--fill-progress, 0%),
			transparent var(--fill-progress, 0%),
			transparent 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
	}
</style>
