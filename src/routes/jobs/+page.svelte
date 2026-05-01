<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let jobs = $derived(data.jobs);

	// Split a textArea value (CMS) into trimmed non-empty lines.
	function lines(text: string): string[] {
		if (!text) return [];
		return text
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
	}
</script>

<svelte:head>
	<title>Jobs | one inc.</title>
	<meta
		name="description"
		content="one inc. はデザイナー・マネージャー職を募集中。ヴィジュアルコミュニケーションを通してブランドの本質を形にするチームに、新しいメンバーをお迎えします。"
	/>
	<meta property="og:title" content="Jobs | one inc." />
	<meta
		property="og:description"
		content="one inc. はデザイナー・マネージャー職を募集中。ヴィジュアルコミュニケーションを通してブランドの本質を形にするチームに、新しいメンバーをお迎えします。"
	/>
	<meta name="twitter:title" content="Jobs | one inc." />
	<meta
		name="twitter:description"
		content="one inc. はデザイナー・マネージャー職を募集中。ヴィジュアルコミュニケーションを通してブランドの本質を形にするチームに、新しいメンバーをお迎えします。"
	/>
</svelte:head>

<section class="Jobs">
	<div class="wrapper">
		<p>
			現在私たちは事業拡大に伴い、デザイナー・マネージャー職を募集しています。<br class="pc" />
			ご興味のある方は、各職種の募集要項をご覧の上ご応募ください。
		</p>

		<div class="container mt-30">
			{#each jobs as job (job.id)}
				<a
					href="#{job.slug}"
					class="h2 uppercase mb-5 job-link"
					lang="en"
					data-hover="Scroll"
				>
					{job.title_en}
				</a>
			{/each}
		</div>

		<div class="h4 mt-40">
			応募方法<br />下記内容を
			<a href="/contact" data-hover="Discover">Contact ページ</a>
			よりお送りください。<br />
			ポートフォリオ(ご自身のウェブサイトのURLまたはPDF) / 履歴書 / 職務経歴書<br /><br />
			書類選考を通過した方にのみ、応募から 2 週間以内にメールでご連絡します。
		</div>
	</div>

	<hr class="my-80" />

	<!-- Job postings (driven by microCMS `jobs` API) -->
	{#each jobs as job, i (job.id)}
		<div class="wrapper position">
			<h2 id={job.slug} class="h2 uppercase mb-20" lang="en">{job.title_en}</h2>

			<h4 class="h4 mb-10 bold">業務内容</h4>
			<ul class="mb-30">
				{#each lines(job.duties) as line}
					<li>{line}</li>
				{/each}
			</ul>

			<h4 class="h4 mb-10 bold">求める人物像</h4>
			<ul class="mb-30">
				{#each lines(job.ideal_candidate) as line}
					<li>{line}</li>
				{/each}
			</ul>

			<!-- preferred_skills は任意。空ならセクションごと非表示。 -->
			{#if lines(job.preferred_skills).length > 0}
				<h4 class="h4 mb-10 bold">歓迎スキル</h4>
				<ul class="mb-30">
					{#each lines(job.preferred_skills) as line}
						<li>{line}</li>
					{/each}
				</ul>
			{/if}

			<h4 class="h4 mb-10 bold">条件</h4>
			<div class="h4">
				{#each lines(job.conditions) as line, idx}
					{line}{#if idx < lines(job.conditions).length - 1}<br />{/if}
				{/each}
			</div>
		</div>

		{#if i < jobs.length - 1}
			<hr class="my-80" />
		{/if}
	{/each}

	<hr class="my-80" />

	<!-- 共通: 応募方法 -->
	<div class="wrapper">
		<h2 class="h2 uppercase mb-20" lang="en">How to apply</h2>
		<div class="h4">
			応募方法<br />下記内容を
			<a href="/contact" data-hover="Discover">Contact ページ</a>
			よりお送りください。<br />
			ポートフォリオ(ご自身のウェブサイトのURLまたはPDF) / 履歴書 / 職務経歴書<br /><br />
			書類選考を通過した方にのみ、応募から 2 週間以内にメールでご連絡します。
		</div>
	</div>
</section>

<style>
	.Jobs {
		padding-top: calc(var(--shuffle-height) + 10px);
	}

	.Jobs .wrapper,
	.Jobs hr {
		width: 50%;
		margin-left: auto;
		margin-right: 0;
		padding-right: 0;
	}

	.Jobs hr {
		margin-right: 0;
		background-color: var(--key);
		height: 0.5px;
		border: none;
	}

	.Jobs .wrapper {
		margin-bottom: 0;
	}
	.Jobs .wrapper:last-of-type {
		margin-bottom: 0;
		padding-bottom: 8rem;
	}

	.Jobs .wrapper p,
	.Jobs .wrapper ul li,
	.Jobs .wrapper .h4 {
		text-align: justify;
		hyphens: auto;
	}

	/* Bullet list styling — small, restrained dots */
	.Jobs .wrapper ul {
		padding-left: 1em;
	}
	.Jobs .wrapper ul li {
		list-style: disc;
		font-size: 13px;
		line-height: 1.7;
	}

	/* Anchor links in the intro list */
	.Jobs .job-link {
		display: block;
		text-decoration: none;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}
	.Jobs .job-link:hover {
		opacity: 0.6;
	}

	/* Each section's heading is the scroll target — offset for header height */
	.Jobs h2[id] {
		scroll-margin-top: calc(var(--shuffle-height) + 20px);
	}

	/* hr is white so it stays visible against the black page background */
	.Jobs hr {
		background-color: #ffffff;
	}

	@media (max-width: 767px) {
		.Jobs .wrapper,
		.Jobs hr {
			width: 100%;
			margin-left: 0;
			margin-right: 0;
		}
		.Jobs hr.my-80 {
			margin-top: 50px;
			margin-bottom: 50px;
			opacity: 0.3;
		}
	}
</style>
