---
read_when:
    - 你想要针对 Gateway 网关、工作区、身份验证、渠道和 Skills 的引导式设置
summary: '`openclaw onboard`（交互式新手引导）的 CLI 参考'
title: 新手引导
x-i18n:
    generated_at: "2026-07-01T10:57:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

用于本地或远程 Gateway 网关设置的完整引导式新手引导。当你希望 OpenClaw 在一个流程中带你完成模型凭证、工作区、Gateway 网关、渠道、Skills 和健康检查时，请使用它。

## 相关指南

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的演练。
  </Card>
  <Card title="Onboarding overview" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 新手引导各部分如何组合在一起。
  </Card>
  <Card title="CLI setup reference" href="/zh-CN/start/wizard-cli-reference" icon="book">
    输出、内部机制和每一步行为。
  </Card>
  <Card title="CLI automation" href="/zh-CN/start/wizard-cli-automation" icon="terminal">
    非交互式标志和脚本化设置。
  </Card>
  <Card title="macOS app onboarding" href="/zh-CN/start/onboarding" icon="apple">
    macOS 菜单栏应用的新手引导流程。
  </Card>
</CardGroup>

## 示例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` 使用由插件拥有的迁移提供方，例如 Hermes。它只会针对全新的 OpenClaw 设置运行；如果已有配置、凭证、会话或工作区记忆/身份文件，请先重置或选择全新设置再导入。

`--modern` 会启动 Crestodian 对话式新手引导预览。没有
`--modern` 时，`openclaw onboard` 会保留经典新手引导流程。

在全新安装中，如果活动配置文件缺失或没有人工编写的
设置（为空或仅包含元数据），裸 `openclaw` 也会启动经典
新手引导流程。一旦配置文件已有人工编写的设置，裸 `openclaw`
会改为打开 Crestodian。

明文 `ws://` 可用于 loopback、私有 IP 字面量、`.local` 和
Tailnet `*.ts.net` Gateway 网关 URL。对于其他可信的私有 DNS 名称，请在新手引导进程环境中设置
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 语言区域

交互式新手引导会对固定设置文案使用 CLI 向导语言区域。解析
顺序为：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文回退

支持的向导语言区域为 `en`、`zh-CN` 和 `zh-TW`。语言区域值可以使用
下划线或 POSIX 后缀形式，例如 `zh_CN.UTF-8`。产品名称、命令
名称、配置键名、URL、提供商 ID、模型 ID 以及插件/渠道标签
保持字面不变。

示例：

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

非交互式自定义提供商：

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

`--custom-api-key` 在非交互式模式中是可选的。如果省略，新手引导会检查 `CUSTOM_API_KEY`。
OpenClaw 会自动将常见视觉模型 ID 标记为支持图像。对未知的自定义视觉 ID 传入 `--custom-image-input`，或传入 `--custom-text-input` 强制使用纯文本元数据。
对于支持 `/v1/responses` 但不支持 `/v1/chat/completions` 的 OpenAI 兼容端点，请使用 `--custom-compatibility openai-responses`。

LM Studio 在非交互式模式中也支持提供商专用的 key 标志：

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

`--custom-base-url` 默认值为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，新手引导会使用 Ollama 建议的默认值。诸如 `kimi-k2.5:cloud` 的云模型 ID 在这里也可用。

将提供商 key 存储为引用而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境变量支撑的引用，而不是明文 key 值。
对于由 auth-profile 支撑的提供商，这会写入 `keyRef` 条目；对于自定义提供商，这会把 `models.providers.<id>.apiKey` 写为环境变量引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式契约：

- 在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`）。
- 不要传入内联 key 标志（例如 `--openai-api-key`），除非该环境变量也已设置。
- 如果传入了内联 key 标志但缺少所需环境变量，新手引导会快速失败并给出指导。

非交互式模式中的 Gateway 网关令牌选项：

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求新手引导进程环境中存在非空环境变量。
- 使用 `--install-daemon` 时，如果 token auth 需要令牌，由 SecretRef 管理的 Gateway 网关令牌会被验证，但不会以解析后的明文形式持久化到 supervisor 服务环境元数据中。
- 使用 `--install-daemon` 时，如果令牌模式需要令牌且配置的令牌 SecretRef 无法解析，新手引导会关闭失败并给出修复指导。
- 使用 `--install-daemon` 时，如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，新手引导会阻止安装，直到显式设置模式。
- 本地新手引导会把 `gateway.mode="local"` 写入配置。如果后续配置文件缺少 `gateway.mode`，请将其视为配置损坏或未完成的手动编辑，而不是有效的本地模式快捷方式。
- 当所选设置路径需要时，本地新手引导会安装选中的可下载插件。
- 远程新手引导只会写入远程 Gateway 网关的连接信息，不会安装本地插件包。
- `--allow-unconfigured` 是一个独立的 Gateway 网关运行时逃生舱。它并不表示新手引导可以省略 `gateway.mode`。

示例：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非交互式本地 Gateway 网关健康检查：

- 除非传入 `--skip-health`，否则新手引导会等待本地 Gateway 网关可访问后才成功退出。
- `--install-daemon` 会先启动托管式 Gateway 网关安装路径。没有它时，你必须已经有一个正在运行的本地 Gateway 网关，例如 `openclaw gateway run`。
- 如果你在自动化中只想写入配置/工作区/bootstrap，请使用 `--skip-health`。
- 如果你自己管理工作区文件，请传入 `--skip-bootstrap` 以设置 `agents.defaults.skipBootstrap: true`，并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks；如果任务创建被拒绝，则回退到每用户 Startup 文件夹登录项。

引用模式下的交互式新手引导行为：

- 在提示时选择 **Use secret reference**。
- 然后选择以下之一：
  - 环境变量
  - 已配置的 secret provider（`file` 或 `exec`）
- 新手引导会在保存引用之前执行快速预检验证。
  - 如果验证失败，新手引导会显示错误并允许你重试。

### 非交互式 Z.AI 端点选择

<Note>
`--auth-choice zai-api-key` 会为你的 key 自动检测最佳 Z.AI 端点和模型。Coding Plan 端点优先使用 `zai/glm-5.2`；通用 API 端点使用
`zai/glm-5.1`。要强制使用 Coding Plan 端点，请选择 `zai-coding-global` 或
`zai-coding-cn`。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非交互式 Mistral 示例：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 其他非交互式标志

基于令牌的模型凭证（非交互式；与 `--auth-choice token` 一起使用）：

- `--token-provider <id>` — 令牌提供商 ID。标识哪个提供商签发令牌。
- `--token <token>` — 用于模型认证的令牌值。
- `--token-profile-id <id>` — 凭证配置 ID。通用令牌存储默认使用 `<provider>:manual`；提供商拥有的设置流程可以使用自己的默认值，例如 `anthropic:default`。
- `--token-expires-in <duration>` — 可选的令牌过期时长（例如 `365d`、`12h`）。

Cloudflare AI Gateway（非交互式）：

- `--cloudflare-ai-gateway-account-id <id>` — 用于通过 Cloudflare AI Gateway 路由的 Cloudflare Account ID。
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID。

守护进程安装控制：

- `--no-install-daemon` — 显式跳过 Gateway 网关服务安装。
- `--skip-daemon` — `--no-install-daemon` 的别名。

UI 和 hook 设置控制：

- `--skip-ui` — 在新手引导期间跳过 Control UI / TUI 提示。
- `--skip-hooks` — 在新手引导期间跳过 webhook / hook 设置提示。

输出抑制：

- `--suppress-gateway-token-output` — 抑制带有令牌的 Gateway 网关/UI 输出（令牌提示、带嵌入令牌的自动登录 URL，以及自动启动 Control UI）。适用于共享终端和 CI 环境。

## 流程说明

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`：最少提示，自动生成 Gateway 网关令牌。
    - `manual`：针对端口、绑定和凭证的完整提示（`advanced` 的别名）。
    - `import`：运行检测到的迁移提供方，预览计划，然后在确认后应用。

  </Accordion>
  <Accordion title="Provider prefiltering">
    当凭证选择暗示了首选提供商时，新手引导会将默认模型和 allowlist 选择器预过滤到该提供商。对于 Volcengine 和 BytePlus，这也会匹配 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果首选提供商过滤器尚未产生已加载模型，新手引导会回退到未过滤目录，而不是让选择器为空。

  </Accordion>
  <Accordion title="Web-search follow-ups">
    一些 Web 搜索提供商会触发提供商专用的后续提示：

    - **Grok** 可以使用相同的 xAI OAuth 配置或 API key 提供可选的 `x_search` 设置，以及一个 `x_search` 模型选择。
    - **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认 Kimi Web 搜索模型。

  </Accordion>
  <Accordion title="Other behaviors">
    - 本地新手引导私信范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（Control UI，无需渠道设置）。
    - 自定义提供商：连接任何 OpenAI 或 Anthropic 兼容端点，包括未列出的托管提供商。使用 Unknown 自动检测。
    - 如果检测到 Hermes 状态，新手引导会提供迁移流程。使用 [迁移](/zh-CN/cli/migrate) 查看 dry-run 计划、覆盖模式、报告和精确映射。

  </Accordion>
</AccordionGroup>

## 常用后续命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

使用 `openclaw setup` 作为相同的引导式新手引导入口点。当你只需要基线配置/工作区时，使用 `openclaw setup --baseline`；之后使用 `openclaw configure` 进行定向更改，使用 `openclaw channels add` 进行仅渠道设置。

<Note>
`--json` 不表示非交互模式。脚本请使用 `--non-interactive`。
</Note>
