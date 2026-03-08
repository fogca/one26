<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  // カテゴリリスト
  const categories = [
    'Logo / V.I.',
    'Signage',
    'Graphic',
    'Digital / Web'
  ];

  // 低画質プレースホルダーを生成（microCMSの画像URLにクエリパラメータを追加）
  function getLowQualityUrl(url: string): string {
    // microCMSの画像URLに低解像度パラメータを追加
    // 実際のmicroCMSの仕様に合わせて調整が必要な場合があります
    if (url.includes('microcms-assets.io')) {
      // 既にクエリパラメータがある場合は&で追加、ない場合は?で追加
      const separator = url.includes('?') ? '&' : '?';
      return url + separator + 'w=20&q=20'; // 幅20px、品質20%の低画質版
    }
    return url;
  }

  // 画像のロード状態を管理（SvelteのリアクティビティのためRecordを使用）
  let imageStates: Record<string, { loaded: boolean; visible: boolean; visibleTime: number }> = {};

  function handleImageLoad(event: Event, imageUrl: string) {
    imageStates[imageUrl] = { ...imageStates[imageUrl], loaded: true };
    imageStates = imageStates; // Svelteのリアクティビティをトリガー
  }

  function handleImageVisible(imageUrl: string) {
    if (!imageStates[imageUrl] || !imageStates[imageUrl].visible) {
      // 画面内に入ったらすぐに高画質画像のロードを開始
      imageStates[imageUrl] = { loaded: false, visible: true, visibleTime: Date.now() };
      imageStates = imageStates; // テンプレートに反映
    }
  }

  // Intersection Observerで画像の表示を監視
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const imageUrl = img.dataset.imageUrl;
            if (imageUrl) {
              handleImageVisible(imageUrl);
            }
          }
        });
      },
      {
        rootMargin: '100px' // 画面の100px手前から監視開始（スムーズなロードのため）
      }
    );

    // 全ての画像要素を監視
    setTimeout(() => {
      const imageElements = document.querySelectorAll('[data-image-url]');
      imageElements.forEach((img) => {
        observer.observe(img);
        // 初期表示時、既に画面内にある画像はすぐにロード開始
        const rect = img.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight + 100 && rect.bottom > -100;
        if (isInViewport) {
          const imageUrl = img.dataset.imageUrl;
          if (imageUrl) {
            handleImageVisible(imageUrl);
          }
        }
      });
    }, 100);

    return () => {
      observer.disconnect();
    };
  });
</script>

<svelte:head>
	<title>Archives - one inc. | Brand Design Consultancy</title>
</svelte:head>

<main class="works-page">
  <!-- 左側: タイトルとカテゴリリスト（position: fixed） -->
  <div class="works-sidebar">

    <ul class="category-list">
      {#each categories as category}
        <li class="category-item">{category}</li>
      {/each}
    </ul>
  </div>

  <!-- 右側: 画像グリッド -->
  <div class="works-grid-container">
    <div class="works-grid">
      {#each data.images as image}
        {@const lowQualityUrl = getLowQualityUrl(image.url)}
        {@const state = imageStates[image.url] || { loaded: false, visible: false, visibleTime: 0 }}
        <div class="works-grid-item">
          <a href="/works/{image.workId}">
            <div class="image-wrapper">
              <!-- 低画質プレースホルダー（白黒＋ブラー） - 常に表示 -->
              <img 
                class="placeholder"
                src={lowQualityUrl}
                alt=""
                width={image.width}
                height={image.height}
                data-image-url={image.url}
                loading="lazy"
              />
              <!-- 高画質画像（画面内に入ったらロード開始） -->
              {#if state.visible}
                <img 
                  class="main-image"
                  class:loaded={state.loaded}
                  src={image.url}
                  alt={image.workTitle}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  on:load={(e) => handleImageLoad(e, image.url)}
                />
              {/if}
            </div>
          </a>
        </div>
      {/each}
    </div>
  </div>
</main>

<style>
  .works-page {
    position: relative;
    min-height: 100vh;
    padding-top: 15vh;
    padding-bottom: 10vh;
  }

  /* 左側サイドバー - position fixed */
  .works-sidebar {
    position: fixed;
    left: 2.75vw;
    top: 15vh;
    z-index: 10;
  }

  .works-title {
    font-size: 48px;
    font-weight: 300;
    line-height: 1.1;
    margin: 0 0 3rem 0;
    letter-spacing: -0.02em;
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .category-item {
    font-size: 14px;
    color: #999;
    margin-bottom: 1rem;
    font-weight: 300;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .category-item:hover {
    color: #000;
  }

  /* 右側グリッドコンテナ */
  .works-grid-container {
    position: relative;
    width: 65vw;
    margin-left: auto;
    margin-right: 0;
  }

  .works-grid {
    column-count: 4;
    column-gap: 5px;
    width: 100%;
  }

  .works-grid-item {
    position: relative;
    break-inside: avoid;
    margin-bottom: 5px;
    cursor: pointer;
    display: block;
  }

  .works-grid-item a {
    display: block;
    width: 100%;
  }

  .image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .image-wrapper img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }

  /* 低画質プレースホルダー（白黒＋ブラー） - 常に表示されるようにrelative */
  .image-wrapper .placeholder {
    position: relative;
    width: 100%;
    height: auto;
    filter: grayscale(100%) blur(10px);
    opacity: 0.8;
    z-index: 1;
    /* ブラーがはみ出ないように */
    transform: scale(1.05); /* ブラーエフェクト用に少し拡大 */
  }

  /* 高画質画像 */
  .image-wrapper .main-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.6s ease-in-out;
    z-index: 2;
  }


  .image-wrapper .main-image.loaded {
    opacity: 1;
  }

  /* 高画質画像がロードされたらプレースホルダーを非表示 */
  .image-wrapper .main-image.loaded ~ .placeholder {
    opacity: 0;
    transition: opacity 0.6s ease-in-out;
  }

  @media (max-width: 1024px) {
    .works-grid {
      column-count: 3;
    }

    .works-grid-container {
      width: 70vw;
    }
  }

  @media (max-width: 768px) {
    .works-page {
      padding-top: 10vh;
    }

    .works-sidebar {
      position: relative;
      left: auto;
      top: auto;
      margin-bottom: 3rem;
      padding-left: 2.75vw;
    }

    .works-title {
      font-size: 32px;
      margin-bottom: 2rem;
    }

    .works-grid-container {
      width: 100%;
      padding: 0 2.75vw;
    }

    .works-grid {
      column-count: 2;
      column-gap: 5px;
    }
  }

  @media (max-width: 480px) {
    .works-grid {
      column-count: 1;
    }
  }
</style>