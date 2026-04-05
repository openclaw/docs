---
read_when:
    - 你想对配置/状态运行快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认值）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全陷阱）'
title: security
x-i18n:
    generated_at: "2026-04-05T08:20:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

安全工具（审计 + 可选修复）。

相关内容：

- 安全指南：[安全性](/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

当多个私信发送者共享主会话时，审计会发出警告，并推荐使用**安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账户渠道则使用 `per-account-channel-peer`）。这适用于协作式/共享收件箱的加固。由相互不信任/对抗性的操作员共享同一个 Gateway 网关并不是推荐的设置；请使用单独的 Gateway 网关（或单独的 OS 用户/主机）来拆分信任边界。
当配置暗示可能存在共享用户入口时（例如开放的私信/群组策略、已配置的群组目标，或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议对所有会话启用沙箱隔离、将文件系统访问限制在工作区范围内，并且不要在该运行时上放置个人/私有身份或凭证。
当小模型（`<=300B`）在未启用沙箱隔离的情况下使用，且启用了 web/browser 工具时，它也会发出警告。
对于 webhook 入口，当 `hooks.token` 重用了 Gateway 网关令牌、`hooks.token` 过短、`hooks.path="/"`、`hooks.defaultSessionKey` 未设置、`hooks.allowedAgentIds` 未受限制、启用了请求 `sessionKey` 覆盖，以及在未设置 `hooks.allowedSessionKeyPrefixes` 的情况下启用了覆盖时，它也会发出警告。
当 sandbox Docker 设置已配置但沙箱模式关闭时、当 `gateway.nodes.denyCommands` 使用了无效的类模式/未知条目时（仅支持精确的节点命令名匹配，不支持 shell 文本过滤）、当 `gateway.nodes.allowCommands` 显式启用了危险的节点命令时、当全局 `tools.profile="minimal"` 被智能体工具配置文件覆盖时、当开放群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具时，以及当已安装的扩展插件工具在宽松工具策略下可能可达时，它也会发出警告。
它还会标记 `gateway.allowRealIpFallback=true`（如果代理配置错误，存在请求头伪造风险）和 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络而未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙箱浏览器 Docker 容器缺少或使用了过时的哈希标签时（例如迁移前的容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件/hook 安装记录未固定版本、缺少完整性元数据，或与当前已安装的软件包版本不一致时，它也会发出警告。
当渠道允许列表依赖可变的名称/邮箱/标签而非稳定 ID 时（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost，以及适用的 IRC 范围），它也会发出警告。
当 `gateway.auth.mode="none"` 导致 Gateway 网关 HTTP API 在没有共享密钥的情况下可被访问时（`/tools/invoke` 加上任何已启用的 `/v1/*` 端点），它也会发出警告。
以 `dangerous`/`dangerously` 为前缀的设置是明确的 break-glass 操作员覆盖项；启用其中某一项本身并不自动构成安全漏洞报告。
完整的危险参数清单，请参阅[安全性](/gateway/security)中的“非安全或危险标志摘要”部分。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。
- 如果当前命令路径中某个 SecretRef 不可用，审计会继续进行，并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 仅覆盖该次命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

对 CI/策略检查使用 `--json`：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果组合使用 `--fix` 和 `--json`，输出将同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会修改什么

`--fix` 会应用安全、确定性的修复措施：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账户变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存在存储的 `allowFrom` 文件且配置中尚未定义 `allowFrom`，则会从该文件为 `groupAllowFrom` 设定初始值
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置以及常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 也会收紧 `openclaw.json` 中引用的配置 include 文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换令牌/密码/API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/认证/网络暴露选择
- 删除或重写插件/Skills
