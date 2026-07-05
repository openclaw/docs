---
read_when:
    - 你想更改默认模型或查看提供商凭证状态
    - 你想扫描可用模型/提供商并调试身份验证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、凭证）'
title: Models
x-i18n:
    generated_at: "2026-07-05T11:10:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58fdd11c745bc823f7dac5be9aa75f7dbbe622b66ffb9d9fd3505f0453371f88
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退、凭证配置文件）。

相关：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[模型概念](/zh-CN/concepts/models)
- 提供商凭证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` 和 `auth` 子命令接受 `--agent <id>` 来定位已配置的智能体；`list`、`scan`、`aliases` 和 `fallbacks`/`image-fallbacks` 始终使用已配置的默认智能体，而 `set`/`set-image` 会直接拒绝 `--agent`。省略时，支持 `--agent` 的命令会在已设置时使用 `OPENCLAW_AGENT_DIR`，否则使用已配置的默认智能体。

### 状态

`openclaw models status` 显示解析后的默认值/回退以及凭证概览。当提供商用量快照可用时，OAuth/API key 状态部分会包含提供商用量窗口和配额快照。当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI、MiniMax、Xiaomi 和 z.ai。用量凭证在可用时来自提供商特定钩子；否则 OpenClaw 会回退到从凭证配置文件、环境或配置中匹配 OAuth/API key 凭证。

在 `--json` 输出中，`auth.providers` 是感知环境/配置/存储的提供商概览，而 `auth.oauth` 仅表示凭证存储配置文件健康状态。

选项：

| 标志                      | 效果                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 输出；凭证配置文件、提供商和启动诊断会写入 stderr，使 stdout 保持可通过管道传给 `jq`。 |
| `--plain`                 | 纯文本输出。                                                                                            |
| `--check`                 | 如果凭证即将过期/已过期，则以非零状态退出：`1` = 已过期/缺失，`2` = 即将过期。                             |
| `--probe`                 | 对已配置的凭证配置文件进行实时探测。真实请求；可能消耗 token 并触发速率限制。            |
| `--probe-provider <name>` | 仅探测一个提供商。                                                                                      |
| `--probe-profile <id>`    | 探测指定凭证配置文件 id（可重复或用逗号分隔）。                                                  |
| `--probe-timeout <ms>`    | 每次探测的超时时间。                                                                                            |
| `--probe-concurrency <n>` | 并发探测数。                                                                                            |
| `--probe-max-tokens <n>`  | 探测最大 token 数（尽力而为）。                                                                               |
| `--agent <id>`            | 已配置的智能体 id；覆盖 `OPENCLAW_AGENT_DIR`。                                                          |

探测行可以来自凭证配置文件、环境凭证或 `models.json`。探测状态桶：`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`。

当探测从未到达模型调用时，可能出现的探测详情/原因代码：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式的 `auth.order.<provider>` 省略了它，因此探测会报告该排除，而不是尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：配置文件存在，但不符合条件或无法解析。
- `ineligible_profile`：配置文件因其他原因与提供商配置不兼容。
- `no_model`：提供商凭证存在，但 OpenClaw 无法为该提供商解析出可探测的候选模型。

对于 OpenAI ChatGPT/Codex OAuth 故障排查，`openclaw models status`、`openclaw models auth list --provider openai` 和 `openclaw config get agents.defaults.model --json` 是确认智能体是否拥有可通过原生 Codex 运行时用于 `openai/*` 的可用 `openai` OAuth 配置文件的最快方式。参见 [OpenAI provider 设置](/zh-CN/providers/openai#check-and-recover-codex-oauth-routing)。

### 列表

`openclaw models list` 是只读的：它会读取配置、凭证配置文件、现有目录状态和提供商拥有的目录行，但绝不会重写 `models.json`。

选项：`--all`（完整目录）、`--local`（筛选为本地模型）、`--provider <id>`、`--json`、`--plain`。

说明：

- `Auth` 列是提供商级别且只读的。它根据本地凭证配置文件元数据、环境标记、已配置的提供商键、本地提供商标记、AWS Bedrock 环境/配置文件标记，以及插件合成凭证元数据计算；它不会加载提供商运行时、读取钥匙串密钥、调用提供商 API，也不会证明精确的逐模型执行就绪状态。
- `models list --all --provider <id>` 可以包含来自插件清单或内置提供商目录元数据的、由提供商拥有的静态目录行，即使你尚未向该提供商完成凭证配置。这些行在配置匹配凭证之前仍会显示为不可用。
- 当提供商目录发现较慢时，`models list` 会保持控制平面响应。默认视图和已配置视图会在短暂等待后回退到已配置或合成的模型行，并让发现过程在后台完成。当你需要精确的完整已发现目录并愿意等待提供商发现时，请使用 `--all`。
- 宽泛的 `models list --all` 会将清单目录行覆盖合并到注册表行之上，而不会加载提供商运行时补充钩子。按提供商筛选的清单快速路径仅使用标记为 `static` 的提供商；标记为 `refreshable` 的提供商保持由注册表/缓存支撑，并追加清单行作为补充，而标记为 `runtime` 的提供商仍走注册表/运行时发现。
- `models list` 会区分原生模型元数据和运行时上限。在表格输出中，当有效运行时上限不同于原生上下文窗口时，`Ctx` 显示 `contextTokens/contextWindow`；当提供商暴露该上限时，JSON 行包含 `contextTokens`。
- `models list --provider <id>` 按提供商 id 筛选，例如 `moonshot` 或 `openai`。它不接受交互式提供商选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用会按**第一个** `/` 拆分解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先将输入解析为别名，然后解析为该精确模型 id 在已配置提供商中的唯一匹配，最后才带弃用警告回退到已配置的默认提供商。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露陈旧的已移除提供商默认值。
- `models status` 可能会在凭证输出中为非密钥占位符显示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们遮蔽为密钥。

### 设置默认模型 / 图像模型

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` 写入 `agents.defaults.model.primary`；`set-image` 写入 `agents.defaults.imageModel.primary`。两者都接受 `provider/model` 或已配置的别名。当新选择的模型需要 Codex/Copilot 运行时插件安装时，`set` 还会修复这些安装；`set-image` 不会。两个命令都不接受 `--agent`；它们始终写入智能体默认值。

### 扫描

`models scan` 读取 OpenRouter 的公开 `:free` 目录，并为回退用途对候选模型排名。目录本身是公开的，因此仅元数据扫描不需要 OpenRouter key。

默认情况下，OpenClaw 会尝试通过实时模型调用探测工具和图像支持。如果未配置 OpenRouter key，该命令会回退到仅元数据输出，并说明 `:free` 模型仍然需要 `OPENROUTER_API_KEY` 才能进行探测和推理。

选项：

- `--no-probe`（仅元数据；不查找配置/密钥）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每次探测的超时时间）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描结果仅供参考，不会应用到配置。

## 别名

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

别名按模型条目存储为 `agents.defaults.models.<key>.alias`。`add` 会先将 `<model-or-alias>` 解析为规范的提供商/模型键，因此为别名设置别名会重定向它，而不是形成链式别名。

## 回退

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

管理 `agents.defaults.model.fallbacks`。`openclaw models image-fallbacks list|add|remove|clear` 使用相同的子命令形态管理并行的 `agents.defaults.imageModel.fallbacks` 列表。

## 凭证配置文件

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` 是交互式凭证助手。根据你选择的提供商，它可以启动提供商凭证流程（OAuth/API key），或引导你手动粘贴 token。

`models auth list` 会列出所选智能体已保存的凭证配置文件，而不打印 token、API key 或 OAuth 密钥材料。使用 `--provider <id>` 筛选到单个提供商，例如 `openai`；使用 `--json` 便于脚本处理。

`models auth login` 运行提供商插件的凭证流程（OAuth/API key）。使用 `openclaw plugins list` 查看已安装的提供商。对于支持登录期间命名配置文件的提供商，`login` 接受 `--profile-id <id>`（用它将同一提供商的多个登录分开保存）、`--method <id>` 选择特定凭证方法、`--device-code` 作为 `--method device-code` 的快捷方式、`--set-default` 应用该提供商推荐的默认模型，以及 `--force` 先移除该提供商的现有配置文件（在缓存的 OAuth 配置文件卡住或你想切换账户时使用）。

`models auth login-github-copilot` 是 `models auth login --provider github-copilot --method device`（GitHub 设备流程）的快捷方式；它接受 `--yes`，无需提示即可覆盖现有配置文件。

使用 `openclaw models auth --agent <id> <subcommand>` 将凭证结果写入特定的已配置智能体存储。父级 `--agent` 标志会被 `add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、`login-github-copilot` 和 `order get`/`set`/`clear` 遵循。

对于 OpenAI 模型，`--provider openai` 默认使用 ChatGPT/Codex 账户登录。仅当你想添加 OpenAI API key 配置文件时才使用 `--method api-key`，通常作为 Codex 订阅限制的备用方案。运行 `openclaw doctor --fix` 可将较旧的遗留 OpenAI Codex 前缀凭证/配置文件状态迁移到 `openai`。

示例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注意事项：

- `paste-api-key` 接受在其他位置生成的 API 密钥，提示输入密钥值，并将其写入默认配置文件 ID `<provider>:manual`，除非你传入 `--profile-id`。在自动化中，通过 stdin 管道传入密钥，例如 `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`。
- `setup-token` 和 `paste-token` 仍是供暴露令牌认证方法的提供商使用的通用令牌命令。
- `setup-token` 需要交互式 TTY，并运行提供商的令牌认证方法（当该提供商暴露 `setup-token` 方法时，默认使用该方法）。
- `paste-token` 需要 `--provider`，默认提示输入令牌值，并将其写入默认配置文件 ID `<provider>:manual`，除非你传入 `--profile-id`。在自动化中，请通过 stdin 管道传入令牌，而不是将其作为参数传入，这样提供商凭证就不会出现在 shell 历史或进程列表中。
- `paste-token --expires-in <duration>` 会根据相对时长（例如 `365d` 或 `12h`）存储绝对令牌过期时间。
- 对于 `openai`，OpenAI API 密钥和 ChatGPT/OAuth 令牌材料是不同的认证形态。对 `sk-...` OpenAI API 密钥使用 `paste-api-key`，仅对令牌认证材料使用 `paste-token`。
- Anthropic：`setup-token`/`paste-token` 是 `anthropic` 支持的 OpenClaw 认证路径，但当主机上可用时，OpenClaw 更倾向于复用 Claude CLI（`claude -p`）。
- `auth order get/set/clear` 管理一个提供商的按智能体认证配置文件顺序覆盖，存储在 `auth-state.json` 中（与 `auth.order.<provider>` 配置键分离）。`set` 按优先级顺序接受一个或多个配置文件 ID；`clear` 会回退到配置/轮询排序。

## 相关

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
