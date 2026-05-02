---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 设置指导
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T04:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw 的 MiniMax 提供商默认使用 **MiniMax M2.7**。

MiniMax 还提供：

- 通过 T2A v2 内置语音合成
- 通过 `MiniMax-VL-01` 内置图像理解
- 通过 `music-2.6` 内置音乐生成
- 通过 MiniMax Token Plan 搜索 API 内置 `web_search`

提供商拆分：

| 提供商 ID      | 凭证    | 能力                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | 文本、图像生成、音乐生成、视频生成、图像理解、语音、Web 搜索 |
| `minimax-portal` | OAuth   | 文本、图像生成、音乐生成、视频生成、图像理解、语音             |

## 内置目录

| 模型                    | 类型             | 描述                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | 聊天（推理） | 默认托管推理模型           |
| `MiniMax-M2.7-highspeed` | 聊天（推理） | 更快的 M2.7 推理层级               |
| `MiniMax-VL-01`          | 视觉           | 图像理解模型                |
| `image-01`               | 图像生成 | 文生图和图生图编辑 |
| `music-2.6`              | 音乐生成 | 默认音乐模型                      |
| `music-2.5`              | 音乐生成 | 上一代音乐生成层级           |
| `music-2.0`              | 音乐生成 | 旧版音乐生成层级             |
| `MiniMax-Hailuo-2.3`     | 视频生成 | 文生视频和图像参考流程  |

## 入门指南

选择你偏好的凭证方式并按照设置步骤操作。

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最适合：** 通过 OAuth 快速设置 MiniMax Coding Plan，无需 API key。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            这会针对 `api.minimax.io` 进行身份验证。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            这会针对 `api.minimaxi.com` 进行身份验证。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 设置使用 `minimax-portal` 提供商 ID。模型引用遵循 `minimax-portal/MiniMax-M2.7` 格式。
    </Note>

    <Tip>
    MiniMax Coding Plan 推荐链接（九折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最适合：** 使用 Anthropic 兼容 API 的托管 MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            这会将 `api.minimax.io` 配置为基础 URL。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            这会将 `api.minimaxi.com` 配置为基础 URL。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 配置示例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    在 Anthropic 兼容的流式传输路径上，除非你显式设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。MiniMax 的流式传输端点会以 OpenAI 风格的增量块发出 `reasoning_content`，而不是原生 Anthropic thinking blocks；如果隐式保持启用，可能会把内部推理泄露到可见输出中。
    </Warning>

    <Note>
    API key 设置使用 `minimax` 提供商 ID。模型引用遵循 `minimax/MiniMax-M2.7` 格式。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 配置

使用交互式配置向导来设置 MiniMax，无需编辑 JSON：

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择模型/身份验证">
    从菜单中选择 **模型/身份验证**。
  </Step>
  <Step title="选择一个 MiniMax 身份验证选项">
    选择一个可用的 MiniMax 选项：

    | 身份验证选项 | 说明 |
    | --- | --- |
    | `minimax-global-oauth` | 国际 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中国 OAuth（Coding Plan） |
    | `minimax-global-api` | 国际 API key |
    | `minimax-cn-api` | 中国 API key |

  </Step>
  <Step title="选择你的默认模型">
    出现提示时选择你的默认模型。
  </Step>
</Steps>

## 能力

### 图像生成

MiniMax 插件为 `image_generate` 工具注册了 `image-01` 模型。它支持：

- 带宽高比控制的**文生图生成**
- 带宽高比控制的**图生图编辑**（主体参考）
- 每个请求最多生成 **9 张输出图像**
- 每个编辑请求最多使用 **1 张参考图像**
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

要使用 MiniMax 进行图像生成，请将它设为图像生成提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

该插件使用与文本模型相同的 `MINIMAX_API_KEY` 或 OAuth 身份验证。如果已设置 MiniMax，则不需要额外配置。

`minimax` 和 `minimax-portal` 都会使用相同的 `image-01` 模型注册 `image_generate`。API-key 设置使用 `MINIMAX_API_KEY`；OAuth 设置则可以改用内置的 `minimax-portal` 身份验证路径。

图像生成始终使用 MiniMax 专用的图像端点（`/v1/image_generation`），并忽略 `models.providers.minimax.baseUrl`，因为该字段用于配置聊天/Anthropic 兼容的基础 URL。设置 `MINIMAX_API_HOST=https://api.minimaxi.com` 可将图像生成路由到 CN 端点；默认的全球端点是 `https://api.minimax.io`。

当新手引导或 API-key 设置写入显式的 `models.providers.minimax` 条目时，OpenClaw 会将 `MiniMax-M2.7` 和 `MiniMax-M2.7-highspeed` 物化为纯文本聊天模型。图像理解则通过插件拥有的 `MiniMax-VL-01` 媒体提供商单独暴露。

<Note>
请参阅[图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 文本转语音

内置的 `minimax` 插件会将 MiniMax T2A v2 注册为 `messages.tts` 的语音提供商。

- 默认 TTS 模型：`speech-2.8-hd`
- 默认语音：`English_expressive_narrator`
- 支持的内置模型 ID 包括 `speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd` 和 `speech-01-turbo`。
- 身份验证解析顺序为 `messages.tts.providers.minimax.apiKey`，然后是 `minimax-portal` OAuth/token 身份验证配置文件，然后是 Token Plan 环境键名（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`。
- 如果未配置 TTS 主机，OpenClaw 会复用已配置的 `minimax-portal` OAuth 主机，并去除 Anthropic 兼容的路径后缀，例如 `/anthropic`。
- 普通音频附件保持 MP3。
- Feishu 和 Telegram 等语音消息目标会通过 `ffmpeg` 将 MiniMax MP3 转码为 48kHz Opus，因为 Feishu/Lark 文件 API 对原生音频消息只接受 `file_type: "opus"`。
- MiniMax T2A 接受小数形式的 `speed` 和 `vol`，但 `pitch` 会以整数发送；OpenClaw 会在 API 请求前截断小数形式的 `pitch` 值。

| 设置 | 环境变量 | 默认值 | 说明 |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主机。 |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。 |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用于语音输出的语音 ID。 |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。 |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。 |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数音高偏移，`-12..12`。 |

### 音乐生成

内置 MiniMax 插件会通过共享的 `music_generate` 工具，为 `minimax` 和 `minimax-portal` 注册音乐生成。

- 默认音乐模型：`minimax/music-2.6`
- OAuth 音乐模型：`minimax-portal/music-2.6`
- 也支持 `minimax/music-2.5` 和 `minimax/music-2.0`
- 提示控制项：`lyrics`、`instrumental`、`durationSeconds`
- 输出格式：`mp3`
- 基于会话的运行会通过共享任务/Status 流程分离，包括 `action: "status"`

要将 MiniMax 用作默认音乐提供商：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
请参阅[音乐生成](/zh-CN/tools/music-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 视频生成

内置 MiniMax 插件会通过共享的 `video_generate` 工具，为 `minimax` 和 `minimax-portal` 注册视频生成。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`
- OAuth 视频模型：`minimax-portal/MiniMax-Hailuo-2.3`
- 模式：文生视频和单图参考流程
- 支持 `aspectRatio` 和 `resolution`

要将 MiniMax 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
参见[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 图像理解

MiniMax 插件会将图像理解与文本目录分开注册：

| 提供商 ID        | 默认图像模型        |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

因此，即使内置文本提供商目录仍显示仅文本的 M2.7 聊天引用，自动媒体路由也可以使用 MiniMax 图像理解。

### Web 搜索

MiniMax 插件还通过 MiniMax Token Plan 搜索 API 注册 `web_search`。

- 提供商 id：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 可接受的环境别名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 兼容性回退：当 `MINIMAX_API_KEY` 已指向 token-plan 凭证时使用它
- 区域复用：`plugins.entries.minimax.config.webSearch.region`，然后是 `MINIMAX_API_HOST`，再然后是 MiniMax 提供商基础 URL
- 搜索保持在提供商 id `minimax` 上；OAuth CN/全球设置可以通过 `models.providers.minimax-portal.baseUrl` 间接引导区域，并可通过 `MINIMAX_OAUTH_TOKEN` 提供 bearer 认证

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
参见 [MiniMax Search](/zh-CN/tools/minimax-search)，了解完整的 Web 搜索配置和用法。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 说明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 优先使用 `https://api.minimax.io/anthropic`（Anthropic 兼容）；`https://api.minimax.io/v1` 可选，用于 OpenAI 兼容 payload |
    | `models.providers.minimax.api` | 优先使用 `anthropic-messages`；`openai-completions` 可选，用于 OpenAI 兼容 payload |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为你希望加入允许列表的模型设置别名 |
    | `models.mode` | 如果你想在内置项旁添加 MiniMax，请保持 `merge` |
  </Accordion>

  <Accordion title="思考默认值">
    在 `api: "anthropic-messages"` 上，除非已在 params/config 中显式设置 thinking，否则 OpenClaw 会注入 `thinking: { type: "disabled" }`。

    这会防止 MiniMax 的流式端点在 OpenAI 风格的 delta 分块中发出 `reasoning_content`，从而避免内部推理泄露到可见输出中。

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 会在 Anthropic 兼容流路径上将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="回退示例">
    **最适合：**将你最强的最新一代模型保留为主模型，并故障转移到 MiniMax M2.7。下面示例使用 Opus 作为具体主模型；请替换为你偏好的最新一代主模型。

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan 使用详情">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 coding plan key）。
    - 配置后，用量轮询会从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 派生主机，因此使用 `https://api.minimax.io/anthropic` 的全球设置会轮询 `api.minimax.io`。缺失或格式错误的基础 URL 会保留 CN 回退以保持兼容性。
    - OpenClaw 会将 MiniMax coding-plan 用量规范化为其他提供商使用的相同 `% left` 显示。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，而不是已消耗额度，因此 OpenClaw 会将它们反转。存在基于计数的字段时优先使用。
    - 当 API 返回 `model_remains` 时，OpenClaw 会优先使用聊天模型条目，在需要时从 `start_time` / `end_time` 派生窗口标签，并在计划标签中包含选中的模型名称，以便更容易区分 coding-plan 窗口。
    - 用量快照会将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 额度表面，并优先使用已存储的 MiniMax OAuth，然后再回退到 Coding Plan key 环境变量。

  </Accordion>
</AccordionGroup>

## 说明

- 模型引用遵循认证路径：
  - API-key 设置：`minimax/<model>`
  - OAuth 设置：`minimax-portal/<model>`
- 默认聊天模型：`MiniMax-M2.7`
- 备用聊天模型：`MiniMax-M2.7-highspeed`
- 新手引导和直接 API-key 设置会为两个 M2.7 变体写入仅文本模型定义
- 图像理解使用插件拥有的 `MiniMax-VL-01` 媒体提供商
- 如果需要精确成本跟踪，请更新 `models.json` 中的价格值
- 使用 `openclaw models list` 确认当前提供商 id，然后使用 `openclaw models set minimax/MiniMax-M2.7` 或 `openclaw models set minimax-portal/MiniMax-M2.7` 切换

<Tip>
MiniMax Coding Plan 推荐链接（九折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
参见[模型提供商](/zh-CN/concepts/model-providers)，了解提供商规则。
</Note>

## 故障排除

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    这通常表示 **MiniMax 提供商未配置**（没有匹配的提供商条目，也没有找到 MiniMax auth profile/env key）。此检测问题的修复包含在 **2026.1.12** 中。修复方式：

    - 升级到 **2026.1.12**（或从源码 `main` 运行），然后重启 gateway。
    - 运行 `openclaw configure` 并选择一个 **MiniMax** 认证选项，或
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 块，或
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`，或 MiniMax auth profile，以便注入匹配的提供商。

    请确保模型 id **区分大小写**：

    - API-key 路径：`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后用以下命令重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="MiniMax Search" href="/zh-CN/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Token Plan 配置 Web 搜索。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除和常见问题。
  </Card>
</CardGroup>
