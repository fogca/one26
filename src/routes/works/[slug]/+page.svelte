<script lang="ts">
	import ShuffleText from '$lib/components/ShuffleText.svelte';
	import NextProjectScroll from '$lib/components/NextProjectScroll.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let work = $derived(data.work);
	let relatedWorks = $derived(data.relatedWorks);
	let navigation = $derived(data.navigation);

	// Mobile-only collapse for the body text. Desktop ignores this state entirely
	// (the toggle button is display:none and .body-text has no max-height cap).
	// Reset on slug change so each project starts collapsed.
	let bodyExpanded = $state(false);
	$effect(() => {
		work.id;
		bodyExpanded = false;
	});
</script>

<svelte:head>
	<title>{work.title} - Kazuki Kaneko / one inc.</title>
	{#if work.description}
	  <meta name="description" content={work.description} />
	{/if}
</svelte:head>

{#key work.id}
<div class="work-detail-page">
	<div class="work-container">
	  <!-- Fixed Left Section (desktop) — split into title-area + body-area
	       so mobile can reorder them around the thumbnail via display:contents. -->
	  <aside class="work-info-fixed">
		<div class="title-area">
		  <div class="work-title-shuffle">
			<ShuffleText text={work.title} inline />
		  </div>

		  {#if work.scope && work.scope.length > 0}
			<div class="work-scope">
			  <span class="scope-tag">{work.scope}</span>
			</div>
		  {/if}
		</div>

		<div class="body-area">
		  {#if work.body}
			<div class="work-body">
			  <div class="body-text" class:expanded={bodyExpanded}>
				{@html work.body}
			  </div>
			  <button
				type="button"
				class="body-toggle"
				onclick={() => (bodyExpanded = !bodyExpanded)}
			  >
				{bodyExpanded ? 'Show less' : 'Show all'}
			  </button>
			</div>
		  {/if}
		</div>
	  </aside>

	  <!-- Scrolling Right Section (Images) — split into thumb-area + rest-area
	       so mobile can slot the body-area between them. -->
	  <div class="work-images-scroll">
		<div class="thumb-area">
		  {#if work.thumbnail}
			<div class="main-image">
			  <img src={work.thumbnail.url} alt={work.title} />
			</div>
		  {/if}
		</div>

		<div class="rest-area">
		  {#if work.repeatImg && work.repeatImg.length > 0}
			{#each work.repeatImg as item}
			  {#if item.images}
				<div class="project-image">
				  <img src={item.images.url} alt={work.title} />
				</div>
			  {/if}
			{/each}
		  {/if}

		  {#if work.credit}
			<div class="work-credit">
			  <p>{@html work.credit}</p>
			</div>
		  {/if}
		</div>
	  </div>
	</div>


	<!-- "NEXT PROJECT" bottom-of-page hand-off. The whole page is wrapped in
	     {#key work.id} so this gets fully re-mounted on slug change, refreshing
	     all content (images, body, etc.) along with this component. -->
	{#if navigation?.next}
		<NextProjectScroll href="/works/{navigation.next.id}" />
	{/if}

</div>
{/key}

<style>
	.work-detail-page {
	  background: #ffffff;
	  min-height: 100vh;
	}


	/* Container */
	.work-container {
	  display: flex;
	  justify-content: flex-end;
	  min-height: 100vh;
	  padding: 0;
	}

	/* Fixed Left Section */
	.work-info-fixed {
	  position: relative;
	  height: auto;
	  overflow-y: auto;
	  padding: 0;
	  padding-top: var(--shuffle-height);
	  padding-top: calc(var(--shuffle-height) + 42px + 20px);
	  padding-right: calc(var(--padding) * 2);

	  width: 35%;
      position: fixed;
      left: 0;
      top: 0;
      background-color: var(--white);
	  padding-left: var(--padding);
      padding-right: calc(var(--padding) + 3px);
	  padding-top: var(--shuffle-height);
	  z-index: 1;
	}

	.work-title-shuffle {
	  margin-bottom: 15px;
	}

	.work-body {padding-bottom: 250px;}



	.work-scope {
	  display: flex;
	  flex-wrap: wrap;
	  gap: 10px;
	  margin-bottom: 30px;
	}

	.body-text {width: 95%;}
	@media screen and (min-width: 1640px) {
		.body-text {width: 75%;}
	}




	.body-text :global(p) {
		font-size: 12px;
	  line-height: 1.35;
	  text-align: justify;
	}

	/* Show all / Show less toggle — hidden on desktop (full body always visible) */
	.body-toggle {
	  display: none;
	}

	/* Navigation */
	.work-nav {
		width: 65%;
		margin-left: auto;
	  display: flex;
	  flex-direction: column;
	  gap: 20px;
	  padding-top: 40px;

	}

	.nav-link {
	  display: flex;
	  align-items: center;
	  gap: 15px;
	  text-decoration: none;
	  color: #000;
	  font-size: 16px;
	  font-weight: 300;
	  transition: opacity 0.3s;
	}

	.nav-link:hover {opacity: 0.5;}
	.nav-arrow {font-size: 20px;}
	.nav-title {flex: 1;}
	/* Scrolling Right Section */
	.work-images-scroll {
		width: 65%;
	  padding: 0;
	  background: #ffffff;
	  padding-right: var(--padding);
	  padding-top: 60px;
	}

	.main-image,
	.project-image {
	  width: 100%;
	  margin-bottom: var(--padding);
	}

	.main-image img,
	.project-image img {
	  width: 100%;
	  height: auto;
	  display: block;
	}

	.project-image img {
		width: auto;
		max-height: 95vh;
		margin: 0 0 var(--padding);
	}

	.main-image img {
		height: calc(100vh - 60px - var(--padding));
	}



	/* Responsive */
	@media (max-width: 1024px) {
	  .work-container {
		grid-template-columns: 40% 60%;
	  }
	}

	/* ── Mobile ──
	   Stack order: title → thumbnail → body (collapsed) → rest of images.
	   `display:contents` flattens the desktop wrappers so their inner blocks
	   become direct flex children of .work-container, then `order` rearranges
	   them. The desktop fixed-positioning side-effect on .work-info-fixed is
	   neutralised because the element no longer renders its own box. */
	@media (max-width: 767px) {
	  .work-container {
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding-top: calc(var(--shuffle-height) + 20px);
	  }

	  .work-info-fixed,
	  .work-images-scroll {
		display: contents;
	  }

	  .title-area  { order: 1; padding: 0 var(--padding); }
	  .thumb-area  { order: 2; }
	  .body-area   { order: 3; padding: 24px var(--padding) 0; }
	  .rest-area   { order: 4; padding: 0 0 40px; }

	  .work-title-shuffle { margin-bottom: 10px; }
	  .work-scope { margin-bottom: 0; }

	  .work-body { padding-bottom: 0; }

	  .body-text {
		width: 100%;
		position: relative;
		max-height: 7.5em;
		overflow: hidden;
		transition: max-height 0.45s ease;
	  }
	  .body-text::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 3em;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff 90%);
		pointer-events: none;
		transition: opacity 0.3s ease;
	  }
	  .body-text.expanded {
		max-height: 200em;
	  }
	  .body-text.expanded::after {
		opacity: 0;
	  }

	  .body-toggle {
		display: inline-block;
		margin-top: 12px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--key);
		font-family: var(--font-en-main);
		font-size: 11px;
		font-weight: var(--font-weight-light);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	  }

	  .main-image,
	  .project-image {
		margin-bottom: 12px;
	  }
	  .main-image img {
		height: auto;
	  }
	  .project-image img {
		width: 100%;
		max-height: none;
		margin: 0 0 12px;
	  }
	  .work-credit {
		padding: 16px var(--padding) 0;
	  }
	}

	/* Hide scrollbar but keep scrolling */
	.work-info-fixed::-webkit-scrollbar {
	  width: 0px;
	  background: transparent;
	}
</style>
