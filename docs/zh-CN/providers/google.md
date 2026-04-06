---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API 密钥或 OAuth 凭证流程
summary: Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、Web 搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-06T12:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，另外还支持
通过 Gemini Grounding 提供图像生成、媒体理解（图像/音频/视频）以及 Web 搜索。

- 提供商：`google`
- 凭证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 备选提供商：`google-gemini-cli`（OAuth）

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth（Gemini CLI）

备选提供商 `google-gemini-cli` 使用 PKCE OAuth，而不是 API
密钥。这是一个非官方集成；一些用户报告了账号
限制。请自行承担风险。

- 默认模型：`google-gemini-cli/gemini-3.1-pro-preview`
- 别名：`gemini-cli`
- 安装前提：本地可用的 Gemini CLI，命令名为 `gemini`
  - Homebrew：`brew install gemini-cli`
  - npm：`npm install -g @google/gemini-cli`
- 登录：

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

环境变量：

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

（或者使用 `GEMINI_CLI_*` 变体。）

如果 Gemini CLI OAuth 请求在登录后失败，请在 Gateway 网关主机上设置
`GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然后
重试。

如果在浏览器流程开始之前登录失败，请确认本地 `gemini`
命令已安装并且位于 `PATH` 中。OpenClaw 同时支持 Homebrew 安装
和全局 npm 安装，包括常见的 Windows/npm 布局。

Gemini CLI JSON 用量说明：

- 回复文本来自 CLI JSON 的 `response` 字段。
- 当 CLI 将 `usage` 留空时，用量会回退到 `stats`。
- `stats.cached` 会被归一化为 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token 数。

## 功能

| 功能 | 支持情况 |
| ---------------------- | ----------------- |
| 聊天补全 | 是 |
| 图像生成 | 是 |
| 音乐生成 | 是 |
| 图像理解 | 是 |
| 音频转录 | 是 |
| 视频理解 | 是 |
| Web 搜索（Grounding） | 是 |
| Thinking/推理 | 是（Gemini 3.1+） |

## 直接复用 Gemini 缓存

对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw 现在会
将已配置的 `cachedContent` 句柄透传到 Gemini 请求中。

- 可通过以下任一方式为每个模型或全局参数配置：
  `cachedContent` 或旧版 `cached_content`
- 如果两者都存在，优先使用 `cachedContent`
- 示例值：`cachedContents/prebuilt-context`
- Gemini 缓存命中的用量会根据上游 `cachedContentTokenCount`
  归一化为 OpenClaw `cacheRead`

示例：

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 也支持 `google/gemini-3-pro-image-preview`
- 生成：每次请求最多 4 张图像
- 编辑模式：已启用，最多 5 张输入图像
- 几何控制：`size`、`aspectRatio` 和 `resolution`

仅支持 OAuth 的 `google-gemini-cli` 提供商是一个独立的文本推理
界面。图像生成、媒体理解和 Gemini Grounding 仍然使用
`google` 提供商 id。

要将 Google 用作默认图像提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

关于共享工具参数、提供商选择和回退行为，请参见 [Image Generation](/zh-CN/tools/image-generation)。

## 视频生成

内置的 `google` 插件还通过共享
`video_generate` 工具注册了视频生成。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文生视频、图生视频和单视频参考流程
- 支持 `aspectRatio`、`resolution` 和 `audio`
- 当前时长限制：**4 到 8 秒**

要将 Google 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

关于共享工具参数、提供商选择和回退行为，请参见 [Video Generation](/zh-CN/tools/video-generation)。

## 音乐生成

内置的 `google` 插件还通过共享
`music_generate` 工具注册了音乐生成。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 也支持 `google/lyria-3-pro-preview`
- 提示词控制：`lyrics` 和 `instrumental`
- 输出格式：默认 `mp3`，另外在 `google/lyria-3-pro-preview` 上还支持 `wav`
- 参考输入：最多 10 张图像
- 基于会话的运行会通过共享任务/状态流程分离执行，包括 `action: "status"`

要将 Google 用作默认音乐提供商：

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

关于共享工具参数、提供商选择和回退行为，请参见 [Music Generation](/zh-CN/tools/music-generation)。

## 环境说明

如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保 `GEMINI_API_KEY`
对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
`env.shellEnv` 提供）。
