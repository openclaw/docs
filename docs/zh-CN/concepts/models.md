---
read_when:
    - 添加或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 修改模型回退行为或选择 UX
    - 更新模型扫描探测（工具/图像）
summary: 模型 CLI：列出、设置、别名、回退、扫描、状态
title: 模型 CLI
x-i18n:
    generated_at: "2026-04-05T08:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# 模型 CLI

有关 auth profile 轮换、冷却时间及其与回退的交互，请参见 [/concepts/model-failover](/concepts/model-failover)。
提供商快速概览和示例：[/concepts/model-providers](/concepts/model-providers)。

## 模型选择的工作方式

OpenClaw 按以下顺序选择模型：

1. **主模型**（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的**回退模型**（按顺序）。
3. **提供商鉴权故障切换**会先在提供商内部发生，然后才会切换到下一个
   模型。

相关项：

- `agents.defaults.models` 是 OpenClaw 可使用的模型 allowlist/目录（以及别名）。
- `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具
  会回退到 `agents.defaults.imageModel`，然后回退到已解析的会话/默认
  模型。
- `agents.defaults.imageGenerationModel` 由共享图像生成能力使用。如果省略，`image_generate` 仍可推断由鉴权支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请同时配置该提供商的鉴权/API 密钥。
- `agents.defaults.videoGenerationModel` 由共享视频生成能力使用。与图像生成不同，它目前不会推断提供商默认值。请设置显式的 `provider/model`，例如 `qwen/wan2.6-t2v`，并同时配置该提供商的鉴权/API 密钥。
- 每个智能体的默认值可通过 `agents.list[].model` 加上 bindings 覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/concepts/multi-agent)）。

## 快速模型策略

- 将你的主模型设置为你可用的最新一代中最强的模型。
- 对成本/延迟敏感任务和较低风险的聊天使用回退模型。
- 对于启用了工具的智能体或不受信任的输入，请避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 鉴权，包括 **OpenAI Code（Codex）
订阅**（OAuth）和 **Anthropic（API + Claude CLI）**。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（allowlist + 别名 + provider 参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会被规范化为小写。像 `z.ai/*` 这样的提供商别名会规范化
为 `zai/*`。

提供商配置示例（包括 OpenCode）位于
[/providers/opencode](/providers/opencode)。

## “Model is not allowed”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和
会话覆盖的 **allowlist**。当用户选择了不在该 allowlist 中的模型时，
OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这会在生成正常回复**之前**发生，因此消息看起来可能像是“没有响应”。
修复方法是执行以下任一操作：

- 将该模型添加到 `agents.defaults.models`，或
- 清除 allowlist（移除 `agents.defaults.models`），或
- 从 `/model list` 中选择一个模型。

示例 allowlist 配置：

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 在聊天中切换模型（`/model`）

你可以在不重启的情况下为当前会话切换模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

说明：

- `/model`（以及 `/model list`）是紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，包含提供商和模型下拉框以及一个提交步骤。
- `/model <#>` 会从该选择器中进行选择。
- `/model` 会立即持久化新的会话选择。
- 如果智能体空闲，下一次运行会立即使用新模型。
- 如果某次运行已经处于活动状态，OpenClaw 会将实时切换标记为待处理，并只会在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，该待处理切换可能会一直排队，直到之后的某个重试机会或下一个用户轮次。
- `/model status` 是详细视图（auth 候选项，以及在已配置时的提供商端点 `baseUrl` + `api` 模式）。
- 模型引用会通过在**第一个** `/` 处分割来解析。输入 `/model <ref>` 时请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（例如：`/model openrouter/moonshotai/kimi-k2`）。
- 如果你省略了提供商，OpenClaw 会按以下顺序解析输入：
  1. 别名匹配
  2. 对该未加前缀模型 ID 的唯一已配置提供商匹配
  3. 已弃用的回退：使用已配置的默认提供商
     如果该提供商不再暴露已配置的默认模型，OpenClaw
     会改为回退到第一个已配置的提供商/模型，以避免
     暴露已过时、已移除提供商的默认值。

完整命令行为/配置： [斜杠命令](/tools/slash-commands)。

## CLI 命令

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（无子命令）是 `models status` 的快捷方式。

### `models list`

默认显示已配置模型。实用标志：

- `--all`：完整目录
- `--local`：仅本地提供商
- `--provider <name>`：按提供商过滤
- `--plain`：每行一个模型
- `--json`：机器可读输出

### `models status`

显示已解析的主模型、回退模型、图像模型，以及已配置提供商的鉴权概览。
它还会显示在 auth 存储中找到的 profile 的 OAuth 过期状态
（默认会在 24 小时内到期时发出警告）。`--plain` 只打印已解析的
主模型。
OAuth 状态始终会显示（并包含在 `--json` 输出中）。如果某个已配置
提供商没有凭证，`models status` 会打印一个 **Missing auth** 部分。
JSON 包括 `auth.oauth`（警告窗口 + profiles）和 `auth.providers`
（每个提供商的生效鉴权）。
在自动化中使用 `--check`（缺失/已过期时退出码为 `1`，即将过期时为 `2`）。
使用 `--probe` 进行实时鉴权检查；探测行可以来自 auth profiles、环境
凭证或 `models.json`。
如果显式的 `auth.order.<provider>` 省略了已存储的 profile，
探测会报告 `excluded_by_auth_order`，而不是尝试它。如果存在鉴权，
但无法为该提供商解析出可探测模型，则探测会报告 `status: no_model`。

鉴权选择取决于提供商/账户。对于始终运行的 Gateway 网关宿主机，API
密钥通常最可预测；也支持复用 Claude CLI 以及现有的 Anthropic
OAuth/token profiles。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并且
可选地探测模型是否支持工具和图像。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿）
- `--max-age-days <days>`：跳过较旧模型
- `--provider <name>`：提供商前缀过滤
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将第一个选择项设置为 `agents.defaults.model.primary`
- `--set-image`：将第一个图像选择项设置为 `agents.defaults.imageModel.primary`

探测需要 OpenRouter API 密钥（来自 auth profiles 或
`OPENROUTER_API_KEY`）。如果没有密钥，请使用 `--no-probe` 仅列出候选项。

扫描结果按以下顺序排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入

- OpenRouter `/models` 列表（过滤 `:free`）
- 需要来自 auth profiles 或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（参见 [/environment](/help/environment)）
- 可选过滤项：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以以交互方式选择回退模型。在非交互
模式下，传递 `--yes` 以接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会写入智能体目录下的 `models.json`
（默认路径为 `~/.openclaw/agents/<agentId>/agent/models.json`）。默认情况下会合并此文件，除非将 `models.mode` 设置为 `replace`。

匹配提供商 ID 时的合并模式优先级：

- 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
- 智能体 `models.json` 中非空的 `apiKey` 仅在该提供商在当前配置/auth-profile 上下文中不是 SecretRef 管理时才优先。
- 由 SecretRef 管理的提供商 `apiKey` 值会根据源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，file/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
- 由 SecretRef 管理的提供商 header 值会根据源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，file/exec 引用使用 `secretref-managed`）。
- 智能体 `apiKey`/`baseUrl` 为空或缺失时，会回退到配置中的 `models.providers`。
- 其他提供商字段会根据配置和规范化后的目录数据刷新。

标记持久化遵循“源即权威”：OpenClaw 会根据活动源配置快照（解析前）写入标记，而不是根据已解析的运行时密钥值写入。
只要 OpenClaw 重新生成 `models.json`，这一规则就会生效，包括像 `openclaw agent` 这样的命令驱动路径。

## 相关内容

- [模型提供商](/concepts/model-providers) — 提供商路由与鉴权
- [模型故障切换](/concepts/model-failover) — 回退链
- [图像生成](/tools/image-generation) — 图像模型配置
- [配置参考](/gateway/configuration-reference#agent-defaults) — 模型配置键
