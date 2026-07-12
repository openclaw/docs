---
read_when:
    - 你想使用 Exa 进行 web_search
    - 你需要一个 EXA_API_KEY
    - 你需要神经搜索或内容提取
summary: Exa AI 搜索——支持内容提取的神经搜索和关键词搜索
title: Exa 搜索
x-i18n:
    generated_at: "2026-07-11T21:00:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) 是一个 `web_search` 提供商，支持神经、关键词和混合搜索模式，并内置内容提取功能（高亮、文本、摘要）。

## 安装插件

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## 获取 API 密钥

<Steps>
  <Step title="创建账户">
    在 [exa.ai](https://exa.ai/) 注册，并从你的控制面板生成 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下命令配置：

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // 如果已设置 EXA_API_KEY，则可选
            baseUrl: "https://api.exa.ai", // 可选；OpenClaw 会追加 /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**环境变量替代方案：**在 Gateway 网关环境中设置 `EXA_API_KEY`。对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。参阅[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

## 覆盖基础 URL

设置 `plugins.entries.exa.config.webSearch.baseUrl`，可通过兼容代理或备用端点路由 Exa 搜索请求。OpenClaw 会在裸主机名前添加 `https://` 以进行规范化，并追加 `/search`，除非路径已以该部分结尾。解析后的端点是搜索缓存键的一部分，因此不同端点的结果绝不会共享。

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数（1-100，受 Exa 搜索类型限制）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜索模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间筛选条件。不能与 `date_after`/`date_before` 组合使用。
</ParamField>

<ParamField path="date_after" type="string">
返回此日期之后的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
返回此日期之前的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
内容提取选项（见下文）。
</ParamField>

### 内容提取

传入 `contents` 对象以控制结果中提取的内容：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // 完整页面文本
    highlights: { numSentences: 3 }, // 关键句
    summary: true, // AI 摘要
  },
});
```

| 内容选项     | 类型                                                                  | 描述             |
| ------------ | --------------------------------------------------------------------- | ---------------- |
| `text`       | `boolean \| { maxCharacters }`                                        | 提取完整页面文本 |
| `highlights` | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句       |
| `summary`    | `boolean \| { query }`                                                | AI 生成的摘要    |

如果省略 `contents`，Exa 默认使用 `{ highlights: true }`，因此结果中会包含关键句摘录。结果描述会依次优先使用高亮、摘要和完整文本，以最先可用的内容为准。如果 Exa API 响应中包含原始 `highlightScores` 和 `summary` 字段，结果也会保留这些字段。

### 搜索模式

| 模式             | 描述                         |
| ---------------- | ---------------------------- |
| `auto`           | Exa 选择最佳模式（默认）     |
| `neural`         | 基于语义/含义的搜索          |
| `fast`           | 快速关键词搜索               |
| `deep`           | 全面深入搜索                 |
| `deep-reasoning` | 带推理的深入搜索             |
| `instant`        | 最快返回结果                 |

## 说明

- `count` 最大可接受 100，但受 Exa 搜索类型限制。
- 结果默认缓存 15 分钟。配置共享的 `tools.web.search.cacheTtlMinutes`（分钟）和 `tools.web.search.timeoutSeconds`（默认 30 秒），可更改包括 Exa 在内的所有 `web_search` 提供商的缓存时长和请求超时时间。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 支持国家/语言筛选的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 支持域名筛选的结构化结果
