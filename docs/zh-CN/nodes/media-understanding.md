---
read_when:
    - 设计或重构媒体理解
    - 调整入站音频、视频和图像预处理
sidebarTitle: Media understanding
summary: 入站图像/音频/视频理解（可选），支持提供商和 CLI 回退方案
title: 媒体理解
x-i18n:
    generated_at: "2026-07-11T20:39:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可以在回复流水线运行前汇总传入媒体（图像/音频/视频），让命令解析和路由基于简短文本而非原始字节进行。媒体理解功能会自动检测本地工具或提供商密钥，你也可以配置明确的模型。原始媒体始终会像往常一样传递给模型；媒体理解失败或被禁用时，回复流程将不受影响地继续运行。

供应商插件会注册能力元数据（哪个提供商支持哪种媒体类型、默认模型和优先级）。OpenClaw 核心负责共享的 `tools.media` 配置、回退顺序以及回复流水线集成。

## 工作原理

<Steps>
  <Step title="收集附件">
    收集传入附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="按能力选择">
    对于每项已启用的能力（图像/音频/视频），根据 `attachments` 策略选择附件（默认：仅第一个附件）。
  </Step>
  <Step title="选择模型">
    选择第一个符合条件的模型条目（大小、能力和身份验证均可用）。
  </Step>
  <Step title="失败时回退">
    如果模型报错、超时或媒体超过 `maxBytes`，则尝试下一个条目。
  </Step>
  <Step title="成功时应用">
    `Body` 会变为 `[Image]`、`[Audio]` 或 `[Video]` 块。音频还会设置 `{{Transcript}}`；存在说明文字时，命令解析使用说明文字，否则使用转录文本。说明文字会作为块内的 `User text:` 保留。
  </Step>
</Steps>

## 配置

`tools.media` 包含共享模型列表以及按能力设置的覆盖项：

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

各能力（`image`/`audio`/`video`）的键：

| 键                                              | 类型      | 默认值                                               | 说明                                                                                |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自动（`false` 表示禁用）                             | 设为 `false` 可关闭此能力的自动检测                                                 |
| `models`                                        | 数组      | 无                                                   | 优先于共享的 `tools.media.models` 列表                                              |
| `prompt`                                        | `string`  | `"Describe the {media}."`（加上 maxChars 指引）      | 默认仅用于图像/视频                                                                 |
| `maxChars`                                      | `number`  | `500`（图像/视频），未设置（音频）                   | 如果模型返回的内容更多，则会截断输出                                                |
| `maxBytes`                                      | `number`  | 图像 `10485760`，音频 `20971520`，视频 `52428800`    | 媒体过大时跳到下一个模型                                                            |
| `timeoutSeconds`                                | `number`  | `60`（图像/音频），`120`（视频）                     |                                                                                     |
| `language`                                      | `string`  | 未设置                                               | 音频转录语言提示                                                                    |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | 提供商请求覆盖项；参阅[工具和自定义提供商](/zh-CN/gateway/config-tools)                   |
| `attachments`                                   | 对象      | `{ mode: "first", maxAttachments: 1 }`               | 参阅[附件策略](#attachment-policy)                                                  |
| `scope`                                         | 对象      | 未设置                                               | 按渠道/聊天类型/键前缀进行限制                                                      |
| `echoTranscript`                                | `boolean` | `false`                                              | 仅限音频：在智能体处理前将转录文本回显到聊天中                                      |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 仅限音频：`{transcript}` 占位符                                                      |

Deepgram 专用选项放在 `providerOptions.deepgram` 下（顶层的 `deepgram: { detectLanguage, punctuate, smartFormat }` 字段已弃用，但仍会读取）。

### 模型条目

每个 `models[]` 条目都是一个**提供商**条目（默认）或 **CLI** 条目：

<Tabs>
  <Tab title="提供商条目">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
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

    CLI 模板还可以使用 `{{MediaDir}}`（包含媒体文件的目录）、`{{OutputDir}}`（为本次运行创建的暂存目录）和 `{{OutputBase}}`（暂存文件的基础路径，不含扩展名）。

  </Tab>
</Tabs>

### 提供商凭据

提供商媒体理解功能使用与普通模型调用相同的身份验证解析顺序：身份验证配置文件、环境变量，然后是 `models.providers.<providerId>.apiKey`。`tools.media.*.models[]` 条目不接受内联 `apiKey` 字段。

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

有关配置文件、环境变量和自定义基础 URL，请参阅[工具和自定义提供商](/zh-CN/gateway/config-tools)。

## 规则和行为

- 超过 `maxBytes` 的媒体会跳过该模型并尝试下一个模型。
- 小于 1024 字节的音频文件会被视为空文件或损坏文件，并在转录前跳过；智能体会收到确定性的占位转录文本。
- 如果当前主要图像模型已经原生支持视觉能力，OpenClaw 会跳过 `[Image]` 摘要块，直接将原始图像传入模型。MiniMax 是一个例外：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 始终通过插件拥有的 `MiniMax-VL-01` 媒体提供商路由图像理解，即使旧版 MiniMax M2.x 聊天元数据声称支持图像输入（只有 `MiniMax-M3` 及更高版本会被视为原生支持视觉能力）。
- 如果 Gateway 网关/WebChat 的主要模型仅支持文本，图像附件会保留为卸载后的 `media://inbound/*` 引用，使图像/PDF 工具或已配置的图像模型仍可检查这些附件，而不会丢失附件。
- 明确执行 `openclaw infer image describe --file <path> --model <provider/model>`（别名：`openclaw capability image describe`）会直接运行该支持图像的提供商/模型；如果在 `models.providers.ollama.models[]` 下配置了匹配且支持图像的模型，也包括 `ollama/qwen2.5vl:7b` 等 Ollama 引用。
- 如果 `<capability>.enabled` 不为 `false`，但未配置模型，那么当当前回复模型的提供商支持该能力时，OpenClaw 会尝试使用当前回复模型。

### 自动检测（默认）

当 `tools.media.<capability>.enabled` 不为 `false` 且未配置模型时，OpenClaw 会按以下顺序尝试，并在找到第一个可用选项后停止：

<Steps>
  <Step title="已配置的图像模型（仅限图像）">
    使用 `agents.defaults.imageModel` 的主要/回退引用，除非当前回复模型已经原生支持视觉能力。优先使用 `provider/model` 引用；只有在已配置且支持图像的提供商模型条目中存在唯一匹配项时，才会补全裸引用。
  </Step>
  <Step title="当前回复模型">
    当其提供商支持该能力时，使用当前回复模型。
  </Step>
  <Step title="提供商身份验证（仅限音频，优先于本地 CLI）">
    在本地 CLI 之前，尝试已配置且支持音频的 `models.providers.*` 条目。内置提供商优先级顺序（优先级相同时按提供商 ID 的字母顺序决定）：Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="本地 CLI（仅限音频）">
    已就绪的本地二进制文件会组成有序回退列表：
    - 仅当当前进程中更早的模型调用观测到 Metal 或 CUDA 后，才将 `whisper-cli` 放在首位
    - 默认使用 CPU 的 `sherpa-onnx-offline`（需要设置 `SHERPA_ONNX_MODEL_DIR`，其中包含 `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`）
    - 当加速能力仅在构建层面可用或尚未观测到时，使用 `whisper-cli`
    - 在 Apple Silicon 上使用 `parakeet-mlx`（支持 MLX，但尚未观测到设备使用情况）
    - `whisper`（Python CLI；默认使用 `turbo` 模型，并自动下载）

    后端能力检查结果会被缓存，并且不会加载模型。构建能力、请求的后端标志以及实际调用中观测到的后端会保持相互独立。自动检测到的 whisper.cpp 会保持模型运行日志启用，以便记录上游选择后端的日志行。明确配置的 CLI 条目会保留其配置顺序、后端标志和输出标志。

  </Step>
  <Step title="提供商身份验证（图像/视频）">
    在内置回退顺序之前，尝试已配置且支持该能力的 `models.providers.*` 条目。即使仅用于图像配置的提供商不是内置供应商插件，只要它包含支持图像的模型，也会自动注册用于媒体理解。

    内置提供商优先级顺序（优先级相同时按提供商 ID 的字母顺序决定）：
    - 图像：Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 视频：Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI（仅限图像/视频）">
    使用首先安装的 `agy` 或 `antigravity` 二进制文件（可通过 `OPENCLAW_ANTIGRAVITY_CLI` 覆盖），并将其沙箱隔离到媒体所在目录。
  </Step>
</Steps>

要禁用某项能力的自动检测：

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
在 macOS/Linux/Windows 上，二进制文件检测均为尽力而为；请确保 CLI 位于 `PATH` 中（会展开 `~`），或者使用完整命令路径设置明确的 CLI 模型条目。
</Note>

### 代理支持（音频/视频提供商调用）

基于提供商的**音频**和**视频**理解功能遵循标准出站代理环境变量，包括 `NO_PROXY`/`no_proxy` 绕过规则：`HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小写变量优先于大写变量。如果均未设置，媒体理解会使用直接出站连接；如果代理值格式不正确，OpenClaw 会记录警告并回退到直接获取。图像理解不经过此代理路径。

## 能力

在 `models[]` 条目上设置 `capabilities`，可将其限制为特定媒体类型。对于共享列表，OpenClaw 会按内置提供商推断默认值：

| 提供商                                                                 | 能力          |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 图像                 |
| `minimax-portal`                                                         | 图像                 |
| `moonshot`                                                               | 图像 + 视频         |
| `openrouter`                                                             | 图像 + 音频         |
| `google`（Gemini API）                                                    | 图像 + 音频 + 视频 |
| `qwen`                                                                   | 图像 + 视频         |
| `deepinfra`                                                              | 图像 + 音频         |
| `mistral`                                                                | 音频                 |
| `zai`                                                                    | 图像                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音频                 |
| 任何包含支持图像模型的 `models.providers.<id>.models[]` 目录 | 图像                 |

对于 CLI 条目，请显式设置 `capabilities` 以避免意外匹配；如果省略，该条目将符合其出现的每个能力列表的条件。

## 提供商支持矩阵

| 能力 | 提供商                                                                                                                                               | 说明                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 图像      | Anthropic、Codex app-server、Deepinfra、Google、MiniMax、MiniMax Portal、Moonshot、OpenAI、OpenAI Codex OAuth、OpenRouter、Qwen、Z.AI、配置提供商 | 厂商插件注册图像支持；`openai/*` 可以使用 API key 或 Codex OAuth 路由；`codex/*` 使用有界的 Codex app-server 轮次；支持图像的配置提供商会自动注册。 |
| 音频      | Deepgram、Deepinfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、SenseAudio、xAI                                                             | 提供商转录（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                     |
| 视频      | Google、Moonshot、Qwen                                                                                                                                  | 通过厂商插件实现提供商视频理解；Qwen 视频理解使用标准 DashScope 端点。                                                                        |

<Note>
**MiniMax 注意事项**：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 的图像理解始终来自插件自有的 `MiniMax-VL-01` 媒体提供商，即使旧版 MiniMax M2.x 聊天元数据声称支持图像输入也是如此。
</Note>

## 模型选择指南

- 当质量和安全性很重要时，为每种媒体能力优先选择最强的当前代模型。
- 对于处理不受信任输入且启用了工具的智能体，应避免使用较旧或较弱的媒体模型。
- 为确保可用性，每种能力至少保留一个回退模型（高质量模型 + 更快或更便宜的模型）。
- 当提供商 API 不可用时，CLI 回退方案（`whisper-cli`、`whisper`、`gemini`）可提供帮助。
- 已知的文件输出模式具有权威性：如果推断出的转录文件为空或缺失，则不会生成转录文本，也不会回退到 CLI 进度输出。
- `parakeet-mlx`：将 `--output-format txt`（或 `all`）与 `--output-dir` 及默认的 `{filename}` 输出模板配合使用。上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 环境变量也会生效。OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；默认的 `srt` 格式、其他格式和自定义输出模板仍然使用 stdout。

## 附件策略

按能力设置的 `attachments` 控制处理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  仅处理第一个选中的附件，或处理所有附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制处理的附件数量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候选附件之间的选择偏好。
</ParamField>

当 `mode: "all"` 时，输出会标记为 `[图像 1/2]`、`[音频 2/2]` 等。

### 文件附件提取

- 提取的文件文本在附加到媒体提示词之前，会被包装为不受信任的外部内容，使用类似 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 的边界标记，并包含一行 `Source: External` 元数据。
- 此路径有意省略较长的 `SECURITY NOTICE:` 横幅，以缩短媒体提示词；边界标记和元数据仍然适用。
- 没有可提取文本的文件会得到 `[无可提取文本]`。
- 如果 PDF 回退为渲染后的页面图像，OpenClaw 会将这些图像转发给支持视觉能力的回复模型，并在文件块中保留占位符 `[PDF 内容已渲染为图像]`。

## 配置示例

<Tabs>
  <Tab title="共享模型 + 覆盖设置">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
              { provider: "openai", model: "gpt-5.6-sol" },
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

媒体理解运行时，`/status` 会包含一行按能力汇总的信息：

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

要进行预检清单检查，请运行 `openclaw capability audio providers`。本地行会将本地回退的胜出项与全局提供商选择、就绪状态，以及相互独立的可用/请求/观测后端字段分开显示。同一本地选择也会作为信息级 Doctor 检查结果提供：

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## 注意事项

- 理解功能采用尽力而为的方式。错误不会阻止回复。
- 即使理解功能已禁用，附件仍会传递给模型。
- 使用 `scope` 限制理解功能的运行位置（例如仅限私信）。

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [图像和媒体支持](/zh-CN/nodes/images)
