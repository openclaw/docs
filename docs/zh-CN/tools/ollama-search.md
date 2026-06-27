---
read_when:
    - 你想将 Ollama 用于 web_search
    - 你想要一个无需密钥的 `web_search` 提供商
    - 你想使用带有 OLLAMA_API_KEY 的托管 Ollama Web 搜索
    - 你需要 Ollama Web 搜索设置指导
summary: 通过本地 Ollama 主机或托管的 Ollama API 使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-06-27T03:30:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。它使用 Ollama 的 Web 搜索 API，并返回包含标题、URL 和摘要片段的结构化结果。

对于本地或自托管 Ollama，此设置默认不需要 API key。它需要：

- OpenClaw 可以访问的 Ollama 主机
- `ollama signin`

对于直接托管搜索，请将 Ollama 提供商基础 URL 设置为 `https://ollama.com`，并提供真实的 `OLLAMA_API_KEY`。

## 设置

<Steps>
  <Step title="Start Ollama">
    确保 Ollama 已安装并正在运行。
  </Step>
  <Step title="Sign in">
    运行：

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    运行：

    ```bash
    openclaw configure --section web
    ```

    然后选择 **Ollama Web 搜索** 作为提供商。

  </Step>
</Steps>

如果你已经将 Ollama 用于模型，Ollama Web 搜索会复用相同的已配置主机。

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

如果你已经将 Ollama 配置为模型提供商，Web 搜索提供商可以改为复用该主机：

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

Ollama 模型提供商使用 `baseUrl` 作为规范键名。Web 搜索提供商也会识别 `models.providers.ollama` 上的 `baseURL`，以兼容 OpenAI SDK 风格的配置示例。

如果没有设置显式的 Ollama 基础 URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机需要 bearer 认证，OpenClaw 会复用 `models.providers.ollama.apiKey`（或匹配的环境变量支持的提供商凭证）来请求该已配置主机。

直接托管的 Ollama Web 搜索：

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

- 此提供商不需要 Web 搜索专用的 API key 字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在普通 Ollama 提供商 API key 时复用它。
- 如果 `baseUrl` 为 `https://ollama.com`，OpenClaw 会直接调用 `https://ollama.com/api/web_search`，并将已配置的 Ollama API key 作为 bearer 认证发送。
- 如果已配置主机未暴露 Web 搜索且设置了 `OLLAMA_API_KEY`，OpenClaw 可以回退到 `https://ollama.com/api/web_search`，且不会将该环境变量密钥发送到本地主机。
- 如果 Ollama 不可访问或未登录，OpenClaw 会在设置期间发出警告，但不会阻止选择。
- 当未配置更高优先级的凭证提供商时，OpenClaw 不会自动选择 Ollama Web 搜索；请使用 `tools.web.search.provider: "ollama"` 显式选择它。
- 本地 Ollama 守护进程主机使用 local proxy 端点 `/api/experimental/web_search`，该端点会签名并转发到 Ollama Cloud。
- `https://ollama.com` 主机使用公共托管端点 `/api/web_search`，并直接通过 bearer API-key 认证调用。

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置和云端/本地模式
