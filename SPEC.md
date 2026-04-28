# one2026 — slug page & NextProjectScroll 仕様書

> 作成: Rex / 経由 Sam · 確認用ドキュメント
> ステータス: **draft（実装着手前）**

## A. `/works/[slug]` レイアウト

### コンセプト

EC / プロダクト紹介ページの典型的な **「左 sticky / 右 scroll」** パターン。
左カラム（タイトル・本文）と右カラム（画像群・クレジット）の **底辺が揃う** ように pin を使う。

### DOM 構造（既存）

```
<div class="work-detail-page">
  <div class="work-container">                    ← display: flex
    <aside class="work-info-fixed">…</aside>      ← 左：title / scope / body
    <div class="work-images-scroll">…</div>       ← 右：images + credit
  </div>
  <NextProjectScroll … />                         ← ページ末尾
</div>
```

### 求める挙動（PC）

```
スクロール 0%        50%               100% (= 親.bottom がviewport.bottom)
─────────┬─────────────┬─────────────────┬──────────
[左] title    [左] sticky pin     [左] sticky リリース
[右] image    [右] image          [右] credit
[底辺]                                       ←この瞬間に左・右の底が一致
```

1. ページロード時：両カラムは上端揃いで表示
2. スクロール開始：
   - 右カラムは流れていく（画像群が長い）
   - 左カラムは **`position: sticky; top: 0`** で viewport 上部に lock
3. 右カラムの最後（credit）が viewport 下端に近づき、`.work-container` の bottom が viewport bottom に達した瞬間に sticky が解除される
4. 結果：**左 content の bottom と 右 credit の bottom が同じ高さで揃う**

### 例外

- **左カラムが viewport より長い場合** — 中で `overflow-y: auto` でスクロール可能
- **モバイル** — 1カラム縦並びで sticky 不要

### 必要な CSS 変更

```diff
.work-container {
  display: flex;
+ align-items: flex-start;   /* flex item を stretch せず top 揃え */
  ...
}

.work-info-fixed {
  position: sticky;
  top: 0;
- height: 100vh;
+ max-height: 100vh;          /* 短ければ自身の高さ、長ければ 100vh で内部 scroll */
  overflow-y: auto;
  align-self: flex-start;
  ...
}
```

これだけで「よくある EC/PJ 紹介ページの sticky パターン」になります。

---

## B. NextProjectScroll の仕様

### コンセプト

ページ最下部に到達した後、もう少しスクロールしようとする操作を**追加情報入力**として捕捉し、視覚的にゲージとして表示。100% 蓄積で次 PJ へ自動遷移。

### Layout

```
[ページ通常 content        ]
[ページ通常 content        ]
[NextProjectScroll  50vh   ] ← 余白なし、これがページ末尾
```

- `width: 100vw`
- `height: 50vh`
- `background: #ffffff`
- text-align: left
- `Next Project` (label) + ShuffleText title（左寄せ縦並び）

### 動作

```
ページ普通スクロール
        ↓
ページ最下部に到達（NextProjectScroll の bottom = viewport bottom）
        ↓
ここから先、wheel down 入力は preventDefault で物理的に止まる
        ↓
代わりに wheel deltaY を accumulator に積む
        ↓
グレーで描かれた title が左から var(--key) で塗られていく
        ↓
累積 800px (= completeDistance) で fill 100%
        ↓
goto(href) → 次 PJ へ遷移
        ↓
component は同じインスタンスのまま title prop が更新される
        ↓
$effect が ShuffleText.shuffleToText(newTitle) を呼んで再シャッフル
progress / triggered を 0 にリセット → 次の遷移待機状態
```

### 巻き戻し挙動

- ページ最下部で wheel up（deltaY < 0）→ accumulator が減少 → fill 戻る
- まだ 100% に達していなければ自由にやり直し可能
- 100% 達した瞬間に `triggered = true` でロックして goto

### Props（既定値）

| prop | default | 用途 |
|---|---|---|
| `href` | (必須) | 次PJの URL |
| `title` | `''` | 次PJ の名前（ShuffleText に渡す） |
| `label` | `'Next Project'` | 上に出る小さい caption |
| `hoverLabel` | `'Next Project'` | CustomCursor のピル表示 |
| `completeDistance` | `800` | 100% に必要な wheel 累積 px 数 |

### 内部実装の選択（参考）

**A. wheel preventDefault 方式（採用）** — 余白要素ゼロ・確実・キーボードスクロールには反応しない（PC 想定）
B. CSS scroll-driven animations — 余白要素ゼロだが Safari/Firefox 対応が限定的
C. ScrollTrigger.observe + Lenis.stop — pin 不要だがライブラリ依存増

---

## C. 検証チェックリスト

### A. slug page sticky
- [ ] 左カラムが短い PJ で、左 content が viewport top に sticky
- [ ] 左カラムが長い PJ で、内部に scrollbar が出て中で読める
- [ ] 右カラム（画像 + credit）が流れていく間、左は viewport 上部に固定
- [ ] credit がページ末尾に来た瞬間に左の sticky が解除され、左右の bottom が揃う

### B. NextProjectScroll
- [ ] ページ最下部 = NextProjectScroll が viewport 末尾に visible
- [ ] 最下部到達後、wheel down で title が左から染まる
- [ ] 染まり 100% で次 PJ へ遷移
- [ ] 上 wheel で巻き戻し可能（100% 未満時）
- [ ] 次 PJ ロード後：title が新作品に shuffle 切替、progress 0% から
- [ ] 連続遷移してもバグ蓄積なし

### C. 共通 / 背景
- [ ] `<html>` / `<body>` の background は `#ffffff`
- [ ] グレー（`rgba(0, 0, 0, 0.18)`）保持で title が薄くベース表示

---

## 着手順（提案）

1. **A. slug page sticky 調整** — CSS 数行の変更で完了
2. **B. NextProjectScroll** — 既に wheel preventDefault 方式で実装済み、軽い動作確認のみ
3. **C. 検証** — 実機チェックリスト走破

承認いただければ、**A → B 動作確認 → C** の順で進めます。
