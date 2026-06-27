---
read_when:
    - 你想要由 Tavily 支持的 Web 搜索
    - 你需要一个 Tavily API 密钥
    - 你想将 Tavily 作为 web_search 提供商
    - 你想从 URL 中提取内容
summary: Tavily 搜索和提取工具
title: Tavily
x-i18n:
    generated_at: "2026-06-27T03:34:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是一个专为 AI 应用设计的搜索 API。OpenClaw 通过两种方式暴露它：

- 作为通用搜索工具的 `web_search` 提供商
- 作为显式插件工具：`tavily_search` 和 `tavily_extract`

Tavily 返回针对 LLM 消费优化的结构化结果，支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染页面）。

| 属性      | 值                                  |
| --------- | ----------------------------------- |
| 插件 ID   | `tavily`                            |
| 包        | `@openclaw/tavily-plugin`           |
| 认证      | `TAVILY_API_KEY` 或配置 `apiKey`    |
| Base URL  | `https://api.tavily.com`（默认）    |
| 工具      | `tavily_search`, `tavily_extract`   |

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="获取 API key">
    在 [tavily.com](https://tavily.com) 创建 Tavily 账号，然后在仪表板中生成 API key。
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
  <Step title="验证搜索运行">
    从任意智能体触发 `web_search`，或直接调用 `tavily_search`。
  </Step>
</Steps>

<Tip>
在新手引导或 `openclaw configure --section web` 中选择 Tavily，会在需要时安装并启用官方 Tavily 插件。
</Tip>

## 工具参考

### `tavily_search`

当你需要 Tavily 专属搜索控制，而不是通用 `web_search` 时使用它。

| 参数              | 类型         | 约束 / 默认值                          | 描述                                             |
| ----------------- | ------------ | -------------------------------------- | ------------------------------------------------ |
| `query`           | string       | 必需                                   | 搜索查询字符串。保持在 400 个字符以内。         |
| `search_depth`    | enum         | `basic`（默认）、`advanced`            | `advanced` 较慢，但相关性更高。                 |
| `topic`           | enum         | `general`（默认）、`news`、`finance`   | 按主题系列过滤。                                |
| `max_results`     | integer      | 1-20                                   | 结果数量。                                      |
| `include_answer`  | boolean      | 默认 `false`                           | 包含 Tavily AI 生成的答案摘要。                 |
| `time_range`      | enum         | `day`、`week`、`month`、`year`         | 按新近程度过滤结果。                            |
| `include_domains` | string array | （无）                                 | 仅包含来自这些域名的结果。                      |
| `exclude_domains` | string array | （无）                                 | 排除来自这些域名的结果。                        |

搜索深度权衡：

| 深度       | 速度   | 相关性 | 最适合                               |
| ---------- | ------ | ------ | ------------------------------------ |
| `basic`    | 更快   | 高     | 通用查询（默认）。                   |
| `advanced` | 更慢   | 最高   | 精准研究和事实查证。                 |

### `tavily_extract`

使用它从一个或多个 URL 提取干净内容。它可以处理 JavaScript 渲染页面，并支持面向查询的分块，用于定向提取。

| 参数                | 类型         | 约束 / 默认值                  | 描述                                                        |
| ------------------- | ------------ | ------------------------------ | ----------------------------------------------------------- |
| `urls`              | string array | 必需，1-20                     | 要从中提取内容的 URL。                                      |
| `query`             | string       | （可选）                       | 按与此查询的相关性重新排序提取的块。                        |
| `extract_depth`     | enum         | `basic`（默认）、`advanced`    | 对 JS 密集页面、SPA 或动态表格使用 `advanced`。             |
| `chunks_per_source` | integer      | 1-5；**需要 `query`**          | 每个 URL 返回的块数。如果未设置 `query` 则会报错。          |
| `include_images`    | boolean      | 默认 `false`                   | 在结果中包含图片 URL。                                      |

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
| 带深度、主题、AI 答案的搜索          | `tavily_search`  |
| 从特定 URL 提取内容                  | `tavily_extract` |

<Note>
以 Tavily 作为提供商的通用 `web_search` 工具支持 `query` 和 `count`（最多 20 条结果）。如需 Tavily 专属控制（`search_depth`、`topic`、`include_answer`、域名过滤、时间范围），请改用 `tavily_search`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="API key 解析顺序">
    Tavily 客户端按以下顺序查找其 API key：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（通过 SecretRefs 解析）。
    2. 来自 Gateway 网关环境的 `TAVILY_API_KEY`。

    如果两者都不存在，`tavily_extract` 会抛出设置错误。

  </Accordion>

  <Accordion title="自定义 Base URL">
    如果你通过代理转发 Tavily，请覆盖 `plugins.entries.tavily.config.webSearch.baseUrl`。默认值为 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 会拒绝传入 `chunks_per_source` 但没有 `query` 的调用。Tavily 会按查询相关性对块进行排序，因此没有查询时该参数没有意义。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Web 搜索概览" href="/zh-CN/tools/web" icon="magnifying-glass">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Firecrawl" href="/zh-CN/tools/firecrawl" icon="fire">
    搜索加抓取，并带内容提取。
  </Card>
  <Card title="Exa Search" href="/zh-CN/tools/exa-search" icon="binoculars">
    带内容提取的神经搜索。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    插件条目和工具路由的完整配置架构。
  </Card>
</CardGroup>
