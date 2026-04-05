---
read_when:
    - 你想在 OpenClaw 中使用 GLM 模型
    - 你需要了解模型命名约定和设置方法
summary: GLM 模型家族概览以及如何在 OpenClaw 中使用它
title: GLM 模型
x-i18n:
    generated_at: "2026-04-05T08:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# GLM 模型

GLM 是一个**模型家族**（不是公司），可通过 Z.AI 平台使用。在 OpenClaw 中，GLM
模型通过 `zai` provider 和诸如 `zai/glm-5` 这样的模型 ID 访问。

## CLI 设置

```bash
# 通用 API key 设置，带端点自动检测
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
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` 允许 OpenClaw 根据 key 检测匹配的 Z.AI 端点，并自动应用正确的 base URL。
如果你想强制使用特定的 Coding Plan 或通用 API 界面，请使用显式的区域选项。

## 当前内置的 GLM 模型

OpenClaw 当前会为内置 `zai` provider 预置这些 GLM 引用：

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

- GLM 版本和可用性可能会变化；请查看 Z.AI 的文档以获取最新信息。
- 默认内置模型引用是 `zai/glm-5`。
- provider 详情请参见 [/providers/zai](/providers/zai)。
