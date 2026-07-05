---
read_when:
    - 你想为多个模型提供商使用一个托管密钥
    - 你需要在 OpenClaw 中使用 ClawRouter 模型发现或配额报告
summary: 通过 ClawRouter 路由凭证作用域内的模型，并显示托管配额
title: ClawRouter
x-i18n:
    generated_at: "2026-07-05T11:34:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 888516e7b7c8bd25e15c9506e6b10f0b4847274755cc72377cb06415a55cb988
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 为 OpenClaw 提供一个按策略限定范围的密钥，用于访问多个上游模型提供商。内置的 `clawrouter` 插件只发现该密钥允许的模型，通过每个模型声明的协议进行路由，并在 OpenClaw 用量界面上报告该密钥的预算和汇总用量。

上游凭据和特定提供商的转发保留在 ClawRouter 中，因此你无需在 OpenClaw 主机上安装或认证每个上游提供商插件。该插件随 OpenClaw 内置发布（`enabledByDefault: true`）；你只需要一个已签发的 ClawRouter 凭据。

| 属性          | 值                                       |
| ------------- | ---------------------------------------- |
| 提供商        | `clawrouter`                             |
| 插件          | 内置（包含在 OpenClaw 中）               |
| 认证          | `CLAWROUTER_API_KEY`                     |
| 默认 URL      | `https://clawrouter.openclaw.ai`         |
| 模型目录      | 通过 `/v1/catalog` 按凭据限定范围        |
| 配额          | 通过 `/v1/usage` 获取月度预算和用量      |

## 入门指南

<Steps>
  <Step title="获取限定范围的凭据">
    向你的 ClawRouter 管理员索取一个凭据，其策略应包含你应使用的提供商、模型和月度预算。凭据在签发时只显示一次。
  </Step>
  <Step title="配置 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 是内置插件，并默认启用。如果你的配置设置了 `plugins.allow`，请在启用它之前将 `clawrouter` 添加到该列表。对于自定义部署，请将 `models.providers.clawrouter.baseUrl` 设置为 ClawRouter 源站；默认值为 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授权的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    请按返回内容原样使用模型引用。它们会保留上游命名空间，例如 `clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6` 或 `clawrouter/google/gemini-3.5-flash`。如果你的配置中 `agents.defaults.models` 是允许列表，请将每个选定的 ClawRouter 引用添加进去。

  </Step>
  <Step title="选择模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."` 为单次运行选择一个返回的模型。

  </Step>
</Steps>

## 模型发现

`GET /v1/catalog` 返回 `{ providers: [...] }`，其中每个提供商条目会列出自己的 `models[]`（包含上游 id、能力和定价）及其支持的请求路由。OpenClaw 不会发布第二份固定的 ClawRouter 模型列表。目录模型在满足以下条件时会作为 OpenClaw 模型公布：

- 凭据策略授予其提供商；
- 目录模型声明了受支持的 LLM 能力（`llm.responses`、`llm.chat`、`llm.messages`，或带有匹配流式路由的 `llm.stream`）；并且
- 提供商为以下传输协议之一公开了匹配路由。

向受支持的 ClawRouter 提供商添加模型不需要发布 OpenClaw：下一次目录刷新（按凭据范围缓存 60 秒）会发现它。需要新线路协议的模型必须先获得插件支持。

## 协议和提供商插件

ClawRouter 拥有上游凭据；它的目录会告诉 OpenClaw 使用哪种传输协议，因此你无需安装每个上游公司的认证插件。

| 目录能力 / 路由                                          | OpenClaw 传输协议       |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（兼容 OpenAI 的提供商）                  | `openai-responses`     |
| `llm.chat`（兼容 OpenAI 的提供商）                       | `openai-completions`   |
| `llm.messages` + `anthropic.messages` 路由               | `anthropic-messages`   |
| `llm.stream` + 流式 `google.generate_content` 路由       | `google-generative-ai` |

该插件还会为这些系列应用匹配的重放和工具架构策略（OpenAI/DeepSeek/Gemini 工具架构兼容性；原生 Anthropic 和 Google Gemini 重放策略）。只公开不受支持请求格式的目录提供商会被有意过滤，不会作为 OpenClaw 文本模型公布。请在 ClawRouter 中将这些提供商规范化为受支持的合约之一，而不是发送不兼容的载荷。

## 配额和用量

ClawRouter 的 `/v1/usage` 响应会填充常规 OpenClaw 提供商用量界面：请求、token 和支出总计，以及当密钥有限额时的月度预算窗口。未计量的密钥仍会显示汇总用量，但不会显示百分比窗口。

配额查询使用与模型发现相同的限定范围密钥。配额查询失败不会阻止模型执行。

使用以下命令查看实时快照：

```bash
openclaw status --usage
openclaw models status
```

同一个提供商快照也可用于聊天中的 `/status` 和 OpenClaw 的用量 UI。预算按策略范围计算，因此使用同一 ClawRouter 策略的其他客户端发出的请求可能会改变剩余百分比。

## 故障排查

| 症状                                     | 检查                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 没有 ClawRouter 模型                     | 确认插件已启用，并且被 `plugins.allow` 允许，然后检查凭据是否有效且授予至少一个就绪的提供商。                                                |
| 配置的 ClawRouter 模型缺失              | 检查其 `/v1/catalog` 能力和路由支持。不受支持的传输合约会被有意过滤。                                                                         |
| `Unknown model: clawrouter/...`          | 当该配置映射被用作允许列表时，将精确的目录引用添加到 `agents.defaults.models`。                                                               |
| 目录或用量返回 `401` 或 `403`            | 重新签发或重新限定 ClawRouter 凭据范围；OpenClaw 不会回退到上游提供商密钥。                                                                  |
| 模型在发现后调用失败                     | 检查 ClawRouter 中的提供商连接和上游健康状态，然后在其就绪状态恢复后重试。                                                                   |
| 用量有总计但没有百分比                   | 该策略未计量；在 ClawRouter 中添加月度预算以公开百分比窗口。                                                                                  |

## 安全行为

- 目录发现限定在配置的代理密钥范围内，并按凭据范围缓存（Agent 目录、工作区目录、认证配置文件 id 和基础 URL）。
- 代理密钥只在请求分发时附加；它不会存储在模型元数据中。
- 原生 Anthropic 和 Gemini 模型 id 只在分发时重写为其上游 id。
- 不受支持或未授权的目录行会失败关闭，且不可选择。

## 相关

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置和模型选择。
  </Card>
  <Card title="用量跟踪" href="/zh-CN/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量和状态界面。
  </Card>
</CardGroup>
