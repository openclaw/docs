---
read_when:
    - 你想在 OpenClaw 中使用 Groq
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Groq 设置（认证 + 模型选择）
title: Groq
x-i18n:
    generated_at: "2026-04-27T12:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) 通过自定义 LPU 硬件为开源模型（Llama、Gemma、Mistral 等）提供超高速推理。OpenClaw 通过其兼容 OpenAI 的 API 连接到 Groq。

| Property | Value |
| -------- | ----- |
| 提供商 | `groq` |
| 认证 | `GROQ_API_KEY` |
| API | 兼容 OpenAI |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API 密钥。
  </Step>
  <Step title="设置 API 密钥">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 配置文件示例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 内置目录

Groq 的模型目录变化频繁。运行 `openclaw models list | grep groq` 可查看当前可用模型，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models)。

| Model | Notes |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用型，大上下文 |
| **Llama 3.1 8B Instant** | 快速、轻量 |
| **Gemma 2 9B** | 紧凑、高效 |
| **Mixtral 8x7B** | MoE 架构，推理能力强 |

<Tip>
使用 `openclaw models list --provider groq` 获取你的账户当前可用的最新模型列表。
</Tip>

## 推理模型

OpenClaw 会将其共享 `/think` 级别映射为 Groq 模型特定的 `reasoning_effort` 值。对于 `qwen/qwen3-32b`，关闭 thinking 时会发送 `none`，启用 thinking 时会发送 `default`。对于 Groq GPT-OSS 推理模型，OpenClaw 会发送 `low`、`medium` 或 `high`；关闭 thinking 时则会省略 `reasoning_effort`，因为这些模型不支持关闭值。

## 音频转录

Groq 还提供基于 Whisper 的快速音频转录。当配置为媒体理解提供商时，OpenClaw 会通过共享的 `tools.media.audio` 表面，使用 Groq 的 `whisper-large-v3-turbo` 模型转录语音消息。

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="音频转录详情">
    | Property | Value |
    |----------|-------|
    | 共享配置路径 | `tools.media.audio` |
    | 默认基础 URL | `https://api.groq.com/openai/v1` |
    | 默认模型 | `whisper-large-v3-turbo` |
    | API 端点 | 兼容 OpenAI 的 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保 `GROQ_API_KEY` 对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在交互式 shell 中设置的密钥，对由守护进程管理的 Gateway 网关进程不可见。要实现持久可用，请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括提供商和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 仪表板、API 文档和定价。
  </Card>
  <Card title="Groq 模型列表" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目录。
  </Card>
</CardGroup>
