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

  2. 3D flip — every 5 s each character flips a full 360° on
     the X axis with a tiny per-char stagger (same trick as
     Header nav links on hover, just driven by an animation).

  Notes
  • The container is `inline-block`, NOT `inline-flex`, because
    flex containers collapse text-only nodes (e.g. the space
    between "one" and "inc."). With inline-block the space char
    span renders as a real space.
-->

<script lang="ts">
	const text = 'one inc.';
	const chars = text.split('');
</script>

<span class="logo" lang="en" aria-label={text}>
	{#each chars as ch, i}
		<span class="char" class:space={ch === ' '} style:--i={i} aria-hidden="true">
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
		/* Per-char stagger via the inline --i custom property — same approach
		   the Header nav uses, just with a fixed cadence. */
		animation: logo-flip 10s cubic-bezier(0.76, 0, 0.24, 1) infinite;
		animation-delay: calc(var(--i, 0) * 0.04s);
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

	/* Hold steady for most of the loop, then complete a single full 360°
	   flip towards the end. The hold gives the eye a break before the
	   motion. Adjust the 85% threshold to make the flip feel snappier or
	   more leisurely. */
	@keyframes logo-flip {
		0%,
		85% {
			transform: rotateX(0deg);
		}
		100% {
			transform: rotateX(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.logo,
		.char {
			animation: none;
		}
	}
</style>
