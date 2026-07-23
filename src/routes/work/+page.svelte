<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gsap } from 'gsap';
  import { Flip } from 'gsap/Flip';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // server.tsで作成されたimages配列を使用 + Imgix最適化
  let images = $state(data.images.map(img => {
    const optimizedUrl = img.url.includes('microcms-assets.io')
      ? `${img.url}?fm=webp&q=60&w=700&fit=max&auto=compress`
      : img.url;

    return {
      url: optimizedUrl,
      width: img.width,
      height: img.height,
      workId: img.workId,
      workTitle: img.workTitle,
      aspectRatio: `${img.width} / ${img.height}`
    };
  }));

  // Column-count based grid size. Values are stringified column counts:
  // '2' = 2 columns, '3' = 3 columns, '4' = 4 columns.
  let currentGridSize = $state('3');
  let animated = $state(false);
  let isLoading = $state(true); // 読み込み状態

  // Desktop only: scroll depth drives the column count — 3 cols at the top,
  // 4 as soon as you scroll, 5 from around the middle. A manual Size click
  // takes over and stops the scroll driving for the rest of the visit.
  let scrollDriven = true;

  // Thresholds are ABSOLUTE scroll depth in viewport-heights, not a fraction
  // of the page: each column switch changes the masonry height, so ratio-
  // based progress feeds back on itself and cascades through the sizes.
  // Absolute scrollY doesn't move when the layout reflows. Separate up/down
  // values (hysteresis) so the grid doesn't oscillate when a switch shortens
  // the page enough that the browser clamps scrollY back below the trigger.
  const UP_TO_4 = 0.1; // any real scroll off the top -> 4 cols
  const UP_TO_5 = 1.8; // around the middle of the page -> 5 cols
  const DOWN_TO_3 = 0.03; // essentially back at the top -> 3 cols
  const DOWN_TO_4 = 1.2; // back above 1.2 viewports -> 4 cols

  function desiredSizeFromScroll(): string {
    const vh = window.innerHeight;
    const y = window.scrollY;
    const cur = parseInt(currentGridSize, 10) || 3;
    if (cur <= 3) {
      if (y >= UP_TO_5 * vh) return '5';
      if (y >= UP_TO_4 * vh) return '4';
      return '3';
    }
    if (cur === 4) {
      if (y >= UP_TO_5 * vh) return '5';
      if (y < DOWN_TO_3 * vh) return '3';
      return '4';
    }
    if (y < DOWN_TO_3 * vh) return '3';
    if (y < DOWN_TO_4 * vh) return '4';
    return '5';
  }

  function syncGridToScroll() {
    if (!scrollDriven || window.innerWidth < 768) return;
    const desired = desiredSizeFromScroll();
    if (desired !== currentGridSize) changeGridSize(desired);
  }

  // Manual Size click: freeze the scroll driving, then behave as before.
  function selectGridSize(newSize: string) {
    scrollDriven = false;
    changeGridSize(newSize);
  }

  // 列数を取得（currentGridSize は列数の文字列）
  function getColumnCount(): number {
    const n = parseInt(currentGridSize, 10);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  // Masonryレイアウトを計算（絶対配置 - 0px誤差）
  function layoutMasonry() {
    if (!browser) return;
    
    const container = document.getElementById('grid-gallery');
    const items = document.querySelectorAll('.grid_gallery_item');
    
    if (!container || items.length === 0) return;
    
    const columnCount = getColumnCount();
    const gap = 5;
    const containerWidth = container.offsetWidth;
    const columnWidth = (containerWidth - (gap * (columnCount - 1))) / columnCount;
    
    // Step 1: 全アイテムの幅を先に設定（高さ測定のため）
    items.forEach((item: Element) => {
      const htmlItem = item as HTMLElement;
      htmlItem.style.width = `${columnWidth}px`;
    });
    
    // Step 2: 各列の高さを追跡
    const columnHeights = Array(columnCount).fill(0);

    // Step 3: 最も短い列に配置（index % columnCount の固定順だと縦長画像が
    // 偏った列だけ伸びて末尾がバラバラになる。shortest-column 方式なら
    // 全列がほぼ同じ高さで終わる。空列は左から埋まるので先頭行の並びは同じ）
    items.forEach((item: Element) => {
      const htmlItem = item as HTMLElement;

      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const x = column * (columnWidth + gap);

      // 縦位置 = この列の現在の高さ
      const y = columnHeights[column];
      
      // アイテムの実際の高さを取得（幅設定後なので正確）
      const itemHeight = htmlItem.offsetHeight;
      
      // 位置を設定
      htmlItem.style.left = `${x}px`;
      htmlItem.style.top = `${y}px`;
      
      // この列の高さを更新
      columnHeights[column] += itemHeight + gap;
    });
    
    // コンテナの高さを設定
    const maxHeight = Math.max(...columnHeights);
    container.style.height = `${maxHeight}px`;
  }

  // グリッドサイズ変更（GSAP Flip アニメーション）
  function changeGridSize(newSize: string) {
    if (animated || newSize === currentGridSize) return;

    animated = true;
    
    const allGridItems = document.querySelectorAll('.grid_gallery_item');
    
    if (allGridItems.length === 0) {
      animated = false;
      return;
    }
    
    // Step 1: 現在の状態を保存
    const state = Flip.getState(allGridItems);
    
    // Step 2: サイズ変更してレイアウト再計算
    currentGridSize = newSize;
    layoutMasonry();
    
    // Step 3: GSAP Flipでアニメーション
    Flip.from(state, {
      duration: 0.8,
      ease: 'expo.inOut',
      absolute: true, // 絶対配置を考慮
      onComplete: () => {
        animated = false;
        // A threshold may have been crossed while the Flip was running (the
        // guard above drops those calls) — settle to the current scroll depth.
        syncGridToScroll();
      }
    });
  }

  // プロジェクト詳細ページへ遷移
  function navigateToProject(workId: string) {
    goto(`/work/${workId}`);
  }

  let resizeTimer: number;
  
  onMount(() => {
    if (!browser) return;
    
    gsap.registerPlugin(Flip);

    // 画像読み込み完了後にレイアウト
    const imageElements = document.querySelectorAll('.grid_gallery_item img');
    let loadedCount = 0;
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === imageElements.length) {
        layoutMasonry();
        // Settle once in case the page was restored mid-scroll.
        syncGridToScroll();

        // レイアウト完了後、少し待ってからフェードイン
        setTimeout(() => {
          isLoading = false;
        }, 100);
      }
    };
    
    imageElements.forEach((img) => {
      if ((img as HTMLImageElement).complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
      }
    });
    
    // リサイズ時に再配置
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layoutMasonry();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Scroll-driven column count (rAF-throttled)
    let scrollRaf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(syncGridToScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(scrollRaf);
    };
  });
</script>

<svelte:head>
  <title>Works | one inc.</title>
  <meta
    name="description"
    content="one inc. が手掛けたブランドデザイン、ヴィジュアルアイデンティティ、グラフィック、Web 制作のプロジェクトアーカイブ。"
  />
  <meta property="og:title" content="Works | one inc." />
  <meta
    property="og:description"
    content="one inc. が手掛けたブランドデザイン、ヴィジュアルアイデンティティ、グラフィック、Web 制作のプロジェクトアーカイブ。"
  />
  <meta name="twitter:title" content="Works | one inc." />
  <meta
    name="twitter:description"
    content="one inc. が手掛けたブランドデザイン、ヴィジュアルアイデンティティ、グラフィック、Web 制作のプロジェクトアーカイブ。"
  />
</svelte:head>

<main class="works-page">
  <nav class="options_grid_container" lang="en">
    <!-- View row: Grid / List toggle (Grid is current page, List → /work/list) -->
    <div class="opt-row">
      <div class="opt-values">
        <a href="/work" class="opt-item active" aria-current="page">Grid</a>
        <a href="/work/list" class="opt-item">List</a>
      </div>
    </div>

    <!-- Size row: column count (mobile shows 2-4, desktop 3-5).
         Hidden for now via opacity (may come back later) — see .size-row. -->
    <div class="opt-row size-row">
      <span class="opt-label">Size</span>
      <div class="opt-values configuration_grid_size">
        <button
          class="opt-item col-mobile"
          class:active={currentGridSize === '2'}
          onclick={() => selectGridSize('2')}
        >
          2
        </button>
        <button
          class="opt-item"
          class:active={currentGridSize === '3'}
          onclick={() => selectGridSize('3')}
        >
          3
        </button>
        <button
          class="opt-item"
          class:active={currentGridSize === '4'}
          onclick={() => selectGridSize('4')}
        >
          4
        </button>
        <button
          class="opt-item col-desktop"
          class:active={currentGridSize === '5'}
          onclick={() => selectGridSize('5')}
        >
          5
        </button>
      </div>
    </div>
  </nav>

  <section
    class="grid_gallery_container"
    class:loading={isLoading}
    id="grid-gallery"
  >
    {#each images as image, i}
      <div
        class="grid_gallery_item"
        role="button"
        tabindex="0"
        data-grid-index={i}
        data-hover={image.workTitle}
        onclick={() => navigateToProject(image.workId)}
        onkeydown={(e) => e.key === 'Enter' && navigateToProject(image.workId)}
      >
        <div class="image-wrapper" style:aspect-ratio={image.aspectRatio}>
          <img
            src={image.url}
            alt={image.workTitle}
            class="grid-img image"
            loading="lazy"
            width={image.width}
            height={image.height}
            draggable="false"
          />
        </div>
      </div>
    {/each}
  </section>
</main>

<style>
  .works-page {
    position: relative;
    isolation: isolate;
    width: 100%;
    min-height: 100vh;
    padding: 0 var(--padding);
    padding-top: calc(var(--shuffle-height) + 10px);
  }

  .options_grid_container {
    /* Sits right under the fixed "Work Archives" title (ShuffleText:
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

  /* Size row hidden for now — kept in the DOM/markup so it can come back by
     deleting these two lines. */
  .opt-row.size-row {
    opacity: 0;
    pointer-events: none;
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

  /* Absolute Positioned Masonry Container */
  .grid_gallery_container {
    position: relative;
    z-index: 1;
    padding: 0;
    width: 70%;
    margin-left: auto;
    margin-right: 0;
    max-width: 1400px;
    opacity: 1;
    transition: opacity 0.6s ease-out;
  }

  .grid_gallery_container.loading {
    opacity: 0;
  }

  /* Masonry Items - Absolute Positioning */
  .grid_gallery_item {
    position: absolute;
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }

  .image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .image {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 1;
  }

  /* Show/hide column buttons based on viewport */
  .configuration_grid_size .col-desktop {
    display: none;
  }

  @media (min-width: 768px) {
    .configuration_grid_size .col-desktop {
      display: inline-block;
    }
    .configuration_grid_size .col-mobile {
      display: none;
    }
  }

  @media (max-width: 767px) {
    /* Mobile: pin beside the global ShuffleText. Use absolute (not fixed) so
       it scrolls with the page; top: -8vh sits the block just above the works
       grid, level with the shuffle text. */
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

    /* Drop the desktop-only 70% inset on mobile — full bleed */
    .grid_gallery_container {
      width: 100%;
      margin-left: 0;
    }
  }
</style>