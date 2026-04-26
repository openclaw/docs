---
read_when:
    - 通过智能体生成音乐或音频
    - 配置音乐生成提供商和模型
    - 了解 `music_generate` 工具参数
sidebarTitle: Music generation
summary: 通过 `music_generate` 在 Google Lyria、MiniMax 和 ComfyUI 工作流中生成音乐
title: 音乐生成
x-i18n:
    generated_at: "2026-04-26T05:36:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 工具让智能体能够通过已配置提供商的共享音乐生成能力来创作音乐或音频——目前支持 Google、MiniMax，以及按工作流配置的 ComfyUI。

对于基于会话的智能体运行，OpenClaw 会将音乐生成作为后台任务启动，在任务台账中跟踪它，然后在音轨准备好后再次唤醒智能体，以便智能体将完成的音频发布回原始渠道。

<Note>
只有在至少有一个音乐生成提供商可用时，内置共享工具才会出现。如果你在智能体工具中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel` 或设置提供商 API 密钥。
</Note>

## 快速开始

<Tabs>
  <Tab title="共享提供商支持">
    <Steps>
      <Step title="配置认证">
        为至少一个提供商设置 API 密钥——例如
        `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
      </Step>
      <Step title="选择默认模型（可选）">
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
      </Step>
      <Step title="向智能体发出请求">
        _“生成一首关于夜晚驾车穿越霓虹都市的欢快 synthpop 音轨。”_

        智能体会自动调用 `music_generate`。无需工具允许列表。
      </Step>
    </Steps>

    对于没有基于会话的智能体运行的直接同步上下文，内置工具仍会回退为内联生成，并在工具结果中返回最终媒体路径。

  </Tab>
  <Tab title="ComfyUI 工作流">
    <Steps>
      <Step title="配置工作流">
        使用工作流 JSON 以及提示词/输出节点配置 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="云端认证（可选）">
        对于 Comfy Cloud，设置 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
      </Step>
      <Step title="调用工具">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

示例提示词：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## 支持的提供商

| 提供商 | 默认模型               | 参考输入      | 支持的控制项                                              | 认证                                   |
| ------ | ---------------------- | ------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 张图片 | 工作流定义的音乐或音频                                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 张图片 | `lyrics`、`instrumental`、`format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 无            | `lyrics`、`instrumental`、`durationSeconds`、`format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩阵

`music_generate`、契约测试以及共享实时扫描使用的显式模式契约：

| 提供商 | `generate` | `edit` | 编辑上限 | 共享实时测试通道                                                       |
| ------ | :--------: | :----: | -------- | ---------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 张图片 | 不在共享扫描中；由 `extensions/comfy/comfy.live.test.ts` 覆盖 |
| Google   |     ✓      |   ✓    | 10 张图片 | `generate`、`edit`                                                     |
| MiniMax  |     ✓      |   —    | 无       | `generate`                                                             |

使用 `action: "list"` 可在运行时检查可用的共享提供商和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 可检查当前处于活动状态的基于会话的音乐任务：

```text
/tool music_generate action=status
```

直接生成示例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 工具参数

<ParamField path="prompt" type="string" required>
  音乐生成提示词。对于 `action: "generate"` 为必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 检查提供商。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `google/lyria-3-pro-preview`、
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  当提供商支持显式歌词输入时的可选歌词。
</ParamField>
<ParamField path="instrumental" type="boolean">
  当提供商支持时，请求仅器乐输出。
</ParamField>
<ParamField path="image" type="string">
  单个参考图片路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多张参考图片（在支持的提供商上最多 10 张）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  当提供商支持时长提示时的目标时长（秒）。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  当提供商支持时的输出格式提示。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时时间（毫秒）。</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 仍会在提交前验证硬性限制，例如输入数量。当提供商支持时长但其最大值短于请求值时，OpenClaw 会限制到最接近的受支持时长。对于真正不受支持的可选提示，当所选提供商或模型无法满足时，会忽略并给出警告。工具结果会报告已应用的设置；`details.normalization` 会记录从请求值到应用值的映射。
</Note>

## 异步行为

基于会话的音乐生成会作为后台任务运行：

- **后台任务：** `music_generate` 会创建一个后台任务，立即返回已启动/任务响应，并在稍后的后续智能体消息中发布完成的音轨。
- **防止重复：** 当任务处于 `queued` 或 `running` 状态时，同一会话中后续的 `music_generate` 调用会返回任务状态，而不是再次启动生成。使用 `action: "status"` 可显式检查。
- **Status 查询：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可检查排队中、运行中和终态状态。
- **完成唤醒：** OpenClaw 会将内部完成事件重新注入同一会话，以便模型自行编写面向用户的后续消息。
- **提示提示：** 当音乐任务已经在进行中时，同一会话中的后续用户/手动轮次会收到一个小型运行时提示，因此模型不会盲目再次调用 `music_generate`。
- **无会话回退：** 没有真实智能体会话的直接/本地上下文会以内联方式运行，并在同一轮中返回最终音频结果。

### 任务生命周期

| 状态        | 含义                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，正在等待提供商接受。                                                             |
| `running`   | 提供商正在处理（通常需要 30 秒到 3 分钟，取决于提供商和时长）。                              |
| `succeeded` | 音轨已准备好；智能体被唤醒并将其发布到对话中。                                               |
| `failed`    | 提供商错误或超时；智能体被唤醒并附带错误详情。                                               |

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### 提供商选择顺序

OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 `model` 参数（如果智能体指定了一个）。
2. 配置中的 `musicGenerationModel.primary`。
3. 按顺序使用 `musicGenerationModel.fallbacks`。
4. 仅使用具备认证支持的提供商默认值进行自动检测：
   - 当前默认提供商优先；
   - 剩余已注册的音乐生成提供商按提供商 ID 顺序。

如果某个提供商失败，会自动尝试下一个候选项。如果全部失败，错误中会包含每次尝试的详细信息。

设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。

## 提供商说明

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流驱动，并依赖已配置的图以及提示词/输出字段的节点映射。内置的 `comfy` 插件通过音乐生成提供商注册表接入共享 `music_generate` 工具。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批量生成。当前内置流程支持提示词、可选歌词文本以及可选参考图片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批量 `music_generation` 端点。支持提示词、可选歌词、器乐模式、时长控制，以及通过 `minimax` API 密钥认证或 `minimax-portal` OAuth 输出 mp3。
  </Accordion>
</AccordionGroup>

## 选择合适的路径

- **共享提供商支持**：当你需要模型选择、提供商故障切换以及内置的异步任务/状态流程时。
- **插件路径（ComfyUI）**：当你需要自定义工作流图，或需要不属于共享内置音乐能力的提供商时。

如果你正在调试 ComfyUI 特有行为，请参阅
[ComfyUI](/zh-CN/providers/comfy)。如果你正在调试共享提供商行为，请先查看 [Google (Gemini)](/zh-CN/providers/google) 或
[MiniMax](/zh-CN/providers/minimax)。

## 提供商能力模式

共享音乐生成契约支持显式模式声明：

- `generate` 用于仅基于提示词的生成。
- 当请求包含一张或多张参考图片时，使用 `edit`。

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

旧版扁平字段（如 `maxInputImages`、`supportsLyrics` 和
`supportsFormat`）**不足以**宣告支持编辑。提供商应显式声明 `generate` 和 `edit`，以便实时测试、契约测试以及共享 `music_generate` 工具能够以确定性方式验证模式支持。

## 实时测试

为共享内置提供商启用的实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media music
```

此实时文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境 API 密钥而不是已存储的认证配置文件，并在提供商启用编辑模式时同时运行 `generate` 和已声明的 `edit` 覆盖。当前覆盖范围：

- `google`：`generate` 加 `edit`
- `minimax`：仅 `generate`
- `comfy`：单独的 Comfy 实时覆盖，不属于共享提供商扫描

为内置 ComfyUI 音乐路径启用的实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

当相应部分已配置时，Comfy 实时文件还会覆盖 comfy 图片和视频工作流。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 用于分离式 `music_generate` 运行的任务跟踪
- [ComfyUI](/zh-CN/providers/comfy)
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `musicGenerationModel` 配置
- [Google (Gemini)](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [Models](/zh-CN/concepts/models) — 模型配置和故障切换
- [工具概览](/zh-CN/tools)
