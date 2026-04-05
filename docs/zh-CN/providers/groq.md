---
read_when:
    - 你想将 Groq 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Groq 设置（认证 + 模型选择）
title: Groq
x-i18n:
    generated_at: "2026-04-05T08:42:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) 使用自定义的 LPU 硬件，在开源模型
（Llama、Gemma、Mistral 等）上提供超高速推理。OpenClaw 通过其兼容 OpenAI 的 API 连接到 Groq。

- 提供商：`groq`
- 认证：`GROQ_API_KEY`
- API：兼容 OpenAI

## 快速开始

1. 从 [console.groq.com/keys](https://console.groq.com/keys) 获取 API 密钥。

2. 设置 API 密钥：

```bash
export GROQ_API_KEY="gsk_..."
```

3. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 配置文件示例

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

## 音频转录

Groq 还提供基于 Whisper 的高速音频转录。配置为媒体理解提供商后，OpenClaw 会使用 Groq 的 `whisper-large-v3-turbo` 模型，通过共享的 `tools.media.audio` 接口来转录语音消息。

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

## 环境说明

如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `GROQ_API_KEY` 对该进程可用（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。

## 音频说明

- 共享配置路径：`tools.media.audio`
- 默认的 Groq 音频基础 URL：`https://api.groq.com/openai/v1`
- 默认的 Groq 音频模型：`whisper-large-v3-turbo`
- Groq 音频转录使用兼容 OpenAI 的 `/audio/transcriptions`
  路径

## 可用模型

Groq 的模型目录经常变化。运行 `openclaw models list | grep groq`
查看当前可用模型，或查看
[console.groq.com/docs/models](https://console.groq.com/docs/models)。

热门选择包括：

- **Llama 3.3 70B Versatile** - 通用型，大上下文
- **Llama 3.1 8B Instant** - 速度快，轻量级
- **Gemma 2 9B** - 紧凑，高效
- **Mixtral 8x7B** - MoE 架构，推理能力强

## 链接

- [Groq Console](https://console.groq.com)
- [API 文档](https://console.groq.com/docs)
- [模型列表](https://console.groq.com/docs/models)
- [定价](https://groq.com/pricing)
