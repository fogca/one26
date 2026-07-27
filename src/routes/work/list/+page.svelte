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
    <!-- View row: single link to the other view (current page not shown) -->
    <div class="opt-row">
      <div class="opt-values">
        <a href="/work" class="opt-item solo">
          View as Grid
          <!-- Same chevron as the home "Work Archives" link, scaled to 13px text -->
          <svg class="opt-arrow" viewBox="0 0 50 93" fill="currentColor" aria-hidden="true">
            <path
              d="M0 7.05L5.82 0C5.82 0 13.5 11.48 24.98 22.96C36.46 34.44 49.54 47.23 49.54 47.23C49.54 47.23 38.83 55.65 26.13 68.35C13.43 81.05 5.66 92.31 5.66 92.31L0.11 84.51L22.93 62.39C32.16 53.16 37.3 46.9 37.3 46.9C37.3 46.9 29.58 36.82 20.63 27.88L0 7.05Z"
            />
          </svg>
        </a>
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
    top: calc(var(--shuffle-height) + var(--h1-font-size) * 2.2);
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

  /* Solo view-switch link — full strength by default, dims on hover. */
  .opt-item.solo {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    margin-top: 10px;
    font-size: 15px;
    opacity: 1;
  }
  .opt-item.solo:hover {
    opacity: 0.6;
  }

  /* Chevron: height matched to the text cap height; width follows the
     50:93 viewBox ratio. Inherits the link colour via fill: currentColor. */
  .opt-arrow {
    height: 0.85em;
    width: auto;
    flex: none;
  }

  /* 4px dot to the left of the active item (Sort row, currently hidden). */
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
      /* Nav is absolute (out of flow) — this padding is what actually
         reserves the list's start position; sized to clear the nav's own
         top offset + rendered height + a 40px gap above the list. */
      padding-top: 109px;
      padding-bottom: 40px;
    }

    /* Mobile: the shuffle title is in normal flow here (it scrolls with the
       page), so anchor the nav absolutely at the top of .works-list — that
       edge sits right below the title block. Left-aligned like PC. */
    .options_grid_container {
      position: absolute;
      top: 6px;
      left: var(--padding);
      right: auto;
      bottom: auto;
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