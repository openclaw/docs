---
read_when:
    - 设计或重构媒体理解
    - 调优入站音频/视频/图像预处理
sidebarTitle: Media understanding
summary: 入站图像/音频/视频理解（可选），带提供商 + CLI 回退
title: 媒体理解
x-i18n:
    generated_at: "2026-07-05T11:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aabf40780d3528fe8ee3e28782b9e19f624009f5f8684a015357bb27458150ef
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可以在回复流水线运行前汇总入站媒体（图像/音频/视频），因此命令解析和路由会基于短文本而不是原始字节运行。理解功能会自动检测本地工具或提供商密钥，你也可以配置显式模型。原始媒体始终会照常传递给模型；当理解失败或被禁用时，回复流程会保持不变继续执行。

供应商插件会注册能力元数据（哪个提供商支持哪种媒体类型、默认模型、优先级）。OpenClaw 核心负责共享的 `tools.media` 配置、回退顺序，以及回复流水线集成。

## 工作方式

<Steps>
  <Step title="收集附件">
    收集入站附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="按能力选择">
    对每个已启用的能力（图像/音频/视频），根据 `attachments` 策略选择附件（默认：仅第一个附件）。
  </Step>
  <Step title="选择模型">
    选择第一个符合条件的模型条目（大小 + 能力 + 凭证可用）。
  </Step>
  <Step title="失败时回退">
    如果模型报错、超时，或媒体超过 `maxBytes`，则尝试下一个条目。
  </Step>
  <Step title="成功后应用">
    `Body` 会变成 `[Image]`、`[Audio]` 或 `[Video]` 块。音频还会设置 `{{Transcript}}`；命令解析在存在说明文字时使用说明文字，否则使用转录文本。说明文字会以块内的 `User text:` 保留。
  </Step>
</Steps>

## 配置

`tools.media` 保存共享模型列表以及按能力的覆盖项：

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [
        /* shared list, gate with capabilities */
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

按能力（`image`/`audio`/`video`）的键：

| 键                                              | 类型      | 默认值                                               | 说明                                                                                |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自动（`false` 会禁用）                               | 设置为 `false` 可关闭此能力的自动检测                                               |
| `models`                                        | array     | 无                                                   | 优先于共享的 `tools.media.models` 列表                                              |
| `prompt`                                        | `string`  | `"Describe the {media}."`（+ maxChars 指引）         | 默认仅用于图像/视频                                                                 |
| `maxChars`                                      | `number`  | `500`（图像/视频），未设置（音频）                   | 如果模型返回更多内容，输出会被截断                                                  |
| `maxBytes`                                      | `number`  | 图像 `10485760`，音频 `20971520`，视频 `52428800`    | 超大媒体会跳过并尝试下一个模型                                                      |
| `timeoutSeconds`                                | `number`  | `60`（图像/音频），`120`（视频）                     |                                                                                     |
| `language`                                      | `string`  | 未设置                                               | 音频转录提示                                                                        |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | 提供商请求覆盖项；参见[工具和自定义提供商](/zh-CN/gateway/config-tools)                   |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`               | 参见[附件策略](#attachment-policy)                                                  |
| `scope`                                         | object    | 未设置                                               | 按渠道/chatType/keyPrefix 设置门控                                                  |
| `echoTranscript`                                | `boolean` | `false`                                              | 仅音频：在智能体处理前将转录文本回显到聊天                                          |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 仅音频：`{transcript}` 占位符                                                       |

Deepgram 专属选项放在 `providerOptions.deepgram` 下（顶层的 `deepgram: { detectLanguage, punctuate, smartFormat }` 字段已弃用，但仍会读取）。

### 模型条目

每个 `models[]` 条目都是一个**提供商**条目（默认）或一个 **CLI** 条目：

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
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    CLI 模板还可以使用 `{{MediaDir}}`（包含媒体文件的目录）、`{{OutputDir}}`（为本次运行创建的暂存目录）和 `{{OutputBase}}`（暂存文件基础路径，无扩展名）。

  </Tab>
</Tabs>

### 提供商凭据

提供商媒体理解使用与普通模型调用相同的凭证解析方式：凭证配置文件、环境变量，然后是 `models.providers.<providerId>.apiKey`。`tools.media.*.models[]` 条目不接受内联 `apiKey` 字段。

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

关于配置文件、环境变量和自定义基础 URL，参见[工具和自定义提供商](/zh-CN/gateway/config-tools)。

## 规则和行为

- 超过 `maxBytes` 的媒体会跳过该模型并尝试下一个模型。
- 小于 1024 字节的音频文件会被视为空或损坏，并在转录前跳过；智能体会获得一个确定性的占位转录文本。
- 如果当前主图像模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，并将原始图像直接传入模型。MiniMax 是例外：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 始终通过插件拥有的 `MiniMax-VL-01` 媒体提供商路由图像理解，即使旧版 MiniMax M2.x 聊天元数据声称支持图像输入（只有 `MiniMax-M3` 及更高版本会被视为原生具备视觉能力）。
- 如果 Gateway 网关/WebChat 主模型仅支持文本，图像附件会保留为卸载的 `media://inbound/*` 引用，因此图像/PDF 工具或已配置的图像模型仍可检查它们，而不是丢失附件。
- 显式运行 `openclaw infer image describe --file <path> --model <provider/model>`（别名：`openclaw capability image describe`）会直接运行该支持图像的提供商/模型，包括 `ollama/qwen2.5vl:7b` 等 Ollama 引用，前提是在 `models.providers.ollama.models[]` 下配置了匹配的支持图像的模型。
- 如果 `<capability>.enabled` 不是 `false`，但未配置模型，OpenClaw 会在当前回复模型的提供商支持该能力时尝试使用当前回复模型。

### 自动检测（默认）

当 `tools.media.<capability>.enabled` 不是 `false` 且未配置模型时，OpenClaw 会按以下顺序尝试，并在第一个可用选项处停止：

<Steps>
  <Step title="已配置的图像模型（仅图像）">
    `agents.defaults.imageModel` 主/回退引用，除非当前回复模型已原生支持视觉。优先使用 `provider/model` 引用；裸引用仅在匹配项唯一时，才从已配置的支持图像的提供商模型条目中限定。
  </Step>
  <Step title="当前回复模型">
    当前回复模型，前提是其提供商支持该能力。
  </Step>
  <Step title="提供商凭证（仅音频，在本地 CLI 之前）">
    在本地 CLI 之前，会尝试已配置且支持音频的 `models.providers.*` 条目。内置提供商优先级顺序（并列时按提供商 ID 字母顺序打破）：Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="本地 CLI（仅音频）">
    第一个已安装的本地二进制文件，按以下顺序：
    - `sherpa-onnx-offline`（需要带有 `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` 的 `SHERPA_ONNX_MODEL_DIR`）
    - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置 tiny 模型）
    - `whisper`（Python CLI；默认使用 `turbo` 模型，自动下载）

  </Step>
  <Step title="提供商凭证（图像/视频）">
    在内置回退顺序之前，会尝试已配置且支持该能力的 `models.providers.*` 条目。仅图像配置的提供商如果有支持图像的模型，即使不是内置供应商插件，也会自动注册用于媒体理解。

    内置提供商优先级顺序（并列时按提供商 ID 字母顺序打破）：
    - 图像：Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 视频：Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI（仅图像/视频）">
    第一个已安装的 `agy` 或 `antigravity` 二进制文件（可用 `OPENCLAW_ANTIGRAVITY_CLI` 覆盖），针对媒体所在目录进行沙箱隔离。
  </Step>
</Steps>

要禁用某个能力的自动检测：

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
二进制检测会尽力覆盖 macOS/Linux/Windows；确保 CLI 位于 `PATH` 上（会展开 `~`），或使用完整命令路径设置显式 CLI 模型条目。
</Note>

### 代理支持（音频/视频提供商调用）

基于提供商的**音频**和**视频**理解遵循标准出站代理环境变量，包括 `NO_PROXY`/`no_proxy` 绕过规则：`HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小写变量优先于大写变量。如果未设置任何变量，媒体理解会使用直接出站连接；如果代理值格式错误，OpenClaw 会记录警告并回退为直接获取。图像理解不会经过此代理路径。

## 能力

在 `models[]` 条目上设置 `capabilities` 可将其限制为特定媒体类型。对于共享列表，OpenClaw 会按内置提供商推断默认值：

| 提供商                                                                 | 能力          |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 图像                 |
| `minimax-portal`                                                         | 图像                 |
| `moonshot`                                                               | 图像 + 视频         |
| `openrouter`                                                             | 图像 + 音频         |
| `google` (Gemini API)                                                    | 图像 + 音频 + 视频 |
| `qwen`                                                                   | 图像 + 视频         |
| `deepinfra`                                                              | 图像 + 音频         |
| `mistral`                                                                | 音频                 |
| `zai`                                                                    | 图像                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音频                 |
| 任何包含支持图像模型的 `models.providers.<id>.models[]` 目录 | 图像                 |

对于 CLI 条目，请显式设置 `capabilities` 以避免意外匹配；如果省略，该条目将适用于它所在的每个能力列表。

## 提供商支持矩阵

| 能力 | 提供商                                                                                                                                               | 说明                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 图像      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, 配置提供商 | 供应商插件注册图像支持；`openai/*` 可以使用 API key 或 Codex OAuth 路由；`codex/*` 使用有边界的 Codex app-server 轮次；支持图像的配置提供商会自动注册。 |
| 音频      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | 提供商转写（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                     |
| 视频      | Google, Moonshot, Qwen                                                                                                                                  | 通过供应商插件实现提供商视频理解；Qwen 视频理解使用标准 DashScope 端点。                                                                        |

<Note>
**MiniMax 说明**：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 的图像理解始终来自插件拥有的 `MiniMax-VL-01` 媒体提供商，即使旧版 MiniMax M2.x 聊天元数据声称支持图像输入。
</Note>

## 模型选择指南

- 当质量和安全性重要时，优先为每种媒体能力选择最强的当前代模型。
- 对于处理不受信任输入且启用工具的智能体，避免使用较旧或较弱的媒体模型。
- 为每种能力保留至少一个回退以保证可用性（高质量模型 + 更快/更便宜的模型）。
- 当提供商 API 不可用时，CLI 回退（`whisper-cli`、`whisper`、`gemini`）会有帮助。
- `parakeet-mlx`：使用 `--output-dir` 时，如果输出格式为 `txt` 或未指定，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；其他格式会回退到 stdout。

## 附件策略

按能力配置的 `attachments` 控制处理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  仅处理第一个选中的附件，或处理所有附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制处理数量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候选附件之间的选择偏好。
</ParamField>

当 `mode: "all"` 时，输出会标记为 `[Image 1/2]`、`[Audio 2/2]` 等。

### 文件附件提取

- 提取出的文件文本会在追加到媒体提示前包装为不受信任的外部内容，使用类似 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 的边界标记，并附加一行 `Source: External` 元数据。
- 该路径有意省略较长的 `SECURITY NOTICE:` 横幅，以保持媒体提示简短；边界标记和元数据仍然适用。
- 没有可提取文本的文件会得到 `[No extractable text]`。
- 如果 PDF 回退为渲染后的页面图像，OpenClaw 会将这些图像转发给支持视觉的回复模型，并在文件块中保留占位符 `[PDF content rendered to images]`。

## 配置示例

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image only">
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
              { provider: "anthropic", model: "claude-opus-4-8" },
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
  <Tab title="Multi-modal single entry">
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

当媒体理解运行时，`/status` 会包含一行按能力汇总的内容：

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

## 说明

- 理解是尽力而为的。错误不会阻止回复。
- 即使理解被禁用，附件仍会传递给模型。
- 使用 `scope` 限制理解运行的位置（例如仅限私信）。

## 相关

- [配置](/zh-CN/gateway/configuration)
- [图像和媒体支持](/zh-CN/nodes/images)
