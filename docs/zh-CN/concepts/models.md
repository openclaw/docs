---
read_when:
    - 更改模型回退行为或选择用户体验
    - 调试“模型不被允许”或过时的默认提供商回退
    - 处理 models.json 合并/密钥行为
sidebarTitle: Models CLI
summary: OpenClaw 如何解析提供商/模型引用、配置键和 `/model` 聊天命令
title: 模型 CLI
x-i18n:
    generated_at: "2026-07-05T11:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ec0558d7b4b97954b0be20e1d17bbc4e1e80695b8ca16db29fcabcbc07a3850
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型故障转移" href="/zh-CN/concepts/model-failover">
    凭证配置文件轮换、冷却时间，以及它如何与回退交互。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers">
    快速提供商概览和示例。
  </Card>
  <Card title="模型 CLI 参考" href="/zh-CN/cli/models">
    完整的 `openclaw models` 命令和标志参考。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults">
    模型配置键、默认值和示例。
  </Card>
</CardGroup>

模型引用（`provider/model`）会选择提供商和模型。它通常不会选择底层 Agent Runtimes。OpenAI 是主要例外：在官方 OpenAI provider 上，`openai/gpt-5.5` 默认通过 Codex app-server 运行时运行。订阅版 Copilot 引用（`github-copilot/*`）可以选择使用外部 GitHub Copilot agent runtime 插件，但这条路径始终是显式的（绝不会由 `auto` 选择）。运行时覆盖应放在提供商/模型策略上，而不是放在整个智能体或会话上。在 Codex 运行时模式中，`openai/gpt-*` 并不意味着 API key 计费；凭证可以来自 Codex 账户或 `openai` OAuth 配置文件。参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 和 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## 选择顺序

<Steps>
  <Step title="主模型">
    `agents.defaults.model.primary`（或作为普通字符串的 `agents.defaults.model`）。
  </Step>
  <Step title="回退">
    `agents.defaults.model.fallbacks`，按顺序尝试。
  </Step>
  <Step title="凭证故障转移">
    在 OpenClaw 移动到下一个回退模型之前，凭证配置文件轮换会在提供商内部发生。
  </Step>
</Steps>

相关的模型配置表面：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允许列表/目录，以及别名。使用 `provider/*` 条目可允许来自某个提供商的每个已发现模型，而无需逐一列出。
- `agents.defaults.utilityModel` 是一个可选的较低成本模型，用于短小的内部任务，例如生成的仪表板会话标题以及受支持渠道的线程/主题标题。按智能体的 `agents.list[].utilityModel` 会覆盖它。未设置时，这些任务会使用智能体的主模型。实用任务是单独的模型调用，可能会把有界的任务内容发送给所选模型提供商。
- `agents.defaults.imageModel` 仅在主模型无法接受图片时使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果未设置，该工具会回退到 `imageModel`，然后回退到解析后的会话/默认模型。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel` 和 `videoGenerationModel` 支撑共享的媒体生成工具。如果未设置，每个工具会推断一个有凭证支持的提供商默认值：先使用当前默认提供商，然后按提供商 ID 顺序使用该能力剩余的已注册提供商。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可禁用这种跨提供商推断，同时保留显式回退。
- 按智能体的 `agents.list[].model`（以及绑定）会覆盖 `agents.defaults.model` — 参见[多智能体路由](/zh-CN/concepts/multi-agent)。

完整键参考、默认值和 JSON5 示例：[配置参考](/zh-CN/gateway/config-agents#agent-defaults)。

## 选择来源和回退严格性

同一个 `provider/model` 会根据其来源表现不同：

| 来源                                                                    | 行为                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已配置默认值（`agents.defaults.model.primary`，按智能体主模型）         | 正常起点；使用 `agents.defaults.model.fallbacks`。                                                                                                                                                                                                             |
| 自动回退                                                                | 临时恢复状态，存储为 `modelOverrideSource: "auto"`。OpenClaw 会定期重新探测原始主模型，在恢复时清除自动选择，并且每次状态变化只公告一次回退/恢复转换。                                                                                                       |
| 用户会话选择                                                            | 精确且严格。`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会存储 `modelOverrideSource: "user"`。如果该提供商/模型变得不可达，运行会明显失败，而不是穿透到另一个已配置模型。 |
| Cron `--model` / 载荷 `model`                                           | 按作业的主模型。除非作业提供自己的载荷 `fallbacks`（`fallbacks: []` 会强制严格运行），否则仍使用已配置回退。                                                                                                                        |

其他选择规则：

- 更改 `agents.defaults.model.primary` 不会重写现有会话固定项。如果状态报告 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，运行 `/model default` 清除固定项。
- CLI 默认模型和允许列表选择器会遵循 `models.mode: "replace"`，只列出 `models.providers.*.models`，而不是完整的内置目录。
- Control UI 模型选择器会向 Gateway 网关请求其已配置的模型视图：设置了 `agents.defaults.models` 时使用它（包括 `provider/*` 通配符条目），否则使用 `models.providers.*.models` 加上拥有可用凭证的提供商。完整内置目录仅保留给显式浏览视图（带 `view: "all"` 的 `models.list`，或 `openclaw models list --all`）。

完整机制：[模型故障转移](/zh-CN/concepts/model-failover)。

## 快速模型策略

- 将主模型设置为你可用的最强最新一代模型。
- 将回退用于成本/延迟敏感任务和低风险聊天。
- 对于启用工具的智能体或不受信任输入，避免使用较旧/较弱的模型层级。

## 新手引导

```bash
openclaw onboard
```

无需手动编辑配置，即可为常见提供商设置模型和凭证，包括 OpenAI Codex 订阅 OAuth 和 Anthropic（API key 或 Claude CLI 复用）。

## “Model is not allowed”（以及回复为什么停止）

如果设置了 `agents.defaults.models`，它会成为 `/model` 和会话覆盖的允许列表。选择允许列表之外的模型会在生成任何正常回复之前返回：

```text
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

通过将模型添加到 `agents.defaults.models`、完全清除允许列表（移除该键），或从 `/model list` 选择模型来修复。如果被拒绝的命令包含运行时覆盖，例如 `/model openai/gpt-5.5 --runtime codex`，请先修复允许列表，然后重试同一个 `/model ... --runtime ...` 命令。

对于本地/GGUF 模型，允许列表需要完整的提供商前缀引用，例如 `ollama/gemma4:26b` 或 `lmstudio/Gemma4-26b-a4-it-gguf` — 查看 `openclaw models list --provider <provider>` 获取精确字符串。允许列表激活后，仅使用裸文件名或显示名称并不足够。

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

随后，`/model`、`/models` 和模型选择器只会显示这些提供商的已发现目录，并且无需编辑允许列表即可出现新模型。将精确的 `provider/model` 条目与 `provider/*` 条目混用，以从另一个提供商拉入一个特定模型。

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
对增量更改使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

当普通对象赋值会丢弃现有条目时，`openclaw config set` 会拒绝向 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 赋值；只有在新值应成为完整目标值时才使用 `--replace`。交互式提供商设置和 `openclaw configure --section model` 已经会把按提供商限定的选择合并到允许列表中，因此添加提供商不会丢弃无关条目；configure 会保留现有的 `agents.defaults.model.primary`。像 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 这样的显式命令仍会替换主模型。
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

- `/model` 和 `/model list` 会显示紧凑的编号选择器（模型系列 + 可用提供商）；`/model <#>` 会从中选择。在 Discord 上，这会打开带有提交步骤的提供商/模型下拉菜单；在 Telegram 上，选择器选择限定于会话范围，并且绝不会重写 `openclaw.json` 中智能体的持久默认值。`/models add` 已弃用，并会返回一条消息，而不是从聊天中注册模型。
- `/model` 会立即持久化新的会话选择。如果智能体空闲，下一次运行会立刻使用它；如果已有运行处于活动状态，切换会排队到下一个干净的重试点（如果工具活动或回复输出已开始，则可能排到更晚的点）。
- `/model default` 会清除会话选择，使其再次继承已配置主模型。
- 用户选择的 `/model` 引用对该会话是严格的：如果它变得不可达，回复会明显失败，而不是静默回退到 `agents.defaults.model.fallbacks`。已配置默认值和 cron 作业主模型仍使用回退链。
- `/model status` 是详细视图：每个提供商的凭证候选项，以及（配置时）提供商端点 `baseUrl` 和 `api` 模式。
- 模型引用通过第一个 `/` 拆分来解析；输入 `provider/model`。如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀，例如 `/model openrouter/moonshotai/kimi-k2`。如果省略提供商，OpenClaw 会尝试：（1）别名匹配，（2）对该精确无前缀模型 ID 的唯一已配置提供商匹配，（3）已配置默认提供商（已弃用回退）— 如果该提供商不再暴露已配置默认模型，则改用第一个已配置提供商/模型，以避免暴露陈旧的已移除提供商默认值。
- 模型引用会规范化为小写；除此之外提供商 ID 必须精确，因此请使用插件公开的 ID。

完整命令行为和配置：[Slash commands](/zh-CN/tools/slash-commands)。

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

`openclaw models` 不带子命令时是 `models status` 的快捷方式，它还会显示 auth-store 配置档案的 OAuth 到期时间（默认在 24 小时内到期时警告）。完整标志、JSON 形状和 auth-profile 子命令：[模型 CLI 参考](/zh-CN/cli/models)。

<AccordionGroup>
  <Accordion title="扫描（OpenRouter 免费模型）">
    `openclaw models scan` 会检查 OpenRouter 的公共免费模型目录，并可实时探测候选模型是否支持工具和图像。目录本身是公开的，因此仅元数据扫描（`--no-probe`）不需要密钥；实时探测以及 `--set-default`/`--set-image` 需要 OpenRouter API key（auth 配置档案或 `OPENROUTER_API_KEY`），如果没有密钥，则会失败关闭为仅元数据输出。

    结果排序依据：图像支持，然后是工具延迟，然后是上下文大小，然后是参数数量。在 TTY 中，已探测的结果会提示交互式回退选择；非交互模式需要 `--yes` 来接受默认值。

  </Accordion>
</AccordionGroup>

## 模型注册表（`models.json`）

在 `models.providers` 下配置的自定义提供商会写入智能体目录下的 `models.json`（默认 `~/.openclaw/agents/<agentId>/agent/models.json`）。提供商插件目录会作为生成的插件自有目录分片单独存储，并自动加载。默认情况下，此文件会与配置合并；设置 `models.mode: "replace"` 可仅使用你配置的提供商。

<AccordionGroup>
  <Accordion title="合并模式优先级">
    对于匹配的提供商 ID：

    - 智能体 `models.json` 中已存在的非空 `baseUrl` 优先。
    - `models.json` 中的非空 `apiKey` 仅在当前配置/auth-profile 上下文中该提供商不是 SecretRef 托管时优先。
    - SecretRef 托管的 `apiKey` 值会从来源标记刷新，而不是持久化已解析的密钥：env 引用使用环境变量名，file/exec 引用使用 `secretref-managed`。
    - SecretRef 托管的 header 值也会以相同方式刷新，env 引用使用 `secretref-env:ENV_VAR_NAME`。
    - `models.json` 中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置 `models.providers`。
    - 其他提供商字段会从配置和规范化后的目录数据刷新。

  </Accordion>
</AccordionGroup>

标记持久化以来源为准：每当 OpenClaw 重新生成 `models.json` 时，包括像 `openclaw agent` 这样的命令驱动路径，OpenClaw 都会从活动的来源配置快照（解析前）写入标记，而不是从已解析的运行时密钥值写入。

## 相关

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes) — OpenClaw、Codex 和其他 agent loop 运行时
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [图像生成](/zh-CN/tools/image-generation) — 图像模型配置
- [模型故障转移](/zh-CN/concepts/model-failover) — 回退链
- [模型提供商](/zh-CN/concepts/model-providers) — 提供商路由和凭证
- [模型 CLI 参考](/zh-CN/cli/models) — 完整命令和标志参考
- [音乐生成](/zh-CN/tools/music-generation) — 音乐模型配置
- [视频生成](/zh-CN/tools/video-generation) — 视频模型配置
