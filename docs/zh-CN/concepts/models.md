---
read_when:
    - 更改模型回退行为或选择体验
    - 调试“模型不被允许”或默认提供商回退已过时的问题
    - 正在处理 models.json 的合并和密钥行为
sidebarTitle: Models CLI
summary: OpenClaw 如何解析提供商/模型引用、配置键和 `/model` 聊天命令
title: 模型 CLI
x-i18n:
    generated_at: "2026-07-12T14:25:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型故障转移" href="/zh-CN/concepts/model-failover">
    身份验证配置文件轮换、冷却，以及它们如何与回退机制交互。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers">
    提供商快速概览和示例。
  </Card>
  <Card title="模型 CLI 参考" href="/zh-CN/cli/models">
    完整的 `openclaw models` 命令和标志参考。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults">
    模型配置键、默认值和示例。
  </Card>
</CardGroup>

模型引用（`provider/model`）选择的是提供商和模型，而不是底层
Agent Runtimes。当运行时策略未设置或为 `auto` 时，仅对于没有自行指定请求覆盖的、完全匹配的官方 HTTPS Platform
Responses 或 ChatGPT Responses 路由，OpenAI 提供商自有的
路由策略才可能选择 Codex；仅有 `openai/*` 前缀绝不会选择 Codex。Completions 适配器、自定义
端点和自行指定的请求行为仍由 OpenClaw 处理。官方明文
HTTP 端点会被拒绝。请参阅 [OpenAI 隐式 Agent Runtimes](/zh-CN/providers/openai#implicit-agent-runtime)。

订阅版 Copilot 引用（`github-copilot/*`）可以选择加入外部
GitHub Copilot agent runtime 插件，但该路径始终是显式选择的（绝不会
由 `auto` 选中）。运行时覆盖应设置在提供商/模型策略上，而不是
整个智能体或会话上。运行时选择并不决定计费方式：
OpenAI API key 凭据与 ChatGPT/Codex 订阅凭据仍彼此独立。请参阅
[Agent Runtimes](/zh-CN/concepts/agent-runtimes) 和
[GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## 选择顺序

<Steps>
  <Step title="主模型">
    `agents.defaults.model.primary`（或作为纯字符串的 `agents.defaults.model`）。
  </Step>
  <Step title="回退模型">
    `agents.defaults.model.fallbacks`，按顺序尝试。
  </Step>
  <Step title="身份验证故障转移">
    在 OpenClaw 转移到下一个回退模型之前，会先在提供商内部轮换身份验证配置文件。
  </Step>
</Steps>

相关的模型配置项：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录，也包含别名。使用 `provider/*` 条目可允许来自某个提供商的所有已发现模型，而无需逐一列出。
- `agents.defaults.utilityModel` 是一个可选的低成本模型，用于生成控制面板会话标题、受支持渠道的线程/主题标题和进度叙述等简短内部任务。每个智能体的 `agents.list[].utilityModel` 可覆盖它。未设置时，如果主提供商声明了小模型默认值，OpenClaw 会使用该值（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）；否则使用智能体的主模型；将其设为空字符串可禁用实用任务路由。实用任务是独立的模型调用，可能会将有限的任务内容发送给所选模型提供商。
- `agents.defaults.imageModel` 仅在主模型无法接受图像时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果未设置，该工具会依次回退到 `imageModel` 和解析后的会话/默认模型。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel` 和 `videoGenerationModel` 为共享媒体生成工具提供支持。如果未设置，每个工具都会推断一个有身份验证支持的提供商默认值：先使用当前默认提供商，再按提供商 ID 顺序尝试为该能力注册的其余提供商。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可禁用这种跨提供商推断，同时保留显式回退。
- 每个智能体的 `agents.list[].model`（以及绑定）会覆盖 `agents.defaults.model`——请参阅[多智能体路由](/zh-CN/concepts/multi-agent)。

完整的键参考、默认值和 JSON5 示例：[配置参考](/zh-CN/gateway/config-agents#agent-defaults)。

## 选择来源和回退严格程度

同一个 `provider/model` 会根据其来源表现出不同的行为：

| 来源                                                                    | 行为                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已配置的默认值（`agents.defaults.model.primary`、每个智能体的主模型）   | 常规起点；使用 `agents.defaults.model.fallbacks`。                                                                                                                                                                                                              |
| 自动回退                                                                | 临时恢复状态，存储为 `modelOverrideSource: "auto"`。OpenClaw 会定期重新探测原主模型，在恢复后清除自动选择，并在每次状态变化时仅播报一次回退/恢复转换。                                                                                                           |
| 用户会话选择                                                            | 精确且严格。`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会存储 `modelOverrideSource: "user"`。如果该提供商/模型变得不可访问，运行会明确失败，而不会继续回退到其他已配置模型。                                                            |
| Cron `--model` / 载荷 `model`                                           | 每个作业的主模型。除非作业通过自己的载荷提供 `fallbacks`，否则仍使用已配置的回退模型（`fallbacks: []` 会强制严格运行）。                                                                                                                                         |

其他选择规则：

- 更改 `agents.defaults.model.primary` 不会重写现有会话的固定模型。如果状态报告 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，请运行 `/model default` 清除固定设置。
- 当 `models.mode: "replace"` 时，CLI 默认模型和允许列表选择器仅列出 `models.providers.*.models`，而不是完整的内置目录。
- Control UI 模型选择器会向 Gateway 网关请求其已配置的模型视图：如果设置了 `agents.defaults.models`，则使用它（包括 `provider/*` 通配符条目）；否则使用 `models.providers.*.models` 加上具有可用身份验证的提供商。完整的内置目录仅供显式浏览视图使用（带有 `view: "all"` 的 `models.list`，或 `openclaw models list --all`）。
- 提供商清单 UI 使用带有 `view: "provider-config"` 的 `models.list` 来显示源配置中定义的 `models.providers.*.models` 行，而不应用选择器允许列表。

完整机制：[模型故障转移](/zh-CN/concepts/model-failover)。

## 快速模型策略

- 将你的主模型设置为你可用的最强最新一代模型。
- 对成本/延迟敏感的任务和低风险聊天使用回退模型。
- 对于启用工具的智能体或不受信任的输入，请避免使用较旧或较弱的模型层级。

## 新手引导

```bash
openclaw onboard
```

为常见提供商设置模型和身份验证，无需手动编辑配置，其中包括 OpenAI Codex 订阅 OAuth 和 Anthropic（API key 或复用 Claude CLI）。

如果未配置主模型，全新的 OpenAI API key 设置会选择
`openai/gpt-5.6`；不带层级的直接 API ID 会解析到 Sol 层级。全新的
ChatGPT/Codex OAuth 设置会选择确切的 `openai/gpt-5.6-sol` 目录引用。
重新进行身份验证会保留现有的显式主模型，包括
`openai/gpt-5.5`。如果账户无法使用 GPT-5.6，请显式选择
`openai/gpt-5.5`；OpenClaw 不会静默降级。

## “不允许使用该模型”（以及回复为何停止）

如果设置了 `agents.defaults.models`，它将成为 `/model` 和会话覆盖的允许列表。选择该允许列表之外的模型时，会在生成任何正常回复之前返回：

```text
不允许使用模型 "provider/model"。使用 /models 列出提供商，或使用 /models <provider> 列出模型。
使用以下命令添加：openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

修复方法是将模型添加到 `agents.defaults.models`、完全清除允许列表（移除该键），或从 `/model list` 中选择模型。如果被拒绝的命令包含运行时覆盖，例如 `/model openai/gpt-5.5 --runtime codex`，请先修复允许列表，然后重试相同的 `/model ... --runtime ...` 命令。

对于本地/GGUF 模型，允许列表需要包含完整的提供商前缀引用，例如 `ollama/gemma4:26b` 或 `lmstudio/Gemma4-26b-a4-it-gguf`——请使用 `openclaw models list --provider <provider>` 查看确切字符串。允许列表启用后，仅使用文件名或显示名称是不够的。

若要限制提供商而不逐一列出每个模型，请使用 `provider/*` 通配符条目：

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

此后，`/model`、`/models` 和模型选择器将仅显示这些提供商的已发现目录，新模型也可以在不编辑允许列表的情况下出现。你可以混用精确的 `provider/model` 条目和 `provider/*` 条目，以从另一个提供商引入某个特定模型。

带别名的允许列表示例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="从 CLI 安全编辑允许列表">
使用 `--merge` 进行增量更改：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

当对 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 进行纯对象赋值会删除现有条目时，`openclaw config set` 会拒绝该操作；仅当新值应成为完整目标值时才使用 `--replace`。交互式提供商设置和 `openclaw configure --section model` 已经会将提供商范围的选择合并到允许列表中，因此添加提供商不会删除无关条目；配置操作会保留现有的 `agents.defaults.model.primary`。`openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 等显式命令仍会替换主模型。
</Accordion>

## 聊天中的 `/model`

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` 和 `/model list` 会显示一个紧凑的编号选择器（模型系列 + 可用提供商）；`/model <#>` 从中选择。在 Discord 上，这会打开提供商/模型下拉菜单，并包含 Submit 步骤；在 Telegram 上，选择器中的选择仅限当前会话，绝不会改写 `openclaw.json` 中智能体的持久默认值。`/models add` 已弃用，会返回一条消息，而不会通过聊天注册模型。
- `/model` 会立即持久化新的会话选择。如果智能体空闲，下一次运行会立即使用它；如果已有运行处于活动状态，切换会排队等到下一个可安全重试的节点（如果工具活动或回复输出已经开始，则可能延后到更晚的节点）。
- `/model default` 会清除会话选择，使其重新继承已配置的主模型。
- 用户通过 `/model` 选择的引用对该会话是严格约束：如果它变得不可访问，回复会明确失败，而不是通过 `agents.defaults.model.fallbacks` 静默回退。已配置的默认值和 cron 任务主模型仍会使用回退链。
- `/model status` 是详细视图：显示每个提供商的身份验证候选项，以及（配置后）提供商端点 `baseUrl` 和 `api` 模式。
- 模型引用通过第一个 `/` 拆分进行解析；格式为 `provider/model`。如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀，例如 `/model openrouter/moonshotai/kimi-k2`。如果省略提供商，OpenClaw 会依次尝试：(1) 匹配别名；(2) 在已配置的提供商中，查找与该无前缀模型 ID 完全匹配且唯一的提供商；(3) 使用已配置的默认提供商（已弃用的回退）——如果该提供商已不再提供已配置的默认模型，则改用第一个已配置的提供商/模型，以避免暴露已移除提供商的过时默认值。
- 模型引用会规范化为小写；除此之外，提供商 ID 必须精确匹配，因此请使用插件公布的 ID。

完整命令行为和配置：[斜杠命令](/zh-CN/tools/slash-commands)。

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

不带子命令的 `openclaw models` 是 `models status` 的快捷方式；后者还会显示身份验证存储中配置文件的 OAuth 到期时间（默认在 24h 内到期时发出警告）。完整标志、JSON 结构和身份验证配置文件子命令：[模型 CLI 参考](/zh-CN/cli/models)。

<AccordionGroup>
  <Accordion title="扫描（OpenRouter 免费模型）">
    `openclaw models scan` 会检查 OpenRouter 的公开免费模型目录，并可实时探测候选模型对工具和图像的支持情况。目录本身是公开的，因此仅扫描元数据（`--no-probe`）无需密钥；实时探测以及 `--set-default`/`--set-image` 需要 OpenRouter API key（身份验证配置文件或 `OPENROUTER_API_KEY`），如果没有密钥，则会以失败关闭方式仅输出元数据。

    结果排序依据依次为：图像支持、工具延迟、上下文大小、参数数量。在 TTY 中，探测结果会提示以交互方式选择回退模型；非交互模式需要使用 `--yes` 接受默认值。

  </Accordion>
</AccordionGroup>

## 模型注册表（`models.json`）

在 `models.providers` 下配置的自定义提供商会写入智能体目录下的 `models.json`（默认为 `~/.openclaw/agents/<agentId>/agent/models.json`）。提供商插件目录会单独存储为生成的、由插件所有的目录分片，并自动加载。默认情况下，此文件会与配置合并；设置 `models.mode: "replace"` 可仅使用你配置的提供商。

<AccordionGroup>
  <Accordion title="合并模式优先级">
    对于匹配的提供商 ID：

    - 智能体 `models.json` 中已有的非空 `baseUrl` 优先。
    - 仅当当前配置/身份验证配置文件上下文中该提供商不由 SecretRef 管理时，`models.json` 中的非空 `apiKey` 才优先。
    - 由 SecretRef 管理的 `apiKey` 值会从来源标记刷新，而不是持久化解析后的秘密：环境变量引用使用环境变量名称，文件/exec 引用使用 `secretref-managed`。
    - 由 SecretRef 管理的标头值以相同方式刷新，环境变量引用使用 `secretref-env:ENV_VAR_NAME`。
    - `models.json` 中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
    - 其他提供商字段会从配置和规范化后的目录数据中刷新。

  </Accordion>
</AccordionGroup>

标记持久化以来源为准：每当 OpenClaw 重新生成 `models.json` 时（包括 `openclaw agent` 等命令驱动的路径），都会从活动来源配置快照（解析前）写入标记，而不是写入解析后的运行时秘密值。

## 相关内容

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes) — OpenClaw、Codex 和其他 Agent loop 运行时
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [模型故障转移](/zh-CN/concepts/model-failover) — 回退链
- [模型提供商](/zh-CN/concepts/model-providers) — 提供商路由和身份验证
- [模型 CLI 参考](/zh-CN/cli/models) — 完整命令和标志参考
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
