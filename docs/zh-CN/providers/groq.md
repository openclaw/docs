---
read_when:
    - 你想在 OpenClaw 中使用 Groq
    - 你需要 API key 环境变量或 CLI 身份验证选项
    - 你正在 Groq 上配置 Whisper 音频转录
summary: Groq 设置（身份验证 + 模型选择 + Whisper 转录）
title: Groq
x-i18n:
    generated_at: "2026-07-11T20:53:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用定制的 LPU 硬件，为开放权重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）提供超高速推理。Groq 插件同时注册了一个兼容 OpenAI 的聊天提供商和一个音频媒体理解提供商。

| 属性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供商 ID              | `groq`                                   |
| 插件                   | 官方外部软件包                           |
| 身份验证环境变量       | `GROQ_API_KEY`                           |
| API                    | 兼容 OpenAI（`openai-completions`）      |
| 基础 URL               | `https://api.groq.com/openai/v1`         |
| 音频转录               | `whisper-large-v3-turbo`（默认）         |
| 建议的默认聊天模型     | `groq/llama-3.3-70b-versatile`           |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API key。
  </Step>
  <Step title="设置 API key">
    ```bash
export GROQ_API_KEY=gsk_...
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
  <Step title="验证模型目录是否可访问">
    ```bash
    openclaw models list --provider groq
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

## 内置模型目录

OpenClaw 随附由清单支持的 Groq 模型目录，其中包含推理和非推理条目。运行 `openclaw models list --provider groq` 可查看已安装版本中的静态条目，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 获取 Groq 的权威列表。

| 模型引用                                         | 名称                    | 推理 | 输入          | 上下文  |
| ------------------------------------------------ | ----------------------- | ---- | ------------- | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | 否   | 文本          | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | 否   | 文本          | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | 否   | 文本 + 图像   | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | 是   | 文本          | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | 是   | 文本          | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | 是   | 文本          | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | 是   | 文本          | 131,072 |
| `groq/groq/compound`                             | Compound                | 是   | 文本          | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | 是   | 文本          | 131,072 |

<Tip>
  模型目录会随每个 OpenClaw 版本演进。`openclaw models list --provider groq` 会显示已安装版本已知的条目；如需确认新增或弃用的模型，请与 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉核对。
</Tip>

## 推理模型

Groq 推理模型（即上表中 `reasoning: true` 的模型）会将 OpenClaw 的共享 `/think` 级别映射到 `low`、`medium` 或 `high` 的 `reasoning_effort` 值。使用 `/think off` 或 `/think none` 时，请求中会省略 `reasoning_effort`，而不是发送表示禁用的值。

有关共享 `/think` 级别以及 OpenClaw 如何针对各提供商转换这些级别，请参阅[思考模式](/zh-CN/tools/thinking)。

## 音频转录

Groq 插件还注册了一个**音频媒体理解提供商**，因此可以通过共享的 `tools.media.audio` 接口转录语音消息。

| 属性             | 值                                        |
| ---------------- | ----------------------------------------- |
| 共享配置路径     | `tools.media.audio`                       |
| 默认基础 URL     | `https://api.groq.com/openai/v1`          |
| 默认模型         | `whisper-large-v3-turbo`                  |
| 自动优先级       | 20                                        |
| API 端点         | 兼容 OpenAI 的 `/audio/transcriptions`    |

要将 Groq 设为默认音频后端：

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
  <Accordion title="守护进程的环境可用性">
    如果 Gateway 网关以托管服务形式运行（launchd、systemd、Docker），`GROQ_API_KEY` 必须对该进程可见，而不能仅对你的交互式 shell 可见。

    <Warning>
      除非同时将环境导入 launchd 或 systemd，否则仅在交互式 shell 中导出的密钥无法供其守护进程使用。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置密钥，使 Gateway 网关进程能够读取它。
    </Warning>

  </Accordion>

  <Accordion title="自定义 Groq 模型 ID">
    OpenClaw 在运行时接受任意 Groq 模型 ID。请使用 Groq 显示的确切 ID，并在其前面加上 `groq/`。静态模型目录涵盖常见情况；未收录的 ID 将回退到默认的 OpenAI 兼容模板。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    推理强度级别以及与提供商策略的交互。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置架构，包括提供商和音频设置。
  </Card>
  <Card title="Groq 控制台" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 仪表板、API 文档和定价。
  </Card>
</CardGroup>
