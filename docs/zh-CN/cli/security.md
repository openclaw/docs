---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你希望应用安全的“修复”建议（权限、收紧默认设置）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见的安全隐患）'
title: 安全性
x-i18n:
    generated_at: "2026-07-12T14:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具：审计及可选的安全修复。相关内容：[安全](/zh-CN/gateway/security)。

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

普通的 `security audit` 仅使用冷配置、文件系统和只读路径：它不会发现插件运行时安全收集器，因此常规审计不会加载每个已安装插件的运行时。`--deep` 会添加尽力而为的实时 Gateway 网关探测和插件自有的安全审计收集器（明确的内部调用方在已有适当运行时作用域时，也可以选择启用这些收集器）。

如果 Gateway 网关密码身份验证仅在启动时提供，请通过 `--auth password --password <password>` 传入相同的值，以便审计将其与 `hooks.token` 进行比对。

## 检查内容

**私信/信任模型**

- 当多个私信发送者共享主会话时发出警告，并建议对共享收件箱使用安全私信模式：`session.dmScope="per-channel-peer"`（多账户渠道则使用 `per-account-channel-peer`）。这是针对协作式共享收件箱的安全强化措施，并不能为互不信任的操作员提供隔离；对于这种情况，应使用不同的 Gateway 网关（或不同的操作系统用户/主机）划分信任边界。
- 当配置表明可能存在多用户共享入口时（例如开放的私信/群组策略、已配置的群组目标或通配符发送者规则），生成 `security.trust_model.multi_user_heuristic`——OpenClaw 的默认信任模型是个人助理（单个操作员），而不是可抵御恶意行为的多租户隔离。对于有意设置的多用户共享环境：对所有会话启用沙箱隔离，将文件系统访问限制在工作区作用域内，并且不要在该运行时中存放个人/私有身份或凭据。
- 当使用小型模型（参数量 `<=300B`）、未启用沙箱隔离且启用了 Web/浏览器工具时发出警告。

**Webhook/Hooks**

启动日志会记录非致命的安全警告；如果 `hooks.token` 重用了当前有效的 Gateway 网关共享密钥身份验证值（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`），审计也会将其标记。此外，以下情况也会触发警告：

- `hooks.token` 过短
- `hooks.path="/"`
- 未设置 `hooks.defaultSessionKey`
- `hooks.allowedAgentIds` 不受限制
- 已启用请求 `sessionKey` 覆盖
- 已启用覆盖，但未设置 `hooks.allowedSessionKeyPrefixes`

运行 `openclaw doctor --fix` 轮换持久化存储且被重复使用的 `hooks.token`，然后更新外部 Hook 发送方以使用新令牌。

**沙箱/工具**

- 配置了沙箱 Docker 设置，但沙箱模式处于关闭状态时发出警告。
- 当 `gateway.nodes.denyCommands` 使用无效的类似模式或未知条目时发出警告（仅对节点命令名称进行精确匹配，不过滤 Shell 文本）。
- 当 `gateway.nodes.allowCommands` 明确启用危险的节点命令时发出警告。
- 当全局 `tools.profile="minimal"` 被智能体工具配置文件覆盖时发出警告。
- 当写入/编辑工具已禁用，但 `exec` 仍然可用，且没有限制性的沙箱文件系统边界时发出警告。
- 当开放的私信或群组在没有沙箱/工作区保护措施的情况下暴露运行时/文件系统工具时发出警告。
- 当已安装插件的工具可能在宽松的工具策略下可访问时发出警告。

**沙箱浏览器**

- 当沙箱浏览器使用 Docker `bridge` 网络，但未设置 `sandbox.browser.cdpSourceRange` 时发出警告。
- 标记危险的沙箱 Docker 网络模式，包括 `host` 和 `container:*` 命名空间联接。
- 当现有沙箱浏览器 Docker 容器缺少哈希标签或标签已过期时（例如迁移前的容器缺少 `openclaw.browserConfigEpoch`）发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。

**网络/设备发现**

- 标记 `gateway.allowRealIpFallback=true`（代理配置错误时存在请求头欺骗风险）。
- 标记 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
- 当 `gateway.auth.mode="none"` 导致无需共享密钥即可访问 Gateway 网关 HTTP API（`/tools/invoke` 以及任何已启用的 `/v1/*` 端点）时发出警告。

**插件/渠道**

- 当基于 npm 的插件/hook 安装记录未锁定版本、缺少完整性元数据，或与当前安装的软件包版本不一致时发出警告。
- 当渠道允许列表依赖可变的名称/电子邮件/标签，而不是稳定 ID 时发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 的相关权限范围）。

以 `dangerous`/`dangerously` 为前缀的设置是供操作员在紧急情况下显式启用的越权覆盖；启用其中一项本身并不构成安全漏洞报告。有关危险参数的完整清单，请参阅[安全](/zh-CN/gateway/security)中的“Insecure or dangerous flags summary”。

## SecretRef 行为

`security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。如果当前命令路径中无法使用某个 SecretRef，审计将继续进行并报告 `secretDiagnostics`，而不会崩溃。`--token` 和 `--password` 仅覆盖该次命令调用的深度探测身份验证；它们不会重写配置或 SecretRef 映射。

## 抑制项

使用 `security.audit.suppressions` 接受有意保留的常驻发现。每个抑制项均匹配一个确切的 `checkId`，并可使用不区分大小写的 `titleIncludes` 和/或 `detailIncludes` 子字符串进一步缩小匹配范围：

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "已启用的扩展插件：gbrain",
          "reason": "受信任的本地操作员插件"
        }
      ]
    }
  }
}
```

被抑制的发现会从活动的 `summary` 和 `findings` 列表中移除。为便于审计，JSON 输出会将其保留在 `suppressedFindings` 下。配置抑制项后，活动输出还会保留一个不可抑制的 `security.audit.suppressions.active` 信息级发现，以便读者判断审计结果已被筛选。危险配置标志会按每个发现一个标志的方式输出，因此，接受一个危险标志不会隐藏共享同一 `config.insecure_or_dangerous_flags` checkId 的其他已启用标志。

由于抑制项可能隐藏常驻风险，除非 Exec 已针对受信任的本地自动化以 `security="full"` 和 `ask="off"` 运行，否则通过智能体运行的 shell 命令添加或移除抑制项需要 Exec 审批。

## JSON 输出

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

使用 `--fix --json` 时，输出同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会更改的内容

应用安全且确定性的修复：

- 将常见的 `groupPolicy="open"` 改为 `groupPolicy="allowlist"`（包括受支持渠道中的账户变体）
- 当 WhatsApp 群组策略改为 `allowlist` 时，如果已存储的 `allowFrom` 文件中存在列表，且配置尚未定义 `allowFrom`，则使用该列表初始化 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置文件以及常见敏感文件（`credentials/*.json`、`auth-profiles.json`、`openclaw-agent.sqlite` 和旧版会话工件）的权限
- 同时收紧 `openclaw.json` 所引用的配置包含文件的权限
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置权限

`--fix` **不会**：

- 轮换令牌/密码/API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关的绑定/身份验证/网络暴露选项
- 移除或重写插件/Skills

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
