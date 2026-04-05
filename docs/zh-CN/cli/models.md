---
read_when:
    - 你想更改默认模型或查看提供商认证状态
    - 你想扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、认证）'
title: models
x-i18n:
    generated_at: "2026-04-05T08:19:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74a0e42cd3ebca15f75dd22b081e4e91e7a8f8b2d3df7af41024cbc937ce7d4b
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退、认证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/providers/models)
- 提供商认证设置：[入门指南](/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认项/回退项以及认证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用窗口和配额快照。
当前支持使用窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况认证会优先来自提供商特定钩子；
如果不可用，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配
OAuth/API 密钥凭证。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时认证探测。
探测是真实请求（可能会消耗 token 并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭证或 `models.json`。

注意事项：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- 模型引用通过按**第一个** `/` 进行拆分来解析。如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为与该精确模型 ID 唯一匹配的已配置提供商，只有在那之后
  才会回退到已配置的默认提供商，并显示弃用警告。
  如果该提供商不再提供已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是继续显示一个
  已移除提供商的过时默认项。
- 对于非密钥占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），`models status` 可能会在认证输出中显示 `marker(<value>)`，而不是将其掩码为密钥。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复或使用逗号分隔的配置文件 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 ID；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分桶：

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
  `auth.order.<provider>` 未包含它，因此探测会报告该排除状态，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合使用条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出可用于探测的
  模型候选项。

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

`models auth add` 是交互式认证助手。根据你选择的提供商，
它可以启动提供商认证流程（OAuth/API 密钥），或引导你进入手动粘贴 token 的流程。

`models auth login` 会运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 可查看已安装的提供商。

示例：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

注意事项：

- `login --provider anthropic --method cli --set-default` 会复用本地 Claude
  CLI 登录，并将主 Anthropic 默认模型路径重写为规范的
  `claude-cli/claude-*` 引用。
- `setup-token` 和 `paste-token` 仍然是通用 token 命令，用于暴露 token 认证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行该提供商的 token-auth
  方法（如果该提供商暴露了 `setup-token` 方法，则默认使用该方法）。
- `paste-token` 接受从其他地方或自动化流程生成的 token 字符串。
- `paste-token` 需要 `--provider`，会提示输入 token 值，并将其写入
  默认配置文件 ID `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（例如 `365d` 或 `12h`）
  存储一个绝对 token 过期时间。
- Anthropic 计费说明：Anthropic 的公开 Claude Code 文档仍将直接使用 Claude Code 终端计入 Claude 套餐限制。另据 Anthropic 于 **2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时间晚上 8:00** 通知 OpenClaw 用户，**OpenClaw** 的 Claude 登录路径会被视为第三方 harness 使用，需要单独计费的 **Extra Usage**，不包含在订阅内。
- Anthropic `setup-token` / `paste-token` 现已再次作为旧版/手动 OpenClaw 路径提供。使用它们时，请预期 Anthropic 已告知 OpenClaw 用户，这一路径需要 **Extra Usage**。
