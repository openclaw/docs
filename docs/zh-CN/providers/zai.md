---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要简单的 ZAI_API_KEY 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T10:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行认证。请在 Z.AI 控制台中创建你的 API 密钥。OpenClaw 使用 `zai` 提供商和 Z.AI API 密钥。

## CLI 设置

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` 允许 OpenClaw 根据密钥检测匹配的 Z.AI 端点，并自动应用正确的 base URL。
当你想强制使用特定的 Coding Plan 或通用 API 接入面时，请使用显式区域选项。

## 内置 GLM 目录

OpenClaw 当前为内置的 `zai` 提供商预置了以下模型：

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

- GLM 模型可通过 `zai/<model>` 使用（例如：`zai/glm-5`）。
- 默认内置模型引用：`zai/glm-5`
- 未知的 `glm-5*` id 在内置提供商路径上仍可前向解析：当该 id
  匹配当前 GLM-5 家族形态时，系统会基于 `glm-4.7` 模板合成提供商拥有的元数据。
- 默认启用 `tool_stream`，用于 Z.AI 工具调用流式传输。如需禁用，请将
  `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false`。
- 模型家族概览请参见 [/providers/glm](/zh-CN/providers/glm)。
- Z.AI 使用你的 API 密钥进行 Bearer 认证。
