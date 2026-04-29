---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效 / 退出登录问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你想要多个账户或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-04-29T10:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 通过 OAuth 支持提供它的提供商使用“订阅认证”
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，实际拆分
现在是：

- **Anthropic API key**：普通 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 员工
  告诉我们这种用法重新被允许

OpenAI Codex OAuth 明确支持用于 OpenClaw 这样的外部工具。本页说明：

对于生产环境中的 Anthropic，API key 认证是更安全的推荐路径。

- OAuth **令牌交换**如何工作（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账户**（配置档 + 按会话覆盖）

OpenClaw 还支持**提供商插件**，它们会提供自己的 OAuth 或 API key
流程。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇聚点（为什么存在）

OAuth 提供商通常会在登录/刷新流程中签发一个**新的刷新令牌**。一些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新令牌时使旧的刷新令牌失效。

实际症状：

- 你通过 OpenClaw _并且_ 通过 Claude Code / Codex CLI 登录 → 之后其中一个会随机“退出登录”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为**令牌汇聚点**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个配置档，并以确定性的方式路由它们
- 外部 CLI 复用取决于提供商：Codex CLI 可以引导创建一个空的
  `openai-codex:default` 配置档，但一旦 OpenClaw 拥有本地 OAuth 配置档，
  本地刷新令牌就是权威来源；其他集成可以继续由外部管理，并重新读取它们的 CLI 认证存储
- 已经知道已配置提供商集合的 Status 和启动路径会将外部 CLI 发现范围限定到该集合，
  因此在单提供商设置中不会探测无关的 CLI 登录存储

## 存储（令牌存放位置）

密钥存储在智能体认证存储中：

- 认证配置档（OAuth + API keys + 可选值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有路径也都遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参阅[密钥管理](/zh-CN/gateway/secrets)。

当次要智能体没有本地认证配置档时，OpenClaw 会从默认/主智能体存储进行透读继承。它不会在读取时克隆主智能体的 `auth-profiles.json`。OAuth 刷新令牌尤其敏感：普通复制流程默认会跳过它们，因为一些提供商会在使用后轮换或使刷新令牌失效。当智能体需要独立账户时，请为该智能体配置单独的 OAuth 登录。

## Anthropic 旧版令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档称，直接使用 Claude Code 会保持在 Claude 订阅限制内，Anthropic 员工也告诉我们，OpenClaw 风格的 Claude CLI 用法重新被允许。因此，除非 Anthropic 发布新政策，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成中被认可的方式。

有关 Anthropic 当前直接使用 Claude Code 的计划文档，请参阅[将 Claude Code
与你的 Pro 或 Max
计划一起使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及[将 Claude Code 与你的 Team 或 Enterprise
计划一起使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 也将 Anthropic setup-token 作为受支持的令牌认证路径公开，但现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持复用 Anthropic Claude CLI。如果你已经在主机上有本地 Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `@mariozechner/pi-ai` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存入认证配置档
3. 模型选择保持在 `anthropic/...`
4. 现有 Anthropic 认证配置档仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果无法绑定回调（或你处于远程/无头环境），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 认证选择 `openai-codex`。

## 刷新 + 过期

配置档会存储一个 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁下）并覆盖已存储的凭证
- 如果次要智能体读取继承的主智能体 OAuth 配置档，刷新会写回主智能体存储，而不是将刷新令牌复制到次要智能体存储
- 例外：一些外部 CLI 凭证仍由外部管理；OpenClaw 会重新读取这些 CLI 认证存储，而不是消耗复制过来的刷新令牌。Codex CLI 引导刻意更窄：它会播种一个空的 `openai-codex:default` 配置档，随后由 OpenClaw 拥有的刷新会保持本地配置档为权威来源。

刷新流程是自动的；通常你不需要手动管理令牌。

## 多账户（配置档）+ 路由

两种模式：

### 1) 首选：独立智能体

如果你希望“个人”和“工作”永不互相影响，请使用隔离的智能体（独立会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置认证（向导），并将聊天路由到正确的智能体。

### 2) 高级：一个智能体中的多个配置档

`auth-profiles.json` 支持同一提供商使用多个配置档 ID。

选择要使用的配置档：

- 通过配置顺序全局选择（`auth.order`）
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些配置档 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令表面）

## 相关

- [认证](/zh-CN/gateway/authentication) — 模型提供商认证概览
- [密钥](/zh-CN/gateway/secrets) — 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) — 认证配置键
