---
read_when:
    - 你想在 OpenClaw 中使用 Groq
    - 你需要 API key 环境变量或 CLI 凭证选择
    - 你正在 Groq 上配置 Whisper 音频转录
summary: Groq 设置（凭证 + 模型选择 + Whisper 转录）
title: Groq
x-i18n:
    generated_at: "2026-06-27T03:04:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自定义 LPU 硬件，在开放权重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）上提供超高速推理。Groq 插件会同时注册一个 OpenAI 兼容的聊天提供商和一个音频媒体理解提供商。

| 属性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供商 id              | `groq`                                   |
| 插件                   | 官方外部软件包                           |
| 凭证环境变量           | `GROQ_API_KEY`                           |
| API                    | OpenAI 兼容（`openai-completions`）      |
| 基础 URL               | `https://api.groq.com/openai/v1`         |
| 音频转录               | `whisper-large-v3-turbo`（默认）         |
| 建议的聊天默认值       | `groq/llama-3.3-70b-versatile`           |

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
  <Step title="验证目录可访问">
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

OpenClaw 随附一个由清单支持的 Groq 目录，其中包含推理和非推理条目。运行 `openclaw models list --provider groq` 查看你已安装版本的静态行，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 获取 Groq 的权威列表。

| 模型引用                                         | 名称                    | 推理 | 输入         | 上下文  |
| ------------------------------------------------ | ----------------------- | ---- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | 否   | 文本         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | 否   | 文本         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | 否   | 文本 + 图像  | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | 是   | 文本         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | 是   | 文本         | 131,072 |
| `groq/groq/compound`                             | Compound                | 是   | 文本         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | 是   | 文本         | 131,072 |

<Tip>
  该目录会随每个 OpenClaw 版本演进。`openclaw models list --provider groq` 会显示你的已安装版本已知的行；可与 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉核对，了解新增或已弃用的模型。
</Tip>

## 推理模型

OpenClaw 会将其共享的 `/think` 级别映射到 Groq 特定于模型的 `reasoning_effort` 值：

- 对于 `qwen/qwen3-32b`，禁用思考会发送 `none`，启用思考会发送 `default`。
- 对于 Groq GPT OSS 推理模型（`openai/gpt-oss-*`），OpenClaw 会根据 `/think` 级别发送 `low`、`medium` 或 `high`。禁用思考时会省略 `reasoning_effort`，因为这些模型不支持禁用值。
- DeepSeek R1 Distill、Qwen QwQ 和 Compound 使用 Groq 的原生推理界面；`/think` 控制可见性，但模型始终会推理。

请参阅[思考模式](/zh-CN/tools/thinking)，了解共享的 `/think` 级别以及 OpenClaw 如何按提供商翻译它们。

## 音频转录

Groq 的插件还会注册一个**音频媒体理解提供商**，因此语音消息可以通过共享的 `tools.media.audio` 界面进行转录。

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
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），`GROQ_API_KEY` 必须对该进程可见，而不仅仅是对你的交互式 shell 可见。

    <Warning>
      仅在交互式 shell 中导出的密钥无法帮助 launchd 或 systemd 守护进程，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，使 Gateway 网关进程能够读取它。
    </Warning>

  </Accordion>

  <Accordion title="自定义 Groq 模型 id">
    OpenClaw 在运行时接受任何 Groq 模型 id。使用 Groq 显示的确切 id，并为其加上 `groq/` 前缀。静态目录覆盖常见情况；未编入目录的 id 会回退到默认的 OpenAI 兼容模板。

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
    推理强度级别和提供商策略交互。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置架构，包括提供商和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 仪表板、API 文档和价格。
  </Card>
</CardGroup>
