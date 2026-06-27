---
read_when:
    - 调试模型凭证或 OAuth 过期问题
    - 记录身份验证或凭证存储
summary: 模型认证：OAuth、API key、Claude CLI 复用和 Anthropic setup-token
title: 身份验证
x-i18n:
    generated_at: "2026-06-27T01:56:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本页是**模型提供商**认证参考（API 密钥、OAuth、Claude CLI 复用和 Anthropic setup-token）。对于 **Gateway 网关连接**认证（令牌、密码、trusted-proxy），请参阅[配置](/zh-CN/gateway/configuration)和[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API 密钥。对于常驻运行的 Gateway 网关
主机，API 密钥通常是最可预测的选项。当订阅/OAuth
流程与你的提供商账号模型匹配时，也支持这些流程。

完整的 OAuth 流程和存储
布局请参阅 [/concepts/oauth](/zh-CN/concepts/oauth)。
对于基于 SecretRef 的认证（`env`/`file`/`exec` 提供商），请参阅[密钥管理](/zh-CN/gateway/secrets)。
对于 `models status --probe` 使用的凭据资格/原因代码规则，请参阅
[认证凭据语义](/zh-CN/auth-credential-semantics)。

## 推荐设置（API 密钥，任意提供商）

如果你运行的是长期存在的 Gateway 网关，请先为你选择的
提供商使用 API 密钥。
对于 Anthropic，API 密钥认证仍然是最可预测的服务器
设置，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在你的提供商控制台中创建 API 密钥。
2. 将它放在 **Gateway 网关主机**（运行 `openclaw gateway` 的机器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，建议将密钥放入
   `~/.openclaw/.env`，这样守护进程就能读取它：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启守护进程（或重启你的 Gateway 网关进程）并重新检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，新手引导可以存储
供守护进程使用的 API 密钥：`openclaw onboard`。

有关环境继承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）的详细信息，请参阅[帮助](/zh-CN/help)。

## Anthropic：Claude CLI 和令牌兼容性

Anthropic setup-token 认证在 OpenClaw 中仍然作为受支持的令牌
路径可用。Anthropic 员工后来告知我们，OpenClaw 风格的 Claude CLI 用法
已再次允许，因此除非 Anthropic 发布新策略，OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为
此集成中已获准的方式。当
主机上可以使用 Claude CLI 复用时，它现在是首选路径。

对于长期存在的 Gateway 网关主机，Anthropic API 密钥仍然是最可预测的
设置。如果你想复用同一主机上现有的 Claude 登录，请在新手引导/配置中使用
Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 在 Gateway 网关主机上让 Claude Code 本身登录 Anthropic。
2. 告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli`
   后端，并存储匹配的 OpenClaw 认证配置文件。

如果 `claude` 不在 `PATH` 上，请先安装 Claude Code，或将
`agents.defaults.cliBackends.claude-cli.command` 设置为真实的二进制路径。

手动输入令牌（任意提供商；写入每 Agent 的 SQLite 认证存储并更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

认证配置文件存储仅保存凭据。旧版 `auth-profiles.json` 文件使用此规范形状：

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw 现在从每个 Agent 的 `openclaw-agent.sqlite` 读取认证配置文件。如果较旧安装仍有 `auth-profiles.json`、`auth-state.json`，或像 `{ "openrouter": { "apiKey": "..." } }` 这样的扁平认证配置文件，请运行 `openclaw doctor --fix` 将其导入 SQLite；doctor 会在原始 JSON 文件旁保留带时间戳的备份。`baseUrl`、`api`、模型 ID、标头和超时等端点细节应放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而不是认证配置文件中。

Bedrock `auth: "aws-sdk"` 这类外部认证路由也不是凭据。如果你想使用命名的 Bedrock 路由，请在 `openclaw.json` 中放入 `auth.profiles.<id>.mode: "aws-sdk"`；不要将 `type: "aws-sdk"` 写入认证配置文件存储。`openclaw doctor --fix` 会将旧版 AWS SDK 标记从凭据存储移入配置元数据。

静态凭据也支持认证配置文件引用：

- `api_key` 凭据可以使用 `keyRef: { source, provider, id }`
- `token` 凭据可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件不支持 SecretRef 凭据；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则会拒绝该配置文件使用由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。

适合自动化的检查（过期/缺失时退出 `1`，即将过期时退出 `2`）：

```bash
openclaw models status --check
```

实时认证探测：

```bash
openclaw models status --probe
```

说明：

- 探测行可以来自认证配置文件、环境凭据或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了某个已存储配置文件，探测会为该配置文件报告
  `excluded_by_auth_order`，而不是尝试使用它。
- 如果存在认证，但 OpenClaw 无法为
  该提供商解析可探测的模型候选，探测会报告 `status: no_model`。
- 速率限制冷却可以限定到模型。某个配置文件因一个
  模型而冷却时，仍可能可用于同一提供商上的同级模型。

可选运维脚本（systemd/Termux）记录在这里：
[认证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)

## Anthropic 说明

Anthropic `claude-cli` 后端已再次受支持。

- Anthropic 员工告知我们，此 OpenClaw 集成路径已再次允许。
- 因此，除非 Anthropic 发布新策略，OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为
  Anthropic 支持运行中的已获准方式。
- 对于长期存在的 Gateway 网关
  主机和明确的服务器端计费控制，Anthropic API 密钥仍然是最可预测的选择。

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway 网关）

某些提供商支持在 API 调用
遇到提供商速率限制时，使用备用密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会将 `GOOGLE_API_KEY` 作为额外回退。
- 同一个密钥列表在使用前会去重。
- OpenClaw 仅在速率限制错误时使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试的最终错误。

## 在 Gateway 网关运行时移除提供商认证

当通过 Gateway 网关控制平面移除提供商认证时，OpenClaw 会删除
该提供商已保存的认证配置文件，并中止所选模型提供商
与被移除提供商匹配的活动聊天或 Agent 运行。被中止的运行会发出
正常的聊天取消和生命周期事件，并带有
`stopReason: "auth-revoked"`，因此已连接客户端可以显示该运行是因为
凭据被移除而停止的。

移除已保存的认证不会在提供商处撤销密钥。当你需要提供商端失效时，请在
提供商仪表板中轮换或撤销密钥。

## 控制使用哪个凭据

### OpenAI 和旧版 `openai-codex` ID

OpenAI API 密钥配置文件和 ChatGPT/Codex OAuth 配置文件都使用规范
提供商 ID `openai`。新配置应使用 `openai:*` 配置文件 ID 和
`auth.order.openai`。

如果你在较旧配置、认证配置文件 ID 或
`auth.order.openai-codex` 中看到 `openai-codex`，请将其视为旧版迁移输入。不要创建新的
`openai-codex` 配置文件。运行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 会将旧版 `openai-codex:*` 配置文件 ID 和
`auth.order.openai-codex` 条目重写为规范的 `openai` 认证路由。有关
OpenAI 专属模型/运行时路由，请参阅 [OpenAI](/zh-CN/providers/openai)。

### 登录期间（CLI）

对于支持在登录期间使用命名认证配置文件的
提供商，请使用 `openclaw models auth login --provider <id> --profile-id <profileId>`。

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

这是在一个 Agent 内部分离同一提供商的多个 OAuth 登录的最简单方式。

当已保存的提供商配置文件卡住、过期或绑定到
错误账号，而普通登录命令一直复用它时，请使用 `--force`。`--force` 会删除
所选 Agent 目录中该提供商已保存的认证配置文件，然后
再次运行同一个提供商认证流程。它不会在
提供商处撤销凭据；当你需要提供商端失效时，请在提供商仪表板中
轮换或撤销它们。

```bash
openclaw models auth login --provider anthropic --force
```

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前会话固定特定提供商凭据（示例配置文件 ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）查看紧凑选择器；使用 `/model status` 查看完整视图（候选项 + 下一个认证配置文件，以及已配置时的提供商端点细节）。

### 按 Agent（CLI 覆盖）

为 Agent 设置显式认证配置文件顺序覆盖（存储在该 Agent 的 SQLite 认证状态中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定 Agent；省略它则使用已配置的默认 Agent。
调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。
调试冷却问题时，请记住速率限制冷却可能绑定到
某一个模型 ID，而不是整个提供商配置文件。

如果你为已经在运行的聊天更改认证顺序或配置文件固定，
请在该聊天中发送 `/new` 或 `/reset` 以开始新会话。现有
会话在重置前可能会保持当前的模型/配置文件选择。

## 故障排除

### “找不到凭据”

如果 Anthropic 配置文件缺失，请在
**Gateway 网关主机**上配置 Anthropic API 密钥，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 确认哪个配置文件即将过期。如果
Anthropic 令牌配置文件缺失或已过期，请通过
setup-token 刷新该设置，或迁移到 Anthropic API 密钥。

## 相关

- [密钥管理](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [认证存储](/zh-CN/concepts/oauth)
