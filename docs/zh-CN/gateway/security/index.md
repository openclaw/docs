---
read_when:
    - 添加会扩大访问权限或自动化范围的功能
summary: 运行具有 shell 访问权限的 AI 网关时的安全注意事项和威胁模型
title: 安全
x-i18n:
    generated_at: "2026-04-28T11:54:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b60e4a7924789227fcd8ca648253dcf4a2536dccc4daca5ad54ed3241987a2dd
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **个人助理信任模型。** 本指南假设每个 Gateway 网关有一个受信任的
  操作员边界（单用户、个人助理模型）。
  OpenClaw **不是** 供多个
  对抗性用户共享一个智能体或 Gateway 网关的恶意多租户安全边界。如果你需要混合信任或
  对抗性用户运行，请拆分信任边界（独立的 Gateway 网关 +
  凭证，最好使用独立的 OS 用户或主机）。
</Warning>

## 先确定范围：个人助理安全模型

OpenClaw 安全指南假设使用 **个人助理** 部署：一个受信任的操作员边界，可能包含多个智能体。

- 支持的安全态势：每个 Gateway 网关一个用户/信任边界（建议每个边界一个 OS 用户/主机/VPS）。
- 不支持作为安全边界：一个共享 Gateway 网关/智能体被彼此不信任或对抗性的用户使用。
- 如果需要对抗性用户隔离，请按信任边界拆分（独立的 Gateway 网关 + 凭证，最好使用独立的 OS 用户/主机）。
- 如果多个不受信任的用户可以向同一个启用了工具的智能体发消息，请将他们视为共享该智能体的同一组委派工具权限。

本页说明如何在**该模型内**进行加固。它不声称在一个共享 Gateway 网关上提供恶意多租户隔离。

## 快速检查：`openclaw security audit`

另请参阅：[形式化验证（安全模型）](/zh-CN/security/formal-verification)

定期运行此命令（尤其是在更改配置或暴露网络表面之后）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 会刻意保持较窄范围：它会把常见的开放组
策略切换为允许列表，恢复 `logging.redactSensitive: "tools"`，收紧
状态/配置/包含文件权限，并且在 Windows 上运行时使用 Windows ACL 重置，而不是
POSIX `chmod`。

它会标记常见隐患（Gateway 网关认证暴露、浏览器控制暴露、提权允许列表、文件系统权限、宽松的 exec 审批，以及开放渠道工具暴露）。

OpenClaw 既是产品，也是实验：你正在把前沿模型行为接入真实消息表面和真实工具。**不存在“完全安全”的设置。** 目标是有意识地明确：

- 谁可以和你的 bot 对话
- bot 被允许在哪里执行操作
- bot 可以接触什么

从仍能工作的最小访问权限开始，然后随着信心增加再逐步放宽。

### 部署与主机信任

OpenClaw 假设主机和配置边界是受信任的：

- 如果某人可以修改 Gateway 网关主机状态/配置（`~/.openclaw`，包括 `openclaw.json`），请将其视为受信任的操作员。
- 为多个彼此不信任/对抗性的操作员运行一个 Gateway 网关**不是推荐设置**。
- 对于混合信任团队，请用独立 Gateway 网关拆分信任边界（或至少使用独立 OS 用户/主机）。
- 推荐默认值：每台机器/主机（或 VPS）一个用户，为该用户运行一个 Gateway 网关，并在该 Gateway 网关中运行一个或多个智能体。
- 在一个 Gateway 网关实例内，已认证的操作员访问是受信任的控制平面角色，而不是按用户划分的租户角色。
- 会话标识符（`sessionKey`、会话 ID、标签）是路由选择器，不是授权令牌。
- 如果多个人可以向同一个启用了工具的智能体发消息，他们每个人都可以引导同一组权限。按用户划分的会话/记忆隔离有助于隐私，但不会把共享智能体转换为按用户划分的主机授权。

### 共享 Slack 工作区：真实风险

如果“Slack 中的每个人都可以给 bot 发消息”，核心风险是委派工具权限：

- 任何获准发送者都可以在智能体策略范围内诱导工具调用（`exec`、浏览器、网络/文件工具）；
- 来自某个发送者的提示词/内容注入可能导致影响共享状态、设备或输出的操作；
- 如果一个共享智能体拥有敏感凭证/文件，任何获准发送者都有可能通过工具使用驱动数据外泄。

团队工作流请使用最小工具集的独立智能体/Gateway 网关；将包含个人数据的智能体保持私有。

### 公司共享智能体：可接受模式

当使用该智能体的所有人都在同一信任边界内（例如同一个公司团队），并且该智能体严格限定于业务范围时，这是可以接受的。

- 在专用机器/VM/容器上运行它；
- 为该运行时使用专用 OS 用户 + 专用浏览器/配置文件/账号；
- 不要让该运行时登录个人 Apple/Google 账号或个人密码管理器/浏览器配置文件。

如果你在同一运行时中混合个人身份和公司身份，就会破坏隔离，并增加个人数据暴露风险。

## Gateway 网关与节点信任概念

将 Gateway 网关和节点视为同一个操作员信任域，但角色不同：

- **Gateway 网关** 是控制平面和策略表面（`gateway.auth`、工具策略、路由）。
- **节点** 是配对到该 Gateway 网关的远程执行表面（命令、设备操作、主机本地能力）。
- 通过 Gateway 网关认证的调用方在 Gateway 网关范围内是受信任的。配对后，节点操作是该节点上的受信任操作员操作。
- 使用共享 Gateway 网关
  令牌/密码认证的直接 loopback 后端客户端，可以在不提供用户
  设备身份的情况下发起内部控制平面 RPC。这不是远程或浏览器配对绕过：网络
  客户端、节点客户端、设备令牌客户端和显式设备身份
  仍然会经过配对和范围升级强制检查。
- `sessionKey` 是路由/上下文选择，不是按用户划分的认证。
- Exec 审批（允许列表 + 询问）是操作员意图的防护栏，不是恶意多租户隔离。
- OpenClaw 针对受信任单操作员设置的产品默认值是，允许在 `gateway`/`node` 上执行主机 exec 且不提示审批（`security="full"`，`ask="off"`，除非你收紧它）。该默认值是有意的 UX，本身不是漏洞。
- Exec 审批绑定精确请求上下文和尽力而为的直接本地文件操作数；它们不会语义化建模每个运行时/解释器加载器路径。需要强边界时，请使用沙箱隔离和主机隔离。

如果你需要恶意用户隔离，请按 OS 用户/主机拆分信任边界，并运行独立 Gateway 网关。

## 信任边界矩阵

在分诊风险时，将其用作快速模型：

| 边界或控制                                                | 含义                                              | 常见误读                                                                      |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（令牌/密码/受信任代理/设备认证）           | 认证 Gateway 网关 API 调用方                      | “每帧都需要按消息签名才安全”                                                  |
| `sessionKey`                                              | 上下文/会话选择的路由键                           | “会话键是用户认证边界”                                                        |
| 提示词/内容防护栏                                         | 降低模型滥用风险                                  | “仅提示词注入就证明认证绕过”                                                  |
| `canvas.eval` / 浏览器 evaluate                           | 启用时的有意操作员能力                            | “任何 JS eval 原语在这个信任模型中都会自动成为漏洞”                           |
| 本地 TUI `!` shell                                        | 显式由操作员触发的本地执行                        | “本地 shell 便捷命令是远程注入”                                               |
| 节点配对和节点命令                                        | 已配对设备上的操作员级远程执行                    | “远程设备控制默认应被视为不受信任的用户访问”                                  |
| `gateway.nodes.pairing.autoApproveCidrs`                  | 选择加入的受信任网络节点注册策略                  | “默认禁用的允许列表就是自动配对漏洞”                                          |

## 按设计不属于漏洞

<Accordion title="常见但不在范围内的发现">

这些模式经常被报告，通常会在没有实际边界绕过证明时
以无需处理关闭：

- 仅提示词注入的链条，且不包含策略、认证或沙箱绕过。
- 假设在一个共享主机或
  配置上进行恶意多租户运行的主张。
- 将正常操作员读路径访问（例如
  `sessions.list` / `sessions.preview` / `chat.history`）在
  共享 Gateway 网关设置中归类为 IDOR 的主张。
- 仅 localhost 部署的发现（例如仅 local loopback
  Gateway 网关上的 HSTS）。
- 此仓库中不存在的入站路径上的 Discord 入站 webhook 签名发现。
- 将节点配对元数据视为 `system.run` 的隐藏第二层按命令
  审批层的报告，而真实执行边界仍然是
  Gateway 网关的全局节点命令策略加上节点自身的 exec
  审批。
- 将配置的 `gateway.nodes.pairing.autoApproveCidrs` 本身视为
  漏洞的报告。此设置默认禁用，需要
  显式 CIDR/IP 条目，只适用于首次 `role: node` 配对且
  没有请求范围，并且不会自动批准操作员/浏览器/Control UI、
  WebChat、角色升级、范围升级、元数据更改、公钥更改，
  或同主机 loopback 受信任代理标头路径，除非显式启用了 loopback 受信任代理认证。
- 将 `sessionKey` 视为
  认证令牌的“缺少按用户授权”发现。

</Accordion>

## 60 秒加固基线

先使用此基线，然后按受信任智能体选择性重新启用工具：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

这会让 Gateway 网关保持仅本地访问、隔离私信，并默认禁用控制平面/运行时工具。

## 共享收件箱快速规则

如果不止一个人可以私信你的 bot：

- 设置 `session.dmScope: "per-channel-peer"`（多账号渠道使用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或严格允许列表。
- 永远不要将共享私信与广泛工具访问结合。
- 这会加固协作式/共享收件箱，但在用户共享主机/配置写入权限时，并不设计为恶意共同租户隔离。

## 上下文可见性模型

OpenClaw 区分两个概念：

- **触发授权**：谁可以触发智能体（`dmPolicy`、`groupPolicy`、允许列表、提及门控）。
- **上下文可见性**：哪些补充上下文会被注入模型输入（回复正文、引用文本、线程历史、转发元数据）。

允许列表会门控触发和命令授权。`contextVisibility` 设置控制如何过滤补充上下文（引用回复、线程根、获取的历史）：

- `contextVisibility: "all"`（默认）会按收到的内容保留补充上下文。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为主动允许列表检查所允许的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一个显式引用回复。

按渠道或按房间/对话设置 `contextVisibility`。设置详情请参阅[群聊](/zh-CN/channels/groups#context-visibility-and-allowlists)。

安全公告分诊指南：

- 仅显示“模型可以看到来自非允许列表发送者的引用文本或历史文本”的声明，是可以通过 `contextVisibility` 处理的加固发现，本身不是认证或沙箱边界绕过。
- 要产生安全影响，报告仍需要演示信任边界绕过（认证、策略、沙箱、审批或其他已记录边界）。

## 审计检查什么（高层级）

- **入站访问**（私信策略、群组策略、允许列表）：陌生人能触发机器人吗？
- **工具影响范围**（提权工具 + 开放房间）：提示注入是否可能转化为 shell/文件/网络操作？
- **执行审批漂移**（`security=full`、`autoAllowSkills`、未启用 `strictInlineEval` 的解释器允许列表）：主机执行护栏是否仍按你预期工作？
  - `security="full"` 是一种宽泛的姿态警告，不是存在漏洞的证明。它是受信任个人助手设置所选择的默认值；只有当你的威胁模型需要审批或允许列表护栏时，才收紧它。
- **网络暴露**（Gateway 网关绑定/认证、Tailscale Serve/Funnel、弱/短认证令牌）。
- **浏览器控制暴露**（远程节点、中继端口、远程 CDP 端点）。
- **本地磁盘卫生**（权限、符号链接、配置包含、“同步文件夹”路径）。
- **插件**（插件在没有显式允许列表的情况下加载）。
- **策略漂移/错误配置**（配置了沙箱 Docker 设置但沙箱模式关闭；`gateway.nodes.denyCommands` 模式无效，因为匹配仅限精确命令名（例如 `system.run`）且不会检查 shell 文本；危险的 `gateway.nodes.allowCommands` 条目；全局 `tools.profile="minimal"` 被各智能体配置覆盖；插件自有工具在宽松工具策略下可访问）。
- **运行时期望漂移**（例如假设隐式执行仍表示 `sandbox`，但 `tools.exec.host` 现在默认是 `auto`；或在沙箱模式关闭时显式设置 `tools.exec.host="sandbox"`）。
- **模型卫生**（当配置的模型看起来较旧时发出警告；不是硬性阻断）。

如果运行 `--deep`，OpenClaw 还会尝试对 Gateway 网关进行尽力而为的实时探测。

## 凭据存储映射

审计访问或决定要备份什么时使用此映射：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**：配置/环境，或 `channels.telegram.tokenFile`（仅限普通文件；拒绝符号链接）
- **Discord 机器人令牌**：配置/环境，或 SecretRef（环境/文件/执行提供商）
- **Slack 令牌**：配置/环境（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账号）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账号）
- **模型认证配置**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **文件后端密钥负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`

## 安全审计检查清单

当审计打印发现时，按以下优先级处理：

1. **任何“开放”且启用工具的项**：先锁定私信/群组（配对/允许列表），再收紧工具策略/沙箱隔离。
2. **公网暴露**（LAN 绑定、Funnel、缺失认证）：立即修复。
3. **浏览器控制远程暴露**：像操作员访问一样对待（仅限 tailnet、谨慎配对节点、避免公开暴露）。
4. **权限**：确保状态/配置/凭据/认证不可被组或全局读取。
5. **插件**：只加载你明确信任的插件。
6. **模型选择**：任何带工具的机器人都应优先使用现代、指令加固的模型。

## 安全审计术语表

每个审计发现都由结构化 `checkId` 标识（例如
`gateway.bind_no_auth` 或 `tools.exec.security_full_configured`）。常见
严重级别类别：

- `fs.*` — 状态、配置、凭据、认证配置的文件系统权限。
- `gateway.*` — 绑定模式、认证、Tailscale、控制 UI、受信任代理设置。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` — 各表面的加固。
- `plugins.*`、`skills.*` — 插件/技能供应链和扫描发现。
- `security.exposure.*` — 访问策略与工具影响范围相交的横向检查。

请在
[安全审计检查](/zh-CN/gateway/security/audit-checks)
中查看完整目录，包括严重级别、修复键和自动修复支持。

## 通过 HTTP 使用控制 UI

控制 UI 需要一个**安全上下文**（HTTPS 或 localhost）来生成设备
身份。`gateway.controlUi.allowInsecureAuth` 是一个本地兼容性开关：

- 在 localhost 上，当页面通过非安全 HTTP 加载时，它允许控制 UI 在没有设备身份的情况下认证。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

优先使用 HTTPS（Tailscale Serve）或在 `127.0.0.1` 打开 UI。

仅在紧急处置场景中，`gateway.controlUi.dangerouslyDisableDeviceAuth`
会完全禁用设备身份检查。这是严重的安全降级；除非你正在主动调试并且可以快速恢复，否则保持关闭。

独立于这些危险标志，成功的 `gateway.auth.mode: "trusted-proxy"`
可以在没有设备身份的情况下允许**操作员**控制 UI 会话。这是有意的
认证模式行为，不是 `allowInsecureAuth` 捷径，并且它仍然
不会扩展到节点角色的控制 UI 会话。

启用此设置时，`openclaw security audit` 会发出警告。

## 不安全或危险标志摘要

当已知的不安全/危险调试开关启用时，`openclaw security audit` 会触发
`config.insecure_or_dangerous_flags`。在生产环境中保持这些开关未设置。

<AccordionGroup>
  <Accordion title="Flags tracked by the audit today">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="All `dangerous*` / `dangerously*` keys in the config schema">
    控制 UI 和浏览器：

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    渠道名称匹配（内置和插件渠道；在适用时也可按
    `accounts.<accountId>` 配置）：

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（插件渠道）
    - `channels.zalouser.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.irc.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.mattermost.dangerouslyAllowNameMatching`（插件渠道）

    网络暴露：

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（也可按账号配置）

    沙箱 Docker（默认值 + 按智能体）：

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 反向代理配置

如果你在反向代理（nginx、Caddy、Traefik 等）后运行 Gateway 网关，请配置
`gateway.trustedProxies`，以便正确处理转发的客户端 IP。

当 Gateway 网关检测到来自**不在** `trustedProxies` 中的地址的代理头时，它**不会**将连接视为本地客户端。如果禁用了 Gateway 网关认证，这些连接会被拒绝。这样可防止认证绕过，否则经代理的连接会看起来来自 localhost 并获得自动信任。

`gateway.trustedProxies` 也会供 `gateway.auth.mode: "trusted-proxy"` 使用，但该认证模式更严格：

- trusted-proxy 认证默认会**对 loopback 源代理失败关闭**
- 同主机 loopback 反向代理可以使用 `gateway.trustedProxies` 进行本地客户端检测和转发 IP 处理
- 同主机 loopback 反向代理只有在 `gateway.auth.trustedProxy.allowLoopback = true` 时才能满足 `gateway.auth.mode: "trusted-proxy"`；否则使用令牌/密码认证

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

配置 `trustedProxies` 后，Gateway 网关会使用 `X-Forwarded-For` 来确定客户端 IP。默认忽略 `X-Real-IP`，除非显式设置 `gateway.allowRealIpFallback: true`。

受信任代理头不会让节点设备配对自动受信任。
`gateway.nodes.pairing.autoApproveCidrs` 是一个单独的、默认禁用的
操作员策略。即使启用，loopback 源 trusted-proxy 头路径
也会被排除在节点自动审批之外，因为本地调用方可以伪造这些
头，包括在显式启用 loopback trusted-proxy 认证时也是如此。

良好的反向代理行为（覆盖传入的转发头）：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不良的反向代理行为（追加/保留不受信任的转发头）：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 和源说明

- OpenClaw gateway 优先面向本地/loopback。如果你在反向代理处终止 TLS，请在那里为面向代理的 HTTPS 域名设置 HSTS。
- 如果 gateway 自身终止 HTTPS，你可以设置 `gateway.http.securityHeaders.strictTransportSecurity`，让 OpenClaw 响应发出 HSTS 头。
- 详细部署指南见[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 对于非 loopback 控制 UI 部署，默认要求 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是显式允许所有浏览器源的策略，不是加固默认值。避免在严格受控的本地测试之外使用。
- 即使启用通用 loopback 豁免，loopback 上的浏览器源认证失败仍会受到速率限制，但锁定键会按
  规范化后的 `Origin` 值划分，而不是使用一个共享的 localhost 桶。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 启用 Host 头源回退模式；应将其视为由操作员选择的危险策略。
- 将 DNS 重新绑定和代理 Host 头行为视为部署加固事项；保持 `trustedProxies` 严格，并避免将 gateway 直接暴露到公网。

## 本地会话日志存储在磁盘上

OpenClaw 将会话转录存储在 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 下的磁盘上。
这是会话连续性和（可选）会话记忆索引所必需的，但这也意味着
**任何拥有文件系统访问权限的进程/用户都可以读取这些日志**。将磁盘访问视为信任
边界，并锁定 `~/.openclaw` 的权限（见下面的审计章节）。如果你需要
智能体之间更强的隔离，请在不同的 OS 用户或不同主机下运行它们。

## 节点执行（system.run）

如果已配对 macOS 节点，Gateway 网关可以在该节点上调用 `system.run`。这是 Mac 上的**远程代码执行**：

- 需要节点配对（批准 + 令牌）。
- Gateway 网关节点配对不是按命令批准的界面。它建立节点身份/信任并签发令牌。
- Gateway 网关通过 `gateway.nodes.allowCommands` / `denyCommands` 应用粗粒度的全局节点命令策略。
- 在 Mac 上通过 **Settings → Exec approvals**（安全 + 询问 + 允许列表）控制。
- 按节点的 `system.run` 策略是节点自己的执行批准文件（`exec.approvals.node.*`），它可以比 Gateway 网关的全局命令 ID 策略更严格或更宽松。
- 以 `security="full"` 和 `ask="off"` 运行的节点遵循默认的受信任操作员模型。除非你的部署明确要求更严格的批准或允许列表姿态，否则应将其视为预期行为。
- 批准模式绑定精确的请求上下文，并在可能时绑定一个具体的本地脚本/文件操作数。如果 OpenClaw 无法为解释器/运行时命令精确识别一个直接本地文件，那么会拒绝基于批准的执行，而不是承诺完整的语义覆盖。
- 对于 `host=node`，基于批准的运行还会存储一个规范化的已准备
  `systemRunPlan`；后续已批准的转发会复用该已存储计划，并且 Gateway 网关
  验证会拒绝调用方在批准请求创建后对命令/cwd/会话上下文的编辑。
- 如果你不想要远程执行，请将安全性设为 **deny**，并移除该 Mac 的节点配对。

此区别对分诊很重要：

- 重新连接的已配对节点通告不同的命令列表，如果 Gateway 网关全局策略和节点的本地执行批准仍然强制执行实际执行边界，这本身并不是漏洞。
- 将节点配对元数据视为第二个隐藏的按命令批准层的报告，通常是策略/用户体验混淆，而不是安全边界绕过。

## 动态 Skills（监视器 / 远程节点）

OpenClaw 可以在会话中途刷新 Skills 列表：

- **Skills 监视器**：对 `SKILL.md` 的更改可以在下一个智能体回合更新 Skills 快照。
- **远程节点**：连接 macOS 节点可以让仅限 macOS 的 Skills 符合条件（基于二进制探测）。

将 skill 文件夹视为**受信任代码**，并限制可修改它们的人员。

## 威胁模型

你的 AI 助手可以：

- 执行任意 shell 命令
- 读取/写入文件
- 访问网络服务
- 向任何人发送消息（如果你授予它 WhatsApp 访问权限）

给你发消息的人可以：

- 试图诱骗你的 AI 做坏事
- 通过社交工程获取你的数据访问权
- 探测基础设施细节

## 核心概念：智能之前先做访问控制

这里的大多数失败并不是复杂漏洞，而是“有人给机器人发了消息，机器人照做了”。

OpenClaw 的立场：

- **身份优先：** 决定谁可以与机器人交谈（私信配对 / 允许列表 / 显式“开放”）。
- **范围其次：** 决定机器人被允许在哪里行动（群组允许列表 + 提及门控、工具、沙箱隔离、设备权限）。
- **模型最后：** 假设模型可以被操纵；设计时让操纵的影响范围有限。

## 命令授权模型

斜杠命令和指令只会对**已授权发送者**生效。授权来自
渠道允许列表/配对以及 `commands.useAccessGroups`（参见 [配置](/zh-CN/gateway/configuration)
和 [斜杠命令](/zh-CN/tools/slash-commands)）。如果渠道允许列表为空或包含 `"*"`，
命令实际上对该渠道开放。

`/exec` 是面向已授权操作员的仅会话便利功能。它**不会**写入配置或
更改其他会话。

## 控制平面工具风险

两个内置工具可以进行持久性控制平面更改：

- `gateway` 可以用 `config.schema.lookup` / `config.get` 检查配置，并可以用 `config.apply`、`config.patch` 和 `update.run` 进行持久性更改。
- `cron` 可以创建计划任务，这些任务会在原始聊天/任务结束后继续运行。

仅所有者可用的 `gateway` 运行时工具仍会拒绝重写
`tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名会在写入前
规范化到相同的受保护执行路径。
智能体驱动的 `gateway config.apply` 和 `gateway config.patch` 编辑默认
失败关闭：只有一组很窄的提示词、模型和提及门控
路径可由智能体调节。因此，新的敏感配置树会受到保护，
除非它们被有意添加到允许列表。

对于任何处理不受信任内容的智能体/界面，默认拒绝这些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只会阻止重启动作。它不会禁用 `gateway` 配置/更新动作。

## 插件

插件与 Gateway 网关**在进程内**运行。将它们视为受信任代码：

- 只安装来自你信任来源的插件。
- 优先使用显式 `plugins.allow` 允许列表。
- 启用前审查插件配置。
- 插件更改后重启 Gateway 网关。
- 如果你安装或更新插件（`openclaw plugins install <package>`、`openclaw plugins update <id>`），请像运行不受信任代码一样对待：
  - 安装路径是活动插件安装根目录下的按插件目录。
  - OpenClaw 会在安装/更新前运行内置危险代码扫描。默认情况下，`critical` 发现会阻止操作。
  - OpenClaw 使用 `npm pack`，然后在该目录中运行项目本地的 `npm install --omit=dev --ignore-scripts`。继承的全局 npm 安装设置会被忽略，因此依赖项会保留在插件安装路径下。
  - 优先使用固定的精确版本（`@scope/pkg@1.2.3`），并在启用前检查磁盘上解包的代码。
  - `--dangerously-force-unsafe-install` 仅是插件安装/更新流程中针对内置扫描误报的破窗选项。它不会绕过插件 `before_install` 钩子策略阻止，也不会绕过扫描失败。
  - 由 Gateway 网关支持的 skill 依赖安装遵循相同的危险/可疑划分：内置 `critical` 发现会阻止，除非调用方显式设置 `dangerouslyForceUnsafeInstall`；可疑发现仍然只警告。`openclaw skills install` 仍然是独立的 ClawHub skill 下载/安装流程。

详情：[插件](/zh-CN/tools/plugin)

## 私信访问模型：配对、允许列表、开放、禁用

所有当前支持私信的渠道都支持私信策略（`dmPolicy` 或 `*.dm.policy`），该策略在消息被处理**之前**对入站私信进行门控：

- `pairing`（默认）：未知发送者会收到一个短配对码，机器人会忽略他们的消息，直到请求被批准。代码会在 1 小时后过期；重复私信不会重新发送代码，直到创建新的请求。默认情况下，待处理请求限制为**每个渠道 3 个**。
- `allowlist`：未知发送者会被阻止（没有配对握手）。
- `open`：允许任何人私信（公开）。**要求**渠道允许列表包含 `"*"`（显式选择加入）。
- `disabled`：完全忽略入站私信。

通过 CLI 批准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

详情 + 磁盘上的文件：[配对](/zh-CN/channels/pairing)

## 私信会话隔离（多用户模式）

默认情况下，OpenClaw 会将**所有私信路由到主会话**，这样你的助手可在设备和渠道之间保持连续性。如果**多人**可以私信机器人（开放私信或多人允许列表），请考虑隔离私信会话：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

这会防止跨用户上下文泄漏，同时保持群聊隔离。

这是消息上下文边界，不是主机管理员边界。如果用户彼此对立并共享同一个 Gateway 网关主机/配置，请改为按信任边界运行独立网关。

### 安全私信模式（推荐）

将上面的片段视为**安全私信模式**：

- 默认：`session.dmScope: "main"`（所有私信共享一个会话以保持连续性）。
- 本地 CLI 新手引导默认值：未设置时写入 `session.dmScope: "per-channel-peer"`（保留现有显式值）。
- 安全私信模式：`session.dmScope: "per-channel-peer"`（每个渠道+发送者组合获得一个隔离的私信上下文）。
- 跨渠道对等方隔离：`session.dmScope: "per-peer"`（每个发送者在同类型的所有渠道中获得一个会话）。

如果你在同一渠道上运行多个账户，请改用 `per-account-channel-peer`。如果同一个人在多个渠道上联系你，请使用 `session.identityLinks` 将这些私信会话折叠为一个规范身份。参见 [会话管理](/zh-CN/concepts/session) 和 [配置](/zh-CN/gateway/configuration)。

## 私信和群组的允许列表

OpenClaw 有两个独立的“谁可以触发我？”层：

- **私信允许列表**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；旧版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：谁被允许在直接消息中与机器人交谈。
  - 当 `dmPolicy="pairing"` 时，批准会写入 `~/.openclaw/credentials/` 下按账户限定的配对允许列表存储（默认账户为 `<channel>-allowFrom.json`，非默认账户为 `<channel>-<accountId>-allowFrom.json`），并与配置允许列表合并。
- **群组允许列表**（特定于渠道）：机器人会完全接受哪些群组/渠道/服务器的消息。
  - 常见模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：按群组默认值，例如 `requireMention`；设置后，它也会充当群组允许列表（包含 `"*"` 以保持允许所有的行为）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制谁可以在群组会话_内_触发机器人（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：按界面的允许列表 + 提及默认值。
  - 群组检查按以下顺序运行：先是 `groupPolicy`/群组允许列表，再是提及/回复激活。
  - 回复机器人消息（隐式提及）**不会**绕过 `groupAllowFrom` 等发送者允许列表。
  - **安全注意事项：** 将 `dmPolicy="open"` 和 `groupPolicy="open"` 视为最后手段设置。它们应极少使用；除非你完全信任房间中的每个成员，否则优先使用配对 + 允许列表。

详情：[配置](/zh-CN/gateway/configuration) 和 [群组](/zh-CN/channels/groups)

## 提示注入（是什么，为什么重要）

提示注入是指攻击者精心编写消息，操纵模型执行不安全操作（“忽略你的指令”、“转储你的文件系统”、“打开此链接并运行命令”等）。

即使有强系统提示词，**提示注入也没有被解决**。系统提示词护栏只是软性指导；强制执行来自工具策略、执行批准、沙箱隔离和渠道允许列表（而且操作员可以按设计禁用这些）。实践中有帮助的是：

- 保持入站私信严格受限（配对/允许列表）。
- 在群组中优先使用提及门控；避免在公开房间使用“始终在线”的机器人。
- 默认将链接、附件和粘贴的指令视为敌意内容。
- 在沙箱中运行敏感工具执行；不要让机密出现在智能体可访问的文件系统中。
- 注意：沙箱隔离是可选开启的。如果沙箱模式关闭，隐式的 `host=auto` 会解析为 Gateway 网关主机。显式的 `host=sandbox` 仍会失败关闭，因为没有可用的沙箱运行时。如果你希望在配置中明确这种行为，请设置 `host=gateway`。
- 将高风险工具（`exec`、`browser`、`web_fetch`、`web_search`）限制为可信智能体或显式允许列表。
- 如果你将解释器（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）加入允许列表，请启用 `tools.exec.strictInlineEval`，这样内联 eval 形式仍需要显式批准。
- Shell 审批分析还会拒绝 **未加引号的 heredoc** 中的 POSIX 参数展开形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`），因此加入允许列表的 heredoc 正文无法把 Shell 展开伪装成普通文本绕过允许列表审查。为 heredoc 终止符加引号（例如 `<<'EOF'`）即可选择字面正文语义；会展开变量的未加引号 heredoc 会被拒绝。
- **模型选择很重要：** 较旧、较小、旧版模型在抵御提示注入和工具滥用方面明显不够稳健。对于启用工具的智能体，请使用可用的最强最新一代、经过指令强化的模型。

应视为不可信的危险信号：

- “读取这个文件/URL，并严格按其中内容执行。”
- “忽略你的系统提示或安全规则。”
- “透露你的隐藏指令或工具输出。”
- “粘贴 `~/.openclaw` 或你的日志的完整内容。”

## 外部内容特殊令牌清理

OpenClaw 会在常见自托管 LLM 聊天模板特殊令牌字面量到达模型之前，将它们从包裹的外部内容和元数据中剥离。覆盖的标记族包括 Qwen/ChatML、Llama、Gemma、Mistral、Phi 和 GPT-OSS 角色/轮次令牌。

原因：

- 面向自托管模型的 OpenAI 兼容后端有时会保留用户文本中出现的特殊令牌，而不是屏蔽它们。否则，能够写入入站外部内容（抓取的页面、邮件正文、文件内容工具输出）的攻击者可能注入合成的 `assistant` 或 `system` 角色边界，并逃逸包裹内容的护栏。
- 清理发生在外部内容包裹层，因此它会统一应用于抓取/读取工具和入站渠道内容，而不是按提供商分别处理。
- 出站模型响应已有单独的清理器，会从用户可见回复中剥离泄漏的 `<tool_call>`、`<function_calls>` 和类似脚手架。外部内容清理器是入站方向的对应机制。

这不会取代本页的其他加固措施：`dmPolicy`、允许列表、exec 审批、沙箱隔离和 `contextVisibility` 仍然承担主要工作。它关闭的是一个特定的 tokenizer 层绕过路径，该路径针对会原样转发带特殊令牌用户文本的自托管栈。

## 不安全外部内容绕过标志

OpenClaw 包含会禁用外部内容安全包裹的显式绕过标志：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 载荷字段 `allowUnsafeExternalContent`

指南：

- 在生产环境中保持这些项未设置/为 false。
- 仅在范围严格限定的调试中临时启用。
- 如果启用，请隔离该智能体（沙箱 + 最少工具 + 专用会话命名空间）。

钩子风险说明：

- 钩子载荷是不可信内容，即使交付来自你控制的系统（邮件/文档/Web 内容也可能携带提示注入）。
- 较弱的模型层级会增加此风险。对于钩子驱动的自动化，优先使用强大的现代模型层级，并保持工具策略严格（`tools.profile: "messaging"` 或更严格），同时尽可能使用沙箱隔离。

### 提示注入不需要公开私信

即使 **只有你** 能给机器人发消息，提示注入仍可能通过机器人读取的任何 **不可信内容** 发生（Web 搜索/抓取结果、浏览器页面、邮件、文档、附件、粘贴的日志/代码）。换句话说：发送者不是唯一的威胁面；**内容本身** 也可能携带对抗性指令。

启用工具时，典型风险是泄露上下文或触发工具调用。通过以下方式降低影响范围：

- 使用只读或禁用工具的 **reader agent** 来总结不可信内容，然后将摘要传给你的主智能体。
- 除非需要，否则不要为启用工具的智能体开启 `web_search` / `web_fetch` / `browser`。
- 对于 OpenResponses URL 输入（`input_file` / `input_image`），设置严格的 `gateway.http.endpoints.responses.files.urlAllowlist` 和 `gateway.http.endpoints.responses.images.urlAllowlist`，并保持 `maxUrlParts` 较低。空允许列表会被视为未设置；如果你想完全禁用 URL 抓取，请使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 对于 OpenResponses 文件输入，解码后的 `input_file` 文本仍会作为 **不可信外部内容** 注入。不要因为文件文本由 Gateway 网关在本地解码，就认为它可信。注入块仍携带显式的 `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 边界标记以及 `Source: External` 元数据，尽管此路径会省略较长的 `SECURITY NOTICE:` 横幅。
- 当媒体理解在把文本附加到媒体提示之前从附件文档中提取文本时，也会应用相同的基于标记的包裹。
- 为任何接触不可信输入的智能体启用沙箱隔离和严格的工具允许列表。
- 不要把机密放入提示；改为通过 Gateway 网关主机上的环境变量/配置传递。

### 自托管 LLM 后端

OpenAI 兼容的自托管后端（如 vLLM、SGLang、TGI、LM Studio）或自定义 Hugging Face tokenizer 栈，在处理聊天模板特殊令牌的方式上可能不同于托管提供商。如果后端会将 `<|im_start|>`、`<|start_header_id|>` 或 `<start_of_turn>` 等字面字符串在用户内容中 tokenizer 为结构性聊天模板令牌，不可信文本就可能尝试在 tokenizer 层伪造角色边界。

OpenClaw 会在分发给模型之前，从包裹的外部内容中剥离常见模型族特殊令牌字面量。请保持外部内容包裹启用，并在可用时优先使用会拆分或转义用户提供内容中特殊令牌的后端设置。OpenAI 和 Anthropic 等托管提供商已经应用了自己的请求侧清理。

### 模型强度（安全说明）

提示注入抵抗能力在不同模型层级之间 **并不** 一致。较小/较便宜的模型通常更容易受到工具滥用和指令劫持的影响，尤其是在对抗性提示下。

<Warning>
对于启用工具的智能体或读取不可信内容的智能体，较旧/较小模型的提示注入风险通常过高。不要在较弱模型层级上运行这些工作负载。
</Warning>

建议：

- 对任何可以运行工具或接触文件/网络的机器人，**使用最新一代、最佳层级模型**。
- 对启用工具的智能体或不可信收件箱，**不要使用较旧/较弱/较小的层级**；提示注入风险太高。
- 如果必须使用较小模型，请 **缩小影响范围**（只读工具、强沙箱隔离、最小文件系统访问、严格允许列表）。
- 运行小模型时，**为所有会话启用沙箱隔离**，并 **禁用 web_search/web_fetch/browser**，除非输入受到严格控制。
- 对于输入可信且没有工具的纯聊天个人助手，较小模型通常没问题。

## 群组中的推理和详细输出

`/reasoning`、`/verbose` 和 `/trace` 可能暴露内部推理、工具输出或插件诊断信息，而这些内容并不适合公开渠道。在群组设置中，将它们视为 **仅供调试**，除非明确需要，否则保持关闭。

指南：

- 在公开房间中保持 `/reasoning`、`/verbose` 和 `/trace` 禁用。
- 如果启用它们，请仅在可信私信或严格受控的房间中启用。
- 请记住：详细和跟踪输出可能包含工具参数、URL、插件诊断信息，以及模型看到的数据。

## 配置加固示例

### 文件权限

在 Gateway 网关主机上保持配置和状态私有：

- `~/.openclaw/openclaw.json`: `600`（仅用户可读/写）
- `~/.openclaw`: `700`（仅用户）

`openclaw doctor` 可以发出警告并主动收紧这些权限。

### 网络暴露（绑定、端口、防火墙）

Gateway 网关在单个端口上复用 **WebSocket + HTTP**：

- 默认值：`18789`
- 配置/标志/环境变量：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

此 HTTP 表面包括控制 UI 和画布主机：

- 控制 UI（SPA 资产）（默认基础路径 `/`）
- 画布主机：`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（任意 HTML/JS；视为不可信内容）

如果你在普通浏览器中加载画布内容，请像处理其他不可信网页一样处理它：

- 不要把画布主机暴露给不可信网络/用户。
- 除非你完全理解影响，否则不要让画布内容与特权 Web 表面共享同源。

绑定模式控制 Gateway 网关监听的位置：

- `gateway.bind: "loopback"`（默认）：只有本地客户端可以连接。
- 非 loopback 绑定（`"lan"`、`"tailnet"`、`"custom"`）会扩大攻击面。仅在具备 Gateway 网关认证（共享令牌/密码或正确配置的可信代理）和真实防火墙时使用它们。

经验规则：

- 优先使用 Tailscale Serve，而不是 LAN 绑定（Serve 会让 Gateway 网关保持在 loopback 上，并由 Tailscale 处理访问）。
- 如果必须绑定到 LAN，请用防火墙将端口限制为严格的源 IP 允许列表；不要广泛做端口转发。
- 绝不要在 `0.0.0.0` 上暴露未经认证的 Gateway 网关。

### 使用 UFW 发布 Docker 端口

如果你在 VPS 上用 Docker 运行 OpenClaw，请记住，已发布的容器端口（`-p HOST:CONTAINER` 或 Compose `ports:`）会通过 Docker 的转发链路由，而不仅仅是主机 `INPUT` 规则。

为了让 Docker 流量与你的防火墙策略保持一致，请在 `DOCKER-USER` 中强制执行规则（此链会在 Docker 自身的 accept 规则之前被评估）。在许多现代发行版上，`iptables`/`ip6tables` 使用 `iptables-nft` 前端，并且仍会将这些规则应用到 nftables 后端。

最小允许列表示例（IPv4）：

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 有单独的表。如果启用了 Docker IPv6，请在 `/etc/ufw/after6.rules` 中添加匹配策略。

避免在文档片段中硬编码 `eth0` 这类接口名称。接口名称会因 VPS 镜像而异（`ens3`、`enp*` 等），不匹配可能导致意外跳过你的拒绝规则。

重新加载后的快速验证：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

预期的外部端口应该只包含你有意暴露的内容（对于大多数设置：SSH + 你的反向代理端口）。

### mDNS/Bonjour 设备发现

Gateway 网关通过 mDNS（端口 5353 上的 `_openclaw-gw._tcp`）广播其存在，用于本地设备发现。在完整模式下，这包括可能暴露运行细节的 TXT 记录：

- `cliPath`：CLI 二进制文件的完整文件系统路径（会暴露用户名和安装位置）
- `sshPort`：公布主机上的 SSH 可用性
- `displayName`、`lanHost`：主机名信息

**操作安全考量：** 广播基础设施细节会让本地网络上的任何人更容易进行侦察。即使是文件系统路径和 SSH 可用性这类“无害”信息，也会帮助攻击者绘制你的环境图谱。

**建议：**

1. **最小模式**（默认，推荐用于暴露的 Gateway 网关）：从 mDNS 广播中省略敏感字段：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. 如果你不需要本地设备发现，**完全禁用**：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **完整模式**（选择启用）：在 TXT 记录中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **环境变量**（替代方式）：设置 `OPENCLAW_DISABLE_BONJOUR=1`，无需修改配置即可禁用 mDNS。

在最小模式下，Gateway 网关仍会广播足够用于设备发现的信息（`role`、`gatewayPort`、`transport`），但会省略 `cliPath` 和 `sshPort`。需要 CLI 路径信息的应用可以改为通过已认证的 WebSocket 连接获取它。

### 锁定 Gateway 网关 WebSocket（本地认证）

默认情况下 **需要** Gateway 网关认证。如果未配置有效的 Gateway 网关认证路径，
Gateway 网关会拒绝 WebSocket 连接（失败关闭）。

新手引导默认会生成一个令牌（即使是 local loopback），因此
本地客户端必须认证。

设置一个令牌，使 **所有** WS 客户端都必须认证：

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor 可以为你生成一个：`openclaw doctor --generate-gateway-token`。

<Note>
`gateway.remote.token` 和 `gateway.remote.password` 是客户端凭证来源。它们本身并**不会**保护本地 WS 访问。本地调用路径只有在 `gateway.auth.*` 未设置时，才能使用 `gateway.remote.*` 作为回退。如果 `gateway.auth.token` 或 `gateway.auth.password` 通过 SecretRef 显式配置但无法解析，则解析会失败关闭（不会用远程回退来掩盖）。
</Note>
可选：使用 `wss://` 时，通过 `gateway.remote.tlsFingerprint` 固定远程 TLS。
默认情况下，明文 `ws://` 仅限 local loopback。对于可信的专用网络
路径，请在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为
应急例外。这是有意设计为仅限进程环境，而不是
`openclaw.json` 配置键。
移动端配对以及 Android 手动或扫码的 Gateway 网关路由更严格：
local loopback 接受明文，但专用 LAN、链路本地、`.local` 和
无点主机名必须使用 TLS，除非你明确选择启用可信
专用网络明文路径。

本地设备配对：

- 对于直接 local loopback 连接，设备配对会自动批准，以保持
  同主机客户端顺畅。
- OpenClaw 还有一个狭窄的后端/容器本地自连接路径，用于
  可信共享密钥辅助流程。
- Tailnet 和 LAN 连接（包括同主机 tailnet 绑定）会被视为
  远程配对，仍需要批准。
- loopback 请求上的转发头证据会取消 loopback
  本地性资格。元数据升级自动批准的范围很窄。两条规则请参阅
  [Gateway 网关配对](/zh-CN/gateway/pairing)。

认证模式：

- `gateway.auth.mode: "token"`：共享 Bearer 令牌（推荐用于大多数设置）。
- `gateway.auth.mode: "password"`：密码认证（建议通过环境变量设置：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任感知身份的反向代理来认证用户，并通过请求头传递身份（参见[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)）。

轮换清单（令牌/密码）：

1. 生成/设置一个新密钥（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重启 Gateway 网关（如果 macOS 应用负责监管 Gateway 网关，则重启 macOS 应用）。
3. 更新所有远程客户端（调用 Gateway 网关的机器上的 `gateway.remote.token` / `.password`）。
4. 验证你无法再使用旧凭证连接。

### Tailscale Serve 身份请求头

当 `gateway.auth.allowTailscale` 为 `true`（Serve 的默认值）时，OpenClaw
会接受 Tailscale Serve 身份请求头（`tailscale-user-login`）用于 Control
UI/WebSocket 认证。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）
解析 `x-forwarded-for` 地址，并将其与请求头匹配，以验证身份。只有命中 loopback
并包含由 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
的请求才会触发此逻辑。
对于这个异步身份检查路径，来自同一 `{scope, ip}` 的失败尝试会在限流器记录失败之前串行化。因此，一个 Serve 客户端的并发错误重试可能会立即锁定第二次尝试，而不是像两个普通不匹配一样竞态通过。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不**使用 Tailscale 身份请求头认证。它们仍遵循 Gateway 网关配置的
HTTP 认证模式。

重要边界说明：

- Gateway 网关 HTTP Bearer 认证实际上是全有或全无的操作员访问权限。
- 将能够调用 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的凭证视为该 Gateway 网关的完全访问操作员密钥。
- 在 OpenAI 兼容 HTTP 表面上，共享密钥 Bearer 认证会恢复完整的默认操作员作用域（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及 agent turn 的所有者语义；更窄的 `x-openclaw-scopes` 值不会缩减该共享密钥路径。
- HTTP 上的逐请求作用域语义仅在请求来自带身份的模式时适用，例如可信代理认证，或专用入口上的 `gateway.auth.mode="none"`。
- 在这些带身份的模式中，省略 `x-openclaw-scopes` 会回退到普通操作员默认作用域集合；当你想要更窄的作用域集合时，请显式发送该请求头。
- `/tools/invoke` 遵循相同的共享密钥规则：令牌/密码 Bearer 认证在那里也被视为完整操作员访问权限，而带身份的模式仍会遵守声明的作用域。
- 不要与不可信调用方共享这些凭证；建议按信任边界使用单独的 Gateway 网关。

**信任假设：** 无令牌 Serve 认证假设 Gateway 网关主机是可信的。
不要把它视为对恶意同主机进程的防护。如果不可信
本地代码可能在 Gateway 网关主机上运行，请禁用 `gateway.auth.allowTailscale`，
并要求使用 `gateway.auth.mode: "token"` 或
`"password"` 进行显式共享密钥认证。

**安全规则：** 不要从你自己的反向代理转发这些请求头。如果
你在 Gateway 网关前终止 TLS 或做代理，请禁用
`gateway.auth.allowTailscale`，并改用共享密钥认证（`gateway.auth.mode:
"token"` 或 `"password"`）或[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

可信代理：

- 如果你在 Gateway 网关前终止 TLS，请将 `gateway.trustedProxies` 设置为你的代理 IP。
- OpenClaw 会信任来自这些 IP 的 `x-forwarded-for`（或 `x-real-ip`），用于确定客户端 IP，以执行本地配对检查和 HTTP 认证/本地检查。
- 确保你的代理会**覆盖** `x-forwarded-for`，并阻止直接访问 Gateway 网关端口。

参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

### 通过节点主机控制浏览器（推荐）

如果你的 Gateway 网关在远程，但浏览器运行在另一台机器上，请在浏览器机器上运行一个**节点主机**，
并让 Gateway 网关代理浏览器操作（参见[浏览器工具](/zh-CN/tools/browser)）。
将节点配对视为管理员访问权限。

推荐模式：

- 将 Gateway 网关和节点主机保持在同一个 tailnet（Tailscale）中。
- 有意配对该节点；如果你不需要浏览器代理路由，请禁用它。

避免：

- 在 LAN 或公共互联网中暴露中继/控制端口。
- 对浏览器控制端点使用 Tailscale Funnel（公开暴露）。

### 磁盘上的密钥

假设 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）下的任何内容都可能包含密钥或私有数据：

- `openclaw.json`：配置可能包含令牌（Gateway 网关、远程 Gateway 网关）、提供商设置和允许列表。
- `credentials/**`：渠道凭证（示例：WhatsApp 凭证）、配对允许列表、旧版 OAuth 导入。
- `agents/<agentId>/agent/auth-profiles.json`：API 密钥、令牌配置文件、OAuth 令牌，以及可选的 `keyRef`/`tokenRef`。
- `secrets.json`（可选）：由 `file` SecretRef 提供商（`secrets.providers`）使用的文件后端密钥载荷。
- `agents/<agentId>/agent/auth.json`：旧版兼容文件。发现静态 `api_key` 条目时会清理它们。
- `agents/<agentId>/sessions/**`：会话转录（`*.jsonl`）+ 路由元数据（`sessions.json`），可能包含私密消息和工具输出。
- 内置插件包：已安装的插件（以及它们的 `node_modules/`）。
- `sandboxes/**`：工具沙箱工作区；可能积累你在沙箱中读写文件的副本。

加固提示：

- 保持严格权限（目录 `700`，文件 `600`）。
- 在 Gateway 网关主机上使用全盘加密。
- 如果主机是共享的，建议为 Gateway 网关使用专用 OS 用户账户。

### 工作区 `.env` 文件

OpenClaw 会为 agents 和工具加载工作区本地 `.env` 文件，但绝不会让这些文件静默覆盖 Gateway 网关运行时控制项。

- 任何以 `OPENCLAW_*` 开头的键都会被阻止从不可信工作区 `.env` 文件加载。
- Matrix、Mattermost、IRC 和 Synology Chat 的渠道端点设置也会被阻止从工作区 `.env` 覆盖，因此克隆的工作区无法通过本地端点配置重定向内置连接器流量。端点环境变量键（例如 `MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL`）必须来自 Gateway 网关进程环境或 `env.shellEnv`，而不能来自工作区加载的 `.env`。
- 该阻止机制是失败关闭的：未来版本新增的运行时控制变量不能从已检入或攻击者提供的 `.env` 继承；该键会被忽略，Gateway 网关会保留自己的值。
- 可信的进程/OS 环境变量（Gateway 网关自己的 shell、launchd/systemd 单元、应用包）仍然生效——这只限制 `.env` 文件加载。

原因：工作区 `.env` 文件经常与 agent 代码相邻，可能被意外提交，或被工具写入。阻止整个 `OPENCLAW_*` 前缀意味着以后添加新的 `OPENCLAW_*` 标志时，永远不会回归为从工作区状态静默继承。

### 日志和转录（脱敏和保留）

即使访问控制正确，日志和转录也可能泄露敏感信息：

- Gateway 网关日志可能包含工具摘要、错误和 URL。
- 会话转录可能包含粘贴的密钥、文件内容、命令输出和链接。

建议：

- 保持日志和转录脱敏开启（`logging.redactSensitive: "tools"`；默认）。
- 通过 `logging.redactPatterns` 添加适合你环境的自定义模式（令牌、主机名、内部 URL）。
- 共享诊断信息时，建议使用 `openclaw status --all`（可粘贴，密钥已脱敏），而不是原始日志。
- 如果不需要长期保留，请修剪旧会话转录和日志文件。

详情：[日志记录](/zh-CN/gateway/logging)

### 私信：默认配对

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 群组：所有位置都要求提及

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

在群聊中，只有在被明确提及时才响应。

### 单独号码（WhatsApp、Signal、Telegram）

对于基于电话号码的渠道，请考虑将你的 AI 运行在一个与你个人号码分开的电话号码上：

- 个人号码：你的对话保持私密
- Bot 号码：AI 处理这些对话，并带有适当边界

### 只读模式（通过沙箱和工具）

你可以通过组合以下内容构建只读配置文件：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或使用 `"none"` 表示无工作区访问权限）
- 阻止 `write`、`edit`、`apply_patch`、`exec`、`process` 等的工具允许/拒绝列表。

其他加固选项：

- `tools.exec.applyPatch.workspaceOnly: true`（默认）：确保即使沙箱隔离关闭，`apply_patch` 也无法在工作区目录之外写入/删除。只有在你确实希望 `apply_patch` 触及工作区之外的文件时，才设为 `false`。
- `tools.fs.workspaceOnly: true`（可选）：将 `read`/`write`/`edit`/`apply_patch` 路径以及原生提示词图片自动加载路径限制在工作区目录内（如果你目前允许绝对路径，并希望有一道统一防护栏，这会很有用）。
- 保持文件系统根目录范围狭窄：避免将你的主目录这类宽泛根目录用于智能体工作区/沙箱工作区。宽泛根目录可能会把敏感本地文件（例如 `~/.openclaw` 下的状态/配置）暴露给文件系统工具。

### 安全基线（复制/粘贴）

一个“安全默认值”配置：保持 Gateway 网关私有、要求私信配对，并避免始终在线的群机器人：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

如果你也想让工具执行“默认更安全”，请为任何非所有者智能体添加沙箱并拒绝危险工具（示例见下方“按智能体访问配置文件”）。

聊天驱动的智能体回合内置基线：非所有者发送者不能使用 `cron` 或 `gateway` 工具。

## 沙箱隔离（推荐）

专用文档：[沙箱隔离](/zh-CN/gateway/sandboxing)

两种互补方法：

- **在 Docker 中运行完整 Gateway 网关**（容器边界）：[Docker](/zh-CN/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，主机 Gateway 网关 + 沙箱隔离工具；Docker 是默认后端）：[沙箱隔离](/zh-CN/gateway/sandboxing)

<Note>
为防止跨智能体访问，请将 `agents.defaults.sandbox.scope` 保持为 `"agent"`（默认），或使用 `"session"` 获得更严格的按会话隔离。`scope: "shared"` 使用单个容器或工作区。
</Note>

还应考虑沙箱内的智能体工作区访问：

- `agents.defaults.sandbox.workspaceAccess: "none"`（默认）使智能体工作区不可访问；工具会针对 `~/.openclaw/sandboxes` 下的沙箱工作区运行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 将智能体工作区以只读方式挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 将智能体工作区以读写方式挂载到 `/workspace`
- 额外的 `sandbox.docker.binds` 会根据规范化和规范路径后的源路径进行验证。父级符号链接技巧和规范主目录别名如果解析到被阻止的根目录（例如 `/etc`、`/var/run` 或 OS 主目录下的凭证目录），仍会安全失败。

<Warning>
`tools.elevated` 是全局基线逃生口，会在沙箱之外运行 exec。有效主机默认为 `gateway`，当 exec 目标配置为 `node` 时则为 `node`。请严格限制 `tools.elevated.allowFrom`，不要为陌生人启用它。你还可以通过 `agents.list[].tools.elevated` 按智能体进一步限制提权。参见[提权模式](/zh-CN/tools/elevated)。
</Warning>

### 子智能体委派防护栏

如果你允许会话工具，请将委派的子智能体运行视为另一项边界决策：

- 拒绝 `sessions_spawn`，除非智能体确实需要委派。
- 将 `agents.defaults.subagents.allowAgents` 以及任何按智能体的 `agents.list[].subagents.allowAgents` 覆盖项限制为已知安全的目标智能体。
- 对于任何必须保持沙箱隔离的工作流，调用 `sessions_spawn` 时使用 `sandbox: "require"`（默认值为 `inherit`）。
- 当目标子运行时未沙箱隔离时，`sandbox: "require"` 会快速失败。

## 浏览器控制风险

启用浏览器控制会让模型能够驱动真实浏览器。
如果该浏览器配置文件已经包含已登录会话，模型就可以
访问这些账户和数据。请将浏览器配置文件视为**敏感状态**：

- 优先为智能体使用专用配置文件（默认 `openclaw` 配置文件）。
- 避免将智能体指向你个人日常使用的配置文件。
- 除非你信任它们，否则为沙箱隔离智能体保持主机浏览器控制关闭。
- 独立的 loopback 浏览器控制 API 只接受共享密钥认证
  （Gateway 网关令牌 bearer 认证或 Gateway 网关密码）。它不会使用
  trusted-proxy 或 Tailscale Serve 身份标头。
- 将浏览器下载视为不受信任输入；优先使用隔离的下载目录。
- 如有可能，在智能体配置文件中禁用浏览器同步/密码管理器（降低影响范围）。
- 对于远程网关，假设“浏览器控制”等同于对该配置文件可访问内容的“操作者访问权限”。
- 让 Gateway 网关和 node 主机仅限 tailnet；避免将浏览器控制端口暴露到 LAN 或公共互联网。
- 不需要浏览器代理路由时将其禁用（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 现有会话模式**并不**“更安全”；它可以以你的身份访问该主机 Chrome 配置文件可访问的任何内容。

### 浏览器 SSRF 策略（默认严格）

OpenClaw 的浏览器导航策略默认严格：除非你显式选择启用，否则私有/内部目标会保持阻止。

- 默认：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置，因此浏览器导航会继续阻止私有/内部/特殊用途目标。
- 旧版别名：`browser.ssrfPolicy.allowPrivateNetwork` 仍为兼容性而接受。
- 选择启用模式：设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 以允许私有/内部/特殊用途目标。
- 在严格模式下，使用 `hostnameAllowlist`（例如 `*.example.com` 的模式）和 `allowedHostnames`（精确主机例外，包括 `localhost` 这类被阻止的名称）来声明显式例外。
- 导航会在请求前检查，并在导航后的最终 `http(s)` URL 上尽力重新检查，以降低基于重定向的跳转风险。

严格策略示例：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## 按智能体访问配置文件（多智能体）

使用多智能体路由时，每个智能体都可以有自己的沙箱 + 工具策略：
用它为每个智能体提供**完全访问**、**只读**或**无访问**。
参见[多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)了解详情
和优先级规则。

常见用例：

- 个人智能体：完全访问，无沙箱
- 家庭/工作智能体：沙箱隔离 + 只读工具
- 公共智能体：沙箱隔离 + 无文件系统/shell 工具

### 示例：完全访问（无沙箱）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 示例：只读工具 + 只读工作区

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 示例：无文件系统/shell 访问（允许提供商消息传递）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## 事件响应

如果你的 AI 做了不该做的事：

### 遏制

1. **停止它：** 停止 macOS 应用（如果它监管 Gateway 网关），或终止你的 `openclaw gateway` 进程。
2. **关闭暴露面：** 设置 `gateway.bind: "loopback"`（或禁用 Tailscale Funnel/Serve），直到你了解发生了什么。
3. **冻结访问：** 将有风险的私信/群组切换为 `dmPolicy: "disabled"` / 要求提及，并移除你曾设置的 `"*"` 允许所有条目。

### 轮换（如果秘密泄漏，则假设已被入侵）

1. 轮换 Gateway 网关认证（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）并重启。
2. 在任何能够调用 Gateway 网关的机器上轮换远程客户端秘密（`gateway.remote.token` / `.password`）。
3. 轮换提供商/API 凭证（WhatsApp 凭证、Slack/Discord 令牌、`auth-profiles.json` 中的模型/API 密钥，以及使用时的加密秘密载荷值）。

### 审计

1. 检查 Gateway 网关日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 查看相关转录记录：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 查看近期配置变更（任何可能扩大访问范围的内容：`gateway.bind`、`gateway.auth`、私信/群组策略、`tools.elevated`、插件变更）。
4. 重新运行 `openclaw security audit --deep` 并确认关键发现已解决。

### 收集报告材料

- 时间戳、网关主机 OS + OpenClaw 版本
- 会话转录记录 + 一小段日志尾部（已脱敏）
- 攻击者发送的内容 + 智能体执行的操作
- Gateway 网关是否暴露到 loopback 之外（LAN/Tailscale Funnel/Serve）

## 使用 detect-secrets 进行秘密扫描

CI 会在 `secrets` 作业中运行 `detect-secrets` pre-commit 钩子。
推送到 `main` 时总是运行全文件扫描。Pull request 在有基准提交可用时使用变更文件
快速路径，否则回退到全文件扫描。如果它失败，说明存在尚未进入基线的新候选项。

### 如果 CI 失败

1. 在本地复现：

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 了解这些工具：
   - pre-commit 中的 `detect-secrets` 会使用仓库的
     基线和排除项运行 `detect-secrets-hook`。
   - `detect-secrets audit` 会打开交互式审查，用于将每个基线
     条目标记为真实秘密或误报。
3. 对于真实秘密：轮换/移除它们，然后重新运行扫描以更新基线。
4. 对于误报：运行交互式审计并将它们标记为 false：

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 如果你需要新的排除项，请将它们添加到 `.detect-secrets.cfg`，并使用匹配的 `--exclude-files` / `--exclude-lines` 标志重新生成
   基线（该配置文件仅供参考；detect-secrets 不会自动读取它）。

当更新后的 `.secrets.baseline` 反映了预期状态后，将其提交。

## 报告安全问题

在 OpenClaw 中发现漏洞？请负责任地报告：

1. 邮箱：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 修复前不要公开发布
3. 我们会致谢你（除非你希望匿名）
