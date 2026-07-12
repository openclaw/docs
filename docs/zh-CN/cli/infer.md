---
read_when:
    - 添加或修改 `openclaw infer` 命令
    - 设计稳定的无头能力自动化流程
summary: 面向提供商支持的模型、图像、音频、TTS、视频、Web 和嵌入工作流的推断优先 CLI
title: 推理 CLI
x-i18n:
    generated_at: "2026-07-11T20:24:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是由提供商支持的推理功能的规范无头接口。它公开的是能力类别（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`），而不是原始 Gateway 网关 RPC 名称或智能体工具 ID。`openclaw capability ...` 是同一命令树的别名。

与一次性的提供商封装相比，优先使用它的原因：

- 复用 OpenClaw 中已配置的提供商和模型。
- 为脚本和智能体驱动的自动化提供稳定的 `--json` 封装（参见 [JSON 输出](#json-output)）。
- 大多数子命令通过常规本地路径运行，无需 Gateway 网关。
- 对于端到端提供商检查，它会在发出提供商请求前，覆盖已发布的 CLI、配置加载、默认智能体解析、内置插件激活以及共享能力运行时。

## 将 infer 转化为 Skills

将以下内容复制并粘贴给智能体：

```text
阅读 https://docs.openclaw.ai/cli/infer，然后创建一个 Skills，将我的常用工作流路由到 `openclaw infer`。
重点涵盖模型运行、图像生成、视频生成、音频转写、TTS、Web 搜索和嵌入。
```

一个良好的、基于 infer 的 Skills 会将常见用户意图映射到正确的子命令，为每种工作流提供几个规范示例，优先使用 `openclaw infer ...` 而不是更底层的替代方案，并且不会在 Skills 正文中重新记录整个 infer 接口。

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` 将此命令树显示为数据（能力 ID、传输方式、描述）。

## 常见任务

| 任务 | 命令 | 说明 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 运行文本/模型提示词 | `openclaw infer model run --prompt "..." --json` | 默认在本地运行 |
| 对图像运行模型提示词 | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 对多个图像重复使用 `--file` |
| 生成图像 | `openclaw infer image generate --prompt "..." --json` | 从现有文件开始时使用 `image edit` |
| 描述图像文件或 URL | `openclaw infer image describe --file ./image.png --prompt "..." --json` | `--model` 必须是支持图像的 `<provider/model>` |
| 转写音频 | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model` 必须是 `<provider/model>` |
| 合成语音 | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` 仅通过 Gateway 网关运行 |
| 生成视频 | `openclaw infer video generate --prompt "..." --json` | 支持 `--resolution` 等提供商提示参数 |
| 描述视频文件 | `openclaw infer video describe --file ./clip.mp4 --json` | `--model` 必须是 `<provider/model>` |
| 搜索 Web | `openclaw infer web search --query "..." --json` | |
| 获取网页 | `openclaw infer web fetch --url https://example.com --json` | |
| 创建嵌入 | `openclaw infer embedding create --text "..." --json` | |

## 行为

- 当输出要传给其他命令或脚本时使用 `--json`；否则使用文本输出。
- 使用 `--provider` 或 `--model provider/model` 固定特定后端。
- 使用 `model run --thinking <level>` 进行一次性思考/推理级别覆盖：`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须采用 `<provider/model>` 格式。
- 对于 `image describe`，`--file` 接受本地路径和 HTTP(S) URL；远程 URL 会经过常规媒体获取 SSRF 策略。
- 无状态执行命令（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）默认在本地运行。由 Gateway 网关管理状态的命令（`tts status`）默认通过 Gateway 网关运行。
- 本地路径从不要求 Gateway 网关处于运行状态。
- 本地 `model run` 是精简的一次性提供商补全：它会解析已配置的智能体模型和身份验证，但不会启动聊天智能体轮次、加载工具或打开内置 MCP 服务器。
- `model run --file` 会将图像文件（自动检测 MIME 类型）附加到提示词；对多个图像重复使用 `--file`。非图像文件会被拒绝——请改用 `infer audio transcribe` 或 `infer video describe`。
- `model run --gateway` 会覆盖 Gateway 网关路由、已保存的身份验证、提供商选择和嵌入式运行时，但仍是原始模型探测：不包含先前会话记录、引导/AGENTS 上下文、工具或内置 MCP 服务器。
- `model run --gateway --model <provider/model>` 需要受信任操作员的 Gateway 网关凭据，因为它要求 Gateway 网关执行一次性提供商/模型覆盖。

## 模型

文本推理以及模型/提供商检查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

将完整的 `<provider/model>` 引用与 `--local` 配合使用，可以在不启动 Gateway 网关或加载智能体工具接口的情况下，对单个提供商进行冒烟测试：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

说明：

- 本地 `model run` 是检查提供商/模型/身份验证健康状况的最小范围 CLI 冒烟测试：对于非 ChatGPT-Codex 提供商，它仅发送给定的提示词。
- 在该提供商尚未写入配置之前，本地 `model run --model <provider/model>` 也可以解析内置静态目录中的精确条目（即 `openclaw models list --all` 显示的相同条目）。仍然需要提供商身份验证；缺少凭据时会以身份验证错误失败，而不是报 `Unknown model`。
- 对 Mistral Medium 3.5 进行推理探测时，请将温度保持为未设置/默认值。Mistral 会拒绝同时使用 `reasoning_effort="high"` 和 `temperature: 0`；请使用默认温度或 `0.7` 等非零值。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）本地探测会添加一条最小系统指令，以便传输层填充其必需的 `instructions` 字段——不包含完整智能体上下文、工具、记忆或会话记录。
- `model run --file` 会将图像内容直接附加到唯一的用户消息中。检测到 MIME 类型为 `image/*` 时，常见格式（PNG、JPEG、WebP）均可使用；不支持或无法识别的文件会在调用提供商前失败。如果你需要使用 OpenClaw 的图像模型路由和回退机制，而不是直接进行多模态模型探测，请改用 `infer image describe`。
- 所选模型必须支持图像输入；纯文本模型可能会在提供商层拒绝请求。
- `model run --prompt` 必须包含非空白文本；空提示词会在调用任何提供商或 Gateway 网关前被拒绝。
- 当提供商未返回任何文本输出时，本地 `model run` 会以非零状态退出，因此无法访问的提供商和空补全不会看起来像成功的探测。
- 使用 `model run --gateway` 测试 Gateway 网关路由或智能体运行时设置，同时保持原始模型输入。需要完整智能体上下文、工具、记忆和会话记录时，请使用 `openclaw agent` 或聊天接口。
- `--thinking adaptive` 映射到补全运行时级别 `medium`；对于支持原生最高推理强度的 OpenAI 模型，`--thinking max` 映射到 `max`，否则映射到 `xhigh`。
- `model auth login`、`model auth logout` 和 `model auth status` 用于管理已保存的提供商身份验证状态。

## 图像

生成、编辑和描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

说明：

- 从现有输入文件开始时，使用 `image edit`；对于支持相关提示的提供商/模型，`--size`、`--aspect-ratio` 或 `--resolution` 可添加几何参数提示。
- 将 `--output-format png --background transparent` 与 `--model openai/gpt-image-1.5` 配合使用，可获得透明背景的 OpenAI PNG 输出；`--openai-background` 是同一提示的 OpenAI 专用别名。未声明支持背景设置的提供商会将其报告为已忽略的覆盖项（参见 [JSON 封装](#json-output)中的 `ignoredOverrides`）。
- `--quality low|medium|high|auto` 适用于支持图像质量提示的提供商，包括 OpenAI。OpenAI 还接受 `--openai-moderation low|auto`。
- `image providers --json` 会列出哪些内置图像提供商可被发现、已配置、已选中，以及每个提供商公开了哪些生成/编辑能力。
- `image generate --model <provider/model> --json` 是针对图像生成变更范围最小的实时冒烟测试：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  响应会报告 `ok`、`provider`、`model`、`attempts` 和已写入的输出路径。设置 `--output` 时，最终扩展名可能会跟随提供商返回的 MIME 类型。

- 对于 `image describe` 和 `image describe-many`，使用 `--prompt` 提供特定于任务的指令（OCR、比较、UI 检查、简洁的图片说明）。
- 对速度较慢的本地视觉模型或 Ollama 冷启动，使用 `--timeout-ms`。
- 对于 `image describe`，会首先运行显式指定的 `--model`（必须是具备图像能力的 `<provider/model>`）；如果该调用失败，再依次尝试已配置的 `agents.defaults.imageModel.fallbacks`。输入准备错误（文件缺失、不支持的 URL）会在尝试任何回退之前失败，并且模型必须在模型目录或提供商配置中被标记为具备图像能力。
- 对于本地 Ollama 视觉模型，请先拉取模型，并将 `OLLAMA_API_KEY` 设置为任意占位值，例如 `ollama-local`。参见 [Ollama](/zh-CN/providers/ollama#vision-and-image-description)。

## 音频

文件转录（不包括实时会话管理）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` 必须为 `<provider/model>`。

## TTS

语音合成以及 TTS 提供商/角色状态。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

注意事项：

- `tts status` 仅支持 `--gateway`（它反映由 Gateway 网关管理的 TTS 状态）。
- 使用 `tts providers`、`tts voices`、`tts personas`、`tts set-provider` 和 `tts set-persona` 检查并配置 TTS 行为。

## 视频

生成和描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注意事项：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，并将它们转发给视频生成运行时。
- 对于 `video describe`，`--model` 必须为 `<provider/model>`。

## Web

搜索和获取。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` 会列出搜索和获取所使用的可用、已配置和已选中的提供商。

## 嵌入

创建向量并检查嵌入提供商。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令会将 JSON 输出规范化到共享封装结构中：

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

稳定的顶层字段：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs`（随请求发送的图像附件，如适用）
- `outputs`
- `ignoredOverrides`（提供商不支持的提示键，如适用）
- `error`

对于生成媒体的命令，`outputs` 包含 OpenClaw 写入的文件。自动化时，请使用该数组中的 `path`、`mimeType`、`size` 以及任何媒体特有的尺寸信息，而不要解析供人阅读的标准输出。

## 常见问题

```bash
# 错误
openclaw infer media image generate --prompt "friendly lobster"

# 正确
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# 错误
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 正确
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Models](/zh-CN/concepts/models)
