---
read_when:
    - 你想将 MiniMax 用作 `web_search`
    - 你需要 MiniMax Coding Plan 密钥
    - 你想了解 MiniMax 中国区/全球搜索主机的使用说明
summary: 通过 Coding Plan 搜索 API 使用 MiniMax 搜索
title: MiniMax 搜索
x-i18n:
    generated_at: "2026-04-05T10:11:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax 搜索

OpenClaw 支持通过 MiniMax
Coding Plan 搜索 API 将 MiniMax 用作 `web_search` provider。它会返回结构化搜索结果，包括标题、URL、摘要片段和相关查询。

## 获取 Coding Plan 密钥

<Steps>
  <Step title="创建密钥">
    在
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制一个 MiniMax Coding Plan 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY` 作为环境变量别名。当 `MINIMAX_API_KEY`
已经指向 coding-plan token 时，仍会将其作为兼容性回退读取。

## 配置

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**环境变量替代方式：** 在 Gateway 网关环境中设置 `MINIMAX_CODE_PLAN_KEY`。
对于 gateway 安装，请将其放入 `~/.openclaw/.env`。

## 区域选择

MiniMax 搜索使用以下端点：

- Global：`https://api.minimax.io/v1/coding_plan/search`
- 中国区：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 会按以下顺序解析
区域：

1. `tools.web.search.minimax.region` / 插件自有 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着中国区新手引导，或设置了 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
时，也会自动让 MiniMax 搜索继续使用中国区主机。

即使你是通过 OAuth 的 `minimax-portal` 路径完成 MiniMax 认证，
网页搜索仍会注册为 provider id `minimax`；OAuth provider 基础 URL
仅用于作为中国区/全球主机选择的区域提示。

## 支持的参数

MiniMax 搜索支持：

- `query`
- `count`（OpenClaw 会将返回的结果列表裁剪为请求的数量）

当前不支持 provider 专用过滤器。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有 provider 和自动检测
- [MiniMax](/zh-CN/providers/minimax) -- 模型、图像、语音和认证设置
