---
read_when:
    - 你想更改默认模型或查看提供商认证状态
    - 你想扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、认证）'
title: 模型
x-i18n:
    generated_at: "2026-04-24T01:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3cda32db9aa36527c30d8820ce76a94a4ae3e1294fdc850dc1d7948bfa90799
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描与配置（默认模型、回退、认证配置文件）。

相关内容：

- 提供商 + 模型：[模型](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[模型概念](/zh-CN/concepts/models)
- 提供商认证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示已解析的默认值/回退配置以及认证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用窗口和配额快照。
当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况认证在可用时来自提供商专属钩子；
否则 OpenClaw 会回退为匹配来自认证配置文件、环境变量或配置的 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商
概览，而 `auth.oauth` 仅是认证存储中的配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时认证探测。
探测会发起真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。省略时，
命令会在已设置的情况下使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`，否则使用
已配置的默认智能体。
探测结果行可能来自认证配置文件、环境变量凭证或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、认证配置文件、现有目录
  状态以及提供商拥有的目录条目，但不会重写
  `models.json`。
- `models list --all` 会包含内置的、由提供商拥有的静态目录条目，即使
  你尚未通过该提供商完成认证。
  在配置匹配的认证之前，这些条目仍会显示为不可用。
- `models list --provider <id>` 会按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如
  `Moonshot AI`。
- 模型引用通过按**第一个** `/` 拆分来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略了提供商，OpenClaw 会先将输入解析为别名，然后
  解析为该精确模型 id 在已配置提供商中的唯一匹配，最后才
  回退到已配置的默认提供商，并附带弃用警告。
  如果该提供商不再公开已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是暴露一个
  过时、已移除提供商的默认值。
- `models status` 可能会在认证输出中将非机密占位符显示为 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们作为机密进行掩码处理。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复使用或传入逗号分隔的配置文件 id）
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

可预期的探测详情/原因代码包括：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式的
  `auth.order.<provider>` 将其省略，因此探测会报告该排除情况，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出可用于探测的
  候选模型。

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
流程（OAuth/API 密钥），也可以根据你选择的提供商，引导你手动粘贴令牌。

`models auth login` 会运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是通用令牌命令，适用于公开了
  令牌认证方法的提供商。
- `setup-token` 需要交互式 TTY，并会运行该提供商的令牌认证
  方法（当该提供商公开了 `setup-token` 方法时，默认使用它）。
- `paste-token` 接受在其他地方或通过自动化生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长存储绝对令牌过期时间，
  例如 `365d` 或 `12h`。
- Anthropic 说明：Anthropic 员工告知我们，OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为该集成的许可方式，除非 Anthropic 发布新的政策。
- Anthropic `setup-token` / `paste-token` 仍然作为受支持的 OpenClaw 令牌路径可用，但 OpenClaw 现在在可用时更倾向于使用 Claude CLI 复用和 `claude -p`。
