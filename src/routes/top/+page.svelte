<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { gsap } from 'gsap';
  import Lenis from '@studio-freight/lenis';
  import ShuffleText from '$lib/components/ShuffleText.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showContent = $state(false);
  let galleryContainer: HTMLElement | undefined;
  let works = $derived(data.works || []); // worksデータ
  
  let revealStep = $state(0); // 0: hidden, 1: "We opt...", 2: "Welcome:)", 3: show gallery

  onMount(() => {
    if (!browser) return;

    // Cleanup handles — populated when initHorizontalScroll runs
    let lenisInstance: Lenis | null = null;
    let rafId: number | null = null;
    let wheelHandler: ((e: WheelEvent) => void) | null = null;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    // Opening animation with ShuffleText
    timeoutIds.push(
      setTimeout(() => {
        revealStep = 1; // "We opt for a novel experience."
      }, 300)
    );

    timeoutIds.push(
      setTimeout(() => {
        revealStep = 2; // "Welcome:)"
      }, 2000)
    );

    timeoutIds.push(
      setTimeout(() => {
        revealStep = 3; // Show gallery
        showContent = true;

        // Lenis horizontal scroll 初期化
        timeoutIds.push(
          setTimeout(() => {
            initHorizontalScroll();
          }, 100)
        );
      }, 3500)
    );

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

      lenisInstance = new Lenis({
        wrapper: galleryContainer,
        content: track,
        orientation: 'horizontal',
        gestureOrientation: 'horizontal',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      function raf(time: number) {
        lenisInstance?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);

      // 縦スクロールを横スクロールに変換
      wheelHandler = (e: WheelEvent) => {
        if (!galleryContainer) return;

        // deltaY（縦スクロール）を横スクロールに変換
        e.preventDefault();
        galleryContainer.scrollLeft += e.deltaY;
      };
      window.addEventListener('wheel', wheelHandler, { passive: false });

      // Loaded animation — staggered clip-path reveal
      const items = galleryContainer.querySelectorAll('.gallery-item');
      gsap.fromTo(
        items,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.0,
          stagger: 0.075,
          ease: 'power3.out'
        }
      );
    }

    // Cleanup on unmount — prevents wheel hijack from leaking to other pages
    return () => {
      timeoutIds.forEach(clearTimeout);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (wheelHandler) window.removeEventListener('wheel', wheelHandler);
      lenisInstance?.destroy();
    };
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
    <!-- Fixed Message -->
    <div class="fixed-message">
      <ShuffleText text="We bring an inventive perspective to" inline />
      <br />
      <ShuffleText text="every project with our ideas and passion." inline />
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

  /* Fixed Message */
  .fixed-message {
    position: fixed;
    top: calc(var(--shuffle-height) + 20px);
    left: var(--padding);
    z-index: 100;
    font-size: 32px;
    font-family: var(--font-en-main);
    font-weight: var(--font-weight-light);
    color: var(--black);
    line-height: 1.4;
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

    .fixed-message {
      font-size: 20px;
      top: calc(var(--shuffle-height) + 15px);
      left: 15px;
      line-height: 1.3;
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