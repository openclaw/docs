---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API key 或 OAuth 认证流程
summary: Google Gemini 设置（API key + OAuth、图像生成、媒体理解、TTS、Web 搜索）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T03:04:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，还支持
图像生成、媒体理解（图像/音频/视频）、文本转语音，以及通过
Gemini Grounding 进行 Web 搜索。

- 提供商：`google`
- 凭证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 运行时选项：提供商/模型 `agentRuntime.id: "google-gemini-cli"`
  会复用 Gemini CLI OAuth，同时将模型引用保持为规范的 `google/*`。

## 入门指南

选择你偏好的凭证方式并按设置步骤操作。

<Tabs>
  <Tab title="API key">
    **最适合：** 通过 Google AI Studio 使用标准 Gemini API 访问。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        或者直接传入密钥：

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    环境变量 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 都可以使用。使用你已经配置好的那个即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最适合：** 通过 PKCE OAuth 复用现有 Gemini CLI 登录，而不是单独使用 API key。

    <Warning>
    `google-gemini-cli` 提供商是非官方集成。一些用户报告称，
    以这种方式使用 OAuth 时遇到了账号限制。请自行承担风险。
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        本地 `gemini` 命令必须能在 `PATH` 上使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同时支持 Homebrew 安装和全局 npm 安装，包括
        常见的 Windows/npm 布局。
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 默认模型：`google/gemini-3.1-pro-preview`
    - 运行时：`google-gemini-cli`
    - 别名：`gemini-cli`

    Gemini 3.1 Pro 的 Gemini API 模型 ID 是 `gemini-3.1-pro-preview`。OpenClaw 接受较短的 `google/gemini-3.1-pro` 作为便捷别名，并会在调用提供商之前将其规范化。

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （或使用 `GEMINI_CLI_*` 变体。）

    <Note>
    如果 Gemini CLI OAuth 请求在登录后失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然后重试。
    </Note>

    <Note>
    如果登录在浏览器流程开始之前失败，请确保本地 `gemini`
    命令已经安装并且位于 `PATH` 上。
    </Note>

    `google-gemini-cli/*` 模型引用是旧版兼容别名。新的
    配置应使用 `google/*` 模型引用，并在需要本地 Gemini CLI 执行时搭配 `google-gemini-cli`
    运行时。

  </Tab>
</Tabs>

## 能力

| 能力                   | 支持                          |
| ---------------------- | ----------------------------- |
| 聊天补全               | 是                            |
| 图像生成               | 是                            |
| 音乐生成               | 是                            |
| 文本转语音             | 是                            |
| 实时语音               | 是（Google Live API）         |
| 图像理解               | 是                            |
| 音频转写               | 是                            |
| 视频理解               | 是                            |
| Web 搜索（Grounding）  | 是                            |
| 思考/推理              | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## Web 搜索

内置的 `gemini` Web 搜索提供商使用 Gemini Google Search grounding。
在 `plugins.entries.google.config.webSearch` 下配置专用搜索密钥，
或者让它在 `GEMINI_API_KEY` 之后复用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

凭证优先级依次为专用 `webSearch.apiKey`、`GEMINI_API_KEY`，
然后是 `models.providers.google.apiKey`。`webSearch.baseUrl` 是可选项，
用于操作员代理或兼容的 Gemini API 端点；省略时，
Gemini Web 搜索会复用 `models.providers.google.baseUrl`。请参阅
[Gemini 搜索](/zh-CN/tools/gemini-search)了解该提供商特定的工具行为。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而不是 `thinkingBudget`。OpenClaw 会将
Gemini 3、Gemini 3.1 和 `gemini-*-latest` 别名的推理控制映射到
`thinkingLevel`，这样默认/低延迟运行就不会发送已禁用的
`thinkingBudget` 值。

`/think adaptive` 会保留 Google 的动态思考语义，而不是选择
固定的 OpenClaw 级别。Gemini 3 和 Gemini 3.1 会省略固定的 `thinkingLevel`，以便
Google 可以选择级别；Gemini 2.5 会发送 Google 的动态哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持思考模式。OpenClaw
会为 Gemma 4 将 `thinkingBudget` 重写为受支持的 Google `thinkingLevel`。
将思考设置为 `off` 会保留禁用思考，而不是映射到
`MINIMAL`。
</Tip>

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 还支持 `google/gemini-3-pro-image-preview`
- 生成：每次请求最多 4 张图像
- 编辑模式：已启用，最多 5 张输入图像
- 几何控制：`size`、`aspectRatio` 和 `resolution`

要将 Google 用作默认图像提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
请参阅[图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## 视频生成

内置的 `google` 插件还会通过共享的
`video_generate` 工具注册视频生成。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文本转视频、图像转视频和单视频参考流程
- 支持 `aspectRatio`（`16:9`、`9:16`）和 `resolution`（`720P`、`1080P`）；Veo 目前不支持音频输出
- 支持的时长：**4、6 或 8 秒**（其他值会贴近到最近的允许值）

要将 Google 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## 音乐生成

内置的 `google` 插件还会通过共享的
`music_generate` 工具注册音乐生成。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 还支持 `google/lyria-3-pro-preview`
- 提示词控制：`lyrics` 和 `instrumental`
- 输出格式：默认是 `mp3`，`google/lyria-3-pro-preview` 还支持 `wav`
- 参考输入：最多 10 张图像
- 会话支持的运行会通过共享任务/状态流程分离，包括 `action: "status"`

要将 Google 用作默认音乐提供商：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
请参阅[音乐生成](/zh-CN/tools/music-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## 文本转语音

内置的 `google` 语音提供商使用 Gemini API TTS 路径，并使用
`gemini-3.1-flash-tts-preview`。

- 默认语音：`Kore`
- 凭证：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 输出：常规 TTS 附件使用 WAV，语音便笺目标使用 Opus，Talk/电话场景使用 PCM
- 语音便笺输出：Google PCM 会被封装为 WAV，并通过 `ffmpeg` 转码为 48 kHz Opus

Google 的批量 Gemini TTS 路径会在完成的
`generateContent` 响应中返回生成的音频。对于最低延迟的语音对话，请使用
由 Gemini Live API 支持的 Google 实时语音提供商，而不是批量
TTS。

要将 Google 用作默认 TTS 提供商：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然语言提示词进行风格控制。设置
`audioProfile`，可在朗读文本前添加可复用的风格提示词。当你的提示词文本引用具名说话人时，设置
`speakerName`。

Gemini API TTS 还接受文本中的表现性方括号音频标签，
例如 `[whispers]` 或 `[laughs]`。要在将标签发送给 TTS 的同时避免它们出现在可见聊天回复中，
请将它们放在 `[[tts:text]]...[[/tts:text]]`
块内：

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
限制为 Gemini API 的 Google Cloud Console API key 对此
提供商有效。这不是单独的 Cloud Text-to-Speech API 路径。
</Note>

## 实时语音

内置的 `google` 插件会注册一个由
Gemini Live API 支持的实时语音提供商，用于 Voice Call 和 Google Meet 等后端音频桥接。

| 设置                  | 配置路径                                                            | 默认值                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 语音                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | （未设置）                                                                            |
| VAD 起始灵敏度        | `...google.startSensitivity`                                        | （未设置）                                                                            |
| VAD 结束灵敏度        | `...google.endSensitivity`                                          | （未设置）                                                                            |
| 静默时长              | `...google.silenceDurationMs`                                       | （未设置）                                                                            |
| 活动处理              | `...google.activityHandling`                                        | Google 默认值，`start-of-activity-interrupts`                                        |
| 轮次覆盖范围          | `...google.turnCoverage`                                            | Google 默认值，`only-activity`                                                       |
| 禁用自动 VAD          | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 会话恢复              | `...google.sessionResumption`                                       | `true`                                                                                |
| 上下文压缩            | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 密钥              | `...google.apiKey`                                                  | 回退到 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`         |

Voice Call 实时配置示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API 通过 WebSocket 使用双向音频和函数调用。
OpenClaw 会将电话/Meet 桥接音频适配到 Gemini 的 PCM Live API 流，
并将工具调用保留在共享的实时语音契约上。除非你需要更改采样，否则保持 `temperature`
未设置；OpenClaw 会省略非正值，因为 Google Live 在 `temperature: 0`
时可能返回没有音频的转录文本。
Gemini API 转录在不设置 `languageCodes` 的情况下启用；当前 Google
SDK 会拒绝此 API 路径上的语言代码提示。
</Note>

<Note>
Control UI Talk 支持使用受限一次性 token 的 Google Live 浏览器会话。
仅后端的实时语音提供商也可以通过通用 Gateway 网关中继传输运行，该传输会将提供商凭据保留在 Gateway 网关上。
</Note>

对于维护者实时验证，运行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
该冒烟测试也覆盖 OpenAI 后端/WebRTC 路径；Google 分支会铸造与 Control UI Talk
使用的相同受限 Live API token 形状，打开浏览器 WebSocket 端点，
发送初始设置 payload，并等待 `setupComplete`。

## 高级配置

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw
    会将已配置的 `cachedContent` 句柄传递给 Gemini 请求。

    - 使用 `cachedContent` 或旧版 `cached_content` 配置按模型或全局参数
    - 如果两者都存在，`cachedContent` 优先
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 缓存命中用量会从上游 `cachedContentTokenCount` 规范化为 OpenClaw `cacheRead`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI usage notes">
    使用 `google-gemini-cli` OAuth 提供商时，OpenClaw 默认使用 Gemini
    CLI `stream-json` 输出，并从最终 `stats` payload 规范化用量。旧版
    `--output-format json` 覆盖项仍使用 JSON 解析器。

    - 流式回复文本来自 assistant `message` 事件。
    - 对于旧版 JSON 输出，回复文本来自 CLI JSON `response` 字段。
    - 当 CLI 将 `usage` 留空时，用量回退到 `stats`。
    - `stats.cached` 会规范化为 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 会从
      `stats.input_tokens - stats.cached` 派生输入 token。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    如果 Gateway 网关以守护进程运行（launchd/systemd），请确保该进程可以使用 `GEMINI_API_KEY`
    （例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="Music generation" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
</CardGroup>
