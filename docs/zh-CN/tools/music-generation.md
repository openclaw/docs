---
read_when:
    - 通过智能体生成音乐或音频
    - 配置音乐生成提供商和模型
    - 理解 `music_generate` 工具参数
sidebarTitle: Music generation
summary: 通过跨 ComfyUI、fal、Google Lyria、MiniMax 和 OpenRouter 工作流的 music_generate 生成音乐
title: 音乐生成
x-i18n:
    generated_at: "2026-06-27T03:29:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具让智能体通过已配置提供商的共享音乐生成能力创建音乐或音频，目前支持 ComfyUI、fal、Google、MiniMax 和 OpenRouter。

对于有会话支撑的智能体运行，OpenClaw 会将音乐生成作为后台任务启动，在任务台账中跟踪它，然后在曲目就绪时再次唤醒智能体，让智能体告知用户并附上完成的音频。完成智能体会遵循该会话正常的可见回复模式：配置后自动递送最终回复，或在会话要求使用消息工具时使用 `message(action="send")`。如果请求方会话不活跃，或其主动唤醒失败，并且完成回复中仍缺少某些已生成音频，OpenClaw 会发送幂等的直接回退回复，且只包含缺少的音频。

<Note>
内置共享工具只有在至少一个音乐生成提供商可用时才会出现。如果你在智能体的工具中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel`，或设置提供商 API key。
</Note>

## 快速开始

<Tabs>
  <Tab title="共享提供商支撑">
    <Steps>
      <Step title="配置凭证">
        为至少一个提供商设置 API key，例如
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
      <Step title="询问智能体">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        智能体会自动调用 `music_generate`。无需配置工具允许列表。
      </Step>
    </Steps>

    对于没有会话支撑智能体运行的直接同步上下文，内置工具仍会回退到内联生成，并在工具结果中返回最终媒体路径。

  </Tab>
  <Tab title="ComfyUI 工作流">
    <Steps>
      <Step title="配置工作流">
        使用工作流 JSON 以及提示词/输出节点配置 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="云端凭证（可选）">
        对于 Comfy Cloud，请设置 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
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

| 提供商 | 默认模型 | 参考输入 | 支持的控制项 | 凭证 |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最多 1 张图像 | 工作流定义的音乐或音频 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 无 | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 或 `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 最多 10 张图像 | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 无 | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` 或 MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 最多 1 张图像 | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### 能力矩阵

`music_generate`、契约测试和共享实时扫测使用的显式模式契约：

| 提供商 | `generate` | `edit` | 编辑限制 | 共享实时通道 |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 张图像 | 不在共享扫测中；由 `extensions/comfy/comfy.live.test.ts` 覆盖 |
| fal        |     ✓      |   —    | 无 | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 张图像 | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | 无 | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 张图像 | `generate`, `edit`                                                        |

使用 `action: "list"` 在运行时检查可用的共享提供商和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 检查当前有会话支撑的音乐任务：

```text
/tool music_generate action=status
```

直接生成示例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 工具参数

<ParamField path="prompt" type="string" required>
  音乐生成提示词。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前会话任务；`"list"` 检查提供商。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `google/lyria-3-pro-preview`、
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  当提供商支持显式歌词输入时，可选歌词。
</ParamField>
<ParamField path="instrumental" type="boolean">
  当提供商支持时，请求仅器乐输出。
</ParamField>
<ParamField path="image" type="string">
  单个参考图像路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多个参考图像（在支持的提供商上最多 10 张）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  当提供商支持时，以秒为单位的目标时长。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  当提供商支持时，输出格式提示。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 仍会在提交前校验输入数量等硬性限制。当提供商支持时长但最大值短于请求值时，OpenClaw 会将其截断到最接近的受支持时长。真正不受支持的可选提示会在所选提供商或模型无法满足时被忽略，并给出警告。工具结果会报告已应用的设置；`details.normalization` 会捕获任何从请求值到应用值的映射。
</Note>

提供商请求超时仅由操作者配置控制。配置后，OpenClaw 使用 `agents.defaults.musicGenerationModel.timeoutMs`，会将低于 120000ms 的值提升到 120000ms，否则提供商请求默认使用 300000ms。

## 异步行为

有会话支撑的音乐生成会作为后台任务运行：

- **后台任务：** `music_generate` 创建后台任务，立即返回已启动/任务响应，并稍后在后续智能体消息中发布完成的曲目。
- **重复防止：** 当任务处于 `queued` 或 `running` 时，同一会话中的后续 `music_generate` 调用会返回任务状态，而不是启动另一次生成。使用 `action: "status"` 可显式检查。
- **状态查询：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可检查排队中、运行中和终止状态。
- **完成唤醒：** OpenClaw 会将内部完成事件注入回同一会话，使模型可以自行写出面向用户的后续回复。
- **提示词提示：** 同一会话中的后续用户/手动轮次会在已有音乐任务进行中时获得一个小型运行时提示，因此模型不会盲目再次调用 `music_generate`。
- **无会话回退：** 没有真实智能体会话的直接/本地上下文会内联运行，并在同一轮次中返回最终音频结果。

### 任务生命周期

| 状态 | 含义 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，正在等待提供商接受。 |
| `running`   | 提供商正在处理（通常为 30 秒到 3 分钟，取决于提供商和时长）。 |
| `succeeded` | 曲目已就绪；智能体会被唤醒并将其发布到对话中。 |
| `failed`    | 提供商错误或超时；智能体会带着错误详情被唤醒。 |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### 提供商选择顺序

OpenClaw 按以下顺序尝试提供商：

1. 工具调用中的 `model` 参数（如果智能体指定了一个）。
2. 配置中的 `musicGenerationModel.primary`。
3. 按顺序使用 `musicGenerationModel.fallbacks`。
4. 仅使用凭证支撑的提供商默认值进行自动检测：
   - 当前默认提供商优先；
   - 其余已注册的音乐生成提供商按 provider-id 顺序。

如果某个提供商失败，会自动尝试下一个候选项。如果全部失败，错误会包含每次尝试的详情。

将 `agents.defaults.mediaGenerationAutoProviderFallback: false` 设为仅使用显式 `model`、`primary` 和 `fallbacks` 条目。

## 提供商说明

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流驱动，依赖已配置的图以及提示词/输出字段的节点映射。内置 `comfy` 插件会通过音乐生成提供商注册表接入共享 `music_generate` 工具。
  </Accordion>
  <Accordion title="fal">
    通过共享提供商凭证路径使用 fal 模型端点。内置提供商默认使用 `fal-ai/minimax-music/v2.6`，并且也公开 `fal-ai/ace-step/prompt-to-audio` 和
    `fal-ai/stable-audio-25/text-to-audio` 用于提示词转音频请求。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批量生成。当前内置流程支持提示词、可选歌词文本和可选参考图像。
  </Accordion>
  <Accordion title="MiniMax">
    使用批量 `music_generation` 端点。通过 `minimax` API-key 凭证或 `minimax-portal` OAuth 支持提示词、可选歌词、器乐模式和 mp3 输出。
  </Accordion>
  <Accordion title="OpenRouter">
    使用启用流式传输的 OpenRouter 聊天补全音频输出。内置提供商默认使用 `google/lyria-3-pro-preview`，并且也公开
    `openrouter/google/lyria-3-clip-preview`。
  </Accordion>
</AccordionGroup>

## 选择合适路径

- **共享提供商支撑**：当你需要模型选择、提供商故障转移，以及内置异步任务/状态流程时使用。
- **插件路径（ComfyUI）**：当你需要自定义工作流图，或需要一个不属于共享内置音乐能力的提供商时使用。

如果你正在调试 ComfyUI 特定行为，请参阅
[ComfyUI](/zh-CN/providers/comfy)。如果你正在调试共享提供商
行为，请从 [fal](/zh-CN/providers/fal)、[Google (Gemini)](/zh-CN/providers/google)、
[MiniMax](/zh-CN/providers/minimax) 或 [OpenRouter](/zh-CN/providers/openrouter) 开始。

## 提供商能力模式

共享音乐生成契约支持显式模式声明：

- `generate` 用于仅基于提示词的生成。
- 当请求包含一个或多个参考图像时使用 `edit`。

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

旧版扁平字段，例如 `maxInputImages`、`supportsLyrics` 和
`supportsFormat`，**不足以**声明支持编辑。提供商
应显式声明 `generate` 和 `edit`，以便 live 测试、契约
测试以及共享的 `music_generate` 工具能够确定性地验证模式支持。

## Live 测试

为共享内置提供商启用可选的 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media music
```

默认情况下，此 live 文件会优先使用已导出的提供商环境变量，而不是已存储的身份验证
配置文件，并且在提供商启用编辑模式时，同时运行 `generate` 和已声明的 `edit` 覆盖。
当前覆盖范围：

- `google`：`generate` 加 `edit`
- `fal`：仅 `generate`
- `minimax`：仅 `generate`
- `openrouter`：`generate` 加 `edit`
- `comfy`：单独的 Comfy live 覆盖，不属于共享提供商扫描

为内置 ComfyUI 音乐路径启用可选的 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

当这些部分已配置时，Comfy live 文件还会覆盖 comfy 图像和视频工作流。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 用于分离式 `music_generate` 运行的任务跟踪
- [ComfyUI](/zh-CN/providers/comfy)
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `musicGenerationModel` 配置
- [Google (Gemini)](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [Models](/zh-CN/concepts/models) — 模型配置和故障转移
- [工具概览](/zh-CN/tools)
