---
read_when:
    - 设计或重构媒体理解
    - 调优入站音频/视频/图像预处理
sidebarTitle: Media understanding
summary: 入站图像/音频/视频理解（可选），支持提供商 + CLI 回退
title: 媒体理解
x-i18n:
    generated_at: "2026-06-28T05:09:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可以在回复流水线运行前**汇总入站媒体**（图片/音频/视频）。它会自动检测本地工具或提供商密钥是否可用，并且可以禁用或自定义。如果理解功能关闭，模型仍会照常接收原始文件/URL。

特定供应商的媒体行为由供应商插件注册，而 OpenClaw 核心负责共享的 `tools.media` 配置、回退顺序和回复流水线集成。

## 目标

- 可选：将入站媒体预先摘要为短文本，以加快路由并改善命令解析。
- 保留原始媒体到模型的传递（始终如此）。
- 支持**提供商 API** 和 **CLI 回退**。
- 允许多个模型按顺序回退（错误/大小/超时）。

## 高层行为

<Steps>
  <Step title="收集附件">
    收集入站附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="按能力选择">
    对每个启用的能力（图片/音频/视频），按策略选择附件（默认：**第一个**）。
  </Step>
  <Step title="选择模型">
    选择第一个符合条件的模型条目（大小 + 能力 + 凭证）。
  </Step>
  <Step title="失败时回退">
    如果某个模型失败或媒体过大，**回退到下一个条目**。
  </Step>
  <Step title="应用成功块">
    成功时：

    - `Body` 变为 `[Image]`、`[Audio]` 或 `[Video]` 块。
    - 音频会设置 `{{Transcript}}`；命令解析会在存在字幕文本时使用字幕，否则使用转写文本。
    - 字幕会作为块内的 `User text:` 保留。

  </Step>
</Steps>

如果理解失败或被禁用，**回复流程会继续**使用原始正文 + 附件。

## 配置概览

`tools.media` 支持**共享模型**以及按能力覆盖：

<AccordionGroup>
  <Accordion title="顶层键">
    - `tools.media.models`：共享模型列表（使用 `capabilities` 做门控）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`：
      - 默认值（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
      - 提供商覆盖（`baseUrl`、`headers`、`providerOptions`）
      - 通过 `tools.media.audio.providerOptions.deepgram` 配置 Deepgram 音频选项
      - 音频转写回显控制（`echoTranscript`，默认 `false`；`echoFormat`）
      - 可选的**按能力 `models` 列表**（优先于共享模型）
      - `attachments` 策略（`mode`、`maxAttachments`、`prefer`）
      - `scope`（可选，按渠道/chatType/会话键门控）
    - `tools.media.concurrency`：最大并发能力运行数（默认 **2**）。

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### 模型条目

每个 `models[]` 条目可以是**提供商**或 **CLI**：

<Tabs>
  <Tab title="提供商条目">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
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

    CLI 模板也可以使用：

    - `{{MediaDir}}`（包含媒体文件的目录）
    - `{{OutputDir}}`（为本次运行创建的暂存目录）
    - `{{OutputBase}}`（暂存文件基础路径，不含扩展名）

  </Tab>
</Tabs>

### 提供商凭证（`apiKey`）

提供商媒体理解使用与普通模型调用相同的提供商凭证解析方式：凭证配置文件、环境变量，然后是 `models.providers.<providerId>.apiKey`。

`tools.media.*.models[]` 条目不接受内联 `apiKey` 字段。媒体模型条目中的 `provider` 值，例如 `openai` 或 `moonshot`，必须通过某个标准提供商凭证来源获得凭证。

最小示例：

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

完整的提供商凭证参考，包括配置文件、环境变量和自定义基础 URL，请参见[工具和自定义提供商](/zh-CN/gateway/config-tools)。

## 默认值和限制

推荐默认值：

- `maxChars`：图片/视频为 **500**（简短、便于命令处理）
- `maxChars`：音频为**未设置**（完整转写，除非你设置限制）
- `maxBytes`：
  - 图片：**10MB**
  - 音频：**20MB**
  - 视频：**50MB**

<AccordionGroup>
  <Accordion title="规则">
    - 如果媒体超过 `maxBytes`，该模型会被跳过，并**尝试下一个模型**。
    - 小于 **1024 字节**的音频文件会被视为空或损坏，并在提供商/CLI 转写前跳过；入站回复上下文会收到确定性的占位转写文本，让智能体知道该语音备注太小。
    - 如果模型返回内容超过 `maxChars`，输出会被裁剪。
    - `prompt` 默认是简单的 “Describe the {media}.” 加上 `maxChars` 指引（仅图片/视频）。
    - 如果当前主图片模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，并改为将原始图片传入模型。
    - 如果 Gateway 网关/WebChat 主模型仅支持文本，图片附件会作为卸载的 `media://inbound/*` 引用保留，使图片/PDF 工具或配置的图片模型仍可检查它们，而不是丢失附件。
    - 显式的 `openclaw infer image describe --model <provider/model>` 请求不同：它们会直接运行支持图片的提供商/模型，包括 `ollama/qwen2.5vl:7b` 这样的 Ollama 引用。
    - 如果 `<capability>.enabled: true` 但没有配置模型，OpenClaw 会在其提供商支持该能力时尝试使用**当前回复模型**。

  </Accordion>
</AccordionGroup>

### 自动检测媒体理解（默认）

如果 `tools.media.<capability>.enabled` **没有**设置为 `false`，且你没有配置模型，OpenClaw 会按以下顺序自动检测，并**在第一个可用选项处停止**：

<Steps>
  <Step title="当前回复模型">
    当当前回复模型的提供商支持该能力时使用它。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 主/回退引用（仅图片）。
    优先使用 `provider/model` 引用。仅当匹配唯一时，裸引用才会从已配置的支持图片的提供商模型条目中限定。
  </Step>
  <Step title="本地 CLI（仅音频）">
    本地 CLI（如果已安装）：

    - `sherpa-onnx-offline`（需要带有 encoder/decoder/joiner/tokens 的 `SHERPA_ONNX_MODEL_DIR`）
    - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置 tiny 模型）
    - `whisper`（Python CLI；自动下载模型）

  </Step>
  <Step title="Gemini CLI">
    使用 `read_many_files` 的 `gemini`。
  </Step>
  <Step title="提供商凭证">
    - 支持该能力的已配置 `models.providers.*` 条目会先于内置回退顺序尝试。
    - 带有支持图片模型的仅图片配置提供商会自动注册用于媒体理解，即使它们不是内置供应商插件。
    - Ollama 图片理解在显式选择时可用，例如通过 `agents.defaults.imageModel` 或 `openclaw infer image describe --model ollama/<vision-model>`。

    内置回退顺序：

    - 音频：OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 图片：OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
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
二进制检测在 macOS/Linux/Windows 上是尽力而为；请确保 CLI 位于 `PATH` 上（我们会展开 `~`），或设置一个带完整命令路径的显式 CLI 模型。
</Note>

### 代理环境支持（提供商模型）

启用基于提供商的**音频**和**视频**媒体理解时，OpenClaw 会在提供商 HTTP 调用中遵循标准出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未设置代理环境变量，媒体理解会使用直接出站连接。如果代理值格式错误，OpenClaw 会记录警告并回退到直接获取。

## 能力（可选）

如果你设置了 `capabilities`，该条目只会针对这些媒体类型运行。对于共享列表，OpenClaw 可以推断默认值：

- `openai`、`anthropic`、`minimax`：**图片**
- `minimax-portal`：**图片**
- `moonshot`：**图片 + 视频**
- `openrouter`：**图片 + 音频**
- `google`（Gemini API）：**图片 + 音频 + 视频**
- `qwen`：**图片 + 视频**
- `mistral`：**音频**
- `zai`：**图片**
- `groq`：**音频**
- `xai`：**音频**
- `deepgram`：**音频**
- 任何带有支持图片模型的 `models.providers.<id>.models[]` 目录：**图片**

对于 CLI 条目，**请显式设置 `capabilities`**，以避免意外匹配。如果省略 `capabilities`，该条目会适用于它所在的列表。

## 提供商支持矩阵（OpenClaw 集成）

| 能力 | 提供商集成                                                                                                         | 说明                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 图片      | OpenAI、OpenAI Codex OAuth、Codex app-server、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、配置提供商 | 供应商插件注册图片支持；`openai/*` 可以使用 API 密钥或 Codex OAuth 路由；`codex/*` 使用有界的 Codex app-server 轮次；MiniMax 和 MiniMax OAuth 都使用 `MiniMax-VL-01`；支持图片的配置提供商会自动注册。 |
| 音频      | OpenAI、Groq、xAI、Deepgram、OpenRouter、Google、SenseAudio、ElevenLabs、Mistral                                             | 提供商转写（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                         |
| 视频      | Google、Qwen、Moonshot                                                                                                       | 通过供应商插件进行提供商视频理解；Qwen 视频理解使用标准 DashScope 端点。                                                                                                                            |

<Note>
**MiniMax 说明**

- `minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 图像理解来自插件自有的 `MiniMax-VL-01` 媒体提供商。
- 即使旧版 MiniMax M2.x 聊天元数据声明支持图像输入，自动图像路由仍会继续使用 `MiniMax-VL-01`。

</Note>

## 模型选择指南

- 当质量和安全性很重要时，优先为每项媒体能力使用可用的最强最新一代模型。
- 对于处理不受信任输入且启用工具的智能体，避免使用较旧或较弱的媒体模型。
- 为每项能力保留至少一个回退选项以保证可用性（高质量模型 + 更快或更便宜的模型）。
- 当提供商 API 不可用时，CLI 回退项（`whisper-cli`、`whisper`、`gemini`）很有用。
- `parakeet-mlx` 注意事项：使用 `--output-dir` 时，如果输出格式为 `txt`（或未指定），OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 格式会回退到 stdout。

## 附件策略

按能力配置的 `attachments` 控制会处理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  是处理第一个选中的附件，还是处理全部附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制处理的数量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  在候选附件中的选择偏好。
</ParamField>

当 `mode: "all"` 时，输出会标记为 `[Image 1/2]`、`[Audio 2/2]` 等。

<AccordionGroup>
  <Accordion title="文件附件提取行为">
    - 提取出的文件文本会先被包装为**不受信任的外部内容**，再追加到媒体提示中。
    - 注入的块使用明确的边界标记，例如 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行 `Source: External` 元数据。
    - 这个附件提取路径会有意省略较长的 `SECURITY NOTICE:` 横幅，以避免媒体提示过度膨胀；边界标记和元数据仍会保留。
    - 如果文件没有可提取文本，OpenClaw 会注入 `[No extractable text]`。
    - 如果 PDF 在此路径中回退到渲染后的页面图像，OpenClaw 会将这些页面图像转发给具备视觉能力的回复模型，并在文件块中保留占位符 `[PDF content rendered to images]`。

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
  <Tab title="单个多模态条目">
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

## 状态输出

运行媒体理解时，`/status` 会包含一行简短摘要：

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

这会显示每项能力的结果，以及适用时所选的提供商/模型。

## 说明

- 理解是**尽力而为**的。错误不会阻止回复。
- 即使禁用理解，附件仍会传递给模型。
- 使用 `scope` 限制理解运行的位置（例如仅私信）。

## 相关

- [配置](/zh-CN/gateway/configuration)
- [图像和媒体支持](/zh-CN/nodes/images)
