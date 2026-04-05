---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 认证或模型 id
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-05T10:07:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。

## 设置

1. 在 xAI 控制台中创建一个 API 密钥。
2. 设置 `XAI_API_KEY`，或运行：

```bash
openclaw onboard --auth-choice xai-api-key
```

3. 选择一个模型，例如：

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw 现在使用 xAI Responses API 作为内置 xAI 传输层。同一个
`XAI_API_KEY` 也可用于由 Grok 支持的 `web_search`、一等公民 `x_search`
以及远程 `code_execution`。
如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置 xAI 模型提供商现在也会将该密钥作为回退复用。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。

## 当前内置模型目录

OpenClaw 现在开箱即用地包含以下 xAI 模型系列：

- `grok-3`、`grok-3-fast`、`grok-3-mini`、`grok-3-mini-fast`
- `grok-4`、`grok-4-0709`
- `grok-4-fast`、`grok-4-fast-non-reasoning`
- `grok-4-1-fast`、`grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`、`grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

当较新的 `grok-4*` 和 `grok-code-fast*` id
遵循相同的 API 形状时，该插件也会前向解析它们。

快速模型说明：

- `grok-4-fast`、`grok-4-1-fast` 以及 `grok-4.20-beta-*` 变体是
  当前内置目录中支持图像能力的 Grok 引用。
- `/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
  会按如下方式重写原生 xAI 请求：
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

旧版兼容性别名仍会规范化为内置规范 id。例如：

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web 搜索

内置的 `grok` Web 搜索提供商也使用 `XAI_API_KEY`：

```bash
openclaw config set tools.web.search.provider grok
```

## 已知限制

- 当前认证仅支持 API 密钥。OpenClaw 还没有 xAI OAuth/设备代码流程。
- `grok-4.20-multi-agent-experimental-beta-0304` 在常规 xAI 提供商路径上不受支持，因为它需要与标准 OpenClaw xAI 传输层不同的上游 API 表面。

## 说明

- OpenClaw 会在共享运行器路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性修复。
- 原生 xAI 请求默认使用 `tool_stream: true`。将
  `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false`
  可禁用它。
- 内置 xAI 包装器会在发送原生 xAI 请求之前，
  去除不受支持的严格工具 schema 标志和 reasoning 负载键。
- `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具公开。OpenClaw 会在每次工具请求中启用其所需的特定 xAI 内置能力，而不是在每一轮聊天中附加所有原生工具。
- `x_search` 和 `code_execution` 由内置 xAI 插件负责，而不是硬编码在核心模型运行时中。
- `code_execution` 是远程 xAI 沙箱执行，不是本地 [`exec`](/zh-CN/tools/exec)。
- 更广泛的提供商概览请参见[模型提供商](/zh-CN/providers/index)。
