---
read_when:
    - 你想使用 MiniMax 进行 web_search
    - 你需要 MiniMax Token Plan 密钥或 OAuth 令牌
    - 你需要 MiniMax CN/全球搜索主机指导
summary: 通过 Token Plan 搜索 API 使用 MiniMax Search
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-05-02T05:03:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 支持通过 MiniMax Token Plan 搜索 API 将 MiniMax 用作 `web_search` 提供商。它会返回包含标题、URL、摘要片段和相关查询的结构化搜索结果。

## 获取 Token Plan 凭证

<Steps>
  <Step title="创建密钥">
    从 [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制 MiniMax Token Plan 密钥。
    OAuth 设置可以改为复用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和 `MINIMAX_API_KEY` 作为环境变量别名。`MINIMAX_API_KEY` 应指向已启用搜索的 Token Plan 凭证；普通的 MiniMax 模型 API 密钥可能不会被 Token Plan 搜索端点接受。

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

**环境替代方式：**在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。对于 Gateway 网关安装，请将它放入 `~/.openclaw/.env`。

## 区域选择

MiniMax Search 使用以下端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中国大陆：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 会按以下顺序解析区域：

1. `tools.web.search.minimax.region` / 插件拥有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着中国大陆新手引导或 `MINIMAX_API_HOST=https://api.minimaxi.com/...` 也会自动让 MiniMax Search 使用中国大陆主机。

即使你是通过 OAuth `minimax-portal` 路径认证 MiniMax，Web 搜索仍会注册为提供商 ID `minimax`；OAuth 提供商基础 URL 会用作中国大陆/全球主机选择的区域提示，并且 `MINIMAX_OAUTH_TOKEN` 可以满足 MiniMax Search 的 bearer 凭证要求。

## 支持的参数

MiniMax Search 支持：

- `query`
- `count`（OpenClaw 会将返回的结果列表裁剪到请求的数量）

当前不支持提供商特定的筛选器。

## 相关

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音和认证设置
