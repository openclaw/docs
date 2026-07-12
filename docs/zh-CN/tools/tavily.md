---
read_when:
    - 你想使用由 Tavily 支持的 Web 搜索
    - 你需要一个 Tavily API key
    - 你想将 Tavily 用作 `web_search` 提供商
    - 你想从 URL 中提取内容
summary: Tavily 搜索和提取工具
title: Tavily
x-i18n:
    generated_at: "2026-07-11T21:02:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是专为 AI 应用设计的搜索 API。OpenClaw 通过以下两种方式提供它：

- 作为通用搜索工具的 `web_search` 提供商
- 作为明确的插件工具：`tavily_search` 和 `tavily_extract`

Tavily 返回针对 LLM 使用而优化的结构化结果，支持配置搜索深度、主题筛选、域名筛选、AI 生成的答案摘要，以及从 URL 提取内容（包括由 JavaScript 渲染的页面）。

| 属性      | 值                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------- |
| 插件 ID   | `tavily`                                                                                             |
| 软件包    | `@openclaw/tavily-plugin`                                                                            |
| 身份验证  | `TAVILY_API_KEY` 环境变量或配置项 `apiKey`                                                           |
| 基础 URL  | `https://api.tavily.com`（默认）；可通过 `TAVILY_BASE_URL` 环境变量或配置项 `baseUrl` 覆盖           |
| 超时时间  | 搜索 30 秒，提取 60 秒（默认）                                                                       |
| 工具      | `tavily_search`、`tavily_extract`                                                                    |

## 入门指南

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    在 [tavily.com](https://tavily.com) 创建 Tavily 账户，然后在控制面板中生成 API 密钥。
  </Step>
  <Step title="Configure the plugin and provider">
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
  <Step title="Verify search runs">
    从任意智能体触发一次 `web_search`，或直接调用 `tavily_search`。
  </Step>
</Steps>

<Tip>
在新手引导或 `openclaw configure --section web` 中选择 Tavily 后，系统会在需要时安装并启用官方 Tavily 插件。
</Tip>

## 工具参考

### `tavily_search`

当你需要 Tavily 特有的搜索控制选项，而不是通用的 `web_search` 时，请使用此工具。

| 参数              | 类型       | 约束 / 默认值                          | 说明                                      |
| ----------------- | ---------- | -------------------------------------- | ----------------------------------------- |
| `query`           | 字符串     | 必填                                   | 搜索查询字符串。                          |
| `search_depth`    | 枚举       | `basic`（默认）、`advanced`            | `advanced` 速度较慢，但相关性更高。       |
| `topic`           | 枚举       | `general`（默认）、`news`、`finance`   | 按主题类别筛选。                          |
| `max_results`     | 整数       | 1–20，默认值为 `5`                     | 结果数量。                                |
| `include_answer`  | 布尔值     | 默认值为 `false`                       | 包含 Tavily AI 生成的答案摘要。           |
| `time_range`      | 枚举       | `day`、`week`、`month`、`year`         | 按时间新近程度筛选结果。                  |
| `include_domains` | 字符串数组 | （无）                                 | 仅包含来自这些域名的结果。                |
| `exclude_domains` | 字符串数组 | （无）                                 | 排除来自这些域名的结果。                  |

搜索深度的权衡：

| 深度       | 速度 | 相关性 | 最适合                                   |
| ---------- | ---- | ------ | ---------------------------------------- |
| `basic`    | 较快 | 高     | 通用查询（默认）。                       |
| `advanced` | 较慢 | 最高   | 精准研究和事实查证。                     |

### `tavily_extract`

使用此工具可从一个或多个 URL 中提取干净的内容。它能够处理由 JavaScript 渲染的页面，并支持按查询聚焦分块，以便进行定向提取。

| 参数                | 类型       | 约束 / 默认值                 | 说明                                                        |
| ------------------- | ---------- | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | 字符串数组 | 必填，1–20                    | 要从中提取内容的 URL。                                      |
| `query`             | 字符串     | （可选）                      | 根据与此查询的相关性对提取的内容块重新排序。                |
| `extract_depth`     | 枚举       | `basic`（默认）、`advanced`   | 对大量使用 JS 的页面、SPA 或动态表格使用 `advanced`。       |
| `chunks_per_source` | 整数       | 1–5；**需要 `query`**         | 每个 URL 返回的内容块数。未提供 `query` 时设置此项会报错。  |
| `include_images`    | 布尔值     | 默认值为 `false`              | 在结果中包含图片 URL。                                     |

提取深度的权衡：

| 深度       | 使用场景                                     |
| ---------- | -------------------------------------------- |
| `basic`    | 简单页面。请先尝试此选项。                   |
| `advanced` | 由 JS 渲染的 SPA、动态内容和表格。           |

<Tip>
将较大的 URL 列表拆分为多次 `tavily_extract` 调用（每次请求最多 20 个）。使用 `query` 和 `chunks_per_source`，可以只获取相关内容，而不是完整页面。
</Tip>

## 选择合适的工具

| 需求                                 | 工具               |
| ------------------------------------ | ------------------ |
| 快速 Web 搜索，无需特殊选项          | `web_search`       |
| 按深度和主题搜索，并获取 AI 答案     | `tavily_search`    |
| 从指定 URL 提取内容                  | `tavily_extract`   |

<Note>
将 Tavily 用作提供商时，通用 `web_search` 工具支持 `query` 和 `count`（最多 20 条结果）。如需 Tavily 特有的控制选项（`search_depth`、`topic`、`include_answer`、域名筛选和时间范围），请改用 `tavily_search`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="API key resolution order">
    Tavily 客户端按以下顺序查找其 API 密钥：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（通过 SecretRefs 解析）。
    2. Gateway 网关环境中的 `TAVILY_API_KEY`。

    如果两者均不存在，`tavily_search` 和 `tavily_extract` 都会引发设置错误。

  </Accordion>

  <Accordion title="Custom base URL">
    如果你通过代理访问 Tavily，请覆盖 `plugins.entries.tavily.config.webSearch.baseUrl`，或设置 `TAVILY_BASE_URL`。配置项的优先级高于环境变量。默认值为 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    如果调用 `tavily_extract` 时传入 `chunks_per_source`，却未提供 `query`，调用将被拒绝。Tavily 会根据查询相关性对内容块排序，因此没有查询时，此参数没有意义。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/zh-CN/tools/web" icon="magnifying-glass">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Firecrawl" href="/zh-CN/tools/firecrawl" icon="fire">
    搜索与抓取，并支持内容提取。
  </Card>
  <Card title="Exa Search" href="/zh-CN/tools/exa-search" icon="binoculars">
    支持内容提取的神经搜索。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration" icon="gear">
    插件条目和工具路由的完整配置模式。
  </Card>
</CardGroup>
