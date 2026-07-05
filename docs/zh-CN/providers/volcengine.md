---
read_when:
    - 你想在 OpenClaw 中使用火山引擎或豆包模型
    - 你需要完成 Volcengine API key 设置
    - 你想使用 Volcengine Speech 文本转语音
summary: Volcano Engine 设置（Doubao 模型、编码端点和 Seed Speech TTS）
title: 火山引擎（豆包）
x-i18n:
    generated_at: "2026-07-05T11:40:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine 提供商可访问托管在 Volcano Engine 上的 Doubao 模型和第三方模型，并为通用与编码工作负载提供独立端点。同一个内置插件还会将 Volcengine Speech 注册为 TTS 提供商。

| 详情       | 值                                                         |
| ---------- | ---------------------------------------------------------- |
| 提供商     | `volcengine`（通用 + TTS）、`volcengine-plan`（编码）      |
| 模型凭证   | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS 凭证   | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | 兼容 OpenAI 的模型、BytePlus Seed Speech TTS               |

## 入门指南

<Steps>
  <Step title="设置 API key">
    运行交互式新手引导：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    这会使用单个 API key 注册通用（`volcengine`）和编码（`volcengine-plan`）提供商。

  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
对于非交互式设置（CI、脚本），请直接传入 key：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 提供商和端点

| 提供商            | 端点                                      | 使用场景 |
| ----------------- | ----------------------------------------- | -------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 通用模型 |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 编码模型 |

<Note>
两个提供商都使用单个 API key 配置。设置会自动注册两者，并且编码提供商的模型选择器也会复用通用提供商的凭证（`volcengine-plan` 是 `volcengine` 的凭证别名）。
</Note>

## 内置目录

<Tabs>
  <Tab title="通用（volcengine）">
    | 模型引用                                     | 名称                            | 输入       | 上下文  |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | 文本、图像 | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | 文本、图像 | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | 文本、图像 | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | 文本、图像 | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | 文本、图像 | 256,000 |
  </Tab>
  <Tab title="编码（volcengine-plan）">
    | 模型引用                                          | 名称                     | 输入 | 上下文  |
    | ------------------------------------------------- | ------------------------ | ---- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | 文本 | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | 文本 | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | 文本 | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | 文本 | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | 文本 | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | 文本 | 256,000 |
  </Tab>
</Tabs>

两个目录都是静态的（没有 `/models` 设备发现调用），并支持兼容 OpenAI 的流式用量计费。两个提供商的工具架构都会自动丢弃 `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains` 和 `maxContains` 关键字，因为 Volcengine 工具调用 API 会拒绝它们。

## 文本转语音

Volcengine TTS 使用 BytePlus Seed Speech HTTP API（`voice.ap-southeast-1.bytepluses.com`），并且与兼容 OpenAI 的 Doubao 模型 API key 分开配置。在 BytePlus 控制台中，打开 Seed Speech > Settings > API Keys，复制 API key，然后设置：

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

然后在 `openclaw.json` 中启用它：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

`messages.tts.providers.volcengine` 下可用字段：`apiKey`、`voice`、`speedRatio`（0.2-3.0）、`emotion`、`cluster`、`resourceId`、`appKey` 和 `baseUrl`。在允许覆盖语音设置时，`!emotion=<value>` 也可作为内联语音指令使用。

对于语音备注目标，OpenClaw 会请求提供商原生的 `ogg_opus`。对于普通音频附件，它会请求 `mp3`。提供商别名 `bytedance` 和 `doubao` 也会解析到此语音提供商。

默认资源 ID 是 `seed-tts-1.0`，这是 BytePlus 默认授予新创建的 Seed Speech API key 的权益。如果你的项目拥有 TTS 2.0 权益，请设置 `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`。

<Warning>
`VOLCANO_ENGINE_API_KEY` 用于 ModelArk/Doubao 模型端点，并不是 Seed Speech API key。TTS 需要来自 BytePlus Speech Console 的 Seed Speech API key，或旧版 Speech Console AppID/token 对。
</Warning>

旧版 AppID/token 凭证仍支持较早的 Speech Console 应用：

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

其他可选 TTS 环境变量：设置后，`VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY` 和 `VOLCENGINE_TTS_BASE_URL` 会覆盖对应的 `messages.tts.providers.volcengine` 配置字段。

## 高级配置

<AccordionGroup>
  <Accordion title="新手引导后的默认模型">
    `openclaw onboard --auth-choice volcengine-api-key` 会将 `volcengine-plan/ark-code-latest` 设为默认模型，同时注册通用 `volcengine` 目录。
  </Accordion>

  <Accordion title="模型选择器回退行为">
    在新手引导/配置模型选择期间，Volcengine 凭证选项会优先选择 `volcengine/*` 和 `volcengine-plan/*` 两类行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示空的提供商范围选择器。
  </Accordion>

  <Accordion title="守护进程的环境变量">
    如果 Gateway 网关 作为守护进程（launchd/systemd）运行，请确保模型和 TTS 环境变量（例如 `VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID` 和 `VOLCENGINE_TTS_TOKEN`）可供该进程使用（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

<Warning>
当 OpenClaw 作为后台服务运行时，你在交互式 shell 中设置的环境变量不会自动继承。请参见上面的守护进程说明。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="常见问题" href="/zh-CN/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
