---
read_when:
    - 通过智能体生成音乐或音频
    - 配置音乐生成提供商和模型
    - 了解 music_generate 工具参数
sidebarTitle: Music generation
summary: 通过 music_generate 在 Google Lyria、MiniMax 和 ComfyUI 工作流中生成音乐
title: 音乐生成
x-i18n:
    generated_at: "2026-05-02T08:00:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具允许智能体通过配置了提供商的共享音乐生成能力创建音乐或音频，目前支持 Google、MiniMax，以及通过工作流配置的 ComfyUI。

对于由会话支持的智能体运行，OpenClaw 会将音乐生成作为后台任务启动，在任务账本中跟踪它，然后在音轨准备好后再次唤醒智能体，让智能体可以把完成的音频发回原始渠道。

<Note>
只有在至少有一个音乐生成提供商可用时，内置共享工具才会出现。如果你在智能体的工具中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel` 或设置提供商 API key。
</Note>

## 快速开始

<Tabs>
  <Tab title="共享提供商支持">
    <Steps>
      <Step title="配置认证">
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
        _“生成一首关于夜晚驾车穿过霓虹城市的欢快合成流行音轨。”_

        智能体会自动调用 `music_generate`。无需配置工具
        allow-list。
      </Step>
    </Steps>

    对于没有由会话支持的智能体运行的直接同步上下文，
    内置工具仍会回退到内联生成，并在工具结果中返回
    最终媒体路径。

  </Tab>
  <Tab title="ComfyUI 工作流">
    <Steps>
      <Step title="配置工作流">
        使用工作流 JSON 和提示词/输出节点配置
        `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="云端认证（可选）">
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

| 提供商 | 默认模型          | 参考输入 | 支持的控制项                                        | 认证                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 张图像    | 工作流定义的音乐或音频                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 张图像  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 无             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩阵

`music_generate`、合约测试和共享 live sweep 使用的显式模式合约：

| 提供商 | `generate` | `edit` | 编辑限制 | 共享 live lanes                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 张图像    | 不在共享 sweep 中；由 `extensions/comfy/comfy.live.test.ts` 覆盖 |
| Google   |     ✓      |   ✓    | 10 张图像  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 无       | `generate`                                                                |

使用 `action: "list"` 在运行时检查可用的共享提供商和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 检查当前由会话支持的音乐任务：

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
  提供商/模型覆盖（例如 `google/lyria-3-pro-preview`,
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  当提供商支持显式歌词输入时使用的可选歌词。
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
  当提供商支持时，用秒表示的目标时长提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  当提供商支持时使用的输出格式提示。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时，单位为毫秒。低于 10000ms 的值会提升到 10000ms，并在工具结果中报告。</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 仍会在提交前验证输入数量等硬性限制。当提供商支持时长但最大值短于请求值时，OpenClaw 会夹取到最接近的受支持时长。对于真正不受支持的可选提示，当所选提供商或模型无法满足时，会被忽略并附带警告。工具结果会报告已应用的设置；`details.normalization` 会捕获任何从请求值到应用值的映射。
</Note>

## 异步行为

由会话支持的音乐生成会作为后台任务运行：

- **后台任务：** `music_generate` 会创建后台任务，立即返回已启动/任务响应，并稍后在后续智能体消息中发布完成的音轨。
- **重复防护：** 当任务处于 `queued` 或 `running` 状态时，同一会话中后续的 `music_generate` 调用会返回任务状态，而不是启动另一次生成。使用 `action: "status"` 显式检查。
- **状态查询：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 会检查 queued、running 和终止状态。
- **完成唤醒：** OpenClaw 会将内部完成事件注入回同一会话，让模型可以自行编写面向用户的后续消息。
- **提示词提示：** 当同一会话中已有音乐任务在进行时，后续用户/手动轮次会获得一条小型运行时提示，避免模型盲目再次调用 `music_generate`。
- **无会话回退：** 没有真实智能体会话的直接/本地上下文会内联运行，并在同一轮中返回最终音频结果。

### 任务生命周期

| 状态       | 含义                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，正在等待提供商接受。                                           |
| `running`   | 提供商正在处理（通常为 30 秒到 3 分钟，取决于提供商和时长）。 |
| `succeeded` | 音轨已准备好；智能体会被唤醒并将其发布到对话中。                                 |
| `failed`    | 提供商错误或超时；智能体会带着错误详情被唤醒。                                 |

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
4. 仅使用带认证的提供商默认值进行自动检测：
   - 当前默认提供商优先；
   - 其余已注册的音乐生成提供商按 provider-id 顺序。

如果某个提供商失败，会自动尝试下一个候选项。如果全部失败，错误会包含每次尝试的详情。

将 `agents.defaults.mediaGenerationAutoProviderFallback: false` 设为仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。

## 提供商说明

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流驱动，并依赖为提示词/输出字段配置的图和节点映射。内置的 `comfy` 插件会通过音乐生成提供商注册表接入共享的 `music_generate` 工具。
  </Accordion>
  <Accordion title="Google（Lyria 3）">
    使用 Lyria 3 批量生成。当前内置流程支持提示词、可选歌词文本，以及可选参考图像。
  </Accordion>
  <Accordion title="MiniMax">
    使用批量 `music_generation` 端点。支持提示词、可选歌词、器乐模式、时长控制，以及通过 `minimax` API key 认证或 `minimax-portal` OAuth 进行 mp3 输出。
  </Accordion>
</AccordionGroup>

## 选择合适路径

- **共享提供商支持**：当你需要模型选择、提供商故障转移，以及内置异步任务/状态流程时使用。
- **插件路径（ComfyUI）**：当你需要自定义工作流图，或需要不属于共享内置音乐能力的提供商时使用。

如果你正在调试 ComfyUI 特定行为，请参阅
[ComfyUI](/zh-CN/providers/comfy)。如果你正在调试共享提供商
行为，请从 [Google（Gemini）](/zh-CN/providers/google) 或
[MiniMax](/zh-CN/providers/minimax) 开始。

## 提供商能力模式

共享音乐生成合约支持显式模式声明：

- `generate` 用于仅提示词生成。
- `edit` 用于请求包含一个或多个参考图像的情况。

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
`supportsFormat`，**不足以** 声明编辑支持。提供商应显式声明
`generate` 和 `edit`，以便 live tests、合约测试和共享的 `music_generate` 工具可以确定性地验证模式支持。

## Live tests

共享内置提供商的选择加入式 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media music
```

这个 live 文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用 live/env API key，而不是已存储的认证配置文件，并在提供商启用编辑模式时同时运行 `generate` 和已声明的 `edit` 覆盖。当前覆盖：

- `google`：`generate` 加 `edit`
- `minimax`：仅 `generate`
- `comfy`：单独的 Comfy live 覆盖，不属于共享提供商 sweep

内置 ComfyUI 音乐路径的选择加入式 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live 文件还会涵盖已配置相关部分时的 comfy 图像和视频工作流。

## 相关

- [后台任务](/zh-CN/automation/tasks) — 用于跟踪分离的 `music_generate` 运行任务
- [ComfyUI](/zh-CN/providers/comfy)
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `musicGenerationModel` 配置
- [Google (Gemini)](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [Models](/zh-CN/concepts/models) — 模型配置和故障转移
- [工具概览](/zh-CN/tools)
