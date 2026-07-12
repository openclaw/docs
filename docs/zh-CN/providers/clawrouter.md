---
read_when:
    - 你希望使用一个托管密钥访问多个模型提供商
    - 你需要在 OpenClaw 中使用 ClawRouter 模型发现或配额报告
summary: 通过 ClawRouter 路由凭据范围限定的模型，并显示托管配额
title: ClawRouter
x-i18n:
    generated_at: "2026-07-11T20:51:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 为 OpenClaw 提供一个受策略范围约束的密钥，用于访问多个上游模型提供商。内置的 `clawrouter` 插件只发现该密钥获准使用的模型，通过每个模型声明的协议进行路由，并在 OpenClaw 的用量界面中报告该密钥的预算和汇总用量。

上游凭据和提供商特定的转发均保留在 ClawRouter 中，因此无需在 OpenClaw 主机上安装或验证每个上游提供商插件。该插件随 OpenClaw 内置提供（`enabledByDefault: true`）；你只需要一个已签发的 ClawRouter 凭据。

| 属性          | 值                                       |
| ------------- | ---------------------------------------- |
| 提供商        | `clawrouter`                             |
| 插件          | 内置（包含在 OpenClaw 中）               |
| 身份验证      | `CLAWROUTER_API_KEY`                     |
| 默认 URL      | `https://clawrouter.openclaw.ai`         |
| 模型目录      | 通过 `/v1/catalog` 按凭据范围限定         |
| 配额          | 通过 `/v1/usage` 获取每月预算和用量       |

## 入门指南

<Steps>
  <Step title="获取限定范围的凭据">
    向 ClawRouter 管理员申请凭据，其策略应包含你需要使用的提供商、模型和每月预算。凭据签发时只显示一次。
  </Step>
  <Step title="配置 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 已内置且默认启用。如果你的配置设置了 `plugins.allow`，请先将 `clawrouter` 添加到该列表，再启用它。对于自定义部署，请将 `models.providers.clawrouter.baseUrl` 设置为 ClawRouter 源站；默认值为 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出获准使用的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    请严格按返回内容使用模型引用。它们会保留上游命名空间，例如 `clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6` 或 `clawrouter/google/gemini-3.5-flash`。如果配置中的 `agents.defaults.models` 是允许列表，请将每个选定的 ClawRouter 引用添加到其中。

  </Step>
  <Step title="选择模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以使用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."`，为单次运行选择返回的模型。

  </Step>
</Steps>

## 托管式非交互部署

将代理密钥保留在工作负载的密钥注入机制中，并且只在 `openclaw.json` 中存储 SecretRef。规范的托管字段如下：

| 用途          | 配置或环境字段                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器源站    | `models.providers.clawrouter.baseUrl`                                    |
| 凭据          | `models.providers.clawrouter.apiKey` -> 环境变量 SecretRef               |
| 密钥值        | Gateway 网关进程环境中的 `CLAWROUTER_API_KEY`                            |
| 默认模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| 工作负载标签  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（可选）    |

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

试运行会解析 SecretRef，但绝不会输出其值。若要轮换凭据，请更新提供 `CLAWROUTER_API_KEY` 的外部 Secret，并重启 Gateway 网关工作负载，以便加载新的进程环境。配置文件和模型引用无需更改。

对于从源码构建的独立 Docker Gateway 网关，ClawRouter 已包含在根运行时中。仅选择需要单独打包的渠道插件，例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；请参阅[包含所选插件的源码构建镜像](/zh-CN/install/docker#source-built-images-with-selected-plugins)。归档/设备部署必须通过自身的制品流水线打包同一份已落地源码，而不能使用 OCI 镜像。

## 就绪状态和实时验证

这些检查验证不同的边界；请勿互相替代：

```bash
# 仅检查 ClawRouter 进程健康状态；不会使用凭据或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 仅检查 OpenClaw Gateway 网关启动就绪状态；不会调用模型。
curl -fsS http://127.0.0.1:18789/readyz

# 按凭据范围发现目录。
openclaw models list --all --provider clawrouter --json

# 通过已配置的 ClawRouter 提供商执行最小真实推理探测。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用精确获准模型引用的工作负载金丝雀测试。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

请使用受限目录返回的模型，而不要盲目复制示例模型。成功的 `/readyz` 响应表示 Gateway 网关能够处理请求；这并不表示 ClawRouter、其凭据或上游提供商已就绪。模型探测和智能体金丝雀测试才是推理验证。

进行实时诊断时，请发起金丝雀测试并检查 Gateway 网关的标准日志。现有的仅元数据模型传输诊断会输出如下格式的日志行：

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

当这些标识符可用时，插件会发送长度受限的 `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 和 `X-ClawRouter-Session-Id` 标头。它还会将模型调用的诊断 `callId`（`<run-id>:model:<n>`）映射到 `X-Request-ID`，从而能够将 OpenClaw 模型调用事件与 ClawRouter 的仅元数据审计轨迹关联起来。未超过 128 字符请求 ID 限制的值保持完全一致。较长的值会保留 `:model:<n>` 后缀并附加确定性哈希，以确保不同调用的长度受限且仍可关联。可以在提供商的 `headers` 映射中设置 `X-ClawRouter-Project-Id` 等静态部署元数据。智能体和会话归因标头各自保留 256 字符的限制。自动生成且包含 ClawRouter ASCII 标识符集合之外字符的请求 ID，也会使用相同的确定性长度限制形式。
显式配置的标头（包括 `X-Request-ID` 的任何大小写变体）优先于自动值。传输诊断记录路由和响应元数据；它不会记录凭据、请求 ID、提示词或补全内容。ClawRouter 自身的审计事件会提供所选的上游提供商和内容保留状态。

## 模型发现

`GET /v1/catalog` 返回 `{ providers: [...] }`，其中每个提供商条目都会列出自身的 `models[]`（包含上游 ID、能力和定价）以及支持的请求路由。OpenClaw 不会附带第二份固定的 ClawRouter 模型列表。满足以下条件时，目录模型会作为 OpenClaw 模型提供：

- 凭据策略允许使用其提供商；
- 目录模型声明了受支持的 LLM 能力（`llm.responses`、`llm.chat`、`llm.messages`，或具有匹配流式路由的 `llm.stream`）；以及
- 提供商为下列传输协议之一公开了匹配路由。

向受支持的 ClawRouter 提供商添加模型无需发布新版 OpenClaw：下一次目录刷新（按凭据范围缓存 60 秒）即可发现该模型。需要新线路协议的模型则必须先获得插件支持。

## 协议和提供商插件

ClawRouter 负责管理上游凭据；其目录会告知 OpenClaw 应使用哪种传输协议，因此无需安装每个上游公司的身份验证插件。

| 目录能力/路由                                            | OpenClaw 传输协议        |
| -------------------------------------------------------- | ------------------------ |
| `llm.responses`（OpenAI 兼容提供商）                     | `openai-responses`       |
| `llm.chat`（OpenAI 兼容提供商）                          | `openai-completions`     |
| `llm.messages` + `anthropic.messages` 路由               | `anthropic-messages`     |
| `llm.stream` + 流式 `google.generate_content` 路由       | `google-generative-ai`   |

该插件还会为这些系列应用匹配的重放和工具模式策略（OpenAI/DeepSeek/Gemini 工具模式兼容策略，以及原生 Anthropic 和 Google Gemini 重放策略）。如果目录提供商仅公开不受支持的请求格式，则有意不会将其作为 OpenClaw 文本模型提供。应在 ClawRouter 中将这些提供商规范化为受支持的契约之一，而不是发送不兼容的载荷。

## 配额和用量

ClawRouter 的 `/v1/usage` 响应会填充常规 OpenClaw 提供商用量界面：请求数、Token 数和支出总额；如果密钥设置了限制，还会显示每月预算周期。不限额密钥仍会显示汇总用量，但不显示百分比周期。

配额查询使用与模型发现相同的受限范围密钥。配额查询失败不会阻止模型执行。

使用以下命令检查实时快照：

```bash
openclaw status --usage
openclaw models status
```

聊天中的 `/status` 和 OpenClaw 用量 UI 也会提供相同的提供商快照。预算适用于整个策略，因此使用相同 ClawRouter 策略的其他客户端所发出的请求可能会改变剩余百分比。

## 故障排查

| 症状                                     | 检查                                                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 没有 ClawRouter 模型                     | 确认插件已启用且获 `plugins.allow` 允许，然后检查凭据是否有效，并且至少允许一个已就绪的提供商。                                                           |
| 配置的 ClawRouter 模型缺失               | 检查其 `/v1/catalog` 能力和路由支持情况。不受支持的传输协议契约会被有意过滤。                                                                              |
| `Unknown model: clawrouter/...`          | 当 `agents.defaults.models` 配置映射被用作允许列表时，请将精确的目录引用添加到其中。                                                                       |
| 目录或用量请求返回 `401` 或 `403`        | 重新签发 ClawRouter 凭据或调整其范围；OpenClaw 不会回退到上游提供商密钥。                                                                                  |
| 发现模型后调用失败                       | 检查 ClawRouter 中的提供商连接和上游健康状态，并在其恢复就绪后重试。                                                                                      |
| 用量有总计但没有百分比                   | 该策略不限额；在 ClawRouter 中添加每月预算即可显示百分比周期。                                                                                            |

## 安全行为

- 目录发现范围限定于已配置的代理密钥，并按凭据作用域（Agent 目录、工作区目录、身份验证配置文件 ID 和基础 URL）分别缓存。
- 代理密钥仅在分派请求时附加；不会存储在模型元数据中。
- 自动归属信息和请求关联值在分派前会去除首尾空白并拒绝控制字符。归属信息值上限为 256 个字符；请求 ID 上限为 128 个字符。
- 模型传输诊断仅包含元数据，绝不包含代理密钥或模型内容。
- 原生 Anthropic 和 Gemini 模型 ID 仅在分派时重写为其上游 ID。
- 不受支持或未获授权的目录条目会以关闭方式失败，且不可选择。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置和模型选择。
  </Card>
  <Card title="用量跟踪" href="/zh-CN/concepts/usage-tracking" icon="chart-line">
    OpenClaw 的用量和状态界面。
  </Card>
</CardGroup>
