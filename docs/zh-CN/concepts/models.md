---
read_when:
    - 添加或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 更改模型回退行为或选择体验
    - 更新模型扫描探测（工具/图像）
sidebarTitle: Models CLI
summary: Models CLI：列出、设置、别名、回退、扫描、Status
title: Models CLI
x-i18n:
    generated_at: "2026-05-02T02:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型故障转移" href="/zh-CN/concepts/model-failover">
    凭证配置档轮换、冷却时间，以及它们如何与回退交互。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers">
    快速提供商概览和示例。
  </Card>
  <Card title="Agent Runtimes" href="/zh-CN/concepts/agent-runtimes">
    Pi、Codex 和其他 Agent loop 运行时。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults">
    模型配置键。
  </Card>
</CardGroup>

模型引用会选择一个提供商和模型。它们通常不会选择底层 Agent Runtimes。例如，`openai/gpt-5.5` 可以通过常规 OpenAI provider 路径运行，也可以通过 Codex 应用服务器运行时运行，具体取决于 `agents.defaults.agentRuntime.id`。在 Codex 运行时模式下，`openai/gpt-*` 引用并不意味着 API key 计费；凭证可以来自 Codex 账户或 `openai-codex` 凭证配置档。参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 模型选择的工作方式

OpenClaw 按以下顺序选择模型：

<Steps>
  <Step title="主模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="回退">
    `agents.defaults.model.fallbacks`（按顺序）。
  </Step>
  <Step title="提供商凭证故障转移">
    凭证故障转移会先在提供商内部发生，然后才移动到下一个模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相关模型表面">
    - `agents.defaults.models` 是 OpenClaw 可用模型的允许列表/目录（加上别名）。
    - `agents.defaults.imageModel` **仅在**主模型无法接受图片时使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会回退到 `agents.defaults.imageModel`，然后回退到解析后的会话/默认模型。
    - `agents.defaults.imageGenerationModel` 由共享图片生成能力使用。如果省略，`image_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图片生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API key。
    - `agents.defaults.musicGenerationModel` 由共享音乐生成能力使用。如果省略，`music_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API key。
    - `agents.defaults.videoGenerationModel` 由共享视频生成能力使用。如果省略，`video_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API key。
    - 单个智能体默认值可以通过 `agents.list[].model` 加绑定来覆盖 `agents.defaults.model`（参见[多智能体路由](/zh-CN/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 选择来源和回退行为

同一个 `provider/model` 可能含义不同，具体取决于它来自哪里：

- 已配置默认值（`agents.defaults.model.primary` 和智能体专属主模型）是常规起点，并使用 `agents.defaults.model.fallbacks`。
- 自动回退选择是临时恢复状态。它们会以 `modelOverrideSource: "auto"` 存储，因此后续轮次可以继续使用回退链，而无需先探测已知不可用的主模型。
- 用户会话选择是精确的。`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会存储 `modelOverrideSource: "user"`；如果所选提供商/模型不可达，OpenClaw 会显式失败，而不是落到另一个已配置模型。
- Cron `--model` / payload `model` 是单个作业的主模型。它仍会使用已配置回退，除非作业提供显式 payload `fallbacks`（严格 cron 运行请使用 `fallbacks: []`）。
- CLI 默认模型和允许列表选择器会遵守 `models.mode: "replace"`，列出显式的 `models.providers.*.models`，而不是加载完整内置目录。
- Control UI 模型选择器会向 Gateway 网关请求其已配置的模型视图：存在时使用 `agents.defaults.models`，否则使用显式的 `models.providers.*.models` 加上有可用凭证的提供商。完整内置目录仅保留给显式浏览视图，例如带有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型策略

- 将主模型设置为你可用的最强新一代模型。
- 对成本/延迟敏感任务和低风险聊天使用回退。
- 对启用工具的智能体或不可信输入，避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code (Codex) 订阅**（OAuth）和 **Anthropic**（API key 或 Claude CLI）。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + 提供商参数）
- `models.providers`（写入 `models.json` 的自定义提供商）

<Note>
模型引用会规范化为小写。像 `z.ai/*` 这样的提供商别名会规范化为 `zai/*`。

提供商配置示例（包括 OpenCode）位于 [OpenCode](/zh-CN/providers/opencode)。
</Note>

### 安全编辑允许列表

手动更新 `agents.defaults.models` 时使用增量写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆盖保护规则">
    `openclaw config set` 会保护模型/提供商映射，避免意外覆盖。对 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的普通对象赋值，如果会移除现有条目，将被拒绝。使用 `--merge` 进行增量更改；仅当提供的值应该成为完整目标值时，才使用 `--replace`。

    交互式提供商设置和 `openclaw configure --section model` 也会将提供商作用域的选择合并到现有允许列表中，因此添加 Codex、Ollama 或其他提供商不会删除无关的模型条目。重新应用提供商凭证时，configure 会保留现有 `agents.defaults.model.primary`。显式默认值设置命令（例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`）仍会替换 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## “不允许使用模型”（以及回复为什么停止）

如果设置了 `agents.defaults.models`，它就会成为 `/model` 和会话覆盖的**允许列表**。当用户选择不在该允许列表中的模型时，OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
这发生在生成常规回复**之前**，所以这条消息可能让人感觉像是“没有响应”。修复方式是以下任一项：

- 将该模型添加到 `agents.defaults.models`，或
- 清除允许列表（移除 `agents.defaults.models`），或
- 从 `/model list` 中选择一个模型。

</Warning>

对于本地/GGUF 模型，请在允许列表中存储带完整提供商前缀的引用，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 显示的确切提供商/模型。
当允许列表处于活动状态时，仅有本地文件名或显示名称是不够的。

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

你可以在不重启的情况下切换当前会话的模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="选择器行为">
    - `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型系列 + 可用提供商）。
    - 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，其中包含提供商和模型下拉菜单以及一个 Submit 步骤。
    - `/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。
    - `/model <#>` 会从该选择器中选择。

  </Accordion>
  <Accordion title="持久化和实时切换">
    - `/model` 会立即持久化新的会话选择。
    - 如果智能体处于空闲状态，下一次运行会立即使用新模型。
    - 如果已有运行处于活动状态，OpenClaw 会将实时切换标记为待处理，并且只会在干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，待处理切换可能会一直排队到后续重试机会或下一个用户轮次。
    - 用户选择的 `/model` 引用对该会话是严格的：如果所选提供商/模型不可达，回复会显式失败，而不是悄悄从 `agents.defaults.model.fallbacks` 作答。这不同于已配置默认值和 cron 作业主模型，后两者仍可使用回退链。
    - `/model status` 是详细视图（凭证候选项，以及在已配置时显示提供商端点 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="引用解析">
    - 模型引用通过在**第一个** `/` 处分割来解析。输入 `/model <ref>` 时请使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略提供商，OpenClaw 会按以下顺序解析输入：
      1. 别名匹配
      2. 与该精确无前缀模型 ID 唯一匹配的已配置提供商
      3. 已弃用的回退到已配置默认提供商 — 如果该提供商不再公开已配置默认模型，OpenClaw 会改为回退到第一个已配置提供商/模型，以避免暴露陈旧的已移除提供商默认值。
  </Accordion>
</AccordionGroup>

完整命令行为/配置：[斜杠命令](/zh-CN/tools/slash-commands)。

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

默认显示已配置/凭证可用的模型。实用标志：

<ParamField path="--all" type="boolean">
  完整目录。包含在配置凭证前由内置提供商拥有的静态目录行，因此仅设备发现视图可以显示在你添加匹配的提供商凭证前不可用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  仅本地提供商。
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

显示解析后的主模型、备用模型、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中找到的配置文件的 OAuth 过期 Status（默认在 24h 内警告）。`--plain` 仅打印解析后的主模型。

<AccordionGroup>
  <Accordion title="凭证和探测行为">
    - OAuth Status 始终显示（并包含在 `--json` 输出中）。如果已配置的提供商没有凭证，`models status` 会打印 **缺少凭证** 部分。
    - JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`（每个提供商的有效凭证，包括由环境变量支持的凭证）。`auth.oauth` 仅表示凭证存储配置文件健康状况；仅环境变量提供商不会出现在其中。
    - 使用 `--check` 进行自动化（缺失/过期时退出 `1`，即将过期时退出 `2`）。
    - 使用 `--probe` 进行实时凭证检查；探测行可以来自凭证配置文件、环境变量凭证或 `models.json`。
    - 如果显式的 `auth.order.<provider>` 省略了已存储的配置文件，探测会报告 `excluded_by_auth_order`，而不是尝试它。如果凭证存在但无法为该提供商解析出可探测模型，探测会报告 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
凭证选择取决于提供商/账号。对于常驻 Gateway 网关主机，API key 通常最可预测；也支持复用 Claude CLI 以及已有的 Anthropic OAuth/token 配置文件。
</Note>

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并可选择探测模型的工具和图像支持。

<ParamField path="--no-probe" type="boolean">
  跳过实时探测（仅元数据）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小参数规模（十亿）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  跳过较旧模型。
</ParamField>
<ParamField path="--provider <name>" type="string">
  提供商前缀过滤器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  备用列表大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  将 `agents.defaults.model.primary` 设置为第一个选择项。
</ParamField>
<ParamField path="--set-image" type="boolean">
  将 `agents.defaults.imageModel.primary` 设置为第一个图像选择项。
</ParamField>

<Note>
OpenRouter `/models` 目录是公开的，因此仅元数据扫描无需 key 即可列出免费候选项。探测和推理仍需要 OpenRouter API key（来自凭证配置文件或 `OPENROUTER_API_KEY`）。如果没有可用 key，`openclaw models scan` 会回退到仅元数据输出，并保持配置不变。使用 `--no-probe` 可显式请求仅元数据模式。
</Note>

扫描结果按以下顺序排名：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入：

- OpenRouter `/models` 列表（过滤 `:free`）
- 实时探测需要来自凭证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API key（参见[环境变量](/zh-CN/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 请求/探测控制：`--timeout`、`--concurrency`

当实时探测在 TTY 中运行时，你可以交互式选择备用模型。在非交互模式下，传入 `--yes` 接受默认值。仅元数据结果只提供信息；`--set-default` 和 `--set-image` 需要实时探测，因此 OpenClaw 不会配置一个无法使用的无 key OpenRouter 模型。

## Models 注册表（`models.json`）

`models.providers` 中的自定义提供商会写入 Agent 目录下的 `models.json`（默认 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 设置为 `replace`，否则默认会合并此文件。

<AccordionGroup>
  <Accordion title="合并模式优先级">
    匹配提供商 ID 的合并模式优先级：

    - Agent `models.json` 中已有的非空 `baseUrl` 优先。
    - Agent `models.json` 中的非空 `apiKey` 仅在该提供商未在当前配置/凭证配置文件上下文中由 SecretRef 管理时优先。
    - 由 SecretRef 管理的提供商 `apiKey` 值会从来源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`），而不是持久化解析后的密钥。
    - 由 SecretRef 管理的提供商标头值会从来源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`）。
    - 空的或缺失的 Agent `apiKey`/`baseUrl` 会回退到配置 `models.providers`。
    - 其他提供商字段会从配置和规范化后的目录数据刷新。

  </Accordion>
</AccordionGroup>

<Note>
标记持久化以来源为权威：OpenClaw 会从活动来源配置快照（解析前）写入标记，而不是从解析后的运行时密钥值写入。只要 OpenClaw 重新生成 `models.json`，这都会适用，包括像 `openclaw agent` 这样的命令驱动路径。
</Note>

## 相关

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes) — PI、Codex 以及其他 Agent loop 运行时
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [模型故障转移](/zh-CN/concepts/model-failover) — 备用链
- [模型提供商](/zh-CN/concepts/model-providers) — 提供商路由和凭证
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
