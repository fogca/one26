<script lang="ts">
	import ShuffleText from '$lib/components/ShuffleText.svelte';
	import NextProjectScroll from '$lib/components/NextProjectScroll.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let work = $derived(data.work);
	let relatedWorks = $derived(data.relatedWorks);
	let navigation = $derived(data.navigation);
</script>
  
<svelte:head>
	<title>{work.title} - Kazuki Kaneko / one inc.</title>
	{#if work.description}
	  <meta name="description" content={work.description} />
	{/if}
</svelte:head>
  
<div class="work-detail-page">
	<!-- Fixed Header -->

  
	<div class="work-container">
	  <!-- Fixed Left Section -->
	  <aside class="work-info-fixed">
		<div class="work-title-shuffle">
		  <ShuffleText text={work.title} inline />
		</div>
	
		{#if work.scope && work.scope.length > 0}
		  <div class="work-scope">
			
			  <span class="scope-tag">{work.scope}</span>
			
		  </div>
		{/if}
  
		<div class="work-body">
		  {#if work.body}
			<div class="body-text">
			  {@html work.body}
			</div>
		  {/if}
		</div>
  
		
	  </aside>
  
	  <!-- Scrolling Right Section (Images) -->
	  <div class="work-images-scroll">
		<!-- Main Thumbnail -->
		{#if work.thumbnail}
		  <div class="main-image">
			<img src={work.thumbnail.url} alt={work.title} />
		  </div>
		{/if}

  
		<!-- Project Images/Videos -->
		
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


	<!-- Karaoke-style "Next Project" hand-off — auto-navigates on full fill. -->
	{#if navigation?.next}
		<NextProjectScroll
			href="/works/{navigation.next.id}"
			title={navigation.next.title}
			label="Next Project"
		/>
	{/if}

</div>
  
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
	  position: sticky;
	  top: 0;
	  height: 100vh;
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
  
	  .work-title {
		font-size: 36px;
	  }
	}
  
	@media (max-width: 768px) {
	  .page-header {
		padding: 20px;
	  }
  
	  .work-container {
		grid-template-columns: 1fr;
		padding-top: 60px;
	  }
  
	  .work-info-fixed {
		position: relative;
		top: 0;
		height: auto;
		padding: 40px 20px;
		border-right: none;
		border-bottom: 1px solid #e0e0e0;
	  }
  
	  .work-title {
		font-size: 28px;
	  }
  
	  .main-nav {
		gap: 20px;
	  }
  
	  .main-nav a {
		font-size: 14px;
	  }
	}
  
	/* Hide scrollbar but keep scrolling */
	.work-info-fixed::-webkit-scrollbar {
	  width: 0px;
	  background: transparent;
	}
</style>