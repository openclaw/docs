---
read_when:
    - 你想要端到端地了解 OpenClaw OAuth
    - 你遇到了令牌失效/退出登录问题
    - 你希望使用 Claude CLI 或 OAuth 身份验证流程
    - 你希望使用多个账户或进行配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储与多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-07-11T20:30:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支持为提供 OAuth（“订阅身份验证”）的提供商使用 OAuth，
尤其是 **OpenAI Codex（ChatGPT OAuth）** 和 **复用 Anthropic Claude CLI**。
对于 Anthropic，实际可分为：

- **Anthropic API key**：按常规 Anthropic API 计费。
- **OpenClaw 内的 Anthropic Claude CLI / 订阅身份验证**：Anthropic 员工
  告知我们，这种用法已再次获准，因此除非 Anthropic
  发布新政策，否则 OpenClaw 会将复用 Claude CLI 和使用
  `claude -p` 视为此集成获准的方式。对于生产环境中的 Anthropic，使用 API key 身份验证
  仍是更安全的推荐方式。

OpenClaw 将 OpenAI API key 身份验证和 ChatGPT/Codex OAuth 都存储在
规范提供商 ID `openai` 下。旧版 `openai-codex:*` 配置文件 ID 和
`auth.order.openai-codex` 条目属于遗留状态，可通过
`openclaw doctor --fix` 修复；新配置应使用 `openai:*` 配置文件 ID 和 `auth.order.openai`。

本页介绍：

- OAuth **令牌交换**的工作方式（PKCE）
- 令牌的**存储位置**（以及原因）
- 如何处理**多个账户**（配置文件 + 按会话覆盖）

自带 OAuth 或 API key 流程的提供商插件通过
同一入口点运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇聚点（为何存在）

OAuth 提供商通常会在每次登录或刷新时签发新的刷新令牌。
对于同一用户/应用，有些提供商会在签发新刷新令牌时使之前的刷新令牌
失效。实际表现是：同时通过 OpenClaw _以及_
Claude Code / Codex CLI 登录，之后其中一个会随机退出登录。

为减少这种情况，OpenClaw 将身份验证配置文件存储视为**令牌汇聚点**：

- 运行时从每个智能体的唯一位置读取凭据
- 多个配置文件可以共存，并以确定性方式路由
- 外部 CLI 复用因提供商而异：一旦 OpenClaw 拥有某个提供商的本地 OAuth
  配置文件，本地刷新令牌就是规范来源。如果该本地
  刷新令牌被拒绝，OpenClaw 会报告需要
  重新身份验证的配置文件，而不会回退到外部 CLI 令牌材料。
  Codex CLI 引导的范围更窄：它只能在 OpenClaw 尚未拥有该
  提供商的 OAuth 时，为空的 `openai:default` 风格配置文件提供初始凭据；
  此后，由 OpenClaw 负责的刷新始终是规范来源
- 状态和启动路径会将外部 CLI 发现范围限定为
  已配置的提供商集合，因此单提供商设置不会探测
  无关的 CLI 登录存储

## 存储（令牌存放位置）

密钥按智能体存储，并以逻辑名称 `auth-profiles.json` 为键（
底层存储是智能体的 SQLite 数据库；保留 JSON 名称是为了
兼容性和工具显示）：

- 身份验证配置文件（OAuth + API key + 可选的值级引用）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 遗留兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于遗留导入的文件（仍受支持，但不是主要存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入身份验证配置文件存储）

以上所有路径也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration-reference#auth-storage](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参阅[密钥管理](/zh-CN/gateway/secrets)。

当辅助智能体没有本地身份验证配置文件时，OpenClaw 会从默认/主智能体存储
进行读取时继承；读取时不会克隆主
智能体的存储。OAuth 刷新令牌尤其敏感：常规
复制流程默认会跳过它们，因为某些提供商会在使用后轮换刷新令牌或使其
失效。当智能体需要独立账户时，应为其配置单独的 OAuth 登录。

## 复用 Anthropic Claude CLI

OpenClaw 支持将复用 Anthropic Claude CLI 和 `claude -p` 作为获准的
身份验证路径。如果主机上已有本地 Claude 登录，
新手引导/配置可以直接复用它。Anthropic setup-token 仍可用作受支持的
令牌身份验证路径，但在 Claude CLI 可用时，OpenClaw
优先复用 Claude CLI。

<Warning>
Anthropic 的 Claude Code 公开文档指出，直接使用 Claude Code 仍受
Claude 订阅额度限制；Anthropic 员工也告知我们，OpenClaw 形式的 Claude
CLI 用法已再次获准。因此，除非 Anthropic
发布新政策，否则 OpenClaw 会将复用 Claude CLI 和使用
`claude -p` 视为此集成获准的方式。

有关 Anthropic 当前直接使用 Claude Code 的套餐文档，请参阅[通过 Pro 或 Max
套餐使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和[通过 Team 或 Enterprise
套餐使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你希望在 OpenClaw 中使用其他订阅型选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen 云端编程
套餐](/zh-CN/providers/qwen)、[MiniMax 编程套餐](/zh-CN/providers/minimax)
和 [Z.AI / GLM 编程套餐](/zh-CN/providers/zai)。
</Warning>

## OAuth 交换（登录的工作方式）

OpenClaw 的交互式登录流程在 `openclaw/plugin-sdk/llm.ts` 中实现，并接入向导和命令。

### Anthropic setup-token

流程如下：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭据存储在身份验证配置文件中
3. 模型选择保持使用 `anthropic/...`
4. 现有 Anthropic 身份验证配置文件仍可用于回滚和顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

登录命令使用规范 OpenAI 提供商 ID：

```bash
openclaw models auth login --provider openai
```

要在一个智能体中使用多个 ChatGPT/Codex OAuth 账户，请使用
`--profile-id openai:<name>`。请勿对新配置文件使用 `openai-codex:<name>`。
Doctor 会将该旧前缀迁移为不会冲突的 `openai:*` 配置文件 ID；修复后，
请先运行 `openclaw models auth list --provider openai`，再将
配置文件 ID 复制到 `auth.order` 或 `/model ...@<profileId>` 中。

流程如下（PKCE）：

1. 生成 PKCE 验证器/质询值和随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`（权限范围为
   `openid profile email offline_access`）
3. 尝试在 `http://localhost:1455/auth/callback` 捕获回调（
   回调主机默认为 `localhost`，且仅接受回环主机；
   可使用 `OPENCLAW_OAUTH_CALLBACK_HOST` 覆盖）
4. 如果能在回调到达前粘贴代码（或者你使用的是
   远程/无头环境且回调无法绑定），则改为粘贴重定向 URL/代码——
   手动粘贴会与浏览器回调竞争，先完成的一方生效
5. 在 `https://auth.openai.com/oauth/token` 交换代码
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 身份验证选项 `openai`。

## 刷新与过期

配置文件存储 `expires` 时间戳。在运行时：

- 如果 `expires` 是未来时间，则使用存储的访问令牌
- 如果已过期，则刷新（在文件锁保护下）并覆盖存储的凭据
- 如果辅助智能体读取继承自主智能体的 OAuth 配置文件，
  刷新结果会写回主智能体存储，而不是将刷新
  令牌复制到辅助智能体存储
- 外部管理的 CLI 凭据（Claude CLI、受限的 Codex CLI 引导；
  请参阅[令牌汇聚点](#the-token-sink-why-it-exists)）会被重新读取，而不是
  消耗复制的刷新令牌。如果受管理的刷新失败，OpenClaw
  会报告受影响且需要重新身份验证的配置文件，而不会返回
  外部 CLI 令牌材料。

刷新流程自动进行；你通常无需手动管理令牌。

## 多个账户（配置文件）与路由

有两种模式：

### 1）首选：使用独立智能体

如果你希望“个人”和“工作”永不交互，请使用隔离的智能体（独立的会话 + 凭据 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按智能体配置身份验证（通过向导），并将聊天路由到正确的智能体。

### 2）高级：在一个智能体中使用多个配置文件

身份验证配置文件存储支持为同一提供商保存多个配置文件 ID。
可通过以下方式选择使用哪个配置文件：

- 通过配置顺序进行全局选择（`auth.order`）
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

使用以下命令列出现有配置文件 ID：

```bash
openclaw models auth list --provider <id>
```

相关文档：

- [模型故障转移](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [斜杠命令](/zh-CN/tools/slash-commands)（命令界面）

## 相关内容

- [身份验证](/zh-CN/gateway/authentication) - 模型提供商身份验证概览
- [密钥](/zh-CN/gateway/secrets) - 凭据存储和 SecretRef
- [配置参考](/zh-CN/gateway/configuration-reference#auth-storage) - 身份验证配置键
