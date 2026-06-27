---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你需要 Claude CLI 或 OAuth 认证流程
    - 你想要多个账号或按配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-06-27T01:52:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 对提供此能力的提供商支持通过 OAuth 使用“订阅凭证”（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，现在实际划分为：

- **Anthropic API key**：常规 Anthropic API 计费
- **OpenClaw 内的 Anthropic Claude CLI / 订阅凭证**：Anthropic 员工告知我们，这种用法已再次允许

OpenAI Codex OAuth 明确支持在 OpenClaw 这类外部工具中使用。

OpenClaw 会将 OpenAI API key 凭证和 ChatGPT/Codex OAuth 都存储在规范提供商 ID `openai` 下。旧的 `openai-codex:*` 配置档案 ID 和 `auth.order.openai-codex` 条目是遗留状态，会由 `openclaw doctor --fix` 修复；新配置请使用 `openai:*` 配置档案 ID 和 `auth.order.openai`。

对于生产环境中的 Anthropic，API key 凭证是更安全的推荐路径。

本页说明：

- OAuth **令牌交换**如何工作（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账号**（配置档案 + 按会话覆盖）

OpenClaw 还支持**提供商插件**，它们可以自带 OAuth 或 API key 流程。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇点（它存在的原因）

OAuth 提供商通常会在登录/刷新流程中签发**新的刷新令牌**。某些提供商（或 OAuth 客户端）可能会在同一用户/应用签发新令牌时使旧的刷新令牌失效。

实际症状：

- 你通过 OpenClaw _以及_ Claude Code / Codex CLI 登录 → 其中一个稍后会随机“退出登录”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为**令牌汇点**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个配置档案，并确定性地路由它们
- 外部 CLI 复用因提供商而异：Codex CLI 可以引导一个空的 `openai:default` 配置档案，但一旦 OpenClaw 拥有本地 OAuth 配置档案，本地刷新令牌就是规范来源。如果该本地刷新令牌被拒绝，OpenClaw 可以使用同账号可用的 Codex CLI 令牌作为仅运行时回退；其他集成可以继续由外部管理，并重新读取它们的 CLI 凭证存储
- 已经知道已配置提供商集合的状态和启动路径，会将外部 CLI 发现限定在该集合内，因此单提供商设置不会探测无关的 CLI 登录存储

## 存储（令牌所在位置）

密钥存储在智能体凭证存储中：

- 凭证配置档案（OAuth + API keys + 可选的值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 遗留兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会清理）

仅用于遗留导入的文件（仍然支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上全部也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

当次级智能体没有本地凭证配置档案时，OpenClaw 会从默认/主智能体存储中使用透读继承。它不会在读取时克隆主智能体的 `auth-profiles.json`。OAuth 刷新令牌尤其敏感：普通复制流程默认会跳过它们，因为某些提供商会在使用后轮换或使刷新令牌失效。当某个智能体需要独立账号时，请为它配置单独的 OAuth 登录。

## Anthropic 遗留令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档说明，直接使用 Claude Code 会保持在 Claude 订阅限制内，并且 Anthropic 员工告知我们，OpenClaw 风格的 Claude CLI 用法已再次允许。因此，除非 Anthropic 发布新政策，OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成的受认可方式。

有关 Anthropic 当前的直接 Claude Code 套餐文档，请参阅 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你希望在 OpenClaw 中使用其他订阅式选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-CN/providers/zai)。
</Warning>

OpenClaw 也将 Anthropic setup-token 暴露为受支持的令牌凭证路径，但现在会在可用时优先复用 Claude CLI 和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持复用 Anthropic Claude CLI。如果你已经在主机上有本地 Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `openclaw/plugin-sdk/llm` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存储在凭证配置档案中
3. 模型选择保持在 `anthropic/...`
4. 现有 Anthropic 凭证配置档案仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

登录命令仍使用规范的 OpenAI 提供商 ID：

```bash
openclaw models auth login --provider openai
```

在一个智能体中使用多个 ChatGPT/Codex OAuth 账号时，请使用 `--profile-id openai:<name>`。不要为新配置档案使用 `openai-codex:<name>`。Doctor 会将该旧前缀迁移到无冲突的 `openai:*` 配置档案 ID；修复后，在将配置档案 ID 复制到 `auth.order` 或 `/model ...@<profileId>` 之前，运行 `openclaw models auth list --provider openai`。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你处于远程/无头环境），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 凭证选择 `openai`。

## 刷新 + 过期

配置档案会存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁下）并覆盖已存储的凭证
- 如果次级智能体读取继承的主智能体 OAuth 配置档案，刷新会写回主智能体存储，而不是将刷新令牌复制到次级智能体存储中
- 例外：某些外部 CLI 凭证会继续由外部管理；OpenClaw 会重新读取这些 CLI 凭证存储，而不是消耗复制来的刷新令牌。Codex CLI 引导刻意更窄：它会种入一个空的 `openai:default` 配置档案，然后由 OpenClaw 拥有的刷新保持本地配置档案为规范来源。如果本地 Codex 刷新失败，而 Codex CLI 对同一账号有可用令牌，OpenClaw 可以在当前运行时请求中使用该令牌，而不会将其写回 `auth-profiles.json`。

刷新流程是自动的；你通常不需要手动管理令牌。

## 多账号（配置档案）+ 路由

两种模式：

### 1) 首选：单独的智能体

如果你希望“个人”和“工作”绝不相互影响，请使用隔离的智能体（单独的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置凭证（向导），并将聊天路由到正确的智能体。

### 2) 高级：一个智能体中的多个配置档案

`auth-profiles.json` 支持同一提供商的多个配置档案 ID。

选择要使用的配置档案：

- 通过配置顺序（`auth.order`）进行全局选择
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看已有配置档案 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [Slash commands](/zh-CN/tools/slash-commands)（命令表面）

## 相关

- [Authentication](/zh-CN/gateway/authentication) - 模型提供商凭证概览
- [Secrets](/zh-CN/gateway/secrets) - 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - 凭证配置键
