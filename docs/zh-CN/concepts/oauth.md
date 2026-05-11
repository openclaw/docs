---
read_when:
    - 你想端到端理解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你想要多个账号或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:27:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支持通过 OAuth 为提供该能力的提供商使用“订阅式认证”
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，实际划分
现在是：

- **Anthropic API key**：常规 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅式认证**：Anthropic 员工
  告诉我们这种用法已再次允许

OpenAI Codex OAuth 明确支持用于 OpenClaw 这类外部工具。本页说明：

对于生产环境中的 Anthropic，API key 认证是更安全的推荐路径。

- OAuth **令牌交换**的工作方式（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账号**（配置文件 + 按会话覆盖）

OpenClaw 还支持**提供商插件**，它们会自带 OAuth 或 API key
流程。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌接收端（为什么存在）

OAuth 提供商通常会在登录/刷新流程中签发一个**新的刷新令牌**。某些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新令牌时使旧的刷新令牌失效。

实际症状：

- 你通过 OpenClaw _并且_ 通过 Claude Code / Codex CLI 登录 → 之后其中一个会随机“退出登录”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为**令牌接收端**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个配置文件，并以确定性方式路由它们
- 外部 CLI 复用是提供商特定的：Codex CLI 可以引导一个空的
  `openai-codex:default` 配置文件，但一旦 OpenClaw 有了本地 OAuth 配置文件，
  本地刷新令牌就是规范来源；其他集成可以保持由外部管理，并重新读取它们的 CLI 认证存储
- 已经知道已配置提供商集合的状态和启动路径，会将外部 CLI 发现范围限制在该集合内，
  因此单一提供商设置不会探测无关的 CLI 登录存储

## 存储（令牌存放在哪里）

密钥存储在 agent 认证存储中：

- 认证配置文件（OAuth + API key + 可选的值级别引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有内容也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

当辅助 agent 没有本地认证配置文件时，OpenClaw 会使用从默认/主 agent 存储的读取穿透继承。它不会在读取时克隆主
agent 的 `auth-profiles.json`。OAuth 刷新令牌尤其敏感：普通复制流程默认会跳过它们，因为某些提供商会在使用后轮换
或失效刷新令牌。当某个 agent 需要独立账号时，请为它配置单独的 OAuth 登录。

## Anthropic 旧版令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档说明，直接使用 Claude Code 仍属于
Claude 订阅限制范围内，并且 Anthropic 员工告诉我们，OpenClaw 风格的 Claude
CLI 用法已再次允许。因此，除非 Anthropic 发布新政策，OpenClaw 会将 Claude CLI 复用和
`claude -p` 用法视为该集成的受认可方式。

有关 Anthropic 当前的直接 Claude Code 计划文档，请参阅 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 也将 Anthropic setup-token 暴露为受支持的令牌认证路径，但现在会在可用时优先复用 Claude CLI 和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持复用 Anthropic Claude CLI。如果你已经在主机上有本地
Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `@earendil-works/pi-ai` 中实现，并接入到向导/命令中。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存储在认证配置文件中
3. 模型选择保持在 `anthropic/...`
4. 现有 Anthropic 认证配置文件仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你在远程/无头环境中），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问令牌中提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 认证选择 `openai-codex`。

## 刷新 + 过期

配置文件会存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁下）并覆盖已存储的凭证
- 如果辅助 agent 读取继承来的主 agent OAuth 配置文件，刷新会写回主 agent 存储，
  而不是把刷新令牌复制到辅助 agent 存储中
- 例外：某些外部 CLI 凭证仍由外部管理；OpenClaw 会重新读取这些 CLI 认证存储，
  而不是消耗复制的刷新令牌。Codex CLI 引导有意更窄：它会种下一个空的
  `openai-codex:default` 配置文件，然后由 OpenClaw 拥有的刷新让本地配置文件保持为规范来源。

刷新流程是自动的；通常你不需要手动管理令牌。

## 多账号（配置文件）+ 路由

两种模式：

### 1) 首选：分离 agent

如果你希望“个人”和“工作”永不交互，请使用隔离的 agent（分离的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按 agent 配置认证（向导），并将聊天路由到正确的 agent。

### 2) 高级：一个 agent 中多个配置文件

`auth-profiles.json` 支持为同一提供商配置多个配置文件 ID。

选择使用哪个配置文件：

- 通过配置排序（`auth.order`）全局选择
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些配置文件 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令表面）

## 相关

- [认证](/zh-CN/gateway/authentication) - 模型提供商认证概览
- [Secrets](/zh-CN/gateway/secrets) - 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - 认证配置键
