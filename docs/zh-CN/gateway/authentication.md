---
read_when:
    - 调试模型鉴权或 OAuth 过期
    - 编写有关鉴权或凭证存储的文档
summary: 模型鉴权：OAuth、API 密钥和 Claude CLI 复用
title: 鉴权
x-i18n:
    generated_at: "2026-04-05T08:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# 鉴权（模型提供商）

<Note>
本页介绍的是**模型提供商**鉴权（API 密钥、OAuth、Claude CLI 复用）。对于 **Gateway 网关连接**鉴权（token、password、trusted-proxy），请参见[配置](/gateway/configuration)和[Trusted Proxy Auth](/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API 密钥。对于始终在线的 Gateway 网关
宿主机，API 密钥通常是最可预测的选项。当它们与你的提供商账户模型匹配时，也支持订阅/OAuth
流程。

有关完整的 OAuth 流程和存储
布局，请参见 [/concepts/oauth](/concepts/oauth)。
有关基于 SecretRef 的鉴权（`env`/`file`/`exec` 提供商），请参见[密钥管理](/gateway/secrets)。
有关 `models status --probe` 使用的凭证适用性/原因代码规则，请参见
[鉴权凭证语义](/auth-credential-semantics)。

## 推荐设置（API 密钥，任意提供商）

如果你运行的是长期在线的 Gateway 网关，请先为所选
提供商配置一个 API 密钥。
对于 Anthropic 而言，API 密钥鉴权是安全路径。Claude CLI 复用是
另一条受支持的订阅式设置路径。

1. 在你的提供商控制台中创建一个 API 密钥。
2. 将它放到**Gateway 网关宿主机**上（也就是运行 `openclaw gateway` 的机器）。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关运行在 systemd/launchd 下，建议将密钥放入
   `~/.openclaw/.env`，以便守护进程可以读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启守护进程（或重启你的 Gateway 网关进程），并重新检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，新手引导可以为守护进程使用场景存储
API 密钥：`openclaw onboard`。

有关环境变量继承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）的详细信息，请参见[帮助](/help)。

## Anthropic：旧版 token 兼容性

Anthropic setup-token 鉴权在 OpenClaw 中仍然可作为
旧版/手动路径使用。Anthropic 的公开 Claude Code 文档仍然涵盖了在 Claude 套餐下直接
使用 Claude Code 终端的方式，但 Anthropic 另行告知 OpenClaw 用户，**OpenClaw**
Claude 登录路径会被视为第三方 harness 使用，需要在
订阅之外单独计费的 **Extra Usage**。

如果你想要最清晰的设置路径，请使用 Anthropic API 密钥，或迁移到 Gateway 网关宿主机上的 Claude CLI。

手动输入 token（任意提供商；会写入 `auth-profiles.json` 并更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

静态凭证也支持 auth profile 引用：

- `api_key` 凭证可使用 `keyRef: { source, provider, id }`
- `token` 凭证可使用 `tokenRef: { source, provider, id }`
- OAuth 模式的 profile 不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则会拒绝该 profile 使用基于 SecretRef 的 `keyRef`/`tokenRef` 输入。

适合自动化的检查（过期/缺失时退出码为 `1`，即将过期时为 `2`）：

```bash
openclaw models status --check
```

实时鉴权探测：

```bash
openclaw models status --probe
```

说明：

- 探测行可以来自 auth profiles、环境变量凭证或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了某个已存储的 profile，探测会对该 profile 报告
  `excluded_by_auth_order`，而不是尝试使用它。
- 如果鉴权存在，但 OpenClaw 无法为该提供商解析出可探测的模型候选项，
  探测会报告 `status: no_model`。
- 限速冷却时间可以按模型作用域生效。某个 profile 对一个
  模型处于冷却中时，对同一提供商下的兄弟模型仍可能可用。

可选运维脚本（systemd/Termux）记录在此：
[鉴权监控脚本](/help/scripts#auth-monitoring-scripts)

## Anthropic：Claude CLI 迁移

如果 Claude CLI 已经安装并在 Gateway 网关宿主机上完成登录，你可以
将现有的 Anthropic 设置切换到 CLI 后端。这是 OpenClaw
支持的一条迁移路径，用于复用该宿主机上的本地 Claude CLI 登录。

前置条件：

- Gateway 网关宿主机上已安装 `claude`
- Claude CLI 已在该宿主机上通过 `claude auth login` 完成登录

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

这会保留你现有的 Anthropic auth profiles 以便回滚，但会将默认
模型选择改为 `claude-cli/...`，并在 `agents.defaults.models` 下添加匹配的 Claude CLI
allowlist 条目。

验证：

```bash
openclaw models status
```

新手引导快捷方式：

```bash
openclaw onboard --auth-choice anthropic-cli
```

交互式 `openclaw onboard` 和 `openclaw configure` 仍然优先推荐 Anthropic 使用 Claude CLI，
但 Anthropic setup-token 现已重新作为
旧版/手动路径提供，并且应按 Extra Usage 计费预期来使用。

## 检查模型鉴权状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway 网关）

某些提供商支持在 API 调用
触发提供商限速时，使用备用密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会将 `GOOGLE_API_KEY` 作为额外回退。
- 同一组密钥在使用前会先去重。
- 只有遇到限速错误时，OpenClaw 才会使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`，或
  `workers_ai ... quota limit exceeded`）。
- 非限速错误不会用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试的最终错误。

## 控制使用哪个凭证

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 可为当前会话固定指定某个提供商凭证（示例 profile id：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）获取紧凑选择器；使用 `/model status` 获取完整视图（候选项 + 下一个 auth profile，以及在已配置时的提供商端点详情）。

### 按智能体（CLI 覆盖）

为某个智能体设置显式 auth profile 顺序覆盖（存储在该智能体的 `auth-profiles.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 可指定某个特定智能体；省略它则使用已配置的默认智能体。
当你调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储 profiles 显示为 `excluded_by_auth_order`，而不是静默跳过。
当你调试冷却问题时，请记住限速冷却可以绑定到
某个模型 ID，而不是整个提供商 profile。

## 故障排除

### “No credentials found”

如果缺少 Anthropic profile，请将该设置迁移到 Gateway 网关宿主机上的 Claude CLI 或 API
密钥，然后重新检查：

```bash
openclaw models status
```

### token 即将过期/已过期

运行 `openclaw models status` 以确认哪个 profile 即将过期。如果某个旧版
Anthropic token profile 缺失或已过期，请将该设置迁移到 Claude CLI
或 API 密钥。

## Claude CLI 要求

仅在 Anthropic Claude CLI 复用路径中需要：

- 已安装 Claude Code CLI（`claude` 命令可用）
