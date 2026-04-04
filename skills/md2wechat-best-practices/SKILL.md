---
name: md2wechat-best-practices
description: >-
  Best practices for WeChat Official Account articles when using the md2wechat
  workflow—mobile-first layout (cards vs cramped tables), opening hook structure,
  vertical setting rows, link handling, and table CSS. Use when converting or
  drafting Markdown for 微信公众号 with md2wechat, fixing phone layout, replacing
  multi-column tables with cards, or when the user mentions md2wechat together with
  排版、表格、手机端、外链、GitHub. Prefer md2wechat convert with --mode ai when
  applying these practices. Chinese triggers：微信公众号排版、md2wechat、表格改卡片、外链明文。
---

# MD2WeChat — WeChat MP layout best practices

Use this skill **together with** the **md2wechat** skill. When the user wants these layout rules applied, run conversion (or regenerate HTML) with **AI mode**:

```bash
md2wechat convert <article.md> --mode ai --preview
```

Add `--theme <name>` if the user already chose a theme. **Do not** assume API-only conversion will implement card layouts or custom CSS; **AI mode** is where themed prompts steer the model toward the patterns below.

## Goals (mobile first)

WeChat readers are mostly on phones. **Three-column tables** become unreadable when squeezed. Prioritize **vertical stacking**, **scannable openings**, and **copy-friendly URLs**.

## 1. Article opening — 问题 → 方案 → 读完收获

Structure the **first three blocks** (before the main body) so readers decide in seconds whether to scroll:

1. **问题** — What pain or question the article addresses (short paragraph or lead).
2. **方案** — What approach or tool stack you use (short).
3. **读完收获** — Bullet list of concrete takeaways (“读完后你能…”).

Use real bullets (`-` / `*`) in Markdown so they survive conversion and stay scannable on mobile.

## 2. Tables → card layout (default preference)

**Prefer not** to ship wide comparison tables for phone readers. Instead:

- **One card per row of information**: stack blocks vertically; each card holds one logical item (e.g. one tool, one setting group, one step).
- **Rounded card look** in HTML/CSS: use the AI prompt output to apply consistent padding, border-radius, and spacing between cards (follow the active md2wechat theme).
- **Tool / software lists**: tag each entry with priority labels the reader can scan quickly, e.g. **必装** / **推荐** / **可选** (use a single label per item, or a clear legend once at the top).

When a table is unavoidable, still **minimize columns** and keep **one primary idea per row**.

## 3. Settings and key-value content — 名称 → 值 → 说明

For configuration, options, or “field / meaning” content, use **three lines per item**, stacked vertically inside a card (or block):

1. **名称** — setting or field name  
2. **值** — current value, default, or recommended value  
3. **说明** — one or two lines of context  

Avoid cramming name + value + long text into a single table cell.

## 4. When tables remain — avoid ugly line breaks

If the generated HTML still uses `<table>`:

- Set **`table-layout: auto`** on the table so columns can size from content.
- For **short text columns** (分区名、工具名、文件夹名、命令名等), apply **`white-space: nowrap`** so Chinese is not broken **character-by-character** across lines.
- **First column copy**: shorten labels (e.g. “Obsidian Web Clipper” → “Web Clipper”) so the narrow column does not force bad wrapping.

## 5. External links — show full URL as plain text

WeChat Official Accounts **do not** behave like a normal browser for external links. Treat links as **non-clickable, copy-friendly plaintext**:

- Replace clickable `<a href="...">` wrappers for repo and doc URLs with **`<span>` (or plain text)** showing the **full URL** string.
- Examples of acceptable display forms: `github.com/hsgui/aae`, `github.com/hsgui/aae/blob/master/README.md` — reader can **long-press / select / copy**.
- Keep the same rule for other external destinations unless the user explicitly needs a different policy for a specific campaign.

## 6. Agent checklist (before handing off to md2wechat)

Copy mentally or into a short note:

- [ ] Opening follows **问题 → 方案 → 读完收获** with a **bullet** takeaway list.
- [ ] Multi-column Markdown tables **replaced or redesigned** as **vertical cards** where possible; tool rows use **必装 / 推荐 / 可选** when relevant.
- [ ] Settings use **名称 → 值 → 说明** stacks, not dense grid cells.
- [ ] Any remaining tables: **`table-layout: auto`**, **`nowrap`** on short identifier columns, **short first-column labels**.
- [ ] GitHub and external repo/doc URLs: **full URL visible**, **not** relied upon as working hyperlinks inside the MP viewer.
- [ ] Conversion path uses **`md2wechat convert … --mode ai`** so the theme/prompt pipeline can encode the above.

## Coordination with md2wechat

- For CLI flags, config paths, themes, and `capabilities --json`, follow the **md2wechat** skill.
- This skill does **not** replace md2wechat; it constrains **content shape** and **HTML/CSS expectations** for 公众号 mobile reading.
