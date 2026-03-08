<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let text = '';
  /** When true, component is in document flow (no fixed positioning) for use in page layouts */
  export let inline = false;

  let textElement: HTMLElement;
  let shuffleInterval: ReturnType<typeof setInterval>;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ !./';

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  export function shuffleToText(finalText: string, callback?: () => void) {
    if (shuffleInterval) {
      clearInterval(shuffleInterval);
    }

    const lines = finalText.split('<br>');
    const allWords = lines.map(line => line.split(' '));
    const revealedCounts = allWords.map(words => words.map(() => 0));

    shuffleInterval = setInterval(() => {
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


<div class="shuffle-text" class:inline>
  <div class="text-content heading h1" lang="en" style="font-family: var(--heading-font);" bind:this={textElement}></div>
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
    pointer-events: none;
  }

  .shuffle-text.inline {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    z-index: auto;
  }

  .text-content {
    height: auto;
    display: flex;
    align-items: flex-end;
  }


</style>