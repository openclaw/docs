---
read_when:
    - 设计或重构媒体理解
    - 调优入站音频/视频/图像预处理
sidebarTitle: Media understanding
summary: 入站图像/音频/视频理解（可选），并提供 提供商 + CLI 回退方案
title: 媒体理解
x-i18n:
    generated_at: "2026-04-27T14:47:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79774578e0abb8b9646c5850d502e1a2f34b1f6f2253a5e6fec0983333d56009
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw 可以在回复流水线运行前，**总结入站媒体**（图像/音频/视频）。它会在本地工具或提供商密钥可用时自动检测，并且可以被禁用或自定义。如果理解功能关闭，模型仍会像往常一样接收原始文件/URL。

特定厂商的媒体行为由厂商插件注册，而 OpenClaw core 负责共享的 `tools.media` 配置、回退顺序以及与回复流水线的集成。

## 目标

- 可选：将入站媒体预先提炼为简短文本，以实现更快的路由和更好的命令解析。
- 始终保留向模型传递原始媒体。
- 支持 **provider API** 和 **CLI 回退**。
- 允许多个模型按顺序回退（错误/大小/超时）。

## 高层行为

<Steps>
  <Step title="收集附件">
    收集入站附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="按能力选择">
    对每个已启用的能力（图像/音频/视频），根据策略选择附件（默认：**第一个**）。
  </Step>
  <Step title="选择模型">
    选择第一个符合条件的模型条目（大小 + 能力 + 认证）。
  </Step>
  <Step title="失败时回退">
    如果模型失败或媒体过大，**回退到下一个条目**。
  </Step>
  <Step title="应用成功块">
    成功时：

    - `Body` 变为 `[Image]`、`[Audio]` 或 `[Video]` 块。
    - 音频会设置 `{{Transcript}}`；命令解析会在有说明文字时使用说明文字，否则使用转录文本。
    - 说明文字会作为 `User text:` 保留在块中。

  </Step>
</Steps>

如果理解失败或被禁用，**回复流程会继续**，并使用原始正文 + 附件。

## 配置概览

`tools.media` 支持**共享模型**以及按能力划分的覆盖配置：

<AccordionGroup>
  <Accordion title="顶层键">
    - `tools.media.models`：共享模型列表（使用 `capabilities` 进行限制）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`：
      - 默认值（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
      - provider 覆盖项（`baseUrl`、`headers`、`providerOptions`）
      - 通过 `tools.media.audio.providerOptions.deepgram` 配置 Deepgram 音频选项
      - 音频转录回显控制（`echoTranscript`，默认 `false`；`echoFormat`）
      - 可选的**按能力划分的 `models` 列表**（优先于共享模型）
      - `attachments` 策略（`mode`、`maxAttachments`、`prefer`）
      - `scope`（可选，按渠道/聊天类型/会话键进行限制）
    - `tools.media.concurrency`：能力并发运行的最大数量（默认 **2**）。
  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* 共享列表 */
      ],
      image: {
        /* 可选覆盖项 */
      },
      audio: {
        /* 可选覆盖项 */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 可选覆盖项 */
      },
    },
  },
}
```

### 模型条目

每个 `models[]` 条目都可以是 **provider** 或 **CLI**：

<Tabs>
  <Tab title="Provider 条目">
    ```json5
    {
      type: "provider", // 如果省略则为默认值
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // 可选，用于多模态条目
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI 条目">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI 模板还可以使用：

    - `{{MediaDir}}`（包含媒体文件的目录）
    - `{{OutputDir}}`（为本次运行创建的临时目录）
    - `{{OutputBase}}`（临时文件基础路径，不含扩展名）

  </Tab>
</Tabs>

## 默认值和限制

推荐默认值：

- 图像/视频的 `maxChars`：**500**（简短，便于命令处理）
- 音频的 `maxChars`：**未设置**（完整转录，除非你设置限制）
- `maxBytes`：
  - 图像：**10 MB**
  - 音频：**20 MB**
  - 视频：**50 MB**

<AccordionGroup>
  <Accordion title="规则">
    - 如果媒体超过 `maxBytes`，则跳过该模型并**尝试下一个模型**。
    - 小于 **1024 字节**的音频文件会被视为空或损坏，并在 provider/CLI 转录前跳过；入站回复上下文会收到一个确定性的占位转录文本，以便智能体知道该语音过小。
    - 如果模型返回的内容超过 `maxChars`，输出会被截断。
    - `prompt` 默认为简单的 “Describe the {media}.”，并附带 `maxChars` 指引（仅适用于图像/视频）。
    - 如果当前主图像模型本身已原生支持视觉能力，OpenClaw 会跳过 `[Image]` 摘要块，并直接将原始图像传给模型。
    - 如果 Gateway 网关/WebChat 主模型仅支持文本，图像附件会保留为卸载的 `media://inbound/*` 引用，这样图像/PDF 工具或已配置的图像模型仍可检查它们，而不会丢失附件。
    - 显式的 `openclaw infer image describe --model <provider/model>` 请求有所不同：它们会直接运行该支持图像的 provider/模型，包括像 `ollama/qwen2.5vl:7b` 这样的 Ollama 引用。
    - 如果 `<capability>.enabled: true` 但未配置任何模型，OpenClaw 会在活动回复模型的提供商支持该能力时尝试使用**活动回复模型**。
  </Accordion>
</AccordionGroup>

### 自动检测媒体理解（默认）

如果未将 `tools.media.<capability>.enabled` 设置为 `false`，且你尚未配置模型，OpenClaw 会按以下顺序自动检测，并且**在第一个可用选项处停止**：

<Steps>
  <Step title="活动回复模型">
    当其提供商支持该能力时，使用活动回复模型。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 主/回退引用（仅图像）。
  </Step>
  <Step title="本地 CLI（仅音频）">
    本地 CLI（如果已安装）：

    - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，其中包含 encoder/decoder/joiner/tokens）
    - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置的 tiny 模型）
    - `whisper`（Python CLI；自动下载模型）

  </Step>
  <Step title="Gemini CLI">
    使用 `read_many_files` 的 `gemini`。
  </Step>
  <Step title="提供商认证">
    - 已配置的 `models.providers.*` 条目中，支持该能力的条目会优先于内置回退顺序进行尝试。
    - 仅图像的配置 provider 只要具有支持图像的模型，即使它们不是内置厂商插件，也会自动注册到媒体理解中。
    - 当显式选择 Ollama 图像理解时即可使用，例如通过 `agents.defaults.imageModel` 或 `openclaw infer image describe --model ollama/<vision-model>`。

    内置回退顺序：

    - 音频：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - 图像：OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 视频：Google → Qwen → Moonshot

  </Step>
</Steps>

要禁用自动检测，请设置：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
二进制检测在 macOS/Linux/Windows 上为尽力而为；请确保 CLI 位于 `PATH` 中（我们会展开 `~`），或设置一个包含完整命令路径的显式 CLI 模型。
</Note>

### 代理环境支持（provider 模型）

启用基于 provider 的**音频**和**视频**媒体理解时，OpenClaw 会在 provider HTTP 调用中遵循标准的出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未设置任何代理环境变量，媒体理解将使用直接出站连接。如果代理值格式错误，OpenClaw 会记录一条警告，并回退为直接获取。

## 能力（可选）

如果你设置了 `capabilities`，该条目只会用于这些媒体类型。对于共享列表，OpenClaw 可以推断默认值：

- `openai`、`anthropic`、`minimax`：**图像**
- `minimax-portal`：**图像**
- `moonshot`：**图像 + 视频**
- `openrouter`：**图像**
- `google`（Gemini API）：**图像 + 音频 + 视频**
- `qwen`：**图像 + 视频**
- `mistral`：**音频**
- `zai`：**图像**
- `groq`：**音频**
- `xai`：**音频**
- `deepgram`：**音频**
- 任何包含支持图像模型的 `models.providers.<id>.models[]` 目录：**图像**

对于 CLI 条目，**请显式设置 `capabilities`**，以避免意外匹配。如果你省略 `capabilities`，该条目将适用于它所在的列表。

## Provider 支持矩阵（OpenClaw 集成）

| Capability | Provider integration                                                                                                         | Notes                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 图像       | OpenAI、OpenAI Codex OAuth、Codex app-server、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、配置 providers | 厂商插件注册图像支持；`openai-codex/*` 使用 OAuth provider 管道；`codex/*` 使用受限的 Codex app-server 回合；MiniMax 和 MiniMax OAuth 都使用 `MiniMax-VL-01`；支持图像的配置 provider 会自动注册。 |
| 音频       | OpenAI、Groq、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral                                                         | Provider 转录（Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                                          |
| 视频       | Google、Qwen、Moonshot                                                                                                       | 通过厂商插件提供 provider 视频理解；Qwen 视频理解使用 Standard DashScope 端点。                                                                                                                                                        |

<Note>
**MiniMax 说明**

- `minimax` 和 `minimax-portal` 图像理解来自插件自有的 `MiniMax-VL-01` 媒体 provider。
- 内置的 MiniMax 文本目录仍然从纯文本开始；显式的 `models.providers.minimax` 条目会具体化为支持图像的 M2.7 聊天引用。
</Note>

## 模型选择指南

- 当质量和安全性很重要时，优先为每种媒体能力选择可用的、能力最强的最新一代模型。
- 对于处理不受信任输入的启用工具的智能体，避免使用较旧/较弱的媒体模型。
- 每种能力至少保留一个回退项以保证可用性（高质量模型 + 更快/更便宜的模型）。
- 当 provider API 不可用时，CLI 回退（`whisper-cli`、`whisper`、`gemini`）很有用。
- `parakeet-mlx` 说明：使用 `--output-dir` 时，如果输出格式为 `txt`（或未指定），OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 格式则回退到 stdout。

## 附件策略

按能力划分的 `attachments` 控制要处理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  是处理第一个选中的附件，还是处理全部附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制处理的数量上限。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  在候选附件中的选择偏好。
</ParamField>

当 `mode: "all"` 时，输出会标记为 `[Image 1/2]`、`[Audio 2/2]` 等。

<AccordionGroup>
  <Accordion title="文件附件提取行为">
    - 提取出的文件文本在附加到媒体提示词之前，会被包装为**不受信任的外部内容**。
    - 注入的块使用显式边界标记，例如 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行 `Source: External` 元数据。
    - 该附件提取路径会有意省略较长的 `SECURITY NOTICE:` 横幅，以避免让媒体提示词过于臃肿；但边界标记和元数据仍会保留。
    - 如果文件没有可提取的文本，OpenClaw 会注入 `[No extractable text]`。
    - 如果 PDF 在此路径中回退为渲染后的页面图像，媒体提示词会保留占位文本 `[PDF content rendered to images; images not forwarded to model]`，因为该附件提取步骤转发的是文本块，而不是渲染后的 PDF 图像。
  </Accordion>
</AccordionGroup>

## 配置示例

<Tabs>
  <Tab title="共享模型 + 覆盖项">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="仅音频 + 视频">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="仅图像">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="多模态单条目">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Status 输出

当媒体理解运行时，`/status` 会包含一行简短摘要：

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

这会显示各能力的结果，以及在适用时所选的 provider/模型。

## 说明

- 理解是**尽力而为**的。错误不会阻止回复。
- 即使理解被禁用，附件仍会传递给模型。
- 使用 `scope` 来限制理解运行的位置（例如仅在私信中）。

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [图像与媒体支持](/zh-CN/nodes/images)
