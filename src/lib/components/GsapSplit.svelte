<!-- src/lib/components/SplitTextReveal.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** スクロールトリガーの開始位置 */
		start?: string;
		/** スクロールトリガーの終了位置 */
		end?: string;
		/** 行ごとの遅延 */
		stagger?: number;
		/** Y方向の移動量（%） */
		yPercent?: number;
		/** デバッグ用マーカー表示 */
		markers?: boolean;
		/** 追加のclass */
		class?: string;
	}

	let {
		children,
		start = 'clamp(top center)',
		end = 'clamp(bottom center)',
		stagger = 0.1,
		yPercent = 120,
		markers = false,
		class: className = ''
	}: Props = $props();

	let container: HTMLElement;
	let textElement: HTMLElement;
	let isReady = $state(false);

	onMount(() => {
		let scrollTrigger: ScrollTrigger | null = null;
		let splitInstance: SplitText | null = null;

		const init = async () => {
			const gsapModule = await import('gsap');
			const { SplitText } = await import('gsap/SplitText');
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');

			const gsap = gsapModule.default;
			gsap.registerPlugin(SplitText, ScrollTrigger);

			// フォント読み込み待機
			await document.fonts.ready;

			isReady = true;

			splitInstance = SplitText.create(textElement, {
				type: 'words,lines',
				mask: 'lines',
				linesClass: 'line',
				autoSplit: true,
				onSplit: (instance) => {
					const tween = gsap.from(instance.lines, {
						yPercent,
						stagger,
						scrollTrigger: {
							trigger: container,
							markers,
							scrub: true,
							start,
							end
						}
					});

					// ScrollTriggerインスタンスを保存
					scrollTrigger = tween.scrollTrigger as ScrollTrigger;

					return tween;
				}
			});
		};

		init();

		return () => {
			scrollTrigger?.kill();
			splitInstance?.revert();
		};
	});
</script>

<div bind:this={container} class="split-container {className}">
	<div bind:this={textElement} class="split" class:is-ready={isReady}>
		{@render children()}
	</div>
</div>

<style>
	.split-container {
		overflow: hidden;
	}

	.split {
		opacity: 0;
	}

	.split.is-ready {
		opacity: 1;
	}
</style>