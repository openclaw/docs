---
read_when:
    - 调试模型身份验证或 OAuth 过期问题
    - 编写身份验证或凭证存储文档
summary: 模型认证：OAuth、API 密钥、Claude CLI 复用和 Anthropic setup-token
title: 身份验证
x-i18n:
    generated_at: "2026-05-07T13:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
此页面是**模型提供商**身份认证参考（API 密钥、OAuth、Claude CLI 复用，以及 Anthropic setup-token）。对于 **Gateway 网关连接**身份认证（token、password、trusted-proxy），请参阅[配置](/zh-CN/gateway/configuration)和[受信任代理身份认证](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API 密钥。对于常驻运行的 Gateway 网关主机，API 密钥通常是最可预测的选项。当订阅/OAuth 流程与你的提供商账号模型匹配时，也支持这些流程。

完整 OAuth 流程和存储布局请参阅 [/concepts/oauth](/zh-CN/concepts/oauth)。
对于基于 SecretRef 的身份认证（`env`/`file`/`exec` 提供商），请参阅[机密信息管理](/zh-CN/gateway/secrets)。
对于 `models status --probe` 使用的凭证可用性/原因代码规则，请参阅[身份认证凭证语义](/zh-CN/auth-credential-semantics)。

## 推荐设置（API 密钥，任意提供商）

如果你正在运行长期存在的 Gateway 网关，请从所选提供商的 API 密钥开始。
特别是对于 Anthropic，API 密钥身份认证仍然是最可预测的服务器设置，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在你的提供商控制台中创建 API 密钥。
2. 将它放到 **Gateway 网关主机**（运行 `openclaw gateway` 的机器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关在 systemd/launchd 下运行，建议将密钥放入
   `~/.openclaw/.env`，这样守护进程就可以读取它：

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

如果你不想自行管理环境变量，新手引导可以为守护进程使用存储
API 密钥：`openclaw onboard`。

关于环境继承（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）的详情，请参阅[帮助](/zh-CN/help)。

## Anthropic：Claude CLI 和 token 兼容性

Anthropic setup-token 身份认证仍作为受支持的 token 路径在 OpenClaw 中可用。Anthropic 工作人员后来告诉我们，OpenClaw 风格的 Claude CLI 使用方式已再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的受认可方式，除非 Anthropic 发布新政策。当主机上可以使用 Claude CLI 复用时，它现在是首选路径。

对于长期存在的 Gateway 网关主机，Anthropic API 密钥仍然是最可预测的设置。如果你想在同一主机上复用现有 Claude 登录，请在新手引导/配置中使用 Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 在 Gateway 网关主机上让 Claude Code 自身登录 Anthropic。
2. 告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli`
   后端，并存储匹配的 OpenClaw 身份认证配置文件。

如果 `claude` 不在 `PATH` 中，请先安装 Claude Code，或将
`agents.defaults.cliBackends.claude-cli.command` 设置为真实二进制文件路径。

手动输入 token（任意提供商；写入 `auth-profiles.json` + 更新配置）：

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

OpenClaw 在运行时需要规范的 `version` + `profiles` 形状。如果较旧的安装仍有类似 `{ "openrouter": { "apiKey": "..." } }` 的扁平文件，请运行 `openclaw doctor --fix`，将其重写为 `openrouter:default` API 密钥配置文件；Doctor 会在原文件旁保留一份 `.legacy-flat.*.bak` 副本。`baseUrl`、`api`、模型 ID、headers 和 timeouts 等端点细节应放在 `openclaw.json` 或 `models.json` 中的 `models.providers.<id>` 下，而不是放在 `auth-profiles.json` 中。

Bedrock `auth: "aws-sdk"` 等外部身份认证路由也不是凭证。如果你想要一个具名 Bedrock 路由，请在 `openclaw.json` 中放入 `auth.profiles.<id>.mode: "aws-sdk"`；不要将 `type: "aws-sdk"` 写入 `auth-profiles.json`。`openclaw doctor --fix` 会将旧版 AWS SDK 标记从凭证存储移动到配置元数据中。

静态凭证也支持身份认证配置文件引用：

- `api_key` 凭证可以使用 `keyRef: { source, provider, id }`
- `token` 凭证可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则会拒绝该配置文件由 SecretRef 支持的 `keyRef`/`tokenRef` 输入。

适合自动化的检查（过期/缺失时退出 `1`，即将过期时退出 `2`）：

```bash
openclaw models status --check
```

实时身份认证探测：

```bash
openclaw models status --probe
```

注意：

- 探测行可以来自身份认证配置文件、环境凭证或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了已存储的配置文件，探测会为该配置文件报告
  `excluded_by_auth_order`，而不是尝试它。
- 如果存在身份认证，但 OpenClaw 无法为该提供商解析可探测的模型候选项，探测会报告 `status: no_model`。
- 速率限制冷却可以按模型限定。某个配置文件针对一个模型处于冷却状态时，仍可用于同一提供商上的同级模型。

可选运维脚本（systemd/Termux）记录在这里：
[身份认证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)

## Anthropic 说明

Anthropic `claude-cli` 后端已重新受支持。

- Anthropic 工作人员告诉我们，此 OpenClaw 集成路径已再次被允许。
- 因此，OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为 Anthropic 支持运行的受认可方式，除非 Anthropic 发布新政策。
- 对于长期存在的 Gateway 网关主机和显式服务器端计费控制，Anthropic API 密钥仍然是最可预测的选择。

## 检查模型身份认证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway 网关）

某些提供商支持在 API 调用遇到提供商速率限制时，使用备用密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会包含 `GOOGLE_API_KEY` 作为额外回退。
- 使用前会对同一密钥列表进行去重。
- OpenClaw 仅对速率限制错误使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试产生的最终错误。

## 控制使用哪个凭证

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前会话固定特定提供商凭证（示例配置文件 ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）获得紧凑选择器；使用 `/model status` 查看完整视图（候选项 + 下一个身份认证配置文件，以及已配置时的提供商端点详情）。

### 按智能体（CLI 覆盖）

为智能体设置显式身份认证配置文件顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定智能体；省略它则使用已配置的默认智能体。
调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。
调试冷却问题时，请记住速率限制冷却可能绑定到某个模型 ID，
而不是整个提供商配置文件。

## 故障排除

### “未找到凭证”

如果缺少 Anthropic 配置文件，请在 **Gateway 网关主机**上配置 Anthropic API 密钥，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### Token 即将过期/已过期

运行 `openclaw models status` 来确认哪个配置文件即将过期。如果 Anthropic token 配置文件缺失或已过期，请通过 setup-token 刷新该设置，或迁移到 Anthropic API 密钥。

## 相关内容

- [机密信息管理](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [身份认证存储](/zh-CN/concepts/oauth)
