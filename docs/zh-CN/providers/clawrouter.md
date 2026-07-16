---
read_when:
    - 你希望使用一个托管密钥访问多个模型提供商
    - 你需要在 OpenClaw 中使用 ClawRouter 模型发现或配额报告功能
summary: 通过 ClawRouter 路由凭据范围限定的模型，并显示托管配额
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T11:51:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 为 OpenClaw 提供一个受策略范围约束的密钥，用于访问多个上游模型提供商。内置的 `clawrouter` 插件仅发现该密钥允许使用的模型，通过每个模型声明的协议进行路由，并在 OpenClaw 的用量界面上报告该密钥的预算和汇总用量。

上游凭据和提供商特定的转发逻辑均保留在 ClawRouter 中，因此无需在 OpenClaw 主机上安装每个上游提供商插件或分别进行身份验证。该插件随 OpenClaw 内置提供（`enabledByDefault: true`）；只需获得已签发的 ClawRouter 凭据。

| 属性          | 值                                       |
| ------------- | ---------------------------------------- |
| 提供商        | `clawrouter`                       |
| 插件          | 内置（包含在 OpenClaw 中）               |
| 身份验证      | `CLAWROUTER_API_KEY`                       |
| 默认 URL      | `https://clawrouter.openclaw.ai`                       |
| 模型目录      | 通过 `/v1/catalog` 按凭据限定范围   |
| 配额          | 通过 `/v1/usage` 获取月度预算和用量 |

## 入门指南

<Steps>
  <Step title="获取受范围约束的凭据">
    向 ClawRouter 管理员申请凭据，其策略应包含需要使用的提供商、模型和月度预算。凭据签发时仅显示一次。
  </Step>
  <Step title="配置 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 已内置且默认启用。如果配置设置了
    `plugins.allow`，请先将 `clawrouter` 添加到该列表，再启用它。对于自定义部署，请将 `models.providers.clawrouter.baseUrl` 设置为
    ClawRouter 源站；默认值为 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出获准使用的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    请完全按照返回结果使用模型引用。它们会保留上游命名空间，例如 `clawrouter/openai/gpt-5.5`、
    `clawrouter/anthropic/claude-sonnet-4-6` 或
    `clawrouter/google/gemini-3.5-flash`。如果配置中的 `agents.defaults.models` 是允许列表，请将每个选定的 ClawRouter 引用添加到其中。

  </Step>
  <Step title="选择模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    也可以使用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."`，为单次运行选择返回的模型。

  </Step>
</Steps>

## 托管式非交互部署

将代理密钥保存在工作负载的密钥注入机制中，并且只在 `openclaw.json` 中存储 SecretRef。规范的托管字段如下：

| 用途          | 配置或环境字段                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器源站    | `models.providers.clawrouter.baseUrl`                                                       |
| 凭据          | `models.providers.clawrouter.apiKey` -> 环境变量 SecretRef                                 |
| 密钥值        | Gateway 网关进程环境中的 `CLAWROUTER_API_KEY`                              |
| 默认模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                 |
| 工作负载标签  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（可选）                                               |

例如，部署控制器可以管理以下 JSON5 补丁：

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

如果部署设置了 `plugins.allow`，请保留其现有条目并添加 `clawrouter`。无需交互式向导即可验证并应用：

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

试运行会解析 SecretRef，但绝不会打印其值。要轮换凭据，请更新为 `CLAWROUTER_API_KEY` 提供值的外部 Secret，并重启 Gateway 网关工作负载，以加载新的进程环境。配置文件和模型引用无需更改。

对于从源码构建的独立 Docker Gateway 网关，ClawRouter 已包含在根运行时中。仅选择需要单独打包的渠道插件，例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；请参阅[包含选定插件的源码构建镜像](/zh-CN/install/docker#source-built-images-with-selected-plugins)。
归档/设备部署必须通过自身的工件流水线打包相同的已落地源码，而不能使用 OCI 镜像。

## 就绪状态和实时验证

以下检查验证不同的边界；请勿相互替代：

```bash
# 仅检查 ClawRouter 进程健康状态；不会使用凭据或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 仅检查 OpenClaw Gateway 网关启动就绪状态；不会调用模型。
curl -fsS http://127.0.0.1:18789/readyz

# 按凭据限定范围的模型目录发现。
openclaw models list --all --provider clawrouter --json

# 通过已配置的 ClawRouter 提供商执行最小真实推理探测。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用确切的获准模型引用执行工作负载金丝雀测试。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "请严格回复：CLAWROUTER_CANARY_OK" \
  --json
```

请使用受范围约束的模型目录返回的模型，不要直接照搬示例模型。成功的 `/readyz` 响应表示 Gateway 网关可以处理请求；这并不代表 ClawRouter、其凭据或上游提供商已就绪。模型探测和智能体金丝雀测试才是推理验证。

进行实时诊断时，请发出金丝雀请求并检查 Gateway 网关的标准日志。现有的仅元数据模型传输诊断会生成如下格式的日志行：

```text
[model-fetch] 启动 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 响应 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

当这些标识符可用时，插件会发送长度受限的 `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 和
`X-ClawRouter-Session-Id` 标头。它还会将模型调用的诊断 `callId`（`<run-id>:model:<n>`）映射到
`X-Request-ID`，从而可以将 OpenClaw 模型调用事件与 ClawRouter 的仅元数据审计轨迹关联起来。处于 128 字符请求 ID 限制以内的值保持完全一致。更长的值会保留 `:model:<n>` 后缀和确定性哈希，以确保不同调用的长度受限且仍可关联。可以在提供商的 `headers` 映射中设置 `X-ClawRouter-Project-Id` 等静态部署元数据。
智能体和会话归属标头仍分别采用 256 字符限制。包含 ClawRouter ASCII 标识符集合之外字符的自动请求 ID 使用相同的确定性长度限制形式。
显式配置的标头（包括 `X-Request-ID` 的任何大小写变体）优先于自动值。传输诊断会记录路由和响应元数据；不会记录凭据、请求 ID、提示词或补全内容。
ClawRouter 自身的审计事件会提供选定的上游提供商和内容保留状态。

## 模型发现

`GET /v1/catalog` 返回 `{ providers: [...] }`，其中每个提供商条目都会列出其自身的 `models[]`（包括上游 ID、能力和定价）及其支持的请求路由。OpenClaw 不会附带另一份固定的 ClawRouter 模型列表。当满足以下条件时，目录模型会作为 OpenClaw 模型公布：

- 凭据策略授予对其提供商的访问权限；
- 目录模型声明支持的 LLM 能力（`llm.responses`、
  `llm.chat`、`llm.messages`，或具有匹配流式路由的 `llm.stream`）；并且
- 提供商为下列传输协议之一公开匹配的路由。

向受支持的 ClawRouter 提供商添加模型无需发布新的 OpenClaw 版本：下一次模型目录刷新（每个凭据范围缓存 60 秒）便会发现该模型。需要新线路协议的模型必须先获得插件支持。

## 协议和提供商插件

ClawRouter 管理上游凭据；其模型目录会告知 OpenClaw 应使用哪种传输协议，因此无需安装每家上游公司的身份验证插件。

| 模型目录能力/路由                                      | OpenClaw 传输协议       |
| ------------------------------------------------------ | ----------------------- |
| `llm.responses`（OpenAI 兼容提供商）                | `openai-responses`      |
| `llm.chat`（OpenAI 兼容提供商）                | `openai-completions`      |
| `llm.messages` + `anthropic.messages` 路由           | `anthropic-messages`      |
| `llm.stream` + 流式 `google.generate_content` 路由      | `google-generative-ai`      |

插件还会为这些系列应用匹配的重放策略和工具架构策略（OpenAI/DeepSeek/Gemini/Perplexity 工具架构兼容性；原生 Anthropic 和 Google Gemini 重放策略）。Perplexity 模型会进行严格的架构重写：移除 `patternProperties` 和 `additionalProperties`，并且每个对象架构都会声明 `properties`，因为 Perplexity 会拒绝缺少这些声明的工具架构。仅公开不受支持请求格式的目录提供商不会被公布为 OpenClaw 文本模型，这是有意设计的行为。应在 ClawRouter 中将这些提供商规范化为受支持的契约之一，而不是发送不兼容的有效载荷。

## 配额和用量

ClawRouter 的 `/v1/usage` 响应会填充常规 OpenClaw 提供商用量界面：请求数、Token 数和支出总额；当密钥设有额度时，还会显示月度预算周期。不限量密钥仍会显示汇总用量，但不会显示百分比周期。

配额查询使用与模型发现相同的受范围约束密钥。配额查询失败不会阻止模型执行。

使用以下命令检查实时快照：

```bash
openclaw status --usage
openclaw models status
```

同一提供商快照也可供聊天中的 `/status` 和 OpenClaw 用量 UI 使用。预算适用于整个策略范围，因此使用同一 ClawRouter 策略的其他客户端发出的请求可能会改变剩余百分比。

## 故障排查

| 症状                                     | 检查                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 没有 ClawRouter 模型                     | 确认插件已启用且获得 `plugins.allow` 允许，然后检查凭据是否有效，以及是否授予至少一个已就绪提供商的访问权限。                                    |
| 配置的 ClawRouter 模型缺失               | 检查其 `/v1/catalog` 能力和路由支持情况。不受支持的传输协议契约会被有意过滤。                                                                  |
| `Unknown model: clawrouter/...`                       | 当该配置映射用作允许列表时，将确切的模型目录引用添加到 `agents.defaults.models`。                                                                         |
| 模型目录或用量返回 `401` 或 `403` | 重新签发 ClawRouter 凭据或调整其范围；OpenClaw 不会回退到上游提供商密钥。                                                     |
| 模型发现后调用失败                       | 在 ClawRouter 中检查提供商连接和上游健康状态，待其恢复就绪后重试。                                                                                   |
| 用量有总计但没有百分比                   | 该策略不限量；请在 ClawRouter 中添加月度预算以显示百分比周期。                                                                                       |

## 安全行为

- 目录发现的范围限定为已配置的代理密钥，并按凭证范围（Agent 目录、工作区目录、身份验证配置文件 ID 和基础 URL）分别缓存。
- 代理密钥仅在请求分派时附加；不会存储在模型元数据中。
- 自动归属信息和请求关联值在分派前会去除首尾空白，并拒绝包含控制字符的值。归属信息值上限为 256 个字符；请求 ID 上限为 128 个字符。
- 模型传输诊断仅包含元数据，绝不包含代理密钥或模型内容。
- 原生 Anthropic 和 Gemini 模型 ID 仅在分派时重写为其上游 ID。
- 不受支持或未获授权的目录条目将以失败关闭方式处理，且不可选择。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置和模型选择。
  </Card>
  <Card title="用量跟踪" href="/zh-CN/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量和状态界面。
  </Card>
</CardGroup>
