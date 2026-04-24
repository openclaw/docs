---
read_when:
    - 添加或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 更改模型回退行为或选择体验
    - 更新模型扫描探测（工具/图像）
summary: 模型 CLI：list、set、aliases、fallbacks、scan、status
title: 模型 CLI
x-i18n:
    generated_at: "2026-04-24T03:39:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

有关凭证配置轮换、冷却时间以及它们如何与回退配合，请参见 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
快速了解提供商概览和示例：[/concepts/model-providers](/zh-CN/concepts/model-providers)。

## 模型选择如何工作

OpenClaw 按以下顺序选择模型：

1. **主**模型（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的**回退模型**（按顺序）。
3. **提供商凭证故障转移**会先在同一个提供商内部发生，然后才会切换到下一个模型。

相关内容：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录（也包含别名）。
- `agents.defaults.imageModel` **仅在**主模型无法接收图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，工具会依次回退到 `agents.defaults.imageModel`，然后回退到已解析的会话/默认模型。
- `agents.defaults.imageGenerationModel` 用于共享图像生成能力。如果省略，`image_generate` 仍可推断出一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请同时配置该提供商的凭证/API key。
- `agents.defaults.musicGenerationModel` 用于共享音乐生成能力。如果省略，`music_generate` 仍可推断出一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的音乐生成提供商。如果你设置了特定的提供商/模型，也请同时配置该提供商的凭证/API key。
- `agents.defaults.videoGenerationModel` 用于共享视频生成能力。如果省略，`video_generate` 仍可推断出一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的视频生成提供商。如果你设置了特定的提供商/模型，也请同时配置该提供商的凭证/API key。
- 每个智能体的默认值可通过 `agents.list[].model` 和绑定覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/zh-CN/concepts/multi-agent)）。

## 快速模型策略

- 将你的主模型设置为你可用的最新一代中能力最强的模型。
- 对于成本/延迟敏感的任务和风险较低的聊天，使用回退模型。
- 对于启用了工具的智能体或不可信输入，避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code (Codex)
subscription**（OAuth）和 **Anthropic**（API key 或 Claude CLI）。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会被规范化为小写。像 `z.ai/*` 这样的提供商别名会被规范化为
`zai/*`。

提供商配置示例（包括 OpenCode）位于
[/providers/opencode](/zh-CN/providers/opencode)。

### 安全地编辑允许列表

手动更新 `agents.defaults.models` 时，请使用追加式写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` 会保护模型/提供商映射，防止被意外覆盖。对 `agents.defaults.models`、`models.providers` 或
`models.providers.<id>.models` 进行普通对象赋值时，如果会移除现有条目，则会被拒绝。追加式变更请使用 `--merge`；仅当你希望提供的值成为完整目标值时，才使用 `--replace`。

交互式提供商设置和 `openclaw configure --section model` 也会将按提供商划分的选择合并到现有允许列表中，因此添加 Codex、
Ollama 或其他提供商时，不会丢弃无关的模型条目。

## “Model is not allowed”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和会话覆盖的**允许列表**。当用户选择了不在允许列表中的模型时，
OpenClaw 会返回：

```text
Model "provider/model" is not allowed. Use /model to list available models.
```

这会发生在正常回复生成**之前**，因此这条消息可能会让人感觉像是“没有回应”。解决方法是：

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

你可以为当前会话切换模型，而无需重启：

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

说明：

- `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开交互式选择器，其中包含提供商和模型下拉菜单，以及一个 Submit 步骤。
- `/models add` 默认可用，可通过 `commands.modelsWrite=false` 禁用。
- 启用后，`/models add <provider> <modelId>` 是最快路径；仅输入 `/models add` 时，在支持的情况下会启动一个按提供商优先的引导流程。
- 执行 `/models add` 后，新模型无需重启 Gateway 网关，就会在 `/models` 和 `/model` 中可用。
- `/model <#>` 会从该选择器中选中模型。
- `/model` 会立即持久化新的会话选择。
- 如果智能体当前空闲，下一次运行会立刻使用新模型。
- 如果已有运行中的任务，OpenClaw 会将实时切换标记为待处理，并仅在合适的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，这个待处理切换可能会一直排队到之后的某个重试机会，或到下一轮用户输入时才生效。
- `/model status` 是详细视图（凭证候选，以及在已配置时的提供商端点 `baseUrl` + `api` 模式）。
- 模型引用会通过**第一个** `/` 进行拆分。输入 `/model <ref>` 时，请使用 `provider/model`。
- 如果模型 id 本身包含 `/`（如 OpenRouter 风格），你必须包含提供商前缀（例如：`/model openrouter/moonshotai/kimi-k2`）。
- 如果你省略了提供商，OpenClaw 会按以下顺序解析输入：
  1. 别名匹配
  2. 与该无前缀模型 id 精确匹配的唯一已配置提供商
  3. 已弃用的回退方式：使用已配置的默认提供商
     如果该提供商已不再提供已配置的默认模型，OpenClaw
     会改为回退到第一个已配置的提供商/模型，以避免
     暴露一个已过时、已移除提供商的默认值。

完整命令行为/配置：[/tools/slash-commands](/zh-CN/tools/slash-commands)。

示例：

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

`openclaw models`（不带子命令）是 `models status` 的快捷方式。

### `models list`

默认显示已配置的模型。常用标志：

- `--all`：完整目录
- `--local`：仅本地提供商
- `--provider <id>`：按提供商 id 过滤，例如 `moonshot`；不接受交互式选择器中的显示标签
- `--plain`：每行一个模型
- `--json`：机器可读输出

`--all` 会在配置凭证之前包含内置的、由提供商拥有的静态目录条目，因此仅用于发现的视图可能会显示那些在你添加匹配提供商凭证之前不可用的模型。

### `models status`

显示已解析的主模型、回退模型、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中发现的配置文件的 OAuth 过期状态（默认在 24 小时内发出警告）。`--plain` 只打印已解析的主模型。
OAuth 状态始终会显示（也包含在 `--json` 输出中）。如果某个已配置提供商没有凭证，`models status` 会打印一个 **Missing auth** 部分。
JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`
（每个提供商的生效凭证，包括来自环境变量的凭证）。`auth.oauth`
仅表示凭证存储中的配置文件健康状态；仅依赖环境变量的提供商不会出现在其中。
自动化使用时请用 `--check`（缺失/过期时退出码为 `1`，即将过期时为 `2`）。
实时凭证检查请用 `--probe`；探测行可能来自凭证配置文件、环境变量凭证，或 `models.json`。
如果显式 `auth.order.<provider>` 省略了某个已存储配置文件，探测会报告
`excluded_by_auth_order`，而不是尝试使用它。如果有凭证但无法为该提供商解析出可探测的模型，则探测会报告 `status: no_model`。

凭证选择取决于提供商/账号。对于始终在线的 Gateway 网关主机，API key 通常是最可预测的；也支持复用 Claude CLI 以及现有 Anthropic OAuth/token 配置文件。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并且可以选择探测模型对工具和图像的支持情况。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿）
- `--max-age-days <days>`：跳过较旧的模型
- `--provider <name>`：提供商前缀过滤
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设置为首个选中项
- `--set-image`：将 `agents.defaults.imageModel.primary` 设置为首个图像选中项

探测需要 OpenRouter API key（来自凭证配置文件或
`OPENROUTER_API_KEY`）。没有 key 时，请使用 `--no-probe` 仅列出候选项。

扫描结果排序依据：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入

- OpenRouter `/models` 列表（筛选 `:free`）
- 需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API key（参见 [/environment](/zh-CN/help/environment)）
- 可选过滤项：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式选择回退模型。在非交互模式下，传入 `--yes` 以接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会被写入智能体目录下的 `models.json`（默认路径为 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 设置为 `replace`，否则该文件默认会以合并方式处理。

匹配提供商 id 时的合并模式优先级：

- 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
- 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商在当前配置/凭证配置文件上下文中**不是** SecretRef 托管时优先。
- 对于由 SecretRef 托管的提供商，`apiKey` 值会根据源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不会持久化已解析出的密钥。
- 对于由 SecretRef 托管的提供商，header 值也会根据源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
- 智能体中的 `apiKey`/`baseUrl` 为空或缺失时，会回退到配置中的 `models.providers`。
- 其他提供商字段会根据配置和规范化后的目录数据刷新。

标记持久化以源配置为准：OpenClaw 会根据当前源配置快照（解析前）写入标记，而不是根据运行时已解析出的密钥值写入。
这适用于 OpenClaw 重新生成 `models.json` 的所有情况，包括像 `openclaw agent` 这样的命令驱动路径。

## 相关内容

- [Model Providers](/zh-CN/concepts/model-providers) — 提供商路由与凭证
- [Model Failover](/zh-CN/concepts/model-failover) — 回退链
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
