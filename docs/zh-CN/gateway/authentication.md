---
read_when:
    - 调试模型认证或 OAuth 过期
    - 记录身份验证或凭证存储
summary: 模型身份验证：OAuth、API 密钥、Claude CLI 复用和 Anthropic setup-token
title: 身份验证
x-i18n:
    generated_at: "2026-07-05T11:16:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本页涵盖**模型提供商**身份验证（API key、OAuth、Claude CLI 复用、Anthropic setup-token）。对于 **Gateway 网关连接**身份验证（令牌、密码、可信代理），请参阅[配置](/zh-CN/gateway/configuration)和[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API key。对于常驻运行的 Gateway 网关主机，API key 是最可预测的选项；当订阅/OAuth 流程与你的提供商账户模型匹配时，它们也可以使用。

- 完整 OAuth 流程和存储布局：[/concepts/oauth](/zh-CN/concepts/oauth)
- 基于 SecretRef 的身份验证（`env`/`file`/`exec` 提供商）：[密钥管理](/zh-CN/gateway/secrets)
- `models status --probe` 使用的凭证资格/原因代码：[认证凭证语义](/zh-CN/auth-credential-semantics)

## 推荐设置：API key（任意提供商）

1. 在你的提供商控制台中创建 API key。
2. 将它放在 **Gateway 网关主机**（运行 `openclaw gateway` 的机器）上：

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，请将 key 放入 `~/.openclaw/.env`，以便守护进程读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. 重启 Gateway 网关进程（或守护进程），然后重新检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，`openclaw onboard` 也可以存储 API key 供守护进程使用。完整的环境变量加载优先级（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）请参阅[环境变量](/zh-CN/help/environment)。

## Anthropic：Claude CLI 复用

Anthropic setup-token 身份验证仍是受支持路径。Claude CLI 复用（`claude -p` 风格用法）也获准用于此集成；当主机上有可用的 Claude CLI 登录时，这是本地/桌面使用的首选路径。对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是最可预测的选择，并且可以明确控制服务端计费。

Claude CLI 复用的主机设置：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这分为两步：先在主机上将 Claude Code 登录到 Anthropic，然后告诉 OpenClaw 通过本地 `claude-cli` 后端路由 Anthropic 模型选择，并存储匹配的 OpenClaw 身份验证配置文件。

如果 `claude` 不在 `PATH` 中，请安装 Claude Code，或将 `agents.defaults.cliBackends.claude-cli.command` 设置为二进制文件路径。

## 手动输入令牌

适用于任意提供商；写入每个 Agent 的 SQLite 身份验证存储并更新配置：

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw 从每个 Agent 的 `openclaw-agent.sqlite` 读取身份验证配置文件。端点详细信息（`baseUrl`、`api`、模型 ID、标头、超时）应放在 `openclaw.json` 或 `models.json` 中的 `models.providers.<id>` 下，而不是放在身份验证配置文件中。

如果较旧的安装中仍有 `auth-profiles.json`、`auth-state.json`，或类似 `{ "openrouter": { "apiKey": "..." } }` 的扁平形状，请运行 `openclaw doctor --fix` 将其导入 SQLite；Doctor 会在原始 JSON 文件旁保留带时间戳的备份。

Bedrock `auth: "aws-sdk"` 等外部身份验证路由不是凭证。对于具名 Bedrock 路由，请在 `openclaw.json` 中设置 `auth.profiles.<id>.mode: "aws-sdk"`，不要将 `type: "aws-sdk"` 写入身份验证配置文件存储。`openclaw doctor --fix` 会将旧版 AWS SDK 标记从凭证存储迁移到配置元数据中。

### SecretRef 支持的凭证

- `api_key` 凭证可以使用 `keyRef: { source, provider, id }`
- `token` 凭证可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件会拒绝 SecretRef 凭证：如果 `auth.profiles.<id>.mode` 是 `"oauth"`，则该配置文件中由 SecretRef 支持的 `keyRef`/`tokenRef` 会被拒绝。

## 检查模型身份验证状态

```bash
openclaw models status
openclaw doctor
```

适合自动化的检查：过期/缺失时退出 `1`，即将过期时退出 `2`：

```bash
openclaw models status --check
```

实时身份验证探测（添加 `--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency` 或 `--probe-max-tokens` 以缩小范围）：

```bash
openclaw models status --probe
```

注意：

- 探测行可以来自身份验证配置文件、环境凭证或 `models.json`。
- 如果 `auth.order.<provider>` 省略了已存储的配置文件，探测会为该配置文件报告 `excluded_by_auth_order`，而不是尝试使用它。
- 如果身份验证存在，但 OpenClaw 无法为该提供商解析出可探测模型，探测会报告 `status: no_model`。
- 速率限制冷却可以限定到模型范围：某个配置文件针对一个模型处于冷却状态时，仍可服务同一提供商上的同级模型。

可选运维脚本（systemd/Termux）：[身份验证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)。

## API key 轮换（Gateway 网关）

某些提供商在调用遇到提供商速率限制时，会使用另一个已配置的 key 重试请求。

每个提供商的 key 优先级顺序：

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（单一覆盖，固定使用一个 key）
2. `<PROVIDER>_API_KEYS`（逗号/空格/分号分隔的列表）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（任何带此前缀的环境变量）

Google 提供商（`google`、`google-vertex`）还会回退到 `GOOGLE_API_KEY`。合并后的列表会在使用前去重。

OpenClaw 仅在错误消息匹配以下内容时轮换到下一个 key：`rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted` 或 `too many requests`。其他错误不会使用备用 key 重试。如果所有 key 都失败，则返回最后一次尝试的最终错误。

<Note>
`ThrottlingException`、`concurrency limit reached` 或 `workers_ai ... quota limit exceeded` 等提供商特定短语会驱动**故障转移/重试分类**（在重复失败时切换模型或提供商），这是与上方 API-key 轮换分开的机制。
</Note>

删除已保存的身份验证不会在提供商处撤销 key；当你需要提供商端失效时，请在提供商控制台中轮换或撤销它。

## Gateway 网关运行时移除提供商身份验证

当你通过 Gateway 网关控制平面移除提供商身份验证时，OpenClaw 会删除该提供商已保存的身份验证配置文件，并中止所选模型提供商与被移除提供商匹配的活动聊天/智能体运行。被中止的运行会发出正常的取消/生命周期事件，并带有 `stopReason: "auth-revoked"`，因此已连接的客户端可以显示运行因凭证被移除而停止。

## 控制使用哪个凭证

### OpenAI 和旧版 `openai-codex` ID

OpenAI API-key 配置文件和 ChatGPT/Codex OAuth 配置文件都使用规范提供商 ID `openai`。新配置请使用 `openai:*` 配置文件 ID 和 `auth.order.openai`。

如果你在较旧配置、身份验证配置文件 ID 或 `auth.order.openai-codex` 中看到 `openai-codex`，请将其视为旧版迁移输入，不要创建新的 `openai-codex` 配置文件。运行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 会将旧版 `openai-codex:*` 配置文件 ID 和 `auth.order.openai-codex` 条目重写到规范的 `openai` 路由。OpenAI 特定的模型/运行时路由请参阅 [OpenAI](/zh-CN/providers/openai)。

### 登录期间（CLI）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` 会在一个 Agent 内部为同一提供商保留多个独立的 OAuth 登录。

`--force` 会删除所选 Agent 目录中该提供商已保存的身份验证配置文件，然后重新运行相同的身份验证流程。当已保存的配置文件卡住、过期或绑定到错误账户时使用它。它不会在提供商处撤销凭证。

```bash
openclaw models auth login --provider anthropic --force
```

### 按会话（聊天命令）

- `/model <alias-or-id>@<profileId>` 为当前会话固定特定提供商凭证（示例配置文件 ID：`anthropic:default`、`anthropic:work`）。
- `/model`（或 `/model list`）显示紧凑选择器；`/model status` 显示完整视图（候选项 + 下一个身份验证配置文件，以及已配置时的提供商端点详细信息）。

如果你为已经运行的聊天更改身份验证顺序或配置文件固定，请发送 `/new` 或 `/reset` 启动新会话；现有会话在重置前会保留其当前模型/配置文件选择。

### 按 Agent（CLI 覆盖）

身份验证顺序覆盖会存储在该 Agent 的 SQLite 身份验证状态中：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定 Agent；省略它则使用已配置的默认 Agent。`openclaw models status --probe` 会将被省略的已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。

## 故障排查

### “未找到凭证”

在 **Gateway 网关主机**上配置 Anthropic API key，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 查看哪个配置文件即将过期。如果 Anthropic 令牌配置文件缺失或已过期，请通过 setup-token 刷新它，或迁移到 Anthropic API key。

## 相关

- [密钥管理](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [身份验证存储](/zh-CN/concepts/oauth)
