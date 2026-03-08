# Design System

This document defines the design system foundation for the entire project. All components and pages should reference these tokens and patterns.

---

## Typography

### Font Sizes

#### Desktop (1024px and above)

| Level | Size | Selectors |
|-------|------|-----------|
| H1 | 42px | `h1`, `.h1` |
| H2 | 24px | `h2`, `.h2` |
| H3 | 18px | `h3`, `.h3` |
| H4 | 13.5px | `h4`, `.h4` |
| H5 | 11.5px | `h5`, `.h5` |
| H6 | 10px | `h6`, `.h6` |
| Body/Paragraph | 13px | `p` |

#### Mobile (767px and below)

| Level | Size | Selectors |
|-------|------|-----------|
| H1 | 32px | `h1`, `.h1` |
| H2 | 18px | `h2`, `.h2` |
| H3 | 14px | `h3`, `.h3` |
| H4 | 12px | `h4`, `.h4` |
| H5 | 10.5px | `h5`, `.h5` |
| H6 | 9px | `h6`, `.h6` |
| Body/Paragraph | 10.5px | `p` |

**Note:** All heading classes are available as both semantic HTML tags (`<h1>`–`<h6>`) and utility classes (`.h1`–`.h6`).

### Typefaces

- **EN Main:** Neue Haas Unica W1G Light (Adobe Fonts)
- **EN Sub:** Neue Haas Unica W1G Regular (Adobe Fonts)
- **JP Main:** Tazugane Gothic Light

### CSS Variables (Typography)

```css
--font-en-main: 'Neue Haas Unica W1G', sans-serif;
--font-en-sub: 'Neue Haas Unica W1G', sans-serif;
--font-jp-main: 'Tazugane Gothic', sans-serif;
--font-weight-light: 300;
--font-weight-regular: 400;
```

---

## Colors

```css
--background: #F7F7F7;
--white: #FFFFFF;
--black: #181818;
--key: #100088;
```

Use these variables for all color decisions. Avoid hardcoded hex values in components.

---

## Responsive Breakpoints

**Desktop First Approach**

| Breakpoint | Media Query | Usage |
|------------|-------------|--------|
| Desktop (default) | — | 1024px and above |
| Tablet | `@media (max-width: 1023px)` | 1023px and below |
| Mobile | `@media (max-width: 767px)` | 767px and below |

```css
/* Desktop (default) - 1024px and above */
/* Base styles target desktop first */

/* Tablet - 1023px and below */
@media (max-width: 1023px) {
  /* Tablet overrides */
}

/* Mobile - 767px and below */
@media (max-width: 767px) {
  /* Mobile overrides */
}
```

---

## Spacing System

### Padding

- **Desktop:** 25px (left and right padding for all layouts except 100vw sections)
- **Mobile:** 15px (left and right padding for all layouts except 100vw sections)

```css
--padding: 25px; /* desktop */

@media (max-width: 767px) {
  :root {
    --padding: 15px; /* mobile */
  }
}
```

### Margin Utilities

**Available values (in pixels):** `1`, `3`, `5`, `8`, `10`, `15`, `20`, `30`, `40`, `60`, `80`, `100`, `120`

**Notation:** Values are 1:1 with pixels (e.g. `mx-15` = 15px).

| Class pattern | Description |
|---------------|-------------|
| `mx-{value}` | margin left and right |
| `my-{value}` | margin top and bottom |
| `mt-{value}` | margin top |
| `mb-{value}` | margin bottom |
| `ml-{value}` | margin left |
| `mr-{value}` | margin right |

**Example:** `mx-15` = 15px margin left and right; `mt-30` = 30px margin top.

---

## Special Utility Classes

### `.bold`

Applies Neue Haas Unica W1G Regular (EN Sub) font weight.

```css
.bold {
  font-family: var(--font-en-sub);
  font-weight: var(--font-weight-regular);
}
```

### `.white`

Sets text color to white.

```css
.white {
  color: var(--white);
}
```

### `.w100`

Full viewport width with negative margin compensation for layout padding.

```css
.w100 {
  width: 100vw;
  margin-left: calc(-1 * var(--padding));
}
```

---

## Implementation Checklist

When implementing the design system in CSS:

1. **CSS custom properties** — Define all colors, spacing, and typography as variables in `:root`.
2. **Base reset/normalize** — Apply consistent box-sizing, margin, and padding reset.
3. **Font-face declarations** — Load custom fonts (Adobe Fonts integration or self-hosted).
4. **Global body styles** — Set default font-family, font-size, color, and background.
5. **Margin utility classes** — Generate `mx-`, `my-`, `mt-`, `mb-`, `ml-`, `mr-` for values: 1, 3, 5, 8, 10, 15, 20, 30, 40, 60, 80, 100, 120.
6. **Heading utility classes** — Implement `.h1`–`.h6` with responsive font sizes for desktop and mobile.

---

## Reference: Full Value List (Margins)

| Value | Pixels |
|-------|--------|
| 1 | 1px |
| 3 | 3px |
| 5 | 5px |
| 8 | 8px |
| 10 | 10px |
| 15 | 15px |
| 20 | 20px |
| 30 | 30px |
| 40 | 40px |
| 60 | 60px |
| 80 | 80px |
| 100 | 100px |
| 120 | 120px |
