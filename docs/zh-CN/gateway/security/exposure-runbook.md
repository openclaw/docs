---
read_when:
    - 通过 LAN、tailnet、Tailscale Serve、Funnel 或反向代理暴露 Gateway 网关
    - 允许真实消息用户使用前审查部署
    - 回滚有风险的远程访问或私信配置
sidebarTitle: Exposure runbook
summary: 在将 OpenClaw Gateway 网关暴露到回环地址之外之前的预检和回滚清单
title: Gateway 暴露运行手册
x-i18n:
    generated_at: "2026-07-05T11:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
只有在你能说明谁可以访问 Gateway 网关、他们如何通过身份验证、他们可以触发哪些智能体，以及这些智能体可以使用哪些工具之后，才暴露 Gateway 网关。如果有疑问，请退回到仅 loopback 访问并重新运行审计。
</Warning>

本运行手册将更广泛的 [安全](/zh-CN/gateway/security)指南转化为远程访问和消息暴露的操作员检查清单。

## 选择暴露模式

优先选择满足工作流的最窄模式。

| 模式                       | 建议使用场景                                    | 必需控制项                                                                                                                      |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + SSH 隧道        | 个人使用、管理员访问、调试                      | 保持 `gateway.bind: "loopback"` 并隧道转发 `127.0.0.1:18789`                                                                    |
| Loopback + Tailscale Serve | 通过个人 tailnet 访问 Control UI/WebSocket      | 保持 Gateway 网关仅限 loopback；Tailscale 身份标头只验证 Control UI WebSocket 表面，不验证其他认证路径                         |
| Tailnet/LAN 绑定           | 具有已知设备的专用私有网络                      | Gateway 网关认证、防火墙允许列表、无公网端口转发                                                                                |
| 受信任反向代理             | Gateway 网关前置组织 SSO/OIDC                   | `trusted-proxy` 认证、严格的 `trustedProxies`、标头覆盖/剥离规则、显式允许用户                                                  |
| 公网                       | 少见的高风险部署                                | 身份感知代理、TLS、速率限制、严格允许列表、沙箱隔离的非 main 会话                                                               |

避免将公网端口直接转发到 Gateway 网关。如果需要公网访问，请在其前面放置身份感知代理，并让该代理成为访问 Gateway 网关的唯一网络路径。

## 预检清单

在更改绑定、代理、Tailscale 或渠道策略前记录以下内容：

- Gateway 网关主机、OS 用户和状态目录（默认 `~/.openclaw`）。
- Gateway 网关 URL 和绑定模式（`gateway.bind`；默认端口 `18789`）。
- 认证模式、令牌/密码来源，或受信任代理身份来源。
- 每个已启用的渠道，以及它是否接受私信、群组或 webhook。
- 非本地发送者可访问的智能体。
- 每个可访问智能体的工具配置、沙箱模式和提升权限工具策略。
- 这些智能体可用的外部凭证。
- `~/.openclaw/openclaw.json` 和凭证的备份位置。

如果不止一个人可以给 bot 发消息，请将其视为共享的委托工具权限，而不是按用户隔离的主机。

## 基线检查

在开放访问前运行：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

先解决关键发现。只有在有意为之且已为部署记录说明时，才接受警告。请参阅[安全审计检查](/zh-CN/gateway/security/audit-checks)，了解每个 `checkId` 的含义及其修复键。

对于远程 CLI 验证，请显式传入凭证：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假设本地配置凭证会应用于显式远程 URL。

## 最小安全基线

将此形态用作暴露式部署的起点：

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

每次只放宽一个控制项：先添加具体的渠道允许列表，再启用具备写入能力的工具；或先启用反向代理，再接受远程 Control UI 流量。

`tools.exec.security: "deny"` 会阻止所有 exec 调用，包括无害诊断。如果需要诊断或低风险命令，只能在选择与你的威胁模型匹配的特定发送者、智能体、命令和审批模式后再放宽此项。

## 私信和群组暴露

消息渠道是不受信任的输入表面。在允许私信或群组前：

- 优先使用 `dmPolicy: "pairing"` 或严格的 `allowFrom` 列表，而不是 `dmPolicy: "open"`。
- 不要将 `"*"` 允许列表与宽泛的工具访问组合使用。
- 除非房间受到严格控制，否则要求在群组中提及。
- 当多个人可以私信 bot 时，设置 `session.dmScope: "per-channel-peer"`（多账号渠道使用 `"per-account-channel-peer"`），以免私信会话共享上下文。
- 将共享渠道路由到工具最少且没有个人凭证的智能体。

配对批准发送者触发 bot。它不会让该发送者成为单独的主机安全边界。

## 反向代理检查

对于身份感知代理：

- 代理必须在转发到 Gateway 网关前验证用户身份。
- 防火墙或网络策略必须阻止直接访问 Gateway 网关端口。
- `gateway.trustedProxies` 必须只列出代理源 IP。
- 代理必须剥离或覆盖客户端提供的身份和转发标头。
- 当代理服务于多个受众时，设置 `gateway.auth.trustedProxy.allowUsers`。
- 仅在同主机代理、且本地进程受信任并由代理拥有身份标头时，才使用 `gateway.auth.trustedProxy.allowLoopback`。

在代理变更后运行 `openclaw security audit --deep`。受信任代理相关发现信号强，因为代理会成为认证边界。

## 工具和沙箱审查

在向远程发送者暴露智能体前：

- 确认哪些会话在主机上运行，哪些在沙箱中运行。
- 拒绝主机 exec，或要求审批。
- 保持提升权限工具禁用，除非特定的受信任发送者需要它们。
- 对开放或半开放的消息表面，避免使用浏览器、画布、node、cron、gateway 和会话生成工具。
- 保持绑定挂载范围狭窄；避免凭证、home、Docker socket 和系统路径。
- 对实质上不同的信任边界，使用单独的 Gateway 网关、OS 用户或主机。

如果远程用户并非完全可信，隔离必须来自单独部署，而不能只依赖提示词或会话标签。

## 变更后验证

每次暴露变更后：

1. 重新运行 `openclaw security audit --deep`。
2. 确认授权连接可以成功。
3. 确认未授权发送者或浏览器会话被拒绝。
4. 确认日志会遮盖密钥。
5. 确认私信/群组路由只到达预期智能体。
6. 确认高影响工具会请求审批或被拒绝。
7. 记录已接受的剩余警告。

在当前变更被理解之前，不要继续下一项暴露变更。

## 回滚计划

如果 Gateway 网关可能暴露过度：

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

1. 停止公网转发、Tailscale Funnel 或反向代理路由。
2. 轮换 Gateway 网关令牌/密码和受影响的集成凭证。
3. 从允许列表中移除 `"*"` 和意外发送者。
4. 审查最近的审计日志、运行历史、工具调用和配置更改。
5. 重新运行 `openclaw security audit --deep`。
6. 使用满足工作流的最窄模式重新启用访问。

## 审查清单

- Gateway 网关保持仅限 loopback，除非有记录在案的理由。
- 非 loopback 访问具有认证、防火墙控制，并且没有公网直连路由。
- 受信任代理部署具有严格的代理 IP 和标头控制。
- 私信使用配对或允许列表，而不是默认开放访问。
- 群组要求提及或显式允许列表。
- 共享渠道无法访问个人凭证。
- 非 main 会话在沙箱模式下运行。
- 主机 exec 和提升权限工具被拒绝或需要审批。
- 日志遮盖密钥。
- 关键审计发现已解决。
- 回滚步骤已测试并记录。
