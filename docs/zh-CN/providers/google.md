---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API 密钥或 OAuth 身份验证流程
summary: Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、Web 搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-05T08:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，以及通过 Gemini Grounding 提供图像生成、媒体理解（图像/音频/视频）和 Web 搜索功能。

- 提供商：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 替代提供商：`google-gemini-cli`（OAuth）

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

另一个替代提供商 `google-gemini-cli` 使用 PKCE OAuth，而不是 API 密钥。这是一个非官方集成；一些用户报告了账户限制。请自行承担使用风险。

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

（或使用 `GEMINI_CLI_*` 变体。）

如果 Gemini CLI 的 OAuth 请求在登录后失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然后重试。

如果在浏览器流程开始之前登录就失败，请确认本地 `gemini` 命令已安装并位于 `PATH` 中。OpenClaw 同时支持 Homebrew 安装和全局 npm 安装，包括常见的 Windows/npm 布局。

Gemini CLI JSON 使用说明：

- 回复文本来自 CLI JSON 的 `response` 字段。
- 当 CLI 将 `usage` 留空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会根据 `stats.input_tokens - stats.cached` 推导输入 token 数。

## 功能

| 功能 | 支持情况 |
| ---------------------- | ----------------- |
| 聊天补全 | 是 |
| 图像生成 | 是 |
| 图像理解 | 是 |
| 音频转录 | 是 |
| 视频理解 | 是 |
| Web 搜索（Grounding） | 是 |
| 思考/推理 | 是（Gemini 3.1+） |

## 直接复用 Gemini 缓存

对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw 现在会将已配置的 `cachedContent` 句柄传递给 Gemini 请求。

- 可通过 `cachedContent` 或旧版 `cached_content` 为每个模型或全局参数进行配置
- 如果两者同时存在，则 `cachedContent` 优先
- 示例值：`cachedContents/prebuilt-context`
- Gemini 缓存命中用量会根据上游 `cachedContentTokenCount` 规范化为 OpenClaw `cacheRead`

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

内置的 `google` 图像生成提供商默认使用 `google/gemini-3.1-flash-image-preview`。

- 也支持 `google/gemini-3-pro-image-preview`
- 生成：每次请求最多 4 张图像
- 编辑模式：已启用，最多支持 5 张输入图像
- 几何控制：`size`、`aspectRatio` 和 `resolution`

仅支持 OAuth 的 `google-gemini-cli` 提供商是一个独立的文本推理接口。图像生成、媒体理解和 Gemini Grounding 仍然使用 `google` 提供商 ID。

## 环境说明

如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保该进程可以访问 `GEMINI_API_KEY`（例如，在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
