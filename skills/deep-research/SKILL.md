---
name: deep-research
description: >-
  Deep-dive into a codebase or folder to understand its architecture,
  functionality, and implementation details. Produces a structured research
  report in research.md. Use when asked to research, analyze, study, or deeply
  understand a codebase, project, or folder.
---

# Deep Research

对目标代码库或文件夹进行深度研究，产出结构化的中文研究报告。

## 触发场景

当用户要求：深入阅读、研究、分析、理解一个代码库或文件夹时，使用此技能。

## 研究流程

### 第一步：确定研究目标

- 如果用户指定了文件夹或代码库路径，以用户指定的为准
- 如果没有指定，默认研究当前打开的项目根目录

### 第二步：全面探索

按以下顺序系统性地阅读和分析：

1. **项目入口与配置** — `package.json`、`pyproject.toml`、`Cargo.toml`、`Makefile`、`CMakeLists.txt`、`BUILD`、`BUILD.bazel`、`WORKSPACE`、`Dockerfile`、`docker-compose.yml` 等依赖与构建配置
2. **文档** — `README.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`docs/` 等已有文档
3. **源码结构** — 递归遍历所有源码目录，理解模块划分
4. **核心模块** — 逐文件深入阅读每个核心模块的实现
5. **入口点与 CLI** — 程序入口、命令行接口、API 暴露方式
6. **测试** — 测试用例揭示的行为规范与边界条件
7. **配置与脚本** — CI/CD、lint、构建脚本等辅助文件

重点关注：
- 模块间的依赖关系和数据流
- 关键设计决策与权衡
- 对外暴露的接口和使用方式
- 异常处理与边界情况
- 代码中的注释、TODO、HACK 等标记

### 第三步：撰写报告

在研究目标的根目录下创建 `research.md`，使用以下模板：

```markdown
# [项目/文件夹名称] 研究报告

## 概述

[一段话总结：这是什么、做什么、为谁服务]

## 技术栈

- 语言：
- 框架/库：
- 构建工具：
- 运行环境：

## 项目结构

[目录树 + 各目录/文件职责说明]

## 核心架构

[架构概述、模块划分、数据流向，必要时用 ASCII 图示]

## 核心模块详解

### [模块名]

- **职责**：
- **关键实现**：
- **对外接口**：
- **依赖关系**：

（每个核心模块重复此结构）

## 工作流程

[描述主要功能的端到端执行流程]

## 设计决策与权衡

[记录发现的重要设计选择及其原因]

## API / 对外接口

[CLI 命令、函数接口、配置项等]

## 值得注意的细节

[边界情况、隐含约定、潜在陷阱、TODO/HACK]

## 总结

[整体评价与关键发现]
```

## 报告质量要求

- **完整性**：不遗漏任何重要模块或功能
- **准确性**：所有描述基于实际代码，不猜测
- **深度**：不停留在表面，要深入到实现细节
- **结构化**：使用清晰的层级和格式，便于检索
- **语言**：使用中文撰写，技术术语保留英文原文
