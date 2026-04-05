---
read_when:
    - 你想要更改默认模型或查看提供商认证状态
    - 你想要扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、认证）'
title: models
x-i18n:
    generated_at: "2026-04-05T10:04:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退、认证配置文件）。

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

`openclaw models status` 会显示已解析的默认值/回退以及认证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用窗口和配额快照。
当前支持使用窗口的提供商包括：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况认证在可用时来自
提供商专用钩子；否则 OpenClaw 会回退为匹配来自认证配置文件、
环境变量或配置中的 OAuth/API 密钥凭证。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时认证探测。
探测是真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。若省略，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭证或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- 模型引用通过按**第一个** `/` 分割来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为该精确模型 id 的唯一已配置提供商匹配，只有在此之后
  才会回退到已配置的默认提供商，并显示弃用警告。
  如果该提供商不再公开已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是暴露一个
  过时的、已删除提供商默认值。
- 对于非密钥占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），`models status` 可能会在认证输出中显示 `marker(<value>)`，而不是将其作为密钥进行掩码处理。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复使用或使用逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分类：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

预期的探测细节/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告该排除情况，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
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
流程（OAuth/API 密钥），或根据你选择的提供商
引导你手动粘贴令牌。

`models auth login` 会运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `login --provider anthropic --method cli --set-default` 会复用本地 Claude
  CLI 登录，并将主 Anthropic 默认模型路径重写为规范的
  `claude-cli/claude-*` 引用。
- `setup-token` 和 `paste-token` 仍然是通用令牌命令，适用于公开令牌认证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行该提供商的令牌认证
  方法（若该提供商公开了 `setup-token` 方法，则默认使用
  该方法）。
- `paste-token` 接受在其他地方或通过自动化生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（例如 `365d` 或 `12h`）
  存储一个绝对令牌过期时间。
- Anthropic 计费说明：我们认为，基于 Anthropic 公开的 CLI 文档，对于本地、用户自管的自动化，Claude Code CLI 回退路径可能是被允许的。尽管如此，Anthropic 关于第三方 harness 政策仍存在足够多的模糊性，尤其是在外部产品中使用订阅支持的方式方面，因此我们不建议将其用于生产环境。Anthropic 还在**太平洋时间 2026 年 4 月 4 日中午 12:00 / 英国夏令时晚上 8:00**通知 OpenClaw 用户，**OpenClaw** 的 Claude 登录路径属于第三方 harness 使用，需要**额外用量**，并与订阅分开计费。
- Anthropic `setup-token` / `paste-token` 现已再次可用，作为 OpenClaw 的旧版/手动路径。使用时请预期 Anthropic 已告知 OpenClaw 用户，此路径需要**额外用量**。
