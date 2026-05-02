---
read_when:
    - 你想使用 MiniMax 进行 web_search
    - 你需要 MiniMax Token Plan key 或 OAuth token
    - 你需要 MiniMax 中国/全球搜索主机指南
summary: 通过 Token Plan 搜索 API 使用 MiniMax 搜索
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-05-02T04:48:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf721a293d6b244e69d952f433bde83417eb907ef8c0b46d04a567f1b668a32e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 通过 MiniMax Token Plan 搜索 API 支持将 MiniMax 作为 `web_search` 提供商。它会返回带有标题、URL、摘要和相关查询的结构化搜索结果。

## 获取 Token Plan 凭证

<Steps>
  <Step title="创建密钥">
    从 [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制 MiniMax Token Plan 密钥。
    OAuth 设置可以改用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY` 和 `MINIMAX_OAUTH_TOKEN` 作为环境变量别名。当 `MINIMAX_API_KEY` 已指向 Token Plan 凭证时，仍会将其作为兼容性回退读取。

## 配置

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**环境变量替代方式：**在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_OAUTH_TOKEN`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 区域选择

MiniMax Search 使用这些端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中国大陆：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 会按以下顺序解析区域：

1. `tools.web.search.minimax.region` / 插件拥有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着中国大陆新手引导或 `MINIMAX_API_HOST=https://api.minimaxi.com/...` 也会自动让 MiniMax Search 使用中国大陆主机。

即使你通过 OAuth 的 `minimax-portal` 路径认证 MiniMax，Web 搜索仍会注册为提供商 ID `minimax`；OAuth 提供商基础 URL 会作为中国大陆/全球主机选择的区域提示，并且 `MINIMAX_OAUTH_TOKEN` 可以满足 MiniMax Search 的 bearer 凭证要求。

## 支持的参数

MiniMax Search 支持：

- `query`
- `count`（OpenClaw 会将返回的结果列表裁剪到请求的数量）

目前不支持提供商特定的筛选器。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音和认证设置
