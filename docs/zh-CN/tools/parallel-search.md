---
read_when:
    - 你希望无需 API key 即可使用 Web 搜索
    - 你想使用 Parallel 的付费搜索 API
    - 你希望获得按 LLM 上下文效率排序的高密度摘录
summary: Parallel 搜索 -- 来自 Web 来源、针对 LLM 优化的高密度摘录
title: Parallel 搜索
x-i18n:
    generated_at: "2026-07-12T14:48:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 插件提供两个 [Parallel](https://parallel.ai/) `web_search`
提供商，两者都会从专为 AI 智能体构建的 Web 索引中返回经过排序、针对 LLM 优化的摘要：

| 提供商               | id              | 身份验证                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search（免费） | `parallel-free` | 无 -- Parallel 的免费 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 付费 Search API，具有更高的速率限制和目标调优功能             |

将 `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel` 可显式选择
其中一个；两者都不会被自动检测。

<Note>
  直接使用 OpenAI Responses 的模型（`api: "openai-responses"`、提供商
  `openai`、官方 API 基础 URL）会在 `tools.web.search.provider` 未设置、为空、设为 `"auto"`
  或 `"openai"` 时自动使用 OpenAI 托管的原生 Web 搜索
  -- 因此默认会绕过 Parallel。将
  `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel`，即可改为通过
  Parallel 路由。请参阅 [Web 搜索概览](/zh-CN/tools/web)。
</Note>

## 安装插件

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API key（付费提供商）

`parallel-free` 不需要密钥，但仍须显式选择。付费
`parallel` 提供商需要 API key：

<Steps>
  <Step title="创建账户">
    在 [platform.parallel.ai](https://platform.parallel.ai) 注册，并从
    仪表板生成 API key。
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
            apiKey: "par-...", // 如果已设置 PARALLEL_API_KEY，则可选
            baseUrl: "https://api.parallel.ai", // 可选；OpenClaw 会追加 /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // 免费 Search MCP 使用 "parallel-free"，此处所示的付费 API
        // 支持的提供商使用 "parallel"。
        provider: "parallel",
      },
    },
  },
}
```

**环境变量替代方案：**在 Gateway 网关环境中设置 `PARALLEL_API_KEY`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 基础 URL 覆盖

仅适用于付费 `parallel` 提供商；`parallel-free` 始终使用
`https://search.parallel.ai/mcp`，并忽略此设置。

设置 `plugins.entries.parallel.config.webSearch.baseUrl`，以通过兼容代理或备用端点（例如
Cloudflare AI Gateway）路由付费请求。OpenClaw 会在裸主机前添加
`https://` 以进行规范化，并追加 `/v1/search`，除非路径已以该内容结尾。
解析后的端点是搜索缓存键的一部分，因此来自不同端点的结果绝不会共享。

## 工具参数

两个提供商都公开 Parallel 的原生搜索结构，以便模型填写一个自然语言目标和若干简短的关键词查询——这是 Parallel
[建议](https://docs.parallel.ai/search/best-practices)的搭配方式，可获得最佳结果。

<ParamField path="objective" type="string" required>
对底层问题或目标的自然语言描述（最多 5000 个字符）。应当自包含。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
简洁的关键词搜索查询，每条 3-6 个词（1-5 条，每条最多 200 个字符）。
为获得最佳结果，请提供 2-3 条多样化的查询。
</ParamField>

<ParamField path="count" type="number">
要返回的结果数（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
可选的 Parallel 会话 ID，来自先前结果的 `sessionId`。在同一任务的
后续搜索中传入该 ID，以便 Parallel 将相关调用分组并改进后续结果。
在 `parallel` 上最多为 1000 个字符；免费的 `parallel-free` Search MCP
将其限制为 100 个字符。超过限制的 ID 会被丢弃（付费）或重新生成
一个新 ID（免费）。
</ParamField>

<ParamField path="client_model" type="string">
发起调用的模型的可选标识符（例如 `claude-opus-4-7`、
`gpt-5.6-sol`），最多 100 个字符。它允许 Parallel 根据你的模型能力
调整默认设置。请传入当前启用模型的准确 slug；不要缩写为系列别名。
</ParamField>

## 说明

- Parallel 会根据对 LLM 推理的实用性对结果进行排序和压缩，而非供人工
  点击浏览；每条结果通常是密集的摘录，而不是完整页面
  内容。
- 结果摘录以 `excerpts` 数组形式返回，同时也会合并到
  `description` 中，以兼容通用 `web_search` 契约。
- 两个提供商都会返回 `session_id`；OpenClaw 在工具载荷中将其公开为 `sessionId`，
  以便调用方对后续搜索进行分组。由 Parallel 生成的会话 ID（即调用方未提供的 ID）
  不会写入缓存条目，因为查询相同但互不相关的任务不应
  继承该 ID。
- Parallel 返回的 `searchId`、`warnings` 和 `usage` 会在
  存在时原样传递。
- OpenClaw 始终向 Parallel 传递解析后的结果数量，方式为
  `advanced_settings.max_results`（`parallel`），或在 Parallel 返回固定大小的响应后，
  在客户端应用 `count`（`parallel-free`）。优先使用调用方的
  `count` 参数，其次是 `tools.web.search.maxResults`，否则使用 OpenClaw 的通用
  `web_search` 默认值（5）——Parallel 自身的 API 默认值为 10。
- 结果默认缓存 15 分钟（`cacheTtlMinutes`）。
- 当调用方未提供时，`parallel-free` 会在每次调用时通过其 MCP 握手生成新的
  `session_id`；在这种情况下，`parallel` 会将其保持为未设置状态。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Exa 搜索](/zh-CN/tools/exa-search) -- 支持内容提取的神经搜索
- [Perplexity 搜索](/zh-CN/tools/perplexity-search) -- 支持域名筛选的结构化结果
