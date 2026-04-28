<script lang="ts" module>
	/**
	 * Accent color system.
	 * On every page load (full reload / fresh visit), one accent color is randomly picked
	 * and applied site-wide via the `--key` CSS variable.
	 *
	 * Anything using `var(--key)` (text, logo, contact bg, favicon) automatically inherits.
	 *
	 * Usage: drop <Color /> at the top of +layout.svelte (above Header).
	 */
	export const ACCENT_COLORS = ['#100088', '#BD3900'] as const;
	export type AccentColor = (typeof ACCENT_COLORS)[number];

	// Orange (#BD3900) is the rare accent — appears roughly 1 in 5 visits
	// (≈ 20%). Blue (#100088) takes the remaining ≈ 80%.
	const ORANGE_PROBABILITY = 0.2;

	export function pickRandomAccent(): AccentColor {
		return Math.random() < ORANGE_PROBABILITY ? '#BD3900' : '#100088';
	}

	/** Build a data: URI favicon SVG with the inner shape painted in the given color. */
	export function buildFaviconDataUri(color: string): string {
		const svg =
			`<svg width="125" height="125" viewBox="0 0 125 125" fill="none" xmlns="http://www.w3.org/2000/svg">` +
			`<rect width="125" height="125" rx="18" fill="white"/>` +
			`<rect x="25" y="25" width="75" height="75" rx="37.5" fill="${color}"/>` +
			`</svg>`;
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const color = pickRandomAccent();

		// 1. Set CSS variable — all var(--key) consumers update instantly
		document.documentElement.style.setProperty('--key', color);

		// 2. Replace favicon with a dynamically-colored SVG
		const href = buildFaviconDataUri(color);
		let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.type = 'image/svg+xml';
		link.href = href;
	});
</script>
