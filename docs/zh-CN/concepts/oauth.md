---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你需要多个账号或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账号模式
title: OAuth
x-i18n:
    generated_at: "2026-05-06T03:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支持通过 OAuth 为提供该能力的提供商使用“订阅认证”
（尤其是 **OpenAI Codex (ChatGPT OAuth)**）。对于 Anthropic，实际划分
现在是：

- **Anthropic API key**：常规 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 工作人员
  告诉我们，这种用法已再次被允许

OpenAI Codex OAuth 明确支持在 OpenClaw 等外部工具中使用。本页说明：

对于生产环境中的 Anthropic，API key 认证是更安全的推荐路径。

- OAuth **token exchange** 的工作方式（PKCE）
- token 的**存储**位置（以及原因）
- 如何处理**多个账户**（配置档 + 按会话覆盖）

OpenClaw 还支持**提供商插件**，它们自带 OAuth 或 API-key
流程。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## token sink（存在原因）

OAuth 提供商通常会在登录/刷新流程中生成一个**新的 refresh token**。某些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新 refresh token 时，使较旧的 refresh token 失效。

实际症状：

- 你通过 OpenClaw _以及_ Claude Code / Codex CLI 登录 → 之后其中一个会随机“退出登录”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为一个 **token sink**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个配置档，并以确定性方式路由它们
- 外部 CLI 复用因提供商而异：Codex CLI 可以引导一个空的
  `openai-codex:default` 配置档，但一旦 OpenClaw 有了本地 OAuth 配置档，
  本地 refresh token 就是规范来源；其他集成可以保持
  外部管理，并重新读取其 CLI auth 存储
- 已知已配置提供商集合的 Status 和启动路径，会将
  外部 CLI 发现范围限定到该集合，因此单提供商设置不会
  探测无关的 CLI 登录存储

## 存储（token 所在位置）

密钥存储在智能体 auth 存储中：

- Auth 配置档（OAuth + API keys + 可选值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上全部也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

关于静态密钥引用和运行时快照激活行为，请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

当次级智能体没有本地 auth 配置档时，OpenClaw 会从默认/主智能体存储
进行直读继承。它不会在读取时克隆主智能体的
`auth-profiles.json`。OAuth refresh token 尤其敏感：
普通复制流程默认会跳过它们，因为某些提供商会在使用后轮换
或使 refresh token 失效。当某个智能体需要独立账户时，
请为它配置单独的 OAuth 登录。

## Anthropic 旧版 token 兼容性

<Warning>
Anthropic 的公开 Claude Code 文档表示，直接使用 Claude Code 会保持在
Claude 订阅限制内，并且 Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude
CLI 用法已再次被允许。因此，除非 Anthropic
发布新策略，否则 OpenClaw 会将 Claude CLI 复用和
`claude -p` 用法视为此集成中获准的方式。

关于 Anthropic 当前的直接 Claude Code 计划文档，请参阅 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅风格选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 也将 Anthropic setup-token 作为受支持的 token-auth 路径公开，但现在在可用时优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持 Anthropic Claude CLI 复用。如果你已经在主机上有本地
Claude 登录，onboarding/configure 可以直接复用它。

## OAuth exchange（登录工作方式）

OpenClaw 的交互式登录流程在 `@mariozechner/pi-ai` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存储到 auth 配置档中
3. 模型选择保持在 `anthropic/...`
4. 现有 Anthropic auth 配置档仍可用于回滚/顺序控制

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你在远程/无头环境中），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 进行交换
6. 从 access token 中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → auth 选择 `openai-codex`。

## 刷新 + 过期

配置档存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用已存储的 access token
- 如果已过期 → 刷新（在文件锁下）并覆盖已存储的凭证
- 如果次级智能体读取继承的主智能体 OAuth 配置档，刷新会
  写回主智能体存储，而不是将 refresh token 复制到
  次级智能体存储
- 例外：某些外部 CLI 凭证保持外部管理；OpenClaw
  会重新读取这些 CLI auth 存储，而不是消耗复制出来的 refresh token。
  Codex CLI 引导被有意收窄：它会播种一个空的
  `openai-codex:default` 配置档，随后由 OpenClaw 拥有的刷新会保持本地
  配置档为规范来源。

刷新流程是自动的；通常不需要手动管理 token。

## 多账户（配置档）+ 路由

两种模式：

### 1) 首选：单独的智能体

如果你希望“个人”和“工作”永不交互，请使用隔离的智能体（单独的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置 auth（向导），并将聊天路由到正确的智能体。

### 2) 高级：一个智能体中的多个配置档

`auth-profiles.json` 支持同一提供商使用多个配置档 ID。

选择使用哪个配置档：

- 通过配置顺序（`auth.order`）进行全局选择
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看现有配置档 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令界面）

## 相关

- [身份验证](/zh-CN/gateway/authentication) - 模型提供商 auth 概览
- [Secrets](/zh-CN/gateway/secrets) - 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - auth 配置键
