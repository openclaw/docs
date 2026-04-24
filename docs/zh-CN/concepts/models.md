---
read_when:
    - 添加或修改模型 CLI（`models list`/`set`/`scan`/`aliases`/`fallbacks`）
    - 更改模型回退行为或选择 UX
    - 更新模型扫描探测（工具/图像）
summary: 模型 CLI：列表、设置、别名、回退、扫描、状态
title: 模型 CLI
x-i18n:
    generated_at: "2026-04-24T17:24:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c036097a5093f0ce304fd08b7ae22ccf5102eb6f511a9a2018a8d4712e43648
    source_path: concepts/models.md
    workflow: 15
---

有关凭证配置轮换、冷却时间，以及这些机制如何与回退交互，请参阅 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
快速了解提供商概览与示例：[/concepts/model-providers](/zh-CN/concepts/model-providers)。

## 模型选择的工作方式

OpenClaw 按以下顺序选择模型：

1. **主模型**（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的**回退模型**（按顺序）。
3. **提供商凭证故障切换**会先在单个提供商内部进行，然后才会切换到下一个模型。

相关内容：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录（还包括别名）。
- `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会依次回退到 `agents.defaults.imageModel`，然后是解析后的会话/默认模型。
- `agents.defaults.imageGenerationModel` 用于共享的图像生成能力。如果省略，`image_generate` 仍然可以推断出一个带凭证的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- `agents.defaults.musicGenerationModel` 用于共享的音乐生成能力。如果省略，`music_generate` 仍然可以推断出一个带凭证的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- `agents.defaults.videoGenerationModel` 用于共享的视频生成能力。如果省略，`video_generate` 仍然可以推断出一个带凭证的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- 每个智能体的默认设置可以通过 `agents.list[].model` 加上绑定来覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/zh-CN/concepts/multi-agent)）。

## 快速模型策略

- 将你的主模型设置为你可用的最新一代中能力最强的模型。
- 对于对成本/延迟敏感的任务和风险较低的聊天，可使用回退模型。
- 对于启用了工具的智能体或不受信任的输入，避免使用较旧/较弱档位的模型。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code（Codex）订阅**
（OAuth）和 **Anthropic**（API 密钥或 Claude CLI）。

## 配置键名（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会统一规范为小写。像 `z.ai/*` 这样的提供商别名会规范为
`zai/*`。

提供商配置示例（包括 OpenCode）位于
[/providers/opencode](/zh-CN/providers/opencode)。

### 安全地编辑允许列表

手动更新 `agents.defaults.models` 时，使用追加式写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` 会保护模型/提供商映射，防止被意外覆盖。对
`agents.defaults.models`、`models.providers` 或
`models.providers.<id>.models` 进行普通对象赋值时，如果会移除现有条目，
则会被拒绝。追加式更改请使用 `--merge`；只有在提供的值应成为完整目标值时，
才使用 `--replace`。

交互式提供商设置和 `openclaw configure --section model` 也会将按提供商范围选择的内容合并到现有允许列表中，因此添加 Codex、
Ollama 或其他提供商时，不会丢弃无关的模型条目。

## “Model is not allowed”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 以及
会话覆盖的**允许列表**。当用户选择的模型不在该允许列表中时，
OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这会发生在正常回复生成**之前**，因此这条消息会让人感觉它
“没有响应”。修复方法是：

- 将该模型添加到 `agents.defaults.models`，或
- 清除允许列表（移除 `agents.defaults.models`），或
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

- `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型家族 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单，以及一个提交步骤。
- `/models add` 已弃用，现在会返回弃用提示，而不是在聊天中注册模型。
- `/model <#>` 会从该选择器中进行选择。
- `/model` 会立即持久化新的会话选择。
- 如果智能体处于空闲状态，下次运行会立即使用新模型。
- 如果某次运行已在进行中，OpenClaw 会将实时切换标记为待处理，并且只会在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，待处理的切换可能会保持排队，直到后续出现重试机会，或等到下一个用户轮次。
- `/model status` 是详细视图（凭证候选项，以及在已配置时显示提供商端点 `baseUrl` + `api` 模式）。
- 模型引用通过按**第一个** `/` 拆分来解析。输入 `/model <ref>` 时请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（例如：`/model openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会按以下顺序解析输入：
  1. 别名匹配
  2. 对该精确无前缀模型 ID 的唯一已配置提供商匹配
  3. 已弃用的回退：回退到已配置的默认提供商
     如果该提供商不再暴露已配置的默认模型，OpenClaw
     则会回退到第一个已配置的提供商/模型，以避免
     暴露一个陈旧的、已移除提供商的默认项。

完整命令行为/配置： [Slash commands](/zh-CN/tools/slash-commands)。

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
- `--provider <id>`：按提供商 ID 过滤，例如 `moonshot`；不接受交互式选择器中的显示标签
- `--plain`：每行一个模型
- `--json`：机器可读输出

`--all` 会在配置凭证之前，先包含内置的、由提供商拥有的静态目录条目，
因此仅做发现用途的视图也可以显示那些在你添加匹配提供商凭证之前不可用的模型。

### `models status`

显示解析后的主模型、回退模型、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中找到的配置文件的 OAuth 过期状态（默认会在 24 小时内到期时发出警告）。`--plain` 仅打印解析后的主模型。
OAuth 状态始终会显示（并包含在 `--json` 输出中）。如果某个已配置的
提供商没有凭证，`models status` 会打印一个 **Missing auth** 部分。
JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`
（每个提供商的生效凭证，包括由环境变量提供的凭证）。`auth.oauth`
仅表示凭证存储中配置文件的健康状态；仅依赖环境变量的提供商不会出现在其中。
自动化场景请使用 `--check`（缺失/已过期时退出码为 `1`，即将过期时为 `2`）。
实时凭证检查请使用 `--probe`；探测结果行可能来自凭证配置文件、环境变量
凭证，或 `models.json`。
如果显式 `auth.order.<provider>` 省略了某个已存储配置文件，探测会报告
`excluded_by_auth_order`，而不是尝试它。如果凭证存在，但该提供商无法解析出可探测的
模型，探测会报告 `status: no_model`。

凭证选择取决于提供商/账户。对于始终在线的 Gateway 网关主机，API
密钥通常是最可预测的；也支持复用 Claude CLI 以及现有的 Anthropic
OAuth/令牌配置文件。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并且可以
选择性地探测模型是否支持工具和图像。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿）
- `--max-age-days <days>`：跳过较旧模型
- `--provider <name>`：提供商前缀过滤
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设为第一个选择结果
- `--set-image`：将 `agents.defaults.imageModel.primary` 设为第一个图像选择结果

探测需要 OpenRouter API 密钥（来自凭证配置文件或
`OPENROUTER_API_KEY`）。如果没有密钥，请使用 `--no-probe` 仅列出候选项。

扫描结果按以下顺序排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入

- OpenRouter `/models` 列表（过滤 `:free`）
- 需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（参见 [/environment](/zh-CN/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式选择回退模型。在非交互模式下，
传入 `--yes` 以接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会被写入智能体目录下的 `models.json`
（默认路径为 `~/.openclaw/agents/<agentId>/agent/models.json`）。默认情况下会合并此文件，除非 `models.mode` 被设置为 `replace`。

匹配提供商 ID 时，合并模式的优先级如下：

- 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
- 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商在当前配置/凭证配置文件上下文中不是 SecretRef 管理时才优先。
- 由 SecretRef 管理的提供商 `apiKey` 值会从源标记中刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
- 由 SecretRef 管理的提供商请求头值会从源标记中刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
- 智能体中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
- 其他提供商字段会从配置和规范化后的目录数据中刷新。

标记持久化以源配置为准：OpenClaw 会从当前激活的源配置快照（解析前）写入标记，而不是从运行时已解析的密钥值写入。
只要 OpenClaw 重新生成 `models.json`，这一规则都会生效，包括像 `openclaw agent` 这样的命令驱动路径。

## 相关内容

- [Model Providers](/zh-CN/concepts/model-providers) — 提供商路由与凭证
- [Model Failover](/zh-CN/concepts/model-failover) — 回退链
- [Image Generation](/zh-CN/tools/image-generation) — 图像模型配置
- [Music Generation](/zh-CN/tools/music-generation) — 音乐模型配置
- [Video Generation](/zh-CN/tools/video-generation) — 视频模型配置
- [Configuration Reference](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键名
