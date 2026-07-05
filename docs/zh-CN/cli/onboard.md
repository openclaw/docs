---
read_when:
    - 你想要针对 Gateway 网关、工作区、身份验证、渠道和 Skills 的引导式设置
summary: '`openclaw onboard` 的 CLI 参考（交互式新手引导）'
title: 引导设置
x-i18n:
    generated_at: "2026-07-05T11:10:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45cd22d23b9e3121a75c7695568cc6a03381daa6e56a64b36f407605bb4d1732
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

在一个流程中引导设置模型凭证、工作区、Gateway 网关、渠道、Skills 和健康检查。`openclaw setup` 是相同的入口点；`openclaw setup --baseline` 只写入基线配置/工作区。

<CardGroup cols={2}>
  <Card title="CLI 新手引导中心" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的演练。
  </Card>
  <Card title="新手引导概览" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 新手引导如何组合在一起。
  </Card>
  <Card title="CLI 设置参考" href="/zh-CN/start/wizard-cli-reference" icon="book">
    输出、内部机制和每步行为。
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
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--flow quickstart`：最少提示，自动生成 Gateway 网关令牌。
- `--flow manual`（别名 `advanced`）：完整提示端口、绑定和凭证。
- `--flow import`：运行检测到的迁移提供商（例如通过 `--import-from hermes` 使用 Hermes），预览计划，然后在确认后应用。导入只会针对全新的 OpenClaw 设置运行 - 如果已存在任何配置、凭据、会话和工作区状态，请先重置。使用 [`openclaw migrate`](/zh-CN/cli/migrate) 获取 dry-run 计划、覆盖模式、报告和精确映射。
- `--modern` 启动 Crestodian 对话式设置/修复助手，而不是经典流程。

在交互式终端中，裸 `openclaw`（无子命令）会按配置状态路由：

- 如果活动配置文件缺失，或没有作者编写的设置（为空或仅包含元数据），它会启动这个经典新手引导流程。
- 如果配置文件存在但验证失败，它会启动 [Crestodian](/zh-CN/cli/crestodian) 进行修复。
- 如果配置文件有效，它会打开正常的智能体 TUI，本地运行或连接到可访问的已配置 Gateway 网关。在已配置的安装中，可以在 TUI 内使用 `/crestodian` 或 `openclaw crestodian` 进入 Crestodian。

纯文本 `ws://` 可用于 loopback、私有 IP 字面量、`.local` 和 Tailnet `*.ts.net` Gateway 网关 URL。对于其他可信的私有 DNS 名称，请在新手引导进程环境中设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重置

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 会在运行设置前清除状态。`--reset-scope` 控制清除范围：`config`（仅配置）、`config+creds+sessions`（传入 `--reset` 且未指定范围时的默认值），或 `full`（同时重置工作区）。只有使用 `--reset-scope full` 时才会重置工作区。

## 语言区域

交互式新手引导使用 CLI 向导语言区域来显示固定设置文案。解析顺序：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文回退

支持的向导语言区域为 `en`、`zh-CN` 和 `zh-TW`。语言区域值可以使用下划线或 POSIX 后缀形式，例如 `zh_CN.UTF-8`。产品名称、命令名称、配置键、URL、提供商 ID、模型 ID 以及插件/渠道标签保持字面量。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非交互式设置

`--non-interactive` 需要 `--accept-risk`（确认智能体功能强大，并且完整系统访问有风险）。`--mode` 默认为 `local`。

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

`--custom-api-key` 是可选的；如果省略，新手引导会检查环境中的 `CUSTOM_API_KEY`。OpenClaw 会自动将常见视觉模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 以及类似模型）标记为支持图像。对未知的自定义视觉 ID 传入 `--custom-image-input`，或传入 `--custom-text-input` 强制仅文本元数据。对于支持 `/v1/responses` 但不支持 `/v1/chat/completions` 的 OpenAI 兼容端点，使用 `--custom-compatibility openai-responses`；有效值为 `openai`（默认）、`openai-responses`、`anthropic`。

LM Studio 也有一个提供商专用的密钥标志：

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

`--custom-base-url` 默认为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，新手引导会使用 Ollama 的建议默认值。诸如 `kimi-k2.5:cloud` 的云模型 ID 也可在这里使用。

将提供商密钥存储为引用，而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境支持的引用，而不是明文密钥值：对于由凭证档案支持的提供商，它会写入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；对于自定义提供商，它会以相同方式写入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契约：在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`），并且除非该环境变量已设置，否则不要同时传入内联密钥标志 - 没有匹配环境变量的标志值会快速失败并给出指引。

### Gateway 网关凭证（非交互式）

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。`token` 是默认凭证模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境 SecretRef。要求新手引导进程环境中存在该名称的非空环境变量。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- 使用 `--install-daemon` 时：由 SecretRef 管理的 `gateway.auth.token` 会被验证，但不会以已解析明文形式持久化到 supervisor 服务环境元数据中；如果引用未解析，安装会失败关闭并给出修复指引。如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会阻塞，直到显式设置模式。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。后续配置文件缺失 `gateway.mode` 表示配置损坏或手动编辑未完成，而不是有效的本地模式快捷方式。
- 本地新手引导会安装所选设置路径需要的可下载插件（例如用于这些凭证选项的 Codex 或 Copilot 运行时插件）。远程新手引导只写入远程 Gateway 网关的连接信息 - 它绝不会安装本地插件包。
- `--allow-unconfigured` 是单独的 `openclaw gateway run` 逃生口；它不会让新手引导跳过 `gateway.mode`。

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### 本地 Gateway 网关健康

- 除非传入 `--skip-health`，否则新手引导会等待可访问的本地 Gateway 网关，然后才成功退出。
- `--install-daemon` 会先启动托管式 Gateway 网关安装路径。没有它时，本地 Gateway 网关必须已经在运行（例如 `openclaw gateway run`）。
- 如果你在自动化中只需要写入配置/工作区/bootstrap，`--skip-health` 会跳过等待。
- `--skip-bootstrap` 设置 `agents.defaults.skipBootstrap: true`，并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks，如果任务创建被拒绝，则回退到每用户 Startup 文件夹登录项。

### 交互式引用模式

- 在提示时选择 **使用密钥引用**，然后选择 **环境变量** 或已配置的密钥提供商（`file` 或 `exec`）。
- 新手引导会在保存引用前运行快速预检验证，并允许你在失败时重试。

### Z.AI 端点选项

<Note>
`--auth-choice zai-api-key` 会自动检测最适合你的密钥的 Z.AI 端点和模型：Coding Plan 端点优先使用 `zai/glm-5.2`（如果不可用则回退到 `glm-5.1`）；通用 API 端点默认使用 `zai/glm-5.1`。要强制使用 Coding Plan 端点，请直接选择 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices: zai-coding-cn, zai-global, zai-cn
```

Mistral：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 其他非交互式标志

基于令牌的模型凭证（与 `--auth-choice token` 一起使用）：

| 标志                            | 描述                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 签发令牌的令牌提供商 ID                                                                                         |
| `--token <token>`               | 用于模型身份验证的令牌值                                                                                        |
| `--token-profile-id <id>`       | 凭证档案 ID（默认 `<provider>:manual`；某些由提供商拥有的流程使用自己的默认值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 可选令牌过期时长（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

守护进程安装控制：`--no-install-daemon` / `--skip-daemon`（别名；跳过 Gateway 网关服务安装）、`--daemon-runtime <node|bun>`。

Skills：`--node-manager <npm|pnpm|bun>`（默认 `npm`）、`--skip-skills`。

UI 和钩子设置：`--skip-ui`（跳过 Control UI/TUI 提示）、`--skip-hooks`（跳过 webhook/钩子设置）、`--skip-channels`、`--skip-search`。

输出：`--suppress-gateway-token-output` 会抑制包含令牌的 Gateway 网关/UI 输出（令牌提示、带嵌入令牌的自动登录 URL，以及自动启动 Control UI）- 适用于共享终端和 CI。

<Note>
`--json` 并不意味着非交互式模式。脚本请使用 `--non-interactive`。
</Note>

## 提供商预筛选

当某个凭证选项隐含首选提供商时，新手引导会将默认模型和 allowlist 选择器预筛选为该提供商的模型。该筛选器也会匹配同一插件拥有的其他提供商，这涵盖了诸如 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 的 coding-plan 变体。如果首选提供商筛选没有产生任何已加载模型，新手引导会回退到未筛选的目录，而不是让选择器为空。

## Web 搜索后续提示

某些 Web 搜索提供商会在新手引导期间触发提供商专用的后续提示：

- **Grok** 可以使用相同的 xAI 凭证和一个 `x_search` 模型选项提供可选的 `x_search` 设置。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认 Kimi Web 搜索模型。

## 其他行为

- 本地新手引导私信范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
- 最快开始首次聊天：`openclaw dashboard`（Control UI，无需渠道设置）。
- 自定义提供商：连接任何兼容 OpenAI 或 Anthropic 的端点，包括未列出的托管提供商。使用**未知**兼容性通过实时探测自动检测。
- 如果检测到 Hermes 状态，新手引导会提供迁移流程（见上文 `--flow import`）。

## 常见后续命令

稍后使用 `openclaw configure` 进行定向更改，使用 `openclaw channels add` 仅设置渠道。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
