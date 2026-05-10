---
read_when:
    - 你想要由 Tavily 支持的 Web 搜索
    - 你需要一个 Tavily API 密钥
    - 你想将 Tavily 用作 web_search 提供商
    - 你想从 URL 中提取内容
summary: Tavily 搜索和提取工具
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是一个面向 AI 应用设计的搜索 API。OpenClaw 以两种方式公开它：

- 作为通用搜索工具的 `web_search` 提供商
- 作为显式插件工具：`tavily_search` 和 `tavily_extract`

Tavily 返回针对 LLM 消费优化的结构化结果，支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染的页面）。

| 属性          | 值                                  |
| ------------- | ----------------------------------- |
| 插件 id       | `tavily`                            |
| 凭证          | `TAVILY_API_KEY` 或配置 `apiKey`    |
| 基础 URL      | `https://api.tavily.com`（默认）    |
| 内置工具      | `tavily_search`, `tavily_extract`   |

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [tavily.com](https://tavily.com) 创建 Tavily 账户，然后在控制台中生成 API key。
  </Step>
  <Step title="配置插件和提供商">
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
  </Step>
  <Step title="验证搜索能运行">
    从任意智能体触发一次 `web_search`，或直接调用 `tavily_search`。
  </Step>
</Steps>

<Tip>
在新手引导或 `openclaw configure --section web` 中选择 Tavily 会自动启用内置的 Tavily 插件。
</Tip>

## 工具参考

### `tavily_search`

当你需要使用 Tavily 特有的搜索控制，而不是通用的 `web_search` 时，请使用此工具。

| 参数              | 类型         | 约束 / 默认值                          | 描述                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | 必填                                   | 搜索查询字符串。保持在 400 个字符以内。         |
| `search_depth`    | enum         | `basic`（默认）、`advanced`            | `advanced` 较慢，但相关性更高。                 |
| `topic`           | enum         | `general`（默认）、`news`、`finance`   | 按主题类别过滤。                                |
| `max_results`     | integer      | 1-20                                   | 结果数量。                                      |
| `include_answer`  | boolean      | 默认 `false`                           | 包含 Tavily AI 生成的答案摘要。                 |
| `time_range`      | enum         | `day`、`week`、`month`、`year`         | 按新近程度过滤结果。                            |
| `include_domains` | string array | （无）                                 | 仅包含来自这些域名的结果。                      |
| `exclude_domains` | string array | （无）                                 | 排除来自这些域名的结果。                        |

搜索深度权衡：

| 深度       | 速度 | 相关性 | 最适合                               |
| ---------- | ---- | ------ | ------------------------------------ |
| `basic`    | 更快 | 高     | 通用查询（默认）。                   |
| `advanced` | 更慢 | 最高   | 精确研究和事实查找。                 |

### `tavily_extract`

使用此工具从一个或多个 URL 提取干净内容。可处理 JavaScript 渲染的页面，并支持面向查询的分块，用于有针对性的提取。

| 参数                | 类型         | 约束 / 默认值                | 描述                                                        |
| ------------------- | ------------ | ---------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | 必填，1-20                   | 要从中提取内容的 URL。                                      |
| `query`             | string       | （可选）                     | 按与此查询的相关性对提取的分块重新排序。                    |
| `extract_depth`     | enum         | `basic`（默认）、`advanced`  | 对 JS 较重的页面、SPA 或动态表格使用 `advanced`。           |
| `chunks_per_source` | integer      | 1-5；**需要 `query`**        | 每个 URL 返回的分块数。如果未设置 `query` 则会报错。        |
| `include_images`    | boolean      | 默认 `false`                 | 在结果中包含图片 URL。                                      |

提取深度权衡：

| 深度       | 何时使用                                   |
| ---------- | ------------------------------------------ |
| `basic`    | 简单页面。先尝试这个。                     |
| `advanced` | JS 渲染的 SPA、动态内容、表格。            |

<Tip>
将较大的 URL 列表拆分为多次 `tavily_extract` 调用（每次请求最多 20 个）。使用 `query` 加 `chunks_per_source`，只获取相关内容，而不是完整页面。
</Tip>

## 选择合适的工具

| 需求                                 | 工具             |
| ------------------------------------ | ---------------- |
| 快速 Web 搜索，无特殊选项            | `web_search`     |
| 使用深度、主题、AI 答案进行搜索      | `tavily_search`  |
| 从特定 URL 提取内容                  | `tavily_extract` |

<Note>
以 Tavily 作为提供商的通用 `web_search` 工具支持 `query` 和 `count`（最多 20 个结果）。对于 Tavily 特有的控制项（`search_depth`、`topic`、`include_answer`、域名过滤、时间范围），请改用 `tavily_search`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="API key 解析顺序">
    Tavily 客户端按以下顺序查找其 API key：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（通过 SecretRefs 解析）。
    2. Gateway 网关环境中的 `TAVILY_API_KEY`。

    如果两者都不存在，`tavily_extract` 会抛出设置错误。

  </Accordion>

  <Accordion title="自定义基础 URL">
    如果你通过代理前置 Tavily，请覆盖 `plugins.entries.tavily.config.webSearch.baseUrl`。默认值为 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 会拒绝传入 `chunks_per_source` 但未传入 `query` 的调用。Tavily 会按查询相关性对分块排序，因此没有查询时该参数没有意义。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Web 搜索概览" href="/zh-CN/tools/web" icon="magnifying-glass">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Firecrawl" href="/zh-CN/tools/firecrawl" icon="fire">
    搜索加内容提取式抓取。
  </Card>
  <Card title="Exa Search" href="/zh-CN/tools/exa-search" icon="binoculars">
    带内容提取的神经搜索。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    插件条目和工具路由的完整配置架构。
  </Card>
</CardGroup>
