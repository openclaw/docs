---
read_when:
    - 添加或修改模型 CLI（`models list/set/scan/aliases/fallbacks`）
    - 更改模型回退行为或选择体验
    - 更新模型扫描探测项（工具/图像）
summary: 模型 CLI：列出、设置、别名、回退、扫描、状态
title: 模型 CLI
x-i18n:
    generated_at: "2026-04-22T22:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18d915f3f761aaff5efc3bf752f5abddeb625e1a386ab3d701f46fd92244f20e
    source_path: concepts/models.md
    workflow: 15
---

# 模型 CLI

有关凭证配置文件轮换、冷却时间及其与回退如何交互的信息，请参阅 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
快速提供商概览 + 示例：[/concepts/model-providers](/zh-CN/concepts/model-providers)。

## 模型选择的工作方式

OpenClaw 按以下顺序选择模型：

1. **主** 模型（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的**回退**模型（按顺序）。
3. **提供商凭证故障切换**会先在提供商内部发生，然后才会切换到下一个模型。

相关项：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录（以及别名）。
- `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会依次回退到 `agents.defaults.imageModel`，然后是已解析的会话/默认模型。
- `agents.defaults.imageGenerationModel` 用于共享的图像生成功能。如果省略，`image_generate` 仍可推断出一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- `agents.defaults.musicGenerationModel` 用于共享的音乐生成功能。如果省略，`music_generate` 仍可推断出一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- `agents.defaults.videoGenerationModel` 用于共享的视频生成功能。如果省略，`video_generate` 仍可推断出一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
- 每个智能体的默认值可以通过 `agents.list[].model` 加上绑定覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/zh-CN/concepts/multi-agent)）。

## 快速模型策略

- 将你的主模型设为你可用的最新一代中能力最强的模型。
- 对成本/延迟敏感的任务和风险较低的聊天，使用回退模型。
- 对启用了工具的智能体或不受信任的输入，避免使用较旧/较弱档位的模型。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code (Codex)
subscription**（OAuth）和 **Anthropic**（API 密钥或 Claude CLI）。

## 配置键名（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会被标准化为小写。像 `z.ai/*` 这样的提供商别名会标准化为
`zai/*`。

提供商配置示例（包括 OpenCode）位于
[/providers/opencode](/zh-CN/providers/opencode)。

### 安全地编辑允许列表

手动更新 `agents.defaults.models` 时，请使用追加式写入：

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` 会保护模型/提供商映射，避免被意外覆盖。当对 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 进行普通对象赋值且会移除现有条目时，该操作会被拒绝。对追加式更改使用 `--merge`；仅当提供的值应成为完整目标值时才使用 `--replace`。

交互式提供商设置和 `openclaw configure --section model` 也会将按提供商范围选择的内容合并到现有允许列表中，因此添加 Codex、Ollama 或其他提供商时，不会丢失无关的模型条目。

## “Model is not allowed”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和会话覆盖的**允许列表**。当用户选择了不在该允许列表中的模型时，OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这会在正常回复生成**之前**发生，因此消息会让人感觉它“没有响应”。修复方法是以下之一：

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
- 在 Discord 中，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单，以及一个“提交”步骤。
- `/models add` 默认可用，可通过 `commands.modelsWrite=false` 禁用。
- 启用后，`/models add <provider> <modelId>` 是最快路径；仅输入 `/models add` 会在支持的情况下启动一个“先选提供商”的引导流程。
- 在执行 `/models add` 后，新模型会立即在 `/models` 和 `/model` 中可用，无需重启 Gateway 网关。
- `/model <#>` 会从该选择器中进行选择。
- `/model` 会立即持久化新的会话选择。
- 如果智能体处于空闲状态，下次运行会立即使用新模型。
- 如果某次运行已在进行中，OpenClaw 会将实时切换标记为待处理，并只会在一个干净的重试点重启到新模型。
- 如果工具活动或回复输出已经开始，待处理切换可能会一直排队，直到稍后的重试机会或下一个用户轮次。
- `/model status` 是详细视图（凭证候选项，以及在已配置时显示的提供商端点 `baseUrl` + `api` 模式）。
- 模型引用通过按**第一个** `/` 进行拆分来解析。输入 `/model <ref>` 时请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会按以下顺序解析输入：
  1. 别名匹配
  2. 对该精确无前缀模型 ID 的唯一已配置提供商匹配
  3. 已弃用的回退：使用已配置的默认提供商
     如果该提供商已不再公开配置中的默认模型，OpenClaw 会改为回退到第一个已配置的提供商/模型，以避免暴露陈旧且已移除提供商的默认值。

完整命令行为/配置： [斜杠命令](/zh-CN/tools/slash-commands)。

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

`openclaw models`（无子命令）是 `models status` 的快捷方式。

### `models list`

默认显示已配置模型。有用的标志：

- `--all`：完整目录
- `--local`：仅本地提供商
- `--provider <name>`：按提供商筛选
- `--plain`：每行一个模型
- `--json`：机器可读输出

`--all` 会在配置凭证之前包含内置的、由提供商拥有的静态目录条目，因此仅发现视图可以显示那些在你添加匹配提供商凭证之前不可用的模型。

### `models status`

显示已解析的主模型、回退模型、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中找到的配置文件的 OAuth 过期状态（默认在 24 小时内到期时发出警告）。`--plain` 仅打印已解析的主模型。
OAuth 状态始终会显示（也会包含在 `--json` 输出中）。如果某个已配置提供商没有凭证，`models status` 会打印一个 **缺少凭证** 部分。JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`（每个提供商的生效凭证，包括由环境变量支持的凭证）。`auth.oauth` 仅表示凭证存储配置文件的健康状态；仅使用环境变量的提供商不会出现在其中。
自动化场景请使用 `--check`（缺失/已过期时退出码为 `1`，即将过期时为 `2`）。
使用 `--probe` 可执行实时凭证检查；探测行可来自凭证配置文件、环境变量凭证或 `models.json`。
如果显式 `auth.order.<provider>` 省略了一个已存储配置文件，探测会报告
`excluded_by_auth_order`，而不是尝试它。如果凭证存在，但无法为该提供商解析出可探测模型，则探测会报告 `status: no_model`。

凭证选择取决于提供商/账户。对于始终在线的 Gateway 网关主机，API 密钥通常是最可预测的；也支持复用 Claude CLI，以及现有的 Anthropic OAuth/token 配置文件。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并可选择探测模型对工具和图像的支持情况。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿）
- `--max-age-days <days>`：跳过较旧模型
- `--provider <name>`：提供商前缀筛选
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设为第一个选择项
- `--set-image`：将 `agents.defaults.imageModel.primary` 设为第一个图像选择项

探测需要 OpenRouter API 密钥（来自凭证配置文件或
`OPENROUTER_API_KEY`）。没有密钥时，请使用 `--no-probe` 仅列出候选项。

扫描结果按以下条件排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入

- OpenRouter `/models` 列表（筛选 `:free`）
- 需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（参见 [/environment](/zh-CN/help/environment)）
- 可选筛选：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式选择回退模型。在非交互模式下，传入 `--yes` 以接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会写入智能体目录下的 `models.json`（默认是 `~/.openclaw/agents/<agentId>/agent/models.json`）。默认情况下，此文件会被合并，除非 `models.mode` 设为 `replace`。

匹配提供商 ID 的合并模式优先级：

- 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
- 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商在当前配置/凭证配置文件上下文中**不是**由 SecretRef 管理时优先。
- 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不是持久化已解析的秘密值。
- 由 SecretRef 管理的提供商请求头值会从源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
- 空的或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
- 其他提供商字段会从配置和标准化目录数据中刷新。

标记持久化以源为准：OpenClaw 会根据当前源配置快照（预解析）写入标记，而不是根据运行时已解析的秘密值写入。
这适用于 OpenClaw 重新生成 `models.json` 的任何情况，包括像 `openclaw agent` 这样的命令驱动路径。

## 相关内容

- [Model Providers](/zh-CN/concepts/model-providers) — 提供商路由和凭证
- [Model Failover](/zh-CN/concepts/model-failover) — 回退链
- [Image Generation](/zh-CN/tools/image-generation) — 图像模型配置
- [Music Generation](/zh-CN/tools/music-generation) — 音乐模型配置
- [Video Generation](/zh-CN/tools/video-generation) — 视频模型配置
- [Configuration Reference](/zh-CN/gateway/configuration-reference#agent-defaults) — 模型配置键名
