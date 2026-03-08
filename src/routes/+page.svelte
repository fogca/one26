<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import Swiper from 'swiper';
  import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/pagination';
  import 'swiper/css/effect-fade';
  import ShuffleText from '$lib/components/ShuffleText.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // microCMSからプロジェクト取得
  let projects = $derived(data.works.map(work => ({
    id: work.id,
    title: work.title,
    image: work.thumbnail?.url || '',
  })));

  let shuffleTextComponent: ShuffleText;
  let swiperInstance: Swiper | null = null;
  let showContent = $state(false); // Header & Swiper表示フラグ
  const defaultText = 'Welcome:)';

  // Opening アニメーション
  function startOpeningAnimation() {
    const timeline = gsap.timeline();

    timeline
      // 初期状態をGSAPで設定
      .set('.swiper-slide', {
        opacity: 0,
      })
      .set('.swiper-slide-active .slide-image-wrapper', {
        width: '0%',
        left: '50%',
        x: '0'
      })
      .set('.swiper-slide-active .slide-image', {
        scale: 1.2
      })
      
      // 1. "We opt for a novel experience." 表示
      .call(() => {
        if (shuffleTextComponent) {
          shuffleTextComponent.shuffleToText('We opt for a novel experience.');
        }
      }, undefined, '+=0.3')
      
      // 2. "Welcome:)" に遷移
      .call(() => {
        if (shuffleTextComponent) {
          shuffleTextComponent.shuffleToText(defaultText);
        }
      }, undefined, '+=1.5')
      
      // 3. Reveal animation (中央から左右に開く + 画像ズームイン)
      .to('.swiper-slide-active .slide-image-wrapper', {
        width: '100%',
        left: '0%',
        x: '0%',
        duration: 1.6,
        ease: 'expo.out',
        onStart: () => {
          // Reveal開始と同時にHeader & Swiper表示
          showContent = true;
        }
      }, '+=0.2')
      .to('.swiper-slide-active .slide-image', {
        scale: 1.0,
        duration: 1.6,
        ease: 'expo.out'
      }, '<')
      
      // 4. 最初のプロジェクトタイトル表示
      .call(() => {
        if (shuffleTextComponent && projects.length > 0) {
          shuffleTextComponent.shuffleToText(projects[0].title);
        }
      }, undefined, '-=0.8')
      
      // 5. Ken Burns開始
      .to('.swiper-slide-active .slide-image', {
        scale: 1.08,
        duration: 5,
        ease: 'none'
      }, '-=1')
      
      // 6. Swiper開始
      .call(() => {
        if (swiperInstance) {
          swiperInstance.autoplay.start();
        }
      }, undefined, '-=4');
  }

  onMount(async () => {
    // Swiper 初期化
    swiperInstance = new Swiper('.hero-swiper', {
      modules: [Autoplay, Pagination, EffectFade],
      
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
      
      speed: 1400,
      
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      
      loop: true,
      
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      
      // スライド切り替え時
      on: {
        slideChange: function() {
          const realIndex = this.realIndex;
          const project = projects[realIndex];
          
          if (shuffleTextComponent && project) {
            shuffleTextComponent.shuffleToText(project.title);
          }
        }
      }
    });

    // Openingアニメーション開始
    startOpeningAnimation();
  });

  onDestroy(() => {
    if (swiperInstance) {
      swiperInstance.destroy();
    }
  });
</script>

<svelte:head>
  <title>Kazuki Kaneko / one inc.</title>
</svelte:head>

<!-- ShuffleText -->
<ShuffleText
  bind:this={shuffleTextComponent}
  text=""
/>

{#if showContent}
<!-- Hero Swiper -->
<div class="hero-section">
  <div class="hero-swiper swiper">
    <div class="swiper-wrapper">
      {#each projects as project}
        <div class="swiper-slide">
          <div class="slide-image-wrapper">
            <img 
              src={project.image} 
              alt={project.title}
              class="slide-image"
            />
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Pagination -->
    <div class="swiper-pagination"></div>
  </div>
</div>
{/if}

<style>
  /* ===== Hero Section ===== */
  .hero-section {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .hero-swiper {
    width: calc(100vw - var(--padding) * 2);
    height: calc(100vh - var(--shuffle-height));
    height: calc((100vh - var(--shuffle-height) - 20px - 20px) - var(--h1-font-size) * 1.2);
    position: absolute;
    top: auto;
    bottom: var(--padding);
    right: var(--padding);
    left: var(--padding);
  }

  /* ===== Slide ===== */
  .swiper-slide {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* ===== Image Wrapper ===== */
  .slide-image-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .slide-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform-origin: center center;
  }

  /* Ken Burns effect - 通常のスライド切り替え時のみ */
  :global(.swiper-slide-active:not(:first-child)) .slide-image {
    animation: kenBurns 7s ease-out forwards;
  }

  @keyframes kenBurns {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.08);
    }
  }

  /* ===== Pagination ===== */
  :global(.hero-swiper .swiper-pagination) {
    bottom: 40px;
  }

  :global(.hero-swiper .swiper-pagination-bullet) {
    width: 12px;
    height: 12px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 1;
    transition: all 0.3s ease;
  }

  :global(.hero-swiper .swiper-pagination-bullet-active) {
    width: 32px;
    border-radius: 6px;
    background: #ffffff;
  }

  /* ===== Fade Transition Enhancement ===== */
  :global(.hero-swiper .swiper-wrapper) {
    transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000) !important;
  }

  :global(.hero-swiper .swiper-slide) {
    transition: opacity 1400ms cubic-bezier(0.645, 0.045, 0.355, 1.000) !important;
  }

  /* ===== Responsive ===== */
  @media (max-width: 768px) {
    @keyframes kenBurns {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.05);
      }
    }
  }
</style>