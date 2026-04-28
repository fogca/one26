<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import gsap from 'gsap';

	type Props = {
		dotSize?: number;
		color?: string;
		textColor?: string;
		follow?: number;
		pillHeight?: number;
		pillSize?: number;
	};

	let {
		dotSize = 6,
		color = '#000000',
		textColor = '#ffffff',
		follow = 0.4,
		pillHeight = 28,
		pillSize = 11
	}: Props = $props();

	let rootEl: HTMLDivElement | null = $state(null);
	let labelEl: HTMLSpanElement | null = $state(null);

	onMount(() => {
		if (!browser || !rootEl || !labelEl) return;

		// Hide on touch-only devices
		if (window.matchMedia('(pointer: coarse)').matches) {
			rootEl.style.display = 'none';
			return;
		}

		const root = rootEl;
		const label = labelEl;

		// Park offscreen until first real mousemove
		gsap.set(root, { x: -100, y: -100 });

		const xTo = gsap.quickTo(root, 'x', { duration: follow, ease: 'power3.out' });
		const yTo = gsap.quickTo(root, 'y', { duration: follow, ease: 'power3.out' });

		let currentTarget: Element | null = null;

		// Measure label width (in label's actual computed font) so the bubble
		// stretches to exactly fit the text + horizontal padding.
		const measure = (text: string): number => {
			const cs = window.getComputedStyle(label);
			const tmp = document.createElement('span');
			tmp.textContent = text;
			tmp.style.cssText = [
				'position:absolute',
				'visibility:hidden',
				'white-space:nowrap',
				`font-family:${cs.fontFamily}`,
				`font-size:${cs.fontSize}`,
				`font-weight:${cs.fontWeight}`,
				`letter-spacing:${cs.letterSpacing}`
			].join(';');
			document.body.appendChild(tmp);
			const w = tmp.offsetWidth;
			document.body.removeChild(tmp);
			return w;
		};

		const onMove = (e: MouseEvent) => {
			xTo(e.clientX);
			yTo(e.clientY);
		};

		const onOver = (e: PointerEvent) => {
			const t = (e.target as Element | null)?.closest?.('[data-hover]') ?? null;
			if (!t || t === currentTarget) return;
			currentTarget = t;
			const txt = t.getAttribute('data-hover') ?? '';
			label.textContent = txt;
			if (txt) {
				const w = measure(txt) + 24; // 12px horizontal padding × 2
				root.style.setProperty('--bubble-width', `${w}px`);
			}
			root.classList.add('is-hover');
		};

		const onOut = (e: PointerEvent) => {
			const t = (e.target as Element | null)?.closest?.('[data-hover]');
			if (!t) return;
			const r = (e.relatedTarget as Element | null)?.closest?.('[data-hover]');
			if (r === t) return;
			currentTarget = null;
			root.classList.remove('is-hover');
		};

		document.addEventListener('mousemove', onMove);
		document.addEventListener('pointerover', onOver);
		document.addEventListener('pointerout', onOut);

		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('pointerover', onOver);
			document.removeEventListener('pointerout', onOut);
		};
	});
</script>

<div
	class="cursor"
	bind:this={rootEl}
	aria-hidden="true"
	style:--dot-size="{dotSize}px"
	style:--cursor-color={color}
	style:--cursor-text={textColor}
	style:--pill-height="{pillHeight}px"
	style:--pill-size="{pillSize}px"
>
	<div class="bubble">
		<span class="label" bind:this={labelEl}></span>
	</div>
</div>

<style>
	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		pointer-events: none;
		will-change: transform;
	}

	/* The bubble is dot AND pill in one element — it stretches between them */
	.bubble {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--dot-size);
		height: var(--dot-size);
		background: var(--cursor-color);
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		/* Resting offset: tip of native arrow cursor (upper-left) */
		transform: translate(calc(-50% - 4px), calc(-50% - 4px));
		will-change: width, height, transform;
		transition:
			width 0.4s cubic-bezier(0.76, 0, 0.24, 1),
			height 0.4s cubic-bezier(0.76, 0, 0.24, 1),
			transform 0.4s cubic-bezier(0.76, 0, 0.24, 1);
	}

	.label {
		color: var(--cursor-text);
		font-size: var(--pill-size);
		line-height: 1;
		font-weight: 400;
		font-family: inherit;
		letter-spacing: 0.02em;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0.76, 0, 0.24, 1);
	}

	/* Hover state — bubble stretches to fit label width, recenters on cursor */
	:global(.cursor.is-hover) .bubble {
		width: var(--bubble-width, 100px);
		height: var(--pill-height);
		transform: translate(-50%, -50%);
	}

	:global(.cursor.is-hover) .label {
		opacity: 1;
		/* Slight delay so the label fades in once the bubble has room */
		transition: opacity 0.3s cubic-bezier(0.76, 0, 0.24, 1) 0.15s;
	}
</style>
