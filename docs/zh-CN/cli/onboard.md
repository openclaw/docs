---
read_when:
    - 你希望通过引导式设置来配置 Gateway 网关、工作区、凭证、渠道和 Skills。
summary: '`openclaw onboard`（交互式新手引导）的 CLI 参考'
title: 新手引导
x-i18n:
    generated_at: "2026-04-27T08:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 041063bce6616ed32225cb411f385dcbfd750c0bb2779ec17bc58e1aa9ada254
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

用于本地或远程 Gateway 网关设置的交互式新手引导。

## 相关指南

<CardGroup cols={2}>
  <Card title="CLI 新手引导中心" href="/zh-CN/start/wizard" icon="rocket">
    交互式 CLI 流程的演练说明。
  </Card>
  <Card title="新手引导概览" href="/zh-CN/start/onboarding-overview" icon="map">
    OpenClaw 的新手引导如何协同工作。
  </Card>
  <Card title="CLI 设置参考" href="/zh-CN/start/wizard-cli-reference" icon="book">
    输出、内部机制和各步骤行为。
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

`--flow import` 使用由插件拥有的迁移提供商，例如 Hermes。它仅适用于全新的 OpenClaw 设置；如果已存在配置、凭证、会话或工作区内存/身份文件，请在导入前重置或选择一个全新的设置。

`--modern` 会启动 Crestodian 对话式新手引导预览。不使用
`--modern` 时，`openclaw onboard` 会保留经典的新手引导流程。

对于明文私有网络 `ws://` 目标（仅限受信任网络），请在新手引导进程环境中设置
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
这种客户端传输层的紧急开关没有对应的 `openclaw.json` 配置项。

非交互式自定义提供商：

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

在非交互式模式下，`--custom-api-key` 是可选的。如果省略，新手引导会检查 `CUSTOM_API_KEY`。

LM Studio 在非交互式模式下也支持特定于提供商的密钥标志：

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

`--custom-base-url` 默认值为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，新手引导会使用 Ollama 建议的默认值。诸如 `kimi-k2.5:cloud` 之类的云模型 ID 在这里也可用。

将提供商密钥存储为引用而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境变量支持的引用，而不是明文密钥值。
对于由 auth-profile 支持的提供商，这会写入 `keyRef` 条目；对于自定义提供商，这会将 `models.providers.<id>.apiKey` 写为环境变量引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式约定：

- 在新手引导进程环境中设置提供商环境变量（例如 `OPENAI_API_KEY`）。
- 不要传递内联密钥标志（例如 `--openai-api-key`），除非该环境变量也已设置。
- 如果传递了内联密钥标志但所需环境变量未设置，新手引导会快速失败并给出指引。

非交互式模式下的 Gateway 网关令牌选项：

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求在新手引导进程环境中存在一个非空环境变量。
- 使用 `--install-daemon` 时，当令牌认证需要令牌时，由 SecretRef 管理的 Gateway 网关令牌会被验证，但不会以已解析的明文形式持久化到 supervisor 服务环境元数据中。
- 使用 `--install-daemon` 时，如果令牌模式需要令牌，而配置的令牌 SecretRef 未解析，新手引导会以安全关闭方式失败，并给出修复指引。
- 使用 `--install-daemon` 时，如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，则在显式设置模式之前，新手引导会阻止安装。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。如果后续配置文件缺少 `gateway.mode`，应将其视为配置损坏或不完整的手动编辑，而不是有效的本地模式捷径。
- `--allow-unconfigured` 是单独的 Gateway 网关运行时紧急开关。它并不表示新手引导可以省略 `gateway.mode`。

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

- 除非你传递 `--skip-health`，否则新手引导会在成功退出前等待本地 Gateway 网关可连接。
- `--install-daemon` 会先启动受管的 Gateway 网关安装路径。如果不使用它，你必须已经有一个正在运行的本地 Gateway 网关，例如 `openclaw gateway run`。
- 如果你只想在自动化中写入配置/工作区/bootstrap，请使用 `--skip-health`。
- 如果你自行管理工作区文件，请传递 `--skip-bootstrap` 以设置 `agents.defaults.skipBootstrap: true`，并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks；如果任务创建被拒绝，则回退到按用户的 Startup 文件夹登录项。

使用引用模式时的交互式新手引导行为：

- 出现提示时，选择 **使用秘密引用**。
- 然后选择以下其中之一：
  - 环境变量
  - 已配置的秘密提供商（`file` 或 `exec`）
- 在保存该引用前，新手引导会执行快速预检验证。
  - 如果验证失败，新手引导会显示错误并允许你重试。

### 非交互式 Z.AI 端点选择

<Note>
`--auth-choice zai-api-key` 会自动为你的密钥检测最佳 Z.AI 端点（优先使用通用 API 和 `zai/glm-5.1`）。如果你明确想使用 GLM Coding Plan 端点，请选择 `zai-coding-global` 或 `zai-coding-cn`。
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
    - `manual`：完整提示端口、绑定和认证（`advanced` 的别名）。
    - `import`：运行检测到的迁移提供商，预览计划，然后在确认后应用。

  </Accordion>
  <Accordion title="提供商预筛选">
    当某个认证选择暗示了首选提供商时，新手引导会将默认模型和 allowlist 选择器预筛选到该提供商。对于 Volcengine 和 BytePlus（国际版），这也会匹配 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果首选提供商筛选后尚未产生任何已加载模型，新手引导会回退到未筛选的目录，而不是让选择器保持为空。

  </Accordion>
  <Accordion title="Web 搜索后续提示">
    某些 Web 搜索提供商会触发特定于提供商的后续提示：

    - **Grok** 可能会提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY` 和一个 `x_search` 模型选择。
    - **Kimi** 可能会询问 Moonshot API 区域（`api.moonshot.ai` 还是 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

  </Accordion>
  <Accordion title="其他行为">
    - 本地新手引导的私信 范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
    - 最快开始首次聊天：`openclaw dashboard`（Control UI，无需设置渠道）。
    - 自定义提供商：连接任何兼容 OpenAI 或 Anthropic 的端点，包括未列出的托管提供商。使用 Unknown 可自动检测。
    - 如果检测到 Hermes 状态，新手引导会提供迁移流程。使用 [迁移](/zh-CN/cli/migrate) 获取 dry-run 计划、覆盖模式、报告和精确映射。

  </Accordion>
</AccordionGroup>

## 常见后续命令

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 并不表示非交互式模式。脚本中请使用 `--non-interactive`。
</Note>
