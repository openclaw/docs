---
read_when:
    - 你想将 Grok 用作 `web_search`
    - 你需要用于网页搜索的 `XAI_API_KEY`
summary: 通过 xAI 的网页检索增强响应使用 Grok 搜索
title: Grok 搜索
x-i18n:
    generated_at: "2026-04-05T10:11:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Grok 搜索

OpenClaw 支持将 Grok 用作 `web_search` provider，使用 xAI 的网页检索增强响应来生成由实时搜索结果支持、并带有引用的 AI 综合答案。

同一个 `XAI_API_KEY` 也可用于内置的 `x_search` 工具，以搜索 X
（原 Twitter）帖子。如果你将该密钥存储在
`plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在也会将其复用为内置 xAI 模型 provider 的回退值。

对于帖子级别的 X 指标，例如转发、回复、收藏或浏览量，建议优先使用
`x_search` 并提供精确的帖子 URL 或状态 ID，而不是宽泛的搜索查询。

## 新手引导和配置

如果你在以下流程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，用同一个
`XAI_API_KEY` 启用 `x_search`。该后续步骤：

- 仅在你为 `web_search` 选择 Grok 后才会出现
- 不是一个单独的顶级 Web 搜索 provider 选项
- 还可以选择在同一流程中设置 `x_search` 模型

如果你跳过它，之后仍可以在配置中启用或更改 `x_search`。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    从 [xAI](https://console.x.ai/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**环境变量替代方式：** 在 Gateway 网关环境中设置 `XAI_API_KEY`。
对于 gateway 安装，请将其放入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 的网页检索增强响应来综合生成带有内联引用的答案，
类似于 Gemini 的 Google Search grounding 方法。

## 支持的参数

Grok 搜索支持 `query`。

出于共享 `web_search` 兼容性，也接受 `count`，但 Grok 仍然
返回一个带有引用的综合答案，而不是 N 条结果列表。

当前不支持 provider 专用过滤器。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有 provider 和自动检测
- [Web 搜索中的 x_search](/zh-CN/tools/web#x_search) -- 通过 xAI 提供的一流 X 搜索
- [Gemini 搜索](/tools/gemini-search) -- 通过 Google grounding 生成 AI 综合答案
