<script lang="ts">
    import { onMount } from 'svelte';
    import { gsap } from 'gsap';
    import Grid from '$lib/components/Grid.svelte';
    import type { PageData } from './$types';
  
    export let data: PageData;
  
    // microCMSのWork型をGrid用のProject型に変換
    $: projects = data.works.map(work => ({
      id: work.id,
      title: work.title,
      image: {
        url: work.thumbnail?.url || ''
      }
    }));
  
    let showOpening = true;
    let showGrid = false;
    let mainTextElement: HTMLElement;
  
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ !.';
  
    function randomChar() {
      return chars[Math.floor(Math.random() * chars.length)];
    }
  
    function shuffleText(element: HTMLElement, finalText: string, callback?: () => void) {
      const words = finalText.split(' ');
      const revealedCounts = words.map(() => 0);
      let interval: ReturnType<typeof setInterval>;
  
      interval = setInterval(() => {
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
                if (word[i] === '!' || word[i] === '.' || word[i] === '/') {
                  result += word[i];
                } else if (word[i] === ' ') {
                  result += ' ';
                } else {
                  result += randomChar();
                }
              }
            }
            return result;
          }
  
          return word;
        });
  
        element.innerHTML = shuffledWords.join(' ');
  
        if (allComplete) {
          clearInterval(interval);
          element.innerHTML = finalText;
          if (callback) callback();
        }
      }, 40);
    }
  
    function shuffleTextWithBreak(element: HTMLElement, finalText: string, callback?: () => void) {
      const lines = finalText.split('<br>');
      const allWords = lines.map(line => line.split(' '));
      const revealedCounts = allWords.map(words => words.map(() => 0));
      let interval: ReturnType<typeof setInterval>;
  
      interval = setInterval(() => {
        let allComplete = true;
  
        const shuffledLines = allWords.map((words, lineIndex) => {
          const shuffledWords = words.map((word, wordIndex) => {
            const revealedCount = revealedCounts[lineIndex][wordIndex];
  
            if (revealedCount < word.length) {
              allComplete = false;
              revealedCounts[lineIndex][wordIndex]++;
  
              let result = '';
              for (let i = 0; i < word.length; i++) {
                if (i < revealedCounts[lineIndex][wordIndex]) {
                  result += word[i];
                } else {
                  if (word[i] === '!' || word[i] === '.' || word[i] === '/') {
                    result += word[i];
                  } else if (word[i] === ' ') {
                    result += ' ';
                  } else {
                    result += randomChar();
                  }
                }
              }
              return result;
            }
  
            return word;
          });
  
          return shuffledWords.join(' ');
        });
  
        element.innerHTML = shuffledLines.join('<br>');
  
        if (allComplete) {
          clearInterval(interval);
          element.innerHTML = finalText;
          if (callback) callback();
        }
      }, 40);
    }
  
    function startOpeningAnimation() {
      const timeline = gsap.timeline();
  
      timeline
        // 0. 初期状態：全て非表示
        .set(mainTextElement, { innerHTML: '' })
        .set('.project-grid-container', { opacity: 0 })
        .set('.single-cover', { 
          display: 'block',
          opacity: 0,
          scale: 0.95
        })
        .set('.grid-cover:not(.single-cover)', { 
          display: 'none'
        })
        
        // 1. グリッドとカバーを同時に表示開始
        .to('.project-grid-container', {
          opacity: 1,
          duration: 0.01
        })
        .to('.single-cover', {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out'
        }, '<')
        
        // 2. "WELCOME / Kazuki Kaneko / one inc." シャッフル表示（空から）
        .call(() => {
          if (mainTextElement) {
            shuffleTextWithBreak(mainTextElement, 'WELCOME<br>Kazuki Kaneko / one inc.');
          }
        }, null, '+=0.3')
        
        // 3. 1.5秒後にgridに分割
        .set('.single-cover', {
          display: 'none',
          delay: 1.5
        })
        .set('.grid-cover:not(.single-cover)', { 
          display: 'grid'
        })
        .set('.cover-tile', { 
          opacity: 1
        })
        
        // 4. "WE CREATE..." にシャッフル & gridが消えて画像が見える
        .call(() => {
          if (mainTextElement) {
            shuffleText(mainTextElement, 'OPT FOR A NOVEL <br>EXPERIENCE');
          }
        })
        .to('.cover-tile', {
          opacity: 0,
          duration: 0.8,
          stagger: {
            amount: 0.6,
            from: 'random'
          },
          ease: 'power2.inOut',
          onComplete: () => {
            showOpening = false;
            showGrid = true;
          }
        }, '-=0.2');
    }
  
    onMount(() => {
      if (projects.length >= 8) {
        startOpeningAnimation();
      }
    });
  </script>
  
  <svelte:head>
    <title>Kazuki Kaneko / one inc.</title>
  </svelte:head>
  
  <div class="page">
    {#if showOpening}
      <!-- Opening Animation - Grid Cover Only -->
      <div class="opening-overlay">
        <!-- 1枚の大きい平面 -->
        <div class="grid-cover single-cover"></div>
        
        <!-- 分割されたgrid -->
        <div class="grid-cover">
          {#each Array(8) as _, i}
            <div class="cover-tile"></div>
          {/each}
        </div>
      </div>
    {/if}
  
    {#if projects.length >= 8}
      <Grid
        {projects}
        gridWidth="94vw"
        gridHeight="60vh"
        gridGap=".25vw"
        gridPositionBottom="3vw"
        moveDistance=".75vw"
        defaultText="OPT FOR A NOVEL <br>EXPERIENCE"
        {showGrid}
        bind:mainTextElement
      />
    {:else}
      <div class="error-message">
        <p>Not enough works to display grid (need 8, found {projects.length})</p>
        <p>Please add more works with thumbnails in microCMS.</p>
      </div>
    {/if}
  </div>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
      font-weight: 300;
    }
  
    .page {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }
  
    /* Opening Animation */
    .opening-overlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      pointer-events: none;
    }
  
    /* Grid Cover - 現在のグリッド位置に合わせる */
    .grid-cover {
      position: absolute;
      bottom: 3vw;
      left: 50%;
      transform: translateX(-50%);
      width: 94vw;
      height: 60vh;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 0.25vw;
    }
  
    .grid-cover.single-cover {
      display: block;
      background: #D8DEE3;
      gap: 0;
    }
  
    .cover-tile {
      background: #D8DEE3;
      width: 100%;
      height: 100%;
    }
  
    /* Error Message */
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 60px;
      text-align: center;
    }
  
    .error-message p {
      font-size: 18px;
      margin: 10px 0;
    }
  
    @media (max-width: 768px) {
      .grid-cover {
        width: 90vw;
      }
    }
  </style>