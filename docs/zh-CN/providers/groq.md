---
read_when:
    - 你想将 Groq 与 OpenClaw 搭配使用
    - 你需要 API 密钥环境变量或 CLI 身份验证选择
    - 你正在 Groq 上配置 Whisper 音频转录
summary: Groq 设置（身份验证 + 模型选择 + Whisper 转录）
title: Groq
x-i18n:
    generated_at: "2026-05-06T00:02:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自定义 LPU 硬件，为开放权重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）提供超高速推理。OpenClaw 包含一个内置 Groq 插件，可同时注册 OpenAI 兼容的聊天提供商和音频媒体理解提供商。

| 属性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供商 ID              | `groq`                                   |
| 插件                   | 内置，`enabledByDefault: true`           |
| 认证环境变量           | `GROQ_API_KEY`                           |
| 新手引导标志           | `--auth-choice groq-api-key`             |
| API                    | OpenAI 兼容（`openai-completions`）      |
| 基础 URL               | `https://api.groq.com/openai/v1`         |
| 音频转录               | `whisper-large-v3-turbo`（默认）         |
| 建议的默认聊天模型     | `groq/llama-3.3-70b-versatile`           |

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API key。
  </Step>
  <Step title="设置 API key">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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
  <Step title="验证目录是否可访问">
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

## 内置目录

OpenClaw 随附一个由清单支持的 Groq 目录，包含推理和非推理条目。运行 `openclaw models list --provider groq` 查看你的已安装版本内置的行，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 获取 Groq 的权威列表。

| 模型引用                                             | 名称                          | 推理 | 输入         | 上下文  |
| ---------------------------------------------------- | ----------------------------- | ---- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | 否   | 文本         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | 否   | 文本         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | 否   | 文本 + 图像  | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | 否   | 文本 + 图像  | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | 否   | 文本         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | 否   | 文本         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | 否   | 文本         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | 否   | 文本         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | 否   | 文本         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | 否   | 文本         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | 是   | 文本         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | 是   | 文本         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | 是   | 文本         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | 是   | 文本         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | 是   | 文本         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | 是   | 文本         | 131,072 |

<Tip>
  目录会随每个 OpenClaw 版本演进。`openclaw models list --provider groq` 会显示你的已安装版本已知的行；请与 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉核对新增或已弃用的模型。
</Tip>

## 推理模型

OpenClaw 会将共享的 `/think` 级别映射到 Groq 特定于模型的 `reasoning_effort` 值：

- 对于 `qwen/qwen3-32b`，禁用思考会发送 `none`，启用思考会发送 `default`。
- 对于 Groq GPT OSS 推理模型（`openai/gpt-oss-*`），OpenClaw 会根据 `/think` 级别发送 `low`、`medium` 或 `high`。禁用思考时会省略 `reasoning_effort`，因为这些模型不支持禁用值。
- DeepSeek R1 Distill、Qwen QwQ 和 Compound 使用 Groq 原生推理接口；`/think` 控制可见性，但模型始终会进行推理。

请参阅 [Thinking modes](/zh-CN/tools/thinking)，了解共享的 `/think` 级别以及 OpenClaw 如何按提供商转换它们。

## 音频转录

Groq 的内置插件还注册了一个**音频媒体理解提供商**，因此语音消息可以通过共享的 `tools.media.audio` 接口转录。

| 属性             | 值                                        |
| ---------------- | ----------------------------------------- |
| 共享配置路径     | `tools.media.audio`                       |
| 默认基础 URL     | `https://api.groq.com/openai/v1`          |
| 默认模型         | `whisper-large-v3-turbo`                  |
| 自动优先级       | 20                                        |
| API 端点         | OpenAI 兼容的 `/audio/transcriptions`     |

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
    如果 Gateway 网关作为托管服务（launchd、systemd、Docker）运行，`GROQ_API_KEY` 必须对该进程可见，而不只是对你的交互式 shell 可见。

    <Warning>
      仅放在 `~/.profile` 中的 key 无法帮助 launchd 或 systemd 守护进程，除非该环境也导入到那里。请在 `~/.openclaw/.env` 中设置 key，或通过 `env.shellEnv` 设置，使 Gateway 网关进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="自定义 Groq 模型 ID">
    OpenClaw 在运行时接受任何 Groq 模型 ID。使用 Groq 显示的确切 ID，并加上 `groq/` 前缀。内置目录覆盖常见情况；未编入目录的 ID 会回退到默认的 OpenAI 兼容模板。

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

## 相关

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Thinking modes" href="/zh-CN/tools/thinking" icon="brain">
    推理强度级别和提供商策略交互。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括提供商和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 仪表板、API 文档和定价。
  </Card>
</CardGroup>
