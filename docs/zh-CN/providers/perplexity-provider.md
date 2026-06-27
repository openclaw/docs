---
read_when:
    - 你想将 Perplexity 配置为 Web 搜索提供商
    - 你需要 Perplexity API 密钥或 OpenRouter 代理设置
summary: Perplexity Web 搜索提供商设置（API key、搜索模式、过滤）
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T03:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity 插件通过 Perplexity Search API 或经由 OpenRouter 的 Perplexity Sonar 提供 Web 搜索能力。

<Note>
本页是 Perplexity **提供商**设置。对于 Perplexity **工具**（智能体如何使用它），请参阅 [Perplexity 工具](/zh-CN/tools/perplexity-search)。
</Note>

| 属性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 类型        | Web 搜索提供商（不是模型提供商）                                       |
| 凭证        | `PERPLEXITY_API_KEY`（直连）或 `OPENROUTER_API_KEY`（经由 OpenRouter） |
| 配置路径    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置 API key">
    运行交互式 Web 搜索配置流程：

    ```bash
    openclaw configure --section web
    ```

    或直接设置 key：

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="开始搜索">
    key 配置完成后，智能体会自动使用 Perplexity 进行 Web 搜索。无需其他步骤。
  </Step>
</Steps>

## 搜索模式

插件会根据 API key 前缀自动选择传输方式：

<Tabs>
  <Tab title="原生 Perplexity API (pplx-)">
    当你的 key 以 `pplx-` 开头时，OpenClaw 会使用原生 Perplexity Search API。此传输方式会返回结构化结果，并支持域名、语言和日期过滤器（见下方过滤选项）。
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    当你的 key 以 `sk-or-` 开头时，OpenClaw 会通过 OpenRouter 使用 Perplexity Sonar 模型进行路由。此传输方式会返回带引用的 AI 合成答案。
  </Tab>
</Tabs>

| Key 前缀 | 传输方式                     | 功能                                             |
| -------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`  | 原生 Perplexity Search API   | 结构化结果、域名/语言/日期过滤器                 |
| `sk-or-` | OpenRouter (Sonar)           | 带引用的 AI 合成答案                             |

## 原生 API 过滤

<Note>
过滤选项仅在使用原生 Perplexity API（`pplx-` key）时可用。OpenRouter/Sonar 搜索不支持这些参数。
</Note>

使用原生 Perplexity API 时，搜索支持以下过滤器：

| 过滤器       | 描述                                  | 示例                                |
| ------------ | ------------------------------------- | ----------------------------------- |
| 国家         | 2 字母国家/地区代码                   | `us`, `de`, `jp`                    |
| 语言         | ISO 639-1 语言代码                    | `en`, `fr`, `zh`                    |
| 日期范围     | 近因窗口                              | `day`, `week`, `month`, `year`      |
| 域名过滤器   | 允许列表或拒绝列表（最多 20 个域名）  | `example.com`                       |
| 内容预算     | 每次响应 / 每页的 token 限制          | `max_tokens`, `max_tokens_per_page` |

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以使用 `PERPLEXITY_API_KEY`。

    <Warning>
    仅在交互式 shell 中导出的 key 不会对 launchd/systemd 守护进程可见，除非显式导入该环境。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置 key，确保 gateway 进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 代理设置">
    如果你希望通过 OpenRouter 路由 Perplexity 搜索，请设置 `OPENROUTER_API_KEY`（前缀 `sk-or-`），而不是原生 Perplexity key。OpenClaw 会检测前缀并自动切换到 Sonar 传输方式。

    <Tip>
    如果你已经拥有 OpenRouter 账号，并且希望跨多个提供商合并计费，OpenRouter 传输方式会很有用。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Perplexity 搜索工具" href="/zh-CN/tools/perplexity-search" icon="magnifying-glass">
    智能体如何调用 Perplexity 搜索并解释结果。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包含插件条目的完整配置参考。
  </Card>
</CardGroup>
