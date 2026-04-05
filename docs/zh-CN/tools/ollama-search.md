---
read_when:
    - 你想将 Ollama 用于 `web_search`
    - 你想要一个无需密钥的 `web_search` 提供商
    - 你需要 Ollama Web 搜索的设置指南
summary: 通过你已配置的 Ollama 主机使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-04-05T10:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。
它使用 Ollama 的实验性 Web 搜索 API，并返回结构化结果，
包含标题、URL 和摘要片段。

与 Ollama 模型提供商不同，此设置默认不需要 API 密钥。
但它需要：

- 一个 OpenClaw 可访问的 Ollama 主机
- `ollama signin`

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

如果你已经使用 Ollama 运行模型，Ollama Web 搜索会复用同一个
已配置主机。

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
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

如果未显式设置 Ollama base URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机需要 bearer 认证，OpenClaw 也会为 Web 搜索请求
复用 `models.providers.ollama.apiKey`（或匹配的基于环境变量的提供商认证）。

## 说明

- 该提供商不需要专门的 Web 搜索 API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用常规 Ollama
  提供商 API 密钥。
- 如果 Ollama 不可达或未登录，OpenClaw 会在设置期间发出警告，但
  不会阻止你选择它。
- 当未配置更高优先级、带凭证的提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 该提供商使用 Ollama 的实验性 `/api/experimental/web_search`
  端点。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置及云端/本地模式
