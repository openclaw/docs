---
read_when:
    - 你想将 Google Gemini 模型与 OpenClaw 搭配使用
    - 你需要 API key 或 OAuth 身份验证流程
summary: Google Gemini 设置（API key + OAuth、图像生成、媒体理解、TTS、Web 搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-07-16T11:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，以及图像生成、媒体理解（图像/音频/视频）、文本转语音和通过 Gemini Grounding 实现的 Web 搜索。

- 提供商：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 运行时选项：`agentRuntime.id: "google-gemini-cli"` 复用 Gemini CLI OAuth，同时将模型引用规范保持为 `google/*`。

## 入门指南

选择首选的身份验证方法，然后按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥">
    **最适合：**通过 Google AI Studio 进行标准 Gemini API 访问。

    <Steps>
      <Step title="获取 API 密钥">
        在 [Google AI Studio](https://aistudio.google.com/apikey) 中创建免费密钥。
      </Step>
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
    `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 均可使用。使用已配置的任意一个即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最适合：**通过 Gemini CLI OAuth 登录 Google 账号，而不是使用单独的 API 密钥。

    <Warning>
    `google-gemini-cli` 提供商是非官方集成。一些用户
    报告称以这种方式使用 OAuth 时账号会受到限制。请自行承担风险。
    </Warning>

    <Steps>
      <Step title="安装 Gemini CLI">
        本地 `gemini` 命令必须可在 `PATH` 中使用。

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

    Gemini 3.1 Pro 的 Gemini API 模型 ID 为 `gemini-3.1-pro-preview`。OpenClaw 接受更短的 `google/gemini-3.1-pro` 作为便捷别名，并在调用提供商之前将其规范化。

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    如果 Gemini CLI OAuth 请求在登录后失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然后重试。
    </Note>

    <Note>
    如果登录在浏览器流程启动前失败，请确保本地 `gemini`
    命令已安装且位于 `PATH` 中。
    </Note>

    新手引导自动检测会列出现有的 Gemini CLI 登录，但绝不会
    自动测试，因为 Gemini CLI 没有不使用工具的探测方式。选择 Gemini CLI
    OAuth 或 Gemini API 密钥以继续。

    `google-gemini-cli/*` 模型引用是旧版兼容别名。新
    配置如需在本地执行 Gemini CLI，应使用 `google/*` 模型引用和
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
| 音频转录               | 是                            |
| 视频理解               | 是                            |
| Web 搜索（Grounding）  | 是                            |
| 思考/推理              | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## Web 搜索

内置的 `gemini` Web 搜索提供商使用 Gemini Google Search Grounding。
在 `plugins.entries.google.config.webSearch` 下配置专用搜索密钥，
或让其在 `GEMINI_API_KEY` 之后复用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 如果设置了 GEMINI_API_KEY 或 models.providers.google.apiKey，则可选
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 回退到 models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

凭据优先级依次为专用的 `webSearch.apiKey`、`GEMINI_API_KEY`，
然后是 `models.providers.google.apiKey`。`webSearch.baseUrl` 是可选项，
用于运维人员代理或兼容的 Gemini API 端点；省略时，
Gemini Web 搜索会复用 `models.providers.google.baseUrl`。有关提供商特定的工具行为，请参阅
[Gemini 搜索](/zh-CN/tools/gemini-search)。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而不是 `thinkingBudget`。OpenClaw 将
Gemini 3、Gemini 3.1 和 `gemini-*-latest` 别名的推理控制映射到
`thinkingLevel`，因此默认/低延迟运行不会发送已禁用的
`thinkingBudget` 值。

`/think adaptive` 会保留 Google 的动态思考语义，而不是选择
固定的 OpenClaw 级别。Gemini 3 和 Gemini 3.1 会省略固定的 `thinkingLevel`，以便
Google 可以选择级别；Gemini 2.5 则发送 Google 的动态哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持思考模式。OpenClaw
会将 `thinkingBudget` 重写为 Gemma 4 支持的 Google `thinkingLevel`。
将思考设置为 `off` 会保持禁用思考，而不是映射到
`MINIMAL`。

Gemini 2.5 Pro 只能在思考模式下工作，并且会拒绝显式的
`thinkingBudget: 0`；对于 Gemini 2.5 Pro 请求，OpenClaw 会移除该值，
而不是将其发送。
</Tip>

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 还支持 `google/gemini-3-pro-image-preview`
- 生成：每个请求最多生成 4 张图像
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
- 模式：文本生成视频、图像生成视频和单视频引用流程
- 支持 `aspectRatio`（`16:9`、`9:16`）和 `resolution`（`720P`、`1080P`）；目前 Veo 不支持音频输出
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
- 输出格式：默认使用 `mp3`，在 `google/lyria-3-pro-preview` 上还支持 `wav`
- 引用输入：最多 10 张图像
- 由会话支持的运行会通过共享任务/状态流程分离，包括 `action: "status"`

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

Google 的批量 Gemini TTS 路径会在已完成的
`generateContent` 响应中返回生成的音频。对于延迟最低的语音对话，请使用
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
          audioProfile: "以沉稳的语气专业地说话。",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然语言提示词控制风格。设置
`audioProfile`，可在朗读文本前添加可复用的风格提示词。如果提示词文本引用了指定的说话者，请设置
`speakerName`。

Gemini API TTS 还接受文本中富有表现力的方括号音频标签，
例如 `[whispers]` 或 `[laughs]`。要让标签不出现在可见的聊天回复中，
但仍将其发送给 TTS，请将其放入 `[[tts:text]]...[[/tts:text]]`
块中：

```text
这是干净的回复文本。

[[tts:text]][whispers] 这是朗读版本。[[/tts:text]]
```

<Note>
限制为仅用于 Gemini API 的 Google Cloud Console API 密钥对此
提供商有效。这不是独立的 Cloud Text-to-Speech API 路径。
</Note>

## 实时语音

内置的 `google` 插件注册了由
Gemini Live API 支持的实时语音提供商，用于 Voice Call 和 Google Meet 等后端音频桥接。

| 设置                  | 配置路径                                                            | 默认值                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 语音                  | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                  | `...google.temperature`                                             | （未设置）                                                                            |
| VAD 开始灵敏度        | `...google.startSensitivity`                                        | （未设置）                                                                            |
| VAD 结束灵敏度        | `...google.endSensitivity`                                          | （未设置）                                                                            |
| 静音时长              | `...google.silenceDurationMs`                                       | （未设置）                                                                            |
| 活动处理              | `...google.activityHandling`                                        | Google 默认值，`start-of-activity-interrupts`                                        |
| 轮次覆盖范围          | `...google.turnCoverage`                                            | Google 默认值，`audio-activity-and-all-video`                                        |
| 禁用自动 VAD          | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 会话恢复              | `...google.sessionResumption`                                       | `true`                                                                                |
| 上下文压缩            | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 密钥              | `...google.apiKey`                                                  | 回退到 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

语音通话实时配置示例：

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
在共享的实时语音契约上保留工具调用。除非需要更改采样，否则请将 `temperature`
保持未设置；OpenClaw 会省略非正值，因为对于 `temperature: 0`，
Google Live 可能返回没有音频的转录文本。
Gemini API 转录无需 `languageCodes` 即可启用；当前 Google
SDK 会拒绝此 API 路径上的语言代码提示。
</Note>

<Note>
Gemini 3.1 Live 通过实时输入接受对话文本，并使用
顺序函数调用。对于此模型，OpenClaw 会省略旧版 `NON_BLOCKING`、函数
响应调度和情感对话字段。优先使用
`thinkingLevel`；配置的正 `thinkingBudget` 值会映射到最接近的
受支持级别，而 `-1` 会保留 Google 的默认值。请参阅
[Gemini Live 能力比较](https://ai.google.dev/gemini-api/docs/live-api/capabilities)。
</Note>

<Note>
Control UI Talk 支持使用受限一次性
令牌的 Google Live 浏览器会话。仅后端的实时语音提供商也可以通过通用
Gateway 网关中继传输运行，该传输会将提供商凭据保留在 Gateway 网关上。
</Note>

如需维护者进行实时验证，请运行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
该冒烟测试还涵盖 OpenAI 后端/WebRTC 路径；Google 部分会生成与
Control UI Talk 所用格式相同的受限 Live API 令牌，打开浏览器
WebSocket 端点，发送初始设置负载，并等待
`setupComplete`。

## 高级配置

<AccordionGroup>
  <Accordion title="直接复用 Gemini 缓存">
    对于直接运行 Gemini API（`api: "google-generative-ai"`），OpenClaw
    会将配置的 `cachedContent` 句柄传递给 Gemini 请求。

    - 使用 `cachedContent` 或旧版 `cached_content`
      配置每个模型或全局参数
    - 更具体作用域中的参数（模型级优先于全局）始终优先。
      在同一作用域内，如果同时设置两个键，则 `cached_content` 优先。
      每个作用域仅使用一个键，以避免意外行为。
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 缓存命中用量会从上游 `cachedContentTokenCount`
      标准化到 OpenClaw `cacheRead`

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
    CLI `stream-json` 输出，并从最终的 `stats` 负载中标准化用量。
    旧版 `--output-format json` 覆盖仍使用 JSON 解析器。

    - 流式回复文本来自助手的 `message` 事件。
    - 对于旧版 JSON 输出，回复文本来自 CLI JSON 的 `response` 字段。
    - 当 CLI 将 `usage` 留空时，用量会回退到 `stats`。
    - `stats.cached` 会标准化到 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 会根据
      `stats.input_tokens - stats.cached` 推导输入令牌数。

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以使用 `GEMINI_API_KEY`
    （例如，位于 `~/.openclaw/.env` 中或通过
    `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
</CardGroup>
