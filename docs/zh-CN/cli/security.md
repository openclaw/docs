---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认值）
summary: CLI 参考：`openclaw security`（审计并修复常见安全陷阱）
title: 安全
x-i18n:
    generated_at: "2026-06-27T01:43:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

普通的 `security audit` 会停留在冷配置/文件系统/只读路径上。默认情况下，它不会发现插件运行时安全收集器，因此例行审计不会加载每个已安装的插件运行时。使用 `--deep` 可包含尽力而为的实时 Gateway 网关探测和插件拥有的安全审计收集器；显式的内部调用方在已经拥有合适运行时作用域时，也可以选择启用这些插件拥有的收集器。

当多个私信发送者共享主会话时，审计会发出警告，并建议使用 **安全私信模式**：共享收件箱使用 `session.dmScope="per-channel-peer"`（多账号渠道使用 `per-account-channel-peer`）。
这是为了加固协作式/共享收件箱。不建议让互不信任/对抗性的操作员共享单个 Gateway 网关；应使用单独的 Gateway 网关（或单独的 OS 用户/主机）拆分信任边界。
当配置表明可能存在共享用户入口时（例如开放私信/群组策略、已配置的群组目标，或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议是对所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并避免在该运行时上放置个人/私密身份或凭据。
当小模型（`<=300B`）在未启用沙箱隔离且启用了 Web/浏览器工具的情况下使用时，它也会发出警告。
对于 webhook 入口，启动时会记录一条非致命安全警告；审计会标记 `hooks.token` 复用活动 Gateway 网关共享密钥认证值的情况，包括 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 和 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。它还会在以下情况发出警告：

- `hooks.token` 太短
- `hooks.path="/"`
- `hooks.defaultSessionKey` 未设置
- `hooks.allowedAgentIds` 不受限制
- 请求 `sessionKey` 覆盖已启用
- 覆盖已启用但未设置 `hooks.allowedSessionKeyPrefixes`

如果 Gateway 网关密码认证仅在启动时提供，请将相同的值传给 `openclaw security audit --auth password --password <password>`，以便审计可以对照 `hooks.token` 检查它。
运行 `openclaw doctor --fix` 轮换已持久化且被复用的 `hooks.token`，然后更新外部 hook 发送方以使用新的 hook token。

当沙箱 Docker 设置已配置但沙箱模式关闭、`gateway.nodes.denyCommands` 使用无效的类模式/未知条目（只进行精确节点命令名匹配，不进行 shell 文本过滤）、`gateway.nodes.allowCommands` 显式启用危险节点命令、全局 `tools.profile="minimal"` 被 Agent 工具配置覆盖、写入/编辑工具已禁用但 `exec` 仍可用且没有受限的沙箱文件系统边界、开放私信或群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具，以及已安装的插件工具可能在宽松工具策略下可达时，它也会发出警告。
它还会标记 `gateway.allowRealIpFallback=true`（代理配置错误时存在标头伪造风险）和 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络但未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙箱浏览器 Docker 容器缺少/带有过期哈希标签时（例如迁移前容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件/hook 安装记录未固定版本、缺少完整性元数据，或与当前已安装包版本发生漂移时，它也会发出警告。
当渠道 allowlist 依赖可变名称/邮箱/tag 而不是稳定 ID 时，它会发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 作用域）。
当 `gateway.auth.mode="none"` 使 Gateway 网关 HTTP API 在没有共享密钥的情况下可访问时（`/tools/invoke` 加上任何已启用的 `/v1/*` 端点），它会发出警告。
以 `dangerous`/`dangerously` 为前缀的设置是显式的破窗式操作员覆盖；启用其中一个设置本身并不构成安全漏洞报告。
有关完整危险参数清单，请参阅 [安全](/zh-CN/gateway/security) 中的“Insecure or dangerous flags summary”部分。

有意保留的长期发现可以通过 `security.audit.suppressions` 接受。
每条抑制规则匹配一个精确的 `checkId`，并且可以使用
`titleIncludes` 和/或 `detailIncludes` 大小写不敏感子字符串进一步收窄：

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

被抑制的发现会从活动 `summary` 和 `findings` 列表中移除。
JSON 输出会将它们保留在 `suppressedFindings` 下，以便审计追踪。
配置抑制规则后，活动输出还会保留一个不可抑制的
`security.audit.suppressions.active` 信息发现，让读者知道审计
已被过滤。危险配置标志会按每个标志一条发现发出，因此
接受一个危险标志不会隐藏共享相同
`config.insecure_or_dangerous_flags` checkId 的其他已启用标志。
由于抑制规则可能隐藏长期风险，通过
Agent 运行的 shell 命令添加或移除它们需要 Exec 审批，除非 Exec 已经在可信本地自动化中以 `security="full"` 和 `ask="off"` 运行。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中支持的 SecretRef。
- 如果 SecretRef 在当前命令路径中不可用，审计会继续并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 只会覆盖该命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

使用 `--json` 进行 CI/策略检查：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果组合使用 `--fix` 和 `--json`，输出会同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会更改什么

`--fix` 会应用安全、确定性的修复：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账号变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存储的 `allowFrom` 文件存在且配置尚未
  定义 `allowFrom`，则从该文件填充 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 同时收紧从 `openclaw.json` 引用的配置 include 文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换 token/密码/API key
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/认证/网络暴露选择
- 移除或重写插件/Skills

## 相关

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
