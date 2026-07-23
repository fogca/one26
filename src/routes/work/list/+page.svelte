<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const formatYear = (value: string) => String(new Date(value).getFullYear());
</script>

<svelte:head>
  <title>Project List | one inc.</title>
  <meta
    name="description"
    content="one inc. の手掛けたプロジェクトをリスト形式で。タイトル・カテゴリーから案件を辿れます。"
  />
  <meta property="og:title" content="Project List | one inc." />
  <meta
    property="og:description"
    content="one inc. の手掛けたプロジェクトをリスト形式で。タイトル・カテゴリーから案件を辿れます。"
  />
  <meta name="twitter:title" content="Project List | one inc." />
  <meta
    name="twitter:description"
    content="one inc. の手掛けたプロジェクトをリスト形式で。タイトル・カテゴリーから案件を辿れます。"
  />
</svelte:head>

<section class="works-list">
  <nav class="options_grid_container" lang="en">
    <!-- View row: Grid / List toggle (List active here) -->
    <div class="opt-row">
      <div class="opt-values">
        <a href="/work" class="opt-item">Grid</a>
        <a href="/work/list" class="opt-item active" aria-current="page">List</a>
      </div>
    </div>

    <!-- Sort row: chronological direction.
         Hidden for now via opacity (may come back later) — see .sort-row. -->
    <div class="opt-row sort-row">
      <span class="opt-label">Sort</span>
      <div class="opt-values">
        <a
          href="/work/list?sort=default"
          class="opt-item"
          class:active={data.sort === 'default'}
        >
          Default
        </a>
        <a
          href="/work/list?sort=new"
          class="opt-item"
          class:active={data.sort === 'new'}
        >
          New to
        </a>
      </div>
    </div>
  </nav>

  <div class="wrapper">
    {#each data.works as work}
      <a class="container" href="/work/{work.id}">
        {#if work.thumbnail?.url}
          <img src={work.thumbnail.url} alt={work.title} loading="lazy" />
        {/if}

        <div class="box">
          <div>
            <span lang="en">{work.category || 'Project'}</span>
            <span lang="en">{formatYear(work.publishedAt)}</span>
          </div>
          <h2 class="h2" lang="en">{work.title}</h2>
          <div></div>
        </div>
      </a>
    {/each}
  </div>
</section>

<style>
  .works-list {
    position: relative;
    padding-top: 120px;
    padding-bottom: 60px;
  }

  .options_grid_container {
    /* Sits right under the fixed "Work Archives / List" title (ShuffleText:
       top = --shuffle-height, two lines at line-height 1.1). */
    position: fixed;
    top: calc(var(--shuffle-height) + var(--h1-font-size) * 2.2 + 32px);
    left: var(--padding);
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 240px;
    color: var(--key);
    font-family: var(--font-en-main);
  }

  .opt-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 8px;
    font-size: 13px;
  }

  .opt-label {
    font-weight: var(--font-weight-light);
    letter-spacing: 0.01em;
  }

  .opt-values {
    display: flex;
    align-items: baseline;
    gap: 18px;
  }

  /* Sort row hidden for now — kept in the DOM/markup so it can come back by
     deleting these two lines. */
  .opt-row.sort-row {
    opacity: 0;
    pointer-events: none;
  }

  .opt-item {
    position: relative;
    background: transparent;
    color: var(--key);
    padding: 0;
    border: none;
    font-size: 13px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    text-decoration: none;
    cursor: pointer;
    opacity: 0.35;
    transition: opacity 0.2s ease;
  }

  .opt-item.active {
    opacity: 1;
    font-weight: var(--font-weight-regular);
  }

  /* 4px dot to the left of the active item (replaces the "View" label). */
  .opt-item.active::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
  }

  .opt-item:not(.active):hover {
    opacity: 1;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    width: 70%;
    margin-left: auto;
    margin-right: 0;
    grid-template-columns: 1fr;
  }

  .container {
    display: flex;
    padding: 30px 20px;
    border-bottom: .5px solid var(--key);
  }
  .container:nth-of-type(1) {border-top: .5px solid var(--key);}

  .container img {
    width: auto;
    height: 180px;
    height: 20vh;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    margin-right: 40px;
  }


  .box {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .box span {
    font-size: 11px;
    line-height: 1.4;
    font-weight: var(--font-weight-medium);
    font-variation-settings: 'wght' var(--font-weight-medium);
  }

  .box h2 {
    font-size: 28px;
    margin-top: -10px;
    font-weight: var(--font-weight-light);
    font-variation-settings: 'wght' var(--font-weight-light);
    transition: font-variation-settings 0.5s ease-in-out;
  }


  a.container img {filter: saturate(1);}
  a.container:hover img {filter: saturate(1);}
  a.container:hover {
    opacity: 1;
    background-color: var(--key);
  }
  a.container:hover * {color: var(--white);}
  a.container:hover h2 {
    transition: font-variation-settings 0.5s ease-in-out;
    font-weight: var(--font-weight-medium);
    font-variation-settings: 'wght' var(--font-weight-medium);
  }

  a.container img,
  a.container .box {transition: transform 0.5s;}
  a.container:hover img,
  a.container:hover .box {
    transition: transform 0.5s;
    transform: translateX(10px);
  }
  a.container:hover .box {transform: translateX(5px);}

  @media (max-width: 767px) {
    .works-list {
      padding-top: 90px;
      padding-bottom: 40px;
    }

    /* Mobile: pin beside the global ShuffleText. Use absolute (not fixed) so
       it scrolls with the page; top: -8vh sits the block just above the list,
       level with the shuffle text. */
    .options_grid_container {
      position: absolute;
      top: -8vh;
      right: var(--padding);
      bottom: auto;
      left: auto;
      width: 120px;
      gap: 6px;
    }

    .opt-row {
      font-size: 9.5px;
      gap: 10px;
      padding-bottom: 4px;
    }

    .opt-values {
      gap: 15px;
    }

    .opt-item {
      font-size: 9.5px;
    }

    .wrapper {
      grid-template-columns: 1fr;
      gap: 24px;
      /* Drop the desktop-only 70% inset on mobile — full bleed */
      width: 100%;
      margin-left: 0;
    }

    .box h2 {
      font-size: 18px;
    }
  }
</style>