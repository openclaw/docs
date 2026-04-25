---
read_when:
    - 你想使用 Ollama 进行 web_search
    - 你想要一个无需密钥的 web_search 提供商
    - 你需要 Ollama Web 搜索的设置指南
summary: 通过你配置的 Ollama 主机使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-04-25T21:40:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。它使用 Ollama 的网页搜索 API，并返回包含标题、URL 和摘要的结构化结果。

与 Ollama 模型提供商不同，此设置默认不需要 API 密钥。但它需要：

- 一个可从 OpenClaw 访问的 Ollama 主机
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

如果你的 Ollama 主机要求 bearer 身份验证，OpenClaw 也会将 `models.providers.ollama.apiKey`（或对应的由环境变量支持的提供商身份验证）复用于网页搜索请求。

## 说明

- 此提供商不需要专门的网页搜索 API 密钥字段。
- 如果 Ollama 主机受身份验证保护，OpenClaw 会在存在时复用常规 Ollama 提供商 API 密钥。
- 如果 Ollama 不可访问或尚未登录，OpenClaw 会在设置期间发出警告，但不会阻止选择。
- 当未配置更高优先级的带凭证提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 该提供商使用 Ollama 的 `/api/web_search` 端点。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置以及云端/本地模式
