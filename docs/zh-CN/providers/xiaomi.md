---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要设置 XIAOMI_API_KEY
summary: 在 OpenClaw 中使用 Xiaomi MiMo 模型
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T00:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 包含一个内置的 `xiaomi` 插件，它会用同一个 `XIAOMI_API_KEY` 注册一个兼容 OpenAI 的聊天提供商和一个语音（TTS）提供商。

| 属性            | 值                                       |
| --------------- | ---------------------------------------- |
| 提供商 id       | `xiaomi`                                 |
| 插件            | 内置，`enabledByDefault: true`           |
| 认证环境变量    | `XIAOMI_API_KEY`                         |
| 新手引导标志    | `--auth-choice xiaomi-api-key`           |
| 直接 CLI 标志   | `--xiaomi-api-key <key>`                 |
| 合约            | 聊天补全 + `speechProviders`             |
| API             | 兼容 OpenAI（`openai-completions`）      |
| 基础 URL        | `https://api.xiaomimimo.com/v1`          |
| 默认模型        | `xiaomi/mimo-v2-flash`                   |
| TTS 默认值      | `mimo-v2.5-tts`，语音 `mimo_default`     |

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys)中创建 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    或者直接传入密钥：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 内置目录

| 模型引用               | 输入        | 上下文    | 最大输出 | 推理      | 备注       |
| ---------------------- | ----------- | --------- | -------- | --------- | ---------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192    | 否        | 默认模型   |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000   | 是        | 大上下文   |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000   | 是        | 多模态     |

<Tip>
默认模型引用是 `xiaomi/mimo-v2-flash`。当设置了 `XIAOMI_API_KEY` 或存在认证配置文件时，提供商会自动注入。
</Tip>

## 文本转语音

内置的 `xiaomi` 插件还会将 Xiaomi MiMo 注册为用于
`messages.tts` 的语音提供商。它会调用 Xiaomi 的聊天补全 TTS 合约，将文本作为
`assistant` 消息，并将可选的风格指导作为 `user` 消息。

| 属性    | 值                                       |
| ------- | ---------------------------------------- |
| TTS id  | `xiaomi`（`mimo` 别名）                  |
| 认证    | `XIAOMI_API_KEY`                         |
| API     | 带有 `audio` 的 `POST /v1/chat/completions` |
| 默认值  | `mimo-v2.5-tts`，语音 `mimo_default`     |
| 输出    | 默认 MP3；配置后为 WAV                   |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

支持的内置语音包括 `mimo_default`、`default_zh`、`default_en`、
`Mia`、`Chloe`、`Milo` 和 `Dean`。较旧的 MiMo
TTS 账号支持 `mimo-v2-tts`；默认使用当前的 MiMo-V2.5 TTS 模型。对于 Feishu 和 Telegram 等语音备注目标，OpenClaw 会在交付前使用 `ffmpeg` 将 Xiaomi 输出转码为 48kHz
Opus。

## 配置示例

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

<AccordionGroup>
  <Accordion title="自动注入行为">
    当你的环境中设置了 `XIAOMI_API_KEY` 或存在认证配置文件时，`xiaomi` 提供商会自动注入。除非你想覆盖模型元数据或基础 URL，否则无需手动配置提供商。
  </Accordion>

  <Accordion title="模型详情">
    - **mimo-v2-flash** — 轻量且快速，适合通用文本任务。不支持推理。
    - **mimo-v2-pro** — 支持推理，具备 1M token 上下文窗口，适合长文档工作负载。
    - **mimo-v2-omni** — 启用推理的多模态模型，同时接受文本和图像输入。

    <Note>
    所有模型都使用 `xiaomi/` 前缀（例如 `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="故障排除">
    - 如果模型没有出现，请确认 `XIAOMI_API_KEY` 已设置且有效。
    - 当 Gateway 网关作为守护进程运行时，请确保该密钥对该进程可用（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    只在交互式 shell 中设置的密钥对由守护进程管理的 Gateway 网关进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来确保可持久使用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Xiaomi MiMo 控制台" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 仪表板和 API key 管理。
  </Card>
</CardGroup>
