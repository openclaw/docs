---
read_when:
    - 通过局域网、tailnet、Tailscale Serve、Funnel 或反向代理暴露 Gateway 网关
    - 在允许真实消息用户使用前审查部署情况
    - 回滚有风险的远程访问或私信配置
sidebarTitle: Exposure runbook
summary: 将 OpenClaw Gateway 网关暴露到 local loopback 之外前的预检与回滚检查清单
title: Gateway 暴露运行手册
x-i18n:
    generated_at: "2026-07-11T20:35:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
仅在你能够说明谁可以访问 Gateway 网关、他们如何通过身份验证、他们可以触发哪些智能体，以及这些智能体可以使用哪些工具之后，才开放 Gateway 网关。如有疑问，请恢复为仅限 local loopback 访问，并重新运行审计。
</Warning>

本运行手册将更广泛的[安全](/zh-CN/gateway/security)指南转化为远程访问和消息传递开放的操作员检查清单。

## 选择开放模式

优先选择能够满足工作流要求的最严格模式。

| 模式                       | 建议使用场景                                    | 必需的控制措施                                                                                                                     |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| local loopback + SSH 隧道  | 个人使用、管理员访问、调试                      | 保持 `gateway.bind: "loopback"`，并为 `127.0.0.1:18789` 建立隧道                                                                   |
| local loopback + Tailscale Serve | 通过个人 tailnet 访问 Control UI/WebSocket | 保持 Gateway 网关仅限 local loopback；Tailscale 身份标头仅对 Control UI WebSocket 接口进行身份验证，不适用于其他身份验证路径 |
| Tailnet/LAN 绑定           | 具有已知设备的专用私有网络                      | Gateway 网关身份验证、防火墙允许列表、禁止公开端口转发                                                                              |
| 受信任的反向代理           | 在 Gateway 网关前使用组织 SSO/OIDC              | `trusted-proxy` 身份验证、严格的 `trustedProxies`、标头覆盖/剥离规则、明确的允许用户                                                 |
| 公共互联网                 | 少见的高风险部署                                | 身份感知代理、TLS、速率限制、严格的允许列表、对非主会话进行沙箱隔离                                                                 |

避免将公共端口直接转发到 Gateway 网关。如果必须允许公共访问，请在其前方部署身份感知代理，并让该代理成为访问 Gateway 网关的唯一网络路径。

## 准备阶段清单

在更改绑定、代理、Tailscale 或渠道策略之前，请记录以下信息：

- Gateway 网关主机、操作系统用户和状态目录（默认为 `~/.openclaw`）。
- Gateway 网关 URL 和绑定模式（`gateway.bind`；默认端口为 `18789`）。
- 身份验证模式、令牌/密码来源或受信任代理的身份来源。
- 所有已启用的渠道，以及它们是否接受私信、群组消息或 Webhooks。
- 非本地发送者可访问的智能体。
- 每个可访问智能体的工具配置、沙箱模式和提升权限工具策略。
- 这些智能体可以使用的外部凭据。
- `~/.openclaw/openclaw.json` 和凭据的备份位置。

如果不止一个人可以向 Bot 发送消息，应将其视为共享的委托工具权限，而不是按用户隔离主机。

## 基线检查

开放访问前运行：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

首先解决严重问题。仅当警告是有意接受且已记录在部署文档中时，才可忽略。请参阅[安全审计检查](/zh-CN/gateway/security/audit-checks)，了解每个 `checkId` 的含义及其修复键。

对于远程 CLI 验证，请显式传递凭据：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假定本地配置凭据会应用于显式指定的远程 URL。

## 最低安全基线

将以下结构作为开放部署的起点：

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

每次只放宽一项控制措施：先为特定渠道添加允许列表，再启用具有写入能力的工具；或者先启用反向代理，再接受远程 Control UI 流量。

`tools.exec.security: "deny"` 会阻止所有 Exec 调用，包括无害的诊断操作。如果需要诊断或低风险命令，请先确定符合你的威胁模型的特定发送者、智能体、命令和审批模式，然后再放宽此设置。

## 私信和群组开放

消息渠道是不受信任的输入接口。在允许私信或群组消息之前：

- 优先使用 `dmPolicy: "pairing"` 或严格的 `allowFrom` 列表，而不是 `dmPolicy: "open"`。
- 不要将 `"*"` 允许列表与宽泛的工具访问权限结合使用。
- 除非房间受到严格管控，否则要求群组消息必须提及 Bot。
- 当多人可以向 Bot 发送私信时，设置 `session.dmScope: "per-channel-peer"`（多账号渠道使用 `"per-account-channel-peer"`），以避免私信会话共享上下文。
- 将共享渠道路由到只拥有最少工具且不含个人凭据的智能体。

配对允许发送者触发 Bot，但不会使该发送者成为独立的主机安全边界。

## 反向代理检查

对于身份感知代理：

- 代理必须先对用户进行身份验证，再将请求转发到 Gateway 网关。
- 防火墙或网络策略必须阻止对 Gateway 网关端口的直接访问。
- `gateway.trustedProxies` 必须仅列出代理源 IP。
- 代理必须剥离或覆盖客户端提供的身份标头和转发标头。
- 当代理面向多个受众时，设置 `gateway.auth.trustedProxy.allowUsers`。
- 仅当代理与 Gateway 网关位于同一主机、本地进程受信任且代理负责管理身份标头时，才使用 `gateway.auth.trustedProxy.allowLoopback`。

更改代理后，运行 `openclaw security audit --deep`。受信任代理相关的发现具有很高的参考价值，因为代理会成为身份验证边界。

## 工具和沙箱审查

向远程发送者开放智能体之前：

- 确认哪些会话在主机上运行，哪些在沙箱中运行。
- 拒绝主机 Exec，或要求对其进行审批。
- 除非特定的受信任发送者确实需要提升权限工具，否则保持其禁用状态。
- 对开放或半开放的消息接口，避免使用浏览器、画布、节点、定时任务、Gateway 网关和会话派生工具。
- 严格限制绑定挂载范围；避免挂载凭据、主目录、Docker 套接字和系统路径。
- 对于实质上不同的信任边界，使用独立的 Gateway 网关、操作系统用户或主机。

如果远程用户并非完全可信，则必须通过独立部署实现隔离，而不能仅依赖提示词或会话标签。

## 更改后验证

每次更改开放设置后：

1. 重新运行 `openclaw security audit --deep`。
2. 确认已授权的连接能够成功建立。
3. 确认未授权的发送者或浏览器会话被拒绝。
4. 确认日志会隐去密钥。
5. 确认私信/群组路由仅到达预期的智能体。
6. 确认高影响工具会请求审批或被拒绝。
7. 记录已接受的剩余警告。

在理解当前开放设置的影响之前，不要继续进行下一项更改。

## 回滚计划

如果 Gateway 网关可能开放过度：

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

然后：

1. 停止公共转发、Tailscale Funnel 或反向代理路由。
2. 轮换 Gateway 网关令牌/密码和受影响的集成凭据。
3. 从允许列表中移除 `"*"` 和非预期发送者。
4. 审查最近的审计日志、运行历史、工具调用和配置更改。
5. 重新运行 `openclaw security audit --deep`。
6. 使用满足工作流要求的最严格模式重新启用访问。

## 审查清单

- 除非有已记录的理由，否则 Gateway 网关保持仅限 local loopback。
- 非 local loopback 访问具有身份验证和防火墙保护，且不存在直接的公共访问路径。
- 受信任代理部署使用严格的代理 IP 和标头控制。
- 私信默认使用配对或允许列表，而不是开放访问。
- 群组要求提及 Bot 或使用显式允许列表。
- 共享渠道无法访问个人凭据。
- 非主会话以沙箱模式运行。
- 主机 Exec 和提升权限工具被拒绝或受审批控制。
- 日志会隐去密钥。
- 严重审计问题均已解决。
- 回滚步骤已经过测试并记录在文档中。
