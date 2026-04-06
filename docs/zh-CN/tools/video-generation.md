---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 `video_generate` 工具参数
summary: 使用 12 个提供商后端从文本、图像或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-06T03:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90d8a392b35adbd899232b02c55c10895b9d7ffc9858d6ca448f2e4e4a57f12f
    source_path: tools/video-generation.md
    workflow: 15
---

# 视频生成

OpenClaw 智能体可以根据文本提示、参考图像或现有视频生成视频。支持 12 个提供商后端，每个后端都有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
仅当至少有一个视频生成提供商可用时，`video_generate` 工具才会显示。如果你没有在智能体工具中看到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

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

> 生成一段 5 秒钟的电影感视频，内容是一只友好的龙虾在日落时分冲浪。

智能体会自动调用 `video_generate`。不需要工具允许列表。

## 生成视频时会发生什么

视频生成是异步的。当智能体在一个会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给提供商，并立即返回一个任务 ID。
2. 提供商在后台处理该任务（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。
3. 当视频准备就绪时，OpenClaw 会通过内部完成事件唤醒同一个会话。
4. 智能体会将完成的视频发回原始对话中。

当某个任务仍在处理中时，在同一会话中重复调用 `video_generate` 不会启动新的生成，而是返回当前任务状态。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可从 CLI 检查进度。

在没有会话支持的智能体运行场景之外（例如直接调用工具），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

## 支持的提供商

| 提供商 | 默认模型                        | 文本 | 图像参考          | 视频参考         | API 密钥                                  |
| ------ | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                  | 是   | 是（远程 URL）    | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`| 是   | 1 张图像          | 否               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                    | 是   | 1 张图像          | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`| 是   | 1 张图像          | 否               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | 是 | 1 张图像          | 1 个视频         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`          | 是   | 1 张图像          | 否               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                      | 是   | 1 张图像          | 1 个视频         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                  | 是   | 是（远程 URL）    | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                      | 是   | 1 张图像          | 1 个视频         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`      | 是   | 1 张图像          | 否               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                        | 是   | 1 张图像（`kling`） | 否            | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`          | 是   | 1 张图像          | 1 个视频         | `XAI_API_KEY`                            |

某些提供商接受额外或替代的 API 密钥环境变量。详见各个[提供商页面](#related)。

运行 `video_generate action=list` 以在运行时查看可用的提供商和模型。

## 工具参数

### 必填

| 参数 | 类型   | 描述                                                                  |
| ---- | ------ | --------------------------------------------------------------------- |
| `prompt`  | string | 要生成的视频的文本描述（对 `action: "generate"` 为必填） |

### 内容输入

| 参数 | 类型     | 描述                         |
| ---- | -------- | ---------------------------- |
| `image`   | string   | 单个参考图像（路径或 URL） |
| `images`  | string[] | 多个参考图像（最多 5 个）  |
| `video`   | string   | 单个参考视频（路径或 URL） |
| `videos`  | string[] | 多个参考视频（最多 4 个）  |

### 风格控制

| 参数 | 类型 | 描述 |
| ---- | ---- | ---- |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution`      | string  | `480P`、`720P` 或 `1080P` |
| `durationSeconds` | number  | 目标时长（秒，四舍五入到最接近的提供商支持值） |
| `size`            | string  | 当提供商支持时的尺寸提示 |
| `audio`           | boolean | 在支持时启用生成音频 |
| `watermark`       | boolean | 在支持时切换提供商水印 |

### 高级

| 参数 | 类型 | 描述 |
| ---- | ---- | ---- |
| `action`   | string | `"generate"`（默认）、`"status"` 或 `"list"` |
| `model`    | string | 提供商/模型覆盖（例如 `runway/gen4.5`） |
| `filename` | string | 输出文件名提示 |

并非所有提供商都支持所有参数。不受支持的覆盖项会尽力忽略，并作为警告在工具结果中报告。硬性能力限制（例如参考输入过多）会在提交前直接失败。

## 操作

- **generate**（默认）-- 根据给定提示和可选参考输入创建视频。
- **status** -- 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** -- 显示可用的提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 会按以下顺序解析模型：

1. **`model` 工具参数** -- 如果智能体在调用中指定了该参数。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效认证信息的提供商，从当前默认提供商开始，然后按字母顺序尝试其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有候选项都失败，错误中会包含每次尝试的详细信息。

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

| 提供商 | 说明 |
| ------ | ---- |
| Alibaba  | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。 |
| BytePlus | 仅支持单张参考图像。 |
| ComfyUI  | 基于工作流的本地或云端执行。通过已配置的图，支持文生视频和图生视频。 |
| fal      | 对长时间运行任务使用基于队列的流程。仅支持单张参考图像。 |
| Google   | 使用 Gemini/Veo。支持一张参考图像或一个参考视频。 |
| MiniMax  | 仅支持单张参考图像。 |
| OpenAI   | 仅转发 `size` 覆盖项。其他风格覆盖项（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并给出警告。 |
| Qwen     | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会在前期直接被拒绝。 |
| Runway   | 通过 data URI 支持本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行公开 `16:9` 和 `9:16` 宽高比。 |
| Together | 仅支持单张参考图像。 |
| Vydra    | 直接使用 `https://www.vydra.ai/api/v1` 以避免认证在重定向过程中丢失。`veo3` 仅内置为文生视频；`kling` 需要远程图像 URL。 |
| xAI      | 支持文生视频、图生视频，以及远程视频编辑/扩展流程。 |

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

或通过 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关内容

- [工具概览](/zh-CN/tools)
- [后台任务](/zh-CN/automation/tasks) -- 异步视频生成的任务跟踪
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
