---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要 Xiaomi MiMo 认证或 Token Plan 设置
summary: 在 OpenClaw 中使用 Xiaomi MiMo 的按量付费和 Token Plan 模型
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T03:12:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 内置了一个 Xiaomi 插件，提供两个文本提供商预设：

- `xiaomi` 用于按量付费密钥（`sk-...`）
- `xiaomi-token-plan` 用于带区域端点预设的 Token Plan 密钥（`tp-...`）

同一个插件还会注册 `xiaomi` 语音（TTS）提供商。

| 属性             | 值                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 提供商 ID        | `xiaomi`（按量付费）、`xiaomi-token-plan`（Token Plan）                                                                                            |
| 插件             | 内置，`enabledByDefault: true`                                                                                                                     |
| 凭证环境变量     | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| 新手引导标志     | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 直接 CLI 标志    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| 契约             | 聊天补全 + `speechProviders`                                                                                                                       |
| API              | OpenAI 兼容（`openai-completions`）                                                                                                                |
| 基础 URL         | 按量付费：`https://api.xiaomimimo.com/v1`；Token Plan 预设：`token-plan-{cn,sgp,ams}...`                                                           |
| 默认模型         | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS 默认值       | `mimo-v2.5-tts`，语音 `mimo_default`；voicedesign 模型 `mimo-v2.5-tts-voicedesign`                                                                 |

## 入门指南

<Steps>
  <Step title="Get the right key">
    在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys)创建按量付费密钥，或打开你的 Token Plan 订阅页面，并复制区域 OpenAI 兼容基础 URL 以及匹配的 `tp-...` 密钥。
  </Step>

  <Step title="Run onboarding">
    按量付费：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan：

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    或直接传入密钥：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## 按量付费目录

| 模型引用               | 输入        | 上下文    | 最大输出 | 推理 | 说明     |
| ---------------------- | ----------- | --------- | -------- | ---- | -------- |
| `xiaomi/mimo-v2-flash` | 文本        | 262,144   | 8,192    | 否   | 默认模型 |
| `xiaomi/mimo-v2-pro`   | 文本        | 1,048,576 | 32,000   | 是   | 大上下文 |
| `xiaomi/mimo-v2-omni`  | 文本、图像  | 262,144   | 32,000   | 是   | 多模态   |

<Tip>
默认模型引用是 `xiaomi/mimo-v2-flash`。当设置了 `XIAOMI_API_KEY` 或存在凭证配置时，提供商会自动注入。
</Tip>

## Token Plan 目录

选择与 Xiaomi 订阅 UI 中显示的区域基础 URL 匹配的 Token Plan 凭证选项：

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| 模型引用                          | 输入        | 上下文    | 最大输出 | 推理 | 说明     |
| --------------------------------- | ----------- | --------- | -------- | ---- | -------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | 文本        | 1,048,576 | 131,072  | 是   | 默认模型 |
| `xiaomi-token-plan/mimo-v2.5`     | 文本、图像  | 1,048,576 | 131,072  | 是   | 多模态   |

<Tip>
Token Plan 新手引导会校验密钥格式，并在将 `tp-...` 密钥输入按量付费路径，或将 `sk-...` 密钥输入 Token Plan 路径时发出警告。
</Tip>

## 文本转语音

内置的 `xiaomi` 插件还会将 Xiaomi MiMo 注册为 `messages.tts` 的语音提供商。它会调用 Xiaomi 的聊天补全 TTS 契约，将文本作为 `assistant` 消息，并将可选风格指导作为 `user` 消息。

| 属性   | 值                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` 别名）                  |
| 凭证   | `XIAOMI_API_KEY`                         |
| API    | 带 `audio` 的 `POST /v1/chat/completions` |
| 默认值 | `mimo-v2.5-tts`，语音 `mimo_default`     |
| 输出   | 默认 MP3；配置后为 WAV                   |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

支持的内置语音包括 `mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo` 和 `Dean`。预设语音模型使用 `audio.voice`，因此 OpenClaw 会为 `mimo-v2.5-tts` 和 `mimo-v2-tts` 发送 `speakerVoice`。

Xiaomi 的 voicedesign 模型 `mimo-v2.5-tts-voicedesign` 会根据自然语言风格提示生成语音，而不是使用预设语音 ID。使用所需的语音描述配置 `style`；OpenClaw 会将其作为 `user` 消息发送，将朗读文本作为 `assistant` 消息发送，并为该模型省略 `audio.voice`。

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

对于 Feishu 和 Telegram 等语音备注目标，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48kHz Opus。

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

价格和兼容标志来自内置插件清单，因此该配置示例省略 `cost` 和 `compat`，以避免与运行时行为产生差异。

Token Plan：

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

价格来自内置清单（Token Plan 模型包含分层缓存读取价格），因此该配置示例省略 `cost`。

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    当你的环境中设置了 `XIAOMI_API_KEY` 或存在凭证配置时，`xiaomi` 提供商会自动注入。`xiaomi-token-plan` 需要区域基础 URL，因此支持的路径是内置 Token Plan 新手引导选项，或显式的 `models.providers.xiaomi-token-plan` 配置块。
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — 轻量且快速，适合通用文本任务。不支持推理。
    - **mimo-v2-pro** — 支持推理，提供 1M token 上下文窗口，适合长文档工作负载。
    - **mimo-v2-omni** — 启用推理的多模态模型，同时接受文本和图像输入。
    - **mimo-v2.5-pro** — Token Plan 默认模型，使用 Xiaomi 当前的 V2.5 推理栈。
    - **mimo-v2.5** — Token Plan 多模态 V2.5 路由。

    <Note>
    按量付费模型使用 `xiaomi/` 前缀。Token Plan 模型使用 `xiaomi-token-plan/` 前缀。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 如果模型未出现，请确认相关密钥环境变量或凭证配置存在且有效。
    - 对于 Token Plan，请确认所选新手引导区域与订阅页面基础 URL 匹配，并且密钥以 `tp-` 开头。
    - 当 Gateway 网关作为守护进程运行时，请确保该进程可以访问密钥（例如通过 `~/.openclaw/.env` 或 `env.shellEnv`）。

    <Warning>
    仅在交互式 shell 中设置的密钥对守护进程管理的 Gateway 网关进程不可见。使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来持久提供。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 仪表板和 API 密钥管理。
  </Card>
</CardGroup>
