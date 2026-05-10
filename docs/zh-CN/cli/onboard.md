---
read_when:
    - 你想要针对 Gateway 网关、工作区、身份验证、渠道和 Skills 的引导式设置
summary: '`openclaw onboard` 的 CLI 参考（交互式新手引导）'
title: 新手引导
x-i18n:
    generated_at: "2026-05-10T19:28:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

用于本地或远程 Gateway 网关设置的完整引导式新手引导。当你希望 OpenClaw 在一个流程中依次完成模型认证、工作区、Gateway 网关、渠道、技能和健康检查时，请使用此命令。

## 相关指南

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的演练。
  </Card>
  <Card title="Onboarding overview" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 新手引导如何衔接在一起。
  </Card>
  <Card title="CLI setup reference" href="/zh-CN/start/wizard-cli-reference" icon="book">
    输出、内部机制和逐步行为。
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

`--flow import` 使用插件所有的迁移提供商，例如 Hermes。它只会针对全新的 OpenClaw 设置运行；如果已有配置、凭证、会话或工作区记忆/身份文件存在，请先重置，或在导入前选择全新设置。

`--modern` 会启动 Crestodian 对话式新手引导预览。如果不使用
`--modern`，`openclaw onboard` 会保留经典新手引导流程。

对于明文私有网络 `ws://` 目标（仅限受信任网络），请在新手引导进程环境中设置
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
这个客户端侧传输应急开关没有等价的 `openclaw.json` 配置项。

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

`--custom-api-key` 在非交互式模式下是可选的。如果省略，新手引导会检查 `CUSTOM_API_KEY`。
OpenClaw 会自动将常见视觉模型 ID 标记为支持图像。对于未知的自定义视觉 ID，请传入 `--custom-image-input`；或传入 `--custom-text-input` 强制使用仅文本元数据。

LM Studio 在非交互式模式下也支持提供商专用密钥标志：

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

`--custom-base-url` 默认值为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选项；如果省略，新手引导会使用 Ollama 建议的默认值。诸如 `kimi-k2.5:cloud` 的云模型 ID 也可以在这里使用。

将提供商密钥存储为引用，而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境支持的引用，而不是明文密钥值。
对于由认证配置文件支持的提供商，这会写入 `keyRef` 条目；对于自定义提供商，这会将 `models.providers.<id>.apiKey` 写为环境引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式契约：

- 在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`）。
- 不要传入内联密钥标志（例如 `--openai-api-key`），除非该环境变量也已设置。
- 如果传入内联密钥标志但缺少必需的环境变量，新手引导会快速失败并给出指导。

非交互式模式下的 Gateway 网关令牌选项：

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求新手引导进程环境中存在非空环境变量。
- 使用 `--install-daemon` 时，如果令牌认证需要令牌，由 SecretRef 管理的 Gateway 网关令牌会被验证，但不会作为已解析的明文持久化到 supervisor 服务环境元数据中。
- 使用 `--install-daemon` 时，如果令牌模式需要令牌且配置的令牌 SecretRef 无法解析，新手引导会关闭失败并给出修复指导。
- 使用 `--install-daemon` 时，如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，新手引导会阻止安装，直到明确设置模式。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。如果后续配置文件缺少 `gateway.mode`，请将其视为配置损坏或未完成的手动编辑，而不是有效的本地模式快捷方式。
- 当所选设置路径需要可下载插件时，本地新手引导会安装所选插件。
- 远程新手引导只写入远程 Gateway 网关的连接信息，不会安装本地插件包。
- `--allow-unconfigured` 是一个单独的 Gateway 网关运行时逃生开关。它不表示新手引导可以省略 `gateway.mode`。

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
- `--install-daemon` 会先启动托管 Gateway 网关安装路径。如果未使用它，你必须已经有一个本地 Gateway 网关在运行，例如 `openclaw gateway run`。
- 如果你只想在自动化中写入配置/工作区/bootstrap，请使用 `--skip-health`。
- 如果你自行管理工作区文件，请传入 `--skip-bootstrap` 以设置 `agents.defaults.skipBootstrap: true`，并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks；如果任务创建被拒绝，则回退到每用户 Startup 文件夹登录项。

使用引用模式时的交互式新手引导行为：

- 在提示时选择 **使用密钥引用**。
- 然后选择以下任一项：
  - 环境变量
  - 已配置的密钥提供商（`file` 或 `exec`）
- 新手引导会在保存引用前执行快速预检验证。
  - 如果验证失败，新手引导会显示错误并允许你重试。

### 非交互式 Z.AI 端点选择

<Note>
`--auth-choice zai-api-key` 会自动检测最适合你的密钥的 Z.AI 端点（优先使用带有 `zai/glm-5.1` 的通用 API）。如果你明确想使用 GLM Coding Plan 端点，请选择 `zai-coding-global` 或 `zai-coding-cn`。
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

## 流程说明

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`：最少提示，自动生成 Gateway 网关令牌。
    - `manual`：针对端口、绑定和认证提供完整提示（`advanced` 的别名）。
    - `import`：运行检测到的迁移提供商，预览计划，然后在确认后应用。

  </Accordion>
  <Accordion title="Provider prefiltering">
    当认证选择暗示首选提供商时，新手引导会将默认模型和 allowlist 选择器预筛选到该提供商。对于 Volcengine 和 BytePlus，这也会匹配 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果首选提供商筛选尚未产生已加载模型，新手引导会回退到未筛选目录，而不是让选择器为空。

  </Accordion>
  <Accordion title="Web-search follow-ups">
    一些 Web 搜索提供商会触发提供商专用的后续提示：

    - **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY` 和一个 `x_search` 模型选择。
    - **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认 Kimi Web 搜索模型。

  </Accordion>
  <Accordion title="Other behaviors">
    - 本地新手引导私信范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（Control UI，无需渠道设置）。
    - 自定义提供商：连接任何兼容 OpenAI 或 Anthropic 的端点，包括未列出的托管提供商。使用 Unknown 可自动检测。
    - 如果检测到 Hermes 状态，新手引导会提供迁移流程。使用 [迁移](/zh-CN/cli/migrate) 获取 dry-run 计划、覆盖模式、报告和精确映射。

  </Accordion>
</AccordionGroup>

## 常见后续命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

当你只需要基线配置/工作区时，请改用 `openclaw setup`。稍后可使用 `openclaw configure` 进行针对性更改，并使用 `openclaw channels add` 进行仅渠道设置。

<Note>
`--json` 并不意味着非交互式模式。脚本请使用 `--non-interactive`。
</Note>
