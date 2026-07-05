---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你想应用安全的 “fix” 建议（权限、收紧默认值）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全隐患）'
title: 安全
x-i18n:
    generated_at: "2026-07-05T11:10:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49b80cc444995556a657798e62f4547acd2360e5feb5fe15e547933bbef98c4e
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具：审计以及可选的安全修复。相关：[安全](/zh-CN/gateway/security)。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## 审计模式

普通的 `security audit` 保持在冷配置/文件系统/只读路径上：它不会发现插件运行时安全收集器，因此常规审计不会加载每个已安装的插件运行时。`--deep` 会添加尽力而为的实时 Gateway 网关探测和插件拥有的安全审计收集器（显式内部调用方在已经具备合适运行时作用域时，也可以选择使用这些收集器）。

如果 Gateway 网关密码认证只在启动时提供，请使用 `--auth password --password <password>` 传入相同值，这样审计就可以将它与 `hooks.token` 进行检查。

## 检查内容

**私信/信任模型**

- 当多个私信发送者共享主会话时发出警告，并建议使用安全私信模式：共享收件箱使用 `session.dmScope="per-channel-peer"`（多账号渠道使用 `per-account-channel-peer`）。这是协作式/共享收件箱加固，不是针对互不信任操作员的隔离；此类信任边界请使用独立网关（或独立 OS 用户/主机）拆分。
- 当配置暗示可能存在共享用户入口时（例如开放私信/群组策略、已配置的群组目标，或通配符发送者规则），发出 `security.trust_model.multi_user_heuristic` —— OpenClaw 的默认信任模型是个人助理（一个操作员），不是敌对多租户隔离。对于有意设置的共享用户环境：对所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并让个人/私有身份或凭证远离该运行时。
- 当小模型（`<=300B` 参数）在未启用沙箱隔离且启用了 Web/浏览器工具时发出警告。

**Webhook/hooks**

启动时会记录非致命安全警告，审计会标记 `hooks.token` 复用活跃 Gateway 网关共享密钥认证值（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。以下情况也会发出警告：

- `hooks.token` 过短
- `hooks.path="/"`
- `hooks.defaultSessionKey` 未设置
- `hooks.allowedAgentIds` 未受限制
- 请求 `sessionKey` 覆盖已启用
- 覆盖已启用但未设置 `hooks.allowedSessionKeyPrefixes`

运行 `openclaw doctor --fix` 轮换已持久化且复用的 `hooks.token`，然后更新外部 hook 发送方以使用新 token。

**沙箱/工具**

- 当沙箱 Docker 设置已配置但沙箱模式关闭时发出警告。
- 当 `gateway.nodes.denyCommands` 使用无效的类似模式/未知条目时发出警告（匹配仅针对精确节点命令名，而不是 shell 文本过滤）。
- 当 `gateway.nodes.allowCommands` 显式启用危险节点命令时发出警告。
- 当全局 `tools.profile="minimal"` 被智能体工具配置覆盖时发出警告。
- 当写入/编辑工具被禁用，但 `exec` 仍可用且没有约束性的沙箱文件系统边界时发出警告。
- 当开放私信或群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具时发出警告。
- 当已安装插件工具可能在宽松工具策略下可达时发出警告。

**沙箱浏览器**

- 当沙箱浏览器使用 Docker `bridge` 网络但未设置 `sandbox.browser.cdpSourceRange` 时发出警告。
- 标记危险的沙箱 Docker 网络模式，包括 `host` 和 `container:*` 命名空间加入。
- 当现有沙箱浏览器 Docker 容器缺少/过期哈希标签时（例如迁移前容器缺少 `openclaw.browserConfigEpoch`）发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。

**网络/设备发现**

- 标记 `gateway.allowRealIpFallback=true`（如果代理配置错误，则存在请求头伪造风险）。
- 标记 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
- 当 `gateway.auth.mode="none"` 让 Gateway 网关 HTTP API 在没有共享密钥的情况下可达时发出警告（`/tools/invoke` 加上任何已启用的 `/v1/*` 端点）。

**插件/渠道**

- 当基于 npm 的插件/hook 安装记录未固定版本、缺少完整性元数据，或与当前安装的包版本发生漂移时发出警告。
- 当渠道允许列表依赖可变名称/邮箱/tag，而不是稳定 ID 时发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 作用域等）。

以 `dangerous`/`dangerously` 为前缀的设置是显式的破窗式操作员覆盖；启用其中一个本身并不构成安全漏洞报告。完整的危险参数清单见[安全](/zh-CN/gateway/security)中的 “不安全或危险标志摘要”。

## SecretRef 行为

`security audit` 会以只读模式解析其目标路径中支持的 SecretRefs。如果某个 SecretRef 在当前命令路径中不可用，审计会继续并报告 `secretDiagnostics`，而不是崩溃。`--token` 和 `--password` 只会覆盖该命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## 抑制项

使用 `security.audit.suppressions` 接受有意保留的长期发现。每个抑制项匹配一个精确的 `checkId`，并且可以用不区分大小写的 `titleIncludes` 和/或 `detailIncludes` 子字符串缩小范围：

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

被抑制的发现会从活跃 `summary` 和 `findings` 列表中移除。JSON 输出会将它们保留在 `suppressedFindings` 下，以便审计。当配置了抑制项时，活跃输出也会保留一个不可抑制的 `security.audit.suppressions.active` 信息发现，让读者知道审计已被过滤。危险配置标志会按每个标志发出一条发现，因此接受一个危险标志不会隐藏共享同一 `config.insecure_or_dangerous_flags` checkId 的其他已启用标志。

由于抑制项可能隐藏长期风险，通过智能体运行的 shell 命令添加或移除它们需要 Exec 审批，除非 Exec 已经在受信任本地自动化中以 `security="full"` 和 `ask="off"` 运行。

## JSON 输出

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

使用 `--fix --json` 时，输出同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会更改什么

应用安全、确定性的修复：

- 将常见的 `groupPolicy="open"` 翻转为 `groupPolicy="allowlist"`（包括受支持渠道中的账号变体）
- 当 WhatsApp 群组策略翻转为 `allowlist` 时，如果存储的 `allowFrom` 文件中存在该列表且配置尚未定义 `allowFrom`，则从该文件填充 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧 state/config 和常见敏感文件的权限（`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话 `*.jsonl`）
- 也会收紧从 `openclaw.json` 引用的配置 include 文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换 token、密码或 API key
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/认证/网络暴露选择
- 移除或重写插件/Skills

## 相关

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
