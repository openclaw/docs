---
read_when:
    - 添加或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 更改模型回退行为或选择体验
    - 更新模型扫描探针（工具/图像）
sidebarTitle: Models CLI
summary: Models CLI：列出、设置、别名、回退、扫描、状态
title: Models CLI
x-i18n:
    generated_at: "2026-04-28T11:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d7ac971cf8e7b713a48c917eb4a95382372bf08afacff3e1cbb62d3da97965d
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型故障转移" href="/zh-CN/concepts/model-failover">
    凭证配置文件轮换、冷却时间，以及它们如何与回退交互。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers">
    快速提供商概览和示例。
  </Card>
  <Card title="Agent Runtimes" href="/zh-CN/concepts/agent-runtimes">
    PI、Codex 和其他 Agent loop 运行时。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults">
    模型配置键。
  </Card>
</CardGroup>

模型引用会选择提供商和模型。它们通常不会选择底层智能体运行时。例如，`openai/gpt-5.5` 可以通过常规 OpenAI provider 路径运行，也可以通过 Codex 应用服务器运行时运行，具体取决于 `agents.defaults.agentRuntime.id`。参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 模型选择如何工作

OpenClaw 按以下顺序选择模型：

<Steps>
  <Step title="主模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="回退">
    `agents.defaults.model.fallbacks`（按顺序）。
  </Step>
  <Step title="提供商凭证故障转移">
    凭证故障转移会在提供商内部发生，然后才会移动到下一个模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相关模型表面">
    - `agents.defaults.models` 是 OpenClaw 可以使用的模型允许列表/目录（外加别名）。
    - `agents.defaults.imageModel` **仅在**主模型无法接受图像时使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具会回退到 `agents.defaults.imageModel`，然后是已解析的会话/默认模型。
    - `agents.defaults.imageGenerationModel` 由共享图像生成能力使用。如果省略，`image_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试剩余已注册的图像生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API 密钥。
    - `agents.defaults.musicGenerationModel` 由共享音乐生成能力使用。如果省略，`music_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试剩余已注册的音乐生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API 密钥。
    - `agents.defaults.videoGenerationModel` 由共享视频生成能力使用。如果省略，`video_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试剩余已注册的视频生成提供商。如果你设置了特定提供商/模型，也要配置该提供商的凭证/API 密钥。
    - 单个智能体的默认值可以通过 `agents.list[].model` 加绑定覆盖 `agents.defaults.model`（参见 [多智能体路由](/zh-CN/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 选择来源和回退行为

同一个 `provider/model` 可能因来源不同而含义不同：

- 已配置的默认值（`agents.defaults.model.primary` 和智能体专属主模型）是常规起点，并使用 `agents.defaults.model.fallbacks`。
- 自动回退选择是临时恢复状态。它们会以 `modelOverrideSource: "auto"` 存储，因此后续轮次可以继续使用回退链，而无需先探测已知不可用的主模型。
- 用户会话选择是精确的。`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会存储 `modelOverrideSource: "user"`；如果所选提供商/模型不可达，OpenClaw 会显式失败，而不是继续落到另一个已配置模型。
- Cron `--model` / 载荷 `model` 是每个作业的主模型。除非作业提供显式载荷 `fallbacks`，否则它仍使用已配置回退（使用 `fallbacks: []` 可进行严格的 cron 运行）。
- CLI 默认模型和允许列表选择器会尊重 `models.mode: "replace"`，列出显式 `models.providers.*.models`，而不是加载完整内置目录。
- Control UI 模型选择器会向 Gateway 网关请求其已配置的模型视图：存在时使用 `agents.defaults.models`，否则使用显式 `models.providers.*.models`，否则使用完整目录，这样全新安装不会显示为空。

## 快速模型策略

- 将主模型设置为你可用的最强最新一代模型。
- 对成本/延迟敏感任务和低风险聊天使用回退。
- 对启用工具的智能体或不受信任的输入，避免使用较旧/较弱的模型层级。

## 新手引导（推荐）

如果你不想手动编辑配置，请运行新手引导：

```bash
openclaw onboard
```

它可以为常见提供商设置模型 + 凭证，包括 **OpenAI Code (Codex) 订阅**（OAuth）和 **Anthropic**（API 密钥或 Claude CLI）。

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

手动更新 `agents.defaults.models` 时使用追加写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆盖保护规则">
    `openclaw config set` 会保护模型/提供商映射，防止意外覆盖。当普通对象赋值会移除现有条目时，对 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的赋值会被拒绝。使用 `--merge` 进行追加更改；仅在所提供的值应成为完整目标值时使用 `--replace`。

    交互式提供商设置和 `openclaw configure --section model` 也会将提供商范围的选择合并到现有允许列表中，因此添加 Codex、Ollama 或其他提供商不会丢弃无关模型条目。重新应用提供商凭证时，configure 会保留现有的 `agents.defaults.model.primary`。显式默认值设置命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍会替换 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## “模型不被允许”（以及回复为何停止）

如果设置了 `agents.defaults.models`，它会成为 `/model` 和会话覆盖的**允许列表**。当用户选择不在该允许列表中的模型时，OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
这发生在正常回复生成**之前**，所以这条消息可能让人感觉它“没有响应”。修复方式是：

- 将该模型添加到 `agents.defaults.models`，或
- 清除允许列表（移除 `agents.defaults.models`），或
- 从 `/model list` 选择一个模型。

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

你可以无需重启即可为当前会话切换模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="选择器行为">
    - `/model`（以及 `/model list`）是一个紧凑的编号选择器（模型族 + 可用提供商）。
    - 在 Discord 上，`/model` 和 `/models` 会打开一个交互式选择器，包含提供商和模型下拉菜单以及提交步骤。
    - `/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。
    - `/model <#>` 会从该选择器中选择。

  </Accordion>
  <Accordion title="持久化和实时切换">
    - `/model` 会立即持久化新的会话选择。
    - 如果智能体处于空闲状态，下一次运行会立即使用新模型。
    - 如果某次运行已处于活动状态，OpenClaw 会将实时切换标记为待处理，并且只会在干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，待处理切换可能会保持排队，直到后续重试机会或下一次用户轮次。
    - 用户选择的 `/model` 引用对该会话是严格的：如果所选提供商/模型不可达，回复会显式失败，而不是静默地从 `agents.defaults.model.fallbacks` 回答。这不同于已配置默认值和 cron 作业主模型，后者仍可使用回退链。
    - `/model status` 是详细视图（凭证候选项，以及配置时的提供商端点 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="引用解析">
    - 模型引用通过按**第一个** `/` 拆分来解析。输入 `/model <ref>` 时使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 风格），你必须包含提供商前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略提供商，OpenClaw 会按以下顺序解析输入：
      1. 别名匹配
      2. 对该精确未加前缀模型 ID 的唯一已配置提供商匹配
      3. 已弃用的回退到已配置默认提供商 —— 如果该提供商不再暴露已配置的默认模型，OpenClaw 会改为回退到第一个已配置提供商/模型，以避免暴露过时的已移除提供商默认值。
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

默认显示已配置模型。实用标志：

<ParamField path="--all" type="boolean">
  完整目录。包括在配置凭证之前由内置提供商拥有的静态目录行，因此仅设备发现视图可以显示在添加匹配提供商凭证前不可用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  仅本地提供商。
</ParamField>
<ParamField path="--provider <id>" type="string">
  按提供商 ID 过滤，例如 `moonshot`。不接受交互式选择器中的显示标签。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一个模型。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出。
</ParamField>

### `models status`

显示已解析的主模型、回退、图像模型，以及已配置提供商的凭证概览。它还会显示在凭证存储中找到的配置文件的 OAuth 过期状态（默认在 24 小时内警告）。`--plain` 仅打印已解析的主模型。

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - OAuth 状态始终会显示（并包含在 `--json` 输出中）。如果已配置的提供商没有凭证，`models status` 会打印 **缺少认证** 部分。
    - JSON 包含 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`（每个提供商的有效认证，包括由环境变量支持的凭证）。`auth.oauth` 只表示 auth-store 配置文件健康状态；仅使用环境变量的提供商不会出现在那里。
    - 将 `--check` 用于自动化（缺失/过期时退出 `1`，即将过期时退出 `2`）。
    - 将 `--probe` 用于实时认证检查；探测行可以来自认证配置文件、环境变量凭证或 `models.json`。
    - 如果显式的 `auth.order.<provider>` 省略了已存储的配置文件，探测会报告 `excluded_by_auth_order`，而不是尝试它。如果存在认证但无法为该提供商解析出可探测的模型，探测会报告 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
认证选择取决于提供商/账户。对于始终在线的 Gateway 网关主机，API 密钥通常最可预测；也支持复用 Claude CLI，以及使用现有 Anthropic OAuth/token 配置文件。
</Note>

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 会检查 OpenRouter 的**免费模型目录**，并可选择探测模型对工具和图像的支持情况。

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
  将 `agents.defaults.model.primary` 设置为第一个选择。
</ParamField>
<ParamField path="--set-image" type="boolean">
  将 `agents.defaults.imageModel.primary` 设置为第一个图像选择。
</ParamField>

<Note>
OpenRouter `/models` 目录是公开的，因此仅元数据扫描可以在没有密钥的情况下列出免费候选项。探测和推理仍需要 OpenRouter API 密钥（来自认证配置文件或 `OPENROUTER_API_KEY`）。如果没有可用密钥，`openclaw models scan` 会回退到仅元数据输出，并保持配置不变。使用 `--no-probe` 可显式请求仅元数据模式。
</Note>

扫描结果按以下顺序排名：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入：

- OpenRouter `/models` 列表（过滤 `:free`）
- 实时探测需要来自认证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（参见[环境变量](/zh-CN/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 请求/探测控制：`--timeout`、`--concurrency`

在 TTY 中运行实时探测时，你可以交互式选择回退项。在非交互模式下，传入 `--yes` 接受默认值。仅元数据结果只供参考；`--set-default` 和 `--set-image` 需要实时探测，以免 OpenClaw 配置无法使用的无密钥 OpenRouter 模型。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供商会写入智能体目录下的 `models.json`（默认 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 设置为 `replace`，否则默认会合并此文件。

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    匹配提供商 ID 时的合并模式优先级：

    - 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
    - 智能体 `models.json` 中的非空 `apiKey` 仅在该提供商未由当前配置/auth-profile 上下文中的 SecretRef 管理时优先。
    - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件/执行引用为 `secretref-managed`），而不是持久化已解析的密钥。
    - 由 SecretRef 管理的提供商标头值会从源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件/执行引用为 `secretref-managed`）。
    - 空或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置 `models.providers`。
    - 其他提供商字段会从配置和规范化的目录数据刷新。

  </Accordion>
</AccordionGroup>

<Note>
标记持久化以来源为权威：OpenClaw 从活动源配置快照（解析前）写入标记，而不是从已解析的运行时密钥值写入。每当 OpenClaw 重新生成 `models.json` 时都会如此，包括像 `openclaw agent` 这样的命令驱动路径。
</Note>

## 相关

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes) — PI、Codex 和其他 Agent loop 运行时
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [模型故障转移](/zh-CN/concepts/model-failover) — 回退链
- [模型提供商](/zh-CN/concepts/model-providers) — 提供商路由和认证
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
