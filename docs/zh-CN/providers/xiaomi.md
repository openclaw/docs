---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要设置 `XIAOMI_API_KEY`
summary: 在 OpenClaw 中使用 Xiaomi MiMo 模型
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T10:07:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 使用 Xiaomi
兼容 OpenAI 的端点和 API 密钥认证。请先在
[Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys) 创建你的 API 密钥，然后使用该密钥配置内置的 `xiaomi` provider。

## 内置目录

- 基础 URL：`https://api.xiaomimimo.com/v1`
- API：`openai-completions`
- 认证：`Bearer $XIAOMI_API_KEY`

| 模型引用 | 输入 | 上下文 | 最大输出 | 说明 |
| ---------------------- | ----------- | --------- | ---------- | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | 默认模型 |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | 已启用推理 |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | 已启用推理的多模态模型 |

## CLI 设置

```bash
openclaw onboard --auth-choice xiaomi-api-key
# or non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 配置片段

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## 说明

- 默认模型引用：`xiaomi/mimo-v2-flash`。
- 其他内置模型：`xiaomi/mimo-v2-pro`、`xiaomi/mimo-v2-omni`。
- 当设置了 `XIAOMI_API_KEY`（或存在认证配置文件）时，该 provider 会自动注入。
- 有关 provider 规则，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
