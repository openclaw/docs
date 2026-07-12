---
read_when:
    - 你想在 OpenClaw 中使用火山引擎或豆包模型
    - 你需要设置 Volcengine API key
    - 你想使用 Volcengine Speech 文本转语音服务
summary: 火山引擎设置（豆包模型、编程端点和 Seed Speech TTS）
title: 火山引擎（豆包）
x-i18n:
    generated_at: "2026-07-11T20:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine 提供商可访问托管在 Volcano Engine 上的豆包模型和第三方模型，并为通用工作负载与编码工作负载提供独立端点。同一个内置插件还会将 Volcengine Speech 注册为 TTS 提供商。

| 详情     | 值                                                         |
| -------- | ---------------------------------------------------------- |
| 提供商   | `volcengine`（通用 + TTS）、`volcengine-plan`（编码）      |
| 模型认证 | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS 认证 | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API      | OpenAI 兼容模型、BytePlus Seed Speech TTS                  |

## 入门指南

<Steps>
  <Step title="设置 API key">
    运行交互式新手引导：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    这会使用同一个 API key 注册通用提供商（`volcengine`）和编码提供商（`volcengine-plan`）。

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
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
对于非交互式设置（CI、脚本），请直接传入密钥：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 提供商和端点

| 提供商            | 端点                                      | 用途     |
| ----------------- | ----------------------------------------- | -------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 通用模型 |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 编码模型 |

<Note>
两个提供商均使用同一个 API key 配置。设置过程会自动注册二者，编码提供商的模型选择器也会复用通用提供商的认证信息（`volcengine-plan` 是 `volcengine` 的认证别名）。
</Note>

## 内置目录

<Tabs>
  <Tab title="通用（volcengine）">
    | 模型引用                                     | 名称                            | 输入       | 上下文  |
    | -------------------------------------------- | ------------------------------- | ---------- | ------- |
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

两个目录均为静态目录（不会调用 `/models` 进行发现），并支持与 OpenAI 兼容的流式用量统计。两个提供商的工具模式都会自动移除 `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains` 和 `maxContains` 关键字，因为 Volcengine 工具调用 API 会拒绝这些关键字。

## 文本转语音

Volcengine TTS 使用 BytePlus Seed Speech HTTP API（`voice.ap-southeast-1.bytepluses.com`），其配置独立于 OpenAI 兼容的豆包模型 API key。在 BytePlus 控制台中，打开 Seed Speech > Settings > API Keys，复制 API key，然后设置：

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

`messages.tts.providers.volcengine` 下的可用字段包括：`apiKey`、`voice`、`speedRatio`（0.2-3.0）、`emotion`、`cluster`、`resourceId`、`appKey` 和 `baseUrl`。允许覆盖语音设置时，`!emotion=<value>` 也可用作内联语音指令。

对于语音留言目标，OpenClaw 会请求提供商原生的 `ogg_opus`。对于普通音频附件，则会请求 `mp3`。提供商别名 `bytedance` 和 `doubao` 也会解析到此语音提供商。

默认资源 ID 为 `seed-tts-1.0`，这是 BytePlus 默认授予新建 Seed Speech API key 的权限。如果你的项目拥有 TTS 2.0 权限，请设置 `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`。

<Warning>
`VOLCANO_ENGINE_API_KEY` 用于 ModelArk/豆包模型端点，并不是 Seed Speech API key。TTS 需要来自 BytePlus Speech Console 的 Seed Speech API key，或旧版 Speech Console 的 AppID/token 组合。
</Warning>

旧版 Speech Console 应用仍支持 AppID/token 认证：

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

其他可选的 TTS 环境变量包括：`VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY` 和 `VOLCENGINE_TTS_BASE_URL`；设置后，它们会覆盖对应的 `messages.tts.providers.volcengine` 配置字段。

## 高级配置

<AccordionGroup>
  <Accordion title="新手引导后的默认模型">
    `openclaw onboard --auth-choice volcengine-api-key` 会将 `volcengine-plan/ark-code-latest` 设置为默认模型，同时注册通用的 `volcengine` 目录。
  </Accordion>

  <Accordion title="模型选择器的回退行为">
    在新手引导或配置期间选择模型时，Volcengine 认证选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 条目。如果这些模型尚未加载，OpenClaw 会回退到未筛选的目录，而不是显示空的提供商限定选择器。
  </Accordion>

  <Accordion title="守护进程的环境变量">
    如果 Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以访问模型和 TTS 环境变量，例如 `VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID` 和 `VOLCENGINE_TTS_TOKEN`（例如，将其放入 `~/.openclaw/.env`，或通过 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

<Warning>
以后台服务方式运行 OpenClaw 时，在交互式 shell 中设置的环境变量不会自动继承。请参阅上方的守护进程说明。
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
