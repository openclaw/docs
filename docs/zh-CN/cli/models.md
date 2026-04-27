---
read_when:
    - 你想更改默认模型或查看提供商凭证状态
    - 你想扫描可用的模型/提供商并调试凭证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、凭证）'
title: Models
x-i18n:
    generated_at: "2026-04-27T20:10:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff1d5d6b7e2d72ad0ff7480313ca67f7a49ec77ab198b688e7abf2b9de42757
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描与配置（默认模型、回退、凭证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models concept](/zh-CN/concepts/models)
- 提供商凭证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示已解析的默认值/回退，以及凭证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含提供商使用窗口和配额快照。
当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况凭证在可用时来自提供商特定钩子；
否则，OpenClaw 会回退为从凭证配置文件、环境变量或配置中匹配 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商
概览，而 `auth.oauth` 仅表示凭证存储中的配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时凭证探测。
探测会发起真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/凭证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自凭证配置文件、环境变量凭证或 `models.json`。

注意：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、凭证配置文件、现有目录
  状态以及提供商拥有的目录行，但不会重写
  `models.json`。
- `models list --all --provider <id>` 即使你尚未为该提供商配置凭证，
  也可以包含来自插件清单或内置提供商目录元数据的提供商自有静态目录
  行。这些行仍会显示为不可用，直到配置了匹配的凭证。
- `models list` 会将原生模型元数据与运行时上限区分开来。在表格
  输出中，如果有效运行时上限与原生上下文窗口不同，`Ctx` 会显示 `contextTokens/contextWindow`；
  JSON 行在提供商暴露该上限时会包含 `contextTokens`。
- `models list --provider <id>` 按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，
  例如 `Moonshot AI`。
- 模型引用通过按**第一个** `/` 分割来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为与该精确模型 id 唯一匹配的已配置提供商，只有在此之后
  才会以弃用警告回退到已配置的默认提供商。
  如果该提供商不再暴露已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是呈现一个
  过时的、已移除提供商默认值。
- 对于非秘密占位符，`models status` 可能在凭证输出中显示 `marker(<value>)`
  （例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将其作为秘密值进行掩码。

### 模型扫描

`models scan` 会读取 OpenRouter 的公开 `:free` 目录，并为
回退用途对候选项进行排序。目录本身是公开的，因此仅元数据扫描不需要
OpenRouter 密钥。

默认情况下，OpenClaw 会尝试通过实时模型调用探测工具和图像支持。
如果未配置 OpenRouter 密钥，该命令会回退为仅元数据输出，并说明
`:free` 模型仍然需要 `OPENROUTER_API_KEY` 才能进行探测和推理。

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

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描
结果仅供参考，不会应用到配置中。

### 模型状态

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的凭证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复使用，或使用逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 会保留 stdout 仅用于 JSON 负载。凭证配置文件、提供商
和启动诊断信息会路由到 stderr，这样脚本就可以将 stdout 直接
通过管道传给 `jq` 等工具。

探测状态分组：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

预期会看到的探测详情/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 将其省略，因此探测会报告这种排除，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商凭证存在，但 OpenClaw 无法为该提供商解析出
  可探测的模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 凭证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式凭证辅助工具。它可以启动提供商凭证
流程（OAuth/API 密钥），或根据你选择的提供商引导你进入手动
粘贴令牌。

`models auth login` 会运行提供商插件的凭证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 可查看已安装了哪些提供商。
使用 `openclaw models auth --agent <id> <subcommand>` 可将凭证结果写入
某个特定已配置智能体的存储。父级 `--agent` 标志适用于
`add`、`login`、`setup-token`、`paste-token` 和 `login-github-copilot`。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意：

- `setup-token` 和 `paste-token` 仍然是通用令牌命令，适用于
  暴露令牌凭证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行该提供商的令牌凭证
  方法（如果该提供商暴露了 `setup-token` 方法，则默认使用它）。
- `paste-token` 接受在别处或通过自动化生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传递了
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长存储绝对令牌过期时间，
  例如 `365d` 或 `12h`。
- Anthropic 说明：Anthropic 员工告诉我们，再次允许 OpenClaw 风格的 Claude CLI 使用，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的许可方式，除非 Anthropic 发布新的政策。
- Anthropic `setup-token` / `paste-token` 仍然作为受支持的 OpenClaw 令牌路径可用，但现在 OpenClaw 在可用时更倾向于使用 Claude CLI 复用和 `claude -p`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障切换](/zh-CN/concepts/model-failover)
