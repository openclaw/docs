---
read_when:
    - 你想要针对 Gateway 网关、工作区、凭证、渠道和 Skills 的引导式设置
summary: '`openclaw onboard` 的 CLI 参考（交互式新手引导）'
title: 新手引导
x-i18n:
    generated_at: "2026-06-30T22:05:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

用于本地或远程 Gateway 网关设置的完整引导式新手引导。当你希望 OpenClaw 在一个流程中依次完成模型凭证、工作区、Gateway 网关、渠道、Skills 和健康检查时，请使用此命令。

## 相关指南

<CardGroup cols={2}>
  <Card title="CLI 新手引导中心" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的演练。
  </Card>
  <Card title="新手引导概览" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 新手引导各部分如何协同工作。
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

`--flow import` 使用插件拥有的迁移提供方，例如 Hermes。它只会针对全新的 OpenClaw 设置运行；如果已经存在配置、凭证、会话或工作区记忆/身份文件，请在导入前重置或选择全新设置。

`--modern` 会启动 Crestodian 对话式新手引导预览。未使用
`--modern` 时，`openclaw onboard` 会保留经典新手引导流程。

在全新安装中，如果活动配置文件缺失或没有用户编写的
设置（为空或仅包含元数据），裸 `openclaw` 也会启动经典
新手引导流程。一旦配置文件包含用户编写的设置，裸 `openclaw`
会改为打开 Crestodian。

纯文本 `ws://` 可用于 loopback、私有 IP 字面量、`.local` 和
Tailnet `*.ts.net` 网关 URL。对于其他受信任的私有 DNS 名称，请在新手引导进程环境中设置
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 区域设置

交互式新手引导会将 CLI 向导区域设置用于固定设置文案。解析
顺序为：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文回退

支持的向导区域设置为 `en`、`zh-CN` 和 `zh-TW`。区域设置值可以使用
下划线或 POSIX 后缀形式，例如 `zh_CN.UTF-8`。产品名称、命令
名称、配置键、URL、提供商 ID、模型 ID，以及插件/渠道标签
保持字面量。

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

在非交互式模式下，`--custom-api-key` 是可选的。如果省略，新手引导会检查 `CUSTOM_API_KEY`。
OpenClaw 会自动将常见视觉模型 ID 标记为支持图像。对未知的自定义视觉 ID 传入 `--custom-image-input`，或传入 `--custom-text-input` 强制使用仅文本元数据。
对于支持 `/v1/responses` 但不支持 `/v1/chat/completions` 的 OpenAI 兼容端点，请使用 `--custom-compatibility openai-responses`。

LM Studio 在非交互式模式下还支持提供商专用的密钥标志：

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

`--custom-base-url` 默认值为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，新手引导会使用 Ollama 建议的默认值。诸如 `kimi-k2.5:cloud` 这样的云模型 ID 也可以在这里使用。

将提供商密钥存储为引用而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境变量支持的引用，而不是明文密钥值。
对于由凭证配置支持的提供商，这会写入 `keyRef` 条目；对于自定义提供商，这会将 `models.providers.<id>.apiKey` 写为环境变量引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式契约：

- 在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`）。
- 不要传入内联密钥标志（例如 `--openai-api-key`），除非也设置了该环境变量。
- 如果传入了内联密钥标志但缺少所需环境变量，新手引导会快速失败并给出指引。

非交互式模式下的 Gateway 网关令牌选项：

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求新手引导进程环境中存在非空环境变量。
- 使用 `--install-daemon` 时，如果令牌认证需要令牌，由 SecretRef 管理的 Gateway 网关令牌会被验证，但不会以解析后的明文形式持久化到 supervisor 服务环境元数据中。
- 使用 `--install-daemon` 时，如果令牌模式需要令牌且配置的令牌 SecretRef 无法解析，新手引导会失败关闭并给出修复指引。
- 使用 `--install-daemon` 时，如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，新手引导会阻止安装，直到显式设置模式。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。如果后续配置文件缺少 `gateway.mode`，请将其视为配置损坏或未完成的手动编辑，而不是有效的本地模式快捷方式。
- 当所选设置路径需要时，本地新手引导会安装选中的可下载插件。
- 远程新手引导只会写入远程 Gateway 网关的连接信息，不会安装本地插件包。
- `--allow-unconfigured` 是单独的 Gateway 网关运行时逃生口。它并不表示新手引导可以省略 `gateway.mode`。

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
- `--install-daemon` 会先启动托管 Gateway 网关安装路径。未使用它时，你必须已经有本地 Gateway 网关正在运行，例如 `openclaw gateway run`。
- 如果你在自动化中只想写入配置/工作区/bootstrap，请使用 `--skip-health`。
- 如果你自行管理工作区文件，请传入 `--skip-bootstrap`，以设置 `agents.defaults.skipBootstrap: true` 并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks；如果任务创建被拒绝，则回退到每用户 Startup 文件夹登录项。

使用引用模式时的交互式新手引导行为：

- 提示时选择 **使用密钥引用**。
- 然后选择以下任一项：
  - 环境变量
  - 已配置的密钥提供商（`file` 或 `exec`）
- 新手引导会在保存引用前执行快速预检验证。
  - 如果验证失败，新手引导会显示错误并允许你重试。

### 非交互式 Z.AI 端点选择

<Note>
`--auth-choice zai-api-key` 会为你的密钥自动检测最佳 Z.AI 端点和模型。Coding Plan 端点优先使用 `zai/glm-5.2`；通用 API 端点使用
`zai/glm-5.1`。要强制使用 Coding Plan 端点，请选择 `zai-coding-global` 或
`zai-coding-cn`。
</Note>

```bash
# 无提示端点选择
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端点选择：
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

## 流程说明

<AccordionGroup>
  <Accordion title="流程类型">
    - `quickstart`：最少提示，自动生成 Gateway 网关令牌。
    - `manual`：端口、绑定和认证的完整提示（`advanced` 的别名）。
    - `import`：运行检测到的迁移提供方，预览计划，然后在确认后应用。

  </Accordion>
  <Accordion title="提供商预过滤">
    当某个凭证选择暗示首选提供商时，新手引导会将默认模型和允许列表选择器预过滤到该提供商。对于 Volcengine 和 BytePlus，这也会匹配 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果首选提供商过滤后尚未得到已加载模型，新手引导会回退到未过滤的目录，而不是让选择器为空。

  </Accordion>
  <Accordion title="Web 搜索后续提示">
    某些 Web 搜索提供商会触发提供商专用的后续提示：

    - **Grok** 可以提供可选的 `x_search` 设置，使用相同的 xAI OAuth 配置或 API key，并选择 `x_search` 模型。
    - **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

  </Accordion>
  <Accordion title="其他行为">
    - 本地新手引导私信作用域行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（Control UI，无需渠道设置）。
    - 自定义提供商：连接任意 OpenAI 或 Anthropic 兼容端点，包括未列出的托管提供商。使用 Unknown 自动检测。
    - 如果检测到 Hermes 状态，新手引导会提供迁移流程。使用 [迁移](/zh-CN/cli/migrate) 查看 dry-run 计划、覆盖模式、报告和精确映射。

  </Accordion>
</AccordionGroup>

## 常用后续命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

将 `openclaw setup` 用作同一个引导式新手引导入口点。当你只需要基线配置/工作区时，使用 `openclaw setup --baseline`；之后使用 `openclaw configure` 进行定向更改，并使用 `openclaw channels add` 进行仅渠道设置。

<Note>
`--json` 并不表示非交互式模式。脚本请使用 `--non-interactive`。
</Note>
