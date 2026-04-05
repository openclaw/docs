---
read_when:
    - 你想将 Exa 用于 `web_search`
    - 你需要一个 `EXA_API_KEY`
    - 你想使用神经搜索或内容提取
summary: Exa AI 搜索——支持神经搜索和关键词搜索，并带有内容提取
title: Exa 搜索
x-i18n:
    generated_at: "2026-04-05T10:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Exa 搜索

OpenClaw 支持将 [Exa AI](https://exa.ai/) 用作 `web_search` 提供商。Exa
提供神经搜索、关键词搜索和混合搜索模式，并内置内容
提取功能（高亮、文本、摘要）。

## 获取 API 密钥

<Steps>
  <Step title="创建账户">
    在 [exa.ai](https://exa.ai/) 注册，并从你的
    控制台生成一个 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下方式配置：

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
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

**环境变量替代方式：** 在 Gateway 网关环境中设置 `EXA_API_KEY`。
对于 Gateway 网关安装，请将其放在 `~/.openclaw/.env` 中。

## 工具参数

| 参数          | 说明                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `query`       | 搜索查询（必需）                                                           |
| `count`       | 返回结果数（1-100）                                                        |
| `type`        | 搜索模式：`auto`、`neural`、`fast`、`deep`、`deep-reasoning` 或 `instant` |
| `freshness`   | 时间过滤器：`day`、`week`、`month` 或 `year`                               |
| `date_after`  | 此日期之后的结果（YYYY-MM-DD）                                             |
| `date_before` | 此日期之前的结果（YYYY-MM-DD）                                             |
| `contents`    | 内容提取选项（见下文）                                                     |

### 内容提取

Exa 可以在搜索结果旁返回提取出的内容。传入一个 `contents`
对象即可启用：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| 内容选项      | 类型                                                                  | 说明             |
| ------------- | --------------------------------------------------------------------- | ---------------- |
| `text`        | `boolean \| { maxCharacters }`                                        | 提取完整页面文本 |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句子     |
| `summary`     | `boolean \| { query }`                                                | AI 生成的摘要    |

### 搜索模式

| 模式             | 说明                         |
| ---------------- | ---------------------------- |
| `auto`           | Exa 选择最佳模式（默认）     |
| `neural`         | 基于语义/含义的搜索          |
| `fast`           | 快速关键词搜索               |
| `deep`           | 深度全面搜索                 |
| `deep-reasoning` | 带 reasoning 的深度搜索      |
| `instant`        | 最快返回结果                 |

## 说明

- 如果未提供 `contents` 选项，Exa 默认使用 `{ highlights: true }`，
  这样结果会包含关键句摘录
- 当可用时，结果会保留来自 Exa API
  响应中的 `highlightScores` 和 `summary` 字段
- 结果描述会优先从 highlights 解析，其次是 summary，再其次是
  完整文本——以可用者为准
- `freshness` 与 `date_after`/`date_before` 不能组合使用——请只使用一种
  时间过滤模式
- 每个查询最多可返回 100 条结果（受 Exa 搜索类型
  限制）
- 结果默认缓存 15 分钟（可通过
  `cacheTtlMinutes` 配置）
- Exa 是官方 API 集成，提供结构化 JSON 响应

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave 搜索](/tools/brave-search) -- 带国家/语言过滤器的结构化结果
- [Perplexity 搜索](/tools/perplexity-search) -- 带域名过滤的结构化结果
