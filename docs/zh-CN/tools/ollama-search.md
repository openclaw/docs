---
read_when:
    - 你想使用 Ollama 进行 web_search
    - 你需要一个免密钥的 web_search 提供商
    - 你想使用带有 OLLAMA_API_KEY 的托管式 Ollama Web 搜索
    - 你需要 Ollama Web 搜索设置指导
summary: 通过本地 Ollama 主机或托管的 Ollama API 使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-07-05T11:46:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw 支持 **Ollama Web 搜索** 作为内置 `web_search` 提供商，
从 Ollama 的 Web 搜索 API 返回标题、URL 和摘要片段。

本地/自托管 Ollama 默认不需要 API key；它需要可访问的
Ollama 主机以及 `ollama signin`。直接使用托管搜索（不使用本地 Ollama）需要
`baseUrl: "https://ollama.com"` 和真实的 `OLLAMA_API_KEY`。

## 设置

<Steps>
  <Step title="启动 Ollama">
    确保 Ollama 已安装并正在运行。
  </Step>
  <Step title="登录">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="选择 Ollama Web 搜索">
    ```bash
    openclaw configure --section web
    ```

    选择 **Ollama Web 搜索** 作为提供商。

  </Step>
</Steps>

如果你已经使用 Ollama 作为模型，Ollama Web 搜索会复用同一个
已配置主机。

<Note>
  OpenClaw 绝不会自动选择 Ollama Web 搜索来替代优先级更高的
  已配置凭证的提供商；你必须通过
  `tools.web.search.provider: "ollama"` 显式选择它。
</Note>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

可选主机覆盖，仅作用于 Web 搜索：

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

或复用已为 Ollama 模型提供商配置的主机：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` 是规范键名；为兼容 OpenAI SDK 风格的
配置示例，Web 搜索提供商也接受其中的 `baseURL`。如果未设置任何内容，OpenClaw 默认使用
`http://127.0.0.1:11434`。

直接使用托管 Ollama Web 搜索（不使用本地 Ollama）：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## 凭证和请求路由

- 不存在 Web 搜索专用的 API key 字段；当配置的主机受凭证保护时，该提供商会复用
  `models.providers.ollama.apiKey`（或匹配的环境变量支持的提供商凭证）。
- 主机解析顺序：`plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl`（或 `baseURL`）→ `http://127.0.0.1:11434`。
- 如果解析后的主机是 `https://ollama.com`，OpenClaw 会直接调用
  `https://ollama.com/api/web_search`，并将 API key 作为 bearer 凭证使用。
- 否则，OpenClaw 会先调用本地代理端点
  `/api/experimental/web_search`（它会签名并转发到 Ollama
  Cloud），然后回退到同一主机上的 `/api/web_search`。如果两者都失败
  且已设置 `OLLAMA_API_KEY`，它会使用该 key 对
  `https://ollama.com/api/web_search` 重试一次，但不会将它发送到
  本地主机。
- 如果 Ollama 不可访问或未登录，OpenClaw 会在设置期间警告，但
  不会阻止你选择该提供商。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置以及云端/本地模式
