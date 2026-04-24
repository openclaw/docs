---
read_when:
    - 通过智能体生成音乐或音频
    - 配置音乐生成提供商和模型
    - 了解 `music_generate` 工具参数
summary: 使用共享提供商生成音乐，包括由工作流支持的插件
title: 音乐生成
x-i18n:
    generated_at: "2026-04-24T20:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc6da03cd1cc5728e903b3c5bf0c47da65642842e38c1006419e2f2ce2400bda
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 工具允许智能体通过共享的音乐生成功能创建音乐或音频，并可使用已配置的提供商，例如 Google、MiniMax，以及通过工作流配置的 ComfyUI。

对于由共享提供商支持的智能体会话，OpenClaw 会将音乐生成作为后台任务启动，在任务台账中跟踪它，然后在音轨准备就绪时再次唤醒智能体，以便智能体将完成的音频发布回原始渠道。

<Note>
只有在至少有一个音乐生成提供商可用时，内置共享工具才会出现。如果你在智能体的工具中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel` 或设置提供商 API 密钥。
</Note>

## 快速开始

### 由共享提供商支持的生成

1. 为至少一个提供商设置 API 密钥，例如 `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
2. 可选：设置你偏好的模型：

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

3. 向智能体提问：_“生成一首欢快的 synthpop 曲目，主题是在霓虹城市中夜间驾车。”_

智能体会自动调用 `music_generate`。不需要工具 allow-listing。

对于没有由会话支持的智能体运行的直接同步上下文，内置工具仍会回退到内联生成，并在工具结果中返回最终媒体路径。

提示词示例：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### 由工作流驱动的 Comfy 生成

内置的 `comfy` 插件会通过音乐生成提供商注册表接入共享 `music_generate` 工具。

1. 使用工作流 JSON 以及提示词/输出节点配置 `plugins.entries.comfy.config.music`。
2. 如果你使用 Comfy Cloud，请设置 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
3. 向智能体请求生成音乐，或直接调用该工具。

示例：

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 共享内置提供商支持

| 提供商 | 默认模型               | 参考输入      | 支持的控制项                                            | API 密钥                               |
| ------ | ---------------------- | ------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 张图像 | 由工作流定义的音乐或音频                                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 张图像 | `lyrics`、`instrumental`、`format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | 无            | `lyrics`、`instrumental`、`durationSeconds`、`format=mp3` | `MINIMAX_API_KEY`                      |

### 已声明的能力矩阵

这是 `music_generate`、契约测试以及共享实时扫描所使用的显式模式契约。

| 提供商 | `generate` | `edit` | 编辑限制 | 共享实时测试通道                                                     |
| ------ | ---------- | ------ | -------- | -------------------------------------------------------------------- |
| ComfyUI  | 是         | 是     | 1 张图像 | 不在共享扫描中；由 `extensions/comfy/comfy.live.test.ts` 覆盖 |
| Google   | 是         | 是     | 10 张图像 | `generate`、`edit`                                                   |
| MiniMax  | 是         | 否     | 无       | `generate`                                                           |

使用 `action: "list"` 可在运行时查看可用的共享提供商和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 可查看当前由会话支持的音乐任务：

```text
/tool music_generate action=status
```

直接生成示例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 内置工具参数

| 参数               | 类型     | 说明                                                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------- |
| `prompt`           | string   | 音乐生成提示词（`action: "generate"` 时必填）                                         |
| `action`           | string   | `"generate"`（默认）、用于当前会话任务的 `"status"`，或用于查看提供商的 `"list"`      |
| `model`            | string   | 提供商/模型覆盖，例如 `google/lyria-3-pro-preview` 或 `comfy/workflow`                |
| `lyrics`           | string   | 当提供商支持显式歌词输入时的可选歌词                                                  |
| `instrumental`     | boolean  | 当提供商支持时，请求仅器乐输出                                                        |
| `image`            | string   | 单个参考图像路径或 URL                                                                |
| `images`           | string[] | 多个参考图像（最多 10 张）                                                            |
| `durationSeconds`  | number   | 当提供商支持时，以秒为单位的目标时长提示                                              |
| `timeoutMs`        | number   | 可选的提供商请求超时时间（毫秒）                                                      |
| `format`           | string   | 当提供商支持时的输出格式提示（`mp3` 或 `wav`）                                        |
| `filename`         | string   | 输出文件名提示                                                                        |

并非所有提供商都支持所有参数。OpenClaw 仍会在提交前验证硬性限制，例如输入数量。当提供商支持时长但其最大值小于请求值时，OpenClaw 会自动钳制到最接近的受支持时长。对于真正不受支持的可选提示，当所选提供商或模型无法满足时，会忽略这些提示并给出警告。

工具结果会报告实际应用的设置。当 OpenClaw 在提供商回退期间钳制时长时，返回的 `durationSeconds` 反映的是提交值，而 `details.normalization.durationSeconds` 会显示从请求值到实际应用值的映射。

## 共享提供商支持路径的异步行为

- 由会话支持的智能体运行：`music_generate` 会创建后台任务，立即返回已启动/任务响应，并在后续智能体消息中稍后发布完成的音轨。
- 防止重复：当该后台任务仍处于 `queued` 或 `running` 状态时，同一会话中后续的 `music_generate` 调用会返回任务状态，而不是启动另一次生成。
- 状态查询：使用 `action: "status"` 可查看当前活跃的、由会话支持的音乐任务，而不会启动新任务。
- 任务跟踪：使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可查看该生成任务的排队中、运行中和终态状态。
- 完成唤醒：OpenClaw 会将一个内部完成事件注入回同一会话，以便模型自行编写面向用户的后续消息。
- 提示词提示：当同一会话中已有音乐任务在进行时，后续用户/手动轮次会收到一个小型运行时提示，以便模型不会盲目再次调用 `music_generate`。
- 无会话回退：在没有真实智能体会话的直接/本地上下文中，仍会以内联方式运行，并在同一轮返回最终音频结果。

### 任务生命周期

每个 `music_generate` 请求会经历四个状态：

1. **queued** —— 任务已创建，等待提供商接受。
2. **running** —— 提供商正在处理（通常为 30 秒到 3 分钟，取决于提供商和时长）。
3. **succeeded** —— 音轨已就绪；智能体被唤醒并将其发布到对话中。
4. **failed** —— 提供商错误或超时；智能体被唤醒并附带错误详情。

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防止重复：如果当前会话已有音乐任务处于 `queued` 或 `running` 状态，`music_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可显式检查状态，而不会触发新的生成。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### 提供商选择顺序

生成音乐时，OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 `model` 参数（如果智能体指定了）
2. 配置中的 `musicGenerationModel.primary`
3. 按顺序使用 `musicGenerationModel.fallbacks`
4. 仅使用由凭证支持的提供商默认值进行自动检测：
   - 先使用当前默认提供商
   - 再按 provider-id 顺序使用其余已注册的音乐生成提供商

如果某个提供商失败，会自动尝试下一个候选项。如果全部失败，错误中会包含每次尝试的详细信息。

如果你希望音乐生成仅使用显式的 `model`、`primary` 和 `fallbacks` 条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

## 提供商说明

- Google 使用 Lyria 3 批量生成。当前内置流程支持提示词、可选歌词文本和可选参考图像。
- MiniMax 使用批量 `music_generation` 端点。当前内置流程支持提示词、可选歌词、器乐模式、时长引导和 mp3 输出。
- ComfyUI 支持由工作流驱动，并取决于已配置的图以及提示词/输出字段的节点映射。

## 提供商能力模式

共享音乐生成契约现在支持显式模式声明：

- `generate`：用于仅基于提示词的生成
- `edit`：当请求包含一个或多个参考图像时使用

新的提供商实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

旧版扁平字段，例如 `maxInputImages`、`supportsLyrics` 和 `supportsFormat`，不足以声明编辑支持。提供商应显式声明 `generate` 和 `edit`，以便实时测试、契约测试以及共享 `music_generate` 工具能够以确定性的方式验证模式支持。

## 选择合适的路径

- 当你需要模型选择、提供商故障切换以及内置的异步任务/状态流时，使用由共享提供商支持的路径。
- 当你需要自定义工作流图，或某个不属于共享内置音乐能力的提供商时，使用插件路径，例如 ComfyUI。
- 如果你在调试 ComfyUI 特定行为，请参阅 [ComfyUI](/zh-CN/providers/comfy)。如果你在调试共享提供商行为，请先查看 [Google (Gemini)](/zh-CN/providers/google) 或 [MiniMax](/zh-CN/providers/minimax)。

## 实时测试

为共享内置提供商启用可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库包装命令：

```bash
pnpm test:live:media music
```

此实时测试文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境 API 密钥而不是已存储的认证配置文件，并在提供商启用编辑模式时同时运行 `generate` 和已声明的 `edit` 覆盖。

目前这意味着：

- `google`：`generate` 加 `edit`
- `minimax`：仅 `generate`
- `comfy`：单独的 Comfy 实时覆盖，不属于共享提供商扫描

为内置 ComfyUI 音乐路径启用可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

如果这些部分已配置，Comfy 实时测试文件还会覆盖 comfy 图像和视频工作流。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) - 用于分离式 `music_generate` 运行的任务跟踪
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - `musicGenerationModel` 配置
- [ComfyUI](/zh-CN/providers/comfy)
- [Google（Gemini）](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [模型](/zh-CN/concepts/models) - 模型配置和故障切换
- [工具概览](/zh-CN/tools)
