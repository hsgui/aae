---
name: llm-kb-publish
description: "从 wiki 知识库中围绕某个主题聚合素材、生成发布级文章草稿，支持多平台适配（微信公众号/小红书等），并追踪发布状态。当用户想把 wiki 中的知识整理成可发布的文章、管理发布看板、或将文章发布到各平台时使用此 skill。Chinese triggers: 发布文章、写公众号、整理成文章、发布看板、小红书笔记、输出到公众号。"
---

# LLM KB — Publish

将 `wiki/` 知识库中的内容聚合、提炼、再创作为面向读者的发布级文章，管理发布流水线，并对接各平台发布工具。

## 核心原则

- **wiki 是素材仓库，publish 是消费侧。** 发布相关的一切都在 `outputs/articles/`，wiki 不感知发布的存在。
- **一篇文章 = 一个 Markdown 文件。** frontmatter 管元数据，正文就是内容本身。不要为一篇文章创建文件夹。
- **同一选题、不同平台 = 不同文件。** 微信长文和小红书笔记是不同的内容物种，不是改短的关系。
- **反馈环：发布反哺知识库。** 写作过程中产生的新洞察应回写 wiki。

## 目录结构

```
outputs/
├── articles/
│   ├── board.md                              ← 发布看板（全局状态一览）
│   ├── 2026-04-11-仓位管理的生死线-wechat.md   ← 微信公众号版
│   ├── 2026-04-11-仓位管理的生死线-xhs.md      ← 小红书版
│   └── ...
├── qa/          ← 已有的问答沉淀（不动）
├── health/      ← 已有的健康检查（不动）
└── figures/     ← 已有的图表（不动）
```

## 文章模板

每篇文章是一个 Markdown 文件，所有元数据放 frontmatter：

```markdown
---
title: "文章标题"
status: idea             # idea → drafting → review → published
platform: wechat         # wechat | xiaohongshu | twitter
series:                  # 可选，系列名
series_order:            # 可选，系列中的顺序
created: YYYY-MM-DD
published_at:            # 发布后回填日期
published_url:           # 发布后回填链接
sources:                 # 写作引用的 wiki 素材
  - wiki/concepts/凯利公式与仓位管理
  - wiki/summaries/05-赌徒的最后一道防线-凯利公式的仓位哲学-summary
---

# 文章标题

（正文）
```

## 看板模板 — `outputs/articles/board.md`

```markdown
---
updated: YYYY-MM-DD
---

# 发布看板

## Ideas
- [[outputs/articles/YYYY-MM-DD-slug-platform]] — 一句话说明

## Drafting
-

## Review
-

## Published
-
```

每次创建、更新或发布文章后，同步更新 board.md。

## 工作流

### Phase 1 — 选题与素材收集

**触发方式（任选其一）：**

a) 用户指定主题关键词：
   > "把 wiki 中关于凯利公式和仓位管理的内容整理成公众号文章"

b) 用户指定 wiki 文件：
   > "基于 [[concepts/凯利公式与仓位管理]] 和 [[concepts/波动率税]] 写一篇文章"

c) 用户从 board.md 中选取一个 idea：
   > "把看板里的那篇仓位管理开始写"

**执行步骤：**

1. 读 `wiki/index.md`，定位相关的 concepts 和 summaries。
2. 读取这些文件，提取核心内容。
3. 如果需要更深的素材，跟踪 wikilinks 读取更多文件。
4. 确认目标平台（默认 wechat）。
5. 创建文章文件，status 设为 `idea`，sources 列出已收集的素材。
6. 更新 board.md。

### Phase 2 — 生成初稿

根据目标平台，使用对应的风格模板生成初稿。

**平台风格指南：**

#### 微信公众号 (wechat)

| 维度 | 要求 |
|------|------|
| 长度 | 2000–5000 字 |
| 结构 | 标题 → hook 开头 → 小标题分段 → 总结 |
| 语气 | 深度但不学术，有故事感，可以用类比 |
| 开头 | 用故事、数据或反常识引入 |
| 结尾 | 有 takeaway，可加互动引导 |

#### 小红书 (xiaohongshu)

| 维度 | 要求 |
|------|------|
| 长度 | 300–800 字 |
| 结构 | hook 第一句 → 短段落 → 要点列表 → 互动引导 |
| 语气 | 像和朋友聊天，口语化，可用 emoji |
| 开头 | 第一句必须是 hook，制造好奇心 |
| 关键词 | 文末加 #标签（3-8 个） |
| 图片 | 需要配图说明（在正文中标注位置） |

**执行步骤：**

1. 基于收集的素材和平台风格，生成完整初稿。
2. 将初稿写入文章文件正文部分。
3. 更新 status 为 `drafting`。
4. 更新 board.md。

### Phase 3 — 自检（Self-verification loop）

初稿生成后，在交给用户前先跑一轮自检：

- [ ] **字数**：是否在目标平台的范围内？
- [ ] **结构**：是否有清晰的开头/主体/结尾？
- [ ] **素材利用**：sources 中列出的素材是否都实际引用了？
- [ ] **hook**：开头是否有足够吸引力？
- [ ] **AI 痕迹**：是否有明显的 AI 套话？（如"在当今..."、"值得注意的是..."、"总而言之..."）
- [ ] **原创性**：是否只是在搬运 wiki 内容，还是有重新组织和再创作？

如果自检发现问题，自动修正后再呈现给用户。

### Phase 4 — 用户审阅

将初稿呈现给用户。用户可以：
- 直接编辑文件
- 提出修改意见让 AI 修改
- 确认满意，进入发布流程

更新 status 为 `review`，更新 board.md。

### Phase 5 — 发布

根据平台调用对应工具：

#### 微信公众号
调用 md2wechat skill：
```bash
md2wechat convert <article>.md --preview    # 先预览
md2wechat convert <article>.md --draft      # 上传草稿箱
```

#### 小红书
（暂无自动化工具，手动复制发布。文件中包含所需的全部内容和格式。）

**发布后：**
1. 更新 frontmatter 中的 `published_at` 和 `published_url`。
2. 更新 status 为 `published`。
3. 更新 board.md。

### Phase 6 — 反馈回写（可选但推荐）

写作过程中如果产生了以下内容，应回写 wiki：

- **新洞察**：发现两个 concept 之间未记录的关联 → 更新相关 concept 文件的 "See also"
- **知识缺口**：发现某个概念 wiki 中解释不足 → 补充 concept 文件
- **新概念**：发现需要一个新的 concept 页面 → 创建并更新 index.md
- **纠错**：发现 wiki 中的事实错误 → 修正

如果回写内容较多，建议之后运行 llm-kb-compile 的 Phase 3（rebuild index）和 Phase 4（backlinks）保持一致性。

## 系列文章

当多篇文章属于同一系列时：

1. 在 frontmatter 中设置相同的 `series` 和递增的 `series_order`。
2. 每篇文章开头可加系列导航：
   ```markdown
   > 本文是「AI量化实战」系列第 3 篇。
   > 上一篇：[[outputs/articles/2026-04-10-凯利公式-wechat]]
   ```
3. board.md 中同一系列的文章应在一起展示。

## 素材收集策略

素材收集分两阶段：

1. **初始收集**（Phase 1）：基于用户指定的主题或文件，从 wiki 中拉取。可以让 AI 推荐相关素材。
2. **写作中发现**（Phase 2-4）：写作过程中发现需要额外素材，随时从 wiki 中补充，并追加到 frontmatter 的 sources 列表。

不要强制"先定素材再写"。允许边写边发现。

## 与其他 skill 的关系

```
raw/ → [llm-kb-compile] → wiki/         (知识层)
                            │
                            │ 单向引用
                            ▼
                       [llm-kb-publish]  ← 本 skill
                            │
                            ▼
                       outputs/articles/ (发布层)
                            │
                            │ 对接平台工具
                            ▼
                       [md2wechat]       → 微信公众号
                       [future adapter]  → 小红书 / Twitter / ...
                            │
                            │ 反馈回写（可选）
                            ▼
                          wiki/          (知识层变得更好)
```

## 质量指南

- 不要做搬运工：文章不是 wiki summaries 的拼接，而是面向读者的再创作。
- 加入你的观点：wiki 是中立的知识整理，文章需要有作者的声音和立场。
- 尊重平台特性：不要用同一篇文章"改短"来适配不同平台。
- 引用但不复制：素材是背景知识，不是要被粘贴的文本。
