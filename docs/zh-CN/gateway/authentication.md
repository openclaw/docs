---
read_when:
    - 调试模型身份验证或 OAuth 过期问题
    - 编写身份验证或凭证存储文档
summary: 模型身份验证：OAuth、API 密钥、Claude CLI 复用和 Anthropic setup-token
title: 身份验证
x-i18n:
    generated_at: "2026-05-06T04:09:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本页是**模型提供商**认证参考（API key、OAuth、Claude CLI 复用和 Anthropic setup-token）。对于 **Gateway 网关连接**认证（token、password、trusted-proxy），请参阅[配置](/zh-CN/gateway/configuration)和[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API key。对于始终在线的 Gateway 网关
主机，API key 通常是最可预测的选项。当订阅/OAuth
流程与你的提供商账号模型匹配时，也支持这些流程。

完整的 OAuth 流程和存储
布局请参阅 [/concepts/oauth](/zh-CN/concepts/oauth)。
对于基于 SecretRef 的认证（`env`/`file`/`exec` 提供商），请参阅[机密管理](/zh-CN/gateway/secrets)。
对于 `models status --probe` 使用的凭证资格/原因代码规则，请参阅
[认证凭证语义](/zh-CN/auth-credential-semantics)。

## 推荐设置（API key，任意提供商）

如果你正在运行长期存在的 Gateway 网关，请从所选
提供商的 API key 开始。
特别是对于 Anthropic，API key 认证仍然是最可预测的服务器
设置，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在你的提供商控制台创建 API key。
2. 将它放在 **Gateway 网关主机**（运行 `openclaw gateway` 的机器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，建议将 key 放入
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
API key 供守护进程使用：`openclaw onboard`。

有关 env 继承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）的详情，请参阅[帮助](/zh-CN/help)。

## Anthropic：Claude CLI 和 token 兼容性

Anthropic setup-token 认证仍作为受支持的 token
路径在 OpenClaw 中可用。Anthropic 员工后来告诉我们，OpenClaw 风格的 Claude CLI 用法
再次被允许，因此除非 Anthropic 发布新策略，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为
此集成中已获准的方式。当
主机上可以复用 Claude CLI 时，这现在是首选路径。

对于长期存在的 Gateway 网关主机，Anthropic API key 仍然是最可预测的
设置。如果你想在同一主机上复用现有 Claude 登录，请在新手引导/配置中使用
Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 先让 Claude Code 本身在 Gateway 网关主机上登录 Anthropic。
2. 告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli`
   后端，并存储匹配的 OpenClaw 认证配置文件。

如果 `claude` 不在 `PATH` 中，请先安装 Claude Code，或将
`agents.defaults.cliBackends.claude-cli.command` 设置为真实二进制文件路径。

手动输入 token（任意提供商；写入 `auth-profiles.json` 并更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` 仅存储凭证。规范形状是：

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

OpenClaw 在运行时预期使用规范的 `version` + `profiles` 形状。如果较旧安装仍有扁平文件，例如 `{ "openrouter": { "apiKey": "..." } }`，请运行 `openclaw doctor --fix` 将其重写为 `openrouter:default` API-key 配置文件；doctor 会在原文件旁保留一份 `.legacy-flat.*.bak` 副本。`baseUrl`、`api`、模型 ID、header 和 timeout 等端点详情属于 `openclaw.json` 或 `models.json` 中的 `models.providers.<id>`，不属于 `auth-profiles.json`。

静态凭证也支持认证配置文件引用：

- `api_key` 凭证可以使用 `keyRef: { source, provider, id }`
- `token` 凭证可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则会拒绝该配置文件由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。

适合自动化的检查（过期/缺失时退出 `1`，即将过期时退出 `2`）：

```bash
openclaw models status --check
```

实时认证探测：

```bash
openclaw models status --probe
```

注意：

- 探测行可以来自认证配置文件、env 凭证或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了已存储的配置文件，探测会为该配置文件报告
  `excluded_by_auth_order`，而不是尝试使用它。
- 如果认证存在，但 OpenClaw 无法为
  该提供商解析出可探测的模型候选项，探测会报告 `status: no_model`。
- 速率限制冷却可以按模型限定。某个配置文件因一个
  模型处于冷却时，仍可能可用于同一提供商上的同级模型。

可选运维脚本（systemd/Termux）记录在这里：
[认证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)

## Anthropic 注意事项

Anthropic `claude-cli` 后端再次受支持。

- Anthropic 员工告诉我们，此 OpenClaw 集成路径再次被允许。
- 因此，除非 Anthropic 发布新策略，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为 Anthropic 支持的运行中
  已获准的方式。
- 对于长期存在的 Gateway 网关
  主机以及显式的服务端账单控制，Anthropic API key 仍然是最可预测的选择。

## 检查模型认证 Status

```bash
openclaw models status
openclaw doctor
```

## API key 轮换行为（Gateway 网关）

某些提供商支持在 API 调用
命中提供商速率限制时，使用备用 key 重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单一覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会将 `GOOGLE_API_KEY` 作为额外后备。
- 使用前会对同一 key 列表去重。
- OpenClaw 仅会针对速率限制错误使用下一个 key 重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用 key 重试。
- 如果所有 key 都失败，则返回最后一次尝试的最终错误。

## 控制使用哪个凭证

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前会话固定特定提供商凭证（示例配置文件 ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）打开紧凑选择器；使用 `/model status` 查看完整视图（候选项 + 下一个认证配置文件，以及已配置时的提供商端点详情）。

### 按智能体（CLI 覆盖）

为智能体设置显式认证配置文件顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定智能体；省略它则使用已配置的默认智能体。
调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。
调试冷却问题时，请记住速率限制冷却可能绑定到
某个模型 ID，而不是整个提供商配置文件。

## 故障排除

### “未找到凭证”

如果 Anthropic 配置文件缺失，请在
**Gateway 网关主机**上配置 Anthropic API key，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### Token 即将过期/已过期

运行 `openclaw models status` 确认哪个配置文件即将过期。如果
Anthropic token 配置文件缺失或已过期，请通过
setup-token 刷新该设置，或迁移到 Anthropic API key。

## 相关

- [机密管理](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [认证存储](/zh-CN/concepts/oauth)
