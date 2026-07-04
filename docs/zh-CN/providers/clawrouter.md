---
read_when:
    - 你想为多个模型提供商使用一个托管密钥
    - 你需要在 OpenClaw 中使用 ClawRouter 模型发现或配额报告
summary: 通过 ClawRouter 路由凭证作用域模型并显示托管配额
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 为 OpenClaw 提供一个按策略限定范围的密钥，用于多个上游模型
提供商。内置插件只会发现该密钥允许的模型，
通过每个模型声明的协议进行路由，并在 OpenClaw 用量界面上报告该密钥的预算
和聚合用量。

你不需要在 OpenClaw 主机上安装或认证每个上游提供商插件。
上游凭证和特定于提供商的转发保留在
ClawRouter 中。OpenClaw 只需要内置的 `@openclaw/clawrouter` 插件和一个
已签发的 ClawRouter 凭证。

| 属性      | 值                                    |
| ------------- | ---------------------------------------- |
| 提供商      | `clawrouter`                             |
| 包       | `@openclaw/clawrouter`                   |
| 凭证          | `CLAWROUTER_API_KEY`                     |
| 默认 URL   | `https://clawrouter.openclaw.ai`         |
| 模型目录 | 通过 `/v1/catalog` 按凭证限定范围      |
| 配额        | 通过 `/v1/usage` 提供月度预算和用量 |

## 入门指南

<Steps>
  <Step title="获取限定范围的凭证">
    向你的 ClawRouter 管理员索取一个凭证，其策略应包含
    你应使用的提供商、模型和月度预算。凭证在签发时只会显示一次。
  </Step>
  <Step title="配置 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    该插件随 OpenClaw 内置。如果你的配置设置了
    `plugins.allow`，请先将 `clawrouter` 添加到该列表，再启用它。对于
    自定义部署，请将 `models.providers.clawrouter.baseUrl` 设置为
    ClawRouter 源站；默认值为 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授权的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    请完全按返回结果所示使用模型 ref。它们会保留上游
    命名空间，例如 `clawrouter/openai/...`、`clawrouter/anthropic/...` 或
    `clawrouter/google/...`。如果你的
    配置中 `agents.defaults.models` 是允许列表，请将每个选定的 ClawRouter ref 添加进去。

  </Step>
  <Step title="选择模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以通过
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` 为单次运行选择返回的模型。

  </Step>
</Steps>

## 模型发现

`GET /v1/catalog` 是事实来源。OpenClaw 不会随附第二份
固定的 ClawRouter 模型列表。在以下情况下，ClawRouter 中配置的模型会出现：

- 凭证策略授予其提供商；
- 提供商连接已启用且就绪；
- 目录模型声明了受支持的 LLM 能力；并且
- 目录暴露了插件支持的传输契约。

因此，向受支持的 ClawRouter 提供商添加另一个模型
不需要 OpenClaw 发布版本或另一个提供商插件。下一次目录
刷新会发现它。需要新线缆协议的模型需要先在
ClawRouter 插件中获得支持，OpenClaw 才会展示它。

## 协议和提供商插件

你不需要安装每个上游公司的认证插件。ClawRouter
负责上游凭证；其目录会告诉 OpenClaw 使用哪种传输。
该插件支持：

| 目录路由                  | OpenClaw 传输     |
| ------------------------------ | ---------------------- |
| OpenAI 兼容聊天         | `openai-completions`   |
| OpenAI 兼容 Responses    | `openai-responses`     |
| 原生 Anthropic Messages      | `anthropic-messages`   |
| 原生 Google Gemini 流式传输 | `google-generative-ai` |

该插件还会为这些
系列应用匹配的重放和工具架构策略。使用其他请求/流格式的目录行会被有意
不展示为 OpenClaw 文本模型。请在 ClawRouter 中将这些提供商
规范化为受支持契约之一，而不是发送不兼容的负载。

## 配额和用量

ClawRouter 的 `/v1/usage` 响应会馈送到常规 OpenClaw 提供商用量
界面。`/status` 和相关仪表板状态会在密钥具有限额时显示月度预算窗口，
以及请求、Token 和花费总计。不计量密钥
仍会显示聚合用量，但没有百分比窗口。

配额查询使用与模型发现相同的限定范围密钥。配额查询失败
不会阻止模型执行。

使用以下命令检查实时快照：

```bash
openclaw status --usage
openclaw models status
```

同一提供商快照也可用于聊天中的 `/status` 和 OpenClaw 的
用量 UI。预算是策略范围的，因此另一个客户端使用
同一 ClawRouter 策略发出的请求可能会改变剩余百分比。

## 故障排除

| 现象                                  | 检查                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 没有 ClawRouter 模型                     | 确认插件已启用且被 `plugins.allow` 允许，然后检查凭证是否处于活动状态并授予至少一个就绪的提供商。 |
| 配置的 ClawRouter 模型缺失 | 检查其 `/v1/catalog` 能力和路由格式。不支持的传输契约会被有意过滤。                             |
| `Unknown model: clawrouter/...`          | 当该配置映射被用作允许列表时，将确切的目录 ref 添加到 `agents.defaults.models`。                               |
| 目录或用量返回 `401` 或 `403`     | 重新签发 ClawRouter 凭证或重新限定其范围；OpenClaw 不会回退到上游提供商密钥。                                          |
| 模型调用在发现后失败         | 检查 ClawRouter 中的提供商连接和上游健康状况，然后在其就绪状态恢复后重试。                                |
| 用量有总计但没有百分比       | 该策略未计量；在 ClawRouter 中添加月度预算以暴露百分比窗口。                                                     |

## 安全行为

- 目录发现限定于配置的代理密钥范围，并按密钥缓存。
- 代理密钥只在请求分发时附加；它不会存储在模型元数据中。
- 原生 Anthropic 和 Gemini 模型 ID 只在分发时改写为其上游 ID。
- 不支持或未授权的目录行会以关闭方式失败，且不可选择。

## 相关

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置和模型选择。
  </Card>
  <Card title="用量跟踪" href="/zh-CN/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量和状态界面。
  </Card>
</CardGroup>
