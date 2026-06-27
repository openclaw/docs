---
read_when:
    - 你想更改默认模型或查看提供商凭证状态
    - 你想扫描可用的模型/提供商并调试凭证配置档案
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、凭证）'
title: Models
x-i18n:
    generated_at: "2026-06-27T01:40:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型设备发现、扫描和配置（默认模型、回退、凭证配置文件）。

相关：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[模型概念](/zh-CN/concepts/models)
- 提供商凭证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认值/回退，以及凭证概览。
当提供商用量快照可用时，OAuth/API 密钥状态部分会包含
提供商用量窗口和配额快照。
当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI、
MiniMax、Xiaomi 和 z.ai。可用时，用量凭证来自提供商特定的钩子；
否则 OpenClaw 会回退到从凭证配置文件、环境或配置中匹配 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境/配置/存储的提供商
概览，而 `auth.oauth` 仅是凭证存储配置文件健康状态。
添加 `--probe` 可针对每个已配置的提供商配置文件运行实时凭证探测。
探测是真实请求（可能消耗 token 并触发速率限制）。
使用 `--agent <id>` 检查已配置智能体的模型/凭证状态。省略时，
该命令会在已设置时使用 `OPENCLAW_AGENT_DIR`，否则使用
已配置的默认智能体。
探测行可以来自凭证配置文件、环境凭证或 `models.json`。
对于 OpenAI ChatGPT/Codex OAuth 故障排除，`openclaw models status`、
`openclaw models auth list --provider openai` 和
`openclaw config get agents.defaults.model --json` 是确认智能体是否具备可用于
通过原生 Codex 运行时访问 `openai/*` 的 `openai` OAuth 配置文件的最快方式。请参阅 [OpenAI provider 设置](/zh-CN/providers/openai#check-and-recover-codex-oauth-routing)。

注意：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、凭证配置文件、现有目录
  状态以及提供商拥有的目录行，但不会重写
  `models.json`。
- `Auth` 列是提供商级别且只读的。它根据本地
  凭证配置文件元数据、环境标记、已配置的提供商密钥、本地提供商
  标记、AWS Bedrock 环境/配置文件标记以及插件合成凭证元数据计算得出；
  它不会加载提供商运行时、读取钥匙串密钥、调用提供商
  API，也不会证明精确到每个模型的执行就绪状态。
- `models list --all --provider <id>` 可以包含来自插件清单或内置提供商目录元数据的提供商拥有的静态目录
  行，即使你尚未使用该提供商完成凭证配置。这些行仍会显示为
  不可用，直到配置了匹配的凭证。
- `models list` 会在提供商目录设备发现较慢时保持控制平面响应。
  默认视图和已配置视图会在短暂等待后回退到已配置或
  合成模型行，并让设备发现继续在
  后台完成。当你需要精确的完整已发现目录并且
  愿意等待提供商设备发现时，请使用 `--all`。
- 宽泛的 `models list --all` 会将清单目录行合并到注册表行之上，
  而不会加载提供商运行时补充钩子。按提供商筛选的清单
  快速路径只使用标记为 `static` 的提供商；标记为 `refreshable`
  的提供商保持由注册表/缓存支持，并将清单行追加为补充，而
  标记为 `runtime` 的提供商保持在注册表/运行时设备发现路径上。
- `models list` 会区分原生模型元数据和运行时上限。在表格
  输出中，当有效运行时
  上限不同于原生上下文窗口时，`Ctx` 会显示 `contextTokens/contextWindow`；当提供商暴露该上限时，JSON 行会包含 `contextTokens`。
- `models list --provider <id>` 按提供商 ID 筛选，例如 `moonshot` 或
  `openai`。它不接受交互式提供商
  选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用通过按**第一个** `/` 拆分来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为该精确模型 ID 在已配置提供商中的唯一匹配，最后才
  回退到已配置的默认提供商并显示弃用警告。
  如果该提供商不再暴露已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是暴露一个
  过时的已移除提供商默认值。
- `models status` 可能会在凭证输出中为非密钥占位符显示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们掩码为密钥。

### 模型扫描

`models scan` 会读取 OpenRouter 的公开 `:free` 目录，并对用于
回退的候选项进行排序。目录本身是公开的，因此仅元数据扫描不需要
OpenRouter 密钥。

默认情况下，OpenClaw 会尝试通过实时模型调用探测工具和图像支持。
如果未配置 OpenRouter 密钥，该命令会回退到仅元数据
输出，并说明 `:free` 模型仍然需要 `OPENROUTER_API_KEY` 才能进行
探测和推理。

选项：

- `--no-probe`（仅元数据；不查找配置/密钥）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每次探测超时）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描
结果仅供参考，不会应用到配置。

### 模型状态

选项：

- `--json`
- `--plain`
- `--check`（退出 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的凭证配置文件进行实时探测）
- `--probe-provider <name>`（探测一个提供商）
- `--probe-profile <id>`（重复或逗号分隔的配置文件 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 ID；覆盖 `OPENCLAW_AGENT_DIR`）

`--json` 会将 stdout 保留给 JSON 载荷。凭证配置文件、提供商
和启动诊断会路由到 stderr，这样脚本可以将 stdout 直接管道传入
`jq` 等工具。

探测状态桶：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

需要预期的探测详情/原因代码情况：

- `excluded_by_auth_order`：已存在存储的配置文件，但显式的
  `auth.order.<provider>` 省略了它，因此探测会报告该排除情况，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合资格/不可解析。
- `no_model`：提供商凭证存在，但 OpenClaw 无法为该提供商解析出可探测的
  模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 凭证配置文件

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式凭证助手。它可以启动提供商凭证
流程（OAuth/API 密钥），也可以根据你选择的
提供商引导你手动粘贴 token。

`models auth list` 会列出所选智能体保存的凭证配置文件，而不会
打印 token、API 密钥或 OAuth 密钥材料。使用 `--provider <id>` 可
筛选到一个提供商，例如 `openai`；使用 `--json` 可用于脚本。

`models auth login` 会运行提供商插件的凭证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 查看已安装的提供商。
使用 `openclaw models auth --agent <id> <subcommand>` 可将凭证结果写入
特定已配置智能体存储。父级 `--agent` 标志会被
`add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token` 和
`login-github-copilot` 遵循。

对于 OpenAI 模型，`--provider openai` 默认使用 ChatGPT/Codex 账号登录。
仅当你想添加 OpenAI API 密钥配置文件时才使用 `--method api-key`，
通常作为 Codex 订阅限制的备份。运行 `openclaw doctor --fix`
可将较旧的遗留 OpenAI Codex 前缀凭证/配置文件状态迁移到 `openai`。

示例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注意：

- 对于支持登录期间命名
  配置文件的提供商，`login` 接受 `--profile-id <id>`。使用它可以将同一
  提供商的多个登录保持分离。
- `paste-api-key` 接受在其他地方生成的 API 密钥，提示输入密钥
  值，并将其写入默认配置文件 ID `<provider>:manual`，除非你
  传入 `--profile-id`。在自动化中，通过 stdin 管道传入密钥，例如
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`。
- `setup-token` 和 `paste-token` 仍是面向暴露 token 凭证方法的提供商的
  通用 token 命令。
- `setup-token` 需要交互式 TTY，并运行提供商的 token 凭证
  方法（当该提供商暴露
  一个方法时，默认使用其 `setup-token` 方法）。
- `paste-token` 接受在其他地方或通过自动化生成的 token 字符串。
- `paste-token` 需要 `--provider`，默认提示输入 token 值，
  并将其写入默认配置文件 ID `<provider>:manual`，除非你传入
  `--profile-id`。
- 在自动化中，请通过 stdin 管道传入 token，而不是将其作为参数传递，这样
  提供商凭证就不会出现在 shell 历史或进程列表中。
- `paste-token --expires-in <duration>` 会根据相对时长存储绝对 token 过期时间，例如
  `365d` 或 `12h`。
- 对于 `openai`，OpenAI API 密钥和 ChatGPT/OAuth token 材料是
  不同的凭证形态。对 `sk-...` OpenAI API 密钥使用 `paste-api-key`，并且
  仅对 token 凭证材料使用 `paste-token`。
- Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 使用再次被允许，因此除非 Anthropic 发布新策略，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 使用视为该集成的获准用法。
- Anthropic `setup-token` / `paste-token` 仍作为受支持的 OpenClaw token 路径可用，但 OpenClaw 现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
