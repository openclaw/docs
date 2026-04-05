---
read_when:
    - 你想使用由 Tavily 支持的 Web 搜索
    - 你需要 Tavily API key
    - 你想将 Tavily 用作 `web_search` 提供商
    - 你想从 URL 提取内容
summary: Tavily 搜索与提取工具
title: Tavily
x-i18n:
    generated_at: "2026-04-05T10:12:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw 可以通过两种方式使用 **Tavily**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`tavily_search` 和 `tavily_extract`

Tavily 是一个面向 AI 应用设计的搜索 API，返回为 LLM 消费优化的结构化结果。它支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染页面）。

## 获取 API key

1. 在 [tavily.com](https://tavily.com/) 创建一个 Tavily 账户。
2. 在控制台中生成一个 API key。
3. 将其存储到配置中，或在 gateway 环境中设置 `TAVILY_API_KEY`。

## 配置 Tavily 搜索

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

说明：

- 在新手引导中选择 Tavily，或者运行 `openclaw configure --section web` 选择 Tavily 时，会自动启用内置 Tavily 插件。
- 请将 Tavily 配置存储在 `plugins.entries.tavily.config.webSearch.*` 下。
- 搭配 Tavily 的 `web_search` 支持 `query` 和 `count`（最多 20 条结果）。
- 对于 Tavily 特有的控制项，例如 `search_depth`、`topic`、`include_answer` 或域名过滤，请使用 `tavily_search`。

## Tavily 插件工具

### `tavily_search`

当你需要 Tavily 特有的搜索控制，而不是通用 `web_search` 时，请使用此工具。

| 参数 | 描述 |
| ----------------- | --------------------------------------------------------------------- |
| `query` | 搜索查询字符串（保持在 400 个字符以内） |
| `search_depth` | `basic`（默认，平衡）或 `advanced`（相关性最高，但更慢） |
| `topic` | `general`（默认）、`news`（实时更新）或 `finance` |
| `max_results` | 结果数量，1-20（默认：5） |
| `include_answer` | 包含 AI 生成的答案摘要（默认：false） |
| `time_range` | 按时间范围过滤：`day`、`week`、`month` 或 `year` |
| `include_domains` | 限制结果仅来自这些域名的数组 |
| `exclude_domains` | 从结果中排除这些域名的数组 |

**搜索深度：**

| 深度 | 速度 | 相关性 | 最适合 |
| ---------- | ------ | --------- | ----------------------------------- |
| `basic` | 更快 | 高 | 通用查询（默认） |
| `advanced` | 更慢 | 最高 | 精确查找、特定事实、研究 |

### `tavily_extract`

使用此工具可从一个或多个 URL 中提取干净内容。它可处理 JavaScript 渲染页面，并支持基于查询的分块，以便进行有针对性的提取。

| 参数 | 描述 |
| ------------------- | ---------------------------------------------------------- |
| `urls` | 要提取的 URL 数组（每次请求 1-20 个） |
| `query` | 按与此查询的相关性对提取出的块重新排序 |
| `extract_depth` | `basic`（默认，快速）或 `advanced`（适用于重度 JS 页面） |
| `chunks_per_source` | 每个 URL 的块数，1-5（需要 `query`） |
| `include_images` | 在结果中包含图片 URL（默认：false） |

**提取深度：**

| 深度 | 使用时机 |
| ---------- | ----------------------------------------- |
| `basic` | 简单页面 —— 先尝试这个 |
| `advanced` | JS 渲染的 SPA、动态内容、表格 |

提示：

- 每次请求最多 20 个 URL。更大的列表请分批调用。
- 使用 `query` + `chunks_per_source` 可以只获取相关内容，而不是整页内容。
- 先尝试 `basic`；如果内容缺失或不完整，再回退到 `advanced`。

## 选择合适的工具

| 需求 | 工具 |
| ------------------------------------ | ---------------- |
| 快速 Web 搜索，无特殊选项 | `web_search` |
| 带深度、主题、AI 答案的搜索 | `tavily_search` |
| 从特定 URL 提取内容 | `tavily_extract` |

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [Firecrawl](/zh-CN/tools/firecrawl) -- 带内容提取的搜索 + 抓取
- [Exa Search](/tools/exa-search) -- 带内容提取的神经搜索
