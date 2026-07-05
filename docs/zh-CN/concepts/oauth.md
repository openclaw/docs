---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你需要多个账号或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-07-05T11:14:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支持提供 OAuth（“订阅凭证”）的提供商，
尤其是 **OpenAI Codex（ChatGPT OAuth）** 和 **Anthropic Claude CLI 复用**。
对于 Anthropic，实际区别是：

- **Anthropic API key**：常规 Anthropic API 计费。
- **OpenClaw 内的 Anthropic Claude CLI / 订阅凭证**：Anthropic 工作人员
  告诉我们此用法已重新允许，因此 OpenClaw 将 Claude CLI 复用和
  `claude -p` 用法视为此集成的获准用法，除非 Anthropic
  发布新策略。对于生产环境中的 Anthropic，API key 凭证仍然是
  更安全的推荐路径。

OpenClaw 会把 OpenAI API-key 凭证和 ChatGPT/Codex OAuth 都存储在
规范提供商 ID `openai` 下。较旧的 `openai-codex:*` 配置文件 ID 和
`auth.order.openai-codex` 条目是由
`openclaw doctor --fix` 修复的遗留状态；新配置请使用 `openai:*` 配置文件 ID 和 `auth.order.openai`。

本页涵盖：

- OAuth **令牌交换** 的工作方式（PKCE）
- 令牌的 **存储** 位置（以及原因）
- 如何处理 **多个账号**（配置文件 + 按会话覆盖）

自带 OAuth 或 API-key 流程的提供商插件会通过同一个入口点运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇点（存在原因）

OAuth 提供商通常会在每次登录/刷新时签发新的刷新令牌。
有些提供商会在为同一用户/应用签发新刷新令牌时，让上一个刷新令牌失效。
实际症状是：同时通过 OpenClaw _和_ Claude Code / Codex CLI 登录，之后其中一个会随机退出登录。

为减少这种情况，OpenClaw 将凭证配置文件存储视为 **令牌汇点**：

- 运行时从每个 Agent 的一个位置读取凭证
- 多个配置文件可以共存，并以确定性方式路由
- 外部 CLI 复用由提供商决定：一旦 OpenClaw 拥有某个提供商的本地 OAuth
  配置文件，本地刷新令牌就是规范来源。如果该本地
  刷新令牌被拒绝，OpenClaw 会报告该配置文件需要
  重新认证，而不是回退到外部 CLI 令牌材料。
  Codex CLI 引导范围更窄：它只能在 OpenClaw 尚未拥有该
  提供商的 OAuth 之前，为空的
  `openai:default` 风格配置文件播种；之后，由 OpenClaw 拥有的刷新会保持为规范来源
- 状态/启动路径会将外部 CLI 发现限定在
  已配置的提供商集合内，因此单提供商设置不会探测
  无关的 CLI 登录存储

## 存储（令牌所在位置）

密钥按 Agent 存放，并由逻辑名称 `auth-profiles.json` 作为键（
底层存储是 Agent 的 SQLite 数据库；保留 JSON 名称是为了
兼容性和工具显示）：

- 凭证配置文件（OAuth + API key + 可选值级引用）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到凭证配置文件存储）

以上全部也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration-reference#auth-storage](/zh-CN/gateway/configuration-reference#auth-storage)

关于静态密钥引用和运行时快照激活行为，请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

当次级 Agent 没有本地凭证配置文件时，OpenClaw 会从默认/主 Agent 存储进行读穿式继承；
它不会在读取时克隆主 Agent 的存储。OAuth 刷新令牌尤其敏感：
普通复制流程默认会跳过它们，因为有些提供商会在使用后轮换或使
刷新令牌失效。当 Agent 需要独立账号时，请为它配置单独的 OAuth 登录。

## Anthropic Claude CLI 复用

OpenClaw 支持 Anthropic Claude CLI 复用和 `claude -p`，将其作为获准的
凭证路径。如果你已经在主机上进行了本地 Claude 登录，
新手引导/配置可以直接复用它。Anthropic setup-token 仍然
作为受支持的令牌凭证路径可用，但 OpenClaw 在可用时优先使用 Claude CLI
复用。

<Warning>
Anthropic 的公开 Claude Code 文档称，直接使用 Claude Code 仍处于
Claude 订阅限制内，并且 Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude
CLI 用法已重新允许。因此 OpenClaw 将 Claude CLI 复用和
`claude -p` 用法视为此集成的获准用法，除非 Anthropic
发布新策略。

关于 Anthropic 当前的直接 Claude Code 套餐文档，请参阅 [将 Claude Code
与你的 Pro 或 Max
套餐配合使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [将 Claude Code 与你的 Team 或 Enterprise
套餐配合使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅风格选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen 云端 Coding
套餐](/zh-CN/providers/qwen)、[MiniMax Coding 套餐](/zh-CN/providers/minimax)，
以及 [Z.AI / GLM Coding 套餐](/zh-CN/providers/zai)。
</Warning>

## OAuth 交换（登录工作方式）

OpenClaw 的交互式登录流程在 `openclaw/plugin-sdk/llm.ts` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或粘贴令牌
2. OpenClaw 将生成的 Anthropic 凭证存储到凭证配置文件中
3. 模型选择保持在 `anthropic/...`
4. 现有 Anthropic 凭证配置文件仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

登录命令使用规范 OpenAI 提供商 ID：

```bash
openclaw models auth login --provider openai
```

在一个 Agent 中使用多个 ChatGPT/Codex OAuth 账号时，请使用 `--profile-id openai:<name>`。
不要为新配置文件使用 `openai-codex:<name>`。Doctor 会将
该旧前缀迁移到无冲突的 `openai:*` 配置文件 ID；修复后，在把
配置文件 ID 复制到 `auth.order` 或 `/model ...@<profileId>` 之前，请运行
`openclaw models auth list --provider openai`。

流程形态（PKCE）：

1. 生成 PKCE 验证器/挑战和随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`（作用域
   `openid profile email offline_access`）
3. 尝试在 `http://localhost:1455/auth/callback` 捕获回调（
   回调主机默认是 `localhost`，且只接受回环主机；
   可用 `OPENCLAW_OAUTH_CALLBACK_HOST` 覆盖）
4. 如果你能在回调到达前粘贴代码（或者你处于
   远程/无头环境且回调无法绑定），则改为粘贴重定向 URL/代码
   - 手动粘贴会与浏览器回调竞速，先完成者获胜
5. 在 `https://auth.openai.com/oauth/token` 交换代码
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 凭证选择 `openai`。

## 刷新 + 过期

配置文件会存储 `expires` 时间戳。在运行时：

- 如果 `expires` 在未来，则使用存储的访问令牌
- 如果已过期，则刷新（在文件锁下）并覆盖存储的凭证
- 如果次级 Agent 读取继承的主 Agent OAuth 配置文件，
  刷新会写回主 Agent 存储，而不是把刷新
  令牌复制到次级 Agent 存储
- 外部管理的 CLI 凭证（Claude CLI、范围较窄的 Codex CLI 引导；
  请参阅 [令牌汇点](#the-token-sink-why-it-exists)）会被重新读取，而不是
  消耗复制来的刷新令牌。如果受管理的刷新失败，OpenClaw
  会报告受影响的配置文件需要重新认证，而不是返回
  外部 CLI 令牌材料。

刷新流程是自动的；你通常不需要手动管理令牌。

## 多个账号（配置文件）+ 路由

两种模式：

### 1) 推荐：独立 Agent

如果你希望“个人”和“工作”完全互不影响，请使用隔离的 Agent（独立会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按 Agent 配置凭证（向导），并将聊天路由到正确的 Agent。

### 2) 高级：一个 Agent 中的多个配置文件

凭证配置文件存储支持同一提供商的多个配置文件 ID。
选择使用哪一个：

- 通过配置顺序（`auth.order`）进行全局选择
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

列出现有配置文件 ID：

```bash
openclaw models auth list --provider <id>
```

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令表面）

## 相关

- [Authentication](/zh-CN/gateway/authentication) - 模型提供商凭证概览
- [Secrets](/zh-CN/gateway/secrets) - 凭证存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - 凭证配置键
