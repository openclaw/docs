---
read_when:
    - 添加或修改 `openclaw infer` 命令
    - 设计稳定的无头能力自动化
summary: 面向提供商支撑的模型、图像、音频、TTS、视频、Web 和嵌入工作流的推断优先 CLI
title: 推理 CLI
x-i18n:
    generated_at: "2026-07-05T11:09:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d2835d278be996aa1ae536ae7c2a4e8b2b093ba22e06358574e0180772d9b6e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是用于提供商支持推理的规范无头界面。它公开能力族（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`），而不是原始 Gateway 网关 RPC 名称或智能体工具 ID。`openclaw capability ...` 是同一命令树的别名。

相比一次性提供商包装器，更推荐使用它的原因：

- 复用 OpenClaw 中已配置的提供商和模型。
- 为脚本和智能体驱动的自动化提供稳定的 `--json` 信封（参见 [JSON 输出](#json-output)）。
- 对大多数子命令，运行正常的本地路径，无需 Gateway 网关。
- 对于端到端提供商检查，它会在提供商请求发出前，执行已发布的 CLI、配置加载、默认智能体解析、内置插件激活以及共享能力运行时。

## 将 infer 转换为技能

复制并粘贴给智能体：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

一个好的基于 infer 的技能会把常见用户意图映射到正确的子命令，为每个工作流包含几个规范示例，优先使用 `openclaw infer ...` 而不是更底层的替代方案，并且不会在技能正文中重新记录整个 infer 界面。

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

`infer list` / `infer inspect --name <capability>` 会以数据形式显示此树（能力 ID、传输协议、描述）。

## 常见任务

| 任务                          | 命令                                                                                       | 说明                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 运行文本/模型提示       | `openclaw infer model run --prompt "..." --json`                                              | 默认本地运行                                      |
| 在图像上运行模型提示  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 对多张图像重复使用 `--file`                   |
| 生成图像             | `openclaw infer image generate --prompt "..." --json`                                         | 从现有文件开始时使用 `image edit`  |
| 描述图像文件或 URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必须是支持图像的 `<provider/model>` |
| 转录音频              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必须是 `<provider/model>`                  |
| 合成语音             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 仅通过 Gateway 网关运行            |
| 生成视频              | `openclaw infer video generate --prompt "..." --json`                                         | 支持 `--resolution` 等提供商提示        |
| 描述视频文件         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必须是 `<provider/model>`                  |
| 搜索 Web                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 抓取网页              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 创建嵌入             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行为

- 当输出会馈送给另一个命令或脚本时使用 `--json`；否则使用文本输出。
- 使用 `--provider` 或 `--model provider/model` 固定特定后端。
- 使用 `model run --thinking <level>` 进行一次性思考/推理覆盖：`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 对于 `image describe`，`--file` 接受本地路径和 HTTP(S) URL；远程 URL 会经过正常的媒体抓取 SSRF 策略。
- 无状态执行命令（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）默认本地运行。Gateway 网关托管的状态命令（`tts status`）默认走 Gateway 网关。
- 本地路径从不要求 Gateway 网关正在运行。
- 本地 `model run` 是精简的一次性提供商补全：它会解析已配置的智能体模型和认证，但不会启动聊天智能体轮次、加载工具或打开内置 MCP 服务器。
- `model run --file` 会把图像文件（自动检测 MIME 类型）附加到提示中；对多张图像重复使用 `--file`。非图像文件会被拒绝——请改用 `infer audio transcribe` 或 `infer video describe`。
- `model run --gateway` 会执行 Gateway 网关路由、已保存认证、提供商选择和嵌入式运行时，但仍保持为原始模型探测：没有先前会话转录、bootstrap/AGENTS 上下文、工具或内置 MCP 服务器。
- `model run --gateway --model <provider/model>` 需要可信操作员 Gateway 网关凭证，因为它会请求 Gateway 网关运行一次性提供商/模型覆盖。

## 模型

文本推理和模型/提供商检查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.5 --json
```

配合 `--local` 使用完整 `<provider/model>` 引用，可以在不启动 Gateway 网关或加载智能体工具界面的情况下冒烟测试一个提供商：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

说明：

- 本地 `model run` 是用于提供商/模型/认证健康状况的最窄 CLI 冒烟测试：对于非 ChatGPT-Codex 提供商，它只发送提供的提示。
- 本地 `model run --model <provider/model>` 可以在该提供商写入配置之前解析精确的内置静态目录行（即 `openclaw models list --all` 显示的相同行）。仍然需要提供商认证；缺少凭证会以认证错误失败，而不是 `Unknown model`。
- 对于 Mistral Medium 3.5 推理探测，请保持 temperature 未设置/默认。Mistral 会拒绝带有 `temperature: 0` 的 `reasoning_effort="high"`；请使用默认 temperature 或非零值，例如 `0.7`。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）本地探测会添加一条最小系统指令，以便传输层填充其必需的 `instructions` 字段——没有完整智能体上下文、工具、记忆或会话转录。
- `model run --file` 会把图像内容直接附加到单条用户消息中。当 MIME 类型被检测为 `image/*` 时，常见格式（PNG、JPEG、WebP）可用；不支持或无法识别的文件会在调用提供商之前失败。如果你想使用 OpenClaw 的图像模型路由和回退，而不是直接的多模态模型探测，请改用 `infer image describe`。
- 所选模型必须支持图像输入；纯文本模型可能会在提供商层拒绝请求。
- `model run --prompt` 必须包含非空白文本；空提示会在任何提供商或 Gateway 网关调用前被拒绝。
- 当提供商没有返回文本输出时，本地 `model run` 会以非零状态退出，因此不可达的提供商和空补全不会看起来像成功的探测。
- 使用 `model run --gateway` 测试 Gateway 网关路由或智能体运行时设置，同时保持模型输入为原始输入。使用 `openclaw agent` 或聊天界面来获得完整智能体上下文、工具、记忆和会话转录。
- `--thinking adaptive` 会映射到补全运行时级别 `medium`；对于支持原生 max effort 的 OpenAI 模型，`--thinking max` 会映射到 `max`，否则映射到 `xhigh`。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已保存的提供商认证状态。

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

- 从现有输入文件开始时使用 `image edit`；在支持这些参数的提供商/模型上，`--size`、`--aspect-ratio` 或 `--resolution` 会添加几何提示。
- 将 `--output-format png --background transparent` 与 `--model openai/gpt-image-1.5` 搭配使用，会得到透明背景的 OpenAI PNG 输出；`--openai-background` 是同一提示的 OpenAI 专用别名。未声明支持背景的提供商会将其报告为被忽略的覆盖项（参见 [JSON 封套](#json-output)中的 `ignoredOverrides`）。
- `--quality low|medium|high|auto` 适用于支持图像质量提示的提供商，包括 OpenAI。OpenAI 还接受 `--openai-moderation low|auto`。
- `image providers --json` 会列出哪些内置图像提供商可发现、已配置、已选中，以及每个提供商公开了哪些生成/编辑能力。
- `image generate --model <provider/model> --json` 是用于图像生成变更的最小实时冒烟测试：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  响应会报告 `ok`、`provider`、`model`、`attempts` 和已写入的输出路径。设置 `--output` 时，最终扩展名可能会跟随提供商返回的 MIME 类型。

- 对于 `image describe` 和 `image describe-many`，使用 `--prompt` 提供特定任务的指令（OCR、对比、UI 检查、简洁描述）。
- 对于较慢的本地视觉模型或 Ollama 冷启动，使用 `--timeout-ms`。
- 对于 `image describe`，显式 `--model`（必须是支持图像的 `<provider/model>`）会先运行；如果该调用失败，再尝试已配置的 `agents.defaults.imageModel.fallbacks`。输入准备错误（缺少文件、不支持的 URL）会在任何 fallback 尝试之前失败，并且模型必须在模型目录或提供商配置中支持图像。
- 对于本地 Ollama 视觉模型，请先拉取模型，并将 `OLLAMA_API_KEY` 设置为任意占位值，例如 `ollama-local`。参见 [Ollama](/zh-CN/providers/ollama#vision-and-image-description)。

## 音频

文件转录（非实时会话管理）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` 必须是 `<provider/model>`。

## TTS

语音合成以及 TTS 提供商/语音角色状态。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

说明：

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

说明：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，并将它们转发给视频生成运行时。
- 对于 `video describe`，`--model` 必须是 `<provider/model>`。

## Web

搜索和获取。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` 会列出可用于搜索和获取的可用、已配置和已选中的提供商。

## 嵌入

向量创建和嵌入提供商检查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令会将 JSON 输出规范化到共享封套下：

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
- `inputs`（适用时，随请求发送的图像附件）
- `outputs`
- `ignoredOverrides`（适用时，提供商不支持的提示键）
- `error`

对于生成媒体的命令，`outputs` 包含 OpenClaw 写入的文件。自动化时，请使用该数组中的 `path`、`mimeType`、`size` 和任何媒体专用尺寸，而不是解析人类可读的 stdout。

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

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Models](/zh-CN/concepts/models)
