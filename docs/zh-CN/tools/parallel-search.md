---
read_when:
    - 你想在没有 API key 的情况下使用 Web 搜索
    - 你想要 Parallel 的付费 Search API
    - 你需要按 LLM 上下文效率排序的高密度摘录
summary: Parallel 搜索 -- 来自 Web 来源、面向 LLM 优化的密集摘录
title: Parallel 搜索
x-i18n:
    generated_at: "2026-07-05T11:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3abb2b64499966ef1d1d8c905f17ae4845f09de62cfb23eeac535ecaeafde3b9
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 插件提供两个 [Parallel](https://parallel.ai/) `web_search`
提供商，二者都会从为 AI 智能体构建的 Web 索引中返回经过排序、针对 LLM 优化的摘录：

| 提供商                 | id              | 凭证                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel 搜索（免费） | `parallel-free` | 无 -- Parallel 的免费 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel 搜索          | `parallel`      | `PARALLEL_API_KEY` -- 付费 Search API，更高的速率限制和目标调优             |

将 `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel` 可显式选择
其中一个；二者都不会自动检测。

<Note>
  直接 OpenAI Responses 模型（`api: "openai-responses"`、提供商
  `openai`、官方 API 基础 URL）会在 `tools.web.search.provider` 未设置、为空、为 `"auto"`、
  或为 `"openai"` 时自动使用 OpenAI 托管的原生 Web 搜索
  -- 因此默认会绕过 Parallel。将
  `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel`，即可改为通过
  Parallel 路由它们。参见 [Web 搜索概览](/zh-CN/tools/web)。
</Note>

## 安装插件

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 密钥（付费提供商）

`parallel-free` 不需要密钥，但仍必须显式选择。付费
`parallel` 提供商需要 API 密钥：

<Steps>
  <Step title="创建账户">
    在 [platform.parallel.ai](https://platform.parallel.ai) 注册，并从你的仪表板生成 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `PARALLEL_API_KEY`，或通过以下命令配置：

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" for the free Search MCP, or "parallel" for the
        // paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**环境替代方式：**在 Gateway 网关
环境中设置 `PARALLEL_API_KEY`。对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 基础 URL 覆盖

仅适用于付费 `parallel` 提供商；`parallel-free` 始终使用
`https://search.parallel.ai/mcp` 并忽略此设置。

设置 `plugins.entries.parallel.config.webSearch.baseUrl` 可将付费
请求路由到兼容代理或替代端点（例如
Cloudflare AI Gateway）。OpenClaw 会通过前置
`https://` 规范化裸主机，并追加 `/v1/search`，除非路径已经以它结尾。
解析后的端点是搜索缓存键的一部分，因此来自不同
端点的结果绝不会共享。

## 工具参数

两个提供商都公开 Parallel 的原生搜索形状，因此模型会填写一个
自然语言目标以及几个简短的关键词查询 -- 这是 Parallel
[推荐](https://docs.parallel.ai/search/best-practices)用于
获得最佳结果的组合。

<ParamField path="objective" type="string" required>
底层问题或目标的自然语言描述（最多 5000
个字符）。应当自包含。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
简洁的关键词搜索查询，每个 3-6 个词（1-5 项，每项最多 200 个字符）。
为获得最佳结果，请提供 2-3 个不同查询。
</ParamField>

<ParamField path="count" type="number">
要返回的结果数（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
来自上一个结果的 `sessionId` 的可选 Parallel 会话 ID。在同一任务的
后续搜索中传入它，以便 Parallel 对相关调用分组并
改进后续结果。`parallel` 上最多 1000 个字符；免费
`parallel-free` Search MCP 将其限制为 100。超过限制的 ID 会被丢弃
（付费）或铸造一个新的（免费）。
</ParamField>

<ParamField path="client_model" type="string">
发起调用的模型的可选标识符（例如 `claude-opus-4-7`、
`gpt-5.5`），最多 100 个字符。让 Parallel 能够根据你的
模型能力调整默认设置。传入确切的活动模型 slug；不要缩短为
模型系列别名。
</ParamField>

## 说明

- Parallel 会按 LLM 推理实用性对结果排序和压缩，而不是面向人工
  点击浏览；预期每个结果是密集摘录，而不是完整页面
  内容。
- 结果摘录会作为 `excerpts` 数组返回，也会合并进
  `description`，以兼容通用 `web_search` 契约。
- 两个提供商都会返回 `session_id`；OpenClaw 会在
  工具载荷中将其呈现为 `sessionId`，这样调用方就可以对后续搜索分组。由
  Parallel 生成的会话 ID（调用方未提供的 ID）会从
  缓存条目中排除，因为查询相同的不相关任务不应
  继承它。
- 当存在时，来自 Parallel 的 `searchId`、`warnings` 和 `usage` 会被透传。
- OpenClaw 始终会将解析后的结果数量作为
  `advanced_settings.max_results`（`parallel`）转发给 Parallel，或在 Parallel 的固定大小响应之后
  在客户端侧应用 `count`
  （`parallel-free`）。调用方的 `count` 参数优先，其次是 `tools.web.search.maxResults`，否则使用
  OpenClaw 通用 `web_search` 默认值（5）-- Parallel 自身 API 默认值为
  10。
- 结果默认缓存 15 分钟（`cacheTtlMinutes`）。
- 当调用方未提供时，`parallel-free` 会通过其 MCP 握手为每次调用铸造一个新的 `session_id`；
  `parallel` 在这种情况下会保持未设置。

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Exa 搜索](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索
- [Perplexity 搜索](/zh-CN/tools/perplexity-search) -- 带域名过滤的结构化结果
