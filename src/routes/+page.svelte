<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { gsap } from 'gsap';
  import Lenis from '@studio-freight/lenis';
  import ShuffleText from '$lib/components/ShuffleText.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showContent = $state(false);
  let currentIndex = $state(0);
  let galleryContainer: HTMLElement | undefined;
  let works = $derived(data.works || []); // worksデータ
  
  let revealStep = $state(0); // 0: hidden, 1: "We opt...", 2: "Welcome:)", 3: show gallery

  onMount(() => {
    if (!browser) return;

    // Opening animation with ShuffleText
    setTimeout(() => {
      revealStep = 1; // "We opt for a novel experience."
    }, 300);

    setTimeout(() => {
      revealStep = 2; // "Welcome:)"
    }, 2000);

    setTimeout(() => {
      revealStep = 3; // Show gallery
      showContent = true;
      
      // Lenis horizontal scroll 初期化
      setTimeout(() => {
        initHorizontalScroll();
      }, 100);
    }, 3500);

    function initHorizontalScroll() {
      if (!galleryContainer) {
        console.log('Gallery container not found');
        return;
      }

      const track = galleryContainer.querySelector('.gallery-track') as HTMLElement;
      if (!track) {
        console.log('Gallery track not found');
        return;
      }

      const lenis = new Lenis({
        wrapper: galleryContainer,
        content: track,
        orientation: 'horizontal',
        gestureOrientation: 'horizontal',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      // 縦スクロールを横スクロールに変換
      window.addEventListener('wheel', (e) => {
        if (!galleryContainer) return;
        
        // deltaY（縦スクロール）を横スクロールに変換
        e.preventDefault();
        galleryContainer.scrollLeft += e.deltaY;
      }, { passive: false });

      // IntersectionObserver で現在表示中の画像を検知
      const images = galleryContainer.querySelectorAll('.gallery-item');
      
      if (images.length === 0) {
        console.log('No gallery items found');
        return;
      }
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              const index = parseInt(entry.target.getAttribute('data-index') || '0');
              currentIndex = index;
            }
          });
        },
        {
          root: galleryContainer,
          threshold: 0.5,
          rootMargin: '0px'
        }
      );

      images.forEach((img) => observer.observe(img));
    }
  });
</script>

<svelte:head>
  <title>Kazuki Kaneko / one inc.</title>
</svelte:head>

<main class="top-page">
  <!-- Reveal Animation -->
  <div class="reveal-overlay" class:hidden={revealStep === 3}>
    {#if revealStep === 1}
      <div class="reveal-text">
        <ShuffleText text="We opt for a novel experience." />
      </div>
    {/if}
    
    {#if revealStep === 2}
      <div class="reveal-text">
        <ShuffleText text="Welcome:)" />
      </div>
    {/if}
  </div>

  {#if showContent}
    <!-- Project Title -->
    <div class="project-title-display">
      <ShuffleText text={works[currentIndex]?.title || ''} />
    </div>

    <!-- Horizontal Scroll Gallery -->
    <div class="horizontal-gallery" bind:this={galleryContainer}>
      <div class="gallery-track">
        {#each works as work, index}
          <a 
            href="/works/{work.id}"
            class="gallery-item" 
            data-index={index}
          >
            <img 
              src={work.thumbnail?.url || ''} 
              alt={work.title}
              loading="lazy"
            />
          </a>
        {/each}
      </div>
    </div>
  {/if}
</main>

<style>
  .top-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: var(--background);
  }

  /* Reveal Animation */
  .reveal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
    z-index: 9999;
    pointer-events: none;
    transition: opacity 0.6s ease-out;
  }

  .reveal-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .reveal-text {
    position: absolute;
    font-size: 24px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    color: var(--black);
  }

  /* Project Title Display */
  .project-title-display {
    position: fixed;
    top: calc(var(--shuffle-height) + 20px);
    left: var(--padding);
    z-index: 100;
    font-size: 32px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    color: var(--black);
  }

  /* Horizontal Gallery */
  .horizontal-gallery {
    position: fixed;
    bottom: 30px;
    left: 0;
    width: 100vw;
    height: 55vh;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .gallery-track {
    display: flex;
    gap: 20px;
    padding: 0 var(--padding);
    height: 100%;
  }

  .gallery-item {
    flex-shrink: 0;
    height: 100%;
    display: flex;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.3s ease;
  }

  .gallery-item:hover {
    opacity: 0.8;
  }

  .gallery-item img {
    height: 100%;
    width: auto;
    object-fit: contain;
    display: block;
  }

  /* スクロールバーを隠す */
  .horizontal-gallery::-webkit-scrollbar {
    display: none;
  }

  .horizontal-gallery {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  @media (max-width: 767px) {
    .reveal-text {
      font-size: 18px;
    }

    .project-title-display {
      font-size: 24px;
      top: calc(var(--shuffle-height) + 15px);
      left: 15px;
    }

    .horizontal-gallery {
      bottom: 15px;
      height: 50vh;
    }

    .gallery-track {
      gap: 15px;
      padding: 0 15px;
    }
  }
</style>