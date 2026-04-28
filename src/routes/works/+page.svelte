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
    // 背面フルスクリーン用（タイルは拡大しないが、同じサムネを大きく表示）
    const backdropUrl = img.url.includes('microcms-assets.io')
      ? `${img.url}?fm=webp&q=70&w=1920&fit=max&auto=compress`
      : img.url;
    
    return {
      url: optimizedUrl,
      backdropUrl,
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
  let hoveredIndex = $state<number | null>(null);
  let hoverLeaveTimer: ReturnType<typeof setTimeout> | null = null;
  let backdropUrl = $state<string | null>(null);
  let backdropLoaded = $state(false);
  let backdropLoadToken = 0;

  /** タイルの img は拡大しない。背面レイヤーにプロジェクトのサムネを full viewport で表示 */
  function handleHoverEnter(index: number) {
    if (hoverLeaveTimer) {
      clearTimeout(hoverLeaveTimer);
      hoverLeaveTimer = null;
    }
    hoveredIndex = index;
    updateBackdrop(images[index].backdropUrl);
  }

  function handleHoverLeave() {
    hoverLeaveTimer = setTimeout(() => {
      hoveredIndex = null;
      hoverLeaveTimer = null;
    }, 45);
  }

  function updateBackdrop(url: string) {
    if (!browser) {
      backdropUrl = url;
      backdropLoaded = true;
      return;
    }

    backdropLoaded = false;
    const token = ++backdropLoadToken;
    const preloader = new Image();
    preloader.src = url;

    const finalize = () => {
      if (token !== backdropLoadToken) return;
      backdropUrl = url;
      backdropLoaded = true;
    };

    if (preloader.complete) {
      finalize();
      return;
    }

    preloader.onload = finalize;
    preloader.onerror = finalize;
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
    
    // Step 3: 横並び優先で配置
    items.forEach((item: Element, index) => {
      const htmlItem = item as HTMLElement;
      
      // 横位置を計算（左から右）
      const column = index % columnCount;
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

    hoveredIndex = null;
    
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
      }
    });
  }

  // プロジェクト詳細ページへ遷移
  function navigateToProject(workId: string) {
    goto(`/works/${workId}`);
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
        if (hoverLeaveTimer) {
          clearTimeout(hoverLeaveTimer);
          hoverLeaveTimer = null;
        }
        hoveredIndex = null;
        layoutMasonry();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (hoverLeaveTimer) clearTimeout(hoverLeaveTimer);
    };
  });
</script>

<svelte:head>
  <title>Works | Kazuki Kaneko / one inc.</title>
</svelte:head>

<main class="works-page">
  <!-- ホバー中のみ：背面に同一プロジェクトのサムネ（タイル自体はリサイズしない） -->
  <div
    class="hover-thumbnail-backdrop"
    class:visible={hoveredIndex !== null}
    aria-hidden="true"
  >
    <div class="hover-thumbnail-backdrop-tone"></div>
    {#if backdropUrl}
      <img
        src={backdropUrl}
        alt=""
        class="hover-thumbnail-backdrop-img"
        class:ready={backdropLoaded && hoveredIndex !== null}
        draggable="false"
      />
    {/if}
  </div>

  <nav class="options_grid_container">
    <div class="configuration_grid_size">
      <!-- 2-column: mobile only (hidden ≥ 768px) -->
      <button
        class="col-mobile"
        class:active={currentGridSize === '2'}
        onclick={() => changeGridSize('2')}
      >
        2 column
      </button>
      <button
        class:active={currentGridSize === '3'}
        onclick={() => changeGridSize('3')}
      >
        3 column
      </button>
      <button
        class:active={currentGridSize === '4'}
        onclick={() => changeGridSize('4')}
      >
        4 column
      </button>
      <!-- 5-column: desktop only (hidden ≤ 767px) -->
      <button
        class="col-desktop"
        class:active={currentGridSize === '5'}
        onclick={() => changeGridSize('5')}
      >
        5 column
      </button>
    </div>
  </nav>

  <section 
    class="grid_gallery_container" 
    class:loading={isLoading}
    class:hovering={hoveredIndex !== null}
    id="grid-gallery"
  >
    {#each images as image, i}
      <div 
        class="grid_gallery_item"
        class:hover-active={hoveredIndex === i}
        role="button"
        tabindex="0"
        data-grid-index={i}
        onmouseenter={() => handleHoverEnter(i)}
        onmouseleave={handleHoverLeave}
        onclick={() => navigateToProject(image.workId)}
        onkeydown={(e) => e.key === 'Enter' && navigateToProject(image.workId)}
      >
        <div class="image-wrapper" style:aspect-ratio={image.aspectRatio}>
          {#if hoveredIndex === i}
            <div class="hover-placeholder" aria-hidden="true">
              <span class="hover-placeholder-title">{image.workTitle}</span>
            </div>
          {/if}
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

  .hover-thumbnail-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
    width: 70%;
    margin-left: auto;
  }

  .hover-thumbnail-backdrop.visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .hover-thumbnail-backdrop {
      transition: opacity 0.12s ease;
    }
  }

  .hover-thumbnail-backdrop-tone {
    position: absolute;
    inset: 0;
    background: #ffffff;
    transition: background-color 0.45s ease;
  }

  .hover-thumbnail-backdrop.visible .hover-thumbnail-backdrop-tone {
    background: #111111;
  }

  .hover-thumbnail-backdrop-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
    opacity: 0;
    transform: scale(1.015);
    transition:
      opacity 0.45s ease,
      transform 0.7s ease;
  }

  .hover-thumbnail-backdrop-img.ready {
    opacity: 1;
    transform: scale(1);
  }

  .options_grid_container {
    position: fixed;
    top: auto;
    bottom: 30px;
    left: var(--padding);
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .configuration_grid_size {
    display: flex;
    align-items: center;
    gap: 1px;
    background: #4c4c4c;
    border: 1px solid var(--key);
    overflow: hidden;
  }

  .configuration_grid_size button {
    background: var(--key);
    color: var(--white);
    padding: 0.75rem 1.15rem;
    font-size: 13px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .configuration_grid_size button.active {
    background-color: var(--white);
    color: var(--black);
  }

  .configuration_grid_size button:not(.active):hover {
    background-color: #2a2a2a;
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

  .grid_gallery_item.hover-active .grid-img {
    opacity: 0;
    pointer-events: none;
  }

  /* ホバー中は全タイル画像を消し、背景の高解像度サムネを主役にする */
  .grid_gallery_container.hovering .grid-img {
    opacity: 0;
    pointer-events: none;
  }

  .image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .hover-placeholder {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--key);
    color: var(--white);
    text-align: center;
    pointer-events: none;
  }

  .hover-placeholder-title {
    font-size: clamp(11px, 2.2vw, 15px);
    line-height: 1.35;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
  }

  .image {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 1;
    filter: brightness(0.85);
    transition:
      filter 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
      opacity 0.25s ease;
  }

  .grid_gallery_item:hover .grid-img.image {
    filter: brightness(1);
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
    .options_grid_container {
      bottom: 15px;
      left: 15px;
    }

    .configuration_grid_size button {
      padding: 0.5rem 0.8rem;
      font-size: 11px;
    }

    /* Drop the desktop-only 70% inset on mobile — full bleed */
    .grid_gallery_container,
    .hover-thumbnail-backdrop {
      width: 100%;
      margin-left: 0;
    }
  }
</style>