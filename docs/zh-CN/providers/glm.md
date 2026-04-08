---
read_when:
    - 你想在 OpenClaw 中使用 GLM 模型
    - 你需要了解模型命名约定和设置方法
summary: GLM 模型家族概览 + 如何在 OpenClaw 中使用它
title: GLM 模型
x-i18n:
    generated_at: "2026-04-08T03:40:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a55acfa139847b4b85dbc09f1068cbd2febb1e49f984a23ea9e3b43bc910eb
    source_path: providers/glm.md
    workflow: 15
---

# GLM 模型

GLM 是一个可通过 Z.AI 平台使用的**模型家族**（不是一家公司）。在 OpenClaw 中，GLM
模型通过 `zai` 提供商以及类似 `zai/glm-5` 的模型 ID 进行访问。

## CLI 设置

```bash
# 通用 API 密钥设置，带端点自动检测
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

`zai-api-key` 让 OpenClaw 能够根据密钥检测匹配的 Z.AI 端点，并自动应用正确的基础 URL。若你想强制使用特定的 Coding Plan 或通用 API 接口，请使用明确的区域选项。

## 当前内置的 GLM 模型

OpenClaw 当前为内置的 `zai` 提供商预置了这些 GLM 引用：

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

## 注意事项

- GLM 版本和可用性可能会变化；请查看 Z.AI 的文档以获取最新信息。
- 默认内置模型引用是 `zai/glm-5.1`。
- 关于提供商的详细信息，请参见 [/providers/zai](/zh-CN/providers/zai)。
