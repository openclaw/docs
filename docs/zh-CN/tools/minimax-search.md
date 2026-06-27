---
read_when:
    - 你想使用 MiniMax 进行 web_search
    - 你需要一个 MiniMax Token Plan 密钥或 OAuth 令牌
    - 你需要 MiniMax 中国区/全球区搜索主机指导
summary: 通过 Token Plan 搜索 API 使用 MiniMax 搜索
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-05-11T20:35:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 支持将 MiniMax 作为 `web_search` 提供商，通过 MiniMax
Token Plan 搜索 API 使用。它会返回带有标题、URL、
摘要和相关查询的结构化搜索结果。

## 获取 Token Plan 凭证

<Steps>
  <Step title="创建密钥">
    从
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    创建或复制 MiniMax Token Plan 密钥。
    OAuth 设置也可以改用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和
`MINIMAX_API_KEY` 作为环境变量别名。`MINIMAX_API_KEY` 应指向一个
已启用搜索的 Token Plan 凭证；普通 MiniMax 模型 API 密钥可能不会被
Token Plan 搜索端点接受。

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

**环境变量替代方式：**在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、
`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。
对于 Gateway 网关安装，请将它放入 `~/.openclaw/.env`。

## 区域选择

MiniMax Search 使用以下端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- CN：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 会按
以下顺序解析区域：

1. `tools.web.search.minimax.region` / 插件拥有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着 CN 新手引导或 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
也会自动让 MiniMax Search 使用 CN 主机。

即使你通过 OAuth `minimax-portal` 路径完成 MiniMax 身份验证，
Web 搜索仍会注册为提供商 ID `minimax`；OAuth 提供商 base URL
会作为 CN/全球主机选择的区域提示，并且 `MINIMAX_OAUTH_TOKEN`
可以满足 MiniMax Search 的 Bearer 凭证要求。

## 支持的参数

| 参数 | 类型    | 约束 | 描述                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | 必填    | 搜索查询字符串。                                                        |
| `count`   | integer | 1-10        | 要返回的结果数。OpenClaw 会将返回列表裁剪到此大小。 |

目前不支持提供商专用筛选条件。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音和身份验证设置
