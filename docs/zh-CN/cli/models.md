---
read_when:
    - 你想更改默认模型或查看提供商身份验证状态。
    - 你想扫描可用的模型/提供商并调试身份验证配置文件。
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退机制、身份验证）'
title: Models
x-i18n:
    generated_at: "2026-04-25T06:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2755657b334b8722da06e31fa1d69a5dced3d74e5aeadd38d625039f15911d69
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退机制、身份验证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/zh-CN/concepts/models)
- 提供商身份验证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示已解析的默认值/回退项以及身份验证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用时间窗口和配额快照。
当前支持使用情况时间窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况身份验证在可用时来自提供商特定的钩子；
否则 OpenClaw 会回退为匹配来自身份验证配置文件、环境变量或配置中的
OAuth/API 密钥凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商
概览，而 `auth.oauth` 仅是身份验证存储中配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时身份验证探测。
探测会发出真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/身份验证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，
否则使用已配置的默认智能体。
探测行可能来自身份验证配置文件、环境变量凭证或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、身份验证配置文件、现有目录
  状态以及提供商自有的目录行，但不会重写
  `models.json`。
- `models list --all` 会包含提供商自带的静态目录行，即使你
  还未对此提供商完成身份验证。这些行仍会显示为不可用，直到配置了匹配的身份验证。
- `models list` 会将原生模型元数据和运行时能力上限区分开来。在表格
  输出中，如果有效运行时上限与原生上下文窗口不同，`Ctx` 会显示 `contextTokens/contextWindow`；JSON 行会包含 `contextTokens`，
  前提是提供商暴露了该上限。
- `models list --provider <id>` 按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商
  选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用通过按**第一个** `/` 进行拆分来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为精确匹配该模型 id 的唯一已配置提供商，最后才
  以弃用警告的方式回退到已配置的默认提供商。
  如果该提供商不再暴露已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是显示一个
  过时的、已移除提供商默认值。
- `models status` 可能会在身份验证输出中显示 `marker(<value>)`，用于表示非机密占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是像机密信息那样进行掩码处理。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的身份验证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复使用，或使用逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分组：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可预期的探测详情/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告该排除，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商身份验证存在，但 OpenClaw 无法为该提供商解析出可用于探测的
  模型候选项。

## 别名 + 回退机制

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身份验证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式身份验证辅助工具。它可以启动提供商身份验证
流程（OAuth/API 密钥），或根据你选择的提供商引导你手动粘贴令牌。

`models auth login` 会运行提供商插件的身份验证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 可查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是面向暴露令牌身份验证方法的提供商的通用
  令牌命令。
- `setup-token` 需要交互式 TTY，并运行该提供商的令牌身份验证
  方法（当该提供商暴露了 `setup-token` 方法时，默认使用该方法）。
- `paste-token` 接受在其他地方或通过自动化生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长存储一个绝对令牌过期时间，例如
  `365d` 或 `12h`。
- Anthropic 说明：Anthropic 工作人员告诉我们，再次允许 OpenClaw 风格的 Claude CLI 使用方式，因此除非 Anthropic 发布新的策略，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成的受支持方式。
- Anthropic 的 `setup-token` / `paste-token` 仍然可作为受支持的 OpenClaw 令牌路径使用，但 OpenClaw 现在在可用时更推荐使用 Claude CLI 复用和 `claude -p`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
