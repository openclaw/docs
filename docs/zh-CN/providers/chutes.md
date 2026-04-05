---
read_when:
    - 你想在 OpenClaw 中使用 Chutes
    - 你需要 OAuth 或 API 密钥设置路径
    - 你想了解默认模型、别名或发现行为
summary: Chutes 设置（OAuth 或 API 密钥、模型发现、别名）
title: Chutes
x-i18n:
    generated_at: "2026-04-05T08:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) 通过与 OpenAI 兼容的 API 提供开源模型目录。OpenClaw 同时支持内置 `chutes` 提供商的浏览器 OAuth 和直接 API 密钥认证。

- 提供商：`chutes`
- API：与 OpenAI 兼容
- Base URL：`https://llm.chutes.ai/v1`
- 认证：
  - 通过 `openclaw onboard --auth-choice chutes` 使用 OAuth
  - 通过 `openclaw onboard --auth-choice chutes-api-key` 使用 API 密钥
  - 运行时环境变量：`CHUTES_API_KEY`、`CHUTES_OAUTH_TOKEN`

## 快速开始

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw 会在本地启动浏览器流程，或者在远程 / 无头主机上显示 URL + 重定向粘贴流程。OAuth 令牌会通过 OpenClaw 认证配置文件自动刷新。

可选的 OAuth 覆盖项：

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API 密钥

```bash
openclaw onboard --auth-choice chutes-api-key
```

在
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
获取你的密钥。

这两种认证路径都会注册内置的 Chutes 目录，并将默认模型设置为
`chutes/zai-org/GLM-4.7-TEE`。

## 发现行为

当 Chutes 认证可用时，OpenClaw 会使用该凭证查询 Chutes 目录，并使用发现到的模型。如果发现失败，OpenClaw 会回退到内置静态目录，以便新手引导和启动流程仍然可用。

## 默认别名

OpenClaw 还为内置 Chutes 目录注册了三个便捷别名：

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## 内置起始目录

内置回退目录包含当前的 Chutes 引用，例如：

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## 配置示例

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## 说明

- OAuth 帮助和重定向应用要求： [Chutes OAuth 文档](https://chutes.ai/docs/sign-in-with-chutes/overview)
- API 密钥和 OAuth 发现都使用相同的 `chutes` 提供商 id。
- Chutes 模型会注册为 `chutes/<model-id>`。
