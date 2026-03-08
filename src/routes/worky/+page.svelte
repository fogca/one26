<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gsap } from 'gsap';
  import { Flip } from 'gsap/Flip';
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
  let showText = $state(false);
  let forceSquare = $state(false);

  // グリッドサイズ変更
  function changeGridSize(newSize: string) {
    if (animated || newSize === currentGridSize) return;
    
    animated = true;
    
    const allGridItems = document.querySelectorAll('.grid_gallery_item');
    const gridGallery = document.getElementById('grid-gallery');
    
    if (!gridGallery || allGridItems.length === 0) {
      animated = false;
      return;
    }
    
    const state = Flip.getState(allGridItems);
    
    gridGallery.dataset.sizeGrid = newSize;
    currentGridSize = newSize;
    
    Flip.from(state, {
      duration: 0.8,
      ease: 'expo.inOut',
      onComplete: () => {
        animated = false;
      }
    });
  }

  // プロジェクト詳細ページへ遷移
  function navigateToProject(workId: string) {
    goto(`/works/${workId}`);
  }

  onMount(() => {
    gsap.registerPlugin(Flip);
    document.body.classList.remove('loading');
    
    // デバッグ: 画像データを確認
    console.log('Images loaded:', images.length);
    console.log('First image:', images[0]);
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
    
    <div class="configuration_text_toggle">
      <button 
        class:active={showText}
        on:click={() => showText = !showText}
      >
        {showText ? 'Text: ON' : 'Text: OFF'}
      </button>
    </div>
    
    <div class="configuration_square_toggle">
      <button 
        class:active={forceSquare}
        on:click={() => forceSquare = !forceSquare}
      >
        {forceSquare ? 'Square: ON' : 'Square: OFF'}
      </button>
    </div>
  </nav>

  <!-- デバッグ情報 -->
  <div style="position: fixed; top: 10px; right: 10px; background: white; padding: 10px; z-index: 9999; font-size: 12px;">
    <p>Images: {images.length}</p>
    <p>Grid Size: {currentGridSize}</p>
    <p>Show Text: {showText}</p>
    <p>Force Square: {forceSquare}</p>
  </div>

  <section 
    class="grid_gallery_container" 
    id="grid-gallery"
    data-size-grid={currentGridSize}
  >
    {#each images as image}
      <div 
        class="grid_gallery_item"
        style="--aspect-ratio: {forceSquare ? '1 / 1' : image.aspectRatio}"
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
        {#if showText}
          <p>{image.workTitle}</p>
        {/if}
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

  .configuration_text_toggle {
    display: flex;
  }

  .configuration_text_toggle button {
    background: var(--key);
    color: var(--white);
    padding: 0.75rem 1.15rem;
    font-size: 13px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    border: 1px solid var(--key);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .configuration_text_toggle button.active {
    background-color: var(--white);
    color: var(--key);
  }

  .configuration_text_toggle button:not(.active):hover {
    background-color: var(--white);
    color: var(--key);
  }

  .configuration_square_toggle {
    display: flex;
  }

  .configuration_square_toggle button {
    background: var(--key);
    color: var(--white);
    padding: 0.75rem 1.15rem;
    font-size: 13px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    border: 1px solid var(--key);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .configuration_square_toggle button.active {
    background-color: var(--white);
    color: var(--key);
  }

  .configuration_square_toggle button:not(.active):hover {
    background-color: var(--white);
    color: var(--key);
  }

  .grid_gallery_container {
    position: relative;
    display: grid;
    gap: 8px;
    padding: 0;
    width: 70%;
    margin-left: auto;
    margin-right: 0;
    max-width: 1400px;
  }

  .grid_gallery_container[data-size-grid='60%'] {
    grid-template-columns: repeat(12, 1fr);
  }

  .grid_gallery_container[data-size-grid='80%'] {
    grid-template-columns: repeat(10, 1fr);
  }

  .grid_gallery_container[data-size-grid='100%'] {
    grid-template-columns: repeat(8, 1fr);
  }

  .grid_gallery_container[data-size-grid='120%'] {
    grid-template-columns: repeat(6, 1fr);
  }

  .grid_gallery_item {
    will-change: auto;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    grid-column: span 2;
  }

  .grid_gallery_item p {
    font-size: 10px;
    text-align: left;
    margin-top: 8px;
    color: var(--black);
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
  }

  .image-wrapper {
    width: 100%;
    aspect-ratio: var(--aspect-ratio, 1 / 1);
    overflow: hidden;
  }

  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

    .grid_gallery_container[data-size-grid='60%'],
    .grid_gallery_container[data-size-grid='80%'],
    .grid_gallery_container[data-size-grid='100%'],
    .grid_gallery_container[data-size-grid='120%'] {
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .grid_gallery_item {
      grid-column: span 2;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .grid_gallery_container[data-size-grid='60%'] {
      grid-template-columns: repeat(10, 1fr);
    }

    .grid_gallery_container[data-size-grid='80%'] {
      grid-template-columns: repeat(8, 1fr);
    }

    .grid_gallery_container[data-size-grid='100%'] {
      grid-template-columns: repeat(6, 1fr);
    }

    .grid_gallery_container[data-size-grid='120%'] {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>