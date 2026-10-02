---
# Tokens: shared visual values used by styles.css.
color-primary: "#1F3A5F"
color-accent: "#FFD700"
color-background: "#FFFFFF"
color-text: "#1A1A1A"
font-body: "Arial"
font-heading: "Times New Roman"
font-size-min: 12px
space-unit: 8px
radius: 4px
---

# STYLE.md

## Rationale

- **color-primary**: Navy carries headings, controls, and the results surface, and has 11.48:1 contrast against white.
- **color-accent**: Yellow marks decorative emphasis and is paired with navy text because yellow on white is only 1.40:1.
- **color-background**: White is the page and input surface so the dark text tokens have predictable contrast.
- **color-text**: Near-black is the default reading color and has 17.40:1 contrast against white.
- **font-body**: Arial keeps form labels, instructions, and result details familiar and readable.
- **font-heading**: Times New Roman distinguishes headings from the Arial interface copy without adding another typeface.
- **font-size-min**: 12px is the smallest permitted text size for compact labels and metadata.
- **space-unit**: 8px sets a consistent base for control gaps and compact spacing.
- **radius**: 4px gives controls and panels a restrained corner radius without changing their stable geometry.

## Text Contrast

Ratios use the WCAG relative-luminance formula; small text requires at least 4.5:1.
Normalize each 8-bit sRGB channel `c` to the range 0-1, then linearize it as
`c / 12.92` when `c <= 0.04045`, or `((c + 0.055) / 1.055)^2.4` otherwise.
For the linearized channels, calculate luminance as
`L = 0.2126R + 0.7152G + 0.0722B`; the contrast ratio is
`(Llighter + 0.05) / (Ldarker + 0.05)`.

| Foreground | Background | Ratio | Use |
|---|---|---:|---|
| `#1A1A1A` | `#FFFFFF` | 17.40:1 | Default body and heading text; pass |
| `#1F3A5F` | `#FFFFFF` | 11.48:1 | Secondary text and labels; pass |
| `#FFFFFF` | `#1F3A5F` | 11.48:1 | Primary button and results panel text; pass |
| `#1F3A5F` | `#FFD700` | 8.19:1 | Text on accent highlights and validation messages; pass |

Yellow text on white is 1.40:1 and fails; yellow is never used as a text color.

## Refusals

Things this interface will not do, and the Law of UX behind each refusal.

1. *The system will not show more than three generated role suggestions at once; limiting simultaneous choices reduces decision time under Hick's Law.*
2. *The system will not place validation feedback far from the field it describes; grouping the message with its cause follows the Law of Proximity.*

## Sources

**This was delegated by Copilot and manually checked later on**
- Admired: *N/A; current tokens are retained for this assignment.*
- Resented: *N/A; refusals describe this interface's own interaction rules.*
