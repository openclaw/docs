---
read_when:
    - 你想要更改默认模型或查看提供商认证状态
    - 你想要扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退机制、认证）'
title: Models
x-i18n:
    generated_at: "2026-04-25T09:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退机制、认证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/zh-CN/concepts/models)
- 提供商认证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示已解析的默认值/回退机制以及认证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用窗口和配额快照。
当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况认证会在可用时来自提供商特定钩子；
否则，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商
概览，而 `auth.oauth` 仅表示认证存储中的配置文件健康状态。
添加 `--probe` 可针对每个已配置的提供商配置文件运行实时认证探测。
探测会发起真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭证或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、认证配置文件、现有目录
  状态以及由提供商拥有的目录行，但不会重写
  `models.json`。
- `models list --all` 会包含由提供商拥有的内置静态目录行，即使
  你尚未使用该提供商完成认证。
  在配置好匹配的认证之前，这些行仍会显示为不可用。
- `models list` 会将原生模型元数据与运行时能力上限区分开来。在表格
  输出中，如果有效运行时上限与原生上下文窗口不同，`Ctx` 会显示 `contextTokens/contextWindow`；
  JSON 行会在提供商暴露该上限时包含 `contextTokens`。
- `models list --provider <id>` 按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用通过按**第一个** `/` 进行拆分来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为对该精确模型 id 的唯一已配置提供商匹配，只有在这之后
  才会以弃用警告的形式回退到已配置的默认提供商。
  如果该提供商不再暴露已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是暴露一个
  过期的、已删除提供商默认值。
- `models status` 可能会在认证输出中将非秘密占位符显示为 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们按秘密信息进行掩码处理。

### `models scan`

`models scan` 会读取 OpenRouter 的公开 `:free` 目录，并为
回退用途对候选项进行排序。目录本身是公开的，因此仅元数据扫描不需要
OpenRouter 密钥。

默认情况下，OpenClaw 会尝试通过实时模型调用来探测工具和图像支持。
如果未配置 OpenRouter 密钥，该命令会回退到仅元数据输出，并说明
`:free` 模型仍然需要 `OPENROUTER_API_KEY` 才能进行探测和推理。

选项：

- `--no-probe`（仅元数据；不查找配置/密钥）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每次探测的超时）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描
结果仅供参考，不会应用到配置中。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复，或使用逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；会覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分桶：

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
  `auth.order.<provider>` 省略了它，因此探测会报告该排除状态，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出
  可用于探测的模型候选项。

## 别名 + 回退机制

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 认证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式认证辅助工具。它可以启动提供商认证
流程（OAuth/API 密钥），或者根据你选择的提供商引导你进入手动粘贴令牌。

`models auth login` 会运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是通用令牌命令，适用于
  暴露令牌认证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行提供商的令牌认证
  方法（如果该提供商暴露了 `setup-token` 方法，则默认使用该方法）。
- `paste-token` 接受在其他地方或通过自动化生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长存储一个绝对令牌过期时间，
  例如 `365d` 或 `12h`。
- Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为该集成的获准方式，除非 Anthropic 发布新的策略。
- Anthropic 的 `setup-token` / `paste-token` 仍然可作为受支持的 OpenClaw 令牌路径使用，但 OpenClaw 现在在可用时更倾向于 Claude CLI 复用和 `claude -p`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障切换](/zh-CN/concepts/model-failover)
