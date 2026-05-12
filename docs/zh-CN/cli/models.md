---
read_when:
    - 你想更改默认模型或查看提供商认证状态
    - 你想要扫描可用的模型/提供商并调试凭证配置档案
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、身份验证）'
title: Models
x-i18n:
    generated_at: "2026-05-12T00:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退模型、认证配置文件）。

相关：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/zh-CN/concepts/models)
- 提供商认证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认值/回退项以及认证概览。
当提供商使用量快照可用时，OAuth/API-key 状态部分会包含
提供商使用窗口和配额快照。
当前的使用窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用量认证会在可用时来自提供商专用钩子；
否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API-key
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商
概览，而 `auth.oauth` 仅表示认证存储配置文件健康状况。
添加 `--probe` 可针对每个已配置的提供商配置文件运行实时认证探测。
探测是真实请求（可能消耗 token 并触发速率限制）。
使用 `--agent <id>` 检查已配置 Agent 的模型/认证状态。省略时，
该命令会使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`（如果已设置），否则使用
已配置的默认 Agent。
探测行可以来自认证配置文件、环境变量凭证或 `models.json`。
对于 Codex OAuth 故障排除，`openclaw models status`、
`openclaw models auth list --provider openai-codex` 和
`openclaw config get agents.defaults.model --json` 是确认某个 Agent 是否具备可用
`openai-codex` 认证配置文件，以便通过原生 Codex runtime 使用
`openai/*` 的最快方式。参见 [OpenAI provider 设置](/zh-CN/providers/openai#check-and-recover-codex-oauth-routing)。

注意：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、认证配置文件、现有目录状态以及提供商拥有的目录行，
  但不会重写 `models.json`。
- `Auth` 列是提供商级别且只读的。它根据本地认证配置文件元数据、环境变量标记、
  已配置的提供商键、本地提供商标记、AWS Bedrock 环境变量/配置文件标记以及插件合成认证元数据计算；
  它不会加载提供商运行时、读取钥匙串密钥、调用提供商 API，或证明精确的逐模型执行就绪状态。
- `models list --all --provider <id>` 可以包含来自插件清单或内置提供商目录元数据的、
  提供商拥有的静态目录行，即使你尚未对该提供商完成认证。这些行仍会显示为不可用，
  直到配置了匹配的认证。
- 当提供商目录发现很慢时，`models list` 会保持控制平面响应。默认视图和已配置视图会在短暂等待后
  回退到已配置或合成的模型行，并让发现过程在后台完成。需要精确完整的已发现目录且愿意等待提供商发现时，
  使用 `--all`。
- 宽泛的 `models list --all` 会将清单目录行合并到注册表行之上，
  而不加载提供商运行时补充钩子。按提供商过滤的清单快速路径只使用标记为 `static` 的提供商；
  标记为 `refreshable` 的提供商保持由注册表/缓存支持，并将清单行追加为补充项，
  而标记为 `runtime` 的提供商保持使用注册表/运行时发现。
- `models list` 会区分原生模型元数据和运行时上限。在表格输出中，
  当有效运行时上限不同于原生上下文窗口时，`Ctx` 会显示 `contextTokens/contextWindow`；
  当提供商暴露该上限时，JSON 行会包含 `contextTokens`。
- `models list --provider <id>` 按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用会按**第一个** `/` 拆分解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先将输入解析为别名，然后解析为该精确模型 id 在已配置提供商中的唯一匹配，
  最后才回退到已配置的默认提供商并给出弃用警告。
  如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，
  而不是显示一个已移除提供商的过期默认值。
- `models status` 可能会在认证输出中为非密钥占位符显示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们遮蔽为密钥。

### Models 扫描

`models scan` 会读取 OpenRouter 的公开 `:free` 目录，并对回退使用的候选项进行排名。
该目录本身是公开的，因此仅元数据扫描不需要 OpenRouter key。

默认情况下，OpenClaw 会尝试通过实时模型调用探测工具和图像支持。
如果未配置 OpenRouter key，该命令会回退到仅元数据输出，并说明 `:free` 模型仍然需要
`OPENROUTER_API_KEY` 才能进行探测和推理。

选项：

- `--no-probe`（仅元数据；不查找配置/密钥）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每次探测的超时）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描
结果仅供参考，不会应用到配置。

### Models 状态

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的认证配置文件进行实时探测）
- `--probe-provider <name>`（探测一个提供商）
- `--probe-profile <id>`（重复指定或逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的 Agent id；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 会将 stdout 保留给 JSON 载荷。认证配置文件、提供商和启动诊断会路由到 stderr，
因此脚本可以将 stdout 直接管道传入 `jq` 等工具。

探测状态分组：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可预期的探测详情/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告该排除，而不是尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出可探测的
  模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 认证配置文件

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式认证助手。它可以启动提供商认证
流程（OAuth/API key），也可以根据你选择的提供商引导你手动粘贴 token。

`models auth list` 会列出所选 Agent 的已保存认证配置文件，
不会打印 token、API-key 或 OAuth 密钥材料。使用 `--provider <id>` 过滤到一个提供商，
例如 `openai-codex`；使用 `--json` 便于脚本处理。

`models auth login` 会运行提供商插件的认证流程（OAuth/API key）。使用
`openclaw plugins list` 查看已安装的提供商。
使用 `openclaw models auth --agent <id> <subcommand>` 可将认证结果写入某个
特定已配置的 Agent 存储。父级 `--agent` 标志会被
`add`、`list`、`login`、`setup-token`、`paste-token` 和
`login-github-copilot` 遵循。

对于 OpenAI 模型，`--provider openai` 默认使用 ChatGPT/Codex 账户登录。
仅当你想添加 OpenAI API-key 配置文件时才使用 `--method api-key`，
通常作为 Codex 订阅限制的备份。旧式
`--provider openai-codex` 写法仍适用于现有脚本。

示例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

注意：

- `setup-token` 和 `paste-token` 仍是面向暴露 token 认证方法的提供商的通用 token 命令。
- `setup-token` 需要交互式 TTY，并运行提供商的 token 认证
  方法（当该提供商暴露 `setup-token` 方法时，默认使用该方法）。
- `paste-token` 接受在其他地方生成或来自自动化的 token 字符串。
- `paste-token` 需要 `--provider`，会提示输入 token 值，并将其写入默认配置文件 id
  `<provider>:manual`，除非你传入 `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（例如 `365d` 或 `12h`）存储绝对 token 过期时间。
- Anthropic 说明：Anthropic 员工告知我们 OpenClaw 风格的 Claude CLI 使用方式再次被允许，
  因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成中受认可的方式，
  除非 Anthropic 发布新政策。
- Anthropic `setup-token` / `paste-token` 仍作为受支持的 OpenClaw token 路径可用，
  但 OpenClaw 现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
