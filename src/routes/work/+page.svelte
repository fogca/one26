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

  // Desktop only: scroll depth + direction drive the column count.
  // Scrolling DOWN:  5 at the very top -> 4 the instant you scroll ->
  //                  3 from half a viewport deep.
  // Scrolling BACK:  4 the instant you reverse -> 5 within half a viewport
  //                  of the top.
  // A manual Size click takes over and stops the scroll driving.
  let scrollDriven = true;

  // Thresholds are ABSOLUTE scroll depth, not a fraction of the page: each
  // column switch changes the masonry height, so ratio-based progress feeds
  // back on itself and cascades through the sizes. Absolute scrollY doesn't
  // move when the layout reflows.
  const TOP_PX = 1; // within 1px of the top -> 5 cols
  const DEEP = 0.5; // half a viewport — 3 cols below this (down) / 5 above (back)

  // Direction detection with a deadband so trackpad inertia jitter (a few px
  // of reverse at the end of a fling) doesn't flip the layout.
  const DIR_DEADBAND_PX = 12;
  let lastScrollY = 0;
  let scrollDir: 'down' | 'up' = 'down';

  function desiredSizeFromScroll(): string {
    const vh = window.innerHeight;
    const y = window.scrollY;
    const dy = y - lastScrollY;
    if (Math.abs(dy) >= DIR_DEADBAND_PX) {
      scrollDir = dy < 0 ? 'up' : 'down';
      lastScrollY = y;
    }
    if (y < TOP_PX) return '5';
    if (scrollDir === 'down') return y >= DEEP * vh ? '3' : '4';
    // scrolling back up
    return y < DEEP * vh ? '5' : '4';
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

  // Frontier Fence: container-height ease on grow transitions (see
  // changeGridSize). Killed whenever layoutMasonry writes fresh truth
  // (e.g. the resize path) so a stale tween can't fight the new layout.
  let heightTween: gsap.core.Tween | null = null;

  // Bottom-anchored shrink (see changeGridSize): how far the new layout is
  // currently pushed down so its bottom edge matches the pre-shrink one.
  let pendingBottomOffset = 0;

  // Remove the baked offset in a single pixel-identical frame: items, the
  // container height and scrollY all shift by the same amount together, so
  // nothing on screen moves. No layout reads between the writes and the
  // scrollTo, so the browser cannot clamp in between.
  function normalizeBottomOffset() {
    if (!pendingBottomOffset || !browser) return;
    const O = pendingBottomOffset;
    pendingBottomOffset = 0;
    const container = document.getElementById('grid-gallery');
    if (!container) return;
    // Capture the scroll position BEFORE any mutation: the height shrink
    // below makes the browser clamp scrollY, and that clamp is reflected in
    // window.scrollY reads within the SAME frame — computing the target from
    // a post-mutation read double-applies the shift (observed: 6280 read
    // back as 3382 right after the height write).
    const y0 = window.scrollY;
    document.querySelectorAll('.grid_gallery_item').forEach((it) => {
      const el = it as HTMLElement;
      el.style.top = `${parseFloat(el.style.top) - O}px`;
    });
    container.style.height = `${parseFloat(container.style.height) - O}px`;
    window.scrollTo(0, Math.max(0, y0 - O));
    lastScrollY = window.scrollY;
  }

  // Masonryレイアウトを計算（絶対配置 - 0px誤差）
  function layoutMasonry() {
    if (!browser) return;

    if (heightTween) {
      heightTween.kill();
      heightTween = null;
    }
    // Fresh layout rewrites every item top — any pending bottom-anchor
    // offset is superseded (resize path; changeGridSize normalizes first).
    pendingBottomOffset = 0;

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

    // Start from a normalized coordinate system (no-op unless a
    // bottom-anchored shrink is still pending).
    normalizeBottomOffset();

    const container = document.getElementById('grid-gallery');
    const oldContainerH = container?.offsetHeight ?? 0;
    const preY = window.scrollY;
    const vh = window.innerHeight;

    // Freeze the container extent BEFORE relayout. A shrinking relayout
    // otherwise lets the browser force-clamp scrollY to the new shorter max
    // in the same frame — an un-animated viewport teleport. With min-height
    // pinned, nothing can clamp while we decide below how to release.
    if (container) container.style.minHeight = `${oldContainerH}px`;

    // Step 1: 現在の状態を保存
    const state = Flip.getState(allGridItems);

    // Step 2: サイズ変更してレイアウト再計算
    currentGridSize = newSize;
    layoutMasonry();

    if (container) {
      // offsetHeight would report max(height, minHeight) — read the value
      // layoutMasonry actually wrote.
      const newContainerH = parseFloat(container.style.height) || container.offsetHeight;

      if (newContainerH > oldContainerH) {
        // ── Frontier Fence (grow side) ──
        // Growing hands the browser ~2900px of EMPTY scrollable land in one
        // frame while items need ~1.8s (1.5s + 0.3s stagger tail) to travel
        // there — scrolling into it mid-morph shows white. Don't grant the
        // land up front: hold the old height and ease it to the new height
        // on the morph's own clock, delayed by the stagger amount so the
        // frontier never outruns the latest-staggered items. Nothing visible
        // changes mid-page (the frontier is below the fold) and scrollY is
        // never written, so the direction detector sees only real input.
        container.style.minHeight = '';
        container.style.height = `${oldContainerH}px`;
        heightTween = gsap.to(container, {
          height: newContainerH,
          duration: 1.5,
          ease: 'power4.inOut',
          delay: 0.3,
          onComplete: () => {
            heightTween = null;
          }
        });
      } else {
        const shrink = oldContainerH - newContainerH;
        const docHAfterRelease = document.documentElement.scrollHeight - shrink;
        if (preY <= docHAfterRelease - vh) {
          // Mid-page shrink: current position survives the new layout, so
          // releasing the freeze cannot clamp. Behaves exactly like before.
          container.style.minHeight = '';
        } else {
          // ── Bottom-anchored shrink ──
          // The current scroll position does NOT exist in the shorter
          // layout. Instead of letting the browser clamp (teleport), bake a
          // uniform offset into the NEW layout so its bottom edge lines up
          // with the old one: every item's final `top` gets +shrink and the
          // container keeps the old height. No scrollY write, no clamp, no
          // transform layering — Flip just morphs the visible bottom rows a
          // short distance while the empty strip sits ABOVE the content,
          // ~3 viewports off-screen. normalizeBottomOffset() later removes
          // the strip in a pixel-identical frame (content and scrollY move
          // together), so the coordinate system heals invisibly.
          for (const it of Array.from(allGridItems)) {
            const el = it as HTMLElement;
            el.style.top = `${parseFloat(el.style.top) + shrink}px`;
          }
          container.style.height = `${oldContainerH}px`;
          container.style.minHeight = '';
          pendingBottomOffset = shrink;
        }
      }
    }

    // Step 3: GSAP Flipでアニメーション（ゆっくり・ふわっと：    // Step 3: GSAP Flipでアニメーション（ゆっくり・ふわっと：
    // 長め duration + 柔らかい ease + ごく僅かな stagger）
    Flip.from(state, {
      duration: 1.5,
      ease: 'power4.inOut',
      // Fixed TOTAL spread, not a per-item delay — this grid can have 70+
      // items, and `stagger: 0.02` (each-item mode) scaled with item count
      // to a ~3s animation. That long a window meant every scroll-driven
      // size change requested while it played got dropped (see the guard
      // above), so fast scrolling skipped straight past intermediate column
      // counts. `amount` caps the whole cascade at 0.3s regardless of count.
      stagger: { amount: 0.3 },
      absolute: true, // 絶対配置を考慮
      onComplete: () => {
        // Heal the bottom-anchored coordinate system first — pixel-identical
        // (content and scrollY shift together), so it is invisible whenever
        // the empty strip is off-screen, which it is except after an extreme
        // fling during the 1.8s morph.
        normalizeBottomOffset();
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

    // .works-page's own overflow-anchor:none only removes ITS subtree from
    // anchor candidacy — the layout's footer below it still qualifies, and
    // when normalizeBottomOffset() shrinks the container the browser then
    // "helpfully" scrolls by the same amount again to keep the footer
    // stationary, double-applying the correction. Kill anchoring for the
    // whole document while this page lives.
    const prevOverflowAnchor = document.documentElement.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = 'none';

    // Desktop starts wide (5 cols) — set BEFORE the first layout so the page
    // doesn't visibly flip right after load. Mobile keeps 3.
    if (window.innerWidth >= 768) currentGridSize = '5';

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
      document.documentElement.style.overflowAnchor = prevOverflowAnchor;
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
    <!-- View row: single link to the other view (current page not shown) -->
    <div class="opt-row">
      <div class="opt-values">
        <a href="/work/list" class="opt-item solo">
          View as List
          <!-- Same chevron as the home "Work Archives" link, scaled to 13px text -->
          <svg class="opt-arrow" viewBox="0 0 50 93" fill="currentColor" aria-hidden="true">
            <path
              d="M0 7.05L5.82 0C5.82 0 13.5 11.48 24.98 22.96C36.46 34.44 49.54 47.23 49.54 47.23C49.54 47.23 38.83 55.65 26.13 68.35C13.43 81.05 5.66 92.31 5.66 92.31L0.11 84.51L22.93 62.39C32.16 53.16 37.3 46.9 37.3 46.9C37.3 46.9 29.58 36.82 20.63 27.88L0 7.05Z"
            />
          </svg>
        </a>
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
    /* The scroll-driven column switch relays out every masonry item at once.
       Browser scroll anchoring then "follows" an anchor item to its new
       position and yanks scrollY — disable it for this page's content. */
    overflow-anchor: none;
  }

  .options_grid_container {
    /* Sits right under the fixed "Work Archives" title (ShuffleText:
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
    /* The nav is absolutely positioned (out of flow), so .works-page's own
       padding-top is what actually reserves the grid's start position —
       it must clear the nav's own top offset + rendered height + the 40px
       gap the nav should have above the grid. */
    .works-page {
      padding-top: 80px;
    }

    /* Mobile: the shuffle title is in normal flow here (it scrolls with the
       page), so anchor the nav absolutely at the top of .works-page — that
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

    /* Drop the desktop-only 70% inset on mobile — full bleed */
    .grid_gallery_container {
      width: 100%;
      margin-left: 0;
    }
  }
</style>