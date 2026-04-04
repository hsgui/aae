---
name: md2wechat-best-practices
description: >-
  Best practices for md2wechat on WeChat Official Accounts: API vs AI mode,
  inspect → upload_image → HTML → create_draft JSON, DUPLICATE_H1 fixes, and
  WeChat-safe HTML (inline CSS, mmbiz URLs, <br/> inside pre, card layout instead
  of tables, URL as span, spacing). Use when publishing 公众号 drafts, running
  inspect --strict, assembling draft.json, or tuning mobile layout. Pair with
  the md2wechat skill for CLI details. Chinese triggers：md2wechat 最佳实践、草稿上传、
  DUPLICATE_H1、公众号 HTML、表格改卡片。
---

# MD2WeChat — WeChat MP best practices

Use **with** the **md2wechat** skill for flags, config discovery (`capabilities --json`), themes, and writers. This file is **field-guide** content for **公众号** publishing and **AI-mode / hand-built HTML** quality.

## 1. Conversion mode

### API mode (`--mode api`)

- Needs an **md2wechat API key** (e.g. **¥129** tier — confirm current price and purchase via [md2wechat.com/contact](https://md2wechat.com/contact)).
- Set **`api.md2wechat_key`** in `~/.config/md2wechat/config.yaml` (see md2wechat skill for full config order).

### AI mode (`--mode ai`)

- **No** md2wechat API key for conversion itself; CLI often returns **`action_required`** — **you or the Agent** produce **WeChat-compatible HTML**, then upload via **`create_draft`**.
- Use when there is **no API key**, or when you need **fully custom** layout (e.g. card stacks, spacing tuned for phones).

**Markdown content habits** (both modes where applicable): opening **问题 → 方案 → 读完收获** with real bullets; settings as **名称 → 值 → 说明** vertical stacks; tool lists with **必装 / 推荐 / 可选** tags — see §7.

## 2. AI mode — end-to-end draft workflow

```text
1. md2wechat inspect article.md --draft --cover cover.png --json
   → validate metadata, images, draft readiness

2. md2wechat upload_image cover.png --json
   md2wechat upload_image inline-image.png --json
   → upload each asset; collect wechat_url and media_id

3. Generate HTML yourself (or via Agent): replace image src with wechat URLs from step 2

4. Build draft JSON (§3)

5. md2wechat create_draft draft.json --json
   → upload draft to the Official Account

6. In WeChat backend: open draft → preview on phone → publish when satisfied
```

Optional: **`md2wechat convert article.md --mode ai --preview`** (and `--theme`) to pull **themed prompts** for an external model — still ends in **HTML you control** before `create_draft` if you use that path.

## 3. `create_draft` JSON shape

```json
{
  "articles": [{
    "title": "文章标题",
    "author": "",
    "digest": "摘要（最多120字）",
    "thumb_media_id": "封面图的 media_id（upload_image 返回）",
    "content_source_url": "",
    "need_open_comment": 0,
    "only_fans_can_comment": 0,
    "content": "<div>...完整 HTML...</div>"
  }]
}
```

## 4. `DUPLICATE_H1` (`inspect --strict`)

**Symptom**: `DUPLICATE_H1: Body H1 matches the final article title`.

**Cause**: md2wechat derives the article title from **frontmatter `title`** and/or the **first body `#`**. If both exist and match, it flags duplicate.

**Fix (pick one)**:

- **Recommended**: set **`title`** in frontmatter, then **remove** the same line as **`# title`** from the body.
- Or: **omit** frontmatter `title` and keep a single **`#`** title in the body.

## 5. WeChat HTML — hard rules

1. **Inline CSS only** — no `<style>` blocks, no external stylesheets.
2. **Every `<p>` needs explicit `color`** — the client resets color otherwise.
3. **Outer wrapper** — use a root `<div>` for background, font-family, base font-size if needed.
4. **Images** — `src` must be **WeChat CDN** (`mmbiz.qpic.cn` …). Local or remote files go through **`upload_image`** first; use returned URLs in HTML.
5. **Generally safe tags** (still validate against current WeChat docs): `p`, `br`, `strong`, `em`, `a`, `h1`–`h6`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `table`, `section`, `span`, `img`.
6. **Avoid**: `script`, `iframe`, `form`, and **`position: fixed` / `absolute`** in CSS.

## 6. HTML pitfalls (mobile + WeChat renderer)

### 6.1 Code blocks — newlines lost in `<pre><code>`

WeChat may **ignore `\n`** inside `<pre>`, collapsing lines.

**Fix**: use **`<br/>`** instead of raw newlines inside the code string:

```html
<pre><code>raw/    ← 原料<br/>wiki/   ← 编译结果<br/>outputs/ ← 产出</code></pre>
```

### 6.2 Tables on phone — prefer cards, not `<table>`

**Symptom**: ~375px width, three columns ≈ ~100px each; Chinese breaks **per character** (“原 料 区”).

**Fix**: **do not rely on `<table>`** for main content. Use **stacked `<section>` cards** — one block per row of information (tools, settings, steps).

Example pattern:

```html
<section style="background:#f5f0e8;border-radius:8px;padding:14px 16px;margin:8px 0;">
  <p style="margin:0 0 4px;color:#3b3b3b;">
    <strong style="color:#d4a574;">原料区</strong>
    <code style="...">raw/</code>
  </p>
  <p style="color:#3b3b3b;font-size:15px;margin:0 0 12px;">
    你的「源代码」—— 剪藏、论文、原始笔记
  </p>
</section>
```

Priority chips (tools):

```html
<span style="background:#d4a574;color:#fff;font-size:12px;padding:2px 8px;border-radius:10px;">必装</span>
```

**Last resort** if a table must exist: `table-layout: auto`; short label columns with `white-space: nowrap`; shorten first-column text (e.g. “Web Clipper” not the full product sentence).

### 6.3 External links not clickable

`<a href="https://...">` often **does not navigate** like a normal browser.

**Fix**: show **full URL as plaintext** in a `<span>` (copy-friendly):

```html
<span style="color:#576b95;">github.com/hsgui/aae</span>
```

### 6.4 Spacing — workable defaults (tune per theme)

| Element | Suggested margin / padding |
|---------|-----------------------------|
| Section divider block | `margin: 14px 0 10px` |
| `h2` | `margin: 14px 0 8px` |
| Between card `<section>`s | `margin: 8px 0` |
| Body `<p>` bottom | `margin-bottom: 12px` (plus explicit `color`) |
| `blockquote` | `margin: 8px 0` |
| Card inner padding | `padding: 14px 16px` |

## 7. Markdown content structure (before HTML)

- **Opening**: **问题 → 方案 → 读完收获** with `-` / `*` bullets for takeaways.
- **Settings**: per item, **名称 → 值 → 说明** (three lines), not one cramped table cell.
- **Tools**: label **必装 / 推荐 / 可选** where it helps scanning.

## 8. Quick command cheat sheet

```bash
# Validate article + draft metadata
md2wechat inspect article.md --draft --cover cover.png --json

# Upload images (cover + inline)
md2wechat upload_image cover.png --json
md2wechat upload_image diagram.png --json

# Build HTML (Agent or manual) → wrap in draft.json → upload
md2wechat create_draft draft.json --json
```

## 9. Agent checklist

- [ ] Chose **API** (key in config) vs **AI** (`action_required` + custom HTML + **`create_draft`**).
- [ ] Ran **`inspect … --json`**; resolved **`DUPLICATE_H1`** if `--strict` complains.
- [ ] Every image: **`upload_image`**, HTML uses **mmbiz** URLs.
- [ ] **`draft.json`** matches §3; **`digest` ≤ 120** chars; **`thumb_media_id`** from cover upload.
- [ ] HTML: **inline styles**, **`color` on `<p>`**, **`<br/>` in `<pre><code>`** if needed.
- [ ] **No layout tables** for phone-heavy content — **card `<section>`s**; links as **`<span>` URLs** where needed.
- [ ] Spacing roughly follows §6.4; preview on **real phone** in draft box before publish.
