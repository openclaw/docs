---
read_when:
    - 你想端到端了解 OpenClaw OAuth
    - 你遇到了令牌失效/退出登录问题
    - 你需要 Claude CLI 或 OAuth 身份验证流程
    - 你想使用多个账号或进行配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储和多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-07-16T11:35:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支持为提供相应功能的提供商使用 OAuth（“订阅身份验证”），
尤其是 **OpenAI Codex（ChatGPT OAuth）** 和 **复用 Anthropic Claude CLI**。
对于 Anthropic，实际可分为：

- **Anthropic API key**：使用常规 Anthropic API 计费。
- **OpenClaw 中的 Anthropic Claude CLI / 订阅身份验证**：Anthropic 工作人员
  告知我们现已重新允许这种用法，因此，除非 Anthropic
  发布新策略，否则 OpenClaw 会将复用 Claude CLI 和
  `claude -p` 视为此集成获准使用的方式。对于生产环境中的 Anthropic，API key 身份验证仍是
  更安全的推荐方式。

OpenClaw 将 OpenAI API key 身份验证和 ChatGPT/Codex OAuth 都存储在
规范提供商 ID `openai` 下。旧的 `openai-codex:*` 配置文件 ID 和
`auth.order.openai-codex` 条目属于旧状态，由
`openclaw doctor --fix` 修复；新配置请使用 `openai:*` 配置文件 ID 和 `auth.order.openai`。

本页涵盖：

- OAuth **令牌交换**的工作原理（PKCE）
- 令牌的**存储位置**（以及这样设计的原因）
- 如何处理**多个账户**（配置文件 + 按会话覆盖）

自带 OAuth 或 API key 流程的提供商插件通过
同一入口点运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇聚点（存在原因）

OAuth 提供商通常会在每次登录或刷新时签发新的刷新令牌。
对于同一用户/应用，部分提供商会在签发新刷新令牌时使先前的刷新令牌失效。
实际表现是：同时通过 OpenClaw _和_
Claude Code / Codex CLI 登录，之后其中一方会随机退出登录。

为减少这种情况，OpenClaw 将身份验证配置文件存储视为**令牌汇聚点**：

- 运行时从每个智能体对应的单一位置读取凭据
- 多个配置文件可以共存，并以确定性方式进行路由
- 外部 CLI 的复用方式因提供商而异：一旦 OpenClaw 拥有某个提供商的本地 OAuth
  配置文件，本地刷新令牌即为规范来源。如果该本地
  刷新令牌遭到拒绝，OpenClaw 会报告该配置文件需要
  重新进行身份验证，而不会回退到外部 CLI 令牌材料。
  Codex CLI 的引导范围更窄：它只能在 OpenClaw 尚未拥有该
  提供商的 OAuth 之前，为空的
  `openai:default` 风格配置文件提供初始数据；此后，由 OpenClaw 所有的刷新操作始终作为规范来源
- 状态/启动路径将外部 CLI 发现范围限制为
  已配置的提供商集合，因此在仅配置单个提供商时，不会探测
  无关的 CLI 登录存储

## 存储（令牌所在位置）

密钥按智能体存储，并以逻辑名称 `auth-profiles.json` 为键（
底层存储是智能体的 SQLite 数据库；为兼容性和工具显示，
保留了该 JSON 名称）：

- 身份验证配置文件（OAuth + API key + 可选的值级引用）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会将其清除）

仅用于旧版导入的文件（仍受支持，但不是主要存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入身份验证配置文件存储）

以上各项同样遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration-reference#auth-storage](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参阅[密钥管理](/zh-CN/gateway/secrets)。

当辅助智能体没有本地身份验证配置文件时，OpenClaw 会通过直读继承
默认/主智能体存储；读取时不会克隆主
智能体的存储。OAuth 刷新令牌尤其敏感：常规
复制流程默认会跳过它们，因为部分提供商会在使用后轮换或使
刷新令牌失效。当智能体需要独立账户时，
请为其配置单独的 OAuth 登录。

## 复用 Anthropic Claude CLI

OpenClaw 支持复用 Anthropic Claude CLI 和 `claude -p`，并将其作为获准使用的
身份验证方式。如果主机上已有本地 Claude 登录，
新手引导/配置可以直接复用。Anthropic setup-token 仍可
作为受支持的令牌身份验证方式使用，但在 Claude CLI
可用时，OpenClaw 优先复用 Claude CLI。

<Warning>
Anthropic 的 Claude Code 公开文档指出，直接使用 Claude Code 时仍受
Claude 订阅限制约束；Anthropic 工作人员也告知我们，现已重新允许 OpenClaw 这类 Claude
CLI 用法。因此，除非 Anthropic
发布新策略，否则 OpenClaw 会将复用 Claude CLI 和
`claude -p` 视为此集成获准使用的方式。

有关 Anthropic 当前直接使用 Claude Code 的套餐文档，请参阅[将 Claude Code
与你的 Pro 或 Max
套餐搭配使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和[将 Claude Code 与你的 Team 或 Enterprise
套餐搭配使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你希望在 OpenClaw 中使用其他订阅类选项，请参阅 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-CN/providers/zai)。
</Warning>

## OAuth 交换（登录工作原理）

OpenClaw 的交互式登录流程在 `openclaw/plugin-sdk/llm.ts` 中实现，并接入向导/命令。

### Anthropic setup-token

流程如下：

1. 在任何装有 Claude Code 的机器上运行 `claude setup-token` 创建令牌，然后从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭据存储在身份验证配置文件中
3. 模型选择仍使用 `anthropic/...`
4. 现有 Anthropic 身份验证配置文件仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

登录命令使用规范的 OpenAI 提供商 ID：

```bash
openclaw models auth login --provider openai
```

要在一个智能体中使用多个 ChatGPT/Codex OAuth 账户，请使用 `--profile-id openai:<name>`。
请勿对新配置文件使用 `openai-codex:<name>`。Doctor 会将
该旧前缀迁移到无冲突的 `openai:*` 配置文件 ID；修复后先运行
`openclaw models auth list --provider openai`，再将
配置文件 ID 复制到 `auth.order` 或 `/model ...@<profileId>` 中。

流程如下（PKCE）：

1. 生成 PKCE 验证器/质询值和随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`（范围
   `openid profile email offline_access`）
3. 尝试在 `http://localhost:1455/auth/callback` 上捕获回调（
   回调主机默认为 `localhost`，且仅接受环回主机；
   使用 `OPENCLAW_OAUTH_CALLBACK_HOST` 覆盖）
4. 如果你能在回调到达前粘贴代码（或者你处于
   远程/无头环境且无法绑定回调），则改为粘贴重定向 URL/代码
   ——手动粘贴会与浏览器回调竞速，最先完成的一方生效
5. 在 `https://auth.openai.com/oauth/token` 交换代码
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 身份验证选项 `openai`。

## 刷新 + 过期

配置文件存储 `expires` 时间戳。运行时：

- 如果 `expires` 是未来时间，则使用存储的访问令牌
- 如果已过期，则刷新（在文件锁下进行）并覆盖存储的凭据
- 如果辅助智能体读取继承自主智能体的 OAuth 配置文件，
  刷新操作会写回主智能体存储，而不是将刷新
  令牌复制到辅助智能体存储
- 对于外部管理的 CLI 凭据（Claude CLI、有限范围的 Codex CLI 引导；
  请参阅[令牌汇聚点](#the-token-sink-why-it-exists)），系统会重新读取凭据，而不是
  消耗复制的刷新令牌。如果托管刷新失败，OpenClaw
  会报告受影响的配置文件需要重新进行身份验证，而不会返回
  外部 CLI 令牌材料。

刷新流程自动进行；通常无需手动管理令牌。

## 多个账户（配置文件）+ 路由

有两种模式：

### 1) 推荐：使用独立智能体

如果你希望“个人”和“工作”永不相互影响，请使用隔离的智能体（独立的会话 + 凭据 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个智能体配置身份验证（通过向导），并将聊天路由到正确的智能体。

### 2) 高级：在一个智能体中使用多个配置文件

身份验证配置文件存储支持为同一提供商保存多个配置文件 ID。
选择要使用的配置文件：

- 通过配置顺序全局选择（`auth.order`）
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
