---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你需要 Mistral API 密钥新手引导和模型引用
summary: 在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录
title: Mistral
x-i18n:
    generated_at: "2026-04-07T07:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw 支持将 Mistral 用于文本/图像模型路由（`mistral/...`），以及在媒体理解中通过 Voxtral 进行音频转录。
Mistral 也可用于记忆嵌入（`memorySearch.provider = "mistral"`）。

## CLI 设置

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## 配置片段（LLM 提供商）

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## 内置 LLM 目录

OpenClaw 当前附带以下内置 Mistral 目录：

| Model ref                        | Input       | Context | Max output | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | 默认模型                                                         |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4；可通过 API `reasoning_effort` 调整推理强度      |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | 编码                                                             |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | 启用推理                                                         |

## 配置片段（使用 Voxtral 的音频转录）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## 可调推理（`mistral-small-latest`）

`mistral/mistral-small-latest` 对应 Mistral Small 4，并通过 `reasoning_effort` 支持在 Chat Completions API 上进行[可调推理](https://docs.mistral.ai/capabilities/reasoning/adjustable)（`none` 会尽量减少输出中的额外思考；`high` 会在最终答案前展示完整的思考轨迹）。

OpenClaw 会将会话 **thinking** 级别映射到 Mistral 的 API：

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

其他内置 Mistral 目录模型不会使用此参数；如果你想使用 Mistral 原生的以推理优先为核心的行为，请继续使用 `magistral-*` 模型。

## 说明

- Mistral 认证使用 `MISTRAL_API_KEY`。
- 提供商基础 URL 默认为 `https://api.mistral.ai/v1`。
- 新手引导默认模型为 `mistral/mistral-large-latest`。
- Mistral 的媒体理解默认音频模型为 `voxtral-mini-latest`。
- 媒体转录路径使用 `/v1/audio/transcriptions`。
- 记忆嵌入路径使用 `/v1/embeddings`（默认模型：`mistral-embed`）。
