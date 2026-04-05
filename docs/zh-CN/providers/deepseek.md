---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: DeepSeek 设置（认证 + 模型选择）
x-i18n:
    generated_at: "2026-04-05T08:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) 通过与 OpenAI 兼容的 API 提供强大的 AI 模型。

- 提供商：`deepseek`
- 认证：`DEEPSEEK_API_KEY`
- API：与 OpenAI 兼容
- Base URL：`https://api.deepseek.com`

## 快速开始

设置 API 密钥（推荐：为 Gateway 网关保存它）：

```bash
openclaw onboard --auth-choice deepseek-api-key
```

这会提示你输入 API 密钥，并将 `deepseek/deepseek-chat` 设为默认模型。

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## 环境说明

如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保 `DEEPSEEK_API_KEY`
对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
`env.shellEnv` 提供）。

## 内置目录

| 模型引用                     | 名称              | 输入 | 上下文    | 最大输出   | 说明                                              |
| ---------------------------- | ----------------- | ---- | --------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072   | 8,192      | 默认模型；DeepSeek V3.2 非思考表面                |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072   | 65,536     | 启用推理的 V3.2 表面                              |

当前，这两个内置模型在源中都声明支持流式使用量兼容性。

请在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 获取你的 API 密钥。
