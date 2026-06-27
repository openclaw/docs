---
read_when:
    - 你想使用 Grok 进行 web_search
    - 你想使用 xAI OAuth 或 XAI_API_KEY 进行网页搜索
summary: 通过 xAI 基于 Web 的响应进行 Grok Web 搜索
title: Grok 搜索
x-i18n:
    generated_at: "2026-06-27T03:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 基于 Web 的响应生成由实时搜索结果和引用支撑的 AI 综合答案。

Grok Web 搜索会优先使用你现有的 xAI OAuth 登录（如果可用）。如果没有 OAuth 配置文件，同一个 xAI API key 也可以驱动内置的 `x_search` 工具，用于搜索 X（原 Twitter）帖子，以及 `code_execution` 工具。如果你将密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 也会将其作为内置 xAI 模型提供商的备用凭证复用。

对于转发、回复、书签或浏览量等帖子级 X 指标，优先使用带有精确帖子 URL 或状态 ID 的 `x_search`，而不是宽泛的搜索查询。

## 新手引导和配置

如果你在以下流程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以使用现有的 xAI OAuth 配置文件，而无需提示输入单独的 Web 搜索密钥。如果 OAuth 不可用，它会回退到 xAI API key 设置。OpenClaw 还可以显示一个单独的后续步骤，用同一份 xAI 凭证启用 `x_search`。该后续步骤：

- 只会在你为 `web_search` 选择 Grok 后出现
- 不是单独的顶层 Web 搜索提供商选项
- 可以选择在同一流程中设置 `x_search` 模型

如果你跳过它，之后仍可在配置中启用或更改 `x_search`。

## 登录或获取 API key

<Steps>
  <Step title="使用 xAI OAuth">
    如果你已经在新手引导或模型认证期间使用 xAI 登录，请选择 Grok 作为 `web_search` 提供商。不需要单独的 API key：

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="使用 API key 备用方式">
    当 OAuth 不可用，或你有意使用基于密钥的 Web 搜索配置时，请从 [xAI](https://console.x.ai/) 获取 API key。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**凭证替代方式：** 使用 `openclaw models auth login
--provider xai --method oauth` 登录，在 Gateway 网关环境中设置 `XAI_API_KEY`，或存储 `plugins.entries.xai.config.webSearch.apiKey`。对于 Gateway 网关安装，请将环境变量放入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 基于 Web 的响应生成带有行内引用的综合答案，类似于 Gemini 的 Google Search grounding 方法。

## 支持的参数

Grok 搜索支持 `query`。

出于共享 `web_search` 兼容性考虑，`count` 会被接受，但 Grok 仍会返回一个带引用的综合答案，而不是 N 条结果列表。

目前不支持提供商特定的过滤器。

Grok 使用提供商特定的 60 秒默认超时，因为 xAI Responses 基于 Web 的搜索可能比共享的 `web_search` 默认值运行更久。设置 `tools.web.search.timeoutSeconds` 可覆盖它。

## Base URL 覆盖

当 Grok Web 搜索应通过操作方代理或兼容 xAI 的 Responses 端点路由时，设置 `plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw 会在去除尾部斜杠后向 `<baseUrl>/responses` 发送请求。除非设置了 `plugins.entries.xai.config.xSearch.baseUrl`，否则 `x_search` 会使用同一个 `webSearch.baseUrl` 备用值。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web 搜索中的 x_search](/zh-CN/tools/web#x_search) -- 通过 xAI 进行一等 X 搜索
- [Gemini 搜索](/zh-CN/tools/gemini-search) -- 通过 Google grounding 生成 AI 综合答案
