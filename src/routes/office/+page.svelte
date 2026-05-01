<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let page = $derived(data.page);

	// Hardcoded fallbacks so the page still renders if the CMS is unreachable.
	const FALLBACK_INTRO_TITLE = 'We opt for a novel experience';
	const FALLBACK_INTRO_BODY =
		'one inc. は、グラフィックやデジタルメディアなど、多岐にわたるヴィジュアルコミュニケーションを軸に活動するクリエイティブスタジオです。私たちは、ブランド構築に関連する様々な領域のサービスを提供し、ヴィジュアルアイデンティティから成るブランドデザインに重きを置いています。';
	const FALLBACK_SERVICES_TITLE = 'Services';
	const FALLBACK_SERVICES_INTRO =
		'私たちは、ブランドの本質を形にするために、戦略的思考とクリエイティブ実践を統合したサービスを提供します。ヴィジュアルアイデンティティの構築から、グラフィック、デジタル、空間までブランド体験のあらゆる接点を一貫した視点で設計します。';

	let introTitle = $derived(page?.about_intro_title?.trim() || FALLBACK_INTRO_TITLE);
	let introBody = $derived(page?.about_intro_body?.trim() || FALLBACK_INTRO_BODY);
	let introBodyEn = $derived(page?.about_intro_body_en?.trim() || '');
	let servicesTitle = $derived(page?.services_title?.trim() || FALLBACK_SERVICES_TITLE);
	let servicesIntro = $derived(page?.services_intro?.trim() || FALLBACK_SERVICES_INTRO);
	let serviceGroups = $derived(page?.service_groups ?? []);

	// Split a textArea (newline-separated) into trimmed non-empty lines.
	function lines(text: string): string[] {
		if (!text) return [];
		return text
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
	}
</script>

<svelte:head>
	<title>About | one inc.</title>
	<meta
		name="description"
		content="one inc. はヴィジュアルコミュニケーションを軸にしたクリエイティブスタジオ。ブランド戦略・アイデンティティ・グラフィック・デジタル領域までを一貫した視点で設計します。"
	/>
	<meta property="og:title" content="About | one inc." />
	<meta
		property="og:description"
		content="one inc. はヴィジュアルコミュニケーションを軸にしたクリエイティブスタジオ。ブランド戦略・アイデンティティ・グラフィック・デジタル領域までを一貫した視点で設計します。"
	/>
	<meta name="twitter:title" content="About | one inc." />
	<meta
		name="twitter:description"
		content="one inc. はヴィジュアルコミュニケーションを軸にしたクリエイティブスタジオ。ブランド戦略・アイデンティティ・グラフィック・デジタル領域までを一貫した視点で設計します。"
	/>
</svelte:head>

<section class="Office">
	<div class="wrapper">
		<h2 class="h2 uppercase mb-20" lang="en">{introTitle}</h2>
		<p class="">{introBody}</p>
		{#if introBodyEn}
			<p lang="en" style="display: none;">{introBodyEn}</p>
		{/if}
	</div>

	<hr class="my-80" />

	<div class="wrapper">
		<h2 class="h0 mb-10" lang="en">{servicesTitle}</h2>
		<p>{servicesIntro}</p>
		<div class="container mt-40">
			{#each serviceGroups as group, i (group.group_title + i)}
				<div class={i === serviceGroups.length - 1 ? 'box' : 'box mb-30'}>
					<h3 class="h3 mb-10 bold" lang="en">{group.group_title}</h3>
					<ul>
						{#each lines(group.group_items) as item}
							<li class="h3">{item}</li>
						{/each}
					</ul>
				</div>
			{/each}
			<style>
				.Office .box h3 {
					font-size: 18px;
				}
				.Office .box ul li {
					font-size: 18px;
				}
			</style>
		</div>
	</div>
</section>

<style>
	.Office {
		padding-top: calc(var(--shuffle-height) + 10px);
	}

	.Office .wrapper,
	.Office hr {
		width: 65%;
		width: 50%;
		margin-left: auto;
		margin-right: 0;
		padding-right: 0;
	}

	.Office hr {
		width: 50%;
		margin-right: 0;
		background-color: var(--key);
		height: 0.5px;
		border: none;
	}

	.Office .wrapper {
		margin-bottom: 0;
	}
	.Office .wrapper:nth-last-of-type(1) {
		margin-bottom: 0;
		padding-bottom: 8rem;
	}

	.Office .wrapper p {
		text-align: justify;
	}
	.Office .wrapper p {
		hyphens: auto;
	}

	@media (max-width: 767px) {
		/* Drop the desktop-only 50% inset on mobile — full bleed */
		.Office .wrapper,
		.Office hr {
			width: 100%;
			margin-left: 0;
			margin-right: 0;
		}

		/* Override .my-80 utility on mobile — tighter spacing + softer line */
		.Office hr.my-80 {
			margin-top: 50px;
			margin-bottom: 50px;
			opacity: 0.3;
		}

		.Office .box ul li {
			font-size: 14px;
			line-height: 1.6;
		}
	}
</style>
