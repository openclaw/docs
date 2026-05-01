---
read_when:
    - 你想将 Groq 与 OpenClaw 搭配使用
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Groq 设置（身份验证 + 模型选择）
title: Groq
x-i18n:
    generated_at: "2026-05-01T12:50:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自定义 LPU 硬件，为开源模型（Llama、Gemma、Mistral 等）提供超高速推理。OpenClaw 通过其 OpenAI 兼容 API 连接到 Groq。

| 属性 | 值             |
| -------- | ----------------- |
| 提供商 | `groq`            |
| 认证     | `GROQ_API_KEY`    |
| API      | OpenAI 兼容 |

## 入门指南

<Steps>
  <Step title="Get an API key">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API key。
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
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

OpenClaw 附带一个由 manifest 支撑的 Groq 目录，用于快速按提供商筛选模型列表。运行 `openclaw models list --all --provider groq` 查看内置行，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型                       | 说明                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用型，大上下文     |
| **Llama 3.1 8B Instant**    | 快速、轻量                  |
| **Gemma 2 9B**              | 紧凑、高效                 |
| **Mixtral 8x7B**            | MoE 架构，推理能力强 |

<Tip>
使用 `openclaw models list --all --provider groq` 查看此 OpenClaw 版本已知的、由 manifest 支撑的 Groq 行。
</Tip>

## 推理模型

OpenClaw 会将其共享的 `/think` 级别映射到 Groq 特定于模型的 `reasoning_effort` 值。对于 `qwen/qwen3-32b`，禁用思考会发送 `none`，启用思考会发送 `default`。对于 Groq GPT-OSS 推理模型，OpenClaw 会发送 `low`、`medium` 或 `high`；禁用思考时会省略 `reasoning_effort`，因为这些模型不支持禁用值。

## 音频转写

Groq 还提供快速的基于 Whisper 的音频转写。配置为媒体理解提供商时，OpenClaw 会使用 Groq 的 `whisper-large-v3-turbo` 模型，通过共享的 `tools.media.audio` 表面转写语音消息。

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
  <Accordion title="Audio transcription details">
    | 属性 | 值 |
    |----------|-------|
    | 共享配置路径 | `tools.media.audio` |
    | 默认基础 URL   | `https://api.groq.com/openai/v1` |
    | 默认模型      | `whisper-large-v3-turbo` |
    | API 端点       | OpenAI 兼容 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    如果 Gateway 网关 以守护进程（launchd/systemd）运行，请确保 `GROQ_API_KEY` 可供该进程使用（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥，对守护进程管理的 Gateway 网关 进程不可见。使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置以实现持久可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括提供商和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 仪表板、API 文档和定价。
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目录。
  </Card>
</CardGroup>
