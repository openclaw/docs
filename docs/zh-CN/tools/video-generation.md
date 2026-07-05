---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 video_generate 工具参数
sidebarTitle: Video generation
summary: 通过 video_generate 基于文本、图像或视频引用在 16 个提供商后端生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-07-05T11:47:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a785955aeb2e9b68c9877ef6f4af59d9fd2d071b37be390dc5051279122decb
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 智能体通过 `video_generate` 从文本提示词、参考图像或
现有视频生成视频。支持十六个提供商后端；智能体会根据配置和
可用 API key 自动选择合适的后端。

<Note>
只有在至少一个视频生成提供商可用时，`video_generate` 才会出现。
如果你的智能体工具中缺少它，请设置提供商 API key，或
配置 `agents.defaults.videoGenerationModel`。
</Note>

`video_generate` 有三种运行时模式，会根据调用中的参考输入
解析：

- `generate` - 无参考媒体（文本转视频）。
- `imageToVideo` - 一张或多张参考图像。
- `videoToVideo` - 一个或多个参考视频。

提供商可以支持这些模式的任意子集。该工具会在提交前验证
活动模式，并在 `action=list` 中报告支持的模式。

## 快速开始

<Steps>
  <Step title="Configure auth">
    为任意受支持的提供商设置 API key：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > 生成一段 5 秒的电影感视频，内容是一只友好的龙虾在日落时冲浪。

    智能体会自动调用 `video_generate`。不需要工具 allowlist。

  </Step>
</Steps>

## 异步生成的工作方式

视频生成是异步的：

1. OpenClaw 将请求提交给提供商，并立即返回任务 ID。
2. 提供商在后台处理作业（通常为 30 秒到数分钟，取决于提供商和分辨率；较慢的队列型提供商可能会运行到配置的超时时间）。
3. 视频准备好后，OpenClaw 会用内部完成事件唤醒同一个会话。
4. 智能体会通过会话的常规可见回复模式报告结果：
   自动最终回复，或在会话需要消息工具时使用 `message(action="send")`。
   如果请求方会话处于非活动状态，或唤醒失败且完成回复中仍缺少生成的媒体，
   OpenClaw 会发送一条带有媒体的幂等直接 fallback。

当作业正在执行时，同一会话中的重复 `video_generate` 调用会返回当前
任务状态，而不是启动另一次生成。使用 `action: "status"` 可以在不触发
新生成的情况下检查状态，也可以从 CLI 使用 `openclaw tasks list` /
`openclaw tasks show <lookup>`（见 [后台任务](/zh-CN/automation/tasks)）。

在没有会话支撑的智能体运行之外（例如直接工具调用），
该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

当提供商返回字节时，生成的视频文件会保存在 OpenClaw 管理的媒体存储下。
默认上限为 16MB（共享视频媒体限制）；`agents.defaults.mediaMaxMb` 可为更大的
渲染提高上限。当提供商还返回托管输出 URL 时，如果本地持久化因文件过大而拒绝，
OpenClaw 会改为交付该 URL，而不是让任务失败。

### 任务生命周期

| 状态        | 含义                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 任务已创建，正在等待提供商接受。                                                                       |
| `running`   | 提供商正在处理（通常为 30 秒到数分钟，取决于提供商和分辨率）。                                         |
| `succeeded` | 视频已准备好；智能体会唤醒并将其发布到对话中。                                                         |
| `failed`    | 提供商错误或超时；智能体会唤醒并附带错误详情。                                                         |

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 支持的提供商

| 提供商                | 默认模型                        | 文本 | 图像参考                                             | 视频参考                                        | 凭证                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                       | 是（远程 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 张图像（仅 I2V 模型；第一帧 + 最后一帧）       | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 张图像（通过角色指定第一帧 + 最后一帧）        | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 张参考图像                                    | 最多 3 个视频                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 张图像                                             | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 张图像；使用 Seedance reference-to-video 时最多 9 张 | 使用 Seedance reference-to-video 时最多 3 个视频 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 张图像                                             | 1 个视频                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 张图像                                             | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 张图像（第一帧/最后一帧或参考）               | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                       | 是（远程 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 仅 `Wan-AI/Wan2.2-I2V-A14B`                          | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 张图像（`kling`）                                  | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 张首帧图像或最多 7 个 `reference_image`            | 1 个视频                                        | `XAI_API_KEY`                            |

某些提供商接受额外或替代的 API key 环境变量。详情见
各个 [提供商页面](#related)。

运行 `video_generate action=list` 可在运行时查看可用提供商、模型和
运行时模式。

### 能力矩阵

`video_generate`、契约测试和共享 live sweep 使用的显式模式契约：

| 提供商     | `generate` | `imageToVideo` | `videoToVideo` | 当前共享 live lanes                                                                                                                     |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共享 sweep 中；工作流特定覆盖由 Comfy 测试负责                                                                                      |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；原生 DeepInfra 视频 schema 在插件契约中是文本转视频                                                                         |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅在使用 Seedance reference-to-video 时支持 `videoToVideo`                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为当前基于 buffer 的 Gemini/Veo sweep 不接受该输入                              |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为此组织/输入路径当前需要提供商侧视频编辑访问权限                               |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时运行 `videoToVideo`                                                    |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；跳过共享 `imageToVideo`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL                                       |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商当前需要远程 MP4 URL                                                       |

## 工具参数

### 必填

<ParamField path="prompt" type="string" required>
  要生成的视频的文本描述。对于 `action: "generate"` 是必填项。
</ParamField>

### 内容输入

<ParamField path="image" type="string">单个参考图像（路径或 URL）。</ParamField>
<ParamField path="images" type="string[]">多个参考图像（最多 9 个）。</ParamField>
<ParamField path="imageRoles" type="string[]">
可选的按位置角色提示，与合并后的图像列表并行。
规范值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">单个参考视频（路径或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多个参考视频（最多 4 个）。</ParamField>
<ParamField path="videoRoles" type="string[]">
可选的按位置角色提示，与合并后的视频列表并行。
规范值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
单个参考音频（路径或 URL）。当提供商支持音频输入时，用于背景音乐或语音参考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多个参考音频（最多 3 个）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可选的按位置角色提示，与合并后的音频列表并行。
规范值：`reference_audio`。
</ParamField>

<Note>
角色提示会原样转发给提供商。规范值来自 `VideoGenerationAssetRole` 联合类型，但提供商可能接受额外的角色字符串。`*Roles` 数组的条目数不得多于对应的参考列表；差一错误会以明确错误失败。使用空字符串可让某个槽位保持未设置。对于 xAI，将每个图像角色都设为 `reference_image` 以使用其 `reference_images` 生成模式；对于单图像图生视频，省略角色或使用 `first_frame`。
</Note>

### 样式控制

<ParamField path="aspectRatio" type="string">
  宽高比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或提供商特定的值。OpenClaw 会按提供商规范化或忽略不支持的值。
</ParamField>
<ParamField path="resolution" type="string">分辨率提示，例如 `360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`，或提供商特定的值。OpenClaw 会按提供商规范化或忽略不支持的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目标时长（秒），会舍入到最近的提供商支持值。
</ParamField>
<ParamField path="size" type="string">提供商支持时使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支持时在输出中启用生成音频。不同于 `audioRef*`（输入）。
</ParamField>
<ParamField path="watermark" type="boolean">支持时切换提供商水印。</ParamField>

`adaptive` 是提供商特定的哨兵值：对于在能力中声明 `adaptive` 的提供商，会原样转发（例如 BytePlus Seedance 使用它根据输入图像尺寸自动检测比例）。未声明它的提供商会在工具结果的 `details.ignoredOverrides` 中暴露该值，因此被丢弃的情况可见。

### 高级

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 检查提供商。
</ParamField>
<ParamField path="model" type="string">提供商/模型覆盖（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商操作超时时间，单位为毫秒。省略时，如果已配置，OpenClaw 会使用 `agents.defaults.videoGenerationModel.timeoutMs`，否则在存在插件作者提供的提供商默认值时使用该默认值。</ParamField>
<ParamField path="providerOptions" type="object">
  作为 JSON 对象的提供商特定选项（例如 `{"seed": 42, "draft": true}`）。
  声明了类型化 schema 的提供商会验证键和类型；未知键或不匹配会在 fallback 期间跳过该候选。未声明 schema 的提供商会原样接收选项。运行 `video_generate action=list` 可查看每个提供商接受哪些内容。
</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 会将时长规范化为最接近的提供商支持值，并在 fallback 提供商暴露不同控制面时，重新映射已转换的几何提示，例如从 size 到 aspect-ratio。真正不支持的覆盖项会尽力忽略，并在工具结果中报告为警告。硬性能力限制（例如参考输入过多）会在提交前失败。工具结果会报告已应用的设置；`details.normalization` 会捕获任何从请求值到应用值的转换。
</Note>

参考输入会选择运行时模式：

- 无参考媒体 -> `generate`
- 任意图像参考 -> `imageToVideo`
- 任意视频参考 -> `videoToVideo`
- 参考音频输入**不会**改变解析后的模式；它们会叠加应用在图像/视频参考所选择的任何模式之上，并且仅适用于声明了 `maxInputAudios` 的提供商。

混合图像和视频参考不是稳定的共享能力表面。每个请求最好只使用一种参考类型。

#### Fallback 和类型化选项

某些能力检查应用在 fallback 层，而不是工具边界，因此超过主提供商限制的请求仍可在具备能力的 fallback 上运行：

- 当请求包含音频参考时，声明没有 `maxInputAudios`（或为 `0`）的活动候选会被跳过；随后尝试下一个候选。相同保护也会针对 `maxInputImages`/`maxInputVideos` 应用于图像和视频参考数量。
- 活动候选的 `maxDurationSeconds` 低于请求的 `durationSeconds`，且未声明 `supportedDurationSeconds` 列表 -> 跳过。
- 请求包含 `providerOptions`，且活动候选明确声明了类型化 `providerOptions` schema -> 如果提供的键不在 schema 中或值类型不匹配，则跳过。未声明 schema 的提供商会原样接收选项（向后兼容透传）。提供商可以通过声明空 schema（`capabilities.providerOptions: {}`）选择退出所有提供商选项，这会导致与类型不匹配相同的跳过结果。

请求中的第一个跳过原因会以 `warn` 记录，让操作员看到其主提供商何时被跳过；后续跳过会以 `debug` 记录，以免较长的 fallback 链过于嘈杂。如果每个候选都被跳过，聚合错误会包含每个候选的跳过原因。

## 操作

| 操作       | 作用                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 默认。从给定提示和可选参考输入创建视频。                                                                 |
| `status`   | 检查当前会话中正在进行的视频任务状态，而不启动另一次生成。                                               |
| `list`     | 显示可用提供商、模型及其能力。                                                                           |

## 模型选择

OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** - 如果智能体在调用中指定了它。
2. 配置中的 **`videoGenerationModel.primary`**。
3. 按顺序使用 **`videoGenerationModel.fallbacks`**。
4. **自动检测** - 具备有效凭证的提供商，从当前默认提供商开始，然后按字母顺序使用其余提供商。

如果某个提供商失败，会自动尝试下一个候选。如果所有候选都失败，错误会包含每次尝试的详细信息。

设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // optional per-tool provider request timeout override
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
  <Accordion title="BytePlus (1.0)">
    提供商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（默认）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单个参考图像（第一帧）。按位置传入图像，或设置 `role: "first_frame"`。提供图像时，T2V 模型 ID 会自动切换到对应的 I2V 变体。

    支持的 `providerOptions` 键：`seed`（数字）、`draft`（布尔值 - 强制 480p）、`camera_fixed`（布尔值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件（外部，非内置）。提供商 ID：`byteplus-seedance15`。模型：`seedance-1-5-pro-251215`。

    使用统一的 `content[]` API。最多支持 2 个输入图像（`first_frame` + `last_frame`）。所有输入都必须是远程 `https://` URL。在每个图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传入图像。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）会被转发。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件（外部，非内置）。提供商 ID：`byteplus-seedance2`。模型：`dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。

    使用统一的 `content[]` API。最多支持 9 个参考图像、3 个参考视频和 3 个参考音频。所有输入都必须是远程 `https://` URL。在每个资产上设置 `role` - 支持的值：`"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）会被转发。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流驱动的本地或云端执行。通过配置的图支持文本生成视频和
    图像生成视频。
  </Accordion>
  <Accordion title="fal">
    对长时间运行的作业使用队列支持的流程。OpenClaw 默认最多等待 20
    分钟，之后会将仍在进行中的 fal 队列作业视为超时。大多数 fal 视频模型
    接受单个图像引用。Seedance 2.0 引用生成视频模型
    最多接受 9 个图像、3 个视频和 3 个音频引用，并且
    引用文件总数最多为 12 个。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支持一个图像或一个视频引用。在 Gemini API 路径上，生成音频请求会
    被忽略并附带警告，因为该 API 会拒绝当前 Veo 视频生成的
    `generateAudio` 参数。
  </Accordion>
  <Accordion title="MiniMax">
    仅支持单个图像引用。MiniMax 接受 `768P` 和 `1080P`
    分辨率；像 `720P` 这样的请求会在提交前规范化为最接近的
    受支持值。
  </Accordion>
  <Accordion title="OpenAI">
    仅转发 `size` 覆盖项。其他样式覆盖项
    （`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并
    附带警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的异步 `/videos` API。OpenClaw 提交
    作业、轮询 `polling_url`，并下载 `unsigned_urls` 或
    文档化的作业内容端点。内置的 `google/veo-3.1-fast` 默认值
    声明支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及
    `16:9`/`9:16` 宽高比。
  </Accordion>
  <Accordion title="Qwen">
    使用与 Alibaba 相同的 DashScope 后端。引用输入必须是远程
    `http(s)` URL；本地文件会被预先拒绝。
  </Accordion>
  <Accordion title="Runway">
    通过 data URI 支持本地文件。视频生成视频需要
    `runway/gen4_aleph`。纯文本运行暴露 `16:9` 和 `9:16` 宽高比。
  </Accordion>
  <Accordion title="Together">
    仅支持单个图像引用。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1` 以避免会丢失凭证的
    重定向。`veo3` 以内置形式仅作为文本生成视频；`kling` 需要
    远程图像 URL。
  </Accordion>
  <Accordion title="xAI">
    支持文本生成视频、单个首帧图像生成视频、通过 xAI `reference_images`
    传入最多 7 个 `reference_image` 输入，以及远程
    视频编辑/扩展流程。
  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享的视频生成契约支持特定模式的能力，
而不只是扁平的聚合限制。新的提供商实现
应优先使用显式模式块：

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

像 `maxInputImages` 和 `maxInputVideos` 这样的扁平聚合字段
**不足以**声明转换模式支持。提供商应
显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，以便实时
测试、契约测试和共享的 `video_generate` 工具可以确定性地验证
模式支持。

当提供商中的某个模型拥有比其他模型更宽的引用输入支持时，
请使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整个模式的限制。

## 实时测试

共享内置提供商的可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media video
```

默认情况下，此实时文件会优先使用已导出的提供商环境变量，而不是存储的凭证
配置文件，并默认运行发布安全的冒烟测试：

- 对扫描中的每个非 FAL 提供商运行 `generate`。
- 一秒钟的龙虾提示词。
- 每个提供商的操作上限来自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（默认为 `180000`）。

FAL 是可选项，因为提供商侧队列延迟可能会主导发布
耗时：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，还会运行声明的
转换模式，这些模式是共享扫描可以使用本地媒体安全执行的：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`。
- 当 `capabilities.videoToVideo.enabled` 且
  提供商/模型在共享扫描中接受由缓冲区支持的本地视频输入时运行
  `videoToVideo`。

目前，只有在你选择 `runway/gen4_aleph` 时，共享的 `videoToVideo`
实时通道才覆盖 `runway`。

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

或通过 CLI 设置：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [后台任务](/zh-CN/automation/tasks) - 异步视频生成的任务跟踪
- [BytePlus](/zh-CN/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-CN/providers/comfy)
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults)
- [fal](/zh-CN/providers/fal)
- [Google (Gemini)](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [Models](/zh-CN/concepts/models)
- [OpenAI](/zh-CN/providers/openai)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [Together AI](/zh-CN/providers/together)
- [工具概览](/zh-CN/tools)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
