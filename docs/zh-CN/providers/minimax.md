---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 设置指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-07-05T11:38:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  捆绑的 `minimax` 插件注册了两个提供商以及五项能力：聊天、图像生成、音乐生成、视频生成、图像理解、语音（T2A v2）和 Web 搜索。

  | 提供商 ID        | 认证     | 能力                                                                                           |
  | ---------------- | -------- | ---------------------------------------------------------------------------------------------- |
  | `minimax`        | API 密钥 | 文本、图像生成、音乐生成、视频生成、图像理解、语音、Web 搜索                                   |
  | `minimax-portal` | OAuth    | 文本、图像生成、音乐生成、视频生成、图像理解、语音                                             |

  <Tip>
  MiniMax Coding Plan 推荐链接（九折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## 内置目录

  | 模型                     | 类型             | 描述                         |
  | ------------------------ | ---------------- | ---------------------------- |
  | `MiniMax-M3`             | 聊天（推理）     | 默认托管推理模型             |
  | `MiniMax-M2.7`           | 聊天（推理）     | 上一个托管推理模型           |
  | `MiniMax-M2.7-highspeed` | 聊天（推理）     | 更快的 M2.7 推理层级         |
  | `MiniMax-VL-01`          | 视觉             | 图像理解模型                 |
  | `image-01`               | 图像生成         | 文生图和图生图编辑           |
  | `music-2.6`              | 音乐生成         | 默认音乐模型                 |
  | `MiniMax-Hailuo-2.3`     | 视频生成         | 文生视频和图生视频流程       |

  模型引用遵循认证路径：API 密钥设置使用 `minimax/<model>`，OAuth 设置使用 `minimax-portal/<model>`。

  ## 入门指南

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最适合：** 通过 OAuth 快速设置 MiniMax Coding Plan，无需 API 密钥。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            生成的提供商基础 URL：`api.minimax.io`。
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

            生成的提供商基础 URL：`api.minimaxi.com`。
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
    OAuth 设置使用 `minimax-portal` 提供商 ID。模型引用遵循 `minimax-portal/MiniMax-M3` 形式。
    </Note>

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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    MiniMax-M2.x 的 Anthropic 兼容流式端点会在 OpenAI 风格的 delta 分块中发出 `reasoning_content`，而不是原生 Anthropic thinking blocks；如果 thinking 被隐式保持启用，这会把内部推理泄露到可见输出中。除非你显式自行设置 `thinking`，否则 OpenClaw 默认会禁用 M2.x thinking。MiniMax-M3（以及向前兼容的 M3.x）不受此限制：M3 会发出正确的 Anthropic thinking blocks，并且需要启用 thinking 才能生成可见内容，因此 OpenClaw 会让 M3 继续使用提供商的自适应 thinking 路径。请参阅下面高级配置中的 Thinking 默认值部分。
    </Warning>

    <Note>
    API 密钥设置使用 `minimax` 提供商 ID。模型引用遵循 `minimax/MiniMax-M3` 形式。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 配置

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择模型/认证">
    从菜单中选择 **模型/认证**。
  </Step>
  <Step title="选择 MiniMax 认证选项">
    | 认证选择                | 描述                              |
    | ----------------------- | --------------------------------- |
    | `minimax-global-oauth` | 国际 OAuth（Coding Plan）         |
    | `minimax-cn-oauth`     | 中国 OAuth（Coding Plan）         |
    | `minimax-global-api`   | 国际 API key                      |
    | `minimax-cn-api`       | 中国 API key                      |
  </Step>
  <Step title="选择你的默认模型">
    在提示时选择你的默认模型。
  </Step>
</Steps>

## 能力

### 图像生成

MiniMax 插件会为 `minimax` 和 `minimax-portal` 上的 `image_generate` 工具注册 `image-01` 模型，并复用与文本模型相同的 `MINIMAX_API_KEY` 或 OAuth 认证。

- 文本到图像生成和图像到图像编辑（主体参考），两者都支持宽高比控制
- 每个请求最多输出 9 张图像，每个编辑请求支持 1 张参考图像
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

图像生成始终使用 MiniMax 专用图像端点（`/v1/image_generation`），并忽略 `models.providers.minimax.baseUrl`，因为该字段配置的是聊天/Anthropic 兼容的基础 URL。设置 `MINIMAX_API_HOST=https://api.minimaxi.com` 可将图像生成路由到 CN 端点；默认全局端点是 `https://api.minimax.io`。

<Note>
参见 [图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 文本转语音

内置的 `minimax` 插件将 MiniMax T2A v2 注册为 `messages.tts` 的语音提供商。

- 默认 TTS 模型：`speech-2.8-hd`
- 默认语音：`English_expressive_narrator`
- 内置模型 ID：`speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd`、`speech-01-turbo`、`speech-01-240228`
- 认证解析顺序：`messages.tts.providers.minimax.apiKey`，然后是 `minimax-portal` OAuth/token 认证配置档案，然后是 Token Plan 环境键（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），然后是 `MINIMAX_API_KEY`
- 如果未配置 TTS 主机，OpenClaw 会复用已配置的 `minimax-portal` OAuth 主机，并移除 Anthropic 兼容路径后缀，例如 `/anthropic`
- 普通音频附件保持 MP3。语音便签目标（Feishu、Telegram，以及其他请求兼容语音便签附件的渠道）会通过 `ffmpeg` 从 MiniMax MP3 转码为 48kHz Opus，因为例如 Feishu/Lark 文件 API 对原生音频消息只接受 `file_type: "opus"`
- MiniMax T2A 接受小数 `speed` 和 `vol`，但 `pitch` 会作为整数发送；OpenClaw 会在 API 请求前截断小数 `pitch` 值

| 设置                                     | 环境变量               | 默认值                        | 描述                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主机。           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用于语音输出的语音 ID。          |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。           |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数音高偏移，`-12..12`。        |

### 音乐生成

内置 MiniMax 插件会通过共享的 `music_generate` 工具为 `minimax` 和 `minimax-portal` 注册音乐生成。

- 默认音乐模型：`minimax/music-2.6`（OAuth：`minimax-portal/music-2.6`）
- 还支持 `music-2.6-free`、`music-cover` 和 `music-cover-free`
- 提示词控制项：`lyrics`、`instrumental`
- 输出格式：`mp3`
- 基于会话的运行会通过共享任务/状态流程分离，包括 `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
参见 [音乐生成](/zh-CN/tools/music-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 视频生成

内置 MiniMax 插件会通过共享的 `video_generate` 工具为 `minimax` 和 `minimax-portal` 注册视频生成。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`（OAuth：`minimax-portal/MiniMax-Hailuo-2.3`）
- 还支持 `MiniMax-Hailuo-2.3-Fast`、`MiniMax-Hailuo-02`、`I2V-01-Director`、`I2V-01-live` 和 `I2V-01`
- 模式：文本到视频和单图参考流程
- 支持 `resolution`（Hailuo 2.3/02 模型上为 `768P` 或 `1080P`）；不支持 `aspectRatio`，并且会被忽略

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

### 图像理解

MiniMax 插件会将图像理解独立于文本目录进行注册：

| 提供商 ID      | 默认图像模型 | PDF 文本提取 |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

这就是为什么即使内置文本提供商目录也包含支持 M3 图像能力的聊天引用，自动媒体路由仍然可以使用 MiniMax 图像理解。PDF 理解仅使用 `MiniMax-M2.7` 提取文本；MiniMax 不会注册 PDF 到图像的转换路径。

### Web 搜索

MiniMax 插件还会通过 MiniMax Token Plan 搜索 API（`/v1/coding_plan/search`）注册 `web_search`。

- 提供商 id：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 接受的环境变量别名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 兼容性回退：当 `MINIMAX_API_KEY` 已经指向 token-plan 凭证时使用它
- 区域复用：`plugins.entries.minimax.config.webSearch.region`，然后是 `MINIMAX_API_HOST`，然后是 MiniMax 提供商基础 URL
- 搜索保持在提供商 id `minimax` 上；OAuth 中国/全球设置可以通过 `models.providers.minimax-portal.baseUrl` 间接引导区域，并可以通过 `MINIMAX_OAUTH_TOKEN` 提供 bearer 认证

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
请参阅 [MiniMax Search](/zh-CN/tools/minimax-search)，了解完整的 Web 搜索配置和用法。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 说明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 优先使用 `https://api.minimax.io/anthropic`（兼容 Anthropic）；`https://api.minimax.io/v1` 可选用于兼容 OpenAI 的载荷 |
    | `models.providers.minimax.api` | 优先使用 `anthropic-messages`；`openai-completions` 可选用于兼容 OpenAI 的载荷 |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为你想加入允许列表的模型设置别名 |
    | `models.mode` | 如果你想在内置项旁添加 MiniMax，请保留 `merge` |
  </Accordion>

  <Accordion title="思考默认值">
    在 `api: "anthropic-messages"` 上，OpenClaw 会为 MiniMax M2.x 模型注入 `thinking: { type: "disabled" }`，除非更早的包装器已经在载荷中设置了 `thinking` 字段。这可以防止 M2.x 的流式端点在 OpenAI 风格的增量块中发出 `reasoning_content`，否则会把内部推理泄露到可见输出中。

    MiniMax-M3（以及 M3.x）例外：禁用思考时，M3 会返回空的 `content` 数组，并带有 `stop_reason: "end_turn"`，因此 OpenClaw 会移除 M3 的隐式禁用默认值，并且在设置了思考等级时，改为强制使用 `thinking: { type: "adaptive" }`。

    每个模型家族可用的思考等级：

    | 模型家族   | 等级                                   | 默认值    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`、`adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`、`minimal`、`low`、`medium`、`high` | `off`      |

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 会在兼容 Anthropic 的流式路径（`api: "anthropic-messages"`，提供商 `minimax` 或 `minimax-portal`）上将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="Fallback example">
    **最适合：** 将你最强的最新一代模型作为主模型，并故障转移到 MiniMax M2.7。下面示例使用 Opus 作为具体主模型；可替换为你偏好的最新一代主模型。

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

  <Accordion title="Coding Plan usage details">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 coding plan 密钥）。
    - 配置后，用量轮询会从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 派生主机，因此使用 `https://api.minimax.io/anthropic` 的全局设置会轮询 `api.minimax.io`。缺失或格式错误的 base URL 会保留 CN 回退以维持兼容性。
    - OpenClaw 会将 MiniMax coding-plan 用量规范化为其他提供商使用的相同 `% left` 显示。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，而不是已消耗配额，因此 OpenClaw 会对其取反。存在基于计数的字段时优先使用。
    - 当 API 返回 `model_remains` 时，OpenClaw 优先使用聊天模型条目，在需要时从 `start_time` / `end_time` 派生窗口标签，并在计划标签中包含所选模型名称，以便更容易区分 coding-plan 窗口。
    - 用量快照会将 `minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 视为同一个 MiniMax 配额面，并优先使用已存储的 MiniMax OAuth，然后再回退到 Coding Plan key 环境变量。

  </Accordion>
</AccordionGroup>

## 说明

- 默认聊天模型：`MiniMax-M3`。备用聊天模型：`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- 新手引导和直接 API 密钥设置会为 M3 以及两个 M2.7 变体写入模型定义
- 图像理解使用插件拥有的 `MiniMax-VL-01` 媒体提供商
- 如果需要精确的成本跟踪，请更新 `models.json` 中的定价值
- 使用 `openclaw models list` 确认当前提供商 id，然后用 `openclaw models set minimax/MiniMax-M3` 或 `openclaw models set minimax-portal/MiniMax-M3` 切换

<Note>
请参阅 [模型提供商](/zh-CN/concepts/model-providers) 了解提供商规则。
</Note>

## 故障排查

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    这通常意味着 **MiniMax 提供商未配置**（没有匹配的提供商条目，也没有找到 MiniMax 认证配置文件/环境密钥）。修复方式：

    - 运行 `openclaw configure` 并选择一个 **MiniMax** 认证选项，或
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 块，或
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`，或 MiniMax 认证配置文件，以便注入匹配的提供商。

    确保模型 id **区分大小写**：

    - API 密钥路径：`minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="Music generation" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="MiniMax Search" href="/zh-CN/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Token Plan 进行 Web 搜索配置。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
