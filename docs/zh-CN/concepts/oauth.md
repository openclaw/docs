---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了 token 失效 / 登出问题
    - 你想了解 Claude CLI 或 OAuth 认证流程
    - 你想使用多个账户或 profile 路由
summary: OpenClaw 中的 OAuth：token 交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-04-05T08:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw 通过 OAuth 支持提供商提供的“订阅认证”
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic 订阅，新
设置应在 gateway 主机上使用本地 **Claude CLI** 登录路径，但 Anthropic 会区分
直接使用 Claude Code 与 OpenClaw 复用路径。Anthropic 的公开 Claude Code 文档说明，
直接使用 Claude Code 会保留在 Claude 订阅限额内。另行地，Anthropic 于
**2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00** 通知 OpenClaw 用户，
OpenClaw 被视为
第三方 harness，因此该流量现在需要 **Extra Usage**。OpenAI Codex OAuth 明确支持
在 OpenClaw 之类的外部工具中使用。本页说明：

对于生产环境中的 Anthropic，API key 认证是更安全的推荐路径。

- OAuth **token 交换**如何工作（PKCE）
- token **存储**在哪里（以及为什么）
- 如何处理**多个账户**（profiles + 按会话覆盖）

OpenClaw 还支持自带 OAuth 或 API‑key
流程的**提供商插件**。通过以下命令运行它们：

```bash
openclaw models auth login --provider <id>
```

## token sink（为什么需要它）

OAuth 提供商通常会在登录/刷新流程中签发一个**新的 refresh token**。某些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新 token 时使旧的 refresh token 失效。

实际症状：

- 你同时通过 OpenClaw _和_ Claude Code / Codex CLI 登录 → 之后其中一个会随机“被登出”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为 **token sink**：

- 运行时只从**一个地方**读取凭证
- 我们可以保留多个 profile，并以确定性的方式进行路由
- 当凭证复用自外部 CLI（例如 Codex CLI）时，OpenClaw
  会带着来源信息镜像这些凭证，并重新读取该外部来源，而不是
  自己轮换 refresh token

## 存储（token 存放位置）

密钥按**每个智能体**存储：

- 认证 profiles（OAuth + API keys + 可选的值级 refs）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会清理掉）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）

以上所有路径同样都遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/gateway/configuration-reference#auth-storage)

有关静态 SecretRef 和运行时快照激活行为，请参阅 [Secrets Management](/gateway/secrets)。

## Anthropic 旧版 token 兼容性

<Warning>
Anthropic 的公开 Claude Code 文档说明，直接使用 Claude Code 会保留在
Claude 订阅限额内。另行地，Anthropic 于
**2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00** 告知 OpenClaw 用户，
**OpenClaw 被视为
第三方 harness**。现有的 Anthropic token profiles 在技术上仍可在 OpenClaw 中使用，但
Anthropic 表示，OpenClaw 路径现在要求为该流量启用 **Extra
Usage**（按用量付费，与订阅分开计费）。

关于 Anthropic 当前面向直接 Claude Code 方案的文档，请参阅 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参阅 [OpenAI
Codex](/providers/openai)、[Qwen Cloud Coding
Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax)
和 [Z.AI / GLM Coding Plan](/providers/glm)。
</Warning>

OpenClaw 现在再次公开 Anthropic setup-token，作为旧版/手动路径。
Anthropic 面向 OpenClaw 的计费通知仍适用于该路径，因此
使用它时应预期 Anthropic 会要求对
OpenClaw 驱动的 Claude 登录流量启用 **Extra Usage**。

## Anthropic Claude CLI 迁移

如果 Claude CLI 已经安装并在 gateway 主机上登录，你可以
将 Anthropic 模型选择切换到本地 CLI 后端。这是一个受支持的 OpenClaw 路径，
适用于你想在同一主机上复用本地 Claude CLI 登录的情况。

前提条件：

- gateway 主机上已安装 `claude` 二进制文件
- Claude CLI 已通过 `claude auth login` 在该主机上完成认证

迁移命令：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

新手引导快捷方式：

```bash
openclaw onboard --auth-choice anthropic-cli
```

这会保留现有的 Anthropic 认证 profiles 以便回滚，但会将主
默认模型路径从 `anthropic/...` 改写为 `claude-cli/...`，改写匹配的
Anthropic Claude 回退项，并在 `agents.defaults.models` 下添加匹配的
`claude-cli/...` allowlist 条目。

验证：

```bash
openclaw models status
```

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程由 `@mariozechner/pi-ai` 实现，并接入向导/命令。

### Anthropic Claude CLI

流程形态：

Claude CLI 路径：

1. 在 gateway 主机上使用 `claude auth login` 登录
2. 运行 `openclaw models auth login --provider anthropic --method cli --set-default`
3. 不存储新的认证 profile；将模型选择切换到 `claude-cli/...`
4. 保留现有的 Anthropic 认证 profiles 以便回滚

Anthropic 的公开 Claude Code 文档将此描述为 `claude` 本身的直接 Claude 订阅
登录流程。OpenClaw 可以复用该本地登录，但 Anthropic 另行将
OpenClaw 控制的路径在计费上归类为第三方
harness 使用。

交互式 assistant 路径：

- `openclaw onboard` / `openclaw configure` → 认证选项 `anthropic-cli`

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你是远程/无头环境），则粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从 access token 中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 认证选项 `openai-codex`。

## 刷新 + 过期

profiles 会存储一个 `expires` 时间戳。

在运行时：

- 如果 `expires` 还在未来 → 使用已存储的 access token
- 如果已过期 → 刷新（在文件锁下进行）并覆盖已存储的凭证
- 例外：复用的外部 CLI 凭证仍由外部管理；OpenClaw
  会重新读取 CLI 认证存储，绝不会自己消耗被复制的 refresh token

刷新流程是自动的；通常你不需要手动管理 token。

## 多个账户（profiles）+ 路由

有两种模式：

### 1）推荐：独立智能体

如果你希望“personal”和“work”永不相互影响，请使用隔离的智能体（独立会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置认证（通过向导），并将聊天路由到正确的智能体。

### 2）高级：单个智能体中的多个 profiles

`auth-profiles.json` 支持同一提供商使用多个 profile ID。

选择使用哪个 profile：

- 全局通过配置顺序（`auth.order`）
- 按会话通过 `/model ...@<profileId>`

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看有哪些 profile ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [/concepts/model-failover](/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/tools/slash-commands)（命令接口）

## 相关内容

- [Authentication](/gateway/authentication) — 模型提供商认证概览
- [Secrets](/gateway/secrets) — 凭证存储和 SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) — 认证配置键
