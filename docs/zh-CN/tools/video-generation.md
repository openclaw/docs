---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 `video_generate` 工具参数
summary: 使用 12 个提供商后端，从文本、图片或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-06T22:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59f65bf406cbf2b858523f94461251ee93c1f270cdd63dbe796e55f620574951
    source_path: tools/video-generation.md
    workflow: 15
---

# 视频生成

OpenClaw 智能体可以根据文本提示、参考图片或现有视频生成视频。支持 12 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
仅当至少有一个视频生成提供商可用时，`video_generate` 工具才会显示。如果你在智能体工具中看不到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` 用于没有参考媒体的文生视频请求
- `imageToVideo` 用于请求包含一个或多个参考图片时
- `videoToVideo` 用于请求包含一个或多个参考视频时

提供商可以支持这些模式中的任意子集。该工具会在提交前验证当前
模式，并在 `action=list` 中报告支持的模式。

## 快速开始

1. 为任意受支持的提供商设置 API 密钥：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选：固定默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向智能体发出请求：

> 生成一个 5 秒钟的电影感视频，内容是一只友好的龙虾在日落时分冲浪。

智能体会自动调用 `video_generate`。无需配置工具 allowlist。

## 生成视频时会发生什么

视频生成是异步的。当智能体在一个会话中调用 `video_generate` 时：

1. OpenClaw 会将请求提交给提供商，并立即返回一个任务 ID。
2. 提供商会在后台处理该任务（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。
3. 当视频准备就绪时，OpenClaw 会通过内部完成事件唤醒同一会话。
4. 智能体会将生成完成的视频发布回原始对话中。

当任务正在进行时，同一会话中的重复 `video_generate` 调用不会启动新的生成，而是返回当前任务状态。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可以通过 CLI 查看进度。

在没有会话支持的智能体运行场景之外（例如直接调用工具），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

### 任务生命周期

每个 `video_generate` 请求会经历四种状态：

1. **queued** -- 任务已创建，正在等待提供商接受。
2. **running** -- 提供商正在处理（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。
3. **succeeded** -- 视频已就绪；智能体会被唤醒并将其发布到对话中。
4. **failed** -- 提供商错误或超时；智能体会被唤醒并附带错误详情。

通过 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防止重复：如果当前会话已有视频任务处于 `queued` 或 `running` 状态，`video_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可以显式查询状态，而不会触发新的生成。

## 支持的提供商

| 提供商 | 默认模型                        | 文本 | 图片参考          | 视频参考         | API 密钥                                  |
| ------ | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                  | 是   | 是（远程 URL）    | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus（国际版） | `seedance-1-0-lite-t2v-250428`  | 是   | 1 张图片          | 否               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                    | 是   | 1 张图片          | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal    | `fal-ai/minimax/video-01-live` | 是   | 1 张图片          | 否               | `FAL_KEY`                                |
| Google | `veo-3.1-fast-generate-preview` | 是   | 1 张图片          | 1 个视频         | `GEMINI_API_KEY`                         |
| MiniMax | `MiniMax-Hailuo-2.3`          | 是   | 1 张图片          | 否               | `MINIMAX_API_KEY`                        |
| OpenAI | `sora-2`                       | 是   | 1 张图片          | 1 个视频         | `OPENAI_API_KEY`                         |
| Qwen   | `wan2.6-t2v`                   | 是   | 是（远程 URL）    | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway | `gen4.5`                       | 是   | 1 张图片          | 1 个视频         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`     | 是   | 1 张图片          | 否               | `TOGETHER_API_KEY`                       |
| Vydra  | `veo3`                         | 是   | 1 张图片（`kling`） | 否             | `VYDRA_API_KEY`                          |
| xAI    | `grok-imagine-video`           | 是   | 1 张图片          | 1 个视频         | `XAI_API_KEY`                            |

某些提供商接受额外或替代的 API 密钥环境变量。详情请参阅各个[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时检查可用的提供商、模型和
运行时模式。

### 声明的能力矩阵

这是 `video_generate`、契约测试
以及共享 live sweep 使用的显式模式契约。

| 提供商 | `generate` | `imageToVideo` | `videoToVideo` | 当前共享 live 通道                                                                                                                        |
| ------ | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 是       | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该提供商需要远程 `http(s)` 视频 URL                                                |
| BytePlus（国际版） | 是       | 是             | 否             | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI  | 是       | 是             | 否             | 不在共享 sweep 中；特定于 workflow 的覆盖位于 Comfy 测试中                                                                                |
| fal    | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                               |
| Google | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 被跳过，因为当前基于 buffer 的 Gemini/Veo sweep 不接受该输入                           |
| MiniMax | 是        | 是             | 否             | `generate`、`imageToVideo`                                                                                                               |
| OpenAI | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 被跳过，因为此组织/输入路径当前需要提供商侧 inpaint/remix 访问                          |
| Qwen   | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该提供商需要远程 `http(s)` 视频 URL                                                |
| Runway | 是         | 是             | 是             | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时才运行 `videoToVideo`                                                   |
| Together | 是       | 是             | 否             | `generate`、`imageToVideo`                                                                                                               |
| Vydra  | 是         | 是             | 否             | `generate`；共享 `imageToVideo` 被跳过，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图片 URL                                      |
| xAI    | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该提供商当前需要远程 MP4 URL                                                       |

## 工具参数

### 必填

| 参数 | 类型   | 说明                                                                         |
| ---- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | 要生成的视频的文本描述（`action: "generate"` 时必填） |

### 内容输入

| 参数 | 类型     | 说明                         |
| ---- | -------- | ---------------------------- |
| `image`   | string   | 单个参考图片（路径或 URL）   |
| `images`  | string[] | 多个参考图片（最多 5 张）    |
| `video`   | string   | 单个参考视频（路径或 URL）   |
| `videos`  | string[] | 多个参考视频（最多 4 个）    |

### 样式控制

| 参数 | 类型    | 说明                                                                     |
| ---- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution`      | string  | `480P`、`720P`、`768P` 或 `1080P`                                        |
| `durationSeconds` | number  | 目标时长（秒）（会四舍五入到最接近的提供商支持值）                      |
| `size`            | string  | 当提供商支持时使用的尺寸提示                                             |
| `audio`           | boolean | 在支持时启用生成音频                                                     |
| `watermark`       | boolean | 在支持时切换提供商水印                                                   |

### 高级

| 参数 | 类型   | 说明                                            |
| ---- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"`（默认）、`"status"` 或 `"list"` |
| `model`    | string | 提供商/模型覆盖（例如 `runway/gen4.5`）        |
| `filename` | string | 输出文件名提示                                 |

并非所有提供商都支持所有参数。OpenClaw 已经会将时长规范化到最接近的提供商支持值，并且当回退提供商暴露出不同的控制面时，它也会重新映射已转换的几何提示，例如从 size 到 aspect-ratio。真正不受支持的覆盖项会尽力忽略，并在工具结果中作为警告报告。硬性能力限制（例如参考输入过多）会在提交前失败。

参考输入还会选择运行时模式：

- 无参考媒体：`generate`
- 任意图片参考：`imageToVideo`
- 任意视频参考：`videoToVideo`

混合图片和视频参考并不是稳定的共享能力表面。
每次请求最好仅使用一种参考类型。

## 操作

- **generate**（默认）-- 根据给定提示和可选参考输入生成视频。
- **status** -- 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** -- 显示可用的提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 会按以下顺序解析模型：

1. **`model` 工具参数** -- 如果智能体在调用中指定了该参数。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效身份验证的提供商，从当前默认提供商开始，然后按字母顺序尝试其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有候选项都失败，错误中会包含每次尝试的详细信息。

如果你希望视频生成仅使用显式的 `model`、`primary` 和 `fallbacks`
条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## 提供商说明

| 提供商 | 说明                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 使用 DashScope/Model Studio 异步端点。参考图片和视频必须是远程 `http(s)` URL。                                                                               |
| BytePlus（国际版） | 仅支持单张参考图片。                                                                                                                                      |
| ComfyUI  | 由 workflow 驱动的本地或云端执行。通过已配置的图形支持文生视频和图生视频。                                                                                   |
| fal    | 对长时间运行的任务使用基于队列的流程。仅支持单张参考图片。                                                                                                    |
| Google | 使用 Gemini/Veo。支持一个图片参考或一个视频参考。                                                                                                             |
| MiniMax | 仅支持单张参考图片。                                                                                                                                        |
| OpenAI | 仅转发 `size` 覆盖项。其他样式覆盖项（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并给出警告。                                              |
| Qwen   | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会在前期直接被拒绝。                                                        |
| Runway | 通过 data URI 支持本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行暴露 `16:9` 和 `9:16` 长宽比。                                                    |
| Together | 仅支持单张参考图片。                                                                                                                                       |
| Vydra  | 直接使用 `https://www.vydra.ai/api/v1` 以避免身份验证丢失的重定向。`veo3` 内置为仅文生视频；`kling` 需要远程图片 URL。                                      |
| xAI    | 支持文生视频、图生视频，以及基于远程视频的编辑/扩展流程。                                                                                                     |

## 提供商能力模式

共享视频生成契约现在允许提供商声明特定于模式的
能力，而不只是扁平的聚合限制。新的提供商
实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

像 `maxInputImages` 和 `maxInputVideos` 这样的扁平聚合字段
不足以声明变换模式支持。提供商应显式声明
`generate`、`imageToVideo` 和 `videoToVideo`，以便 live 测试、
契约测试以及共享 `video_generate` 工具能够以确定性的方式
验证模式支持。

## Live 测试

为共享内置提供商启用可选的 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装命令：

```bash
pnpm test:live:media video
```

这个 live 文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用
live/env API 密钥，而不是已存储的身份验证配置文件，并运行它能够使用本地媒体安全执行的
声明模式：

- 为 sweep 中的每个提供商运行 `generate`
- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`
- 当 `capabilities.videoToVideo.enabled` 且提供商/模型
  在共享 sweep 中接受基于 buffer 的本地视频输入时运行 `videoToVideo`

目前共享 `videoToVideo` live 通道涵盖：

- `runway`，且仅当你选择 `runway/gen4_aleph` 时

## 配置

在你的 OpenClaw 配置中设置默认视频生成模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

或者通过 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关内容

- [工具概览](/zh-CN/tools)
- [后台任务](/zh-CN/automation/tasks) -- 用于异步视频生成的任务跟踪
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-CN/providers/comfy)
- [fal](/zh-CN/providers/fal)
- [Google（Gemini）](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [OpenAI](/zh-CN/providers/openai)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [Together AI](/zh-CN/providers/together)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults)
- [模型](/zh-CN/concepts/models)
