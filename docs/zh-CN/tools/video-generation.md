---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 `video_generate` 工具参数
sidebarTitle: Video generation
summary: 通过 16 个提供商后端，使用 video_generate 根据文本、图像或视频参考生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-07-12T14:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 智能体可通过 `video_generate`，根据文本提示词、参考图像或
现有视频生成视频。支持 16 个提供商后端；智能体会根据配置和
可用的 API key 自动选择合适的后端。

<Note>
只有至少一个视频生成提供商可用时，`video_generate` 才会出现。
如果智能体的工具中没有此工具，请设置提供商 API key 或
配置 `agents.defaults.videoGenerationModel`。
</Note>

`video_generate` 有三种运行时模式，具体模式根据调用中的参考输入
确定：

- `generate` - 无参考媒体（文本生成视频）。
- `imageToVideo` - 一张或多张参考图像。
- `videoToVideo` - 一个或多个参考视频。

提供商可以支持这些模式的任意子集。该工具会在提交前验证
当前模式，并在 `action=list` 中报告支持的模式。

## 快速开始

<Steps>
  <Step title="配置身份验证">
    为任意受支持的提供商设置 API key：

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
    > 生成一段 5 秒的电影感视频，内容是一只友善的龙虾在日落时冲浪。

    智能体会自动调用 `video_generate`。无需将该工具加入允许列表。

  </Step>
</Steps>

## 异步生成的工作原理

视频生成采用异步方式：

1. OpenClaw 将请求提交给提供商，并立即返回任务 ID。
2. 提供商在后台处理任务（通常需要 30 秒到几分钟，具体取决于提供商和分辨率；由慢速队列支持的提供商最长可运行至配置的超时时间）。
3. 视频就绪后，OpenClaw 会使用内部完成事件唤醒同一会话。
4. 智能体通过会话的常规可见回复模式进行报告：
   自动发送最终回复；如果会话要求使用消息工具，则调用 `message(action="send")`。
   如果请求方会话处于非活动状态，或者唤醒失败且完成回复中仍缺少生成的媒体，
   OpenClaw 会直接发送包含该媒体的幂等回退消息。

当任务正在进行时，同一会话中重复调用 `video_generate` 会返回
当前任务状态，而不会启动另一项生成任务。使用 `action: "status"` 可在
不触发新生成任务的情况下检查状态；也可以通过 CLI 使用
`openclaw tasks list` / `openclaw tasks show <lookup>`
（请参阅[后台任务](/zh-CN/automation/tasks)）。

在基于会话的智能体运行之外（例如直接调用工具），
该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

当提供商返回字节数据时，生成的视频文件会保存在 OpenClaw 管理的
媒体存储中。默认上限为 16MB（共享视频媒体限制）；
对于更大的渲染结果，可通过 `agents.defaults.mediaMaxMb` 提高上限。
如果提供商还返回托管输出 URL，而本地持久化因文件过大而拒绝保存，
OpenClaw 会改为交付该 URL，而不会使任务失败。

### 任务生命周期

| 状态        | 含义                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 任务已创建，正在等待提供商接受。                                                                       |
| `running`   | 提供商正在处理（通常需要 30 秒到几分钟，具体取决于提供商和分辨率）。                                    |
| `succeeded` | 视频已就绪；智能体会被唤醒并将其发布到对话中。                                                         |
| `failed`    | 提供商错误或超时；智能体会被唤醒并收到错误详情。                                                       |

通过 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 支持的提供商

| 提供商                | 默认模型                        | 文本 | 图像参考                                             | 视频参考                                        | 身份验证                                 |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 支持（远程 URL）                                     | 支持（远程 URL）                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 张图像（仅限 I2V 模型；首帧 + 尾帧）          | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 张图像（通过角色指定首帧 + 尾帧）              | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 张参考图像                                    | 最多 3 个视频                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 张图像                                             | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 张图像；使用 Seedance 参考生成视频时最多 9 张       | 使用 Seedance 参考生成视频时最多 3 个视频        | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 张图像                                             | 1 个视频                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 张图像                                             | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 张图像（首帧/尾帧或参考图像）                  | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 支持（远程 URL）                                     | 支持（远程 URL）                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 仅限 `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 张图像（`kling`）                                  | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic：1 个首帧或 7 张参考图像；1.5：1 帧           | Classic：1 个视频                               | `XAI_API_KEY`                            |

一些提供商接受额外或替代的 API key 环境变量。详情请参阅
各个[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时查看可用的提供商、模型和
运行时模式。

### 能力矩阵

以下是 `video_generate`、契约测试和
共享实时扫描使用的显式模式契约：

| 提供商     | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时测试通道                                                                                                                      |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                 |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共享扫描中；工作流特定的覆盖由 Comfy 测试提供                                                                                        |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；插件契约中的原生 DeepInfra 视频模式为文本生成视频                                                                            |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅使用 Seedance 参考生成视频时支持 `videoToVideo`                                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为当前基于缓冲区的 Gemini/Veo 扫描不接受该输入                                    |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为此组织/输入路径目前需要提供商侧的视频编辑权限                                   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                 |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时才运行 `videoToVideo`                                                    |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；跳过共享 `imageToVideo`，因为内置的 `veo3` 仅支持文本，而内置的 `kling` 需要远程图像 URL                                     |
| xAI        |     ✓      |       ✓        |       ✓        | Classic 支持所有模式；Video 1.5 仅支持图像生成视频；远程 MP4 输入使 `videoToVideo` 不纳入共享扫描                                        |

## 工具参数

### 必填

<ParamField path="prompt" type="string" required>
  要生成的视频的文本描述。`action: "generate"` 必须提供此参数。
</ParamField>

### 内容输入

<ParamField path="image" type="string">单张参考图像（路径或 URL）。</ParamField>
<ParamField path="images" type="string[]">多张参考图像（最多 9 张）。</ParamField>
<ParamField path="imageRoles" type="string[]">
可选的逐位置角色提示，与合并后的图像列表一一对应。
规范值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">单个参考视频（路径或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多个参考视频（最多 4 个）。</ParamField>
<ParamField path="videoRoles" type="string[]">
可选的逐位置角色提示，与合并后的视频列表一一对应。
规范值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
单个参考音频（路径或 URL）。当提供商支持音频输入时，用作背景音乐或
语音参考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多个参考音频（最多 3 个）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可选的逐位置角色提示，与合并后的音频列表一一对应。
规范值：`reference_audio`。
</ParamField>

<Note>
角色提示会原样转发给提供商。规范值来自
`VideoGenerationAssetRole` 联合类型，但提供商可能接受其他
角色字符串。`*Roles` 数组的条目数不得超过
对应参考列表的条目数；差一错误会返回清晰的错误。
使用空字符串可将某个位置保留为未设置。对于 xAI，将每个图像角色都设为
`reference_image`，以使用其 `reference_images` 生成模式；对于单图像生视频，
省略角色或使用 `first_frame`。
</Note>

### 样式控制

<ParamField path="aspectRatio" type="string">
  宽高比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive` 或提供商特定值。OpenClaw 会根据提供商对不支持的值进行规范化或忽略。
</ParamField>
<ParamField path="resolution" type="string">分辨率提示，例如 `360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K` 或提供商特定值。OpenClaw 会根据提供商对不支持的值进行规范化或忽略。</ParamField>
<ParamField path="durationSeconds" type="number">
  目标时长（秒，四舍五入到最接近的提供商支持值）。
</ParamField>
<ParamField path="size" type="string">提供商支持时使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  在支持时为输出启用生成音频。与 `audioRef*`（输入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">在支持时切换提供商水印。</ParamField>

`adaptive` 是提供商特定的哨兵值：对于在其能力中声明
`adaptive` 的提供商，该值会原样转发（例如 BytePlus
Seedance 使用它根据输入图像尺寸自动检测宽高比）。
未声明该值的提供商会通过工具结果中的
`details.ignoredOverrides` 呈现该值，以明确显示其已被舍弃。

### 高级选项

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 检查提供商。
</ParamField>
<ParamField path="model" type="string">提供商/模型覆盖值（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商操作超时时间（毫秒）。省略时，如果已配置，OpenClaw 会使用 `agents.defaults.videoGenerationModel.timeoutMs`；否则，在存在插件定义的提供商默认值时使用该默认值。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 对象形式提供的提供商特定选项（例如 `{"seed": 42, "draft": true}`）。
  声明了类型化模式的提供商会验证键和类型；未知键或类型不匹配时，
  会在回退期间跳过该候选项。未声明模式的提供商会原样接收这些选项。
  运行 `video_generate action=list` 可查看每个提供商接受的选项。
</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 会将时长规范化为
最接近的提供商支持值；当回退提供商提供不同的
控制接口时，还会重新映射已转换的几何提示，例如从尺寸映射到宽高比。
真正不受支持的覆盖值会尽力忽略，并在工具结果中报告为警告。
硬性能力限制（例如参考输入过多）会在提交前失败。工具结果会
报告应用的设置；`details.normalization` 会记录任何
从请求值到应用值的转换。
</Note>

参考输入决定运行时模式：

- 无参考媒体 -> `generate`
- 任意图像参考 -> `imageToVideo`
- 任意视频参考 -> `videoToVideo`
- 参考音频输入**不会**改变解析后的模式；它们会叠加应用于
  图像/视频参考所选择的模式，并且仅适用于
  声明了 `maxInputAudios` 的提供商。

混合使用图像和视频参考并不是稳定的共享能力接口。
建议每个请求仅使用一种参考类型。

#### 回退和类型化选项

某些能力检查在回退层而非工具边界执行，因此，即使请求超出
主要提供商的限制，仍可在具备相应能力的回退提供商上运行：

- 当请求包含音频参考时，如果当前候选项未声明 `maxInputAudios`（或声明为 `0`），
  则跳过该候选项并尝试下一个候选项。对于图像和视频参考数量，
  同样会依据 `maxInputImages`/`maxInputVideos` 应用此防护。
- 当前候选项的 `maxDurationSeconds` 小于请求的 `durationSeconds`，
  且未声明 `supportedDurationSeconds` 列表 -> 跳过。
- 请求包含 `providerOptions`，并且当前候选项明确
  声明了类型化 `providerOptions` 模式 -> 如果提供的键
  不在模式中或值类型不匹配，则跳过。未声明模式的提供商会
  原样接收选项（向后兼容的
  透传）。提供商可以通过声明空模式
  （`capabilities.providerOptions: {}`）选择不接受任何提供商选项，
  这会产生与类型不匹配相同的跳过结果。

请求中的第一个跳过原因会以 `warn` 级别记录，以便操作员了解
主要提供商何时被跳过；后续跳过原因以 `debug` 级别记录，
避免较长的回退链产生过多日志。如果所有候选项均被跳过，
聚合错误会包含每个候选项的跳过原因。

## 操作

| 操作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 默认操作。根据给定提示词和可选参考输入创建视频。                                                         |
| `status`   | 检查当前会话中正在进行的视频任务状态，而不启动另一次生成。                                               |
| `list`     | 显示可用的提供商、模型及其能力。                                                                         |

## 模型选择

OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** - 如果智能体在调用中指定了该参数。
2. 配置中的 **`videoGenerationModel.primary`**。
3. 按顺序使用 **`videoGenerationModel.fallbacks`**。
4. **自动检测** - 从当前默认提供商开始，查找具有有效身份验证的提供商，
   然后按字母顺序检查其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有
候选项均失败，错误会包含每次尝试的详细信息。

将 `agents.defaults.mediaGenerationAutoProviderFallback: false` 设为
仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // 可选的每工具提供商请求超时覆盖值
      },
    },
  },
}
```

## 提供商说明

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 异步端点。参考图像和
    视频必须是远程 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    提供商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（默认）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和
    通用 `*-pro-*` 模型支持单张参考图像（首帧）。
    按位置传递图像，或设置 `role: "first_frame"`。
    提供图像时，T2V 模型 ID 会自动切换为对应的 I2V
    变体。

    支持的 `providerOptions` 键：`seed`（数字）、`draft`（布尔值 -
    强制使用 480p）、`camera_fixed`（布尔值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件（外部插件，非内置）。提供商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用统一的 `content[]` API。最多支持 2 张输入图像
    （`first_frame` + `last_frame`）。所有输入都必须是远程
    `https://` URL。为每张图像设置 `role: "first_frame"` / `"last_frame"`，
    或按位置传递图像。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测宽高比。
    `audio: true` 映射到 `generate_audio`。`providerOptions.seed`
    （数字）会被转发。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件（外部插件，非内置）。提供商 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用统一的 `content[]` API。最多支持 9 张参考图像、
    3 个参考视频和 3 个参考音频。所有输入都必须是远程
    `https://` URL。为每个资源设置 `role` - 支持的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测宽高比。
    `audio: true` 映射到 `generate_audio`。`providerOptions.seed`
    （数字）会被转发。

  </Accordion>
  <Accordion title="ComfyUI">
    由工作流驱动的本地或云端执行。通过配置的图支持文生视频和
    图生视频。
  </Accordion>
  <Accordion title="fal">
    对长时间运行的作业使用基于队列的流程。默认情况下，OpenClaw 最多等待 20
    分钟，之后会将仍在进行中的 fal 队列作业视为
    超时。大多数 fal 视频模型
    接受单个图像引用。Seedance 2.0 参考生成视频
    模型最多接受 9 个图像、3 个视频和 3 个音频引用，
    引用文件总数最多为 12 个。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支持一个图像或一个视频引用。在 Gemini API 路径上，
    生成音频的请求会被忽略并发出警告，因为该 API 会拒绝
    当前 Veo 视频生成中的 `generateAudio` 参数。
  </Accordion>
  <Accordion title="MiniMax">
    仅支持单个图像引用。MiniMax 接受 `768P` 和 `1080P`
    分辨率；提交前，`720P` 等请求会被规范化为最接近的
    受支持值。
  </Accordion>
  <Accordion title="OpenAI">
    仅转发 `size` 覆盖项。其他样式覆盖项
    （`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并
    发出警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的异步 `/videos` API。OpenClaw 提交
    作业、轮询 `polling_url`，然后从 `unsigned_urls` 或
    文档所述的作业内容端点下载结果。内置的默认模型 `google/veo-3.1-fast`
    标明支持 4/6/8 秒时长、`720P`/`1080P` 分辨率和
    `16:9`/`9:16` 宽高比。
  </Accordion>
  <Accordion title="Qwen">
    使用与 Alibaba 相同的 DashScope 后端。引用输入必须是远程
    `http(s)` URL；本地文件会被预先拒绝。
  </Accordion>
  <Accordion title="Runway">
    通过数据 URI 支持本地文件。视频转视频需要
    `runway/gen4_aleph`。纯文本运行提供 `16:9` 和 `9:16`
    宽高比。
  </Accordion>
  <Accordion title="Together">
    仅支持单个图像引用。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重定向导致
    身份验证信息丢失。内置的 `veo3` 仅支持文生视频；`kling` 需要
    远程图像 URL。
  </Accordion>
  <Accordion title="xAI">
    默认的 `grok-imagine-video` 模型支持文生视频、以单张
    首帧图像生成视频、通过 xAI `reference_images` 接收最多 7 个
    `reference_image` 输入，以及远程视频编辑/延长流程。生成时默认
    使用 `480P`；对于单图像图生视频，如果省略 `aspectRatio`，
    则继承源图像的宽高比。视频编辑/延长会继承输入的几何尺寸，
    且不接受宽高比或分辨率覆盖。延长支持 2-10
    秒。

    `grok-imagine-video-1.5` 仅支持图生视频：必须恰好提供一个图像。
    它支持 1-15 秒以及 `480P`、`720P` 或 `1080P`，默认使用
    `480P`；省略 `aspectRatio` 可继承源图像的宽高比。预览版
    和带日期的 1.5 标识符接受相同的验证，并会保持不变地
    转发。

  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享视频生成契约支持按模式定义的能力，
而不只是扁平化的汇总限制。新的提供商实现
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

`maxInputImages` 和 `maxInputVideos` 等扁平化汇总字段
**不足以**表明支持转换模式。提供商应
显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，以便实时
测试、契约测试和共享 `video_generate` 工具能够以确定性方式验证
模式支持。

当提供商中的某个模型比其他模型支持更广泛的引用输入时，
应使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整个模式的限制。

## 实时测试

共享内置提供商的选择性启用实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media video
```

默认情况下，此实时测试文件优先使用已导出的提供商环境变量，而不是存储的身份验证
配置文件，并默认运行适合发布的冒烟测试：

- 对扫描中的每个非 FAL 提供商运行 `generate`。
- 一秒钟的 lobster 提示词。
- 每个提供商的操作时限由
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 指定（默认为 `180000`）。

FAL 需要选择性启用，因为提供商端的队列延迟可能会成为发布
耗时的主要部分：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，还可运行共享
扫描能够使用本地媒体安全执行的已声明转换模式：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`。
- 当 `capabilities.videoToVideo.enabled` 且
  提供商/模型在共享扫描中接受基于缓冲区的本地视频输入时，运行
  `videoToVideo`。

目前，仅当你选择 `runway/gen4_aleph` 时，共享 `videoToVideo`
实时测试通道才会覆盖 `runway`。

## 配置

在 OpenClaw 配置中设置默认视频生成模型：

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

## 相关内容

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [后台任务](/zh-CN/automation/tasks) - 用于异步视频生成的任务跟踪
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
