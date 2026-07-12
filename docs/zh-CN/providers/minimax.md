---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 设置指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-07-11T20:53:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  内置的 `minimax` 插件注册了两个提供商以及五项能力：聊天、图像生成、音乐生成、视频生成、图像理解、语音（T2A v2）和 Web 搜索。

  | 提供商 ID        | 身份验证 | 能力                                                                                   |
  | ---------------- | -------- | -------------------------------------------------------------------------------------- |
  | `minimax`        | API 密钥 | 文本、图像生成、音乐生成、视频生成、图像理解、语音、Web 搜索                          |
  | `minimax-portal` | OAuth    | 文本、图像生成、音乐生成、视频生成、图像理解、语音                                    |

  <Tip>
  MiniMax Coding Plan 推荐链接（九折优惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## 内置目录

  | 模型                     | 类型             | 说明                           |
  | ------------------------ | ---------------- | ------------------------------ |
  | `MiniMax-M3`             | 聊天（推理）     | 默认的托管式推理模型           |
  | `MiniMax-M2.7`           | 聊天（推理）     | 上一代托管式推理模型           |
  | `MiniMax-M2.7-highspeed` | 聊天（推理）     | 更快的 M2.7 推理层级           |
  | `MiniMax-VL-01`          | 视觉             | 图像理解模型                   |
  | `image-01`               | 图像生成         | 文生图和图生图编辑             |
  | `music-2.6`              | 音乐生成         | 默认音乐模型                   |
  | `MiniMax-Hailuo-2.3`     | 视频生成         | 文生视频和图生视频流程         |

  模型引用遵循身份验证路径：API 密钥设置使用 `minimax/<model>`，OAuth 设置使用 `minimax-portal/<model>`。

  ## 入门指南

  <Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最适合：**通过 OAuth 快速设置 MiniMax Coding Plan，无需 API 密钥。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            最终的提供商基础 URL：`api.minimax.io`。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            最终的提供商基础 URL：`api.minimaxi.com`。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 设置使用 `minimax-portal` 提供商 ID。模型引用采用 `minimax-portal/MiniMax-M3` 格式。
    </Note>

  </Tab>

  <Tab title="API 密钥">
    **最适合：**使用兼容 Anthropic API 的托管式 MiniMax。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            这会将 `api.minimax.io` 配置为基础 URL。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            这会将 `api.minimaxi.com` 配置为基础 URL。
          </Step>
          <Step title="验证模型是否可用">
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
    MiniMax-M2.x 的 Anthropic 兼容流式端点会在 OpenAI 风格的增量块中发送 `reasoning_content`，而不是原生 Anthropic 思考块。如果隐式保持启用思考，这会导致内部推理泄露到可见输出中。除非你自行显式设置 `thinking`，否则 OpenClaw 默认禁用 M2.x 的思考。MiniMax-M3（以及向前兼容的 M3.x）不受此限制：M3 会发送正确的 Anthropic 思考块，并且必须启用思考才能生成可见内容，因此 OpenClaw 会让 M3 继续使用提供商的自适应思考路径。请参阅下方“高级配置”中的“思考默认值”部分。
    </Warning>

    <Note>
    API 密钥设置使用 `minimax` 提供商 ID。模型引用采用 `minimax/MiniMax-M3` 格式。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 进行配置

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择模型/身份验证">
    从菜单中选择 **模型/身份验证**。
  </Step>
  <Step title="选择 MiniMax 身份验证选项">
    | 身份验证选项            | 说明                        |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | 国际版 OAuth（Coding Plan）  |
    | `minimax-cn-oauth`     | 中国版 OAuth（Coding Plan）          |
    | `minimax-global-api`   | 国际版 API 密钥              |
    | `minimax-cn-api`       | 中国版 API 密钥                      |
  </Step>
  <Step title="选择默认模型">
    出现提示时选择你的默认模型。
  </Step>
</Steps>

## 能力

### 图像生成

MiniMax 插件会为 `minimax` 和 `minimax-portal` 上的 `image_generate` 工具注册 `image-01` 模型，并复用与文本模型相同的 `MINIMAX_API_KEY` 或 OAuth 身份验证。

- 文生图和图生图编辑（主体参考），两者均支持宽高比控制
- 每个请求最多输出 9 张图像，每个编辑请求最多使用 1 张参考图像
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

图像生成始终使用 MiniMax 专用的图像端点（`/v1/image_generation`），并忽略 `models.providers.minimax.baseUrl`，因为该字段配置的是聊天/Anthropic 兼容的基础 URL。设置 `MINIMAX_API_HOST=https://api.minimaxi.com` 可通过中国区端点进行图像生成；默认全球端点为 `https://api.minimax.io`。

<Note>
有关共享工具参数、提供商选择和故障转移行为，请参阅[图像生成](/zh-CN/tools/image-generation)。
</Note>

### 文本转语音

内置的 `minimax` 插件会将 MiniMax T2A v2 注册为 `messages.tts` 的语音提供商。

- 默认 TTS 模型：`speech-2.8-hd`
- 默认音色：`English_expressive_narrator`
- 内置模型 ID：`speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd`、`speech-01-turbo`、`speech-01-240228`
- 身份验证解析顺序：`messages.tts.providers.minimax.apiKey`，然后是 `minimax-portal` OAuth/令牌身份验证配置文件，然后是 Token Plan 环境变量密钥（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`
- 如果未配置 TTS 主机，OpenClaw 会复用已配置的 `minimax-portal` OAuth 主机，并移除 `/anthropic` 等 Anthropic 兼容路径后缀
- 普通音频附件保持为 MP3。语音消息目标（Feishu、Telegram，以及其他要求使用语音消息兼容附件的渠道）会使用 `ffmpeg` 将 MiniMax MP3 转码为 48kHz Opus，因为例如 Feishu/Lark 文件 API 的原生音频消息仅接受 `file_type: "opus"`
- MiniMax T2A 接受小数形式的 `speed` 和 `vol`，但 `pitch` 会以整数发送；OpenClaw 会在 API 请求前截去 `pitch` 值的小数部分

| 设置                                  | 环境变量                | 默认值                       | 说明                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主机。            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用于语音输出的音色 ID。 |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数音高偏移，`-12..12`。  |

### 音乐生成

内置的 MiniMax 插件会通过共享的 `music_generate` 工具，为 `minimax` 和 `minimax-portal` 注册音乐生成功能。

- 默认音乐模型：`minimax/music-2.6`（OAuth：`minimax-portal/music-2.6`）
- 还支持 `music-2.6-free`、`music-cover` 和 `music-cover-free`
- 提示词控制项：`lyrics`、`instrumental`
- 输出格式：`mp3`
- 由会话支持的运行会通过共享的任务/状态流程分离执行，其中包括 `action: "status"`

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[音乐生成](/zh-CN/tools/music-generation)。
</Note>

### 视频生成

内置的 MiniMax 插件会通过共享的 `video_generate` 工具，为 `minimax` 和 `minimax-portal` 注册视频生成功能。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`（OAuth：`minimax-portal/MiniMax-Hailuo-2.3`）
- 还支持 `MiniMax-Hailuo-2.3-Fast`、`MiniMax-Hailuo-02`、`I2V-01-Director`、`I2V-01-live` 和 `I2V-01`
- 模式：文生视频和单图参考流程
- 支持 `resolution`（Hailuo 2.3/02 模型可使用 `768P` 或 `1080P`）；不支持 `aspectRatio`，该参数会被忽略

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
</Note>

### 图像理解

MiniMax 插件独立于文本目录注册图像理解功能：

| 提供商 ID | 默认图像模型 | PDF 文本提取 |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

因此，即使内置文本提供商目录中也包含支持图像的 M3 聊天模型引用，自动媒体路由仍可使用 MiniMax 图像理解功能。PDF 理解仅使用 `MiniMax-M2.7` 提取文本；MiniMax 未注册 PDF 转图像的转换路径。

### Web 搜索

MiniMax 插件还通过 MiniMax Token Plan 搜索 API（`/v1/coding_plan/search`）注册 `web_search`。

- 提供商 ID：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 接受的环境变量别名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 兼容性回退：当 `MINIMAX_API_KEY` 已指向 Token Plan 凭据时使用该变量
- 区域复用：依次使用 `plugins.entries.minimax.config.webSearch.region`、`MINIMAX_API_HOST`，然后使用 MiniMax 提供商基础 URL
- 搜索仍使用提供商 ID `minimax`；OAuth 中国区/全球设置可通过 `models.providers.minimax-portal.baseUrl` 间接控制区域，并可通过 `MINIMAX_OAUTH_TOKEN` 提供 Bearer 身份验证

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
有关完整的 Web 搜索配置和用法，请参阅 [MiniMax 搜索](/zh-CN/tools/minimax-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 说明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 优先使用 `https://api.minimax.io/anthropic`（兼容 Anthropic）；也可选择 `https://api.minimax.io/v1` 以使用兼容 OpenAI 的负载 |
    | `models.providers.minimax.api` | 优先使用 `anthropic-messages`；也可选择 `openai-completions` 以使用兼容 OpenAI 的负载 |
    | `models.providers.minimax.apiKey` | MiniMax API 密钥（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为你希望加入允许列表的模型设置别名 |
    | `models.mode` | 如果要在内置模型之外添加 MiniMax，请保留 `merge` |
  </Accordion>

  <Accordion title="思考默认设置">
    使用 `api: "anthropic-messages"` 时，除非先前的包装器已在负载中设置 `thinking` 字段，否则 OpenClaw 会为 MiniMax M2.x 模型注入 `thinking: { type: "disabled" }`。这可防止 M2.x 的流式端点在 OpenAI 风格的增量分块中发出 `reasoning_content`，避免内部推理泄露到可见输出中。

    MiniMax-M3（及 M3.x）不受此规则约束：禁用思考时，M3 会返回空的 `content` 数组以及 `stop_reason: "end_turn"`，因此 OpenClaw 会移除 M3 隐式的禁用默认值；设置思考级别时，则强制改用 `thinking: { type: "adaptive" }`。

    各模型系列可用的思考级别：

    | 模型系列 | 级别 | 默认值 |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`、`adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`、`minimal`、`low`、`medium`、`high` | `off`      |

  </Accordion>

  <Accordion title="快速模式">
    在兼容 Anthropic 的流式路径（`api: "anthropic-messages"`，提供商为 `minimax` 或 `minimax-portal`）上，`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="回退示例">
    **最适合：**将你最强的最新一代模型设为主模型，并在失败时回退到 MiniMax M2.7。以下示例使用 Opus 作为具体主模型；你可以将其替换为偏好的最新一代主模型。

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

  <Accordion title="Coding Plan 用量详情">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 Coding Plan 密钥）。
    - 配置后，用量轮询会从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推导主机，因此使用 `https://api.minimax.io/anthropic` 的全球设置会轮询 `api.minimax.io`。为保持兼容性，缺失或格式错误的基础 URL 会继续使用中国区回退。
    - OpenClaw 会将 MiniMax Coding Plan 用量规范化为其他提供商使用的同一种“剩余百分比”显示方式。MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示剩余额度，而非已消耗额度，因此 OpenClaw 会将其反转。如果存在基于计数的字段，则优先使用这些字段。
    - 当 API 返回 `model_remains` 时，OpenClaw 会优先选择聊天模型条目，必要时从 `start_time` / `end_time` 推导时间窗口标签，并在套餐标签中包含所选模型名称，以便更容易区分 Coding Plan 时间窗口。
    - 用量快照将 `minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 视为同一个 MiniMax 配额范围，并优先使用已存储的 MiniMax OAuth，然后才回退到 Coding Plan 密钥环境变量。

  </Accordion>
</AccordionGroup>

## 说明

- 默认聊天模型：`MiniMax-M3`。其他聊天模型：`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- 新手引导和直接 API 密钥设置会写入 M3 以及两个 M2.7 变体的模型定义
- 图像理解使用插件自有的 `MiniMax-VL-01` 媒体提供商
- 如需精确跟踪成本，请更新 `models.json` 中的定价值
- 使用 `openclaw models list` 确认当前提供商 ID，然后通过 `openclaw models set minimax/MiniMax-M3` 或 `openclaw models set minimax-portal/MiniMax-M3` 切换

<Note>
有关提供商规则，请参阅[模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 故障排查

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    这通常意味着 **MiniMax 提供商尚未配置**（没有匹配的提供商条目，也未找到 MiniMax 身份验证配置文件或环境变量密钥）。修复方法：

    - 运行 `openclaw configure` 并选择一个 **MiniMax** 身份验证选项，或者
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 配置块，或者
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 MiniMax 身份验证配置文件，以便注入匹配的提供商。

    请注意模型 ID **区分大小写**：

    - API 密钥路径：`minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后使用以下命令重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
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
  <Card title="MiniMax 搜索" href="/zh-CN/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Token Plan 配置 Web 搜索。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
