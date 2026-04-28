---
read_when:
- 你想将 Grok 用于 `web_search`
- 你需要为 Web 搜索配置 `XAI_API_KEY`
summary: 通过 xAI 的 Web-grounded 响应使用 Grok Web 搜索
title: Grok 搜索
x-i18n:
  generated_at: '2026-04-23T21:08:07Z'
  model: gpt-5.4
  provider: openai
  source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
  source_path: tools/grok-search.md
  workflow: 15
---
OpenClaw 支持将 Grok 用作 `web_search` 提供商，它通过 xAI 的 Web-grounded
响应来生成由实时搜索结果支撑、并带有引用的 AI 综合答案。

同一个 `XAI_API_KEY` 还可以驱动内置的 `x_search` 工具，用于搜索 X
（原 Twitter）帖子。如果你将该 key 存储在
`plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在还会将其
作为内置 xAI 模型提供商的回退凭证复用。

对于帖子级别的 X 指标，例如转发、回复、收藏或浏览量，请优先使用
`x_search`，并提供精确的帖子 URL 或状态 ID，而不是使用宽泛的搜索
查询。

## 新手引导与配置

如果你在以下流程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，用同一个
`XAI_API_KEY` 启用 `x_search`。这个后续步骤：

- 只会在你为 `web_search` 选择 Grok 之后出现
- 不是一个独立的顶层 Web 搜索提供商选项
- 还可以在同一流程中选择性设置 `x_search` 模型

如果你跳过了它，之后仍然可以在配置中启用或更改 `x_search`。

## 获取 API key

<Steps>
  <Step title="创建 key">
    从 [xAI](https://console.x.ai/) 获取一个 API key。
  </Step>
  <Step title="存储 key">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或通过以下命令配置：

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
            apiKey: "xai-...", // 如果已设置 XAI_API_KEY，则为可选
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
对于 gateway 安装，请将其写入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 的 Web-grounded 响应来综合答案，并附带内联
引用，这与 Gemini 使用 Google Search grounding 的方式类似。

## 支持的参数

Grok 搜索支持 `query`。

为了与共享 `web_search` 保持兼容，也接受 `count`，但 Grok 仍然
返回一条带引用的综合答案，而不是 N 条结果列表。

当前尚不支持提供商专用过滤器。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) —— 所有提供商与自动检测
- [Web Search 中的 x_search](/zh-CN/tools/web#x_search) —— 通过 xAI 实现的一等 X 搜索
- [Gemini Search](/zh-CN/tools/gemini-search) —— 通过 Google grounding 生成带 AI 综合答案
