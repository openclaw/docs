---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认设置）
summary: 用于 `openclaw security` 的 CLI 参考（审计并修复常见安全陷阱）
title: 安全
x-i18n:
    generated_at: "2026-05-10T19:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
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

普通的 `security audit` 会停留在冷配置/文件系统/只读路径。它默认不会发现插件运行时安全收集器，因此常规审计不会加载每个已安装的插件运行时。使用 `--deep` 可包含尽力而为的实时 Gateway 网关探测和插件拥有的安全审计收集器；显式内部调用方在已有适当运行时作用域时，也可以选择启用这些插件拥有的收集器。

当多个私信发送者共享主会话时，审计会发出警告，并建议使用**安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账号渠道，则使用 `per-account-channel-peer`）来处理共享收件箱。
这是用于协作式/共享收件箱加固。不建议让互不信任/对抗性的操作员共享同一个 Gateway 网关；请用独立 Gateway 网关（或独立 OS 用户/主机）拆分信任边界。
当配置暗示可能存在共享用户入口时（例如开放私信/群组策略、已配置群组目标或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议是对所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并让个人/私有身份或凭证远离该运行时。
当小模型（`<=300B`）在未启用沙箱隔离且启用了 Web/浏览器工具的情况下使用时，它也会发出警告。
对于 webhook 入口，当 `hooks.token` 复用 Gateway 网关令牌、`hooks.token` 过短、`hooks.path="/"`、`hooks.defaultSessionKey` 未设置、`hooks.allowedAgentIds` 不受限制、启用了请求 `sessionKey` 覆盖，以及在未设置 `hooks.allowedSessionKeyPrefixes` 的情况下启用覆盖时，它会发出警告。
当配置了沙箱 Docker 设置但沙箱模式关闭时、`gateway.nodes.denyCommands` 使用无效的类模式/未知条目时（只按精确节点命令名匹配，不进行 shell 文本过滤）、`gateway.nodes.allowCommands` 显式启用危险节点命令时、全局 `tools.profile="minimal"` 被智能体工具配置文件覆盖时、写入/编辑工具被禁用但 `exec` 仍可用且没有受约束的沙箱文件系统边界时、开放群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具时，以及已安装的插件工具可能在宽松工具策略下可达时，它也会发出警告。
它还会标记 `gateway.allowRealIpFallback=true`（代理配置错误时存在标头伪造风险）和 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络且未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙箱浏览器 Docker 容器缺少/存在过期哈希标签时（例如迁移前容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件/钩子安装记录未固定版本、缺少完整性元数据，或与当前已安装的软件包版本发生漂移时，它也会发出警告。
当渠道 allowlist 依赖可变名称/邮箱/标签而不是稳定 ID 时，它会发出警告（Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 作用域，在适用时）。
当 `gateway.auth.mode="none"` 让 Gateway 网关 HTTP API 在没有共享密钥的情况下可访问时，它会发出警告（`/tools/invoke` 以及任何已启用的 `/v1/*` 端点）。
以 `dangerous`/`dangerously` 为前缀的设置是显式的紧急操作员覆盖；启用其中一个设置本身并不构成安全漏洞报告。
如需完整的危险参数清单，请参阅 [安全](/zh-CN/gateway/security) 中的“Insecure or dangerous flags summary”部分。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。
- 如果当前命令路径中无法使用某个 SecretRef，审计会继续并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 只会覆盖该命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

使用 `--json` 进行 CI/策略检查：

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
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存储的 `allowFrom` 文件中存在该列表且配置尚未
  定义 `allowFrom`，则从该文件中填充 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 同时收紧从 `openclaw.json` 引用的配置 include 文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换令牌/密码/API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/认证/网络暴露选择
- 移除或重写插件/Skills

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [安全审计](/zh-CN/gateway/security)
