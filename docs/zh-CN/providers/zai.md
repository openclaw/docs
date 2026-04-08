---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要简单设置 `ZAI_API_KEY`
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-08T03:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66cbd9813ee28d202dcae34debab1b0cf9927793acb00743c1c62b48d9e381f9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。在 Z.AI 控制台中创建你的 API 密钥。OpenClaw 使用 `zai` 提供商和 Z.AI API 密钥。

## CLI 设置

```bash
# 通用 API 密钥设置，自动检测端点
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global，推荐给 Coding Plan 用户
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN（中国区域），推荐给 Coding Plan 用户
openclaw onboard --auth-choice zai-coding-cn

# 通用 API
openclaw onboard --auth-choice zai-global

# 通用 API CN（中国区域）
openclaw onboard --auth-choice zai-cn
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

`zai-api-key` 让 OpenClaw 能根据密钥检测匹配的 Z.AI 端点，并自动应用正确的基础 URL。当你想强制使用特定的 Coding Plan 或通用 API 接口时，请使用显式的区域选项。

## 内置 GLM 目录

OpenClaw 目前为内置 `zai` 提供商预置了：

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## 说明

- GLM 模型可作为 `zai/<model>` 使用（示例：`zai/glm-5`）。
- 默认内置模型引用：`zai/glm-5.1`
- 未知的 `glm-5*` id 在内置提供商路径上仍会被向前解析：当该 id 符合当前 GLM-5 系列的形态时，会基于 `glm-4.7` 模板合成提供商自有元数据。
- 对于 Z.AI 工具调用的流式传输，默认启用 `tool_stream`。如需禁用，请将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false`。
- 模型系列概览请参见 [/providers/glm](/zh-CN/providers/glm)。
- Z.AI 使用带有你的 API 密钥的 Bearer 身份验证。
