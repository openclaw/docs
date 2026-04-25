---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你想了解 Claude CLI 或 OAuth 认证流程
    - 你想要多个账户或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-04-25T05:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw 支持通过 OAuth 提供“订阅认证”，适用于提供该能力的提供商
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，目前更实际的划分
如下：

- **Anthropic API 密钥**：标准 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 员工
  告诉我们，这种用法现在再次被允许

OpenAI Codex OAuth 已明确支持在 OpenClaw 这样的外部工具中使用。本页说明：

对于生产环境中的 Anthropic，API 密钥认证仍是更安全、推荐的路径。

- OAuth **令牌交换** 的工作方式（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账户**（配置文件 + 每会话覆盖）

OpenClaw 也支持自带 OAuth 或 API 密钥
流程的**提供商插件**。可通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇聚点（为什么存在）

OAuth 提供商通常会在登录/刷新流程中签发一个**新的刷新令牌**。某些提供商（或 OAuth 客户端）在为同一用户/应用签发新刷新令牌时，可能会使旧的刷新令牌失效。

实际表现：

- 你同时通过 OpenClaw _以及_ Claude Code / Codex CLI 登录 → 之后其中一个会随机出现“已登出”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为一个**令牌汇聚点**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个配置文件，并以确定性的方式进行路由
- 外部 CLI 复用是提供商特定的：Codex CLI 可以引导创建一个空的
  `openai-codex:default` 配置文件，但一旦 OpenClaw 已有本地 OAuth 配置文件，
  本地刷新令牌就是规范来源；其他集成可以继续由外部管理，
  并重新读取其 CLI 认证存储

## 存储（令牌存放位置）

密钥按**每个智能体**存储：

- 认证配置文件（OAuth + API 密钥 + 可选的值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会被清除）

仅用于导入的旧版文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）

以上所有路径也都遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

关于静态 SecretRef 和运行时快照激活行为，请参见[密钥管理](/zh-CN/gateway/secrets)。

## Anthropic 旧版令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档说明，直接使用 Claude Code 仍然受
Claude 订阅额度约束，而 Anthropic 员工告诉我们，像 OpenClaw 这样使用 Claude
CLI 的方式现在再次被允许。因此，除非 Anthropic 发布新的政策，
否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成中被认可的方式。

关于 Anthropic 当前直接使用 Claude Code 的套餐文档，请参见 [在你的 Pro 或 Max
套餐中使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [在你的 Team 或 Enterprise
套餐中使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参见 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 也将 Anthropic setup-token 作为受支持的基于令牌的认证路径公开提供，但在可用时，现在更优先推荐复用 Claude CLI 和使用 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持复用 Anthropic Claude CLI。如果主机上已经有本地
Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程是在 `@mariozechner/pi-ai` 中实现的，并接入了向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token，或粘贴令牌
2. OpenClaw 将生成的 Anthropic 凭证存储到一个认证配置文件中
3. 模型选择保持为 `anthropic/...`
4. 现有的 Anthropic 认证配置文件仍可用于回退/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 已明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge 和随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果无法绑定回调（或者你处于远程/无头环境），则粘贴重定向 URL/代码
5. 在 `https://auth.openai.com/oauth/token` 交换令牌
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 认证选项 `openai-codex`。

## 刷新 + 过期

配置文件会存储一个 `expires` 时间戳。

在运行时：

- 如果 `expires` 仍在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁保护下），并覆盖已存储的凭证
- 例外：某些外部 CLI 凭证仍由外部管理；OpenClaw
  会重新读取这些 CLI 认证存储，而不是使用复制来的刷新令牌。
  Codex CLI 引导的范围被有意收窄：它会初始化一个空的
  `openai-codex:default` 配置文件，然后由 OpenClaw 自主刷新的结果保持该本地
  配置文件为规范来源。

刷新流程是自动的；通常你不需要手动管理令牌。

## 多个账户（配置文件）+ 路由

两种模式：

### 1）首选：分离的智能体

如果你希望“个人”和“工作”彼此完全隔离，请使用独立的智能体（独立会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按每个智能体配置认证（向导），并将聊天路由到正确的智能体。

### 2）高级：单个智能体中的多个配置文件

`auth-profiles.json` 支持同一提供商使用多个配置文件 ID。

选择使用哪个配置文件：

- 通过配置顺序全局选择（`auth.order`）
- 通过 `/model ...@<profileId>` 按会话覆盖

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看现有的配置文件 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障切换](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令界面）

## 相关内容

- [认证](/zh-CN/gateway/authentication) — 模型提供商认证概览
- [密钥](/zh-CN/gateway/secrets) — 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) — 认证配置键
