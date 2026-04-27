---
read_when:
    - 你想使用 Ollama 进行 `web_search`
    - 你想要一个无需密钥的 `web_search` 提供商
    - 你想使用带有 `OLLAMA_API_KEY` 的托管 Ollama Web 搜索
    - 你需要 Ollama Web 搜索设置指南
summary: 通过本地 Ollama 主机或托管的 Ollama API 使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-04-27T01:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c20b2405dab06f091ed636a8cc1f5e85a2f9e7ac62489db28c8f9ec9fee8357
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。它使用 Ollama 的网页搜索 API，并返回包含标题、URL 和摘要的结构化结果。

对于本地或自托管的 Ollama，此设置默认不需要 API 密钥。但它确实需要：

- 一个可从 OpenClaw 访问的 Ollama 主机
- `ollama signin`

对于直接使用托管搜索，请将 Ollama 提供商基础 URL 设置为 `https://ollama.com`，并提供真实的 `OLLAMA_API_KEY`。

## 设置

<Steps>
  <Step title="启动 Ollama">
    确保 Ollama 已安装并正在运行。
  </Step>
  <Step title="登录">
    运行：

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="选择 Ollama Web 搜索">
    运行：

    ```bash
    openclaw configure --section web
    ```

    然后选择 **Ollama Web 搜索** 作为提供商。

  </Step>
</Steps>

如果你已经使用 Ollama 作为模型，Ollama Web 搜索会复用同一个已配置的主机。

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

可选的 Ollama 主机覆盖：

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

如果你已经将 Ollama 配置为模型提供商，网页搜索提供商也可以改为复用该主机：

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

如果没有设置显式的 Ollama 基础 URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机需要 bearer 认证，OpenClaw 会复用
`models.providers.ollama.apiKey`（或对应的由环境变量支持的提供商认证）
来向该已配置主机发出请求。

直接使用托管 Ollama Web 搜索：

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

## 说明

- 此提供商不需要专门的网页搜索 API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用常规 Ollama 提供商 API 密钥。
- 如果 `baseUrl` 是 `https://ollama.com`，OpenClaw 会直接调用
  `https://ollama.com/api/web_search`，并将已配置的 Ollama API 密钥作为 bearer 认证发送。
- 如果已配置主机未暴露网页搜索功能且设置了 `OLLAMA_API_KEY`，OpenClaw 可以回退到 `https://ollama.com/api/web_search`，且不会将该环境变量密钥发送到本地主机。
- 如果 Ollama 不可访问或未登录，OpenClaw 会在设置期间发出警告，但不会阻止你进行选择。
- 当未配置更高优先级的、带凭证的提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 本地 Ollama 守护进程主机会使用本地代理端点
  `/api/experimental/web_search`，由其签名并转发到 Ollama Cloud。
- `https://ollama.com` 主机会直接使用公开的托管端点
  `/api/web_search`，并使用 bearer API 密钥认证。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置以及云端/本地模式
