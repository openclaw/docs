---
read_when:
    - 调试模型身份验证或 OAuth 过期问题
    - 记录身份验证或凭据存储方式
summary: 模型身份验证：OAuth、API 密钥、Claude CLI 复用和 Anthropic setup-token
title: 身份验证
x-i18n:
    generated_at: "2026-07-11T20:31:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本页介绍**模型提供商**的身份验证（API 密钥、OAuth、复用 Claude CLI、Anthropic setup-token）。有关 **Gateway 网关连接**的身份验证（令牌、密码、trusted-proxy），请参阅[配置](/zh-CN/gateway/configuration)和[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持对模型提供商使用 OAuth 和 API 密钥。对于始终在线的 Gateway 网关主机，API 密钥是最可预测的选择；如果订阅/OAuth 流程与你的提供商账户模式匹配，也可以使用这些流程。

- 完整的 OAuth 流程和存储布局：[/concepts/oauth](/zh-CN/concepts/oauth)
- 基于 SecretRef 的身份验证（`env`/`file`/`exec` 提供商）：[密钥管理](/zh-CN/gateway/secrets)
- `models status --probe` 使用的凭据资格/原因代码：[身份验证凭据语义](/zh-CN/auth-credential-semantics)

## 推荐设置：API 密钥（任意提供商）

1. 在提供商控制台中创建 API 密钥。
2. 将其放在 **Gateway 网关主机**（运行 `openclaw gateway` 的机器）上：

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，请将密钥放入 `~/.openclaw/.env`，以便守护进程读取：

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

如果你不想自行管理环境变量，`openclaw onboard` 也可以存储 API 密钥供守护进程使用。有关完整的环境变量加载优先级（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd），请参阅[环境变量](/zh-CN/help/environment)。

## Anthropic：复用 Claude CLI

Anthropic setup-token 身份验证仍是受支持的路径。此集成也正式支持复用 Claude CLI（`claude -p` 风格的用法）；如果主机上已有 Claude CLI 登录，这是本地/桌面用途的首选路径。对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍是最可预测的选择，并可明确控制服务端计费。

为复用 Claude CLI 配置主机：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这分为两个步骤：先在主机上将 Claude Code 登录到 Anthropic，然后让 OpenClaw 通过本地 `claude-cli` 后端路由 Anthropic 模型选择，并存储相应的 OpenClaw 身份验证配置文件。

如果 `claude` 不在 `PATH` 中，请安装 Claude Code，或将 `agents.defaults.cliBackends.claude-cli.command` 设置为二进制文件路径。

## 手动输入令牌

适用于任意提供商；写入每个智能体的 SQLite 身份验证存储并更新配置：

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw 从每个智能体的 `openclaw-agent.sqlite` 读取身份验证配置文件。端点详细信息（`baseUrl`、`api`、模型 ID、请求头、超时）应位于 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而不应放在身份验证配置文件中。

如果旧版安装中仍有 `auth-profiles.json`、`auth-state.json`，或 `{ "openrouter": { "apiKey": "..." } }` 之类的扁平结构，请运行 `openclaw doctor --fix` 将其导入 SQLite；Doctor 会在原始 JSON 文件旁保留带时间戳的备份。

Bedrock `auth: "aws-sdk"` 等外部身份验证路由不是凭据。对于命名的 Bedrock 路由，请在 `openclaw.json` 中设置 `auth.profiles.<id>.mode: "aws-sdk"`，不要将 `type: "aws-sdk"` 写入身份验证配置文件存储。`openclaw doctor --fix` 会将旧版 AWS SDK 标记从凭据存储迁移到配置元数据。

### 由 SecretRef 支持的凭据

- `api_key` 凭据可以使用 `keyRef: { source, provider, id }`
- `token` 凭据可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式的配置文件拒绝 SecretRef 凭据：如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则会拒绝该配置文件中由 SecretRef 支持的 `keyRef`/`tokenRef`。

## 检查模型身份验证状态

```bash
openclaw models status
openclaw doctor
```

适合自动化的检查：已过期/缺失时退出码为 `1`，即将过期时为 `2`：

```bash
openclaw models status --check
```

实时身份验证探测（添加 `--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency` 或 `--probe-max-tokens` 以缩小范围）：

```bash
openclaw models status --probe
```

注意：

- 探测行可以来自身份验证配置文件、环境变量凭据或 `models.json`。
- 如果 `auth.order.<provider>` 省略了某个已存储的配置文件，探测会为该配置文件报告 `excluded_by_auth_order`，而不是尝试使用它。
- 如果存在身份验证信息，但 OpenClaw 无法为该提供商解析出可探测的模型，探测会报告 `status: no_model`。
- 速率限制冷却可以限定到模型：某个配置文件因一个模型进入冷却期后，仍可服务同一提供商的同级模型。

可选运维脚本（systemd/Termux）：[身份验证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)。

## API 密钥轮换（Gateway 网关）

当调用触发提供商速率限制时，部分提供商会使用另一个已配置的密钥重试请求。

每个提供商的密钥优先级顺序：

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（单一覆盖值，固定使用一个密钥）
2. `<PROVIDER>_API_KEYS`（以逗号/空格/分号分隔的列表）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（任何带此前缀的环境变量）

Google 提供商（`google`、`google-vertex`）还会回退到 `GOOGLE_API_KEY`。合并后的列表会在使用前去重。

仅当错误消息匹配以下内容时，OpenClaw 才会轮换到下一个密钥：`rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted` 或 `too many requests`。其他错误不会使用备用密钥重试。如果所有密钥都失败，则返回最后一次尝试的最终错误。

<Note>
`ThrottlingException`、`concurrency limit reached` 或 `workers_ai ... quota limit exceeded` 等提供商特定短语会决定**故障转移/重试分类**（重复失败时切换模型或提供商）；这是与上述 API 密钥轮换不同的独立机制。
</Note>

删除已保存的身份验证信息不会在提供商处撤销密钥；需要在提供商端使其失效时，请在提供商控制面板中轮换或撤销该密钥。

## 在 Gateway 网关运行时删除提供商身份验证

通过 Gateway 网关控制平面删除提供商身份验证时，OpenClaw 会删除该提供商已保存的身份验证配置文件，并中止所选模型提供商与被删除提供商匹配的活动聊天/智能体运行。被中止的运行会发出常规取消/生命周期事件，并带有 `stopReason: "auth-revoked"`，因此已连接的客户端可以显示该运行是因凭据被删除而停止。

## 控制使用哪个凭据

### OpenAI 和旧版 `openai-codex` ID

OpenAI API 密钥配置文件和 ChatGPT/Codex OAuth 配置文件都使用规范提供商 ID `openai`。新配置请使用 `openai:*` 配置文件 ID 和 `auth.order.openai`。

如果在旧配置、身份验证配置文件 ID 或 `auth.order.openai-codex` 中看到 `openai-codex`，请将其视为旧版迁移输入，不要创建新的 `openai-codex` 配置文件。运行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 会将旧版 `openai-codex:*` 配置文件 ID 和 `auth.order.openai-codex` 条目重写到规范的 `openai` 路由。有关 OpenAI 特定的模型/运行时路由，请参阅 [OpenAI](/zh-CN/providers/openai)。

### 登录期间（CLI）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` 可在一个智能体内将同一提供商的多个 OAuth 登录相互分离。

`--force` 会删除所选智能体目录中该提供商已保存的身份验证配置文件，然后重新运行相同的身份验证流程。当已保存的配置文件卡住、过期或关联到错误账户时使用此选项。它不会在提供商处撤销凭据。

```bash
openclaw models auth login --provider anthropic --force
```

### 每个会话（聊天命令）

- `/model <alias-or-id>@<profileId>` 为当前会话固定使用特定的提供商凭据（配置文件 ID 示例：`anthropic:default`、`anthropic:work`）。
- `/model`（或 `/model list`）显示紧凑选择器；`/model status` 显示完整视图（候选项 + 下一个身份验证配置文件，以及已配置时的提供商端点详细信息）。

如果你更改了已运行聊天的身份验证顺序或配置文件固定设置，请发送 `/new` 或 `/reset` 以启动新会话；现有会话在重置前会保留当前的模型/配置文件选择。

### 每个智能体（CLI 覆盖）

身份验证顺序覆盖项存储在该智能体的 SQLite 身份验证状态中：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定智能体；省略时使用已配置的默认智能体。`openclaw models status --probe` 会将被省略的已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过。

## 故障排查

### “未找到凭据”

在 **Gateway 网关主机**上配置 Anthropic API 密钥，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 查看哪个配置文件即将过期。如果 Anthropic 令牌配置文件缺失或已过期，请通过 setup-token 刷新，或迁移到 Anthropic API 密钥。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [身份验证存储](/zh-CN/concepts/oauth)
