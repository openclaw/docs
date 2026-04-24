---
read_when:
    - 你想对配置 / 状态执行一次快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认设置）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全隐患）'
title: 安全
x-i18n:
    generated_at: "2026-04-24T04:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

安全工具（审计 + 可选修复）。

相关内容：

- 安全指南：[安全](/zh-CN/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

当多个私信发送者共享主会话时，审计会发出警告，并推荐使用**安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账户渠道，则使用 `per-account-channel-peer`）以保护共享收件箱。
这适用于协作型 / 共享收件箱加固。由彼此不受信任 / 对抗性的操作员共享单个 Gateway 网关并不是推荐的设置；请使用单独的 Gateway 网关（或单独的操作系统用户 / 主机）来拆分信任边界。
如果配置表明很可能存在共享用户入口（例如开放的私信 / 群组策略、已配置的群组目标或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议是：为所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并且不要在该运行时中放置个人 / 私有身份或凭证。
当使用小模型（`<=300B`）且未启用沙箱隔离，同时启用了 Web / 浏览器工具时，它也会发出警告。
对于 webhook 入口，当 `hooks.token` 复用 Gateway 网关令牌、`hooks.token` 过短、`hooks.path="/"`、未设置 `hooks.defaultSessionKey`、`hooks.allowedAgentIds` 未受限制、启用了请求 `sessionKey` 覆盖，以及启用覆盖但未设置 `hooks.allowedSessionKeyPrefixes` 时，它也会发出警告。
当配置了沙箱 Docker 设置但沙箱模式已关闭、`gateway.nodes.denyCommands` 使用了无效的类模式 / 未知条目（仅支持节点命令名精确匹配，不支持 shell 文本过滤）、`gateway.nodes.allowCommands` 显式启用了危险节点命令、全局 `tools.profile="minimal"` 被智能体工具配置覆盖、开放群组在没有沙箱 / 工作区保护的情况下暴露运行时 / 文件系统工具，以及在宽松工具策略下已安装插件工具可能可被访问时，它也会发出警告。
它还会标记 `gateway.allowRealIpFallback=true`（如果代理配置错误，则存在请求头伪造风险）以及 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络且未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有的沙箱浏览器 Docker 容器存在缺失 / 过期的哈希标签（例如迁移前容器缺少 `openclaw.browserConfigEpoch`）时，它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件 / hook 安装记录未固定版本、缺少完整性元数据，或与当前已安装的软件包版本不一致时，它也会发出警告。
当渠道允许列表依赖可变名称 / 电子邮件 / 标签，而不是稳定 ID 时，它会发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost，以及适用范围内的 IRC）。
当 `gateway.auth.mode="none"` 使 Gateway 网关 HTTP API 在没有共享密钥的情况下可访问时（`/tools/invoke` 加上任何启用的 `/v1/*` 端点），它也会发出警告。
以前缀 `dangerous` / `dangerously` 命名的设置是显式的紧急破窗式运维覆盖；启用其中某项本身**并不**构成安全漏洞报告。
有关完整的危险参数清单，请参阅 [安全](/zh-CN/gateway/security) 中的“Insecure or dangerous flags summary”部分。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。
- 如果当前命令路径中某个 SecretRef 不可用，审计会继续执行，并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 仅覆盖本次命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

对 CI / 策略检查，请使用 `--json`：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果同时使用 `--fix` 和 `--json`，输出将同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会修改哪些内容

`--fix` 会应用安全、确定性的修复措施：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账户变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存在存储的 `allowFrom` 文件且配置中尚未定义 `allowFrom`，则从该文件为 `groupAllowFrom` 填充初始值
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态 / 配置以及常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 也会收紧从 `openclaw.json` 引用的配置包含文件的权限
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置权限

`--fix` **不会**：

- 轮换令牌 / 密码 / API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定 / 认证 / 网络暴露选项
- 删除或重写插件 / Skills

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
