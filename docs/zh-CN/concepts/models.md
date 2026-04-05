---
read_when:
    - 添加或修改 models CLI（models list/set/scan/aliases/fallbacks）
    - 更改模型回退行为或选择 UX
    - 更新模型扫描探测（工具/图像）
summary: Models CLI：列出、设置、别名、回退、扫描、状态
title: Models CLI
x-i18n:
    generated_at: "2026-04-05T21:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09507720942af72bf7027c733879935d53c79c72b607d737a131eaa02b9b2576
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

有关凭证配置轮换、冷却时间以及它们如何与回退交互，请参阅 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
提供商快速概览和示例：[/concepts/model-providers](/zh-CN/concepts/model-providers)。

## 模型选择如何工作

OpenClaw 按以下顺序选择模型：

1. **主模型**（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的**回退模型**（按顺序）。
3. **提供商凭证故障转移**会先在提供商内部发生，然后才会切换到下一个模型。

相关项：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录（以及别名）。
- `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会依次回退到 `agents.defaults.imageModel`，然后是已解析的当前会话/默认模型。
- `agents.defaults.imageGenerationModel` 用于共享的图像生成功能。如果省略，`image_generate` 仍可推断出由凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按 provider-id 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API key。
- `agents.defaults.videoGenerationModel` 用于共享的视频生成功能。如果省略，`video_generate` 仍可推断出由凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按 provider-id 顺序尝试其余已注册的视频生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API key。
- 每个智能体的默认值可以通过 `agents.list[].model` 加上绑定覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/zh-CN/concepts/multi-agent)）。

## 快速模型策略

- 将你的主模型设置为你可用的最强新一代模型。
- 对于成本/延迟敏感的任务和风险较低的聊天，使用回退模型。
- 对于启用了工具的智能体或不受信任的输入，避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型和凭证，包括 **OpenAI Code (Codex)**
订阅（OAuth）和 **Anthropic**（API key 或 Claude CLI）。

## 配置键名（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会规范化为小写。像 `z.ai/*` 这样的提供商别名会规范化为
`zai/*`。

提供商配置示例（包括 OpenCode）位于
[/providers/opencode](/zh-CN/providers/opencode)。

## “模型不被允许”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和会话覆盖的**允许列表**。当用户选择了不在该允许列表中的模型时，
OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这会在生成正常回复**之前**发生，因此消息看起来像是“没有响应”。解决方法是：

- 将该模型添加到 `agents.defaults.models`，或
- 清空允许列表（移除 `agents.defaults.models`），或
- 从 `/model list` 中选择一个模型。

允许列表示例配置：

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

- `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型系列 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单，以及一个 Submit 步骤。
- `/model <#>` 会从该选择器中进行选择。
- `/model` 会立即持久化新的会话选择。
- 如果智能体处于空闲状态，下一次运行会立即使用新模型。
- 如果某次运行已处于活动状态，OpenClaw 会将实时切换标记为待处理，并且只会在一次干净的重试点重启并切换到新模型。
- 如果工具活动或回复输出已经开始，待处理的切换可能会保持排队状态，直到稍后的重试机会或下一次用户轮次。
- `/model status` 是详细视图（凭证候选项，以及在已配置时显示提供商端点 `baseUrl` + `api` 模式）。
- 模型引用通过按**第一个** `/` 进行拆分来解析。输入 `/model <ref>` 时，请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（例如：`/model openrouter/moonshotai/kimi-k2`）。
- 如果你省略了提供商，OpenClaw 会按以下顺序解析输入：
  1. 别名匹配
  2. 该精确无前缀模型 ID 的唯一已配置提供商匹配
  3. 已弃用的回退行为：回退到已配置的默认提供商
     如果该提供商不再提供已配置的默认模型，OpenClaw 会改为回退到第一个已配置的提供商/模型，以避免暴露陈旧的、已移除提供商默认值。

完整的命令行为/配置： [Slash commands](/zh-CN/tools/slash-commands)。

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

默认显示已配置的模型。常用标志：

- `--all`：完整目录
- `--local`：仅本地提供商
- `--provider <name>`：按提供商筛选
- `--plain`：每行一个模型
- `--json`：机器可读输出

### `models status`

显示已解析的主模型、回退模型、图像模型，以及已配置提供商的凭证概览。它还会显示凭证存储中找到的配置文件的 OAuth 过期状态（默认在 24 小时内给出警告）。`--plain` 仅打印已解析的主模型。
OAuth 状态始终会显示（并包含在 `--json` 输出中）。如果某个已配置提供商没有凭证，`models status` 会打印一个**缺少凭证**部分。
JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`
（每个提供商的生效凭证，包括由环境变量支持的凭证）。`auth.oauth`
仅表示凭证存储配置文件的健康状态；仅使用环境变量的提供商不会出现在其中。
自动化场景请使用 `--check`（缺少/过期时退出码为 `1`，即将过期时为 `2`）。
使用 `--probe` 执行实时凭证检查；探测行可能来自凭证配置文件、环境变量凭证或 `models.json`。
如果显式 `auth.order.<provider>` 省略了某个已存储配置文件，探测会报告
`excluded_by_auth_order`，而不是尝试它。如果存在凭证，但该提供商无法解析出可探测模型，探测会报告 `status: no_model`。

凭证选择取决于提供商/账户。对于始终在线的 Gateway 网关主机，API
key 通常最可预测；也支持复用 Claude CLI，以及现有的 Anthropic OAuth/token 配置文件。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并且可以选择性地探测模型是否支持工具和图像。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿）
- `--max-age-days <days>`：跳过较旧模型
- `--provider <name>`：提供商前缀筛选
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设置为首个选择项
- `--set-image`：将 `agents.defaults.imageModel.primary` 设置为首个图像选择项

探测需要 OpenRouter API key（来自凭证配置文件或
`OPENROUTER_API_KEY`）。如果没有 key，请使用 `--no-probe` 仅列出候选项。

扫描结果按以下顺序排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入

- OpenRouter `/models` 列表（筛选 `:free`）
- 需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API key（参见 [/environment](/zh-CN/help/environment)）
- 可选筛选条件：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式选择回退模型。在非交互模式下，传入 `--yes` 以接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会写入智能体目录下的 `models.json`
（默认路径为 `~/.openclaw/agents/<agentId>/agent/models.json`）。默认会合并此文件，除非将 `models.mode` 设置为 `replace`。

对于匹配的提供商 ID，合并模式的优先级如下：

- 如果智能体 `models.json` 中已存在非空 `baseUrl`，则其优先。
- 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商在当前配置/凭证配置文件上下文中不是由 SecretRef 管理时才优先。
- 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，file/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
- 由 SecretRef 管理的提供商 header 值会从源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，file/exec 引用使用 `secretref-managed`）。
- 智能体中的 `apiKey`/`baseUrl` 为空或缺失时，会回退到配置中的 `models.providers`。
- 其他提供商字段会从配置和规范化后的目录数据中刷新。

标记持久化遵循源配置权威：OpenClaw 会根据活动源配置快照（预解析）写入标记，而不是根据运行时已解析的密钥值写入。
这适用于 OpenClaw 重新生成 `models.json` 的所有情况，包括像 `openclaw agent` 这样的命令驱动路径。

## 相关内容

- [Model Providers](/zh-CN/concepts/model-providers) — 提供商路由和凭证
- [Model Failover](/zh-CN/concepts/model-failover) — 回退链
- [Image Generation](/zh-CN/tools/image-generation) — 图像模型配置
- [Video Generation](/zh-CN/tools/video-generation) — 视频模型配置
- [Configuration Reference](/zh-CN/gateway/configuration-reference#agent-defaults) — 模型配置键名
