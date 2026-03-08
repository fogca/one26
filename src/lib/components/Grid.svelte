<script lang="ts">
    import { onMount } from 'svelte';
    import { gsap } from 'gsap';
  
    // Types
    type Project = {
      id: string;
      title: string;
      image: {
        url: string;
      };
    };
  
    // Props
    export let projects: Project[] = [];
    export let gridWidth = '80vw';
    export let gridHeight = 'auto';
    export let gridGap = '1vw';
    export let gridPositionBottom = '5vw';
    export let moveDistance = '2.5vw';
    export let defaultText = 'We opt for a novel experience.';
    export let showGrid = false; // OPアニメーション完了フラグ
    export let mainTextElement: HTMLElement | undefined = undefined; // 外部からbind可能に
  
    // Internal state
    let shuffleInterval: ReturnType<typeof setInterval>;
    let productGrid: ProductGrid;
  
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
    function randomChar() {
      return chars[Math.floor(Math.random() * chars.length)];
    }
  
    function shuffleWords(element: HTMLElement, finalText: string) {
      if (shuffleInterval) {
        clearInterval(shuffleInterval);
      }
  
      const words = finalText.split(' ');
      const revealedCounts = words.map(() => 0);
  
      shuffleInterval = setInterval(() => {
        let allComplete = true;
  
        const shuffledWords = words.map((word, wordIndex) => {
          const revealedCount = revealedCounts[wordIndex];
  
          if (revealedCount < word.length) {
            allComplete = false;
            revealedCounts[wordIndex]++;
  
            let result = '';
            for (let i = 0; i < word.length; i++) {
              if (i < revealedCounts[wordIndex]) {
                result += word[i];
              } else {
                if (word[i] === '.' || word[i] === '/') {
                  result += word[i];
                } else {
                  result += randomChar();
                }
              }
            }
            return result;
          }
  
          return word;
        });
  
        // innerHTML を使用（<br>タグをサポート）
        element.innerHTML = shuffledWords.join(' ');
  
        if (allComplete) {
          clearInterval(shuffleInterval);
          element.innerHTML = finalText;
        }
      }, 50);
    }
  
    class ProductPreview {
      container: HTMLElement;
      masked: HTMLElement;
      products: Element[];
      title: HTMLElement;
      info: HTMLElement;
      allPreviewImages: HTMLCollection;
      previewImagesPerID: Record<string, Element[]>;
      armWidth: { x: number; y: number };
      timeline: gsap.core.Timeline;
  
      constructor({ products, container }: { products: Element[]; container: HTMLElement }) {
        const allPreviewImages = container.querySelector('.product-preview__images')?.children;
        const previewImages: Record<string, Element[]> = {};
  
        if (allPreviewImages) {
          Array.from(allPreviewImages).forEach((img) => {
            const id = (img as HTMLElement).dataset.id;
            if (id) {
              if (!previewImages[id]) {
                previewImages[id] = [];
              }
              previewImages[id].push(img);
            }
          });
        }
  
        this.container = container;
        this.masked = container.querySelector('.product-preview__inside') as HTMLElement;
        this.products = products;
        this.title = container.querySelector('.product-title') as HTMLElement;
        this.info = container.querySelector('.preview-info') as HTMLElement;
        this.allPreviewImages = allPreviewImages!;
        this.previewImagesPerID = previewImages;
  
        this.armWidth = {
          x: 10,
          y: 10
        };
  
        this.timeline = gsap.timeline();
  
        this.init();
      }
  
      init() {
        this.onResize();
        this.buildTimeline();
      }
  
      setProduct(product: Element | null) {
        if (product) {
          const index = (product as HTMLElement).dataset.index;
          this.title.innerHTML = (product as HTMLElement).dataset.name || '';
  
          gsap.set(Array.from(this.allPreviewImages), { opacity: 0 });
          if (index && this.previewImagesPerID[index]) {
            gsap.set(this.previewImagesPerID[index], { opacity: 1 });
          }
  
          this.timeline.play();
        } else {
          this.timeline.reverse();
        }
      }
  
      buildTimeline() {
        const { x, y } = this.armWidth;
  
        // プレビュー表示のみ（合体なし）
        this.timeline = gsap
          .timeline({
            paused: true,
            defaults: {
              ease: 'power2.inOut',
              duration: 0.6
            }
          })
          .to(this.container, { opacity: 1 }, 0)
          .to(this.info, { opacity: 1 }, 0.3)
          .fromTo(
            this.masked,
            {
              clipPath: `polygon(
                ${50 - x / 2}% 0%,
                ${50 + x / 2}% 0%,
                ${50 + x / 2}% ${50 - y / 2}%,
                100% ${50 - y / 2}%,
                100% ${50 + y / 2}%,
                ${50 + x / 2}% ${50 + y / 2}%,
                ${50 + x / 2}% 100%,
                ${50 - x / 2}% 100%,
                ${50 - x / 2}% ${50 + y / 2}%,
                0% ${50 + y / 2}%,
                0% ${50 - y / 2}%,
                ${50 - x / 2}% ${50 - y / 2}%
              )`
            },
            {
              clipPath: `polygon(
                50% 0%,
                50% 0%,
                50% 50%,
                100% 50%,
                100% 50%,
                50% 50%,
                50% 100%,
                50% 100%,
                50% 50%,
                0% 50%,
                0% 50%,
                50% 50%
              )`
            },
            0
          );
      }
  
      onResize() {
        const { width, height } = this.container.getBoundingClientRect();
        const vw = window.innerWidth / 100;
        const gapValue = parseFloat(gridGap);
        const armWidthPx = gapValue * vw;
  
        this.armWidth = {
          x: (armWidthPx / width) * 100,
          y: (armWidthPx / height) * 100
        };
  
        if (this.timeline) {
          this.timeline.kill();
          this.buildTimeline();
        }
      }
    }
  
    class ProductGrid {
      productPreviewLeft: ProductPreview | null = null;
      productPreviewRight: ProductPreview | null = null;
      ui: {
        products: Element[];
        containerLeft: HTMLElement | null;
        containerRight: HTMLElement | null;
      };
      activeProduct: Element | null = null;
  
      constructor() {
        this.ui = {
          products: Array.from(document.querySelectorAll('.product')),
          containerLeft: document.querySelector('.product-preview.--left'),
          containerRight: document.querySelector('.product-preview.--right')
        };
        this.init();
      }
  
      init() {
        if (this.ui.containerRight) {
          this.productPreviewLeft = new ProductPreview({
            container: this.ui.containerRight,
            products: this.ui.products.filter((_, i) => i % 4 === 2 || i % 4 === 3)
          });
        }
  
        if (this.ui.containerLeft) {
          this.productPreviewRight = new ProductPreview({
            container: this.ui.containerLeft,
            products: this.ui.products.filter((_, i) => i % 4 === 0 || i % 4 === 1)
          });
        }
  
        this.addEvents();
      }
  
      addEvents() {
        window.addEventListener('resize', () => {
          this.productPreviewRight?.onResize();
          this.productPreviewLeft?.onResize();
        });
  
        this.ui.products.forEach((product) => {
          const preview = this.getProductSide(product);
          product.addEventListener('mouseenter', () => this.productMouseEnter(product, preview));
          product.addEventListener('mouseleave', () => this.productMouseLeave());
        });
      }
  
      getProductSide(product: Element): ProductPreview | null {
        const i = parseInt((product as HTMLElement).dataset.index || '0');
        const isLeft = i % 4 === 0 || i % 4 === 1;
        return isLeft ? this.productPreviewLeft : this.productPreviewRight;
      }
  
      productMouseEnter(product: Element, preview: ProductPreview | null) {
        if (preview) {
          preview.setProduct(product);
          this.activeProduct = product;
  
          if (mainTextElement) {
            shuffleWords(mainTextElement, (product as HTMLElement).dataset.name || '');
          }
        }
      }
  
      productMouseLeave() {
        if (this.activeProduct) {
          const preview = this.getProductSide(this.activeProduct);
          if (preview) {
            preview.setProduct(null);
          }
          this.activeProduct = null;
  
          if (mainTextElement) {
            shuffleWords(mainTextElement, defaultText);
          }
        }
      }
    }
  
    onMount(() => {
      if (projects.length > 0) {
        productGrid = new ProductGrid();
      }
  
      return () => {
        if (shuffleInterval) {
          clearInterval(shuffleInterval);
        }
      };
    });
  </script>
  
  <div class="project-grid-container">
    <div class="main-text">
      <div class="text-content heading" bind:this={mainTextElement} lang="en"></div>
    </div>
  
    <div class="content" style="--grid-width: {gridWidth}; --grid-height: {gridHeight}; --grid-gap: {gridGap}; --grid-position-bottom: {gridPositionBottom};">
      <div class="products">
        <ul class="products__grid">
          {#each projects as project, i}
            <li class="product" data-index={i} data-name={project.title}>
              <img src={project.image.url} alt={project.title} />
            </li>
          {/each}
        </ul>
  
        <div class="products__preview">
          <div class="product-preview --left">
            <div class="product-preview__images">
              {#each projects.filter((_, i) => i % 4 === 2 || i % 4 === 3) as project}
                <img data-id={projects.indexOf(project)} src={project.image.url} alt={project.title} />
              {/each}
            </div>
            <div class="preview-info">
              <div class="product-title heading" lang="en"></div>
            </div>
            <div class="product-preview__inside"></div>
          </div>
  
          <div class="product-preview --right">
            <div class="product-preview__images">
              {#each projects.filter((_, i) => i % 4 === 0 || i % 4 === 1) as project}
                <img data-id={projects.indexOf(project)} src={project.image.url} alt={project.title} />
              {/each}
            </div>
            <div class="preview-info">
              <div class="product-title"></div>
            </div>
            <div class="product-preview__inside"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    .project-grid-container {
      --bg: #ffffff;
      background: var(--bg);
      min-height: 100vh;
      width: 100%;
      position: relative;
      opacity: 0; /* 初期状態は非表示 */
    }
  
    .main-text {
      position: absolute;
      top: auto;
      bottom: 70vh;
      left: 2.75vw;
      z-index: 99;
      pointer-events: none;
    }
  
    .text-content {
      font-size: 64px;
      font-weight: 200;
      line-height: 1.05;
      max-width: 1100px;
      min-height: 173px;
      height: 173px;
      display: flex;
      align-items: flex-end;
      color: #000000;
    }
  
    .content {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      position: absolute;
      top: auto;
      bottom: 0;
      width: 100%;
      background: var(--bg);
      padding-bottom: var(--grid-position-bottom);
    }
  
    .products {
      position: relative;
      height: var(--grid-height);
      width: var(--grid-width);
      max-width: 1800px;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  
    .products__grid,
    .products__preview {
      height: 100%;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
      row-gap: var(--grid-gap);
      column-gap: var(--grid-gap);
    }
  
    .products__grid {
      position: relative;
      list-style: none;
      padding: 0;
      margin: 0;
    }
  
    .products__preview {
      position: absolute;
      inset: 0;
      height: 100%;
      width: 100%;
      pointer-events: none;
      z-index: 2;
    }
  
    .product {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      background-color: #f5f5f5;
      contain: size;
      cursor: pointer;
      overflow: hidden;
    }
  
    .product img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  
    .product-preview {
      height: 100%;
      width: 100%;
      position: relative;
      grid-column: auto / span 2;
      grid-row: 1 / span 2;
      opacity: 0;
    }
  
    .product-preview__inside {
      position: absolute;
      inset: 0;
      height: 100%;
      width: 100%;
      background: var(--bg);
    }
  
    .product-preview__images {
      display: grid;
      grid-template-columns: auto;
      grid-template-rows: auto;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  
    .product-preview__images > :global(img) {
      grid-column: 1;
      grid-row: 1;
      opacity: 0;
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  
    .preview-info {
      z-index: 20;
      position: absolute;
      bottom: 40px;
      left: 40px;
      color: white;
      opacity: 0;
      pointer-events: none;
    }
  
    .product-title {
      font-size: 32px;
      font-weight: 500;
    }
  
    @media (max-width: 1200px) {
      .text-content {
        font-size: 56px;
      }
    }
  
    @media (max-width: 768px) {
      .main-text {
        top: 120px;
        left: 30px;
        right: 30px;
      }
  
      .text-content {
        font-size: 36px;
      }
  
      .content {
        padding-top: 280px;
      }
    }
  </style>