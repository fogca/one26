<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let text = '';
  /** When true, component is in document flow (no fixed positioning) for use in page layouts */
  export let inline = false;
  /** Optional Japanese subtitle rendered directly below the shuffle title. Accepts HTML
   *  (e.g. `<br>`) so callers can hand-break lines. Empty string = no subtitle. */
  export let subtitle = '';

  let textElement: HTMLElement;
  let shuffleInterval: ReturnType<typeof setInterval>;
  // Canonical target text — single source of truth, decoupled from textElement.innerHTML
  // (which may be in a transient half-shuffled state when hover/reshuffle fires).
  let currentTargetText = text;

  // Number of rendered lines = `<br>`-count + 1. Used to reserve a fixed
  // min-height on the text box so the heading never re-flows mid-shuffle
  // (which would push the subtitle up & down). Recomputed if `text` ever
  // changes — Svelte 4 reactive statement keeps it in sync.
  $: lineCount = (text || '').split(/<br\s*\/?\s*>/i).length || 1;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ !./';

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  // Re-run the shuffle to the LAST KNOWN final text. Never reads innerHTML so
  // hovering mid-shuffle won't lock the animation onto a partial state.
  export function reshuffleCurrentText() {
    if (!currentTargetText || currentTargetText.trim().length === 0) return;
    shuffleToText(currentTargetText);
  }

  // Wipe the active span (so the previous page's settled text doesn't linger)
  // and update the canonical target text. Width/height of the box stays
  // reserved by the (hidden) ghost which renders {forText}. The user prefers
  // an empty start over a random-character preview before the shuffle reveal.
  export function setRandom(forText?: string) {
    if (shuffleInterval) clearInterval(shuffleInterval);
    if (forText !== undefined) currentTargetText = forText;
    if (textElement) textElement.innerHTML = '';
  }

  export function shuffleToText(finalText: string, callback?: () => void) {
    if (shuffleInterval) {
      clearInterval(shuffleInterval);
    }

    // Update the canonical target so reshuffleCurrentText() always knows the truth
    currentTargetText = finalText;

    const lines = finalText.split('<br>');
    const allWords = lines.map(line => line.split(' '));
    const revealedCounts = allWords.map(words => words.map(() => 0));

    // Start from empty (no random-character preview). User preference:
    // "0から何もないところからshuffleした方がマシ".
    // The shuffle interval below progressively reveals one char at a time per
    // word; positions ahead of the revealed cursor stay empty.
    if (textElement) textElement.innerHTML = '';

    shuffleInterval = setInterval(() => {
      let allComplete = true;

      const shuffledLines = allWords.map((words, lineIndex) => {
        const shuffledWords = words.map((word, wordIndex) => {
          const revealedCount = revealedCounts[lineIndex][wordIndex];

          if (revealedCount < word.length) {
            allComplete = false;
            revealedCounts[lineIndex][wordIndex]++;
          }

          // Growing-typewriter shuffle: render only [revealed chars] + a single
          // random "shuffle cursor" at the next position. Positions beyond that
          // stay empty (no full-width random characters across the whole word).
          const settled = revealedCounts[lineIndex][wordIndex];
          let result = '';
          for (let i = 0; i < word.length; i++) {
            if (i < settled) {
              result += word[i];
            } else if (i === settled) {
              const c = word[i];
              if (c === ' ') result += ' ';
              else if (c === '!' || c === '.' || c === '/') result += c;
              else result += randomChar();
            }
            // i > settled: leave empty
          }
          return result;
        });

        return shuffledWords.join(' ');
      });

      if (textElement) {
        textElement.innerHTML = shuffledLines.join('<br>');
      }

      if (allComplete) {
        clearInterval(shuffleInterval);
        if (textElement) {
          textElement.innerHTML = finalText;
        }
        if (callback) callback();
      }
    }, 40);
  }

  export function shuffleToEmpty(callback?: () => void) {
    if (!textElement) {
      if (callback) callback();
      return;
    }

    if (shuffleInterval) {
      clearInterval(shuffleInterval);
    }

    // Empty target — reshuffle should not bring back stale text
    currentTargetText = '';

    const currentText = textElement.innerHTML.replace(/<br>/g, ' ');
    const words = currentText.split(' ').filter(w => w.length > 0);
    const revealedCounts = words.map(word => word.length);

    shuffleInterval = setInterval(() => {
      let allComplete = true;

      const shuffledWords = words.map((word, wordIndex) => {
        const revealedCount = revealedCounts[wordIndex];

        if (revealedCount > 0) {
          allComplete = false;
          revealedCounts[wordIndex]--;

          let result = '';
          for (let i = 0; i < word.length; i++) {
            if (i < revealedCounts[wordIndex]) {
              result += word[i];
            } else {
              result += randomChar();
            }
          }
          return result;
        }

        return '';
      });

      if (textElement) {
        textElement.innerHTML = shuffledWords.filter(w => w).join(' ');
      }

      if (allComplete) {
        clearInterval(shuffleInterval);
        if (textElement) {
          textElement.innerHTML = '';
        }
        if (callback) callback();
      }
    }, 30);
  }

  // WELCOMEからWE CREATEへの特別な遷移
  export function shuffleTransition(fromText: string, toText: string, callback?: () => void) {
    if (shuffleInterval) {
      clearInterval(shuffleInterval);
    }

    // Lock the new target before the transition starts
    currentTargetText = toText;

    if (!textElement) {
      if (callback) callback();
      return;
    }
    
    const fromLines = fromText.split('<br>');
    const toLines = toText.split('<br>');
    
    // 最初の行を処理: "WELCOME" → "WE CREATE..."
    const fromFirstLine = fromLines[0] || '';
    const toFirstLine = toLines[0] || '';
    
    // "WE"が共通部分か確認
    const commonPrefix = 'WE';
    let fromRemaining = '';
    let toRemaining = '';
    
    if (fromFirstLine.startsWith(commonPrefix) && toFirstLine.startsWith(commonPrefix)) {
      fromRemaining = fromFirstLine.slice(commonPrefix.length); // "LCOME"
      toRemaining = toFirstLine.slice(commonPrefix.length); // " CREATE VISUAL IDENTITIES THAT"
    } else {
      // 共通部分がない場合は通常のシャッフル
      shuffleToText(toText, callback);
      return;
    }
    
    // 2行目以降は完全に置き換え
    const fromSecondLine = fromLines[1] || '';
    const toSecondLine = toLines[1] || '';
    
    // 通常のshuffleToTextと同じロジック：単語ごとに処理
    // 1行目: "WE" + fromRemainingの単語 → "WE" + toRemainingの単語
    const fromRemainingWords = fromRemaining.split(' ').filter(w => w.length > 0);
    const toRemainingWords = toRemaining.split(' ').filter(w => w.length > 0);
    const fromSecondLineWords = fromSecondLine.split(' ').filter(w => w.length > 0);
    const toSecondLineWords = toSecondLine.split(' ').filter(w => w.length > 0);
    
    // 1行目の"WE"以降の部分のrevealedCounts
    // 減らす場合はword.lengthから開始、増やす場合は0から開始
    const fromRemainingRevealedCounts = fromRemainingWords.map(word => word.length);
    const toRemainingRevealedCounts = toRemainingWords.map(() => 0);
    const fromSecondLineRevealedCounts = fromSecondLineWords.map(word => word.length);
    const toSecondLineRevealedCounts = toSecondLineWords.map(() => 0);
    
    // 状態管理
    let phase: 'removing' | 'adding' = 'removing';
    
    shuffleInterval = setInterval(() => {
      let allComplete = true;
      let currentFirstLine = commonPrefix;
      let currentSecondLine = '';
      
      // フェーズ1: fromRemainingの単語を減らす
      if (phase === 'removing') {
        let fromRemainingComplete = true;
        
        // fromRemainingの各単語を減らす
        const fromRemainingShuffled = fromRemainingWords.map((word, wordIndex) => {
          const revealedCount = fromRemainingRevealedCounts[wordIndex];
          
          if (revealedCount > 0) {
            fromRemainingComplete = false;
            fromRemainingRevealedCounts[wordIndex]--;
            
            let result = '';
            for (let i = 0; i < word.length; i++) {
              if (i < fromRemainingRevealedCounts[wordIndex]) {
                result += word[i];
              } else {
                if (word[i] === '!' || word[i] === '.' || word[i] === '/') {
                  result += word[i];
                } else {
                  result += randomChar();
                }
              }
            }
            return result;
          }
          
          return '';
        }).filter(w => w.length > 0);
        
        if (fromRemainingShuffled.length > 0) {
          currentFirstLine = commonPrefix + ' ' + fromRemainingShuffled.join(' ');
        } else {
          currentFirstLine = commonPrefix;
        }
        
        // 2行目も減らす
        const fromSecondLineShuffled = fromSecondLineWords.map((word, wordIndex) => {
          const revealedCount = fromSecondLineRevealedCounts[wordIndex];
          
          if (revealedCount > 0) {
            fromRemainingComplete = false;
            fromSecondLineRevealedCounts[wordIndex]--;
            
            let result = '';
            for (let i = 0; i < word.length; i++) {
              if (i < fromSecondLineRevealedCounts[wordIndex]) {
                result += word[i];
              } else {
                if (word[i] === '!' || word[i] === '.' || word[i] === '/') {
                  result += word[i];
                } else {
                  result += randomChar();
                }
              }
            }
            return result;
          }
          
          return '';
        }).filter(w => w.length > 0);
        
        if (fromSecondLineShuffled.length > 0) {
          currentSecondLine = fromSecondLineShuffled.join(' ');
        }
        
        if (fromRemainingComplete && fromSecondLineShuffled.length === 0) {
          phase = 'adding';
        }
      }
      
      // フェーズ2: toRemainingの単語を増やす
      if (phase === 'adding') {
        // toRemainingの各単語を増やす
        const toRemainingShuffled = toRemainingWords.map((word, wordIndex) => {
          const revealedCount = toRemainingRevealedCounts[wordIndex];
          
          if (revealedCount < word.length) {
            allComplete = false;
            toRemainingRevealedCounts[wordIndex]++;
            
            let result = '';
            for (let i = 0; i < word.length; i++) {
              if (i < toRemainingRevealedCounts[wordIndex]) {
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
        
        if (toRemainingShuffled.length > 0) {
          currentFirstLine = commonPrefix + toRemainingShuffled.join(' ');
        } else {
          currentFirstLine = commonPrefix;
        }
        
        // 2行目も増やす
        const toSecondLineShuffled = toSecondLineWords.map((word, wordIndex) => {
          const revealedCount = toSecondLineRevealedCounts[wordIndex];
          
          if (revealedCount < word.length) {
            allComplete = false;
            toSecondLineRevealedCounts[wordIndex]++;
            
            let result = '';
            for (let i = 0; i < word.length; i++) {
              if (i < toSecondLineRevealedCounts[wordIndex]) {
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
        
        if (toSecondLineShuffled.length > 0) {
          currentSecondLine = toSecondLineShuffled.join(' ');
        }
      }
      
      // 表示
      if (textElement) {
        const displaySecondLine = currentSecondLine;
        textElement.innerHTML = currentFirstLine + (displaySecondLine ? '<br>' + displaySecondLine : '');
      }
      
      if (allComplete) {
        clearInterval(shuffleInterval);
        if (textElement) {
          textElement.innerHTML = toText;
        }
        if (callback) callback();
      }
    }, 40);
  }

  onMount(() => {
    // 静的ページ用：textが渡されている場合のみ自動表示
    if (text && text.length > 0) {
      shuffleToText(text);
    }
  });

  onDestroy(() => {
    if (shuffleInterval) {
      clearInterval(shuffleInterval);
    }
  });
</script>


<div
  class="shuffle-text"
  class:inline
  role="button"
  tabindex="0"
  aria-label="Reshuffle text animation"
  onmouseenter={reshuffleCurrentText}
  onfocus={reshuffleCurrentText}
  onkeydown={(e) => e.key === 'Enter' && reshuffleCurrentText()}
>
  <!--
    Ghost (visually hidden) renders the FINAL text, reserving exactly the
    width/height needed. The "active" span overlays absolutely on top with
    the in-progress shuffle output. Result: the box never shifts even though
    proportional-width letters fluctuate during the shuffle.
  -->
  <div
    class="text-content heading h1"
    lang="en"
    style:font-family="var(--heading-font)"
    style:--shuffle-lines={lineCount}
  >
    <span class="ghost" aria-hidden="true">{@html currentTargetText}</span>
    <span class="active" bind:this={textElement}></span>
  </div>

  {#if subtitle}
    <p class="subtitle" lang="ja">{@html subtitle}</p>
  {/if}
</div>

<style>
  .shuffle-text {
    position: fixed;
    top: calc(var(--shuffle-height) - (var(--h1-font-size) * 1.2) - 40px);
    top: var(--shuffle-height);
    /*bottom: calc(72vh + 20px);*/
    transform: translateY(0%);
    transform-origin: bottom;
    left: var(--padding);
    z-index: 99;
    pointer-events: auto;
  }

  .shuffle-text.inline {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    z-index: auto;
  }

  /* Grid stack: ghost & active occupy the same single cell, so they share
     line-height/baseline naturally without any flex/absolute baseline math.
     Eliminates the "extra space" line-height looked too tall.

     min-height reserves the full final-text height up-front (line-count
     derived from `<br>`s in the script). Without this the box can render
     shorter for a frame on mount in some browsers — the subtitle below
     then jumps once the ghost's height is honoured. The 1.1em multiplier
     matches the line-height set on .ghost / .active below. */
  .text-content {
    height: auto;
    display: grid;
    grid-template-columns: max-content;
    position: relative;
    min-height: calc(1.1em * var(--shuffle-lines, 1));
  }

  .text-content .ghost,
  .text-content .active {
    grid-area: 1 / 1;
    line-height: 1.1;
    /* ShuffleText reads better in light — pulls from the global token so a
       single change in base.css ripples through every shuffle on the site. */
    font-weight: var(--font-weight-light);
    font-variation-settings: 'wght' var(--font-weight-light);
  }

  .text-content .ghost {
    visibility: hidden;
    pointer-events: none;
  }

  /* Optional Japanese subtitle directly below the title. Sits as a
     supporting line below the shuffle — sized so it reads as a clear
     secondary line without competing with the heading. */
  .shuffle-text .subtitle {
    margin-top: 12px;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
    max-width: 36em;
    font-family: var(--font-jp-main, var(--font-en-main));
    font-size: 16px;
    line-height: 1.725;
    font-weight: var(--font-weight-regular, 420);
    font-variation-settings: 'wght' var(--font-weight-regular, 420);
    letter-spacing: 0.025em;
    color: inherit;
    opacity: 1;
  }

  @media screen and (max-width: 767px) {
    /* On mobile the shuffle title flows with the page (no fixed pinning).
       Left padding pulls the text inline with the menu / hamburger column. */
    .shuffle-text {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      z-index: auto;
      padding: 15vh 0 0 var(--padding);
    }

    /* Inline mode (slug pages) uses no padding — the parent .title-area
       handles spacing through its own padding. */
    .shuffle-text.inline {
      padding: 0;
    }

    .text-content {
      font-size: 28.5px;
      line-height: 1.1;
      width: 100%;
      /* Drop the desktop's max-content track so the grid doesn't force the
         box to the longest line's width on narrow viewports. */
      grid-template-columns: none;
    }

    /* Looser leading on the active span for the multi-line mobile hero copy. */
    .text-content .active {
      line-height: 1.25;
    }
  }


</style>