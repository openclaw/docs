---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 `video_generate` 工具参数
summary: 使用 14 个提供商后端从文本、图像或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-25T17:32:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f04c9ac25a0ad08036266ab0c61a6ddf41ad944f64aa273ba31e09fc5774ac74
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 智能体可以根据文本提示、参考图像或现有视频生成视频。支持 14 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
只有在至少有一个视频生成提供商可用时，`video_generate` 工具才会显示。如果你在智能体工具中看不到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` 用于没有参考媒体的文生视频请求
- `imageToVideo` 用于请求包含一个或多个参考图像时
- `videoToVideo` 用于请求包含一个或多个参考视频时

提供商可以支持这些模式中的任意子集。该工具会在提交前验证当前
模式，并在 `action=list` 中报告支持的模式。

## 快速开始

1. 为任一受支持的提供商设置 API 密钥：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选：固定默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向智能体发出请求：

> 生成一个 5 秒钟的电影感视频，内容是一只友善的龙虾在日落时冲浪。

智能体会自动调用 `video_generate`。无需配置工具 allowlisting。

## 当你生成视频时会发生什么

视频生成是异步的。当智能体在会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给提供商，并立即返回一个任务 ID。
2. 提供商在后台处理该任务（通常为 30 秒到 5 分钟，取决于提供商和分辨率）。
3. 当视频准备好后，OpenClaw 会通过内部完成事件唤醒同一个会话。
4. 智能体会将生成完成的视频发回原始对话中。

当任务正在进行时，同一会话中的重复 `video_generate` 调用不会启动新的生成，而是返回当前任务状态。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可从 CLI 检查进度。

在非会话支持的智能体运行之外（例如，直接工具调用），该工具会回退为内联生成，并在同一轮返回最终媒体路径。

当提供商返回字节数据时，生成的视频文件会保存在 OpenClaw 管理的媒体存储中。
默认的生成视频保存上限遵循视频
媒体限制，而 `agents.defaults.mediaMaxMb` 可将其提高，以支持更大的渲染文件。
当提供商同时返回托管输出 URL 时，如果本地持久化拒绝保存过大的文件，OpenClaw 可以交付该 URL，
而不是让任务失败。

### 任务生命周期

每个 `video_generate` 请求会经历四种状态：

1. **queued** -- 任务已创建，等待提供商接受。
2. **running** -- 提供商正在处理（通常为 30 秒到 5 分钟，取决于提供商和分辨率）。
3. **succeeded** -- 视频已准备好；智能体被唤醒并将其发送到对话中。
4. **failed** -- 提供商错误或超时；智能体被唤醒并附带错误详情。

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防止重复：如果当前会话已有一个视频任务处于 `queued` 或 `running` 状态，`video_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可显式检查状态，而不会触发新的生成。

## 支持的提供商

| 提供商 | 默认模型 | 文本 | 图像参考 | 视频参考 | API 密钥 |
| ----- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba | `wan2.6-t2v` | 是 | 是（远程 URL） | 是（远程 URL） | `MODELSTUDIO_API_KEY` |
| BytePlus（1.0） | `seedance-1-0-pro-250528` | 是 | 最多 2 张图像（仅限 I2V 模型；首帧 + 末帧） | 否 | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215` | 是 | 最多 2 张图像（通过 role 指定首帧 + 末帧） | 否 | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | 是 | 最多 9 张参考图像 | 最多 3 个视频 | `BYTEPLUS_API_KEY` |
| ComfyUI | `workflow` | 是 | 1 张图像 | 否 | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal | `fal-ai/minimax/video-01-live` | 是 | 1 张图像 | 否 | `FAL_KEY` |
| Google | `veo-3.1-fast-generate-preview` | 是 | 1 张图像 | 1 个视频 | `GEMINI_API_KEY` |
| MiniMax | `MiniMax-Hailuo-2.3` | 是 | 1 张图像 | 否 | `MINIMAX_API_KEY` |
| OpenAI | `sora-2` | 是 | 1 张图像 | 1 个视频 | `OPENAI_API_KEY` |
| Qwen | `wan2.6-t2v` | 是 | 是（远程 URL） | 是（远程 URL） | `QWEN_API_KEY` |
| Runway | `gen4.5` | 是 | 1 张图像 | 1 个视频 | `RUNWAYML_API_SECRET` |
| Together | `Wan-AI/Wan2.2-T2V-A14B` | 是 | 1 张图像 | 否 | `TOGETHER_API_KEY` |
| Vydra | `veo3` | 是 | 1 张图像（`kling`） | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-video` | 是 | 1 张首帧图像或最多 7 张 `reference_image` | 1 个视频 | `XAI_API_KEY` |

某些提供商接受额外或替代的 API 密钥环境变量。详情请参阅各自的[提供商页面](#related)。

运行 `video_generate action=list`，可在运行时检查可用提供商、模型和
运行时模式。

### 声明的能力矩阵

这是 `video_generate`、契约测试
以及共享实时扫描所使用的显式模式契约。

| 提供商 | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时通道 |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商需要远程 `http(s)` 视频 URL |
| BytePlus | 是 | 是 | 否 | `generate`、`imageToVideo` |
| ComfyUI | 是 | 是 | 否 | 不在共享扫描中；特定于 workflow 的覆盖由 Comfy 测试负责 |
| fal | 是 | 是 | 否 | `generate`、`imageToVideo` |
| Google | 是 | 是 | 是 | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前基于缓冲区的 Gemini / Veo 扫描不接受该输入 |
| MiniMax | 是 | 是 | 否 | `generate`、`imageToVideo` |
| OpenAI | 是 | 是 | 是 | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前这个组织 / 输入路径需要提供商侧 inpaint / remix 访问 |
| Qwen | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商需要远程 `http(s)` 视频 URL |
| Runway | 是 | 是 | 是 | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时才运行 `videoToVideo` |
| Together | 是 | 是 | 否 | `generate`、`imageToVideo` |
| Vydra | 是 | 是 | 否 | `generate`；共享 `imageToVideo` 已跳过，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL |
| xAI | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商当前需要远程 MP4 URL |

## 工具参数

### 必填

| 参数 | 类型 | 说明 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | 要生成视频的文本描述（`action: "generate"` 时必填） |

### 内容输入

| 参数 | 类型 | 说明 |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image` | string | 单个参考图像（路径或 URL） |
| `images` | string[] | 多个参考图像（最多 9 张） |
| `imageRoles` | string[] | 可选的逐位置角色提示，与合并后的图像列表并行。规范值：`first_frame`、`last_frame`、`reference_image` |
| `video` | string | 单个参考视频（路径或 URL） |
| `videos` | string[] | 多个参考视频（最多 4 个） |
| `videoRoles` | string[] | 可选的逐位置角色提示，与合并后的视频列表并行。规范值：`reference_video` |
| `audioRef` | string | 单个参考音频（路径或 URL）。当提供商支持音频输入时，可用于背景音乐或语音参考等场景 |
| `audioRefs` | string[] | 多个参考音频（最多 3 个） |
| `audioRoles` | string[] | 可选的逐位置角色提示，与合并后的音频列表并行。规范值：`reference_audio` |

角色提示会按原样转发给提供商。规范值来自
`VideoGenerationAssetRole` 联合类型，但提供商可能接受额外的
角色字符串。`*Roles` 数组的条目数不能多于
对应的参考列表；这类 off-by-one 错误会以清晰的错误信息失败。
使用空字符串可让某个位置保持未设置。对于 xAI，将每个图像角色都设为
`reference_image` 可使用其 `reference_images` 生成模式；如果是单图 image-to-video，
则省略该角色或使用 `first_frame`。

### 风格控制

| 参数 | 类型 | 说明 |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio` | string | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` 或 `adaptive` |
| `resolution` | string | `480P`、`720P`、`768P` 或 `1080P` |
| `durationSeconds` | number | 目标时长（秒）（会四舍五入到最接近的提供商支持值） |
| `size` | string | 当提供商支持时使用的尺寸提示 |
| `audio` | boolean | 在支持时启用输出中的生成音频。与 `audioRef*`（输入）不同 |
| `watermark` | boolean | 在支持时切换提供商水印 |

`adaptive` 是一个提供商特定的哨兵值：它会按原样转发给
那些在其能力声明中包含 `adaptive` 的提供商（例如 BytePlus
Seedance 会用它根据输入图像
尺寸自动检测比例）。未声明该值的提供商会通过
工具结果中的 `details.ignoredOverrides` 显示此值，从而让该丢弃行为可见。

### 高级

| 参数 | 类型 | 说明 |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` | string | `"generate"`（默认）、`"status"` 或 `"list"` |
| `model` | string | 提供商 / 模型覆盖（例如 `runway/gen4.5`） |
| `filename` | string | 输出文件名提示 |
| `timeoutMs` | number | 可选的提供商请求超时时间（毫秒） |
| `providerOptions` | object | 以 JSON 对象形式传递的提供商特定选项（例如 `{"seed": 42, "draft": true}`）。声明了类型化 schema 的提供商会验证键名和类型；未知键名或类型不匹配会在回退期间跳过该候选项。未声明 schema 的提供商会按原样接收这些选项。运行 `video_generate action=list` 可查看各提供商接受哪些选项 |

并非所有提供商都支持所有参数。OpenClaw 已经会将时长规范化为最接近的提供商支持值，并且当回退提供商暴露出不同的控制面时，它还会重映射诸如 size 到 aspect-ratio 的几何提示。真正不受支持的覆盖项会尽力忽略，并在工具结果中作为警告报告。硬性能力限制（例如参考输入过多）会在提交前失败。

工具结果会报告实际应用的设置。当 OpenClaw 在提供商回退期间重映射时长或几何设置时，返回的 `durationSeconds`、`size`、`aspectRatio` 和 `resolution` 值反映的是实际提交的内容，而 `details.normalization` 会记录从请求值到应用值的转换。

参考输入也会决定运行时模式：

- 无参考媒体：`generate`
- 有任意图像参考：`imageToVideo`
- 有任意视频参考：`videoToVideo`
- 参考音频输入不会改变解析后的模式；它们是在图像 / 视频参考所选模式之上附加应用的，并且只对声明了 `maxInputAudios` 的提供商有效

混合使用图像和视频参考并不是稳定的共享能力面。
建议每个请求只使用一种参考类型。

#### 回退和类型化选项

某些能力检查是在回退层而不是
工具边界处应用的，这样超出主提供商限制的请求
仍然可以在有能力的回退提供商上运行：

- 如果活动候选项未声明 `maxInputAudios`（或将其声明为
  `0`），当请求包含音频参考时会跳过该候选项，并尝试
  下一个候选项。
- 如果活动候选项的 `maxDurationSeconds` 小于请求的
  `durationSeconds`，并且该候选项未声明
  `supportedDurationSeconds` 列表，则会被跳过。
- 如果请求包含 `providerOptions`，且活动候选项
  显式声明了类型化的 `providerOptions` schema，那么当提供的键名不在 schema 中或值类型
  不匹配时，该候选项会被跳过。尚未声明 schema 的提供商会按原样接收
  这些选项（向后兼容的直通行为）。提供商也可以
  通过声明空 schema
  （`capabilities.providerOptions: {}`）显式选择不接受任何提供商选项，这会导致与
  类型不匹配相同的跳过行为。

请求中的第一个跳过原因会以 `warn` 级别记录，因此运维人员可以看到
主提供商何时被略过；后续跳过则记录为
`debug`，以避免较长的回退链产生过多日志。如果每个候选项都被跳过，
汇总错误会包含每一项的跳过原因。

## 操作

- **generate**（默认）-- 根据给定提示和可选参考输入创建视频。
- **status** -- 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** -- 显示可用提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** -- 如果智能体在调用中指定了它。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效凭证验证的提供商，先从当前默认提供商开始，然后按字母顺序尝试其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有候选项都失败，错误中会包含每次尝试的详情。

如果你希望视频生成只使用显式的 `model`、`primary` 和 `fallbacks`
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

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。
  </Accordion>

  <Accordion title="BytePlus（1.0）">
    提供商 id：`byteplus`。

    模型：`seedance-1-0-pro-250528`（默认）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单个参考图像（首帧）。可按位置传递图像，或设置 `role: "first_frame"`。当提供图像时，T2V 模型 ID 会自动切换为对应的 I2V 变体。

    支持的 `providerOptions` 键名：`seed`（number）、`draft`（boolean —— 强制为 480p）、`camera_fixed`（boolean）。

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) 插件。提供商 id：`byteplus-seedance15`。模型：`seedance-1-5-pro-251215`。

    使用统一的 `content[]` API。最多支持 2 张输入图像（`first_frame` + `last_frame`）。所有输入都必须是远程 `https://` URL。请在每张图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传递图像。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 会映射到 `generate_audio`。`providerOptions.seed`（number）会被转发。

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) 插件。提供商 id：`byteplus-seedance2`。模型：`dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。

    使用统一的 `content[]` API。最多支持 9 张参考图像、3 个参考视频和 3 个参考音频。所有输入都必须是远程 `https://` URL。请为每个资源设置 `role` —— 支持的值为：`"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 会映射到 `generate_audio`。`providerOptions.seed`（number）会被转发。

  </Accordion>

  <Accordion title="ComfyUI">
    基于工作流的本地或云端执行。通过已配置图表支持文生视频和图生视频。
  </Accordion>

  <Accordion title="fal">
    对长时间运行任务使用基于队列的流程。仅支持单张参考图像。
  </Accordion>

  <Accordion title="Google（Gemini / Veo）">
    支持一张图像或一个视频参考。
  </Accordion>

  <Accordion title="MiniMax">
    仅支持单张参考图像。
  </Accordion>

  <Accordion title="OpenAI">
    仅转发 `size` 覆盖项。其他风格覆盖项（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略，并给出警告。
  </Accordion>

  <Accordion title="Qwen">
    与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会在前置检查时被拒绝。
  </Accordion>

  <Accordion title="Runway">
    通过 data URI 支持本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行暴露 `16:9` 和 `9:16` 两种宽高比。
  </Accordion>

  <Accordion title="Together">
    仅支持单张参考图像。
  </Accordion>

  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1` 以避免凭证验证在重定向过程中丢失。内置 `veo3` 仅支持文生视频；`kling` 需要远程图像 URL。
  </Accordion>

  <Accordion title="xAI">
    支持文生视频、单张首帧图像的图生视频、通过 xAI `reference_images` 使用最多 7 个 `reference_image` 输入，以及远程视频编辑 / 扩展流程。
  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享视频生成契约现在允许提供商声明按模式区分的
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
不足以声明转换模式支持。提供商应显式声明
`generate`、`imageToVideo` 和 `videoToVideo`，这样实时测试、
契约测试以及共享的 `video_generate` 工具才能以确定性的方式验证模式支持。

## 实时测试

针对共享内置提供商的可选加入式实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装命令：

```bash
pnpm test:live:media video
```

此实时文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用
实时 / 环境 API 密钥而不是已存储的 auth profiles，并默认运行一个
发布安全的冒烟测试：

- 对扫描中的每个非 FAL 提供商运行 `generate`
- 使用一秒钟的龙虾提示词
- 每个提供商的操作上限由 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  控制（默认值为 `180000`）

FAL 为可选加入，因为提供商侧队列延迟可能主导发布时间：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，还可运行共享扫描能够安全使用本地媒体执行的已声明转换
模式：

- 当 `capabilities.imageToVideo.enabled` 为真时运行 `imageToVideo`
- 当 `capabilities.videoToVideo.enabled` 为真且该提供商 / 模型
  在共享扫描中接受基于缓冲区的本地视频输入时运行 `videoToVideo`

目前共享的 `videoToVideo` 实时通道覆盖：

- 仅 `runway`，且前提是你选择了 `runway/gen4_aleph`

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
- [BytePlus](/zh-CN/concepts/model-providers#byteplus-international)
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
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults)
- [Models](/zh-CN/concepts/models)
