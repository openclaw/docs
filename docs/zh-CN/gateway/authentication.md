---
read_when:
    - 调试模型身份验证或 OAuth 过期
    - 记录身份验证或凭证存储
summary: 模型身份验证：OAuth、API 密钥、Claude CLI 复用，以及 Anthropic 设置令牌
title: 身份验证
x-i18n:
    generated_at: "2026-04-23T14:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# 身份验证（模型提供商）

<Note>
本页介绍**模型提供商**身份验证（API 密钥、OAuth、Claude CLI 复用，以及 Anthropic 设置令牌）。如需了解**Gateway 网关连接**身份验证（令牌、密码、trusted-proxy），请参阅[配置](/zh-CN/gateway/configuration)和[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API 密钥。对于长期运行的 Gateway 网关主机，API 密钥通常是最可预测的选项。当它们符合你的提供商账户模型时，也支持订阅 / OAuth 流程。

完整的 OAuth 流程和存储布局，请参阅[/concepts/oauth](/zh-CN/concepts/oauth)。
对于基于 SecretRef 的身份验证（`env`/`file`/`exec` 提供商），请参阅[Secrets 管理](/zh-CN/gateway/secrets)。
对于 `models status --probe` 使用的凭证适用性 / 原因代码规则，请参阅
[身份验证凭证语义](/zh-CN/auth-credential-semantics)。

## 推荐设置（API 密钥，任意提供商）

如果你运行的是长期存活的 Gateway 网关，请先为你选择的提供商配置 API 密钥。
对于 Anthropic，API 密钥身份验证仍然是最可预测的服务器设置，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在你的提供商控制台中创建一个 API 密钥。
2. 将它放在**Gateway 网关主机**上（运行 `openclaw gateway` 的那台机器）。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，建议将密钥放在
   `~/.openclaw/.env` 中，以便守护进程可以读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启守护进程（或重启你的 Gateway 网关进程）并再次检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，新手引导也可以为守护进程存储
API 密钥：`openclaw onboard`。

关于环境继承（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）的详细信息，请参阅[帮助](/zh-CN/help)。

## Anthropic：Claude CLI 和令牌兼容性

Anthropic 设置令牌身份验证在 OpenClaw 中仍然可作为受支持的令牌路径使用。此后，Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的认可方式，除非 Anthropic 发布新政策。当主机上可用 Claude CLI 复用时，这现在是首选路径。

对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是最可预测的设置。
如果你想在同一主机上复用现有的 Claude 登录，请在新手引导 / 配置中使用 Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# 在 Gateway 网关主机上运行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 先在 Gateway 网关主机上让 Claude Code 自身登录到 Anthropic。
2. 再告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli`
   后端，并存储匹配的 OpenClaw 身份验证配置文件。

如果 `claude` 不在 `PATH` 中，请先安装 Claude Code，或者将
`agents.defaults.cliBackends.claude-cli.command` 设置为实际的二进制路径。

手动输入令牌（任意提供商；写入 `auth-profiles.json` + 更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

静态凭证也支持身份验证配置文件引用：

- `api_key` 凭证可使用 `keyRef: { source, provider, id }`
- `token` 凭证可使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则会拒绝该配置文件使用基于 SecretRef 的 `keyRef`/`tokenRef` 输入。

适合自动化的检查（过期 / 缺失时退出码为 `1`，即将过期时为 `2`）：

```bash
openclaw models status --check
```

实时身份验证探测：

```bash
openclaw models status --probe
```

注意：

- 探测行可能来自身份验证配置文件、环境凭证或 `models.json`。
- 如果显式 `auth.order.<provider>` 省略了某个已存储配置文件，探测将为
  该配置文件报告 `excluded_by_auth_order`，而不是尝试使用它。
- 如果身份验证存在，但 OpenClaw 无法为该提供商解析出可探测的模型候选项，探测将报告 `status: no_model`。
- 速率限制冷却可以按模型作用域划分。对于某个模型处于冷却中的配置文件，仍然可能可用于同一提供商下的兄弟模型。

可选运维脚本（systemd/Termux）记录在这里：
[身份验证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)

## Anthropic 说明

Anthropic `claude-cli` 后端现已再次受支持。

- Anthropic 员工告诉我们，这条 OpenClaw 集成路径再次被允许。
- 因此，OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为
  Anthropic 支持运行的认可方式，除非 Anthropic 发布新政策。
- 对于长期运行的 Gateway 网关主机，以及需要明确服务端计费控制的场景，Anthropic API 密钥仍然是最可预测的选择。

## 检查模型身份验证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway 网关）

某些提供商支持在 API 调用触发提供商速率限制时，使用备用密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个覆盖项）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会将 `GOOGLE_API_KEY` 作为额外回退项。
- 同一密钥列表在使用前会先去重。
- OpenClaw 仅会在速率限制错误时使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`，或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试的最终错误。

## 控制使用哪个凭证

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 将当前会话固定到特定提供商凭证（配置文件 ID 示例：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）可打开紧凑选择器；使用 `/model status` 可查看完整视图（候选项 + 下一个身份验证配置文件，以及已配置时的提供商端点详情）。

### 按智能体（CLI 覆盖）

为智能体设置显式身份验证配置文件顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 可定位到特定智能体；省略它则使用已配置的默认智能体。
调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。
调试冷却问题时，请记住速率限制冷却可能绑定到某个模型 ID，
而不是整个提供商配置文件。

## 故障排除

### “No credentials found”

如果缺少 Anthropic 配置文件，请在**Gateway 网关主机**上配置 Anthropic API 密钥，或设置 Anthropic 设置令牌路径，然后重新检查：

```bash
openclaw models status
```

### 令牌即将过期 / 已过期

运行 `openclaw models status` 以确认哪个配置文件即将过期。如果
Anthropic 令牌配置文件缺失或已过期，请通过设置令牌刷新该设置，或迁移到 Anthropic API 密钥。
