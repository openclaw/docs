---
read_when:
    - 你希望建立推理，然后使用 Crestodian 完成设置
summary: '`openclaw onboard`（交互式新手引导）的 CLI 参考'
title: 引导设置
x-i18n:
    generated_at: "2026-07-14T13:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4b305789c1ee53237acaabb94b243f54771bea5a476584dc3e71df8b053bbb24
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

以推理优先的引导式设置：检测现有 AI 访问方式，
要求完成一次实时补全，仅持久化可用的路由，然后启动
Crestodian 配置其余内容。`openclaw setup` 是同一入口点；
`openclaw setup --baseline` 仅写入基线配置/工作区。

<CardGroup cols={2}>
  <Card title="CLI 新手引导中心" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的分步指南。
  </Card>
  <Card title="新手引导概览" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 新手引导各部分如何协同工作。
  </Card>
  <Card title="CLI 设置参考" href="/zh-CN/start/wizard-cli-reference" icon="book">
    输出、内部机制和各步骤的行为。
  </Card>
  <Card title="CLI 自动化" href="/zh-CN/start/wizard-cli-automation" icon="terminal">
    非交互式标志和脚本化设置。
  </Card>
  <Card title="macOS 应用新手引导" href="/zh-CN/start/onboarding" icon="apple">
    macOS 菜单栏应用的新手引导流程。
  </Card>
</CardGroup>

## 示例

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`：打开完整的分步向导。它不能与
  `--non-interactive` 组合使用；进行自动化设置时请省略 `--classic`。
- `--flow quickstart`：打开仅含少量提示的经典向导，并
  自动生成 Gateway 网关令牌。
- `--flow manual`（别名 `advanced`）：打开经典向导，并完整提示
  配置端口、绑定和身份验证。
- `--flow import`：运行检测到的迁移提供商（例如通过 `--import-from hermes` 使用 Hermes），预览计划，然后在确认后应用。导入只能针对全新的 OpenClaw 设置运行——如果已存在任何配置、凭据、会话或工作区状态，请先将其重置。使用 [`openclaw migrate`](/zh-CN/cli/migrate) 获取试运行计划、覆盖模式、报告和精确映射。
- `--modern` 是 Crestodian 对话式设置
  助手的兼容性别名。它使用与 `openclaw crestodian` 相同的实时推理门控，并且
  仅接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 和 `--json`。其他设置标志会被拒绝，而不是
  被静默忽略。

## 引导式流程

直接运行 `openclaw onboard` 会启动引导式流程。它会显示安全通知，
检测已通过已配置模型、API 密钥
环境变量和受支持的本地 CLI 提供的 AI 访问方式，然后使用真实补全测试
推荐候选项。如果该候选项失败，新手引导会显示
原因，并自动尝试下一个可用候选项。

如果自动检测已穷尽，提供商选择器会首先显示 OpenAI、
Anthropic、xAI (Grok)、Google 和 OpenRouter。选择 **More…** 可查看所有
其他受支持的提供商，并按提供商分组；随后会在第二个菜单中显示地区、套餐和身份验证方法。
受支持的浏览器或设备登录方式以及掩码显示的
API 密钥或令牌方式使用相同的实时补全路径。测试成功后，OpenClaw 仅
持久化已验证的模型路由及其凭据；失败的候选项不会替换已配置的模型，也不会保存尝试使用的
凭据。选择 **Skip for now** 可退出而不启动 Crestodian，
准备好后重新运行 `openclaw onboard`。在 Crestodian 启动前，工作区和 Gateway 网关设置
保持不变。

在引导模式下，`--workspace <dir>` 会向 Crestodian 提供建议的工作区
和隔离的推理上下文。在你批准 Crestodian
设置方案之前，这些内容不会被持久化。经典和非交互式新手引导会通过各自的
常规设置流程持久化工作区。

推理通过后，引导式新手引导会立即使用
已验证的模型启动 Crestodian。随后，Crestodian 可以配置工作区、Gateway 网关、
渠道、智能体、插件和其他可选功能。在 Crestodian 中，使用
`open channel wizard for <channel>` 将渠道凭据收集交给
掩码终端向导。若要更改模型提供商或其身份验证方式，
请退出 Crestodian 并运行 `openclaw onboard`；Crestodian 不会打开引导式
或经典提供商流程。

在已配置的安装中，再次运行 `openclaw onboard` 会先验证当前
默认模型，因此同一流程也可用作验证和修复过程。
如果该检查失败，已配置的模型绝不会被自动替换——
新手引导会停止并询问如何继续。检查在你的
工作区之外运行，因此由工作区插件提供的模型可能在此处失败，但仍能
在智能体中正常工作。
使用 `openclaw onboard --classic` 配置特定于提供商的身份验证、渠道、Skills、
远程 Gateway 网关设置、导入或完整的 Gateway 网关控制。对于不涉及推理的对话式
设置和修复，请运行 `openclaw crestodian`；`openclaw onboard
--modern` 是通过同一推理门控运行的兼容性别名。经典
向导可以选择使用实时补全验证默认模型，但
在 Crestodian 自身的实时推理检查通过之前，它不会启动。

在交互式终端中，直接运行 `openclaw`（不带子命令）会根据配置
状态进行路由：

- 如果活动配置文件缺失或不含用户编写的设置（为空或
  仅含元数据），则启动引导式新手引导。
- 如果配置文件存在但验证失败，则使用 `openclaw doctor` 指引启动经典
  新手引导路径。Crestodian 需要可用的
  推理，不能用于修复这种推理前状态。
- 如果配置文件有效，则打开常规智能体 TUI。若已配置的
  Gateway 网关可访问且具有智能体和模型，则会直接进入该 UI，而不会启动
  新手引导或 Crestodian。在已配置的安装中，可通过 TUI 内的
  `/crestodian` 或 `openclaw crestodian` 进入 Crestodian。

对于 loopback、私有 IP 字面量、`.local` 和 Tailnet `*.ts.net` Gateway 网关 URL，可以使用明文 `ws://`。对于其他受信任的私有 DNS 名称，请在新手引导进程环境中设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重置

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 会在运行设置前清除状态。`--reset-scope` 控制清除范围：`config`（仅配置）、`config+creds+sessions`（传入 `--reset` 但未指定范围时的默认值），或 `full`（同时重置工作区）。仅使用 `--reset-scope full` 时才会重置工作区。

## 区域设置

交互式新手引导对固定设置文案使用 CLI 向导的区域设置。解析顺序：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 回退到英语

受支持的向导区域设置为 `en`、`zh-CN` 和 `zh-TW`。区域设置值可以使用下划线或 POSIX 后缀形式，例如 `zh_CN.UTF-8`。产品名称、命令名称、配置键、URL、提供商 ID、模型 ID 以及插件/渠道标签保持原样。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非交互式设置

`--non-interactive` 要求使用 `--accept-risk`（确认智能体功能强大，并且完整的系统访问权限存在风险）。`--mode` 默认为 `local`。

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` 是可选项；如果省略，新手引导会检查环境中的 `CUSTOM_API_KEY`。OpenClaw 会自动将常见视觉模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及类似模型）标记为支持图像。对于未知的自定义视觉模型 ID，请传入 `--custom-image-input`；若要强制使用仅文本元数据，请传入 `--custom-text-input`。对于支持 `/v1/responses` 但不支持 `/v1/chat/completions` 的 OpenAI 兼容端点，请使用 `--custom-compatibility openai-responses`；有效值为 `openai`（默认值）、`openai-responses`、`anthropic`。

LM Studio 还有一个特定于提供商的密钥标志：

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非交互式 Ollama：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` 默认为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选项；如果省略，新手引导会使用 Ollama 建议的默认值。`kimi-k2.5:cloud` 等云模型 ID 也可在此使用。

将提供商密钥存储为引用，而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境变量支持的引用，而不是明文密钥值：对于由身份验证配置文件支持的提供商，会写入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；对于自定义提供商，则以相同方式写入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。约定：在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`），并且除非已设置该环境变量，否则不要同时传入内联密钥标志——如果提供了标志值但未设置匹配的环境变量，程序会快速失败并给出指引。

### Gateway 网关身份验证（非交互式）

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。`token` 是默认身份验证模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。要求新手引导进程环境中存在该名称且值非空的环境变量。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- 使用 `--install-daemon` 时：由 SecretRef 管理的 `gateway.auth.token` 会被验证，但解析出的明文不会持久化到监督程序服务的环境元数据中；如果无法解析该引用，安装会以关闭方式失败并提供修复指引。如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，安装会被阻止，直到显式设置模式。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。之后，如果配置文件缺少 `gateway.mode`，则表示配置损坏或手动编辑不完整，而不是有效的本地模式快捷方式。
- 本地新手引导会安装所选设置路径需要的可下载插件（例如相应身份验证选项所需的 Codex 或 Copilot 运行时插件）。远程新手引导只会写入远程 Gateway 网关的连接信息——绝不会安装本地插件包。
- `--allow-unconfigured` 是独立的 `openclaw gateway run` 应急开关；它不能让新手引导跳过 `gateway.mode`。

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### 本地 Gateway 健康

- 除非传入 `--skip-health`，否则新手引导会等待本地 Gateway 网关可访问后才成功退出。
- `--install-daemon` 会先启动托管式 Gateway 网关安装流程。如果未传入该选项，则本地 Gateway 网关必须已经在运行（例如 `openclaw gateway run`）。
- 如果你只希望自动化流程写入配置、工作区和引导文件，`--skip-health` 会跳过等待。
- `--skip-bootstrap` 会设置 `agents.defaults.skipBootstrap: true`，并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试使用计划任务；如果创建任务被拒绝，则回退到每用户“启动”文件夹中的登录项。

### 交互式引用模式

- 出现提示时选择 **使用机密引用**，然后选择 **环境变量** 或已配置的机密提供商（`file` 或 `exec`）。
- 新手引导会在保存引用前运行快速预检验证，并允许你在失败后重试。

### Z.AI 端点选项

<Note>
`--auth-choice zai-api-key` 会自动检测最适合你的密钥的 Z.AI 端点和模型：Coding Plan 端点优先使用 `zai/glm-5.2`（如果不可用，则回退到 `glm-5.1`）；通用 API 端点默认使用 `zai/glm-5.1`。若要强制使用 Coding Plan 端点，请直接选择 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# 无提示选择端点
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端点选项：zai-coding-cn、zai-global、zai-cn
```

Mistral：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 其他非交互式标志

基于令牌的模型身份验证（与 `--auth-choice token` 一起使用）：

| 标志                            | 说明                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 签发令牌的令牌提供商 ID                                                                                         |
| `--token <token>`               | 用于模型身份验证的令牌值                                                                                        |
| `--token-profile-id <id>`       | 身份验证配置文件 ID（默认为 `<provider>:manual`；某些由提供商负责的流程会使用自己的默认值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 可选的令牌过期时长（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

守护进程安装控制：`--no-install-daemon` / `--skip-daemon`（别名；跳过安装 Gateway 网关服务）、`--daemon-runtime <node>`。

Skills：`--node-manager <npm|pnpm|bun>`（默认为 `npm`）、`--skip-skills`。

UI 和钩子设置：`--skip-ui`（跳过 Control UI/TUI 提示）、`--skip-hooks`（跳过 webhook/钩子设置）、`--skip-channels`、`--skip-search`。

输出：`--suppress-gateway-token-output` 会抑制包含令牌的 Gateway 网关/UI 输出（令牌提示、嵌入令牌的自动登录 URL，以及自动启动 Control UI），适用于共享终端和 CI。

<Note>
`--json` 在引导式或经典新手引导中并不表示非交互模式。
与 `--modern` 一起使用时，JSON 是一次性的 Crestodian 概览，并会在返回该
单个结果后退出。其他脚本请使用 `--non-interactive`。
</Note>

## 提供商预筛选

当身份验证选项隐含首选提供商时，新手引导会将默认模型和允许列表选择器预筛选为该提供商的模型。该筛选器也会匹配同一插件拥有的其他提供商，因此可涵盖 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 等 Coding Plan 变体。如果首选提供商筛选器没有筛选出任何已加载的模型，新手引导会回退到未筛选的目录，而不是让选择器保持为空。

## Web 搜索后续提示

某些 Web 搜索提供商会在新手引导期间触发提供商特定的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，复用同一 xAI 身份验证，并让你选择 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

## 其他行为

- 本地新手引导的私信范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
- 最快开始首次聊天：`openclaw dashboard`（Control UI，无需设置渠道）。
- 自定义提供商：连接任何兼容 OpenAI 或 Anthropic 的端点，包括未列出的托管提供商。使用 **Unknown** 兼容性可通过实时探测自动检测。
- 如果检测到 Hermes 状态，新手引导会提供迁移流程（请参阅上面的 `--flow import`）。

## 常用后续命令

之后可使用 `openclaw configure` 进行有针对性的非推断式更改，并使用 `openclaw
channels add` 仅设置渠道。若要更改模型提供商或身份验证路由，
请改为运行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
