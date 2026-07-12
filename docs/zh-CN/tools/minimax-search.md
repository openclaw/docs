---
read_when:
    - 你想使用 MiniMax 进行 `web_search`
    - 你需要一个 MiniMax Token Plan 密钥或 OAuth 令牌
    - 你需要 MiniMax 中国区/全球搜索主机指南
summary: 通过 Token Plan 搜索 API 使用 MiniMax 搜索
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-07-11T21:01:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 通过 MiniMax Token Plan 搜索 API 支持将 MiniMax 用作 `web_search` 提供商。它会返回包含标题、URL、摘要和相关查询的结构化搜索结果。

## 获取 Token Plan 凭据

<Steps>
  <Step title="创建密钥">
    在 [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制 MiniMax Token Plan 密钥。
    OAuth 设置也可以改为复用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 还接受 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和 `MINIMAX_API_KEY` 作为环境变量别名，并在 `MINIMAX_CODE_PLAN_KEY` 之后按此顺序检查。`MINIMAX_API_KEY` 应指向已启用搜索功能的 Token Plan 凭据；Token Plan 搜索端点可能不接受普通的 MiniMax 模型 API 密钥。

## 配置

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // 如果已设置 MiniMax Token Plan 环境变量，则可选
            region: "global", // 或 "cn"
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

**环境变量替代方案：**在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 区域选择

MiniMax Search 使用以下端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中国：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 将按以下顺序确定区域：

1. `tools.web.search.minimax.region` / 插件所有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着中国区新手引导或 `MINIMAX_API_HOST=https://api.minimaxi.com/...` 也会自动让 MiniMax Search 使用中国区主机。

即使你通过 OAuth `minimax-portal` 路径对 MiniMax 进行了身份验证，Web 搜索仍会以提供商 ID `minimax` 注册；OAuth 提供商的基础 URL 会作为选择中国区或全球主机的区域提示，而 `MINIMAX_OAUTH_TOKEN` 可以满足 MiniMax Search 的 Bearer 凭据要求。

## 支持的参数

| 参数      | 类型    | 约束            | 描述                                                         |
| --------- | ------- | --------------- | ------------------------------------------------------------ |
| `query`   | 字符串  | 必填            | 搜索查询字符串。                                             |
| `count`   | 整数    | 1-10，默认值为 5 | 要返回的结果数量。OpenClaw 会将返回的列表裁剪为此大小。       |

目前不支持提供商特定的筛选条件。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音和身份验证设置
