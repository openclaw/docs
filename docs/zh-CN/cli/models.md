---
read_when:
    - 你想更改默认模型或查看提供商认证状态
    - 你想扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、认证）'
title: models
x-i18n:
    generated_at: "2026-04-23T06:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b057688266bcb72fc9719837ae6a026bed9849ff04577949467363d83b6d069
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描与配置（默认模型、回退、认证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 提供商认证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示已解析的默认值/回退项以及认证概览。
当提供商用量快照可用时，OAuth/API 密钥状态部分会包含
提供商用量窗口和配额快照。
当前支持用量窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。用量认证会在可用时来自提供商特定钩子；
否则 OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥
凭据。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/store 的提供商
概览，而 `auth.oauth` 仅表示认证存储中的配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件执行实时认证探测。
探测会发起真实请求（可能消耗 token 并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。若未提供，
命令会使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`（若已设置），否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭据或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list --all` 会包含内置的、由提供商拥有的静态目录行，即使
  你尚未使用该提供商完成认证。
  这些行在配置匹配认证之前仍会显示为不可用。
- 模型引用通过在**第一个** `/` 处分割来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为已配置提供商中与该精确模型 id 唯一匹配的项，最后才
  回退到已配置的默认提供商，并显示弃用警告。
  如果该提供商不再公开已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是暴露一个
  过时的、已移除提供商默认值。
- `models status` 可能会在认证输出中显示 `marker(<value>)`，用于表示非机密占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将其按机密信息遮蔽。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复使用，或传入逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；会覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分类：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可预期的探测详细信息/原因代码：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告此排除情况，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合使用条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出
  可用于探测的模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 认证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式认证辅助工具。它可以启动提供商认证
流程（OAuth/API 密钥），或根据你选择的提供商引导你进行手动粘贴 token。

`models auth login` 会运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 可查看已安装的提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是通用 token 命令，适用于
  暴露 token 认证方法的提供商。
- `setup-token` 需要交互式 TTY，并会运行该提供商的 token-auth
  方法（当该提供商暴露此方法时，默认使用其 `setup-token` 方法）。
- `paste-token` 接受在其他地方生成或来自自动化的 token 字符串。
- `paste-token` 需要 `--provider`，会提示输入 token 值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（如 `365d` 或 `12h`）
  存储一个绝对 token 过期时间。
- Anthropic 说明：Anthropic 员工告诉我们，再次允许 OpenClaw 风格的 Claude CLI 使用，因此除非 Anthropic 发布新政策，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成的受支持方式。
- Anthropic `setup-token` / `paste-token` 仍作为受支持的 OpenClaw token 路径保留可用，但在可用时，OpenClaw 现在更倾向于使用 Claude CLI 复用和 `claude -p`。
