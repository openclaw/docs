---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API key 或 OAuth 身份验证流程
summary: Google Gemini 设置（API key + OAuth、图像生成、媒体理解、TTS、Web 搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-07-12T14:43:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Google 插件可通过 Google AI Studio 访问 Gemini 模型，并提供图像生成、媒体理解（图像/音频/视频）、文本转语音以及通过 Gemini Grounding 实现的 Web 搜索功能。

- 提供商：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 运行时选项：`agentRuntime.id: "google-gemini-cli"` 可复用 Gemini CLI OAuth，同时将模型引用规范地保持为 `google/*`。

## 入门指南

选择你偏好的身份验证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥">
    **最适合：**通过 Google AI Studio 进行标准 Gemini API 访问。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="设置默认模型">
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 均可使用。使用你已经配置的那个即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最适合：**通过 PKCE OAuth 复用现有的 Gemini CLI 登录，而不是使用单独的 API 密钥。

    <Warning>
    `google-gemini-cli` 提供商是非官方集成。一些用户
    报告称以这种方式使用 OAuth 时遇到了账号限制。请自行承担风险。
    </Warning>

    <Steps>
      <Step title="安装 Gemini CLI">
        本地 `gemini` 命令必须在 `PATH` 中可用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # 或 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同时支持 Homebrew 安装和全局 npm 安装，包括
        常见的 Windows/npm 布局。
      </Step>
      <Step title="通过 OAuth 登录">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 默认模型：`google/gemini-3.1-pro-preview`
    - 运行时：`google-gemini-cli`
    - 别名：`gemini-cli`

    Gemini 3.1 Pro 的 Gemini API 模型 ID 是 `gemini-3.1-pro-preview`。为方便使用，OpenClaw 接受较短的 `google/gemini-3.1-pro` 别名，并在调用提供商之前将其规范化。

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    如果登录后 Gemini CLI OAuth 请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然后重试。
    </Note>

    <Note>
    如果浏览器流程开始前登录就失败，请确保本地已安装 `gemini`
    命令并且该命令位于 `PATH` 中。
    </Note>

    `google-gemini-cli/*` 模型引用是旧版兼容别名。需要在本地执行
    Gemini CLI 时，新配置应使用 `google/*` 模型引用以及
    `google-gemini-cli` 运行时。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` 已于 2026-03-09 停用；请改用 `google/gemini-3.1-pro-preview`。重新运行 Gemini API 密钥设置（`openclaw onboard --auth-choice gemini-api-key` 或 `openclaw models auth login --provider google`）会将过时的已配置默认值重写为当前模型。
</Note>

## 能力

| 能力                   | 支持情况                      |
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

内置的 `gemini` Web 搜索提供商使用 Gemini Google Search Grounding。
可在 `plugins.entries.google.config.webSearch` 下配置专用搜索密钥，
也可以让它在 `GEMINI_API_KEY` 之后复用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY 或 models.providers.google.apiKey，则为可选
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 回退到 models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

凭证优先级依次为专用的 `webSearch.apiKey`、`GEMINI_API_KEY`，
然后是 `models.providers.google.apiKey`。`webSearch.baseUrl` 是可选项，
适用于操作员代理或兼容的 Gemini API 端点；省略时，
Gemini Web 搜索会复用 `models.providers.google.baseUrl`。有关提供商特定的工具行为，请参阅
[Gemini 搜索](/zh-CN/tools/gemini-search)。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而不是 `thinkingBudget`。OpenClaw 会将
Gemini 3、Gemini 3.1 和 `gemini-*-latest` 别名的推理控制映射到
`thinkingLevel`，从而使默认/低延迟运行不会发送已禁用的
`thinkingBudget` 值。

`/think adaptive` 会保留 Google 的动态思考语义，而不是选择
固定的 OpenClaw 级别。Gemini 3 和 Gemini 3.1 会省略固定的 `thinkingLevel`，以便
Google 可以选择级别；Gemini 2.5 则发送 Google 的动态哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持思考模式。OpenClaw
会将 `thinkingBudget` 重写为 Gemma 4 支持的 Google `thinkingLevel`。
将思考设置为 `off` 会保持禁用思考，而不是映射到
`MINIMAL`。

Gemini 2.5 Pro 只能在思考模式下工作，并会拒绝显式的
`thinkingBudget: 0`；OpenClaw 会从 Gemini 2.5 Pro 请求中移除该值，
而不是发送它。
</Tip>

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 还支持 `google/gemini-3-pro-image-preview`
- 生成：每个请求最多 4 张图像
- 编辑模式：已启用，最多可输入 5 张图像
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
有关共享工具参数、提供商选择和故障转移行为，请参阅[图像生成](/zh-CN/tools/image-generation)。
</Note>

## 视频生成

内置的 `google` 插件还通过共享的
`video_generate` 工具注册视频生成功能。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文本生成视频、图像生成视频以及单视频参考流程
- 支持 `aspectRatio`（`16:9`、`9:16`）和 `resolution`（`720P`、`1080P`）；Veo 目前不支持音频输出
- 支持的时长：**4、6 或 8 秒**（其他值会调整为最接近的允许值）

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
</Note>

## 音乐生成

内置的 `google` 插件还通过共享的
`music_generate` 工具注册音乐生成功能。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 还支持 `google/lyria-3-pro-preview`
- 提示词控制：`lyrics` 和 `instrumental`
- 输出格式：默认为 `mp3`，`google/lyria-3-pro-preview` 还支持 `wav`
- 参考输入：最多 10 张图像
- 由会话支持的运行会通过共享任务/状态流程转为后台执行，其中包括 `action: "status"`

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[音乐生成](/zh-CN/tools/music-generation)。
</Note>

## 文本转语音

内置的 `google` 语音提供商通过
`gemini-3.1-flash-tts-preview` 使用 Gemini API TTS 路径。

- 默认语音：`Kore`
- 身份验证：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 输出：常规 TTS 附件使用 WAV，语音消息目标使用 Opus，Talk/电话使用 PCM
- 语音消息输出：Google PCM 会封装为 WAV，并使用 `ffmpeg` 转码为 48 kHz Opus

Google 的批处理 Gemini TTS 路径会在已完成的
`generateContent` 响应中返回生成的音频。要获得最低延迟的语音对话，请使用
由 Gemini Live API 支持的 Google 实时语音提供商，而不是批处理
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

Gemini API TTS 使用自然语言提示词来控制风格。设置
`audioProfile`，可在要朗读的文本前添加可复用的风格提示词。当提示词文本指向某个具名说话者时，请设置
`speakerName`。

Gemini API TTS 还接受文本中富有表现力的方括号音频标签，
例如 `[whispers]` 或 `[laughs]`。要在向 TTS 发送这些标签的同时避免其出现在可见的聊天回复中，
请将它们放在 `[[tts:text]]...[[/tts:text]]`
块内：

```text
这是整洁的回复文本。

[[tts:text]][whispers] 这是朗读版本。[[/tts:text]]
```

<Note>
仅限 Gemini API 的 Google Cloud Console API 密钥可用于此
提供商。这并非单独的 Cloud Text-to-Speech API 路径。
</Note>

## 实时语音

内置的 `google` 插件注册了一个由
Gemini Live API 支持的实时语音提供商，用于 Voice Call 和 Google Meet 等后端音频桥接。

| 设置               | 配置路径                                                         | 默认值                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 语音                 | `...google.voice`                                                   | `Kore`                                                                                |
| 温度           | `...google.temperature`                                             | （未设置）                                                                               |
| VAD 开始灵敏度 | `...google.startSensitivity`                                        | （未设置）                                                                               |
| VAD 结束灵敏度   | `...google.endSensitivity`                                          | （未设置）                                                                               |
| 静默时长      | `...google.silenceDurationMs`                                       | （未设置）                                                                               |
| 活动处理     | `...google.activityHandling`                                        | Google 默认值，`start-of-activity-interrupts`                                        |
| 轮次覆盖范围         | `...google.turnCoverage`                                            | Google 默认值，`audio-activity-and-all-video`                                        |
| 禁用自动 VAD      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 会话恢复    | `...google.sessionResumption`                                       | `true`                                                                                |
| 上下文压缩   | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 密钥               | `...google.apiKey`                                                  | 回退到 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
OpenClaw 将电话/Meet 桥接音频适配到 Gemini 的 PCM Live API 流，并
让工具调用继续使用共享的实时语音契约。除非需要更改采样，否则请保持 `temperature`
未设置；OpenClaw 会省略非正值，因为当 `temperature: 0` 时，
Google Live 可能返回没有音频的转录文本。
启用 Gemini API 转录时无需设置 `languageCodes`；当前 Google
SDK 会拒绝此 API 路径上的语言代码提示。
</Note>

<Note>
Gemini 3.1 Live 通过实时输入接受对话文本，并使用
顺序函数调用。对于此模型，OpenClaw 会省略旧版 `NON_BLOCKING`、函数
响应调度和情感对话字段。优先使用
`thinkingLevel`；配置的正 `thinkingBudget` 值会映射到
最接近的受支持级别，而 `-1` 会保留 Google 的默认值。请参阅
[Gemini Live 能力对比](https://ai.google.dev/gemini-api/docs/live-api/capabilities)。
</Note>

<Note>
Control UI Talk 支持使用受限一次性
令牌的 Google Live 浏览器会话。仅后端实时语音提供商也可以通过通用
Gateway 网关中继传输运行，这会将提供商凭据保留在 Gateway 网关上。
</Note>

如需进行维护者实时验证，请运行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
该冒烟测试也覆盖 OpenAI 后端/WebRTC 路径；Google 环节会生成与
Control UI Talk 所用格式相同的受限 Live API 令牌，打开浏览器
WebSocket 端点，发送初始设置负载，并等待
`setupComplete`。

## 高级配置

<AccordionGroup>
  <Accordion title="直接复用 Gemini 缓存">
    对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw
    会将已配置的 `cachedContent` 句柄传递给 Gemini 请求。

    - 使用 `cachedContent` 或旧版 `cached_content`
      配置每模型或全局参数
    - 更具体作用域中的参数（模型级优先于全局）始终优先。
      在同一作用域内，如果两个键都已设置，则 `cached_content` 优先。
      每个作用域只使用一个键，以免出现意外。
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 缓存命中用量会从上游 `cachedContentTokenCount`
      规范化为 OpenClaw `cacheRead`

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

  <Accordion title="Gemini CLI 使用说明">
    使用 `google-gemini-cli` OAuth 提供商时，OpenClaw 默认使用 Gemini
    CLI 的 `stream-json` 输出，并从最终的
    `stats` 负载中规范化用量。旧版 `--output-format json` 覆盖仍使用
    JSON 解析器。

    - 流式回复文本来自助手的 `message` 事件。
    - 对于旧版 JSON 输出，回复文本来自 CLI JSON 的 `response` 字段。
    - 当 CLI 将 `usage` 留空时，用量会回退到 `stats`。
    - `stats.cached` 会规范化为 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 会通过
      `stats.input_tokens - stats.cached` 推导输入令牌数。

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以访问
    `GEMINI_API_KEY`（例如，在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享的图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享的音乐工具参数和提供商选择。
  </Card>
</CardGroup>
