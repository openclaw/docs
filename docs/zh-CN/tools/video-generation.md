---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 video_generate 工具参数
sidebarTitle: Video generation
summary: 通过 video_generate 基于文本、图像或视频引用，在 16 个提供商后端生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-05-05T05:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8fd0f7922787d14736e57c9b5ea895de5bb8e126b2c73a397845ee14e1829f0b
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 智能体可以通过文本提示、参考图像或现有视频生成视频。支持十六种提供商后端，每种后端都有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用 API key 自动选择合适的提供商。

<Note>
只有在至少一个视频生成提供商可用时，`video_generate` 工具才会出现。如果你没有在智能体工具中看到它，请设置提供商 API key，或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` — 不带参考媒体的文本转视频请求。
- `imageToVideo` — 请求包含一张或多张参考图像。
- `videoToVideo` — 请求包含一个或多个参考视频。

提供商可以支持这些模式的任意子集。该工具会在提交前校验当前模式，并在 `action=list` 中报告支持的模式。

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
    > 生成一段 5 秒的电影感视频：一只友好的龙虾在日落时冲浪。

    智能体会自动调用 `video_generate`。无需将工具加入允许列表。

  </Step>
</Steps>

## 异步生成的工作方式

视频生成是异步的。当智能体在会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给提供商，并立即返回任务 ID。
2. 提供商在后台处理作业（通常需要 30 秒到 5 分钟，取决于提供商和分辨率）。
3. 视频准备好后，OpenClaw 会用内部完成事件唤醒同一个会话。
4. 智能体会告知用户并附上完成的视频。在使用仅消息工具可见投递的群聊/频道聊天中，智能体会通过消息工具转发结果，而不是由 OpenClaw 直接发布。

当作业正在进行时，同一会话中的重复 `video_generate` 调用会返回当前任务状态，而不是启动另一轮生成。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可从 CLI 检查进度。

在不基于会话的智能体运行之外（例如直接调用工具），该工具会回退到内联生成，并在同一轮中返回最终媒体路径。

当提供商返回字节数据时，生成的视频文件会保存到 OpenClaw 管理的媒体存储下。默认的生成视频保存上限遵循视频媒体限制，`agents.defaults.mediaMaxMb` 可提高该上限以支持更大的渲染结果。当提供商也返回托管输出 URL 时，如果本地持久化因文件过大而拒绝保存，OpenClaw 可以投递该 URL，而不是让任务失败。

### 任务生命周期

| 状态        | 含义                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，正在等待提供商接受。                                                             |
| `running`   | 提供商正在处理（通常需要 30 秒到 5 分钟，取决于提供商和分辨率）。                            |
| `succeeded` | 视频已就绪；智能体会被唤醒并将其发布到对话中。                                               |
| `failed`    | 提供商错误或超时；智能体会被唤醒并附带错误详情。                                             |

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果当前会话已有视频任务处于 `queued` 或 `running` 状态，`video_generate` 会返回现有任务状态，而不是启动新的任务。使用 `action: "status"` 可明确检查状态且不触发新的生成。

## 支持的提供商

| 提供商                | 默认模型                        | 文本 | 图像引用                                             | 视频引用                                        | 认证                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                       | 是（远程 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 张图像（仅 I2V 模型；第一帧 + 最后一帧）      | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 张图像（通过角色指定第一帧 + 最后一帧）       | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 张参考图像                                    | 最多 3 个视频                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 张图像                                             | —                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 张图像；使用 Seedance 参考转视频时最多 9 张        | 使用 Seedance 参考转视频时最多 3 个视频         | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 张图像                                             | 1 个视频                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 张图像                                             | —                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 张图像（第一帧/最后一帧或参考图像）           | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                       | 是（远程 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 张图像                                             | 1 个视频                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 张图像                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 张图像（`kling`）                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 张首帧图像，或最多 7 个 `reference_image`          | 1 个视频                                        | `XAI_API_KEY`                            |

一些提供商接受额外或替代的 API key 环境变量。详见各个[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时查看可用提供商、模型和运行时模式。

### 能力矩阵

`video_generate`、合约测试和共享实时扫描使用的显式模式合约：

| 提供商     | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时通道                                                                                                                        |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | 不在共享扫描中；工作流特定覆盖由 Comfy 测试负责                                                                                         |
| DeepInfra  |     ✓      |       —        |       —        | `generate`；原生 DeepInfra 视频架构在内置合约中是文本转视频                                                                             |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅在使用 Seedance 参考转视频时支持 `videoToVideo`                                                           |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为当前基于缓冲区的 Gemini/Veo 扫描不接受该输入                                  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过共享 `videoToVideo`，因为该组织/输入路径当前需要提供商侧的 inpaint/remix 访问权限                       |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商需要远程 `http(s)` 视频 URL                                                |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；仅当所选模型为 `runway/gen4_aleph` 时运行 `videoToVideo`                                                    |
| Together   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`；跳过共享 `imageToVideo`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL                                        |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳过 `videoToVideo`，因为此提供商当前需要远程 MP4 URL                                                       |

## 工具参数

### 必填

<ParamField path="prompt" type="string" required>
  要生成的视频的文本描述。`action: "generate"` 必填。
</ParamField>

### 内容输入

<ParamField path="image" type="string">单个参考图像（路径或 URL）。</ParamField>
<ParamField path="images" type="string[]">多个参考图像（最多 9 个）。</ParamField>
<ParamField path="imageRoles" type="string[]">
可选的按位置指定的角色提示，与合并后的图像列表平行对应。
规范值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">单个参考视频（路径或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多个参考视频（最多 4 个）。</ParamField>
<ParamField path="videoRoles" type="string[]">
可选的按位置指定的角色提示，与合并后的视频列表平行对应。
规范值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
单个参考音频（路径或 URL）。当提供商支持音频输入时，用于背景音乐或语音
参考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多个参考音频（最多 3 个）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可选的按位置指定的角色提示，与合并后的音频列表平行对应。
规范值：`reference_audio`。
</ParamField>

<Note>
角色提示会原样转发给提供商。规范值来自
`VideoGenerationAssetRole` 联合类型，但提供商可以接受额外的
角色字符串。`*Roles` 数组的条目数不得超过
对应参考列表；差一错误会以清晰错误失败。
使用空字符串可让某个位置保持未设置。对于 xAI，将每个图像角色都设为
`reference_image`，即可使用其 `reference_images` 生成模式；对于单图像的图像转视频，
省略角色或使用 `first_frame`。
</Note>

### 风格控制

<ParamField path="aspectRatio" type="string">
  宽高比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或提供商特定值。OpenClaw 会按提供商对不支持的值进行规范化或忽略。
</ParamField>
<ParamField path="resolution" type="string">分辨率提示，例如 `480P`、`720P`、`768P`、`1080P`、`4K`，或提供商特定值。OpenClaw 会按提供商对不支持的值进行规范化或忽略。</ParamField>
<ParamField path="durationSeconds" type="number">
  目标时长，以秒为单位（四舍五入到最接近的提供商支持值）。
</ParamField>
<ParamField path="size" type="string">当提供商支持时使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  在受支持时为输出启用生成音频。不同于 `audioRef*`（输入）。
</ParamField>
<ParamField path="watermark" type="boolean">在受支持时切换提供商水印。</ParamField>

`adaptive` 是提供商特定的哨兵值：对于在能力中声明 `adaptive` 的
提供商，它会原样转发（例如 BytePlus
Seedance 使用它根据输入图像
尺寸自动检测比例）。未声明该能力的提供商会在工具结果中通过
`details.ignoredOverrides` 暴露该值，便于看到它被丢弃。

### 高级

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 检查提供商。
</ParamField>
<ParamField path="model" type="string">提供商/模型覆盖（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时时间，以毫秒为单位。</ParamField>
<ParamField path="providerOptions" type="object">
  作为 JSON 对象的提供商特定选项（例如 `{"seed": 42, "draft": true}`）。
  声明了类型化架构的提供商会校验键名和类型；未知
  键名或不匹配会在回退期间跳过该候选。未
  声明架构的提供商会原样接收这些选项。运行 `video_generate action=list`
  查看每个提供商接受哪些选项。
</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 会将时长规范化为
最接近的提供商支持值，并在回退提供商暴露不同
控制面时，重新映射翻译后的几何提示，例如尺寸到宽高比。
真正不支持的覆盖项会尽力
忽略，并在工具结果中报告为警告。硬性能力限制
（例如参考输入过多）会在提交前失败。工具结果
会报告已应用的设置；`details.normalization` 会记录任何
从请求值到应用值的转换。
</Note>

参考输入会选择运行时模式：

- 无参考媒体 → `generate`
- 任意图像参考 → `imageToVideo`
- 任意视频参考 → `videoToVideo`
- 参考音频输入**不会**改变解析出的模式；它们会叠加到
  图像/视频参考所选择的任意模式之上，并且只适用于
  声明了 `maxInputAudios` 的提供商。

混合图像和视频参考不是稳定的共享能力面。
建议每次请求只使用一种参考类型。

#### 回退和类型化选项

某些能力检查应用在回退层，而不是
工具边界，因此超过主提供商限制的请求
仍可在有能力的回退上运行：

- 当请求包含音频参考时，声明无 `maxInputAudios`（或为 `0`）的活动候选会被跳过；
  接着尝试下一个候选。
- 活动候选的 `maxDurationSeconds` 低于请求的 `durationSeconds`
  且未声明 `supportedDurationSeconds` 列表 → 跳过。
- 请求包含 `providerOptions` 且活动候选明确
  声明了类型化 `providerOptions` 架构 → 如果提供的键名
  不在架构中或值类型不匹配，则跳过。未
  声明架构的提供商会原样接收选项（向后兼容的
  透传）。提供商可通过
  声明空架构（`capabilities.providerOptions: {}`）选择退出所有提供商选项，这
  会导致与类型不匹配相同的跳过行为。

请求中的第一个跳过原因会以 `warn` 记录，让运维人员知道
其主提供商何时被跳过；后续跳过会以 `debug` 记录，以
保持较长回退链安静。如果每个候选都被跳过，
聚合错误会包含每个候选的跳过原因。

## 操作

| 操作       | 作用                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 默认。根据给定提示和可选参考输入创建视频。                                                               |
| `status`   | 检查当前会话中进行中的视频任务状态，而不启动另一次生成。                                                 |
| `list`     | 显示可用提供商、模型及其能力。                                                                           |

## 模型选择

OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** — 如果智能体在调用中指定了一个。
2. 配置中的 **`videoGenerationModel.primary`**。
3. 按顺序使用 **`videoGenerationModel.fallbacks`**。
4. **自动检测** — 具有有效凭证的提供商，从
   当前默认提供商开始，然后按字母顺序使用
   其余提供商。

如果某个提供商失败，会自动尝试下一个候选。如果所有
候选都失败，错误会包含每次尝试的详细信息。

设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用
显式的 `model`、`primary` 和 `fallbacks` 条目。

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
    使用 DashScope / Model Studio 异步端点。参考图像和
    视频必须是远程 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    提供商 ID：`byteplus`。

    Models：`seedance-1-0-pro-250528`（默认）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和
    通用 `*-pro-*` 模型支持单个参考图像（第一
    帧）。按位置传入图像，或设置 `role: "first_frame"`。
    当提供图像时，T2V 模型 ID 会自动切换为对应的 I2V
    变体。

    支持的 `providerOptions` 键名：`seed`（数字）、`draft`（布尔值 —
    强制 480p）、`camera_fixed`（布尔值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件。提供商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用统一的 `content[]` API。最多支持 2 个输入图像
    （`first_frame` + `last_frame`）。所有输入都必须是远程 `https://`
    URL。在每个图像上设置 `role: "first_frame"` / `"last_frame"`，或
    按位置传入图像。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。
    `audio: true` 映射为 `generate_audio`。会转发 `providerOptions.seed`
    （数字）。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    插件。提供商 ID：`byteplus-seedance2`。Models：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用统一的 `content[]` API。最多支持 9 个参考图像、
    3 个参考视频和 3 个参考音频。所有输入都必须是远程
    `https://` URL。在每个资产上设置 `role` — 支持的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 会根据输入图像自动检测比例。
    `audio: true` 映射为 `generate_audio`。会转发 `providerOptions.seed`
    （数字）。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流驱动的本地或云端执行。支持通过已配置的图进行文本到视频和
    图像到视频转换。
  </Accordion>
  <Accordion title="fal">
    对长时间运行的作业使用队列支撑的流程。大多数 fal 视频模型
    接受单个图像引用。Seedance 2.0 引用到视频
    模型最多接受 9 张图像、3 个视频和 3 个音频引用，
    总引用文件数最多为 12 个。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支持一个图像或一个视频引用。
  </Accordion>
  <Accordion title="MiniMax">
    仅支持单个图像引用。
  </Accordion>
  <Accordion title="OpenAI">
    仅转发 `size` 覆盖项。其他样式覆盖项
    （`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并
    发出警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的异步 `/videos` API。OpenClaw 提交
    作业，轮询 `polling_url`，并下载 `unsigned_urls` 或
    文档中的作业内容端点。内置的 `google/veo-3.1-fast` 默认值
    宣称支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及
    `16:9`/`9:16` 宽高比。
  </Accordion>
  <Accordion title="Qwen">
    与 Alibaba 使用相同的 DashScope 后端。引用输入必须是远程
    `http(s)` URL；本地文件会预先被拒绝。
  </Accordion>
  <Accordion title="Runway">
    支持通过数据 URI 使用本地文件。视频到视频需要
    `runway/gen4_aleph`。纯文本运行公开 `16:9` 和 `9:16` 宽高
    比。
  </Accordion>
  <Accordion title="Together">
    仅支持单个图像引用。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免会丢失认证的
    重定向。`veo3` 以内置方式仅支持文本到视频；`kling` 需要
    远程图像 URL。
  </Accordion>
  <Accordion title="xAI">
    支持文本到视频、单个首帧图像到视频、通过 xAI `reference_images` 传入最多 7 个
    `reference_image` 输入，以及远程
    视频编辑/扩展流程。
  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享的视频生成契约支持特定模式的能力，而不只是扁平聚合限制。
新的提供商实现应优先使用显式模式块：

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

`maxInputImages` 和 `maxInputVideos` 等扁平聚合字段
**不足以** 声明对转换模式的支持。提供商应显式声明
`generate`、`imageToVideo` 和 `videoToVideo`，以便实时
测试、契约测试和共享的 `video_generate` 工具可以确定性地验证
模式支持。

当提供商中的某个模型比其余模型支持更宽的引用输入范围时，
请使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整个模式的限制。

## 实时测试

为共享内置提供商选择加入实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media video
```

此实时文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用
实时/环境 API key，而不是已存储的认证配置文件，并默认运行
发布安全的冒烟测试：

- 对扫描中的每个非 FAL 提供商运行 `generate`。
- 一秒龙虾提示词。
- 每个提供商的操作上限来自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（默认为 `180000`）。

FAL 需要选择加入，因为提供商侧队列延迟可能主导发布
耗时：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，还会运行共享扫描能够用本地媒体安全执行的已声明
转换模式：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`。
- 当 `capabilities.videoToVideo.enabled` 且
  提供商/模型在共享
  扫描中接受缓冲区支撑的本地视频输入时，运行 `videoToVideo`。

目前，共享的 `videoToVideo` 实时通道仅在你选择
`runway/gen4_aleph` 时覆盖 `runway`。

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

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [后台任务](/zh-CN/automation/tasks) — 用于异步视频生成的任务跟踪
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
