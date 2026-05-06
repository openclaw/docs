---
read_when:
    - 你想对配置/状态进行快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认设置）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全隐患）'
title: 安全
x-i18n:
    generated_at: "2026-05-06T15:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具（审计 + 可选修复）。

相关：

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

普通的 `security audit` 会停留在冷配置/文件系统/只读路径上。默认情况下，它不会发现插件运行时安全收集器，因此日常审计不会加载每个已安装的插件运行时。使用 `--deep` 可包含尽力而为的实时 Gateway 网关探测和插件拥有的安全审计收集器；显式的内部调用方在已经具备合适运行时范围时，也可以选择启用这些插件拥有的收集器。

当多个私信发送者共享主会话时，审计会发出警告，并建议使用**安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账号渠道则使用 `per-account-channel-peer`）来处理共享收件箱。
这是用于协作式/共享收件箱加固的做法。不建议让互不信任或存在对抗关系的操作员共享同一个 Gateway 网关；应使用独立 Gateway 网关（或独立的操作系统用户/主机）拆分信任边界。
当配置表明可能存在共享用户入口时（例如开放私信/群组策略、已配置的群组目标，或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议对所有会话启用沙箱，将文件系统访问限制在工作区范围内，并避免在该运行时中放置个人/私有身份或凭证。
当小模型（`<=300B`）未启用沙箱且已启用 Web/浏览器工具时，它也会发出警告。
对于 webhook 入口，当 `hooks.token` 复用 Gateway 网关令牌、`hooks.token` 过短、`hooks.path="/"`、`hooks.defaultSessionKey` 未设置、`hooks.allowedAgentIds` 不受限制、已启用请求 `sessionKey` 覆盖，以及在未设置 `hooks.allowedSessionKeyPrefixes` 的情况下启用覆盖时，它会发出警告。
当沙箱 Docker 设置已配置但沙箱模式关闭、`gateway.nodes.denyCommands` 使用无效的类模式/未知条目（仅精确匹配节点命令名称，而不是过滤 shell 文本）、`gateway.nodes.allowCommands` 显式启用危险节点命令、全局 `tools.profile="minimal"` 被智能体工具配置覆盖、开放群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具，以及已安装的插件工具在宽松工具策略下可能可达时，它也会发出警告。
它还会标记 `gateway.allowRealIpFallback=true`（如果代理配置错误，存在标头欺骗风险）和 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络且未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙箱浏览器 Docker 容器缺少哈希标签或标签过期时（例如迁移前容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件/钩子安装记录未固定版本、缺少完整性元数据，或与当前已安装的软件包版本发生漂移时，它也会发出警告。
当渠道允许列表依赖可变的名称/邮箱/标签，而不是稳定 ID 时，它会发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 范围等）。
当 `gateway.auth.mode="none"` 使 Gateway 网关 HTTP API 在没有共享密钥的情况下可达时（`/tools/invoke` 加上任何已启用的 `/v1/*` 端点），它会发出警告。
带有 `dangerous`/`dangerously` 前缀的设置是显式的紧急操作员覆盖；启用其中一项本身并不构成安全漏洞报告。
如需完整的危险参数清单，请参阅[安全](/zh-CN/gateway/security)中的“Insecure or dangerous flags summary”一节。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中支持的 SecretRef。
- 如果当前命令路径中无法使用某个 SecretRef，审计会继续并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 只会覆盖该命令调用的深度探测身份验证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

在 CI/策略检查中使用 `--json`：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果同时使用 `--fix` 和 `--json`，输出会同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会更改什么

`--fix` 会应用安全、确定性的修复：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账号变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存储的 `allowFrom` 文件存在且配置尚未定义 `allowFrom`，则从该文件填充 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 也会收紧从 `openclaw.json` 引用的配置 include 文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换令牌/密码/API key
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/身份验证/网络暴露选择
- 移除或重写插件/Skills

## 相关

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
