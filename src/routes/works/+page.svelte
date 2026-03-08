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

  let currentGridSize = $state('100%');
  let animated = $state(false);
  let isLoading = $state(true); // 読み込み状態

  // 列数を取得
  function getColumnCount(): number {
    const sizes: Record<string, number> = {
      '60%': 6,
      '80%': 5,
      '100%': 4,
      '120%': 3
    };
    return sizes[currentGridSize] || 4;
  }

  // Masonryレイアウトを計算（絶対配置 - 0px誤差）
  function layoutMasonry() {
    if (!browser) return;
    
    const container = document.getElementById('grid-gallery');
    const items = document.querySelectorAll('.grid_gallery_item');
    
    if (!container || items.length === 0) return;
    
    const columnCount = getColumnCount();
    const gap = 8;
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
        layoutMasonry();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<svelte:head>
  <title>Works | Kazuki Kaneko / one inc.</title>
</svelte:head>

<main class="works-page">
  <nav class="options_grid_container">
    <div class="configuration_grid_size">
      <button 
        class:active={currentGridSize === '60%'}
        on:click={() => changeGridSize('60%')}
      >
        60%
      </button>
      <button 
        class:active={currentGridSize === '80%'}
        on:click={() => changeGridSize('80%')}
      >
        80%
      </button>
      <button 
        class:active={currentGridSize === '100%'}
        on:click={() => changeGridSize('100%')}
      >
        100%
      </button>
      <button 
        class:active={currentGridSize === '120%'}
        on:click={() => changeGridSize('120%')}
      >
        120%
      </button>
    </div>
  </nav>

  <section 
    class="grid_gallery_container" 
    class:loading={isLoading}
    id="grid-gallery"
  >
    {#each images as image}
      <div 
        class="grid_gallery_item"
        role="button"
        tabindex="0"
        on:click={() => navigateToProject(image.workId)}
        on:keydown={(e) => e.key === 'Enter' && navigateToProject(image.workId)}
      >
        <div class="image-wrapper">
          <img
            src={image.url}
            alt={image.workTitle}
            class="image"
            loading="lazy"
            width={image.width}
            height={image.height}
          />
        </div>
      </div>
    {/each}
  </section>
</main>

<style>
  .works-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    padding: 0 var(--padding);
    padding-top: calc(var(--shuffle-height) + 10px);
  }

  .options_grid_container {
    position: fixed;
    top: auto;
    bottom: 30px;
    left: var(--padding);
    z-index: 1000;
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
    width: 100%;
  }

  .image {
    width: 100%;
    height: auto;
    display: block;
    filter: brightness(0.85);
    transition: filter 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .grid_gallery_item:hover .image {
    filter: brightness(1);
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
  }
</style>