---
read_when:
    - 你想要无需 API 密钥的网页搜索
    - 你需要 Parallel 的付费 Search API
    - 你需要按 LLM 上下文效率排序的密集摘录
summary: Parallel 搜索 -- 面向 LLM 优化的 Web 来源密集摘录
title: Parallel 搜索
x-i18n:
    generated_at: "2026-06-27T03:30:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 插件提供两个 [Parallel](https://parallel.ai/) `web_search` 提供商：

- **Parallel 搜索（免费）** (`parallel-free`) -- Parallel 的免费
  [搜索 MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)。不需要
  账号或 API key。当你想使用 Parallel 托管的免 key 搜索路径时，请显式选择它。
- **Parallel 搜索** (`parallel`) -- Parallel 的付费搜索 API。需要
  `PARALLEL_API_KEY`，并提供更高的速率限制和目标调优。

两者都会从为 AI 智能体构建的 Web 索引中返回排序后的、面向 LLM 优化的摘录。
将 `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel`，即可显式选择其中之一。

<Note>
  当 `tools.web.search.provider` 未设置时，OpenAI Responses 模型会使用 OpenAI 的原生 Web 搜索，
  因此会绕过 Parallel 提供商。将 `tools.web.search.provider` 设置为 `parallel-free` 或 `parallel`，
  即可让它们通过 Parallel 路由。
</Note>

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API key（付费提供商）

`parallel-free` 不需要 API key，但仍必须作为托管提供商被选中。付费的 `parallel` 提供商需要 API key：

<Steps>
  <Step title="创建账号">
    在 [platform.parallel.ai](https://platform.parallel.ai) 注册，并从你的仪表板生成 API key。
  </Step>
  <Step title="存储 key">
    在 Gateway 网关环境中设置 `PARALLEL_API_KEY`，或通过以下方式配置：

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
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**环境替代方式：**在 Gateway 网关环境中设置 `PARALLEL_API_KEY`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## 基础 URL 覆盖

基础 URL 覆盖仅适用于付费的 `parallel` 提供商。免费的
`parallel-free` 提供商始终使用 `https://search.parallel.ai/mcp`。

当 Parallel 请求应通过兼容代理或备用 Parallel 端点（例如 Cloudflare AI Gateway）时，
设置 `plugins.entries.parallel.config.webSearch.baseUrl`。OpenClaw 会通过前置 `https://`
规范化裸主机，并追加 `/v1/search`，除非路径已经以它结尾。解析后的端点会包含在搜索缓存键中，
因此来自不同 Parallel 端点的结果不会共享。

## 工具参数

OpenClaw 暴露 Parallel 的原生搜索形状，让模型能够同时填写自然语言目标和几个简短的关键词查询，
这是 Parallel [推荐](https://docs.parallel.ai/search/best-practices) 的最佳结果配对方式。

<ParamField path="objective" type="string" required>
底层问题或目标的自然语言描述（最多 5000 个字符）。应当自包含。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
简洁的关键词搜索查询，每条 3-6 个词（1-5 条，每条最多 200 个字符）。
为获得最佳结果，请提供 2-3 条多样化查询。
</ParamField>

<ParamField path="count" type="number">
要返回的结果数（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
可选的 Parallel 会话 id（`parallel` 最多 1000 个字符；免费的
`parallel-free` Search MCP 将其限制为 100 个字符）。对于同一任务的一部分后续搜索，
传入上一个 Parallel 结果中的 `sessionId`，以便 Parallel 可以对相关调用分组并改进后续结果。
超过限制的 id 会被丢弃，并生成一个新的 id。
</ParamField>

<ParamField path="client_model" type="string">
发起调用的模型的可选标识符（例如 `claude-opus-4-7`、`gpt-5.5`）。
让 Parallel 能够根据你的模型能力定制默认设置。传入确切的活动模型 slug；
不要缩短为系列别名。
</ParamField>

## 说明

- Parallel 会根据 LLM 推理效用对结果进行排序和压缩，而不是根据人类点击率；预期每个结果中会有密集摘录，而不是完整页面内容
- 结果摘录会作为 `excerpts` 数组返回，也会合并到 `description` 字段中，以兼容通用 `web_search` 合约
- Parallel 会在每个响应中返回 `session_id`；OpenClaw 会在工具载荷中将其公开为 `sessionId`，以便调用方对后续搜索分组
- Parallel 返回的 `searchId`、`warnings` 和 `usage` 在存在时会透传
- OpenClaw 始终将解析后的结果数作为 `advanced_settings.max_results` 转发给 Parallel。调用方的 `count` 参数优先，其次是顶层 `tools.web.search.maxResults` 设置，否则使用 OpenClaw 的通用 `web_search` 默认值（5）。这能在切换提供商时保持结果量一致；Parallel 自身默认值为 10
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）
- 免费的 `parallel-free` 提供商接受相同参数。它会在客户端应用 `count`，并在未提供时为每次调用生成一个 `session_id`。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Exa 搜索](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索
- [Perplexity 搜索](/zh-CN/tools/perplexity-search) -- 带域过滤的结构化结果
