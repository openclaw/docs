---
read_when:
    - 你想将 Perplexity 配置为 Web 搜索提供商
    - 你需要 Perplexity API 密钥或 OpenRouter 代理设置
summary: Perplexity Web 搜索提供商设置（API 密钥、搜索模式、筛选）
title: Perplexity
x-i18n:
    generated_at: "2026-07-11T20:53:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity 插件注册了一个支持两种传输方式的 `web_search` 提供商：原生 Perplexity Search API（提供带筛选功能的结构化结果），以及直接使用或通过 OpenRouter 使用的 Perplexity Sonar 聊天补全（提供带引用的 AI 综合回答）。

<Note>
本页介绍 Perplexity **提供商**的设置。有关 Perplexity **工具**（智能体如何使用它），请参阅 [Perplexity 搜索](/zh-CN/tools/perplexity-search)。
</Note>

| 属性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 类型        | Web 搜索提供商（不是模型提供商）                                      |
| 身份验证    | `PERPLEXITY_API_KEY`（原生）或 `OPENROUTER_API_KEY`（通过 OpenRouter） |
| 配置路径    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| 覆盖项      | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| 获取密钥    | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## 安装插件

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw configure --section web
    ```

    或直接设置密钥：

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    在 Gateway 网关环境中导出为 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY` 的密钥也可以使用。

  </Step>
  <Step title="开始搜索">
    当 Perplexity 的密钥成为可用的搜索凭据后，`web_search` 会自动检测 Perplexity，无需进一步设置。若要明确固定使用该提供商：

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 搜索模式

插件按以下顺序解析传输方式：

1. 设置了 `webSearch.baseUrl` 或 `webSearch.model`：无论密钥类型如何，始终通过 Sonar 聊天补全路由到该端点。
2. 否则，由密钥来源决定端点：已配置密钥的前缀决定传输方式（配置优先于环境变量）；环境变量中的密钥直接使用与其匹配的端点。

| 密钥前缀   | 传输方式                                                   | 功能                                             |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | 原生 Perplexity Search API（`https://api.perplexity.ai`）  | 结构化结果、域名/语言/日期筛选                   |
| `sk-or-`   | OpenRouter（`https://openrouter.ai/api/v1`）、Sonar 模型   | 带引用的 AI 综合回答                             |

配置的密钥采用任何其他前缀时，也会使用原生 Search API。聊天补全路径默认使用 `perplexity/sonar-pro` 模型；可通过 `plugins.entries.perplexity.config.webSearch.model` 覆盖该设置。

## 原生 API 筛选

| 筛选器                               | 说明                                                            | 传输方式     |
| ------------------------------------ | --------------------------------------------------------------- | ------------ |
| `count`                              | 每次搜索的结果数，1-10（默认 5）                                | 仅原生       |
| `freshness`                          | 时效范围：`day`、`week`、`month`、`year`                        | 两者均支持   |
| `country`                            | 两字母国家/地区代码（`us`、`de`、`jp`）                         | 仅原生       |
| `language`                           | ISO 639-1 语言代码（`en`、`fr`、`zh`）                          | 仅原生       |
| `date_after` / `date_before`         | `YYYY-MM-DD` 格式的发布日期范围                                 | 仅原生       |
| `domain_filter`                      | 最多 20 个域名；允许列表或带 `-` 前缀的拒绝列表，不得混用       | 仅原生       |
| `max_tokens` / `max_tokens_per_page` | 所有结果的总内容预算 / 每页内容预算                             | 仅原生       |

仅原生支持的筛选器在聊天补全路径中会返回说明性错误。`freshness` 不能与 `date_after`/`date_before` 组合使用。

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    <Warning>
    如果密钥仅在交互式 shell 中导出，launchd/systemd Gateway 网关守护进程将无法看到它，除非显式导入该环境。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置，以便 Gateway 网关进程能够读取它。有关完整的优先级顺序，请参阅[环境变量](/zh-CN/help/environment)。
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter 代理设置">
    若要通过 OpenRouter 路由 Perplexity 搜索，请设置 `OPENROUTER_API_KEY`（前缀为 `sk-or-`），而不是原生 Perplexity 密钥。OpenClaw 会检测该密钥并自动切换到 Sonar 传输方式。如果你已经设置了 OpenRouter 计费，并希望在其中整合提供商，此方式会很有用。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Perplexity 搜索工具" href="/zh-CN/tools/perplexity-search" icon="magnifying-glass">
    智能体如何调用 Perplexity 搜索并解释结果。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置参考，包括插件条目。
  </Card>
</CardGroup>
