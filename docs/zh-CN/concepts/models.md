---
read_when:
    - 添加或修改 Models CLI（`models list`/`set`/`scan`/`aliases`/`fallbacks`）
    - 更改模型回退行为或选择 UX
    - 更新模型扫描探测项（工具/图像）
sidebarTitle: Models CLI
summary: Models CLI：列出、设置、别名、回退、扫描、状态
title: Models CLI
x-i18n:
    generated_at: "2026-04-27T22:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfef1487555598bf123d691fcff451a3fe74916564abafed5fd326396c5c679a
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="模型故障转移" href="/zh-CN/concepts/model-failover">
    凭证配置轮换、冷却时间，以及它们如何与回退机制交互。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers">
    提供商快速概览与示例。
  </Card>
  <Card title="Agent Runtimes" href="/zh-CN/concepts/agent-runtimes">
    PI、Codex 和其他智能体循环运行时。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults">
    模型配置键。
  </Card>
</CardGroup>

模型引用会选择一个提供商和模型。它们通常不会选择底层的智能体运行时。例如，`openai/gpt-5.5` 可以通过常规的 OpenAI provider 路径运行，也可以通过 Codex app-server 运行时运行，具体取决于 `agents.defaults.agentRuntime.id`。请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 模型选择的工作方式

OpenClaw 会按以下顺序选择模型：

<Steps>
  <Step title="主模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="回退模型">
    `agents.defaults.model.fallbacks`（按顺序）。
  </Step>
  <Step title="提供商凭证故障转移">
    在切换到下一个模型之前，凭证故障转移会先在提供商内部发生。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相关模型配置面">
    - `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录（以及别名）。
    - `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会依次回退到 `agents.defaults.imageModel`，然后是已解析的会话/默认模型。
    - `agents.defaults.imageGenerationModel` 用于共享的图像生成功能。如果省略，`image_generate` 仍然可以推断出一个由凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的图像生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
    - `agents.defaults.musicGenerationModel` 用于共享的音乐生成功能。如果省略，`music_generate` 仍然可以推断出一个由凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的音乐生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
    - `agents.defaults.videoGenerationModel` 用于共享的视频生成功能。如果省略，`video_generate` 仍然可以推断出一个由凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的视频生成提供商。如果你设置了特定的提供商/模型，也请配置该提供商的凭证/API 密钥。
    - 每个智能体的默认值可以通过 `agents.list[].model` 加上绑定来覆盖 `agents.defaults.model`（参见 [多智能体路由](/zh-CN/concepts/multi-agent)）。
  </Accordion>
</AccordionGroup>

## 快速模型策略

- 将你的主模型设置为你可用的最新一代中最强的模型。
- 对成本/延迟敏感的任务和较低风险的聊天使用回退模型。
- 对启用了工具的智能体或不受信任的输入，避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code（Codex）订阅**（OAuth）和 **Anthropic**（API 密钥或 Claude CLI）。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

<Note>
模型引用会被规范化为小写。像 `z.ai/*` 这样的提供商别名会规范化为 `zai/*`。

提供商配置示例（包括 OpenCode）位于 [OpenCode](/zh-CN/providers/opencode)。
</Note>

### 安全地编辑允许列表

手动更新 `agents.defaults.models` 时，请使用增量写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="防止覆盖规则">
    `openclaw config set` 会保护模型/提供商映射，防止被意外覆盖。对于 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的普通对象赋值，如果会删除现有条目，就会被拒绝。对增量变更请使用 `--merge`；仅当提供的值应成为完整目标值时才使用 `--replace`。

    交互式提供商设置和 `openclaw configure --section model` 也会将提供商作用域的选择合并到现有允许列表中，因此添加 Codex、Ollama 或其他提供商时，不会删除无关的模型条目。重新应用提供商凭证时，Configure 会保留现有的 `agents.defaults.model.primary`。像 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 这类显式设置默认值的命令，仍然会替换 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## “模型不被允许”（以及为什么回复会停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和会话覆盖的**允许列表**。当用户选择的模型不在该允许列表中时，OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
这会在正常回复生成**之前**发生，因此这条消息可能会让人感觉它“没有响应”。修复方法是：

- 将该模型添加到 `agents.defaults.models`，或
- 清除允许列表（移除 `agents.defaults.models`），或
- 从 `/model list` 中选择一个模型。
  </Warning>

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

<AccordionGroup>
  <Accordion title="选择器行为">
    - `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型家族 + 可用提供商）。
    - 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，包含提供商和模型下拉菜单，以及提交步骤。
    - `/models add` 已弃用，现在会返回弃用消息，而不是通过聊天注册模型。
    - `/model <#>` 会从该选择器中进行选择。
  </Accordion>
  <Accordion title="持久化与实时切换">
    - `/model` 会立即持久化新的会话选择。
    - 如果智能体空闲，下一次运行会立即使用新模型。
    - 如果已有运行处于活动状态，OpenClaw 会将实时切换标记为待处理，并且只会在一个干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，则待处理切换可能会一直排队，直到之后的重试机会或下一次用户轮次。
    - 用户为该会话选择的 `/model` 引用是严格的：如果所选提供商/模型不可达，回复会明确失败，而不是悄悄地从 `agents.defaults.model.fallbacks` 返回答案。
    - `/model status` 是详细视图（凭证候选项，以及在已配置时显示提供商端点 `baseUrl` + `api` 模式）。
  </Accordion>
  <Accordion title="引用解析">
    - 模型引用通过在**第一个** `/` 处分割来解析。输入 `/model <ref>` 时请使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果你省略了提供商，OpenClaw 会按以下顺序解析输入：
      1. 别名匹配
      2. 对该确切无前缀模型 id 的唯一已配置提供商匹配
      3. 已弃用的回退：使用已配置的默认提供商 —— 如果该提供商不再公开已配置的默认模型，OpenClaw 会改为回退到第一个已配置的提供商/模型，以避免暴露过时的、已移除提供商默认值。
  </Accordion>
</AccordionGroup>

完整命令行为/配置：参见 [斜杠命令](/zh-CN/tools/slash-commands)。

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

默认显示已配置的模型。有用的标志：

<ParamField path="--all" type="boolean">
  完整目录。包括在配置凭证之前由内置提供商拥有的静态目录行，因此仅发现视图也可以显示那些在你添加匹配提供商凭证之前不可用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  仅限本地提供商。
</ParamField>
<ParamField path="--provider <id>" type="string">
  按提供商 id 过滤，例如 `moonshot`。不接受交互式选择器中的显示标签。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一个模型。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出。
</ParamField>

### `models status`

显示已解析的主模型、回退模型、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中找到的配置文件的 OAuth 过期状态（默认会在 24 小时内到期时发出警告）。`--plain` 只打印已解析的主模型。

<AccordionGroup>
  <Accordion title="凭证与探测行为">
    - OAuth 状态始终会显示（并包含在 `--json` 输出中）。如果某个已配置提供商没有凭证，`models status` 会打印一个**缺少凭证**部分。
    - JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`（每个提供商的有效凭证，包括由环境变量支持的凭证）。`auth.oauth` 仅表示凭证存储中配置文件的健康状态；仅使用环境变量的提供商不会出现在其中。
    - 对自动化用途请使用 `--check`（缺失/已过期时退出码为 `1`，即将过期时为 `2`）。
    - 对实时凭证检查请使用 `--probe`；探测行可能来自凭证配置文件、环境变量凭证或 `models.json`。
    - 如果显式的 `auth.order.<provider>` 省略了某个已存储配置文件，探测会报告 `excluded_by_auth_order`，而不是尝试它。如果凭证存在，但无法为该提供商解析出可探测模型，则探测会报告 `status: no_model`。
  </Accordion>
</AccordionGroup>

<Note>
凭证选择取决于提供商/账号。对于常开型 Gateway 网关主机，API 密钥通常最可预测；也支持复用 Claude CLI，以及现有的 Anthropic OAuth/token 配置文件。
</Note>

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并且可以选择性地探测模型是否支持工具和图像。

<ParamField path="--no-probe" type="boolean">
  跳过实时探测（仅元数据）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小参数规模（十亿）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  跳过较旧的模型。
</ParamField>
<ParamField path="--provider <name>" type="string">
  提供商前缀过滤器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  回退列表大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  将 `agents.defaults.model.primary` 设置为第一个选中的项。
</ParamField>
<ParamField path="--set-image" type="boolean">
  将 `agents.defaults.imageModel.primary` 设置为第一个图像选中的项。
</ParamField>

<Note>
OpenRouter 的 `/models` 目录是公开的，因此仅元数据扫描无需密钥即可列出免费候选模型。探测和推理仍然需要 OpenRouter API 密钥（来自凭证配置文件或 `OPENROUTER_API_KEY`）。如果没有可用密钥，`openclaw models scan` 会回退到仅元数据输出，并保持配置不变。使用 `--no-probe` 可显式请求仅元数据模式。
</Note>

扫描结果按以下顺序排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入：

- OpenRouter `/models` 列表（过滤 `:free`）
- 实时探测需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（参见 [环境变量](/zh-CN/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 请求/探测控制：`--timeout`、`--concurrency`

当实时探测在 TTY 中运行时，你可以交互式选择回退模型。在非交互模式下，传入 `--yes` 以接受默认值。仅元数据结果仅供参考；`--set-default` 和 `--set-image` 需要实时探测，这样 OpenClaw 就不会配置一个无法使用、无密钥的 OpenRouter 模型。

## Models 注册表（`models.json`）

`models.providers` 中的自定义提供商会被写入智能体目录下的 `models.json`（默认路径为 `~/.openclaw/agents/<agentId>/agent/models.json`）。默认情况下会合并此文件，除非 `models.mode` 设置为 `replace`。

<AccordionGroup>
  <Accordion title="合并模式优先级">
    对于匹配的提供商 ID，合并模式优先级如下：

    - 智能体 `models.json` 中已有的非空 `baseUrl` 优先。
    - 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商在当前配置/凭证配置文件上下文中不是 SecretRef 管理时优先。
    - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
    - 由 SecretRef 管理的提供商标头值会从源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
    - 空的或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
    - 其他提供商字段会从配置和规范化后的目录数据刷新。

  </Accordion>
</AccordionGroup>

<Note>
标记持久化以源为权威：OpenClaw 会从活动源配置快照（解析前）写入标记，而不是从已解析的运行时密钥值写入。只要 OpenClaw 重新生成 `models.json`，此规则都会适用，包括像 `openclaw agent` 这样的命令驱动路径。
</Note>

## 相关内容

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes) — PI、Codex 和其他智能体循环运行时
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [模型故障转移](/zh-CN/concepts/model-failover) — 回退链
- [模型提供商](/zh-CN/concepts/model-providers) — 提供商路由与凭证
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
