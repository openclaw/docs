---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 理解 `video_generate` 工具参数
sidebarTitle: Video generation
summary: 通过 `video_generate` 使用文本、图像或视频引用，在 14 个提供商后端上生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-26T05:36:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 智能体可以根据文本提示、参考图像或现有视频生成视频。当前支持 14 个提供商后端，每个后端都有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
只有当至少有一个视频生成提供商可用时，`video_generate` 工具才会出现。如果你在智能体工具中看不到它，请设置提供商 API 密钥，或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` — 不带参考媒体的文生视频请求。
- `imageToVideo` — 请求包含一个或多个参考图像。
- `videoToVideo` — 请求包含一个或多个参考视频。

提供商可能支持这些模式中的任意子集。工具会在提交前验证当前模式，并在 `action=list` 中报告受支持的模式。

## 快速开始

<Steps>
  <Step title="配置凭证">
    为任一受支持的提供商设置 API 密钥：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="选择默认模型（可选）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="向智能体发出请求">
    > 生成一段 5 秒的电影感视频，内容是一只友善的龙虾在日落时分冲浪。

    智能体会自动调用 `video_generate`。无需进行工具允许列表配置。

  </Step>
</Steps>

## 异步生成的工作方式

视频生成是异步的。当智能体在会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给提供商，并立即返回一个任务 id。
2. 提供商在后台处理该作业（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。
3. 视频准备就绪后，OpenClaw 会通过内部完成事件唤醒同一个会话。
4. 智能体会将生成完成的视频发布回原始对话中。

当某个作业仍在处理中时，同一会话中的重复 `video_generate` 调用不会启动新的生成，而是返回当前任务状态。你可以使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 在 CLI 中检查进度。

在非基于会话的智能体运行之外（例如直接调用工具时），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

当提供商返回字节数据时，生成的视频文件会保存到由 OpenClaw 管理的媒体存储中。默认的生成视频保存大小上限遵循视频媒体限制，而 `agents.defaults.mediaMaxMb` 可用于提高该上限以支持更大的渲染结果。当提供商还返回托管输出 URL 时，如果本地持久化因文件过大而拒绝保存，OpenClaw 可以改为交付该 URL，而不是让任务失败。

### 任务生命周期

| 状态        | 含义                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，正在等待提供商接受。                                                         |
| `running`   | 提供商正在处理（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。                   |
| `succeeded` | 视频已准备就绪；智能体会被唤醒并将其发布到对话中。                                       |
| `failed`    | 提供商错误或超时；智能体会被唤醒并附带错误详情。                                         |

通过 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果当前会话中某个视频任务已经处于 `queued` 或 `running` 状态，`video_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可以显式检查状态，而不会触发新的生成。

## 支持的提供商

| 提供商               | 默认模型                        | Text | Image ref                                            | Video ref                                       | Auth                                     |
| -------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba              | `wan2.6-t2v`                    |  ✓   | Yes（远程 URL）                                      | Yes（远程 URL）                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus（1.0）      | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 张图像（仅限 I2V 模型；首帧 + 末帧）          | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |  ✓   | 最多 2 张图像（通过角色指定首帧 + 末帧）             | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |  ✓   | 最多 9 张参考图像                                    | 最多 3 个视频                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI              | `workflow`                      |  ✓   | 1 张图像                                             | —                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal                  | `fal-ai/minimax/video-01-live`  |  ✓   | 1 张图像；使用 Seedance reference-to-video 时最多 9 张 | 使用 Seedance reference-to-video 时最多 3 个视频 | `FAL_KEY`                                |
| Google               | `veo-3.1-fast-generate-preview` |  ✓   | 1 张图像                                             | 1 个视频                                        | `GEMINI_API_KEY`                         |
| MiniMax              | `MiniMax-Hailuo-2.3`            |  ✓   | 1 张图像                                             | —                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI               | `sora-2`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `OPENAI_API_KEY`                         |
| Qwen                 | `wan2.6-t2v`                    |  ✓   | Yes（远程 URL）                                      | Yes（远程 URL）                                 | `QWEN_API_KEY`                           |
| Runway               | `gen4.5`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `RUNWAYML_API_SECRET`                    |
| Together             | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 张图像                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                | `veo3`                          |  ✓   | 1 张图像（`kling`）                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                  | `grok-imagine-video`            |  ✓   | 1 张首帧图像或最多 7 张 `reference_image`            | 1 个视频                                        | `XAI_API_KEY`                            |

某些提供商接受额外或替代的 API 密钥环境变量。详见各自的[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时检查可用的提供商、模型和运行时模式。

### 能力矩阵

`video_generate`、契约测试以及共享实时扫测使用的显式模式契约如下：

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时通道                                                                                                                        |
| -------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商需要远程 `http(s)` 视频 URL                                             |
| BytePlus |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI  |     ✓      |       ✓        |       —        | 不在共享扫测中；特定工作流覆盖由 Comfy 测试负责                                                                                        |
| fal      |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅在使用 Seedance reference-to-video 时支持 `videoToVideo`                                                 |
| Google   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前基于缓冲区的 Gemini/Veo 扫测不接受该输入                              |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前此组织/输入路径需要提供商侧的 inpaint/remix 访问权限                   |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商需要远程 `http(s)` 视频 URL                                             |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时才运行 `videoToVideo`                                                 |
| Together |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                              |
| Vydra    |     ✓      |       ✓        |       —        | `generate`；共享 `imageToVideo` 已跳过，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL                                    |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为该提供商当前需要远程 MP4 URL                                                    |

## 工具参数

### 必填

<ParamField path="prompt" type="string" required>
  要生成的视频的文本描述。对于 `action: "generate"` 为必填。
</ParamField>

### 内容输入

<ParamField path="image" type="string">单个参考图像（路径或 URL）。</ParamField>
<ParamField path="images" type="string[]">多个参考图像（最多 9 张）。</ParamField>
<ParamField path="imageRoles" type="string[]">
与合并后的图像列表按位置一一对应的可选角色提示。
规范值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">单个参考视频（路径或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多个参考视频（最多 4 个）。</ParamField>
<ParamField path="videoRoles" type="string[]">
与合并后的视频列表按位置一一对应的可选角色提示。
规范值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
单个参考音频（路径或 URL）。当提供商支持音频输入时，可用于背景音乐或语音参考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多个参考音频（最多 3 个）。</ParamField>
<ParamField path="audioRoles" type="string[]">
与合并后的音频列表按位置一一对应的可选角色提示。
规范值：`reference_audio`。
</ParamField>

<Note>
角色提示会按原样转发给提供商。规范值来自 `VideoGenerationAssetRole` 联合类型，但提供商也可能接受其他角色字符串。`*Roles` 数组的条目数不能多于对应的参考列表；此类偏移一位的错误会以明确的错误信息失败。使用空字符串可让某个位置保持未设置。对于 xAI，将每个图像角色都设为 `reference_image` 可使用其 `reference_images` 生成模式；对于单图像的图生视频，则省略该角色或使用 `first_frame`。
</Note>

### 风格控制

<ParamField path="aspectRatio" type="string">
  `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` 或 `adaptive`。
</ParamField>
<ParamField path="resolution" type="string">`480P`、`720P`、`768P` 或 `1080P`。</ParamField>
<ParamField path="durationSeconds" type="number">
  目标时长（秒）（会四舍五入到最接近的提供商支持值）。
</ParamField>
<ParamField path="size" type="string">当提供商支持时使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  在支持时，为输出启用生成音频。它与 `audioRef*`（输入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">在支持时切换提供商水印。</ParamField>

`adaptive` 是一个提供商特定的哨兵值：对于在其能力中声明了 `adaptive` 的提供商，该值会按原样转发（例如 BytePlus Seedance 用它根据输入图像尺寸自动检测比例）。未声明该值的提供商会通过工具结果中的 `details.ignoredOverrides` 暴露此值，以便明确显示该设置已被丢弃。

### 高级

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 用于检查提供商。
</ParamField>
<ParamField path="model" type="string">提供商/模型覆盖（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时时间（毫秒）。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 对象形式提供的提供商特定选项（例如 `{"seed": 42, "draft": true}`）。
  声明了类型化 schema 的提供商会验证键名和类型；未知键名或类型不匹配会在回退期间跳过该候选项。未声明 schema 的提供商会按原样接收这些选项。运行 `video_generate action=list` 可查看各提供商接受哪些选项。
</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 会将时长规范化为最接近的提供商支持值，并在回退提供商暴露不同控制面时，重新映射已转换的几何提示（例如尺寸到宽高比）。真正不受支持的覆盖项会尽力忽略，并在工具结果中作为警告报告。硬性能力限制（例如参考输入过多）会在提交前直接失败。工具结果会报告实际应用的设置；`details.normalization` 会记录从请求值到应用值的任何转换。
</Note>

参考输入会决定运行时模式：

- 无参考媒体 → `generate`
- 有任意图像参考 → `imageToVideo`
- 有任意视频参考 → `videoToVideo`
- 参考音频输入**不会**改变解析后的模式；它们会叠加到图像/视频参考所选择的模式之上，并且仅适用于声明了 `maxInputAudios` 的提供商。

混合使用图像和视频参考并不是稳定的共享能力面。建议每次请求只使用一种参考类型。

#### 回退与类型化选项

某些能力检查是在回退层而不是工具边界层应用的，因此即使请求超出了主提供商的限制，仍可能在具备能力的回退提供商上运行：

- 当请求包含音频参考，而当前候选项未声明 `maxInputAudios`（或为 `0`）时，该候选项会被跳过；然后尝试下一个候选项。
- 当当前候选项的 `maxDurationSeconds` 低于请求的 `durationSeconds`，且未声明 `supportedDurationSeconds` 列表时 → 跳过。
- 当请求包含 `providerOptions`，且当前候选项显式声明了类型化的 `providerOptions` schema 时 → 如果提供的键不在 schema 中或值类型不匹配，则跳过。未声明 schema 的提供商会按原样接收这些选项（向后兼容的透传）。提供商可以通过声明空 schema（`capabilities.providerOptions: {}`）来选择完全不支持任何提供商选项，这会产生与类型不匹配相同的跳过行为。

一次请求中的首个跳过原因会以 `warn` 级别记录，以便运维人员看到为何主提供商被略过；后续跳过会以 `debug` 级别记录，以避免过长的回退链产生过多噪声。如果所有候选项都被跳过，聚合错误会包含每个候选项的跳过原因。

## 操作

| Action     | 作用                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `generate` | 默认值。根据给定提示词和可选参考输入创建视频。                                                   |
| `status`   | 检查当前会话中正在进行的视频任务状态，而不启动新的生成。                                         |
| `list`     | 显示可用的提供商、模型及其能力。                                                                 |

## 模型选择

OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** — 如果智能体在调用中指定了它。
2. 配置中的 **`videoGenerationModel.primary`**。
3. 按顺序使用 **`videoGenerationModel.fallbacks`**。
4. **自动检测** — 从具有有效认证的提供商中选择，先当前默认提供商，再按字母顺序遍历其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有候选项都失败，错误信息会包含每次尝试的详情。

设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。

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

    模型：`seedance-1-0-pro-250528`（默认）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单个参考图像（首帧）。可按位置传入图像，或设置 `role: "first_frame"`。
    当提供图像时，T2V 模型 id 会自动切换为对应的 I2V 变体。

    支持的 `providerOptions` 键名：`seed`（number）、`draft`（boolean — 强制为 480p）、`camera_fixed`（boolean）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件。提供商 id：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用统一的 `content[]` API。最多支持 2 张输入图像
    （`first_frame` + `last_frame`）。所有输入都必须是远程 `https://`
    URL。请在每张图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传入图像。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。
    `audio: true` 会映射为 `generate_audio`。`providerOptions.seed`
    （number）会被转发。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件。提供商 id：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用统一的 `content[]` API。最多支持 9 张参考图像、
    3 个参考视频和 3 个参考音频。所有输入都必须是远程
    `https://` URL。请为每个资源设置 `role` — 支持的值包括：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。
    `audio: true` 会映射为 `generate_audio`。`providerOptions.seed`
    （number）会被转发。

  </Accordion>
  <Accordion title="ComfyUI">
    由工作流驱动的本地或云端执行。通过已配置的图形支持文生视频和图生视频。
  </Accordion>
  <Accordion title="fal">
    对于长时间运行的作业，使用基于队列的流程。大多数 fal 视频模型接受单个图像参考。Seedance 2.0 reference-to-video 模型最多接受 9 张图像、3 个视频和 3 个音频参考，且参考文件总数最多为 12 个。
  </Accordion>
  <Accordion title="Google（Gemini / Veo）">
    支持一个图像参考或一个视频参考。
  </Accordion>
  <Accordion title="MiniMax">
    仅支持单个图像参考。
  </Accordion>
  <Accordion title="OpenAI">
    仅转发 `size` 覆盖。其他风格覆盖项
    （`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略，并附带警告。
  </Accordion>
  <Accordion title="Qwen">
    与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程
    `http(s)` URL；本地文件会在前期被拒绝。
  </Accordion>
  <Accordion title="Runway">
    通过 data URI 支持本地文件。视频到视频需要
    `runway/gen4_aleph`。纯文本运行暴露 `16:9` 和 `9:16` 宽高比。
  </Accordion>
  <Accordion title="Together">
    仅支持单个图像参考。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1` 以避免丢失认证信息的重定向。`veo3` 内置为仅支持文生视频；`kling` 需要远程图像 URL。
  </Accordion>
  <Accordion title="xAI">
    支持文生视频、单个首帧图像图生视频、通过 xAI `reference_images` 提供最多 7 个 `reference_image` 输入，以及远程视频编辑/扩展流程。
  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享视频生成契约支持按模式区分的能力，而不只是扁平化的聚合限制。新的提供商实现应优先使用显式模式块：

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

诸如 `maxInputImages` 和 `maxInputVideos` 之类的扁平聚合字段**不足以**声明变换模式支持。提供商应显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，这样实时测试、契约测试以及共享的 `video_generate` 工具才能以确定性的方式验证模式支持。

当某个提供商中的单个模型比其余模型支持更广泛的参考输入时，请使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或 `maxInputAudiosByModel`，而不是提高整个模式的限制。

## 实时测试

共享内置提供商的选择性启用实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media video
```

该实时文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境中的 API 密钥，而不是已存储的认证配置文件，并默认运行发布安全的冒烟测试：

- 在扫测中的每个非 FAL 提供商上运行 `generate`。
- 使用一秒钟的龙虾提示词。
- 每个提供商的操作上限由
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 控制（默认值为 `180000`）。

FAL 为选择性启用，因为提供商侧的队列延迟可能会主导发布时间：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，还可运行共享扫测能够使用本地媒体安全执行的已声明变换模式：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`。
- 当 `capabilities.videoToVideo.enabled` 且该提供商/模型在共享扫测中接受基于缓冲区的本地视频输入时，运行 `videoToVideo`。

当前，共享 `videoToVideo` 实时通道仅在你选择 `runway/gen4_aleph` 时覆盖 `runway`。

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

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [后台任务](/zh-CN/automation/tasks) — 用于异步视频生成的任务跟踪
- [BytePlus](/zh-CN/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-CN/providers/comfy)
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults)
- [fal](/zh-CN/providers/fal)
- [Google（Gemini）](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [Models](/zh-CN/concepts/models)
- [OpenAI](/zh-CN/providers/openai)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [Together AI](/zh-CN/providers/together)
- [工具概览](/zh-CN/tools)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
