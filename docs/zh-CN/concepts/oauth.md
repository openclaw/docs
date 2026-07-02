---
read_when:
    - 你想了解 OpenClaw OAuth 的端到端流程
    - 你遇到了令牌失效或登出问题
    - 你想要 Claude CLI 或 OAuth 身份验证流程
    - 你想使用多个账号或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 通过 OAuth 支持提供商提供的“订阅认证”
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，实际划分现在是：

- **Anthropic API key**：常规 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 工作人员
  告诉我们这种用法再次被允许

OpenAI Codex OAuth 明确支持在 OpenClaw 这类外部工具中使用。

OpenClaw 会把 OpenAI API key 认证和 ChatGPT/Codex OAuth 都存储在
规范提供商 ID `openai` 下。较旧的 `openai-codex:*` profile ID 和
`auth.order.openai-codex` 条目属于遗留状态，会由
`openclaw doctor --fix` 修复；新配置请使用 `openai:*` profile ID 和 `auth.order.openai`。

对于生产环境中的 Anthropic，API key 认证是更安全的推荐路径。

本页说明：

- OAuth **令牌交换**的工作方式（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账号**（profile + 按会话覆盖）

OpenClaw 也支持**提供商插件**，它们可以提供自己的 OAuth 或 API key
流程。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇聚点（为什么存在）

OAuth 提供商通常会在登录/刷新流程中签发一个**新的刷新令牌**。某些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新刷新令牌时，使旧刷新令牌失效。

实际症状：

- 你通过 OpenClaw _以及_ Claude Code / Codex CLI 登录 → 之后其中一个会随机“退出登录”

为减少这种情况，OpenClaw 会把 `auth-profiles.json` 视为一个**令牌汇聚点**：

- 运行时从**一个位置**读取凭证
- 我们可以保留多个 profile，并以确定性方式路由它们
- 外部 CLI 复用是按提供商而定的：Codex CLI 可以引导一个空的
  `openai:default` profile，但一旦 OpenClaw 拥有本地 OAuth profile，
  本地刷新令牌就是规范来源。如果该本地刷新令牌被拒绝，
  OpenClaw 会报告受管理的 profile 需要重新认证，而不是把
  Codex CLI 令牌材料作为同级运行时回退来使用。其他集成可以
  继续由外部管理，并重新读取它们的 CLI 认证存储
- 已经知道已配置提供商集合的状态和启动路径，会把外部 CLI 发现范围
  限定到该集合，因此单提供商设置不会探测无关的 CLI 登录存储

## 存储（令牌存放位置）

Secret 存储在智能体认证存储中：

- 认证 profile（OAuth + API key + 可选的值级别引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 遗留兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会清除）

仅用于遗留导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有内容也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

关于静态 secret 引用和运行时快照激活行为，请参阅 [Secret 管理](/zh-CN/gateway/secrets)。

当次级智能体没有本地认证 profile 时，OpenClaw 会从默认/主智能体存储
使用透传读取继承。它不会在读取时克隆主智能体的 `auth-profiles.json`。
OAuth 刷新令牌尤其敏感：普通复制流程默认会跳过它们，因为某些提供商会在使用后轮换
或使刷新令牌失效。当智能体需要独立账号时，请为该智能体配置单独的 OAuth 登录。

## Anthropic 遗留令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档说明，直接使用 Claude Code 会保持在
Claude 订阅额度内，并且 Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude
CLI 用法再次被允许。因此，除非 Anthropic 发布新政策，OpenClaw 会将 Claude CLI 复用和
`claude -p` 用法视为此集成中被认可的用法。

关于 Anthropic 当前的直接 Claude Code 套餐文档，请参阅 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-CN/providers/zai)。
</Warning>

OpenClaw 也将 Anthropic setup-token 暴露为受支持的令牌认证路径，但现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持 Anthropic Claude CLI 复用。如果你已经在主机上有本地
Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `openclaw/plugin-sdk/llm` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存入认证 profile
3. 模型选择仍保持在 `anthropic/...`
4. 现有 Anthropic 认证 profile 仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

登录命令仍使用规范 OpenAI 提供商 ID：

```bash
openclaw models auth login --provider openai
```

在一个智能体中使用多个 ChatGPT/Codex OAuth 账号时，请使用 `--profile-id openai:<name>`。
不要为新 profile 使用 `openai-codex:<name>`。Doctor 会将该旧前缀迁移到无冲突的
`openai:*` profile ID；修复后，在把 profile ID 复制到 `auth.order` 或
`/model ...@<profileId>` 之前，请运行
`openclaw models auth list --provider openai`。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你在远程/无头环境中），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问令牌提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 认证选择 `openai`。

## 刷新 + 过期

Profile 会存储一个 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁下）并覆盖已存储凭证
- 如果次级智能体读取继承自主智能体的 OAuth profile，刷新会写回主智能体存储，
  而不是把刷新令牌复制到次级智能体存储
- 例外：某些外部 CLI 凭证会保持由外部管理；OpenClaw
  会重新读取这些 CLI 认证存储，而不是消耗复制来的刷新令牌。
  Codex CLI 引导有意保持更窄范围：它只能在 OpenClaw
  拥有该提供商的 OAuth 之前，为空的 `openai:default` 或明确请求的 OpenAI profile 播种。
  此后，由 OpenClaw 拥有的刷新会保持本地 profile 为规范来源，
  并且发现流程不会在任何同级槽位中添加 Codex CLI 认证。如果受管理的刷新失败，
  OpenClaw 会报告受影响的 profile 需要重新认证，而不是返回外部 CLI 令牌材料。

刷新流程是自动的；你通常不需要手动管理令牌。

## 多账号（profile）+ 路由

两种模式：

### 1) 推荐：分离的智能体

如果你希望“个人”和“工作”永不交互，请使用隔离智能体（分离的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置认证（向导），并把聊天路由到正确的智能体。

### 2) 高级：一个智能体中的多个 profile

`auth-profiles.json` 支持同一提供商使用多个 profile ID。

选择要使用的 profile：

- 通过配置顺序全局选择（`auth.order`）
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看已有 profile ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [Slash commands](/zh-CN/tools/slash-commands)（命令界面）

## 相关

- [认证](/zh-CN/gateway/authentication) - 模型提供商认证概览
- [Secrets](/zh-CN/gateway/secrets) - 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - 认证配置键
