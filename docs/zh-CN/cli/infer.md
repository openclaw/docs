---
read_when:
    - 添加或修改 `openclaw infer` 命令
    - 设计稳定的无头能力自动化
summary: 推理优先的 CLI，适用于由提供商支持的模型、图像、音频、TTS、视频、Web 和嵌入工作流
title: 推理 CLI
x-i18n:
    generated_at: "2026-04-28T11:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8a4d0805b88f08ba810dc8473c5c052ad6bfe1c8044c233376ac8aae9ea6c7e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是由提供商支持的推理工作流的规范无头接口。

它有意暴露能力族，而不是原始的 Gateway 网关 RPC 名称，也不是原始的智能体工具 ID。

## 将 infer 转换为一项技能

将以下内容复制并粘贴给智能体：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

一个优秀的基于 infer 的技能应当：

- 将常见用户意图映射到正确的 infer 子命令
- 为其覆盖的工作流包含几个规范的 infer 示例
- 在示例和建议中优先使用 `openclaw infer ...`
- 避免在技能正文中重新记录整个 infer 接口

典型的 infer 聚焦技能覆盖范围：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 为什么使用 infer

`openclaw infer` 为 OpenClaw 内由提供商支持的推理任务提供一个一致的 CLI。

优势：

- 使用 OpenClaw 中已经配置的提供商和模型，而不是为每个后端连接一次性封装器。
- 将模型、图像、音频转录、TTS、视频、Web 和嵌入工作流放在同一个命令树下。
- 为脚本、自动化和智能体驱动的工作流使用稳定的 `--json` 输出形状。
- 当任务本质上是“运行推理”时，优先使用 OpenClaw 第一方接口。
- 对大多数 infer 命令使用普通本地路径，无需 Gateway 网关。

对于端到端提供商检查，请在较低层级的提供商测试通过后优先使用 `openclaw infer ...`。它会在发起提供商请求前，验证已发布的 CLI、配置加载、默认智能体解析、内置插件激活、运行时依赖修复，以及共享能力运行时。

## 命令树

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## 常见任务

此表将常见推理任务映射到对应的 infer 命令。

| 任务                    | 命令                                                                  | 备注                                                 |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| 运行文本/模型提示词 | `openclaw infer model run --prompt "..." --json`                         | 默认使用普通本地路径                 |
| 生成图像       | `openclaw infer image generate --prompt "..." --json`                    | 从现有文件开始时使用 `image edit`  |
| 描述图像文件  | `openclaw infer image describe --file ./image.png --prompt "..." --json` | `--model` 必须是支持图像的 `<provider/model>` |
| 转录音频        | `openclaw infer audio transcribe --file ./memo.m4a --json`               | `--model` 必须是 `<provider/model>`                  |
| 合成语音       | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`   | `tts status` 面向 Gateway 网关                      |
| 生成视频        | `openclaw infer video generate --prompt "..." --json`                    | 支持提供商提示，例如 `--resolution`        |
| 描述视频文件   | `openclaw infer video describe --file ./clip.mp4 --json`                 | `--model` 必须是 `<provider/model>`                  |
| 搜索 Web          | `openclaw infer web search --query "..." --json`                         |                                                       |
| 获取网页        | `openclaw infer web fetch --url https://example.com --json`              |                                                       |
| 创建嵌入       | `openclaw infer embedding create --text "..." --json`                    |                                                       |

## 行为

- `openclaw infer ...` 是这些工作流的主要 CLI 接口。
- 当输出将被另一个命令或脚本消费时，使用 `--json`。
- 当需要特定后端时，使用 `--provider` 或 `--model provider/model`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 对于 `image describe`，显式的 `--model` 会直接运行该提供商/模型。该模型必须在模型目录或提供商配置中具备图像能力。`codex/<model>` 会运行有界的 Codex 应用服务器图像理解轮次；`openai-codex/<model>` 使用 OpenAI Codex OAuth 提供商路径。
- 无状态执行命令默认使用本地。
- Gateway 网关托管状态命令默认使用 Gateway 网关。
- 普通本地路径不要求 Gateway 网关正在运行。
- 本地 `model run` 是精简的一次性提供商补全。它会解析已配置的智能体模型和凭证，但不会启动聊天智能体轮次、加载工具或打开内置 MCP 服务器。
- `model run --gateway` 会验证 Gateway 网关路由、已保存凭证、提供商选择和嵌入式运行时，但仍作为原始模型探测运行：它发送所提供的提示词，不包含先前的会话转录、引导/AGENTS 上下文、上下文引擎组装、工具或内置 MCP 服务器。

## 模型

使用 `model` 进行由提供商支持的文本推理以及模型/提供商检查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整的 `<provider/model>` 引用来冒烟测试特定提供商，而无需启动 Gateway 网关或加载完整的智能体工具接口：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
```

备注：

- 本地 `model run` 是针对提供商/模型/凭证健康状况的最窄 CLI 冒烟测试，因为它只将所提供的提示词发送给选定模型。
- `model run --prompt` 必须包含非空白文本；空提示词会在调用本地提供商或 Gateway 网关前被拒绝。
- 当提供商没有返回文本输出时，本地 `model run` 会以非零状态退出，因此不可达的本地提供商和空补全不会看起来像成功的探测。
- 当你需要测试 Gateway 网关路由、智能体运行时设置或 Gateway 网关托管的提供商状态，同时保持模型输入为原始内容时，使用 `model run --gateway`。当你需要完整的智能体上下文、工具、内存和会话转录时，使用 `openclaw agent` 或聊天接口。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已保存的提供商凭证状态。

## 图像

使用 `image` 进行生成、编辑和描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

备注：

- 从现有输入文件开始时使用 `image edit`。
- 对于支持参考图像编辑几何提示的提供商/模型，可以将 `--size`、`--aspect-ratio` 或 `--resolution` 与 `image edit` 一起使用。
- 对于透明背景的 OpenAI PNG 输出，请将 `--output-format png --background transparent` 与 `--model openai/gpt-image-1.5` 一起使用；`--openai-background` 仍可作为 OpenAI 专用别名。未声明支持背景的提供商会将该提示报告为已忽略的覆盖项。
- 使用 `image providers --json` 验证哪些内置图像提供商可发现、已配置、已选择，以及每个提供商暴露哪些生成/编辑能力。
- 将 `image generate --model <provider/model> --json` 用作图像生成变更最窄的实时 CLI 冒烟测试。示例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 响应会报告 `ok`、`provider`、`model`、`attempts` 和已写入的输出路径。设置 `--output` 时，最终扩展名可能会跟随提供商返回的 MIME 类型。

- 对于 `image describe` 和 `image describe-many`，使用 `--prompt` 为视觉模型提供特定任务指令，例如 OCR、比较、UI 检查或简洁说明。
- 对较慢的本地视觉模型或冷启动 Ollama 使用 `--timeout-ms`。
- 对于 `image describe`，`--model` 必须是支持图像的 `<provider/model>`。
- 对于本地 Ollama 视觉模型，请先拉取模型，并将 `OLLAMA_API_KEY` 设置为任意占位符值，例如 `ollama-local`。参见 [Ollama](/zh-CN/providers/ollama#vision-and-image-description)。

## 音频

使用 `audio` 进行文件转录。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

备注：

- `audio transcribe` 用于文件转录，而不是实时会话管理。
- `--model` 必须是 `<provider/model>`。

## TTS

使用 `tts` 进行语音合成和 TTS 提供商状态管理。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

备注：

- `tts status` 默认使用 Gateway 网关，因为它反映 Gateway 网关托管的 TTS 状态。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 检查并配置 TTS 行为。

## 视频

使用 `video` 进行生成和描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

说明：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，并将它们转发给视频生成运行时。
- 对于 `video describe`，`--model` 必须是 `<provider/model>`。

## 网页

使用 `web` 处理搜索和抓取工作流。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

说明：

- 使用 `web providers` 检查可用、已配置和已选择的提供商。

## 嵌入

使用 `embedding` 创建向量并检查嵌入提供商。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令会将 JSON 输出规范化到共享封装中：

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

顶层字段是稳定的：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

对于生成媒体的命令，`outputs` 包含 OpenClaw 写入的文件。自动化时请使用该数组中的 `path`、`mimeType`、`size` 以及任何媒体专属尺寸，而不是解析面向人类可读的 stdout。

## 常见陷阱

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 说明

- `openclaw capability ...` 是 `openclaw infer ...` 的别名。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Models](/zh-CN/concepts/models)
